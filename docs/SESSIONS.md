# Video and audio consultations, chat, and the case area

_Written 21 November 2026._

## Repo audit (what already existed, before this feature)

1. **Stack**: a vanilla single-page app (`index.html`, `app.js`, `site.js`, Tailwind Play CDN) served by a plain Node HTTP server (`server.js`) — no React, no Express, no build step for the client.
2. **Routing**: a table of `[method, RegExp, handler]` in `server.js`; the client has its own route table in `site.js` that maps real URLs onto `#page-…` views.
3. **Data**: `db.js` exposes one store with two backends — MongoDB (driver v6) and a JSON-file fallback — with collections for bookings, enquiries, reviews, mantras, content, media and now messages.
4. **Bookings** already carried a devotee (name, mobile, email), a service, an amount set by the server, and a status flow `PENDING_PAYMENT → PAID → DETAILS_RECEIVED → … → COMPLETED`.
5. **No user accounts anywhere**, by the owner's instruction: a devotee is identified by booking reference + the mobile number they booked with. Staff use PINs.
6. **Payments** sit behind `payments.js` (Cashfree); the server never trusts the browser for an amount or a payment result.
7. **Scheduling existed only as text** (`slot.date`, `slot.time`) — there was no machine-readable appointment instant, so one had to be added (`slotStart`, `slotMinutes`).
8. **Tests** run on `node --test` against a real HTTP server, with an in-memory Mongo stand-in (`test/fake-mongo.js`); no Jest, no Supertest.
9. **Rate limiting** is per-endpoint in `server.js`, with `RATE_LIMIT_MULTIPLIER` for test runs.
10. **Deployment** is Vercel: `api/index.js` wraps the same server, `vercel.json` lists the files the function needs and the SPA rewrites — both needed updating for the new modules and routes.

## How a session works

- Every booking is created with a room name of its own: `guruji-` plus 32 characters from `crypto.randomBytes(20)` (`session.js`, `newRoomName`). It is never derived from the order id, so it cannot be guessed from a reference someone shares.
- `GET /api/bookings/:id/session` is the only way to learn the room name, and it answers only inside the window.

| Situation | Status | `code` |
|---|---|---|
| No mobile number and no staff PIN | 401 | — |
| Wrong mobile, or no such booking | 404 | — |
| Booking not paid | 409 | `not_paid` |
| Consultation already completed or cancelled | 409 | `ended` |
| Guruji has closed the session | 409 | `ended` |
| More than 10 minutes before the appointment | 409 | `too_early` (with `opensAt`) |
| After the appointment plus 30 minutes | 409 | `ended` |
| Inside the window | 200 | — |

- A 200 carries `domain`, `roomName`, `jwt`, `displayName`, `role`, `opensAt`, `closesAt`, `mode` and `productionSafe`.
- The token is signed in `session.js` with Node's own `crypto` (no JWT dependency) and expires when the window closes. **Moderator rights are given to Guruji only** — the devotee is always a guest, so a devotee cannot mute, kick or lock the room.
- `POST /api/bookings/:id/session/joined` records the first join for each side and is idempotent.
- `POST /api/bookings/:id/session/end` needs Guruji's or the owner's PIN; it closes the room and moves the booking to `AWAITING_REPORT` (or `COMPLETED` if the reading is already written).

## Three ways to run the room

| Mode | Set | What the devotee gets |
|---|---|---|
| JaaS (8x8), **recommended** | `JITSI_APP_ID`, `JITSI_KID`, `JITSI_PRIVATE_KEY` | A private room on 8x8.vc with an RS256 token; only people the server admits can enter. |
| Self-hosted Jitsi with JWT | `JITSI_DOMAIN`, `JITSI_APP_ID`, `JITSI_APP_SECRET` | The same, HS256, on your own server. |
| Nothing set | — | The public `meet.jit.si` with an unguessable name and **no token**. Anyone with the link could walk in. The join screen says so and `productionSafe` is `false`. Do not use this for real consultations. |

## Chat

`GET`/`POST /api/bookings/:id/messages` — the same authentication as the session. Messages are stored in their own collection, marked read per reader, and the case list shows unread counts. There is no email and no WhatsApp in this flow: it is in-app only, by the owner's instruction.

## Manual check with two browsers

Run this once after setting the Jitsi keys, before taking real consultations. It cannot be automated here, because it needs two real devices with a camera and a microphone.

1. In the admin area, create (or pay for) a consultation with an appointment about 15 minutes from now.
2. **Browser A (the devotee)**: open `/track`, enter the reference and mobile. The consultation card should show a live countdown and a disabled-feeling "Join session" link until the room opens.
3. Wait until 10 minutes before the appointment, or set `JITSI_OPEN_BEFORE_MIN` higher. Reload: the countdown should read "The room is open now."
4. Click **Join session** → the pre-check screen appears. Choose **Audio only**. The browser should ask for the microphone and not the camera.
5. **Browser B (Guruji)**: open `/guruji`, sign in with `GURUJI_PIN`, open the same case, click **Join session**. Confirm Guruji appears as moderator (the toolbar has the mute-everyone and lock options; the devotee's does not).
6. Check both directions of audio and video, then the in-call chat.
7. In Browser A, send a chat message from the booking page while the call runs; it should appear in Guruji's case area within five seconds, and the unread badge should clear once read.
8. In Browser B, press **End session**. Browser A should see the room close; reloading `/session/<reference>` should now say the session has ended.
9. Open `/session/<reference>` in a third browser with no reference and no PIN: it must ask for the mobile number and refuse a wrong one.
10. Finally, check the booking's status is `AWAITING_REPORT` in the admin dashboard.

## Environment values to set

| Name | Needed for | Notes |
|---|---|---|
| `GURUJI_PIN` | the case area, chat, chart, reading | long and random; not the same as `ADMIN_PIN` |
| `JITSI_APP_ID`, `JITSI_KID`, `JITSI_PRIVATE_KEY` | JaaS rooms | from the 8x8 JaaS console; the private key is a PEM block |
| `JITSI_DOMAIN`, `JITSI_APP_SECRET` | a self-hosted Jitsi instead | |
| `JITSI_OPEN_BEFORE_MIN`, `JITSI_CLOSE_AFTER_MIN` | optional | defaults 10 and 30 |

Every name is listed, empty, in `.env.example`. No secret is in the repo, in any log, or in this file.
