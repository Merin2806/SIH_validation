from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import VerificationSource
from ..schemas import VerificationSourceOut
from ..verification_adapters import verification_adapters

router = APIRouter(prefix="/api/sources", tags=["Issuing Authorities"])

@router.get("", response_model=List[VerificationSourceOut])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(VerificationSource).all()
    if not sources:
        # Fallback to in-memory registry
        return verification_adapters.get_all_sources()
    return sources

@router.post("/{source_id}/test")
def test_source_connection(source_id: str, identifier: str = Query("FS/NOC/2021/04418")):
    result = verification_adapters.query_source(source_id, identifier)
    return result
