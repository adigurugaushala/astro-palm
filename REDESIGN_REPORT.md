# Guruji — Cleanup & Premium Redesign Report

Scope: the existing vanilla HTML/CSS/JS single-page app (`index.html`, `app.js`, `data.js`, `mantras-*.js`, `styles.css`) and the Node API server (`server.js`). The stack, routes (`showPage(...)` views), API endpoints, data files and branding are all unchanged.

Run it: `npm start`, then open http://localhost:3456. `npm run check` syntax-checks all JS.

---

## 1. Pages inspected

All 16 views were opened and screenshotted at 1680 / 1440 / 1280 / 1024 / 390 px. The views are home, palmistry, book-consultation, book-pooja, book-auth, book-payment, book-upload, book-status, chat, report, next-steps, mantras, mantra-detail, resource-astrology, resource-reiki and resource-articles. All 9 modals were checked too. `palmistry.html` and `landing-v2.html` were also inspected (see §4).

## 2. Design system (Phase 2)

A single token source now lives in `styles.css` (`:root`). It covers colour, type, radius, elevation, layout and motion. The Tailwind theme in `index.html` reads those tokens through `rgb(var(--c-…) / <alpha>)`, so classes like `bg-maroon`, `text-ink-2` and `border-line` resolve to one value everywhere, and opacity modifiers still work.

| Before | After |
|---|---|
| 106 different hard-coded hex colours, 1,078 `[#xxxxxx]` uses | 17 named tokens. 12 intentional one-off colours remain (status greens, PayU teal) |
| 252 uses of 8–11 px text in four sizes | One `text-2xs` (11 px) step. Nothing renders below 11 px |
| 4 font families loaded twice (HTML `<link>` + CSS `@import`), Marcellus unused | 1 font request; unused Marcellus dropped; Telugu/Devanagari fonts included |
| Undefined classes (`shadow-warm-card`, `shadow-gold-glow`, `shadow-xs`, `gap-4.5`, `no-scrollbar`) silently doing nothing | All defined in the theme or in CSS |

Shared component styles: gold and maroon buttons (one shape, consistent hover/active), form-field focus and error states, a global `:focus-visible` ring, card hover, toast (with an error variant), a button loading spinner, and `prefers-reduced-motion` support.

## 3. UI/UX fixes (Phase 3)

**Header** (`index.html` header, `app.js` `showPage`)
- "Home" stayed highlighted on every page because its colour was hard-coded. Now only the current section is highlighted, and `aria-current` is set.
- **Mobile had no navigation at all** (the nav was hidden below 1024 px and there was no menu). Added a hamburger menu with every route; it closes on navigation and on Escape.
- The header wrapped onto two lines or overflowed by 46–200 px once the slot timer appeared. It now stays on one line at every width.
- Dropdowns now open on keyboard focus as well as hover.

**Hero**
- The "Learn the Basics" button was clipped by a fixed-height hero.
- The left palm labels ("Heart Line", "Head Line", "Life Line") were cropped off.
- The artwork contained a sliced fragment of a button from the source screenshot. It is cropped out, and the 920 KB PNG is now an 80 KB JPEG (`assets/hero_palm_artwork.jpg`).
- On mobile and tablet the artwork sat behind the paragraph text. The copy now stacks above the art below 1280 px.

**Topic bar & "What You'll Explore"**
- All six topic tabs only changed colour; they went nowhere. They now open the matching content: Hand Types, Lines, Mounts and Fingers & Thumb on the palmistry page, and Learn Palmistry opens the course details.
- All four explore cards sent people to the payment flow instead of the content they described. They now open that content. They are real `<button>`s, so they are keyboard accessible.
- The topic bar sticks under the header while scrolling.
- The mandala ornaments showed as hard-edged rectangles. They now fade into the background.

**Palmistry page**
- Added the content the navigation promised: *Types of Hands* (Earth, Fire, Air, Water, Classical) and *Fingers & Thumb*.
- The page said "Six Mounts" while the home card said "nine". It now shows all nine mounts.
- The hand-diagram image was letterboxed inside a tall black box. Fixed.

**Offerings, pricing and poojas (duplicates removed)**
- The Overview tab showed the Swamiji banner and then repeated the same consultations and courses as HTML cards on desktop. That HTML copy now shows only on mobile, where the banner's click areas don't exist. The "click the banner" hint only shows where clicking works.
- The *Consultations* tab duplicated the Pricing section, and the *Pooja Sevas* tab duplicated the Poojas section. Both tab views and their buttons were removed; the full sections remain.
- Pooja thumbnails were 50×42 px slices of a screenshot, showing broken fragments such as "Sele". They are rebuilt from the real artwork (`assets/pooja_thumb_*.jpg`).
- Pooja cards had uneven heights and misaligned buttons. They are now equal height with the button pinned to the bottom.
- "View All 12 Poojas" pointed to a page with 6. Relabelled.

**Other**
- Reviews: the 4th card sat alone on a new row. The grid is now 2 / 4 columns.
- The About portrait showed a "SPIR…" text fragment cropped from the banner. Fixed.
- Booking banners didn't reach the right edge, and their text sat directly on busy artwork. They are now full-bleed with a readability scrim.
- Booking steppers overflowed on mobile (page width 634 px on a 390 px screen). They are now compact.
- Pooja summary: the item name and price ran together ("Navagraha Shanti₹ 5,100"). Fixed.

**Result:** no horizontal scrolling on any of the 16 views at 390, 1024, 1280, 1440 or 1680 px (measured, not eyeballed).

## 4. Workflows (Phase 4) — bugs fixed

| Workflow | Problem found | Fix |
|---|---|---|
| Home → "Book" on any pooja (9 buttons) and Next Steps → "Perform Recommended Pooja" | Called `selectPoojaSeva()`, which **did not exist**, so clicking threw a JS error and did nothing | Implemented. It opens the pooja page with only that seva selected (also fixes the `pitru_runa` id mismatch) |
| Next Steps → "Book Follow-up Session" | Navigated to `book-datetime`, a page that doesn't exist, leaving a **blank screen** | Opens consultation booking at ₹750. `showPage` now falls back to Home for any unknown page |
| 10-minute slot hold | Started counting on page load, so after 10 minutes on the *home page* a blocking `alert()` appeared | Starts when booking begins and stops after payment. On expiry it shows a toast and returns you to slot selection |
| Booking forms | Every form was **pre-filled with a stranger's name, phone, email and birth details** ("Srikar Babu G"), and the pooja form had no validation at all | Empty fields with placeholders and proper autocomplete hints. Inline validation for name, Indian mobile, email, gotram and date of birth, with messages under each field |
| Payment | "Pay & Confirm" could be clicked repeatedly | Button locks and shows a spinner until done; repeat clicks are ignored |
| Palm photo upload | Could submit with no photos. Accepted any file type and size. Its status label relied on a CSS class name | Requires the 4 required photos (missing slots are highlighted). Only JPG/PNG/WEBP up to 10 MB. The label uses stable data attributes |
| Quick sign-in | Accepted anything and always greeted the user as "Srikar" via `alert()` | Validates email or mobile and shows the real identifier |
| Reviews | An empty review posted a made-up five-star comment | At least 10 characters are required |
| Chat | Attach and microphone buttons only showed `alert()`s. The All/Active/Completed filters did nothing | Attach opens a real file picker and posts images/PDFs to the thread. The mic records a real voice note (MediaRecorder). Filters work, with an empty state |
| Course "Enroll" | `alert()` claimed "Registration confirmed!" without collecting anything | Opens the existing course-registration modal |
| "View all homams" link, chat info button | `alert()` placeholders | Link to the pooja section; info shows the real order status |
| Admin PIN field | The placeholder printed the PIN ("Enter PIN (1008)") | Hint removed |
| Mantras library | Three diverging copies of `MantrasDB` (in `mantras-data.js`, in `server.js`, and in the generator script). Saving a mantra silently replaced the richer client version with the server's older template | One `mantras-db.js`. The server and generator now write data only to `mantras-data.js`. The library re-renders when server data arrives (it used to call a non-existent `renderMantrasView`) |

All remaining blocking `alert()` calls were replaced with toasts. Escape closes any open modal.

## 5. Server (`server.js`)

- **Crash:** any malformed URL (e.g. `/%E0%A4%A`) threw inside the request handler and **killed the server** (reproduced against the original). Now returns 400.
- Requests can no longer escape the project folder (path-traversal guard).
- `server.js`, `package.json`, `scripts/`, `data/`, `design-references/` and dotfiles are no longer downloadable.
- JSON bodies are size-limited (1 MB) and validated (`title` required on create). Write failures now return 500 instead of reporting success.
- `PORT` and `HOST` can be set by environment variable. `nosniff` and cache headers were added.

## 6. Cleanup (Phase 6)

**Deleted (verified unused or duplicate)**
- `landing-v2.html` (empty).
- `palmistry.html`: orphaned (nothing linked to it) and a duplicate of the home hero.
- 3 root-level WhatsApp images, byte-identical to copies in `assets/`.
- 6 broken `pooja_thumb_*.png`.
- 12 one-off code-mod and image-slicing scripts in `scripts/` (8 Node, 4 PowerShell/Windows). They rewrote `index.html` and `app.js` in place, so re-running any of them would have undone this work. `scripts/create_mantras_dataset.js` is kept (`npm run build:mantras`).

**Moved, not deleted** → `design-references/` (not served):
- The reference screenshot and `uploaded_refs/`.
- 18 unused images, including 4 large AI banners and the old hero slices. Delete this folder if you don't need them.

**Optimised:** 5 pooja images went from about 1.1 MB each to about 190 KB (same filenames). The served `assets/` folder dropped from **16.6 MB to 2.4 MB**.

**Fixed:** `data.js` referenced a non-existent avatar image.

## 7. Preserved (Phase 7)

- All 16 views and their `showPage` ids.
- All `/api/mantras` endpoints (GET/POST/PUT/DELETE) and the `data/mantras.json` format.
- Admin PIN flow, localStorage bookmarks, the jsPDF report download, PayU simulated success/failure, the consultation calendar and slots, the video-call modal, course and daan modals, FAQ, reviews.
- The Guruji branding, palette and fonts.

## 8. Verification (Phase 9)

- `npm run check` passes (all JS parses).
- Headless Chrome (Playwright) tests: **42 workflow assertions pass**. They cover:
  - consultation: service → auth validation → payment lock → upload validation → status;
  - pooja: home Book button → validation → payment;
  - topic bar and explore cards;
  - chat filters and send;
  - follow-up and recommended pooja;
  - review validation, quick sign-in validation, mobile menu;
  - mantras: search, admin PIN, add a mantra through the API, then delete.
- **0 console errors** across all 16 views at 3 widths.
- API checks: malformed URL → 400; `/server.js` and `/data/*` → 404; traversal → 404; invalid JSON → 400; missing title → 422.

Note: the sandbox couldn't reach the CDNs, so tests ran Tailwind, fonts, Font Awesome, jsPDF and confetti from identical local npm copies. Production still loads them from the CDNs as before.

## 9. Remaining issues / recommendations

1. **No real backend for bookings.** Payment (PayU), chat replies from Guruji, the video call and the status tracker are front-end simulations, as they were before; I didn't replace them with fake "real" behaviour. Wiring PayU and a bookings API is the next real step.
2. **The admin is protected only by a client-side PIN**, and the `/api/mantras` write endpoints have no server-side auth. Anyone who can reach the server can edit the library. Add a server-checked token before deploying publicly.
3. **Tailwind runs from the Play CDN**, which Tailwind doesn't recommend for production. Moving to the Tailwind CLI build would remove a ~300 KB runtime script; the token theme is ready for it.
4. `index.html` is still one 4,800-line file. Splitting views into partials or components would make future work safer.
5. The hero artwork is only 456 px tall in the source, so it is upscaled slightly on large screens. A higher-resolution export of the same art would sharpen it.
6. The on-screen sample report and the chat history are still demo content for the sample devotee.

---

## Round 2 — Reference match: Pooja & Consultation pages, header, zodiac wheel

**Pooja booking page** (`index.html` `#page-book-pooja`, `styles.css` "Booking pages")
- Rebuilt to the supplied reference: dark hero with the kalash artwork on the right; main card (stepper, Devotee Details, pooja grid) and sidebar (Your Selection, Important Information) overlapping the hero; warm lamp glow on the left edge.
- Kalash: new sharpened `assets/pooja_hero_kalash.jpg`, sized and placed so the full vessel, coconut and leaves sit above the selection card, as in the reference. It stays visible on mobile.
- Measured against the reference at 1600 px: card edges, column widths (main card + 422 px sidebar, 25 px gap), the 37 px sidebar offset, heading and label sizes, 80 px pooja cards and the input heights all line up.
- Selection logic is unchanged. Cards now only toggle a `selected` state that CSS styles. Cards are keyboard-operable (Space/Enter) with `aria-checked`, and the trash icon removes an item and unticks its card. There is a proper empty state.
- Form fields stay empty with placeholders. The reference shows a sample devotee's details pre-filled, which was the round-1 bug.

**Consultation page** (`#page-book-consultation`)
- Same hero-and-overlap design, with the temple gopuram (`assets/temple_hero_gopuram.jpg`, sharpened) fully visible on the right.
- The 5-step stepper moved into the card.
- The sidebar was restyled to match the pooja page. All `consult-summary-*` IDs are kept, so the existing JS still updates them.

**Header** (all pages)
- Gold lotus line-art logo with a cream tagline.
- New Palmistry dropdown: Guide, Hand Types, Major Lines, Mounts, Fingers & Thumb, Learn Palmistry.
- From 1600 px the header uses the reference's larger sizes (17 px nav, Sign in and Book a Consultation pills).
- The slot-hold countdown is now a floating pill (bottom-right), so it never crowds the header.

**Zodiac wheel** (home hero)
- Inline SVG, about 0.56× the artwork width (≈575 px on desktop), centred on the palm. It has:
  - 5 concentric 1 px rings in `#C8893A`;
  - an outer band of 12 segments with the zodiac symbols plus Devanagari rashi names;
  - dial ticks every 5°;
  - faint spokes and a hexagram.
- 30 % opacity, a 15 % `#F5B85A` glow, a radial edge fade, a 120 s rotation, and no rotation under `prefers-reduced-motion`.
- True layering: a cut-out of the hand and labels (`assets/hero_palm_foreground.webp`, 67 KB) sits above the wheel, so the wheel shows between the fingers and passes behind the palm. Container-query units keep it locked to the palm at every screen size.

**Contact email** set to `gurujipalmistry.org@gmail.com` as a clickable link in the footer and the Help modal. It wraps in narrow columns.

**Verified:** 11 end-to-end checks plus 12 new pooja and consultation checks pass, with 0 console errors. Nothing extends past the viewport at 390, 768, 1024, 1280, 1600 or 1920 px; this was also checked inside clipped containers.

**Asset moved:** `pooja_header_banner.jpg` (no longer used) → `design-references/unused-artwork/`.

---

## Round 3 — MongoDB database

- **`db.js`** (new): one storage interface with two backends: MongoDB (official `mongodb` v6 driver) and a JSON-file fallback. It uses the collections `bookings`, `reviews`, `mantras` and `mantra_categories`, with unique indexes on `orderId` and `id`. On the first connection the mantra library is seeded from `data/mantras.json`. If the database is missing, misconfigured or unreachable, the server logs the reason and falls back to the files.
- **`server.js`** (rewritten around a route table):
  - New endpoints: bookings, reviews and health.
  - The mantra API keeps its existing contract.
  - `.env` loading needs no extra package.
- **Prices are calculated on the server.** A tampered browser amount is ignored.
- **A booking can only be read or updated with the mobile number it was made with.**
- **The admin PIN is checked by the server** (`ADMIN_PIN`). This removes the hard-coded `1008` and the hidden second PIN `sanctuary` from the browser.
- **Write endpoints are rate-limited per IP**, and `db.js`, `test/` and `node_modules/` are not downloadable.
- **Browser (`app.js`, `mantras-db.js`):**
  - Payment creates the booking and records the payment; the real order ID replaces the placeholder everywhere it's shown.
  - Submitting palm photos saves the birth details and photo names.
  - Reviews are saved and shown to every visitor; they are marked verified only when tied to a paid booking.
  - Admin edits go to the server and show the server's error instead of a false "saved" message.
- **Tests:** `npm test` runs 22 API tests against both backends (MongoDB via an in-memory driver stand-in), and all pass. Browser checks: a booking is created in storage with the right amount, status, birth details and photo names; reviews persist; the admin PIN is enforced. 0 console errors.
- **Not yet tested against the live Atlas cluster** — the build workspace cannot reach it. The real driver was confirmed to fall back gracefully.
- **Still simulated:** payments (PayU); the photos themselves are not uploaded, only their names and sizes.
