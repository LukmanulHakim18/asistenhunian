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

### FEAT-002: Category Horizontal Scroll di Halaman Order

**Status**: ✅ Done
**Dimulai**: 2026-06-07
**Selesai**: 2026-06-07
**Dikerjakan oleh**: Claude

#### Deskripsi

Halaman `/order` Step 1 menampilkan semua layanan dalam satu list vertikal panjang tanpa filter kategori, memaksa user scroll jauh ke bawah. Fitur ini menambahkan horizontal scroll pill kategori di atas list layanan sehingga user bisa memfilter per kategori tanpa scroll.

#### Specs

**File yang diubah**:
- `src/components/order/OrderForm.tsx` — satu-satunya file yang perlu diubah

**Tidak ada file baru, tidak ada API baru.**

**Data yang sudah tersedia**:
- `allServices` prop sudah bertipe `ServiceWithCategory[]` (field `category` ada, hanya belum dipakai)
- Kategori di-derive langsung dari `allServices` — tidak perlu fetch tambahan
- `category_id` pada setiap service sudah tersedia untuk filtering

**State baru**:
- `activeCategory: string` — default `"all"`, diubah saat user klik pill

**Logika derive kategori** (dari services, deduplicated):
```ts
const categories = useMemo(() =>
  allServices
    .map(s => s.category)
    .filter((c, i, arr): c is ServiceCategory =>
      c !== null && arr.findIndex(x => x?.id === c.id) === i
    )
    .sort((a, b) => a.sort_order - b.sort_order),
  [allServices]
);
```

**Logika filter**:
```ts
const filteredAvailableServices = allServices
  .filter(s => !items.find(i => i.service.id === s.id))
  .filter(s => activeCategory === "all" || s.category_id === activeCategory);
```

**UI horizontal scroll** (di atas card "Tambah Layanan Lain"):
- `div` dengan `flex overflow-x-auto gap-2 pb-2` + `scrollbar-hide` (atau scrollbar tipis)
- Pill: `whitespace-nowrap rounded-full px-4 py-1.5 text-sm` — aktif: `bg-primary text-primary-foreground`, tidak aktif: `border border-border`
- Pertama selalu "Semua"

**Acceptance criteria**:
- [ ] Pill kategori muncul di atas list layanan Step 1
- [ ] Pill bisa di-scroll horizontal tanpa mempengaruhi scroll vertikal halaman
- [ ] Klik pill → list layanan terfilter sesuai kategori
- [ ] Pill "Semua" menampilkan semua layanan yang belum dipilih
- [ ] Jika service tidak punya kategori, tetap muncul saat "Semua" aktif
- [ ] Pill tidak muncul jika hanya ada 1 atau 0 kategori (tidak perlu filter)
- [ ] Tidak ada TypeScript error

#### Phases & Checklist

**Phase 1 — Persiapan**
- [x] Baca `OrderForm.tsx` — konfirmasi prop type dan struktur Step 1
- [x] Konfirmasi `ServiceWithCategory` sudah punya field `category: ServiceCategory | null`
- [x] Konfirmasi `useMemo` tersedia (React import sudah ada)

**Phase 2 — Implementasi**
- [x] Import `useMemo` dan `ServiceWithCategory` di `OrderForm.tsx`
- [x] Ubah prop type `allServices: Service[]` → `allServices: ServiceWithCategory[]`
- [x] Tambah state `activeCategory`
- [x] Tambah `useMemo` untuk derive `categories` dari `allServices`
- [x] Tambah `useMemo` untuk `filteredAvailableServices`
- [x] Render horizontal scroll pill sebelum card "Tambah Layanan Lain"
- [x] Pill hanya render jika `categories.length > 1`
- [x] Ganti list di card "Tambah Layanan Lain" pakai `filteredAvailableServices`

**Phase 3 — Verifikasi**
- [x] `npm run build` — tidak ada TypeScript error
- [ ] Test manual: pill muncul, klik filter, scroll horizontal
- [ ] Test: service yang sudah dipilih tidak muncul di bawah kategori manapun
- [ ] Test: pill hilang jika semua service satu kategori / tidak ada kategori
- [x] Update `docs/features.md` → status Done

---

### FEAT-003: Dashboard Customer — Tab Filter & Row Clickable

**Status**: ✅ Done
**Dimulai**: 2026-06-07
**Selesai**: 2026-06-07
**Dikerjakan oleh**: Claude

#### Deskripsi

Halaman `/dashboard` customer saat ini menampilkan semua order dalam satu list tanpa filter, dan navigasi ke detail menggunakan tombol "Detail" kecil. Fitur ini menambahkan tab filter (Dijadwalkan / Sedang Dikerjakan / Riwayat) dan membuat seluruh card row bisa diklik — tombol "Detail" dihapus.

#### Analisis API

`GET /v1/orders` sudah mengembalikan semua order customer dengan field `status`. **Tidak perlu endpoint baru.** Filtering dilakukan client-side dari data yang sudah di-fetch server-side.

#### Specs

**File yang diubah**:
- `src/app/(customer)/dashboard/page.tsx` — hapus render inline, pass `orders` ke `<OrderList>`

**File baru**:
- `src/components/customer/OrderList.tsx` — Client Component, handle tab + filter + card clickable

**Tab grouping**:
| Tab | Label UI | Status yang masuk |
|-----|----------|-------------------|
| `scheduled` | Dijadwalkan | `pending`, `confirmed` |
| `progress` | Sedang Dikerjakan | `in_progress` |
| `history` | Riwayat | `completed`, `cancelled` |

**State**:
- `activeTab: "scheduled" | "progress" | "history"` — default ke tab yang punya order (cek urutan: progress → scheduled → history)

**Tab bar**:
- 3 tab button sejajar, full width (`grid grid-cols-3`)
- Tiap tab tampilkan jumlah order sebagai badge kecil
- Tab kosong tetap tampil tapi muted, tidak disabled

**Card row**:
- Seluruh card dibungkus `<Link href="/order/{order_number}/track">`
- Hover state: `hover:bg-accent/50 transition-colors`
- Hapus tombol "Detail"
- Tampilan info tetap sama: order_number, tanggal, total, payment, status badge

**Empty state per tab**:
- Pesan berbeda tiap tab (bukan satu pesan generik)

**Acceptance criteria**:
- [ ] Tab "Dijadwalkan" menampilkan order `pending` + `confirmed`
- [ ] Tab "Sedang Dikerjakan" menampilkan order `in_progress`
- [ ] Tab "Riwayat" menampilkan order `completed` + `cancelled`
- [ ] Badge count di tiap tab akurat
- [ ] Klik seluruh card → navigasi ke `/order/:order_number/track`
- [ ] Tombol "Detail" tidak ada lagi
- [ ] Default tab adalah tab yang punya order terbanyak / progress dulu
- [ ] Empty state per tab berbeda pesannya
- [ ] Tidak ada TypeScript error

#### Phases & Checklist

**Phase 1 — Buat `OrderList.tsx`**
- [ ] Buat file `src/components/customer/OrderList.tsx`
- [ ] Import: `useState`, `Link`, `Order` type, `OrderStatusBadge`, `formatCurrency`, `formatDate`
- [ ] Define `TAB_CONFIG` mapping tab → status array + label + empty message
- [ ] Default tab logic: `in_progress` ada → "progress", else `pending/confirmed` ada → "scheduled", else "history"
- [ ] Render tab bar: `grid grid-cols-3`, tiap tab punya label + badge count
- [ ] Render filtered orders sebagai `<Link>` yang membungkus `<Card>`
- [ ] Render empty state per tab

**Phase 2 — Update `dashboard/page.tsx`**
- [ ] Import `OrderList`
- [ ] Hapus import yang tidak lagi dipakai (`buttonVariants` untuk Detail, dll)
- [ ] Ganti blok render order list dengan `<OrderList orders={orders} />`
- [ ] Pastikan empty state "belum ada order sama sekali" tetap ada (di page level, sebelum OrderList)

**Phase 3 — Verifikasi**
- [ ] `npm run build` — tidak ada TypeScript error
- [ ] Test: tab switch, count badge, klik card navigate
- [ ] Test: empty state tiap tab
- [ ] Update `docs/features.md` → status Done

---

### FEAT-004: Admin — Halaman Kelola User

**Status**: 🟡 In Progress
**Dimulai**: 2026-06-11
**Selesai**: —
**Dikerjakan oleh**: Claude

#### Deskripsi

Menu admin belum punya halaman untuk melihat dan memfilter daftar user (customer, OB, admin). Fitur ini menambahkan route `/admin/users` dengan tabel user dan filter berdasarkan role, status aktif, dan pencarian nama/email.

#### Specs

**Affected routes**:
- `/admin/users` — halaman baru

**API endpoints yang digunakan**:
- `GET /v1/admin/users` — list semua user, dengan query params: `role`, `is_active`, `search`

**Komponen baru**:
- `src/components/admin/UserManager.tsx` — Client Component: tabel user + filter UI

**File yang diubah**:
- `src/lib/api/admin.ts` — tambah `listUsers(filters?)`
- `src/lib/api/types.ts` — tambah type `UserFilters`
- `src/components/admin/AdminSidebar.tsx` — tambah link "Kelola User"

**State / data flow**:
- Server Component fetch semua user (tanpa filter) → pass ke `UserManager`
- `UserManager` handle filter client-side: role, is_active, search text

**Acceptance criteria**:
- [ ] Halaman `/admin/users` dapat diakses dari sidebar
- [ ] Tabel menampilkan: nama, email, role, unit, status aktif, tanggal daftar
- [ ] Filter role: Semua / Customer / OB / Admin
- [ ] Filter status: Semua / Aktif / Nonaktif
- [ ] Search field filter nama atau email (case-insensitive)
- [ ] Badge count total user tampil
- [ ] Tidak ada TypeScript error

#### Phases & Checklist

**Phase 1 — API & Types**
- [x] Tambah `UserFilters` ke `src/lib/api/types.ts`
- [x] Tambah `listUsers` ke `src/lib/api/admin.ts`

**Phase 2 — Komponen & Halaman**
- [x] Buat `src/components/admin/UserManager.tsx`
- [x] Buat `src/app/(admin)/admin/users/page.tsx`
- [x] Tambah link "Kelola User" ke `AdminSidebar.tsx`

**Phase 3 — Modal Edit User**
- [x] Tambah API methods: `updateUserRole`, `updateUserStatus`, `sendResetPassword` ke `adminApi`
- [x] Tambah server actions: `updateUserRoleAction`, `updateUserStatusAction`, `sendUserResetPasswordAction`
- [x] Tambah kolom "Edit" per row di `UserManager`
- [x] Buat modal: role select (disable jika admin), status toggle, tombol kirim reset password
- [x] Setelah Simpan: tutup modal + update local state
- [x] Kirim Reset Password: fire langsung, toast sukses/gagal

**Phase 4 — Verifikasi**
- [x] `npm run build` — tidak ada TypeScript error
- [ ] Test manual: filter, edit role, toggle status, kirim reset password
- [ ] Update `docs/features.md` → status Done

---

## Completed Features

<!-- Fitur yang sudah selesai. Pindahkan dari Active setelah semua checklist [x]. -->

*(Belum ada)*
