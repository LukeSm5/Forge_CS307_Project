from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from app.core.db import Workouts, workout_exercises, Exercises
from app.core.db import Accounts
from app.core import repos
from app.core.seed import SessionLocal
from app.core import db
from app.core import account_management as am  
from app.core.auth_tokens import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expiry,
    utcnow,
)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ResetPasswordRequest(BaseModel):
    new_password: str
    user_id: int

class WorkoutExerciseIn(BaseModel):
    exercise_id: int
    sets: int = Field(ge=1, le=50)
    reps: int = Field(ge=1, le=1000)
    weight: Optional[float] = None
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
    set_number: int
    reps: int
    weight: Optional[float]
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
def logout(me: Accounts = Depends(repos.lookup_account_by_token), db: Session = Depends(get_db)):
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
def create_or_save_workout(payload: CreateWorkoutRequest):
    try:
        # 1) Ensure workout exists by name
        workout = db.query(Workouts).filter(Workouts.WorkoutName == payload.workout_name).first()
        if workout is None:
            workout = Workouts(WorkoutName=payload.workout_name)
            db.add(workout)
            db.commit()
            db.refresh(workout)

        workout_id = workout.WorkoutID

        # 2) Optionally overwrite existing saved sets for this profile/workout
        if payload.overwrite:
            db.query(workout_exercises).filter(
                workout_exercises.ProfileID == payload.profile_id,
                workout_exercises.WorkoutID == workout_id
            ).delete(synchronize_session=False)
            db.commit()

        # 3) Insert sets (one row per set)
        inserted = 0
        for ex in payload.exercises:
            for set_num in range(1, ex.sets + 1):
                row = workout_exercises(
                    ProfileID=payload.profile_id,
                    WorkoutID=workout_id,
                    ExerciseID=ex.exercise_id,
                    SetNumber=set_num,
                    RepNumber=ex.reps,
                    Weight=ex.weight,
                    Notes=ex.notes
                )
                db.add(row)
                inserted += 1

        db.commit()

        return CreateWorkoutResponse(
            workout_id=workout_id,
            workout_name=workout.WorkoutName,
            inserted_sets=inserted
        )

    finally:
        db.close()


@app.get("/workouts/{profile_id}", response_model=List[WorkoutOut])
def get_workouts_for_profile(profile_id: int):
    try:
        # Fetch all rows for this profile, with workout + exercise names
        rows = (
            db.query(
                workout_exercises.WorkoutID,
                Workouts.WorkoutName,
                workout_exercises.ExerciseID,
                Exercises.ExerciseName,
                workout_exercises.SetNumber,
                workout_exercises.RepNumber,
                workout_exercises.Weight,
                workout_exercises.Notes
            )
            .join(Workouts, Workouts.WorkoutID == workout_exercises.WorkoutID)
            .join(Exercises, Exercises.ExerciseID == workout_exercises.ExerciseID)
            .filter(workout_exercises.ProfileID == profile_id)
            .order_by(workout_exercises.WorkoutID, workout_exercises.ExerciseID, workout_exercises.SetNumber)
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
                set_number=r[4],
                reps=r[5],
                weight=r[6],
                notes=r[7],
            )
            if w_id not in grouped:
                grouped[w_id] = WorkoutOut(workout_id=w_id, workout_name=w_name, exercises=[])
            grouped[w_id].exercises.append(ex_out)

        return list(grouped.values())

    finally:
        db.close()
