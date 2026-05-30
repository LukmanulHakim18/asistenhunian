# CI/CD — asisten-hunian-fe

Pipeline menggunakan **GitHub Actions** dengan deploy ke **VPS** via SSH.

---

## Arsitektur Pipeline

```
Push ke branch ──► CI (type check + lint + build)
Push ke main   ──► CI ──► Deploy ke VPS (SSH + PM2)
```

### File Workflow

| File | Trigger | Tujuan |
|------|---------|--------|
| `.github/workflows/ci.yml` | Semua push & PR | Type check, lint, build |
| `.github/workflows/deploy.yml` | Push ke `main` | Build + deploy ke VPS |

---

## Setup Pertama Kali

### 1. Setup VPS

Login ke VPS lalu jalankan perintah berikut satu kali:

```bash
# Install Node.js 22 (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22

# Install PM2
npm install -g pm2
pm2 startup   # ikuti instruksi yang muncul untuk auto-start saat reboot

# Clone repo ke VPS
git clone https://github.com/<USERNAME>/<REPO>.git /var/www/asisten-hunian-fe
cd /var/www/asisten-hunian-fe

# Buat file .env.production
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_BASE_URL=https://asistenhunian.com
EOF

# Install deps & build pertama kali
npm ci
npm run build

# Start dengan PM2
pm2 start npm --name "asisten-hunian-fe" -- start -- -p 3000
pm2 save
```

### 2. Setup Nginx sebagai Reverse Proxy

```nginx
# /etc/nginx/sites-available/asisten-hunian-fe
server {
    listen 80;
    server_name fe.asistenhunian.com;  # ganti dengan domain FE kamu

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktifkan config
ln -s /etc/nginx/sites-available/asisten-hunian-fe /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL dengan Certbot
certbot --nginx -d fe.asistenhunian.com
```

### 3. Buat SSH Key untuk GitHub Actions

Jalankan di **mesin lokal** (bukan di VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_fe_key -N ""
```

Copy public key ke VPS:

```bash
ssh-copy-id -i ~/.ssh/deploy_fe_key.pub user@YOUR_VPS_IP
# atau manual:
cat ~/.ssh/deploy_fe_key.pub | ssh user@YOUR_VPS_IP "cat >> ~/.ssh/authorized_keys"
```

### 4. Tambah GitHub Secrets

Buka repo di GitHub → **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Keterangan |
|-------------|-------|------------|
| `SSH_HOST` | `1.2.3.4` | IP atau domain VPS |
| `SSH_USER` | `ubuntu` | Username SSH di VPS |
| `SSH_PORT` | `22` | Port SSH (default 22) |
| `SSH_PRIVATE_KEY` | isi file `~/.ssh/deploy_fe_key` | Private key (bukan `.pub`) |
| `NEXT_PUBLIC_API_BASE_URL` | `https://asistenhunian.com` | URL BE |

Cara lihat isi private key:

```bash
cat ~/.ssh/deploy_fe_key
# Copy semua output termasuk -----BEGIN dan -----END-----
```

---

## Cara Kerja Pipeline

### CI (`ci.yml`) — setiap push

```
1. Checkout kode
2. Setup Node.js 22
3. npm ci (install deps dari lockfile)
4. npx tsc --noEmit (cek TypeScript)
5. npm run lint (cek ESLint)
6. npm run build (pastikan build sukses)
```

Jika salah satu step gagal → PR tidak bisa di-merge.

### Deploy (`deploy.yml`) — hanya push ke `main`

```
1. Checkout kode
2. Setup Node.js 22
3. npm ci + npm run build (build di runner GitHub)
4. SSH ke VPS:
   a. git pull origin main
   b. npm ci --omit=dev
   c. npm run build (rebuild di server dengan env prod)
   d. pm2 reload (zero-downtime restart)
```

> **Catatan:** Build dilakukan dua kali — sekali di GitHub runner untuk validasi, sekali di server dengan env variabel produksi yang sesungguhnya.

---

## Perintah PM2 yang Berguna

```bash
# Lihat status semua proses
pm2 status

# Lihat log realtime
pm2 logs asisten-hunian-fe

# Restart manual
pm2 restart asisten-hunian-fe

# Reload tanpa downtime
pm2 reload asisten-hunian-fe

# Stop
pm2 stop asisten-hunian-fe
```

---

## Troubleshooting

### Build gagal di GitHub Actions

Cek tab **Actions** di GitHub → klik workflow yang gagal → lihat log tiap step.

Penyebab umum:
- TypeScript error → fix dulu di lokal dengan `npx tsc --noEmit`
- Env variable tidak di-set → tambah secret `NEXT_PUBLIC_API_BASE_URL`

### Deploy gagal (SSH error)

```bash
# Test koneksi SSH dari lokal
ssh -i ~/.ssh/deploy_fe_key user@YOUR_VPS_IP

# Pastikan public key sudah ada di VPS
cat ~/.ssh/authorized_keys
```

### PM2 tidak restart otomatis setelah reboot VPS

```bash
pm2 startup   # generate perintah systemd
pm2 save      # simpan daftar proses aktif
```

### App crash setelah deploy

```bash
pm2 logs asisten-hunian-fe --lines 50
```

Penyebab umum: file `.env.production` tidak ada atau `NEXT_PUBLIC_API_BASE_URL` kosong.

---

## Checklist Deployment Pertama

- [ ] VPS sudah terinstall Node.js 22 dan PM2
- [ ] Repo sudah di-clone ke `/var/www/asisten-hunian-fe`
- [ ] File `.env.production` sudah ada di VPS
- [ ] Build pertama sudah berhasil (`npm run build`)
- [ ] PM2 sudah running (`pm2 status`)
- [ ] PM2 startup sudah dikonfigurasi (`pm2 startup && pm2 save`)
- [ ] Nginx sudah dikonfigurasi dan aktif
- [ ] SSL sudah aktif (Certbot)
- [ ] SSH key sudah dibuat dan public key sudah di VPS
- [ ] Semua 5 GitHub Secrets sudah diisi
- [ ] Push ke `main` → cek tab Actions di GitHub
