import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException
from app.domain.models.user import User
from app.domain.models.refresh_token import RefreshToken
from app.infra.security import hash_password, verify_password, create_access_token, create_refresh_token, hash_token, uuid7
from app.config import settings

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def sign_up(self, name: str, email: str, password: str) -> User:
        # Check existing
        existing = await self.session.execute(select(User).where(User.email == email.lower()))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            id=uuid7(),
            email=email.lower(),
            name=name,
            password_hash=hash_password(password),
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def login(self, email: str, password: str) -> tuple[User, str, str, uuid.UUID]:
        # Returns (user, access_token, raw_refresh_token, family_id)
        result = await self.session.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Create refresh token family
        family_id = uuid7()
        raw_token, token_hash = create_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

        rt = RefreshToken(
            id=uuid7(),
            user_id=user.id,
            family_id=family_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
        )
        self.session.add(rt)
        await self.session.flush()

        access_token = create_access_token(str(user.id), user.email)
        return user, access_token, raw_token, family_id

    async def refresh(self, raw_refresh_token: str) -> tuple[User, str, str]:
        token_hash = hash_token(raw_refresh_token)
        result = await self.session.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        rt = result.scalar_one_or_none()

        if not rt:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        if rt.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh token expired")

        if rt.revoked:
            # Reuse detection: token already used, revoke entire family
            await self.session.execute(
                update(RefreshToken).where(RefreshToken.family_id == rt.family_id).values(revoked=True)
            )
            await self.session.flush()
            raise HTTPException(status_code=401, detail="Refresh token reuse detected, family revoked")

        # Load user
        user_result = await self.session.execute(select(User).where(User.id == rt.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Rotate: revoke old, create new
        rt.revoked = True
        new_raw, new_hash = create_refresh_token()
        new_rt = RefreshToken(
            id=uuid7(),
            user_id=user.id,
            family_id=rt.family_id,
            token_hash=new_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
            revoked=False,
        )
        rt.replaced_by = new_rt.id
        self.session.add(new_rt)
        await self.session.flush()

        new_access = create_access_token(str(user.id), user.email)
        return user, new_access, new_raw

    async def logout(self, raw_refresh_token: str):
        token_hash = hash_token(raw_refresh_token)
        result = await self.session.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        rt = result.scalar_one_or_none()
        if rt:
            # Revoke entire family on logout (safer)
            await self.session.execute(
                update(RefreshToken).where(RefreshToken.family_id == rt.family_id).values(revoked=True)
            )
            await self.session.flush()
