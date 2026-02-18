from app.fast_api import api
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.db import Accounts

DATABASE_URL = "sqlite:///test.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def test_reset_password_simple():
    user = session.query(Accounts).filter_by(UserID=1).first()
    currentPassword = user.password
    newPassword = "Password123"
    api.resetPassword(user, newPassword, session)
    assert user.password == newPassword, "Password reset failed"
    print("Test passed: Password reset successfully.")

test_reset_password_simple()