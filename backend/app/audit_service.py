import datetime
from sqlalchemy.orm import Session
from .models import AuditEvent

def log_audit_event(
    db: Session,
    application_id: str,
    action: str,
    outcome: str,
    actor: str = "System Scrutiny Engine",
    evidence_ref: str = None,
    source_mode: str = "SIMULATED",
    details: str = None
) -> AuditEvent:
    """Logs an immutable, chronological audit trail entry into SQLite."""
    event = AuditEvent(
        application_id=application_id,
        timestamp=datetime.datetime.utcnow(),
        actor=actor,
        action=action,
        outcome=outcome,
        evidence_ref=evidence_ref,
        source_mode=source_mode,
        details=details
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
