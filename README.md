# Hospio Frontend

**hospio-frontend** holds the web apps of **Hospio360**, a hotel management platform, in one Bun workspace: the hotel console, the H.M.S platform admin portal and the public landing page. The apps are clients of **hospio-backend**, the Hospio360 API. One login serves every role in a hotel; after signing in, a user picks a role and gets a dashboard for that department.

| App | Package | Who | Staging host | Port |
|---|---|---|---|---|
| `apps/hotel` | `@hospio/hotel` | hotel owners, managers and staff (Front Desk, Housekeeping, Laundry, Maintenance, Kitchen, Bar, Inventory, Finance) | web-staging.hospio360.com | 3001 |
| `apps/admin` | `@hospio/admin` | Hospio360 platform admin (Super Admin, Support, Finance Admin) and the marketer portal | admin-staging.hospio360.com | 3002 |
| `apps/landing` | `@hospio/landing` | public marketing site, privacy and terms | hospio360.com | 3003 |

The hotel and admin apps are the same product split by audience: they share every package and differ only in `NEXT_PUBLIC_APP` (set in each app's `next.config.ts`), which selects the roles the app signs in and shows. A session that holds only the other app's roles is handed over to that app's host.

## Stack

- Next.js 15 (App Router, standalone output), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui (Radix), Lucide icons, Recharts, TanStack Table
- TanStack Query for client data, Next server actions for mutations
- react-hook-form + Zod for forms, Jotai for UI state, nuqs for URL state
- Bun workspaces for packages, Biome for lint and format

## Layout

```
apps/hotel/src/app/(auth)            sign-in, password flows
apps/hotel/src/app/(dashboard)       one folder per hotel role, plus shared/* (profile, notifications, help, shifts)
apps/hotel/src/components/roles      per-role screens (manager, owner, front-office, finance, ...)
apps/admin/src/app/(dashboard)       admin/* and marketer/*
apps/admin/src/components/roles      admin and marketer screens
apps/landing/src                     landing page, privacy, terms
packages/ui/src/primitives           shadcn primitives
packages/ui/src/shared               the design kit: side panel, modal, data table, pill tabs, toolbar, fields, status pills, KPI cards
packages/ui/src/screens              screens both apps render: sign-in form, role picker, profile, help, dashboard shell
packages/ui/src/{links,hooks,svgs}   nav per role, layout hooks, icons
packages/api/src/api                 typed client for hospio-backend (schema.ts routes, client.ts, server.ts session helper)
packages/api/src/data                the data seam (index.ts), live.ts switch, mappers per domain
packages/api/src/actions             server actions per domain (auth, property, reservation, folio, payment) and useAction()
packages/api/src/demo                demo mode switches, fixtures, demo token and demo actions
packages/api/src/{session,dal,roles,app,middleware}.ts   cookies, data access layer, roles and role paths, app kind, the shared middleware
packages/config                      shared tsconfig
nginx/                               sites for admin-staging.hospio360.com and hospio360.com
scripts/vps/sites-staging.sh         installs those sites on the box
.github/workflows                    one deploy workflow per app
```

Imports: `@/*` is the app's own `src`, `@hospio/ui/*` is `packages/ui/src`, `@hospio/api/*` is `packages/api/src`.

## Backend

The apps talk to **hospio-backend** through its gateway. `NEXT_PUBLIC_API_URL` is the gateway base URL (`http://localhost:9200` locally, `https://api-staging.hospio360.com` on staging); every service hangs off it: `/identity`, `/tenant`, `/property`, `/reservation`, `/folio`, `/payment`, `/fnb`, `/housekeeping`, `/maintenance`, `/inventory`, `/finance`, `/messaging`, `/platform`. The endpoints the frontend uses are typed with Zod in `packages/api/src/api/schema.ts`; `client.ts` is the one client and `withSession()` in `server.ts` adds the bearer token and the `X-Hotel-Id` header on the server.

Auth is the access token issued by identity-service, kept in an httpOnly cookie with the refresh token beside it. The shared middleware (`packages/api/src/middleware.ts`, re-exported by each app's `src/middleware.ts`) enforces sign-in, sends a first-time user to change their temporary password, sends a multi-role user to the role picker, rewrites `/dashboard/*` onto the active role's area (`roles.ts`) and `/dashboard/{notifications,profile,help,shifts}` onto `/shared/*`, and answers 404 for a role path reached directly.

## Demo mode and live domains

`NEXT_PUBLIC_DEMO_MODE` (default on) runs the whole UI without the backend on sample data for Simpas Hotels (Royal Suites Ltd) from `packages/api/src/demo/fixtures/`. `NEXT_PUBLIC_DEMO_AUTH=false` makes sign-in, the session, the role picker and password change use identity-service with real accounts (staging seeds one per role, see hospio-backend `docs/deployment-staging.md`) while screens keep their sample data. `NEXT_PUBLIC_LIVE_DOMAINS` (comma-separated) lists the domains whose data functions call the backend; staging builds with `property,reservation,folio,payment`, so rooms, bookings, guests, folios and payments are real (the front-desk loop, QA script in `docs/qa/front-desk-loop.md`) while the rest is still sample data.

Screens read through the seam `data.<domain>.<fn>()` in `packages/api/src/data/index.ts`; wiring a domain means a Zod schema and routes in `schema.ts`, a mapper in `data/mappers/<domain>.ts`, a `live(domain)` branch in the seam, server actions in `actions/<domain>.ts`, and the screen swaps `useDemoAction` for `useAction`.

## Getting started

```bash
bun install
cp .env.example .env.local      # read by every app; demo mode is on by default
bun run dev:hotel               # http://localhost:3001
bun run dev:admin               # http://localhost:3002
bun run dev:landing             # http://localhost:3003
```

To run against staging's API, set `NEXT_PUBLIC_API_URL=https://api-staging.hospio360.com`, `NEXT_PUBLIC_DEMO_AUTH=false` and `NEXT_PUBLIC_LIVE_DOMAINS=property,reservation,folio,payment` in `.env.local`.

Do not run `next dev` and a production build of the same app at the same time: both use the app's `.next` folder.

## Scripts

| Script | What it does |
|---|---|
| `bun run dev:hotel` / `dev:admin` / `dev:landing` | Dev server for one app (`bun run dev` is the hotel app) |
| `bun run build` | Production build of every app (`build:hotel`, `build:admin`, `build:landing` for one) |
| `bun run typecheck` | `tsc --noEmit` for the three apps |
| `bun run lint` / `bun run format` | Biome over `apps` and `packages` |

Each build is standalone: run it with `node apps/<app>/server.js` from `apps/<app>/.next/standalone` with `PORT`, `HOSTNAME=0.0.0.0` and `DOMAIN_URL` set. Bind on `0.0.0.0` (or leave `HOSTNAME` unset): with an IP such as `127.0.0.1` Next treats the middleware's `/dashboard` rewrite as a cross-host URL, proxies it to itself and the direct-path guard answers 404.

## Deployment

GitHub Actions deploys the `staging` branch to the Contabo box, one workflow per app with a path filter, so a change under `apps/admin` only redeploys the admin portal while a change under `packages/` redeploys all three: `deploy-hotel-staging.yml`, `deploy-admin-staging.yml`, `deploy-landing-staging.yml`. Each builds its app with the public variables from the repository's Actions variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_DEMO_AUTH`, `NEXT_PUBLIC_LIVE_DOMAINS`, `NEXT_PUBLIC_ADMIN_APP_URL` / `NEXT_PUBLIC_HOTEL_APP_URL`, with staging defaults), tars the standalone output, copies it to `~/apps/<dir>/current` on the box (`his-fe-staging`, `hospio-admin-staging`, `hospio-landing-staging`), rewrites the systemd unit (`node .../current/apps/<app>/server.js`, `HOSTNAME=0.0.0.0`, the app's `DOMAIN_URL`) and restarts it with a health check. Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `STAGING_DOMAIN_URL`.

nginx terminates TLS and proxies each host to its port; `nginx/` holds the two new sites and `scripts/vps/sites-staging.sh` installs them (then `certbot --nginx` for each host; admin-staging needs its DNS A record first).

`docs/figma-design-map.md` lists every screen in the design with its Figma node id. The `*_FRD.md` and `*_UserStory.md` files at the root are requirements from the previous product and are kept for reference only.
