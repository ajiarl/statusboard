# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## UI/UX Skill Rules
Whenever touching any UI/UX code, always load and apply these skills:
- ~/.claude/skills/impeccable/SKILL.md
- ~/.claude/skills/design-taste-frontend/SKILL.md
- ~/.claude/skills/ui-ux-pro-max/SKILL.md

No exceptions. Every component, every page, every style change.

## Project Overview

**StatusBoard** is an open-source, self-hostable status page for monitoring the uptime of multiple projects in a single public dashboard. Built to mirror the Snip project's stack (Next.js 16 + Drizzle ORM + Supabase Postgres + Tailwind v4 + shadcn/ui + Vercel) for pattern reuse.

Initial use case: monitoring 5 live projects (Snip, SiMagang, Finance Tracker, KosPedia, Portfolio V5), but designed for anyone to self-host.

**Important**: Read `AGENTS.md` for pinned technical decisions and `docs/PRDStatusBoard.md` (v1.1) for complete requirements.

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database (Drizzle)
```bash
npx drizzle-kit generate   # Generate migration from schema changes
npx drizzle-kit migrate    # Apply migrations to database
npx drizzle-kit push       # Push schema directly (dev only, skips migrations)
npx drizzle-kit studio     # Open Drizzle Studio (database GUI)
npx drizzle-kit check      # Validate migrations
```

Database schema is in `lib/db/schema.ts`. Configuration is in `drizzle.config.ts`. Migrations output to `drizzle/`.

## Architecture

### Stack
- **Framework**: Next.js 16 (App Router) - no `src/` directory by design
- **ORM**: Drizzle ORM with Supabase Postgres
- **Styling**: Tailwind v4 + shadcn/ui components
- **Hosting**: Vercel
- **Scheduler**: GitHub Actions (cron) - NOT Vercel Cron (Hobby tier only allows 1x/day)
- **Auth**: Custom single-owner (password hash + signed httpOnly cookie, no user table)

### Directory Structure
```
app/              # Next.js 16 App Router pages
lib/db/           # Database schema and client
  ├── schema.ts   # Drizzle schema (monitors, checks, incidents, incidentUpdates)
  └── index.ts    # Database client (MUST have prepare: false)
drizzle/          # Migration files
docs/             # Documentation (PRD)
public/           # Static assets
```

**Note**: No `src/` directory - `app/`, `lib/`, `components/` live at root (intentional, mirrors Snip).

### Database Schema (4 tables)

1. **monitors** - URLs to monitor (name, url, method, expectedStatus, currentStatus, consecutiveFailures)
2. **checks** - Health check history (monitorId, status, statusCode, responseTimeMs, checkedAt)
3. **incidents** - Manual incident posts (monitorId, title, severity, status, resolvedAt)
4. **incidentUpdates** - Timeline updates for incidents (incidentId, status, message, createdAt)

All tables use UUID primary keys. Enums are text-based (not Postgres enum type) for easier value additions.

### Health Check Flow

```
GitHub Actions (cron: 5-15 min)
  → POST /api/cron/check (with X-Cron-Secret header)
    → Fetch all active monitors in parallel
    → Record results in `checks` table
    → Update `monitors.currentStatus` (cached for public page)
      → Down detection: 2 consecutive failures (not 1x)
```

**Critical**: `/api/cron/check` endpoint must validate `X-Cron-Secret` header (stored in GitHub Actions secrets + Vercel env).

### Routing

- **`/`** - Public status page (no auth, shows all active monitors + incidents)
- **`/admin/*`** - Owner-only dashboard (protected by session cookie)
- **API routes** - Mutation routes (`POST`/`PATCH`/`DELETE`) require auth; read-only queries do not

## Critical Technical Decisions (from AGENTS.md)

### Database Connection
**MUST set `prepare: false`** in postgres-js client when connecting to Supabase connection pooler (Transaction mode). Prepared statements are not supported in this pooling mode. See `lib/db/index.ts:9-10`.

```typescript
const client = postgres(process.env.DATABASE_URL, {
  prepare: false, // REQUIRED for Supabase pooling - do not remove
});
```

### Middleware/Proxy
Next.js 16 uses `proxy.ts` (not `middleware.ts`). Export function is `proxy()`, not `middleware()`.

### Down Detection Logic
Status changes to `down` only after **2 consecutive check failures** (not 1x). This prevents false positives from network blips or cold starts. Tracked via `monitors.consecutiveFailures` column.

### Auth Model
Single-owner only (no multi-user in MVP). Password hash in `OWNER_PASSWORD_HASH` env var (bcrypt/argon2). No `users` table. Multi-user/Supabase Auth is in roadmap v2, not current scope.

### Scheduler
Uses GitHub Actions scheduled workflow (NOT Vercel Cron). Vercel Cron Hobby tier only runs 1x/day, which is too infrequent for uptime checks.

**Important**: GitHub Actions scheduled workflows do NOT prevent the 60-day auto-disable. GitHub only counts commits/PRs/issues as "activity", not workflow executions. A separate keep-alive workflow (dummy commits) is required.

### Security
- Validate `X-Cron-Secret` header on `/api/cron/check` (not optional)
- Block localhost and private IP ranges (`10.x`, `192.168.x`, `127.0.0.1`) when adding monitors (SSRF mitigation)
- Rate limit login route
- All mutation API routes require valid session cookie

### Supabase Considerations
- **StatusBoard uses a separate Supabase project** (not shared with Snip/KosPedia)
- Supabase free tier limits: 2 active projects per org, auto-pause after 7 days without DB activity
- StatusBoard itself won't be paused (cron writes to `checks` every 5-15 min), but monitored projects might be
- When a monitor shows `down` and target uses Supabase free tier, check if it's a pause (not a real incident)

### Data Retention
`checks` table retains 30-45 days of raw data, then cleanup job deletes old entries. This is intentional to manage storage.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - Supabase Postgres connection string (pooler mode Transaction)
- `OWNER_PASSWORD_HASH` - bcrypt/argon2 hash of owner password
- `X_CRON_SECRET` - Secret for validating GitHub Actions cron requests (also in GHA secrets)

## Development Notes

- **No tests yet**: Test framework setup is planned but not implemented
- **Components**: shadcn/ui components will be added to `components/` as needed
- **Styling**: Tailwind v4 (not v3) - check for syntax differences
- **Response time chart**: Marked optional in PRD (defer to v2 if time is tight)
- **Roadmap v2** (out of scope for MVP): email/Discord notifications, multi-user, public API, SSL cert monitoring, maintenance windows

## Related Projects

This project intentionally mirrors the stack and patterns from **Snip** for code reuse. When prompt mentions "same pattern as Snip", that means read Snip files as reference (if available), then write the equivalent in StatusBoard - NOT editing Snip files directly.

**Scope Warning**: If working in a parent directory containing multiple projects (Snip, KosPedia, SiMagang, etc.), stay within `StatusBoard/` directory unless explicitly instructed otherwise.
