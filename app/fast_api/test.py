
from app.fast_api import api
from app.core.db import Accounts, Exercises, Machines, Workouts, menu_meals, Profiles, session_menu_meals
import pytest
from app.core.session import engine, Base, SessionLocal
from datetime import date

from app.fast_api.api import LogMenuMealRequest, CreateAccountRequest, CreateSessionRequest, CreateProfileRequest, LogMenuMealRequest, TailorExerciseRequest, RecalibrateCaloriesRequest
from app.fast_api.api import SessionMenuMealOut, SessionExerciseIn


def seed_test_user(db):
    """
    seed a dummy test profile. 
    run this once
    """
    try:

        # account and profile

        email = "dev@test.com"
        username = "dev_test_user"
        password = "dev_test_user"

        existing = db.query(Accounts).filter((Accounts.email == email) | (Accounts.username == username)).first()
        if existing:
            print(f"Dev user already exists: UserID={existing.UserID}, username={existing.username}")
            return

        account_request = CreateAccountRequest(email=email, username=username, password=password, bio="Developer test account")
        account_response = api.create_account(account_request, db)
        print('test account created') if (account_response.access_token or account_response.refresh_token) else print('error')

        me = db.query(Accounts).filter(Accounts.username == username).first()
        profile_request = CreateProfileRequest(
            age=22, gender='Male', height_in=74, weight=170, 
            health_goals='build muscle', health_status='3 years experience', calorie_goal=2500.0, accepted_terms=True)
        profile_response = api.create_profile(me.UserID, profile_request, db)
        print('test profile created') if (profile_response['ok'] or profile_response['calorie_goal']) else print('error')


        # two workouts

        back = db.query(Workouts).filter(Workouts.name  == 'back').first()
        bicep_curl = db.query(Exercises).filter(Exercises.name == 'bicep curl').first()
        dumbbell = db.query(Machines).filter(Machines.name  == 'dumbbell').first()

        exercise_session1_request = SessionExerciseIn(
            exercise_id=bicep_curl.ExerciseID, 
            machine_id=dumbbell.MachineID, 
            sets=4, reps=8, weight=30)
        workout_session1_request = CreateSessionRequest(
            workout_id=back.WorkoutID, 
            duration=15, date='2026-04-01', split_name='pull day', 
            exercises=[exercise_session1_request])
        
        workout_session1_response = api.create_workout_session(workout_session1_request, me, db)
        print(workout_session1_response.session_id) if workout_session1_response.split_name else print('error')
        print(workout_session1_response.split_name) if workout_session1_response.workout_name else print('error')
        print(workout_session1_response.date) if workout_session1_response.date else print('error')

        chest = db.query(Workouts).filter(Workouts.name  == 'chest').first()
        bench_press = db.query(Exercises).filter(Exercises.name == 'bench press').first()
        barbell = db.query(Machines).filter(Machines.name  == 'barbell').first()
        
        exercise_session2_request = SessionExerciseIn(
            exercise_id=bench_press.ExerciseID,
            machine_id=barbell.MachineID,
            sets=4, reps=10, weight=125
        )
        workout_session2_request = CreateSessionRequest(
            workout_id=chest.WorkoutID,
            duration=15,
            date='2026-04-01',
            split_name='push day',
            exercises=[exercise_session2_request]
        )

        workout_session2_response = api.create_workout_session(workout_session2_request, me, db)
        print(workout_session2_response.split_name) if workout_session2_response.split_name else print('error')
        print(workout_session2_response.workout_name) if workout_session2_response.workout_name else print('error')
        print(workout_session2_response.date) if workout_session2_response.date else print('error')


        # two menu meals

        chix_sandwich = db.query(menu_meals).filter((menu_meals.restaurant == 'Chick-fil-A') & (menu_meals.product == 'Chicken Sandwich')).first()
        menu_meal1_session_req = LogMenuMealRequest(menu_meal_id=chix_sandwich.MenuMealID, meal_type='lunch')
        menu_meal1_session_resp = api.log_session_menu_meal(menu_meal1_session_req, me, db)
        print(menu_meal1_session_resp.restaurant) if menu_meal1_session_resp.restaurant else print('error')
        print(menu_meal1_session_resp.product) if menu_meal1_session_resp.product else print('error')
        print(menu_meal1_session_resp.meal_type) if menu_meal1_session_resp.meal_type else print('error')
        print(menu_meal1_session_resp.date) if menu_meal1_session_resp.date else print('error')

        burger = db.query(menu_meals).filter((menu_meals.restaurant == 'Shake Shack') & (menu_meals.product == 'Double ShackBurger')).first()
        menu_meal2_session_req = LogMenuMealRequest(menu_meal_id=burger.MenuMealID, meal_type='dinner')
        menu_meal2_session_resp = api.log_session_menu_meal(menu_meal2_session_req, me, db)
        print(menu_meal2_session_resp.restaurant) if menu_meal2_session_resp.restaurant else print('error')
        print(menu_meal2_session_resp.product) if menu_meal2_session_resp.product else print('error')
        print(menu_meal2_session_resp.meal_type) if menu_meal2_session_resp.meal_type else print('error')
        print(menu_meal2_session_resp.date) if menu_meal2_session_resp.date else print('error')

    except Exception as e: 
        print(f"Seed failed: {e}")
        raise


def test_reset_password_simple(me):
    print("Testing Reset Password")
    newPassword = "Password123"
    api.resetPassword(me, newPassword, db)
    assert me.password == newPassword, "Test Failed: test_reset_password_simple"
    print("Test passed: test_reset_password_simple")

def test_reset_password_multiple_times(me):
    newPassword1 = "Password123"
    newPassword2 = "ThisPassword"
    api.resetPassword(me, newPassword1, db)
    assert me.password == newPassword1, "Test Failed: test_reset_password_multiple_times - first reset"
    api.resetPassword(me, newPassword2, db)
    assert me.password == newPassword2, "Test Failed: test_reset_password_multiple_times - second reset"
    print("Test passed: test_reset_password_multiple_times")

def test_reset_password_invalid_user():
    user = "NotAUser"
    newPassword = "Password123"
    try:
        with pytest.raises(TypeError):
            api.resetPassword(user, newPassword, db)
        print("Test passed: test_reset_password_invalid_user")
    except AssertionError:
        print("Test failed: test_reset_password_invalid_user")
        raise

def test_reset_password_empty_password(me):
    newPassword = ""
    try:
        with pytest.raises(ValueError):
            api.resetPassword(me, newPassword, db)
        print("Test passed: test_reset_password_empty_password")
    except AssertionError:
        print("Test failed: test_reset_password_empty_password")
        raise

def test_reset_password_short_password(me):
    newPassword = "Pass"
    try:
        with pytest.raises(ValueError):
            api.resetPassword(me, newPassword, db)
        print("Test passed: test_reset_password_short_password")
    except AssertionError:
        print("Test failed: test_reset_password_short_password")
        raise

def test_reset_password_long_password(me):
    newPassword = "Superlongpasswordthatshouldnotwork"
    try:        
        with pytest.raises(ValueError):
            api.resetPassword(me, newPassword, db)
        print("Test passed: test_reset_password_long_password")
    except AssertionError:
        print("Test failed: test_reset_password_long_password")
        raise

def test_reset_password_multiple_users(me):
    user2 = Accounts(username="user2", password="password2", bio="Second test account")
    user3 = Accounts(username="user3", password="password3", bio="Third test account")
    user4 = Accounts(username="user4", password="password4", bio="Fourth test account")
    user5 = Accounts(username="user5", password="password5", bio="Fifth test account")

    db.add(user2)
    db.add(user3)
    db.add(user4)
    db.add(user5)
    db.commit()

    newPassword1 = "NewPassword1"
    newPassword2 = "NewPassword2"
    newPassword3 = "NewPassword3"
    newPassword4 = "NewPassword4"
    newPassword5 = "NewPassword5"

    api.resetPassword(me, newPassword1, db)
    api.resetPassword(user2, newPassword2, db)
    api.resetPassword(user3, newPassword3, db)
    api.resetPassword(user4, newPassword4, db)
    api.resetPassword(user5, newPassword5, db)

    assert me.password == newPassword1, "Test Failed: test_reset_password_multiple_users - user1"
    assert user2.password == newPassword2, "Test Failed: test_reset_password_multiple_users - user2"
    assert user3.password == newPassword3, "Test Failed: test_reset_password_multiple_users - user3"
    assert user4.password == newPassword4, "Test Failed: test_reset_password_multiple_users - user4"
    assert user5.password == newPassword5, "Test Failed: test_reset_password_multiple_users - user5"

    print("Test passed: test_reset_password_multiple_users")
    print("Tests completed.")


def test_delete_fake_account():
    user_id = -1
    action = api.delete_account(db, user_id)
    if action:
        print('Fail: json recieved from server, some action happened that shouldnt have')
    elif not action:
        print('Pass: no json from server, no action, no deletion')


# def test_delete_real_account():
    # create a new account
    # delete it right after
    # need someone to implement create account logic first


def test_log_session_menu_meal(me):
    menu_meal_id = 618
    meal_type = 'lunch'
    payload = LogMenuMealRequest(menu_meal_id=menu_meal_id, meal_type=meal_type)

    try:
        response: SessionMenuMealOut = api.log_session_menu_meal(payload, me, db)
        session_id = response.session_id

        print("\nSession menu meal added successfully\n")
        for field, value in response.model_dump().items():
            print(f"{field}: {value}")

        delete = api.delete_session_menu_meal(session_id, me, db)
        print("\n" + delete['message'])
        
    except: 
        Exception


def test_userstory_30(me, db):
    """
    tailor an exercise with weight, reps, sets\n
    """
    payload = TailorExerciseRequest(split_name='pull day', date='2026-04-01', workout_name='bicep', exercise_name='bicep_curl', machine_name='dumbbell')
    response = api.tailor_exercise(payload, me, db)
    if response:
        print(f"""
            for the current session\n
            {payload.split_name} {payload.date}, {payload.workout_name} workout, {payload.exercise_name} exercise, {payload.machine_name}\n
            recommendations: {response.weight} lbs, {response.sets} sets x {response.reps} reps
            """)
    

def test_userstory_27(me, db):
    """
    recalibrate calorie goals based on workout & diet history
    """
    goal = db.query(Profiles).filter(Profiles.ProfileID == me.UserID).first().calorie_goal
    print(f"current calorie goal: {goal}")
    meals = db.query(session_menu_meals).filter((session_menu_meals.ProfileID == me.UserID) & (session_menu_meals.date == '2026-04-01')).all()

    consumed = 0
    for meal in meals:
        cal = db.query(menu_meals).filter(menu_meals.MenuMealID == meal.MenuMealID).first().energy_kcal
        consumed += float(cal)

    remaining = goal - consumed

    payload = RecalibrateCaloriesRequest(current_calorie_goal=goal, consumed_calories=consumed, remaining_calories=remaining)
    response = api.recalibrate_calories(payload, me, db)
    if response:
        print(f"new calorie goal: {response.calorie_goal}")


if __name__ == '__main__':
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # run this once seed_test_user(db)
        me = db.query(Accounts).filter(Accounts.username == 'dev_test_user').first()
        test_userstory_27(me, db)

        # test_reset_password_simple()
        # test_reset_password_multiple_times()
        # test_reset_password_invalid_user()
        # test_reset_password_empty_password()
        # test_reset_password_short_password()
        # test_reset_password_long_password()
        # test_reset_password_multiple_users()
    finally:
        db.close()



  