import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import UPLOADS_DIR, ALLOWED_ORIGINS
from .database import engine, Base, SessionLocal, ensure_columns
from .seed_data import seed_database
from .routes import applications, documents, findings, rules, sources, alerts, audit

# Initialize DB tables
Base.metadata.create_all(bind=engine)
ensure_columns()

# Seed realistic database records on startup
with SessionLocal() as db:
    seed_database(db)

app = FastAPI(
    title="Satyapan — AICTE Application Validation API",
    description="AI-Assisted Preliminary Scrutiny Platform for Technical Institution Applications",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development prototype, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for PDF and image document previews
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Health check
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Satyapan API",
        "version": "1.0.0",
        "database": "SQLite (Connected)",
        "mode": "Preliminary Decision Support (Prototype)"
    }

# Register API Routers
app.include_router(applications.router)
app.include_router(documents.router)
app.include_router(findings.router)
app.include_router(rules.router)
app.include_router(sources.router)
app.include_router(alerts.router)
app.include_router(audit.router)
