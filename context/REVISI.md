# Revisi Snapbooth — Putaran Kedua

*Lampiran untuk PRD.md dan REVISI.md · Versi 0.1 (draft)*

## 1. Ringkasan Revisi

| # | Revisi | Prioritas |
|---|--------|-----------|
| R5 | Virtual background aktif **saat kamera menyala** (ada viewfinder) | Must |
| R6 | Halaman pilih frame, foto, edit, dan download **dipisah dari `App.tsx`** | Must |
| R7 | Perbaiki desain halaman dan **ikuti `context/DESIGN.md`** | Must |

Catatan penting: **R5 mengubah keputusan teknis di REVISI.md bagian 3**, yang sebelumnya mengusulkan segmentasi hanya pada foto yang sudah diambil. Sekarang segmentasi harus berjalan pada tampilan kamera secara langsung.

## 2. R5 — Virtual Background pada Viewfinder

### Kebutuhan

- Saat kamera menyala, viewfinder langsung menampilkan orang dengan background virtual pilihan, bukan latar asli.
- Pengguna bisa mengganti background saat viewfinder berjalan dan hasilnya langsung terlihat.
- Berlaku hanya untuk template yang memiliki `virtualBackground: true`. Template lain tetap menampilkan kamera apa adanya.
- Yang dilihat di viewfinder sama dengan yang masuk ke strip (WYSIWYG).

### Pendekatan teknis (usulan)

- Segmentasi orang di browser dengan **MediaPipe Image Segmenter** dalam mode video, memakai delegate GPU bila tersedia.
- Viewfinder dirender ke `<canvas>`, bukan elemen `<video>` langsung: gambar background, lalu orang hasil segmentasi di atasnya.
- Inferensi dijalankan pada resolusi kecil (mis. sisi terpanjang ±256 px), lalu mask diperbesar ke ukuran viewfinder. Ini menjaga frame rate tetap lancar.
- Loop render memakai `requestAnimationFrame` dengan batas frame rate (target 15–30 fps untuk segmentasi).
- Haluskan tepi mask (feathering) agar kontur orang tidak kasar.
- Opsional: pindahkan inferensi ke Web Worker dengan OffscreenCanvas bila UI terasa berat.

### Saat foto diambil

Dua opsi, putuskan setelah mencoba:

| Opsi | Cara | Kelebihan | Kekurangan |
|------|------|-----------|------------|
| A | Ambil frame komposit dari viewfinder | Cepat, persis seperti yang dilihat | Resolusi mask lebih rendah |
| B | Ambil frame mentah, jalankan segmentasi ulang pada resolusi penuh | Kualitas tepi lebih baik | Ada jeda pemrosesan singkat |

### Fallback dan penanganan perangkat lemah

- Ukur FPS segmentasi secara berkala. Jika di bawah ambang (mis. < 10 fps) beberapa detik berturut-turut, tawarkan beralih ke mode **segmentasi setelah foto diambil** (pendekatan di REVISI.md bagian 3) atau mematikan virtual background.
- Jika model gagal dimuat atau WebGL tidak tersedia, tampilkan kamera apa adanya dan beri tahu pengguna.
- Tampilkan indikator loading saat model sedang dimuat, dan jangan memulai countdown sebelum viewfinder siap.
- Uji khusus di Safari iOS dan laptop kelas menengah.

### Acceptance criteria

- Viewfinder menampilkan background virtual secara real time dengan frame rate yang terasa lancar di laptop kelas menengah.
- Mengganti background saat kamera berjalan langsung berefek tanpa memulai ulang kamera.
- Strip akhir cocok dengan tampilan viewfinder.
- Kegagalan segmentasi tidak menghentikan alur foto.
- Semua pemrosesan di sisi klien; foto mentah tidak dikirim ke server.

## 3. R6 — Pemisahan Halaman dari `App.tsx`

### Masalah

Saat ini alur booth (pilih frame, foto, edit, hasil/download) kemungkinan ditangani langsung di `App.tsx`. Semakin banyak fitur (template, virtual background, teks editable), file ini semakin sulit dirawat.

### Kebutuhan

- Setiap langkah menjadi **halaman sendiri** di `src/pages/`.
- `App.tsx` hanya berisi kerangka: provider, router, dan layout bersama.
- Halaman download publik (`DownloadPage`, tujuan hasil scan QR) tetap terpisah dan bisa dibuka langsung lewat link.

### Struktur halaman (usulan)

| Halaman | Fungsi |
|---------|--------|
| `Landing` | Layar awal dan tombol mulai |
| `PilihFrame` | Memilih template (dan background bila didukung) |
| `Foto` | Viewfinder, countdown, pengambilan foto |
| `Edit` | Review hasil, retake, isi teks editable |
| `Hasil` | Proses upload, tampilkan QR dan tombol selesai |
| `DownloadPage` | Halaman publik hasil scan QR (preview dan download) |

Komponen yang sudah ada (`FramePicker`, `ReviewStage`, `ProcessingView`, `QRView`, `Landing`) dipindahkan atau dibungkus ke halaman-halaman ini sesuai fungsinya, tanpa menulis ulang logika yang sudah berjalan.

### Routing dan state (usulan)

- Gunakan routing berbasis URL (mis. `react-router`), contoh rute: `/`, `/frame`, `/foto`, `/edit`, `/hasil`, dan rute download publik yang sudah ada.
- State lintas halaman (template terpilih, background terpilih, daftar foto, teks nama) disimpan di satu **context** dengan reducer, bukan di `App.tsx`.
- **Route guard:** jika pengguna membuka `/foto` atau `/edit` tanpa state yang diperlukan (mis. setelah refresh), arahkan kembali ke langkah yang sesuai atau ke awal.
- Siklus hidup kamera dikelola oleh hook (`useCamera`): stream dimatikan saat halaman `Foto` ditinggalkan, dan izin kamera tidak diminta ulang tanpa perlu.
- Pada Vercel, tambahkan rewrite SPA agar rute langsung (deep link) tidak 404, **kecuali** untuk `/api/*` yang harus tetap menuju serverless function.

### Acceptance criteria

- `App.tsx` hanya berisi provider, router, dan layout.
- Tiap halaman berada di file sendiri di `src/pages/`.
- Alur lengkap (pilih frame, foto, edit, hasil, QR, download) berjalan sama seperti sebelumnya.
- Refresh pada halaman tengah alur tidak menyebabkan layar kosong atau error.
- Tombol back browser berperilaku masuk akal dan kamera mati saat meninggalkan halaman foto.
- `/api/*` tetap berfungsi setelah rewrite ditambahkan.

## 4. R7 — Perbaikan Desain Halaman

### Kebutuhan

- Semua halaman dirapikan dan konsisten mengikuti **`context/DESIGN.md`** sebagai acuan utama desain.
- Gunakan token yang sudah ada (`src/tokens.css`) alih-alih nilai warna atau ukuran yang ditulis langsung di komponen.

> Catatan: isi `context/DESIGN.md` tidak ikut dilampirkan di dokumen ini. Developer dan Claude Code wajib membacanya langsung sebelum mengerjakan bagian ini, dan bila ada pertentangan dengan dokumen ini, **DESIGN.md yang menang**.

### Langkah kerja

1. Baca `context/DESIGN.md` dan `src/tokens.css`.
2. Audit tiap halaman: temukan bagian yang menyimpang dari panduan desain (warna, tipografi, spasi, komponen, ikon).
3. Rapikan halaman satu per satu, dimulai dari alur utama (Landing, PilihFrame, Foto, Edit, Hasil), lalu DownloadPage.
4. Pastikan setiap halaman punya state lengkap: loading, error, kosong, dan izin kamera ditolak.

### Prinsip umum (berlaku selama tidak bertentangan dengan DESIGN.md)

- Layout responsif untuk landscape (laptop/tablet booth) dan portrait (HP).
- Tombol besar dan jelas, cocok untuk layar sentuh.
- Kontras dan ukuran teks yang terbaca dari jarak booth.
- Viewfinder menjadi fokus utama halaman `Foto`; kontrol tidak menutupi wajah.
- Teks antarmuka berbahasa Indonesia.

### Acceptance criteria

- Tidak ada warna, font, atau ukuran yang ditulis langsung di komponen jika sudah ada token-nya.
- Setiap halaman sesuai `context/DESIGN.md` dan konsisten satu sama lain.
- Semua state (loading, error, kosong, izin kamera ditolak) memiliki tampilan yang dirancang.
- Tampilan layak di layar landscape dan portrait.

## 5. Urutan Pengerjaan yang Disarankan

1. **R6 dulu:** pisahkan halaman dan rapikan routing serta state. Ini fondasi untuk dua revisi lainnya.
2. **R7 berikutnya:** rapikan desain di struktur halaman yang baru.
3. **R5 terakhir:** tambahkan virtual background pada viewfinder di halaman `Foto` yang sudah rapi.

Alasannya: R5 paling berisiko secara teknis dan paling banyak menyentuh halaman `Foto`, jadi lebih aman dikerjakan setelah struktur dan desain halaman stabil.

## 6. Dampak ke Dokumen Lain

- **REVISI.md:** bagian 3 (Virtual Background) diperbarui, segmentasi pada viewfinder menggantikan segmentasi hanya pada foto statis; pendekatan statis menjadi fallback.
- **PRD.md:** tambahkan R5–R7, dan perbarui F1 (viewfinder dengan virtual background).
- **context.md:** perbarui struktur folder (`src/pages/`, context state, routing), dependency baru (router), dan rujukan ke `context/DESIGN.md`.
- **vercel.json:** tambahkan rewrite SPA dengan pengecualian `/api/*`.

## 7. Risiko

| Risiko | Mitigasi |
|--------|----------|
| Segmentasi real time berat di perangkat lemah | Resolusi inferensi kecil, batas FPS, deteksi FPS rendah dan fallback ke segmentasi setelah foto |
| Safari iOS tidak mendukung delegate GPU dengan baik | Uji awal di iOS, siapkan fallback |
| Tepi mask berkedip atau kasar pada video | Feathering dan smoothing antar frame |
| Refactor halaman merusak alur yang sudah jalan | Pindahkan komponen tanpa menulis ulang logika, uji alur penuh setelah tiap halaman |
| State hilang saat refresh di tengah alur | Route guard dan redirect ke langkah yang sesuai |
| Rewrite SPA menutup rute `/api` | Kecualikan `/api/*` di `vercel.json`, uji endpoint setelah deploy |
| Desain menyimpang dari DESIGN.md | Jadikan DESIGN.md acuan utama dan cek tiap halaman terhadapnya |

## 8. Pertanyaan Terbuka

- Saat foto diambil, pakai opsi A (frame komposit dari viewfinder) atau opsi B (segmentasi ulang resolusi penuh)?
- Apakah pilihan background bisa diganti saat viewfinder berjalan, atau dikunci setelah foto pertama?
- Router yang dipakai: `react-router`, atau cukup state machine sederhana tanpa mengubah URL?
- Apakah state sesi perlu dipertahankan saat refresh (mis. lewat `sessionStorage`) atau cukup redirect ke awal?