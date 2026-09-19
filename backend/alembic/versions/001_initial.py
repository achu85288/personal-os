"""initial: users, refresh_tokens, extensions, RLS roles

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-18

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", postgresql.CITEXT, unique=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Refresh tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False, unique=True),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("replaced_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)

    # RLS roles - documented: app role with NOBYPASSRLS, service role with BYPASSRLS
    # These are created as database roles, not just app-level
    # For local dev, we create them; in prod, they should be managed separately
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
            CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password' NOBYPASSRLS;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_user') THEN
            CREATE ROLE service_user WITH LOGIN PASSWORD 'service_password' BYPASSRLS;
        END IF;
    END
    $$;
    """)

    # Grant usage
    op.execute("GRANT USAGE ON SCHEMA public TO app_user, service_user")
    op.execute("GRANT ALL ON ALL TABLES IN SCHEMA public TO service_user")
    op.execute("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_user")
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON users, refresh_tokens TO app_user")
    op.execute("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user")

    # Enable RLS on users (example - users can only see own row via app_user)
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    op.execute("""
    CREATE POLICY users_self ON users
        FOR ALL
        TO app_user
        USING (id = current_setting('app.user_id', true)::uuid)
        WITH CHECK (id = current_setting('app.user_id', true)::uuid)
    """)
    # Allow service_user to bypass RLS (it has BYPASSRLS)
    # Also allow app_user to insert during sign-up (when no user_id set) - need separate policy
    op.execute("""
    CREATE POLICY users_insert ON users
        FOR INSERT
        TO app_user
        WITH CHECK (true)
    """)

    op.execute("ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY")
    op.execute("""
    CREATE POLICY refresh_tokens_user ON refresh_tokens
        FOR ALL
        TO app_user
        USING (user_id = current_setting('app.user_id', true)::uuid)
        WITH CHECK (user_id = current_setting('app.user_id', true)::uuid)
    """)

def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS refresh_tokens_user ON refresh_tokens")
    op.execute("DROP POLICY IF EXISTS users_insert ON users")
    op.execute("DROP POLICY IF EXISTS users_self ON users")
    op.execute("ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    # Note: we don't drop extensions or roles in downgrade for safety
