# Personal OS

One chat box where you type anything (task, grocery, link, note, expense) and an LLM classifies it into structured items. The product is not the chat — the product is the **notification**: a nag engine keeps reminding you (email + web push) until you mark the item done.

Calm, premium, private. White/indigo, not a colorful toy.

## Stack (fixed)

- Backend: Python 3.13+, FastAPI async, SQLAlchemy 2.0 + asyncpg, Alembic, Postgres 17 + pgvector
- LLM: Groq (OpenAI-compatible), llama-3.3-70b for chat, smaller for classification
- Auth: hand-rolled JWT (15 min) + rotating refresh httpOnly cookie, argon2 (pwdlib), PyJWT
- Frontend: Next.js App Router TS, Tailwind 4 (no config file), PWA with share_target + web push actions
- Jobs: Postgres `FOR UPDATE SKIP LOCKED`, no Redis
- Scheduler: `python -m app.scheduler_main` separate worker
- Push: VAPID keys + pywebpush, sw.js handles Done/Snooze/Drop

## Architecture rules

- Layers: api → domain → infra (lower never imports upper)
- Multi-user via RLS: every tenant table has user_id, app role NOBYPASSRLS with policies on current_setting('app.user_id'), service role BYPASSRLS for worker
- MeteredProvider wraps LLM usage + daily budget 429
- Hand-written OTLP tracer JSONL, no OTel SDK
- Tests: pytest against REAL Postgres, fakes only for LLM/embedder
- Pydantic v2 extra="forbid", RFC errors, mutating endpoints return saved object

## Quickstart

### 1. Postgres (needs Docker)

```bash
docker compose up -d postgres
# or: docker compose up postgres
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cp ../.env.example ../.env  # edit JWT_SECRET, etc
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# health: http://localhost:8000/health
# docs: http://localhost:8000/docs
```

Run tests (needs real Postgres):
```bash
pytest -v
# 1 passed, 3 skipped if no DB — integration tests need docker
```

### 3. Frontend (PWA)

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev # http://localhost:3000
```

PWA: manifest.json + sw.js + share_target. Icons in public/icons/. Install prompt works when served over https or localhost.

Theme: change colors in one file `frontend/app/globals.css` :root tokens — whole app updates.

Auth: access token in localStorage when available, also carried via URL fragment /#t=<token> for iframe preview that blocks storage. apiFetch attaches Bearer and retries once on 401 via /auth/refresh.

### 4. Verify Phase 1

- Backend: `uv sync && alembic upgrade head && uv run pytest` (or pip version)
- Frontend: `npx tsc --noEmit` + manual login on localhost:3000
- Sign-up → login → refresh → rotate → reuse-revoked flow
- RLS cross-user read returns zero rows

## Docs

- `docs/BUILD-PROMPT.md` — full phase prompts 0-9 + extras
- `docs/personal-os-v2.html` — v2 design prototype (mobile-first)
- `docs/DECISION-*.md` — ADRs
- `docs/LEARNED.md` — bug log

## Phases

- [x] Phase 1: repo, DB, auth (users, refresh_tokens, RLS, argon2, JWT, tracing)
- [ ] Phase 2: items CRUD
- [ ] Phase 3: capture loop chat → LLM classify
- [ ] Phase 4: nag engine (heart)
- [ ] Phase 5: agent tools + SSE
- [ ] Phase 6: search + embeddings
- [ ] Phase 7: jobs, link enrichment, MCP
- [ ] Phase 8: budget + email ingest
- [ ] Phase 9: ops metrics, dashboard, watchdog
