from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.infra.db import get_db
from app.infra.security import decode_token
from app.domain.models.user import User
from app.infra.rls import set_rls_user
from app.infra.tracing import start_span

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User:
    # Extract token from Authorization header or from ?token query for WS/SSE fallback
    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Check Authorization header manually (for cases where HTTPBearer didn't parse)
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Set RLS GUC
    await set_rls_user(session, user_id)

    # Fetch user
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Store user in request state for tracing
    request.state.user_id = str(user.id)

    return user

async def get_current_user_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return await get_current_user(request, credentials, session)
    except HTTPException:
        return None
