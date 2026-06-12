# Plan — Bootstrap Gate: "Memuat Data..." Global untuk Dashboard KostManager

Tujuan utama: saat pengguna membuka `/dashboard/*`, ditampilkan tulisan loading global terlebih dahulu sebelum komponen lain render. Mencegah error React Rules of Hooks, error data undefined, dan visual glitch.

---

## Tahap 1 — Buat komponen DashboardBootstrap
File: `src/lib/dashboard-bootstrap.tsx`

Buat komponen `DashboardBootstrap` yang:
1. Mengambil state `loading && user` dari AuthContext (`useAppState` atau `useAuth`)
2. Jika `loading === true` → tampilkan:
   ```tsx
   <div className="flex min-h-screen items-center justify-center">
     <div className="text-center">
       <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
       <p className="text-sm text-muted-foreground">Memuat Data...</p>
     </div>
   </div>
   ```
3. Jika `loading === false && !user` → tampilkan `redirect('/login')` atau pesan akses ditolak
4. Jika `loading === false && user` → render anak (`props.children`)
5. Gunakan komponen `Spinner` atau `progress` dari UI library kalau tersedia (lihat `src/components/ui`)

---

## Tahap 2 — Wrap setiap route dashboard
Bungkus konten setiap route berikut dengan `<DashboardBootstrap>`:

Files:
- `src/routes/dashboard/index.tsx`
- `src/routes/dashboard/bills/index.tsx`
- `src/routes/dashboard/bills/$billId.tsx`
- `src/routes/dashboard/payments.tsx`
- `src/routes/dashboard/expenses.tsx`
- `src/routes/dashboard/meters/index.tsx`
- `src/routes/dashboard/tenants/index.tsx`
- `src/routes/dashboard/tenants/new.tsx`
- `src/routes/dashboard/announcements.tsx`
- `src/routes/dashboard/settings.tsx`

Contoh pola penggunaannya:
```tsx
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/bills/')({
  component: BillsPage,
})

function BillsPage() {
  return (
    <DashboardBootstrap>
      {/* isi halaman bills yang lama tetap di sini, jangan diubah */}
    </DashboardBootstrap>
  )
}
```

---

## Tahap 3 — Perbaiki Rules of Hooks global
Jika ada komponen lain di dashboard yang masih ada `if (loading) return <>...</>` **sebelum** deklarasi hook (`useMemo`, `useQuery`, `useEffect`), pindahkan semua hook ke **paling atas**, kemudian barulah `if (loading) return <Loading />`.

File yang sudah diperbaiki kemarin:
- `src/routes/dashboard/tenants/index.tsx` — sudah fix, cek ulang saja
- `src/routes/dashboard/announcements.tsx` — sudah fix, cek ulang saja
- `src/routes/dashboard/bills/$billId.tsx` — sudah fix, cek ulang saja

---

## Tahap 4 — Build dan verifikasi lokal
1. `npm run build` — harus lulus tanpa error
2. Jalankan dev (`npm run dev`) lalu buka:
   - `/dashboard/bills`
   - `/dashboard/tenants`
   - `/dashboard/payments`
   - `/dashboard/bills/<id>` (detail tagihan)
   
   Pastikan:
   - Muncul "Memuat Data..." sebelum konten muncul
   - Tidak ada error #310
   - Setelah loading hilang, semua fitur bisa diklik

---

## Tahap 5 — Commit, push, dan verifikasi Vercel
1. Cek `git status --short` dan `git diff -- src/lib/dashboard-bootstrap.tsx src/routes/dashboard/bills/index.tsx src/routes/dashboard/tenants/index.tsx` — harus jelas
2. Commit: `git add ... && git commit -m "feat(dashboard): tambah global bootstrap loading 'Memuat Data...' di semua halaman dashboard"`
3. Push ke GitHub: `git push`
4. Tunggu 1-2 menit Vercel deploy
5. Buka production fresh:
   - https://kostmanager-ten.vercel.app/dashboard
   - Hard refresh (Ctrl+Shift+R)
   - Klik-klik semua menu utama (Bills, Tenants, Payments, Expenses, Meters, Settings)
   - Screenshot jika masih ada error

---

## Catatan penting
- Jangan menghapus atau mengubah:
  - `src/lib/auth-context.tsx`
  - Semua file server route (`src/server/*`)
  - `tsconfig.json`
  - `vercel.json`
  - Database / migrasi
- Jangan ubah struktur query yang sudah dioptimasi sebelumnya (`payments.ts`, `bills.ts`, dst)
- Fokus cuma:
  1. Buat `dashboard-bootstrap.tsx`
  2. Wrap route-route dashboard
  3. Rapikan hook violation
