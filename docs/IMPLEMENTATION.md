# Implementation Plan — StatusBoard
Version 1.0 | Mengikuti PRD v1.1

---

## Cara Pakai Dokumen Ini

- Kerjakan fase **berurutan**, jangan loncat — fase berikutnya butuh fondasi dari fase sebelumnya.
- Tiap fase punya **checklist task** dan **"Selesai Kalau"** (definisi done) — jangan lanjut kalau belum terpenuhi.
- Sumber kebenaran fitur & schema: `PRD.md`. Sumber kebenaran keputusan arsitektur & gotcha: `AGENTS.md`.
- Di akhir tiap fase: tampilkan ringkasan, lalu tunggu konfirmasi sebelum lanjut.

---

## Progress Tracker

```
✅ Fase 0 — Foundation (scaffold + schema + DB)
🔲 Fase 1 — Auth (login/logout + proxy)
🔲 Fase 2 — Cron Check Engine (/api/cron/check)
🔲 Fase 3 — Monitor CRUD API + Admin UI
🔲 Fase 4 — Public Status Page (/)
🔲 Fase 5 — Incident Management API + Admin UI
🔲 Fase 6 — GitHub Actions (cron + keep-alive)
🔲 Fase 7 — Vercel Deployment + Env Setup
```

---

## FASE 0 — Foundation ✅

Sudah selesai. Yang sudah ada: Next.js 16 scaffold, Drizzle schema (`monitors`, `checks`,
`incidents`, `incident_updates`), Supabase project terpisah, Tailwind v4 + shadcn/ui,
struktur folder mirror Snip (tanpa `src/`), `drizzle-kit generate` + `migrate` sudah jalan.

---

## FASE 1 — Auth

**Dependencies yang perlu di-install:**
```
npm install iron-session bcryptjs
npm install -D @types/bcryptjs
```

**Tasks:**
- [ ] `lib/db/index.ts` — pastikan Drizzle client sudah ada `prepare: false` (wajib, Supabase
  Transaction pooler tidak support prepared statements — lihat AGENTS.md)
- [ ] `lib/session.ts` — helper buat/baca/hapus signed httpOnly cookie via `iron-session`
  (butuh env `SESSION_SECRET`, min 32 karakter)
- [ ] `lib/auth.ts` — fungsi `verifyPassword(plain, hash)` pakai `bcryptjs.compare`,
  baca hash dari env `OWNER_PASSWORD_HASH`
- [ ] `app/api/auth/login/route.ts` — POST: validasi body, cek rate limit (max 5 request/menit
  per IP, in-memory cukup), verifikasi password, set cookie, redirect `/admin`
- [ ] `app/api/auth/logout/route.ts` — POST: destroy session cookie, redirect `/admin/login`
- [ ] `app/admin/login/page.tsx` — form login (email/password atau password saja),
  tampilkan error kalau login gagal
- [ ] `proxy.ts` (bukan `middleware.ts` — lihat AGENTS.md) — proteksi semua route `/admin/*`
  kecuali `/admin/login`; proteksi semua API mutation (`POST`/`PATCH`/`DELETE`) kecuali
  `/api/auth/*` dan `/api/cron/*` (cron punya proteksi sendiri via secret header)

**Selesai Kalau:**
- Akses `/admin` tanpa cookie → redirect ke `/admin/login`
- Login dengan password salah → pesan error muncul, tidak ada cookie
- Login dengan password benar → redirect ke `/admin`, cookie terset
- POST ke `/api/monitors` tanpa cookie → 401
- Logout → cookie terhapus, redirect ke `/admin/login`
- Akses `/` (halaman publik) tetap bisa tanpa login

---

## FASE 2 — Cron Check Engine

**Tasks:**
- [ ] `lib/ssrf.ts` — fungsi `isPrivateUrl(url: string): boolean`, blokir `localhost`,
  `127.0.0.1`, `0.0.0.0`, range `10.x`, `172.16.x–172.31.x`, `192.168.x`, `::1`
- [ ] `lib/check.ts` — fungsi `checkMonitor(monitor)`:
  - Fetch URL dengan `AbortController` timeout 10 detik
  - Return `{ status: 'up' | 'down' | 'degraded', statusCode, responseTimeMs }`
  - `up`: response sukses sesuai `expectedStatus`
  - `degraded`: response sukses tapi `responseTimeMs > 3000`
  - `down`: timeout atau status code tidak sesuai
- [ ] `app/api/cron/check/route.ts` — POST endpoint:
  - [ ] Validasi header `X-Cron-Secret` (env `X_CRON_SECRET`) — return 401 kalau invalid/missing
  - [ ] Query semua monitor dengan `isActive = true`
  - [ ] Jalankan `checkMonitor()` paralel untuk semua monitor (`Promise.allSettled`)
  - [ ] Untuk tiap hasil check:
    - Tulis baris baru ke tabel `checks`
    - Kalau **gagal**: increment `consecutiveFailures`; kalau sudah `>= 2` → set `currentStatus = 'down'`
    - Kalau **berhasil**: reset `consecutiveFailures = 0`, set `currentStatus` ke `'up'` atau `'degraded'`
    - Update `lastCheckedAt`
  - [ ] Cleanup: hapus baris `checks` dengan `checkedAt < NOW() - 45 hari`
  - [ ] Return 200 + ringkasan hasil (berapa monitor di-check, berapa up/down/degraded)

**Selesai Kalau:**
- POST tanpa secret → 401
- POST dengan secret → semua monitor aktif di-check, hasil masuk tabel `checks`
- Monitor gagal 1x → `consecutiveFailures = 1`, status belum berubah ke `down`
- Monitor gagal 2x berturut → `currentStatus = 'down'`
- Monitor yang recover setelah down → `consecutiveFailures = 0`, `currentStatus = 'up'`
- Row `checks` yang lebih tua dari 45 hari terhapus setiap kali cron jalan

---

## FASE 3 — Monitor CRUD API + Admin UI

**Tasks:**

### 3.1 — API Routes
- [ ] `app/api/monitors/route.ts`
  - `GET` — list semua monitor (semua field), diurutkan `createdAt` asc
  - `POST` — tambah monitor baru; validasi SSRF dulu sebelum simpan ke DB
- [ ] `app/api/monitors/[id]/route.ts`
  - `PATCH` — update monitor (name, url, method, expectedStatus, isActive); validasi SSRF
    kalau URL berubah
  - `DELETE` — hapus monitor + cascade hapus semua `checks` terkait (via DB constraint)

### 3.2 — Admin UI
- [ ] `app/admin/page.tsx` — dashboard utama:
  - List semua monitor dengan badge status (`currentStatus`), `lastCheckedAt`, link ke edit
  - Tombol "Tambah Monitor" → `/admin/monitors/new`
  - Tombol delete (konfirmasi dialog sebelum hapus)
  - Toggle aktif/nonaktif langsung dari list (PATCH `isActive`)
- [ ] `app/admin/monitors/new/page.tsx` — form tambah monitor:
  - Field: nama, URL, method (`GET`/`HEAD`), expected status code (default 200)
  - Validasi client-side sebelum submit
- [ ] `app/admin/monitors/[id]/edit/page.tsx` — form edit monitor (prefill dari data existing)

**Selesai Kalau:**
- Bisa tambah monitor baru dari UI, muncul di list
- URL private/localhost ditolak dengan pesan error jelas
- Bisa edit nama, URL, method, expected status
- Bisa toggle aktif/nonaktif dari list
- Bisa hapus monitor (dengan konfirmasi), `checks` ikut terhapus
- Semua aksi butuh cookie auth yang valid (tanpa cookie → 401 dari API)

---

## FASE 4 — Public Status Page

**Tasks:**
- [ ] `lib/uptime.ts` — fungsi `calculateUptime(monitorId, windowHours)`:
  - Query tabel `checks` dalam window waktu tertentu
  - Return `{ uptimePercent: number, totalChecks: number, upChecks: number }`
  - Ekspor 3 helper: `uptime24h`, `uptime7d`, `uptime30d`
- [ ] `app/page.tsx` — Server Component, no auth:
  - [ ] Query semua monitor aktif + `currentStatus`
  - [ ] Hitung uptime % (24h / 7d / 30d) per monitor via `lib/uptime.ts`
  - [ ] Query incidents yang belum resolved (untuk banner aktif)
  - [ ] Query incidents yang sudah resolved (untuk history timeline di bawah)
  - [ ] **Overall status banner** di paling atas:
    - Semua monitor `up` → banner hijau "All Systems Operational"
    - Ada monitor `degraded`, tidak ada yang `down` → banner kuning "Degraded Performance"
    - Ada monitor `down` → banner merah "Partial Outage" / "Major Outage"
  - [ ] **Active Incidents section**: tampilkan kalau ada incident yang belum resolved
  - [ ] **Monitor list**: tiap monitor tampilkan nama, status badge, uptime % (24h/7d/30d)
    - Badge: hijau = `up`, merah = `down`, kuning = `degraded`, abu = `unknown`
  - [ ] **Incident History section**: list incident resolved, diurutkan terbaru di atas,
    dengan timeline update per incident

**Selesai Kalau:**
- Halaman `/` bisa diakses tanpa login
- Banner atas mencerminkan status agregat yang akurat
- Tiap monitor menampilkan badge status yang benar + uptime % 24h/7d/30d
- Incident aktif muncul di section "Active Incidents"
- Incident resolved tampil di history timeline di bawah

---

## FASE 5 — Incident Management API + Admin UI

**Tasks:**

### 5.1 — API Routes
- [ ] `app/api/incidents/route.ts`
  - `GET` — list semua incident, include `incidentUpdates`, diurutkan `createdAt` desc
  - `POST` — buat incident baru (title, monitorId?, severity, pesan update pertama)
- [ ] `app/api/incidents/[id]/route.ts`
  - `PATCH` — update field incident (title, severity, status); kalau status di-set ke
    `'resolved'`, otomatis isi `resolvedAt = NOW()`
- [ ] `app/api/incidents/[id]/updates/route.ts`
  - `POST` — tambah update baru ke incident (status, message); update juga `incidents.status`
    ke status yang sama

### 5.2 — Admin UI
- [ ] `app/admin/incidents/page.tsx` — list semua incident, badge status, link ke detail
- [ ] `app/admin/incidents/new/page.tsx` — form buat incident baru:
  - Field: judul, monitor terkait (dropdown, boleh kosong), severity (minor/major/critical),
    pesan update awal
- [ ] `app/admin/incidents/[id]/page.tsx` — detail incident:
  - Timeline semua update yang sudah ada
  - Form tambah update baru (status + pesan)
  - Tombol "Mark as Resolved" (shortcut PATCH ke status resolved)

**Selesai Kalau:**
- Bisa buat incident baru dari admin, tampil di public page sebagai active incident
- Bisa tambah update timeline, status incident ikut berubah
- Incident di-mark resolved → `resolvedAt` terisi, hilang dari banner active, pindah ke history
- `monitorId` boleh kosong (incident global)
- Semua mutation butuh cookie auth

---

## FASE 6 — GitHub Actions

**Tasks:**
- [ ] `.github/workflows/cron.yml` — scheduled cron check:
  ```yaml
  on:
    schedule:
      - cron: '*/10 * * * *'  # tiap 10 menit
    workflow_dispatch:          # bisa trigger manual dari UI GitHub
  ```
  - Step: `curl -X POST "${{ secrets.APP_URL }}/api/cron/check" -H "X-Cron-Secret: ${{ secrets.X_CRON_SECRET }}"`
  - Fail kalau response bukan 2xx

- [ ] `.github/workflows/keep-alive.yml` — mencegah repo idle 60 hari (penting: scheduled
  workflow yang jalan terus **tidak** terhitung sebagai "activity" oleh GitHub):
  ```yaml
  on:
    schedule:
      - cron: '0 12 * * 1'  # tiap Senin siang
  ```
  - Step: git config + dummy commit ke file `keep-alive.txt` + git push
  - Butuh `GITHUB_TOKEN` (sudah otomatis tersedia di Actions)

- [ ] Set secrets di GitHub repo settings:
  - `APP_URL` — Vercel URL production (misal `https://statusboard.vercel.app`)
  - `X_CRON_SECRET` — sama persis dengan env var di Vercel

**Selesai Kalau:**
- Kedua workflow muncul di tab Actions
- `cron.yml` bisa di-trigger manual (`workflow_dispatch`) dan return 200 dari endpoint
- `keep-alive.yml` terschedule mingguan dan tidak error

---

## FASE 7 — Vercel Deployment + Env Setup

**Tasks:**
- [ ] Connect repo GitHub ke Vercel (import project)
- [ ] Set environment variables di Vercel dashboard:
  - `DATABASE_URL` — connection string **Transaction pooler** Supabase
    (pastikan bukan Direct/Session pooler)
  - `OWNER_PASSWORD_HASH` — generate via `node -e "require('bcryptjs').hash('passwordmu', 12).then(console.log)"`
  - `X_CRON_SECRET` — random string panjang (misal `openssl rand -hex 32`)
  - `SESSION_SECRET` — random string min 32 karakter untuk signing cookie iron-session
  
  **Note:** `DATABASE_URL_MIGRATE` (Session pooler, port 5432) TIDAK diperlukan di Vercel runtime karena migrations hanya dijalankan lokal atau di CI, bukan di production. Kalau perlu manual migration di Vercel untuk troubleshooting, baru tambahkan env var ini.
- [ ] Verifikasi build Vercel pass (cek build log)
- [ ] Test manual endpoint `/api/cron/check` via curl dari lokal ke Vercel URL
- [ ] Test flow lengkap:
  - [ ] Halaman publik `/` tampil
  - [ ] Login `/admin/login` → berhasil masuk ke `/admin`
  - [ ] Tambah 1 monitor dari admin
  - [ ] Trigger cron manual → cek tabel `checks` di Supabase terisi
  - [ ] Status monitor update di halaman publik
- [ ] Update `APP_URL` secret di GitHub Actions ke Vercel URL production
- [ ] Trigger manual `cron.yml` dari GitHub Actions UI → pastikan berhasil

**Selesai Kalau:**
- Vercel URL production live dan bisa diakses publik
- Admin login berfungsi
- Cron endpoint berfungsi dari GitHub Actions ke Vercel
- Data check masuk ke Supabase dan tercermin di halaman publik

---

## Catatan

- Setiap fase selesai → commit + push sebelum mulai fase berikutnya
- Typecheck (`tsc --noEmit`) wajib pass sebelum commit
- **`prepare: false` wajib ada di Drizzle client** (`lib/db.ts`) — jangan dihapus meskipun terlihat aneh; ini syarat Supabase Transaction pooler (lihat AGENTS.md)
- Response time chart (grafik historis per monitor): defer ke v2, tidak ada di MVP
- `daily_uptime_stats` aggregation table: defer ke v2 (lihat PRD §10)
- Notifikasi otomatis (email/Discord): defer ke v2 (lihat PRD §12)
