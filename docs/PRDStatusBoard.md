# PRD: StatusBoard

**Versi**: 1.1 (Draft — direvisi setelah riset stack per Juni 2026)
**Tanggal**: 22 Juni 2026
**Owner**: Aji Arlando ([github.com/ajiarl](https://github.com/ajiarl))
**Status**: Belum mulai development

> **Catatan revisi 1.1**: Seluruh stack di bawah sudah diverifikasi ulang terhadap kondisi terkini (Juni 2026) — lihat §6.1 untuk temuan riset dan §13 untuk risiko baru (limit Supabase free tier) yang ditambahkan hasil verifikasi.

---

## 1. Overview

StatusBoard adalah status page sederhana, open source, dan self-hostable untuk memonitor uptime beberapa project sekaligus dalam satu dashboard publik. Dibangun dengan stack yang sengaja mirror **Snip** (Next.js 16 + Drizzle ORM + Supabase Postgres + Tailwind v4 + shadcn/ui + Vercel) supaya pattern, konfigurasi, dan workflow development bisa di-reuse.

Target pemakaian awal: memonitor 5 project live milik sendiri — Snip, SiMagang, Finance Tracker, KosPedia, Portfolio V5 — tapi didesain generic supaya siapa pun bisa self-host untuk monitor project apa pun.

## 2. Problem Statement

Saat develop Snip, sempat ada link "Status" di footer yang akhirnya dihapus karena belum ada halaman status sungguhan. Sekarang ada 5 project live yang masing-masing rentan downtime (cold start serverless, quota habis, database connection limit, dll), tapi tidak ada cara terpusat untuk:

- Tahu kapan salah satu project down, tanpa harus buka satu-satu.
- Menunjukkan riwayat uptime ke pengunjung/recruiter yang melihat portofolio.
- Mencatat & mengomunikasikan insiden (misal: "KosPedia down 14:00–14:20 karena migrasi database") secara transparan.

## 3. Target User

| User | Kebutuhan |
|---|---|
| **Owner (Aji)** | Tambah/hapus monitor, lihat detail check history, buat & update incident post. |
| **Pengunjung publik** (recruiter, teman, pengguna project lain) | Lihat status semua project + uptime % tanpa perlu login. |
| **Self-hoster lain** (kalau ada yang fork) | Deploy ulang StatusBoard untuk project mereka sendiri dengan setup minimal. |

## 4. Goals & Non-Goals

**Goals (MVP)**
- Monitoring uptime otomatis tiap beberapa menit via HTTP check.
- Status page publik yang jelas (ijo/kuning/merah) + uptime % (24 jam/7 hari/30 hari).
- Incident management manual (timeline, multiple update per incident).
- Auth sederhana untuk owner-only actions.
- Mudah di-self-host (env var minimal, tanpa dependency mahal).

**Non-Goals (di luar scope MVP, lihat §11 Roadmap v2)**
- Notifikasi otomatis (email/Discord/Telegram) saat down.
- Multi-user / multi-tenant / role-based access.
- Status page custom theming/branding per pengguna.
- Public API untuk integrasi pihak ketiga.
- Monitoring selain HTTP (TCP port, ping ICMP, SSL expiry check, dll).
- Auto-incident generation dari hasil check (incident tetap manual di MVP).

## 5. Fitur MVP

### 5.1 Monitor Management (owner only)
- Tambah monitor: nama, URL, HTTP method (default `GET`), expected status code (default `200`), interval check (informational saja — interval aktual ditentukan oleh schedule GitHub Actions).
- Edit & hapus monitor.
- Toggle aktif/nonaktif (pause monitoring tanpa hapus data historis).
- List semua monitor di dashboard admin dengan status terkini.

### 5.2 Scheduled Health Check (via GitHub Actions)
- GitHub Actions scheduled workflow (`cron`) jalan tiap 5–15 menit, `curl` ke endpoint `POST /api/cron/check` dengan header secret.
- Endpoint melakukan fetch ke seluruh monitor aktif secara paralel, mencatat: status code, response time (ms), berhasil/gagal, timestamp.
- Hasil check disimpan ke tabel `checks` dan meng-update `current_status` di tabel `monitors` (lihat §7 Down Detection Logic).
- **Catatan keterbatasan GitHub Actions**: jadwal cron tidak dijamin presisi (bisa delay beberapa menit saat traffic GitHub tinggi), dan workflow di repo yang tidak ada commit aktivitas selama 60 hari otomatis di-disable GitHub — perlu reaktivasi manual atau workflow "keep-alive" kecil.

### 5.3 Halaman Status Publik
- List semua monitor aktif + indikator warna (ijo = up, kuning = degraded/slow, merah = down).
- Uptime % per monitor untuk window 24 jam / 7 hari / 30 hari.
- Response time chart sederhana (opsional, kalau waktu cukup — bisa di-defer ke v2 kalau mepet).
- Banner/section "Active Incidents" di atas kalau ada incident yang belum resolved.
- Timeline incident history (resolved) di bawah.
- Tidak butuh login sama sekali.

### 5.4 Incident Management (owner only)
- Buat incident baru: judul, monitor terkait (boleh kosong = global/multi-monitor), severity (minor/major/critical), status awal (investigating).
- Tambah update ke incident yang sudah ada (status berubah: investigating → identified → monitoring → resolved), tiap update punya timestamp + pesan bebas.
- Incident yang belum resolved tampil di banner status page.

### 5.5 Auth (owner only)
- Single owner, password tunggal yang di-hash (bcrypt/argon2), disimpan di env var (`OWNER_PASSWORD_HASH`).
- Login form sederhana → cek password → set httpOnly signed cookie (session, expiry misal 7 hari).
- Cookie signing menggunakan `SESSION_SECRET` (env var, min 32 karakter random string) untuk mencegah tampering.
- Middleware Next.js melindungi route `/admin/*` dan API mutation routes.
- Tidak ada tabel `users` di MVP karena cuma 1 owner — kalau nanti butuh multi-user, baru migrasi ke Supabase Auth (lihat roadmap v2).

## 6. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16 (App Router) | Mirror Snip, reuse pattern |
| ORM | Drizzle ORM | Mirror Snip, type-safe schema |
| Database | Supabase Postgres | Free tier cukup, mirror Snip |
| Styling | Tailwind v4 + shadcn/ui | Mirror Snip |
| Hosting | Vercel | Free tier, mirror Snip |
| Scheduler | GitHub Actions (cron schedule) | Vercel Cron Hobby cuma 1x/hari, GHA gratis & familiar dari CI Snip |
| Auth | Custom — password hash + signed cookie | Self-hosting paling ringan, hindari setup email/SMTP |

### 6.1 Hasil Verifikasi Stack (Juni 2026)

Dicek ulang via web search + Context7 sebelum development dimulai, supaya keputusan stack nggak berbasis asumsi yang udah berubah:

| Komponen | Status per Juni 2026 | Catatan |
|---|---|---|
| Next.js 16 | ✅ Stable (16.2.x) | Pilihan tepat untuk project baru. Node.js 20+ wajib. |
| Tailwind v4 + shadcn/ui | ✅ Matang | Kombinasi ini sudah jadi standar de-facto, sama seperti di Snip. |
| Drizzle ORM | ✅ Sehat, makin solid | Core team di-acqui-hire PlanetScale (Maret 2026), kerja full-time di Drizzle. Tetap pilihan terbaik untuk serverless/edge dibanding Prisma (bundle ~12KB vs ~1.6MB, cold start lebih cepat). |
| Vercel Cron Hobby = 1x/hari | ✅ Terkonfirmasi masih berlaku | Asumsi PRD soal ini benar — keputusan pakai GitHub Actions tetap tepat. |
| **Drizzle + Supabase pooling** | ⚠️ Gotcha teknis | Saat connect ke Supabase connection pooler mode **Transaction**, **wajib** set `prepare: false` di client `postgres-js` — prepared statements tidak didukung di mode ini. Gampang kelewat saat nulis `/api/cron/check`. |
| **GitHub Actions timing** | ⚠️ Realistis, bukan presisi | Delay eksekusi 10–30 menit umum terjadi (kadang lebih saat traffic GitHub tinggi). Target interval "5–15 menit" harus didokumentasikan sebagai estimasi, bukan garansi. |
| **GitHub Actions 60-hari (koreksi)** | ⚠️ Mitigasi PRD v1.0 kurang tepat | Workflow scheduled yang **jalan terus** (tiap 5–15 menit) **TIDAK otomatis mencegah auto-disable** — GitHub cuma menghitung commit/PR/issue baru sebagai "activity", bukan eksekusi scheduled workflow itu sendiri. Perlu workflow keep-alive eksplisit (dummy commit berkala) — lihat §13. Catatan plus: kalau repo public (sesuai rencana open source), GitHub Actions minutes unlimited. |
| **Supabase free tier** | 🆕 Belum ada di v1.0 | Free org dibatasi **2 active project**, dan project di-pause otomatis setelah **7 hari tanpa database activity**. Detail dampak & mitigasi di §7 dan §13. |



## 7. Down Detection Logic

- Tiap check dicatat sebagai `up` atau `down` berdasarkan: response sukses (2xx, atau sesuai `expected_status`) dalam batas timeout (misal 10 detik).
- **Status monitor baru berubah jadi `down` setelah 2 check gagal berturut-turut** — bukan 1x gagal langsung down. Tujuannya menghindari false positive dari network blip / cold start sesaat.
- Status `degraded`: response sukses tapi response time melebihi threshold (>3 detik). Ini membantu identifikasi masalah performa sebelum service benar-benar down.
- `current_status` di tabel `monitors` di-cache supaya halaman publik tidak perlu agregasi berat tiap load.
- Uptime % dihitung dari rasio check `up` terhadap total check dalam window waktu tertentu.
- **Catatan penting (hasil riset Juni 2026)**: project yang dimonitor (Snip, KosPedia, dst) yang juga pakai Supabase free tier bisa **otomatis di-pause Supabase setelah 7 hari tanpa database activity** — ini beda dari downtime beneran, tapi efeknya sama: request ke project tersebut bisa gagal/lambat. StatusBoard sendiri **tidak terdampak** masalah ini karena cron check tiap 5–15 menit menulis ke tabel `checks`, yang otomatis terhitung sebagai database activity. Saat bikin incident post untuk kasus seperti ini, cek dulu apakah down-nya karena Supabase pause (bukan insiden teknis beneran) sebelum nulis root cause.

## 8. Arsitektur

```
┌─────────────────────┐      cron (5–15 menit)      ┌──────────────────────────┐
│ GitHub Actions       │ ───────────────────────────▶│ POST /api/cron/check      │
│ scheduled workflow   │   header: X-Cron-Secret      │ (Next.js Route Handler)  │
└─────────────────────┘                              └────────────┬─────────────┘
                                                                    │ fetch tiap monitor aktif
                                                                    ▼
                                                       ┌──────────────────────────┐
                                                       │ Supabase Postgres         │
                                                       │ (monitors, checks,        │
                                                       │  incidents, updates)      │
                                                       └────────────┬─────────────┘
                                                                    │ server-side query (Drizzle)
                                  ┌─────────────────────────────────┼─────────────────────────────┐
                                  ▼                                                                 ▼
                    ┌───────────────────────────┐                                  ┌───────────────────────────┐
                    │ Halaman Publik (/)         │                                  │ Dashboard Admin (/admin)   │
                    │ Server Component, no auth  │                                  │ Protected by cookie session│
                    └───────────────────────────┘                                  └───────────────────────────┘
```

## 9. Database Schema (Drizzle)

```ts
// monitors
export const monitors = pgTable("monitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull().default("GET"),
  expectedStatus: integer("expected_status").notNull().default(200),
  isActive: boolean("is_active").notNull().default(true),
  currentStatus: text("current_status").notNull().default("unknown"), // up | down | degraded | unknown
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// checks (history mentah, dibersihkan berkala — lihat §10 Retention)
export const checks = pgTable("checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // up | down
  statusCode: integer("status_code"),
  responseTimeMs: integer("response_time_ms"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

// incidents
export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id").references(() => monitors.id, { onDelete: "set null" }), // null = global
  title: text("title").notNull(),
  severity: text("severity").notNull().default("minor"), // minor | major | critical
  status: text("status").notNull().default("investigating"), // investigating | identified | monitoring | resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// incident_updates
export const incidentUpdates = pgTable("incident_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

*(Catatan: enum di atas ditulis sebagai `text` + convention, bukan Postgres `enum` type, biar lebih gampang nambah value baru tanpa migration — sesuaikan kalau mau pakai `pgEnum` Drizzle.)*

## 10. Data Retention

GitHub Actions check tiap 5–15 menit → bisa ~100–300 baris/hari per monitor. Dengan 5 monitor, dalam 30 hari bisa puluhan ribu baris di tabel `checks`. Masih aman untuk Supabase free tier, tapi disarankan:
- Simpan raw `checks` selama 30–45 hari.
- (v2, opsional) agregasi harian ke tabel `daily_uptime_stats` untuk histori jangka panjang tanpa nyimpen semua raw data selamanya.
- Cleanup job bisa nebeng di endpoint cron yang sama (hapus checks lebih lama dari N hari) atau workflow GitHub Actions terpisah yang jalan harian.

## 11. Security Considerations

- Endpoint `/api/cron/check` wajib divalidasi pakai secret header (`X-Cron-Secret`), disimpan di GitHub Actions secrets & Vercel env — bukan endpoint publik tanpa proteksi.
- Validasi URL monitor saat ditambahkan: blokir `localhost`, IP private (`10.x`, `192.168.x`, `127.0.0.1`, dst) untuk mencegah SSRF, meskipun risiko relatif rendah karena cuma owner yang bisa nambah monitor.
- Password owner di-hash (bukan plaintext) walau hanya disimpan sebagai env var.
- Rate limiting di route login untuk cegah brute force.
- Semua mutation route (`POST/PATCH/DELETE`) wajib cek session cookie valid.

## 12. Out of Scope / Roadmap v2

- Notifikasi otomatis: email (perlu Resend/SMTP) atau webhook Discord/Telegram saat status berubah.
- Multi-user dengan role, migrasi ke Supabase Auth kalau dibutuhkan.
- Public API (`GET /api/status.json`) untuk integrasi badge/widget ke project lain.
- SSL certificate expiry monitoring.
- Maintenance window scheduling (biar check di-skip saat maintenance terjadwal, bukan ditandai down).
- Status page theming per instance (logo, warna custom).

## 13. Open Risks

| Risiko | Mitigasi |
|---|---|
| GitHub Actions cron delay / repo idle 60 hari ke-disable | Dokumentasikan di README; **workflow keep-alive eksplisit** yang bikin dummy commit berkala — eksekusi scheduled workflow itu sendiri TIDAK terhitung sebagai "activity" oleh GitHub, jadi cron check yang jalan terus tetap perlu keep-alive terpisah |
| False positive down karena cold start serverless target | Threshold 2x gagal berturut-turut + timeout yang reasonable (10 detik) |
| Volume data `checks` membengkak | Retention policy §10 |
| SSRF dari URL monitor jahat | Validasi URL §11 (meski risiko rendah, single-owner) |
| **Supabase free tier dibatasi 2 active project per org** | Pakai akun/org Supabase terpisah dari yang sudah dipakai project lain (Snip, KosPedia), atau upgrade ke Pro ($25/bulan) kalau mau satu org. **Wajib didokumentasikan di README** untuk self-hoster lain yang mungkin cuma punya 1 akun Supabase dengan slot sudah penuh. |
| **Supabase free tier auto-pause project yang dimonitor setelah 7 hari idle** | Bukan bug StatusBoard — tapi bisa bikin status "down" yang sebenarnya bukan insiden teknis. Cek dulu sebelum nulis incident post (lihat §7) |

## 14. Next Steps

1. Review & approve PRD ini.
2. Setup project skeleton (mirror struktur Snip): Next.js 16 + Drizzle + Supabase + Tailwind v4 + shadcn/ui. **Gunakan akun/org Supabase yang belum kepakai 2 slot free-nya** (lihat §13).
3. Implement schema + migration.
4. Implement auth (password hash + session).
5. Implement monitor CRUD (admin).
6. Implement `/api/cron/check` endpoint + GitHub Actions workflow.
7. Implement halaman status publik.
8. Implement incident management.
9. Audit menyeluruh (security, performance, accessibility, SEO) — sama kayak yang dilakuin ke Snip.
10. Deploy ke Vercel.

**Rekomendasi pembagian model Antigravity per tahap:**

| Tahap | Rekomendasi Model | Alasan |
|---|---|---|
| Schema design + migration | Sonnet/Opus | Struktur data jadi fondasi, salah desain di sini mahal diperbaiki belakangan |
| Auth (password hash, session, middleware) | Sonnet/Opus | Security-critical |
| Monitor CRUD (admin UI + API) | Gemini | Volume kerjaan standar, pola CRUD yang sudah familiar dari project lain |
| `/api/cron/check` + GitHub Actions workflow | Sonnet/Opus | Logic down-detection & secret handling perlu presisi |
| Halaman status publik (UI) | Gemini | Mostly UI/styling, volume besar, low logic-risk |
| Incident management (UI + API) | Gemini, dengan review Sonnet sebelum merge | CRUD standar, tapi state machine status incident ada baiknya di-review |
| Audit akhir (security/perf/a11y/SEO) | Sonnet/Opus | Sama seperti audit Snip — butuh ketelitian tinggi |