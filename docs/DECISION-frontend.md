# DECISION — Frontend Architecture

## Context
We need a mobile-first PWA for Personal OS that feels calm, premium, private. The provided HTML prototype (personal-os-v2.html) already defines a complete design system with tokens, but it's static. We need a scalable Next.js + Tailwind 4 implementation where theme/colors can be changed in one file, no hardcoded data/style in components.

Options considered:
- Tailwind 3 with tailwind.config.js — requires config file, more boilerplate
- Tailwind 4 with @theme inline — no config file, tokens in CSS, single source of truth
- CSS modules per component — hard to keep theme consistent
- Styled-components — runtime cost, not needed

## Decision
Use Tailwind 4 with a single `app/globals.css` as the token contract:
- `:root` defines primitive ramps (neutral, indigo, semantic hues) and semantic tokens (bg, surface, text-1, brand, etc) exactly from the HTML prototype
- `[data-theme="dark"]` overrides semantic tokens for dark mode
- `@theme inline` maps CSS variables to Tailwind utilities (--color-bg, --color-surface, etc) so components use `bg-surface`, `text-text-1`, `border-border`, etc
- All components consume only semantic tokens, never primitive hex values
- No tailwind.config.js file (Tailwind 4 requirement from user)

Component architecture:
- `lib/types.ts` — single type definitions (Item, ItemType, NagPolicy, etc)
- `lib/constants.ts` — label/icon/color meta for item types, no hardcoded strings in components
- `lib/mockData.ts` — demo data, not embedded in components
- `lib/utils.ts` — date, dueLabel, fromNow, isOverdue, etc
- `hooks/useItemsStore.tsx` — in-memory store for demo, later replaced by API + version counter
- `hooks/useTheme.tsx` — system/light/dark with data-theme attribute
- `hooks/useAuth.tsx` — fragment handoff `/#t=<token>` + localStorage + apiFetch with 401 retry
- `components/ui/` — Button, Chip, Card, SearchInput, Segmented, BottomSheet, Toast, EmptyState — all token-based
- `components/layout/` — Topbar, Tabbar, Drawer, AppShell, GlobalShell — mobile shell with safe-area
- `components/now/`, `library/`, `chat/`, `calendar/` — feature components, no hardcoded data
- `components/sheets/` — all sheets from HTML (editor, share, insights, nudge, settings, connections, profile)
- `app/` — Next.js App Router pages: / (Now), /library, /chat, /calendar, /login, /signup
- `public/manifest.json` + `public/sw.js` — PWA with share_target and push actions Done/Snooze/Drop

## Why
- Single file theme change: edit `:root` in globals.css, all components update
- No hardcoded data: mockData in one file, components receive props
- No hardcoded styles: components use `bg-surface`, `text-brand`, `border-border`, etc which resolve to CSS variables
- Mobile-first: bottom tab bar, fixed capture bar, bottom sheets (vaul pattern), 44px touch targets, safe-area insets
- PWA-ready: manifest with share_target for social/video URLs, sw.js with notificationclick handling, installable
- Scalable: <300 lines per file, clear module boundaries, easy to replace mock store with real API later
- Matches HTML prototype exactly but as React components

## Consequences
- Tailwind 4 is newer, but stable and removes config file as requested
- Dark mode via data-theme attribute, not media query only, so user can override
- PWA icons need real assets (generated placeholder for now)
- Real backend integration will replace useItemsStore with API calls + version bump refetch pattern
