# AGENTS.md — Konteks Penting Project StatusBoard

## Project Context
StatusBoard adalah platform status page sederhana, open source, dan self-hostable untuk memonitor uptime dan incident management beberapa project live sekaligus (Snip, SiMagang, Finance Tracker, KosPedia, dll) dalam satu dashboard publik yang terpercaya dan terdesentralisasi.
- **Problem Statement:** Memonitor 5+ project live yang rentan cold-start atau downtime tanpa harus mengecek manual satu per satu, serta menyediakan transparansi riwayat uptime dan incident log untuk publik dan recruiter.
- **Target User:** Owner/Admin (Aji) untuk manajemen monitor dan incident; Pengunjung publik/recruiter untuk melihat real-time health status tanpa login.
- **Current Milestone:** Redesign UI/UX Public Status Page (`/`) sesuai spesifikasi `docs/REDESIGN_BRIEF.md` (Modern Infrastructure Zinc Dark, 90-day Heartbeat Bars, Latency Metrics, Incident Timeline).

---

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Runtime & UI:** React 19, Tailwind CSS v4, Lucide React
- **Database & ORM:** PostgreSQL (Supabase managed), Drizzle ORM (`postgres-js` driver)
- **Auth:** `iron-session` (stateless encrypted cookie session, single-owner password hash)
- **Deployment & Scheduler:** Vercel (Hosting), GitHub Actions (`curl` scheduled cron runner)

---

## Architecture & Technical Decisions

- **Scope Direktori:** Semua perubahan, commit, dan eksekusi command harus terjadi di dalam folder `statusboard/` saja. JANGAN BACA, EDIT, ATAU RUN COMMAND DI LUAR FOLDER INI.
- **Struktur Folder:** Tidak ada direktori `src/` secara sengaja. `app/`, `components/`, `lib/` berada di root untuk konsistensi konvensi project.
- **Next.js Conventions:** Jika membutuhkan middleware, gunakan konvensi Next.js 16 (`proxy.ts`, bukan `middleware.ts`).
- **Scheduler:** Health check dijalankan via GitHub Actions workflow berkala ke endpoint `POST /api/cron/check` dengan validasi secret header `X-Cron-Secret`. Vercel Cron tidak dipakai karena limitasi interval 1x/hari pada tier Hobby.
- **Drizzle + Supabase Connection Pooling:** Mode Transaction connection pooler WAJIB menyertakan `prepare: false` pada client `postgres-js`. Prepared statements tidak didukung di mode ini.
- **Down Detection Logic:** Menggunakan threshold 2x gagal berturut-turut (`consecutiveFailures >= 2`) untuk mencegah false positive dari cold-start atau network blip sesaat.
- **SSRF Mitigation:** Validasi URL monitor wajib memblokir localhost dan private IP ranges (`127.0.0.1`, `10.x`, `192.168.x`, `172.16-31.x`).
- **Single-Owner Auth:** Password hash di env `OWNER_PASSWORD_HASH`, signed cookie via `iron-session` dengan `SESSION_SECRET`. Tidak ada tabel `users`.
- **Public Access:** Route publik (`/`) tidak memerlukan autentikasi sama sekali. Autentikasi hanya melindungi `/admin/*` dan API mutasi data.
- **Database Retention:** Data tabel `checks` dirancang dengan retensi 30–45 hari dengan pembersihan berkala.

---

## Decisions & Skip Reasons

### Non-Negotiable Checklist
- [x] **Problem statement & MVP scope terdefinisi jelas:** Terdokumentasi lengkap di PRD dan `docs/REDESIGN_BRIEF.md`.
- [x] **User flow selesai sebelum mulai ngoding:** Alur public visitor (status check & incident history) dan admin flow (auth, monitor CRUD, incident management) sudah dipetakan.
- [x] **Stack decision dengan alasan:** Next.js 16 + React 19 + Tailwind v4 + Drizzle ORM + Supabase Postgres dipilih untuk portabilitas, performa modern, dan kompatibilitas ekosistem.
- [x] **AGENTS.md dibuat di root repo sebelum Koda pertama spawn:** Dokumen ini aktif dan menjadi acuan utama dev agent.
- [x] **Auth strategy defined:** Single-owner admin authentication menggunakan `iron-session` cookie berbasis environment secret; halaman publik murni read-only tanpa autentikasi.
- [x] **Authorization check per endpoint:** Seluruh endpoint mutasi (`/api/monitors/*`, `/api/incidents/*`) memvalidasi session owner, dan endpoint cron memvalidasi header secret `X-Cron-Secret`.
- [x] **RLS Supabase dikonfigurasi:** Akses database dilakukan server-side melalui pooled connection driver dengan credential server aman, tanpa paparan client-side Supabase anon key.
- [x] **Global error handler:** Menggunakan standard Next.js error boundary pada UI dan generic try/catch wrapper pada seluruh API routes untuk mencegah kebocoran stack trace mentah ke client.
- [x] **Environment variables di .env, tidak di-commit ke git:** Seluruh credentials (`DATABASE_URL`, `SESSION_SECRET`, `OWNER_PASSWORD_HASH`, `CRON_SECRET`) diisolasi di `.env` lokal.
- [x] **README minimal:** Menyediakan petunjuk setup env vars dan cara menjalankan development server lokal.

### Optional Checklist (Explicit Skip Reasons)
- [ ] **Rate limiting** — alasan skip: Sistem single-tenant private dengan hanya satu admin yang authenticated dan endpoint publik read-only dengan traffic portofolio rendah, belum membutuhkan Redis/Upstash rate limiting di fase ini.
- [ ] **CI/CD pipeline** — alasan skip: Deployment menggunakan auto-deploy Vercel Git integration langsung dari push branch main, tidak membutuhkan GitHub Actions pipeline terpisah untuk build.
- [ ] **Staging environment** — alasan skip: Project portofolio personal solo developer dengan volume user terbatas, verifikasi dilakukan di local development sebelum deploy ke production Vercel.
- [ ] **Unit tests logic kritis** — alasan skip: Verifikasi fungsionalitas monitoring dan kalkulasi uptime divalidasi via sanity checks end-to-end dan manual check suite pada local development.
- [ ] **WAF/DDoS protection** — alasan skip: Endpoint dilindungi proteksi layer dasar bawaan Vercel Edge Network dan validasi SSRF internal di server-side, WAF khusus belum diperlukan untuk skala portofolio.
- [ ] **Advanced error monitoring (Sentry)** — alasan skip: Logging error server-side ditangani oleh Vercel runtime logs dan Next.js standard logger internal untuk menjaga arsitektur tetap lean tanpa third-party monitoring agent.
- [ ] **Database backup strategy** — alasan skip: Database PostgreSQL memanfaatkan fitur automatic daily backups bawaan dari Supabase managed database tier.
- [ ] **Statement of Work (freelance)** — alasan skip: StatusBoard adalah project mandiri personal untuk monitoring portofolio sendiri, bukan project komersial client atau freelance.

---

## Constraints untuk Koda

1. **Workspace Scope:**
   - Eksekusi HANYA di dalam folder StatusBoard yang diberikan di worktree.
   - Jangan menyentuh file di luar direktori project.
2. **Approval Gates (STOP - Jangan Eksekusi Tanpa Approval Sena):**
   - Install dependency baru (`package.json`) kecuali yang sudah disetujui dalam task spec (misal `lucide-react`).
   - Perubahan schema database / migrasi Drizzle (`schema.ts`).
   - Menghapus data atau file yang sudah ada.
   - Menyentuh `.env`, `.env.local`, credentials, atau secret keys.
3. **Loop & Verification Protocol:**
   - Lakukan verification mandiri (`npm run build` atau typecheck) sebelum menandai task selesai.
   - Jangan menyembunyikan warning atau error.
4. **Report Format (Medium):**
   Kirimkan laporan penyelesaian task ke kanban comment dan notifikasi Telegram `@senaAssisBot` dengan format:
   ```
   Task: [nama task]
   Status: Done / Blocked
   Branch: [nama branch]
   Changes:
     - [file/folder] — [ringkasan perubahan]
   Test:
     - [command verifikasi] — [pass/fail]
   Notes:
     - [catatan implementasi untuk Sena]
   ```

---

## Definition of Done per Task
- [ ] Implementasi kode memenuhi Acceptance Criteria dari task spec.
- [ ] Styling dan komponen mematuhi pedoman visual di `docs/REDESIGN_BRIEF.md`.
- [ ] Build Next.js (`npm run build` atau `npx tsc --noEmit`) berhasil tanpa error typescript / linting blocking.
- [ ] Sanity check lokal memastikan halaman render dengan benar (termasuk saat menggunakan fallback mock data).
- [ ] Laporan medium terkirim lengkap ke kanban comment.
