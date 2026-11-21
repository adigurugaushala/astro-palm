# Guruji Palmistry — progress

_Updated 21 Nov 2026._

## Stack decisions (and why they differ from the brief's defaults)

| Brief default | What this repo uses | Why |
|---|---|---|
| Next.js 16 + Express 5 | Vanilla HTML + Tailwind (Play CDN) single-page app, plain Node HTTP server | The brief says to read the repo first and reuse what works. This site already exists, is deployed, and passes its tests; a Next.js rewrite would throw that away for no user-visible gain. |
| Mongoose 9 | `mongodb` driver v6 with a thin store (`db.js`) | One small data layer, no schema framework; the store also has a file fallback so the site runs with no database. |
| PayU | **Cashfree Payments** | The owner supplied Cashfree production keys on 21 Nov and asked for Cashfree. The gateway sits behind one module (`payments.js`), so another provider is a new file, not a rewrite. |
| Jest/Vitest + Supertest | `node --test` with a real HTTP server and an in-memory Mongo stand-in | No extra dependencies; same coverage of the API surface. |
| Playwright | Playwright, in a local harness outside the repo | Already set up; screenshots and the accessibility sweep run from there. |

## Done

- Brand "GURUJI PALMISTRY"; navigation Home, About Guruji, Services, Reiki Healing, Courses, Resources, FAQs, Contact.
- Real page addresses for every page, with per-page title, description, canonical link and Schema.org data; generated `robots.txt` and `sitemap.xml`.
- About Guruji, services directory and a page per service, service categories, Reiki Healing, Courses, Resources hub and articles, FAQs by topic, Contact and enquiry, three policy pages, site search.
- Three core consultations, including Astro-Palmistry Correlation with the full report scope and correlation table.
- Hero palm-line labels redrawn so each name points at the right line or mount.
- Searchable gotram picker (260 gotrams, including the rishi and vamsha list Guruji supplied on 21 November) and a birth-place picker over 3,502 Indian cities that fills in latitude and longitude.
- Palm photo set: left palm, right palm, the little-finger edge of the palm, and the back of the hands (optional).
- Bookings with pooja date and time slot, prasadam address, Track Status for bookings and enquiries.
- Cashfree payments: server-created orders, checkout, return verification, webhook; the server sets the amount and confirms only from Cashfree's API. Refuses to take a payment while storage is temporary.
- Admin dashboard: bookings, enquiries, services and prices, categories, courses, articles, FAQs, testimonials, About, homepage, settings, policies, images, mantras. Owner and editor roles.
- 116 automated API tests; axe-core (WCAG 2.1 AA) clean at 390px and 1280px; no horizontal overflow from 320px to 1920px.

### Added 21 November

- **Consultation room**: a private Jitsi room per booking, open from ten minutes before the appointment until thirty minutes after it, moderator rights for Guruji only, a pre-check screen, an audio-only option and a live countdown. Three ways to run it — JaaS, self-hosted, or the public service with a warning. See `docs/SESSIONS.md`.
- **Chat between the devotee and Guruji**, in the app only: on the booking's Track Status page and in Guruji's case area, with unread counts. No email and no WhatsApp in this flow, as instructed.
- **Birth chart engine** (`chart.js`): VSOP87D positions, Lahiri ayanamsa, whole-sign houses, nakshatra and pada, Vimshottari dasha, North and South Indian chart drawings. Checked against published worked examples and a known chart — `docs/CHART_VERIFICATION.md`, `npm run verify:chart`.
- **The written reading as a PDF** (`report.js`): Guruji writes it in the case area, marks it ready, and the devotee downloads it from Track Status.
- **Guruji's case area** (`/guruji`, PIN-protected): the paid cases, each with the devotee's details, the chat, the chart, the reading and the session controls.
- **Self-paced courses**: a free "Introduction to Palmistry" with five written lessons, enrolment with no account (reference + mobile), a lesson player at `/learn/<reference>` with progress that survives a reload, and completion recorded on the enrolment.
- **Telugu and Hindi** for the interface, with a switcher in the header, the mobile menu and the footer. Long-form writing stays in English, and the switcher says so in the chosen language.
- **Removed the mock-up leftovers**: the fake chat page, the fake video-call modal, the sample report and next-steps pages, the invented WhatsApp/email "reminder" panel and the pretend login — about 740 lines of markup that promised things the site did not do.

## Next

1. A real two-browser call once the Jitsi keys are set (steps in `docs/SESSIONS.md`).
2. OpenAPI file and contract tests (`docs/openapi.yaml`, `npm run test:contract`).
3. Divisional charts (navamsa and the rest) and true-node Rahu/Ketu.
4. Paid courses through checkout; coupons and GST invoices.
5. Telugu and Hindi for the articles and the course lessons — this needs Guruji's own words, not machine translation.
6. Load tests and a Lighthouse run.

## Blocked

- **Live Cashfree test** — this build environment cannot reach `api.cashfree.com`, and the Vercel connector here cannot write environment variables. Needs the owner to add the keys in Vercel and whitelist the domain; then a ₹1 live payment.
- **MongoDB on the hosted site** — needs `MONGODB_URI` in Vercel. Until then storage is temporary and payments stay switched off.

## Owner inputs still needed

Real WhatsApp number and contact address · Guruji's bio and photo (the About text is editable placeholder-free prose, but no qualifications or years are claimed) · final prices for every service and course · legal review of the three policy pages · `ADMIN_PIN`, `MONGODB_URI`, Cashfree keys in Vercel · testimonials (none are published; the section is empty until real ones are added).
