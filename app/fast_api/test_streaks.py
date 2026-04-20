from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import Accounts, Base, Profiles, Workouts, session_workouts
from app.fast_api import account_management as am
from app.fast_api.api import _calculate_workout_streak


def _session_with_profile():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    account = Accounts(
        email="streak@example.com",
        username="streak_user",
        password_hash=am.hash_password("Password1"),
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    db.add(
        Profiles(
            ProfileID=account.UserID,
            age=21,
            weight=170,
            height_in=70,
            gender="male",
            health_status="healthy",
            health_goals="build muscle",
        )
    )
    workout = Workouts(name="Streak workout")
    db.add(workout)
    db.commit()
    db.refresh(workout)

    return db, account.UserID, workout.WorkoutID


def _add_workout(db, profile_id: int, workout_id: int, when: datetime):
    db.add(
        session_workouts(
            WorkoutID=workout_id,
            ProfileID=profile_id,
            SplitID=None,
            date=when,
            duration=45,
            notes="streak test",
        )
    )
    db.commit()


def test_workout_streak_is_zero_without_workouts():
    db, profile_id, _ = _session_with_profile()
    try:
        streak = _calculate_workout_streak(db, profile_id)
        assert streak.workout_streak_weeks == 0
        assert streak.current_week_active is False
        assert streak.last_workout_date is None
    finally:
        db.close()


def test_workout_streak_counts_consecutive_active_weeks():
    db, profile_id, workout_id = _session_with_profile()
    try:
        now = datetime.now(timezone.utc)
        _add_workout(db, profile_id, workout_id, now)
        _add_workout(db, profile_id, workout_id, now - timedelta(days=7))
        _add_workout(db, profile_id, workout_id, now - timedelta(days=14))

        streak = _calculate_workout_streak(db, profile_id)

        assert streak.workout_streak_weeks == 3
        assert streak.current_week_active is True
        assert streak.last_workout_date is not None
    finally:
        db.close()


def test_workout_streak_stops_at_missing_current_week():
    db, profile_id, workout_id = _session_with_profile()
    try:
        now = datetime.now(timezone.utc)
        _add_workout(db, profile_id, workout_id, now - timedelta(days=7))

        streak = _calculate_workout_streak(db, profile_id)

        assert streak.workout_streak_weeks == 0
        assert streak.current_week_active is False
    finally:
        db.close()
