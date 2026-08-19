# Project Conventions — StatusBoard

<!-- Auto-generated dari analisis codebase. Update manual kalau ada perubahan pola. -->

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **ORM**: Drizzle ORM + `postgres-js`
- **Database**: Supabase Postgres (Transaction pooler, port 6543)
- **Auth**: `iron-session` (single-owner, httpOnly cookie)
- **Deploy**: Vercel + GitHub Actions (scheduler)

---

## Struktur Folder

```
statusboard/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── admin/              # Halaman owner (protected)
│   │   └── login/
│   ├── api/                # API routes
│   │   ├── auth/           # Auth endpoints (tidak di-protect session)
│   │   └── cron/           # Cron endpoints (protect via X-Cron-Secret, bukan session)
│   ├── layout.tsx
│   └── page.tsx            # Status page publik (tidak butuh auth)
├── lib/                    # Logic & utilities
│   ├── db/
│   │   ├── index.ts        # Drizzle client (prepare: false — JANGAN hapus)
│   │   └── schema.ts       # Table definitions
│   ├── auth.ts
│   └── session.ts          # iron-session helper
├── drizzle/                # Migration files (generated oleh drizzle-kit)
├── docs/                   # Dokumentasi (PRD, IMPLEMENTATION.md, referensiUI)
├── proxy.ts                # Next.js 16 proxy (BUKAN middleware.ts)
└── drizzle.config.ts
```

> **Tidak ada `src/` directory** — `app/`, `lib/` langsung di root. Jangan di-restructure.

---

## Gaya Kode

- **Komponen**: function component + TypeScript, tidak pakai class component
- **Nama file**: kebab-case (`monitor-card.tsx`, `status-badge.tsx`)
- **Nama komponen/type/interface**: PascalCase
- **Nama variabel/fungsi**: camelCase
- **Export komponen page**: `export default function NamaPage()`
- **Import path**: gunakan alias `@/` jika tersedia, fallback ke relative

---

## Command Penting

| Tujuan | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` (= `eslint`) |
| Test | _(belum ada test suite)_ |
| Generate migration | `npx drizzle-kit generate` |
| Push migration | `npx drizzle-kit migrate` |

> **Migrasi**: gunakan `DATABASE_URL_MIGRATE` (Session pooler, port 5432) — bukan `DATABASE_URL` (Transaction pooler, port 6543). Set di `.env.local`.

---

## Pola Khusus yang Wajib Diikuti

### Auth & Session
- Proteksi route via `proxy.ts` (Edge runtime), **bukan** di dalam route handler masing-masing
- `isAuthenticated()` dari `lib/session.ts` untuk cek di Server Component / Route Handler
- Tidak ada tabel `users` — password hash ada di env var `OWNER_PASSWORD_HASH`

### Database Client
- `prepare: false` di `lib/db/index.ts` **tidak boleh dihapus** — wajib untuk Transaction pooler Supabase
- Schema ada di `lib/db/schema.ts`, tambah tabel baru di sini lalu generate migration

### API Routes
- `/api/cron/*` — proteksi via header `X-Cron-Secret`, **bukan** via session
- `/api/auth/*` — dikecualikan dari auth check di proxy
- Mutation (POST/PATCH/DELETE) selain dua di atas → otomatis di-protect proxy

### Down Detection
- Monitor dianggap `down` setelah **2x gagal berturut-turut** (field `consecutiveFailures`)
- Jangan ubah ke "langsung down saat gagal pertama"

---

## Hal yang JANGAN Dilakukan

- Jangan rename `proxy.ts` jadi `middleware.ts` atau fungsi `proxy()` jadi `middleware()`
- Jangan hapus `prepare: false` dari DB client
- Jangan hapus `X-Cron-Secret` check dari `/api/cron/check`
- Jangan pindahkan ke Vercel Cron (pakai GitHub Actions karena limit Hobby plan)
- Jangan install package baru tanpa konfirmasi
- Jangan restructure ke `src/` directory
- Jangan pakai connection string dari project Supabase lain (Snip / KosPedia)
- Jangan hilangkan validasi SSRF (blokir localhost & private IP di URL monitor)
- Jangan ubah auth ke multi-user / Supabase Auth — ini sengaja single-owner MVP

---

## Environment Variables

| Var | Keterangan |
|---|---|
| `DATABASE_URL` | Transaction pooler (port 6543) — untuk runtime app |
| `DATABASE_URL_MIGRATE` | Session pooler (port 5432) — untuk drizzle-kit migrate |
| `SESSION_SECRET` | Min 32 karakter random string |
| `OWNER_PASSWORD_HASH` | bcrypt hash dari password owner |
| `CRON_SECRET` | Secret untuk validasi header `X-Cron-Secret` |

---

## Referensi Dokumen

- `docs/PRDStatusBoard.md` — Product Requirements
- `docs/IMPLEMENTATION.md` — Technical implementation detail
- `AGENTS.md` — Rules untuk AI agents (override jika ada konflik dengan file ini)
