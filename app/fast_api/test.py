from app.fast_api import api
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.db import Accounts
import pytest

DATABASE_URL = "sqlite:///test.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()
user = session.query(Accounts).filter_by(UserID=1).first()

def test_reset_password_simple():
    print("Testing Reset Password")
    user = session.query(Accounts).filter_by(UserID=1).first()
    newPassword = "Password123"
    api.resetPassword(user, newPassword, session)
    assert user.password == newPassword, "Test Failed: test_reset_password_simple"
    print("Test passed: test_reset_password_simple")

def test_reset_password_multiple_times():
    newPassword1 = "Password123"
    newPassword2 = "ThisPassword"
    api.resetPassword(user, newPassword1, session)
    assert user.password == newPassword1, "Test Failed: test_reset_password_multiple_times - first reset"
    api.resetPassword(user, newPassword2, session)
    assert user.password == newPassword2, "Test Failed: test_reset_password_multiple_times - second reset"
    print("Test passed: test_reset_password_multiple_times")

def test_reset_password_invalid_user():
    user = "NotAUser"
    newPassword = "Password123"
    try:
        with pytest.raises(TypeError):
            api.resetPassword(user, newPassword, session)
        print("Test passed: test_reset_password_invalid_user")
    except AssertionError:
        print("Test failed: test_reset_password_invalid_user")
        raise

def test_reset_password_empty_password():
    newPassword = ""
    try:
        with pytest.raises(ValueError):
            api.resetPassword(user, newPassword, session)
        print("Test passed: test_reset_password_empty_password")
    except AssertionError:
        print("Test failed: test_reset_password_empty_password")
        raise

def test_reset_password_short_password():
    newPassword = "Pass"
    try:
        with pytest.raises(ValueError):
            api.resetPassword(user, newPassword, session)
        print("Test passed: test_reset_password_short_password")
    except AssertionError:
        print("Test failed: test_reset_password_short_password")
        raise

def test_reset_password_long_password():
    newPassword = "Superlongpasswordthatshouldnotwork"
    try:        
        with pytest.raises(ValueError):
            api.resetPassword(user, newPassword, session)
        print("Test passed: test_reset_password_long_password")
    except AssertionError:
        print("Test failed: test_reset_password_long_password")
        raise

def test_reset_password_multiple_users():
    user2 = Accounts(username="user2", password="password2", bio="Second test account")
    user3 = Accounts(username="user3", password="password3", bio="Third test account")
    user4 = Accounts(username="user4", password="password4", bio="Fourth test account")
    user5 = Accounts(username="user5", password="password5", bio="Fifth test account")

    session.add(user2)
    session.add(user3)
    session.add(user4)
    session.add(user5)
    session.commit()

    newPassword1 = "NewPassword1"
    newPassword2 = "NewPassword2"
    newPassword3 = "NewPassword3"
    newPassword4 = "NewPassword4"
    newPassword5 = "NewPassword5"

    api.resetPassword(user, newPassword1, session)
    api.resetPassword(user2, newPassword2, session)
    api.resetPassword(user3, newPassword3, session)
    api.resetPassword(user4, newPassword4, session)
    api.resetPassword(user5, newPassword5, session)

    assert user.password == newPassword1, "Test Failed: test_reset_password_multiple_users - user1"
    assert user2.password == newPassword2, "Test Failed: test_reset_password_multiple_users - user2"
    assert user3.password == newPassword3, "Test Failed: test_reset_password_multiple_users - user3"
    assert user4.password == newPassword4, "Test Failed: test_reset_password_multiple_users - user4"
    assert user5.password == newPassword5, "Test Failed: test_reset_password_multiple_users - user5"

    print("Test passed: test_reset_password_multiple_users")
    print("Tests completed.")

test_reset_password_simple()
test_reset_password_multiple_times()
test_reset_password_invalid_user()
test_reset_password_empty_password()
test_reset_password_short_password()
test_reset_password_long_password()
test_reset_password_multiple_users()