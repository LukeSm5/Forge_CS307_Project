from sqlalchemy import (
    Column, Integer, Text, ForeignKey, Float, DateTime, Boolean, CheckConstraint,
    UniqueConstraint, Index,
)
from app.core.session import Base
from datetime import datetime, timezone


class Accounts(Base):
    __tablename__ = "Accounts"
    UserID = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(Text, nullable=False, unique=True)          
    username = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)               
    bio = Column(Text)
    refresh_token_hash = Column(Text, nullable=True)
    refresh_expires_at = Column(DateTime(timezone=True), nullable=True)

class Profiles(Base):
    __tablename__ = 'Profiles'
    ProfileID = Column(Integer, ForeignKey('Accounts.UserID'), primary_key=True)
    age = Column(Integer, nullable=False)
    weight = Column(Integer, nullable=False)
    height_in = Column(Integer, nullable=False)
    gender = Column(Text, nullable=False)
    health_status = Column(Text)
    health_goals = Column(Text)
    calorie_goal = Column(Float)
    metricOrImperial = Column(Boolean)  # "metric" or "imperial"
    gym_location = Column(Text)

# --- STATIC ---

class Splits(Base):
    "Pull"                                                        
    __tablename__ = 'Splits'                                               
    SplitID = Column(Integer, primary_key=True, autoincrement=True)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), nullable=False, index=True)
    name = Column(Text, nullable=False)

class Workouts(Base):
    "Back, bicep"
    __tablename__ = 'Workouts'                                             
    WorkoutID = Column(Integer, primary_key=True, autoincrement=True)      
    name = Column(Text, nullable=False)

class Exercises(Base):
    "Pull-ups, hammer curls"
    __tablename__ = 'Exercises'                                            
    ExerciseID = Column(Integer, primary_key=True, autoincrement=True)     
    name = Column(Text, nullable=False)
    advice = Column(Text, nullable=True)

class Machines(Base):
    "Cables, dumbells, barbell, bodyweight"
    __tablename__ = 'Machines'                                             
    MachineID = Column(Integer, primary_key=True, autoincrement=True)      
    name = Column(Text, nullable=False)

# --- TEMPLATES ---

class split_workouts(Base):
    """Push split includes chest & tricep workout on day 1 of 5"""
    __tablename__ = 'split_workouts'
    SplitID = Column(Integer, ForeignKey('Splits.SplitID'), primary_key=True, nullable=False)
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    day = Column(Integer, nullable=False)   # cycle position, e.g. 1 of 5
    notes = Column(Text)

class workout_exercises(Base):
    """Back workout template: pull-ups with dumbbells, 3x10 @ 25lb"""
    __tablename__ = 'workout_exercises'
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), primary_key=True, nullable=False)
    ExerciseID = Column(Integer, ForeignKey('Exercises.ExerciseID'), primary_key=True, nullable=False)
    MachineID = Column(Integer, ForeignKey('Machines.MachineID'), primary_key=True, nullable=True)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    sets = Column(Integer)
    reps = Column(Integer)
    weight = Column(Integer)
    notes = Column(Text)

# --- LOGS ---

class session_workouts(Base):
    """Pull day Back workout session on March 12 lasted 30 minutes"""
    """Pull day Bicep workout session on March 12 lasted 25 minutes"""
    __tablename__ = 'session_workouts'
    SessionID = Column(Integer, primary_key=True, autoincrement=True)
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), nullable=False, index=True)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), nullable=False, index=True)
    SplitID = Column(Integer, ForeignKey('Splits.SplitID'), nullable=True, index=True)  # can query sessions in a split
    date = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)
    notes = Column(Text)

class session_exercises(Base):
    """Session (on March 12 lasted 30 minutes) with pull-ups 4x8 bodyweight"""
    """Session (on March 12 lasted 25 minutes) with hammer curls 4x8 30lb dumbells"""
    __tablename__ = 'session_exercises'
    SessionID = Column(Integer, ForeignKey('session_workouts.SessionID'), primary_key=True, nullable=False)
    ExerciseID = Column(Integer, ForeignKey('Exercises.ExerciseID'), primary_key=True, nullable=False)
    MachineID = Column(Integer, ForeignKey('Machines.MachineID'), primary_key=True, nullable=True)
    set_number = Column(Integer, primary_key=True, nullable=False)  # set 1 vs set 2
    reps = Column(Integer)
    weight = Column(Integer)           

class Posts(Base):
    __tablename__ = 'Posts'
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), nullable=False)            # want to merge with workout_exercises
    ExerciseID = Column(Integer, ForeignKey('Exercises.ExerciseID'), nullable=False)
    WorkoutID = Column(Integer, ForeignKey('Workouts.WorkoutID'), nullable=False)
    MachineID = Column(Integer, ForeignKey('Machines.MachineID'), nullable=False)
    caption = Column(Text)
    
class Friendships(Base):
    __tablename__ = "Friendships"
    __table_args__ = (CheckConstraint("RequesterID <> AddresseeID", name="no_self_friend"),)
    RequesterID = Column(Integer, ForeignKey("Accounts.UserID"), primary_key=True)
    AddresseeID = Column(Integer, ForeignKey("Accounts.UserID"), primary_key=True)
    status = Column(Text, nullable=False, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Blocks(Base):
    __tablename__ = "Blocks"
    __table_args__ = (CheckConstraint("BlockerID <> BlockedID", name="no_self_block"),)
    BlockerID  = Column(Integer, ForeignKey("Accounts.UserID"), primary_key=True)
    BlockedID  = Column(Integer, ForeignKey("Accounts.UserID"), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Reports(Base):
    __tablename__ = "Reports"
    __table_args__ = (CheckConstraint("ReporterID <> ReportedID", name="no_self_report"),)
    ReportID    = Column(Integer, primary_key=True, autoincrement=True)
    ReporterID  = Column(Integer, ForeignKey("Accounts.UserID"), nullable=False)
    ReportedID  = Column(Integer, ForeignKey("Accounts.UserID"), nullable=False)
    description = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class InboxNotifications(Base):
    __tablename__ = "InboxNotifications"
    NotificationID = Column(Integer, primary_key=True, autoincrement=True)
    ProfileID    = Column(Integer, ForeignKey("Accounts.UserID"), nullable=False)
    message        = Column(Text, nullable=False)
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    data           = Column(Text, default="{\"type\": \"generic\"}")  # JSON blob for any additional data (e.g., PostID for a like notification)

class ChatThreads(Base):
    __tablename__ = "ChatThreads"
    __table_args__ = (
        CheckConstraint("User1ID <> User2ID", name="no_self_chat_thread"),
        CheckConstraint("User1ID < User2ID", name="chat_thread_user_order"),
        UniqueConstraint("User1ID", "User2ID", name="uq_chat_thread_pair"),
    )

    ThreadID = Column(Integer, primary_key=True, autoincrement=True)
    User1ID = Column(Integer, ForeignKey("Accounts.UserID"), nullable=False, index=True)
    User2ID = Column(Integer, ForeignKey("Accounts.UserID"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    last_message_at = Column(DateTime(timezone=True), nullable=True)


class ChatMessages(Base):
    __tablename__ = "ChatMessages"

    MessageID = Column(Integer, primary_key=True, autoincrement=True)
    ThreadID = Column(Integer, ForeignKey("ChatThreads.ThreadID"), nullable=False, index=True)
    SenderID = Column(Integer, ForeignKey("Accounts.UserID"), nullable=False, index=True)
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)


Index("ix_chat_messages_thread_created_at", ChatMessages.ThreadID, ChatMessages.created_at)

class Likes(Base):
    __tablename__ = 'Likes'
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)

class Reactions(Base):
    __tablename__ = 'Reactions'
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    reaction_type = Column(Text, nullable=False)  # emoji

class Comments(Base):
    __tablename__ = 'Comments'
    PostID = Column(Integer, primary_key=True, nullable=False)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'), primary_key=True, nullable=False)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# how exactly track nutrition from serving size ?
# need to track macros, in some capacity

class Meals(Base):
    __tablename__ = 'Meals'
    MealID = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    name = Column(Text, nullable=False)

class Ingredients(Base):
    __tablename__ = 'Ingredients'
    IngredientID = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    name = Column(Text, nullable=False)

class meal_ingredients(Base):
    __tablename__ = 'meal_ingredients'
    IngredientID = Column(Integer, primary_key=True, autoincrement=True)
    MealID       = Column(Integer, ForeignKey('Meals.MealID'), nullable=False, index=True)
    name         = Column(Text, nullable=False)                
    quantity     = Column(Float, nullable=True)
    unit         = Column(Text, nullable=False, default="g")
    note         = Column(Text, nullable=True, default="")

# --- STATIC ---

class menu_meals(Base):
    __tablename__ = 'menu_meals'
    MenuMealID = Column(Integer, primary_key=True)
    restaurant = Column(Text, nullable=False)           # Pizza Hut, Burger King, Starbucks, McDonalds, KFC, Dominos, Chick fil A, Shack Shack
    category = Column(Text)             #                           ***         ***                                    ***
    product = Column(Text, nullable=False)              # Large French Fries
    serving_size = Column(Float)                        # mix of g, ml, oz  -->  guess from product name?
    energy_kcal = Column(Float)
    carbohydrates_g = Column(Float) 	
    protein_g = Column(Float)	
    fiber_g	= Column(Float)
    sugar_g	= Column(Float)
    total_fat_g	= Column(Float)
    saturated_fat_g	= Column(Float)
    trans_fat_g	= Column(Float)
    cholesterol_mg	= Column(Float)
    sodium_mg = Column(Float)
    chicken = Column(Boolean)
    beef = Column(Boolean)




class MuscleGroupTags(Base):
    __tablename__ = 'MuscleGroupTags'
    MuscleGroupID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class DifficultyTags(Base):
    __tablename__ = 'DifficultyTags'
    DifficultyID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class ExerciseTypeTags(Base):
    __tablename__ = 'ExerciseTypeTags'
    ExerciseTypeID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class exercise_tags(Base):
    __tablename__ = 'exercise_tags'
    ExerciseID     = Column(Integer, ForeignKey('Exercises.ExerciseID'), primary_key=True, nullable=False)
    DifficultyID   = Column(Integer, ForeignKey('DifficultyTags.DifficultyID'), nullable=False)
    ExerciseTypeID = Column(Integer, ForeignKey('ExerciseTypeTags.ExerciseTypeID'), nullable=False)

class exercise_muscle_groups(Base):
    __tablename__ = 'exercise_muscle_groups'
    ExerciseID    = Column(Integer, ForeignKey('Exercises.ExerciseID'), primary_key=True, nullable=False)
    MuscleGroupID = Column(Integer, ForeignKey('MuscleGroupTags.MuscleGroupID'), primary_key=True, nullable=False)
    
class SpiceLevelTags(Base):
    __tablename__ = 'SpiceLevelTags'
    SpiceLevelID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class CuisineTags(Base):
    __tablename__ = 'CuisineTags'
    CuisineID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class ComplexityTags(Base):
    __tablename__ = 'ComplexityTags'
    ComplexityID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class GoalTags(Base):
    __tablename__ = 'GoalTags'
    GoalID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class PrepTimeTags(Base):
    __tablename__ = 'PrepTimeTags'
    PrepTimeID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class CookTimeTags(Base):
    __tablename__ = 'CookTimeTags'
    CookTimeID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class DietaryTags(Base):
    __tablename__ = 'DietaryTags'
    DietaryID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class meal_tags(Base):
    __tablename__ = 'meal_tags'
    MealID       = Column(Integer, ForeignKey('Meals.MealID'), primary_key=True, nullable=False)
    SpiceLevelID = Column(Integer, ForeignKey('SpiceLevelTags.SpiceLevelID'), nullable=False)
    CuisineID    = Column(Integer, ForeignKey('CuisineTags.CuisineID'), nullable=False)
    ComplexityID = Column(Integer, ForeignKey('ComplexityTags.ComplexityID'), nullable=False)
    GoalID       = Column(Integer, ForeignKey('GoalTags.GoalID'), nullable=False)
    PrepTimeID   = Column(Integer, ForeignKey('PrepTimeTags.PrepTimeID'), nullable=False)
    CookTimeID   = Column(Integer, ForeignKey('CookTimeTags.CookTimeID'), nullable=False)

class meal_dietary_tags(Base):
    __tablename__ = 'meal_dietary_tags'
    MealID     = Column(Integer, ForeignKey('Meals.MealID'), primary_key=True, nullable=False)
    DietaryID  = Column(Integer, ForeignKey('DietaryTags.DietaryID'), primary_key=True, nullable=False)

class meal_macros(Base):
    __tablename__ = 'meal_macros'
    MealID   = Column(Integer, ForeignKey('Meals.MealID'), primary_key=True, nullable=False)
    calories = Column(Float, nullable=True)   # kcal
    protein  = Column(Float, nullable=True)   # g
    fat      = Column(Float, nullable=True)   # g
    carbs    = Column(Float, nullable=True)   # g
    sugar    = Column(Float, nullable=True)   # g
    fiber    = Column(Float, nullable=True)   # g
    sodium   = Column(Float, nullable=True)   # mg

class session_meals(Base):
    __tablename__ = 'session_meals'
    SessionMealID = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    ProfileID     = Column(Integer, ForeignKey('Profiles.ProfileID'), nullable=False, index=True)
    MealID        = Column(Integer, ForeignKey('Meals.MealID'), nullable=False, index=True)
    date          = Column(DateTime, nullable=False)
    servings      = Column(Float, nullable=True)
    notes         = Column(Text, nullable=True)

class session_menu_meals(Base):
    __tablename__ = 'session_menu_meals'
    SessionID = Column(Integer, primary_key=True, autoincrement=True)
    ProfileID = Column(Integer, ForeignKey('Profiles.ProfileID'))
    MenuMealID = Column(Integer, ForeignKey('menu_meals.MenuMealID'))
    date = Column(DateTime)
    meal_type = Column(Text)


class daily_tracker_logs(Base):
    __tablename__ = 'daily_tracker_logs'
    DailyTrackerLogID = Column(Integer, primary_key=True, autoincrement=True)
    ProfileID         = Column(Integer, ForeignKey('Profiles.ProfileID'), nullable=False, index=True)
    log_date          = Column(DateTime, nullable=False, index=True)       # date only, but DateTime for SQLAlchemy compat
    tracker_data      = Column(Text, nullable=False)                       # JSON blob from _serialize_daily_log()


class GroupGoals(Base):
    __tablename__ = 'group_goals'
    goal_id      = Column(Integer, primary_key=True, autoincrement=True)
    created_by   = Column(Integer, ForeignKey('Accounts.UserID'), nullable=False, index=True)
    title        = Column(Text, nullable=False)
    description  = Column(Text, default='')
    target_value = Column(Float, nullable=False)
    unit         = Column(Text, nullable=False)          # kg | lbs | km | miles | sessions | calories | steps | minutes
    created_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)


class GroupGoalMembers(Base):
    __tablename__ = 'group_goal_members'
    __table_args__ = (
        UniqueConstraint('goal_id', 'profile_id', name='uq_group_goal_member'),
    )
    id         = Column(Integer, primary_key=True, autoincrement=True)
    goal_id    = Column(Integer, ForeignKey('group_goals.goal_id'), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey('Accounts.UserID'), nullable=False, index=True)
    progress   = Column(Float, nullable=False, default=0.0)
    joined_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
