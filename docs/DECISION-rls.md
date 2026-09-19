# DECISION — Row-Level Security

## Context
Multi-user from day 1 via Postgres RLS: every tenant table has user_id; non-BYPASSRLS app role with policies keyed on current_setting('app.user_id', true); worker uses separate service role that BYPASSRLSes deliberately.

Options:
- App-level filtering (WHERE user_id = ...) without RLS — easy to forget, not defense-in-depth
- RLS with session variable — defense-in-depth, DB enforces isolation even if app bug
- Use Supabase RLS helpers — not needed, we can write raw SQL

## Decision
- Create two roles in migration 001_initial:
  - app_user: NOBYPASSRLS, LOGIN, password app_password (local dev)
  - service_user: BYPASSRLS, LOGIN, password service_password — documented as worker role that deliberately bypasses RLS
- Every tenant table (users, refresh_tokens, future items, etc) will have user_id and RLS enabled
- Policies use `current_setting('app.user_id', true)::uuid` — true means not error if not set, returns null, so no rows
- App code sets GUC per transaction via `SELECT set_config('app.user_id', :uid, true)` in get_current_user dependency
- Service role is used by scheduler worker (app/scheduler_main.py) which needs to see all users for nag ladder — it has BYPASSRLS, documented

## Why
- Non-negotiable rule from master prompt
- Even if app forgets WHERE user_id, DB returns zero rows
- BYPASSRLS for worker is intentional and documented, not accidental
- Using set_config with is_local=true (third param true) makes it transaction-local via SET LOCAL semantics

## Consequences
- All DB sessions must go through get_current_user or explicitly set RLS
- Tests must test cross-user isolation: set app.user_id to user1, try to read user2 row, expect zero
- In production, roles and passwords should be managed via env, not hardcoded in migration — migration uses DO block with IF NOT EXISTS for idempotency
