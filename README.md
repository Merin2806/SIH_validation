# SATYAPAN — AI-POWERED REGULATORY VALIDATION PLATFORM
### SIH26261: AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification for AICTE

**Satyapan** is an enterprise-grade preliminary scrutiny decision-support system engineered for technical education institutions submitting applications to the **All India Council for Technical Education (AICTE)**, specifically for Extension of Approval (EoA), new courses, variation in intake, and institutional compliance.

> [!IMPORTANT]
> **STATUTORY SAFEGUARDS NOTICE**:
> Satyapan operates strictly as a **decision-support platform** for scrutiny officers and regional committees. It **never** automatically issues, rejects, suspends, or revokes any AICTE regulatory approval. All automated findings, visual bounding boxes, OCR extractions, and metadata anomaly indicators represent preliminary flags for human scrutiny. Only authorized statutory officials possess legal authority to render final regulatory decisions.

---

## 🏛️ End-to-End System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             REACT + TYPESCRIPT FRONTEND                          │
│  [Validation Queue] [New Validation] [Split-Screen Reviewer] [Audit Trail] ...   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ JSON HTTP / Multipart Uploads
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI ASYNCHRONOUS BACKEND API                         │
│  • Magic Bytes File Security (PDF/PNG/JPG)  • 25MB Enforced Limit • Sanitization │
│  • SHA-256 Cryptographic Hash Generation    • Strict Pydantic Data Contracts     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         DOCUMENT PROCESSING PIPELINE                             │
│  • Digital PDF Text & Metadata Extractor (PyMuPDF / fitz)                        │
│  • Multilingual Script Detection (English, Devanagari Hindi & Marathi)           │
│  • Scanned Document Detection (<30 words) & OCR Dispatcher (Tesseract/Pillow)   │
│  • AI / Regex Structured Field Extraction (10 Priority Regulatory Fields)        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         DETERMINISTIC COMPLIANCE RULES                           │
│  • RULE_FIRE_NOC_VALIDITY           • RULE_NAME_CONSISTENCY (Fuzzy & Exact)      │
│  • RULE_METADATA_INTEGRITY          • RULE_ISSUING_AUTH_REACHABILITY             │
│  • RULE_DUPLICATE_DETECTION         • RULE_INSTITUTION_ID / PID Validation       │
│  • RULE_DATE_SEQUENCE               • RULE_LAND_DEED_OWNERSHIP / ACCREDITATION   │
└──────────────────┬─────────────────────────────────────┬─────────────────────────┘
                   │                                     │
                   ▼                                     ▼
┌───────────────────────────────────────┐ ┌────────────────────────────────────────┐
│     EXTERNAL AUTHORITY GATEWAY        │ │      SQLITE AUDIT LEDGER (SHA-256)     │
│  • AICTECentralDbAdapter (Verified)   │ │  • Tamper-Evident Hash Chaining        │
│  • StateFireServicesAdapter (Timeout) │ │  • Append-Only Log Events              │
│  • LandRecordsAdapter (Land Title)    │ │  • Genesis Hash Verification           │
│  • AccreditationAdapter (NBA/NAAC)    │ │  • Reviewer Confirm/Dismiss Notes      │
│  • DocumentForensicsAdapter (Tags)    │ │  • Cryptographic Chain Integrity API   │
└──────────────────┬────────────────────┘ └──────────────────┬─────────────────────┘
                   │                                         │
                   └───────────────────┬─────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        SPLIT-SCREEN REVIEWER DASHBOARD                           │
│  • Synchronized Left: Native Document Viewer with Page Switching & File Download │
│  • Synchronized Right: Verified Fields, Evidence Snippets & Audit History        │
│  • Scrutiny Officer Actions: Confirm Finding, Dismiss Finding (Mandatory Reason) │
│  • Decision Controls: Request Rectification, Escalate to Inspection, Endorse     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (curated muted teal AICTE administrative palette), Lucide React icons, Axios.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite, Pydantic v2.
- **Document Processing**: PyMuPDF (fitz) v2.0, Pillow (PIL), ReportLab, PyTesseract (configurable OCR).
- **Security & Integrity**: Magic byte file signature validation, SHA-256 content deduplication, cryptographic hash chain for audit events.
- **Testing**: Pytest, FastAPI TestClient, unittest.

---

## 📂 Codebase Directory Structure

```
SIH_validation/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application, CORS, and router registration
│   │   ├── database.py                # SQLite engine, sessions, and safe ALTER TABLE migrations
│   │   ├── models.py                  # SQLAlchemy entities (Application, Finding, Document, AuditEvent)
│   │   ├── schemas.py                 # Pydantic v2 schemas and structured extraction contracts
│   │   ├── config.py                  # Environment config and upload directories
│   │   ├── seed_data.py               # Deterministic seed generator for 128 applications & master PDFs
│   │   ├── ai_service.py              # Vision LLM abstraction + transparent regex/NLP fallback
│   │   ├── document_parser.py         # Magic bytes security, PyMuPDF, OCR dispatcher, language hints
│   │   ├── rules_engine.py            # Deterministic AICTE regulatory verification rules
│   │   ├── verification_adapters.py   # Issuing Authority gateway (AICTE, Fire, Land, NBA, Forensics)
│   │   ├── audit_service.py           # Append-only SHA-256 cryptographic hash-chained audit service
│   │   └── routes/
│   │       ├── applications.py        # Applications queue, details, metrics, CSV export
│   │       ├── documents.py           # End-to-end file upload, hashing, OCR, rules & verification
│   │       ├── findings.py            # Finding confirmation and dismissal with mandatory justification
│   │       ├── rules.py               # Rules listing, configuration toggles, audit logging
│   │       ├── sources.py             # Issuing authority simulated adapter status & test queries
│   │       ├── alerts.py              # Dynamic operational attention flags linked to documents
│   │       └── audit.py               # Chronological audit events & cryptographic chain verification
│   ├── uploads/                       # Secure server-side document storage (non-executable)
│   ├── tests/
│   │   ├── test_api.py                # 6 Core API endpoints tests
│   │   └── test_pipeline.py           # 14 Comprehensive end-to-end pipeline & security tests
│   ├── satyapan.db                    # Persisted SQLite database (128 seeded applications)
│   ├── requirements.txt               # Backend dependencies
│   └── run.py                         # Startup script
├── frontend/
│   ├── src/
│   │   ├── api/client.ts              # Fully-typed Axios API client
│   │   ├── types/index.ts             # TypeScript interfaces for models, metrics & audit
│   │   ├── components/layout/         # Muted teal navigation sidebar, header, banners
│   │   ├── pages/
│   │   │   ├── ValidationQueue.tsx    # Live database metrics, search, filters, CSV export
│   │   │   ├── NewValidation.tsx      # Multi-document upload, live stage progress, checklist
│   │   │   ├── DocumentReviewer.tsx   # Split-screen evidence reviewer with confirm/dismiss
│   │   │   ├── AuditTrail.tsx         # Chronological audit events + hash chain verification
│   │   │   ├── ChecklistsRules.tsx    # Configurable regulatory rules & handbook toggles
│   │   │   ├── IssuingAuthorities.tsx # Authority adapter status & test query simulator
│   │   │   └── Alerts.tsx             # Live operational attention items linked to reviewer
│   │   ├── App.tsx                    # React router routes
│   │   └── index.css                  # Tailored design system tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Environment Setup & Startup Instructions

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- (Optional) Tesseract OCR for physical document scanning

### 1. Windows PowerShell Setup

```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run complete automated test suite (20/20 passing)
$env:PYTHONPATH="."
pytest tests/ -v

# Start FastAPI server (runs on http://127.0.0.1:8000)
python run.py
```

In a second PowerShell window:
```powershell
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Build production bundle to verify correctness
npm run build

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

### 2. macOS / Linux Bash Setup

```bash
# Terminal 1: Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run complete test suite
PYTHONPATH=. pytest tests/ -v

# Start backend server
python3 run.py
```

```bash
# Terminal 2: Frontend
cd frontend
npm install
npm run build
npm run dev
```

Open your browser to: **http://localhost:5173**

---

## 🧪 Demonstration Cases

Satyapan includes 8 deterministic demonstration scenarios designed to showcase the platform's capabilities without external API dependencies:

| Case | Scenario | Application / Document | Observed System Behavior & Rule Flags |
|---|---|---|---|
| **Case A** | **Consistent Document** | `EoA-2026-00417` (Northfield College) | All 12/12 checklist items pass; institutional PID and name match AICTE master records; overall status is **Verified** with clear-to-proceed status. |
| **Case B** | **Expired Fire NOC** | `EoA-2026-00418` (Meridian Institute) | `RULE_FIRE_NOC_VALIDITY` triggers. Fire NOC expired on 13 March 2024 (relative to current cycle 2026-27). Flagged with **High** severity and callout marker #2. |
| **Case C** | **Institution Name Mismatch** | `EoA-2026-00418` (Meridian Institute) | `RULE_NAME_CONSISTENCY` triggers. Document shows *"Meridian Inst. of Technology & Research"*, conflicting with AICTE official name *"Meridian Institute of Technology"*. Callout marker #3. |
| **Case D** | **Suspicious Metadata Indicator** | `EoA-2026-00418` (Meridian Institute) | `RULE_METADATA_INTEGRITY` flags creator tag `Adobe Photoshop 25.1`. Reported explicitly as a **preliminary supporting indicator** requiring manual scrutiny, not proof of forgery. Callout marker #1. |
| **Case E** | **Duplicate Document Upload** | `EoA-2026-00409` (Lakeshore Polytechnic) | `RULE_DUPLICATE_DETECTION` triggers. Two uploaded campus photographs share identical SHA-256 content hashes despite different filenames. |
| **Case F** | **Unavailable Verification Source** | `EoA-2026-00418` / `EoA-2026-00412` | `RULE_ISSUING_AUTH_REACHABILITY` flags State Fire Services QR endpoint timeout (HTTP 504 simulated). Status recorded as `Source unavailable` with retry queued. Callout marker #4. |
| **Case G** | **Unreadable / Malformed File** | Any malformed file upload | Magic byte signature verification rejects invalid PDF headers (`%PDF-` missing) and returns HTTP 400 with an actionable error. |
| **Case H** | **Multilingual Document (Devanagari)** | Marathi / Hindi Land Title Deeds | Parser detects Devanagari Unicode scripts and flags language hints (`Hindi + Marathi`); extracted text is retained alongside original PDF for scrutiny. |

---

## 🔒 Security Architecture & Data Safeguards

1. **File Upload Security**:
   - Magic bytes signature inspection (`%PDF-`, `\x89PNG`, `\xff\xd8\xff`).
   - 25 MB file size ceiling strictly enforced at the gateway.
   - Server-side UUID filename generation prevents path traversal attacks (`../`).
   - Upload directory located outside the web root; files are non-executable.
2. **Cryptographic Deduplication**:
   - Computes SHA-256 hashes of all file streams.
   - Detects identical duplicate content regardless of filename or extension disguise.
3. **Tamper-Evident Append-Only Audit Trail**:
   - Every scrutiny action (application creation, document upload, OCR execution, rule evaluation, finding confirmation, and finding dismissal) generates a cryptographically hashed block.
   - Current block hash is derived from: `prev_hash | application_id | timestamp | actor | action | outcome | details`.
   - Built-in verification algorithm (`GET /api/audit/verify`) detects any retroactive database alteration.
4. **Mandatory Scrutiny Accountability**:
   - Dismissing an automated finding strictly requires a non-empty administrative justification (`POST /api/findings/{id}/dismiss`). Empty notes return HTTP 400 Bad Request.
5. **Safe Data Persistence**:
   - Dynamic schema synchronization (`ensure_columns()`) executes non-destructive `ALTER TABLE` statements so that SQLite application data is never deleted across server restarts.

---

## 📊 Automated Test Suite Results

The platform is covered by an automated test suite executed via `pytest`:

```bash
$ PYTHONPATH=backend python3 -m pytest backend/tests/ -v
============================= test session starts ==============================
backend/tests/test_api.py::test_health PASSED                            [  5%]
backend/tests/test_api.py::test_applications_queue_and_metrics PASSED    [ 10%]
backend/tests/test_api.py::test_primary_application_details PASSED       [ 15%]
backend/tests/test_api.py::test_finding_actions_confirm_and_dismiss PASSED [ 20%]
backend/tests/test_api.py::test_reviewer_decision_and_audit_trail PASSED [ 25%]
backend/tests/test_api.py::test_issuing_authorities_and_rules PASSED     [ 30%]
backend/tests/test_pipeline.py::test_pipeline_health_check PASSED        [ 35%]
backend/tests/test_pipeline.py::test_application_listing_search_and_filters PASSED [ 40%]
backend/tests/test_pipeline.py::test_application_creation_and_validation PASSED [ 45%]
backend/tests/test_pipeline.py::test_file_upload_security_validation PASSED [ 50%]
backend/tests/test_pipeline.py::test_sha256_duplicate_detection_and_hashing PASSED [ 55%]
backend/tests/test_pipeline.py::test_pdf_extraction_and_metadata PASSED  [ 60%]
backend/tests/test_pipeline.py::test_scanned_pdf_ocr_status_detection PASSED [ 65%]
backend/tests/test_pipeline.py::test_date_validation_and_normalization PASSED [ 70%]
backend/tests/test_pipeline.py::test_deterministic_rules_evaluation PASSED [ 75%]
backend/tests/test_pipeline.py::test_issuing_authority_adapters PASSED   [ 80%]
backend/tests/test_pipeline.py::test_finding_confirmation_and_dismissal_mandatory_note PASSED [ 85%]
backend/tests/test_pipeline.py::test_tamper_evident_audit_trail_and_hash_chain PASSED [ 90%]
backend/tests/test_pipeline.py::test_applications_csv_export PASSED      [ 95%]
backend/tests/test_pipeline.py::test_database_persistence_across_sessions PASSED [100%]

======================== 20 passed, 8 warnings in 1.23s ========================
```

---

## 🔮 Future Integration with AICTE Core Systems

To transition Satyapan from this prototype to full production deployment within the AICTE national network:
1. **SSO / DigiLocker Integration**: Connect with Parichay (National Single Sign-On) and DigiLocker for direct institutional certificate retrieval.
2. **State e-Governance APIs**: Replace simulated adapters with state government Fire and Revenue department REST endpoints.
3. **Role-Based Access Control (RBAC)**: Enforce distinct cryptographic tokens for Scrutiny Officers, Regional Officers, and Appellate Committees.
4. **Hardware Security Module (HSM)**: Anchor the audit hash chain root into an institutional HSM or national blockchain ledger.
