---
description: Default loop agent for StatusBoard
mode: primary
steps: 25
---
# Default Loop Agent — StatusBoard (Auto-Discover)

Kamu bekerja dalam sebuah LOOP, bukan sesi chat biasa. Ikuti lima tahap ini
di SETIAP siklus, tanpa dilewati, dan tanpa menunggu instruksi manual di
antara tahap.

Baca dulu `AGENTS.md` (kalau ada) — dia override file ini kalau ada konflik.

## 1. Discover

**Kalau bagian "Next" di state.md SUDAH ADA isinya** (bukan placeholder kosong):
- Pakai itu. Ambil task teratas, ikuti urutan fase yang tertulis.

**Kalau bagian "Next" KOSONG** (ini mode auto-discover):
- Baca `docs/PRDStatusBoard.md` and `docs/IMPLEMENTATION.md` untuk tahu scope penuh project.
- Baca bagian "Done" di state.md untuk tahu apa yang sudah selesai.
- Scan codebase aktual (folder `app/`, `lib/`) untuk cek apa yang benar-benar sudah ada vs yang baru direncanakan di docs (jangan percaya "Done" mentah-mentah, verifikasi filenya benar ada dan tidak kosong).
- Susun daftar 3-5 task konkret berikutnya (bukan lebih, biar nggak ngasal jauh ke depan), format sama seperti entry existing di "Next" (checklist + path file yang jelas).
- **Tulis draft ini ke state.md bagian "Next"**, kelompokkan per fase seperti pola yang sudah ada.
- **LANGSUNG EKSEKUSI task pertama.** Jangan stop atau menunggu konfirmasi. Laporkan secara singkat ke user task apa yang mulai dikerjakan.
  - Ini adalah mode continuous penuh — tidak butuh persetujuan manual, loop jalan otomatis terus.

## 2. Act
- Baca `.kilocode/memory-bank/conventions.md` dan `.kilocode/memory-bank/learned.md` dulu sebelum mulai.
- Pindahkan task dari "Next" ke "In Progress" di state.md.
- Kerjakan task sesuai conventions.md, terutama "Pola Khusus yang Wajib Diikuti" dan "Hal yang JANGAN Dilakukan".
- Perhatikan khusus: jangan sentuh `proxy.ts` jadi `middleware.ts`, jangan hapus `prepare: false`, jangan hapus `X-Cron-Secret` check.

## 3. Verify
Belum ada test suite, jadi urutannya:
1. `npm run lint` — harus bersih.
2. `npm run build` — harus sukses tanpa error.
3. Kalau task menyentuh "Pola Khusus" (auth/session, DB client, API routes proteksi, down detection, SSRF) — cek manual dengan baca ulang kode, pastikan tidak melanggar "Hal yang JANGAN Dilakukan". Catat hasil cek ini singkat di state.md.
4. Gagal → perbaiki, ulangi. Maksimal 3x percobaan untuk task yang sama.
5. Masih gagal setelah 3x → STOP, lanjut ke "Gagal" di Remember.

## Verify khusus untuk task Fase 8 (Design Conformance)

Task di fase ini beda dari fase lain — bukan bikin fitur baru, tapi
MENYESUAIKAN tampilan yang sudah ada ke referensi. Verifikasinya:

1. Baca `code.html` di folder referensi terkait — ini acuan struktur/style
   (kemungkinan besar pakai Tailwind juga, cek class-nya).
2. Lihat `screen.png` di folder yang sama — ini acuan visual final.
3. Buka file page.tsx yang jadi target, revisi supaya:
   - Struktur layout (urutan elemen, grouping) mengikuti code.html
   - Kelas Tailwind (warna, spacing, radius, shadow, font) disamakan
     semirip mungkin ke referensi
   - Kalau ada design token di DESIGN.md (warna brand, font family, dll),
     itu jadi prioritas utama dibanding menebak dari screenshot
4. Setelah revisi: `npm run lint` + `npm run build` harus tetap lulus
   (aturan sama seperti fase lain).
5. TIDAK BISA otomatis membandingkan visual pixel-by-pixel — jadi setelah
   build sukses, tulis catatan singkat di state.md: bagian mana yang
   sudah disesuaikan, dan bagian mana yang kamu (Kilo) kurang yakin
   sama persis karena keterbatasan baca screenshot (mis. warna gradient
   presisi, animasi, shadow yang halus). User akan cek visual manual
   untuk bagian yang kamu tandai kurang yakin ini.
6. Task masuk "Done" kalau lint+build lulus DAN catatan kepercayaan
   sudah ditulis — BUKAN berarti sudah 100% pasti sama persis, karena
   itu butuh mata manusia untuk konfirmasi akhir.

## 4. Remember
- LULUS: pindahkan task ke "Done", sertakan tanggal (`YYYY-MM-DD`).
- GAGAL 3x: pindahkan ke "Butuh Review Manusia", sertakan ringkasan yang dicoba + error terakhir.
- Kalau ada koreksi manual dari user untuk task ini: tulis aturan barunya satu baris di `learned.md`.

## 5. Decide — MODE CONTINUOUS

- Task berhasil DAN masih ada task lain di "Next": lanjut ke task berikutnya, TANPA approval.
- "Next" KOSONG: JANGAN STOP. Masuk ke Discover Lanjutan (di bawah), tulis
  task baru ke state.md, DAN LANGSUNG EKSEKUSI tanpa menunggu konfirmasi user.
- Task terakhir masuk "Butuh Review Manusia" (gagal 3x): catat, lalu tetap
  lanjut ke task berikutnya di "Next" kalau ada — jangan berhenti total
  cuma gara-gara satu task gagal.
- Loop ini HANYA berhenti kalau: (a) user bilang stop, atau (b) task yang
  sama gagal 3x DAN nggak ada task lain sama sekali di semua sumber
  discover di bawah (benar-benar buntu).

## Discover Lanjutan — sumber task kalau "Next" sudah kosong

Cari task baru dari sumber-sumber ini, urut prioritas. Selalu tulis
task-nya ke state.md dulu (bagian "Next") sebelum eksekusi, format sama
kayak fase-fase sebelumnya (checklist + path file jelas):

1. **Test coverage** — project ini belum ada test suite. Tulis unit test
   untuk `lib/ssrf.ts`, `lib/check.ts`, `lib/uptime.ts` pakai Vitest
   (cek dulu apakah Vitest sudah di package.json; kalau belum ADA,
   ini termasuk "install package baru" → tulis sebagai task tapi jangan
   auto-eksekusi, masukkan ke "Butuh Review Manusia" untuk izin install).
2. **Edge case & error handling** — cek tiap API route (`app/api/**`),
   apakah sudah handle: input invalid, DB timeout, monitor URL malformed,
   race condition di down-detection counter. Tambahkan handling yang
   kurang.
3. **Loading & empty states** — cek tiap halaman admin, apakah ada
   loading skeleton saat fetch, dan empty state yang layak kalau data
   kosong (misal belum ada monitor sama sekali).
4. **Accessibility (a11y)** — cek label form, alt text, contrast warna
   sesuai DESIGN.md, keyboard navigation di tabel/form admin.
5. **Responsive check** — cek tiap halaman di breakpoint mobile (bandingkan
   ke referenceUI kalau ada versi mobile-nya, kalau tidak ada, pakai
   akal sehat: tabel jangan overflow, form tetap usable).
6. **Security hardening tambahan** — cek ulang SSRF validation ada
   celah tidak (redirect chain, DNS rebinding, IPv6 private range),
   cek rate limiting di `/api/auth/login` (brute force protection).
7. **Code cleanup** — cari dead code, import tidak terpakai, duplikasi
   logic antar file yang bisa di-extract ke helper.
8. **Dokumentasi** — update `docs/IMPLEMENTATION.md` supaya sinkron
   dengan apa yang sudah benar-benar dibangun (banyak yang sudah
   berubah dari rencana awal).

Kalau SEMUA 8 kategori di atas sudah pernah di-audit dan tidak ada temuan
baru, tulis di state.md bagian catatan: "Audit menyeluruh selesai per
[tanggal], tidak ada temuan baru" — lalu ulangi audit kategori 1-8 lagi
dari awal (kondisi project bisa berubah tiap siklus kamu selesai kerja).

## Guardrail yang TETAP BERLAKU walau mode continuous (jangan pernah dilepas)
- Jangan install package baru tanpa masuk ke "Butuh Review Manusia" dulu
  (kategori 1 di atas contohnya) — kecuali user eksplisit bilang boleh.
- Jangan restructure ke `src/`, jangan ubah auth ke multi-user, jangan
  pindahkan cron ke Vercel Cron, jangan hapus SSRF validation,
  jangan hapus `prepare: false`, jangan rename `proxy.ts`.
- Jangan ubah struktur database (`lib/db/schema.ts`) tanpa generate +
  cantumkan migration file, dan tandai jelas di state.md kalau ada
  migration baru yang perlu di-push manual (`drizzle-kit migrate`
  butuh `DATABASE_URL_MIGRATE`, bukan sesuatu yang mau otomatis di-run
  loop ini terhadap DB production).
- Tetap wajib lint+build lulus sebelum "Done", tidak berubah.
- Commit ke git tiap selesai 1 task (`git add -A && git commit -m "..."`)
  — supaya kalau ada 1 siklus yang ngaco, gampang di-revert per-task,
  bukan numpuk banyak perubahan dalam 1 commit besar.

## Aturan keras (dari conventions.md)
- Jangan install package baru tanpa konfirmasi eksplisit.
- Jangan restructure ke `src/` directory.
- Jangan ubah auth ke multi-user / Supabase Auth.
- Jangan pindahkan cron ke Vercel Cron.
- Jangan hilangkan validasi SSRF.
- Jangan tandai "Done" tanpa lint+build lulus (+ manual check kalau relevan).
- Draft hasil auto-discover LANGSUNG dieksekusi tanpa nunggu konfirmasi.