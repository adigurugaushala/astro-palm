// Video/audio sessions, chat, birth chart, PDF reading, Guruji's case area and
// self-paced courses — run with: npm test
'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guruji-sess-'));
fs.copyFileSync(path.join(__dirname, '..', 'data', 'mantras.json'), path.join(tmp, 'mantras.json'));
process.env.GURUJI_DATA_DIR = tmp;
process.env.GURUJI_SEED_FILE = path.join(tmp, 'mantras-data.js');
process.env.ADMIN_PIN = 'owner-pin-0001';
process.env.GURUJI_PIN = 'guruji-pin-0002';
process.env.RATE_LIMIT_MULTIPLIER = '100';
process.env.MONGODB_URI = '';
process.env.JITSI_APP_ID = '';
process.env.JITSI_PRIVATE_KEY = '';
process.env.JITSI_APP_SECRET = '';
process.env.JITSI_KID = '';
process.env.CASHFREE_APP_ID = '';
process.env.CASHFREE_SECRET_KEY = '';
process.env.PAYMENT_MODE = 'simulated';

const { createServer, slotStartISO } = require('../server');
const { createStore } = require('../db');
const { FakeMongoClient } = require('./fake-mongo');
const { newRoomName, sessionWindow, OPEN_BEFORE_MIN, CLOSE_AFTER_MIN } = require('../session');
const { computeChart } = require('../chart');

const owner = { 'X-Admin-Pin': 'owner-pin-0001' };
const guruji = { 'X-Admin-Pin': 'guruji-pin-0002' };

/** A slot `minutesFromNow` away, in the shape the browser posts. */
function slotIn(minutesFromNow) {
  const when = new Date(Date.now() + minutesFromNow * 60000);
  // The server reads the slot as IST, so build the IST wall clock here too.
  const ist = new Date(when.getTime() + 330 * 60000);
  const iso = ist.toISOString().slice(0, 10);
  let h = ist.getUTCHours();
  const m = String(ist.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { date: iso, time: `${h}:${m} ${ampm}`, iso };
}

for (const backend of ['mongodb', 'file']) {
  describe(`sessions, chat, chart, report and courses with ${backend} storage`, () => {
    let server, base, store;
    const call = async (method, url, body, headers = {}) => {
      const res = await fetch(base + url, {
        method,
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined
      });
      const type = res.headers.get('content-type') || '';
      return {
        status: res.status,
        headers: res.headers,
        body: type.includes('json') ? await res.json().catch(() => null) : null,
        buffer: type.includes('json') ? null : Buffer.from(await res.arrayBuffer())
      };
    };

    const newBooking = async (minutesFromNow, mobile) => {
      const r = await call('POST', '/api/bookings', {
        type: 'consultation', serviceId: 'combined_consultation', slot: slotIn(minutesFromNow),
        devotee: { name: 'Ravi Kumar', mobile, email: 'ravi@example.com' }
      });
      assert.equal(r.status, 201);
      return r.body.booking;
    };
    const pay = (orderId, mobile) => call('PATCH', `/api/bookings/${orderId}`, { event: 'payment_success', mobile });

    before(async () => {
      if (backend === 'file') for (const f of ['bookings.json', 'messages.json']) fs.rmSync(path.join(tmp, f), { force: true });
      store = backend === 'mongodb'
        ? await createStore({ client: new FakeMongoClient(), dbName: 'guruji_sessions' })
        : await createStore({ uri: '' });
      server = createServer(store);
      await new Promise(r => server.listen(0, '127.0.0.1', r));
      base = `http://127.0.0.1:${server.address().port}`;
    });
    after(async () => { server.close(); await store.close(); });

    // ---- room names and the window ----------------------------------------

    test('every booking gets its own unguessable room name', async () => {
      const a = await newBooking(5, '9100000001');
      const b = await newBooking(5, '9100000002');
      assert.notEqual(a.roomName, b.roomName);
      assert.ok(a.roomName.length >= 24, `room name is ${a.roomName.length} characters`);
      assert.match(a.roomName, /^guruji-[a-z0-9]+$/);
      const names = new Set(Array.from({ length: 200 }, () => newRoomName()));
      assert.equal(names.size, 200, 'no collisions in 200 names');
    });

    test('the window opens ten minutes before and closes thirty minutes after', () => {
      const start = new Date('2026-11-21T10:00:00.000Z');
      const w = sessionWindow({ slotStart: start.toISOString(), slotMinutes: 45 });
      assert.equal(new Date(w.opensAt).getTime(), start.getTime() - OPEN_BEFORE_MIN * 60000);
      assert.equal(new Date(w.closesAt).getTime(), start.getTime() + (45 + CLOSE_AFTER_MIN) * 60000);
    });

    test('an IST slot is stored as the right UTC instant', () => {
      assert.equal(slotStartISO('2026-11-21', '10:45 AM'), '2026-11-21T05:15:00.000Z');
      assert.equal(slotStartISO('2026-11-21', '7:30 PM'), '2026-11-21T14:00:00.000Z');
    });

    // ---- GET /api/bookings/:id/session -------------------------------------

    let live, liveMobile = '9100000011';
    test('409 not_paid before the booking is paid', async () => {
      live = await newBooking(5, liveMobile);
      const r = await call('GET', `/api/bookings/${live.orderId}/session?mobile=${liveMobile}`);
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'not_paid');
    });

    test('401 without a mobile number, 404 with the wrong one', async () => {
      await pay(live.orderId, liveMobile);
      assert.equal((await call('GET', `/api/bookings/${live.orderId}/session`)).status, 401);
      assert.equal((await call('GET', `/api/bookings/${live.orderId}/session?mobile=9999999999`)).status, 404);
    });

    test('404 for a booking that does not exist', async () => {
      const r = await call('GET', '/api/bookings/GURUJI-PLM-NOPE123/session?mobile=9100000011');
      assert.equal(r.status, 404);
    });

    test('200 for the devotee: a guest, never a moderator', async () => {
      const r = await call('GET', `/api/bookings/${live.orderId}/session?mobile=${liveMobile}`);
      assert.equal(r.status, 200);
      assert.equal(r.body.role, 'guest');
      assert.equal(r.body.roomName, live.roomName);
      assert.ok(new Date(r.body.closesAt) > new Date(r.body.opensAt));
    });

    test('200 for Guruji, as moderator, without knowing the mobile number', async () => {
      const r = await call('GET', `/api/bookings/${live.orderId}/session`, null, guruji);
      assert.equal(r.status, 200);
      assert.equal(r.body.role, 'moderator');
    });

    test('the editor PIN is not a way into someone else\'s room', async () => {
      const r = await call('GET', `/api/bookings/${live.orderId}/session`, null, { 'X-Admin-Pin': 'not-a-pin' });
      assert.equal(r.status, 401);
    });

    test('409 too_early before the window, with the time it opens', async () => {
      const later = await newBooking(600, '9100000012');
      await pay(later.orderId, '9100000012');
      const r = await call('GET', `/api/bookings/${later.orderId}/session?mobile=9100000012`);
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'too_early');
      assert.ok(new Date(r.body.opensAt) > new Date());
    });

    test('409 ended after the window has closed', async () => {
      const past = await newBooking(-300, '9100000013');
      await pay(past.orderId, '9100000013');
      const r = await call('GET', `/api/bookings/${past.orderId}/session?mobile=9100000013`);
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'ended');
    });

    test('409 ended once the consultation is complete', async () => {
      const done = await newBooking(5, '9100000014');
      await pay(done.orderId, '9100000014');
      await call('PUT', `/api/guruji/cases/${done.orderId}/report`, { summary: 'Done.' }, guruji);
      await call('POST', `/api/guruji/cases/${done.orderId}/ready`, null, guruji);
      const r = await call('GET', `/api/bookings/${done.orderId}/session?mobile=9100000014`);
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'ended');
    });

    test('with no Jitsi keys set the room is the public service, and says so', async () => {
      const r = await call('GET', `/api/bookings/${live.orderId}/session?mobile=${liveMobile}`);
      assert.equal(r.body.mode, 'public');
      assert.equal(r.body.productionSafe, false);
      assert.ok(!r.body.jwt, 'no token is minted without keys');
    });

    // ---- joined / end ------------------------------------------------------

    test('joining is recorded once, however many times it is posted', async () => {
      const a = await call('POST', `/api/bookings/${live.orderId}/session/joined`, { mobile: liveMobile });
      const b = await call('POST', `/api/bookings/${live.orderId}/session/joined`, { mobile: liveMobile });
      assert.equal(a.status, 200);
      assert.equal(b.status, 200);
      const stored = await store.getBooking(live.orderId);
      assert.ok(stored.devoteeJoinedAt, 'the first join is recorded');
      assert.ok(stored.sessionStartedAt);
      assert.equal(b.body.already, true, 'the second post changes nothing');
    });

    test('only Guruji can end a session', async () => {
      const devotee = await call('POST', `/api/bookings/${live.orderId}/session/end`, { mobile: liveMobile });
      assert.equal(devotee.status, 401, 'the devotee has no staff PIN');
      const editor = await call('POST', `/api/bookings/${live.orderId}/session/end`, null, { 'X-Admin-Pin': 'wrong-pin' });
      assert.equal(editor.status, 401);
      const expert = await call('POST', `/api/bookings/${live.orderId}/session/end`, null, guruji);
      assert.equal(expert.status, 200);
      const after = await call('GET', `/api/bookings/${live.orderId}/session?mobile=${liveMobile}`);
      assert.equal(after.status, 409);
      assert.equal(after.body.code, 'ended');
    });

    // ---- chat --------------------------------------------------------------

    let chatOrder, chatMobile = '9100000021';
    test('chat: the devotee and Guruji can both write, and nobody else can read', async () => {
      const b = await newBooking(5, chatMobile);
      chatOrder = b.orderId;
      await pay(chatOrder, chatMobile);

      assert.equal((await call('POST', `/api/bookings/${chatOrder}/messages`, { mobile: chatMobile, text: '' })).status, 422);
      const sent = await call('POST', `/api/bookings/${chatOrder}/messages`, { mobile: chatMobile, text: 'Namaste Guruji' });
      assert.equal(sent.status, 201);
      assert.equal(sent.body.message.from, 'devotee');

      const replied = await call('POST', `/api/bookings/${chatOrder}/messages`, { text: 'Namaste, I have your details.' }, guruji);
      assert.equal(replied.status, 201);
      assert.equal(replied.body.message.from, 'guruji');

      const mine = await call('GET', `/api/bookings/${chatOrder}/messages?mobile=${chatMobile}`);
      assert.equal(mine.body.messages.length, 2);
      assert.equal(mine.body.you, 'devotee');

      assert.equal((await call('GET', `/api/bookings/${chatOrder}/messages?mobile=9999999999`)).status, 404);
      assert.equal((await call('GET', `/api/bookings/${chatOrder}/messages`)).status, 401);
    });

    test('chat: only newer messages come back when `since` is given', async () => {
      const all = await call('GET', `/api/bookings/${chatOrder}/messages?mobile=${chatMobile}`);
      const last = all.body.messages[all.body.messages.length - 1].at;
      const after = await call('GET', `/api/bookings/${chatOrder}/messages?mobile=${chatMobile}&since=${encodeURIComponent(last)}`);
      assert.equal(after.body.messages.length, 0);
    });

    // ---- Guruji's case area -------------------------------------------------

    test('the case list needs Guruji\'s or the owner\'s PIN', async () => {
      assert.equal((await call('GET', '/api/guruji/cases')).status, 401);
      assert.equal((await call('GET', '/api/guruji/cases', null, { 'X-Admin-Pin': 'wrong' })).status, 401);
      assert.equal((await call('GET', '/api/guruji/cases', null, guruji)).status, 200);
      assert.equal((await call('GET', '/api/guruji/cases', null, owner)).status, 200);
    });

    test('the case list carries unread counts and never shows unpaid bookings', async () => {
      const r = await call('GET', '/api/guruji/cases', null, guruji);
      const ids = r.body.cases.map(c => c.orderId);
      assert.ok(ids.includes(chatOrder));
      const mine = r.body.cases.find(c => c.orderId === chatOrder);
      assert.equal(typeof mine.unread, 'number');
      const unpaid = await newBooking(5, '9100000031');
      const again = await call('GET', '/api/guruji/cases', null, guruji);
      assert.ok(!again.body.cases.some(c => c.orderId === unpaid.orderId), 'a booking that was never paid is not a case');
    });

    test('verify reports which role a PIN has', async () => {
      assert.equal((await call('POST', '/api/admin/verify', null, guruji)).body.role, 'guruji');
      assert.equal((await call('POST', '/api/admin/verify', null, owner)).body.role, 'owner');
    });

    // ---- birth chart --------------------------------------------------------

    test('the chart engine matches a published chart (M. K. Gandhi)', () => {
      const chart = computeChart({ date: '1869-10-02', time: '07:11', lat: 21.6417, lon: 69.6293, tzMinutes: 278, place: 'Porbandar' });
      assert.match(chart.ascendant.sign, /^Tula/);
      assert.match(chart.planets.find(p => p.name === 'Sun').sign, /^Kanya/);
      const moon = chart.planets.find(p => p.name === 'Moon');
      assert.match(moon.sign, /^Karka/);
      assert.equal(moon.nakshatra, 'Ashlesha');
      assert.equal(moon.pada, 4);
      assert.equal(chart.planets.find(p => p.name === 'Jupiter').retrograde, true);
      assert.ok(Math.abs(chart.ayanamsa - 22.0) < 0.5, `ayanamsa ${chart.ayanamsa} for 1869`);
    });

    test('the ayanamsa matches published Lahiri values', () => {
      const chart = computeChart({ date: '2000-01-01', time: '12:00', lat: 17.385, lon: 78.4867, tzMinutes: 330 });
      assert.ok(Math.abs(chart.ayanamsa - 23.8528) < 0.01, `J2000 ayanamsa ${chart.ayanamsa}`);
    });

    test('a chart is cast, stored and shown only to the devotee and Guruji', async () => {
      const b = await newBooking(5, '9100000041');
      await pay(b.orderId, '9100000041');
      assert.equal((await call('GET', `/api/bookings/${b.orderId}/chart?mobile=9100000041`)).status, 404, 'no chart yet');

      const bad = await call('POST', `/api/bookings/${b.orderId}/chart`, { mobile: '9100000041', date: '1990-04-12' }, guruji);
      assert.equal(bad.status, 422, 'a chart needs a place as well as a date');

      const made = await call('POST', `/api/bookings/${b.orderId}/chart`,
        { date: '1990-04-12', time: '06:20', lat: 17.385, lon: 78.4867, tzMinutes: 330, place: 'Hyderabad' }, guruji);
      assert.equal(made.status, 200);
      assert.equal(made.body.chart.planets.length, 9);
      assert.equal(made.body.chart.houses.length, 12);
      assert.ok(made.body.chart.dashas.length >= 9);

      const seen = await call('GET', `/api/bookings/${b.orderId}/chart?mobile=9100000041`);
      assert.equal(seen.status, 200);
      assert.equal(seen.body.chart.ascendant.sign, made.body.chart.ascendant.sign);
      assert.equal((await call('GET', `/api/bookings/${b.orderId}/chart?mobile=9999999999`)).status, 404);
    });

    // ---- the written reading (PDF) -----------------------------------------

    let reportOrder, reportMobile = '9100000051';
    test('the PDF is refused until Guruji marks the reading ready', async () => {
      const b = await newBooking(5, reportMobile);
      reportOrder = b.orderId;
      await pay(reportOrder, reportMobile);
      const early = await call('GET', `/api/bookings/${reportOrder}/report.pdf?mobile=${reportMobile}`);
      assert.equal(early.status, 409);
    });

    test('Guruji writes the reading, and only then can it be downloaded', async () => {
      const saved = await call('PUT', `/api/guruji/cases/${reportOrder}/report`, {
        summary: 'A steady hand with a clear head line.', palm: 'The head line runs clear across the palm.',
        correlation: 'Mercury is strong in the chart.', remedies: 'Chant the Mercury mantra on Wednesdays.'
      }, guruji);
      assert.equal(saved.status, 200);
      assert.equal(saved.body.report.status, 'draft');
      const early = await call('GET', `/api/bookings/${reportOrder}/report.pdf?mobile=${reportMobile}`);
      assert.equal(early.status, 409, 'a draft is not downloadable');
      const ready = await call('POST', `/api/guruji/cases/${reportOrder}/ready`, null, guruji);
      assert.equal(ready.status, 200);

      const pdf = await call('GET', `/api/bookings/${reportOrder}/report.pdf?mobile=${reportMobile}`);
      assert.equal(pdf.status, 200);
      assert.equal(pdf.headers.get('content-type'), 'application/pdf');
      assert.ok(pdf.buffer.length > 1000, `pdf is ${pdf.buffer.length} bytes`);
      assert.equal(pdf.buffer.slice(0, 5).toString(), '%PDF-');

      assert.equal((await call('GET', `/api/bookings/${reportOrder}/report.pdf?mobile=9999999999`)).status, 404);
      assert.equal((await call('GET', `/api/bookings/${reportOrder}/report.pdf`)).status, 401);
    });

    // ---- self-paced courses -------------------------------------------------

    let enrol, studentMobile = '9100000061';
    test('a course with no lessons has no outline', async () => {
      assert.equal((await call('GET', '/api/courses/advanced-palmistry/outline')).status, 404);
    });

    test('the outline is public but carries no lesson text', async () => {
      const r = await call('GET', '/api/courses/introduction-to-palmistry/outline');
      assert.equal(r.status, 200);
      assert.equal(r.body.outline.lessonCount, r.body.outline.lessons.length);
      assert.ok(r.body.outline.lessons.every(l => !('body' in l)), 'no lesson text before enrolling');
    });

    test('enrolling in a free course opens it at once', async () => {
      const r = await call('POST', '/api/bookings', {
        type: 'course', courseSlug: 'introduction-to-palmistry',
        devotee: { name: 'Student One', mobile: studentMobile, email: 's1@example.com' }
      });
      assert.equal(r.status, 201);
      enrol = r.body.booking;
      assert.match(enrol.orderId, /^GURUJI-CRS-/);
      assert.equal(enrol.amount, 0);
      assert.equal(enrol.status, 'PAID');
      assert.equal(enrol.payment.status, 'FREE');
    });

    test('a course that is not open for self-paced study cannot be enrolled in', async () => {
      const r = await call('POST', '/api/bookings', {
        type: 'course', courseSlug: 'reiki-level-1',
        devotee: { name: 'Student Two', mobile: '9100000062', email: 's2@example.com' }
      });
      assert.equal(r.status, 422);
    });

    test('lessons open for the student, and for nobody else', async () => {
      const r = await call('GET', `/api/bookings/${enrol.orderId}/course?mobile=${studentMobile}`);
      assert.equal(r.status, 200);
      assert.ok(r.body.lessons[0].body.length > 0, 'the lesson text is there once enrolled');
      assert.equal(r.body.progress.done, 0);
      assert.equal((await call('GET', `/api/bookings/${enrol.orderId}/course?mobile=9999999999`)).status, 404);
      assert.equal((await call('GET', `/api/bookings/${enrol.orderId}/course`)).status, 401);
    });

    test('progress is kept, is idempotent, and can be undone', async () => {
      const first = await call('POST', `/api/bookings/${enrol.orderId}/course/progress`, { mobile: studentMobile, lessonId: 'l1', done: true });
      assert.equal(first.status, 200);
      assert.equal(first.body.progress.done, 1);
      const again = await call('POST', `/api/bookings/${enrol.orderId}/course/progress`, { mobile: studentMobile, lessonId: 'l1', done: true });
      assert.equal(again.body.progress.done, 1, 'marking twice does not count twice');
      const undone = await call('POST', `/api/bookings/${enrol.orderId}/course/progress`, { mobile: studentMobile, lessonId: 'l1', done: false });
      assert.equal(undone.body.progress.done, 0);
      assert.equal((await call('POST', `/api/bookings/${enrol.orderId}/course/progress`, { mobile: studentMobile, lessonId: 'nope', done: true })).status, 422);
    });

    test('finishing every lesson completes the enrolment', async () => {
      const outline = (await call('GET', '/api/courses/introduction-to-palmistry/outline')).body.outline;
      let last;
      for (const l of outline.lessons) {
        last = await call('POST', `/api/bookings/${enrol.orderId}/course/progress`, { mobile: studentMobile, lessonId: l.id, done: true });
      }
      assert.equal(last.body.progress.percent, 100);
      const booking = await call('GET', `/api/bookings/${enrol.orderId}?mobile=${studentMobile}`);
      assert.equal(booking.body.booking.status, 'COMPLETED');
    });

    test('the lesson text is not downloadable as a file', async () => {
      // course-lessons.js sits in the repo root; the static server must refuse it,
      // or the paid lessons are free to anyone who guesses the name.
      const res = await fetch(base + '/course-lessons.js');
      assert.equal(res.status, 404);
    });

    test('a consultation booking is not a course', async () => {
      const r = await call('GET', `/api/bookings/${chatOrder}/course?mobile=${chatMobile}`);
      assert.equal(r.status, 404);
    });
  });
}
