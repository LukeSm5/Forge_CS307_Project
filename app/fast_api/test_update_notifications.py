from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import Accounts, Base, Exercises, Machines, Profiles
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


class FailingNotificationService(NotificationService):
    def send_update_notification(
        self,
        *,
        recipient_email: str,
        username: str,
        update_type: str,
        updated_at=None,
    ) -> None:
        raise RuntimeError("notification provider unavailable")


def _build_test_client(notifier: NotificationService | None = None):
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
    session.add(
        Profiles(
            ProfileID=seed_user.UserID,
            age=25,
            weight=170,
            height_in=70,
            gender="male",
            health_status="healthy",
            health_goals="fitness",
        )
    )
    exercise = Exercises(name="bench press")
    machine = Machines(name="barbell")
    session.add_all([exercise, machine])
    session.commit()
    session.refresh(exercise)
    session.refresh(machine)

    notifier = notifier or RecordingNotificationService()

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
    return client, session, notifier, seed_user.UserID, exercise.ExerciseID, machine.MachineID


def _teardown_test_client(session):
    app.dependency_overrides.clear()
    session.close()


def test_profile_update_triggers_notification():
    client, session, notifier, user_id, _, _ = _build_test_client()
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
    client, session, notifier, user_id, _, _ = _build_test_client()
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
    client, session, notifier, user_id, _, _ = _build_test_client()
    try:
        response = client.post(
            f"/accounts/{user_id}/change_password",
            json={"current_password": "WrongPassword", "new_password": "NewPassword9"},
        )
        assert response.status_code == 401
        assert len(notifier.calls) == 0
    finally:
        _teardown_test_client(session)


def test_create_workout_triggers_notification():
    client, session, notifier, user_id, exercise_id, machine_id = _build_test_client()
    try:
        response = client.post(
            "/workouts",
            json={
                "profile_id": user_id,
                "workout_name": "Test workout",
                "exercises": [
                    {
                        "exercise_id": exercise_id,
                        "machine_id": machine_id,
                        "sets": 3,
                        "reps": 10,
                        "weight": 135,
                        "notes": "test",
                    }
                ],
            },
        )
        assert response.status_code == 200
        assert len(notifier.calls) == 1
        assert notifier.calls[0]["recipient_email"] == "user@example.com"
        assert notifier.calls[0]["update_type"] == "workout logged"
    finally:
        _teardown_test_client(session)


def test_delete_workout_triggers_notification():
    client, session, notifier, user_id, exercise_id, machine_id = _build_test_client()
    try:
        create_response = client.post(
            "/workouts",
            json={
                "profile_id": user_id,
                "workout_name": "Delete workout test",
                "exercises": [
                    {
                        "exercise_id": exercise_id,
                        "machine_id": machine_id,
                        "sets": 2,
                        "reps": 8,
                    }
                ],
            },
        )
        assert create_response.status_code == 200
        workout_id = create_response.json()["workout_id"]

        notifier.calls.clear()

        delete_response = client.delete(f"/workouts/{user_id}/{workout_id}")
        assert delete_response.status_code == 200
        assert len(notifier.calls) == 1
        assert notifier.calls[0]["update_type"] == "workout deleted"
    finally:
        _teardown_test_client(session)


def test_delete_workout_failure_does_not_trigger_notification():
    client, session, notifier, user_id, _, _ = _build_test_client()
    try:
        response = client.delete(f"/workouts/{user_id}/99999")
        assert response.status_code == 404
        assert len(notifier.calls) == 0
    finally:
        _teardown_test_client(session)


def test_profile_update_succeeds_when_notification_fails():
    client, session, _, user_id, _, _ = _build_test_client(FailingNotificationService())
    try:
        response = client.patch(
            f"/accounts/{user_id}/profile",
            json={"bio": "after update"},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Profile updated (notification failed)"
    finally:
        _teardown_test_client(session)


def test_create_workout_succeeds_when_notification_fails():
    client, session, _, user_id, exercise_id, machine_id = _build_test_client(FailingNotificationService())
    try:
        response = client.post(
            "/workouts",
            json={
                "profile_id": user_id,
                "workout_name": "Notification fail workout",
                "exercises": [
                    {
                        "exercise_id": exercise_id,
                        "machine_id": machine_id,
                        "sets": 2,
                        "reps": 8,
                    }
                ],
            },
        )
        assert response.status_code == 200
        assert response.json()["workout_name"] == "Notification fail workout"
    finally:
        _teardown_test_client(session)
