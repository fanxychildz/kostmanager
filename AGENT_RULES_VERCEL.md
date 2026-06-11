# Aturan Vercel — KostManager

Agent (Antigravity/Ezra) WAJIB mematuhi aturan ini ketika bekerja dengan deployment Vercel. Pelanggaran bisa membuat data hilang permanen dan aplikasi down.

---

## 1. JANGAN HAPUS / RESET PRODUCTION ENV
- Dilarang menghapus Environment Variables di Vercel (antar environment: preview / production).
- Jangan menjalankan `vercel env rm` atau melalui Vercel Dashboard untuk menghapus `DATABASE_URL`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, atau variabel lain tanpa persetujuan owner.
- Jangan replace seluruh `.env` tanpa backup terlebih dahulu.

## 2. JANGAN HAPUS / MODIFIKASI PROJEK VERCEL
- Dilarang menghapus project `kostmanager-ten` di Vercel Dashboard.
- Jangan menghapus domain / alias `kostmanager-ten.vercel.app`.
- Jangan mengubah konfigurasi Deployment Protection, Region, atau Git Integration tanpa konfirmasi.
- Jangan menjalankan `vercel remove` atau `vercel projects remove`.

## 3. DATABASE DI VERCEL TIDAK SEPERSISTEN LOKAL
- SQLite di Vercel (`kostmanager.db`) **tidak otomatis persisten** seperti di lokal.
- Setiap deployment besar, instance restart, atau cold start bisa menghilangkan atau mengganti file database jika tidak ada penyimpanan eksternal.
- Backup Wajib sebelum update besar (lihat bagian 5).

## 4. JANGAN UBAH SETTINGS BUILD / DEPLOYMENT
- `vercel.json` sudah dikonfigurasi khusus agar app berjalan. Jangan ubah isinya tanpa diskusi dulu.
- Jangan menambahkan `--force` pada perintah deployment. Jangan overwrite konfigurasi tanpamelalui diskusi terlebih dahulu.
- Jangan mengganti framework preset (Next/Nitro) tanpa diskusi.

## 5. BACKUP VERCEL SEBELUM UPDATE BESAR
Setiap kali siap deploy perubahan yang menyentuh:
- query database / schema,
- logic payment / bills / tenants,
- logic auth atau upload,

lakukan langkah ini **berurutan**:

1. Backup lokal (sudah ada `AGENT_RULES.md`).
2. Backup Vercel:
   - Jika ada endpoint export di app (`/api/backup` atau serupa), minta owner menjalankannya.
   - Jika tidak ada, minta owner **menyalin `kostmanager.db` dari storage Vercel terlebih dahulu** sebelum push update.
3. Konfirmasi terlihat backup atau sudah di-copy.
4. Baru jalankan `vercel --prod` atau `git push` ke main.

## 6. PRODUCTION DATABASE = PRIMA
- Data di Vercel adalah data customer/tenant aktual.
- Dilarang wipe, reset, migrate --force, atau recreate database di production.
- Jika perlu test migration, buat project/staging Vercel terpisah, jangan pakai production.

## 7. AUDIT & APPROVAL
- Semua perubahan sensitif di Vercel harus dicatat (project, deployment, env vars).
- Perubahan skema atau settings yang berisiko butuh approval tertulis dari taufiqrusdhi.ez@gmail.com sebelum dieksekusi.

---

## Catatan penting
- Jika ragu, jangan deploy otomatis. Tanyakan dulu.
- Keamanan data di atas lebih penting daripada kecepatan pengerjaan.