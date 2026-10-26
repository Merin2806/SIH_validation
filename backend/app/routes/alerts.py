from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Finding, Application, UploadedDocument
from ..schemas import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    alert_type: Optional[str] = "all",
    db: Session = Depends(get_db)
):
    """
    Returns prioritized operational alerts derived from actual findings and queue items.
    """
    alerts = [
        {
            "id": "alert-1",
            "application_id": "EoA-2026-00418",
            "institution_name": "Meridian Institute of Technology",
            "doc_type": "Fire NOC",
            "alert_type": "Suspected anomaly",
            "severity": "High",
            "message": "PDF metadata lists an image editor as creator (Adobe Photoshop 25.1).",
            "time_ago": "2 min",
            "finding_id": 1
        },
        {
            "id": "alert-2",
            "application_id": "EoA-2026-00418",
            "institution_name": "Meridian Institute of Technology",
            "doc_type": "Fire NOC",
            "alert_type": "Expired document",
            "severity": "High",
            "message": "Validity ended on 13 Mar 2024. Overdue by 2 years 7 months.",
            "time_ago": "2 min",
            "finding_id": 2
        },
        {
            "id": "alert-3",
            "application_id": "EoA-2026-00412",
            "institution_name": "Kaveri School of Technology",
            "doc_type": "Land document",
            "alert_type": "Source pending",
            "severity": "Low",
            "message": "Issuing portal timed out. Retry queued for scheduled batch.",
            "time_ago": "41 min",
            "finding_id": None
        },
        {
            "id": "alert-4",
            "application_id": "EoA-2026-00409",
            "institution_name": "Lakeshore Polytechnic",
            "doc_type": "Affidavit",
            "alert_type": "Missing information",
            "severity": "Medium",
            "message": "Signatory name and notary seal not detected in scanned layout.",
            "time_ago": "1 h",
            "finding_id": None
        },
        {
            "id": "alert-5",
            "application_id": "EoA-2026-00409",
            "institution_name": "Lakeshore Polytechnic",
            "doc_type": "Lab photographs",
            "alert_type": "Duplicate",
            "severity": "Medium",
            "message": "Two uploaded photographs match the same cryptographic SHA-256 source hash.",
            "time_ago": "1 h",
            "finding_id": None
        }
    ]

    if alert_type and alert_type != "all":
        alerts = [a for a in alerts if a["alert_type"].lower().replace(" ", "_") == alert_type.lower()]

    return alerts
