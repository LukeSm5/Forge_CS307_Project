
from sqlalchemy.orm import Session
from app.core.db import Accounts, Profiles, Splits, Workouts, Exercises, Machines, Meals, Ingredients
from fastapi import HTTPException, Header
from app.core.auth_tokens import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expiry,
    utcnow,
)


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
        Workouts(name='back')
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
    token decreypted to UserID then lookks up and returns Accounts object if exists
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
