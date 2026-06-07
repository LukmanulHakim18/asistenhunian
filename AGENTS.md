<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:feature-tracking-rules -->
# Feature Tracking — WAJIB DIIKUTI

## Aturan saat memulai fitur baru

1. **Baca `docs/features.md` terlebih dahulu** — cek apakah fitur sudah ada entry-nya dan di phase mana.
2. **Jika fitur belum ada**, tambahkan entry baru ke `docs/features.md` menggunakan template yang tersedia sebelum menulis kode apapun.
3. **Specs wajib lengkap** sebelum fase implementasi dimulai: affected routes, API endpoints, komponen baru, acceptance criteria.
4. **Phase harus atomic** — setiap phase bisa selesai dalam 1 sesi konteks. Jangan buat phase yang terlalu besar.

## Aturan saat melanjutkan fitur (setelah context clear / sesi baru)

1. **Baca `docs/features.md` pertama kali** di setiap sesi baru.
2. Cari entry dengan status `🟡 In Progress`.
3. Temukan checklist item terakhir yang masih `[ ]` — itulah titik lanjut.
4. Lanjutkan dari sana. Jangan mulai ulang dari phase 1.

## Aturan saat mengerjakan

- Centang `[x]` setiap checklist item segera setelah selesai dikerjakan.
- Jika ada blocker, ubah status ke `🔴 Blocked` dan catat alasannya di bawah entry.
- Jangan pindahkan entry ke "Completed" sebelum semua checklist `[x]` termasuk phase verifikasi.

## Aturan saat selesai

- Semua checklist `[x]` → ubah status ke `✅ Done`, isi tanggal selesai.
- Pindahkan entry dari "Active Features" ke "Completed Features".
<!-- END:feature-tracking-rules -->
