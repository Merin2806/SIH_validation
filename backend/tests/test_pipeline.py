import io
import os
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Application, UploadedDocument, Finding, AuditEvent, ValidationRule
from app.audit_service import verify_audit_trail_integrity, log_audit_event
from app.document_parser import validate_file_security, extract_pdf_data, extract_image_data
from app.rules_engine import (
    evaluate_document_rules,
    normalize_text,
    parse_date_flexibly
)
from app.verification_adapters import (
    AICTECentralDbAdapter,
    StateFireServicesAdapter,
    LandRecordsModernizationAdapter,
    AccreditationAdapter,
    DocumentForensicsAdapter
)

client = TestClient(app)

def test_pipeline_health_check():
    """Verify backend health endpoint returns service name and healthy status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Satyapan" in data["service"]

def test_application_listing_search_and_filters():
    """Verify application listing supports search by query string and status filtering."""
    # Test pagination
    res = client.get("/api/applications?page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 128

    # Test search query
    res_search = client.get("/api/applications?q=Meridian")
    assert res_search.status_code == 200
    items = res_search.json()["items"]
    assert any("Meridian" in a["institution_name"] for a in items)

    # Test status filter
    res_status = client.get("/api/applications?filter_status=anomalies")
    assert res_status.status_code == 200
    for a in res_status.json()["items"]:
        assert a["overall_status"] == "Anomaly flagged"

def test_application_creation_and_validation():
    """Verify creating a new application with proper validation."""
    unique_id = f"EoA-TEST-{uuid.uuid4().hex[:6]}"
    payload = {
        "id": unique_id,
        "institution_name": "Test Engineering College of Technology",
        "institution_code": "1-TEST9999",
        "category": "Extension of Approval (EoA)"
    }
    res = client.post("/api/applications", json=payload)
    assert res.status_code in [200, 201]
    created = res.json()
    assert created["id"] == unique_id
    assert created["institution_name"] == "Test Engineering College of Technology"

    # Verify retrieval
    get_res = client.get(f"/api/applications/{unique_id}")
    assert get_res.status_code == 200
    assert get_res.json()["institution_code"] == "1-TEST9999"

def test_file_upload_security_validation():
    """Verify file upload rejection for size limits, fake extensions, and bad magic bytes."""
    # 1. Invalid file extension (.exe)
    valid, msg = validate_file_security(b"MZ fake binary", "malware.exe")
    assert valid is False
    assert "Unsupported file extension" in msg

    # 2. File size exceeded (>25MB)
    large_bytes = b"0" * (26 * 1024 * 1024)
    valid_size, msg_size = validate_file_security(large_bytes, "large.pdf")
    assert valid_size is False
    assert "exceeds maximum allowed size" in msg_size

    # 3. PDF extension but corrupted magic bytes (fails %PDF- check)
    valid_magic, msg_magic = validate_file_security(b"NOT_A_REAL_PDF_HEADER", "fake.pdf")
    assert valid_magic is False
    assert "Malformed PDF" in msg_magic

    # 4. Valid PDF magic bytes pass
    valid_pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    valid_ok, msg_ok = validate_file_security(valid_pdf_content, "clean.pdf")
    assert valid_ok is True
    assert msg_ok == "Valid"

def test_sha256_duplicate_detection_and_hashing():
    """Verify SHA-256 calculation and duplicate content detection via document upload."""
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 700, "Unique Sample Document Content for Duplicate Hash Testing 42")
    c.save()
    sample_pdf = buf.getvalue()

    app_id = "EoA-2026-00418"  # Using existing seeded application
    
    # Upload first time
    files = {"file": ("test_doc_alpha.pdf", sample_pdf, "application/pdf")}
    data = {"document_type_hint": "Land Title Document"}
    res1 = client.post(f"/api/applications/{app_id}/documents", data=data, files=files)
    assert res1.status_code == 200
    doc1 = res1.json()
    assert doc1["sha256_hash"] is not None
    assert doc1["is_duplicate"] is False

    # Upload identical content with a DIFFERENT filename
    files2 = {"file": ("completely_different_filename.pdf", sample_pdf, "application/pdf")}
    res2 = client.post(f"/api/applications/{app_id}/documents", data=data, files=files2)
    assert res2.status_code == 200
    doc2 = res2.json()
    assert doc2["sha256_hash"] == doc1["sha256_hash"]
    # System should recognize duplicate content
    assert doc2["is_duplicate"] is True

def test_pdf_extraction_and_metadata():
    """Verify PDF text and metadata extraction using reportlab or PyMuPDF."""
    from reportlab.pdfgen import canvas
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.setTitle("AICTE Fire Safety NOC Certificate")
    c.setCreator("Official State Fire Authority")
    c.drawString(100, 700, "Institution: Test Engineering College of Technology")
    c.drawString(100, 680, "Institution Code: 1-TEST9999")
    c.drawString(100, 660, "Certificate No: FS/NOC/2026/99881")
    c.drawString(100, 640, "Issue Date: 15/01/2026")
    c.drawString(100, 620, "Valid Until: 31/12/2027")
    c.drawString(100, 600, "This is an official statutory clearance certificate issued pursuant to state fire safety norms.")
    c.drawString(100, 580, "All instructional buildings, science and computer laboratories, and administrative areas have been inspected.")
    c.drawString(100, 560, "Adequate fire hydrants, portable extinguishers, and emergency exits are in place and operational.")
    c.save()
    pdf_bytes = buffer.getvalue()

    result = extract_pdf_data(pdf_bytes)
    assert result["page_count"] >= 1
    assert "FS/NOC/2026/99881" in result["full_text"]
    assert result["metadata"]["creator"] == "Official State Fire Authority"
    assert result["is_scanned"] is False

def test_scanned_pdf_ocr_status_detection():
    """Verify that a PDF without extractable text triggers scanned detection and handles OCR status."""
    from reportlab.pdfgen import canvas
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 700, "Scanned certificate preview") # Only 3 words (<30 words)
    c.save()
    scanned_pdf = buffer.getvalue()

    result = extract_pdf_data(scanned_pdf)
    # Low word count (<30) flags is_scanned as True
    assert result["is_scanned"] is True
    assert result["ocr_status"] in ["not_configured", "success", "failed"]

def test_date_validation_and_normalization():
    """Verify flexible date parsing and text normalization."""
    # Test various Indian date formats
    d1 = parse_date_flexibly("15/06/2025")
    assert d1 is not None and d1.year == 2025 and d1.month == 6 and d1.day == 15

    d2 = parse_date_flexibly("2026-03-31")
    assert d2 is not None and d2.year == 2026 and d2.month == 3 and d2.day == 31

    d3 = parse_date_flexibly("31 March 2026")
    assert d3 is not None and d3.year == 2026 and d3.month == 3

    # Test normalization
    norm = normalize_text("  Meridian Institute   of   Technology.  ")
    assert norm == "meridianinstituteoftechnology"

def test_deterministic_rules_evaluation():
    """Verify deterministic rules flag expired certificates, institution mismatches, and date issues."""
    db = SessionLocal()
    # Ensure rules are enabled for evaluation
    rule1 = db.query(ValidationRule).filter(ValidationRule.id == "RULE_FIRE_NOC_VALIDITY").first()
    if rule1:
        rule1.is_active = True
    rule2 = db.query(ValidationRule).filter(ValidationRule.id == "RULE_NAME_CONSISTENCY").first()
    if rule2:
        rule2.is_active = True
    db.commit()

    app = db.query(Application).filter(Application.id == "EoA-2026-00418").first()

    # 1. Test expired certificate rule
    doc_fire_id = f"DOC-TEST-{uuid.uuid4().hex[:6]}"
    doc1 = UploadedDocument(
        id=doc_fire_id,
        application_id=app.id,
        filename="fire_noc_expired.pdf",
        file_path="/uploads/test_fire.pdf",
        file_size=1024,
        file_size_formatted="1 KB",
        mime_type="application/pdf",
        detected_type="NOC (Fire)",
        sha256_hash="fakehash123",
        metadata_json={"creator": "Adobe Acrobat"}
    )
    db.add(doc1)
    db.commit()

    extracted_fields = {
        "institution_name": app.institution_name,
        "institution_code": app.institution_code,
        "valid_until": "2020-01-01",  # Expired
        "issue_date": "2018-01-01",
        "certificate_number": "FS/NOC/2018/11"
    }

    findings = evaluate_document_rules(
        db=db,
        application=app,
        document=doc1,
        extracted_data=extracted_fields,
        metadata_info={"creator": "Adobe Acrobat"}
    )
    finding_codes = [f.rule_id for f in findings]
    assert "RULE_FIRE_NOC_VALIDITY" in finding_codes
    
    # Check finding details structure
    fire_finding = next(f for f in findings if f.rule_id == "RULE_FIRE_NOC_VALIDITY")
    assert fire_finding.severity == "High"
    assert "expired" in fire_finding.why_flagged.lower()
    assert "2020-01-01" in fire_finding.actual_value

    # 2. Test institution name mismatch rule
    doc_name_id = f"DOC-TEST-{uuid.uuid4().hex[:6]}"
    doc2 = UploadedDocument(
        id=doc_name_id,
        application_id=app.id,
        filename="land_title_mismatch.pdf",
        file_path="/uploads/test_land.pdf",
        file_size=1024,
        file_size_formatted="1 KB",
        mime_type="application/pdf",
        detected_type="Land Title Document",
        sha256_hash="fakehash456",
        metadata_json={}
    )
    db.add(doc2)
    db.commit()

    extracted_mismatch = {
        "institution_name": "Completely Different Institute of Technology",
        "institution_code": app.institution_code,
        "valid_until": "2028-01-01"
    }
    findings_mismatch = evaluate_document_rules(
        db=db,
        application=app,
        document=doc2,
        extracted_data=extracted_mismatch,
        metadata_info={}
    )
    mismatch_codes = [f.rule_id for f in findings_mismatch]
    assert "RULE_NAME_CONSISTENCY" in mismatch_codes
    db.close()

def test_issuing_authority_adapters():
    """Verify all verification adapters produce required structure, status, and simulation indicator."""
    # 1. AICTE Central DB Adapter
    aicte_adapter = AICTECentralDbAdapter()
    res1 = aicte_adapter.verify("1-4328901", {"institution_name": "Meridian Institute of Technology"})
    assert "AICTE" in res1.source_name
    assert res1.is_simulated is True
    assert res1.status_code in ["verified", "mismatch_detected"]

    # 2. State Fire Services Adapter
    fire_adapter = StateFireServicesAdapter()
    res2 = fire_adapter.verify("FS/NOC/2021/04418")
    assert "Fire" in res2.source_name
    assert res2.status_code in ["source_unavailable", "verified"]
    assert res2.is_simulated is True

    # 3. Land Records Modernization Adapter
    land_adapter = LandRecordsModernizationAdapter()
    res3 = land_adapter.verify("DLR/REV/2022/88219")
    assert "Land" in res3.source_name
    assert res3.is_simulated is True

    # 4. Accreditation Adapter (NBA / NAAC)
    nba_adapter = AccreditationAdapter()
    res4 = nba_adapter.verify("NBA/TIER-1/2023/102")
    assert "Accreditation" in res4.source_name

    # 5. Document Forensics Adapter
    forensics = DocumentForensicsAdapter()
    res5 = forensics.verify("METADATA_CHECK", {"creator": "Adobe Photoshop 24.0", "has_canvas_tags": True})
    assert res5.status_code == "mismatch_detected"
    assert "Photoshop" in res5.response_details

def test_finding_confirmation_and_dismissal_mandatory_note():
    """Verify finding confirmation and that dismissal strictly requires a non-empty explanation."""
    # Fetch a seeded finding
    db = SessionLocal()
    finding = db.query(Finding).first()
    finding_id = finding.id
    db.close()

    # Confirmation
    c_res = client.post(f"/api/findings/{finding_id}/confirm", json={"note": "Confirmed by Test Officer"})
    assert c_res.status_code == 200
    assert c_res.json()["status"] == "confirmed"

    # Dismissal without note MUST fail (400)
    d_bad = client.post(f"/api/findings/{finding_id}/dismiss", json={"note": ""})
    assert d_bad.status_code == 400
    assert "mandatory" in d_bad.json()["detail"].lower() or "required" in d_bad.json()["detail"].lower()

    # Dismissal with valid note succeeds
    d_good = client.post(f"/api/findings/{finding_id}/dismiss", json={"note": "Exemption certificate verified manually."})
    assert d_good.status_code == 200
    assert d_good.json()["status"] == "dismissed"

def test_tamper_evident_audit_trail_and_hash_chain():
    """Verify cryptographic SHA-256 hash chaining of audit events."""
    db = SessionLocal()
    app_id = f"EoA-TEST-{uuid.uuid4().hex[:6]}"
    
    # Log 3 sequential events
    e1 = log_audit_event(db, application_id=app_id, action="TEST_ACTION_1", outcome="Success", actor="Test Actor", details="step 1")
    e2 = log_audit_event(db, application_id=app_id, action="TEST_ACTION_2", outcome="Success", actor="Test Actor", details="step 2")
    e3 = log_audit_event(db, application_id=app_id, action="TEST_ACTION_3", outcome="Success", actor="Test Actor", details="step 3")
    
    # Hash of e2 must link to e1
    assert e2.prev_hash == e1.hash
    # Hash of e3 must link to e2
    assert e3.prev_hash == e2.hash

    # Verify audit trail integrity method returns valid
    verification = verify_audit_trail_integrity(db, app_id)
    assert verification["valid"] is True
    assert verification["events_checked"] >= 3
    db.close()

    # Test API endpoint
    api_verify = client.get(f"/api/audit/verify?application_id={app_id}")
    assert api_verify.status_code == 200
    assert api_verify.json()["valid"] is True

def test_applications_csv_export():
    """Verify application data can be streamed and exported as CSV."""
    res = client.get("/api/applications/export")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    content = res.text
    # Check CSV header
    assert "Application ID,Institution Name" in content
    # Check seeded record is in CSV
    assert "EoA-2026-00418" in content

def test_database_persistence_across_sessions():
    """Verify database records persist across new database connections."""
    db = SessionLocal()
    app_record = db.query(Application).filter(Application.id == "EoA-2026-00418").first()
    assert app_record is not None
    assert app_record.institution_name == "Meridian Institute of Technology"
    db.close()
