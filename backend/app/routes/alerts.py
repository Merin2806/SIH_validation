import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Finding, Application, UploadedDocument
from ..schemas import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

def format_time_ago(dt: Optional[datetime.datetime]) -> str:
    if not dt:
        return "recently"
    now = datetime.datetime.utcnow()
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return f"{max(1, seconds)} sec"
    elif seconds < 3600:
        return f"{seconds // 60} min"
    elif seconds < 86400:
        return f"{seconds // 3600} h"
    else:
        return f"{seconds // 86400} d"

@router.get("", response_model=List[AlertOut])
def list_alerts(
    alert_type: Optional[str] = "all",
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns prioritized operational alerts dynamically derived from persisted database
    findings, anomalies, duplicate checks, and unverified authority sources.
    """
    alerts = []
    
    # 1. Fetch active findings (not dismissed by reviewer)
    findings_query = db.query(Finding).filter(Finding.dismissed_by_reviewer == False)
    if severity and severity.lower() != "all":
        findings_query = findings_query.filter(Finding.severity.ilike(severity))
    
    findings = findings_query.order_by(Finding.created_at.desc()).all()

    for f in findings:
        app = db.query(Application).filter(Application.id == f.application_id).first()
        inst_name = app.institution_name if app else "Unknown Institution"

        doc = db.query(UploadedDocument).filter(UploadedDocument.id == f.document_id).first() if f.document_id else None
        doc_type = doc.detected_type if doc else "Document"

        # Determine alert type label
        if "metadata" in (f.rule_name or "").lower() or "alteration" in f.title.lower() or f.category == "Document Forensics":
            mapped_type = "Suspected anomaly"
        elif f.status == "Expired" or "validity" in f.title.lower():
            mapped_type = "Expired document"
        elif f.status == "Source unavailable" or "authority" in f.title.lower():
            mapped_type = "Source pending"
        elif "missing" in f.title.lower() or f.status == "Missing information":
            mapped_type = "Missing information"
        elif "duplicate" in f.title.lower():
            mapped_type = "Duplicate"
        else:
            mapped_type = "Suspected anomaly" if f.severity == "High" else "Mismatch detected"

        alerts.append({
            "id": f"alert-f{f.id}",
            "application_id": f.application_id,
            "institution_name": inst_name,
            "doc_type": doc_type,
            "alert_type": mapped_type,
            "severity": f.severity,
            "message": f.why_flagged[:160] + ("..." if len(f.why_flagged) > 160 else ""),
            "time_ago": format_time_ago(f.created_at),
            "finding_id": f.id
        })

    # 2. Fetch duplicate documents that might not have a direct finding yet
    duplicates = db.query(UploadedDocument).filter(
        UploadedDocument.is_duplicate == True
    ).all()
    for d in duplicates:
        # Check if already added via finding
        if any(a["application_id"] == d.application_id and a["alert_type"] == "Duplicate" for a in alerts):
            continue
        app = db.query(Application).filter(Application.id == d.application_id).first()
        alerts.append({
            "id": f"alert-dup-{d.id}",
            "application_id": d.application_id,
            "institution_name": app.institution_name if app else "Unknown Institution",
            "doc_type": d.detected_type,
            "alert_type": "Duplicate",
            "severity": "Medium",
            "message": f"Document '{d.filename}' matches identical cryptographic SHA-256 content hash of document {d.duplicate_of_id}.",
            "time_ago": format_time_ago(d.created_at),
            "finding_id": None
        })

    # Apply alert_type filter
    if alert_type and alert_type != "all":
        clean_filter = alert_type.lower().replace("_", " ").strip()
        alerts = [
            a for a in alerts 
            if a["alert_type"].lower() == clean_filter or clean_filter in a["alert_type"].lower()
        ]

    return alerts
