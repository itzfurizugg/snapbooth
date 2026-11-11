# Snapbooth

Photobooth client berbasis browser. Foto ditangkap dan dirakit di perangkat, lalu strip dibagikan lewat QR. UI berbahasa Indonesia, tanpa akun.

## Jalankan

```sh
npm install
npm run dev
```

Kamera bekerja di `localhost` atau HTTPS. Jalankan production build dengan `npm run build`; lint dengan `npm run lint`.

## Simpanan lokal

Tanpa Supabase, `vite.config.ts` memasang API storage lokal otomatis untuk dev dan preview. File strip disimpan di `.snapbooth-data/` (diabaikan Git), metadata kedaluwarsa 24 jam, dan endpoint yang tersedia:

- `POST /api/sessions` dengan JSON `{ image, frameId }` (PNG data URL)
- `GET /api/sessions/:id`
- `GET /api/strips/:id.png`

Server mendengarkan di jaringan lokal. Jika booth dibuka lewat `localhost`, QR otomatis memakai alamat LAN mesin booth agar bisa discan ponsel pada Wi-Fi yang sama. Set `SNAPBOOTH_PUBLIC_URL` (atau `VITE_PUBLIC_URL`) jika ingin memaksa origin lain.

API lokal ini tidak ikut ter-deploy ke hosting statis seperti Vercel. Untuk produksi, pakai Supabase di bawah.

## Supabase

1. Salin `.env.example` ke `.env.local`, isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_PUBLIC_URL` dengan origin deployment HTTPS yang persis.
2. Jalankan `supabase/schema.sql` di SQL editor. Bucket `strips` public read; tabel `sessions` menerima insert publik dan read unexpired. Anon key boleh ada di frontend; **jangan pernah gunakan service-role key di browser**.
3. Deploy Edge Function `cleanup-expired-strips` dan tetapkan secrets:

```sh
supabase secrets set CLEANUP_SECRET="<random-secret>"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

4. Simpan `project_url` dan `cleanup_secret` di Supabase Vault. Uncomment schedule block di `supabase/schema.sql`; task akan memanggil cleanup setiap 15 menit. Pastikan `pg_cron`, `pg_net`, dan Vault aktif.
5. Rebuild/deploy. Storage expiry dibersihkan berkala; jangan janjikan penghapusan tepat pada detik ke-24 jam.

RLS membatasi sesi dan tipe/id file, batas upload 12 MiB. Uji policy di project Supabase non-production sebelum membuka booth publik.

## Catatan produk

Mode frame `Kilat` dan `Klasik` memakai empat foto; `Bioskop` memakai tiga. Frame dan slot dikonfigurasi di `src/lib/frames.ts`; komposisi cover, mirror opsional, dan output PNG ada di `src/lib/canvas.ts`. QR mengarah ke `/s/:id`.
