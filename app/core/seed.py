
import pandas as pd
from app.core.session import engine, SessionLocal
from app.core import repos


def seed_static(session):
    repos.populate_workouts(session)
    repos.populate_exercises(session)
    repos.populate_machines(session)


def seed_menu_meals():
    df = pd.read_csv('app/core/menu_meals.csv')
    df.to_sql("menu_meals", con=engine, if_exists="append", index=False)


if __name__ == "__main__":
    seed_menu_meals()

    db = SessionLocal()
    try:
        seed_static(db)
    finally:
        db.close()
