from sqlalchemy.orm import Session
from app.core.db import Accounts, Profiles, Splits, Workouts, Exercises, Machines, Meals, Ingredients, MuscleGroupTags, DifficultyTags, ExerciseTypeTags, exercise_tags, exercise_muscle_groups
from fastapi import HTTPException, Header
from app.core.auth_tokens import decode_access_token


# fill all these lists out 

def populate_splits(sess):
    s = [
        Splits(name="back & bi")
    ]

    for obj in s:
        exists = sess.query(Splits).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return s


def populate_workouts(sess):
    w = [
        Workouts(name='back'),
        Workouts(name='bicep'),
        Workouts(name='chest'),
        Workouts(name='triceps'),
        Workouts(name='shoulders'),
        Workouts(name='legs'),
        Workouts(name='core'),
        Workouts(name='cardio'),
    ]

    for obj in w:
        exists = sess.query(Workouts).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return w


def populate_exercises(sess):
    e = [
        Exercises(name='pull up')
    ]

    for obj in e:
        exists = sess.query(Exercises).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return e


def populate_machines(sess):
    m = [
        Machines(name='dumbbell')
    ]
    for obj in m:
        exists = sess.query(Machines).filter_by(name=obj.name).first()
        if not exists:
            sess.add(obj)
    sess.commit()
    return m


def populate_meals(sess):
    m = [
        Meals(name='chicken & rice')
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
    """
    Attach difficulty, exercise type, and muscle group tags to an exercise.
    Replaces any existing tags on that exercise. Returns True if successful.
    """
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
    """
    Returns all valid values for muscle groups, difficulties, and exercise types.
    Useful for populating dropdowns in the frontend.
    """
    return {
        "muscle_groups": sess.query(MuscleGroupTags).all(),
        "difficulties":  sess.query(DifficultyTags).all(),
        "exercise_types": sess.query(ExerciseTypeTags).all(),
    }

