# Implementation Workflow: Platform Jasa OB Rusun
**Generated**: 2026-05-14  
**Stack**: Next.js 14 · Supabase · Tailwind CSS + shadcn/ui · Midtrans · Resend · Fonnte  
**Estimasi Total**: 6–8 minggu (solo developer), 3–4 minggu (2 developer)

---

## Ringkasan Fase

| Fase | Nama | Durasi Est. | Output |
|------|------|-------------|--------|
| 0 | Setup & Infrastruktur | 2–3 hari | Repo, DB schema, auth siap |
| 1 | Katalog & Order (Core Flow) | 5–7 hari | Customer bisa order |
| 2 | Dashboard OB | 3–4 hari | OB bisa konfirmasi & update status |
| 3 | Dashboard Admin | 3–4 hari | Admin bisa kelola katalog & OB |
| 4 | Notifikasi (Email + WA) | 2–3 hari | Notif otomatis jalan |
| 5 | Invoice & Pembayaran | 3–4 hari | Invoice PDF + Midtrans |
| 6 | Order Tracking (Customer) | 2 hari | Customer bisa cek status |
| 7 | Polish, Testing & Deploy | 3–4 hari | Production ready |

---

## FASE 0 — Setup & Infrastruktur

### Tujuan
Fondasi project siap: repo, database, auth, dan environment.

### Checklist

#### 0.1 Inisialisasi Project
- [ ] `npx create-next-app@latest jasa-rusun --typescript --tailwind --app`
- [ ] Install dependencies utama:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
  npx shadcn@latest init
  ```
- [ ] Setup `.env.local` dengan variabel:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  RESEND_API_KEY=
  FONNTE_TOKEN=
  MIDTRANS_SERVER_KEY=
  MIDTRANS_CLIENT_KEY=
  NEXT_PUBLIC_BASE_URL=
  ```
- [ ] Setup Git repository + `.gitignore` (pastikan `.env.local` ter-ignore)

#### 0.2 Supabase Setup
- [ ] Buat project baru di supabase.com
- [ ] Aktifkan Email Auth + custom SMTP (Resend)
- [ ] Setup Row Level Security (RLS) policy dasar

#### 0.3 Database Schema

Jalankan SQL migrations berikut di Supabase SQL Editor (urutan penting):

```sql
-- 1. Enum types
CREATE TYPE user_role AS ENUM ('customer', 'ob', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending',        -- menunggu konfirmasi OB
  'confirmed',      -- OB sudah konfirmasi + set waktu
  'in_progress',    -- sedang dikerjakan
  'completed',      -- selesai
  'cancelled'       -- dibatalkan
);
CREATE TYPE payment_method AS ENUM ('cash', 'transfer');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');

-- 2. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  unit_number TEXT,           -- untuk customer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Service Categories
CREATE TABLE service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Services (Katalog Layanan)
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES service_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,  -- ORD-20260514-001
  
  -- Customer info (support guest order)
  customer_id UUID REFERENCES profiles(id),   -- NULL jika tamu
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  
  -- Jadwal
  requested_date DATE NOT NULL,
  preferred_time_note TEXT,           -- catatan preferensi waktu (bebas teks)
  confirmed_datetime TIMESTAMPTZ,    -- waktu pasti setelah OB konfirmasi
  
  -- Assignment
  ob_id UUID REFERENCES profiles(id),
  
  -- Status & Payment
  status order_status DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'unpaid',
  
  -- Totals
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Invoice
  invoice_sent_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  
  -- Notes
  customer_notes TEXT,
  ob_notes TEXT,
  
  -- Midtrans
  midtrans_transaction_id TEXT,
  midtrans_payment_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  service_name TEXT NOT NULL,        -- snapshot nama saat order
  service_price DECIMAL(10,2) NOT NULL,  -- snapshot harga saat order
  quantity INT DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Status History (audit trail)
CREATE TABLE order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notification Log
CREATE TABLE notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  channel TEXT NOT NULL,  -- 'email' | 'whatsapp'
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,     -- 'order_created' | 'order_confirmed' | 'order_completed' | 'invoice'
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_ob ON orders(ob_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(requested_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

#### 0.4 Row Level Security (RLS)

```sql
-- Aktifkan RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa baca/edit profil sendiri
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Services: semua bisa baca yang aktif
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Orders: customer bisa lihat order sendiri
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());
```

#### 0.5 Helper Functions

```sql
-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  RETURN 'ORD-' || today || '-' || LPAD(seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_services
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 0.6 Struktur Folder Next.js

```
src/
├── app/
│   ├── (public)/                  # Layout publik
│   │   ├── page.tsx               # Landing + katalog
│   │   ├── order/
│   │   │   ├── page.tsx           # Form order
│   │   │   └── [id]/track/page.tsx  # Tracking (tanpa login)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (customer)/                # Layout customer (auth required)
│   │   ├── dashboard/page.tsx     # Riwayat order
│   │   └── profile/page.tsx
│   ├── (ob)/                      # Layout OB (auth + role: ob)
│   │   ├── ob/dashboard/page.tsx
│   │   ├── ob/orders/page.tsx
│   │   └── ob/orders/[id]/page.tsx
│   ├── (admin)/                   # Layout Admin (auth + role: admin)
│   │   ├── admin/dashboard/page.tsx
│   │   ├── admin/catalog/page.tsx
│   │   ├── admin/ob/page.tsx
│   │   └── admin/orders/page.tsx
│   └── api/
│       ├── orders/route.ts
│       ├── orders/[id]/status/route.ts
│       ├── invoice/[id]/route.ts
│       ├── webhooks/midtrans/route.ts
│       └── notifications/route.ts
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── catalog/
│   ├── order/
│   ├── ob/
│   └── admin/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── middleware.ts
│   ├── midtrans.ts
│   ├── resend.ts
│   ├── fonnte.ts
│   └── utils.ts
└── types/
    └── database.ts                # Generated Supabase types
```

#### Checkpoint 0 ✓
- [ ] `npm run dev` berjalan tanpa error
- [ ] Bisa login/logout via Supabase Auth
- [ ] Database migration berhasil di Supabase
- [ ] Semua env var terisi

---

## FASE 1 — Katalog & Order (Core Flow)

### Tujuan
Customer (tamu atau login) bisa browse layanan dan submit order.

### Checklist

#### 1.1 Halaman Landing + Katalog
- [ ] Layout publik dengan navbar (logo, "Cek Order", Login)
- [ ] Fetch dan tampilkan services dari Supabase (group by category)
- [ ] Service card: foto, nama, deskripsi, harga, tombol "Pesan"
- [ ] State keranjang sederhana (React state / zustand) — pilih beberapa layanan

#### 1.2 Form Order (`/order`)
Multi-step form (3 langkah):

**Step 1 — Pilihan Layanan** (bisa dari landing atau langsung ke halaman order)
- [ ] Tampilkan service yang dipilih + qty control
- [ ] Subtotal real-time

**Step 2 — Data Diri & Jadwal**
- [ ] Input: Nama Lengkap, Nomor Unit, Email, Nomor WA
- [ ] Date picker: Tanggal yang diinginkan (minimal H+1)
- [ ] Textarea: Preferensi waktu / catatan tambahan
- [ ] Select: Metode pembayaran (Cash / Transfer)
- [ ] Jika user sudah login → pre-fill data dari profil

**Step 3 — Review & Konfirmasi**
- [ ] Ringkasan order: layanan, harga, data customer, jadwal
- [ ] Tombol "Buat Order"

#### 1.3 API Order Creation (`POST /api/orders`)
- [ ] Validasi input (Zod schema)
- [ ] Generate order number via DB function
- [ ] Insert ke tabel `orders` + `order_items`
- [ ] Insert ke `order_status_history` (status: pending)
- [ ] Trigger notifikasi (Phase 4 — buat stub dulu)
- [ ] Return `{ orderId, orderNumber }`

#### 1.4 Halaman Sukses Order
- [ ] Tampilkan nomor order
- [ ] Instruksi: "OB akan menghubungi Anda untuk konfirmasi jadwal"
- [ ] Link ke halaman tracking: `/order/[id]/track`
- [ ] Jika transfer: tampilkan info "Invoice akan dikirim setelah selesai"

#### Checkpoint 1 ✓
- [ ] Customer tamu bisa submit order → data tersimpan di DB
- [ ] Customer login bisa submit order → terhubung ke profil
- [ ] Nomor order ter-generate dengan benar
- [ ] Halaman sukses tampil dengan nomor order

---

## FASE 2 — Dashboard OB

### Tujuan
OB login, lihat order masuk, konfirmasi jadwal, dan update status.

### Checklist

#### 2.1 Auth & Route Protection untuk OB
- [ ] Middleware Next.js: cek role dari profil → redirect jika bukan OB
- [ ] Login page mengarahkan OB ke `/ob/dashboard`

#### 2.2 Dashboard OB (`/ob/dashboard`)
- [ ] Summary cards: Order Baru, Dijadwalkan Hari Ini, Selesai Minggu Ini
- [ ] Tabel order hari ini (order dengan `requested_date = today`)
- [ ] Badge status berwarna per status

#### 2.3 List Semua Order (`/ob/orders`)
- [ ] Filter: Status, Tanggal
- [ ] Pagination (10 per halaman)
- [ ] Tampilkan: Nomor Order, Nama Customer, Unit, Layanan, Tanggal, Status

> **Open Question**: Untuk MVP, tampilkan **semua order yang belum ter-assign** (siapa cepat dia dapat) + order yang sudah ter-assign ke OB ini. Admin bisa reassign jika perlu.

#### 2.4 Detail Order OB (`/ob/orders/[id]`)
- [ ] Semua detail order: layanan, customer, catatan
- [ ] Aksi berdasarkan status:

| Status Saat Ini | Aksi Tersedia |
|---|---|
| `pending` | **Konfirmasi** (pilih datetime pasti) + input catatan |
| `confirmed` | **Mulai Kerjakan** |
| `in_progress` | **Tandai Selesai** |
| `completed` | (read-only) |
| `cancelled` | (read-only) |

#### 2.5 API Status Update (`PATCH /api/orders/[id]/status`)
- [ ] Validasi: hanya OB assigned atau admin yang bisa update
- [ ] Validasi transisi status yang valid (state machine)
- [ ] Insert ke `order_status_history`
- [ ] Update `confirmed_datetime` saat konfirmasi
- [ ] Trigger notifikasi customer (stub)
- [ ] Jika `completed`: trigger generate invoice (stub Phase 5)

#### Checkpoint 2 ✓
- [ ] OB bisa login dan lihat dashboard
- [ ] OB bisa konfirmasi order dan set waktu pasti
- [ ] OB bisa update status sampai completed
- [ ] Status history tersimpan di DB

---

## FASE 3 — Dashboard Admin

### Tujuan
Admin/Owner bisa kelola katalog layanan, akun OB, dan pantau semua order.

### Checklist

#### 3.1 Auth & Route Protection untuk Admin
- [ ] Middleware: role `admin` → akses `/admin/*`
- [ ] Seed data: buat akun admin pertama via Supabase Dashboard

#### 3.2 Kelola Katalog (`/admin/catalog`)
- [ ] Tabel kategori: tambah / edit / hapus
- [ ] Tabel layanan: tambah / edit / toggle aktif / hapus
- [ ] Form tambah/edit layanan:
  - Nama, kategori, deskripsi, harga, sort order
  - Upload foto ke Supabase Storage
- [ ] Preview tampilan service card

#### 3.3 Kelola OB (`/admin/ob`)
- [ ] List semua OB dengan status aktif/nonaktif
- [ ] Form tambah OB baru:
  - Buat user di Supabase Auth (`admin.createUser`)
  - Set role = `ob` di tabel profiles
  - Kirim email selamat datang + kredensial sementara
- [ ] Toggle aktif/nonaktif OB

#### 3.4 Manajemen Order (`/admin/orders`)
- [ ] Tabel semua order (filter: status, tanggal, OB, cari by nomor/nama)
- [ ] Detail order + riwayat status
- [ ] Assign / reassign order ke OB tertentu
- [ ] Force-cancel order dengan catatan alasan

#### 3.5 Dashboard Overview (`/admin/dashboard`)
- [ ] Summary: Total order hari ini, Pending, Selesai, Revenue (estimasi)
- [ ] Grafik order per minggu (pakai Recharts)

#### Checkpoint 3 ✓
- [ ] Admin bisa tambah/edit/hapus layanan
- [ ] Admin bisa tambah akun OB baru
- [ ] Admin bisa lihat dan assign semua order

---

## FASE 4 — Notifikasi (Email + WhatsApp)

### Tujuan
Notifikasi otomatis terkirim ke customer dan OB di setiap event penting.

### Checklist

#### 4.1 Setup Resend (Email)
- [ ] Install: `npm install resend`
- [ ] Buat file `src/lib/resend.ts`
- [ ] Buat React Email templates (`npm install @react-email/components`):
  - `OrderConfirmation.tsx` — konfirmasi order masuk
  - `OrderScheduled.tsx` — OB sudah konfirmasi jadwal
  - `OrderCompleted.tsx` — order selesai
  - `InvoiceEmail.tsx` — invoice dengan PDF attachment

#### 4.2 Setup Fonnte (WhatsApp)
- [ ] Daftar akun di fonnte.com, hubungkan nomor WA
- [ ] Buat file `src/lib/fonnte.ts`:
  ```typescript
  export async function sendWhatsApp(to: string, message: string) {
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': process.env.FONNTE_TOKEN! },
      body: new URLSearchParams({ target: to, message })
    })
  }
  ```
- [ ] Template pesan WA (plain text dengan emoji):

| Event | Penerima | Template |
|---|---|---|
| Order baru | Customer | "✅ Order *ORD-xxx* diterima. OB akan menghubungi Anda untuk konfirmasi jadwal." |
| Order baru | OB | "🔔 Order baru masuk! *ORD-xxx* - Unit _xx_ - Tanggal _dd/mm_. Buka dashboard untuk konfirmasi." |
| OB konfirmasi | Customer | "📅 Order *ORD-xxx* dijadwalkan pada _hari, tanggal jam_. OB: _Nama OB_." |
| Selesai + Invoice | Customer | "✨ Order *ORD-xxx* selesai! Invoice dikirim ke email Anda." |

#### 4.3 Notification Service (`src/lib/notifications.ts`)
- [ ] Fungsi terpusat `sendOrderNotification(orderId, event)`:
  - Ambil data order dari DB
  - Kirim email (Resend)
  - Kirim WA (Fonnte)
  - Log ke tabel `notification_log`
- [ ] Ganti stub di Phase 1 & 2 dengan panggilan fungsi ini

#### Checkpoint 4 ✓
- [ ] Email konfirmasi terkirim saat order dibuat
- [ ] Email + WA ke OB saat order baru
- [ ] Email + WA ke customer saat OB konfirmasi jadwal
- [ ] Email + WA ke customer saat order selesai
- [ ] Semua notif ter-log di DB

---

## FASE 5 — Invoice & Pembayaran

### Tujuan
Invoice PDF auto-generate saat selesai. Integrasi Midtrans untuk pembayaran transfer.

### Checklist

#### 5.1 Invoice PDF (`react-pdf`)
- [ ] Install: `npm install @react-pdf/renderer`
- [ ] Buat component `InvoiceDocument.tsx`:
  - Header: Logo rusun, nomor invoice, tanggal
  - Data customer: nama, unit, email
  - Tabel layanan: nama, qty, harga satuan, subtotal
  - Informasi OB: nama
  - Tanggal & waktu eksekusi
  - Total + status pembayaran
  - Footer: informasi kontak rusun
- [ ] API route `GET /api/invoice/[orderId]`:
  - Ambil data order
  - Generate PDF buffer dengan react-pdf
  - Upload ke Supabase Storage: `invoices/ORD-xxx.pdf`
  - Update `orders.invoice_pdf_url`
  - Return PDF sebagai response atau redirect ke storage URL

#### 5.2 Integrasi Midtrans (untuk pembayaran transfer)
- [ ] Install: `npm install midtrans-client`
- [ ] Buat file `src/lib/midtrans.ts`
- [ ] API `POST /api/orders/[id]/payment`:
  - Buat Midtrans transaction
  - Return `payment_url` (Snap)
  - Simpan `midtrans_transaction_id` dan `midtrans_payment_url` ke order
- [ ] Webhook `POST /api/webhooks/midtrans`:
  - Verifikasi signature Midtrans
  - Jika `transaction_status = settlement` → update `payment_status = paid`
  - Log notifikasi

#### 5.3 Alur Pembayaran di UI
- [ ] Halaman tracking order: tampilkan tombol "Bayar Sekarang" jika:
  - `payment_method = transfer` AND `payment_status = unpaid` AND `status != cancelled`
- [ ] Redirect ke Midtrans Snap URL
- [ ] Setelah bayar: tampilkan status terbaru

#### Checkpoint 5 ✓
- [ ] Invoice PDF ter-generate saat order completed
- [ ] Invoice dikirim via email sebagai attachment/link
- [ ] Pembayaran transfer via Midtrans berjalan end-to-end
- [ ] Status pembayaran terupdate via webhook

---

## FASE 6 — Order Tracking (Customer)

### Tujuan
Customer bisa cek status order kapan saja, dengan atau tanpa login.

### Checklist

#### 6.1 Halaman Tracking Publik (`/order/[id]/track`)
- [ ] Akses via link unik di email/WA (no login required)
- [ ] Tampilkan:
  - Nomor order, tanggal order
  - Status timeline dengan icon + timestamp:
    ```
    ✅ Order Diterima    — 14 Mei 2026, 10:30
    📅 Dijadwalkan       — 14 Mei 2026, 11:00 (Jadwal: 15 Mei, 09:00)
    🔄 Sedang Dikerjakan — 15 Mei 2026, 09:05
    ✨ Selesai           — 15 Mei 2026, 10:30
    ```
  - Detail layanan yang dipesan
  - Info OB (nama) setelah dikonfirmasi
  - Tombol "Bayar" jika applicable
- [ ] Jika ID tidak valid: halaman 404 yang friendly

#### 6.2 Form Cek Order (alternatif via nomor order)
- [ ] Di navbar/footer: link "Cek Status Order"
- [ ] Form: input nomor order + email → redirect ke `/order/[id]/track`

#### 6.3 Dashboard Customer (login)
- [ ] `/dashboard`: tabel semua order dengan filter status
- [ ] Klik order → halaman tracking detail

#### Checkpoint 6 ✓
- [ ] Link tracking di email berfungsi tanpa login
- [ ] Timeline status akurat dengan timestamp
- [ ] Customer login bisa lihat history semua order

---

## FASE 7 — Polish, Testing & Deploy

### Tujuan
UI/UX halus, bug-free, siap production.

### Checklist

#### 7.1 UI/UX Polish
- [ ] Loading states di semua tombol dan fetch
- [ ] Error messages yang informatif (bukan "Something went wrong")
- [ ] Empty states yang friendly ("Belum ada order")
- [ ] Mobile responsiveness test di semua halaman utama
- [ ] Favicon + Open Graph meta tags
- [ ] Seed data contoh: beberapa kategori + layanan

#### 7.2 Keamanan
- [ ] Rate limiting di `/api/orders` (max 5 order/jam per IP)
- [ ] Input sanitization via Zod di semua API routes
- [ ] Verifikasi RLS Supabase berjalan di semua tabel
- [ ] Pastikan service role key TIDAK exposed ke client

#### 7.3 Testing Manual (Golden Path)
- [ ] [Customer Tamu] Browse → Order → Terima email konfirmasi → Cek tracking
- [ ] [OB] Login → Lihat order → Konfirmasi → Update ke selesai → Invoice terkirim
- [ ] [Admin] Login → Tambah layanan → Tambah OB → Pantau order
- [ ] [Pembayaran Transfer] Order → Tracking → Klik bayar → Midtrans → Status update

#### 7.4 Deployment
- [ ] Vercel: `vercel --prod` atau connect GitHub repo
- [ ] Set semua env var di Vercel dashboard
- [ ] Custom domain (opsional)
- [ ] Supabase: pastikan project tier cukup (Free tier oke untuk MVP)
- [ ] Test production build: `npm run build` tanpa error

#### Checkpoint 7 ✓
- [ ] Build sukses tanpa error TypeScript
- [ ] Golden path end-to-end berjalan di production
- [ ] Notifikasi email + WA sampai di environment production

---

## Dependencies Antar Fase

```
Fase 0 (Setup)
    ↓
Fase 1 (Katalog + Order)
    ↓
Fase 2 (OB Dashboard) ──── Fase 3 (Admin Dashboard)
    ↓                            ↓
    └──────── Fase 4 (Notifikasi) ─────────┘
                    ↓
             Fase 5 (Invoice + Payment)
                    ↓
             Fase 6 (Tracking Customer)
                    ↓
             Fase 7 (Polish + Deploy)
```

> Fase 2 dan 3 bisa dikerjakan paralel setelah Fase 1 selesai.

---

## Open Questions (Harus dijawab sebelum Fase 2)

1. **Distribusi Order ke OB**: Apakah order terlihat oleh semua OB aktif (first-come), atau owner yang assign dari admin? → Berpengaruh pada query di OB dashboard.
2. **Variasi harga**: Apakah harga bisa berbeda berdasarkan ukuran (studio vs 2BR, kasur single vs double)? → Butuh field tambahan di form order.
3. **Pembatalan**: Siapa yang boleh batalkan, dan sampai status apa? → Berpengaruh pada state machine status.
4. **Review/Rating OB**: Fitur ini masuk MVP atau nanti saja?

---

## Referensi & Resources

| Resource | URL / Command |
|---|---|
| Supabase Docs | https://supabase.com/docs |
| Midtrans Snap | https://docs.midtrans.com/reference/snap-api |
| Fonnte API | https://fonnte.com/docs |
| Resend Docs | https://resend.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| react-pdf | https://react-pdf.org |

---

*Next step: Jawab open questions, lalu `/sc:implement` untuk mulai coding Fase 0.*
