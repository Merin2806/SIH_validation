import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/satyapan.db")

# AI Service Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini") # "gemini", "openai", or "fallback"
AI_API_KEY = os.getenv("AI_API_KEY", os.getenv("GEMINI_API_KEY", ""))

# OCR Settings
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")

# CORS settings
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
