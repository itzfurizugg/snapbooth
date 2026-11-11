# Snapbooth — Project Context

> File ini adalah konteks utama project untuk developer maupun AI assistant. Baca ini sebelum mengerjakan task apa pun. Detail produk lengkap ada di PRD.

## 1. Apa itu Snapbooth

Photobooth client berbasis web. Pengguna mengambil beberapa foto lewat kamera browser, foto otomatis disusun ke dalam frame strip, lalu hasilnya diunduh dengan memindai QR Code.

**Alur inti:** buka web → izin kamera → pilih frame → countdown & ambil foto → preview/retake → render strip → upload → tampil QR → scan → download.

## 2. Ruang Lingkup

### In scope (v1)
- Ambil foto dari kamera (preview live, countdown, multi-foto, retake)
- Komposisi foto ke frame strip (Canvas)
- Upload hasil strip + generate QR Code berisi link download
- Halaman download (preview + tombol download)

### Out of scope (v1)
- Login / akun pengguna
- Edit foto lanjutan, stiker, retouch
- Video / GIF
- Galeri publik, fitur sosial
- Aplikasi native

## 3. Tech Stack

> Usulan awal, bisa diubah.

| Layer | Pilihan |
|-------|---------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Kamera | Browser `getUserMedia` API |
| Komposisi strip | HTML Canvas API (sisi klien) |
| QR Code | Library generator QR di sisi klien |
| Storage & metadata | Cloudinary authenticated assets + context metadata |
| Hosting & API | Vercel (hosting + serverless functions) |

## 4. Struktur Folder (usulan)

```
snapbooth/
├── public/
│   └── frames/              # aset template frame strip
├── src/
│   ├── components/          # komponen UI (Camera, FramePicker, StripPreview, QRView)
│   ├── hooks/               # useCamera, useCountdown, dll
│   ├── lib/
│   │   ├── canvas.ts        # logika render strip
│   │   ├── storage.ts       # API upload dan lookup strip
│   │   └── qr.ts            # helper QR
├── api/
│   ├── sessions.ts         # upload Cloudinary
│   └── sessions/[id].ts    # lookup signed URL / delete
│   ├── pages/
│   │   ├── Booth.tsx        # alur utama pengambilan foto
│   │   └── Download.tsx     # halaman tujuan hasil scan QR
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── context.md
├── PRD.md
└── package.json
```

## 5. Model Data (usulan)

**Cloudinary asset**

| Field | Keterangan |
|-------|------------|
| `public_id` | `snapbooth/strips/<id>`; ID acak dipakai di URL download |
| `type` | `authenticated`; asset tidak tersedia lewat URL publik biasa |
| `context.frameId` | ID template frame |
| `context.expiresAt` | Waktu kedaluwarsa, 24 jam setelah upload |
| `created_at` | Waktu upload Cloudinary |

API membuat signed download URL yang berlaku hingga 1 jam, maksimal sampai expiry. Setelah 24 jam API menolak akses dan menghapus asset saat link kedaluwarsa dibuka. Tanpa Cron, asset yang tidak dibuka lagi bisa tertinggal di Cloudinary.

**Environment variables**

- `VITE_PUBLIC_URL` — URL publik frontend; tidak mengandung secret.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — server-only; jangan beri prefix `VITE_`.

## 6. Aturan & Konvensi

- **Bahasa UI:** Indonesia (siap i18n bila perlu).
- **TypeScript strict**, hindari `any`.
- **Komponen fungsional** + hooks, tanpa class component.
- Logika non-UI (canvas, QR, upload) ditaruh di `src/lib/`, bukan di dalam komponen.
- Semua error kamera ditangani eksplisit (izin ditolak, kamera tidak ada, kamera sedang dipakai).
- Jangan simpan foto mentah di server; hanya hasil strip akhir yang diunggah.
- Link download memakai ID acak, tidak berurutan.
- Wajib HTTPS (syarat `getUserMedia`); untuk dev lokal `localhost` sudah cukup.

## 7. Aturan Rendering Strip

- Foto di-crop mode *cover* ke tiap slot, tanpa distorsi.
- Preview kamera di-mirror; hasil akhir tidak di-mirror kecuali dipilih pengguna.
- Ukuran output konsisten per template (definisikan lebar/tinggi tetap di konfigurasi frame).
- Template frame didefinisikan sebagai konfigurasi (jumlah slot, posisi, ukuran, gambar overlay) agar mudah menambah frame baru.

## 8. Target Perangkat

- Chrome, Safari (iOS), Firefox, Edge versi terbaru
- Responsif: landscape (laptop/tablet booth) dan portrait (HP)
- Layar sentuh: tombol besar, kontras jelas

## 9. Milestone

1. **M1 — Kamera & capture:** preview, countdown, ambil N foto
2. **M2 — Frame strip:** template, render Canvas, retake
3. **M3 — Upload & QR:** storage, halaman download, QR Code
4. **M4 — Polish:** responsif, error handling, mode kiosk

## 10. Keputusan Terbuka

- Jumlah slot default: 3 atau 4?
- Butuh dashboard/branding untuk penyelenggara di v1?
- Masa aktif link download ideal (default sementara: 24 jam)

## 11. Cara Kerja dengan AI Assistant

- Untuk perubahan kode, kirim **isi file lengkap** dari baris pertama sampai terakhir, tanpa potongan atau placeholder.
- Ikuti konvensi di bagian 6 dan struktur folder di bagian 4.
- Jika ada keputusan yang belum tercakup di dokumen ini, tanyakan dulu sebelum berasumsi.