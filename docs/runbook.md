# Runbook — Asisten Hunian (FE + BE Operations)

> Panduan operasional untuk deployment, incident response, dan maintenance rutin.
> Format mengikuti konvensi runbook BE: setiap prosedur punya trigger, langkah, dan verifikasi.

---

## 1. Deployment

### 1.1 Deploy FE ke Production (Vercel)

**Trigger**: Push ke branch `main` setelah PR approved, atau hotfix langsung.

```bash
# Pastikan build lokal hijau sebelum push
npm run build

# Push ke main → Vercel auto-deploy
git push origin main
```

**Verifikasi**:
1. Cek Vercel dashboard → build status `Ready`
2. Buka `https://asistenhunian.com` → halaman home load tanpa error
3. Cek console browser → tidak ada error 401/500
4. Test login sebagai customer, OB, admin

**Rollback**:
- Di Vercel dashboard → pilih deployment sebelumnya → "Promote to Production"

---

### 1.2 Deploy dengan Env Variable Baru

**Trigger**: Config baru dibutuhkan (key API, feature flag, dsb).

```bash
# 1. Tambah ke Vercel dashboard → Settings → Environment Variables
# 2. Untuk local testing:
echo "NEW_VAR=value" >> .env.local

# 3. Re-deploy agar Vercel pakai env baru
# (Vercel auto-redeploy tidak trigger hanya karena env change — trigger manual)
```

**Verifikasi**:
- Cek di Next.js: `process.env.NEW_VAR` sudah terbaca (tambah log sementara jika perlu)

---

## 2. Incident Response

### 2.1 Halaman Tidak Bisa Diakses (500 / Build Failure)

**Gejala**: User dapat error 500, atau Vercel build merah.

**Langkah**:
```bash
# 1. Cek Vercel build log
# Dashboard → Deployments → deployment terbaru → View Build Logs

# 2. Reproduksi lokal
npm run build
# Perhatikan error TypeScript / missing env

# 3. Jika env missing di production:
# Tambah di Vercel env → redeploy

# 4. Jika ada breaking change di BE API:
# Cek response shape dengan curl:
curl -s https://api.asistenhunian.com/v1/orders/track/ORD-XXXXX | jq .
```

**Rollback**:
```bash
git revert HEAD
git push origin main
```

---

### 2.2 Login Gagal / JWT Tidak Valid

**Gejala**: User di-redirect ke `/login` terus meski sudah login.

**Langkah**:
```bash
# 1. Cek cookie di browser DevTools → Application → Cookies
# Pastikan cookie "token" ada dan tidak expired

# 2. Test endpoint BE langsung:
curl -X GET https://api.asistenhunian.com/v1/auth/me \
  -H "Authorization: Bearer <token_dari_cookie>"
# Jika 401 → token invalid/expired → user harus login ulang (normal)
# Jika 500 → masalah BE

# 3. Cek middleware proxy.ts — pastikan cookie name "token" konsisten
# File: src/proxy.ts
```

**Fix umum**:
- Clear cookie browser → login ulang
- Jika semua user kena: kemungkinan BE rotasi JWT secret → koordinasi dengan BE

---

### 2.3 Order Tidak Muncul di Dashboard Customer

**Gejala**: Customer sudah bayar tapi order tidak tampil di `/dashboard`.

**Langkah**:
```bash
# 1. Cek apakah order ada di tracking publik (tanpa auth):
curl -s "https://api.asistenhunian.com/v1/orders/track/<order_number>" | jq .

# 2. Cek list orders dengan auth:
curl -s "https://api.asistenhunian.com/v1/orders" \
  -H "Authorization: Bearer <token>"

# 3. Jika order ada di tracking tapi tidak di list:
# Kemungkinan customer_id tidak ter-set saat order dibuat (order tanpa login)
# → Cek dengan admin panel apakah customer_id null

# 4. Jika payment_status masih "unpaid" padahal sudah bayar QRIS:
# Midtrans webhook mungkin belum sampai ke BE
# → Cek BE log webhook endpoint
```

---

### 2.4 Konfirmasi Order Gagal (Admin)

**Gejala**: Admin klik "Konfirmasi Order" dapat error.

**Langkah**:
```bash
# 1. Buka browser DevTools → Network → lihat request ke:
# POST /v1/admin/orders/:id/confirm
# Cek response body untuk pesan error spesifik

# 2. Pastikan semua item sudah di-assign OB sebelum konfirmasi
# (BE mungkin validasi semua item harus punya ob_id)

# 3. Test manual:
curl -X POST "https://api.asistenhunian.com/v1/admin/orders/<id>/confirm" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"item_id": "<item_id>", "ob_id": "<ob_id>"}]}'
```

---

### 2.5 Notifikasi WA Tidak Terkirim

**Gejala**: Customer/OB tidak dapat WA setelah order dikonfirmasi.

> WA dikirim oleh BE via Fonnte — FE tidak bisa debug langsung.

**Langkah**:
1. Cek config `admin_wa` di `/admin/settings` → pastikan format nomor benar (`628xxx`)
2. Koordinasi dengan BE: cek Fonnte API key masih aktif dan saldo cukup
3. Cek log BE untuk error Fonnte API

---

## 3. Maintenance Rutin

### 3.1 Update Dependensi

```bash
# Cek dependensi outdated
npm outdated

# Update minor/patch (aman)
npm update

# Update major (hati-hati — baca changelog)
npm install next@latest react@latest react-dom@latest

# Setelah update, selalu test:
npm run build && npm run dev
# Test semua role: customer, OB, admin
```

---

### 3.2 Audit Keamanan

```bash
npm audit
npm audit fix

# Untuk vulnerability yang tidak bisa auto-fix:
npm audit --json | jq '.vulnerabilities | keys'
# Evaluasi manual sebelum upgrade paksa
```

---

### 3.3 Monitor Error Production

**Tools yang direkomendasikan** (belum diintegrasikan, kandidat):
- Vercel Analytics — request/error monitoring bawaan
- Sentry — error tracking dengan stack trace

**Manual check** (saat ini):
```bash
# Cek Vercel Function logs (untuk Server Actions & API routes)
# Dashboard → Logs → filter by error level
```

---

## 4. Prosedur Database (via BE)

> FE tidak akses DB langsung. Semua operasi DB lewat BE API.

### 4.1 Cek Status Order Langsung

Jika butuh cek/fix data order tanpa UI, koordinasi dengan BE untuk:
- Menjalankan query Supabase
- Update status via SQL / BE admin script

---

### 4.2 Reset Password User (Manual)

```bash
# Lewat fitur forgot-password di FE:
# /forgot-password → masukkan email → BE kirim email reset

# Jika email tidak sampai (cek Resend dashboard — koordinasi BE):
# BE bisa generate reset token manual via Supabase admin
```

---

## 5. Config Management

### 5.1 Update Config via Admin Panel

```
/admin/settings
  → Edit nilai config (admin_wa, bank_account, platform_fee)
  → Save → PUT /v1/admin/config/:key
```

### 5.2 Config Keys Kritis

| Key            | Dampak jika salah                              |
|----------------|------------------------------------------------|
| `admin_wa`     | Link chat admin di halaman success tidak benar |
| `bank_account` | Info transfer salah → customer salah transfer  |
| `platform_fee` | Kalkulasi total order salah                    |

**Perubahan `bank_account` dan `platform_fee` harus dikoordinasikan dengan tim sebelum diubah.**

---

## 6. Kontak & Eskalasi

| Peran       | Tanggung Jawab                              |
|-------------|---------------------------------------------|
| FE Dev      | Bug UI, deployment FE, env var Vercel       |
| BE Dev      | API error, DB, webhook Midtrans, WA/email   |
| Admin bisnis| Config `admin_wa`, `bank_account`, laporan  |

**Eskalasi urutan**: FE log → BE log → DB (Supabase) → vendor (Midtrans/Fonnte/Resend)
