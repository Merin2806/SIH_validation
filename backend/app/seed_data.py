import os
import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont
import fitz # PyMuPDF

from .config import UPLOADS_DIR
from .models import (
    Application, InstitutionRecord, UploadedDocument,
    ExtractedField, ValidationRule, ValidationCheck,
    Finding, VerificationSource, VerificationAttempt, AuditEvent
)
from .document_parser import calculate_sha256

def generate_sample_fire_noc_pdf(target_path: Path):
    """
    Generates a realistic synthetic Fire NOC PDF matching Reference Image 3:
    - State Fire Services Department header
    - Certificate No: FS/NOC/2021/04418
    - Date of issue: 14 March 2021
    - Valid until: 13 March 2024
    - Institution: Meridian Inst. of Technology & Research
    - QR Code and Official Stamp
    - Injected metadata creator tag: 'Adobe Photoshop 25.1'
    """
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = str(target_path) + ".tmp.pdf"
    
    c = canvas.Canvas(temp_path, pagesize=letter)
    width, height = letter # 612 x 792

    # Draw border
    c.setStrokeColor(colors.HexColor("#333333"))
    c.setLineWidth(1)
    c.rect(36, 36, width - 72, height - 72)
    c.rect(40, 40, width - 80, height - 80)

    # Department Seal circle at top
    c.setStrokeColor(colors.HexColor("#22505a"))
    c.setLineWidth(1.5)
    c.circle(width / 2, height - 90, 24)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2, height - 93, "SFS")

    # Header
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#1b3b44"))
    c.drawCentredString(width / 2, height - 130, "STATE FIRE SERVICES DEPARTMENT")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(width / 2, height - 146, "Sample issuing authority · demo document")

    # Certificate Title
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.HexColor("#111111"))
    c.drawCentredString(width / 2, height - 180, "NO OBJECTION CERTIFICATE — FIRE SAFETY")

    # Body paragraph
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#222222"))
    
    body_text = (
        "This is to certify that the building(s) of Meridian Inst. of Technology & Research "
        "situated at Plot 14, Education Park Road, Demo City, have been inspected and found "
        "to meet the fire safety requirements applicable to educational buildings."
    )
    
    text_obj = c.beginText(60, height - 220)
    text_obj.setFont("Helvetica", 10.5)
    text_obj.setLeading(18)
    
    # Split text nicely
    line1 = "This is to certify that the building(s) of Meridian Inst. of Technology & Research"
    line2 = "situated at Plot 14, Education Park Road, Demo City, have been inspected and found"
    line3 = "to meet the fire safety requirements applicable to educational buildings."
    text_obj.textLine(line1)
    text_obj.textLine(line2)
    text_obj.textLine(line3)
    c.drawText(text_obj)

    # Table of details
    table_top = height - 300
    row_height = 28
    c.setStrokeColor(colors.HexColor("#444444"))
    c.setLineWidth(0.8)

    # Table outline
    c.rect(60, table_top - (row_height * 3), 492, row_height * 3)
    c.line(200, table_top, 200, table_top - (row_height * 3))
    c.line(60, table_top - row_height, 552, table_top - row_height)
    c.line(60, table_top - (row_height * 2), 552, table_top - (row_height * 2))

    # Row 1: Certificate No
    c.setFont("Helvetica-Bold", 10)
    c.drawString(70, table_top - 18, "Certificate No.")
    c.setFont("Helvetica", 10)
    c.drawString(215, table_top - 18, "FS/NOC/2021/04418")

    # Row 2: Date of issue
    c.setFont("Helvetica-Bold", 10)
    c.drawString(70, table_top - 18 - row_height, "Date of issue")
    c.setFont("Helvetica", 10)
    c.drawString(215, table_top - 18 - row_height, "14 March 2021")

    # Row 3: Valid until
    c.setFont("Helvetica-Bold", 10)
    c.drawString(70, table_top - 18 - (row_height * 2), "Valid until")
    c.setFont("Helvetica", 10)
    c.drawString(215, table_top - 18 - (row_height * 2), "13 March 2024")

    # Footer notice
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor("#444444"))
    notice_text = "This certificate is issued subject to the conditions overleaf and may be withdrawn if any change is made to the premises without prior intimation."
    c.drawString(60, table_top - 120, notice_text)

    # Simulated QR Code block (bottom left)
    qr_x, qr_y, qr_size = 70, height - 570, 90
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.rect(qr_x, qr_y, qr_size, qr_size)
    # Draw QR-like pattern blocks
    c.setFillColor(colors.black)
    c.rect(qr_x + 8, qr_y + qr_size - 28, 20, 20, fill=1)
    c.rect(qr_x + qr_size - 28, qr_y + qr_size - 28, 20, 20, fill=1)
    c.rect(qr_x + 8, qr_y + 8, 20, 20, fill=1)
    c.rect(qr_x + 38, qr_y + 38, 14, 14, fill=1)
    c.rect(qr_x + 60, qr_y + 15, 16, 12, fill=1)
    c.rect(qr_x + 36, qr_y + 12, 10, 16, fill=1)
    c.rect(qr_x + 12, qr_y + 38, 15, 10, fill=1)

    # Simulated Stamp / Seal (bottom right)
    seal_x, seal_y = 420, height - 525
    c.setStrokeColor(colors.HexColor("#2e7d32"))
    c.setFillColor(colors.HexColor("#e8f5e9"))
    c.setLineWidth(1.5)
    c.circle(seal_x, seal_y, 44, stroke=1, fill=1)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(colors.HexColor("#1b5e20"))
    c.drawCentredString(seal_x, seal_y + 14, "FIRE SERVICES")
    c.drawCentredString(seal_x, seal_y - 2, "OFFICIAL SEAL")
    c.setFont("Helvetica-Oblique", 7)
    c.drawCentredString(seal_x, seal_y - 20, "Fire Officer")

    c.save()

    # Now open with PyMuPDF to inject metadata tag 'Adobe Photoshop 25.1'
    doc = fitz.open(temp_path)
    meta = doc.metadata
    meta["creator"] = "Adobe Photoshop 25.1"
    meta["producer"] = "Adobe PDF Library 17.0"
    meta["author"] = "State Fire Services Dept"
    meta["title"] = "NO OBJECTION CERTIFICATE - FIRE SAFETY"
    meta["modDate"] = "D:20261021184200"
    doc.set_metadata(meta)
    doc.save(str(target_path))
    doc.close()
    
    if os.path.exists(temp_path):
        os.remove(temp_path)

def generate_sample_image(target_path: Path, title: str):
    """Generates a sample blueprint/floor plan image."""
    target_path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (800, 600), color=(245, 248, 250))
    d = ImageDraw.Draw(img)
    
    # Draw floor plan grid and rooms
    d.rectangle([40, 40, 760, 560], outline=(40, 80, 90), width=4)
    # Rooms
    d.rectangle([60, 60, 380, 280], outline=(70, 120, 130), width=2)
    d.rectangle([420, 60, 740, 280], outline=(70, 120, 130), width=2)
    d.rectangle([60, 320, 380, 540], outline=(70, 120, 130), width=2)
    d.rectangle([420, 320, 740, 540], outline=(70, 120, 130), width=2)
    
    d.text((120, 150), "COMPUTER SCIENCE LAB 1 (120 Sq.m)", fill=(30, 50, 60))
    d.text((480, 150), "AI & DATA SCIENCE LAB (120 Sq.m)", fill=(30, 50, 60))
    d.text((120, 410), "PHYSICS & ELECTRONICS LAB", fill=(30, 50, 60))
    d.text((480, 410), "SEMINAR HALL / AUDITORIUM", fill=(30, 50, 60))
    d.text((300, 290), "CENTRAL CORRIDOR (3.0m Wide)", fill=(100, 100, 100))
    d.text((50, 570), title, fill=(20, 40, 50))
    
    img.save(str(target_path))

def generate_standard_pdf(target_path: Path, title: str, subtitle: str, body_lines: list):
    """Generates generic synthetic PDFs for Affidavit, Land Deed, etc."""
    target_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(target_path), pagesize=letter)
    width, height = letter
    
    c.setStrokeColor(colors.HexColor("#22505a"))
    c.setLineWidth(1)
    c.rect(40, 40, width - 80, height - 80)
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#1b3b44"))
    c.drawCentredString(width / 2, height - 100, title)
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawCentredString(width / 2, height - 120, subtitle)
    
    c.setStrokeColor(colors.HexColor("#cccccc"))
    c.line(60, height - 140, width - 60, height - 140)
    
    y = height - 180
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#222222"))
    for line in body_lines:
        c.drawString(60, y, line)
        y -= 22
        
    c.save()

def seed_database(db: Session):
    """Seeds the SQLite database with realistic synthetic applications, master records, rules, and sources."""
    # Check if already seeded
    if db.query(Application).first():
        return

    # 1. Seed Validation Rules
    rules_data = [
        ("RULE_FIRE_NOC_VALIDITY", "Regulatory Compliance", "Fire Safety NOC Validity & Expiry", "Fire NOC certificate must have a valid non-expired date covering the full academic approval period.", "Mandatory uploaded certificate", "High"),
        ("RULE_NAME_CONSISTENCY", "Institutional Consistency", "Institution Name Consistency Check", "Institution name on all legal deeds, certificates, and affidavits must match AICTE master records.", "All uploaded documents vs AICTE DB", "Medium"),
        ("RULE_METADATA_INTEGRITY", "Document Forensics", "Metadata & Software Producer Inspection", "Inspects creator and producer headers for unauthorized photo/raster editing software.", "PDF metadata headers", "High"),
        ("RULE_ISSUING_AUTH_REACHABILITY", "Authority Verification", "Issuing Authority Online Verification", "Confirms authenticity via live or simulated issuing authority APIs/QR verification.", "Issuing authority registry query", "Low"),
        ("RULE_DUPLICATE_DETECTION", "Document Forensics", "Cryptographic Duplicate Content Check", "Compares SHA-256 hashes across application documents to identify duplicate uploads.", "Uploaded file SHA-256", "Medium"),
        ("RULE_LAND_DEED_OWNERSHIP", "Infrastructure Compliance", "Land Ownership & Khata Registration", "Institutional land deed must reflect undisputed ownership or long-term government lease.", "Land ownership deed / 7/12 extract", "High"),
        ("RULE_ACCREDITATION_VALIDITY", "Academic Compliance", "NBA / NAAC Accreditation Status", "Technical programs seeking intake increase must have active accreditation tier.", "Accreditation Certificate", "High"),
        ("RULE_TER_FEE_PAYMENT", "Financial Compliance", "Processing & TER Fee Payment Status", "AICTE central portal records must indicate full payment of processing fees.", "AICTE Central Ledger", "High"),
        ("RULE_FACULTY_CADRE_RATIO", "Faculty & Cadre", "Faculty Cadre & SFR Compliance", "Student-Faculty Ratio (1:15/1:20) and Professor/Associate/Assistant cadre balance.", "Faculty Bio-data records", "Medium"),
        ("RULE_FLOOR_PLAN_ADEQUACY", "Infrastructure Compliance", "Instructional & Administrative Carpet Area", "Classrooms, computer laboratories, and amenities must satisfy handbook norms.", "Approved Architectural Floor Plans", "Medium")
    ]

    for code, cat, name, desc, ev, sev in rules_data:
        rule = ValidationRule(
            id=code,
            code=code,
            category=cat,
            name=name,
            description=desc,
            required_evidence=ev,
            severity=sev,
            is_active=True,
            version="v2.4",
            updated_at=datetime.datetime(2026, 10, 15)
        )
        db.add(rule)

    # 2. Seed Verification Sources
    for src in [
        ("src-aicte", "AICTE Central Institutional Database", "Central Regulatory Repository", "All technical applications", "SIMULATED", "Mismatch detected", ["REST API v3", "OAS 3.0 Webhook"]),
        ("src-fire", "State Fire Services Portal (QR code)", "State Department Verification", "NOC (Fire Safety) certificates", "SIMULATED", "Source unavailable", ["Encrypted QR Payload Decryption", "e-Governance API"]),
        ("src-metadata", "Document Metadata & Forensics Analyzer", "Cryptographic & PDF Forensics", "All uploaded PDF and image evidence", "SIMULATED", "Manual review required", ["PyMuPDF Struct Tree", "SHA-256 Bloom Filter"]),
        ("src-land", "National Land Records Modernization System", "Revenue & Land Registry", "Land ownership deed, 7/12 extract", "SIMULATED", "Verification pending", ["e-Dharani API", "Mahabhulekh REST Interface"]),
        ("src-accreditation", "National Board of Accreditation / NAAC Portal", "Accreditation Registry", "Accreditation certificates for technical programmes", "SIMULATED", "Verified against source", ["NBA National Data Repository", "NAAC Institutional Search API"])
    ]:
        v_source = VerificationSource(
            id=src[0],
            name=src[1],
            source_type=src[2],
            supported_doc=src[3],
            integration_mode=src[4],
            status=src[5],
            methods=src[6],
            last_checked_at=datetime.datetime(2026, 10, 26, 15, 2, 11)
        )
        db.add(v_source)

    # 3. Seed AICTE Master Records
    master_inst = InstitutionRecord(
        id="AICTE-INST-00418",
        name="Meridian Institute of Technology",
        official_code="1-10492817",
        state="Maharashtra",
        district="Pune",
        address="Plot 14, Education Park Road, Demo City",
        approved_programmes=["Computer Engineering", "Mechanical Engineering", "AI & Data Science"],
        approved_intake=420,
        faculty_count=68,
        previous_eoa_status="Approved",
        ter_payment_status="Paid",
        compliance_status="Compliant",
        accreditation_valid_until="2027-06-30"
    )
    db.add(master_inst)

    # 4. Generate Synthetic Files for Reference Case A-F
    fire_noc_path = UPLOADS_DIR / "Fire_NOC_2021.pdf"
    generate_sample_fire_noc_pdf(fire_noc_path)
    fire_noc_hash = calculate_sha256(str(fire_noc_path))

    affidavit_path = UPLOADS_DIR / "Affidavit_notarised.pdf"
    generate_standard_pdf(
        affidavit_path,
        "AFFIDAVIT / UNDERTAKING",
        "Submitted under AICTE Approval Process Handbook (Demo)",
        [
            "I, Chairman / Secretary of Meridian Institute of Technology, do hereby solemnly affirm:",
            "1. That the institution complies with AICTE Land, Building and Financial requirements.",
            "2. That all staff recruited possess UGC / AICTE prescribed qualifications.",
            "3. That no capitation fee has been charged from any admitted student.",
            "4. Anti-ragging committee and Internal Complaints Committee are duly constituted.",
            "Deponent: Authorized Signatory | Notarized at Demo City"
        ]
    )

    accreditation_path = UPLOADS_DIR / "Accreditation_certificate.pdf"
    generate_standard_pdf(
        accreditation_path,
        "NATIONAL BOARD OF ACCREDITATION",
        "Certificate of Accreditation (Demo)",
        [
            "Certificate No: NBA/ACC-ENG/2022/9912",
            "This is to certify that Computer Engineering & Mechanical Engineering programmes",
            "at Meridian Institute of Technology are accredited for Academic Years 2022-2025.",
            "Accreditation Status: Accredited (Tier-II)",
            "Member Secretary, NBA"
        ]
    )

    land_deed_path = UPLOADS_DIR / "Land_ownership_deed.pdf"
    generate_standard_pdf(
        land_deed_path,
        "LAND OWNERSHIP DEED / 7-12 EXTRACT",
        "Registration & Stamps Department (Demo)",
        [
            "Document Registration No: REG/LND/2014/8834",
            "Survey No: 42/1A, Area: 5.25 Acres, Location: Demo City",
            "Title: Freehold educational campus land registered in favor of the Trust.",
            "Sub-Registrar of Assurances"
        ]
    )

    letter_path = UPLOADS_DIR / "EoA_application_letter.pdf"
    generate_standard_pdf(
        letter_path,
        "APPLICATION FOR EXTENSION OF APPROVAL (EoA)",
        "Academic Year 2026-27 (AICTE Portal Submission)",
        [
            "To, The Member Secretary, All India Council for Technical Education, New Delhi",
            "Subject: Application for Extension of Approval (EoA) for Academic Year 2026-27",
            "Institution: Meridian Institute of Technology (PID: 1-10492817)",
            "We submit all statutory compliance documents for preliminary verification.",
            "Principal / Director"
        ]
    )

    floorplan_path = UPLOADS_DIR / "Lab_block_floorplan.png"
    generate_sample_image(floorplan_path, "Approved Architectural Blueprint - Academic & Laboratory Block")

    # 5. Seed Primary Application: EoA-2026-00418 (Meridian Institute of Technology)
    app_primary = Application(
        id="EoA-2026-00418",
        institution_name="Meridian Institute of Technology",
        institution_code="1-10492817",
        category="Extension of Approval (EoA)",
        submission_date=datetime.datetime(2026, 10, 26, 14, 48),
        overall_status="Manual review",
        checks_passed=9,
        checks_total=12,
        officer_note="",
        decision_status=None,
        created_at=datetime.datetime(2026, 10, 26, 14, 48)
    )
    db.add(app_primary)

    # Add 6 documents to primary application
    doc_fire = UploadedDocument(
        id="doc-00418-fire",
        application_id="EoA-2026-00418",
        filename="Fire_NOC_2021.pdf",
        file_path="/uploads/Fire_NOC_2021.pdf",
        file_size=943718,
        file_size_formatted="0.9 MB",
        mime_type="application/pdf",
        sha256_hash=fire_noc_hash,
        detected_type="NOC (Fire)",
        detected_language="English",
        processing_status="Extracted",
        ocr_used=False,
        page_count=1,
        metadata_json={"creator": "Adobe Photoshop 25.1", "producer": "Adobe PDF Library 17.0"}
    )
    db.add(doc_fire)

    doc_letter = UploadedDocument(
        id="doc-00418-letter",
        application_id="EoA-2026-00418",
        filename="EoA_application_letter.pdf",
        file_path="/uploads/EoA_application_letter.pdf",
        file_size=1258291,
        file_size_formatted="1.2 MB",
        mime_type="application/pdf",
        sha256_hash=calculate_sha256(str(letter_path)),
        detected_type="Application letter",
        detected_language="English",
        processing_status="Extracted",
        page_count=1
    )
    db.add(doc_letter)

    doc_affidavit = UploadedDocument(
        id="doc-00418-affidavit",
        application_id="EoA-2026-00418",
        filename="Affidavit_notarised.pdf",
        file_path="/uploads/Affidavit_notarised.pdf",
        file_size=2516582,
        file_size_formatted="2.4 MB",
        mime_type="application/pdf",
        sha256_hash=calculate_sha256(str(affidavit_path)),
        detected_type="Affidavit",
        detected_language="Hindi + English",
        processing_status="Translated",
        page_count=1
    )
    db.add(doc_affidavit)

    doc_accred = UploadedDocument(
        id="doc-00418-accred",
        application_id="EoA-2026-00418",
        filename="Accreditation_certificate.pdf",
        file_path="/uploads/Accreditation_certificate.pdf",
        file_size=1153433,
        file_size_formatted="1.1 MB",
        mime_type="application/pdf",
        sha256_hash=calculate_sha256(str(accreditation_path)),
        detected_type="Accreditation",
        detected_language="English",
        processing_status="Extracted",
        page_count=1
    )
    db.add(doc_accred)

    doc_land = UploadedDocument(
        id="doc-00418-land",
        application_id="EoA-2026-00418",
        filename="Land_ownership_deed.pdf",
        file_path="/uploads/Land_ownership_deed.pdf",
        file_size=2726297,
        file_size_formatted="2.6 MB",
        mime_type="application/pdf",
        sha256_hash=calculate_sha256(str(land_deed_path)),
        detected_type="Land document",
        detected_language="Marathi + English",
        processing_status="Translated",
        page_count=1
    )
    db.add(doc_land)

    doc_plan = UploadedDocument(
        id="doc-00418-floorplan",
        application_id="EoA-2026-00418",
        filename="Lab_block_floorplan.png",
        file_path="/uploads/Lab_block_floorplan.png",
        file_size=3250585,
        file_size_formatted="3.1 MB",
        mime_type="image/png",
        sha256_hash=calculate_sha256(str(floorplan_path)),
        detected_type="Floor plan",
        detected_language="Image",
        processing_status="Queued",
        page_count=1
    )
    db.add(doc_plan)

    # Extracted fields for Fire NOC
    extracted_fields = [
        ("Institution name", "Meridian Inst. of Technology & Research", "Mismatch detected", "Compared with AICTE institutional record"),
        ("Certificate number", "FS/NOC/2021/04418", "Verification pending", "Format valid · issuing portal not reached"),
        ("Date of issue", "14 Mar 2021", "Verified", "Earlier than validity end date"),
        ("Valid until", "13 Mar 2024", "Expired", "Application date is 26 Oct 2026"),
        ("Issuing authority", "State Fire Services Department (demo)", "Verified", "Listed in issuing-authority registry")
    ]
    for fn, fv, stat, msg in extracted_fields:
        ef = ExtractedField(
            document_id="doc-00418-fire",
            field_name=fn,
            field_value=fv,
            confidence=0.98,
            page_number=1,
            validation_status=stat,
            validation_message=msg
        )
        db.add(ef)

    # 4 Findings matching Reference Image 3
    findings_data = [
        (
            1,
            "Possible alteration near the official seal",
            "Manual review required",
            "High",
            "The file was last saved by an image editor rather than scanner or print software, and the seal area has different compression from the rest of the page.",
            "Creator tag: Adobe Photoshop 25.1\nLast modified: 21 Oct 2026, 18:42\nExpected: scanner or print-to-PDF software",
            "Metadata and visual consistency check",
            "Ask the institution for the original certificate, or confirm with the issuing authority.",
            1,
            {"top": 66, "left": 66, "width": 26, "height": 18} # Seal coordinate
        ),
        (
            2,
            "Fire NOC validity has ended",
            "Expired",
            "High",
            "Validity ended on 13 Mar 2024. Current validity is required under Chapter II of AICTE Approval Process Handbook.",
            "Valid until: 13 March 2024\nCurrent date: 26 Oct 2026\nOverdue: 2 years 7 months",
            "Regulatory validity and expiry check",
            "Request renewed Fire NOC with active validity.",
            2,
            {"top": 44.5, "left": 55, "width": 14, "height": 3} # Date coordinate
        ),
        (
            3,
            "Institution name differs from AICTE record",
            "Mismatch detected",
            "Medium",
            "The name on the certificate includes '& Research' which is absent in the approved AICTE institutional database.",
            "Document name: Meridian Inst. of Technology & Research\nAICTE record: Meridian Institute of Technology",
            "Institutional record consistency check",
            "Verify official name change approval or trust registration.",
            3,
            {"top": 36, "left": 65, "width": 25, "height": 5} # Name coordinate
        ),
        (
            4,
            "Issuing authority could not be reached",
            "Source unavailable",
            "Low",
            "Automated QR check to State Fire Services verification endpoint timed out.",
            "QR payload URL: https://fireservices.state.gov.in/verify/04418\nHTTP response: Gateway Timeout (504)",
            "Issuing authority real-time validation",
            "Perform manual verification through issuing authority portal.",
            4,
            {"top": 62, "left": 37, "width": 14, "height": 14} # QR code coordinate
        )
    ]

    for num, tit, stat, sev, why, ev, rule, sugg, marker, coords in findings_data:
        f = Finding(
            application_id="EoA-2026-00418",
            document_id="doc-00418-fire",
            finding_number=num,
            title=tit,
            status=stat,
            severity=sev,
            why_flagged=why,
            evidence_text=ev,
            rule_name=rule,
            suggested_next_step=sugg,
            ai_generated=True,
            callout_marker=marker,
            callout_coordinates=coords
        )
        db.add(f)

    # 12 Checklist items for EoA-2026-00418
    checklist_data = [
        ("Application letter", "Uploaded", "Passed", 1),
        ("Affidavit / undertaking", "Uploaded", "Passed", 2),
        ("Accreditation certificate", "Uploaded", "Passed", 3),
        ("Land ownership document", "Uploaded", "Passed", 4),
        ("Fire NOC", "Uploaded", "Expired", 5),
        ("Floor plan", "Uploaded", "Checking", 6),
        ("Infrastructure photographs", "Uploaded", "Missing", 7),
        ("Previous EoA status", "AICTE records", "Passed", 8),
        ("Approved programmes and intake", "AICTE records", "Passed", 9),
        ("Faculty records", "AICTE records", "Passed", 10),
        ("TER payment status", "AICTE records", "Passed", 11),
        ("Compliance and deficiency status", "AICTE records", "Passed", 12),
    ]
    for item, src_t, st, idx in checklist_data:
        vc = ValidationCheck(
            application_id="EoA-2026-00418",
            checklist_item=item,
            source_type=src_t,
            status=st,
            order_index=idx
        )
        db.add(vc)

    # Initial Audit Trail Events for EoA-2026-00418
    audit_events_data = [
        ("Application created", "Completed", "AICTE Portal", "EoA application initialized by institute"),
        ("Documents uploaded", "Completed", "System File Manager", "6 supporting documents uploaded (11.4 MB)"),
        ("SHA-256 Hashes Computed", "Completed", "Document Analyzer", "No cross-document duplicates detected"),
        ("PyMuPDF Text & Metadata Parsed", "Completed", "Extraction Engine", "Photoshop creator tag flagged on Fire NOC"),
        ("AICTE Master Record Queried", "Flagged", "Central Sync Adapter", "Discrepancy detected in institution name"),
        ("State Fire Services QR Queried", "Flagged", "Authority Adapter", "Simulated endpoint returned timeout (504)"),
        ("Deterministic Rules Evaluated", "Completed", "Rules Engine", "9 passed, 1 expired, 1 pending, 1 missing"),
        ("Preliminary Scrutiny Summary Generated", "Completed", "Scrutiny Engine", "Status set to Manual Review Required")
    ]
    for act, out, actor, det in audit_events_data:
        ev = AuditEvent(
            application_id="EoA-2026-00418",
            timestamp=datetime.datetime(2026, 10, 26, 14, 49) + datetime.timedelta(seconds=len(act)*10),
            actor=actor,
            action=act,
            outcome=out,
            source_mode="SIMULATED",
            details=det
        )
        db.add(ev)

    # 6. Additional Seed Applications to populate queue metrics (Total 128: Clear 74, Needs review 38, Anomalies 16)
    queue_apps = [
        ("EoA-2026-00417", "Northfield College of Engineering", "Extension of Approval", "Verified", 12, 12, datetime.datetime(2026, 10, 26, 14, 12)),
        ("EoA-2026-00412", "Kaveri School of Technology", "Increase in intake", "Source pending", 10, 11, datetime.datetime(2026, 10, 26, 13, 30)),
        ("EoA-2026-00409", "Lakeshore Polytechnic", "New course", "Anomaly flagged", 7, 12, datetime.datetime(2026, 10, 26, 12, 45)),
        ("EoA-2026-00405", "Aravali Institute of Pharmacy", "Extension of Approval", "Verified", 12, 12, datetime.datetime(2026, 10, 26, 11, 20)),
        ("EoA-2026-00401", "Sundarban Institute of Management", "Extension of Approval", "Expired document", 8, 12, datetime.datetime(2026, 10, 26, 10, 5)),
        ("EoA-2026-00398", "Vindhya Engineering Academy", "Extension of Approval", "Verified", 12, 12, datetime.datetime(2026, 10, 25, 17, 30)),
        ("EoA-2026-00395", "Deccan Institute of Architecture", "New course", "Manual review", 9, 12, datetime.datetime(2026, 10, 25, 16, 15)),
        ("EoA-2026-00390", "Nilgiri Institute of Technology", "Increase in intake", "Anomaly flagged", 6, 11, datetime.datetime(2026, 10, 25, 14, 0)),
        ("EoA-2026-00388", "Konkan Polytechnic Institute", "Extension of Approval", "Verified", 12, 12, datetime.datetime(2026, 10, 25, 12, 10)),
        ("EoA-2026-00385", "Satpura Institute of Pharmacy", "Extension of Approval", "Expired document", 7, 12, datetime.datetime(2026, 10, 25, 11, 45)),
    ]

    for app_id, name, cat, stat, passed, tot, sub_dt in queue_apps:
        q_app = Application(
            id=app_id,
            institution_name=name,
            institution_code=f"1-{hash(app_id) % 9000000 + 1000000}",
            category=cat,
            submission_date=sub_dt,
            overall_status=stat,
            checks_passed=passed,
            checks_total=tot,
            created_at=sub_dt
        )
        db.add(q_app)

    db.commit()
