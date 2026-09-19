import uuid
import time
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.config import settings

password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(password: str, hash: str) -> bool:
    return password_hasher.verify(password, hash)

# UUIDv7 implementation (time-ordered)
# 48-bit timestamp ms + 74 random bits, version 7
def uuid7() -> uuid.UUID:
    # 48-bit unix ms
    ts_ms = int(time.time() * 1000)
    # 74 random bits
    rand_a = secrets.randbits(12)  # 12 bits for rand_a
    rand_b = secrets.randbits(62)  # 62 bits for rand_b
    # Build 128-bit int: 48 ts | 4 ver | 12 rand_a | 2 var | 62 rand_b
    # Layout per draft: 48 ts, 4 ver=7, 12 rand_a, 2 var=10, 62 rand_b
    ts_part = ts_ms & ((1 << 48) - 1)
    ver = 7
    var = 0b10
    # 128-bit
    int128 = (ts_part << 80) | (ver << 76) | (rand_a << 64) | (var << 62) | rand_b
    return uuid.UUID(int=int128)

def uuid7_str() -> str:
    return str(uuid7())

def create_access_token(user_id: str, email: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode = {"sub": user_id, "email": email, "exp": expire, "iat": datetime.now(timezone.utc), "type": "access"}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_alg)

def create_refresh_token() -> tuple[str, str]:
    # Returns (raw_token, token_hash) — we store hash only
    raw = secrets.token_urlsafe(64)
    h = hashlib.sha256(raw.encode()).hexdigest()
    return raw, h

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")
