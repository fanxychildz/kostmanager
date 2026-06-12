# Plan — Fix Error saat Klik Cepat di Bills (`/dashboard/bills`)

Masalah: saat user klik filter / aksi dengan cepat, halaman bills sering error. Kemungkinan besar karena race condition antara:
- `useQuery` untuk `bills.list`
- `selectCache` untuk `tenants` dan `units` (cache mutable global)
- `refetch()` / mutation yg overlap

---

## Tahap 1 — Tambah guard anti double-trigger di cache
File: `src/lib/cache.ts`

Sementara, sebelum request baru dikirim, abort request sebelumnya untuk key yang sama. Pake `AbortController` sederhana:

```ts
const controllers: Partial<Record<Key, AbortController>> = {}

async function fetchList(source: Key, queryFn: ListApi['queryFn']) {
  // abort sebelumnya
  controllers[source]?.abort()
  const controller = new AbortController()
  controllers[source] = controller

  // existing dedupe logic...
  // tambah signal: { signal: controller.signal }
}
```

Penting: saat result dari `fetchList` masuk cache, cek dulu `controller.signal.aborted === false`. Kalau true, jangan update cache (supaya state tidak kacau).

---

## Tahap 2 — Tambah guard loading di `bills/index.tsx`
File: `src/routes/dashboard/bills/index.tsx`

1. Tambah state `const [refetching, setRefetching] = useState(false)`
2. Sebelum `refetch()` dipanggil dari `onSuccess` mutation, cek `if (refetching) return` dan set `setRefetching(true)` sebelum refetch, `setRefetching(false)` di `onSettled`
3. Jangan biar user bisa klik aksi lain sementara `loadingBills || loadingTenantsCache || loadingUnitsCache || creating || updating || deleting`

Pendekatan paling aman:
- Saat sedang proses apa pun, overlay/disable button utama list dan form
- Bisa pakai `const busy = loadingBills || loadingTenantsCache || loadingUnitsCache || creating || updating`
- Tambah `disabled={busy}` ke tombol create/edit/delete/search yang kena

---

## Tahap 3 — Samakan `selectCache.refresh` idempoten
File: `src/lib/cache.ts`

Sekarang `refresh()` di `useSelectCache` langsung set `data = undefined` lalu fetch. Kalau user klik refresh/list dengan cepat, bisa trigger multiple calls.

Ubah menjadi:
- Buat `refreshToken` per key
- Kalau ada refresh baru sebelum yang lama selesai, yang lama diabaikan
- Atau paling sederhan aja: set `inflight = undefined` cuma kalau `loading === false`

---

## Tahap 4 — Test locally
1. Buka `/dashboard/bills`
2. Klik filter (All/Pending/Paid/Overdue) secepat-cepatnya
3. Klik create → isi form → submit sebelum list selesai load
4. Klik edit beberapa tagihan berturut-turut

Pastikan:
- Tidak ada error merah
- Tidak ada popup alert error dari API
- Loading state konsisten
- List selalu sesuai filter terakhir yang diklik

---

## Tahap 5 — Build, commit, push
1. `npm run build` — harus lulus
2. `git add src/lib/cache.ts src/routes/dashboard/bills/index.tsx`
3. `git commit -m "fix(bills): prevent race conditions and error on rapid clicks by adding abort controller and loading guard"`
4. `git push`
5. Vercel auto-deploy

---

## Catatan penting
- Jangan ubah query endpoint di `bills.ts`
- Jangan ubah `DashboardBootstrap`
- Jangan ubah struktur data/cache keys, cuma perilaku fetch-nya