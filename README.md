# Snapbooth

Photobooth client berbasis browser. Foto ditangkap dan dirakit di perangkat, lalu strip dibagikan lewat QR. UI berbahasa Indonesia, tanpa akun.

## Jalankan lokal

```sh
npm install
npm run dev
```

`npm run dev` memakai API disk lokal untuk uji lokal, bukan Cloudinary. Untuk uji API serverless Cloudinary, jalankan `npm run vercel:dev` setelah Vercel CLI terpasang dan login. Kamera bekerja di `localhost` atau HTTPS.

## Deploy Vercel + Cloudinary

API Vercel `api/sessions.ts` mengunggah strip PNG authenticated/private dengan ID acak. `api/sessions/[id].ts` mengeluarkan URL bertanda tangan berumur pendek dan menghapus strip kedaluwarsa saat tautan dibuka lagi. Tanpa cron, asset Cloudinary tidak dibersihkan otomatis; buat upload preset dengan `auto_delete_after` bila tersedia di plan Cloudinary.

Di Cloudinary, siapkan account dengan akses upload dan Admin API. Di Vercel → Project → Settings → Environment Variables tambahkan untuk Production (dan Preview bila perlu):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` — server-only, jangan beri prefix `VITE_`
- `VITE_PUBLIC_URL=https://snapbooth-flame.vercel.app` — gunakan domain deploy yang benar

Deploy ulang setelah environment variables tersimpan. Uji upload dan tautan download. Vercel Cron dijadwalkan per jam pada plan Hobby; plan lain dapat mendukung jadwal lebih rapat.

Vercel tidak menjalankan `server/localApi.ts`; file itu hanya untuk dev/preview lokal. Jangan gunakan filesystem lokal untuk hosting serverless.

## Frame

Frame `Kilat` dan `Klasik` memakai empat foto; `Bioskop` memakai tiga. Konfigurasi ada di `src/lib/frames.ts`, renderer Canvas di `src/lib/canvas.ts`.
