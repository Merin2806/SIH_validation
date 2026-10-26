from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import AuditEvent
from ..schemas import AuditEventOut

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditEventOut])
def list_audit_events(
    application_id: Optional[str] = None,
    actor: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)

    if application_id:
        query = query.filter(AuditEvent.application_id == application_id)
    if actor:
        query = query.filter(AuditEvent.actor.ilike(f"%{actor}%"))
    if q:
        search = f"%{q}%"
        query = query.filter(
            (AuditEvent.action.ilike(search)) |
            (AuditEvent.details.ilike(search)) |
            (AuditEvent.application_id.ilike(search))
        )

    events = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return events
