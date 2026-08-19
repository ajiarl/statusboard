# Project State

Kilo Code WAJIB baca file ini di awal setiap sesi, dan update bagian yang relevan
di akhir setiap sesi (pindahkan task dari "In Progress" ke "Done", atau ke
"Butuh Review Manusia" kalau verifikasi gagal 3x).

## Next
<!-- Tambahkan task baru di sini, satu baris per task, checklist format -->
### Continuous — UX Improvement (Loading & Error States)

### Continuous — Edge Case & Error Handling


## In Progress
<!-- Kilo pindahkan task ke sini saat mulai kerja -->

## Done (7 hari terakhir)
<!-- Kilo pindahkan ke sini setelah verifier lulus. Sertakan tanggal. -->
- [x] Buat `lib/ssrf.ts` — fungsi `isPrivateUrl(url)` (2026-08-19)
- [x] Buat `lib/check.ts` — fungsi `checkMonitor(monitor)` (2026-08-19)
- [x] Buat `app/api/cron/check/route.ts` — cron handler + down detection (2026-08-19)
- [x] Implementasi down detection logic: consecutiveFailures >= 2 (2026-08-19)
- [x] Tambah cleanup job di cron: hapus checks > 45 hari (2026-08-19)
- [x] Buat `app/api/monitors/route.ts` — GET + POST (SSRF validation) (2026-08-19)
- [x] Buat `app/api/monitors/[id]/route.ts` — PATCH + DELETE (2026-08-19)
- [x] Buat `app/admin/layout.tsx` — navigasi + logout (2026-08-20)
- [x] Buat `app/admin/page.tsx` — dashboard monitor list (2026-08-20)
- [x] Buat `app/admin/monitors/new/page.tsx` — form tambah monitor (2026-08-20)
- [x] Buat `app/admin/monitors/[id]/edit/page.tsx` — form edit monitor (2026-08-20)
- [x] Buat `lib/uptime.ts` — calculateUptime (2026-08-20)
- [x] Rewrite `app/page.tsx` — public status page with banner, uptime, incidents (2026-08-20)
- [x] Buat `app/api/incidents/route.ts` — GET + POST (2026-08-20)
- [x] Buat `app/api/incidents/[id]/route.ts` — PATCH (2026-08-20)
- [x] Buat `app/api/incidents/[id]/updates/route.ts` — GET + POST (2026-08-20)
- [x] Buat `app/admin/incidents/page.tsx` — list incidents (2026-08-20)
- [x] Buat `app/admin/incidents/new/page.tsx` — form buat incident (2026-08-20)
- [x] Buat `app/admin/incidents/[id]/page.tsx` — detail + timeline + updates (2026-08-20)
- [x] Buat `.github/workflows/cron.yml` — schedule tiap 10 menit (2026-08-20)
- [x] Buat `.github/workflows/keep-alive.yml` — dummy commit tiap Senin (2026-08-20)
- [x] Design Conformance: globals.css + root layout (Inter + JetBrains Mono, design tokens) (2026-08-20)
- [x] Design Conformance: admin layout → sidebar nav sesuai referensi (2026-08-20)
- [x] Design Conformance: login page → cocok referensi statusboard_masuk (2026-08-20)
- [x] Design Conformance: public status page → card blocks, uptime pills, timeline (2026-08-20)
- [x] Design Conformance: admin monitor list → table grid layout (2026-08-20)
- [x] Design Conformance: admin new monitor → form sesuai referensi (2026-08-20)
- [x] Design Conformance: admin edit monitor → form matching (2026-08-20)
- [x] Design Conformance: admin incidents list → table + stats bento grid (2026-08-20)
- [x] Design Conformance: admin incident detail → timeline + update form (2026-08-20)
- [x] Design Conformance: admin new incident → form sesuai referensi (2026-08-20)
- [x] Hardening `lib/ssrf.ts` — IPv6-mapped IPv4, block 0.0.0.0 (2026-08-20)
- [x] Hardening `lib/ssrf.ts` — alternate IP encodings block (hex, octal, decimal) (2026-08-20)
- [x] Hardening `lib/check.ts` — manual redirect following + hop validation (2026-08-20)
- [x] Hardening: wrap body parsing and DB operations in try/catch across all 5 API routes (2026-08-20)
- [x] Hardening: validate UUID path/body parameters in API routes (2026-08-20)
- [x] Accessibility: add role="alert" to all admin form error messages (2026-08-20)
- [x] Accessibility: add ARIA properties (role="switch", aria-checked, role="dialog") to admin page (2026-08-20)
- [x] Responsive: show action buttons and hide low-priority columns on mobile in incident list page (2026-08-20)
- [x] UX: add premium animated Tailwind CSS pulse loading skeletons to all admin pages (2026-08-20)
- [x] UX: handle mount fetch failures by displaying error banner with retry/back actions in admin monitors/incidents pages (2026-08-20)
- [x] Hardening: wrap cron check API route database operations in try/catch to return 500 error on failures (2026-08-20)

## Butuh Review Manusia
<!-- Kilo pindahkan ke sini kalau verifier gagal 3x berturut-turut.
     WAJIB sertakan: apa yang dicoba, kenapa gagal, dan error terakhir. -->
### Task manual (butuh akses GitHub/Vercel settings):
- [ ] Set GitHub repo secrets: `APP_URL` + `X_CRON_SECRET`
- [ ] Connect repo ke Vercel, set env vars (DATABASE_URL, SESSION_SECRET, OWNER_PASSWORD_HASH, X_CRON_SECRET)
- [ ] Generate `OWNER_PASSWORD_HASH` dengan bcryptjs dan simpan di Vercel env
- [ ] Verifikasi build pass di Vercel
- [ ] Test end-to-end: login admin → tambah monitor → trigger cron → cek data → status page update
- [ ] Update `APP_URL` secret di GitHub Actions ke Vercel production URL
