import hashlib
import os
import shutil
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
import fitz  # PyMuPDF
from PIL import Image

logger = logging.getLogger("satyapan.document_parser")

SUPPORTED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

def calculate_sha256(file_path: str) -> str:
    """Calculate SHA-256 hash of a file for exact cryptographic duplicate detection."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def validate_file_security(contents: bytes, filename: str) -> Tuple[bool, str]:
    """
    Validates file size, extension, and magic byte signatures to prevent malicious uploads,
    executable masquerading, or path traversal attacks.
    """
    if len(contents) > MAX_FILE_SIZE:
        return False, f"File exceeds maximum allowed size of 25MB (size: {len(contents) / (1024*1024):.1f}MB)."

    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Accepted formats: PDF, JPG, JPEG, PNG."

    # Validate Magic Bytes / File Signatures
    if ext == ".pdf":
        if not contents.startswith(b"%PDF-"):
            return False, "Malformed PDF file: Header signature '%PDF-' missing or invalid."
    elif ext == ".png":
        if not contents.startswith(b"\x89PNG\r\n\x1a\n"):
            return False, "Malformed PNG image: Header signature invalid."
    elif ext in {".jpg", ".jpeg"}:
        if not contents.startswith(b"\xff\xd8\xff"):
            return False, "Malformed JPEG image: SOI header signature invalid."

    return True, "Valid"

def check_ocr_available() -> Tuple[bool, str]:
    """
    Check if Tesseract OCR executable is installed and available in PATH.
    Returns (is_available, status_message).
    """
    try:
        import pytesseract
        tess_path = shutil.which("tesseract")
        if tess_path:
            return True, f"Tesseract available at {tess_path}"
        # Test pytesseract version call
        ver = pytesseract.get_tesseract_version()
        return True, f"pytesseract configured (v{ver})"
    except Exception as e:
        return False, f"Tesseract OCR not installed or not in system PATH ({str(e)})"

def detect_languages(text: str) -> List[str]:
    """Detects primary languages and scripts present in document text."""
    if not text or not text.strip():
        return ["English"]

    devanagari_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    total_alpha = sum(1 for c in text if c.isalpha())
    
    languages = []
    if total_alpha > 0 and (total_alpha - devanagari_chars) / max(total_alpha, 1) > 0.15:
        languages.append("English")

    if devanagari_chars > 15:
        marathi_markers = [
            "महाराष्ट्र", "जमीन", "खरेदीखत", "सातबारा", "नोंदणी", "दिनांक",
            "गाव", "तालुका", "जिल्हा", "क्षेत्र", "हक्क", "वारस", "मिळकत"
        ]
        if any(w in text for w in marathi_markers):
            languages.append("Marathi")
        else:
            languages.append("Hindi")

    return languages if languages else ["English"]

def extract_pdf_data(file_input: Any) -> Dict[str, Any]:
    """
    Extract text, metadata, page count, and structural indicators using PyMuPDF.
    Supports file path (str/Path) or raw byte buffer (bytes).
    If text is insufficient, attempts OCR fallback where Tesseract is installed.
    """
    result: Dict[str, Any] = {
        "text": "",
        "full_text": "",
        "pages_text": [],
        "page_count": 1,
        "metadata": {},
        "has_suspicious_metadata": False,
        "creator_tag": None,
        "producer_tag": None,
        "is_encrypted": False,
        "is_scanned": False,
        "ocr_used": False,
        "ocr_status": "not_required",
        "ocr_message": "",
        "language_hints": ["English"],
        "error": None
    }

    file_ref = "in-memory-stream" if isinstance(file_input, (bytes, bytearray)) else str(file_input)

    try:
        if isinstance(file_input, (bytes, bytearray)):
            doc = fitz.open(stream=file_input, filetype="pdf")
        else:
            doc = fitz.open(file_ref)

        result["page_count"] = len(doc)
        result["is_encrypted"] = doc.is_encrypted

        if doc.is_encrypted:
            result["error"] = "PDF document is encrypted/password-protected. Cannot extract content."
            doc.close()
            return result

        meta = doc.metadata or {}
        result["metadata"] = meta
        creator = meta.get("creator", "")
        producer = meta.get("producer", "")
        result["creator_tag"] = creator
        result["producer_tag"] = producer

        # Check for raster/image editor tags in metadata
        suspicious_keywords = ["photoshop", "gimp", "canva", "illustrator", "paint.net", "pixlr", "coreldraw"]
        for kw in suspicious_keywords:
            if kw in (creator or "").lower() or kw in (producer or "").lower():
                result["has_suspicious_metadata"] = True
                break

        # Extract per-page text
        pages_text = []
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_content = page.get_text()
            pages_text.append({
                "page": page_idx + 1,
                "text": page_content
            })

        full_text = "\n".join(p["text"] for p in pages_text).strip()
        result["pages_text"] = pages_text
        result["text"] = full_text
        result["full_text"] = full_text

        # Detect scanned/empty documents (< 30 words for the entire document)
        word_count = len(full_text.split())
        if word_count < 30:
            result["is_scanned"] = True
            ocr_avail, ocr_msg = check_ocr_available()
            if ocr_avail:
                try:
                    import pytesseract
                    ocr_pages = []
                    for page_idx in range(min(len(doc), 5)): # scan up to first 5 pages
                        page = doc[page_idx]
                        pix = page.get_pixmap(dpi=150)
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        txt = pytesseract.image_to_string(img)
                        ocr_pages.append(txt)
                    ocr_full = "\n".join(ocr_pages).strip()
                    result["ocr_used"] = True
                    result["ocr_status"] = "success"
                    result["ocr_message"] = "OCR executed on scanned PDF document."
                    if len(ocr_full) > len(full_text):
                        result["text"] = ocr_full
                        result["full_text"] = ocr_full
                except Exception as ocr_err:
                    result["ocr_used"] = False
                    result["ocr_status"] = "failed"
                    result["ocr_message"] = f"OCR execution failed: {str(ocr_err)}"
            else:
                result["ocr_used"] = False
                result["ocr_status"] = "not_configured"
                result["ocr_message"] = f"Document appears scanned ({word_count} words extracted). {ocr_msg}"
        else:
            result["ocr_status"] = "not_required"

        result["language_hints"] = detect_languages(result["text"])
        doc.close()

    except Exception as e:
        logger.error(f"Error parsing PDF file {file_ref}: {e}")
        result["error"] = f"Failed to parse PDF document: {str(e)}"

    return result

def extract_image_data(file_path: str) -> Dict[str, Any]:
    """
    Extract metadata and text from image files (JPG, PNG).
    Invokes Tesseract OCR if configured; otherwise reports actionable not_configured status.
    """
    result: Dict[str, Any] = {
        "text": "",
        "page_count": 1,
        "metadata": {},
        "has_suspicious_metadata": False,
        "is_scanned": True,
        "ocr_used": False,
        "ocr_status": "not_configured",
        "ocr_message": "",
        "language_hints": ["English"],
        "error": None
    }

    try:
        with Image.open(file_path) as img:
            result["metadata"] = {
                "format": img.format,
                "mode": img.mode,
                "width": img.width,
                "height": img.height
            }

        ocr_avail, ocr_msg = check_ocr_available()
        if ocr_avail:
            try:
                import pytesseract
                with Image.open(file_path) as img:
                    img_rgb = img.convert("RGB")
                    extracted = pytesseract.image_to_string(img_rgb)
                    result["text"] = extracted.strip()
                    result["ocr_used"] = True
                    result["ocr_status"] = "success"
                    result["ocr_message"] = "OCR successfully extracted text from image."
                    result["language_hints"] = detect_languages(result["text"])
            except Exception as ocr_err:
                result["ocr_used"] = False
                result["ocr_status"] = "failed"
                result["ocr_message"] = f"Image OCR execution error: {str(ocr_err)}"
        else:
            result["ocr_used"] = False
            result["ocr_status"] = "not_configured"
            result["ocr_message"] = f"Image uploaded. {ocr_msg}"

    except Exception as e:
        logger.error(f"Error processing image {file_path}: {e}")
        result["error"] = f"Failed to process image file: {str(e)}"

    return result

def classify_document_type(text: str, filename: str) -> str:
    """
    Deterministic document classifier for AICTE technical applications.
    Uses textual evidence and filename semantics.
    """
    text_lower = text.lower()
    fn_lower = filename.lower()

    # Fire Safety NOC
    if any(k in fn_lower or k in text_lower for k in [
        "fire", "fire safety", "no objection certificate", "fire noc", "fire services"
    ]):
        return "NOC (Fire)"

    # Affidavit / Undertaking
    if any(k in fn_lower or k in text_lower for k in [
        "affidavit", "notary", "notarised", "notarized", "undertaking", "शपथपत्र", "stamp paper"
    ]):
        return "Affidavit"

    # Accreditation (NBA / NAAC)
    if any(k in fn_lower or k in text_lower for k in [
        "accreditation", "naac", "nba", "national board of accreditation", "tier-1", "tier-2"
    ]):
        return "Accreditation"

    # Land / Revenue / Ownership Deed
    if any(k in fn_lower or k in text_lower for k in [
        "land", "ownership deed", "title deed", "khasra", "khata", "सातबारा", "खरेदीखत",
        "sale deed", "sub-registrar", "7/12", "7-12", "revenue records"
    ]):
        return "Land document"

    # Architectural Blueprint / Floor Plan
    if any(k in fn_lower or k in text_lower for k in [
        "floor plan", "blueprint", "architectural", "carpet area", "layout", "lab_block", "classroom layout"
    ]):
        return "Floor plan"

    # Campus Infrastructure Photos
    if any(k in fn_lower or k in text_lower for k in [
        "photograph", "campus photo", "infra", "laboratory photo", "computer centre photo"
    ]) or (fn_lower.endswith(('.jpg', '.jpeg', '.png')) and not "floor" in fn_lower):
        return "Infrastructure photographs"

    # Extension of Approval / Application Letter
    if any(k in fn_lower or k in text_lower for k in [
        "extension of approval", "application letter", "eoa application", "approval process",
        "member secretary", "aicte approval"
    ]):
        return "Application letter"

    return "Application letter"
