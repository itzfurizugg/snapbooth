# PRD — Snapbooth

*Photobooth client berbasis web · Versi 0.1 (draft)*

## 1. Ringkasan

Snapbooth adalah aplikasi photobooth yang berjalan sepenuhnya di browser. Pengguna mengambil beberapa foto lewat kamera perangkat, foto otomatis disusun ke dalam frame strip, lalu hasilnya bisa diunduh dengan memindai QR Code. Tidak perlu install aplikasi.

## 2. Latar Belakang & Masalah

- Photobooth fisik mahal dan tidak praktis untuk acara kecil.
- Aplikasi photobooth yang ada biasanya butuh install, login, atau penuh iklan.
- Memindahkan foto dari perangkat booth ke HP pengguna sering ribet (kabel, AirDrop, kirim chat).

Snapbooth menyelesaikan ini dengan alur singkat: **buka web → foto → dapat strip → scan QR → simpan**.

## 3. Tujuan

| # | Tujuan | Indikator |
|---|--------|-----------|
| G1 | Alur dari buka web sampai dapat strip cepat dan jelas | Selesai < 2 menit |
| G2 | Hasil strip rapi dan konsisten | Strip ter-render tanpa distorsi di semua frame |
| G3 | Berbagi foto tanpa kabel/akun | Scan QR langsung memicu download |

## 4. Non-Goals (v1)

- Akun pengguna / login.
- Edit foto lanjutan (filter kompleks, stiker, retouch).
- Rekaman video / GIF.
- Galeri publik atau fitur sosial.
- Aplikasi native.

## 5. Target Pengguna

- **Penyelenggara acara** (ulang tahun, nikahan, kampus) yang menaruh laptop/tablet sebagai booth.
- **Pengguna umum** yang ingin foto strip cepat dari HP/laptop sendiri.

## 6. User Flow

1. Pengguna membuka Snapbooth dan memberi izin kamera.
2. Memilih frame strip (opsional).
3. Menekan tombol mulai → countdown → foto diambil otomatis sebanyak N slot.
4. Preview hasil strip; bisa **retake** per slot atau ulang semua.
5. Menekan "Selesai" → strip diproses dan diunggah.
6. Layar menampilkan QR Code → pengguna scan dengan HP → halaman download terbuka.

## 7. Fitur & Requirement

### F1 — Ambil Foto (Must)

- Akses kamera via browser (`getUserMedia`), preview live.
- Countdown (default 3 detik) sebelum tiap foto.
- Pengambilan beberapa foto berurutan sesuai jumlah slot frame.
- Retake per foto.
- Mirror preview agar terasa seperti cermin; hasil akhir tidak ter-mirror kecuali dipilih.
- Penanganan error: izin kamera ditolak, kamera tidak ada, kamera dipakai aplikasi lain.

**Acceptance criteria**

- Foto tersimpan dengan resolusi sesuai kemampuan kamera (min 720p bila tersedia).
- Jika izin ditolak, tampil pesan dan cara mengaktifkan ulang.

### F2 — Frame Strip (Must)

- Foto disusun ke dalam template strip (vertikal, mis. 3–4 slot) lewat Canvas.
- Minimal 3 pilihan frame bawaan.
- Strip punya area teks/tanggal opsional di bawah.
- Output PNG/JPEG kualitas tinggi.

**Acceptance criteria**

- Foto di-crop *cover* ke slot tanpa terdistorsi.
- Ukuran output konsisten per template.

### F3 — QR Code Download (Must)

- Setelah strip jadi, file diunggah ke storage dan mendapat URL publik singkat.
- QR Code dibuat dari URL tersebut dan ditampilkan di layar.
- Halaman tujuan menampilkan preview strip dan tombol **Download**.
- File kedaluwarsa otomatis (default 24 jam) agar storage tidak menumpuk.

**Acceptance criteria**

- Scan QR dari HP membuka halaman download dalam < 3 detik pada koneksi normal.
- Link tidak bisa ditebak (ID acak, bukan urutan angka).

### F4 — Nice to Have (v1.1+)

- Upload foto dari galeri sebagai pengganti kamera.
- Mode kiosk (fullscreen, auto-reset ke layar awal setelah QR ditampilkan).
- Frame custom dari penyelenggara.
- Filter sederhana (B&W, sepia).

## 8. Kebutuhan Non-Fungsional

- **Performa:** render strip < 2 detik di perangkat menengah.
- **Kompatibilitas:** Chrome, Safari (iOS), Firefox, Edge versi terbaru; layout responsif landscape & portrait.
- **Privasi:** foto tidak disimpan permanen; proses pengambilan dan penyusunan dilakukan di sisi klien, hanya hasil akhir yang diunggah, dan dihapus setelah kedaluwarsa.
- **Keamanan:** kamera hanya aktif saat dibutuhkan; wajib HTTPS (syarat `getUserMedia`).
- **Aksesibilitas:** tombol besar, kontras jelas, bisa dipakai di layar sentuh.

## 9. Usulan Arsitektur (untuk didiskusikan)

- **Frontend:** React + Vite + TypeScript, Canvas API untuk komposisi strip.
- **QR:** library generator QR di sisi klien.
- **Storage & link:** Supabase Storage (bucket dengan expiry via scheduled cleanup) + tabel kecil untuk metadata sesi.
- **Hosting:** Vercel.

## 10. Metrik Keberhasilan

- Persentase sesi yang sampai ke layar QR.
- Waktu rata-rata per sesi.
- Persentase QR yang berujung download.
- Tingkat error kamera.

## 11. Risiko

| Risiko | Mitigasi |
|--------|----------|
| Izin kamera ditolak / perilaku beda di iOS Safari | Uji awal di iOS, siapkan layar panduan izin |
| Biaya storage membengkak | Expiry 24 jam + batas ukuran file |
| Foto sensitif bocor lewat link | ID acak + expiry singkat |
| Kualitas kamera laptop rendah | Pilihan resolusi, saran pencahayaan |

## 12. Milestone

1. **M1 — Kamera & capture:** preview, countdown, ambil N foto.
2. **M2 — Frame strip:** template + render Canvas + retake.
3. **M3 — Upload & QR:** storage, halaman download, QR.
4. **M4 — Polish:** responsif, error handling, mode kiosk.

## 13. Pertanyaan Terbuka

- Jumlah slot default: 3 atau 4?
- Apakah penyelenggara perlu dashboard/branding sendiri di v1?
- Berapa lama masa aktif link download yang ideal?