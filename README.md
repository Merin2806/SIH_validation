# SATYAPAN — AICTE APPLICATION VALIDATION PLATFORM
### SIH26261: AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification

Satyapan is an AI-assisted preliminary scrutiny decision-support platform for technical institution applications submitted to the All India Council for Technical Education (AICTE), including Extension of Approval (EoA) applications.

> **Statutory Notice**: Automated flags are preliminary decision-support outputs. Statutory scrutiny, physical inspections, and final regulatory decisions strictly remain with authorized AICTE officials.

---

## 🏛️ Platform Architecture

```
SIH_validation/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI server entry point, CORS, static routes
│   │   ├── database.py                # SQLite database session and engine
│   │   ├── models.py                  # SQLAlchemy entities (Application, Finding, Document, AuditEvent, etc.)
│   │   ├── schemas.py                 # Pydantic validation schemas
│   │   ├── config.py                  # Environment config and upload directories
│   │   ├── seed_data.py               # Seed data generator for AICTE master records & sample PDFs
│   │   ├── ai_service.py              # Vision LLM abstraction + transparent regex/NLP fallback
│   │   ├── document_parser.py         # PyMuPDF text & metadata extraction, SHA-256 duplicate hasher
│   │   ├── rules_engine.py            # Deterministic AICTE regulatory verification rules
│   │   ├── verification_adapters.py   # Simulated Issuing Authority adapters (deterministic)
│   │   ├── audit_service.py           # Traceable audit event logger
│   │   └── routes/
│   │       ├── applications.py        # Application queue, details, and decision actions
│   │       ├── documents.py           # File upload, hashing, AI extraction, and rule checks
│   │       ├── findings.py            # Finding confirmation and dismissal with justification
│   │       ├── rules.py               # Regulatory rules listing, toggles, and customization
│   │       ├── sources.py             # External authority simulated adapters and testing
│   │       ├── alerts.py              # Real-time operational attention items
│   │       └── audit.py               # Immutable chronological audit event trail
│   ├── uploads/                       # Persisted uploaded documents & sample PDFs
│   ├── tests/
│   │   └── test_api.py                # Pytest automated test suite (100% passing)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── api/client.ts              # Axios API client
│   │   ├── types/index.ts             # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx     # Muted teal persistent sidebar matching references
│   │   │   ├── layout/TopHeader.tsx   # Search header & authorized official badge
│   │   │   └── common/                # Badges, alert cards, disclaimer banners
│   │   ├── pages/
│   │   │   ├── ValidationQueue.tsx    # Reference Image 1: Queue dashboard & attention items
│   │   │   ├── NewValidation.tsx      # Reference Image 2: Multi-doc upload & 12-item checklist
│   │   │   ├── DocumentReviewer.tsx   # Reference Image 3: Split-screen evidence & findings
│   │   │   ├── AuditTrail.tsx         # Chronological event audit log
│   │   │   ├── ChecklistsRules.tsx    # Configurable rules engine & toggles
│   │   │   ├── IssuingAuthorities.tsx # Authority adapters (Fire, Land, AICTE, NBA)
│   │   │   └── Alerts.tsx             # 5 active operational attention flags
│   │   ├── App.tsx                    # React router configuration
│   │   ├── main.tsx
│   │   └── index.css                  # Tailored design system tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Running the Prototype Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# On Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
$env:PYTHONPATH="."
pytest tests/test_api.py

# Start Backend Server (runs on http://127.0.0.1:8000)
python run.py
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start Development Server (runs on http://localhost:5173)
npm run dev
```

Visit **http://localhost:5173** in your web browser.

---

## 🧪 Demonstration Scenarios

Satyapan demonstrates all 6 required demo scenarios:

| Case | Scenario | How to Reproduce in Satyapan |
|---|---|---|
| **Case A** | Consistent document | Open `EoA-2026-00417` (Northfield College of Engineering) — all 12/12 checks pass, institutional records match. |
| **Case B** | Expired Fire NOC | Open `EoA-2026-00418` (Meridian Institute of Technology) — Fire NOC validity ended on 13 Mar 2024. Flagged as `Expired`. Callout (2) highlighted. |
| **Case C** | Institution name mismatch | Open `EoA-2026-00418` — Certificate shows *"Meridian Inst. of Technology & Research"*, conflicting with AICTE record *"Meridian Institute of Technology"*. Callout (3) highlighted. |
| **Case D** | Potential metadata anomaly | Open `EoA-2026-00418` — PDF metadata has Creator tag `Adobe Photoshop 25.1` instead of scanner/printer software. Flagged for review without claiming forgery. Callout (1) highlighted. |
| **Case E** | Duplicate document | Open `EoA-2026-00409` (Lakeshore Polytechnic) — Two uploaded images produce identical SHA-256 cryptographic hashes. Flagged as duplicate. |
| **Case F** | Source unavailable | Open `EoA-2026-00418` or `EoA-2026-00412` — Fire Services QR portal simulated adapter returns 504 Gateway Timeout. Verified as `Source unavailable` with retry queued. Callout (4) highlighted. |

---

## 🔒 Security & Data Integrity
1. **Decision Support Only**: Automated AICTE preliminary findings require human reviewer confirmation or recorded justification for dismissal.
2. **Immutable Audit Trail**: Reviewer decisions (confirm finding, dismiss finding, request rectification, escalate inspection) are permanently logged into SQLite with timestamp and actor details.
3. **Transparent Fallback**: Operates fully offline without external API keys via high-accuracy deterministic extraction; connects to Google Gemini Vision LLM when `GEMINI_API_KEY` is provided.
4. **Explicit Simulated Labels**: External adapters are clearly marked as `SIMULATED` to prevent false authority claims.
