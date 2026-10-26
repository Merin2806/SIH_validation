import os
import uuid
import re
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import UPLOADS_DIR
from ..models import (
    Application, UploadedDocument, ExtractedField, Finding,
    ValidationCheck, VerificationAttempt, InstitutionRecord
)
from ..document_parser import (
    calculate_sha256, validate_file_security, extract_pdf_data,
    extract_image_data, classify_document_type
)
from ..ai_service import ai_service
from ..rules_engine import evaluate_document_rules
from ..verification_adapters import verification_adapters
from ..audit_service import log_audit_event

router = APIRouter(prefix="/api", tags=["Documents"])

@router.post("/applications/{app_id}/documents")
async def upload_document(
    app_id: str,
    file: UploadFile = File(...),
    document_type_hint: str = Form(None),
    db: Session = Depends(get_db)
):
    correlation_id = f"run-{uuid.uuid4().hex[:8]}"

    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Application '{app_id}' not found.")

    # 1. Read file contents and validate file security
    raw_filename = file.filename or "uploaded_document"
    # Sanitize filename to prevent path traversal
    safe_filename = Path(raw_filename).name.replace("..", "").strip()
    if not safe_filename:
        safe_filename = "document.pdf"

    contents = await file.read()
    is_valid, validation_msg = validate_file_security(contents, safe_filename)
    if not is_valid:
        raise HTTPException(status_code=400, detail=validation_msg)

    # 2. Save securely to uploads directory with server-generated unique prefix
    ext = Path(safe_filename).suffix.lower()
    unique_disk_name = f"{uuid.uuid4().hex[:12]}_{safe_filename}"
    file_disk_path = UPLOADS_DIR / unique_disk_name

    with open(file_disk_path, "wb") as f:
        f.write(contents)

    file_size = len(contents)
    file_size_formatted = f"{file_size / (1024 * 1024):.1f} MB" if file_size >= 1048576 else f"{file_size / 1024:.0f} KB"

    # 3. Cryptographic SHA-256 Hashing & Duplicate Detection
    sha256 = calculate_sha256(str(file_disk_path))

    existing_doc_match = db.query(UploadedDocument).filter(
        UploadedDocument.sha256_hash == sha256
    ).first()

    is_duplicate = bool(existing_doc_match)
    duplicate_of_id = existing_doc_match.id if existing_doc_match else None

    log_audit_event(
        db,
        application_id=app_id,
        action="Document uploaded & SHA-256 computed",
        outcome="Completed",
        actor="Upload Security Gateway",
        evidence_ref=safe_filename,
        details=f"File {safe_filename} ({file_size_formatted}) uploaded. SHA-256: {sha256[:16]}... Duplicate detected: {is_duplicate}",
        correlation_id=correlation_id
    )

    # 4. Text & Metadata Extraction (PDF vs Image)
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    extracted_text = ""
    metadata_info = {}
    page_count = 1
    detected_lang = "English"
    ocr_used = False
    ocr_status = "not_required"

    if ext == ".pdf":
        pdf_res = extract_pdf_data(str(file_disk_path))
        extracted_text = pdf_res.get("text", "")
        metadata_info = pdf_res.get("metadata", {})
        metadata_info["creator_tag"] = pdf_res.get("creator_tag")
        metadata_info["producer_tag"] = pdf_res.get("producer_tag")
        metadata_info["has_suspicious_metadata"] = pdf_res.get("has_suspicious_metadata", False)
        page_count = pdf_res.get("page_count", 1)
        langs = pdf_res.get("language_hints", ["English"])
        detected_lang = " + ".join(langs)
        ocr_used = pdf_res.get("ocr_used", False)
        ocr_status = pdf_res.get("ocr_status", "not_required")
    else:
        # Image file (JPG/PNG)
        img_res = extract_image_data(str(file_disk_path))
        extracted_text = img_res.get("text", "")
        metadata_info = img_res.get("metadata", {})
        ocr_used = img_res.get("ocr_used", False)
        ocr_status = img_res.get("ocr_status", "not_configured")
        langs = img_res.get("language_hints", ["English"])
        detected_lang = " + ".join(langs) if img_res.get("text") else "Image"

    # 5. Document Type Classification
    detected_type = document_type_hint or classify_document_type(extracted_text, safe_filename)

    # 6. Create UploadedDocument entity
    doc_record = UploadedDocument(
        id=doc_id,
        application_id=app_id,
        filename=safe_filename,
        file_path=f"/uploads/{unique_disk_name}",
        file_size=file_size,
        file_size_formatted=file_size_formatted,
        mime_type=file.content_type or ("application/pdf" if ext == ".pdf" else "image/jpeg"),
        sha256_hash=sha256,
        detected_type=detected_type,
        detected_language=detected_lang,
        processing_status="Extracted" if extracted_text else ("OCR Pending" if ocr_status == "not_configured" else "Extracted"),
        is_duplicate=is_duplicate,
        duplicate_of_id=duplicate_of_id,
        ocr_used=ocr_used,
        ocr_status=ocr_status,
        page_count=page_count,
        metadata_json=metadata_info
    )
    db.add(doc_record)
    db.commit()

    # 7. AI / Deterministic Structured Field Extraction
    structured = await ai_service.extract_structured_fields(
        text=extracted_text,
        doc_type=detected_type,
        filename=safe_filename,
        file_path=str(file_disk_path)
    )

    # Persist extracted fields
    fields_to_add = []
    if structured.get("institution_name"):
        norm_match = structured["institution_name"].strip().lower() == app.institution_name.strip().lower()
        fields_to_add.append(ExtractedField(
            document_id=doc_id,
            field_name="Institution name",
            field_value=structured["institution_name"],
            normalized_value=structured.get("normalized_values", {}).get("institution_name"),
            validation_status="Verified" if norm_match else "Mismatch detected",
            validation_message="Compared with AICTE institutional record"
        ))

    if structured.get("certificate_number"):
        fields_to_add.append(ExtractedField(
            document_id=doc_id,
            field_name="Certificate number",
            field_value=structured["certificate_number"],
            validation_status="Verified",
            validation_message="Extracted reference number"
        ))

    if structured.get("issue_date"):
        fields_to_add.append(ExtractedField(
            document_id=doc_id,
            field_name="Date of issue",
            field_value=structured["issue_date"],
            validation_status="Verified",
            validation_message="Document issue date"
        ))

    if structured.get("valid_until"):
        is_exp = any(y in structured["valid_until"] for y in ["2023", "2024", "2025"])
        fields_to_add.append(ExtractedField(
            document_id=doc_id,
            field_name="Valid until",
            field_value=structured["valid_until"],
            validation_status="Expired" if is_exp else "Verified",
            validation_message="Application date is 26 Oct 2026" if is_exp else "Active validity"
        ))

    if structured.get("issuing_authority"):
        fields_to_add.append(ExtractedField(
            document_id=doc_id,
            field_name="Issuing authority",
            field_value=structured["issuing_authority"],
            validation_status="Verified",
            validation_message="Identified issuing department"
        ))

    for fld in fields_to_add:
        db.add(fld)
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        document_id=doc_id,
        action="Extraction completed",
        outcome="Completed",
        actor="Document Analysis Pipeline",
        evidence_ref=safe_filename,
        details=f"Extracted {len(fields_to_add)} structured fields. Classification: {detected_type}.",
        correlation_id=correlation_id
    )

    # 8. External Authority Verification Gateway Adapter Execution
    verification_attempts_results = []
    source_to_query = None
    identifier_to_query = structured.get("certificate_number") or doc_id

    if detected_type == "NOC (Fire)":
        source_to_query = "src-fire"
    elif detected_type == "Land document":
        source_to_query = "src-land"
    elif detected_type == "Accreditation":
        source_to_query = "src-accreditation"
    elif structured.get("institution_name"):
        source_to_query = "src-aicte"

    if source_to_query:
        query_context = {
            "institution_name": structured.get("institution_name"),
            "master_institution_name": app.institution_name,
            "has_suspicious_metadata": metadata_info.get("has_suspicious_metadata", False),
            "creator_tag": metadata_info.get("creator_tag"),
            "app_id": app_id
        }
        res = verification_adapters.query_source(source_to_query, identifier_to_query, query_context)
        verification_attempts_results.append(res)

        attempt = VerificationAttempt(
            application_id=app_id,
            document_id=doc_id,
            source_name=res.get("source_name", source_to_query),
            verification_method=res.get("verification_method", "Simulated Adapter"),
            reference_checked=identifier_to_query,
            status=res.get("status", "pending"),
            returned_identifier=res.get("reference_checked"),
            response_details=res.get("response_details"),
            error_info=res.get("error_info"),
            is_simulated=res.get("is_simulated", True),
            timestamp=datetime.datetime.utcnow()
        )
        db.add(attempt)
        db.commit()

        log_audit_event(
            db,
            application_id=app_id,
            document_id=doc_id,
            action=f"External authority query: {res.get('source_name')}",
            outcome=res.get("status", "completed"),
            actor="Issuing Authority Gateway",
            evidence_ref=identifier_to_query,
            details=res.get("response_details", "Verification check completed"),
            correlation_id=correlation_id
        )

    # 9. Evaluate Deterministic Rules Engine
    findings = evaluate_document_rules(
        db=db,
        application=app,
        document=doc_record,
        extracted_data=structured,
        metadata_info=metadata_info,
        verification_results=verification_attempts_results
    )

    for f in findings:
        db.add(f)
        log_audit_event(
            db,
            application_id=app_id,
            document_id=doc_id,
            action=f"Finding generated: {f.title}",
            outcome="Flagged",
            actor="Rules Engine",
            evidence_ref=safe_filename,
            details=f"Severity: {f.severity} | Category: {f.category} | Reason: {f.why_flagged}",
            correlation_id=correlation_id
        )

    # 10. Update Checklist Item Status & Counters
    matching_check = db.query(ValidationCheck).filter(
        ValidationCheck.application_id == app_id,
        ValidationCheck.checklist_item.ilike(f"%{detected_type[:4]}%")
    ).first()

    if matching_check:
        matching_check.source_type = "Uploaded"
        if any(f.status == "Expired" for f in findings):
            matching_check.status = "Expired"
            matching_check.details = "Certificate expired before current academic year"
        elif any(f.status == "Mismatch detected" for f in findings):
            matching_check.status = "Failed"
            matching_check.details = "Discrepancy detected with institutional records"
        elif any(f.status == "Source unavailable" for f in findings):
            matching_check.status = "Pending"
            matching_check.details = "Authority verification endpoint timeout"
        elif any(f.severity == "High" for f in findings):
            matching_check.status = "Checking"
            matching_check.details = "Manual scrutiny required"
        else:
            matching_check.status = "Passed"
            matching_check.details = "Verified successfully"

    # Recompute checks_passed count
    passed_count = db.query(ValidationCheck).filter(
        ValidationCheck.application_id == app_id,
        ValidationCheck.status == "Passed"
    ).count()
    app.checks_passed = passed_count

    # Recompute overall application status
    all_app_findings = db.query(Finding).filter(Finding.application_id == app_id).all()
    if any(f.status == "Expired" for f in all_app_findings):
        app.overall_status = "Expired document"
    elif any(f.category == "Document Forensics" for f in all_app_findings):
        app.overall_status = "Anomaly flagged"
    elif any(f.severity == "High" for f in all_app_findings):
        app.overall_status = "Manual review"
    elif any(f.status == "Source unavailable" for f in all_app_findings):
        app.overall_status = "Source pending"
    elif app.checks_passed == app.checks_total:
        app.overall_status = "Verified"
    else:
        app.overall_status = "Manual review"

    db.commit()

    return {
        "document_id": doc_id,
        "filename": safe_filename,
        "sha256_hash": sha256,
        "detected_type": detected_type,
        "detected_language": detected_lang,
        "processing_status": doc_record.processing_status,
        "is_duplicate": is_duplicate,
        "duplicate_of_id": duplicate_of_id,
        "ocr_used": ocr_used,
        "ocr_status": ocr_status,
        "extracted_fields": structured,
        "verification_results": verification_attempts_results,
        "findings_count": len(findings),
        "checks_passed": app.checks_passed,
        "overall_status": app.overall_status
    }

@router.get("/documents/{doc_id}/file")
def get_document_file(doc_id: str, db: Session = Depends(get_db)):
    """Serves the actual persisted document file securely."""
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Resolve disk path securely
    filename = Path(doc.file_path).name
    full_path = UPLOADS_DIR / filename
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="Document file missing on disk")

    return FileResponse(
        path=str(full_path),
        filename=doc.filename,
        media_type=doc.mime_type
    )

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    app_id = doc.application_id
    filename = doc.filename

    # Delete physical file if present
    try:
        disk_file = UPLOADS_DIR / Path(doc.file_path).name
        if disk_file.exists():
            disk_file.unlink()
    except Exception:
        pass

    db.delete(doc)
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        action="Document removed",
        outcome="Completed",
        evidence_ref=filename,
        details=f"Document {filename} removed from application dossier."
    )
    return {"message": "Document successfully deleted"}
