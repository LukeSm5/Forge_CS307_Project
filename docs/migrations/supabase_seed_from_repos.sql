-- Seed data mirrored from app/core/repos.py populate_* functions
-- Safe to run multiple times (uses WHERE NOT EXISTS checks).

BEGIN;

-- Fix serial sequences in case tables already contain rows.
SELECT setval(pg_get_serial_sequence('"Accounts"', 'UserID'), COALESCE((SELECT MAX("UserID") FROM "Accounts"), 1), true);
SELECT setval(pg_get_serial_sequence('"Splits"', 'SplitID'), COALESCE((SELECT MAX("SplitID") FROM "Splits"), 1), true);
SELECT setval(pg_get_serial_sequence('"Workouts"', 'WorkoutID'), COALESCE((SELECT MAX("WorkoutID") FROM "Workouts"), 1), true);
SELECT setval(pg_get_serial_sequence('"Exercises"', 'ExerciseID'), COALESCE((SELECT MAX("ExerciseID") FROM "Exercises"), 1), true);
SELECT setval(pg_get_serial_sequence('"Machines"', 'MachineID'), COALESCE((SELECT MAX("MachineID") FROM "Machines"), 1), true);
SELECT setval(pg_get_serial_sequence('"Meals"', 'MealID'), COALESCE((SELECT MAX("MealID") FROM "Meals"), 1), true);
SELECT setval(pg_get_serial_sequence('"Ingredients"', 'IngredientID'), COALESCE((SELECT MAX("IngredientID") FROM "Ingredients"), 1), true);
SELECT setval(pg_get_serial_sequence('"MuscleGroupTags"', 'MuscleGroupID'), COALESCE((SELECT MAX("MuscleGroupID") FROM "MuscleGroupTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"DifficultyTags"', 'DifficultyID'), COALESCE((SELECT MAX("DifficultyID") FROM "DifficultyTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"ExerciseTypeTags"', 'ExerciseTypeID'), COALESCE((SELECT MAX("ExerciseTypeID") FROM "ExerciseTypeTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"SpiceLevelTags"', 'SpiceLevelID'), COALESCE((SELECT MAX("SpiceLevelID") FROM "SpiceLevelTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"CuisineTags"', 'CuisineID'), COALESCE((SELECT MAX("CuisineID") FROM "CuisineTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"ComplexityTags"', 'ComplexityID'), COALESCE((SELECT MAX("ComplexityID") FROM "ComplexityTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"GoalTags"', 'GoalID'), COALESCE((SELECT MAX("GoalID") FROM "GoalTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"PrepTimeTags"', 'PrepTimeID'), COALESCE((SELECT MAX("PrepTimeID") FROM "PrepTimeTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"CookTimeTags"', 'CookTimeID'), COALESCE((SELECT MAX("CookTimeID") FROM "CookTimeTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"DietaryTags"', 'DietaryID'), COALESCE((SELECT MAX("DietaryID") FROM "DietaryTags"), 1), true);
SELECT setval(pg_get_serial_sequence('"menu_meals"', 'MenuMealID'), COALESCE((SELECT MAX("MenuMealID") FROM "menu_meals"), 1), true);

-- Splits
INSERT INTO "Splits" (name)
SELECT v.name
FROM (VALUES
  ('back & bicep'),
  ('chest, shoulder, tricep'),
  ('calisthenics')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "Splits" s WHERE s.name = v.name);

-- Workouts
INSERT INTO "Workouts" (name)
SELECT v.name
FROM (VALUES
  ('back'), ('bicep'), ('chest'), ('triceps'), ('shoulders'), ('quads'),
  ('abs'), ('cardio'), ('forearms'), ('obliques'), ('lower_back'),
  ('hamstrings'), ('glutes'), ('calves'), ('hip_flexors'), ('full_body')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "Workouts" w WHERE w.name = v.name);

-- Exercises
INSERT INTO "Exercises" (name)
SELECT v.name
FROM (VALUES
  ('pull up'), ('bicep curl'), ('bench press'), ('skull crushers'),
  ('tricep pushdown'), ('shoulder press'), ('bulgarian split squat'),
  ('romanian deadlift'), ('shrugs'), ('power clean'), ('incline press'),
  ('decline press'), ('face pull'), ('push ups'), ('sit ups'),
  ('burpees'), ('sled push'), ('russian twists'), ('sled pulls'),
  ('box jumps')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "Exercises" e WHERE e.name = v.name);

-- Machines
INSERT INTO "Machines" (name)
SELECT v.name
FROM (VALUES
  ('dumbbell'), ('barbell'), ('body'), ('cable'), ('lat pulldown'),
  ('pec deck'), ('preacher curls'), ('tricep extension'), ('lateral raise'),
  ('leg extension'), ('leg curl'), ('ab crunch'), ('rows'),
  ('back extension'), ('dip machine'), ('kickback'), ('calf extension'),
  ('hip adduction'), ('hip abduction')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "Machines" m WHERE m.name = v.name);

-- Meals
INSERT INTO "Meals" (name)
SELECT v.name
FROM (VALUES
  ('chicken & rice'),
  ('salmon and broccoli'),
  ('cheesy 5-layer burrito'),
  ('oatmeal')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "Meals" m WHERE m.name = v.name);

-- Tag tables
INSERT INTO "MuscleGroupTags" (name)
SELECT v.name
FROM (VALUES
  ('chest'), ('back'), ('shoulders'), ('biceps'), ('triceps'),
  ('forearms'), ('abs'), ('obliques'), ('lower_back'), ('quads'),
  ('hamstrings'), ('glutes'), ('calves'), ('hip_flexors'), ('full_body')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "MuscleGroupTags" t WHERE t.name = v.name);

INSERT INTO "DifficultyTags" (name)
SELECT v.name
FROM (VALUES ('beginner'), ('intermediate'), ('advanced'), ('elite')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "DifficultyTags" t WHERE t.name = v.name);

INSERT INTO "ExerciseTypeTags" (name)
SELECT v.name
FROM (VALUES ('strength'), ('cardio'), ('hybrid')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "ExerciseTypeTags" t WHERE t.name = v.name);

INSERT INTO "SpiceLevelTags" (name)
SELECT v.name
FROM (VALUES ('mild'), ('medium'), ('hot'), ('extra_hot')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "SpiceLevelTags" t WHERE t.name = v.name);

INSERT INTO "CuisineTags" (name)
SELECT v.name
FROM (VALUES
  ('american'), ('italian'), ('mexican'), ('asian'),
  ('mediterranean'), ('indian'), ('middle_eastern'), ('other')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "CuisineTags" t WHERE t.name = v.name);

INSERT INTO "ComplexityTags" (name)
SELECT v.name
FROM (VALUES ('simple'), ('moderate'), ('complex')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "ComplexityTags" t WHERE t.name = v.name);

INSERT INTO "GoalTags" (name)
SELECT v.name
FROM (VALUES ('fat_loss'), ('muscle_gain'), ('maintenance')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "GoalTags" t WHERE t.name = v.name);

INSERT INTO "PrepTimeTags" (name)
SELECT v.name
FROM (VALUES ('quick'), ('medium'), ('long')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "PrepTimeTags" t WHERE t.name = v.name);

INSERT INTO "CookTimeTags" (name)
SELECT v.name
FROM (VALUES ('quick'), ('medium'), ('long')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "CookTimeTags" t WHERE t.name = v.name);

INSERT INTO "DietaryTags" (name)
SELECT v.name
FROM (VALUES
  ('vegetarian'), ('vegan'), ('gluten_free'), ('dairy_free'),
  ('nut_free'), ('halal'), ('kosher'), ('low_carb'), ('high_protein')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "DietaryTags" t WHERE t.name = v.name);

COMMIT;
