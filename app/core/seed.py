
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.db import Base
from app.core import repos

DB_URL = os.getenv("DATABASE_URL", "sqlite:///forge.db")
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, future=True, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

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

def bootstrap(drop_all: bool = False, seed: bool = True):
    if drop_all:
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)

    if seed:
        with SessionLocal() as session:
            # populate_* currently commit() inside each function so don't do it again here
            seed_static(session)

    print("✅ DB created" + (" + seeded" if seed else "") + f" at {DB_URL}")

if __name__ == "__main__":
    # set drop_all=True for a clean rebuild during dev
    bootstrap(drop_all=False, seed=True)
