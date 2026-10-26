from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
from ..database import get_db
from ..models import ValidationRule
from ..schemas import ValidationRuleOut, RuleToggleRequest, RuleCreateRequest

router = APIRouter(prefix="/api/rules", tags=["Validation Rules"])

@router.get("", response_model=List[ValidationRuleOut])
def list_rules(db: Session = Depends(get_db)):
    return db.query(ValidationRule).all()

from ..audit_service import log_audit_event

@router.post("/{rule_id}/toggle")
def toggle_rule(rule_id: str, payload: RuleToggleRequest, db: Session = Depends(get_db)):
    rule = db.query(ValidationRule).filter(ValidationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    old_state = rule.is_active
    rule.is_active = payload.is_active
    rule.updated_at = datetime.datetime.utcnow()
    db.commit()

    log_audit_event(
        db,
        application_id="GLOBAL_CONFIG",
        action=f"Rule {rule.code} {'enabled' if payload.is_active else 'disabled'}",
        outcome="Updated",
        actor="Scrutiny Administrator",
        details=f"Regulatory rule '{rule.name}' ({rule.code}) toggled from {old_state} to {payload.is_active}."
    )
    return {"message": f"Rule {rule_id} status updated to {payload.is_active}", "rule": rule}

@router.post("", response_model=ValidationRuleOut)
def create_rule(payload: RuleCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(ValidationRule).filter(ValidationRule.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rule code already exists")

    new_rule = ValidationRule(
        id=payload.code,
        code=payload.code,
        category=payload.category,
        name=payload.name,
        description=payload.description,
        required_evidence=payload.required_evidence,
        severity=payload.severity,
        is_active=True,
        version="v1.0",
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule
