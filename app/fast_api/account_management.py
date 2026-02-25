from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
class AccountError(Exception):
    pass

class EmailAlreadyInUse(AccountError):
    pass


class UsernameAlreadyInUse(AccountError):
    pass


class InvalidCredentials(AccountError):
    pass


class InvalidPassword(AccountError):
    pass


class NotFound(AccountError):
    pass

def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_username(username: str) -> str:
    return username.strip()


def validate_username(username: str) -> None:
    if not (6 <= len(username) <= 32):
        raise ValueError("username must be 6-32 characters")
    for ch in username:
        if not (ch.isalnum() or ch == "_"):
            raise ValueError("username must be alphanumeric or underscore only")


def validate_bio(bio: str) -> None:
    if len(bio) > 280:
        raise ValueError("bio must be <= 280 characters")


def validate_new_password(pw: str) -> None:
    if len(pw) < 8:
        raise InvalidPassword("password must be at least 8 characters")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def get_user_by_email(db: Session, User, email: str):
    email_n = normalize_email(email)
    return db.scalar(select(User).where(func.lower(User.email) == email_n))


def get_user_by_username(db: Session, User, username: str):
    # case-insensitive username uniqueness (recommended)
    u = normalize_username(username)
    return db.scalar(select(User).where(func.lower(User.username) == u.lower()))


def get_user_by_id(db: Session, User, user_id: int):
    return db.scalar(select(User).where(User.id == user_id))


@dataclass(frozen=True)
class RegisterInput:
    email: str
    username: str
    password: str
    bio: str = ""


def register_user(db: Session, User, payload: RegisterInput):
    email_n = normalize_email(payload.email)
    username_n = normalize_username(payload.username)
    validate_username(username_n)
    validate_bio(payload.bio)
    validate_new_password(payload.password)

    if get_user_by_email(db, User, email_n):
        raise EmailAlreadyInUse()
    if get_user_by_username(db, User, username_n):
        raise UsernameAlreadyInUse()

    user = User(
        email=email_n,
        username=username_n,
        bio=payload.bio,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Handles race conditions (two requests at once)
        db.rollback()
        # Determine which uniqueness constraint likely hit (simple re-check)
        if get_user_by_email(db, User, email_n):
            raise EmailAlreadyInUse()
        if get_user_by_username(db, User, username_n):
            raise UsernameAlreadyInUse()
        raise
    db.refresh(user)
    return user


def authenticate_user(db: Session, User, *, email: str, password: str):
    user = get_user_by_email(db, User, email)
    if not user:
        raise InvalidCredentials()
    if not verify_password(password, user.password_hash):
        raise InvalidCredentials()
    return user


@dataclass(frozen=True)
class UpdateProfileInput:
    username: Optional[str] = None
    bio: Optional[str] = None


def update_profile(db: Session, User, *, user_id: int, payload: UpdateProfileInput):
    user = get_user_by_id(db, User, user_id)
    if not user:
        raise NotFound()

    if payload.username is not None:
        username_n = normalize_username(payload.username)
        validate_username(username_n)

        if username_n.lower() != user.username.lower():
            existing = get_user_by_username(db, User, username_n)
            if existing and existing.id != user.id:
                raise UsernameAlreadyInUse()
            user.username = username_n

    if payload.bio is not None:
        validate_bio(payload.bio)
        user.bio = payload.bio

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if payload.username and get_user_by_username(db, User, payload.username):
            raise UsernameAlreadyInUse()
        raise
    db.refresh(user)
    return user


def change_password(db: Session, User, *, user_id: int, current_password: str, new_password: str) -> None:
    user = get_user_by_id(db, User, user_id)
    if not user:
        raise NotFound()

    if not verify_password(current_password, user.password_hash):
        raise InvalidCredentials()

    validate_new_password(new_password)
    user.password_hash = hash_password(new_password)

    if hasattr(user, "updated_at"):
        user.updated_at = datetime.utcnow()

    db.add(user)
    db.commit()
