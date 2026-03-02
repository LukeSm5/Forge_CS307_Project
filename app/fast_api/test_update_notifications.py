from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import Accounts, Base
from app.core.notifications import NotificationService
from app.fast_api import account_management as am
from app.fast_api.api import app, get_db, get_notification_service


class RecordingNotificationService(NotificationService):
    def __init__(self):
        self.calls = []

    def send_update_notification(
        self,
        *,
        recipient_email: str,
        username: str,
        update_type: str,
        updated_at=None,
    ) -> None:
        self.calls.append(
            {
                "recipient_email": recipient_email,
                "username": username,
                "update_type": update_type,
            }
        )


def _build_test_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    seed_user = Accounts(
        email="user@example.com",
        username="test_user",
        bio="before",
        password_hash=am.hash_password("OldPassword1"),
    )
    session.add(seed_user)
    session.commit()
    session.refresh(seed_user)

    notifier = RecordingNotificationService()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    def override_get_notification_service():
        return notifier

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_notification_service] = override_get_notification_service
    client = TestClient(app)
    return client, session, notifier, seed_user.UserID


def _teardown_test_client(session):
    app.dependency_overrides.clear()
    session.close()


def test_profile_update_triggers_notification():
    client, session, notifier, user_id = _build_test_client()
    try:
        response = client.patch(
            f"/accounts/{user_id}/profile",
            json={"bio": "after update"},
        )
        assert response.status_code == 200
        assert len(notifier.calls) == 1
        assert notifier.calls[0]["recipient_email"] == "user@example.com"
        assert notifier.calls[0]["update_type"] == "profile updated"
    finally:
        _teardown_test_client(session)


def test_change_password_triggers_notification():
    client, session, notifier, user_id = _build_test_client()
    try:
        response = client.post(
            f"/accounts/{user_id}/change_password",
            json={"current_password": "OldPassword1", "new_password": "NewPassword9"},
        )
        assert response.status_code == 200
        assert response.json()["ok"] is True
        assert len(notifier.calls) == 1
        assert notifier.calls[0]["update_type"] == "password changed"
    finally:
        _teardown_test_client(session)


def test_change_password_failure_does_not_trigger_notification():
    client, session, notifier, user_id = _build_test_client()
    try:
        response = client.post(
            f"/accounts/{user_id}/change_password",
            json={"current_password": "WrongPassword", "new_password": "NewPassword9"},
        )
        assert response.status_code == 401
        assert len(notifier.calls) == 0
    finally:
        _teardown_test_client(session)
