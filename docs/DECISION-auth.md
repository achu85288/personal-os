# DECISION — Auth & RLS

## Context
Phase 1 needs multi-user from day 1 with Row-Level Security. Requirements:
- Hand-rolled JWT access (15 min) + rotating refresh in httpOnly cookie
- Argon2 hashing (pwdlib)
- RLS roles: non-BYPASSRLS app role keyed on current_setting('app.user_id'), service role BYPASSRLS for worker
- Reuse detection: replay of old refresh token revokes entire family

Options:
- Use Supabase Auth / Auth0 — violates hand-rolled requirement, adds dependency
- Use fastapi-users — hides RLS logic, not flexible for rotating family
- Hand-roll with pwdlib + PyJWT — matches spec, more control
- For UUID: uuid4 vs uuid7 — uuid7 is time-ordered, better for index locality, spec says uuid7
- For RLS GUC: SET vs SET LOCAL — SET LOCAL is transaction-scoped, safer per-request

## Decision
- Implement uuid7 generator in infra/security.py: 48-bit ms timestamp + 12 bits rand_a + 62 bits rand_b, version 7, variant 10. No external dep.
- Password hashing: pwdlib PasswordHash.recommended() which uses argon2
- Refresh token storage: only SHA256 hash stored, raw token only in cookie. Table has family_id for reuse detection.
- Flow:
  - sign-up: insert user, no token
  - login: create family_id, store hash, set cookie path /auth, httponly, samesite lax, secure in prod
  - refresh: verify hash exists, check revoked, check expiry. If revoked -> reuse attack -> UPDATE all family to revoked. Else rotate: revoke old, create new with same family_id, set new cookie
  - logout: revoke family
- RLS:
  - Migration creates roles app_user NOBYPASSRLS and service_user BYPASSRLS with passwords for local dev
  - Enable RLS on users and refresh_tokens
  - Policy users_self: id = current_setting('app.user_id')::uuid
  - Policy users_insert: allow insert with true (needed for sign-up when no user_id set yet) — alternative would be to use service role for sign-up, but we allow insert for app_user to keep worker separate
  - Policy refresh_tokens_user: user_id = current_setting
  - Per-request: in get_current_user dependency, after decoding JWT, execute `SELECT set_config('app.user_id', :uid, true)` via SET LOCAL equivalent
- JWT: PyJWT, HS256, secret from env, payload sub=user_id, email, exp, iat, type
- Tracing: start_span context manager used in auth routes

## Why
- Matches non-negotiable architecture rules: RLS from day 1, hand-rolled auth, argon2, rotating refresh with reuse detection
- uuid7 improves DB index performance vs uuid4 random
- SET LOCAL via set_config(..., true) ensures GUC doesn't leak across transactions in pooled connections
- Storing only hash of refresh token prevents token theft from DB dump
- Family revocation on reuse is standard OAuth2 best practice

## Consequences
- Need to run migration that creates roles — in prod, roles should be managed outside app, but for local dev we create them in migration
- Frontend must send refresh cookie with credentials: include, and path /auth
- Tests need real Postgres — we use testcontainers with pgvector/pgvector:pg17, fallback to local DB if docker unavailable
- Python version: spec says 3.13+, sandbox has 3.11, we use 3.11 but code compatible with 3.13 (documented deviation)
