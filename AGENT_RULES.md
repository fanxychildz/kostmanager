# Aturan Agent — KostManager

Agent (Antigravity/Ezra) WAJIB mematuhi aturan di bawah ini saat bekerja di proyek ini.

---

## 1. JANGAN HAPUS DATA APAPUN

- Jangan menghapus baris data dari database (`kostmanager.db`) kecuali ada instruksi eksplisit dari taufiqrusdhi.ez@gmail.com.
- Dilarang menjalankan perintah yang bisa menghapus data seperti: `truncate`, `drop table`, `drop database`, `reset db`, `push --reset`, `db push --force`, atau perintah sejenisnya.
- Setiap patch atau perubahan ke skema database tidak boleh menghilangkan data yang sudah ada.

---

## 2. BACKUP SEBELUM PERUBAHAN BERAT

Sebelum menjalankan perintah migration, reset database, atau perubahan besar di schema:

1. Copy file database saat ini:
   ```
   cp kostmanager.db kostmanager-backup-YYYY-MM-DD.db
   ```
2. Konfirmasi backup sudah terbuat dan ukurannya tidak 0 byte.
3. Hanya lanjut jika backup aman.

---

## 3. PRODUCTION DATABASE = PRIMA

- Data di `kostmanager.db` adalah data production.
- Jangan melakukan wipe, reset, atau recreate database di mode production.
- Untuk testing skema baru, gunakan database terpisah (misal `kostmanager-test.db`) dan hapus hanya file itu setelah testing selesai.

---

## 4. APPROVAL UNTUK PERUBAHAN BERAT

Harapankan approval atau konfirmasi tertulis dari taufiqrusdhi.ez@gmail.com sebelum menjalankan:

- Perintah yang menghapus atau mereset data.
- Perubahan skema database yang bersifat destructive.
- Perubahan konfigurasi auth atau user management.

---

## 5. AUDIT TRAIL

- Catat perubahan yang dilakukan di dalam file ini atau file changelog terpisah.
- Jangan melakukan perubahan besar tanpa dokumentasi yang jelas.

---

## Konteks

Aplikasi ini adalah sistem manajemen properti/kost yang berjalan di Vercel + SQLite (`kostmanager.db`). Hilangnya data berarti hilangnya data tenant, unit, tagihan, pembayaran, dan pengeluaran — sangat kritis.

Jika ada ragu, tanyakan dulu ke taufiqrusdhi.ez@gmail.com sebelum mengeksekusi.