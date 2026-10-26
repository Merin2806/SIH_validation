import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True) # e.g. "EoA-2026-00418"
    institution_name = Column(String, nullable=False, index=True)
    institution_code = Column(String, nullable=True) # e.g. "1-10492817"
    category = Column(String, default="Extension of Approval (EoA)")
    submission_date = Column(DateTime, default=datetime.datetime.utcnow)
    overall_status = Column(String, default="Manual review") # "Verified", "Manual review", "Anomaly flagged", "Source pending", "Expired document"
    checks_passed = Column(Integer, default=9)
    checks_total = Column(Integer, default=12)
    officer_note = Column(Text, nullable=True)
    decision_status = Column(String, nullable=True) # "RECTIFICATION_REQUESTED", "PHYSICAL_INSPECTION_ESCALATED", "REVIEWED"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    documents = relationship("UploadedDocument", back_populates="application", cascade="all, delete-orphan")
    checks = relationship("ValidationCheck", back_populates="application", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="application", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="application", cascade="all, delete-orphan")


class InstitutionRecord(Base):
    """Synthetic master AICTE institutional records database for cross-referencing."""
    __tablename__ = "institution_records"

    id = Column(String, primary_key=True) # e.g. "AICTE-INST-00418"
    name = Column(String, nullable=False, index=True)
    official_code = Column(String, nullable=False, unique=True)
    state = Column(String, default="Maharashtra")
    district = Column(String, default="Pune")
    address = Column(String, default="Plot 14, Education Park Road, Demo City")
    approved_programmes = Column(JSON, default=list) # ["Computer Engineering", "Mechanical", "AI & DS"]
    approved_intake = Column(Integer, default=420)
    faculty_count = Column(Integer, default=68)
    previous_eoa_status = Column(String, default="Approved")
    ter_payment_status = Column(String, default="Paid")
    compliance_status = Column(String, default="Compliant")
    accreditation_valid_until = Column(String, default="2027-06-30")
    fire_noc_mandatory = Column(Boolean, default=True)


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(String, primary_key=True) # UUID or doc identifier
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0) # in bytes
    file_size_formatted = Column(String, default="1.2 MB")
    mime_type = Column(String, default="application/pdf")
    sha256_hash = Column(String, index=True, nullable=True)
    detected_type = Column(String, default="Application letter") # "NOC (Fire)", "Affidavit", "Accreditation", "Land document", "Floor plan", etc.
    detected_language = Column(String, default="English") # "English", "Hindi + English", "Marathi + English", "Image"
    processing_status = Column(String, default="Extracted") # "Queued", "Extracting", "Extracted", "Translated", "Failed"
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(String, nullable=True)
    ocr_used = Column(Boolean, default=False)
    page_count = Column(Integer, default=1)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="document", cascade="all, delete-orphan")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String, ForeignKey("uploaded_documents.id"), nullable=False, index=True)
    field_name = Column(String, nullable=False) # "Institution name", "Certificate number", "Date of issue", "Valid until", etc.
    field_value = Column(String, nullable=False)
    normalized_value = Column(String, nullable=True)
    confidence = Column(Float, default=0.95)
    page_number = Column(Integer, default=1)
    validation_status = Column(String, default="Verified") # "Verified", "Mismatch detected", "Expired", "Verification pending", "Manual review required"
    validation_message = Column(String, nullable=True)
    bounding_box = Column(JSON, nullable=True) # {"x": 10, "y": 20, "w": 30, "h": 10}

    document = relationship("UploadedDocument", back_populates="extracted_fields")


class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(String, primary_key=True) # e.g. "RULE_FIRE_NOC_VALIDITY"
    code = Column(String, unique=True, nullable=False)
    category = Column(String, default="Regulatory Compliance") # "Document Presence", "Validity Checks", "Cross Consistency", "Anomalies"
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    required_evidence = Column(String, default="Mandatory uploaded certificate")
    severity = Column(String, default="High") # "High", "Medium", "Low"
    is_active = Column(Boolean, default=True)
    version = Column(String, default="v2.4")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class ValidationCheck(Base):
    __tablename__ = "validation_checks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, index=True)
    checklist_item = Column(String, nullable=False) # e.g. "Fire NOC", "Affidavit / undertaking", "TER payment status"
    source_type = Column(String, default="Uploaded") # "Uploaded", "AICTE records"
    status = Column(String, default="Passed") # "Passed", "Expired", "Missing", "Checking", "Pending"
    details = Column(String, nullable=True)
    order_index = Column(Integer, default=0)

    application = relationship("Application", back_populates="checks")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("uploaded_documents.id"), nullable=True, index=True)
    finding_number = Column(Integer, default=1)
    title = Column(String, nullable=False)
    status = Column(String, default="Manual review required") # "Manual review required", "Expired", "Mismatch detected", "Source unavailable"
    severity = Column(String, default="High") # "High", "Medium", "Low"
    why_flagged = Column(Text, nullable=False)
    evidence_text = Column(Text, nullable=True)
    rule_name = Column(String, nullable=False)
    suggested_next_step = Column(Text, nullable=True)
    ai_generated = Column(Boolean, default=True)
    callout_marker = Column(Integer, nullable=True) # 1, 2, 3, 4 (links to document preview coordinate)
    callout_coordinates = Column(JSON, nullable=True) # {"top": 45, "left": 60, "width": 30, "height": 10} in %
    confirmed_by_reviewer = Column(Boolean, default=False)
    dismissed_by_reviewer = Column(Boolean, default=False)
    reviewer_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="findings")
    document = relationship("UploadedDocument", back_populates="findings")


class VerificationSource(Base):
    __tablename__ = "verification_sources"

    id = Column(String, primary_key=True) # "src-aicte", "src-fire", "src-meta", etc.
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False) # "Central Record", "Issuing Portal QR", "Metadata Analysis"
    supported_doc = Column(String, default="All technical applications")
    integration_mode = Column(String, default="SIMULATED") # "SIMULATED", "DIRECT_API", "OFFLINE_BATCH"
    status = Column(String, default="Verified against source") # "Verified against source", "Mismatch detected", "Source unavailable", "Verification pending"
    last_checked_at = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(String, nullable=True)
    methods = Column(JSON, default=list) # ["QR Code Verification", "Reference API", "Public Registry Lookup"]


class VerificationAttempt(Base):
    __tablename__ = "verification_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, nullable=False, index=True)
    source_name = Column(String, nullable=False)
    status = Column(String, nullable=False) # "Verified", "Mismatch detected", "Source unavailable", "Manual review required"
    returned_identifier = Column(String, nullable=True)
    response_details = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    actor = Column(String, default="System") # "S. Officer", "AI Scrutiny Pipeline", "Rules Engine"
    action = Column(String, nullable=False)
    outcome = Column(String, nullable=False) # "Completed", "Flagged", "Updated", "Confirmed", "Dismissed"
    evidence_ref = Column(String, nullable=True)
    source_mode = Column(String, default="SIMULATED")
    details = Column(Text, nullable=True)

    application = relationship("Application", back_populates="audit_events")


class ReviewerAction(Base):
    __tablename__ = "reviewer_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, nullable=False, index=True)
    action_type = Column(String, nullable=False) # "CONFIRM_FINDING", "DISMISS_FINDING", "RECTIFICATION_REQUESTED", "PHYSICAL_INSPECTION_ESCALATED", "REVIEW_COMPLETED"
    finding_id = Column(Integer, nullable=True)
    actor = Column(String, default="Scrutiny Officer")
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
