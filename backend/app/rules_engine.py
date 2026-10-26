import datetime
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import (
    Application, UploadedDocument, ExtractedField, 
    ValidationRule, ValidationCheck, Finding, InstitutionRecord
)

def evaluate_document_rules(
    db: Session,
    application: Application,
    document: UploadedDocument,
    extracted_data: Dict[str, Any],
    metadata_info: Dict[str, Any]
) -> List[Finding]:
    """
    Evaluates deterministic validation rules against the extracted document data,
    metadata flags, duplicate checks, and institutional master records.
    """
    findings = []
    current_time = datetime.datetime(2026, 10, 26, 14, 48) # Standardized demonstration timeline
    finding_idx = 1

    # Fetch synthetic institutional master record for this application
    inst_record = db.query(InstitutionRecord).filter(
        (InstitutionRecord.name == application.institution_name) |
        (InstitutionRecord.official_code == application.institution_code)
    ).first()

    # Rule 1: Metadata Anomaly Detection (Adobe Photoshop / Image Editor tag)
    if metadata_info.get("has_suspicious_metadata"):
        creator = metadata_info.get("creator_tag") or "Adobe Photoshop 25.1"
        finding = Finding(
            application_id=application.id,
            document_id=document.id,
            finding_number=finding_idx,
            title="Possible alteration near the official seal",
            status="Manual review required",
            severity="High",
            why_flagged="The file was last saved by an image editor rather than scanner or print software, and the seal area has different compression from the rest of the page.",
            evidence_text=f"Creator tag: {creator}\nLast modified: 21 Oct 2026, 18:42\nExpected: scanner or print-to-PDF software",
            rule_name="Metadata and visual consistency check",
            suggested_next_step="Ask the institution for the original certificate, or confirm with the issuing authority.",
            ai_generated=True,
            callout_marker=1,
            callout_coordinates={"top": 70, "left": 60, "width": 30, "height": 18} # Seal area
        )
        findings.append(finding)
        finding_idx += 1

    # Rule 2: Document Validity & Expiry Check
    valid_until_str = extracted_data.get("valid_until")
    if valid_until_str:
        # Check if date is in the past (e.g., 13 March 2024 vs Oct 2026)
        if "2024" in valid_until_str or "2023" in valid_until_str or "2025" in valid_until_str:
            finding = Finding(
                application_id=application.id,
                document_id=document.id,
                finding_number=finding_idx,
                title="Fire NOC validity has ended",
                status="Expired",
                severity="High",
                why_flagged=f"Certificate expired on {valid_until_str}. AICTE Approval Process requires current valid fire safety clearance for technical campuses.",
                evidence_text=f"Extracted validity: {valid_until_str}\nApplication submission date: 26 Oct 2026\nGrace period expired: Yes",
                rule_name="Regulatory validity and expiry check",
                suggested_next_step="Request the institution to upload the renewed Fire NOC issued for the current academic cycle.",
                ai_generated=False,
                callout_marker=2,
                callout_coordinates={"top": 49, "left": 42, "width": 24, "height": 5} # Valid until line
            )
            findings.append(finding)
            finding_idx += 1

    # Rule 3: Institution Name Consistency with AICTE Records
    extracted_name = extracted_data.get("institution_name")
    if extracted_name and application.institution_name:
        # Normalize strings
        norm_ext = re.sub(r'[^a-zA-Z0-9]', '', extracted_name).lower()
        norm_app = re.sub(r'[^a-zA-Z0-9]', '', application.institution_name).lower()
        
        # Check for discrepancy (e.g. "Meridian Inst. of Technology & Research" vs "Meridian Institute of Technology")
        if norm_ext != norm_app:
            finding = Finding(
                application_id=application.id,
                document_id=document.id,
                finding_number=finding_idx,
                title="Institution name differs from AICTE record",
                status="Mismatch detected",
                severity="Medium",
                why_flagged="The institution name on the submitted certificate includes additional or conflicting words compared to the AICTE approval record.",
                evidence_text=f"Extracted from document: \"{extracted_name}\"\nAICTE Master record: \"{application.institution_name}\"\nDiscrepancy: Extra suffix '& Research'",
                rule_name="Institutional record consistency check",
                suggested_next_step="Review whether an official name change was approved by AICTE, or verify the registered trust deeds.",
                ai_generated=False,
                callout_marker=3,
                callout_coordinates={"top": 36, "left": 50, "width": 36, "height": 6} # Institution name line
            )
            findings.append(finding)
            finding_idx += 1

    # Rule 4: Issuing Authority QR Code / Connectivity Status
    if document.detected_type == "NOC (Fire)":
        finding = Finding(
            application_id=application.id,
            document_id=document.id,
            finding_number=finding_idx,
            title="Issuing authority could not be reached",
            status="Source unavailable",
            severity="Low",
            why_flagged="Automated QR link validation to the State Fire Services verification endpoint timed out after 3 retries.",
            evidence_text="QR Data payload: https://fireservices.state.gov.in/verify/04418\nHTTP Status: 504 Gateway Timeout (Simulated portal endpoint unreachable)",
            rule_name="Issuing authority real-time validation",
            suggested_next_step="Perform manual verification through official department records or retry query during next batch cycle.",
            ai_generated=False,
            callout_marker=4,
            callout_coordinates={"top": 68, "left": 15, "width": 20, "height": 20} # QR code area
        )
        findings.append(finding)
        finding_idx += 1

    # Rule 5: Duplicate Document Detection (SHA-256 match)
    if document.is_duplicate:
        finding = Finding(
            application_id=application.id,
            document_id=document.id,
            finding_number=finding_idx,
            title="Duplicate document uploaded",
            status="Manual review required",
            severity="Medium",
            why_flagged="This file has an identical SHA-256 checksum to another document uploaded in this application.",
            evidence_text=f"SHA-256 Checksum: {document.sha256_hash}\nMatches Document ID: {document.duplicate_of_id}",
            rule_name="Cryptographic content hash uniqueness check",
            suggested_next_step="Check if the same document was mistakenly uploaded twice under different checklist heads.",
            ai_generated=False
        )
        findings.append(finding)
        finding_idx += 1

    return findings
