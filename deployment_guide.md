# 🚀 Renta Platform — Complete Beginner's Deployment Guide (Contabo VPS)

> **Who this guide is for:** Someone who has never deployed to a server before. Every step is explained in plain English. Take your time — this is a one-time setup.

---

## 📋 What You Will Need Before Starting

1. ✅ A **Contabo account** (we will create one below)
2. ✅ A **domain name** (e.g., `myrenta.com`) — purchased from Namecheap, GoDaddy, etc.
3. ✅ Your **Renta project files** on GitHub (or a copy you can upload)
4. ✅ All your **API keys** ready (Paystack, Google Maps, Pusher, Smile ID, etc.)
5. ✅ **Windows PC** — we will use a free tool called **PuTTY** or Windows Terminal to connect

---

## PHASE 1 — Buy & Set Up Your Contabo VPS

### Step 1.1 — Purchase a VPS on Contabo

1. Go to [https://contabo.com](https://contabo.com) in your browser.
2. Click **"VPS"** in the top menu.
3. Select the **"Cloud VPS 1"** plan (the cheapest one — about $5–7/month). This is enough for Renta.
4. Scroll down and choose:
   - **Region:** Europe (Germany) — or whichever is closest to your users
   - **Operating System:** Select **Ubuntu 22.04** (very important — pick this exact one)
   - **Storage Type:** SSD
5. Click **"Order Now"** and complete payment.
6. Contabo will send you an **email** within 15–60 minutes containing:
   - Your **VPS IP address** (e.g., `85.215.123.45`)
   - Your **username** (it will be `root`)
   - Your **password**

> ⚠️ **Save this email.** You will need the IP, username, and password in the next step.

---

### Step 1.2 — Point Your Domain to Your VPS

> You need to do this **now** because DNS changes take up to 24 hours to fully work. The rest of the guide will work while you wait.

1. Log in to wherever you bought your domain (e.g., Namecheap).
2. Find **DNS Settings** or **Manage DNS** for your domain.
3. Look for existing **A Records** and delete them or edit them.
4. Create two new **A Records**:

   | Type | Host | Value              | TTL  |
   |------|------|--------------------|------|
   | A    | @    | (your VPS IP here) | Auto |
   | A    | www  | (your VPS IP here) | Auto |

5. Save the changes. DNS will propagate in a few hours.

---

## PHASE 2 — Connect to Your Server

### Step 2.1 — Install a Terminal Tool (One-time Setup)

You need a way to "talk" to your server. On Windows, the easiest way is to use **Windows Terminal** which is already built in.

1. Press `Windows Key + R`, type `cmd`, press Enter.
2. You now have a terminal window. Leave it open.

---

### Step 2.2 — Connect to Your VPS via SSH

**SSH** is just a secure way of remotely controlling your server from your computer.

1. In the terminal/command prompt window, type the following command. Replace `85.215.123.45` with **your actual VPS IP** from the Contabo email:

   ```
   ssh root@85.215.123.45
   ```

2. Press **Enter**.
3. It will ask:
   ```
   Are you sure you want to continue connecting (yes/no)?
   ```
   Type `yes` and press Enter.

4. It will then ask for your **password**. Type the password from the Contabo email.
   > ⚠️ When you type the password, **nothing will appear on screen** — this is normal. Just type it and press Enter.

5. If successful, you will see a screen with server information and a prompt like this:
   ```
   root@vps123456:~#
   ```
   **You are now inside your server.** 🎉

---

### Step 2.3 — Change Your Root Password (Security)

The password Contabo gives you is temporary. Set a strong one now:

```bash
passwd
```

It will ask you to type a new password twice. Choose something strong (mix of letters, numbers, symbols) and save it somewhere safe.

---

## PHASE 3 — Prepare the Server

### Step 3.1 — Update the Server

This downloads the latest security patches. Always do this first on a new server.

Copy and paste this entire block, then press Enter:

```bash
sudo apt update && sudo apt upgrade -y
```

> ⏳ This will take 1–3 minutes. You will see a lot of text scrolling by — that is normal. Wait until the prompt (`root@...#`) comes back.

If it asks any questions during the upgrade (like "keep the local version?"), just press **Enter** to accept the default.

---

### Step 3.2 — Install Required Software

Copy and paste this command, then press Enter:

```bash
sudo apt install -y curl git nginx ufw build-essential
```

> This installs: `curl` (download tool), `git` (for your code), `nginx` (web server), `ufw` (firewall), and `build-essential` (compilers).

---

### Step 3.3 — Install Node.js (Version 20)

Your Renta app runs on Node.js. Run these two commands **one at a time**:

**Command 1:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

Wait for it to finish, then run:

**Command 2:**
```bash
sudo apt install -y nodejs
```

**Verify it worked:**
```bash
node --version
```
You should see something like `v20.x.x`. ✅

---

### Step 3.4 — Install PM2 (Keeps Your App Running 24/7)

PM2 is a tool that makes sure your app automatically restarts if it crashes or if the server reboots.

```bash
sudo npm install -g pm2
```

---

## PHASE 4 — Set Up the Database (MySQL)

### Step 4.1 — Install MySQL

```bash
sudo apt install mysql-server -y
```

### Step 4.2 — Secure Your MySQL Installation

Run this security wizard:

```bash
sudo mysql_secure_installation
```

It will ask you several questions. Here is what to answer:

- **"Would you like to setup VALIDATE PASSWORD component?"** → Type `n`, press Enter
- **"New password:"** → Type a strong password for MySQL root, press Enter (save this password!)
- **"Re-enter new password:"** → Type it again
- **"Remove anonymous users?"** → Type `y`, press Enter
- **"Disallow root login remotely?"** → Type `y`, press Enter
- **"Remove test database?"** → Type `y`, press Enter
- **"Reload privilege tables now?"** → Type `y`, press Enter

---

### Step 4.3 — Create the Renta Database & User

First, open the MySQL console:

```bash
sudo mysql
```

Your prompt will change to `mysql>`. Now type (or paste) each of these lines, pressing **Enter** after each one:

```sql
CREATE DATABASE renta_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```sql
CREATE USER 'renta_admin'@'localhost' IDENTIFIED BY 'REPLACE_WITH_YOUR_DB_PASSWORD';
```

> ⚠️ Replace `REPLACE_WITH_YOUR_DB_PASSWORD` with a real, strong password. Write it down — you will need it in your `.env` file.

```sql
GRANT ALL PRIVILEGES ON renta_prod.* TO 'renta_admin'@'localhost';
```

```sql
FLUSH PRIVILEGES;
```

```sql
EXIT;
```

Your prompt returns to `root@...#`. The database is ready. ✅

---

## PHASE 5 — Upload & Configure Your App

### Step 5.1 — Clone Your Project from GitHub

> **If your project is on GitHub**, use this method. If not, tell me and we'll use a different approach.

```bash
cd /var/www
sudo git clone https://github.com/YOUR_GITHUB_USERNAME/renta.git
```

> Replace `YOUR_GITHUB_USERNAME/renta` with your actual GitHub repository path.

Now give yourself permission to edit the files:

```bash
sudo chown -R $USER:$USER /var/www/renta
```

Enter the project folder:

```bash
cd /var/www/renta
```

---

### Step 5.2 — Install Project Dependencies

```bash
npm install
```

> ⏳ This will take 2–5 minutes. Many packages are being downloaded.

---

### Step 5.3 — Create Your Environment File (.env)

This file holds all your secret keys and configuration. It **never** goes to GitHub — it lives only on your server.

```bash
nano .env
```

> This opens a text editor inside the terminal. Use the arrow keys to move around.

Now carefully type (or paste) your environment variables. Here is the full template — **replace every placeholder** with your real values:

```env
# ============================================
# DATABASE (Local - Self Hosted on this VPS)
# ============================================
DATABASE_URL="mysql://renta_admin:REPLACE_WITH_YOUR_DB_PASSWORD@localhost:3306/renta_prod"

# ============================================
# AUTHENTICATION
# ============================================
AUTH_SECRET="PASTE_A_RANDOM_64_CHARACTER_STRING_HERE"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"

# ============================================
# PAYSTACK
# ============================================
PAYSTACK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..."

# ============================================
# GOOGLE MAPS
# ============================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# ============================================
# PUSHER (Real-time)
# ============================================
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_SECRET="your-pusher-secret"
NEXT_PUBLIC_PUSHER_APP_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"

# ============================================
# SMILE ID (KYC)
# ============================================
SMILE_ID_PARTNER_ID="your-smile-id"
SMILE_ID_API_KEY="your-smile-api-key"

# ============================================
# EMAIL (SMTP)
# ============================================
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="no-reply@yourdomain.com"

# ============================================
# APP
# ============================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

> **How to generate `AUTH_SECRET`:** On your local Windows machine, open PowerShell and run:
> ```powershell
> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
> ```
> Copy the result and paste it as the `AUTH_SECRET` value.

**To save the file in nano:**
1. Press `Ctrl + X`
2. Press `Y` (yes to save)
3. Press `Enter`

---

### Step 5.4 — Build the Application

Run these three commands **one at a time**, waiting for each to finish:

**Command 1 — Generate Prisma client:**
```bash
npx prisma generate
```

**Command 2 — Push database schema (creates all your tables):**
```bash
npx prisma db push
```

> ⏳ If it asks `"Do you want to continue? All data will be lost."` — type `yes` since this is a fresh database with no data yet.

**Command 3 — Build the Next.js app:**
```bash
npm run build
```

> ⏳ This is the longest step — it can take **5–10 minutes**. Be patient. Wait for it to finish completely before moving on.

---

### Step 5.5 — Start the Application with PM2

```bash
pm2 start npm --name "renta" -- start
```

**Confirm it is running:**
```bash
pm2 status
```

You should see `renta` with status **`online`**. ✅

**Make PM2 start automatically on server reboot:**
```bash
pm2 startup
```

> It will print a command for you to copy and run. It looks like:
> `sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root`
> Copy that exact command, paste it, and press Enter.

Then save the current PM2 state:
```bash
pm2 save
```

---

## PHASE 6 — Configure Nginx (Web Server Gateway)

Nginx sits in front of your app and handles all incoming web traffic.

### Step 6.1 — Create the Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/renta
```

Paste this entire block (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

Save and exit: `Ctrl + X` → `Y` → `Enter`

---

### Step 6.2 — Enable the Configuration

```bash
sudo ln -s /etc/nginx/sites-available/renta /etc/nginx/sites-enabled/
```

**Test that the config has no errors:**
```bash
sudo nginx -t
```

You should see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Restart Nginx to apply changes:**
```bash
sudo systemctl restart nginx
```

---

## PHASE 7 — Set Up HTTPS / SSL (Free Certificate)

### Step 7.1 — Install Certbot (SSL Tool)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 7.2 — Get Your Free SSL Certificate

Replace `yourdomain.com` with your actual domain:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

It will ask:
- **"Enter email address"** → Type your email
- **"Agree to terms?"** → Type `A` and press Enter
- **"Share email with EFF?"** → Type `N` and press Enter

> ⚠️ **This step only works if your domain's DNS has already propagated** (pointing to your VPS IP). If it fails, wait a few more hours and try again.

If successful, it will say **"Congratulations! Your certificate and chain have been saved."** 🎉

Certbot automatically updates your Nginx config to use HTTPS.

---

## PHASE 8 — Secure the Firewall

These commands configure which ports are open on your server:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

When it asks `"Command may disrupt existing ssh session. Proceed with operation (y|n)?"` → type `y` and press Enter.

**Check firewall status:**
```bash
sudo ufw status
```

---

## PHASE 9 — Final Verification ✅

### Step 9.1 — Check Everything Is Running

```bash
pm2 status
```
→ `renta` should be **online**

```bash
sudo systemctl status nginx
```
→ Should say **active (running)**

```bash
sudo systemctl status mysql
```
→ Should say **active (running)**

### Step 9.2 — Visit Your Website

Open your browser and go to `https://yourdomain.com`

Your Renta platform should be live! 🎉

---

## 🔧 Useful Commands to Know Going Forward

| What you want to do | Command |
|---|---|
| View app logs (errors etc.) | `pm2 logs renta` |
| Restart the app | `pm2 restart renta` |
| Stop the app | `pm2 stop renta` |
| Pull latest code from GitHub | `cd /var/www/renta && git pull` |
| Rebuild after code update | `npm run build && pm2 restart renta` |
| SSH into your server again | `ssh root@YOUR_VPS_IP` |
| Check server disk space | `df -h` |
| Check server memory | `free -h` |

---

## 🆘 Troubleshooting — Common Problems

**App shows blank page or 502 error:**
```bash
pm2 logs renta
```
Read the last few lines for the error message. Usually it's a missing `.env` variable.

**Domain not loading (but IP works):**
DNS hasn't propagated yet. Wait up to 24 hours.

**SSL certificate failed:**
Your domain DNS isn't pointing to the VPS yet. Wait for propagation, then re-run the certbot command.

**App crashed after server restart:**
Run `pm2 resurrect` or re-run `pm2 startup` and `pm2 save`.

**"Permission denied" errors:**
Run the command with `sudo` in front of it.

---

> 💡 **Tip:** Bookmark this file. After the first deployment, updating your app is as simple as: `git pull` → `npm run build` → `pm2 restart renta`.
