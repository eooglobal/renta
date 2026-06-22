# cPanel Deployment Guide — Renta

> **Note:** This domain is set up as an **Addon Domain** in cPanel, not the primary domain.
> Addon domains get their own dedicated folder under your home directory (e.g. `~/yourdomain.com`),
> completely separate from `public_html`.

---

## Pre-flight: Build locally first

```bash
npm run build
```

This generates the `.next/standalone` folder required for production.

---

## Step 1: Locate your addon domain folder

When you added the domain in cPanel as an Addon Domain, cPanel asked you to specify a **Document Root** (also called the subdirectory). It defaults to something like:

```
/home/youraccount/yourdomain.com
```

You can confirm the exact path by going to:
**cPanel → Addon Domains** — look at the "Document Root" column for your domain.

This is the folder you will upload your app files into.

---

## Step 2: Files to upload to cPanel

Upload ONLY these into your addon domain folder (e.g. `/home/youraccount/yourdomain.com/`):

```
.next/              ← entire folder
prisma/             ← schema.prisma + migrations/
public/             ← static assets + uploads/
src/                ← source files (needed by Next.js standalone)
server.js           ← custom startup file
package.json
package-lock.json
next.config.mjs
jsconfig.json
```

Upload via **cPanel File Manager** (navigate into your addon domain folder first) or via FTP pointed at the same path.

### Do NOT upload:
- `node_modules/` — install on server instead
- `.env` — set vars in cPanel panel instead
- `.env.production` — reference only, do not upload
- `.git/`
- `build.log`, `eslint.log`, etc.

---

## cPanel Node.js App Settings

| Field | Value |
|---|---|
| Node.js version | **20.20.2** |
| Application mode | **Production** |
| Application root | `/home/youraccount/yourdomain.com` ← your addon domain folder |
| Application URL | `https://yourdomain.com` |
| Application startup file | `server.js` |

> **Important:** The "Application root" must point to the same folder as your addon domain's Document Root — not `public_html`. If you enter the wrong folder here, the app won't start.

---

## Environment Variables (paste in cPanel panel)

```
DATABASE_URL          = mysql://avnadmin:...@aiven.../defaultdb?ssl-mode=REQUIRED
AUTH_SECRET           = c8434f914b0d47c59ee63a7385dde2e0
NEXTAUTH_SECRET       = c8434f914b0d47c59ee63a7385dde2e0
NEXTAUTH_URL          = https://yourdomain.com
AUTH_URL              = https://yourdomain.com
PAYSTACK_SECRET_KEY   = sk_test_xxxxx
PAYSTACK_PUBLIC_KEY   = pk_test_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = pk_test_xxxxx
SMTP_HOST             = smtp-relay.brevo.com
SMTP_PORT             = 587
SMTP_USER             = your-brevo-email@example.com
SMTP_PASS             = your-brevo-api-key
EMAIL_FROM            = noreply@yourdomain.com
VERIFYME_API_KEY      = your-key
VERIFYME_API_URL      = https://vapi.verifyme.ng/v1
NEXT_PUBLIC_APP_URL   = https://yourdomain.com
NEXT_PUBLIC_APP_NAME  = Renta
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSyAGJNKq6fh6_9ziZOSkk6rbMYmX-PJAt7E
NODE_ENV              = production
```

---

## Server-side steps (via cPanel Terminal or SSH)

```bash
# Navigate to YOUR ADDON DOMAIN folder — NOT public_html
cd ~/yourdomain.com

# Install production dependencies only
npm install --omit=dev

# Generate Prisma client
npx prisma generate

# Run DB migrations (safe — only applies new ones)
npx prisma migrate deploy
```

> **Tip:** In the cPanel Terminal, you can confirm your current path with `pwd` and list files with `ls -la`.

---

## After install — Start the app

1. Go to cPanel → Node.js Applications
2. Click **Restart** on your app
3. Visit your domain to verify

---

## Post-launch checklist

- [ ] Confirm site loads at https://yourdomain.com
- [ ] Test login/register
- [ ] Go to Admin → Settings → enter Pusher credentials
- [ ] Go to Admin → Settings → enter Smile ID credentials
- [ ] Update Paystack webhook URL to: `https://yourdomain.com/api/webhooks/paystack`
- [ ] Whitelist your domain in Google Cloud Console for the Maps API key
- [ ] Test a payment flow end-to-end
- [ ] Check email delivery (register a test user)

---

## Troubleshooting

**App shows 502/503:**
- Check the Node.js app is started in cPanel
- View logs in cPanel → Node.js Applications → Logs
- Ensure `NODE_ENV=production` is set

**Prisma errors at startup:**
- Run `npx prisma generate` again on the server
- Check DATABASE_URL is correct

**Auth redirect loops:**
- Ensure NEXTAUTH_URL matches your exact domain including https://
- Check AUTH_SECRET is set

**Images not showing:**
- Ensure `public/uploads/` was uploaded
- If using R2, add R2_* env vars

**Emails not sending:**
- SMTP_PASS must be your Brevo API key, not SMTP password
- Check Brevo dashboard for send logs
