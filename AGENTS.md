# AGENTS.md — Konteks Penting Project StatusBoard

## Scope — PENTING

- **Project ini adalah StatusBoard, BUKAN Snip.** Kalau folder ini dibuka
  bersebelahan dengan project lain (Snip, KosPedia, SiMagang, dst) di
  bawah parent directory yang sama (misal `~/Proyek/`), **JANGAN baca,
  edit, atau jalankan command apa pun di luar folder `StatusBoard/` ini**
  kecuali diminta secara eksplisit dan jelas dalam prompt.
- Kalau prompt menyebut "samain pattern kayak di Snip" atau referensi
  serupa, itu maksudnya **liat/contek isi file Snip sebagai referensi
  read-only**, lalu tulis hasilnya di sini (StatusBoard) — bukan ngedit
  file di folder Snip.
- Semua perubahan, commit, dan eksekusi command harus terjadi **di dalam
  folder StatusBoard saja**. Kalau ada ambiguitas soal folder mana yang
  dimaksud, berhenti dan tanya dulu sebelum eksekusi.

- **Tidak ada `src/` directory secara sengaja** — `app/`, `components/`, `lib/`
  ada di root, mirror konvensi project Snip biar pattern bisa di-reuse.
  Jangan disuruh restructure ke `src/`.
- **`proxy.ts` (BUKAN `middleware.ts`)** kalau dipakai — Next.js 16 resmi
  me-rename `middleware.ts` jadi `proxy.ts` (fungsi export jadi `proxy()`,
  bukan `middleware()`). Sama seperti di Snip.
- **Scheduler PAKAI GitHub Actions, BUKAN Vercel Cron bawaan** — ini
  keputusan sengaja, bukan kelupaan migrasi. Vercel Cron di tier Hobby
  cuma bisa jalan 1x/hari, kelewat jarang buat uptime check. Jangan
  disuruh "simplify" dengan migrasi balik ke `vercel.json` crons.
- **GitHub Actions workflow check (`/api/cron/check`) jalan tiap 5–15
  menit TAPI ini TIDAK mencegah auto-disable 60 hari** — GitHub cuma
  menghitung commit/PR/issue baru sebagai "activity", bukan eksekusi
  scheduled workflow itu sendiri. Harus ada workflow keep-alive terpisah
  (dummy commit berkala). Jangan dihapus dengan asumsi "udah redundant
  karena cron check-nya jalan terus".
- **Drizzle + Supabase pakai connection pooler mode Transaction** — WAJIB
  `prepare: false` di client `postgres-js`. Ini bukan leftover debug code,
  prepared statements memang tidak didukung di mode pooling ini. Jangan
  dihapus.
- **`X-Cron-Secret` header check di `/api/cron/check` itu wajib ada** —
  endpoint ini publicly reachable URL-nya, validasi secret bukan optional
  middleware yang bisa disederhanakan/dihapus pas refactor.
- **Down detection pakai threshold 2x gagal berturut-turut**, bukan 1x
  gagal langsung `down` — sengaja untuk menghindari false positive dari
  network blip / cold start sesaat. Jangan diubah ke "langsung down pas
  gagal pertama" meskipun itu terlihat lebih simple.
- **Validasi URL monitor wajib blokir localhost & private IP range**
  (`10.x`, `192.168.x`, `127.0.0.1`, dst) saat owner nambah monitor baru —
  ini mitigasi SSRF, bukan validasi yang bisa di-relax meskipun cuma
  single-owner yang bisa nambah monitor.
- **Auth sengaja single-owner** — password hash (bcrypt/argon2) di env var
  `OWNER_PASSWORD_HASH`, signed httpOnly cookie, TIDAK ada tabel `users`.
  Cookie signing pakai `iron-session` dengan `SESSION_SECRET` (min 32
  karakter random string). Ini bukan technical debt yang perlu "diperbaiki"
  jadi multi-user atau migrasi ke Supabase Auth — itu sengaja di luar scope
  MVP (lihat PRD §12 Roadmap v2). Jangan diusulkan kecuali memang diminta.
- **Halaman status publik (`/`) TIDAK butuh auth sama sekali** — ini
  sengaja, bukan lupa proteksi. Yang wajib di-protect cuma `/admin/*` dan
  API mutation routes (`POST`/`PATCH`/`DELETE`).
- **Project ini TIDAK menggunakan Supabase project yang sama dengan Snip
  atau KosPedia** — beda akun Supabase. Jangan asumsikan connection
  string atau project ID bisa di-share antar project.
- **Jika sebuah monitor menunjukkan status `down` dan target-nya juga
  pakai Supabase free tier**, kemungkinan itu bukan insiden teknis
  beneran — Supabase auto-pause project setelah 7 hari tanpa database
  activity. Cek dulu sebelum nulis incident post dengan root cause yang
  salah.
- **Retention `checks` table 30–45 hari itu sengaja** (lihat PRD §10) —
  cleanup job menghapus data lama secara rutin. Jangan dianggap bug kalau
  tabel `checks` cuma berisi data beberapa minggu terakhir.
- **Stack: Next.js 16 + Drizzle ORM + Supabase Postgres + Tailwind v4 +
  shadcn/ui + Vercel** — sudah diverifikasi cocok per Juni 2026, jangan
  diusulkan ganti ORM/framework tanpa diskusi eksplisit.