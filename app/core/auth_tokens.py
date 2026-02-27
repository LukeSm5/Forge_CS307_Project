
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

# JSON Object Signing and Encryption 
from jose import jwt, JWTError  


JWT_SECRET = "N0t_SuSPiCiOUs_S3CreT_ME55Ag3"
JWT_ALG = "HS256"

ACCESS_TOKEN_MINUTES = 2    # workout or cooking session length
REFRESH_TOKEN_DAYS = 7


def now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, user_id: int, minutes: int = ACCESS_TOKEN_MINUTES) -> str:
    now = now()
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError as e:
        raise ValueError("Invalid token") from e

    if payload.get("type") != "access":
        raise ValueError("Invalid token type")

    sub = payload.get("sub")
    if sub is None:
        raise ValueError("Missing subject")
    return int(sub)


def generate_refresh_token() -> str:
    # random, URL-safe
    return secrets.token_urlsafe(32)


def hash_refresh_token(refresh_token: str) -> str:
    # store only the hash in DB
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


def refresh_expiry(days: int = REFRESH_TOKEN_DAYS) -> datetime:
    return now() + timedelta(days=days)