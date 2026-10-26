import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Application, Finding, AuditEvent

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Satyapan" in data["service"]

def test_applications_queue_and_metrics():
    # Test metrics
    metrics_res = client.get("/api/applications/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["in_queue"] >= 128
    assert metrics["clear_to_proceed"] >= 74
    assert metrics["needs_manual_review"] >= 38
    assert metrics["anomalies_flagged"] >= 16

    # Test applications list
    apps_res = client.get("/api/applications")
    assert apps_res.status_code == 200
    apps_data = apps_res.json()
    assert len(apps_data["items"]) > 0
    app_ids = [a["id"] for a in apps_data["items"]]
    assert "EoA-2026-00418" in app_ids

def test_primary_application_details():
    res = client.get("/api/applications/EoA-2026-00418")
    assert res.status_code == 200
    data = res.json()
    assert data["institution_name"] == "Meridian Institute of Technology"
    assert data["checks_passed"] == 9
    assert len(data["documents"]) >= 6
    assert len(data["findings"]) >= 4

def test_finding_actions_confirm_and_dismiss():
    # Test Confirming finding 1
    confirm_res = client.post("/api/findings/1/confirm", json={"note": "Confirmed by Scrutiny Officer - Alteration suspected"})
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "confirmed"

    # Test Dismissing without reason -> should fail with 400
    bad_dismiss = client.post("/api/findings/2/dismiss", json={"note": ""})
    assert bad_dismiss.status_code == 400

    # Test Dismissing with valid justification
    good_dismiss = client.post("/api/findings/2/dismiss", json={"note": "Institute has produced temporary extension endorsement."})
    assert good_dismiss.status_code == 200
    assert good_dismiss.json()["status"] == "dismissed"

def test_reviewer_decision_and_audit_trail():
    # Record rectification request
    res = client.post("/api/applications/EoA-2026-00418/request-rectification", json={"note": "Upload renewed Fire NOC certificate."})
    assert res.status_code == 200
    assert res.json()["status"] == "RECTIFICATION_REQUESTED"

    # Check that audit log recorded the action
    audit_res = client.get("/api/audit?application_id=EoA-2026-00418")
    assert audit_res.status_code == 200
    events = audit_res.json()
    actions = [e["action"] for e in events]
    assert any("Rectification requested" in a for a in actions)

def test_issuing_authorities_and_rules():
    sources_res = client.get("/api/sources")
    assert sources_res.status_code == 200
    sources = sources_res.json()
    assert len(sources) >= 5
    assert any("Fire Services" in s["name"] for s in sources)

    # Test deterministic test query
    test_q = client.post("/api/sources/src-fire/test?identifier=FS/NOC/2021/04418")
    assert test_q.status_code == 200
    assert test_q.json()["status"] == "Source unavailable"
    assert test_q.json()["is_simulated"] is True

    # Test rules
    rules_res = client.get("/api/rules")
    assert rules_res.status_code == 200
    assert len(rules_res.json()) >= 10
