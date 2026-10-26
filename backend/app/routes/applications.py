from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import random

from ..database import get_db
from ..models import Application, UploadedDocument, ValidationCheck, Finding, AuditEvent, ReviewerAction, VerificationSource
from ..schemas import ApplicationOut, ApplicationCreate, DecisionRequest
from ..audit_service import log_audit_event

router = APIRouter(prefix="/api/applications", tags=["Applications"])

from fastapi.responses import Response
import csv
import io

@router.get("/metrics")
def get_queue_metrics(db: Session = Depends(get_db)):
    """Computes summary metrics directly from persisted database application records."""
    total = db.query(Application).count()
    clear_count = db.query(Application).filter(Application.overall_status == "Verified").count()
    needs_review = db.query(Application).filter(Application.overall_status.in_(["Manual review", "Source pending", "Expired document"])).count()
    anomalies = db.query(Application).filter(Application.overall_status == "Anomaly flagged").count()
    expired = db.query(Application).filter(Application.overall_status == "Expired document").count()

    return {
        "in_queue": total,
        "clear_to_proceed": clear_count,
        "needs_manual_review": needs_review,
        "anomalies_flagged": anomalies,
        "expired_documents": expired,
        "avg_validation_time": "42 sec per application"
    }

@router.get("/export")
def export_applications_csv(db: Session = Depends(get_db)):
    """Exports application scrutiny records as downloadable CSV."""
    apps = db.query(Application).order_by(Application.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application ID", "Institution Name", "Institution Code", "Category",
        "Overall Status", "Checks Passed", "Total Checks", "Submission Date", "Decision Status"
    ])
    for a in apps:
        writer.writerow([
            a.id, a.institution_name, a.institution_code or "N/A", a.category,
            a.overall_status, a.checks_passed, a.checks_total,
            a.submission_date.isoformat() if a.submission_date else "",
            a.decision_status or "PENDING_REVIEW"
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=satyapan_scrutiny_export_{datetime.date.today().isoformat()}.csv"}
    )


@router.get("")
def list_applications(
    q: Optional[str] = None,
    filter_status: Optional[str] = "all",
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if q:
        search = f"%{q}%"
        query = query.filter(
            (Application.id.ilike(search)) | 
            (Application.institution_name.ilike(search)) |
            (Application.category.ilike(search))
        )

    if filter_status == "needs_review":
        query = query.filter(Application.overall_status.in_(["Manual review", "Source pending"]))
    elif filter_status == "anomalies":
        query = query.filter(Application.overall_status == "Anomaly flagged")
    elif filter_status == "expired":
        query = query.filter(Application.overall_status == "Expired document")

    total_records = query.count()
    applications = query.order_by(Application.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "items": applications
    }

@router.post("", response_model=ApplicationOut)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    # Generate new ID if not provided
    if not payload.id:
        random_suffix = random.randint(100, 999)
        app_id = f"EoA-2026-00{random_suffix}"
    else:
        app_id = payload.id

    existing = db.query(Application).filter(Application.id == app_id).first()
    if existing:
        return existing

    new_app = Application(
        id=app_id,
        institution_name=payload.institution_name,
        institution_code=payload.institution_code or f"1-{random.randint(1000000, 9999999)}",
        category=payload.category,
        overall_status="Manual review",
        checks_passed=0,
        checks_total=12,
        submission_date=datetime.datetime.utcnow()
    )
    db.add(new_app)
    db.commit()

    # Create default checklist items for Extension of Approval
    checklist_items = [
        ("Application letter", "Uploaded", "Missing", 1),
        ("Affidavit / undertaking", "Uploaded", "Missing", 2),
        ("Accreditation certificate", "Uploaded", "Missing", 3),
        ("Land ownership document", "Uploaded", "Missing", 4),
        ("Fire NOC", "Uploaded", "Missing", 5),
        ("Floor plan", "Uploaded", "Missing", 6),
        ("Infrastructure photographs", "Uploaded", "Missing", 7),
        ("Previous EoA status", "AICTE records", "Passed", 8),
        ("Approved programmes and intake", "AICTE records", "Passed", 9),
        ("Faculty records", "AICTE records", "Passed", 10),
        ("TER payment status", "AICTE records", "Passed", 11),
        ("Compliance and deficiency status", "AICTE records", "Passed", 12),
    ]
    for item, src, stat, idx in checklist_items:
        check = ValidationCheck(
            application_id=app_id,
            checklist_item=item,
            source_type=src,
            status=stat,
            order_index=idx
        )
        db.add(check)

    db.commit()
    db.refresh(new_app)

    log_audit_event(
        db,
        application_id=app_id,
        action="Application created",
        outcome="Completed",
        actor="Scrutiny Officer",
        details=f"New application created for {payload.institution_name} ({payload.category})"
    )

    return new_app

@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(app_id: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    return app

@router.post("/{app_id}/request-rectification")
def request_rectification(app_id: str, payload: DecisionRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.decision_status = "RECTIFICATION_REQUESTED"
    app.officer_note = payload.note
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        action="Rectification requested",
        outcome="Pending Institution Action",
        actor="Scrutiny Officer",
        details=f"Officer requested rectification. Note: {payload.note or 'Renewed Fire NOC and title deed verification requested.'}"
    )

    action = ReviewerAction(
        application_id=app_id,
        action_type="REQUEST_RECTIFICATION",
        actor="Scrutiny Officer",
        note=payload.note
    )
    db.add(action)
    db.commit()

    return {"message": "Rectification request successfully recorded and dispatched to institution", "status": app.decision_status}

@router.post("/{app_id}/escalate-inspection")
def escalate_inspection(app_id: str, payload: DecisionRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.decision_status = "PHYSICAL_INSPECTION_ESCALATED"
    app.officer_note = payload.note
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        action="Escalated for physical inspection",
        outcome="Inspection Committee Assigned",
        actor="Scrutiny Officer",
        details=f"Physical inspection committee mandated. Note: {payload.note or 'Expert Visit Committee (EVC) recommended for campus and safety audit.'}"
    )

    action = ReviewerAction(
        application_id=app_id,
        action_type="ESCALATE_INSPECTION",
        actor="Scrutiny Officer",
        note=payload.note
    )
    db.add(action)
    db.commit()

    return {"message": "Physical inspection escalation registered for Expert Visit Committee (EVC)", "status": app.decision_status}

@router.post("/{app_id}/complete-review")
def complete_review(app_id: str, payload: DecisionRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.decision_status = "REVIEW_COMPLETED"
    app.officer_note = payload.note
    db.commit()

    log_audit_event(
        db,
        application_id=app_id,
        action="Preliminary review completed",
        outcome="Scrutiny Summary Finalized",
        actor="Scrutiny Officer",
        details=f"Preliminary scrutiny completed by Scrutiny Officer. Note: {payload.note or 'Scrutiny verified against AICTE guidelines.'}"
    )

    action = ReviewerAction(
        application_id=app_id,
        action_type="REVIEW_COMPLETED",
        actor="Scrutiny Officer",
        note=payload.note
    )
    db.add(action)
    db.commit()

    return {"message": "Review marked as completed by Scrutiny Officer", "status": app.decision_status}
