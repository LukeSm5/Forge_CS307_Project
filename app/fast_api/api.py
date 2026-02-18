from app.core.db import Accounts
from sqlalchemy.orm import Session

def resetPassword(user, newPassword, session):
    if (not isinstance(user, Accounts)):
        raise TypeError("User must be an instance of Accounts")
    if (newPassword == None):
        raise ValueError("New password cannot be empty")
    if (len(newPassword) > 20):
        raise ValueError("New password cannot exceed 20 characters")
    if (len(newPassword) < 8):
        raise ValueError("New password must be at least 8 characters long")
    user.password = newPassword
    session.commit()
