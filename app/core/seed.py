
import pandas as pd
from app.core.session import engine, SessionLocal
from app.core.db import Base, menu_meals  # import the matching model
from app.core import repos


def seed_static(session):
    # call all populators here
    repos.populate_splits(session)
    repos.populate_workouts(session)
    repos.populate_exercises(session)
    repos.populate_machines(session)
    repos.populate_meals(session)
    repos.populate_muscle_groups(session)
    repos.populate_difficulties(session)
    repos.populate_exercise_types(session)
    repos.populate_spice_levels(session)
    repos.populate_cuisines(session)
    repos.populate_complexities(session)
    repos.populate_goals(session)
    repos.populate_prep_times(session)
    repos.populate_cook_times(session)
    repos.populate_dietary_tags(session)

def bootstrap(drop_all: bool = False, seed: bool = True):
    if drop_all:
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)

    if seed:
        with SessionLocal() as session:
             # populate_* currently commit() inside each function so don't do it again here
            seed_static(session)

        print("✅ DB created" + (" + seeded" if seed else "") + f" at {DB_URL}")


def seed_menu_meals():
    df = pd.read_csv('app/core/menu_meals.csv')

    df.to_sql("menu_meals", con=engine, if_exists="append", index=False)

if __name__ == "__main__":
    # set drop_all=True for a clean rebuild during dev
    #bootstrap(drop_all=False, seed=True)

    seed_menu_meals()
