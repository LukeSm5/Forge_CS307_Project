from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, field_validator
from enum import Enum
from typing import Optional
from uuid import uuid4, UUID

class MuscleGroup(str, Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    FOREARMS = "forearms"
    ABS = "abs"
    OBLIQUES = "obliques"
    LOWER_BACK = "lower_back"
    QUADS = "quads"
    HAMSTRINGS = "hamstrings"
    GLUTES = "glutes"
    CALVES = "calves"
    HIP_FLEXORS = "hip_flexors"
    FULL_BODY = "full_body"

class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    ELITE = "elite"

class ExerciseType(str, Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"
    HYBRID = "hybrid"
class TagSet(BaseModel):
    muscle_groups: list[MuscleGroup]
    difficulty: Difficulty
    exercise_type: ExerciseType
    @field_validator("muscle_groups")
    @classmethod
    def at_least_one_muscle_group(cls, v):
        if not v:
            raise ValueError("An exercise must target at least one muscle group.")
        return list(dict.fromkeys(v))


class Exercise(BaseModel):
    id: UUID
    name: str
    description: str
    tags: TagSet


class ExerciseCreate(BaseModel):
    name: str
    description: str = ""
    tags: TagSet

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[TagSet] = None

db: dict[UUID, Exercise] = {}
app = FastAPI(
    title="Exercise Tag System",
    description="Manage exercises tagged by muscle group, difficulty, and type.",
    version="1.0.0",
)
@app.post("/exercises", response_model=Exercise, status_code=201, tags=["Exercises"])
def create_exercise(payload: ExerciseCreate):
    exercise_id = uuid4()
    exercise = Exercise(id=exercise_id, **payload.model_dump())
    db[exercise_id] = exercise
    return exercise
@app.get("/exercises", response_model=list[Exercise], tags=["Exercises"])
def list_exercises(
    muscle_group: Optional[MuscleGroup] = Query(None, description="Filter by muscle group"),
    difficulty: Optional[Difficulty] = Query(None, description="Filter by difficulty"),
    exercise_type: Optional[ExerciseType] = Query(None, description="Filter by strength/cardio/hybrid"),
):
    results = list(db.values())
    if muscle_group:
        results = [e for e in results if muscle_group in e.tags.muscle_groups]
    if difficulty:
        results = [e for e in results if e.tags.difficulty == difficulty]
    if exercise_type:
        results = [e for e in results if e.tags.exercise_type == exercise_type]
    return results
@app.get("/exercises/{exercise_id}", response_model=Exercise, tags=["Exercises"])
def get_exercise(exercise_id: UUID):
    _require(exercise_id)
    return db[exercise_id]
@app.patch("/exercises/{exercise_id}", response_model=Exercise, tags=["Exercises"])
def update_exercise(exercise_id: UUID, payload: ExerciseUpdate):
    _require(exercise_id)
    existing = db[exercise_id]
    updated_data = existing.model_dump()
    if payload.name is not None:
        updated_data["name"] = payload.name
    if payload.description is not None:
        updated_data["description"] = payload.description
    if payload.tags is not None:
        updated_data["tags"] = payload.tags.model_dump()
    db[exercise_id] = Exercise(**updated_data)
    return db[exercise_id]
@app.delete("/exercises/{exercise_id}", status_code=204, tags=["Exercises"])
def delete_exercise(exercise_id: UUID):
    _require(exercise_id)
    del db[exercise_id]
@app.get("/tags/muscle-groups", response_model=list[str], tags=["Tags"])
def list_muscle_groups():
    return [m.value for m in MuscleGroup]
@app.get("/tags/difficulties", response_model=list[str], tags=["Tags"])
def list_difficulties():
    return [d.value for d in Difficulty]
@app.get("/tags/exercise-types", response_model=list[str], tags=["Tags"])
def list_exercise_types():
    return [t.value for t in ExerciseType]
@app.get("/tags/summary", tags=["Tags"])
def tag_summary():
    muscle_counts: dict[str, int] = {m.value: 0 for m in MuscleGroup}
    difficulty_counts: dict[str, int] = {d.value: 0 for d in Difficulty}
    type_counts: dict[str, int] = {t.value: 0 for t in ExerciseType}
    for ex in db.values():
        for mg in ex.tags.muscle_groups:
            muscle_counts[mg.value] += 1
        difficulty_counts[ex.tags.difficulty.value] += 1
        type_counts[ex.tags.exercise_type.value] += 1
    return {
        "total_exercises": len(db),
        "by_muscle_group": {k: v for k, v in muscle_counts.items() if v > 0},
        "by_difficulty": {k: v for k, v in difficulty_counts.items() if v > 0},
        "by_exercise_type": {k: v for k, v in type_counts.items() if v > 0},
    }
def _require(exercise_id: UUID):
    if exercise_id not in db:
        raise HTTPException(status_code=404, detail=f"Exercise {exercise_id} not found.")
