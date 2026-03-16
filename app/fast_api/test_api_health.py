from fastapi.testclient import TestClient
from app.fast_api.api import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "connected"}


# run pytest app/fast_api/test_api_health.py