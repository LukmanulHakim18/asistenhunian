# Bug Report: Tab Kategori Tidak Berfungsi di Mobile

| Field | Detail |
|---|---|
| **ID** | BUG-001 |
| **Tanggal** | 2026-05-24 |
| **Severity** | High |
| **Status** | Open |
| **Reporter** | UI/UX Analysis |
| **Assignee** | — |

---

## Deskripsi

Tab filter kategori pada halaman utama (katalog layanan) tidak merespons tap di perangkat mobile. Ketika pengguna mengetuk salah satu tombol kategori, daftar layanan di bawahnya tidak berubah — seolah-olah filter tidak bekerja.

---

## Langkah Reproduksi

1. Buka `http://localhost:3000/` di perangkat mobile (atau Chrome DevTools → mode responsive)
2. Scroll ke bawah hingga bagian **"Pilih Layanan"**
3. Ketuk salah satu tombol kategori (contoh: **"Kasur & Sprei"**)
4. Amati daftar layanan di bawah tombol

**Expected:** Daftar layanan hanya menampilkan layanan dari kategori yang dipilih.

**Actual:** Daftar layanan tidak berubah, semua layanan tetap tampil.

---

## Root Cause

### Penyebab Utama — `flex-wrap` menyebabkan tap tidak terdaftar

**File:** `src/components/catalog/ServiceCatalog.tsx` baris 60

```tsx
// KODE BERMASALAH
<div className="flex gap-2 flex-wrap mb-6">
```

Di layar mobile (lebar < 640px), 6 tombol dengan nama panjang (`"Kebersihan Unit"`, `"Kasur & Sprei"`, `"Karpet & Lantai"`, dst.) terpaksa wrap ke baris kedua dan ketiga:

```
┌─────────────────────────────┐  ← mobile screen ~375px
│ [Semua] [Kebersihan Unit]   │  ← baris 1
│ [Kasur & Sprei][Karpet & L] │  ← baris 2  ← tap sering miss
│ [Kamar Mandi] [Dapur]       │  ← baris 3  ← terlalu dekat card
├─────────────────────────────┤
│  🏠 Service Card...         │  ← card langsung di bawah
```

Ketika jarak vertikal antar elemen terlalu pendek, **mobile browser menginterpretasikan gestur sebagai scroll**, bukan tap. Event `onClick` tidak pernah terpanggil sehingga `setActiveCategory` tidak dieksekusi — state `activeCategory` tetap `"all"`.

### Penyebab Sekunder — Touch target terlalu kecil

Tombol menggunakan `size="sm"` dari shadcn Button. Tinggi tombol kecil ini bisa berada di bawah rekomendasi Apple/Google yaitu **44×44px minimum touch target**. Ini memperburuk akurasi tap di baris kedua dan ketiga.

---

## Impact

- Seluruh fitur filter katalog **tidak dapat digunakan** di mobile
- Pengguna mobile tidak bisa menavigasi layanan berdasarkan kategori
- Berpotensi meningkatkan bounce rate karena user kesulitan menemukan layanan spesifik

---

## Fix yang Direkomendasikan

Ganti `flex-wrap` dengan **horizontal scroll row** — pola standar aplikasi e-commerce mobile.

**File:** `src/components/catalog/ServiceCatalog.tsx` baris 60

```tsx
// SEBELUM
<div className="flex gap-2 flex-wrap mb-6">

// SESUDAH
<div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none -mx-4 px-4">
```

Penjelasan tiap properti:

| Property | Fungsi |
|---|---|
| `overflow-x-auto` | Scroll horizontal, tombol tidak wrap ke baris baru |
| `pb-2` | Padding bawah agar scrollbar tidak memotong tombol |
| `scrollbar-none` | Sembunyikan scrollbar (tetap bisa scroll) |
| `-mx-4 px-4` | Edge-to-edge — tombol pertama dan terakhir tidak terpotong layar |

Perlu tambahkan utility `scrollbar-none` ke Tailwind config jika belum ada:

```ts
// tailwind.config.ts
plugins: [
  plugin(({ addUtilities }) => {
    addUtilities({
      ".scrollbar-none": {
        "-ms-overflow-style": "none",
        "scrollbar-width": "none",
        "&::-webkit-scrollbar": { display: "none" },
      },
    });
  }),
],
```

Atau gunakan package `tailwind-scrollbar-hide`:
```bash
npm install tailwind-scrollbar-hide
```

---

## Testing Checklist

Setelah fix diimplementasikan, verifikasi pada:

- [ ] Chrome Android (Pixel / Samsung)
- [ ] Safari iOS (iPhone SE kecil → iPhone Pro Max besar)
- [ ] Chrome DevTools responsive mode — lebar 375px, 390px, 414px
- [ ] Tap setiap tombol kategori → daftar layanan berubah sesuai kategori
- [ ] Scroll horizontal tab berfungsi smooth
- [ ] Tombol "Semua" me-reset filter ke semua layanan
- [ ] Tidak ada regresi di desktop (lebar ≥ 640px)

---

## File Terdampak

```
src/components/catalog/ServiceCatalog.tsx   ← fix utama (1 baris)
tailwind.config.ts                          ← tambah scrollbar-none utility
```

---

## Referensi

- [Apple HIG — Touch Target Size](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Google Material — Touch targets](https://m3.material.io/foundations/accessible-design/accessibility-basics#28032e45-c598-450c-b355-f9fe737b1cd8)
- Pattern serupa: Tokopedia, Shopee, GoFood category tabs (semua pakai horizontal scroll)
