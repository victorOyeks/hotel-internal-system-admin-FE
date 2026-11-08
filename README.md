# Hospio Frontend

**hospio-frontend** is the staff-facing web console for **Hospio360**, a hotel management platform. It is the client for **hospio-backend**, the Hospio360 API. One login serves every role in a hotel; after signing in, a user picks a role and gets a dashboard for that department.

Roles: Hotel Owner, Manager, Front Desk, Inventory Officer, Restaurant (kitchen and bar), Rentals, Laundry, Financials, Marketer, Super Admin.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui (Radix), Lucide icons, Recharts, TanStack Table
- TanStack Query for client data, Next server actions for mutations
- react-hook-form + Zod for forms, Jotai for UI state, nuqs for URL state
- STOMP over SockJS for chat, presence and notifications
- Bun for packages, Biome for lint and format

## Backend

The app talks to **hospio-backend** through its gateway. `NEXT_PUBLIC_API_URL` is the gateway base URL (`http://localhost:9200` locally); every service hangs off it: `/identity`, `/tenant`, `/reservation`, `/folio`, `/payment`, `/fnb`, `/housekeeping`, `/maintenance`, `/inventory`, `/finance`, `/messaging`, `/platform`. The endpoints the frontend uses are typed with Zod in `src/lib/api/schema.ts`; `src/lib/api/client.ts` is the one client, and `withSession()` in `src/lib/api/server.ts` adds the bearer token and the `X-Hotel-Id` header on the server.

Auth is the access token issued by identity-service, kept in an httpOnly cookie with the refresh token beside it. `src/middleware.ts` enforces sign-in, sends a first-time user to change their temporary password, sends a multi-role user to the role picker, and rewrites `/dashboard/*` to the active role's area (`src/lib/roles.ts`).

## Demo mode

`NEXT_PUBLIC_DEMO_MODE` defaults to on. In demo mode the whole UI runs without the backend: any email and password sign you in (the name comes from the email), the session carries every role so the role picker shows all fourteen, and every screen reads sample data for Simpas Hotels (Royal Suites Ltd, four branches) from `src/lib/demo/fixtures/`. Saves show a toast and update local state; nothing is sent anywhere.

Two switches, so the backend comes in one domain at a time. `NEXT_PUBLIC_DEMO_AUTH=false` makes sign-in, the session, the role picker and password change use identity-service with real accounts (staging seeds one per role, password `Hospio123!`, see hospio-backend `docs/deployment-staging.md`) while every screen still reads sample data. Screens read through `src/lib/data/index.ts`, the one seam between the UI and its source; wiring a service in means replacing the body of a function there with the matching `api("@get/...")` call from `src/lib/api/schema.ts`, and the screen above it does not change. `NEXT_PUBLIC_DEMO_MODE=false` turns off whatever fixtures remain.

The redesign follows the Figma file screen by screen (`docs/figma-design-map.md`); every role's area is built on the shared kit in `src/components/shared/` (side panel 520/680, modals 520/600/640, data table, pill tabs, toolbar, fields, status pills, KPI cards).

## Getting started

```bash
bun install
cp .env.example .env.local   # demo mode is on by default; set NEXT_PUBLIC_API_URL and DOMAIN_URL for the real backend
bun dev
```

Open http://localhost:3000.

## Scripts

| Script | What it does |
|---|---|
| `bun dev` | Dev server with Turbopack |
| `bun run build` / `bun start` | Production build and server |
| `bun run lint` / `bun run format` | Biome lint and format |
| `bun run preview` / `bun run deploy` | OpenNext build and Cloudflare Workers deploy |

## Deployment

Two paths: Cloudflare Workers via OpenNext and `wrangler.toml`, or the Bun-based `Dockerfile` (port 3000, see `docker-compose.yml`).

## Layout

```
src/app/(auth)        sign-in, sign-up, password flows
src/app/(dashboard)   one folder per role, plus (shared)/profile
src/components/ui     shadcn primitives
src/components/shared sidebar, header, chat, tables
src/components/roles  per-role screens
src/lib/api           typed client for the new backend (schema, client, server session helper)
src/lib               roles, session cookies, data access, auth actions
src/hooks             layout hooks
```

`docs/figma-design-map.md` lists every screen in the design with its Figma node id. The `*_FRD.md` and `*_UserStory.md` files at the root are requirements from the previous product and are kept for reference only.
