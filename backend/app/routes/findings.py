from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Finding, ReviewerAction
from ..schemas import FindingActionRequest
from ..audit_service import log_audit_event

router = APIRouter(prefix="/api/findings", tags=["Findings"])

@router.post("/{finding_id}/confirm")
def confirm_finding(finding_id: int, payload: FindingActionRequest, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.confirmed_by_reviewer = True
    finding.dismissed_by_reviewer = False
    finding.reviewer_note = payload.note or "Confirmed by Scrutiny Officer"
    db.commit()

    log_audit_event(
        db,
        application_id=finding.application_id,
        action=f"Finding confirmed: {finding.title}",
        outcome="Confirmed by Officer",
        actor="Scrutiny Officer",
        evidence_ref=f"Finding #{finding.finding_number}",
        details=f"Reviewer confirmed preliminary flag. Note: {finding.reviewer_note}"
    )

    action = ReviewerAction(
        application_id=finding.application_id,
        action_type="CONFIRM_FINDING",
        finding_id=finding_id,
        actor="Scrutiny Officer",
        note=finding.reviewer_note
    )
    db.add(action)
    db.commit()

    return {"message": "Finding successfully confirmed", "finding_id": finding_id, "status": "confirmed"}

@router.post("/{finding_id}/dismiss")
def dismiss_finding(finding_id: int, payload: FindingActionRequest, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if not payload.note or len(payload.note.strip()) == 0:
        raise HTTPException(status_code=400, detail="Mandatory reviewer reason required to dismiss an automated finding.")

    finding.confirmed_by_reviewer = False
    finding.dismissed_by_reviewer = True
    finding.reviewer_note = payload.note
    db.commit()

    log_audit_event(
        db,
        application_id=finding.application_id,
        action=f"Finding dismissed: {finding.title}",
        outcome="Dismissed with Justification",
        actor="Scrutiny Officer",
        evidence_ref=f"Finding #{finding.finding_number}",
        details=f"Reviewer dismissed preliminary flag. Justification: {payload.note}"
    )

    action = ReviewerAction(
        application_id=finding.application_id,
        action_type="DISMISS_FINDING",
        finding_id=finding_id,
        actor="Scrutiny Officer",
        note=payload.note
    )
    db.add(action)
    db.commit()

    return {"message": "Finding dismissed with recorded justification", "finding_id": finding_id, "status": "dismissed"}
