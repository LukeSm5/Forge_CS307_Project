"""
Prompt Construction
- Should my daily calorie goal be updated?
- What weight reps sets for this exercise?
"""

import math
from datetime import date
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.session import engine, Base, get_db
from app.core.db import (
    session_workouts, session_exercises,
    Exercises, Machines, Workouts, Splits,
    session_menu_meals, menu_meals,
    Profiles
)

# delete for demo testing and implementation, exists in api.py
Base.metadata.create_all(bind=engine)
db = next(get_db())

class TailorExerciseRequest(BaseModel):
    date: str
    split_name: str
    workout_name: str
    exercise_name: str
    machine_name: str

def today():
    """
    string like '2026-03-31'
    """
    return date.today().strftime("%Y-%m-%d")


def workout_session_text(db: Session, session: session_workouts) -> str:
    """
    Joins session_workouts → session_exercises → Exercises + Machines + Workouts + Splits\n
    Wrangles 1 logged workout into a string for LLM prompt.

    "Pull split, Back workout, 2026-03-12, 32 min:
    pull-up x8 bodyweight set1, pull-up x6 bodyweight set2,
    bent-over row x10 45lb cable set1, bent-over row x10 45lb cable set2
    
    Pull split, Bicep workout, 2026-03-12, 25 min:
    bicep curl x8 25lbs dumbbell set1, bicep curl x8 25lbs dumbbell set2,
    hammer curl x10 30lbs dumbbell set1, hammer curl x10 30lbs dumbbell set2"
    """

    # get workout / muscle group name
    workout = db.query(Workouts).filter(Workouts.WorkoutID == session.WorkoutID).first()
    workout_name = workout.name if workout else "Unknown Workout"

    # get split name
    split_name = "No Split"
    if session.SplitID:
        split = db.query(Splits).filter(Splits.SplitID == session.SplitID).first()
        split_name = split.name if split else "Unknown Split"

    # get all exercises in this workout session
    exercises = (
        db.query(session_exercises)
        .filter(session_exercises.SessionID == session.SessionID)
        .order_by(session_exercises.ExerciseID, session_exercises.set_number)
        .all()
    )

    exercise_strings = []
    for ex in exercises:
        exercise = db.query(Exercises).filter(Exercises.ExerciseID == ex.ExerciseID).first()
        machine = db.query(Machines).filter(Machines.MachineID == ex.MachineID).first() if ex.MachineID else None

        name = exercise.name if exercise else "unknown exercise"
        machine_name = machine.name if machine else "bodyweight"
        reps = ex.reps or 0
        weight = f"{ex.weight}lb" if ex.weight else "bodyweight"

        exercise_strings.append(
            f"{name} x{reps} {weight} {machine_name} set{ex.set_number}"
        )

    date_str = session.date.strftime("%Y-%m-%d") if session.date else "unknown date"
    duration_str = f"{math.floor(session.duration / 60)} min" if session.duration else "unknown duration"
    exercises_str = ", ".join(exercise_strings) if exercise_strings else "no exercises logged"

    return f"{split_name} split, {workout_name} workout, {date_str}, {duration_str}: {exercises_str}."


def menu_meal_session_text(db: Session, session: session_menu_meals) -> str:
    """
    Joins session_menu_meals -> menu_meals\n
    Wrangles 1 logged menu meal into a string for LLM prompt.

    "Chick-fil-A, Chicken Biscuit, 2026-03-30, breakfast:
    460 kcal, 19g protein, 45g carbs, 23g fat"
    """

    meal = (
        db.query(menu_meals)
        .filter(menu_meals.MenuMealID == session.MenuMealID)
        .first()
    )

    date_str = (
        session.date.strftime("%Y-%m-%d")
        if session.date
        else "unknown date"
    )

    meal_type = (
        session.meal_type.lower()
        if session.meal_type
        else "unknown meal"
    )

    if not meal:
        return (
            f"Unknown restaurant meal, {date_str}, {meal_type}: nutrition unavailable"
        )

    restaurant = meal.restaurant or "Unknown Restaurant"
    product = meal.product or "Unknown Product"

    calories = meal.energy_kcal or 0
    protein = meal.protein_g or 0
    carbs = meal.carbohydrates_g or 0
    fat = meal.total_fat_g or 0

    return (
        f"{restaurant}, {product}, {date_str}, {meal_type}: "
        f"{calories} kcal, {protein}g protein, {carbs}g carbs, {fat}g fat"
    )


def workout_history_text(db: Session, profile_id: int) -> str:
    """
    Joins session_workouts → session_exercises → Exercises + Machines + Workouts + Splits\n
    Wrangles logged workouts for ProfileID into a string for LLM prompt.

    "Pull split, Back workout, 2026-03-12, 32 min:
    pull-up x8 bodyweight set1, pull-up x6 bodyweight set2,
    bent-over row x10 45lb cable set1, bent-over row x10 45lb cable set2
    
    Pull split, Bicep workout, 2026-03-12, 25 min:
    bicep curl x8 dumbbell 25lbs set1, bicep curl x8 dumbbell 25lbs set2,
    hammer curl x10 dumbbell 30lbs set1, hammer curl x10 dumbbell 30lbs set2"
    """

    sessions = (
        db.query(session_workouts)
        .filter(session_workouts.ProfileID == profile_id)
        .order_by(session_workouts.date.desc())
        .all()
    )

    if not sessions:
        return "No workout history logged."

    return " ".join(workout_session_text(db, s) for s in sessions)


def menu_meal_history_text(db: Session, profile_id: int) -> str:
    """
    Joins session_menu_meals -> menu_meals\n
    Wrangles logged menu meals for ProfileID into a string for LLM prompt.

    Example:
    "Chick-fil-A, Chicken Biscuit, 2026-03-30, breakfast:
    460 kcal, 19g protein, 45g carbs, 23g fat"
    """
    sessions = (
        db.query(session_menu_meals)
        .filter(session_menu_meals.ProfileID == profile_id)
        .order_by(session_menu_meals.date.desc())
        .all()
    )

    if not sessions:
        return "No meal history logged."

    return " ".join(menu_meal_session_text(db, s) for s in sessions)


def profile_prompt_text(db: Session, profile_id: int) -> str:
    """
    Formats profile characteristics from saved onboarding responses into string for LLM prompt
    """
    profile = (
        db.query(Profiles)
        .filter(Profiles.ProfileID == profile_id)
        .first()
    )
    try: 
        return (
            f"I am {profile.age} year's old. I weigh {profile.weight} pounds. I am {profile.height_in} inches tall. I am a {profile.gender}. "  
            f"My current health status is {profile.health_status}. My current health goals are to {profile.health_goals}. "
            f"My current daily calorie goal is {profile.calorie_goal}. "
        )
    except:
        Exception
    


def calorie_goal_prompt_text(db: Session, profile_id: int) -> str: 
    profile = profile_prompt_text(db, profile_id)
    workouts = workout_history_text(db, profile_id)
    menu_meals = menu_meal_history_text(db, profile_id)

    return f"""
    You are a personal fitness coach tasked with providing specific advice to a profile: {profile}
    My fitness history includes {workouts} 
    My diet history includes {menu_meals}. 
    My current calorie goal is {payload.current_calorie_goal}, I've consumed {payload.consumed_calories} calories with {payload.remaining_calories} remaining. 
    Today's date is {today()}. Using all of this information that I've given you, do think my daily calorie goal should be updated? If so, what should it change to? 
    Respond ONLY with a valid JSON object in this exact format, no extra text: {{"calorie_goal": <int in kcal>}}
    """


def tailor_exercise_prompt_text(db: Session, profile_id: int, payload: TailorExerciseRequest) -> str: 
    profile = profile_prompt_text(db, profile_id)
    workouts = workout_history_text(db, profile_id)

    return f"""
    You are a personal fitness coach tasked with providing specific advice to a profile: {profile}
    My fitness history includes {workouts} 
    My ongoing session is: {payload.split_name} split {payload.date}, {payload.workout_name} workout, {payload.exercise_name} exercise, {payload.machine_name}. 
    Respond ONLY with a valid JSON object in this exact format, no extra text: {{"weight": <int in lbs>, "sets": <int>, "reps": <int>}}
    """


if __name__ == '__main__':
    payload = TailorExerciseRequest(date='2026-04-01', split_name='pull day', workout_name='bicep', exercise_name='bicep curl', machine_name='dumbbell')
    print(tailor_exercise_prompt_text(db, 1, payload))