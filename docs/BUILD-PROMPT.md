# Personal OS — Build-From-Scratch Prompt Pack

How to use this file:

1. Paste **Prompt 0 (Master)** into the AI first, in a fresh chat. It sets the rules and the whole architecture so later prompts stay consistent.
2. Then work **one phase at a time** (Prompts 1–9). Don't paste them all at once — the AI builds better code when each phase is small enough to test before moving on.
3. When you want new features, paste any **Extra** prompt from the last section. Each one is written to slot into the existing architecture without breaking it.

Best results: use a coding-capable AI + a repo-aware tool (Claude Code, Cursor, Codex, etc.) so it can run the tests itself. In a plain chat, ask it to output complete files with paths.

---

## Prompt 0 — Master (paste this first, always)

```
You are my pair-programmer building a production-quality personal app from scratch.
We build in phases; after each phase you must leave the code runnable and tested.

PROJECT: "Personal OS" — one chat box where I type anything (a task, grocery
item, link, note, expense) and an LLM classifies it into structured items in a
database. The product is not the chat — the product is the NOTIFICATION: a nag
engine keeps reminding me (email + web push) until I mark the item done.

STACK (fixed, do not substitute):
- Backend: Python 3.13+, FastAPI (async), SQLAlchemy 2.0 + asyncpg,
  Alembic migrations, Postgres 17 with pgvector extension.
- LLM: Groq (OpenAI-compatible client), model llama-3.3-70b for chat,
  a smaller model for classification.
- Auth: hand-rolled JWT access tokens + rotating refresh tokens in an
  httpOnly cookie, argon2 password hashing (pwdlib), PyJWT.
- Frontend: Next.js (App Router, TypeScript), Tailwind. Light theme,
  white/indigo. Tabs: Now | Library | Chat. Slide-over item editor.
- Jobs/queue: Postgres-backed only — `FOR UPDATE SKIP LOCKED`. No Redis.
- Scheduler: separate worker process (`python -m app.scheduler_main`) that
  runs the nag ladder, budget checks, job processing and watchdog alerts.
- Push: Web Push with hand-generated VAPID keys (pywebpush), action buttons
  Done / Snooze / Drop handled by a tiny public service worker (sw.js).

ARCHITECTURE RULES (non-negotiable):
- Layers: api → domain → infra. A lower layer never imports an upper one.
- Multi-user from day 1 via Postgres ROW-LEVEL SECURITY: every tenant table
  has user_id; a non-BYOPASSRLS app role with policies keyed on
  current_setting('app.user_id', true); the worker uses a separate service
  role that BYPASSRLSes deliberately (documented).
- All money/LLM usage flows through a MeteredProvider wrapper that records
  usage rows and enforces a per-user daily budget (429 + alert when exceeded).
- Tracing: hand-written OTLP-shaped tracer (spans, trace ids, W3C
  traceparent propagation), exported as JSONL. No OTel SDK.
- Tests: pytest against REAL Postgres (testcontainers or local db). Fakes
  allowed only for the LLM and embedder — never for the DB. Philosophy:
  "fake LLMs, real DB". Every phase ships with its tests.
- API schemas are Pydantic v2 with model_config = ConfigDict(extra="forbid").
- Errors: RFC-style {"detail": ...}; never leak stack traces in production.
- Every mutating endpoint returns the saved object; frontend refetches by
  bumping a version counter (no optimistic-cache libraries).
- Keep a DECISION-<topic>.md (ADR style: context, options, decision, why)
  for every non-obvious choice, and a LEARNED.md running log of bugs hit and
  what fixed them.

UI CONSTRAINTS:
- App is often embedded in a preview iframe that may block third-party
  cookies AND localStorage. Auth therefore: access token in localStorage when
  available; on login also carry the token to the app via URL fragment
  (/#t=<token>) which is consumed on boot and stripped when storage works —
  so reloads survive with zero cookies and zero storage.
- All user-visible strings in English.

OUTPUT RULES:
- Complete files with their paths. No pseudo-code, no "...".
- After writing code, list exactly what to run to verify (commands + expected).
- If you must deviate from this prompt, say so explicitly with a reason first.
```

---

## Prompt 1 — Foundation: repo, DB, auth

```
Phase 1 of the Personal OS build (I already gave you the master prompt; follow it).

Deliver a fresh repo skeleton: backend/ (FastAPI app, layered dirs api/
domain/ infra/, pyproject with uv), frontend/ (Next.js app-router TS +
Tailwind), docker-compose.yml (postgres:17 with pgvector), .env.example.

Build now:
1. User model + Alembic initial migration: users(id uuid pk default uuid7,
   email citext unique, name, password_hash, created_at).
2. Auth: POST /auth/sign-up {name,email,password} → user row (no token in
   response — the client logs in afterwards); POST /auth/login →
   {access_token} (JWT, 15 min) + httpOnly refresh cookie (rotating,
   reuse-detection revokes the family on replay); POST /auth/refresh;
   POST /auth/logout. Argon2 hashing. JWT_SECRET from env.
3. get_current_user dependency; RLS roles (app role with policies,
   service role BYPASSRLS) created by an alembic seed step; set
   app.user_id GUC per request.
4. Frontend: /login and /signup pages calling the API (NEXT_PUBLIC_API_URL),
   AuthContext with the fragment-handoff rule from the master prompt,
   apiFetch helper attaching Bearer, retry-once-on-401-via-refresh.
5. pytest: sign-up→login→refresh→rotate→reuse-revoked flow, argon2 round
   trip, RLS cross-user read returns zero rows.

Verify with: uv sync && alembic upgrade head && uv run pytest, and the
frontend `npx tsc --noEmit` plus a manual login on localhost:3000.
```

## Prompt 2 — Items: schema + CRUD

```
Phase 2 (master prompt applies).

1. items table: id uuid pk, user_id fk, title NOT NULL, item_type enum
   (task|grocery|link|read|expense|note), body text, url, due_at timestamptz
   nullable, status (open|done|dropped) default open,
   nag_policy enum (off|gentle|normal|relentless) default gentle,
   extra jsonb, created_at/updated_at. PATCH with nullable fields where
   explicit null clears (due_at). Index (user_id, status, due_at).
2. REST: POST /items, GET /items?status=open grouped by type,
   GET /items/{id}, PATCH /items/{id}, DELETE /items/{id},
   POST /items/{id}/action {action: done|snooze|drop, snooze_until?}.
   All schemas extra="forbid"; all scoped by RLS.
3. Frontend: Now tab (open items, due-sorted, check-off button), Library tab
   (grouped by type, search box wired to a simple ILIKE endpoint
   GET /items/search?q=), slide-over ItemEditor (create + edit, all fields,
   due_at datetime-local), version-bump refetch after every mutation.
4. pytest: CRUD happy paths, enum validation rejects garbage, cross-user
   PATCH returns 404 (not 403), null-clears-due_at, snooze updates due_at.
```

## Prompt 3 — The capture loop: chat → LLM classify → items

```
Phase 4 (master prompt applies).

1. POST /chat: body {text, history: [...]} → calls Groq with a
   few-shot classification prompt → returns {reply, items: [ClassifiedItem]}.
   ClassifiedItem: type/title/body/url/due_at/nag_policy/confidence.
   Parsing is strict Pydantic; malformed LLM output → single retry →
   graceful "couldn't parse" reply, never a 500.
2. Items from chat are inserted with source="chat", and the response echoes
   the created rows (ids included) so the UI can animate them in.
3. FakeLLM for tests (fixed JSON fixtures per input) — real DB.
4. Frontend Chat tab: send → streaming placeholder → created items appear in
   Now; "Add anyway" fallback creates a plain task if classification fails.
5. pytest: classify→persist end-to-end with FakeLLM; due_at ISO parsing;
   multiple items in one message; empty/no-item messages reply only.
```

## Prompt 4 — The nag engine (the heart of the product)

```
Phase 5 (master prompt applies).

1. Scheduler worker (app/scheduler_main.py, loop every 60s, single process):
   claims due reminders with UPDATE ... FOR UPDATE SKIP LOCKED on a
   reminders/scheduler table (id, item_id, user_id, due_at, attempts).
2. Nag ladder per policy: gentle = daily at 9am NZ; normal = 9am+6pm;
   relentless = every 3h during quiet-hours-exempt window (quiet 10pm–7am
   NZ, skipped only by relentless). Cap 6 nags/day/user; batch into one
   digest email if >2 nags due in the same minute.
3. Email: SMTP config in .env; in dev print to console. Each nag links a
   one-click done-token (signed short URL GET /nag/complete?tok=...).
4. Web Push: /push/subscribe + /push/test endpoints, VAPID keygen helper,
   actions [Done, Snooze 1h, Drop] → POST /push/action verifies
   notification payload and applies the item action. Frontend public/sw.js
   handles push + notificationclick + subscription sync.
5. NAG_TEST_INTERVAL_SECONDS env flag for demo mode (fire every 30s).
6. pytest: ladder math (NZST/NZDT via tzdata — test across a DST boundary),
   quiet hours, cap, digest grouping, SKIP LOCKED two-worker non-double-send,
   push action applies to the right item only.
```

## Prompt 5 — Agent tools + SSE streaming chat

```
Phase 6 (master prompt applies).

1. Upgrade /chat to /chat/agent with SSE streaming (event: token /
   event: tool / event: done). Agent loop with tool calling:
   list_items, create_item, update_item, complete_item, drop_item,
   snooze_item, search_items, set_due, set_nag_policy,
   remember_fact, recall_facts, stats_summary, create_groceries,
   plan_day, send_now — a tool registry, each tool = typed Pydantic args +
   a handler executed under the SAME user's RLS context.
2. Conversation memory table (conversations/messages) + facts table
   (user_id, key, value, created_at) that the agent can read/write.
3. Cheap-model pre-classifier routes "just chatting" vs "tool work" so most
   messages cost one small call.
4. Frontend consumes SSE with fetch+ReadableStream (no EventSource — needs
   the Authorization header); renders tool-call chips ("created 2 items").
5. pytest: fake-LLM scripted tool loops; tool RLS isolation; SSE framing
   test; interrupted stream leaves no half-written item.
```

## Prompt 6 — Search, embeddings, semantic layer

```
Phase 7 (master prompt applies).

1. pgvector column on items (embedding vector(1024)) + a small embedder
   abstraction (Groq/OpenAI-compatible embeddings; FakeEmbedder in tests);
   backfill command (app/backfill_embeddings.py); embed on create/update.
2. GET /search?q= → hybrid: cosine similarity over pgvector UNION FTS
   (tsvector generated column + GIN index), merged rank, scoped by RLS.
3. Agent's search_items tool now calls the same service.
4. pytest: seeded corpus — semantic query with zero keyword overlap ranks
   first; exact-phrase query also finds it; other users' rows never appear.
```

## Prompt 7 — Jobs, link enrichment, MCP surface

```
Phase 8 (master prompt applies).

1. Postgres job queue: jobs(id, kind, payload jsonb, status, attempts,
   max_attempts, run_after, dedupe_key unique, created_at) — claimed with
   SKIP LOCKED, retried with exponential backoff, dead-letter after
   max_attempts (alerted later by watchdog).
2. Link enrich job: when a "link" item is created, enqueue enrich; worker
   fetches URL (10s timeout, 1MB cap, ssrf guard: refuse private IPs),
   extracts <title>/og:title, updates item body. Video URLs (youtube etc.)
   get a yt-dlp metadata job (no download in prod; behind a flag).
3. Expose the agent's tools as an MCP server at POST /mcp (JSON-RPC 2.0:
   initialize, tools/list, tools/call) authenticated by a per-user API key.
4. pytest: enqueue→claim→succeed; failure→retry timing; dedupe_key collision
   → single job; MCP tools/list schema matches the internal registry;
   enrich rejects an http://169.254.169.254 link.
```

## Prompt 8 — Multi-user hardening: budget + email ingest

```
Phase 9 (master prompt applies).

1. usage_logs(user_id, day, model, in_tokens, out_tokens, usd_cents numeric)
   — MeteredProvider wraps every LLM call, records usage, raises
   BudgetExceeded → 429 {retry_after}. Env DAILY_BUDGET_USD (default e.g.
   0.50). GET /usage/me + GET /ops/usage.
2. Email→items: each user gets a token address token@capture.example.com
   (EMAIL_CAPTURE_DOMAIN env); inbound relay POSTs raw MIME to
   POST /ingest/email?sig= (HMAC with EMAIL_INGEST_SECRET, ±5 min skew).
   Parse (from/to/subject/body/message_id), dedupe on Message-Id via a
   unique index, classify through the same capture loop with source="email".
   Idempotency: same message-id repost → 200 no-op.
3. GET /items/grouped?source=email shows the inbox trail.
4. pytest: budget 429 at the cent boundary + resets next day (freeze time);
   ingest double-post, forged HMAC rejected, expired ts rejected; classify
   with the email sender as item body attribution.
```

## Prompt 9 — Ops: metrics, dashboard, watchdog

```
Phase 10 (master prompt applies). Final phase.

1. GET /ops/metrics (JSON) computed with pure SQL over existing tables:
   signups/day, items created/completed, nag send-rate + fail-rate, queue
   depth + oldest pending, dead-letter count, per-user LLM spend, p95
   chat latency from the tracer's spans.
2. GET /ops/dashboard — tiny server-rendered HTML (no framework) behind
   OPS_TOKEN query param; 60s auto-refresh.
3. Watchdog alerts inside the worker, checks: nag silent (zero sends while
   >0 due for 15 min), queue backlog (>100 or age >10 min), dead-letter
   appeared, budget breach rate spike, DB pool exhaustion. Alert channel =
   the app's own push service to a designated ops user. Cooldown per alert
   key: unique dedup_key alert:<check>:<user>:<NZ-date>, HMAC-signed payload.
4. Tracer already exists from earlier phases: wrap the worker loop, chat
   endpoint and ingest with spans; add GET /debug/traces (last 512 spans,
   ring buffer) — DEBUG flag only.
5. pytest: each alert fires once per day per key, cooldown dedup works,
   metrics SQL matches hand-seeded expected numbers, dashboard 403 without
   token, traceparent propagated api→job→worker.
6. Finishing pass: README quickstart, .env.example completeness, ruff +
   mypy clean, full suite green, and write the 8 DECISION-*.md ADRs we
   accumulated (rls, queue, budget, email-ingest, auth, tracing, alerts,
   capacitor/mobile) with real rationale.
```

---

## Extras — "I also want to add more"

Paste any of these after the base build. They're each scoped to layer cleanly on top.

### A. Recurring tasks
```
Add recurrence to items: new columns recur_rule (RRULE-lite: daily|weekly|monthly + interval + byweekday csv), recur_parent id. On complete_item, clone the item with the next due_at instead of closing it. UI: "repeats" chip + picker in the editor. Handle DST and month-end (Jan 31 → Feb 28). Jobs table drives nothing here — next occurrence is computed on completion, so a missed week self-heals. Tests: daily/weekly/monthly edge (31st), pause via action drop on parent kills the chain, RLS intact.
```

### B. Calendar view + time-blocking
```
Add a /calendar route: month/week view of items with due_at (client-side layout, single GET /items?range=start,end endpoint). Click a day → create-item editor prefilled. "Plan my day" agent tool writes back morning blocks (due_at windows) for open tasks fitting a free-hours budget from settings. No external calendar yet — but store times in UTC with tz-aware conversion everywhere so a Google Calendar sync can be added later without migration pain.
```

### C. Google Calendar two-way sync
```
Add optional Google Calendar sync: OAuth device flow (no client secret on server beyond a service account), a calendar_events table mapping item<->event (uid, etag, syncToken), worker job: push local changes → Google, pull remote → local (last-write-wins by updated_at, drops = cancelled events). Delta sync via syncToken with full-resync fallback. Config per user in /settings. Guard: sync must never fire more than once per item per cycle (dedupe_key). Tests with a fake Google HTTP layer, real DB.
```

### D. Voice capture + WhatsApp-style quick add
```
Add two capture channels: (1) PWA mic button → Web Speech API in-browser, transcript goes through the SAME /chat classify loop; (2) SMS/Telegram-style: /ingest/text endpoint (HMAC like email ingest) so any bridge (Twilio webhook, Telegram bot) forwards a message and it becomes items with source="sms". Keep parsing logic shared; new sources need no new code beyond the row source value.
```

### E. Projects, tags, and a "someday" shelf
```
Add projects (name, color, archived) + m2m item_tags (name, user_id, unique(user,name)). Library gets a tag sidebar filter and a "Someday" status: items with status=someday never nag and don't appear in Now, one click to move back to open. Agent tools: tag_item, list_projects, archive_project. Migration backfills nothing; all nullable. UI stays light: pills, not boxes.
```

### F. Weekly review ritual
```
Add a weekly-review nag (Sundays 5pm NZ): digest push + /review page showing — completed this week, still open and their age, dropped, and one "anything to capture?" chat prompt. Record a review_done row per user per week; skip the nag if done. Agent tool weekly_report summarizing it in one paragraph (metered). This reuses the scheduler, so it must go through the same jobs + RLS patterns as everything else.
```

### G. Import/export (own your data)
```
Add GET /export (streaming NDJSON dump of all the user's rows: items, facts, messages, settings) and POST /import (dry-run flag, same-identity merge by item id, 409 on collision when not). No auth-token or password export. UI: /settings → "download my data" + "restore". Test round-trip: export → fresh user → import → identical grouped listing.
```

### H. Phone app via Capacitor
```
Wrap the Next.js PWA in Capacitor for iOS/Android: npx cap add android/ios, configure webDir, a config plugin for local-notifications fallback (when the WebView lacks push, the native layer registers and hits /push/native-token; server sends via FCM/APNs env creds — but keep web push as default). Deep link personalos:// for the nag Done links. Keep the frontend a real PWA so this stays optional.
```

### I. Sharing & collaborators
```
Add shareable lists: shared_links(token uuid, list_id/project_id, permission view|capture, expires_at null-able) + public GET /s/{token} (no auth) rendering read-only items or a capture-only inbox (items land in YOUR list with source="share:<token>" and the submitter's optional name). Per-token rate limit + kill switch. Agent tool share_status. RLS exception handled with a policy on share_tokens rather than bypassing RLS.
```

### J. Themes, density, and keyboard-first UX
```
Add a settings panel: dark mode (Tailwind dark: with next-themes), UI density (comfortable|compact), date format, quiet-hours override per item. Keyboard layer: j/k navigate, e edit, d done, n new, / search, esc close editor — a single useHotkeys hook, no library. Skip-to-content + focus-visible rings kept; run an axe pass on Now/Library/Chat pages.
```

---

### Rules for working with the AI on this (also paste at the end of Prompt 0 if you like)

```
PROCESS RULES:
- One phase at a time. At the end of each phase: run the tests you wrote,
  paste the actual output, and stop. Do not start the next phase unprompted.
- Never claim something works without running it. If you can't run it, say
  "unverified" next to the claim.
- After each green phase, make a git commit with a real message; tag phases
  as p1-complete, p2-complete, ...
- When you hit a bug, fix the root cause, then add a regression test AND a
  one-line entry in LEARNED.md (symptom → cause → fix).
- Keep files under ~300 lines; split with clear module names.
```
