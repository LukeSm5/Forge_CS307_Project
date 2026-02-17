from sqlalchemy import (
    Column, Integer, Text, ForeignKey, Float
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Accounts(Base):
    __tablename__ = 'Accounts'
    UserID = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(Text, nullable=False)
    password = Column(Text, nullable=False)         # encrypt ?
    bio = Column(Text)                              # could also add feature for Remember Me log ins 

class Profiles(Base):
    __tablename__ = 'Profiles'
    ProfileID = Column(Integer, ForeignKey('Accounts.UserID'), primary_key=True)
    age = Column(Integer, nullable=False)
    weight = Column(Integer, nullable=False)
    height_in = Column(Integer, nullable=False)
    gender = Column(Text, nullable=False)
    health_status = Column(Text)
    health_goals = Column(Text)


class Splits(Base):                                                         # static                             
    __tablename__ = 'Splits'                                                # populate with 'back & bicep', 'pull', 'chest & tricep', 'push'
    SplitID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)

class Workouts(Base):
    __tablename__ = 'Workouts'                                              # static
    WorkoutID = Column(Integer, primary_key=True, autoincrement=True)       # populate with 'back', 'bicep', 'chest', 'cardio'
    name = Column(Text, nullable=False)

class Exercises(Base):
    __tablename__ = 'Exercises'                                             # static
    ExerciseID = Column(Integer, primary_key=True, autoincrement=True)      # populate with 'bicep curl', 'bench press', 'pull up'
    name = Column(Text, nullable=False)

class Machines(Base):
    __tablename__ = 'Machines'                                              # static
    MachineID = Column(Integer, primary_key=True, autoincrement=True)       # populate with 'dumbells', 'straight bar cable', 'treadmill'
    name = Column(Text, nullable=False)

class workout_exercises(Base):
    __tablename__ = 'workout_exercises'
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), primary_key=True, nullable=False)
    ExerciseID = Column(Integer, ForeignKey('Exercises.ExerciseID'), primary_key=True, nullable=False)
    MachineID = Column(Integer, ForeignKey('Machines.MachineID'), primary_key=True)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    sets = Column(Integer)
    reps = Column(Integer)              # dynamic
    weight = Column(Integer)            # will change based on profile characteristics 
    notes = Column(Text)

class split_workouts(Base):
    __tablename__ = 'split_workouts'
    SplitID = Column(Integer, ForeignKey('Splits.SplitID'), primary_key=True, nullable=False)
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    day = Column(Integer)       # 1                  
    period = Column(Integer)    # 5 (day split)         # dynamic 
    notes = Column(Text)        # weekdays only         # will change based on profile characteristics 


class Posts(Base):
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), nullable=False)            # want to merge with workout_exercises
    ExerciseID = Column(Integer, ForeignKey('Exercises.ExerciseID'), nullable=False)
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), nullable=False)
    MachineID = Column(Integer, ForeignKey('Machines.MachineID'), nullable=False)
    caption = Column(Text)
    
class Friends(Base):
    __tablename__ = 'Friends'
    ProfileID1 = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    ProfileID2 = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)

class Likes(Base):
    __tablename__ = 'Likes'
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)

class Comments(Base):
    __tablename__ = 'Comments'
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    text = Column(Text, nullable=False)

# how exactly track nutrition from serving size ?

class Meals(Base):
    __tablename__ = 'Meals'
    MealID = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    name = Column(Text, nullable=False)

class Ingredients(Base):
    __tablename__ = 'Ingredients'
    IngredientID = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    name = Column(Text, nullable=False)

class meal_ingredients(Base):
    MealID = Column(Integer, ForeignKey('Meals.MealID'), primary_key=True, nullable=False)
    IngredientID = Column(Integer, ForeignKey('Ingredients.IngredientID'), primary_key=True, nullable=False)
    serving_size = Column(Float)
    instructions = Column(Text)



# need to find some good chain restaurant menu data first
class menu_meals(Base):
    __tablename__ = 'menu_meals'
