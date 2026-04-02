from dataclasses import dataclass, field
from typing import Literal, Optional
from datetime import date


GoalDirection = Literal["under", "over"]


@dataclass
class Tracker:
    id: str
    name: str
    unit: str
    goal: Optional[float]
    direction: GoalDirection = "under"
    value: float = 0.0
    
    def log(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Amount must be positive.")
        self.value += amount

    def remove(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Amount must be positive.")
        self.value = max(0.0, self.value - amount)

    def reset(self) -> None:
        self.value = 0.0

    def set_goal(self, goal: float, direction: Optional[GoalDirection] = None) -> None:
        if goal < 0:
            raise ValueError("Goal must be non-negative.")
        self.goal = goal
        if direction:
            self.direction = direction

    def clear_goal(self) -> None:
        self.goal = None
        self.value = 0.0

    @property
    def has_goal(self) -> bool:
        return self.goal is not None

    @property
    def is_goal_met(self) -> Optional[bool]:
        if self.goal is None or self.value == 0:
            return None
        if self.direction == "under":
            return self.value <= self.goal
        return self.value >= self.goal

    @property
    def progress_pct(self) -> float:
        if self.goal is None or self.goal <= 0:
            return 0.0
        return min(self.value / self.goal, 1.0)

    @property
    def status_text(self) -> str:
        met = self.is_goal_met
        if met is None:
            return "no goal set" if self.goal is None else "not started"
        diff = abs(self.goal - self.value)
        if met:
            return f"{diff:.1f}{self.unit} left" if self.direction == "under" else "goal met"
        return f"{diff:.1f}{self.unit} over" if self.direction == "under" else f"{diff:.1f}{self.unit} to go"

    def summary(self) -> dict:
        return {
            "id":           self.id,
            "name":         self.name,
            "unit":         self.unit,
            "value":        round(self.value, 1),
            "goal":         self.goal,
            "has_goal":     self.has_goal,
            "direction":    self.direction,
            "progress_pct": round(self.progress_pct * 100, 1),
            "goal_met":     self.is_goal_met,
            "status":       self.status_text,
        }


@dataclass
class DailyLog:
    log_date: date = field(default_factory=date.today)
    trackers: list[Tracker] = field(default_factory=list)

    @classmethod
    def default(cls) -> "DailyLog":
        return cls(trackers=[
            Tracker("calories", "Calories", "kcal", 2000, "under"),
            Tracker("protein",  "Protein",  "g",    150,  "over"),
            Tracker("carbs",    "Carbs",    "g",    250,  "under"),
            Tracker("fat",      "Fat",      "g",    65,   "under"),
            Tracker("sugar",    "Sugar",    "g",    50,   "under"),
            Tracker("sodium",   "Sodium",   "mg",   2300, "under"),
            Tracker("fiber",    "Fiber",    "g",    28,   "over"),
            Tracker("water",    "Water",    "cups", 8,    "over"),
        ])

    @classmethod
    def blank(cls) -> "DailyLog":
        return cls(trackers=[
            Tracker("calories", "Calories", "kcal", None, "under"),
            Tracker("protein",  "Protein",  "g",    None, "over"),
            Tracker("carbs",    "Carbs",    "g",    None, "under"),
            Tracker("fat",      "Fat",      "g",    None, "under"),
            Tracker("sugar",    "Sugar",    "g",    None, "under"),
            Tracker("sodium",   "Sodium",   "mg",   None, "under"),
            Tracker("fiber",    "Fiber",    "g",    None, "over"),
            Tracker("water",    "Water",    "cups", None, "over"),
        ])

    def get(self, tracker_id: str) -> Tracker:
        for t in self.trackers:
            if t.id == tracker_id:
                return t
        raise KeyError(f"No tracker with id '{tracker_id}'")

    def log(self, tracker_id: str, amount: float) -> None:
        t = self.get(tracker_id)
        if not t.has_goal:
            raise ValueError(
                f"Cannot log to '{tracker_id}' — no goal has been set. "
                "Call set_goal() first."
            )
        t.log(amount)

    def remove(self, tracker_id: str, amount: float) -> None:
        self.get(tracker_id).remove(amount)

    def set_goal(
        self,
        tracker_id: str,
        goal: float,
        direction: Optional[GoalDirection] = None,
    ) -> None:
        self.get(tracker_id).set_goal(goal, direction)

    def clear_goal(self, tracker_id: str) -> None:
        self.get(tracker_id).clear_goal()

    def reset_all(self) -> None:
        for t in self.trackers:
            t.reset()

    def all_goals_met(self) -> bool:
        return all(
            t.is_goal_met is True
            for t in self.trackers
            if t.has_goal
        )

    def trackers_without_goals(self) -> list[Tracker]:
        return [t for t in self.trackers if not t.has_goal]

    def summary(self) -> dict:
        return {
            "date":           str(self.log_date),
            "all_goals_met":  self.all_goals_met(),
            "missing_goals":  [t.id for t in self.trackers_without_goals()],
            "trackers":       [t.summary() for t in self.trackers],
        }

    def log_meal_macros(
        self,
        macros: dict[str, float | None],
        servings: float = 1.0,
    ) -> dict[str, float]:
        if servings <= 0:
            raise ValueError("Servings must be positive.")

        applied: dict[str, float] = {}
        for tracker_id, raw in macros.items():
            if raw is None or raw <= 0:
                continue
            amount = raw * servings
            try:
                tracker = self.get(tracker_id)
            except KeyError:
                continue
            tracker.value += amount
            applied[tracker_id] = round(amount, 1)
        return applied

    def undo_meal_macros(
        self,
        macros: dict[str, float | None],
        servings: float = 1.0,
    ) -> dict[str, float]:
        if servings <= 0:
            raise ValueError("Servings must be positive.")

        removed: dict[str, float] = {}
        for tracker_id, raw in macros.items():
            if raw is None or raw <= 0:
                continue
            amount = raw * servings
            try:
                tracker = self.get(tracker_id)
            except KeyError:
                continue
            tracker.value = max(0.0, tracker.value - amount)
            removed[tracker_id] = round(amount, 1)
        return removed


if __name__ == "__main__":
    import json

    print("=== default (goals pre-filled) ===")
    log = DailyLog.default()
    log.log("calories", 450)
    log.log("protein", 52)
    log.log("water", 3)
    print(json.dumps(log.summary(), indent=2))

    print("\n=== blank (no goals set) ===")
    blank = DailyLog.blank()
    print("Trackers without goals:", [t.id for t in blank.trackers_without_goals()])

    blank.set_goal("calories", 1800, "under")
    blank.set_goal("protein", 140, "over")
    blank.log("calories", 600)
    blank.log("protein", 40)
    print(json.dumps(blank.summary(), indent=2))

    print("\n=== clear a goal ===")
    log.clear_goal("water")
    print("water summary:", log.get("water").summary())

    print("\n=== log_meal_macros integration ===")
    day = DailyLog.default()
    chicken_rice_macros = {
        "calories": 480, "protein": 42, "fat": 10,
        "carbs": 52, "sugar": 3, "fiber": 3, "sodium": 540,
    }
    applied = day.log_meal_macros(chicken_rice_macros, servings=1.0)
    print("Applied from Chicken & Rice:", applied)
    tofu_macros = {
        "calories": 320, "protein": 18, "fat": 12,
        "carbs": 36, "sugar": 8, "fiber": 5, "sodium": 820,
    }
    applied2 = day.log_meal_macros(tofu_macros, servings=1.5)
    print("Applied from Tofu Stir Fry (1.5x):", applied2)
    print(json.dumps(day.summary(), indent=2))

    print("\n=== undo a meal ===")
    removed = day.undo_meal_macros(chicken_rice_macros, servings=1.0)
    print("Removed (undo Chicken & Rice):", removed)
    print(json.dumps(day.summary(), indent=2))
