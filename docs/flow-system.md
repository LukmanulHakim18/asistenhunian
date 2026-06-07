# Flow System — Asisten Hunian Frontend

> Diagram dan narasi alur sistem end-to-end: auth, order lifecycle, notifikasi, dan payment.

---

## 1. Auth Flow

### 1.1 Login
```
Browser → POST /api/auth/login (Next.js route)
  → BE POST /v1/auth/login
  → dapat { token, user }
  → Set-Cookie: token=<JWT> (httpOnly), session=<JSON role/name>
  → Redirect ke dashboard sesuai role
```

### 1.2 Route Guard (Middleware)
```
Request masuk ke Next.js
  → proxy.ts cek cookie "token" & "session.role"
  → Tidak ada token + protected route → redirect /login?next=<path>
  → Role tidak sesuai → redirect ke dashboard default
    - /ob/* → hanya role "ob" atau "admin"
    - /admin/* → hanya role "admin"
    - /dashboard, /profile → hanya authenticated (semua role)
```

### 1.3 Logout
```
Browser → POST /api/auth/logout (Next.js route)
  → Delete cookie "token" dan "session"
  → Redirect /login
```

---

## 2. Order Flow (Customer)

### 2.1 Pembuatan Order
```
/order (OrderForm)
  → Pilih layanan dari katalog GET /v1/services
  → Isi data: nama, email, phone, unit, tanggal, metode bayar, catatan
  → Submit → POST /v1/orders
  → Response: { order_number, midtrans_payment_url? }
    - Jika payment_method = "qris" → redirect ke Midtrans Snap URL
    - Jika "cash"/"transfer" → redirect ke /order/<order_number>/success
```

### 2.2 Tracking Order
```
/order/track (cari by nomor order)
  → /order/<order_number>/track
    → GET /v1/orders/track/<order_number> (tanpa auth)
    → Tampil status, item, history
```

### 2.3 Dashboard Customer
```
/dashboard
  → GET /v1/orders (role-aware: hanya order milik user ini)
  → List order dengan status badge
  → Klik detail → GET /v1/orders/:id
```

---

## 3. Order Lifecycle

```
pending
  │  (Admin konfirmasi + assign OB per item)
  ▼
confirmed
  │  (OB mulai kerjakan → update item status ke in_progress)
  ▼
in_progress
  │  (Semua item selesai)
  ▼
completed
```

```
(Di manapun) → cancelled
  - Customer bisa cancel dari /dashboard (status → cancelled)
  - Admin bisa cancel dari admin panel
```

### 3.1 Status Item vs Order

Order status bergerak berdasarkan agregasi item:
- Semua item `pending` → order `confirmed`
- Ada item `in_progress` → order `in_progress`
- Semua item `completed` → order `completed`

> Logika agregasi ada di BE; FE hanya menampilkan status yang dikirim API.

---

## 4. Admin Flow — Konfirmasi Order

```
/admin/orders
  → GET /v1/admin/orders (semua order)
  → Klik order → /admin/orders/:id
    → AdminOrderDetail
      → Per item: pilih OB dari dropdown (GET /v1/admin/ob)
      → Tombol "Konfirmasi Order"
        → POST /v1/admin/orders/:id/confirm
           body: { items: [{ item_id, ob_id }, ...] }
        → BE assign OB ke setiap item + status order → confirmed
        → Notifikasi WA dikirim BE ke customer & OB
```

### 4.1 Re-assign OB
```
(Setelah confirmed)
  → Admin klik re-assign per item
    → PATCH /v1/admin/orders/:id/items/:itemId/assign
       body: { ob_id }
```

---

## 5. OB Flow

```
/ob/orders
  → GET /v1/orders (role=ob: hanya order dengan item assigned ke OB ini)
  → Klik order → /ob/orders/:id
    → Lihat detail item yang di-assign
    → Update status item:
      → PATCH /v1/orders/:id/items/:itemId/status
         body: { status, notes? }
```

```
/ob/earnings
  → Kalkulasi total earnings dari item completed (kalkulasi di FE dari list order)
```

---

## 6. Payment Flow

### 6.1 QRIS / Online (Midtrans)
```
Buat order → BE buat Midtrans Snap token → FE redirect ke midtrans_payment_url
  → Customer bayar di halaman Midtrans
  → Midtrans webhook ke BE → BE update payment_status = "paid"
  → Customer redirect ke /order/<order_number>/success
```

### 6.2 Cash / Transfer
```
Buat order → BE simpan order (payment_status = "unpaid")
  → Customer bayar manual (cash saat OB datang, atau transfer ke rekening)
  → Admin konfirmasi pembayaran → update payment_status via admin panel
```

---

## 7. Notifikasi Flow

Semua notifikasi **dikirim oleh BE**, bukan FE:

| Event                  | Channel    | Penerima        |
|------------------------|------------|-----------------|
| Order baru dibuat      | WA + Email | Customer        |
| Email verifikasi       | Email      | Customer        |
| Reset password         | Email      | Customer        |
| Order dikonfirmasi     | WA         | Customer + OB   |
| OB di-assign ke item   | WA         | OB              |
| Order selesai          | WA         | Customer        |
| Invoice                | Email      | Customer        |

FE hanya menampilkan link WA admin dari config `admin_wa` untuk customer chat manual.

---

## 8. Config Flow

```
/admin/settings
  → GET /v1/config → tampil semua config key
  → Admin edit value → PUT /v1/admin/config/:key
     body: { type, value, description? }
  → Config live: FE baca config saat render (tidak di-cache lama)
```

---

## 9. Route Map

```
(public)
  /                          → Halaman utama + katalog
  /login                     → Login form
  /register                  → Registrasi customer
  /verify-email              → Verifikasi OTP email
  /forgot-password           → Lupa password
  /reset-password            → Reset dengan token
  /order                     → Form pesan layanan
  /order/track               → Cari order by nomor
  /order/:order_number/track → Halaman tracking
  /order/:order_number/success → Sukses bayar

(customer — auth required)
  /dashboard                 → Daftar order customer
  /profile                   → Edit profil

(ob — role ob/admin)
  /ob/dashboard              → Ringkasan tugas OB
  /ob/orders                 → List order ter-assign
  /ob/orders/:id             → Detail + update item status
  /ob/earnings               → Riwayat pendapatan

(admin — role admin)
  /admin/dashboard           → Ringkasan admin
  /admin/orders              → List semua order
  /admin/orders/:id          → Detail + konfirmasi + assign OB
  /admin/ob                  → Kelola akun OB
  /admin/catalog             → Kelola layanan & kategori
  /admin/laporan             → Laporan keuangan bulanan
  /admin/settings            → Konfigurasi sistem
```
