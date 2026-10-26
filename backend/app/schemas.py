from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

# Application schemas
class ApplicationBase(BaseModel):
    institution_name: str
    category: str = "Extension of Approval (EoA)"
    institution_code: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    id: Optional[str] = None

class ExtractedFieldOut(BaseModel):
    id: int
    field_name: str
    field_value: str
    normalized_value: Optional[str] = None
    confidence: float
    page_number: int
    validation_status: str
    validation_message: Optional[str] = None
    bounding_box: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class FindingOut(BaseModel):
    id: int
    finding_number: int
    title: str
    status: str
    severity: str
    why_flagged: str
    evidence_text: Optional[str] = None
    rule_name: str
    suggested_next_step: Optional[str] = None
    ai_generated: bool
    callout_marker: Optional[int] = None
    callout_coordinates: Optional[Dict[str, Any]] = None
    confirmed_by_reviewer: bool
    dismissed_by_reviewer: bool
    reviewer_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UploadedDocumentOut(BaseModel):
    id: str
    filename: str
    file_size_formatted: str
    mime_type: str
    sha256_hash: Optional[str]
    detected_type: str
    detected_language: str
    processing_status: str
    is_duplicate: bool
    page_count: int
    extracted_fields: List[ExtractedFieldOut] = []
    findings: List[FindingOut] = []

    class Config:
        from_attributes = True

class ValidationCheckOut(BaseModel):
    id: int
    checklist_item: str
    source_type: str
    status: str
    details: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True

class VerificationAttemptOut(BaseModel):
    id: int
    source_name: str
    status: str
    returned_identifier: Optional[str] = None
    response_details: Optional[str] = None
    is_simulated: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class AuditEventOut(BaseModel):
    id: int
    application_id: str
    timestamp: datetime
    actor: str
    action: str
    outcome: str
    evidence_ref: Optional[str] = None
    source_mode: str
    details: Optional[str] = None

    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: str
    institution_name: str
    institution_code: Optional[str] = None
    category: str
    submission_date: datetime
    overall_status: str
    checks_passed: int
    checks_total: int
    officer_note: Optional[str] = None
    decision_status: Optional[str] = None
    created_at: datetime
    documents: List[UploadedDocumentOut] = []
    checks: List[ValidationCheckOut] = []
    findings: List[FindingOut] = []
    audit_events: List[AuditEventOut] = []

    class Config:
        from_attributes = True

class FindingActionRequest(BaseModel):
    note: Optional[str] = ""

class DecisionRequest(BaseModel):
    note: Optional[str] = ""

class ValidationRuleOut(BaseModel):
    id: str
    code: str
    category: str
    name: str
    description: str
    required_evidence: str
    severity: str
    is_active: bool
    version: str
    updated_at: datetime

    class Config:
        from_attributes = True

class RuleToggleRequest(BaseModel):
    is_active: bool

class RuleCreateRequest(BaseModel):
    code: str
    category: str
    name: str
    description: str
    required_evidence: str
    severity: str = "Medium"

class VerificationSourceOut(BaseModel):
    id: str
    name: str
    source_type: str
    supported_doc: str
    integration_mode: str
    status: str
    last_checked_at: datetime
    details: Optional[str] = None
    methods: List[str] = []

    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    id: str
    application_id: str
    institution_name: str
    doc_type: str
    alert_type: str
    severity: str
    message: str
    time_ago: str
    finding_id: Optional[int] = None
