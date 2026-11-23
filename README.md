# Guruji Palmistry — Guidance · Healing · Devotion · Learning

The Guruji Palmistry platform: palmistry and Vedic astrology consultations, Reiki healing, japa, puja, pitru and muhurta services, courses, a knowledge hub, bookings with online payment, and an admin dashboard.

**Pages:** `/` · `/about` · `/services` · `/services/<slug>` · `/services/category/<id>` · `/reiki-healing` · `/courses` · `/courses/<slug>` · `/resources` · `/resources/<slug>` · `/faqs` · `/contact` · `/track` · `/book/consultation` · `/book/pooja` · `/mantras` · `/palmistry` · `/privacy-policy` · `/terms` · `/cancellation-refund-policy` · `/admin` · `/guruji` (Guruji's cases) · `/session/<reference>` (the consultation room) · `/learn/<reference>` (course lessons)

It is still one HTML document: `site.js` renders the content pages from `content-data.js` (plus any admin edits) and keeps the address bar in step, so every page has a real, shareable, SEO-friendly URL.

## Run locally

```bash
npm install        # installs the MongoDB driver
cp .env.example .env   # then put your real password and an ADMIN_PIN in .env
npm start          # http://localhost:3456
npm test           # API tests (MongoDB code path + file fallback)
npm run check      # syntax-check all JavaScript
npm run preflight  # on a server: what is configured, what is missing, is Mongo reachable
```

Requires Node.js 18+.

## Database (MongoDB Atlas)

When `MONGODB_URI` is set in `.env`, the server stores everything in MongoDB (database `guruji` by default):

| Collection | Contents |
|---|---|
| `bookings` | Consultation and pooja bookings: order ID, service, server-calculated amount, slot, seeker details, uploaded photo names, payment status and history |
| `enquiries` | Contact / booking / course enquiries from the contact form, with their reference and status |
| `content` | Admin edits to the site content (one document per section; anything not edited comes from `content-data.js`) |
| `media` | Images uploaded in the admin dashboard, served from `/api/media/:id` |
| `reviews` | Seeker reviews (marked *verified* only when tied to a paid booking) |
| `mantras`, `mantra_categories` | The Mantras & Stotras library — copied from `data/mantras.json` automatically the first time the server connects |

If `MONGODB_URI` is empty, still contains `<db_password>`, or the cluster can't be reached, the server logs why and falls back to JSON files in `./data`, so the site never goes down.

**Atlas checklist**
1. *Database Access* — the user `gurujipalmistry_db_user` exists; put its password in `.env`.
2. *Network Access* — add the IP address of every machine that runs the server (your PC, and later your hosting server). Otherwise the connection is refused.

## API

| Method & path | Purpose |
|---|---|
| `GET /api/health` | Shows whether storage is `mongodb` or `file` |
| `GET /api/mantras` | Mantra library |
| `POST/PUT/DELETE /api/mantras[/:id]` | Edit library — requires header `X-Admin-Pin` (= `ADMIN_PIN`) |
| `POST /api/admin/verify` | Checks an admin PIN |
| `POST /api/bookings` | Create a booking (prices are set by the server) |
| `GET /api/bookings/:orderId?mobile=` | Look up a booking — needs the mobile number it was made with |
| `PATCH /api/bookings/:orderId` | `payment_success`, `payment_failed`, `details_submitted` |
| `GET/POST /api/reviews` | List / add reviews |
| `GET /api/content` | Published site content (services, courses, articles, FAQs, about, settings, policies) |
| `POST /api/enquiries` | Contact / booking / course enquiry; returns a reference |
| `GET /api/enquiries/:ref?mobile=` | Look up an enquiry — needs the mobile number it was sent with |
| `POST /api/bookings/:orderId/payment` | Starts a Cashfree payment; returns a `payment_session_id` |
| `POST /api/bookings/:orderId/verify-payment` | Asks Cashfree for the real status and records it |
| `POST /api/payments/cashfree/webhook` | Cashfree's callback — only tells the server *which* order to re-check |
| `GET/PATCH /api/admin/bookings[/:orderId]` | Admin: list bookings, change status, add a note |
| `GET/PATCH /api/admin/enquiries[/:ref]` | Admin: list enquiries, change status, add a note |
| `GET /api/admin/content`, `PUT/DELETE /api/admin/content/:section` | Admin: read, save or reset a content section |
| `GET/POST /api/admin/media`, `DELETE /api/admin/media/:id` | Admin: image library |
| `GET /api/bookings/:orderId/session` | The consultation room: domain, room name, token, window. 401/404/409 (`not_paid`, `too_early`, `ended`) |
| `POST /api/bookings/:orderId/session/joined` | Records the first join (idempotent) |
| `POST /api/bookings/:orderId/session/end` | Closes the room — Guruji or the owner only |
| `GET/POST /api/bookings/:orderId/messages` | Chat between the seeker and Guruji |
| `GET/POST /api/bookings/:orderId/chart` | The birth chart: read it, or cast it (Guruji) |
| `GET /api/bookings/:orderId/report.pdf?mobile=` | The written reading, once Guruji marks it ready |
| `GET /api/guruji/cases[/:orderId]` | Guruji's case list and one case — needs `GURUJI_PIN` or `ADMIN_PIN` |
| `POST /api/guruji/cases/:orderId/claim`, `PUT …/report`, `POST …/ready` | Claim a case, save the reading, mark it ready |
| `GET /api/courses/:slug/outline` | Public lesson outline (titles and minutes, no lesson text) |
| `GET /api/bookings/:orderId/course?mobile=` | The lessons, for an enrolled student |
| `POST /api/bookings/:orderId/course/progress` | Mark a lesson done or not done |

Write endpoints are rate-limited per IP (`RATE_LIMIT_MULTIPLIER` raises the limits).

## Connecting the database

1. **Atlas → Network Access**: add `0.0.0.0/0` (allow from anywhere). Vercel's functions have no fixed IP address, so without this the site cannot reach the cluster.
2. **Atlas → Database Access**: the user needs `readWrite` on the `guruji` database.
3. **Vercel → Settings → Environment Variables** (Production, Preview and Development):
   - `MONGODB_URI` = the Atlas connection string with the real password in place of `<db_password>` (mark it **Sensitive**)
   - `MONGODB_DB` = `guruji`
4. Redeploy, then open `/api/health`: it should say `"storage":"mongo"`. While it says `file-temporary`, the database is not connected and payments stay switched off.

Locally, put the same two values in `.env` and run `npm run db:check` — it tests the connection and explains any failure (wrong password, IP not allowed, no access to the database) without printing the password.

On first connection the server creates its indexes and copies `data/mantras.json` into the `mantras` collection. Nothing else needs seeding.

## Consultations, chat and courses

Each paid consultation gets a private video and audio room of its own, open from ten minutes before the appointment until thirty minutes after it. Guruji joins as moderator from `/guruji`; the seeker joins as a guest from Track Status. Chat sits beside it, in the app only — no email, no WhatsApp. Guruji casts the birth chart, writes the reading, and the seeker downloads it as a PDF.

Set the Jitsi keys before taking real consultations: with none set the room falls back to the public `meet.jit.si` service, which anyone with the link could enter. `docs/SESSIONS.md` has the three ways to run it, the 401/404/409 contract and the manual two-browser check.

"Introduction to Palmistry" is a free self-paced course: five written lessons, enrolment with a reference and a mobile number (no account), and progress kept per enrolment at `/learn/<reference>`.

## Languages

The interface can be switched to Telugu or Hindi from the header, the mobile menu or the footer; the choice is remembered on the device. Translations live in `i18n.js`, keyed by the exact English string, so anything without an entry stays in English rather than being half-translated. Articles, course lessons and Guruji's written readings are in English for now, and the switcher says so in the chosen language.

## Where the site's words come from

Two places, and the database wins:

1. **`content-data.js`** — what ships in the code. A deployment updates it.
2. **The `content` collection** — whatever has been saved from the admin
   dashboard. While a section is saved there, it overrides the code for that
   section, and a deployment will not change it.

That is deliberate: an edit made in the dashboard has to survive the next
deployment. But it also means a change made in the code may not show up on the
site. **Admin → Saved vs original** lists every section, says which of the two
is in use, when the saved copy was last written and by whom, and spells out
item by item what the saved copy is holding back — what would come back, what
would be lost, and what differs. Restoring a section downloads a backup of the
saved copy first, so nothing is thrown away.

## SEO and accessibility

`/robots.txt` and `/sitemap.xml` are generated from the live content, so new services, courses and articles appear in the sitemap as soon as they are published. Each page sets its own title, description, canonical link and Schema.org data (Organization, Service, Course, Article, FAQPage, BreadcrumbList).

Pages are checked with axe-core (WCAG 2.1 AA) at 390px and 1280px — no violations at the time of writing. When adding content, keep image `alt` text meaningful and text contrast at 4.5:1 or better.

## Admin dashboard

`/admin`, protected by `ADMIN_PIN` (full access) or the optional `EDITOR_PIN` (content only — no bookings or enquiries). It manages bookings, enquiries, services and prices, service categories, courses, articles, FAQs, testimonials, the About page, the homepage hero and pillars, contact settings, policies, images and the mantra library. Every section can be edited or reset to the content shipped in `content-data.js`; items can be published or left as drafts, and reordered.

Prices shown on the site and charged by the server both come from the admin's service records, so changing a price in one place changes it everywhere.

## Payments (Cashfree)

With `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` set, the site uses Cashfree Checkout:

1. The browser asks the server to start a payment for a booking; the **server** sets the amount.
2. Cashfree checkout opens; the seeker pays by UPI, card, net banking or wallet.
3. On return, the server asks Cashfree for the order status and only then marks the booking paid. The webhook does the same — the webhook body is never trusted on its own, and a payment for the wrong amount is refused.

Without the keys the site runs in test mode (`PAYMENT_MODE=simulated`): the whole flow works, with simulate-success / simulate-failure buttons, and no money moves. **Keys live only in environment variables — never in the repository.**

### Going live with Cashfree

1. **Vercel → Settings → Environment Variables**: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` (both *Sensitive*), `CASHFREE_ENV=production`, and `MONGODB_URI` + `MONGODB_DB` + `ADMIN_PIN`. `SITE_URL` is optional — the return address is taken from the request when it is not set.
2. **Cashfree dashboard → Developers → Webhooks**: add `https://<your-domain>/api/payments/cashfree/webhook`.
3. **Cashfree dashboard → Developers → Whitelist domains**: add the site's domain, or the checkout SDK will refuse to open.
4. Check `https://<your-domain>/api/health`: it should report `payments: "cashfree"`, `paymentEnv: "production"` and `paymentsReady: true`.

`paymentsReady: false` means the database is not configured. The server refuses to take a payment in that state, because a booking kept in temporary storage can disappear between requests — money would be taken for a booking nobody can find. Set `MONGODB_URI` first.

Test with sandbox keys (Cashfree dashboard → Developers → API keys → Sandbox) and `CASHFREE_ENV=sandbox` before switching to the production pair. Keys are read from the environment on every cold start — never put them in the repository.

## Project layout

| Path | What it is |
|---|---|
| `index.html` | The single-page site (all views) |
| `styles.css` | Design tokens and component styles |
| `app.js` | Booking flows, validation, chat, mantras UI, palmistry guide |
| `site.js` | Routing and page addresses, the content pages, enquiries, Cashfree checkout, search, admin dashboard |
| `content-data.js` | Default site content: services, courses, articles, FAQs, About, settings, policies (the admin saves edits over it) |
| `gotras-data.js` | Gotram list for the Sankalpa — 260 gotrams with their alternate spellings, searchable in the booking form |
| `payments.js` | Cashfree Payments client (keys from the environment only) |
| `session.js` | Jitsi room names, JWT signing, the session window |
| `chart.js` | The sidereal birth chart engine (VSOP87D, Lahiri, dashas) |
| `chart-ui.js` | North and South Indian chart drawings, planet and dasha tables |
| `report.js` | The written reading as a PDF (PDFKit) |
| `course-lessons.js` | Course lesson text — server-only, never served to the browser |
| `i18n.js` | Telugu and Hindi for the interface |
| `data.js` | Reviews, palm-line guide, sample report content |
| `mantras-data.js` | Mantras seed data (generated by the server from `data/mantras.json`) |
| `mantras-db.js` | Client-side mantras store (localStorage + `/api/mantras` sync) |
| `server.js` | Static file server + JSON API |
| `db.js` | Storage layer: MongoDB, with JSON-file fallback |
| `test/` | API tests (`npm test`) |
| `data/mantras.json` | Mantras database file |
| `assets/` | Images used by the site |
| `design-references/` | Reference images and unused artwork (not served) |
| `docs/DEPLOY_HOSTINGER.md` | Putting the site on Hostinger — managed Node app, or a VPS |
| `deploy/` | systemd unit, nginx config and PM2 config for a VPS |
| `docs/SESSIONS.md` | The consultation room, chat, and the two-browser manual check |
| `docs/CHART_VERIFICATION.md` | How the chart engine was checked, and its limits |
| `docs/TEST_REPORT.md` | What was tested, with PASS / BLOCKED / NOT TESTED |
| `docs/PROGRESS.md` | What is done, what is next, what is blocked |
| `REDESIGN_REPORT.md` | Full record of the redesign and fixes |

## Configuration

Copy `.env.example` to `.env` for local settings. `.env` is git-ignored — never commit passwords or connection strings with real credentials.
