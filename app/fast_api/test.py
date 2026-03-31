
from app.fast_api import api
from app.fast_api.api import LogMenuMealRequest, SessionMenuMealOut
from app.core.db import Accounts
import pytest
from pydantic import BaseModel
from app.core.session import engine, Base, get_db

Base.metadata.create_all(bind=engine)
db = next(get_db())

user = db.query(Accounts).filter(Accounts.UserID==1).first()
'''
DATABASE_URL = "sqlite:///test.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()
user = session.query(Accounts).filter_by(UserID=1).first()
'''


def test_reset_password_simple():
    print("Testing Reset Password")
    user = db.query(Accounts).filter_by(UserID=1).first()
    newPassword = "Password123"
    api.resetPassword(user, newPassword, db)
    assert user.password == newPassword, "Test Failed: test_reset_password_simple"
    print("Test passed: test_reset_password_simple")

def test_reset_password_multiple_times():
    newPassword1 = "Password123"
    newPassword2 = "ThisPassword"
    api.resetPassword(user, newPassword1, db)
    assert user.password == newPassword1, "Test Failed: test_reset_password_multiple_times - first reset"
    api.resetPassword(user, newPassword2, db)
    assert user.password == newPassword2, "Test Failed: test_reset_password_multiple_times - second reset"
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

def test_reset_password_empty_password():
    newPassword = ""
    try:
        with pytest.raises(ValueError):
            api.resetPassword(user, newPassword, db)
        print("Test passed: test_reset_password_empty_password")
    except AssertionError:
        print("Test failed: test_reset_password_empty_password")
        raise

def test_reset_password_short_password():
    newPassword = "Pass"
    try:
        with pytest.raises(ValueError):
            api.resetPassword(user, newPassword, db)
        print("Test passed: test_reset_password_short_password")
    except AssertionError:
        print("Test failed: test_reset_password_short_password")
        raise

def test_reset_password_long_password():
    newPassword = "Superlongpasswordthatshouldnotwork"
    try:        
        with pytest.raises(ValueError):
            api.resetPassword(user, newPassword, db)
        print("Test passed: test_reset_password_long_password")
    except AssertionError:
        print("Test failed: test_reset_password_long_password")
        raise

def test_reset_password_multiple_users():
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

    api.resetPassword(user, newPassword1, db)
    api.resetPassword(user2, newPassword2, db)
    api.resetPassword(user3, newPassword3, db)
    api.resetPassword(user4, newPassword4, db)
    api.resetPassword(user5, newPassword5, db)

    assert user.password == newPassword1, "Test Failed: test_reset_password_multiple_users - user1"
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


def test_log_session_menu_meal():
    menu_meal_id = 618
    meal_type = 'lunch'
    payload = LogMenuMealRequest(menu_meal_id=menu_meal_id, meal_type=meal_type)

    try:
        response: SessionMenuMealOut = api.log_session_menu_meal(payload, user, db)
        session_id = response.session_id

        print("\nSession menu meal added successfully\n")
        for field, value in response.model_dump().items():
            print(f"{field}: {value}")

        delete = api.delete_session_menu_meal(session_id, user, db)
        print("\n" + delete['message'])
        
    except: 
        Exception




    
    




if __name__ == '__main__':
    #test_log_session_menu_meal()

    user = db.query(Accounts).filter(Accounts.email == "roan@test.com").first()
    print(user.email)
    print(user.password_hash)


    # test_reset_password_simple()
    # test_reset_password_multiple_times()
    # test_reset_password_invalid_user()
    # test_reset_password_empty_password()
    # test_reset_password_short_password()
    # test_reset_password_long_password()
    # test_reset_password_multiple_users()