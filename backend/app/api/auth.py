from fastapi import APIRouter, Depends, Response, Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db import get_db
from app.domain.schemas.auth import SignUpRequest, LoginRequest, UserResponse, TokenResponse, RefreshResponse, MessageResponse
from app.domain.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.domain.models.user import User
from app.config import settings
from app.infra.tracing import start_span

router = APIRouter(prefix="/auth", tags=["auth"])

def set_refresh_cookie(response: Response, token: str):
    # httpOnly, secure in prod, SameSite Lax, path /auth
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=not settings.debug,  # Secure in prod
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/auth",
    )

@router.post("/sign-up", response_model=UserResponse, status_code=201)
async def sign_up(payload: SignUpRequest, session: AsyncSession = Depends(get_db)):
    with start_span("auth.sign_up", attributes={"email": payload.email}):
        service = AuthService(session)
        user = await service.sign_up(payload.name, payload.email, payload.password)
        await session.commit()
        return user

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response, session: AsyncSession = Depends(get_db)):
    with start_span("auth.login", attributes={"email": payload.email}):
        service = AuthService(session)
        user, access_token, raw_refresh, family_id = await service.login(payload.email, payload.password)
        await session.commit()
        set_refresh_cookie(response, raw_refresh)
        return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))

@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: Request, response: Response, session: AsyncSession = Depends(get_db)):
    # Get refresh token from cookie
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    with start_span("auth.refresh"):
        service = AuthService(session)
        try:
            user, new_access, new_raw = await service.refresh(raw_token)
            await session.commit()
            set_refresh_cookie(response, new_raw)
            return RefreshResponse(access_token=new_access)
        except HTTPException as e:
            # On reuse detection, clear cookie
            if "reuse" in e.detail.lower():
                response.delete_cookie(key="refresh_token", path="/auth")
            raise

@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, response: Response, session: AsyncSession = Depends(get_db)):
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        with start_span("auth.logout"):
            service = AuthService(session)
            await service.logout(raw_token)
            await session.commit()

    response.delete_cookie(key="refresh_token", path="/auth")
    return MessageResponse(detail="Logged out")

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    with start_span("auth.me", attributes={"user_id": str(current_user.id)}):
        return current_user
