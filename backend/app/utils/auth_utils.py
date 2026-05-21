from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import bcrypt
from fastapi import HTTPException, status
from app.config import settings

def hash_password(plain: str) -> str:
    """Hashes a password using bcrypt, truncating to 72 bytes."""
    return bcrypt.hashpw(plain[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verifies a plain password against a hash, truncating to 72 bytes."""
    return bcrypt.checkpw(plain[:72].encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    """Creates a JWT token with a 7-day expiry (HS256)."""
    expires_delta = timedelta(days=7)
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> str:
    """Verifies a JWT token and returns the user_id or raises 401."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
