# Deploying Guruji Palmistry on Hostinger

_Written 21 November 2026._

This site is a **Node.js server**, not a PHP site: it serves the pages *and* runs the API,
payments, consultation rooms and the admin dashboard from one process (`server.js`). So it
needs a plan that can keep a Node process running. Two of Hostinger's products can:

| Path | Plan | Effort | Good for |
|---|---|---|---|
| **A. Node.js Web App (hPanel)** — recommended | Business Web Hosting, or any Cloud plan (Startup / Professional / Enterprise) | ~20 minutes, no command line | What you want unless you need a shell |
| **B. VPS** | Any Hostinger KVM VPS | ~1 hour, root access needed | Full control, your own MongoDB, several sites on one box |

The **Premium** web hosting plan cannot run Node.js apps — check the plan before you buy.

## The database question, first

Hostinger gives you **MySQL**. This site uses **MongoDB**, so the database stays where it is:
**MongoDB Atlas** (the free M0 cluster is enough to start, and you already have one). Nothing
about moving the site to Hostinger changes that — you keep the same `MONGODB_URI`.

The one thing you must change in Atlas: **Network Access → add `0.0.0.0/0`** (or, on a VPS, that
server's fixed IP, which is tighter and better). Otherwise the connection is refused and the site
falls back to temporary storage with payments switched off.

On a VPS you *can* install MongoDB on the same server instead of Atlas (`apt install mongodb-org`),
and then `MONGODB_URI=mongodb://127.0.0.1:27017`. Only do that if you will also set up backups.

---

## Path A — Node.js Web App in hPanel

### 1. Create the app

1. hPanel → **Websites** → **Add Website** → **Node.js web app**.
2. Choose **GitHub** and pick `gsrikar250222/palm1`, branch `main`
   (authorise Hostinger's GitHub app first if it asks). Pushing to that branch then redeploys
   the site by itself.
   *Or* choose the ZIP upload and send the zip from this chat.

### 2. Build settings

| Field | Value |
|---|---|
| Node.js version | **22** |
| Framework | **Other** (this is a plain Node server, not Next.js) |
| Install command | `npm install --omit=dev` |
| Build command | *leave empty* — there is no build step; the browser files are served as they are |
| Entry file | `server.js` |

### 3. Environment variables

Add these in the **Environment variables** step (hPanel can also import a `.env` file — use
`.env.example` as the shape, with your real values):

```
HOST=0.0.0.0
NODE_ENV=production
MONGODB_URI=<your Atlas connection string with the real password>
MONGODB_DB=guruji
ADMIN_PIN=<long random>
GURUJI_PIN=<long random, different from ADMIN_PIN>
EDITOR_PIN=<optional, content editor>
CASHFREE_APP_ID=<from Cashfree>
CASHFREE_SECRET_KEY=<from Cashfree>
CASHFREE_ENV=production
SITE_URL=https://<your domain>
JITSI_APP_ID=<from 8x8 JaaS>
JITSI_KID=<from 8x8 JaaS>
JITSI_PRIVATE_KEY=<the PEM block from 8x8 JaaS>
```

**`HOST=0.0.0.0` is the one that catches people out.** The server listens on `127.0.0.1` by
default, which is right behind a reverse proxy but invisible to a managed platform — the build
succeeds and then the app looks dead. Do not set `PORT`: the platform provides it.

### 4. Domain and SSL

hPanel → your app → **Domain**: point `gurujipalmistry.org` (and `www`) at it. If the domain is
registered elsewhere, set its nameservers to Hostinger's, or add the A record Hostinger shows you.
SSL is issued automatically; wait for the padlock before taking payments.

### 5. Check it

1. Open `https://<your domain>/api/health` — you want
   `"storage":"mongo"`, `"payments":"cashfree"`, `"paymentEnv":"production"`, `"paymentsReady":true`,
   `"sessionsProductionSafe":true`.
2. hPanel → **Runtime logs**: the first line should read
   `GURUJI server listening on 0.0.0.0:<port> (storage: mongo)`.
3. Cashfree dashboard → **Developers → Whitelist domains**: add the new domain, and set the webhook
   to `https://<your domain>/api/payments/cashfree/webhook`.
4. Open `/admin` and `/guruji` and sign in with the two PINs.
5. Make a ₹1 booking end to end, then refund it from the Cashfree dashboard.

---

## Path B — Hostinger VPS

### 1. Server

hPanel → VPS → **Ubuntu 24.04**. Then, over SSH as root:

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -   # Node 22
apt install -y nodejs nginx git
adduser --system --group --home /var/www/guruji guruji
```

### 2. The site

```bash
git clone https://github.com/gsrikar250222/palm1.git /var/www/guruji
cd /var/www/guruji
npm install --omit=dev
chown -R guruji:guruji /var/www/guruji
```

### 3. Secrets

```bash
nano /etc/guruji.env      # the same names as in Path A, minus HOST and PORT
chmod 600 /etc/guruji.env
chown root:root /etc/guruji.env
```

### 4. Keep it running

```bash
cp deploy/guruji.service /etc/systemd/system/guruji.service
systemctl daemon-reload
systemctl enable --now guruji
systemctl status guruji          # and: journalctl -u guruji -f
```

(`deploy/ecosystem.config.cjs` is there if you would rather use PM2.)

### 5. nginx and HTTPS

```bash
cp deploy/nginx-guruji.conf /etc/nginx/sites-available/guruji
# edit the two server_name lines to your domain
ln -s /etc/nginx/sites-available/guruji /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx
certbot --nginx -d gurujipalmistry.org -d www.gurujipalmistry.org
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

### 6. Check it

```bash
cd /var/www/guruji && npm run preflight     # prints what is set and what still is not
curl -s localhost:3456/api/health
```

Then the same four outside checks as Path A (health, Cashfree whitelist and webhook, the two PINs,
a ₹1 booking).

### Updating later

```bash
cd /var/www/guruji && git pull && npm install --omit=dev && systemctl restart guruji
```

---

## Things that differ from Vercel

- **One always-on process instead of serverless functions.** That suits this site better: the
  per-IP rate limiter, the 15-minute pooja slot holds and the chat polling all live in memory and
  were being reset on every cold start. Keep it to **one** process (`instances: 1` in PM2) for the
  same reason.
- **`vercel.json` and `api/index.js` are ignored** on Hostinger. Leave them in the repo; they cost
  nothing and keep the Vercel deployment working as a staging copy if you want one.
- **`npm run build` is only for Vercel** (it copies the browser files into `public/`). Hostinger
  serves them straight from the repo through `server.js`.
- **Uploaded images and bookings live in MongoDB**, not on the server's disk, so a redeploy or a
  rebuilt VPS loses nothing. The `data/` folder is only the fallback when there is no database.

## Keeping both

You can run both for a while: point the domain at Hostinger and leave the Vercel URL as a test
site. They share the Atlas database, so a booking made on one shows up on the other. When you are
happy, delete the Vercel project — or keep it, since it costs nothing.
