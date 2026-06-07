# Meta-Spec — Asisten Hunian Frontend (jasa-rusun)

> Service specification: domain model, API contract, auth model, dan batasan sistem.

---

## 1. Identitas Layanan

| Atribut        | Nilai                                      |
|----------------|--------------------------------------------|
| Nama internal  | `jasa-rusun`                               |
| Repo           | `asisten-hunian-fe`                        |
| Runtime        | Next.js 16.2.6 / React 19 / TypeScript     |
| Hosting target | Vercel (atau Node server)                  |
| Backend API    | `https://api.asistenhunian.com` (REST/JSON)|
| Auth           | JWT via httpOnly cookie `token`            |

---

## 2. Domain & Role

### 2.1 User Roles

| Role       | Akses                                             |
|------------|---------------------------------------------------|
| `customer` | Pesan layanan, tracking order, lihat invoice      |
| `ob`       | Lihat & update status order/item yang di-assign   |
| `admin`    | Kelola OB, konfirmasi order, laporan keuangan     |

### 2.2 Entitas Utama

#### User
```ts
id, email, full_name, phone, role, unit_number, is_active, email_verified
```

#### ServiceCategory
```ts
id, name, slug, sort_order
```

#### Service
```ts
id, category_id, name, description, price, image_url, is_active, sort_order
```

#### Order
```ts
id, order_number, customer_id, customer_name, customer_email, customer_phone,
unit_number, requested_date, preferred_time_note, confirmed_datetime,
status: OrderStatus, payment_method: PaymentMethod, payment_status: PaymentStatus,
subtotal, total, platform_fee, notes,
invoice_pdf_url, midtrans_transaction_id, midtrans_payment_url
items?: OrderItem[], status_history?: OrderStatusHistory[]
```

#### OrderItem
```ts
id, order_id, service_id, service_name, service_price, quantity, subtotal,
ob_id, status: OrderItemStatus, notes
```

### 2.3 Enums

```ts
OrderStatus      = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
OrderItemStatus  = "pending" | "in_progress" | "completed" | "cancelled"
PaymentMethod    = "cash" | "transfer" | "qris"
PaymentStatus    = "unpaid" | "paid"
UserRole         = "customer" | "ob" | "admin"
ConfigType       = "string" | "number" | "bool" | "json"
```

---

## 3. API Contract

Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `https://api.asistenhunian.com`)

Semua endpoint API berawalan `/v1/`. Response sukses dibungkus `{ data: T }` untuk endpoint data.

### 3.1 Auth

| Method | Path                          | Auth | Keterangan                          |
|--------|-------------------------------|------|-------------------------------------|
| POST   | `/v1/auth/login`              | —    | Login, dapat JWT + User             |
| POST   | `/v1/auth/register`           | —    | Daftar akun customer                |
| GET    | `/v1/auth/me`                 | JWT  | Profil user saat ini                |
| POST   | `/v1/auth/forgot-password`    | —    | Kirim email reset password          |
| POST   | `/v1/auth/reset-password`     | —    | Reset password dengan token         |
| POST   | `/v1/auth/change-password`    | JWT  | Ganti password                      |
| POST   | `/v1/auth/verify-email`       | —    | Verifikasi OTP email                |
| POST   | `/v1/auth/resend-verification`| —    | Kirim ulang OTP                     |

### 3.2 Services (Katalog)

| Method | Path               | Auth | Keterangan            |
|--------|--------------------|------|-----------------------|
| GET    | `/v1/services`     | —    | List layanan aktif    |
| GET    | `/v1/categories`   | —    | List kategori layanan |

### 3.3 Orders

| Method | Path                                      | Auth | Keterangan                              |
|--------|-------------------------------------------|------|-----------------------------------------|
| POST   | `/v1/orders`                              | JWT  | Buat order baru                         |
| GET    | `/v1/orders`                              | JWT  | List order (role-aware)                 |
| GET    | `/v1/orders/:id`                          | JWT  | Detail order dengan items & history     |
| GET    | `/v1/orders/track/:order_number`          | —    | Tracking publik by order_number         |
| PATCH  | `/v1/orders/:id/status`                   | JWT  | Update status order                     |
| PATCH  | `/v1/orders/:id/items/:itemId/status`     | JWT  | OB update status item yang di-assign   |

### 3.4 Admin

| Method | Path                                          | Auth (admin) | Keterangan                        |
|--------|-----------------------------------------------|--------------|-----------------------------------|
| GET    | `/v1/admin/orders`                            | JWT+admin    | List semua order                  |
| POST   | `/v1/admin/orders/:id/confirm`                | JWT+admin    | Konfirmasi order + assign OB/item |
| PATCH  | `/v1/admin/orders/:id/items/:itemId/assign`   | JWT+admin    | Assign/re-assign OB ke item       |
| GET    | `/v1/admin/ob`                                | JWT+admin    | List semua OB                     |
| POST   | `/v1/admin/ob`                                | JWT+admin    | Buat akun OB baru                 |
| PATCH  | `/v1/admin/ob/:id`                            | JWT+admin    | Update data OB                    |
| GET    | `/v1/admin/laporan`                           | JWT+admin    | Laporan keuangan (by month)       |
| GET    | `/v1/config`                                  | JWT          | Baca semua config                 |
| PUT    | `/v1/admin/config/:key`                       | JWT+admin    | Set nilai config                  |

### 3.5 Config Keys yang Digunakan FE

| Key              | Type   | Keterangan                          |
|------------------|--------|-------------------------------------|
| `admin_wa`       | string | Nomor WA admin (untuk customer chat)|
| `bank_account`   | json   | Info rekening transfer              |
| `platform_fee`   | number | Biaya platform (Rp)                 |

---

## 4. Auth Model

- JWT disimpan di **httpOnly cookie** bernama `token` (set dari `/api/auth/login` dan `/api/auth/logout` Next.js routes).
- Session ring info (role, dll) disimpan di cookie `session` (JSON plain, tidak signed).
- Middleware `proxy.ts` memproteksi rute berdasarkan prefix path dan cookie `session.role`.
- Server Components membaca cookie via `serverFetch` / `serverFetchData` yang otomatis menyertakan `Authorization: Bearer <token>`.
- Client Components memakai `apiFetch` / `apiFetchData` dengan token yang di-pass secara eksplisit (atau tanpa auth untuk endpoint publik).

---

## 5. Integrasi Eksternal

| Service    | Penggunaan                                                   |
|------------|--------------------------------------------------------------|
| Midtrans   | Payment Snap untuk metode `qris`/`transfer`; webhook via BE |
| Resend     | Kirim email (invoice, OTP, reset password) via BE            |
| Fonnte     | Notifikasi WhatsApp ke customer/OB via BE                    |

> FE **tidak** memanggil Midtrans/Resend/Fonnte secara langsung — semua dihandle BE.

---

## 6. Batasan & Asumsi

- FE adalah **thin client**: tidak ada DB langsung, tidak ada business logic di FE.
- Seluruh validasi otorisasi dilakukan di BE; FE hanya menjaga UX (redirect, dll).
- `order_number` bersifat publik (bisa di-share untuk tracking); `id` (UUID) hanya untuk internal.
- Platform fee dan payment gateway config dikontrol via `config` API, bukan hardcode.
- Pembayaran cash/transfer diproses manual oleh admin; Midtrans hanya untuk QRIS online.
