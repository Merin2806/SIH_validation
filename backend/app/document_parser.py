import hashlib
import os
import shutil
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import fitz  # PyMuPDF
from PIL import Image

def calculate_sha256(file_path: str) -> str:
    """Calculate SHA-256 hash of a file for exact duplicate detection."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def check_ocr_available() -> Tuple[bool, str]:
    """Check if Tesseract OCR executable is available on the host system."""
    try:
        import pytesseract
        # Try checking tesseract_cmd or PATH
        tess_path = shutil.which("tesseract")
        if tess_path:
            return True, tess_path
        pytesseract.get_tesseract_version()
        return True, "pytesseract configured"
    except Exception as e:
        return False, f"Tesseract OCR not installed or not in system PATH ({str(e)})"

def extract_pdf_data(file_path: str) -> Dict[str, Any]:
    """
    Extract text, page count, and PDF metadata using PyMuPDF.
    Detects editor software tags in metadata (e.g. Adobe Photoshop, Canva, GIMP).
    """
    result = {
        "text": "",
        "page_count": 1,
        "metadata": {},
        "has_suspicious_metadata": False,
        "creator_tag": None,
        "producer_tag": None,
        "language_hints": ["English"]
    }

    try:
        doc = fitz.open(file_path)
        result["page_count"] = len(doc)
        
        all_text = []
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text()
            all_text.append(text)
        
        full_text = "\n".join(all_text)
        result["text"] = full_text

        # Extract metadata
        meta = doc.metadata or {}
        result["metadata"] = meta
        creator = meta.get("creator", "")
        producer = meta.get("producer", "")
        result["creator_tag"] = creator
        result["producer_tag"] = producer

        # Check for image editor tags in metadata
        suspicious_keywords = ["photoshop", "gimp", "canva", "illustrator", "paint", "pixlr"]
        for kw in suspicious_keywords:
            if kw in (creator or "").lower() or kw in (producer or "").lower():
                result["has_suspicious_metadata"] = True
                break

        # Check language script
        devanagari_count = sum(1 for char in full_text if '\u0900' <= char <= '\u097F')
        if devanagari_count > 20:
            if any(w in full_text for w in ["महाराष्ट्र", "जमीन", "खरेदीखत", "सातबारा", "नोंद"]):
                result["language_hints"] = ["Marathi", "English"]
            else:
                result["language_hints"] = ["Hindi", "English"]

        doc.close()
    except Exception as e:
        result["error"] = str(e)

    return result

def classify_document_type(text: str, filename: str) -> str:
    """Heuristic classifier for technical institution application documents."""
    text_lower = text.lower()
    fn_lower = filename.lower()

    if "fire" in fn_lower or "fire" in text_lower or "no objection certificate" in text_lower or "fire safety" in text_lower:
        return "NOC (Fire)"
    if "affidavit" in fn_lower or "affidavit" in text_lower or "notar" in text_lower or "undertaking" in text_lower:
        return "Affidavit"
    if "accreditation" in fn_lower or "naac" in text_lower or "nba" in text_lower or "accredit" in text_lower:
        return "Accreditation"
    if "land" in fn_lower or "deed" in text_lower or "khasra" in text_lower or "ownership" in text_lower or "khata" in text_lower:
        return "Land document"
    if "floor" in fn_lower or "plan" in fn_lower or "blueprint" in text_lower or "layout" in text_lower or "lab_block" in fn_lower:
        return "Floor plan"
    if "photo" in fn_lower or "infra" in fn_lower or fn_lower.endswith(('.jpg', '.jpeg', '.png')):
        return "Floor plan" if "floor" in fn_lower else "Infrastructure photographs"
    if "eoa" in fn_lower or "extension of approval" in text_lower or "application letter" in text_lower:
        return "Application letter"

    return "Application letter"
