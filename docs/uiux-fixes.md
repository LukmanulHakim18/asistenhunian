# UI/UX Fix Checklist — Asisten Hunian

> Dihasilkan dari analisis UI/UX expert pada 2026-05-24.
> Implementasikan dari P0 → P3. Setiap fix disertai lokasi file dan kode konkret.

---

## P0 — Bug Kritis (Font Tidak Load)

### Fix `globals.css` — self-referential CSS variable

**File**: `src/app/globals.css` baris 10

**Problem**: `--font-sans: var(--font-sans)` adalah referensi ke diri sendiri — font Geist tidak pernah terapply, browser fall-back ke system font.

**Fix**:
```css
/* SEBELUM */
--font-sans: var(--font-sans);

/* SESUDAH */
--font-sans: var(--font-geist-sans);
```

---

## P1 — Visual Consistency (Dampak Terbesar)

### Fix 1: Selaraskan primary color dengan hero biru

**File**: `src/app/globals.css` — blok `:root`

**Problem**: `--primary: oklch(0.205 0 0)` adalah near-black, sedangkan hero menggunakan `blue-700/cyan-600`. Tombol di luar hero tampil hitam, memecah identitas visual brand.

**Fix** — ganti nilai primary dan accent di `:root`:
```css
:root {
  /* Ganti baris ini: */
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  /* Menjadi: */
  --primary: oklch(0.45 0.18 250);           /* biru sedang, selaras hero */
  --primary-foreground: oklch(0.98 0 0);     /* putih */
  --accent: oklch(0.88 0.08 195);            /* cyan muda */
  --accent-foreground: oklch(0.15 0 0);      /* near-black untuk kontras */
}
```

> Catatan: `dark` mode tidak perlu diubah karena sudah menggunakan `oklch(0.922 0 0)` (light gray) sebagai primary yang netral.

---

### Fix 2: Unify trust badge icon colors di Hero

**File**: `src/app/(public)/page.tsx` baris 78–89

**Problem**: Tiga ikon memakai tiga warna berbeda (`text-green-300`, `text-yellow-300`, `text-cyan-300`) tanpa sistem — terlihat acak.

**Fix**:
```tsx
/* SEBELUM */
<ShieldCheck className="h-4 w-4 text-green-300" />
<Clock className="h-4 w-4 text-yellow-300" />
<Sparkles className="h-4 w-4 text-cyan-300" />

/* SESUDAH — semua pakai cyan-200 agar kohesif */
<ShieldCheck className="h-4 w-4 text-cyan-200" />
<Clock className="h-4 w-4 text-cyan-200" />
<Sparkles className="h-4 w-4 text-cyan-200" />
```

---

## P2 — UX Improvement

### Fix 3: Tambah ikon brand ke Navbar

**File**: `src/components/shared/Navbar.tsx` baris 59

**Problem**: Logo hanya teks — tidak ada visual anchor untuk brand identity.

**Fix**:
```tsx
/* Tambah import di atas file */
import { Sparkles } from "lucide-react";

/* SEBELUM */
<Link href="/" className="font-bold text-lg">
  Asisten Hunian
</Link>

/* SESUDAH */
<Link href="/" className="flex items-center gap-2 font-bold text-lg" aria-label="Asisten Hunian — Kembali ke beranda">
  <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
    <Sparkles className="h-4 w-4 text-white" />
  </div>
  Asisten Hunian
</Link>
```

---

### Fix 4: Tambah subtitle di section katalog

**File**: `src/app/(public)/page.tsx` baris 103–104

**Problem**: Section "Pilih Layanan" muncul tiba-tiba tanpa konteks setelah hero — terasa patah secara visual.

**Fix**:
```tsx
/* SEBELUM */
<section className="container mx-auto px-4 py-10">
  <h2 className="text-2xl font-bold mb-6">Pilih Layanan</h2>

/* SESUDAH */
<section className="container mx-auto px-4 py-16">
  <div className="mb-8">
    <h2 className="text-2xl font-bold">Pilih Layanan</h2>
    <p className="text-muted-foreground mt-1">
      Pilih satu atau beberapa layanan sesuai kebutuhan hunian Anda
    </p>
  </div>
```

---

### Fix 5: H1 hero — tambah accent color pada kata kunci

**File**: `src/app/(public)/page.tsx` baris 52–55

**Problem**: H1 seluruhnya putih — tidak ada focal point visual.

**Fix**:
```tsx
/* SEBELUM */
<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
  Hunian Bersih,<br className="hidden sm:block" />
  Hidup Nyaman
</h1>

/* SESUDAH */
<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
  Hunian <span className="text-cyan-300">Bersih</span>,<br className="hidden sm:block" />
  Hidup Nyaman
</h1>
```

---

## P3 — Polish

### Fix 6: Card hover effect & grid max 3 kolom

**File**: `src/components/catalog/ServiceCard.tsx` baris 16

```tsx
/* SEBELUM */
<Card className="overflow-hidden flex flex-col">

/* SESUDAH */
<Card className="overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-md">
```

**File**: `src/components/catalog/ServiceCatalog.tsx` baris 81

```tsx
/* SEBELUM */
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

/* SESUDAH — max 3 kolom agar card tidak terlalu kecil */
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
```

---

### Fix 7: Footer — tambah link navigasi minimal

**File**: `src/app/(public)/layout.tsx` baris 12–14

```tsx
/* SEBELUM */
<footer className="border-t py-6 text-center text-sm text-muted-foreground">
  <p>© {new Date().getFullYear()} Asisten Hunian. Semua hak dilindungi.</p>
</footer>

/* SESUDAH */
<footer className="border-t py-8 text-sm text-muted-foreground">
  <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
    <p>© {new Date().getFullYear()} Asisten Hunian. Semua hak dilindungi.</p>
    <div className="flex gap-4">
      <Link href="/order/track" className="hover:text-foreground transition-colors">
        Cek Status Order
      </Link>
      <Link href="/login" className="hover:text-foreground transition-colors">
        Masuk
      </Link>
    </div>
  </div>
</footer>
```

> Tambah `import Link from "next/link";` di atas file jika belum ada.

---

## Aksesibilitas (Opsional tapi Dianjurkan)

**File**: `src/components/catalog/ServiceCatalog.tsx` — category filter buttons (baris 62–77)

Tambah `aria-pressed` pada tombol kategori aktif:
```tsx
<Button
  variant={activeCategory === "all" ? "default" : "outline"}
  size="sm"
  aria-pressed={activeCategory === "all"}
  onClick={() => setActiveCategory("all")}
>
```

Lakukan hal yang sama untuk setiap `categories.map(...)`.

---

## Urutan Implementasi yang Disarankan

```
1. globals.css   → P0 font fix (1 baris)
2. globals.css   → P1 primary color (4 baris)
3. page.tsx      → P1 trust badge + P2 h1 accent + P2 subtitle
4. Navbar.tsx    → P2 brand icon
5. ServiceCard   → P3 hover shadow
6. ServiceCatalog→ P3 grid cols
7. layout.tsx    → P3 footer
```

Total estimasi waktu implementasi: **~30–45 menit** untuk developer yang familiar dengan codebase.
