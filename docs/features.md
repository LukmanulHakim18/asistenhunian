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

*(Tidak ada fitur aktif saat ini)*

---

### FEAT-011: Review Order — Customer & Admin

**Status**: ✅ Done
**Dimulai**: 2026-06-13
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Customer bisa memberikan ulasan (rating bintang 1–5 + komentar opsional) untuk order yang sudah selesai. Admin bisa melihat semua ulasan di halaman baru "Manajemen Review".

#### Specs

**API endpoints**:
- `POST /v1/orders/:id/review` — submit review (customer, 201 sukses, 400 jika sudah pernah)
- `GET /v1/admin/reviews` — list semua review

**Customer side**:
- `ReviewSection` muncul di track page hanya jika `status === "completed"`
- Jika `order.review` sudah ada (dari API): langsung tampil review lama, form tidak muncul
- Jika belum ada: tampil form bintang interaktif + textarea komentar
- Setelah submit 201: simpan ke local state, tampilkan review tanpa reload
- Error 400 (sudah pernah review): toast error dengan pesan dari server

**Admin side**:
- Halaman `/admin/reviews` menampilkan tabel: order_id (link ke detail), rating bintang, komentar, tanggal
- Header menampilkan jumlah total ulasan dan rata-rata bintang
- Link "Manajemen Review" ditambahkan ke sidebar admin

**File baru**:
- `src/components/order/ReviewSection.tsx` — Client Component: StarPicker + form + tampilan review
- `src/app/(admin)/admin/reviews/page.tsx` — Server Component: tabel semua review

**File diubah**:
- `src/lib/api/types.ts` — tambah `Review`, `ReviewRequest`; tambah `review?: Review | null` ke `Order`
- `src/lib/api/orders.ts` — tambah `submitReview`
- `src/lib/api/admin.ts` — tambah `listReviews`
- `src/lib/actions/orders.ts` — tambah `submitReviewAction` (return `Review`)
- `src/app/(public)/order/[order_number]/track/page.tsx` — render `ReviewSection` jika completed
- `src/components/admin/AdminSidebar.tsx` — tambah link "Manajemen Review" + import `Star` icon

#### Phases & Checklist

- [x] Tambah `Review`, `ReviewRequest` types; `review?` ke `Order`
- [x] Tambah `submitReview` ke `ordersApi`
- [x] Tambah `listReviews` ke `adminApi`
- [x] Tambah `submitReviewAction` server action
- [x] Buat `ReviewSection.tsx`: StarPicker interaktif, form, tampilan review setelah submit
- [x] Tambah `ReviewSection` ke track page (hanya jika `completed` + `order.id` ada)
- [x] Buat `/admin/reviews/page.tsx` dengan tabel + rata-rata bintang
- [x] Tambah "Manajemen Review" ke `AdminSidebar.tsx`
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

## Completed Features

---

### FEAT-001: Navbar Profile Menu (Customer)

**Status**: ✅ Done
**Dimulai**: 2026-06-07
**Selesai**: 2026-06-07
**Dikerjakan oleh**: Claude

#### Deskripsi

Menambahkan dropdown menu di Navbar yang berisi link ke Profil dan tombol Keluar. Sebelumnya navbar hanya punya tombol "Dashboard" dan "Keluar" tanpa akses langsung ke `/profile`.

#### Specs

**File yang diubah**:
- `src/components/shared/Navbar.tsx`

**Komponen shadcn/ui**: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`

**Perilaku**:
- Logged in: nama user sebagai trigger dropdown → "Profil" (customer only) + "Keluar"
- Belum login: tidak berubah — tombol "Masuk" tetap

#### Phases & Checklist

**Phase 1–2 — Implementasi**
- [x] Ganti blok `session ? (...)` dengan `DropdownMenu`
- [x] Link "Profil" hanya muncul jika `role === "customer"`
- [x] `handleSignOut` dipanggil dari dalam `DropdownMenuItem`

**Phase 3 — Verifikasi**
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-002: Category Horizontal Scroll di Halaman Order

**Status**: ✅ Done
**Dimulai**: 2026-06-07
**Selesai**: 2026-06-07
**Dikerjakan oleh**: Claude

#### Deskripsi

Menambahkan horizontal scroll pill kategori di atas list layanan Step 1 form order. Sebelumnya semua layanan tampil dalam satu list vertikal panjang tanpa filter kategori.

#### Specs

**File yang diubah**:
- `src/components/order/OrderForm.tsx`

**State baru**: `activeCategory: string` — default `"all"`

**Logika**: derive kategori dari `allServices` via `useMemo`, filter `filteredAvailableServices` berdasarkan `activeCategory`. Pill tidak muncul jika hanya ada 0–1 kategori.

#### Phases & Checklist

- [x] Tambah state `activeCategory` dan `useMemo` derive kategori
- [x] Render horizontal scroll pill sebelum card "Tambah Layanan Lain"
- [x] Ganti list layanan pakai `filteredAvailableServices`
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-003: Dashboard Customer — Tab Filter & Row Clickable

**Status**: ✅ Done
**Dimulai**: 2026-06-07
**Selesai**: 2026-06-07
**Dikerjakan oleh**: Claude

#### Deskripsi

Menambahkan tab filter (Dijadwalkan / Sedang Dikerjakan / Riwayat) dan membuat seluruh card row bisa diklik di halaman `/dashboard` customer. Tombol "Detail" dihapus.

#### Specs

**File baru**:
- `src/components/customer/OrderList.tsx` — Client Component, handle tab + filter + card clickable

**File yang diubah**:
- `src/app/(customer)/dashboard/page.tsx` — pass `orders` ke `<OrderList>`

**Tab grouping**:
| Tab | Label UI | Status |
|-----|----------|--------|
| `scheduled` | Dijadwalkan | `pending`, `confirmed` |
| `progress` | Sedang Dikerjakan | `in_progress` |
| `history` | Riwayat | `completed`, `cancelled` |

#### Phases & Checklist

- [x] Buat `OrderList.tsx` dengan tab, badge count, card clickable
- [x] Update `dashboard/page.tsx` → render `<OrderList>`
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-004: Admin — Halaman Kelola User

**Status**: ✅ Done
**Dimulai**: 2026-06-11
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Halaman `/admin/users` untuk melihat, memfilter, dan mengedit daftar user (customer, OB, admin). Admin bisa ubah role, toggle status aktif, dan kirim email reset password langsung dari modal edit.

#### Specs

**Affected routes**:
- `/admin/users` — halaman baru

**API endpoints**:
- `GET /v1/admin/users?role=&is_active=` — list user (filter server-side untuk role & is_active, search client-side)
- `PATCH /v1/admin/users/:id/role` — ubah role customer ↔ ob (diblokir jika target admin)
- `PATCH /v1/admin/users/:id/status` — toggle is_active
- `POST /v1/admin/users/:id/send-reset-password` — trigger email reset password

**File baru**:
- `src/components/admin/UserManager.tsx` — tabel user + filter + modal edit
- `src/app/(admin)/admin/users/page.tsx` — Server Component, fetch + render UserManager

**File diubah**:
- `src/lib/api/types.ts` — tambah `UserFilters`
- `src/lib/api/admin.ts` — tambah `listUsers`, `updateUserRole`, `updateUserStatus`, `sendResetPassword`
- `src/lib/actions/admin.ts` — tambah `updateUserRoleAction`, `updateUserStatusAction`, `sendUserResetPasswordAction`
- `src/components/admin/AdminSidebar.tsx` — tambah link "Kelola User"

**Fitur modal edit**:
- Role Select (disabled + pesan jika target admin)
- Status toggle: Aktif / Nonaktif
- Tombol "Kirim Reset Password" (fire langsung, toast sukses/gagal)
- Tombol "Simpan" disabled jika tidak ada perubahan (`hasChanges` guard)

#### Phases & Checklist

- [x] Tambah `UserFilters` ke types, `listUsers` ke admin API
- [x] Buat `UserManager.tsx` dengan tabel, filter role & status, search client-side
- [x] Buat `/admin/users/page.tsx`
- [x] Tambah link "Kelola User" ke sidebar
- [x] Tambah API methods edit + reset password
- [x] Tambah server actions
- [x] Buat modal edit: role select, status toggle, kirim reset password
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-005: Cancel Order — Customer & Admin

**Status**: ✅ Done
**Dimulai**: 2026-06-12
**Selesai**: 2026-06-12
**Dikerjakan oleh**: Claude

#### Deskripsi

Customer bisa membatalkan order dengan status `pending`. Admin bisa membatalkan order dengan semua status kecuali `completed` dan `cancelled`. Keduanya menggunakan modal konfirmasi shared dengan textarea alasan (opsional untuk customer, wajib untuk admin).

#### Specs

**API endpoints**:
- `POST /v1/orders/:id/cancel` — customer (hanya `pending`)
- `POST /v1/admin/orders/:id/cancel` — admin (semua kecuali completed/cancelled)

**File baru**:
- `src/components/order/CancelConfirmModal.tsx` — modal shared, prop `requireReason`
- `src/components/order/CancelOrderButton.tsx` — tombol cancel untuk track page

**File diubah**:
- `src/lib/api/types.ts` — tambah `cancel_reason` ke `Order`
- `src/lib/api/orders.ts` — tambah `cancelOrder`
- `src/lib/api/admin.ts` — tambah `cancelOrder`
- `src/lib/actions/orders.ts` — tambah `cancelOrderAction` + `revalidatePath("/dashboard")`
- `src/lib/actions/admin.ts` — tambah `adminCancelOrderAction`
- `src/app/(public)/order/[order_number]/track/page.tsx` — `CancelOrderButton` + tampilkan `cancel_reason`
- `src/components/customer/OrderList.tsx` — tombol "Batalkan" di card pending, `e.stopPropagation()`
- `src/components/admin/AdminOrderDetail.tsx` — ganti `CancelSection` inline → modal
- `src/components/admin/AdminOrdersTable.tsx` — kolom "Aksi" + tombol Batalkan per row

**Catatan implementasi**:
- `OrderList.tsx` card diubah dari `<Link>` → `div` + `router.push()` agar `e.stopPropagation()` bisa dipakai pada tombol Batalkan
- Setelah cancel di `OrderList`: update local state status → `cancelled`, auto-switch ke tab "history"

#### Phases & Checklist

- [x] Tambah types + API methods + server actions
- [x] Buat `CancelConfirmModal.tsx` (shared, reset reason saat tutup)
- [x] Buat `CancelOrderButton.tsx` untuk track page
- [x] Update `OrderList.tsx`: tombol Batalkan di pending cards + card div trick
- [x] Update `AdminOrdersTable.tsx`: kolom Aksi + `requireReason` modal
- [x] Update `AdminOrderDetail.tsx`: ganti CancelSection inline → modal
- [x] Tampilkan `cancel_reason` di track page
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-006: Track Page — Data Lengkap (Unit Number & Payment Method)

**Status**: ✅ Done
**Dimulai**: 2026-06-13
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Halaman track publik (`/order/:order_number/track`) hanya menampilkan 6 field dari endpoint publik — `unit_number` dan `payment_method` kosong karena tidak dikembalikan oleh `GET /v1/orders/track/:order_number`. Fix dengan parallel fetch authenticated list dan merge data.

#### Specs

**Masalah**:
- `GET /v1/orders/track/:order_number` (publik) hanya mengembalikan: `order_number`, `status`, `items`, `status_history`, `customer_name`, `scheduled_date`
- Field penting seperti `unit_number`, `payment_method`, `total`, `platform_fee`, `confirmed_datetime`, `midtrans_payment_url` hilang

**Solusi**:
- Parallel fetch: `ordersApi.track()` + `ordersApi.list()` via `Promise.allSettled`
- Merge: `trackData` (items, status_history) + `authOrder` (semua field lengkap)
- Graceful fallback: jika user tidak login / list gagal, tetap tampil dari trackData saja

**File diubah**:
- `src/app/(public)/order/[order_number]/track/page.tsx`
  - `Promise.allSettled` untuk kedua fetch
  - Merge object: spread trackData lalu override dengan authOrder
  - Kondisi `showQris` dan `showPayButton` untuk display pembayaran
  - `PAYMENT_METHOD_LABEL` record untuk label tampilan
  - `unit_number` hanya render jika ada nilainya
  - `export const dynamic = "force-dynamic"`

#### Phases & Checklist

- [x] Ubah fetch menjadi `Promise.allSettled([track, list])`
- [x] Merge `trackData` + `authOrder` dengan priority authOrder
- [x] Tambah `PAYMENT_METHOD_LABEL` mapping
- [x] Render `unit_number` conditional
- [x] Render `payment_method` dengan label yang benar
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-007: QRIS Payment — End-to-End Support

**Status**: ✅ Done
**Dimulai**: 2026-06-13
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Menambahkan QRIS sebagai opsi pembayaran di form order, dan menampilkan QR code di halaman track setelah order dikonfirmasi admin. QRIS dikonfirmasi otomatis via webhook Midtrans — tombol "Konfirmasi Pembayaran" admin disembunyikan untuk QRIS.

#### Specs

**Flow QRIS**:
1. Customer pilih "QRIS — Scan QR Code setelah dikonfirmasi admin" di Step 1 form order
2. Admin konfirmasi order → Midtrans generate `midtrans_payment_url` (URL gambar QR, bukan redirect)
3. Customer buka track page → tampil QR code untuk di-scan
4. Setelah scan → webhook Midtrans update `payment_status` otomatis

**File baru**:
- `src/components/order/QrisPayment.tsx` — tampilkan QR code via Next.js `<Image unoptimized>`

**File diubah**:
- `src/components/order/OrderForm.tsx` — tambah `<SelectItem value="qris">` di Step 1
- `src/app/(public)/order/[order_number]/track/page.tsx` — `showQris` + `QrisPayment` component
- `src/components/admin/AdminOrderDetail.tsx` — sembunyikan "Konfirmasi Pembayaran" jika `payment_method === "qris"`

**Catatan teknis**:
- `midtrans_payment_url` untuk QRIS adalah URL gambar (bukan redirect URL)
- Harus render sebagai `<Image>` dengan `unoptimized` karena domain eksternal
- Konfirmasi admin hanya untuk `cash` dan `transfer`

#### Phases & Checklist

- [x] Tambah opsi QRIS di `OrderForm.tsx` Step 1
- [x] Buat `QrisPayment.tsx` dengan `<Image unoptimized>`
- [x] Tambah logika `showQris` di track page
- [x] Sembunyikan "Konfirmasi Pembayaran" untuk QRIS di `AdminOrderDetail.tsx`
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-008: Admin Payment Management

**Status**: ✅ Done
**Dimulai**: 2026-06-13
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Tiga peningkatan di area admin: tombol konfirmasi pembayaran manual (cash/transfer), section riwayat pembayaran, dan banner sandbox agar admin tahu sedang di environment non-produksi.

#### Specs

**Fitur 1 — Konfirmasi Pembayaran**
- Tombol "Konfirmasi Pembayaran" muncul di sidebar kanan detail order
- Kondisi tampil: `payment_method !== "qris"` && `payment_status === "unpaid"` && status bukan `cancelled`/`completed`
- Textarea opsional untuk catatan
- API: `PATCH /v1/admin/orders/:id/payment`
- Setelah sukses: `router.refresh()`

**Fitur 2 — Riwayat Pembayaran**
- Section di bawah konfirmasi di detail order
- API: `GET /v1/admin/orders/:id/payment-logs`
- Tampil: source (Midtrans/Manual), status, nominal, catatan, dikonfirmasi oleh, tanggal

**Fitur 3 — Sandbox Banner**
- Strip kuning di atas semua halaman admin
- API: `GET /health` → `{ env: "sandbox" | "production" }`
- Revalidate 5 menit, tidak tampil jika `env !== "sandbox"`

**File baru**:
- `src/components/admin/SandboxBanner.tsx` — Server Component async

**File diubah**:
- `src/lib/api/types.ts` — tambah `PaymentLog`, `ConfirmPaymentRequest`
- `src/lib/api/admin.ts` — tambah `confirmPayment`, `getPaymentLogs`
- `src/lib/actions/admin.ts` — tambah `confirmPaymentAction`
- `src/components/admin/AdminOrderDetail.tsx` — tambah `ConfirmPaymentSection` + `PaymentLogsSection`
- `src/app/(admin)/admin/orders/[id]/page.tsx` — fetch `paymentLogs`, pass ke `AdminOrderDetail`
- `src/app/(admin)/layout.tsx` — render `<SandboxBanner />` di atas `<main>`

#### Phases & Checklist

- [x] Tambah `PaymentLog` type dan API methods
- [x] Tambah `confirmPaymentAction` server action
- [x] Buat `ConfirmPaymentSection` di `AdminOrderDetail.tsx`
- [x] Buat `PaymentLogsSection` di `AdminOrderDetail.tsx`
- [x] Fetch `paymentLogs` di `/admin/orders/[id]/page.tsx`
- [x] Buat `SandboxBanner.tsx`
- [x] Tambah `SandboxBanner` ke admin layout
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-009: Laporan Page — Migrasi ke Endpoint Baru

**Status**: ✅ Done
**Dimulai**: 2026-06-13
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Halaman laporan admin sebelumnya menghitung data dari semua order secara client-side. Dimigrasikan ke `GET /v1/admin/laporan` yang mengembalikan data sudah teragregasi per bulan, termasuk kolom QRIS dan `completed_orders` yang baru.

#### Specs

**API endpoint baru**:
- `GET /v1/admin/laporan` → `LaporanRow[]` per bulan

**Field `LaporanRow`**:
- `month`, `year`, `total_revenue`, `cash_revenue`, `transfer_revenue`, `qris_revenue` (baru), `completed_orders` (baru)

**File diubah**:
- `src/lib/api/types.ts` — update `LaporanRow` tambah `qris_revenue`, `completed_orders`
- `src/lib/api/admin.ts` — tambah/update `laporan()` method
- `src/app/(admin)/admin/laporan/page.tsx` — tulis ulang: gunakan `adminApi.laporan()`, tambah kolom QRIS dan Selesai

**Summary cards**: Total Bruto, Tunai, Transfer, QRIS (ganti dari 3 card sebelumnya)

#### Phases & Checklist

- [x] Update `LaporanRow` type
- [x] Update/tambah `laporan()` API method
- [x] Tulis ulang `laporan/page.tsx`: fetch dari endpoint, tabel dengan kolom QRIS + Selesai
- [x] Update summary cards: 4 card termasuk QRIS
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done

---

### FEAT-010: UI/UX Tweaks — Footer, Form, Sidebar

**Status**: ✅ Done
**Dimulai**: 2026-06-13
**Selesai**: 2026-06-13
**Dikerjakan oleh**: Claude

#### Deskripsi

Beberapa perbaikan UI/UX kecil yang dikerjakan dalam satu sesi: footer public, posisi tombol lanjut di form order, dan pembersihan menu sidebar admin.

#### Specs

**1. Footer — Hapus link & tambah kredit pengembang**
- File: `src/app/(public)/layout.tsx`
- Hapus link "Cek Status Order" dan "Masuk" dari footer
- Tambah: `Dikembangkan oleh APCorp`

**2. Tombol "Lanjut →" dipindah ke dalam card Total**
- File: `src/components/order/OrderForm.tsx`
- Sebelumnya: tombol di bawah card, user perlu scroll jauh
- Sesudah: tombol langsung di bawah baris Total dalam card "Layanan Dipilih"
- Card hanya tampil jika `items.length > 0`, jadi `disabled` tidak diperlukan

**3. Hapus menu "Kelola OB" dari sidebar admin**
- File: `src/components/admin/AdminSidebar.tsx`
- Hapus entry "Kelola OB" dan import icon `Users` yang tidak terpakai

#### Phases & Checklist

- [x] Footer: hapus dua link, tambah kredit APCorp
- [x] Form order: pindah tombol "Lanjut →" ke dalam card Total
- [x] Sidebar: hapus entry "Kelola OB" + cleanup import
- [x] `npm run build` — tidak ada TypeScript error
- [x] Update `docs/features.md` → status Done
