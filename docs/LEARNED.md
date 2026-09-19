# LEARNED — Running log of bugs and fixes

## Backend Phase 1

### 2026-09-18 — Next.js 15.5.25 webpack __webpack_modules__[moduleId] is not a function
- **Symptom**: Runtime TypeError `__webpack_modules__[moduleId] is not a function` + `SegmentViewNode in React Client Manifest` + `Cannot find module './403.js'` in .next/server/webpack-runtime.js
- **Cause**: `package.json` had `"next": "^15.1.6"` which npm resolved to 15.5.25 (latest 15.x). 15.5.25 has RSC bundler bug with React 19. Stale `.next` from old version also caused 403.js missing.
- **Fix**: Pin exact versions `"next": "15.1.7"`, `"tailwindcss": "4.0.14"`, remove `allowedDevOrigins` (not in 15.1.x), always `rm -rf .next` after version change. Build now green, dev 200.

### 2026-09-18 — Pydantic EmailStr needs email-validator
- **Symptom**: `ImportError: email-validator is not installed` on app import
- **Cause**: Pydantic v2 EmailStr requires `email-validator` package, not included by default
- **Fix**: Added `pydantic[email]` and `email-validator` to pyproject.toml dependencies

### 2026-09-18 — Hatchling wheel build fails without packages
- **Symptom**: `pip install -e .` failed `Unable to determine which files to ship inside the wheel`
- **Cause**: Project name `personal-os-backend` doesn't match directory `app`, hatch can't infer packages
- **Fix**: Added `[tool.hatch.build.targets.wheel] packages = ["app"]` to pyproject.toml

### 2026-09-18 — No Docker/Postgres in sandbox
- **Symptom**: Tests requiring real Postgres skipped, docker not found, apt can't install postgres-17
- **Cause**: Sandbox has no docker, no pgvector image, no apt postgres
- **Fix**: conftest tries testcontainers first, falls back to TEST_DATABASE_URL, else pytest.skip. Documented that integration tests need `docker-compose up postgres`. Unit tests (argon2) still run.

## Frontend Phase

### 2026-09-18 — useSearchParams needs Suspense in Next 15
- **Symptom**: `npm run build` failed with `useSearchParams() should be wrapped in a suspense boundary at page "/library"`
- **Cause**: Next.js 15 App Router requires client components using `useSearchParams` to be inside `<Suspense>`
- **Fix**: Wrapped `LibraryContent` in `<Suspense fallback>` in `app/library/page.tsx`

### 2026-09-18 — Tailwind 4 PostCSS plugin
- **Symptom**: Initial dev failed with unknown at rule @theme
- **Cause**: Tailwind 4 needs `@tailwindcss/postcss` plugin, not `tailwindcss` directly in postcss.config
- **Fix**: `postcss.config.mjs` uses `{"@tailwindcss/postcss": {}}` and `globals.css` uses `@import "tailwindcss"` + `@theme inline`

### 2026-09-18 — Port 3000 EADDRINUSE
- **Symptom**: `next dev -p 3000` failed EADDRINUSE after previous run
- **Cause**: Next.js dev server didn't exit cleanly, background process held port
- **Fix**: `pkill -f "next dev"` before starting, use process tools with port tracking

### 2026-09-18 — PWA icons missing
- **Symptom**: manifest.json referenced icons that didn't exist, install prompt wouldn't show
- **Cause**: No icons generated yet
- **Fix**: Generated placeholder icons with image model, 512 and 192 variants, same asset copied
