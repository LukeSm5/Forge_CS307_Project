from __future__ import annotations

import hashlib
import json
import logging
import math
import os
from dataclasses import dataclass
from typing import Any
from urllib import error, request

from sqlalchemy.orm import Session

from app.core.db import (
    Accounts,
    Exercises,
    Ingredients,
    Machines,
    Meals,
    Profiles,
    Workouts,
    meal_ingredients,
    menu_meals,
    workout_exercises,
)


EMBED_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "48"))
_VECTOR_CACHE: dict[str, list["VectorDocument"]] = {"workouts": [], "meals": [], "profiles": []}
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
PINECONE_WORKOUT_INDEX = os.getenv("PINECONE_WORKOUT_INDEX", "forge-workouts")
PINECONE_MEAL_INDEX = os.getenv("PINECONE_MEAL_INDEX", "forge-meals")
PINECONE_PROFILE_INDEX = os.getenv("PINECONE_PROFILE_INDEX", "forge-profiles")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "default")
logger = logging.getLogger(__name__)


@dataclass
class VectorDocument:
    doc_id: str
    namespace: str
    text: str
    metadata: dict[str, Any]
    values: list[float]


def _pinecone_enabled() -> bool:
    return bool(PINECONE_API_KEY)


def _pinecone_index_name(namespace: str) -> str:
    if namespace == "workouts":
        return PINECONE_WORKOUT_INDEX
    if namespace == "meals":
        return PINECONE_MEAL_INDEX
    if namespace == "profiles":
        return PINECONE_PROFILE_INDEX
    raise ValueError(f"Unsupported namespace: {namespace}")


def _json_request(url: str, method: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {
        "Api-Key": PINECONE_API_KEY or "",
        "Content-Type": "application/json",
    }
    req = request.Request(url, data=body, headers=headers, method=method)
    with request.urlopen(req, timeout=20) as response:
        raw = response.read().decode("utf-8")
    return json.loads(raw) if raw else {}


def _ensure_pinecone_index(namespace: str) -> str:
    index_name = _pinecone_index_name(namespace)
    describe_url = f"https://api.pinecone.io/indexes/{index_name}"

    try:
        described = _json_request(describe_url, "GET")
        host = described.get("host")
        if host:
            return host
    except error.HTTPError as exc:
        if exc.code != 404:
            raise
        create_payload = {
            "name": index_name,
            "dimension": EMBED_DIMENSION,
            "metric": "cosine",
            "spec": {
                "serverless": {
                    "cloud": PINECONE_CLOUD,
                    "region": PINECONE_REGION,
                }
            },
        }
        _json_request("https://api.pinecone.io/indexes", "POST", create_payload)
        described = _json_request(describe_url, "GET")
        host = described.get("host")
        if host:
            return host

    raise RuntimeError(f"Could not determine Pinecone host for index {index_name}")


def _serialize_metadata_for_pinecone(metadata: dict[str, Any]) -> dict[str, Any]:
    serialized: dict[str, Any] = {}
    for key, value in metadata.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            serialized[key] = value
        else:
            serialized[key] = json.dumps(value)
    return serialized


def _deserialize_metadata_from_pinecone(metadata: dict[str, Any]) -> dict[str, Any]:
    restored: dict[str, Any] = {}
    for key, value in metadata.items():
        if not isinstance(value, str):
            restored[key] = value
            continue
        try:
            restored[key] = json.loads(value)
        except json.JSONDecodeError:
            restored[key] = value
    return restored


def _upsert_pinecone(namespace: str, docs: list["VectorDocument"]) -> None:
    if not docs:
        return
    host = _ensure_pinecone_index(namespace)
    payload = {
        "namespace": PINECONE_NAMESPACE,
        "vectors": [
            {
                "id": doc.doc_id,
                "values": doc.values,
                "metadata": _serialize_metadata_for_pinecone(
                    {
                        **doc.metadata,
                        "text": doc.text,
                        "doc_id": doc.doc_id,
                        "namespace": doc.namespace,
                    }
                ),
            }
            for doc in docs
        ],
    }
    _json_request(f"https://{host}/vectors/upsert", "POST", payload)


def _query_pinecone(namespace: str, query_text: str, top_k: int) -> list[dict[str, Any]]:
    host = _ensure_pinecone_index(namespace)
    payload = {
        "namespace": PINECONE_NAMESPACE,
        "vector": embed_text(query_text),
        "topK": top_k,
        "includeMetadata": True,
        "includeValues": False,
    }
    response = _json_request(f"https://{host}/query", "POST", payload)
    matches = response.get("matches", [])
    normalized: list[dict[str, Any]] = []
    for match in matches:
        metadata = _deserialize_metadata_from_pinecone(match.get("metadata", {}))
        text = metadata.pop("text", "")
        normalized.append(
            {
                "doc_id": match.get("id", metadata.get("doc_id", "")),
                "score": round(match.get("score", 0.0), 4),
                "text": text,
                "metadata": metadata,
            }
        )
    return normalized


def _normalize_text(value: str) -> str:
    return " ".join(value.lower().split())


def _tokenize(text: str) -> list[str]:
    cleaned = "".join(ch if ch.isalnum() else " " for ch in text.lower())
    return [token for token in cleaned.split() if token]


def embed_text(text: str, dimension: int = EMBED_DIMENSION) -> list[float]:
    tokens = _tokenize(text)
    if not tokens:
        return [0.0] * dimension

    vector = [0.0] * dimension
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:2], "big") % dimension
        sign = 1.0 if digest[2] % 2 == 0 else -1.0
        weight = 1.0 + (digest[3] / 255.0)
        vector[bucket] += sign * weight

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def build_profile_context(db: Session, profile_id: int) -> str:
    account = db.query(Accounts).filter(Accounts.UserID == profile_id).first()
    profile = db.query(Profiles).filter(Profiles.ProfileID == profile_id).first()

    recent_workouts = (
        db.query(Workouts.name, Exercises.name, workout_exercises.sets, workout_exercises.reps)
        .join(Workouts, Workouts.WorkoutID == workout_exercises.WorkoutID)
        .join(Exercises, Exercises.ExerciseID == workout_exercises.ExerciseID)
        .filter(workout_exercises.ProfileID == profile_id)
        .order_by(workout_exercises.WorkoutID.desc(), workout_exercises.ExerciseID.asc())
        .limit(12)
        .all()
    )

    recipe_history = (
        db.query(Meals.name, meal_ingredients.serving_size)
        .join(meal_ingredients, meal_ingredients.MealID == Meals.MealID)
        .order_by(Meals.MealID.desc())
        .limit(8)
        .all()
    )

    menu_history = (
        db.query(menu_meals.restaurant, menu_meals.product, menu_meals.energy_kcal)
        .order_by(menu_meals.MenuMealID.desc())
        .limit(8)
        .all()
    )

    parts = [
        f"profile_id={profile_id}",
        f"username={account.username if account else 'unknown'}",
    ]

    if profile:
        parts.extend(
            [
                f"age={profile.age}",
                f"weight={profile.weight}",
                f"height_in={profile.height_in}",
                f"gender={profile.gender}",
                f"health_status={profile.health_status or 'unknown'}",
                f"health_goals={profile.health_goals or 'unknown'}",
            ]
        )

    if recent_workouts:
        history = [
            f"{row[0]}:{row[1]} {row[2]}x{row[3]}"
            for row in recent_workouts
        ]
        parts.append("recent_workouts=" + "; ".join(history))
    else:
        parts.append("recent_workouts=none")

    if recipe_history:
        recipes = [f"{name} ({serving_size})" for name, serving_size in recipe_history]
        parts.append("diet_history_recipes=" + "; ".join(recipes))
    else:
        parts.append("diet_history_recipes=none")

    if menu_history:
        menu_items = [f"{restaurant}:{product} {energy_kcal or 0}kcal" for restaurant, product, energy_kcal in menu_history]
        parts.append("diet_history_restaurants=" + "; ".join(menu_items))
    else:
        parts.append("diet_history_restaurants=none")

    return " | ".join(parts)


def build_profile_documents(db: Session) -> list[VectorDocument]:
    rows = db.query(Accounts.UserID).order_by(Accounts.UserID.asc()).all()
    documents: list[VectorDocument] = []
    for (profile_id,) in rows:
        text = _normalize_text(build_profile_context(db, profile_id))
        documents.append(
            VectorDocument(
                doc_id=f"profile:{profile_id}",
                namespace="profiles",
                text=text,
                metadata={
                    "profile_id": profile_id,
                    "context": text,
                },
                values=embed_text(text),
            )
        )
    return documents


def build_workout_documents(db: Session) -> list[VectorDocument]:
    rows = (
        db.query(
            Workouts.WorkoutID,
            Workouts.name,
            Exercises.ExerciseID,
            Exercises.name,
            Machines.MachineID,
            Machines.name,
            workout_exercises.ProfileID,
            workout_exercises.sets,
            workout_exercises.reps,
            workout_exercises.weight,
            workout_exercises.notes,
        )
        .join(workout_exercises, workout_exercises.WorkoutID == Workouts.WorkoutID)
        .join(Exercises, Exercises.ExerciseID == workout_exercises.ExerciseID)
        .outerjoin(Machines, Machines.MachineID == workout_exercises.MachineID)
        .order_by(Workouts.WorkoutID.asc(), Exercises.ExerciseID.asc())
        .all()
    )

    grouped: dict[tuple[int, int], dict[str, Any]] = {}
    for row in rows:
        workout_id, workout_name, exercise_id, exercise_name, machine_id, machine_name, profile_id, sets, reps, weight, notes = row
        key = (profile_id, workout_id)
        current = grouped.setdefault(
            key,
            {
                "profile_id": profile_id,
                "workout_id": workout_id,
                "workout_name": workout_name,
                "exercises": [],
            },
        )
        current["exercises"].append(
            {
                "exercise_id": exercise_id,
                "exercise_name": exercise_name,
                "machine_id": machine_id,
                "machine_name": machine_name or "unknown",
                "sets": sets,
                "reps": reps,
                "weight": weight,
                "notes": notes,
            }
        )

    documents: list[VectorDocument] = []
    for (_, workout_id), item in grouped.items():
        exercise_summary = "; ".join(
            f"{exercise['exercise_name']} on {exercise['machine_name']} {exercise['sets']}x{exercise['reps']}"
            for exercise in item["exercises"]
        )
        text = _normalize_text(
            f"profile {item['profile_id']} workout {item['workout_name']}. exercises: {exercise_summary}"
        )
        documents.append(
            VectorDocument(
                doc_id=f"workout:{item['profile_id']}:{workout_id}",
                namespace="workouts",
                text=text,
                metadata=item,
                values=embed_text(text),
            )
        )
    return documents


def build_meal_documents(db: Session) -> list[VectorDocument]:
    base_meals = db.query(Meals.MealID, Meals.name).order_by(Meals.MealID.asc()).all()
    recipe_rows = (
        db.query(Meals.MealID, Meals.name, Ingredients.name, meal_ingredients.serving_size, meal_ingredients.instructions)
        .join(meal_ingredients, meal_ingredients.MealID == Meals.MealID)
        .join(Ingredients, Ingredients.IngredientID == meal_ingredients.IngredientID)
        .order_by(Meals.MealID.asc(), Ingredients.IngredientID.asc())
        .all()
    )

    recipe_grouped: dict[int, dict[str, Any]] = {}
    for meal_id, meal_name, ingredient_name, serving_size, instructions in recipe_rows:
        current = recipe_grouped.setdefault(
            meal_id,
            {
                "meal_id": meal_id,
                "meal_name": meal_name,
                "type": "recipe",
                "ingredients": [],
                "instructions": [],
            },
        )
        current["ingredients"].append({"name": ingredient_name, "serving_size": serving_size})
        if instructions:
            current["instructions"].append(instructions)

    documents: list[VectorDocument] = []
    seen_recipe_meal_ids: set[int] = set()
    for meal_id, item in recipe_grouped.items():
        seen_recipe_meal_ids.add(meal_id)
        ingredients_summary = ", ".join(
            f"{ingredient['name']} ({ingredient['serving_size']})"
            for ingredient in item["ingredients"]
        )
        instructions_summary = " ".join(item["instructions"]) if item["instructions"] else "none"
        text = _normalize_text(
            f"recipe meal {item['meal_name']}. ingredients: {ingredients_summary}. instructions: {instructions_summary}"
        )
        documents.append(
            VectorDocument(
                doc_id=f"meal:{meal_id}",
                namespace="meals",
                text=text,
                metadata=item,
                values=embed_text(text),
            )
        )

    for meal_id, meal_name in base_meals:
        if meal_id in seen_recipe_meal_ids:
            continue
        text = _normalize_text(f"meal {meal_name}. ingredients unknown. instructions unknown.")
        documents.append(
            VectorDocument(
                doc_id=f"meal:{meal_id}",
                namespace="meals",
                text=text,
                metadata={
                    "meal_id": meal_id,
                    "meal_name": meal_name,
                    "type": "recipe",
                    "ingredients": [],
                    "instructions": [],
                },
                values=embed_text(text),
            )
        )

    menu_rows = db.query(menu_meals).order_by(menu_meals.MenuMealID.asc()).limit(250).all()
    for row in menu_rows:
        text = _normalize_text(
            f"restaurant meal {row.restaurant} {row.product}. category {row.category}. calories {row.energy_kcal or 0}. "
            f"protein {row.protein_g or 0}. carbs {row.carbohydrates_g or 0}. fat {row.total_fat_g or 0}"
        )
        documents.append(
            VectorDocument(
                doc_id=f"menu:{row.MenuMealID}",
                namespace="meals",
                text=text,
                metadata={
                    "menu_meal_id": row.MenuMealID,
                    "meal_name": row.product,
                    "restaurant": row.restaurant,
                    "category": row.category,
                    "type": "restaurant",
                    "calories": row.energy_kcal,
                    "protein_g": row.protein_g,
                    "carbohydrates_g": row.carbohydrates_g,
                    "total_fat_g": row.total_fat_g,
                },
                values=embed_text(text),
            )
        )

    return documents


def ingest_namespace(db: Session, namespace: str) -> int:
    if namespace == "workouts":
        docs = build_workout_documents(db)
    elif namespace == "meals":
        docs = build_meal_documents(db)
    elif namespace == "profiles":
        docs = build_profile_documents(db)
    else:
        raise ValueError(f"Unsupported namespace: {namespace}")

    _VECTOR_CACHE[namespace] = docs
    if _pinecone_enabled():
        try:
            _upsert_pinecone(namespace, docs)
        except Exception:
            logger.exception("Pinecone upsert failed for namespace=%s", namespace)
    return len(docs)


def query_namespace(db: Session, namespace: str, query_text: str, top_k: int = 5) -> list[dict[str, Any]]:
    if _pinecone_enabled():
        try:
            return _query_pinecone(namespace, query_text, top_k)
        except Exception:
            logger.exception("Pinecone query failed for namespace=%s", namespace)

    if namespace not in _VECTOR_CACHE or not _VECTOR_CACHE[namespace]:
        ingest_namespace(db, namespace)

    query_vector = embed_text(query_text)
    scored = []
    for doc in _VECTOR_CACHE[namespace]:
        score = cosine_similarity(query_vector, doc.values)
        scored.append(
            {
                "doc_id": doc.doc_id,
                "score": round(score, 4),
                "text": doc.text,
                "metadata": doc.metadata,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:top_k]


def construct_quick_workout_prompt(profile_context: str, matches: list[dict[str, Any]]) -> str:
    snippets = []
    for match in matches:
        workout_name = match["metadata"].get("workout_name", "unknown")
        exercises = match["metadata"].get("exercises", [])
        exercise_names = ", ".join(ex["exercise_name"] for ex in exercises[:6])
        snippets.append(f"{workout_name}: {exercise_names}")

    retrieval_summary = " | ".join(snippets) if snippets else "no similar workouts found"
    return (
        f"{profile_context} | retrieved_workouts={retrieval_summary} | "
        "Generate a balanced quick workout using the user's profile, recent training, and similar workouts."
    )


def generate_quick_workout(db: Session, profile_id: int, focus: str | None = None, top_k: int = 3) -> dict[str, Any]:
    profile_context = build_profile_context(db, profile_id)
    query_text = profile_context if not focus else f"{profile_context} | focus={focus}"
    profile_matches = query_namespace(db, "profiles", query_text, top_k=min(top_k, 3))
    matches = query_namespace(db, "workouts", query_text, top_k=top_k)
    prompt = construct_quick_workout_prompt(profile_context, matches)

    selected_exercises: list[dict[str, Any]] = []
    seen_exercise_ids: set[int] = set()

    for match in matches:
        for exercise in match["metadata"].get("exercises", []):
            exercise_id = exercise["exercise_id"]
            if exercise_id in seen_exercise_ids:
                continue
            seen_exercise_ids.add(exercise_id)
            selected_exercises.append(
                {
                    "exercise_id": exercise_id,
                    "exercise_name": exercise["exercise_name"],
                    "machine_id": exercise.get("machine_id"),
                    "machine_name": exercise.get("machine_name"),
                    "sets": exercise.get("sets") or 3,
                    "reps": exercise.get("reps") or 10,
                    "weight": exercise.get("weight"),
                    "notes": exercise.get("notes"),
                }
            )
            if len(selected_exercises) >= 5:
                break
        if len(selected_exercises) >= 5:
            break

    if not selected_exercises:
        fallback_rows = (
            db.query(Exercises.ExerciseID, Exercises.name)
            .order_by(Exercises.ExerciseID.asc())
            .limit(5)
            .all()
        )
        for exercise_id, exercise_name in fallback_rows:
            selected_exercises.append(
                {
                    "exercise_id": exercise_id,
                    "exercise_name": exercise_name,
                    "machine_id": None,
                    "machine_name": None,
                    "sets": 3,
                    "reps": 10,
                    "weight": None,
                    "notes": "Fallback recommendation",
                }
            )

    workout_name = f"{focus.title()} Quick Workout" if focus else "Quick Workout"
    return {
        "profile_id": profile_id,
        "workout_name": workout_name,
        "profile_context": profile_context,
        "profile_matches": profile_matches,
        "prompt": prompt,
        "source_matches": matches,
        "exercises": selected_exercises,
    }
