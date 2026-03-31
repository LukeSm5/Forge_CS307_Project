from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
from datetime import timezone, datetime
from sqlalchemy import text

from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from app.core.session import get_db
from app.core.seed import engine
from app.core.db import Accounts, Profiles, Workouts, workout_exercises, Exercises, Machines, session_workouts, session_exercises, menu_meals, session_menu_meals
from app.core import repos, session
from app.core.notifications import NotificationService, get_notification_service
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
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session.Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception:
        return {"status": "ok", "db": "disconnected"}


def get_current_account(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> Accounts:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    return repos.lookup_account_by_token(db, authorization)

class ResetPasswordRequest(BaseModel):
    new_password: str
    user_email: str

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

class ExerciseLookupOut(BaseModel):
    exercise_id: int
    name: str

class MachineLookupOut(BaseModel):
    machine_id: int
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class CreateAccountRequest(BaseModel):
    email: str
    username: str
    password: str
    bio: Optional[str] = None

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

class AccountMeResponse(BaseModel):
    profile_id: int
    email: str
    username: str
    bio: Optional[str] = None
    age: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    goals: Optional[str] = None
    gender: Optional[str] = None
    calorie_goal: Optional[float] = None


class MenuMealOut(BaseModel):
    id: int = Field(validation_alias="MenuMealID")
    restaurant: str
    category: str | None
    product: str
    energy_kcal: float | None
    protein_g: float | None
    chicken: bool | None
    beef: bool | None

    class Config:
        from_attributes = True  # lets Pydantic read SQLAlchemy objects


class CreateProfileRequest(BaseModel):
    age: int
    gender: str
    height_in: int
    weight: int
    health_goals: str
    health_status: str
    calorie_goal: float

class WeightConversionRequest(BaseModel):
    profileID: int 
    metricOrImperial: bool  # true for metric, false for imperial
    
class WorkoutLookupOut(BaseModel):
    workout_id: int
    name: str


class SessionExerciseIn(BaseModel):
    exercise_id: int
    machine_id: int
    sets: int = Field(ge=1, le=50)
    reps: int = Field(ge=1, le=1000)
    weight: Optional[int] = None

class CreateSessionRequest(BaseModel):
    profile_id: int
    workout_id: int
    duration: int
    notes: Optional[str] = None
    exercises: List[SessionExerciseIn]

class SessionExerciseOut(BaseModel):
    exercise_id: int
    exercise_name: str
    machine_id: int
    set_number: int
    reps: int
    weight: Optional[int]

class SessionOut(BaseModel):
    session_id: int
    workout_id: int
    workout_name: str
    split_name: Optional[str]
    date: str
    duration: int
    exercises: List[SessionExerciseOut]

class CreateSessionRequest(BaseModel):
    profile_id: int
    workout_id: int
    duration: int
    split_name: str
    exercises: List[SessionExerciseIn]


class LogMenuMealRequest(BaseModel):
    menu_meal_id: int
    meal_type: str  # breakfast / lunch / dinner / snack


class SessionMenuMealOut(BaseModel):
    session_id: int = Field(validation_alias="SessionID")
    profile_id: int = Field(validation_alias="ProfileID")
    menu_meal_id: int = Field(validation_alias="MenuMealID")
    date: datetime
    meal_type: str

    restaurant: str
    category: Optional[str] = None
    product: str
    serving_size: Optional[float] = None
    energy_kcal: Optional[float] = None
    carbohydrates_g: Optional[float] = None
    protein_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    total_fat_g: Optional[float] = None
    saturated_fat_g: Optional[float] = None
    trans_fat_g: Optional[float] = None
    cholesterol_mg: Optional[float] = None
    sodium_mg: Optional[float] = None

    class Config:
        from_attributes = True


def _send_account_update_notification(
    notifier: NotificationService,
    *,
    account: Accounts,
    update_type: str,
) -> bool:
    try:
        notifier.send_update_notification(
            recipient_email=account.email,
            username=account.username,
            update_type=update_type,
        )
        return True
    except Exception:
        logger.exception(
            "Failed to send notification for user_id=%s update_type=%s",
            account.UserID,
            update_type,
        )
        return False

@app.post("/auth/create_account", response_model=TokenResponse)
def create_account(payload: CreateAccountRequest, db: Session = Depends(get_db)):
    try:
        new_account = am.register_user(
            db,
            Accounts,
            am.RegisterInput(
                email=payload.email,
                username=payload.username,
                password=payload.password,
                bio=payload.bio or "",
            ),
        )
    except am.EmailAlreadyInUse:
        raise HTTPException(status_code=409, detail="Email already in use")
    except am.UsernameAlreadyInUse:
        raise HTTPException(status_code=409, detail="Username already in use")
    except am.InvalidPassword as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    access = create_access_token(user_id=new_account.UserID)
    refresh = generate_refresh_token()

    new_account.refresh_token_hash = hash_refresh_token(refresh)
    new_account.refresh_expires_at = refresh_expiry()

    db.add(new_account)
    db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh, expires_in=2 * 60)


@app.post("/profiles/{user_id}")
def create_profile(user_id: int, payload: CreateProfileRequest, db: Session = Depends(get_db)):
    existing = db.query(Profiles).filter(Profiles.ProfileID == user_id).first()
    if existing:
        # update if already exists
        existing.age = payload.age
        existing.gender = payload.gender
        existing.height_in = payload.height_in
        existing.weight = payload.weight
        existing.health_goals = payload.health_goals
        existing.health_status = payload.health_status
        existing.calorie_goal = payload.calorie_goal
    else:
        profile = Profiles(
            ProfileID=user_id,
            metricOrImperial=False,
            age=payload.age,
            gender=payload.gender,
            height_in=payload.height_in,
            weight=payload.weight,
            health_goals=payload.health_goals,
            health_status=payload.health_status,
            calorie_goal=payload.calorie_goal,
        )
        db.add(profile)
    db.commit()
    return {"ok": True, "calorie_goal": payload.calorie_goal}


def _send_profile_update_notification(
    notifier: NotificationService,
    *,
    db: Session,
    profile_id: int,
    update_type: str,
) -> bool:
    account = repos.lookup_account_by_id(db, profile_id)
    if not account:
        return False
    return _send_account_update_notification(
        notifier,
        account=account,
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

    notification_sent = _send_account_update_notification(
        notifier,
        account=updated,
        update_type="profile updated",
    )

    return AccountUpdateResponse(
        user_id=updated.UserID,
        email=updated.email,
        username=updated.username,
        message=(
            "Profile updated and notification sent"
            if notification_sent
            else "Profile updated (notification failed)"
        ),
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

    notification_sent = _send_account_update_notification(
        notifier,
        account=account,
        update_type="password changed",
    )
    return {
        "ok": True,
        "message": (
            "Password changed and notification sent"
            if notification_sent
            else "Password changed (notification failed)"
        ),
    }



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


@app.get("/auth/me", response_model=AccountMeResponse)
def auth_me(me: Accounts = Depends(get_current_account), db: Session = Depends(get_db)):
    from app.core.db import Profiles
    profile = db.query(Profiles).filter(Profiles.ProfileID == me.UserID).first()
    print(f"UserID: {me.UserID}, profile: {profile}, calorie_goal: {profile.calorie_goal if profile else None}")
    return AccountMeResponse(
        profile_id=me.UserID,
        email=me.email,
        username=me.username,
        bio=me.bio,
        age=profile.age if profile else None,
        height=profile.height_in if profile else None,
        weight=profile.weight if profile else None,
        goals=profile.health_goals if profile else None,
        gender=profile.gender if profile else None,
        calorie_goal=profile.calorie_goal if profile else None,
    )


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

    if not user.refresh_expires_at or user.refresh_expires_at.replace(tzinfo=timezone.utc) < utcnow():
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


@app.post("/auth/reset_password")
async def resetPasswordEndpoint(
    request: ResetPasswordRequest, session: Session = Depends(get_db)
):
    user = am.get_user_by_email(session, Accounts, request.user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        resetPassword(user, request.new_password, session)
        return {"message": "Password reset successful"}
    except TypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except am.InvalidPassword as e:
        raise HTTPException(status_code=400, detail=str(e))


def resetPassword(user, newPassword, session):
    if (not isinstance(user, Accounts)):
        raise TypeError("User must be an instance of Accounts")
    if (newPassword == None):
        raise ValueError("New password cannot be empty")
    am.validate_new_password(newPassword)
    user.password_hash = am.hash_password(newPassword)
    user.refresh_token_hash = None
    user.refresh_expires_at = None
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
def create_or_save_workout(
    payload: CreateWorkoutRequest,
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
):
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

    _send_profile_update_notification(
        notifier,
        db=db,
        profile_id=payload.profile_id,
        update_type="workout logged",
    )

    return CreateWorkoutResponse(
        workout_id=workout_id,
        workout_name=workout.name,
        inserted_sets=inserted
    )


@app.get("/exercises", response_model=List[ExerciseLookupOut])
def get_exercises(db: Session = Depends(get_db)):
    rows = db.query(Exercises).order_by(Exercises.name.asc()).all()
    return [
        ExerciseLookupOut(exercise_id=row.ExerciseID, name=row.name)
        for row in rows
    ]


@app.get("/machines", response_model=List[MachineLookupOut])
def get_machines(db: Session = Depends(get_db)):
    rows = db.query(Machines).order_by(Machines.MachineID.asc()).all()
    return [
        MachineLookupOut(machine_id=row.MachineID, name=row.name)
        for row in rows
    ]

# used to display muscle groups (back, bicep, chest, ...) as buttons when logging a workout
@app.get("/workouts/list", response_model=List[WorkoutLookupOut])
def get_all_workouts(db: Session = Depends(get_db)):
    rows = db.query(Workouts).order_by(Workouts.name.asc()).all()
    return [WorkoutLookupOut(workout_id=row.WorkoutID, name=row.name) for row in rows]


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


@app.delete("/workouts/{profile_id}/{workout_id}")
def delete_workout_log(
    profile_id: int,
    workout_id: int,
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
):
    try:
        deleted_rows = (
            db.query(workout_exercises)
            .filter(
                workout_exercises.ProfileID == profile_id,
                workout_exercises.WorkoutID == workout_id,
            )
            .delete(synchronize_session=False)
        )
        if deleted_rows == 0:
            raise HTTPException(status_code=404, detail="Workout log not found")

        db.commit()
        _send_profile_update_notification(
            notifier,
            db=db,
            profile_id=profile_id,
            update_type="workout deleted",
        )
        return {"deleted": True, "profile_id": profile_id, "workout_id": workout_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/meals/restaurant/{restaurant}", response_model=list[MenuMealOut])
def get_menumeals_restaurant(restaurant: str, db: Session = Depends(get_db)):
    return repos.lookup_menumeal_by_restaurant(db, restaurant)

@app.get("/meals/protein/{protein}", response_model=list[MenuMealOut])
def get_menumeals_protein(protein: str, db: Session = Depends(get_db)):
    return repos.lookup_menumeal_by_protein(db, protein)

@app.get("/meals", response_model=list[MenuMealOut])
def get_all_menumeals(db: Session = Depends(get_db)):
    return repos.lookup_all_menumeals(db)

@app.get("/meals", response_model=list[MenuMealOut])
def get_menumeals(db: Session = Depends(get_db)):
    return repos.lookup_all_menumeals(db)

'''@app.get("/auth/llm-context")
async def get_llm_context(request: Request, db: Session = Depends(get_db)):
    user = db.query(Accounts).filter(Accounts.email == request.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(Profiles).filter(Profiles.UserID == user.UserID).first()
    workouts = db.query(session_workouts).filter(session_workouts.ProfileID == profile.ProfileID).order_by(session_workouts.date.desc()).limit(5).all()
    workoutString = ""
    for i in range(len(workouts)):
        workoutString += f"Workout {workouts[i].SessionID}:\n"
        exercises = db.query(session_exercises).filter(session_exercises.SessionID == workouts[i].SessionID).all()
        for j in range(len(exercises)):
            workoutString += f"Exercise {j}: {workouts[i].exercises[j].name}\n Sets: {workouts[i].exercises[j].sets}\n Reps: {workouts[i].exercises[j].reps}\n Weight: {workouts[i].exercises[j].weight}\n"
    
    mealString = ""
    meals = db.query(session_meals).filter(session_meals.ProfileID == profile.ProfileID).order_by(session_meals.date.desc()).limit(5).all()
    for i in range(len(meals)):
        mealString += f"Meal {meals[i].name}:\n"
        mealString += f"Calories: {meals[i].calories}\n Servings: {meals[i].servings}\n Protein: {meals[i].protein_g}g\n Carbs: {meals[i].carbohydrates_g}g\n Fat: {meals[i].fat_g}g\n"
    # Need to contruct a string that prints recent workouts and recent meals in a readable LLM format
    profile_data = f"""
    Age: {profile.age}
    Weight: {profile.weight}
    Height: {profile.height_in}
    Health Status: {profile.health_status}
    Health Goals: {profile.health_goals}
    Recent Workouts:
    {workoutString}
    Recent Meals:
    {mealString}
    """
'''

# @app.get("/weightConversion")
def weight_conversion(db: Session = Depends(get_db), request = WeightConversionRequest):
    profile = db.query(Profiles).filter(Profiles.ProfileID == request.profileID).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    # conversion logic to be used for button, imperial = true, metric = false
    if not request.metricOrImperial and profile.metricOrImperial: # currently imperial, want metric

        # have to convert everything to metric 
        profile.height_in = round(profile.height_in * 2.54)
        profile.weight = round(profile.weight * 0.453592)
        #TODO: convert all workouts/meals logged for this profile to metric as well
    elif request.metricOrImperial and not profile.metricOrImperial: # currently metric, want imperial

        # have to convert everything to imperial
        profile.height_in = round(profile.height_in / 2.54)
        profile.weight = round(profile.weight / 0.453592)
        #TODO: convert all workouts/meals logged for this profile to imperial as well
    profile.metricOrImperial = request.metricOrImperial
    db.commit()


@app.post("/sessions", response_model=SessionOut)
def create_session(payload: CreateSessionRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    from app.core.db import Splits

    workout = db.query(Workouts).filter(Workouts.WorkoutID == payload.workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    # look up or create split
    split = db.query(Splits).filter(
        Splits.ProfileID == payload.profile_id,
        Splits.name == payload.split_name
    ).first()
    if not split:
        split = Splits(ProfileID=payload.profile_id, name=payload.split_name)
        db.add(split)
        db.commit()
        db.refresh(split)

    new_session = session_workouts(
        WorkoutID=payload.workout_id,
        ProfileID=payload.profile_id,
        SplitID=split.SplitID,
        date=datetime.utcnow(),
        duration=payload.duration,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    exercise_rows = []
    for ex in payload.exercises:
        for set_num in range(1, ex.sets + 1):
            row = session_exercises(
                SessionID=new_session.SessionID,
                ExerciseID=ex.exercise_id,
                MachineID=ex.machine_id,
                set_number=set_num,
                reps=ex.reps,
                weight=ex.weight,
            )
            db.add(row)
            exercise_rows.append(row)
    db.commit()

    ex_out = []
    for row in exercise_rows:
        ex_obj = db.query(Exercises).filter(Exercises.ExerciseID == row.ExerciseID).first()
        ex_out.append(SessionExerciseOut(
            exercise_id=row.ExerciseID,
            exercise_name=ex_obj.name if ex_obj else "Unknown",
            machine_id=row.MachineID,
            set_number=row.set_number,
            reps=row.reps,
            weight=row.weight,
        ))

    return SessionOut(
        session_id=new_session.SessionID,
        workout_id=workout.WorkoutID,
        workout_name=workout.name,
        split_name=split.name,
        date=str(new_session.date),
        duration=new_session.duration,
        exercises=ex_out,
    )

@app.get("/sessions/{profile_id}", response_model=List[SessionOut])
def get_sessions_for_profile(profile_id: int, db: Session = Depends(get_db)):
    from app.core.db import Splits
    sessions = (
        db.query(session_workouts)
        .filter(session_workouts.ProfileID == profile_id)
        .order_by(session_workouts.date.desc())
        .all()
    )
    result = []
    for s in sessions:
        workout = db.query(Workouts).filter(Workouts.WorkoutID == s.WorkoutID).first()
        split = db.query(Splits).filter(Splits.SplitID == s.SplitID).first() if s.SplitID else None
        ex_rows = (
            db.query(session_exercises)
            .filter(session_exercises.SessionID == s.SessionID)
            .order_by(session_exercises.ExerciseID, session_exercises.set_number)
            .all()
        )
        ex_out = []
        for row in ex_rows:
            ex_obj = db.query(Exercises).filter(Exercises.ExerciseID == row.ExerciseID).first()
            ex_out.append(SessionExerciseOut(
                exercise_id=row.ExerciseID,
                exercise_name=ex_obj.name if ex_obj else "Unknown",
                machine_id=row.MachineID,
                set_number=row.set_number,
                reps=row.reps,
                weight=row.weight,
            ))
        result.append(SessionOut(
            session_id=s.SessionID,
            workout_id=s.WorkoutID,
            workout_name=workout.name if workout else "Unknown",
            split_name=split.name if split else None,
            date=str(s.date),
            duration=s.duration,
            exercises=ex_out,
        ))
    return result

VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}

@app.post("/session-menu-meals", response_model=SessionMenuMealOut)
def log_session_menu_meal(
    payload: LogMenuMealRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    meal_type = payload.meal_type.strip().lower()
    if meal_type not in VALID_MEAL_TYPES:
        raise HTTPException(status_code=400, detail="Invalid meal_type")

    meal = (
        db.query(menu_meals)
        .filter(menu_meals.MenuMealID == payload.menu_meal_id)
        .first()
    )
    if not meal:
        raise HTTPException(status_code=404, detail="Menu meal not found")

    new_row = session_menu_meals(
        ProfileID=me.UserID,
        MenuMealID=payload.menu_meal_id,
        date=datetime.utcnow(),
        meal_type=meal_type,
    )
    db.add(new_row)
    db.commit()
    db.refresh(new_row)

    return SessionMenuMealOut(
        SessionID=new_row.SessionID,
        ProfileID=new_row.ProfileID,
        MenuMealID=new_row.MenuMealID,
        date=new_row.date,
        meal_type=new_row.meal_type,

        restaurant=meal.restaurant,
        category=meal.category,
        product=meal.product,
        serving_size=meal.serving_size,
        energy_kcal=meal.energy_kcal,
        carbohydrates_g=meal.carbohydrates_g,
        protein_g=meal.protein_g,
        fiber_g=meal.fiber_g,
        sugar_g=meal.sugar_g,
        total_fat_g=meal.total_fat_g,
        saturated_fat_g=meal.saturated_fat_g,
        trans_fat_g=meal.trans_fat_g,
        cholesterol_mg=meal.cholesterol_mg,
        sodium_mg=meal.sodium_mg,
    )


@app.get("/session-menu-meals", response_model=List[SessionMenuMealOut])
def get_session_menu_meals(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(session_menu_meals, menu_meals)
        .join(menu_meals, session_menu_meals.MenuMealID == menu_meals.MenuMealID)
        .filter(session_menu_meals.ProfileID == me.UserID)
        .order_by(session_menu_meals.date.desc())
        .all()
    )

    result = []
    for logged, meal in rows:
        result.append(
            SessionMenuMealOut(
                SessionID=logged.SessionID,
                ProfileID=logged.ProfileID,
                MenuMealID=logged.MenuMealID,
                date=logged.date,
                meal_type=logged.meal_type,
                restaurant=meal.restaurant,
                category=meal.category,
                product=meal.product,
                serving_size=meal.serving_size,
                energy_kcal=meal.energy_kcal,
                carbohydrates_g=meal.carbohydrates_g,
                protein_g=meal.protein_g,
                fiber_g=meal.fiber_g,
                sugar_g=meal.sugar_g,
                total_fat_g=meal.total_fat_g,
                saturated_fat_g=meal.saturated_fat_g,
                trans_fat_g=meal.trans_fat_g,
                cholesterol_mg=meal.cholesterol_mg,
                sodium_mg=meal.sodium_mg,
            )
        )
    return result


@app.delete("/session-menu-meals/{session_id}")
def delete_session_menu_meal(
    session_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    row = (
        db.query(session_menu_meals)
        .filter(
            session_menu_meals.SessionID == session_id,
            session_menu_meals.ProfileID == me.UserID,
        )
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Session menu meal not found")

    db.delete(row)
    db.commit()

    return {"message": "Session menu meal deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.fast_api.api:app", host="0.0.0.0", port=8000, reload=True)
