from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from app.core.db import Base
from app.core.seed import engine

from app.core.db import Workouts, workout_exercises, Exercises
from app.core.db import Accounts
from app.core import repos
from app.core.notifications import NotificationService, get_notification_service
from app.core.seed import SessionLocal
from app.fast_api import account_management as am
from app.core.auth_tokens import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expiry,
    utcnow,
)

app = FastAPI()
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_account(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> Accounts:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = parts[1]
    return repos.lookup_account_by_token(db, token)

class ResetPasswordRequest(BaseModel):
    new_password: str
    user_id: int

class WorkoutExerciseIn(BaseModel):
    exercise_id: int
    machine_id: int
    sets: int = Field(ge=1, le=50)
    reps: int = Field(ge=1, le=1000)
    weight: Optional[int] = None
    notes: Optional[str] = None

class CreateWorkoutRequest(BaseModel):
    profile_id: int
    workout_name: str
    exercises: List[WorkoutExerciseIn]
    overwrite: bool = True  # if true, replaces saved exercises for this workout

class CreateWorkoutResponse(BaseModel):
    workout_id: int
    workout_name: str
    inserted_sets: int

class WorkoutExerciseOut(BaseModel):
    exercise_id: int
    exercise_name: str
    machine_id: int
    sets: int
    reps: int
    weight: Optional[int]
    notes: Optional[str]

class WorkoutOut(BaseModel):
    workout_id: int
    workout_name: str
    exercises: List[WorkoutExerciseOut]

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UpdateAccountProfileRequest(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None


class ChangeAccountPasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AccountUpdateResponse(BaseModel):
    user_id: int
    email: str
    username: str
    message: str


def _send_account_update_notification(
    notifier: NotificationService,
    *,
    account: Accounts,
    update_type: str,
) -> None:
    notifier.send_update_notification(
        recipient_email=account.email,
        username=account.username,
        update_type=update_type,
    )


@app.patch("/accounts/{user_id}/profile", response_model=AccountUpdateResponse)
def update_account_profile(
    user_id: int,
    payload: UpdateAccountProfileRequest,
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
):
    if payload.username is None and payload.bio is None:
        raise HTTPException(status_code=400, detail="Provide at least one field to update")

    try:
        updated = am.update_profile(
            db,
            Accounts,
            user_id=user_id,
            payload=am.UpdateProfileInput(username=payload.username, bio=payload.bio),
        )
    except am.NotFound:
        raise HTTPException(status_code=404, detail="Account not found")
    except am.UsernameAlreadyInUse:
        raise HTTPException(status_code=409, detail="Username already in use")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    _send_account_update_notification(
        notifier,
        account=updated,
        update_type="profile updated",
    )

    return AccountUpdateResponse(
        user_id=updated.UserID,
        email=updated.email,
        username=updated.username,
        message="Profile updated and notification sent",
    )


@app.post("/accounts/{user_id}/change_password")
def change_account_password(
    user_id: int,
    payload: ChangeAccountPasswordRequest,
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
):
    try:
        am.change_password(
            db,
            Accounts,
            user_id=user_id,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
    except am.NotFound:
        raise HTTPException(status_code=404, detail="Account not found")
    except am.InvalidCredentials:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    except am.InvalidPassword as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    account = am.get_user_by_id(db, Accounts, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    _send_account_update_notification(
        notifier,
        account=account,
        update_type="password changed",
    )
    return {"ok": True, "message": "Password changed and notification sent"}



@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = am.authenticate_user(db, Accounts, email=payload.email, password=payload.password)
    except am.InvalidCredentials:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(user_id=user.UserID)
    refresh = generate_refresh_token()

    user.refresh_token_hash = hash_refresh_token(refresh)
    user.refresh_expires_at = refresh_expiry()

    db.add(user)
    db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh, expires_in=2 * 60)




@app.post("/auth/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    actually executes the remember me login
    find user that matches hashed token of current payload and log them in
    generates new refresh token to extend the new log in window
    """
    token_hash = hash_refresh_token(payload.refresh_token)

    user = db.query(Accounts).filter(Accounts.refresh_token_hash == token_hash).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if not user.refresh_expires_at or user.refresh_expires_at < utcnow():
        raise HTTPException(status_code=401, detail="Expired refresh token")

    # New short-lived access token
    access = create_access_token(user_id=user.UserID)

    # Rotate refresh token 
    new_refresh = generate_refresh_token()
    user.refresh_token_hash = hash_refresh_token(new_refresh)
    user.refresh_expires_at = refresh_expiry()

    db.add(user)
    db.commit()

    return TokenResponse(access_token=access, refresh_token=new_refresh, expires_in=2 * 60)



@app.post("/auth/logout")
def logout(me: Accounts = Depends(get_current_account), db: Session = Depends(get_db)):
    me.refresh_token_hash = None
    me.refresh_expires_at = None
    db.add(me)
    db.commit()
    return {"ok": True}

"""
@app.post("/accounts/{user_id}/reset_password")
async def resetPasswordEndpoint(request: ResetPasswordRequest, session: Session):
    user = session.get(Accounts, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        resetPassword(user, request.new_password, session)
        return {"message": "Password reset successful"}
    except TypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

"""
def resetPassword(user, newPassword, session):
    if (not isinstance(user, Accounts)):
        raise TypeError("User must be an instance of Accounts")
    if (newPassword == None):
        raise ValueError("New password cannot be empty")
    if (len(newPassword) > 20):
        raise ValueError("New password cannot exceed 20 characters")
    if (len(newPassword) < 8):
        raise ValueError("New password must be at least 8 characters long")
    user.password = newPassword
    session.commit()


@app.delete("/accounts/{user_id}")
def delete_account(user_id: int, db: Session = Depends(get_db)):
    try:
        deleted = repos.delete_account_by_id(db, user_id)
        if deleted:
            db.commit()
            return {"deleted": True, "user_id": user_id}

        raise HTTPException(status_code=404, detail="Account not found")

    except HTTPException:
        # don't mask 404s
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    


@app.post("/workouts", response_model=CreateWorkoutResponse)
def create_or_save_workout(payload: CreateWorkoutRequest, db: Session = Depends(get_db)):
    # 1) Ensure workout exists by name
    workout = db.query(Workouts).filter(Workouts.name == payload.workout_name).first()
    if workout is None:
        workout = Workouts(name=payload.workout_name)
        db.add(workout)
        db.commit()
        db.refresh(workout)

    workout_id = workout.WorkoutID

    # 2) overwrite existing saved sets for this profile/workout
    db.query(workout_exercises).filter(
        workout_exercises.ProfileID == payload.profile_id,
        workout_exercises.WorkoutID == workout_id
    ).delete(synchronize_session=False)
    db.commit()

    # 3) Insert sets (one row per set)
    inserted = 0
    for ex in payload.exercises:
        row = workout_exercises(
            ProfileID=payload.profile_id,
            WorkoutID=workout_id,
            ExerciseID=ex.exercise_id,
            MachineID = ex.machine_id,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight,
            notes=ex.notes,
        )
        db.add(row)
        inserted += ex.sets

    db.commit()

    return CreateWorkoutResponse(
        workout_id=workout_id,
        workout_name=workout.name,
        inserted_sets=inserted
    )


@app.get("/workouts/{profile_id}", response_model=List[WorkoutOut])
def get_workouts_for_profile(profile_id: int, db: Session = Depends(get_db)):
    # Fetch all rows for this profile, with workout + exercise names
    rows = (
        db.query(
            workout_exercises.WorkoutID,
            Workouts.name,
            workout_exercises.ExerciseID,
            Exercises.name,
            workout_exercises.MachineID,
            workout_exercises.sets,
            workout_exercises.reps,
            workout_exercises.weight,
            workout_exercises.notes,
        )
        .join(Workouts, Workouts.WorkoutID == workout_exercises.WorkoutID)
        .join(Exercises, Exercises.ExerciseID == workout_exercises.ExerciseID)
        .filter(workout_exercises.ProfileID == profile_id)
        .order_by(workout_exercises.WorkoutID, workout_exercises.ExerciseID)
        .all()
    )
    # Group into workouts
    grouped: Dict[int, WorkoutOut] = {}
    for r in rows:
        w_id = r[0]
        w_name = r[1]
        ex_out = WorkoutExerciseOut(
            exercise_id=r[2],
            exercise_name=r[3],
            machine_id =r[4],
            sets=r[5],
            reps=r[6],
            weight=r[7],
            notes=r[8],
        )
        if w_id not in grouped:
            grouped[w_id] = WorkoutOut(workout_id=w_id, workout_name=w_name, exercises=[])
        grouped[w_id].exercises.append(ex_out)

    return list(grouped.values())
