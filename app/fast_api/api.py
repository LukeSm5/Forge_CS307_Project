from fastapi import FastAPI, Depends, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import re
from datetime import timezone, datetime, timedelta, date
from sqlalchemy import inspect, text, or_, and_
from openai import OpenAI
import os
import json
import app.core.prompt as prompt
import httpx
import dotenv

from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from app.core import ai_retrieval
from app.core.prompt import tailor_exercise_prompt_text, calorie_goal_prompt_text
from app.core.session import get_db
from app.core.seed import engine
from app.core.db import Accounts, InboxNotifications, Likes, Reactions, Comments, Profiles, Workouts, workout_exercises, Exercises, Machines, session_workouts, session_exercises, menu_meals, session_menu_meals, session_meals, Meals, meal_macros, Ingredients, Friendships, Blocks, Reports, Posts, ChatThreads, GroupGoals, GroupGoalMembers
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

logger = logging.getLogger(__name__)
dotenv.load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set in environment variables. OpenAI API calls will fail.")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.warning("GOOGLE_API_KEY not set in environment variables. Google API calls will fail.")

app = FastAPI()

if not os.getenv("OPENAI_API_KEY"):
    logger.warning("GOOGLE_API_KEY not set in environment variables. Google API calls will fail.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session.Base.metadata.create_all(bind=engine)


def ensure_dev_schema() -> None:
    inspector = inspect(engine)
    try:
        profile_columns = {column["name"] for column in inspector.get_columns("Profiles")}
        menu_meal_columns = {column["name"] for column in inspector.get_columns("menu_meals")}
    except Exception:
        return

    existing_tables = set(inspector.get_table_names())

    try:
        posts_columns = {column["name"] for column in inspector.get_columns("Posts")}
    except Exception:
        posts_columns = set()

    with engine.begin() as connection:
        if "calorie_goal" not in profile_columns:
            connection.execute(text('ALTER TABLE "Profiles" ADD COLUMN calorie_goal FLOAT'))
        if "metricOrImperial" not in profile_columns:
            connection.execute(text('ALTER TABLE "Profiles" ADD COLUMN "metricOrImperial" BOOLEAN'))
        if "chicken" not in menu_meal_columns:
            connection.execute(text('ALTER TABLE "menu_meals" ADD COLUMN chicken BOOLEAN'))
        if "beef" not in menu_meal_columns:
            connection.execute(text('ALTER TABLE "menu_meals" ADD COLUMN beef BOOLEAN'))
        if "gym_location" not in profile_columns:
            connection.execute(text('ALTER TABLE "Profiles" ADD COLUMN gym_location VARCHAR'))
        # Make ExerciseID and WorkoutID nullable on Posts so meal posts don't require them
        if "ExerciseID" in posts_columns:
            try:
                connection.execute(text('ALTER TABLE "Posts" ALTER COLUMN "ExerciseID" DROP NOT NULL'))
            except Exception:
                pass
        if "WorkoutID" in posts_columns:
            try:
                connection.execute(text('ALTER TABLE "Posts" ALTER COLUMN "WorkoutID" DROP NOT NULL'))
            except Exception:
                pass

ensure_dev_schema()

class PostWorkoutPayload(BaseModel):
    session_id: int

class PostInfoPayload(BaseModel):
    post_id: int

class PostTextPayload(BaseModel):
    post_id: int
    text: str

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

class LogRecommendedMenuMealRequest(BaseModel):
    restaurant: str
    order: str
    meal_type: str  # breakfast / lunch / dinner / snack

class CreateWorkoutResponse(BaseModel):
    workout_id: int
    workout_name: str
    inserted_sets: int

class SessionMealOut(BaseModel):
    session_meal_id: int
    profile_id: int
    meal_id: int
    meal_name: str
    date: datetime
    servings: Optional[float] = None
    notes: Optional[str] = None
    ingredients: List[str]
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbs: Optional[float] = None
    sugar: Optional[float] = None
    fiber: Optional[float] = None
    sodium: Optional[float] = None


class AddGeneratedRecipeRequest(BaseModel):
    title: str
    summary: str
    ingredients: List[str]
    steps: List[str]
    meal_type: Optional[str] = None

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

class ExerciseHelpOut(BaseModel):
    exercise_id: int
    name: str
    advice: str
    steps: List[str]

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
    gym_location: Optional[str] = None


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
    gym_location: Optional[str] = None
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
    accepted_terms: bool | None

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
    workout_id: int
    duration: Optional[int] = None
    date: Optional[str] = None  # YYYY-MM-DD
    split_name: str
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


class WorkoutFeedExerciseOut(BaseModel):
    exercise_id: int
    exercise_name: str
    machine_id: Optional[int] = None
    machine_name: Optional[str] = None
    sets: int
    reps: int
    weight: Optional[int] = None


class WorkoutFeedPostOut(BaseModel):
    post_id: int
    session_id: int
    profile_id: int
    username: str
    gym_location: Optional[str] = None
    workout_id: int
    workout_name: str
    split_name: Optional[str] = None
    date: str
    duration: int
    exercises: List[WorkoutFeedExerciseOut]


class LogMenuMealRequest(BaseModel):
    menu_meal_id: int
    meal_type: str  # breakfast / lunch / dinner / snack


class GenericPromptRequest(BaseModel):
    prompt: str


class GenericPromptResponse(BaseModel):
    text: str


class TailorExerciseRequest(BaseModel):
    date: str
    split_name: str
    workout_name: str
    exercise_name: str
    machine_name: str

class TailorExerciseResponse(BaseModel):
    weight: int
    sets: int
    reps: int


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

class ProgressionHistory(BaseModel):
    time: list[int]
    weight: list[int]

class RecalibrateCaloriesRequest(BaseModel):
    current_calorie_goal: int | None = None
    consumed_calories: int
    remaining_calories: int | None = None

class RecalibrateCaloriesResponse(BaseModel):
    calorie_goal: int


class IngestResponse(BaseModel):
    namespace: str
    ingested_count: int


class VectorQueryRequest(BaseModel):
    query: str
    top_k: int = Field(default=5, ge=1, le=20)


class VectorQueryMatch(BaseModel):
    doc_id: str
    score: float
    text: str
    metadata: Dict


class ProfileContextResponse(BaseModel):
    profile_id: int
    context: str


class QuickWorkoutRequest(BaseModel):
    focus: Optional[str] = None
    top_k: int = Field(default=3, ge=1, le=10)


class QuickWorkoutExercise(BaseModel):
    exercise_id: int
    exercise_name: str
    machine_id: Optional[int] = None
    machine_name: Optional[str] = None
    sets: int
    reps: int
    weight: Optional[int] = None
    notes: Optional[str] = None


class QuickWorkoutResponse(BaseModel):
    workout_name: str
    exercises: List[QuickWorkoutExercise]


class GenerateRecipeResponse(BaseModel):
    mode: str
    title: str
    summary: str
    ingredients: List[str]
    steps: List[str]
    based_on_meals: List[str]
    based_on_workouts: List[str]
    restaurant_suggestions: List[Dict[str, str]] = Field(default_factory=list)
    prompt: str


class GenerateRecipeRequest(BaseModel):
    meal_type: Optional[str] = None
    goal: Optional[str] = None
    cravings: Optional[str] = None
    constraints: Optional[str] = None
    no_cook: bool = False


class FriendAddresseePayload(BaseModel):
    addressee_id: int

class FriendAcceptPayload(BaseModel):
    requester_id: int

class ChatListItemOut(BaseModel):
    thread_id: int
    friend_id: int
    friend_username: str
    friend_bio: Optional[str] = None
    friend_gym_location: Optional[str] = None
    created_at: str
    updated_at: str
    last_message_at: Optional[str] = None

class DismissNotificationPayload(BaseModel):
    notification_id: int

class StreakResponse(BaseModel):
    profile_id: int
    workout_streak_weeks: int
    current_week_active: bool
    last_workout_date: Optional[datetime] = None

class BlockPayload(BaseModel):
    blocked_id: int

class ReportPayload(BaseModel):
    reported_id: int
    description: str


class PublishMealPostRequest(BaseModel):
    source: str  # 'tagged' | 'restaurant'
    name: str
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    sugar: Optional[float] = None
    fiber: Optional[float] = None
    sodium: Optional[float] = None
    cuisine: Optional[str] = None
    goal: Optional[str] = None
    complexity: Optional[str] = None
    spice_level: Optional[str] = None
    dietary: Optional[List[str]] = None
    restaurant: Optional[str] = None
    category: Optional[str] = None
    meal_type: Optional[str] = None


class SaveMealFromFeedRequest(BaseModel):
    post_id: int


def _get_openai_client() -> OpenAI | None:
    return OpenAI(api_key=OPENAI_API_KEY)


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


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception:
        return {"status": "ok", "db": "disconnected"}


def _fallback_recipe_response(
    db: Session,
    profile_id: int,
    recipe_prompt: str,
    payload: GenerateRecipeRequest,
) -> GenerateRecipeResponse:
    logged_menu_meals = (
        db.query(session_menu_meals, menu_meals)
        .join(menu_meals, menu_meals.MenuMealID == session_menu_meals.MenuMealID)
        .filter(session_menu_meals.ProfileID == profile_id)
        .order_by(session_menu_meals.date.desc())
        .limit(2)
        .all()
    )
    logged_workouts = (
        db.query(session_workouts, Workouts)
        .join(Workouts, Workouts.WorkoutID == session_workouts.WorkoutID)
        .filter(session_workouts.ProfileID == profile_id)
        .order_by(session_workouts.date.desc())
        .limit(2)
        .all()
    )

    meal_names = [meal_row.product for _, meal_row in logged_menu_meals if meal_row and meal_row.product]
    workout_names = [workout_row.name for _, workout_row in logged_workouts if workout_row and workout_row.name]

    primary_meal = meal_names[0] if meal_names else "your recent logged meals"
    secondary_meal = meal_names[1] if len(meal_names) > 1 else "balanced recovery nutrition"
    primary_workout = workout_names[0] if workout_names else "your recent workouts"
    requested_meal_type = payload.meal_type or "meal"
    requested_goal = payload.goal or "your current goals"
    cravings = payload.cravings or "ingredients you already gravitate toward"
    constraints = payload.constraints or "no extra restrictions"

    if payload.no_cook:
        return GenerateRecipeResponse(
            mode="restaurant",
            title=f"Forge {requested_meal_type.title()} Restaurant Picks",
            summary=(
                f"These quick restaurant options fit {requested_goal}, line up with {primary_workout}, "
                f"and reflect your recent meal patterns while respecting {constraints}."
            ),
            ingredients=[],
            steps=[],
            based_on_meals=[primary_meal, secondary_meal],
            based_on_workouts=[primary_workout],
            restaurant_suggestions=[
                {
                    "restaurant": "Chipotle",
                    "order": "Chicken burrito bowl with white rice, black beans, fajita veggies, pico de gallo, and lettuce",
                    "reason": "High protein, easy to customize, and good for post-workout recovery.",
                },
                {
                    "restaurant": "Chick-fil-A",
                    "order": "Grilled nuggets with a fruit cup and kale crunch side",
                    "reason": "Lean protein with a lighter side if you want a lower-calorie option.",
                },
                {
                    "restaurant": "Subway",
                    "order": "Rotisserie-style chicken bowl or sub loaded with vegetables",
                    "reason": "Flexible, widely available, and easy to fit around constraints or cravings.",
                },
            ],
            prompt=recipe_prompt,
        )

    return GenerateRecipeResponse(
        mode="recipe",
        title=f"Forge {requested_meal_type.title()} Bowl",
        summary=(
            f"This recipe is based on {primary_meal}, tuned to support {primary_workout}, and shaped around {requested_goal}. "
            f"It also accounts for {cravings} while respecting {constraints}."
        ),
        ingredients=[
            "1 cup cooked rice",
            "6 oz chicken breast",
            "1 cup roasted vegetables",
            "1/2 avocado",
            "1 tbsp olive oil",
            "Salt, pepper, and garlic to taste",
        ],
        steps=[
            "Cook the rice and season the chicken with salt, pepper, and garlic.",
            "Pan-sear or bake the chicken until fully cooked, then slice it.",
            "Roast or saute the vegetables until tender.",
            "Assemble the rice, chicken, vegetables, and avocado in a bowl.",
            "Finish with olive oil and adjust seasoning before serving.",
        ],
        based_on_meals=[primary_meal, secondary_meal],
        based_on_workouts=[primary_workout],
        restaurant_suggestions=[],
        prompt=recipe_prompt,
    )

def _recipe_history_defaults(db: Session, profile_id: int) -> tuple[List[str], List[str]]:
    meal_refs: List[str] = []
    workout_refs: List[str] = []

    logged_menu_meals = (
        db.query(session_menu_meals, menu_meals)
        .join(menu_meals, menu_meals.MenuMealID == session_menu_meals.MenuMealID)
        .filter(session_menu_meals.ProfileID == profile_id)
        .order_by(session_menu_meals.date.desc())
        .limit(2)
        .all()
    )
    meal_refs.extend(
        meal_row.product
        for _, meal_row in logged_menu_meals
        if meal_row and meal_row.product
    )

    logged_at_home = (
        db.query(session_meals, Meals)
        .join(Meals, Meals.MealID == session_meals.MealID)
        .filter(session_meals.ProfileID == profile_id)
        .order_by(session_meals.date.desc())
        .limit(2)
        .all()
    )
    meal_refs.extend(
        meal_row.name
        for _, meal_row in logged_at_home
        if meal_row and meal_row.name
    )

    logged_workouts = (
        db.query(session_workouts, Workouts)
        .join(Workouts, Workouts.WorkoutID == session_workouts.WorkoutID)
        .filter(session_workouts.ProfileID == profile_id)
        .order_by(session_workouts.date.desc())
        .limit(2)
        .all()
    )
    workout_refs.extend(
        workout_row.name
        for _, workout_row in logged_workouts
        if workout_row and workout_row.name
    )

    if not meal_refs:
        meal_refs = ["No logged meals yet for this user"]
    if not workout_refs:
        workout_refs = ["No logged workouts yet for this user"]

    return meal_refs[:2], workout_refs[:2]


def _week_start(value: datetime) -> date:
    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    day = value.date()
    return day - timedelta(days=day.weekday())


def _calculate_workout_streak(db: Session, profile_id: int) -> StreakResponse:
    rows = (
        db.query(session_workouts.date)
        .filter(session_workouts.ProfileID == profile_id)
        .order_by(session_workouts.date.desc())
        .all()
    )

    if not rows:
        return StreakResponse(
            profile_id=profile_id,
            workout_streak_weeks=0,
            current_week_active=False,
            last_workout_date=None,
        )

    workout_dates = [row[0] for row in rows if row[0] is not None]
    active_weeks = {_week_start(workout_date) for workout_date in workout_dates}
    current_week = _week_start(datetime.now(timezone.utc))
    current_week_active = current_week in active_weeks

    streak = 0
    cursor = current_week
    if current_week_active:
        while cursor in active_weeks:
            streak += 1
            cursor -= timedelta(days=7)

    return StreakResponse(
        profile_id=profile_id,
        workout_streak_weeks=streak,
        current_week_active=current_week_active,
        last_workout_date=max(workout_dates) if workout_dates else None,
    )


def _profiles_can_view_streak(db: Session, viewer_id: int, target_id: int) -> bool:
    if viewer_id == target_id:
        return True

    blocked = db.query(Blocks).filter(
        or_(
            and_(Blocks.BlockerID == viewer_id, Blocks.BlockedID == target_id),
            and_(Blocks.BlockerID == target_id, Blocks.BlockedID == viewer_id),
        )
    ).first()
    if blocked:
        return False

    friendship = repos.lookup_friendship(db, viewer_id, target_id)
    return friendship is not None and friendship.status == "accepted"


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
def create_account(
    payload: CreateAccountRequest,
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
):
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

    _send_account_update_notification(
        notifier,
        account=new_account,
        update_type="account created",
    )

    return TokenResponse(access_token=access, refresh_token=refresh, expires_in=2 * 60)


@app.post("/profiles/{user_id}")
def create_profile(user_id: int, payload: CreateProfileRequest, db: Session = Depends(get_db)):
    if not payload.accepted_terms:
        return {"ok": False, "error": "Terms must be accepted to create profile"}
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
    if payload.username is None and payload.bio is None and payload.gym_location is None:
        raise HTTPException(status_code=400, detail="Provide at least one field to update")

    try:
        updated = am.update_profile(
            db,
            Accounts,
            user_id=user_id,
            payload=am.UpdateProfileInput(username=payload.username, bio=payload.bio, gym_location=payload.gym_location),
        )
        
        profile = db.query(Profiles).filter(Profiles.ProfileID == user_id).first()
        if payload.gym_location is not None:
            if profile is None:
                raise HTTPException(status_code=404, detail="Profile not found")

            profile.gym_location = payload.gym_location
            db.add(profile)
            db.commit()

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
        gym_location=profile.gym_location if profile else None,
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
    request: ResetPasswordRequest,
    session: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
):
    user = am.get_user_by_email(session, Accounts, request.user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        resetPassword(user, request.new_password, session)
        notification_sent = _send_account_update_notification(
            notifier,
            account=user,
            update_type="password reset",
        )
        return {
            "message": (
                "Password reset successful and notification sent"
                if notification_sent
                else "Password reset successful (notification failed)"
            )
        }
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


@app.get("/profiles/{profile_id}/context", response_model=ProfileContextResponse)
def get_profile_context(profile_id: int, db: Session = Depends(get_db)):
    return ProfileContextResponse(
        profile_id=profile_id,
        context=ai_retrieval.build_profile_context(db, profile_id),
    )


@app.post("/ai/ingest/workouts", response_model=IngestResponse)
def ingest_workout_vectors(db: Session = Depends(get_db)):
    ingested_count = ai_retrieval.ingest_namespace(db, "workouts")
    return IngestResponse(namespace="workouts", ingested_count=ingested_count)


@app.post("/ai/ingest/meals", response_model=IngestResponse)
def ingest_meal_vectors(db: Session = Depends(get_db)):
    ingested_count = ai_retrieval.ingest_namespace(db, "meals")
    return IngestResponse(namespace="meals", ingested_count=ingested_count)


@app.post("/ai/ingest/profiles", response_model=IngestResponse)
def ingest_profile_vectors(db: Session = Depends(get_db)):
    ingested_count = ai_retrieval.ingest_namespace(db, "profiles")
    return IngestResponse(namespace="profiles", ingested_count=ingested_count)


@app.post("/ai/query/workouts", response_model=List[VectorQueryMatch])
def query_workout_vectors(payload: VectorQueryRequest, db: Session = Depends(get_db)):
    matches = ai_retrieval.query_namespace(db, "workouts", payload.query, payload.top_k)
    return [VectorQueryMatch(**match) for match in matches]


@app.post("/ai/query/meals", response_model=List[VectorQueryMatch])
def query_meal_vectors(payload: VectorQueryRequest, db: Session = Depends(get_db)):
    matches = ai_retrieval.query_namespace(db, "meals", payload.query, payload.top_k)
    return [VectorQueryMatch(**match) for match in matches]


@app.post("/ai/query/profiles", response_model=List[VectorQueryMatch])
def query_profile_vectors(payload: VectorQueryRequest, db: Session = Depends(get_db)):
    matches = ai_retrieval.query_namespace(db, "profiles", payload.query, payload.top_k)
    return [VectorQueryMatch(**match) for match in matches]


@app.post("/ai/quick-workout", response_model=QuickWorkoutResponse)
def generate_quick_workout(payload: QuickWorkoutRequest, db: Session = Depends(get_db)):
    generated = ai_retrieval.generate_quick_workout(
        db,
        profile_id=payload.profile_id,
        focus=payload.focus,
        top_k=payload.top_k,
    )
    return QuickWorkoutResponse(**generated)


@app.post("/ai/generate-recipe", response_model=GenerateRecipeResponse)
def generate_recipe(
    payload: GenerateRecipeRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    recipe_prompt = prompt.generate_recipe_prompt_text(
        db,
        me.UserID,
        meal_type=payload.meal_type,
        goal=payload.goal,
        cravings=payload.cravings,
        constraints=payload.constraints,
        no_cook=payload.no_cook,
    )
    client = _get_openai_client()

    if client is None:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured for recipe generation",
        )

    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_RECIPE_MODEL", "gpt-4.1-mini"),
            input=recipe_prompt,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "forge_recipe",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "mode": {"type": "string", "enum": ["recipe", "restaurant"]},
                            "summary": {"type": "string"},
                            "ingredients": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "steps": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "based_on_meals": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "based_on_workouts": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "restaurant_suggestions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "restaurant": {"type": "string"},
                                        "order": {"type": "string"},
                                        "reason": {"type": "string"},
                                    },
                                    "required": ["restaurant", "order", "reason"],
                                    "additionalProperties": False,
                                },
                            },
                        },
                        "required": [
                            "mode",
                            "title",
                            "summary",
                            "ingredients",
                            "steps",
                            "based_on_meals",
                            "based_on_workouts",
                            "restaurant_suggestions",
                        ],
                        "additionalProperties": False,
                    },
                }
            },
        )
        parsed = json.loads(response.output_text)
        meal_refs, workout_refs = _recipe_history_defaults(db, me.UserID)
        if not parsed.get("based_on_meals"):
            parsed["based_on_meals"] = meal_refs
        if not parsed.get("based_on_workouts"):
            parsed["based_on_workouts"] = workout_refs
        if not parsed.get("mode"):
            parsed["mode"] = "restaurant" if payload.no_cook else "recipe"
        if "restaurant_suggestions" not in parsed or parsed["restaurant_suggestions"] is None:
            parsed["restaurant_suggestions"] = []
        parsed["prompt"] = recipe_prompt
        return GenerateRecipeResponse(**parsed)
    except Exception as exc:
        logger.exception("Recipe generation failed for profile_id=%s", me.UserID)
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI recipe generation failed: {exc}",
        ) from exc


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


@app.get("/exercises/{exercise_id}/help", response_model=ExerciseHelpOut)
def get_exercise_help(exercise_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Exercises)
        .filter(Exercises.ExerciseID == exercise_id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Exercise not found")

    advice = (row.advice or "").strip()

    matches = re.findall(
        r'(\d+)\.\s*(.*?)(?=(?:\s+\d+\.\s)|$)',
        advice,
        flags=re.DOTALL,
    )
    steps = [text.strip() for _, text in matches if text.strip()]

    if not steps and advice:
        steps = [advice]

    if not steps:
        steps = [
            f"Set up for {row.name}.",
            "Use controlled movement and full range of motion.",
            "Keep your core tight and maintain good posture.",
            "Stop if you feel sharp pain and adjust your form.",
        ]

    return ExerciseHelpOut(
        exercise_id=row.ExerciseID,
        name=row.name,
        advice=advice,
        steps=steps,
    )


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

@app.get("/auth/llm-context")
async def get_llm_context(request: Request, db: Session = Depends(get_db)):
    user = db.query(Accounts).filter(Accounts.email == request.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(Profiles).filter(Profiles.UserID == user.UserID).first()
    prompt = prompt.profile_prompt_text(db, profile.profileID)
    workoutString = prompt.workout_history_text(db, profile.profileID)
    prompt += workoutString
    mealString = prompt.menu_meal_history_text(db, profile.profileID)
    prompt += mealString
    return prompt


def _build_session_exercise_summary(db: Session, session_id: int) -> List[WorkoutFeedExerciseOut]:
    rows = (
        db.query(session_exercises)
        .filter(session_exercises.SessionID == session_id)
        .order_by(session_exercises.ExerciseID, session_exercises.set_number)
        .all()
    )

    grouped: Dict[tuple[int, Optional[int]], WorkoutFeedExerciseOut] = {}
    for row in rows:
        key = (row.ExerciseID, row.MachineID)
        current = grouped.get(key)
        if current is None:
            ex_obj = db.query(Exercises).filter(Exercises.ExerciseID == row.ExerciseID).first()
            machine_obj = (
                db.query(Machines).filter(Machines.MachineID == row.MachineID).first()
                if row.MachineID is not None
                else None
            )
            grouped[key] = WorkoutFeedExerciseOut(
                exercise_id=row.ExerciseID,
                exercise_name=ex_obj.name if ex_obj else "Unknown",
                machine_id=row.MachineID,
                machine_name=machine_obj.name if machine_obj else None,
                sets=1,
                reps=row.reps or 0,
                weight=row.weight,
            )
        else:
            current.sets += 1

    return list(grouped.values())


def _blocked_user_ids(db: Session, user_id: int) -> set[int]:
    rows = (
        db.query(Blocks)
        .filter(or_(Blocks.BlockerID == user_id, Blocks.BlockedID == user_id))
        .all()
    )
    blocked_ids: set[int] = set()
    for row in rows:
        if row.BlockerID == user_id:
            blocked_ids.add(row.BlockedID)
        else:
            blocked_ids.add(row.BlockerID)
    return blocked_ids


WORKOUT_SESSION_MARKER_RE = re.compile(r"\[WORKOUT_SESSION:(\d+)\]")


def _workout_post_caption(session_id: int, workout_name: str, split_name: Optional[str]) -> str:
    title = (split_name or workout_name or "Workout").strip()
    return f"[WORKOUT_SESSION:{session_id}] {title}"


def _extract_session_id_from_post_caption(caption: Optional[str]) -> Optional[int]:
    if not caption:
        return None
    match = WORKOUT_SESSION_MARKER_RE.search(caption)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def _next_post_id(db: Session) -> int:
    last = db.query(Posts).order_by(Posts.PostID.desc()).first()
    return 1 if last is None else int(last.PostID) + 1


def _fallback_machine_id(db: Session) -> int:
    bodyweight = db.query(Machines).filter(Machines.name.ilike("body weight")).first()
    if bodyweight:
        return bodyweight.MachineID
    first_machine = db.query(Machines).order_by(Machines.MachineID.asc()).first()
    if not first_machine:
        raise HTTPException(status_code=500, detail="No machines available for post creation")
    return first_machine.MachineID


def _find_workout_post_rows_for_session(
    db: Session,
    profile_id: int,
    session_id: int,
) -> List[Posts]:
    post_rows = db.query(Posts).filter(Posts.ProfileID == profile_id).all()
    return [
        post_row
        for post_row in post_rows
        if _extract_session_id_from_post_caption(post_row.caption) == session_id
    ]


def _delete_posts_and_related_rows(db: Session, post_ids: List[int]) -> None:
    if not post_ids:
        return

    db.query(Likes).filter(Likes.PostID.in_(post_ids)).delete(synchronize_session=False)
    db.query(Reactions).filter(Reactions.PostID.in_(post_ids)).delete(synchronize_session=False)
    db.query(Comments).filter(Comments.PostID.in_(post_ids)).delete(synchronize_session=False)
    db.query(Posts).filter(Posts.PostID.in_(post_ids)).delete(synchronize_session=False)



def _delete_workout_posts_for_session(
    db: Session,
    profile_id: int,
    session_id: int,
) -> List[int]:
    matching_posts = _find_workout_post_rows_for_session(db, profile_id, session_id)
    post_ids = [int(post_row.PostID) for post_row in matching_posts]
    _delete_posts_and_related_rows(db, post_ids)
    return post_ids


def _build_feed_post_from_saved_post(db: Session, post_row: Posts) -> Optional[WorkoutFeedPostOut]:
    session_id = _extract_session_id_from_post_caption(post_row.caption)
    if session_id is None:
        return None

    session_row = (
        db.query(session_workouts)
        .filter(session_workouts.SessionID == session_id)
        .first()
    )
    if session_row is None:
        return None

    account = db.query(Accounts).filter(Accounts.UserID == session_row.ProfileID).first()
    profile = db.query(Profiles).filter(Profiles.ProfileID == session_row.ProfileID).first()
    workout = db.query(Workouts).filter(Workouts.WorkoutID == session_row.WorkoutID).first()
    if account is None or workout is None:
        return None

    from app.core.db import Splits

    split = None
    if session_row.SplitID:
        split = db.query(Splits).filter(Splits.SplitID == session_row.SplitID).first()

    return WorkoutFeedPostOut(
        post_id=post_row.PostID,
        session_id=session_row.SessionID,
        profile_id=session_row.ProfileID,
        username=account.username,
        gym_location=profile.gym_location if profile else None,
        workout_id=workout.WorkoutID,
        workout_name=workout.name,
        split_name=split.name if split else None,
        date=str(session_row.date),
        duration=session_row.duration,
        exercises=_build_session_exercise_summary(db, session_row.SessionID),
    )


@app.post("/sessions", response_model=SessionOut)
def create_workout_session(
    payload: CreateSessionRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    from app.core.db import Splits

    workout = db.query(Workouts).filter(Workouts.WorkoutID == payload.workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    split_name = payload.split_name.strip()

    split = db.query(Splits).filter(
        Splits.ProfileID == me.UserID,
        Splits.name == split_name
    ).first()
    if not split:
        split = Splits(ProfileID=me.UserID, name=split_name)
        db.add(split)
        db.commit()
        db.refresh(split)

    if payload.date:
        try:
            session_dt = datetime.strptime(payload.date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
    else:
        session_dt = datetime.utcnow()

    duration_value = payload.duration if payload.duration is not None else 0

    new_session = session_workouts(
        WorkoutID=payload.workout_id,
        ProfileID=me.UserID,
        SplitID=split.SplitID,
        date=session_dt,
        duration=duration_value,
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


@app.get("/sessions", response_model=List[SessionOut])
def get_my_workout_sessions(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    from app.core.db import Splits

    sessions = (
        db.query(session_workouts)
        .filter(session_workouts.ProfileID == me.UserID)
        .order_by(session_workouts.date.desc())
        .all()
    )

    result: List[SessionOut] = []
    for s in sessions:
        workout = db.query(Workouts).filter(Workouts.WorkoutID == s.WorkoutID).first()
        split = db.query(Splits).filter(Splits.SplitID == s.SplitID).first() if s.SplitID else None

        exercise_rows = (
            db.query(session_exercises)
            .filter(session_exercises.SessionID == s.SessionID)
            .order_by(session_exercises.ExerciseID, session_exercises.set_number)
            .all()
        )

        ex_out: List[SessionExerciseOut] = []
        for row in exercise_rows:
            ex_obj = db.query(Exercises).filter(Exercises.ExerciseID == row.ExerciseID).first()
            ex_out.append(
                SessionExerciseOut(
                    exercise_id=row.ExerciseID,
                    exercise_name=ex_obj.name if ex_obj else "Unknown",
                    machine_id=row.MachineID,
                    set_number=row.set_number,
                    reps=row.reps,
                    weight=row.weight,
                )
            )

        result.append(
            SessionOut(
                session_id=s.SessionID,
                workout_id=s.WorkoutID,
                workout_name=workout.name if workout else "Unknown",
                split_name=split.name if split else None,
                date=str(s.date),
                duration=s.duration,
                exercises=ex_out,
            )
        )

    return result


@app.delete("/sessions/{session_id}")
def delete_workout_session(
    session_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    session_row = (
        db.query(session_workouts)
        .filter(
            session_workouts.SessionID == session_id,
            session_workouts.ProfileID == me.UserID,
        )
        .first()
    )

    if not session_row:
        raise HTTPException(status_code=404, detail="Workout session not found")

    _delete_workout_posts_for_session(db, me.UserID, session_id)

    db.query(session_exercises).filter(
        session_exercises.SessionID == session_id
    ).delete(synchronize_session=False)

    db.delete(session_row)
    db.commit()
    return {"deleted": True, "session_id": session_id}

VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}

def _build_session_meal_out(
    db: Session,
    entry: session_meals,
) -> SessionMealOut:
    meal = db.query(Meals).filter(Meals.MealID == entry.MealID).first()
    macros = db.query(meal_macros).filter(meal_macros.MealID == entry.MealID).first()
    ingredients = db.execute(
        text(
            'SELECT i.name '
            'FROM "meal_ingredients" mi '
            'JOIN "Ingredients" i ON i."IngredientID" = mi."IngredientID" '
            'WHERE mi."MealID" = :meal_id '
            'ORDER BY mi."IngredientID" ASC'
        ),
        {"meal_id": entry.MealID},
    ).fetchall()

    return SessionMealOut(
        session_meal_id=entry.SessionMealID,
        profile_id=entry.ProfileID,
        meal_id=entry.MealID,
        meal_name=meal.name if meal else "Unknown Meal",
        date=entry.date,
        servings=entry.servings,
        notes=entry.notes,
        ingredients=[ingredient_name for (ingredient_name,) in ingredients if ingredient_name],
        calories=macros.calories if macros else None,
        protein=macros.protein if macros else None,
        fat=macros.fat if macros else None,
        carbs=macros.carbs if macros else None,
        sugar=macros.sugar if macros else None,
        fiber=macros.fiber if macros else None,
        sodium=macros.sodium if macros else None,
    )


@app.get("/session-meals", response_model=List[SessionMealOut])
def get_session_meals(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(session_meals)
        .filter(session_meals.ProfileID == me.UserID)
        .order_by(session_meals.date.desc(), session_meals.SessionMealID.desc())
        .all()
    )
    return [_build_session_meal_out(db, row) for row in rows]


@app.post("/session-meals/generated", response_model=SessionMealOut, status_code=201)
def add_generated_recipe_to_log(
    payload: AddGeneratedRecipeRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    meal_name = payload.title.strip()
    if not meal_name:
        raise HTTPException(status_code=400, detail="Recipe title is required")

    summary = payload.summary.strip()
    steps = [step.strip() for step in payload.steps if step.strip()]
    ingredient_names = [item.strip() for item in payload.ingredients if item.strip()]

    meal = Meals(name=meal_name)
    db.add(meal)
    db.flush()

    for ingredient_name in ingredient_names:
        ingredient = (
            db.query(Ingredients)
            .filter(Ingredients.name == ingredient_name)
            .first()
        )
        if ingredient is None:
            ingredient = Ingredients(name=ingredient_name)
            db.add(ingredient)
            db.flush()

        db.execute(
            text(
                'INSERT INTO "meal_ingredients" ("MealID", "IngredientID", serving_size, instructions) '
                'VALUES (:meal_id, :ingredient_id, :serving_size, :instructions)'
            ),
            {
                "meal_id": meal.MealID,
                "ingredient_id": ingredient.IngredientID,
                "serving_size": None,
                "instructions": "\n".join(steps) if steps else "",
            },
        )

    note_lines: List[str] = []
    if payload.meal_type and payload.meal_type.strip():
        note_lines.append(f"Meal type: {payload.meal_type.strip()}")
    if summary:
        note_lines.append(summary)
    if steps:
        note_lines.append("Steps:")
        note_lines.extend(f"{index + 1}. {step}" for index, step in enumerate(steps))

    entry = session_meals(
        ProfileID=me.UserID,
        MealID=meal.MealID,
        date=datetime.utcnow(),
        servings=1.0,
        notes="\n".join(note_lines) if note_lines else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return _build_session_meal_out(db, entry)


@app.post("/session-menu-meals/recommended", response_model=SessionMenuMealOut)
def log_recommended_menu_meal(
    payload: LogRecommendedMenuMealRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    meal_type = payload.meal_type.strip().lower()
    if meal_type not in VALID_MEAL_TYPES:
        raise HTTPException(status_code=400, detail="Invalid meal_type")

    restaurant = payload.restaurant.strip()
    order = payload.order.strip()
    if not restaurant or not order:
        raise HTTPException(status_code=400, detail="Restaurant and order are required")

    meal = (
        db.query(menu_meals)
        .filter(
            menu_meals.restaurant == restaurant,
            menu_meals.product == order,
        )
        .first()
    )

    if meal is None:
        current_max = db.query(menu_meals.MenuMealID).order_by(menu_meals.MenuMealID.desc()).first()
        next_id = (current_max[0] + 1) if current_max and current_max[0] is not None else 0
        meal = menu_meals(
            MenuMealID=next_id,
            restaurant=restaurant,
            category="AI Recommendation",
            product=order,
            serving_size=None,
            energy_kcal=None,
            carbohydrates_g=None,
            protein_g=None,
            fiber_g=None,
            sugar_g=None,
            total_fat_g=None,
            saturated_fat_g=None,
            trans_fat_g=None,
            cholesterol_mg=None,
            sodium_mg=None,
            chicken=None,
            beef=None,
        )
        db.add(meal)
        db.flush()

    new_row = session_menu_meals(
        ProfileID=me.UserID,
        MenuMealID=meal.MenuMealID,
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


@app.get("/exercise_progression_history/{exercise_name}", response_model=ProgressionHistory)
def get_exercise_progression_history(
    exercise_name: str,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    exercise_id = db.query(Exercises.ExerciseID).filter(Exercises.name == exercise_name).first()
    if not exercise_id:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    exercise_id = exercise_id[0]

    # get all of users sessions
    # then filter all exercises that match the exercise_id and one of the session IDs
    sessions = db.query(session_workouts).filter(session_workouts.ProfileID == me.UserID).all()
    session_ids = [s.SessionID for s in sessions]
    rows = (
        db.query(session_exercises)
        .filter(
            session_exercises.ExerciseID == exercise_id,
            session_exercises.SessionID.in_(session_ids)
        )
        .all()
    )

    history = {}
    for r in rows:
        session = db.query(session_workouts).filter(session_workouts.SessionID == r.SessionID).first()
        time = session.date.timestamp()
        if time in history:
            history[time] = max(history[time], r.weight)
        else:
            history[time] = r.weight
    
    historyArr = [(t, w) for t, w in history.items()]
    historyArr.sort(key=lambda x: x[0])  # sort by timestamp ascending

    return ProgressionHistory(time=[ t for t, _ in historyArr ], weight=[ w for _, w in historyArr ])

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


@app.post('/generic-prompt', response_model=GenericPromptResponse)
def generic_prompt(
    payload: GenericPromptRequest,
):
    prompt = payload.prompt
    client = _get_openai_client()
    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_GENERIC_MODEL", "gpt-4.1-mini"),
            input=prompt,
        )
        return GenericPromptResponse(text=response.output_text)
    except Exception:
        logger.exception("Generic prompt failed")
        return GenericPromptResponse(text="Sorry, something went wrong with your request.")


@app.post("/tailor-exercise", response_model=TailorExerciseResponse)
def tailor_exercise(
    payload: TailorExerciseRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    prompt = tailor_exercise_prompt_text(db, me.UserID, payload)
    client = _get_openai_client()

    response = client.responses.create(
        model="gpt-5",
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "my_exercise_numbers",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "weight": {"type": "number"},
                        "sets": {"type": "number"},
                        "reps": {"type": "number"}
                    },
                    "required": ["weight", "sets", "reps"],
                    "additionalProperties": False
                }
            }
        }
    )

    parsed = json.loads(response.output_text)

    return TailorExerciseResponse(weight=int(parsed["weight"]), sets=int(parsed["sets"]), reps=int(parsed["reps"]))


@app.post("/recalibrate-calories", response_model=RecalibrateCaloriesResponse)
def recalibrate_calories(
    payload: RecalibrateCaloriesRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    prompt = calorie_goal_prompt_text(db, me.UserID, payload)
    client = _get_openai_client()

    response = client.responses.create(
        model="gpt-5",
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "my_calorie_goal",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "calorie_goal": {"type": "number"}
                    },
                    "required": ["calorie_goal"],
                    "additionalProperties": False
                }
            }
        }
    )

    parsed = json.loads(response.output_text)
    new_goal = float(parsed["calorie_goal"])
    
    profile = db.query(Profiles).filter(Profiles.ProfileID == me.UserID).first()
    profile.calorie_goal = new_goal
    db.commit()
    db.refresh(profile)

    return RecalibrateCaloriesResponse(calorie_goal=new_goal)

@app.get("/posts/workouts/mine", response_model=List[int])
def get_my_workout_post_session_ids(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = db.query(Posts).filter(Posts.ProfileID == me.UserID).all()
    session_ids: List[int] = []
    for row in rows:
        session_id = _extract_session_id_from_post_caption(row.caption)
        if session_id is not None:
            session_ids.append(session_id)
    return sorted(set(session_ids))


@app.post("/posts/likes")
def get_post_likes(
    payload: PostInfoPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = db.query(Likes).filter(Likes.PostID == payload.post_id).all()
    return { "likes": [
        {
            "user_id": row.ProfileID,
            "username": db.query(Accounts).filter(Accounts.UserID == row.ProfileID).first().username
        }
        for row in rows
    ] }


@app.post("/posts/reactions")
def get_post_reactions(
    payload: PostInfoPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = db.query(Reactions).filter(Reactions.PostID == payload.post_id).all()
    return { "reactions": [
        {
            "user_id": row.ProfileID,
            "username": db.query(Accounts).filter(Accounts.UserID == row.ProfileID).first().username,
            "reaction": row.reaction_type,
        }
        for row in rows
    ] }

@app.post("/posts/comments")
def get_post_comments(
    payload: PostInfoPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = db.query(Comments).filter(Comments.PostID == payload.post_id).all()
    return { "comments": [
        {
            "user_id": row.ProfileID,
            "username": db.query(Accounts).filter(Accounts.UserID == row.ProfileID).first().username,
            "text": row.text,
            "timestamp": row.timestamp,
        }
        for row in rows
    ] }


@app.post("/feed/likePost")
def like_post(
    payload: PostInfoPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if db.query(Likes).filter(Likes.PostID == payload.post_id, Likes.ProfileID == me.UserID).first():
        raise HTTPException(status_code=400, detail="Post already liked")
    like = Likes(PostID=payload.post_id, ProfileID=me.UserID)
    db.add(like)
    db.commit()

    post = db.query(Posts).filter(Posts.PostID == payload.post_id).first()

    add_notification(db, post.ProfileID, f"{me.username} liked your post")

    return {"ok": True, "detail": "Post liked"}


@app.post("/feed/unlikePost")
def like_post(
    payload: PostInfoPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if not db.query(Likes).filter(Likes.PostID == payload.post_id, Likes.ProfileID == me.UserID).first():
        raise HTTPException(status_code=400, detail="Post not liked")
    db.query(Likes).filter(Likes.PostID == payload.post_id, Likes.ProfileID == me.UserID).delete()
    db.commit()
    return {"ok": True, "detail": "Post unliked"}


@app.post("/feed/reactPost")
def react_post(
    payload: PostTextPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    existing = db.query(Reactions).filter(Reactions.PostID == payload.post_id, Reactions.ProfileID == me.UserID).first()
    if existing:
        existing.reaction_type = payload.text
    else:
        reaction = Reactions(PostID=payload.post_id, ProfileID=me.UserID, reaction_type=payload.text)
        db.add(reaction)
    db.commit()

    add_notification(db, payload.post_id, f"{me.username} reacted to your post with '{payload.text}'")

    return {"ok": True, "detail": "Post reacted"}


@app.post("/feed/unreactPost")
def unreact_post(
    payload: PostInfoPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if not db.query(Reactions).filter(Reactions.PostID == payload.post_id, Reactions.ProfileID == me.UserID).first():
        raise HTTPException(status_code=400, detail="Post not reacted")
    db.query(Reactions).filter(Reactions.PostID == payload.post_id, Reactions.ProfileID == me.UserID).delete()
    db.commit()
    return {"ok": True, "detail": "Post unreacted"}


@app.post("/feed/commentPost")
def comment_post(
    payload: PostTextPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    comment = Comments(PostID=payload.post_id, ProfileID=me.UserID, text=payload.text)
    db.add(comment)
    db.commit()
    return {"ok": True, "detail": "Post commented"}


@app.post("/posts/workouts/create")
def create_workout_post(
    payload: PostWorkoutPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    session_row = (
        db.query(session_workouts)
        .filter(
            session_workouts.SessionID == payload.session_id,
            session_workouts.ProfileID == me.UserID,
        )
        .first()
    )
    if session_row is None:
        raise HTTPException(status_code=404, detail="Workout session not found")

    existing_posts = _find_workout_post_rows_for_session(db, me.UserID, payload.session_id)
    for post_row in existing_posts:
        return {"ok": True, "created": False, "detail": "Workout already posted", "post_id": post_row.PostID}

    first_session_exercise = (
        db.query(session_exercises)
        .filter(session_exercises.SessionID == payload.session_id)
        .order_by(session_exercises.set_number.asc())
        .first()
    )
    if first_session_exercise is None:
        raise HTTPException(status_code=400, detail="Cannot post a workout with no exercises")

    workout = db.query(Workouts).filter(Workouts.WorkoutID == session_row.WorkoutID).first()
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")

    from app.core.db import Splits

    split = None
    if session_row.SplitID:
        split = db.query(Splits).filter(Splits.SplitID == session_row.SplitID).first()

    post_row = Posts(
        PostID=_next_post_id(db),
        ProfileID=me.UserID,
        ExerciseID=first_session_exercise.ExerciseID,
        WorkoutID=session_row.WorkoutID,
        MachineID=first_session_exercise.MachineID or _fallback_machine_id(db),
        caption=_workout_post_caption(payload.session_id, workout.name, split.name if split else None),
    )
    db.add(post_row)
    db.commit()
    return {"ok": True, "created": True, "detail": "Workout posted", "post_id": post_row.PostID}


@app.delete("/posts/workouts/{session_id}")
def delete_workout_post(
    session_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    session_row = (
        db.query(session_workouts)
        .filter(
            session_workouts.SessionID == session_id,
            session_workouts.ProfileID == me.UserID,
        )
        .first()
    )
    if session_row is None:
        raise HTTPException(status_code=404, detail="Workout session not found")

    deleted_post_ids = _delete_workout_posts_for_session(db, me.UserID, session_id)
    if not deleted_post_ids:
        raise HTTPException(status_code=404, detail="Workout post not found")

    db.commit()
    return {
        "ok": True,
        "deleted": True,
        "session_id": session_id,
        "post_ids": deleted_post_ids,
    }


@app.get("/feed/workouts/friends", response_model=List[WorkoutFeedPostOut])
def get_friends_workout_feed(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    blocked_ids = _blocked_user_ids(db, me.UserID)

    friendship_rows = (
        db.query(Friendships)
        .filter(
            Friendships.status == "accepted",
            or_(Friendships.RequesterID == me.UserID, Friendships.AddresseeID == me.UserID),
        )
        .all()
    )

    friend_ids: set[int] = set()
    for row in friendship_rows:
        friend_ids.add(row.AddresseeID if row.RequesterID == me.UserID else row.RequesterID)

    friend_ids -= blocked_ids
    if not friend_ids:
        return []

    post_rows = (
        db.query(Posts)
        .filter(Posts.ProfileID.in_(friend_ids))
        .order_by(Posts.PostID.desc())
        .limit(50)
        .all()
    )

    result: List[WorkoutFeedPostOut] = []
    seen_sessions: set[int] = set()
    for post_row in post_rows:
        feed_post = _build_feed_post_from_saved_post(db, post_row)
        if feed_post is None or feed_post.session_id in seen_sessions:
            continue
        seen_sessions.add(feed_post.session_id)
        result.append(feed_post)
    return result


@app.post("/feed/posts")
def publish_meal_post(
    payload: PublishMealPostRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Meal name is required")

    caption = json.dumps({
        "type": "meal",
        "source": payload.source,
        "name": payload.name,
        "calories": payload.calories,
        "protein": payload.protein,
        "carbs": payload.carbs,
        "fat": payload.fat,
        "sugar": payload.sugar,
        "fiber": payload.fiber,
        "sodium": payload.sodium,
        "cuisine": payload.cuisine,
        "goal": payload.goal,
        "complexity": payload.complexity,
        "spice_level": payload.spice_level,
        "dietary": payload.dietary,
        "restaurant": payload.restaurant,
        "category": payload.category,
        "meal_type": payload.meal_type,
    })

    post_row = Posts(
        PostID=_next_post_id(db),
        ProfileID=me.UserID,
        caption=caption,
        ExerciseID=None,
        WorkoutID=None,
        MachineID=_fallback_machine_id(db),
    )
    db.add(post_row)
    db.commit()
    db.refresh(post_row)

    created_at_str = (
        post_row.created_at.isoformat()
        if hasattr(post_row, "created_at") and post_row.created_at is not None
        else datetime.utcnow().isoformat()
    )

    return {
        "post_id": post_row.PostID,
        "created_at": created_at_str,
        "source": payload.source,
        "name": payload.name,
        "calories": payload.calories,
        "protein": payload.protein,
        "carbs": payload.carbs,
        "fat": payload.fat,
        "sugar": payload.sugar,
        "fiber": payload.fiber,
        "sodium": payload.sodium,
        "cuisine": payload.cuisine,
        "goal": payload.goal,
        "complexity": payload.complexity,
        "spice_level": payload.spice_level,
        "dietary": payload.dietary,
        "restaurant": payload.restaurant,
        "category": payload.category,
        "meal_type": payload.meal_type,
        "username": me.username,
    }


@app.delete("/feed/posts/{post_id}")
def delete_meal_post(
    post_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    post = db.query(Posts).filter(
        Posts.PostID == post_id,
        Posts.ProfileID == me.UserID,
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Meal post not found")

    _delete_posts_and_related_rows(db, [post_id])
    db.commit()
    return {"ok": True}


@app.get("/feed/posts")
def get_meal_feed(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    blocked_ids = _blocked_user_ids(db, me.UserID)

    all_posts = (
        db.query(Posts)
        .filter(Posts.caption.like('%"type": "meal"%'))
        .order_by(Posts.PostID.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for post in all_posts:
        if post.ProfileID in blocked_ids:
            continue
        try:
            data = json.loads(post.caption)
        except Exception:
            continue
        if data.get("type") != "meal":
            continue
        author = db.query(Accounts).filter(Accounts.UserID == post.ProfileID).first()
        created_at_str = (
            post.created_at.isoformat()
            if hasattr(post, "created_at") and post.created_at is not None
            else datetime.utcnow().isoformat()
        )
        results.append({
            "post_id": post.PostID,
            "created_at": created_at_str,
            "source": data.get("source"),
            "name": data.get("name"),
            "calories": data.get("calories"),
            "protein": data.get("protein"),
            "carbs": data.get("carbs"),
            "fat": data.get("fat"),
            "sugar": data.get("sugar"),
            "fiber": data.get("fiber"),
            "sodium": data.get("sodium"),
            "cuisine": data.get("cuisine"),
            "goal": data.get("goal"),
            "complexity": data.get("complexity"),
            "spice_level": data.get("spice_level"),
            "dietary": data.get("dietary"),
            "restaurant": data.get("restaurant"),
            "category": data.get("category"),
            "meal_type": data.get("meal_type"),
            "username": author.username if author else None,
        })
    return results


@app.post("/feed/posts/{post_id}/save", response_model=SessionMealOut, status_code=201)
def save_meal_from_feed(
    post_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    post = db.query(Posts).filter(Posts.PostID == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        data = json.loads(post.caption)
    except Exception:
        raise HTTPException(status_code=400, detail="Post is not a meal post")

    if data.get("type") != "meal":
        raise HTTPException(status_code=400, detail="Post is not a meal post")

    meal_name = (data.get("name") or "Shared Meal").strip()
    meal = Meals(name=meal_name)
    db.add(meal)
    db.flush()

    macros_data = {
        "calories": data.get("calories"),
        "protein": data.get("protein"),
        "fat": data.get("fat"),
        "carbs": data.get("carbs"),
        "sugar": data.get("sugar"),
        "fiber": data.get("fiber"),
        "sodium": data.get("sodium"),
    }
    if any(v is not None for v in macros_data.values()):
        macros_row = meal_macros(MealID=meal.MealID, **macros_data)
        db.add(macros_row)

    source_label = data.get("source", "unknown")
    note_parts = [f"Saved from meal feed (source: {source_label})"]
    if data.get("restaurant"):
        note_parts.append(f"Restaurant: {data['restaurant']}")
    if data.get("meal_type"):
        note_parts.append(f"Meal type: {data['meal_type']}")

    entry = session_meals(
        ProfileID=me.UserID,
        MealID=meal.MealID,
        date=datetime.utcnow(),
        servings=1.0,
        notes="\n".join(note_parts),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _build_session_meal_out(db, entry)


@app.get("/feed/workouts/gym", response_model=List[WorkoutFeedPostOut])
def get_same_gym_workout_feed(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    my_profile = db.query(Profiles).filter(Profiles.ProfileID == me.UserID).first()
    gym_location = (my_profile.gym_location or "").strip() if my_profile else ""

    if not gym_location or gym_location.lower() == "unknown location":
        return []

    blocked_ids = _blocked_user_ids(db, me.UserID)

    post_rows = (
        db.query(Posts)
        .join(Profiles, Profiles.ProfileID == Posts.ProfileID)
        .filter(Posts.ProfileID != me.UserID)
        .filter(Profiles.gym_location == gym_location)
        .order_by(Posts.PostID.desc())
        .limit(50)
        .all()
    )

    result: List[WorkoutFeedPostOut] = []
    seen_sessions: set[int] = set()
    for post_row in post_rows:
        if post_row.ProfileID in blocked_ids:
            continue
        feed_post = _build_feed_post_from_saved_post(db, post_row)
        if feed_post is None or feed_post.session_id in seen_sessions:
            continue
        seen_sessions.add(feed_post.session_id)
        result.append(feed_post)

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.fast_api.api:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/gyms")
async def nearby_gyms(lat: float = Query(...), lng: float = Query(...), radius: int = Query(3000)):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": "gym",
        "key": GOOGLE_API_KEY,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Google API request failed")

    data = response.json()
    results = [
        {
            "name": place.get("name"),
            "lat": place["geometry"]["location"]["lat"],
            "lng": place["geometry"]["location"]["lng"],
            "vicinity": place.get("vicinity"),
            "place_id": place.get("place_id"),
        }
        for place in data.get("results", [])
    ]

    return {"results": results}


@app.get("/gym-locations", response_model=list[str])
def get_gym_locations():
    return [
        "CoRec",
        "Planet Fitness"
    ]


@app.get("/profiles/search")
def search_profiles(
    username: str,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if not username.strip():
        raise HTTPException(status_code=400, detail="Username query cannot be empty")

    rows = (
        db.query(Accounts, Profiles)
        .outerjoin(Profiles, Profiles.ProfileID == Accounts.UserID)
        .filter(Accounts.username.ilike(f"%{username.strip()}%"))
        .filter(Accounts.UserID != me.UserID)
        .limit(20)
        .all()
    )

    return [
        {
            "id": account.UserID,
            "username": account.username,
            "bio": account.bio,
            "gym_location": profile.gym_location if profile else None,
            "workout_streak_weeks": _calculate_workout_streak(db, account.UserID).workout_streak_weeks if profile else 0,
        }
        for account, profile in rows
    ]


@app.get("/profiles/{profile_id}/streak", response_model=StreakResponse)
def get_profile_streak(
    profile_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    profile = db.query(Profiles).filter(Profiles.ProfileID == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if not _profiles_can_view_streak(db, me.UserID, profile_id):
        raise HTTPException(status_code=403, detail="You do not have access to view this streak")

    return _calculate_workout_streak(db, profile_id)


def add_notification(db: Session, profile_id: int, message: str, data: str = None):
    db.add(InboxNotifications(ProfileID=profile_id, message=message, data=data, created_at=datetime.now(timezone.utc)))
    db.commit()


@app.get("/inbox")
def get_inbox_notifications(me: Accounts = Depends(get_current_account), db: Session = Depends(get_db)):
    rows = (
        db.query(InboxNotifications)
        .filter(InboxNotifications.ProfileID == me.UserID)
        .order_by(InboxNotifications.created_at.desc())
        .all()
    )

    return [
        {
            "id": n.NotificationID,
            "message": n.message,
            "timestamp": n.created_at.timestamp(),
            "data": json.loads(n.data) if n.data else None,
        }
        for n in rows
    ]

@app.post("/inbox/dismiss")
def dismiss_notification(
    payload: DismissNotificationPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    row = (
        db.query(InboxNotifications)
        .filter(
            InboxNotifications.NotificationID == payload.notification_id,
            InboxNotifications.ProfileID == me.UserID,
        )
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(row)
    db.commit()
    return {"ok": True, "detail": "Notification dismissed"}


@app.post("/friends/request")
def send_friend_request(
    payload: FriendAddresseePayload, 
    me: Accounts = Depends(get_current_account), 
    db: Session = Depends(get_db)
):
    if me.UserID == payload.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")

    for uid in (me.UserID, payload.addressee_id):
        if not db.query(Accounts).filter(Accounts.UserID == uid).first():
            raise HTTPException(status_code=404, detail=f"User {uid} not found")
        
    block = db.query(Blocks).filter(
        or_(
            and_(Blocks.BlockerID == me.UserID, Blocks.BlockedID == payload.addressee_id),
            and_(Blocks.BlockerID == payload.addressee_id, Blocks.BlockedID == me.UserID),
        )).first()
    if block:
        raise HTTPException(status_code=403, detail="Cannot send friend request")

    existing = repos.lookup_friendship(db, me.UserID, payload.addressee_id)
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=409, detail="Already friends")
        raise HTTPException(status_code=409, detail="Friend request already pending")

    db.add(Friendships(
        RequesterID=me.UserID, AddresseeID=payload.addressee_id,
        status="pending",
    ))
    db.commit()

    add_notification(db, payload.addressee_id, f"{me.username} sent you a friend request", data=json.dumps({"type": "friend_request", "requesterId": me.UserID, "requesterUsername": me.username}))

    return {"ok": True, "status": "pending"}


@app.post("/friends/accept")
def accept_friend_request(
    payload: FriendAcceptPayload, 
    me: Accounts = Depends(get_current_account), 
    db: Session = Depends(get_db)
):
    row = db.query(Friendships).filter(
        Friendships.RequesterID == payload.requester_id, Friendships.AddresseeID == me.UserID,
        Friendships.status == "pending"
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="No pending request found")

    row.status = "accepted"
    row.updated_at = datetime.now(timezone.utc)

    user1_id, user2_id = sorted((payload.requester_id, me.UserID))
    existing_thread = db.query(ChatThreads).filter(
        ChatThreads.User1ID == user1_id,
        ChatThreads.User2ID == user2_id,
    ).first()

    if not existing_thread:
        db.add(ChatThreads(
            User1ID=user1_id,
            User2ID=user2_id,
        ))

    db.commit()
    return {"ok": True, "status": "accepted"}



@app.get("/chats", response_model=List[ChatListItemOut])
def list_chats(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """
    Return one chat row for each accepted friend.

    The chat thread is created when a friend request is accepted. This endpoint
    also creates any missing thread for older accepted friendships, so users who
    became friends before the chat feature was added still show up in the chat
    list.
    """
    accepted_friendships = db.query(Friendships).filter(
        Friendships.status == "accepted",
        or_(
            Friendships.RequesterID == me.UserID,
            Friendships.AddresseeID == me.UserID,
        ),
    ).all()

    created_missing_thread = False
    chat_items = []

    for friendship in accepted_friendships:
        friend_id = (
            friendship.AddresseeID
            if friendship.RequesterID == me.UserID
            else friendship.RequesterID
        )

        user1_id, user2_id = sorted((me.UserID, friend_id))
        thread = db.query(ChatThreads).filter(
            ChatThreads.User1ID == user1_id,
            ChatThreads.User2ID == user2_id,
        ).first()

        if not thread:
            thread = ChatThreads(User1ID=user1_id, User2ID=user2_id)
            db.add(thread)
            db.flush()
            created_missing_thread = True

        friend_account = db.query(Accounts).filter(
            Accounts.UserID == friend_id
        ).first()

        if not friend_account:
            continue

        friend_profile = db.query(Profiles).filter(
            Profiles.ProfileID == friend_id
        ).first()

        chat_items.append((thread, friend_account, friend_profile))

    if created_missing_thread:
        db.commit()

    chat_items.sort(
        key=lambda item: item[0].last_message_at or item[0].updated_at or item[0].created_at,
        reverse=True,
    )

    results = []
    for thread, friend_account, friend_profile in chat_items:
        created_at = thread.created_at or datetime.now(timezone.utc)
        updated_at = thread.updated_at or created_at

        results.append(
            ChatListItemOut(
                thread_id=thread.ThreadID,
                friend_id=friend_account.UserID,
                friend_username=friend_account.username,
                friend_bio=friend_account.bio,
                friend_gym_location=friend_profile.gym_location if friend_profile else None,
                created_at=created_at.isoformat(),
                updated_at=updated_at.isoformat(),
                last_message_at=thread.last_message_at.isoformat()
                if thread.last_message_at
                else None,
            )
        )

    return results


@app.delete("/friends")
def delete_friendship(
    payload: FriendAddresseePayload, 
    me: Accounts = Depends(get_current_account), 
    db: Session = Depends(get_db)
):
    row = repos.lookup_friendship(db, me.UserID, payload.addressee_id)
    if not row:
        raise HTTPException(status_code=404, detail="Friendship not found")

    db.delete(row)
    db.commit()
    return {"ok": True, "detail": "Friendship removed"}


@app.get("/friends/status")
def get_friendship_status(
    addressee_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    row = repos.lookup_friendship(db, me.UserID, addressee_id)
    if not row:
        return {"status": "none"}
    if row.status == "accepted":
        return {"status": "accepted"}
    if row.RequesterID == me.UserID:
        return {"status": "pending_sent"}
    return {"status": "pending_received"}


@app.post("/blocks")
def block_user(
    payload: BlockPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if me.UserID == payload.blocked_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    if not db.query(Accounts).filter(Accounts.UserID == payload.blocked_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    existing_block = db.query(Blocks).filter(
        Blocks.BlockerID == me.UserID,
        Blocks.BlockedID == payload.blocked_id,
    ).first()
    if existing_block:
        raise HTTPException(status_code=409, detail="Already blocked")

    # auto-remove friendship in either direction
    friendship = repos.lookup_friendship(db, me.UserID, payload.blocked_id)
    if friendship:
        db.delete(friendship)

    db.add(Blocks(BlockerID=me.UserID, BlockedID=payload.blocked_id))
    db.commit()
    return {"ok": True, "detail": "User blocked"}


@app.delete("/blocks")
def unblock_user(
    payload: BlockPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    row = db.query(Blocks).filter(
        Blocks.BlockerID == me.UserID,
        Blocks.BlockedID == payload.blocked_id,
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="Block not found")

    db.delete(row)
    db.commit()
    return {"ok": True, "detail": "User unblocked"}


@app.get("/blocks/status")
def get_block_status(
    other_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    i_blocked = db.query(Blocks).filter(
        Blocks.BlockerID == me.UserID,
        Blocks.BlockedID == other_id,
    ).first()

    they_blocked = db.query(Blocks).filter(
        Blocks.BlockerID == other_id,
        Blocks.BlockedID == me.UserID,
    ).first()

    return {
        "i_blocked_them": i_blocked is not None,
        "they_blocked_me": they_blocked is not None,
    }


@app.post("/reports")
def report_user(
    payload: ReportPayload,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if me.UserID == payload.reported_id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    if not db.query(Accounts).filter(Accounts.UserID == payload.reported_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    db.add(Reports(
        ReporterID=me.UserID,
        ReportedID=payload.reported_id,
        description=payload.description.strip(),
    ))
    db.commit()
    return {"ok": True, "detail": "Report submitted"}

#  group goals

class CreateGroupGoalRequest(BaseModel):
    title: str
    description: str = ""
    targetValue: float
    unit: str  # kg | lbs | km | miles | sessions | calories | steps | minutes


class GroupGoalMemberOut(BaseModel):
    profileId: int
    username: str
    progress: float
    joinedAt: str


class GroupGoalOut(BaseModel):
    goalId: str
    title: str
    description: str
    targetValue: float
    unit: str
    createdAt: str
    createdBy: str
    members: List[GroupGoalMemberOut]
    completedAt: Optional[str] = None


class LogGoalProgressRequest(BaseModel):
    amount: float


def _build_group_goal_out(db: Session, goal: GroupGoals) -> GroupGoalOut:
    creator = db.query(Accounts).filter(Accounts.UserID == goal.created_by).first()
    creator_username = creator.username if creator else "unknown"

    members_rows = (
        db.query(GroupGoalMembers, Accounts.username)
        .join(Accounts, Accounts.UserID == GroupGoalMembers.profile_id)
        .filter(GroupGoalMembers.goal_id == goal.goal_id)
        .order_by(GroupGoalMembers.joined_at.asc())
        .all()
    )

    def _to_iso(val) -> str:
        if val is None:
            return None
        return val if isinstance(val, str) else val.isoformat()

    members = [
        GroupGoalMemberOut(
            profileId=m.profile_id,
            username=username,
            progress=m.progress,
            joinedAt=_to_iso(m.joined_at),
        )
        for m, username in members_rows
    ]

    return GroupGoalOut(
        goalId=str(goal.goal_id),
        title=goal.title,
        description=goal.description or "",
        targetValue=goal.target_value,
        unit=goal.unit,
        createdAt=_to_iso(goal.created_at),
        createdBy=creator_username,
        members=members,
        completedAt=_to_iso(goal.completed_at),
    )


@app.post("/group-goals", response_model=GroupGoalOut, status_code=201)
def create_group_goal(
    payload: CreateGroupGoalRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    # Create a new group goal. Creator is automatically added as the first member.
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    if payload.targetValue <= 0:
        raise HTTPException(status_code=400, detail="Target value must be greater than 0")

    goal = GroupGoals(
        created_by=me.UserID,
        title=payload.title.strip(),
        description=payload.description.strip(),
        target_value=payload.targetValue,
        unit=payload.unit,
    )
    db.add(goal)
    db.flush()  # populates goal.goal_id

    member = GroupGoalMembers(
        goal_id=goal.goal_id,
        profile_id=me.UserID,
        progress=0.0,
    )
    db.add(member)
    db.commit()
    db.refresh(goal)

    return _build_group_goal_out(db, goal)


@app.get("/group-goals", response_model=List[GroupGoalOut])
def get_group_goals(
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):

    #Return goals the current user is a member of, plus goals created
    #by accepted friends they haven't joined yet.

    friend_ids_rows = db.execute(text("""
        SELECT CASE WHEN "RequesterID" = :uid THEN "AddresseeID"
                    ELSE "RequesterID" END AS friend_id
        FROM "Friendships"
        WHERE status = 'accepted'
          AND ("RequesterID" = :uid OR "AddresseeID" = :uid)
    """), {"uid": me.UserID}).fetchall()

    friend_ids = [r.friend_id for r in friend_ids_rows]
    visible_creator_ids = [me.UserID] + friend_ids

    # Goals the user is a member of
    member_goal_ids = [
        m.goal_id for m in
        db.query(GroupGoalMembers.goal_id)
        .filter(GroupGoalMembers.profile_id == me.UserID)
        .all()
    ]

    # Goals created by visible friends (not yet joined)
    goals = (
        db.query(GroupGoals)
        .filter(
            (GroupGoals.goal_id.in_(member_goal_ids)) |
            (GroupGoals.created_by.in_(visible_creator_ids))
        )
        .order_by(GroupGoals.created_at.desc())
        .all()
    )

    # Deduplicate by goal_id preserving order
    seen = set()
    unique_goals = []
    for g in goals:
        if g.goal_id not in seen:
            seen.add(g.goal_id)
            unique_goals.append(g)

    return [_build_group_goal_out(db, g) for g in unique_goals]


@app.post("/group-goals/{goal_id}/progress", response_model=GroupGoalOut)
def log_goal_progress(
    goal_id: int,
    payload: LogGoalProgressRequest,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    #Log progress toward a group goal. Auto-joins the user if not yet a member.
    #Sets completed_at when total progress reaches target_value.

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    goal = db.query(GroupGoals).filter(GroupGoals.goal_id == goal_id).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.completed_at:
        raise HTTPException(status_code=409, detail="Goal is already complete")

    member = (
        db.query(GroupGoalMembers)
        .filter(GroupGoalMembers.goal_id == goal_id, GroupGoalMembers.profile_id == me.UserID)
        .first()
    )

    if member:
        member.progress += payload.amount
    else:
        member = GroupGoalMembers(
            goal_id=goal_id,
            profile_id=me.UserID,
            progress=payload.amount,
        )
        db.add(member)

    db.flush()

    total = (
        db.query(GroupGoalMembers)
        .filter(GroupGoalMembers.goal_id == goal_id)
        .all()
    )
    total_progress = sum(m.progress for m in total)

    if total_progress >= goal.target_value:
        goal.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(goal)

    return _build_group_goal_out(db, goal)


@app.delete("/group-goals/{goal_id}/members")
def leave_group_goal(
    goal_id: int,
    me: Accounts = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    # Remove yourself from a group goal.
    member = (
        db.query(GroupGoalMembers)
        .filter(GroupGoalMembers.goal_id == goal_id, GroupGoalMembers.profile_id == me.UserID)
        .first()
    )

    if not member:
        raise HTTPException(status_code=404, detail="You are not a member of this goal")

    db.delete(member)
    db.commit()
    return {"ok": True}
