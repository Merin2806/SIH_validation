import datetime
from typing import Dict, Any, Optional

class VerificationAdapterRegistry:
    """
    Adapter registry for querying external verification authorities.
    Returns deterministic results based on record contents,
    explicitly tagged with SIMULATED integration mode.
    """

    SOURCES = [
        {
            "id": "src-aicte",
            "name": "AICTE Central Institutional Database",
            "source_type": "Central Regulatory Repository",
            "supported_doc": "Institutional details, approved intake, previous EoA, faculty rolls",
            "integration_mode": "SIMULATED",
            "status": "Mismatch detected",
            "last_checked_at": datetime.datetime(2026, 10, 26, 15, 2, 11),
            "details": "Queried institution record ID AICTE-INST-00418. Found discrepancy in institute title.",
            "methods": ["REST API v3", "OAS 3.0 Webhook", "Direct Sync"]
        },
        {
            "id": "src-fire",
            "name": "State Fire Services Portal (QR code)",
            "source_type": "State Department Verification",
            "supported_doc": "NOC (Fire Safety) certificates",
            "integration_mode": "SIMULATED",
            "status": "Source unavailable",
            "last_checked_at": datetime.datetime(2026, 10, 26, 15, 3, 4),
            "details": "QR scan endpoint https://fireservices.state.gov.in/verify timed out after 3 retries.",
            "methods": ["Encrypted QR Payload Decryption", "State e-Governance API", "Manual Verification Portal"]
        },
        {
            "id": "src-metadata",
            "name": "Document Metadata & Forensics Analyzer",
            "source_type": "Cryptographic & PDF Forensics",
            "supported_doc": "All uploaded PDF and image evidence",
            "integration_mode": "SIMULATED",
            "status": "Manual review required",
            "last_checked_at": datetime.datetime(2026, 10, 26, 15, 3, 9),
            "details": "Discovered Photoshop creator tag and quantization table inconsistency.",
            "methods": ["PyMuPDF Struct Tree", "SHA-256 Bloom Filter", "EXIF Parser"]
        },
        {
            "id": "src-land",
            "name": "National Land Records Modernization System",
            "source_type": "Revenue & Land Registry",
            "supported_doc": "Land ownership deed, 7/12 extract, lease agreement",
            "integration_mode": "SIMULATED",
            "status": "Verification pending",
            "last_checked_at": datetime.datetime(2026, 10, 26, 14, 21, 0),
            "details": "Request queued in scheduled state land record batch verification.",
            "methods": ["e-Dharani API", "Mahabhulekh REST Interface", "Digital India Land Record Modernization"]
        },
        {
            "id": "src-accreditation",
            "name": "National Board of Accreditation / NAAC Portal",
            "source_type": "Accreditation Registry",
            "supported_doc": "Accreditation certificates for technical programmes",
            "integration_mode": "SIMULATED",
            "status": "Verified against source",
            "last_checked_at": datetime.datetime(2026, 10, 26, 14, 15, 30),
            "details": "Programmes accredited for 3 years (Tier-1) verified through NBA public portal.",
            "methods": ["NBA National Data Repository", "NAAC Institutional Search API"]
        }
    ]

    @classmethod
    def get_all_sources(cls):
        return cls.SOURCES

    @classmethod
    def query_source(cls, source_id: str, identifier: str) -> Dict[str, Any]:
        """Deterministic simulated query based on document reference."""
        now = datetime.datetime.utcnow()
        if source_id == "src-fire":
            if "04418" in identifier:
                return {
                    "source_id": source_id,
                    "status": "Source unavailable",
                    "returned_identifier": identifier,
                    "is_simulated": True,
                    "response_details": "State Fire Services Portal connection timed out (HTTP 504).",
                    "timestamp": now
                }
            return {
                "source_id": source_id,
                "status": "Verified against source",
                "returned_identifier": identifier,
                "is_simulated": True,
                "response_details": "Fire safety certificate valid through current session.",
                "timestamp": now
            }
        elif source_id == "src-aicte":
            return {
                "source_id": source_id,
                "status": "Mismatch detected",
                "returned_identifier": identifier,
                "is_simulated": True,
                "response_details": "Mismatch: submitted document contains '& Research' not present in AICTE master record.",
                "timestamp": now
            }
        else:
            return {
                "source_id": source_id,
                "status": "Verified against source",
                "returned_identifier": identifier,
                "is_simulated": True,
                "response_details": "Record matched in synthetic registry.",
                "timestamp": now
            }

verification_adapters = VerificationAdapterRegistry()
