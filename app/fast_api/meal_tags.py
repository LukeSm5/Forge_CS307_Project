from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from enum import Enum
from typing import Optional, List

from app.core.db import (
    Meals,
    SpiceLevelTags, CuisineTags, ComplexityTags,
    GoalTags, PrepTimeTags, CookTimeTags, DietaryTags,
    meal_tags, meal_dietary_tags,
)
from app.core import repos
from app.core.database import SessionLocal

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enums

class SpiceLevel(str, Enum):
    MILD       = "mild"
    MEDIUM     = "medium"
    HOT        = "hot"
    EXTRA_HOT  = "extra_hot"
class Cuisine(str, Enum):
    AMERICAN       = "american"
    ITALIAN        = "italian"
    MEXICAN        = "mexican"
    ASIAN          = "asian"
    MEDITERRANEAN  = "mediterranean"
    INDIAN         = "indian"
    MIDDLE_EASTERN = "middle_eastern"
    OTHER          = "other"
class Complexity(str, Enum):
    SIMPLE   = "simple"
    MODERATE = "moderate"
    COMPLEX  = "complex"
class Goal(str, Enum):
    FAT_LOSS     = "fat_loss"
    MUSCLE_GAIN  = "muscle_gain"
    MAINTENANCE  = "maintenance"
class TimeLabel(str, Enum):
    QUICK  = "quick"
    MEDIUM = "medium"
    LONG   = "long"
class DietaryTag(str, Enum):
    VEGETARIAN   = "vegetarian"
    VEGAN        = "vegan"
    GLUTEN_FREE  = "gluten_free"
    DAIRY_FREE   = "dairy_free"
    NUT_FREE     = "nut_free"
    HALAL        = "halal"
    KOSHER       = "kosher"
    LOW_CARB     = "low_carb"
    HIGH_PROTEIN = "high_protein"
class MealTagRequest(BaseModel):
    meal_id:         int
    spice_level_id:  int
    cuisine_id:      int
    complexity_id:   int
    goal_id:         int
    prep_time_id:    int
    cook_time_id:    int

    class MealTagRequest(BaseModel):
        meal_id: int
        spice_level_id: int
        cuisine_id: int
        complexity_id: int
        goal_id: int
        prep_time_id: int
        cook_time_id: int
        dietary_tag_ids: List[int] = []
class MealTagResponse(BaseModel):
    meal_id:      int
    spice_level:  str
    cuisine:      str
    complexity:   str
    goal:         str
    prep_time:    str
    cook_time:    str
    dietary_tags: list[str]

    class Config:
        from_attributes = True
router = APIRouter(prefix="/meals", tags=["Meal Tags"])
@router.get("/tags/options")
def get_tag_options(sess: Session = Depends(get_session)):
    return repos.get_all_meal_tag_options(sess)
@router.get("/tags/spice-levels",  response_model=list[str])
def list_spice_levels():
    return [e.value for e in SpiceLevel]
@router.get("/tags/cuisines",      response_model=list[str])
def list_cuisines():
    return [e.value for e in Cuisine]
@router.get("/tags/complexities",  response_model=list[str])
def list_complexities():
    return [e.value for e in Complexity]
@router.get("/tags/goals",         response_model=list[str])
def list_goals():
    return [e.value for e in Goal]
@router.get("/tags/time-labels",   response_model=list[str])
def list_time_labels():
    return [e.value for e in TimeLabel]
@router.get("/tags/dietary",       response_model=list[str])
def list_dietary_tags():
    return [e.value for e in DietaryTag]
@router.get("/tags/summary")
def tag_summary(sess: Session = Depends(get_session)):
    all_tags = sess.query(meal_tags).all()
    all_dietary = sess.query(meal_dietary_tags).all()
    def _count(rows, attr):
        counts: dict[str, int] = {}
        for row in rows:
            val = str(getattr(row, attr))
            counts[val] = counts.get(val, 0) + 1
        return counts
    return {
        "total_meals":   sess.query(Meals).count(),
        "by_spice":      _count(all_tags, "SpiceLevelID"),
        "by_cuisine":    _count(all_tags, "CuisineID"),
        "by_complexity": _count(all_tags, "ComplexityID"),
        "by_goal":       _count(all_tags, "GoalID"),
        "by_prep_time":  _count(all_tags, "PrepTimeID"),
        "by_cook_time":  _count(all_tags, "CookTimeID"),
        "by_dietary":    _count(all_dietary, "DietaryID"),
    }
@router.post("/tags", status_code=201)
def tag_meal(payload: MealTagRequest, sess: Session = Depends(get_session)):
    repos.tag_meal(
        sess,
        meal_id=payload.meal_id,
        spice_level_id=payload.spice_level_id,
        cuisine_id=payload.cuisine_id,
        complexity_id=payload.complexity_id,
        goal_id=payload.goal_id,
        prep_time_id=payload.prep_time_id,
        cook_time_id=payload.cook_time_id,
        dietary_tag_ids=payload.dietary_tag_ids,
    )
    return {"detail": "Meal tagged successfully."}
@router.get("/tags/{meal_id}")
def get_meal_tags(meal_id: int, sess: Session = Depends(get_session)):
    return repos.get_meal_tags(sess, meal_id)
@router.delete("/tags/{meal_id}", status_code=204)
def delete_meal_tags(meal_id: int, sess: Session = Depends(get_session)):
    tag = sess.query(meal_tags).filter_by(MealID=meal_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="No tags found for this meal.")
    sess.query(meal_dietary_tags).filter_by(MealID=meal_id).delete()
    sess.delete(tag)
    sess.commit()
@router.get("/filter")
def filter_meals(
    spice_level:  Optional[SpiceLevel]  = Query(None, description="Filter by spice level"),
    cuisine:      Optional[Cuisine]     = Query(None, description="Filter by cuisine"),
    complexity:   Optional[Complexity]  = Query(None, description="Filter by complexity"),
    goal:         Optional[Goal]        = Query(None, description="Filter by fat_loss / muscle_gain / maintenance"),
    prep_time:    Optional[TimeLabel]   = Query(None, description="Filter by prep time"),
    cook_time:    Optional[TimeLabel]   = Query(None, description="Filter by cook time"),
    dietary_tag:  Optional[DietaryTag]  = Query(None, description="Filter by a single dietary tag"),
    sess:         Session               = Depends(get_session),
):
    def _id(model, name: str | None):
        if name is None:
            return None
        row = sess.query(model).filter_by(name=name).first()
        if not row:
            raise HTTPException(status_code=400, detail=f"Unknown tag value: '{name}'")
        return row
    spice_row    = _id(SpiceLevelTags, spice_level.value  if spice_level  else None)
    cuisine_row  = _id(CuisineTags,    cuisine.value      if cuisine      else None)
    complex_row  = _id(ComplexityTags, complexity.value   if complexity   else None)
    goal_row     = _id(GoalTags,       goal.value         if goal         else None)
    prep_row     = _id(PrepTimeTags,   prep_time.value    if prep_time    else None)
    cook_row     = _id(CookTimeTags,   cook_time.value    if cook_time    else None)
    dietary_row  = _id(DietaryTags,    dietary_tag.value  if dietary_tag  else None)
    return repos.filter_meals_by_tags(
        sess,
        spice_level_id = spice_row.SpiceLevelID  if spice_row   else None,
        cuisine_id     = cuisine_row.CuisineID   if cuisine_row  else None,
        complexity_id  = complex_row.ComplexityID if complex_row else None,
        goal_id        = goal_row.GoalID          if goal_row    else None,
        prep_time_id   = prep_row.PrepTimeID      if prep_row    else None,
        cook_time_id   = cook_row.CookTimeID      if cook_row    else None,
        dietary_tag_id = dietary_row.DietaryID    if dietary_row else None,
    )