import os
import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.infra.db import Base

# Try to get DB URL from env, or use testcontainers
DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg://pos:pos@localhost:5432/pos_test")

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def engine():
    # Try testcontainers if no local DB
    try:
        from testcontainers.postgres import PostgresContainer
        import asyncpg

        # This will fail if docker not available, then fallback to DATABASE_URL
        postgres = PostgresContainer("pgvector/pgvector:pg17")
        postgres.start()

        # Get connection URL and convert to asyncpg
        url = postgres.get_connection_url().replace("psycopg2", "asyncpg").replace("postgresql+psycopg2", "postgresql+asyncpg")
        # Ensure asyncpg driver
        if "postgresql://" in url and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://")

        eng = create_async_engine(url, echo=False)
        # Create extensions
        async with eng.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
            await conn.run_sync(Base.metadata.create_all)

        yield eng

        await eng.dispose()
        postgres.stop()
        return
    except Exception as e:
        print(f"Testcontainers failed ({e}), trying local DB: {DATABASE_URL}")

    # Fallback to local DB
    try:
        eng = create_async_engine(DATABASE_URL, echo=False)
        async with eng.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        yield eng
        await eng.dispose()
    except Exception as e:
        pytest.skip(f"No Postgres available for tests: {e}")

@pytest.fixture
async def session(engine):
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as sess:
        yield sess
        await sess.rollback()

@pytest.fixture
async def client(engine):
    from fastapi.testclient import TestClient
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.infra.db import get_db

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as sess:
            yield sess
            await sess.commit()

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
