from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import DATABASE_URL

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_columns():
    """Ensure newly added columns exist in SQLite database without recreating tables or losing data."""
    from sqlalchemy import text
    with engine.connect() as conn:
        # Check uploaded_documents
        try:
            conn.execute(text("ALTER TABLE uploaded_documents ADD COLUMN ocr_status VARCHAR DEFAULT 'not_required'"))
            conn.commit()
        except Exception:
            pass

        # Check findings
        for col, col_type in [
            ("rule_id", "VARCHAR"),
            ("category", "VARCHAR DEFAULT 'Regulatory Compliance'"),
            ("expected_value", "VARCHAR"),
            ("actual_value", "VARCHAR"),
            ("page_number", "INTEGER DEFAULT 1"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE findings ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass

        # Check audit_events
        for col, col_type in [
            ("document_id", "VARCHAR"),
            ("finding_id", "INTEGER"),
            ("correlation_id", "VARCHAR"),
            ("prev_hash", "VARCHAR"),
            ("hash", "VARCHAR"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE audit_events ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass

        # Check verification_attempts
        for col, col_type in [
            ("document_id", "VARCHAR"),
            ("verification_method", "VARCHAR DEFAULT 'Simulated Adapter'"),
            ("reference_checked", "VARCHAR"),
            ("error_info", "TEXT"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE verification_attempts ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass

