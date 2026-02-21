from sqlalchemy.orm import Session
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.core.db import Accounts
from app import repos

app = FastAPI()


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


@app.delete("/accounts/{user_id}")
def delete_account(user_id: int, sess: Session):
    try:
        deleted = repos.delete_account_by_id(sess, user_id)
        if deleted:
            sess.commit()
            return # json
        if not deleted:
            raise HTTPException(status_code=404, detail='Account not found')

    except Exception:
        sess.rollback()    # this will undo sess.flush() if we never make it to sess.commit()
        raise
