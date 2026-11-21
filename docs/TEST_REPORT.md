# Test report — Guruji Palmistry

_Run 21 Nov 2026 on the `sessions-courses-i18n` branch. Status is one of PASS, FAIL, BLOCKED (cannot run here, reason given) or NOT TESTED. Nothing is marked PASS that was not actually run._

## Commands

| Command | What it runs |
|---|---|
| `npm test` | 116 API and unit tests (`test/api.test.js` and `test/sessions.test.js`) against an in-memory Mongo stand-in **and** the file store |
| `npm run verify:chart` | Chart engine against published worked examples and a known chart |
| `npm run preflight` | On the server: which settings are present, and whether MongoDB answers |
| `npm run check` | Syntax check of every JavaScript file |
| `npm run build` | Builds `public/` for deployment |

Browser checks run from a Playwright harness outside the repo (`/home/claude/harness`): page screenshots at 390 / 1280 / 1920 px, an axe-core sweep, and the end-to-end journeys below.

## Results

| Area | Status | Evidence |
|---|---|---|
| Server and client files parse | PASS | `npm run check` |
| Booking creation, server-side pricing, status flow | PASS | `npm test` — booking suite |
| Pooja slot capacity, 15-minute hold, 90-day window | PASS | `npm test` — pooja slot suite |
| Booking read/update requires the matching mobile number | PASS | `npm test` |
| Site content API, admin edits, drafts hidden from the public | PASS | `npm test` — content suite |
| Enquiries: validation, storage, admin status, internal notes stay internal | PASS | `npm test` — enquiry suite |
| Admin bookings and enquiries: list, filter, status, notes | PASS | `npm test` |
| Admin images: upload, type check, serve, delete | PASS | `npm test` |
| Admin PIN required; editor role cannot read bookings | PASS | `npm test` |
| `robots.txt` and `sitemap.xml` list the live pages, exclude `/admin` | PASS | `npm test` |
| Server files (`server.js`, `db.js`, `payments.js`, `.env`, `data/*`) are not downloadable | PASS | `npm test` |
| Cashfree: payment session created for the server's amount, not the browser's | PASS | `npm test` — Cashfree suite (stand-in gateway) |
| Cashfree: booking marked paid only when Cashfree says PAID | PASS | `npm test` |
| Cashfree: short payment refused; expired order fails the booking; retry gets a new gateway order | PASS | `npm test` |
| Cashfree: forged "paid" webhook changes nothing | PASS | `npm test` |
| Cashfree: the browser cannot mark a booking paid itself | PASS | `npm test` |
| Cashfree: order fields match Cashfree's documented rules | PASS | `npm test` |
| Secret key sent only as a header; gateway errors not leaked to the devotee | PASS | `npm test` |
| **Live Cashfree sandbox / production run** | BLOCKED | This environment cannot reach `api.cashfree.com` (egress proxy refuses it), and the Vercel connector here cannot write environment variables. Needs the keys in Vercel, the domain whitelisted, then a ₹1 live payment. |
| End-to-end: service page → booking → payment → upload page | PASS | Playwright, 1280px |
| End-to-end: pooja booking → date and slot → payment → Track Status | PASS | Playwright, 1280px |
| End-to-end: enquiry → reference → Track Status | PASS | Playwright, 1100px |
| Accessibility, WCAG 2.1 AA (axe-core), 12 pages | PASS | 0 violations at 390px and 1280px |
| Horizontal overflow, 30 pages × 320–1920px | PASS | No page exceeds the viewport |
| Broken images and dead links, 30 pages | PASS | None found |
| Contract tests against an OpenAPI file | NOT TESTED | `docs/openapi.yaml` not written yet |
| Concurrency: parallel requests for one pooja slot | PASS (partial) | Capacity and hold are covered by the slot tests; a 20-way parallel race test is not yet written |
| Load test (k6 / autocannon) | NOT TESTED | Next step |
| Lighthouse performance and accessibility ≥ 90 | NOT TESTED | Next step |

## Sessions, chat, chart, reading and courses (added 21 Nov)

| Check | Status | Evidence |
|---|---|---|
| Room name is per booking, 24+ characters, from `crypto`; 200 names, no collision | PASS | `npm test` — sessions suite |
| Session window: opens 10 min before, closes 30 min after the slot | PASS | `npm test` |
| An IST slot is stored as the right UTC instant | PASS | `npm test` |
| `GET /session` → 409 `not_paid` before payment | PASS | `npm test` |
| `GET /session` → 401 with no mobile and no PIN | PASS | `npm test` |
| `GET /session` → 404 with the wrong mobile, and for an unknown booking | PASS | `npm test` |
| `GET /session` → 409 `too_early`, with `opensAt` | PASS | `npm test` |
| `GET /session` → 409 `ended` after the window, after Guruji ends it, and once completed | PASS | `npm test` |
| `GET /session` → 200 for the devotee as **guest**, for Guruji as **moderator** | PASS | `npm test` |
| A wrong or unknown PIN opens nothing | PASS | `npm test` |
| With no Jitsi keys the room is the public service, flagged `productionSafe: false`, no token minted | PASS | `npm test` |
| `POST /session/joined` is idempotent | PASS | `npm test` |
| `POST /session/end` — Guruji only | PASS | `npm test` |
| Chat both ways; empty message refused; `since` returns only newer messages; nobody else can read | PASS | `npm test` |
| Case list needs Guruji's or the owner's PIN; carries unread counts; unpaid bookings are not cases | PASS | `npm test` |
| `/api/admin/verify` reports the role of the PIN | PASS | `npm test` |
| Chart cast, stored, and visible only to the devotee and Guruji; refuses a date with no place | PASS | `npm test` |
| Chart engine against published worked examples and the Gandhi chart | PASS | `npm run verify:chart`; `docs/CHART_VERIFICATION.md` |
| PDF reading refused while a draft (409), served once marked ready, refused to the wrong mobile (404) and with no mobile (401) | PASS | `npm test` |
| Course outline is public but carries no lesson text | PASS | `npm test` |
| Free enrolment opens at once; a course with no lessons cannot be enrolled in | PASS | `npm test` |
| Lesson text only for the enrolled student | PASS | `npm test` |
| Progress is stored, idempotent, reversible; an unknown lesson is refused; 100% completes the enrolment | PASS | `npm test` |
| Browser: devotee sees the room card, countdown, chat, Kundali and the reading link on `/track` | PASS | Playwright, 1280px — `devotee_track.png` |
| Browser: session page — ask-for-mobile, pre-check, audio-only join, leave, too-early countdown | PASS | Playwright at **1440px and 390px** with a stubbed Jitsi script (`sess_ui.py`) |
| Browser: course page → enrol → lesson player → mark complete → progress survives a reload | PASS | Playwright at 1440px and 390px (`learn.py`) |
| Browser: Guruji's case area — list, case, chart, dasha, chat | PASS | Playwright, 1440px |
| Telugu and Hindi switch, persist, and translate dynamically rendered pages | PASS | Playwright (`i18ncheck.py`) |
| Accessibility (axe-core, WCAG 2.1 AA) on the course, lesson, case and admin pages | PASS | 0 violations |
| No horizontal overflow at 390px on every new page | PASS | `scrollWidth` equals the viewport |
| **A real two-browser call on real devices** | NOT TESTED | Needs two devices with a camera and microphone, and the Jitsi keys. Steps are in `docs/SESSIONS.md`. |
| **A real Jitsi JaaS room with a signed token** | BLOCKED | No Jitsi keys are set, and this environment cannot reach 8x8.vc. The token signing itself is unit-tested; the round trip to Jitsi is not. |
| Load test (k6 / autocannon), Lighthouse | NOT TESTED | Next step |
| Contract tests against an OpenAPI file | NOT TESTED | `docs/openapi.yaml` not written yet |

## Hosting move (21 Nov)

| Check | Status | Evidence |
|---|---|---|
| Server binds the host and port a managed platform gives it (`HOST=0.0.0.0`) | PASS | Started with `HOST=0.0.0.0 PORT=4100`; `/api/health` answered |
| Server-side files are not downloadable — now including `course-lessons.js`, `session.js`, `chart.js`, `report.js`, `docs/`, `deploy/`, `.env.example`, `package.json` | PASS | `npm test`; 15 paths checked, all 404 |
| Browser files still served (`i18n.js`, `chart-ui.js`, `content-data.js`, `gotras-data.js`, `assets/`, `sitemap.xml`) | PASS | 200 for each |
| Favicon, apple-touch icon and web manifest | PASS | No 404s left on any page load |
| `npm run preflight` reports each setting and tests the database | PASS | Run with and without the values set |
| **The site actually running on Hostinger** | NOT TESTED | No Hostinger account reachable from here. The steps are in `docs/DEPLOY_HOSTINGER.md` |

## Known gaps

Divisional charts (navamsa and the rest) and true-node Rahu/Ketu; paid courses still go through the enquiry form rather than checkout; Telugu and Hindi cover the interface, not the articles, lessons or Guruji's written readings; coupons and GST invoices; OpenAPI contract tests; load and Lighthouse runs; a real two-browser call.

## Owner actions

Add `MONGODB_URI`, `ADMIN_PIN` and the Cashfree keys in Vercel; whitelist the site's domain in the Cashfree dashboard and set the webhook; rotate the Cashfree secret and the database password that were shared in chat; supply the real WhatsApp number, contact address, final prices and a legal review of the policy pages.
