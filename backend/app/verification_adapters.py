import datetime
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class VerificationResult:
    source_id: str
    source_name: str
    verification_method: str
    reference_checked: str
    status: str # "Verified", "Mismatch detected", "Source unavailable", "Pending", "Not configured", "Error"
    timestamp: datetime.datetime
    response_details: str
    status_code: str = "verified" # "verified", "mismatch_detected", "source_unavailable", "pending", "not_configured", "error"
    error_info: Optional[str] = None
    is_simulated: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class BaseVerificationAdapter(ABC):
    def __init__(self, source_id: str, source_name: str = "", source_type: str = "", supported_doc: str = "", methods: Optional[List[str]] = None, name: str = ""):
        self.source_id = source_id
        self.source_name = source_name or name
        self.source_type = source_type
        self.supported_doc = supported_doc
        self.methods = methods or []
        self.integration_mode = "SIMULATED"

    @abstractmethod
    def verify(self, reference: str, context: Optional[Dict[str, Any]] = None) -> VerificationResult:
        pass

class AICTECentralDbAdapter(BaseVerificationAdapter):
    """Simulated adapter for AICTE Central Institutional Database."""
    def __init__(self):
        super().__init__(
            source_id="src-aicte",
            name="AICTE Central Institutional Database",
            source_type="Central Regulatory Repository",
            supported_doc="Institutional details, approved intake, previous EoA, faculty rolls",
            methods=["REST API v3", "OAS 3.0 Webhook", "Direct Sync"]
        )

    def verify(self, reference: str, context: Optional[Dict[str, Any]] = None) -> VerificationResult:
        now = datetime.datetime.utcnow()
        context = context or {}
        extracted_name = context.get("institution_name", "")
        master_name = context.get("master_institution_name", "Meridian Institute of Technology")

        if extracted_name and ("& Research" in extracted_name or "& research" in extracted_name.lower()):
            return VerificationResult(
                source_id=self.source_id,
                source_name=self.source_name,
                verification_method="AICTE Master Record Query (Simulated)",
                reference_checked=reference or "AICTE-INST-00418",
                status="Mismatch detected",
                status_code="mismatch_detected",
                timestamp=now,
                response_details=f"Title mismatch detected: submitted document contains '{extracted_name}' which does not match AICTE master record '{master_name}'.",
                is_simulated=True
            )

        return VerificationResult(
            source_id=self.source_id,
            source_name=self.source_name,
            verification_method="AICTE Master Record Query (Simulated)",
            reference_checked=reference or "AICTE-INST-00417",
            status="Verified",
            status_code="verified",
            timestamp=now,
            response_details=f"Institutional record matched. Active approval status confirmed for {master_name}.",
            is_simulated=True
        )

class StateFireServicesAdapter(BaseVerificationAdapter):
    """Simulated adapter for State Fire Services Department QR Code and NOC Portal."""
    def __init__(self):
        super().__init__(
            source_id="src-fire",
            name="State Fire Services Portal (QR code)",
            source_type="State Department Verification",
            supported_doc="NOC (Fire Safety) certificates",
            methods=["Encrypted QR Payload Decryption", "State e-Governance API", "Manual Verification Portal"]
        )

    def verify(self, reference: str, context: Optional[Dict[str, Any]] = None) -> VerificationResult:
        now = datetime.datetime.utcnow()
        # Simulated timeout reproduction for demo case F (FS/NOC/2021/04418)
        if "04418" in reference or "timeout" in reference.lower():
            return VerificationResult(
                source_id=self.source_id,
                source_name=self.source_name,
                verification_method="QR Link Resolving & HTTPS Verification (Simulated)",
                reference_checked=reference,
                status="Source unavailable",
                status_code="source_unavailable",
                timestamp=now,
                response_details="State Fire Services QR portal endpoint timed out after 3 retries (HTTP 504 Gateway Timeout). Retry queued for next batch cycle.",
                error_info="HTTP 504 Gateway Timeout: Endpoint https://fireservices.state.gov.in/verify unreachable.",
                is_simulated=True
            )
        elif "invalid" in reference.lower() or "fake" in reference.lower():
            return VerificationResult(
                source_id=self.source_id,
                source_name=self.source_name,
                verification_method="State e-Governance API (Simulated)",
                reference_checked=reference,
                status="Mismatch detected",
                status_code="mismatch_detected",
                timestamp=now,
                response_details="Certificate reference not found in State Fire Services registry database.",
                is_simulated=True
            )
        else:
            return VerificationResult(
                source_id=self.source_id,
                source_name=self.source_name,
                verification_method="State e-Governance API (Simulated)",
                reference_checked=reference,
                status="Verified",
                status_code="verified",
                timestamp=now,
                response_details="Certificate reference verified against State Fire Services registry. Validity confirmed.",
                is_simulated=True
            )

class LandRecordsModernizationAdapter(BaseVerificationAdapter):
    """Simulated adapter for National Land Records Modernization System."""
    def __init__(self):
        super().__init__(
            source_id="src-land",
            name="National Land Records Modernization System",
            source_type="Revenue & Land Registry",
            supported_doc="Land ownership deed, 7/12 extract, lease agreement",
            methods=["e-Dharani API", "Mahabhulekh REST Interface", "Digital India Land Record Modernization"]
        )

    def verify(self, reference: str, context: Optional[Dict[str, Any]] = None) -> VerificationResult:
        now = datetime.datetime.utcnow()
        if "pending" in reference.lower() or "00412" in (context or {}).get("app_id", ""):
            return VerificationResult(
                source_id=self.source_id,
                source_name=self.source_name,
                verification_method="Mahabhulekh Land Mutation Verification (Simulated)",
                reference_checked=reference or "Survey No 42/1A",
                status="Pending",
                status_code="pending",
                timestamp=now,
                response_details="Land records batch lookup scheduled. Awaiting verification sync with District Revenue Registry.",
                is_simulated=True
            )
        return VerificationResult(
            source_id=self.source_id,
            source_name=self.source_name,
            verification_method="Mahabhulekh Land Mutation Verification (Simulated)",
            reference_checked=reference or "REG/LND/2014/8834",
            status="Verified",
            status_code="verified",
            timestamp=now,
            response_details="Land ownership deed verified. Educational zoning and freehold title confirmed.",
            is_simulated=True
        )

class AccreditationAdapter(BaseVerificationAdapter):
    """Simulated adapter for NBA and NAAC accreditation status."""
    def __init__(self):
        super().__init__(
            source_id="src-accreditation",
            name="National Board of Accreditation / NAAC Portal",
            source_type="Accreditation Registry",
            supported_doc="Accreditation certificates for technical programmes",
            methods=["NBA National Data Repository", "NAAC Institutional Search API"]
        )

    def verify(self, reference: str, context: Optional[Dict[str, Any]] = None) -> VerificationResult:
        now = datetime.datetime.utcnow()
        return VerificationResult(
            source_id=self.source_id,
            source_name=self.source_name,
            verification_method="NBA Public Registry Lookup (Simulated)",
            reference_checked=reference or "NBA-TIER1-ENG-2024",
            status="Verified",
            status_code="verified",
            timestamp=now,
            response_details="Tier-1 accreditation verified through National Board of Accreditation records database.",
            is_simulated=True
        )

class DocumentForensicsAdapter(BaseVerificationAdapter):
    """Forensic metadata and cryptographic hash analyzer."""
    def __init__(self):
        super().__init__(
            source_id="src-metadata",
            name="Document Metadata & Forensics Analyzer",
            source_type="Cryptographic & PDF Forensics",
            supported_doc="All uploaded PDF and image evidence",
            methods=["PyMuPDF Struct Tree", "SHA-256 Bloom Filter", "EXIF Parser"]
        )

    def verify(self, reference: str, context: Optional[Dict[str, Any]] = None) -> VerificationResult:
        now = datetime.datetime.utcnow()
        context = context or {}
        has_suspicious = context.get("has_suspicious_metadata", False)
        creator_tag = context.get("creator_tag") or context.get("creator", "")
        has_canvas = context.get("has_canvas_tags", False)

        if has_suspicious or (creator_tag and "photoshop" in creator_tag.lower()) or has_canvas:
            return VerificationResult(
                source_id=self.source_id,
                source_name=self.source_name,
                verification_method="PDF Structural Forensics & Header Audit",
                reference_checked=reference or "PDF-HDR-TAG",
                status="Mismatch detected",
                status_code="mismatch_detected",
                timestamp=now,
                response_details=f"Raster image editor tag '{creator_tag}' discovered in document metadata. Flagged for officer review.",
                is_simulated=True
            )
        return VerificationResult(
            source_id=self.source_id,
            source_name=self.source_name,
            verification_method="PDF Structural Forensics & Header Audit",
            reference_checked=reference or "PDF-HDR-TAG",
            status="Verified",
            status_code="verified",
            timestamp=now,
            response_details="Metadata structure consistent with standard document scanner / print software.",
            is_simulated=True
        )

class VerificationAdapterRegistry:
    """Registry managing all simulated and external issuing authority adapters."""
    def __init__(self):
        self.adapters: Dict[str, BaseVerificationAdapter] = {
            "src-aicte": AICTECentralDbAdapter(),
            "src-fire": StateFireServicesAdapter(),
            "src-land": LandRecordsModernizationAdapter(),
            "src-accreditation": AccreditationAdapter(),
            "src-metadata": DocumentForensicsAdapter()
        }

    def get_all_sources(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": a.source_id,
                "name": a.source_name,
                "source_type": a.source_type,
                "supported_doc": a.supported_doc,
                "integration_mode": a.integration_mode,
                "status": "Verified against source",
                "last_checked_at": datetime.datetime.utcnow(),
                "details": f"Deterministic adapter connected in {a.integration_mode} mode.",
                "methods": a.methods
            }
            for a in self.adapters.values()
        ]

    def query_source(self, source_id: str, identifier: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        adapter = self.adapters.get(source_id)
        if not adapter:
            return {
                "source_id": source_id,
                "source_name": "Unknown Authority",
                "verification_method": "Unknown",
                "reference_checked": identifier,
                "status": "Not configured",
                "status_code": "not_configured",
                "timestamp": datetime.datetime.utcnow(),
                "response_details": f"No verification adapter registered for source ID '{source_id}'.",
                "error_info": f"Unregistered source ID: {source_id}",
                "is_simulated": True
            }

        result = adapter.verify(identifier, context)
        return result.to_dict()

verification_adapters = VerificationAdapterRegistry()
