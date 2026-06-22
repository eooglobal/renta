# Renta — Ubuntu VPS Deployment Guide
# Contabo VPS / Ubuntu 22.04 LTS
# Stack: Node.js 20 + PM2 + Nginx + MySQL

---

## STEP 1: Connect via SSH

In PuTTY:
- Host: YOUR_SERVER_IP
- Port: 22
- Login: root
- Password: your Contabo root password

---

## STEP 2: Initial server setup

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git unzip build-essential ufw

# Set up firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

---

## STEP 3: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version   # Should show v20.x.x
npm --version
```

---

## STEP 4: Install PM2

```bash
npm install -g pm2
pm2 --version
```

---

## STEP 5: Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

## STEP 6: Install MySQL

```bash
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Secure the installation
mysql_secure_installation
# Follow prompts: set root password, remove anonymous users, disallow remote root, remove test DB
```

### Create the database and user:

```bash
mysql -u root -p
```

Inside MySQL:
```sql
CREATE DATABASE renta_db;
CREATE USER 'renta_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON renta_db.* TO 'renta_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## STEP 7: Create app user (security best practice)

```bash
adduser --disabled-password --gecos "" renta
mkdir -p /var/www/renta
chown renta:renta /var/www/renta
```

---

## STEP 8: Upload app files

On your local Windows machine, zip the project files:
- Zip everything EXCEPT `node_modules/` and `.git/`
- Name it `renta.zip`

Upload via SCP (run this on your local machine in PowerShell):
```bash
scp "C:\Users\USER\Documents\Renta 3\renta\renta.zip" root@YOUR_SERVER_IP:/var/www/renta/
```

Or use WinSCP (free GUI): https://winscp.net/eng/download.php

Then on the server:
```bash
cd /var/www/renta
unzip renta.zip
# Make sure files are at /var/www/renta/ not /var/www/renta/renta/
ls -la   # Should show server.js, package.json, .next/, etc.
```

---

## STEP 9: Create .env file

```bash
nano /var/www/renta/.env
```

Paste this (fill in your values):
```
DATABASE_URL="mysql://renta_user:YOUR_STRONG_PASSWORD@localhost:3306/renta_db"
AUTH_SECRET="c8434f914b0d47c59ee63a7385dde2e0"
NEXTAUTH_SECRET="c8434f914b0d47c59ee63a7385dde2e0"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
PAYSTACK_SECRET_KEY="sk_test_xxxxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxx"
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your-brevo-email@example.com"
SMTP_PASS="your-brevo-api-key"
EMAIL_FROM="noreply@yourdomain.com"
VERIFYME_API_KEY=""
VERIFYME_API_URL="https://vapi.verifyme.ng/v1"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="Renta"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyAGJNKq6fh6_9ziZOSkk6rbMYmX-PJAt7E"
NODE_ENV="production"
```

Save: Ctrl+X → Y → Enter

---

## STEP 10: Install dependencies and set up database

```bash
cd /var/www/renta
npm install --omit=dev
npx prisma generate
npx prisma migrate deploy
```

If migrate deploy hangs (shared hosting issue), import schema via MySQL directly:
```bash
mysql -u renta_user -p renta_db < prisma/cpanel-schema.sql
```

Then seed the database:
```bash
npm run db:seed:settings
npm run db:seed:admin
npm run db:seed:locations
```

---

## STEP 11: Test the app runs

```bash
cd /var/www/renta
node server.js
```

You should see:
```
> Ready on http://0.0.0.0:3000
> Environment: production
```

Press Ctrl+C to stop it. Now set up PM2 to manage it.

---

## STEP 12: Set up PM2

```bash
cd /var/www/renta

# Start with PM2
pm2 start server.js --name "renta" --max-memory-restart 512M

# Save PM2 process list
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs (starts with: sudo env PATH=...)

# Verify it's running
pm2 list
pm2 logs renta --lines 20
```

---

## STEP 13: Configure Nginx

```bash
nano /etc/nginx/sites-available/renta
```

Paste this (replace yourdomain.com with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Max upload size for property images
    client_max_body_size 10M;

    # Serve Next.js static files directly (faster)
    location /_next/static/ {
        alias /var/www/renta/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/renta/public/uploads/;
        expires 7d;
    }

    # Proxy everything else to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Save: Ctrl+X → Y → Enter

```bash
# Enable the site
ln -s /etc/nginx/sites-available/renta /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## STEP 14: Install SSL certificate (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow prompts, enter your email, agree to terms
# Choose option 2 to redirect HTTP to HTTPS
```

Certbot auto-renews. Verify:
```bash
certbot renew --dry-run
```

---

## STEP 15: Point your domain to the VPS

In your domain registrar's DNS settings, add:
```
A record:   @   →   YOUR_SERVER_IP
A record:   www →   YOUR_SERVER_IP
```

DNS propagation takes up to 30 minutes.

---

## STEP 16: Verify everything works

```bash
# Check app is running
pm2 list

# Check Nginx is running
systemctl status nginx

# Check app logs
pm2 logs renta --lines 50

# Test health endpoint
curl https://yourdomain.com/api/health
```

Health should return `"status":"ok"` with `"database":"connected"`.

---

## Post-launch checklist

- [ ] Visit https://yourdomain.com — app loads
- [ ] Login with admin@renta.com / BiGeMMy.50796
- [ ] Go to Admin → Settings → enter Pusher credentials
- [ ] Go to Admin → Settings → enter Smile ID credentials
- [ ] Update Paystack webhook: https://yourdomain.com/api/webhooks/paystack
- [ ] Whitelist domain in Google Cloud Console for Maps API key
- [ ] Test registration → email received
- [ ] Test payment flow

---

## Maintenance commands

```bash
# View live logs
pm2 logs renta

# Restart app
pm2 restart renta

# Reload app without downtime (after code update)
pm2 reload renta

# Check memory/CPU usage
pm2 monit

# After uploading new code — rebuild and reload
cd /var/www/renta
npm run build
pm2 reload renta
```

---

## Why the app was going offline before

The previous setup had no process manager. When Node.js crashed (memory spike, 
uncaught error, etc.), nothing restarted it. Now:

- **PM2** monitors the process and restarts it within 1 second if it crashes
- **--max-memory-restart 512M** restarts if memory leaks above 512MB
- **pm2 startup** ensures it survives server reboots
- **Nginx** acts as a reverse proxy — if the app momentarily restarts, 
  Nginx queues requests and serves them once the app is back
