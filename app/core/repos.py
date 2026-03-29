from sqlalchemy.orm import Session
from app.core.db import (
    Accounts,
    Profiles,
    Splits,
    Workouts,
    Exercises,
    Machines,
    Meals,
    Ingredients,
    MuscleGroupTags,
    DifficultyTags,
    ExerciseTypeTags,
    exercise_tags,
    exercise_muscle_groups,
    menu_meals,
    SpiceLevelTags,
    CuisineTags,
    ComplexityTags,
    GoalTags,
    PrepTimeTags,
    CookTimeTags,
    DietaryTags,
    meal_tags,
    meal_dietary_tags,
    meal_macros,
    session_meals,
)
from fastapi import HTTPException, Header
from app.core.auth_tokens import decode_access_token
from app.core.ingest_menu_meals import ingest_menu_meals


# fill all these lists out 

"""
splits are named by the user

def populate_splits(sess):
    s = [
        Splits(name="back & bicep"),
        Splits(name='chest, shoulder, tricep'),
        Splits(name='calisthenics')
    ]

    for obj in s:
        exists = sess.query(Splits).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return s
"""


def populate_workouts(sess):
    w = [
        Workouts(name='back'),
        Workouts(name='bicep'),
        Workouts(name='chest'),
        Workouts(name='tricep'),
        Workouts(name='shoulder'),
        Workouts(name='quad'),
        Workouts(name='ab'),
        Workouts(name='cardio'),
        Workouts(name='forearm'),
        Workouts(name='oblique'),
        Workouts(name='lower back'),
        Workouts(name='hamstring'),
        Workouts(name='glute'),
        Workouts(name='calf'),
        Workouts(name='hip flexor'),
        Workouts(name='full body')
    ]

    for obj in w:
        exists = sess.query(Workouts).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return w


def populate_exercises(sess):
    e = [
        Exercises(name='pull up'),
        Exercises(name='lateral pull down'),
        Exercises(name='row'),
        Exercises(name='face pull'),

        Exercises(name='bicep curl'),
        Exercises(name='preacher curl'),
        Exercises(name='hammer curl'),
        Exercises(name='straight-bar curl'),

        Exercises(name='bench press'),
        Exercises(name='incline bench press'),
        Exercises(name='cable fly'),
        Exercises(name='high low cable fly'),
        Exercises(name='low high cable fly'),

        Exercises(name='skull crusher'),
        Exercises(name='tricep push down'),

        Exercises(name='shoulder press'),
        Exercises(name='shoulder raise'),
        Exercises(name='shrug'),

        Exercises(name='bulgarian split squat'),
        Exercises(name='romanian deadlift'),
        
        Exercises(name='power clean'),
        Exercises(name='burpee'),
        Exercises(name='sled push'),
        Exercises(name='russian twist'),
        Exercises(name='sled pull'),
        Exercises(name='box jump'),

        Exercises(name='cardio')
    ]

    for obj in e:
        exists = sess.query(Exercises).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return e


def populate_machines(sess):
    m = [
        Machines(name='dumbbell'),
        Machines(name='barbell'),
        Machines(name='body weight'),
        Machines(name='cable'),

        Machines(name='treadmill'),
        Machines(name='stair master'),
        Machines(name='elliptical'),
        Machines(name='bike'),
        Machines(name='row'),
    ]
    for obj in m:
        exists = sess.query(Machines).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return m


def populate_meals(sess):
    m = [
        Meals(name='chicken & rice'),
        Meals(name='salmon and broccoli'),
        Meals(name='cheesy 5-layer burrito'),
        Meals(name='oatmeal')
    ]

    for obj in m:
        exists = sess.query(Meals).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return m



def create_account(sess: Session, username: str, password: str, bio: str) -> bool:
    """
    Create an Accounts object with an inputted username, password, bio.\n
    Add and flush to session, commit in server file.\n
    Returns True if successful and False otherwise.
    """




def lookup_account_by_token(sess: Session, authorization: str = Header(None)) -> Accounts:
    """
    hashed token decrypted to UserID then looks up and returns Accounts object if exists
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    user = sess.query(Accounts).filter(Accounts.UserID == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def lookup_account_by_id(sess: Session, user_id: int) -> Profiles:
    """
    return Accounts object if exists
    """
    account = sess.query(Accounts).filter(Accounts.UserID == user_id).first()
    return account if account else None


def lookup_profile_by_id(sess: Session, profile_id: int) -> Profiles:
    """
    return Profiles object if exists
    """
    profile = sess.query(Profiles).filter(Profiles.ProfileID == profile_id).first()
    return profile if profile else None



def lookup_menumeal_by_restaurant(sess: Session, restaurant: str) -> menu_meals:
    """
    return menu_meals object(s) meeting criteria if exists
    """
    results = sess.query(menu_meals).filter(menu_meals.restaurant.ilike(f"%{restaurant}%")).all()
    return results if results else []


def lookup_menumeal_by_protein(sess: Session, protein: str) -> menu_meals:
    """
    return menu_meals object(s) meeting criteria if exists
    """
    if protein == 'chicken':
        results = sess.query(menu_meals).filter(menu_meals.chicken == True).all()
    elif protein == 'beef':
        results = sess.query(menu_meals).filter(menu_meals.beef == True).all()
    else:
        results = []
    return results

def lookup_all_menumeals(sess: Session) -> menu_meals:
    return sess.query(menu_meals).all()


def delete_account_by_id(sess: Session, user_id: int) -> bool:
    """
    Deletes an account by UserID, returning True if deleted and False otherwise.\n
    Also deletes corresponding profile. 
    """
    account = lookup_account_by_id(sess, user_id)
    if account:
        profile = lookup_profile_by_id(sess, user_id)
        if profile:
            sess.delete(profile)
        sess.delete(account), sess.flush()
        return True
    return False
def populate_muscle_groups(sess: Session):
    muscle_groups = [
        MuscleGroupTags(name="chest"), MuscleGroupTags(name="back"),
        MuscleGroupTags(name="shoulders"), MuscleGroupTags(name="biceps"),
        MuscleGroupTags(name="triceps"), MuscleGroupTags(name="forearms"),
        MuscleGroupTags(name="abs"), MuscleGroupTags(name="obliques"),
        MuscleGroupTags(name="lower_back"), MuscleGroupTags(name="quads"),
        MuscleGroupTags(name="hamstrings"), MuscleGroupTags(name="glutes"),
        MuscleGroupTags(name="calves"), MuscleGroupTags(name="hip_flexors"),
        MuscleGroupTags(name="full_body"),
    ]
    for obj in muscle_groups:
        if not sess.query(MuscleGroupTags).filter_by(name=obj.name).first():
            sess.add(obj)
    sess.commit()

def populate_difficulties(sess: Session):
    difficulties = [
        DifficultyTags(name="beginner"), DifficultyTags(name="intermediate"),
        DifficultyTags(name="advanced"), DifficultyTags(name="elite"),
    ]
    for obj in difficulties:
        if not sess.query(DifficultyTags).filter_by(name=obj.name).first():
            sess.add(obj)
    sess.commit()

def populate_exercise_types(sess: Session):
    types = [
        ExerciseTypeTags(name="strength"),
        ExerciseTypeTags(name="cardio"),
        ExerciseTypeTags(name="hybrid"),
    ]
    for obj in types:
        if not sess.query(ExerciseTypeTags).filter_by(name=obj.name).first():
            sess.add(obj)
    sess.commit()

def tag_exercise(sess: Session, exercise_id: int, difficulty_id: int, exercise_type_id: int, muscle_group_ids: list[int]) -> bool:
    if not sess.query(Exercises).filter_by(ExerciseID=exercise_id).first():
        raise HTTPException(status_code=404, detail="Exercise not found")
    sess.merge(exercise_tags(ExerciseID=exercise_id, DifficultyID=difficulty_id, ExerciseTypeID=exercise_type_id))
    sess.query(exercise_muscle_groups).filter_by(ExerciseID=exercise_id).delete()
    for mg_id in muscle_group_ids:
        sess.add(exercise_muscle_groups(ExerciseID=exercise_id, MuscleGroupID=mg_id))
    sess.commit()
    return True

def get_exercise_tags(sess: Session, exercise_id: int) -> dict:
    """
    Returns the difficulty, exercise type, and muscle groups for a given exercise.
    """
    tag = sess.query(exercise_tags).filter_by(ExerciseID=exercise_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="No tags found for this exercise")
    muscles = sess.query(exercise_muscle_groups).filter_by(ExerciseID=exercise_id).all()
    return {"tags": tag, "muscle_groups": muscles}

def get_all_tag_options(sess: Session) -> dict:
    return {
        "muscle_groups": sess.query(MuscleGroupTags).all(),
        "difficulties":  sess.query(DifficultyTags).all(),
        "exercise_types": sess.query(ExerciseTypeTags).all(),
    }
def populate_spice_levels(sess: Session):
    for name in ["mild", "medium", "hot", "extra_hot"]:
        if not sess.query(SpiceLevelTags).filter_by(name=name).first():
            sess.add(SpiceLevelTags(name=name))
    sess.commit()

def populate_cuisines(sess: Session):
    for name in ["american", "italian", "mexican", "asian", "mediterranean", "indian", "middle_eastern", "other"]:
        if not sess.query(CuisineTags).filter_by(name=name).first():
            sess.add(CuisineTags(name=name))
    sess.commit()

def populate_complexities(sess: Session):
    for name in ["simple", "moderate", "complex"]:
        if not sess.query(ComplexityTags).filter_by(name=name).first():
            sess.add(ComplexityTags(name=name))
    sess.commit()

def populate_goals(sess: Session):
    for name in ["fat_loss", "muscle_gain", "maintenance"]:
        if not sess.query(GoalTags).filter_by(name=name).first():
            sess.add(GoalTags(name=name))
    sess.commit()

def populate_prep_times(sess: Session):
    for name in ["quick", "medium", "long"]:
        if not sess.query(PrepTimeTags).filter_by(name=name).first():
            sess.add(PrepTimeTags(name=name))
    sess.commit()

def populate_cook_times(sess: Session):
    for name in ["quick", "medium", "long"]:
        if not sess.query(CookTimeTags).filter_by(name=name).first():
            sess.add(CookTimeTags(name=name))
    sess.commit()

def populate_dietary_tags(sess: Session):
    for name in ["vegetarian", "vegan", "gluten_free", "dairy_free", "nut_free", "halal", "kosher", "low_carb", "high_protein"]:
        if not sess.query(DietaryTags).filter_by(name=name).first():
            sess.add(DietaryTags(name=name))
    sess.commit()

def tag_meal(sess: Session, meal_id: int, spice_level_id: int, cuisine_id: int,
             complexity_id: int, goal_id: int, prep_time_id: int, cook_time_id: int,
             dietary_tag_ids: list[int] = []) -> bool:
    if not sess.query(Meals).filter_by(MealID=meal_id).first():
        raise HTTPException(status_code=404, detail="Meal not found")
    sess.merge(meal_tags(
        MealID=meal_id, SpiceLevelID=spice_level_id, CuisineID=cuisine_id,
        ComplexityID=complexity_id, GoalID=goal_id,
        PrepTimeID=prep_time_id, CookTimeID=cook_time_id,
    ))
    sess.query(meal_dietary_tags).filter_by(MealID=meal_id).delete()
    for dietary_id in dietary_tag_ids:
        sess.add(meal_dietary_tags(MealID=meal_id, DietaryID=dietary_id))
    sess.commit()
    return True

def get_meal_tags(sess: Session, meal_id: int) -> dict:
    tag = sess.query(meal_tags).filter_by(MealID=meal_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="No tags found for this meal")
    dietary = sess.query(meal_dietary_tags).filter_by(MealID=meal_id).all()
    return {"tags": tag, "dietary_tags": dietary}

def get_all_meal_tag_options(sess: Session) -> dict:
    return {
        "spice_levels":  sess.query(SpiceLevelTags).all(),
        "cuisines":      sess.query(CuisineTags).all(),
        "complexities":  sess.query(ComplexityTags).all(),
        "goals":         sess.query(GoalTags).all(),
        "prep_times":    sess.query(PrepTimeTags).all(),
        "cook_times":    sess.query(CookTimeTags).all(),
        "dietary_tags":  sess.query(DietaryTags).all(),
    }
    
def upsert_meal_macros(
    sess: Session,
    meal_id: int,
    calories: float | None,
    protein:  float | None,
    fat:      float | None,
    carbs:    float | None,
    sugar:    float | None,
    fiber:    float | None,
    sodium:   float | None,
) -> meal_macros:
    if not sess.query(Meals).filter_by(MealID=meal_id).first():
        raise HTTPException(status_code=404, detail="Meal not found")

    row = sess.query(meal_macros).filter_by(MealID=meal_id).first()
    if row:
        row.calories = calories
        row.protein  = protein
        row.fat      = fat
        row.carbs    = carbs
        row.sugar    = sugar
        row.fiber    = fiber
        row.sodium   = sodium
    else:
        row = meal_macros(
            MealID=meal_id,
            calories=calories, protein=protein, fat=fat,
            carbs=carbs, sugar=sugar, fiber=fiber, sodium=sodium,
        )
        sess.add(row)
    sess.commit()
    sess.refresh(row)
    return row

def get_meal_macros(sess: Session, meal_id: int) -> meal_macros:
    row = sess.query(meal_macros).filter_by(MealID=meal_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="No macros found for this meal")
    return row

def delete_meal_macros(sess: Session, meal_id: int) -> bool:
    row = sess.query(meal_macros).filter_by(MealID=meal_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="No macros found for this meal")
    sess.delete(row)
    sess.commit()
    return True
    
def filter_meals_by_tags(
    sess: Session,
    spice_level_id: int | None  = None,
    cuisine_id:     int | None  = None,
    complexity_id:  int | None  = None,
    goal_id:        int | None  = None,
    prep_time_id:   int | None  = None,
    cook_time_id:   int | None  = None,
    dietary_tag_id: int | None  = None,
    min_calories:   float | None = None,
    max_calories:   float | None = None,
    min_protein:    float | None = None,
    max_protein:    float | None = None,
    min_fat:        float | None = None,
    max_fat:        float | None = None,
    min_carbs:      float | None = None,
    max_carbs:      float | None = None,
    min_sugar:      float | None = None,
    max_sugar:      float | None = None,
    min_fiber:      float | None = None,
    max_fiber:      float | None = None,
    min_sodium:     float | None = None,
    max_sodium:     float | None = None,
) -> list[dict]:
    query = sess.query(Meals)
    any_tag_filter = any([
        spice_level_id, cuisine_id, complexity_id,
        goal_id, prep_time_id, cook_time_id,
    ])
    if any_tag_filter:
        query = query.join(meal_tags, meal_tags.MealID == Meals.MealID)
        if spice_level_id:
            query = query.filter(meal_tags.SpiceLevelID == spice_level_id)
        if cuisine_id:
            query = query.filter(meal_tags.CuisineID == cuisine_id)
        if complexity_id:
            query = query.filter(meal_tags.ComplexityID == complexity_id)
        if goal_id:
            query = query.filter(meal_tags.GoalID == goal_id)
        if prep_time_id:
            query = query.filter(meal_tags.PrepTimeID == prep_time_id)
        if cook_time_id:
            query = query.filter(meal_tags.CookTimeID == cook_time_id)

    if dietary_tag_id:
        query = query.join(
            meal_dietary_tags,
            meal_dietary_tags.MealID == Meals.MealID,
        ).filter(meal_dietary_tags.DietaryID == dietary_tag_id)
    macro_ranges = {
        "calories": (min_calories, max_calories),
        "protein":  (min_protein,  max_protein),
        "fat":      (min_fat,      max_fat),
        "carbs":    (min_carbs,    max_carbs),
        "sugar":    (min_sugar,    max_sugar),
        "fiber":    (min_fiber,    max_fiber),
        "sodium":   (min_sodium,   max_sodium),
    }
    any_macro_filter = any(lo is not None or hi is not None for lo, hi in macro_ranges.values())

    if any_macro_filter:
        query = query.join(meal_macros, meal_macros.MealID == Meals.MealID)
        for field, (lo, hi) in macro_ranges.items():
            col = getattr(meal_macros, field)
            if lo is not None:
                query = query.filter(col >= lo)
            if hi is not None:
                query = query.filter(col <= hi)

    meals = query.all()
    results = []
    for meal in meals:
        tag_row      = sess.query(meal_tags).filter_by(MealID=meal.MealID).first()
        dietary_rows = sess.query(meal_dietary_tags).filter_by(MealID=meal.MealID).all()
        macro_row    = sess.query(meal_macros).filter_by(MealID=meal.MealID).first()

        results.append({
            "meal_id": meal.MealID,
            "name":    meal.name,
            "tags":    tag_row,
            "dietary": dietary_rows,
            "macros":  macro_row,
        })

    return results
    
def log_meal(
    sess:      Session,
    profile_id: int,
    meal_id:    int,
    date,
    servings:  float | None = None,
    notes:     str   | None = None,
) -> session_meals:
    if not sess.query(Meals).filter_by(MealID=meal_id).first():
        raise HTTPException(status_code=404, detail="Meal not found")

    entry = session_meals(
        ProfileID=profile_id,
        MealID=meal_id,
        date=date,
        servings=servings,
        notes=notes,
    )
    sess.add(entry)
    sess.commit()
    sess.refresh(entry)
    return entry


def get_meal_log(sess: Session, profile_id: int) -> list[dict]:
    entries = (
        sess.query(session_meals)
        .filter_by(ProfileID=profile_id)
        .order_by(session_meals.date.desc())
        .all()
    )

    results = []
    for e in entries:
        macro_row = sess.query(meal_macros).filter_by(MealID=e.MealID).first()
        meal_row  = sess.query(Meals).filter_by(MealID=e.MealID).first()
        multiplier = e.servings if e.servings is not None else 1.0

        consumed: dict[str, float | None] = {}
        for field in ("calories", "protein", "fat", "carbs", "sugar", "fiber", "sodium"):
            base = getattr(macro_row, field, None) if macro_row else None
            consumed[field] = round(base * multiplier, 1) if base is not None else None

        results.append({
            "session_meal_id": e.SessionMealID,
            "meal_id":         e.MealID,
            "meal_name":       meal_row.name if meal_row else None,
            "date":            e.date,
            "servings":        e.servings,
            "notes":           e.notes,
            "consumed_macros": consumed,
        })

    return results
