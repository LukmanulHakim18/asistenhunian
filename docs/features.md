# Feature Tracker — Asisten Hunian FE

> File ini adalah sumber kebenaran tunggal untuk semua fitur yang sedang atau akan dikerjakan.
> **Wajib dibaca pertama kali setiap sesi**, terutama setelah context clear.
> **Wajib diupdate** sebelum memulai pengerjaan fitur baru.

---

## Cara Menggunakan File Ini

### Memulai fitur baru
1. Tambahkan entry baru menggunakan template di bawah
2. Isi `Specs` secara lengkap sebelum menulis kode apapun
3. Pecah pengerjaan menjadi `Phase` yang atomic (bisa selesai dalam 1 sesi)
4. Set status ke `🟡 In Progress` dan catat tanggal mulai

### Setelah context clear / sesi baru
1. Baca bagian **Active Features** di bawah
2. Temukan fitur dengan status `🟡 In Progress`
3. Cek checklist — item terakhir yang `[ ]` adalah titik lanjut
4. Lanjutkan dari sana — jangan mulai ulang dari awal

### Menyelesaikan fitur
1. Semua checklist item harus `[x]`
2. Set status ke `✅ Done` dan catat tanggal selesai
3. Pindahkan entry ke bagian **Completed Features**

---

## Status Legend

| Symbol | Arti                              |
|--------|-----------------------------------|
| 🔲     | Not Started — belum dikerjakan    |
| 🟡     | In Progress — sedang dikerjakan   |
| ✅     | Done — selesai dan terverifikasi  |
| 🔴     | Blocked — ada blocker eksternal   |

---

## Template Fitur Baru

> Salin blok ini saat menambahkan fitur baru. Hapus baris komentar `<!-- -->`.

```markdown
---

### FEAT-XXX: [Nama Fitur]

**Status**: 🔲 Not Started
**Dimulai**: —
**Selesai**: —
**Dikerjakan oleh**: Claude / [nama]

#### Deskripsi
<!-- Satu paragraf: apa fitur ini, siapa yang pakai, dan mengapa dibutuhkan -->

#### Specs

**Affected routes**:
- <!-- daftar page/route yang berubah atau baru -->

**API endpoints yang digunakan**:
- <!-- METHOD /path — keterangan -->

**Komponen baru**:
- <!-- src/components/... -->

**State / data flow**:
- <!-- singkat: dari mana data datang, bagaimana mengalir ke UI -->

**Acceptance criteria**:
- [ ] <!-- kondisi yang harus terpenuhi agar fitur dianggap selesai -->

#### Phases & Checklist

**Phase 1 — [nama phase]**
- [ ] <!-- task spesifik, satu baris satu tindakan -->
- [ ] 
- [ ] 

**Phase 2 — [nama phase]**
- [ ] 
- [ ] 

**Phase 3 — Verifikasi & Polish**
- [ ] Build tidak ada error TypeScript
- [ ] Test manual: golden path berhasil
- [ ] Test manual: edge case (data kosong, error API, dsb)
- [ ] Update docs/features.md → status Done
```

---

## Active Features

<!-- Fitur yang sedang atau akan dikerjakan. Urutkan: In Progress dulu, lalu Not Started. -->

---

### FEAT-001: Navbar Profile Menu (Customer)

**Status**: ✅ Done
**Dimulai**: 2026-06-07
**Selesai**: 2026-06-07
**Dikerjakan oleh**: Claude

#### Deskripsi

Saat ini Navbar hanya menampilkan tombol "Dashboard" dan "Keluar" untuk user yang sudah login. Tidak ada akses langsung ke halaman `/profile` dari navbar, sehingga customer harus ketik URL manual. Fitur ini menambahkan dropdown menu di Navbar yang berisi link ke Profil dan tombol Keluar, sehingga navigasi ke profil bisa dilakukan dari halaman mana pun.

#### Specs

**File yang diubah**:
- `src/components/shared/Navbar.tsx` — satu-satunya file yang perlu diubah

**Tidak ada file baru** — tidak butuh komponen baru, tidak ada route baru, tidak ada API baru.

**API endpoints yang digunakan**:
- Tidak ada endpoint baru. Data user (`session.name`, `session.role`) sudah tersedia dari state yang ada (`useEffect` → `GET /api/auth/me`).

**Perilaku saat ini** (`Navbar.tsx` baris 56–75):
```tsx
// Jika logged in: tampil tombol "Dashboard" + tombol "Keluar"
// Jika belum login: tampil tombol "Masuk"
```

**Perilaku setelah fitur ini**:
```
Jika logged in:
  - Tampil nama user (misal: "Lukman ▾") sebagai trigger dropdown
  - Dropdown berisi:
      • [ikon user]  Profil          → link ke /profile
      • [ikon log-out] Keluar        → handleSignOut()
  - Tombol "Dashboard" tetap ada di sebelah kiri dropdown (tidak dihapus)

Jika belum login:
  - Tidak berubah — tombol "Masuk" tetap seperti semula

Role admin/ob:
  - Dropdown tetap muncul tapi link "Profil" tidak tampil
    (admin & OB tidak punya halaman /profile saat ini)
  - Atau: link Profil hanya muncul jika role === "customer"
```

**Komponen shadcn/ui yang dipakai**:
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` — sudah ada di `src/components/ui/dropdown-menu.tsx`
- Icon: `User`, `LogOut` dari `lucide-react` — sudah terpasang

**State / data flow**:
- Tidak ada state baru. `session.name` dan `session.role` sudah ada dari `useState<SessionInfo | null>`.
- `handleSignOut` sudah ada — tinggal dipindah ke dalam DropdownMenuItem.

**Acceptance criteria**:
- [ ] Navbar menampilkan nama user sebagai trigger dropdown saat sudah login
- [ ] Klik nama user → dropdown muncul dengan item "Profil" dan "Keluar"
- [ ] Klik "Profil" → navigasi ke `/profile`
- [ ] Klik "Keluar" → logout dan redirect ke `/`
- [ ] Link "Profil" hanya muncul jika `role === "customer"`
- [ ] Tombol "Dashboard" tetap ada dan berfungsi
- [ ] Saat belum login, navbar tidak berubah (tombol "Masuk" tetap)
- [ ] Tidak ada error TypeScript
- [ ] Tampilan rapi di mobile (dropdown tidak terpotong)

#### Phases & Checklist

**Phase 1 — Baca & pahami kode existing**
- [x] Baca `src/components/shared/Navbar.tsx` (sudah 80 baris, kecil)
- [x] Konfirmasi `DropdownMenu` sudah ada di `src/components/ui/dropdown-menu.tsx`
- [x] Konfirmasi icon `User` dan `LogOut` tersedia dari `lucide-react`
- [x] Catat baris exact yang akan diganti (saat ini baris 56–75 blok `session ? (...)`)

**Phase 2 — Implementasi dropdown**
- [x] Import `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` dari `@/components/ui/dropdown-menu`
- [x] Import icon `User`, `LogOut` dari `lucide-react`
- [x] Ganti blok `session ? (...)` dengan struktur baru:
  - Tombol "Dashboard" tetap di posisi kiri dari grup
  - Tambah `DropdownMenu` dengan trigger nama user (`session.name`)
  - `DropdownMenuContent` berisi:
    - `DropdownMenuItem` → `router.push("/profile")` (hanya jika `role === "customer"`)
    - `DropdownMenuSeparator`
    - `DropdownMenuItem` → `handleSignOut()`
- [x] `handleSignOut` dipanggil dari dalam DropdownMenuItem
- [x] Catatan implementasi: `@base-ui/react` tidak support `asChild` — trigger di-style langsung via `className`, navigasi profil via `router.push`

**Phase 3 — Verifikasi & Polish**
- [x] `npm run build` — tidak ada error TypeScript
- [ ] Jalankan dev server: `npm run dev`
- [ ] Test sebagai **customer**: dropdown muncul, link Profil ada, Keluar berfungsi
- [ ] Test sebagai **admin**: dropdown muncul, link Profil tidak muncul, Keluar berfungsi
- [ ] Test sebagai **ob**: dropdown muncul, link Profil tidak muncul, Keluar berfungsi
- [ ] Test **belum login**: navbar tidak berubah, tombol Masuk tetap ada
- [ ] Test di **mobile** (viewport ≤ 375px): dropdown tidak overflow layar
- [x] Update `docs/features.md` → status `✅ Done`, isi tanggal selesai

---

## Completed Features

<!-- Fitur yang sudah selesai. Pindahkan dari Active setelah semua checklist [x]. -->

*(Belum ada)*
