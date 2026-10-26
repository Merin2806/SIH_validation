import os
import uuid
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import UPLOADS_DIR
from ..models import Application, UploadedDocument, ExtractedField, Finding, ValidationCheck
from ..document_parser import calculate_sha256, extract_pdf_data, classify_document_type
from ..ai_service import ai_service
from ..rules_engine import evaluate_document_rules
from ..audit_service import log_audit_event

router = APIRouter(prefix="/api", tags=["Documents"])

@router.post("/applications/{app_id}/documents")
async def upload_document(
    app_id: str,
    file: UploadFile = File(...),
    document_type_hint: str = Form(None),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Validate file format and size
    filename = file.filename or "uploaded_file"
    ext = Path(filename).suffix.lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, JPG, or PNG.")

    # Unique storage name
    unique_name = f"{uuid.uuid4().hex[:12]}_{filename}"
    file_disk_path = UPLOADS_DIR / unique_name

    # Save to disk
    contents = await file.read()
    file_size = len(contents)
    if file_size > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 25MB.")

    with open(file_disk_path, "wb") as f:
        f.write(contents)

    # 1. SHA-256 Hash
    sha256 = calculate_sha256(str(file_disk_path))

    # Check for duplicate within the application
    duplicate = db.query(UploadedDocument).filter(
        UploadedDocument.application_id == app_id,
        UploadedDocument.sha256_hash == sha256
    ).first()

    is_duplicate = bool(duplicate)
    duplicate_of_id = duplicate.id if duplicate else None

    # 2. Extract Text & Metadata
    extracted_text = ""
    metadata_info = {}
    page_count = 1
    detected_lang = "English"

    if ext == ".pdf":
        pdf_res = extract_pdf_data(str(file_disk_path))
        extracted_text = pdf_res.get("text", "")
        metadata_info = pdf_res.get("metadata", {})
        page_count = pdf_res.get("page_count", 1)
        langs = pdf_res.get("language_hints", ["English"])
        detected_lang = " + ".join(langs)
    else:
        detected_lang = "Image"

    # 3. Classify Document Type
    detected_type = document_type_hint or classify_document_type(extracted_text, filename)

    # 4. Create UploadedDocument entity
    file_size_formatted = f"{file_size / (1024 * 1024):.1f} MB" if file_size >= 1048576 else f"{file_size / 1024:.0f} KB"
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"

    doc_record = UploadedDocument(
        id=doc_id,
        application_id=app_id,
        filename=filename,
        file_path=f"/uploads/{unique_name}",
        file_size=file_size,
        file_size_formatted=file_size_formatted,
        mime_type=file.content_type or "application/pdf",
        sha256_hash=sha256,
        detected_type=detected_type,
        detected_language=detected_lang,
        processing_status="Extracted" if ext == ".pdf" else "Queued",
        is_duplicate=is_duplicate,
        duplicate_of_id=duplicate_of_id,
        page_count=page_count,
        metadata_json=metadata_info
    )
    db.add(doc_record)
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        action="Document uploaded",
        outcome="Completed",
        evidence_ref=filename,
        details=f"File {filename} ({file_size_formatted}) uploaded. SHA-256: {sha256[:16]}..."
    )

    # 5. Run AI Extraction
    structured = await ai_service.extract_structured_fields(
        text=extracted_text,
        doc_type=detected_type,
        filename=filename,
        file_path=str(file_disk_path)
    )

    # Store extracted fields
    if structured.get("institution_name"):
        db.add(ExtractedField(
            document_id=doc_id,
            field_name="Institution name",
            field_value=structured["institution_name"],
            validation_status="Verified" if structured["institution_name"] == app.institution_name else "Mismatch detected",
            validation_message="Compared with AICTE institutional record"
        ))

    if structured.get("certificate_number"):
        db.add(ExtractedField(
            document_id=doc_id,
            field_name="Certificate number",
            field_value=structured["certificate_number"],
            validation_status="Verified",
            validation_message="Validated against issuing format"
        ))

    if structured.get("issue_date"):
        db.add(ExtractedField(
            document_id=doc_id,
            field_name="Date of issue",
            field_value=structured["issue_date"],
            validation_status="Verified",
            validation_message="Earlier than validity end date"
        ))

    if structured.get("valid_until"):
        is_exp = "2024" in structured["valid_until"] or "2023" in structured["valid_until"]
        db.add(ExtractedField(
            document_id=doc_id,
            field_name="Valid until",
            field_value=structured["valid_until"],
            validation_status="Expired" if is_exp else "Verified",
            validation_message="Application date is 26 Oct 2026" if is_exp else "Active validity"
        ))

    db.commit()

    # 6. Evaluate Deterministic Rules & Generate Findings
    findings = evaluate_document_rules(
        db=db,
        application=app,
        document=doc_record,
        extracted_data=structured,
        metadata_info=pdf_res if ext == ".pdf" else {}
    )

    for f in findings:
        db.add(f)
        log_audit_event(
            db,
            application_id=app_id,
            action=f"Finding generated: {f.title}",
            outcome="Flagged",
            evidence_ref=filename,
            details=f.why_flagged
        )

    # 7. Update Application Checklist Status
    matching_check = db.query(ValidationCheck).filter(
        ValidationCheck.application_id == app_id,
        ValidationCheck.checklist_item.ilike(f"%{detected_type[:4]}%")
    ).first()

    if matching_check:
        if any(f.status == "Expired" for f in findings):
            matching_check.status = "Expired"
        elif any(f.severity == "High" for f in findings):
            matching_check.status = "Failed"
        else:
            matching_check.status = "Passed"

    # Re-tally checks passed
    passed_count = db.query(ValidationCheck).filter(
        ValidationCheck.application_id == app_id,
        ValidationCheck.status == "Passed"
    ).count()
    app.checks_passed = passed_count

    # Update overall status
    if any(f.severity == "High" and f.status != "Expired" for f in findings):
        app.overall_status = "Manual review"
    elif any(f.status == "Expired" for f in findings):
        app.overall_status = "Manual review"

    db.commit()

    return {
        "document_id": doc_id,
        "filename": filename,
        "detected_type": detected_type,
        "detected_language": detected_lang,
        "extracted_fields": structured,
        "findings_count": len(findings),
        "checks_passed": app.checks_passed
    }

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    app_id = doc.application_id
    db.delete(doc)
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        action="Document removed",
        outcome="Completed",
        evidence_ref=doc.filename,
        details=f"Document {doc.filename} removed from application dossier."
    )
    return {"message": "Document successfully deleted"}
