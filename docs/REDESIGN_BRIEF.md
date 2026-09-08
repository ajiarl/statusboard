# StatusBoard Redesign Brief & UI/UX Specification

**Document Version:** 2.0  
**Status:** Ready for Implementation  
**Target:** Public Status Page (`/`) & Shared Design System  
**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Drizzle ORM, Supabase Postgres, Lucide React  

---

## 1. Executive Summary & Goals

StatusBoard adalah platform uptime monitoring dan incident management self-hosted yang dirancang untuk memonitor seluruh live projects Aji (Snip, SiMagang, Finance Tracker, KosPedia, dll).

### Problem Statement (Current UI)
Implementasi saat ini menggunakan token Material-3 mentah dengan inline hex (`#0e0e0e`, `#24292E`, `#bec2ff`) yang terasa kaku dan dated:
- Tidak memiliki **Heartbeat Uptime Bars (90-day history)** yang menjadi standar industri (BetterStack, Instatus).
- Metrik teknis penting seperti **Latency (`responseTimeMs`)** sudah dicatat di database tetapi belum divisualisasikan.
- Hierarki tipografi seragam dan kurang "engineering-first" (kurang aksen monospace untuk data angka/waktu).
- Kontras warna status terlalu pekat/terisolasi, belum ada depth atau subtle background glow.

### Redesign Goals
1. **Authoritative & Production-Grade:** Tampilan setara BetterStack, Incident.io, dan Linear — bersih, presisi, dan fungsional.
2. **Visual Rhythm & Data Density:** Visualisasi data yang padat namun lega (90-day uptime bars, latency sparklines, clear status badges).
3. **Clean Design Token System:** Migrasi dari arbitrary hardcoded hex ke token semantik Tailwind v4 (`@theme`) yang reusable ke `/admin`.

---

## 2. Visual Identity & Design System

### 2.1 Aesthetic Direction: "Refined Infrastructure Dark Mode"
Menggunakan zinc dark palette dengan elevated cards, border subtil bergradasi (`border-white/10`), dan aksen fungsional berbasis status.

### 2.2 Color Tokens
| Token | Hex / Value | Penggunaan |
|---|---|---|
| `--color-bg-canvas` | `#09090b` (zinc-950) | Latar utama aplikasi |
| `--color-surface-card` | `#121215` (zinc-900 elevated) | Background container monitor & incident |
| `--color-surface-hover` | `#18181b` (zinc-900) | State hover kartu & dropdown |
| `--color-border-subtle` | `#27272a` (zinc-800) | Garis pemisah, border kartu |
| `--color-border-muted` | `#1f1f23` | Divider internal kartu |
| `--color-text-primary` | `#f4f4f5` (zinc-100) | Judul monitor, status utama, angka uptime |
| `--color-text-secondary` | `#a1a1aa` (zinc-400) | Deskripsi incident, subtitle, label metrik |
| `--color-text-muted` | `#71717a` (zinc-500) | Timestamp, URL monitor, copyright |

### 2.3 Status Semantic Palette
- **Operational (Normal):**
  - Text: `#10b981` (emerald-500)
  - Surface Glow: `rgba(16, 185, 129, 0.08)`
  - Border: `rgba(16, 185, 129, 0.25)`
  - Pulse Dot: `#34d399` (emerald-400)
- **Degraded / Slow / Warning:**
  - Text: `#f59e0b` (amber-500)
  - Surface: `rgba(245, 158, 11, 0.08)`
  - Border: `rgba(245, 158, 11, 0.25)`
  - Dot: `#fbbf24` (amber-400)
- **Major Outage / Down:**
  - Text: `#f43f5e` (rose-500)
  - Surface: `rgba(244, 63, 94, 0.1)`
  - Border: `rgba(244, 63, 94, 0.3)`
  - Dot: `#fb7185` (rose-400)
- **Inactive / Maintenance:**
  - Text: `#71717a` (zinc-500)
  - Surface: `rgba(113, 113, 122, 0.08)`
  - Border: `rgba(113, 113, 122, 0.2)`

### 2.4 Typography
- **Primary Body & Headings:** `Inter` / `Geist Sans`, sans-serif. Tight tracking (`tracking-tight`) pada title.
- **Technical & Metric Data:** `Geist Mono` / `JetBrains Mono` / monospace. Digunakan pada:
  - Uptime percentage (contoh: `99.98%`)
  - Response time latency (contoh: `142ms`)
  - Timestamps dan status codes (contoh: `200 OK`, `14:02 UTC`)

---

## 3. UI Component Architecture & Layout

### 3.1 Global Header
- **Left:** Brand logo/icon + "StatusBoard" + badge status global minimalis (`Live`).
- **Right:** 
  - Timestamp "Updated 2m ago" dengan ikon sync halus.
  - Link navigasi "Admin Portal" / "System Docs".

### 3.2 System Status Banner (Hero)
Komponen dinamis di paling atas yang langsung menjawab pertanyaan: *"Apakah sekarang ada yang down?"*
- **State All Good:**
  - Background surface zinc gelap dengan aksen border emerald halus.
  - Ikon check circle + teks tegas: "All Systems Operational".
  - Sub-teks: "Semua 5 layanan beroperasi normal tanpa kendala."
- **State Partial / Full Outage:**
  - Background rose/amber surface dengan subtle warning glow.
  - Menampilkan ringkasan: "Gangguan terdeteksi pada 1 layanan (Auth Service)."

### 3.3 Monitors List & 90-Day Heartbeat Bars (Core Feature)
Tiap monitor ditampilkan sebagai kartu independen yang memiliki:
1. **Header Kartu:**
   - Nama service (misal: "Snip API Gateway").
   - Target host pill (`GET https://api.snip.id/health`).
   - Badge status terkini dengan live pulse dot (Operational / Down).
2. **Heartbeat Bar Container (90 Hari):**
   - 90 bilah vertikal (bars) tipis dengan gap 2px.
   - Warna bar: hijau (100%), kuning (degraded/ada incident), merah (down), abu tipis (no data/new monitor).
   - **Interactive Hover Tooltip:**
     - Menampilkan tanggal spesifik (`e.g., 28 Ags 2026`).
     - Status hari itu: `Operational (100%)` atau `Downtime 14m`.
     - Rata-rata response time hari tersebut.
3. **Footer Kartu (Metrik Ringkas):**
   - Kiri: "90 days ago"
   - Tengah: "Average response: **118ms**" (font mono)
   - Kanan: Uptime metrics 24h, 7d, 30d (`99.9%`, `100%`, `99.8%`).

### 3.4 Incident Management Section
Dibagi menjadi 2 kategori:
1. **Active Incidents (jika ada):**
   - Tampil tepat di bawah Banner Hero jika ada incident dengan status non-resolved.
   - Severity badge (Minor / Major / Critical).
   - Real-time investigation tracker:
     - `Investigating` -> `Identified` -> `Monitoring` -> `Resolved`
   - Log pesan berkala dengan timestamp detail.
2. **Past Incidents History:**
   - List collapsible per bulan.
   - Jika tidak ada insiden dalam 30 hari: tampilkan empty state yang meyakinkan ("No incidents reported in the past 90 days").

### 3.5 Footer
- "Powered by StatusBoard · Self-hosted & Open Source".
- Link ke source code GitHub Aji (`github.com/ajiarl/statusboard`).
- Latency check frequency disclaimer ("Checks executed every 5 minutes").

---

## 4. Technical Data Flow & Backend Needs

Untuk menunjang UI baru di atas tanpa membebani query Next.js:

1. **Daily Aggregation Query:**
   - Tabel `checks` menyimpan data per request.
   - Buat helper query SQL / Drizzle untuk mengagregasi status per hari (90 hari terakhir) per monitor:
     - Total checks, failed checks, average response time.
2. **Fallback Mock Data:**
   - Pertahankan fallback mock data di `app/page.tsx` tetapi update strukturnya agar memuat 90 baris data heartbeat tiruan yang realistis, sehingga saat dev tanpa koneksi Supabase, preview UI tetap kaya dan akurat.

---

## 5. Implementation Roadmap

- **Phase 1 (Foundations):** Setup Tailwind v4 theme variables, install `lucide-react`, definisikan tipe data Heartbeat & Monitor.
- **Phase 2 (Public Page Components):** Buat komponen `StatusHeroBanner`, `MonitorCard`, `HeartbeatBars`, dan `MetricBadge`.
- **Phase 3 (Incidents & Polish):** Bangun `IncidentTimeline` dan styling hover tooltips yang responsif.
- **Phase 4 (Admin Harmonization):** Terapkan token dan styling yang sama ke `/admin` dan modal edit monitor.
