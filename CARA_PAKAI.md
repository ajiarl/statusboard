# Cara Pakai Loop Setup Ini

## 1. Copy folder ini ke root project kamu
Struktur akhirnya harus begini di root project:
```
project-kamu/
├── .kilocode/
│   └── memory-bank/
│       ├── state.md
│       ├── conventions.md
│       └── learned.md
├── .kilo/
│   └── agents/
│       └── default.md
└── (file project kamu lainnya)
```

## 2. Isi conventions.md SEKALI (paling penting)
Buka `.kilocode/memory-bank/conventions.md`, ganti bagian "Command penting"
dengan perintah test/lint/build ASLI project kamu. Ini yang bikin tahap
Verify beneran jalan, bukan cuma formalitas.

## 3. Isi task pertama di state.md
Buka `.kilocode/memory-bank/state.md`, tulis satu task kecil di bagian "Next".
Contoh:
```
## Next
- [ ] Fix: validasi email di form registrasi tidak jalan
```

## 4. Buka Kilo Code di VS Code, ketik ini:
```
Jalankan sesuai instruksi di .kilo/agents/default.md
```
Kalau Kilo Code kamu punya fitur pilih agent/mode secara eksplisit, pilih
agent "default" itu. Kalau tidak, prompt di atas sudah cukup karena file
instruksinya eksplisit menyuruh baca file itu duluan.

## 5. Biarkan dia jalan
Kalau setup-nya benar, Kilo akan: baca state.md → kerjakan task → jalankan
test/lint/build → update state.md → lanjut ke task berikutnya kalau ada,
atau berhenti dan lapor kalau "Next" kosong / ada yang butuh review manusia.

## 6. Tugas kamu tinggal dua
- Isi "Next" di state.md dengan task-task baru (bisa banyak sekaligus).
- Cek folder "Butuh Review Manusia" di state.md sesekali — itu satu-satunya
  bagian yang benar-benar butuh kamu turun tangan.

---

Kalau mau tambah verifier khusus untuk jenis task tertentu (misalnya UI perlu
screenshot check, bukan cuma test unit), tinggal edit bagian "Verify" di
`.kilo/agents/default.md` dan tambahkan kondisi if/else sederhana di situ.
