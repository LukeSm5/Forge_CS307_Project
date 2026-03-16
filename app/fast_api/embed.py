"""
- Creates strings that represent gym sessions with time
- Embed and Upsert them to a Pinecone index
- Evenetually, we will call upsert_workout_sessions() everytime we add to session_workouts 
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec
from sqlalchemy.orm import Session
from app.core.session import SessionLocal
from app.core.db import (
    session_workouts, session_exercises,
    Exercises, Machines, Workouts, Splits
)

load_dotenv()

# --- CLIENTS ---
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# --- PINECONE INDEX ---
INDEX_NAME = "workouts"
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536  # dimension for text-embedding-3-small

def init_pinecone_index():
    existing = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing:
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        print(f"Created Pinecone index: {INDEX_NAME}")
    else:
        print(f"Index already exists: {INDEX_NAME}")
    return pc.Index(INDEX_NAME)


def build_workout_session_text(db: Session, session: session_workouts) -> str:
    """
    Joins session_workouts → session_exercises → Exercises + Machines + Workouts + Splits\n
    Build a string for embedding.

    "Pull split, Back workout, 2026-03-12, 32 min:
     pull-up x8 bodyweight set1, pull-up x6 bodyweight set2,
     bent-over row x10 45lb cable set1, bent-over row x10 45lb cable set2"
    """

    # get workout name
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
    duration_str = f"{session.duration} min" if session.duration else "unknown duration"
    exercises_str = ", ".join(exercise_strings) if exercise_strings else "no exercises logged"

    return f"{split_name} split, {workout_name} workout, {date_str}, {duration_str}: {exercises_str}"


def embed_text(text: str) -> list[float]:
    response = openai_client.embeddings.create(input=text, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def upsert_workout_sessions(profile_id: int = None):
    """
    Embeds all session_workouts rows and upserts to Pinecone.
    Optionally filter by ProfileID to embed one user at a time.
    """
    index = init_pinecone_index()
    db = SessionLocal()

    try:
        query = db.query(session_workouts)
        if profile_id:
            query = query.filter(session_workouts.ProfileID == profile_id)
        sessions = query.all()

        print(f"Embedding {len(sessions)} sessions...")

        vectors = []
        for work_sess in sessions:
            text = build_workout_session_text(db, work_sess)
            embedding = embed_text(text)

            vector = {
                "id": f"session_{work_sess.SessionID}",   # unique Pinecone vector ID
                "values": embedding,
                "metadata": {
                    "ProfileID": work_sess.ProfileID,
                    "SessionID": work_sess.SessionID,
                    "WorkoutID": work_sess.WorkoutID,
                    "SplitID": work_sess.SplitID or -1,
                    "date": work_sess.date.strftime("%Y-%m-%d") if work_sess.date else "",
                    "duration": work_sess.duration or 0,
                    "text": text                         # store text for debugging/prompt injection
                }
            }
            vectors.append(vector)
            print(f"  ✓ session_{work_sess.SessionID}: {text[:80]}...")

        # upsert in batches of 100 (Pinecone limit)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch)
            print(f"  Upserted batch {i // batch_size + 1}")

        print(f"Done. {len(vectors)} vectors upserted to '{INDEX_NAME}'")

    finally:
        db.close()


if __name__ == "__main__":
    upsert_workout_sessions()  # embeds workout sessions for all profiles
    # upsert_sessions(profile_id=1)  # or just one user