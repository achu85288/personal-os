"""
RLS helper: set app.user_id GUC per request
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def set_rls_user(session: AsyncSession, user_id: str):
    # SET LOCAL is transaction-scoped, perfect for per-request
    # Use text() with bound param to avoid SQL injection
    await session.execute(text("SELECT set_config('app.user_id', :uid, true)"), {"uid": user_id})

async def clear_rls_user(session: AsyncSession):
    await session.execute(text("SELECT set_config('app.user_id', '', true)"))
