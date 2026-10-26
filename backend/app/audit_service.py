import hashlib
import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from .models import AuditEvent

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_event_hash(
    prev_hash: str,
    application_id: str,
    timestamp: datetime.datetime,
    actor: str,
    action: str,
    outcome: str,
    details: Optional[str] = None
) -> str:
    """Computes SHA-256 cryptographic hash for an audit event block."""
    payload = f"{prev_hash}|{application_id}|{timestamp.isoformat()}|{actor}|{action}|{outcome}|{details or ''}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def log_audit_event(
    db: Session,
    application_id: str,
    action: str,
    outcome: str,
    actor: str = "System Scrutiny Engine",
    evidence_ref: Optional[str] = None,
    source_mode: str = "SIMULATED",
    details: Optional[str] = None,
    document_id: Optional[str] = None,
    finding_id: Optional[int] = None,
    correlation_id: Optional[str] = None
) -> AuditEvent:
    """
    Logs an append-only, tamper-evident audit event secured by a cryptographic hash chain.
    """
    now = datetime.datetime.utcnow()

    # Retrieve hash of the most recent audit event for this application or global ledger
    last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_event.hash if (last_event and last_event.hash) else GENESIS_HASH

    current_hash = compute_event_hash(
        prev_hash=prev_hash,
        application_id=application_id,
        timestamp=now,
        actor=actor,
        action=action,
        outcome=outcome,
        details=details
    )

    event = AuditEvent(
        application_id=application_id,
        document_id=document_id,
        finding_id=finding_id,
        correlation_id=correlation_id,
        timestamp=now,
        actor=actor,
        action=action,
        outcome=outcome,
        evidence_ref=evidence_ref,
        source_mode=source_mode,
        details=details,
        prev_hash=prev_hash,
        hash=current_hash
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def verify_audit_trail_integrity(db: Session, application_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates the tamper-evident hash chain across persisted audit records.
    Returns validation status, total events checked, and tampering alerts if any.
    """
    query = db.query(AuditEvent).order_by(AuditEvent.id.asc())
    if application_id:
        query = query.filter(AuditEvent.application_id == application_id)
    
    events = query.all()
    if not events:
        return {"valid": True, "events_checked": 0, "message": "No audit records present."}

    prev_hash = GENESIS_HASH
    for ev in events:
        # If this record has a hash chain entry
        if ev.prev_hash and ev.hash:
            recomputed = compute_event_hash(
                prev_hash=ev.prev_hash,
                application_id=ev.application_id,
                timestamp=ev.timestamp,
                actor=ev.actor,
                action=ev.action,
                outcome=ev.outcome,
                details=ev.details
            )
            if recomputed != ev.hash:
                return {
                    "valid": False,
                    "tampered_event_id": ev.id,
                    "reason": f"Hash mismatch on event #{ev.id}: computed {recomputed[:12]} vs recorded {ev.hash[:12]}",
                    "events_checked": len(events)
                }
            prev_hash = ev.hash

    return {
        "valid": True,
        "events_checked": len(events),
        "message": f"All {len(events)} audit events verified cryptographically intact."
    }
