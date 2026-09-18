# LEARNED — Running log of bugs and fixes

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
