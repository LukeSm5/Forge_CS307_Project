
from sqlalchemy.orm import Session
from app.core.db import Accounts, Profiles, Splits, Workouts, Exercises, Machines, Meals, Ingredients


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




def delete_account_by_id(sess: Session, user_id: int) -> bool:
    """
    Deletes an account by UserID, returning True if deleted and False otherwise.
    """
    account = sess.query(Accounts).filter(Accounts.UserID == user_id).first()
    if account:
        sess.delete(account), sess.flush()
        return True
    return False
