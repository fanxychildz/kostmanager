# Plan — Fix React Error #310 di `/dashboard/bills/$billId`

Target: Buat halaman detail tagihan bisa dibuka lagi tanpa error. Jangan ubah query selain yang dibutuhkan, jangan sentuh endpoint lain. Minimal perubahan, maksimal aman.

---

## Tahap 1 — Bersihkan state file sebelum lanjut
1. `git status --short` — pastikan tidak ada perubahan belum-commit di `src/routes/dashboard/bills/$billId.tsx`.
2. Kalau ada perubahan Antigravity sebelumnya yang nyasar atau experimental, lakukan:
   `git checkout -- src/routes/dashboard/bills/$billId.tsx`
3. Konfirmasi lagi `git status --short` — harus bersih untuk file itu.

---

## Tahap 2 — Terapkan patch yang benar (cuma 2 hal)
Buka `src/routes/dashboard/bills/$billId.tsx` dan lakukan **kedua perubahan ini saja**:

1. Di baris paling atas (sebelum import apapun) tambahkan:
   ```tsx
   "use client";
   ```
   
2. Di bagian import `Link` dari `@tanstack/react-router`, pastikan **cuma satu import**, jangan duplikat. Contoh isi import-nya harus seperti ini:
   ```tsx
   import { createFileRoute, Link, useParams } from "@tanstack/react-router";
   ```
   Jika ada baris import `Link` kedua, hapus baris itu.
   
**Dilarang mengubah query di dalam komponen.** Gunakan tetap `api.payments.getPaymentsByBill({ billId })` seperti versi working sebelumnya.

---

## Tahap 3 — Build lokal dan verifikasi
1. Jalankan:
   ```bash
   npm run build
   ```
2. Pastikan output akhir menampilkan `✓ built in ...` dan **tidak ada error TypeScript** apapun.
3. Jika build gagal, baca errornya. Jangan lanjut push.

---

## Tahap 4 — Commit dan push
1. Cek perubahan:
   ```bash
   git diff -- src/routes/dashboard/bills/$billId.tsx
   ```
   — Harusnya cuma muncul penambahan `"use client"` dan rapikan import `Link`.
2. Commit dengan pesan yang jelas:
   ```bash
   git add src/routes/dashboard/bills/$billId.tsx
   git commit -m "fix(bills): add use client directive on bill detail and dedupe Link import"
   git push
   ```

---

## Tahap 5 — Verifikasi di Vercel (staging/production)
1. Buka halaman:
   - `/dashboard/bills`
   - Pilih salah satu tagihan (tebilang ada data / memiliki jumlah pembayaran)
   - Harusnya halaman detail terbuka tanpa error.
2. Jika masih muncul error #310:
   - Coba Hard Refresh (Ctrl+Shift+R) atau buka Incognito.
   - Jangan hapus folder `dist/` atau clone ulang.
3. Jika setelah Hard Refresh masih error, laporkan kembali dengan detail:
   - Apakah error #310 muncul di **seluruh tagihan** atau cuma tagihan tertentu?
   - Screenshot error dan URL yang sedang dibuka.

---

## Catatan penting
- Jangan ubah `payments.ts` atau `bills.ts` endpoint. Fokus cuma `$billId.tsx`.
- Jangan hapus atau ubah `npm run build`, `vercel-build*`, atau `tsconfig.json`.
- Jangan主打 patch lain di tengah jalan — selesaikan dulu verifikasi error #310 ini sebelum lanjut optimasi lain.