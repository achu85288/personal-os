import pytest
from sqlalchemy import text, select
from app.domain.models.user import User
from app.domain.models.refresh_token import RefreshToken
from app.infra.security import hash_password, verify_password, uuid7
from app.infra.rls import set_rls_user

@pytest.mark.asyncio
async def test_argon2_roundtrip():
    pw = "super-secret-123"
    h = hash_password(pw)
    assert verify_password(pw, h)
    assert not verify_password("wrong", h)

@pytest.mark.asyncio
async def test_signup_login_flow(client):
    # Sign up
    resp = await client.post("/auth/sign-up", json={"name": "Test User", "email": "test@example.com", "password": "password123"})
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert "password_hash" not in data
    user_id = data["id"]

    # Login
    resp = await client.post("/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert resp.status_code == 200, resp.text
    login_data = resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["id"] == user_id
    # Check refresh cookie set
    assert "refresh_token" in resp.cookies

    access_token = login_data["access_token"]
    refresh_cookie = resp.cookies["refresh_token"]

    # Me endpoint
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"

    # Refresh
    resp = await client.post("/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert resp.status_code == 200, resp.text
    new_access = resp.json()["access_token"]
    assert new_access != access_token
    new_refresh = resp.cookies["refresh_token"]
    assert new_refresh != refresh_cookie

    # Old refresh token should be revoked (reuse detection)
    resp = await client.post("/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert resp.status_code == 401
    assert "reuse" in resp.json()["detail"].lower()

    # New refresh token should also be revoked after reuse detection (family revoked)
    resp = await client.post("/auth/refresh", cookies={"refresh_token": new_refresh})
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_rls_cross_user(session, engine):
    # Create two users directly
    from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as s1:
        user1 = User(id=uuid7(), email="user1@example.com", name="User1", password_hash=hash_password("pass12345"))
        user2 = User(id=uuid7(), email="user2@example.com", name="User2", password_hash=hash_password("pass12345"))
        s1.add_all([user1, user2])
        await s1.commit()

        # Set RLS to user1
        await s1.execute(text("SET LOCAL app.user_id = :uid"), {"uid": str(user1.id)})
        # Try to read users - should only see user1 via RLS policy
        # Note: our policy for users only allows id = app.user_id, so count should be 1
        result = await s1.execute(select(User))
        rows = result.scalars().all()
        # With RLS, user1 should see only 1 row (themselves) if RLS enforced
        # If RLS not enforced (e.g., service role), it would see 2
        # We check that cross-user read returns zero for other user's id
        result2 = await s1.execute(select(User).where(User.id == user2.id))
        assert result2.scalar_one_or_none() is None, "RLS should prevent cross-user read"

        await s1.rollback()

@pytest.mark.asyncio
async def test_signup_duplicate_email(client):
    resp = await client.post("/auth/sign-up", json={"name": "A", "email": "dup@example.com", "password": "password123"})
    assert resp.status_code == 201
    resp = await client.post("/auth/sign-up", json={"name": "B", "email": "dup@example.com", "password": "password123"})
    assert resp.status_code == 400
