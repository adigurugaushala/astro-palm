// API tests — run with: npm test
// Runs every scenario twice: against the MongoDB code path (with an in-memory
// driver stand-in) and against the JSON-file fallback.
'use strict';
process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Isolate every file the server writes
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guruji-test-'));
fs.copyFileSync(path.join(__dirname, '..', 'data', 'mantras.json'), path.join(tmp, 'mantras.json'));
process.env.GURUJI_DATA_DIR = tmp;
process.env.GURUJI_SEED_FILE = path.join(tmp, 'mantras-data.js');
process.env.ADMIN_PIN = 'test-pin-4321';
process.env.RATE_LIMIT_MULTIPLIER = '100';
process.env.MONGODB_URI = '';
process.env.CASHFREE_APP_ID = '';
process.env.CASHFREE_SECRET_KEY = '';
process.env.PAYMENT_MODE = 'simulated';
process.env.SITE_URL = '';

const { createServer } = require('../server');
const { createStore } = require('../db');
const { FakeMongoClient } = require('./fake-mongo');

const SEED = JSON.parse(fs.readFileSync(path.join(tmp, 'mantras.json'), 'utf8'));

for (const backend of ['mongodb', 'file']) {
  describe(`API with ${backend} storage`, () => {
    let server, base, store;
    const call = async (method, url, body, headers = {}) => {
      const res = await fetch(base + url, {
        method,
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    };
    const admin = { 'X-Admin-Pin': 'test-pin-4321' };

    before(async () => {
      if (backend === 'file') {
        for (const f of ['bookings.json', 'reviews.json']) fs.rmSync(path.join(tmp, f), { force: true });
      }
      store = backend === 'mongodb'
        ? await createStore({ client: new FakeMongoClient(), dbName: 'guruji_test' })
        : await createStore({ uri: '' });
      assert.equal(store.mode, backend);
      server = createServer(store);
      await new Promise(r => server.listen(0, '127.0.0.1', r));
      base = `http://127.0.0.1:${server.address().port}`;
    });
    after(async () => { server.close(); await store.close(); });

    test('health reports the storage mode', async () => {
      const r = await call('GET', '/api/health');
      assert.equal(r.status, 200);
      assert.equal(r.body.storage, backend);
    });

    test('mantra library is available (seeded into MongoDB on first run)', async () => {
      const r = await call('GET', '/api/mantras');
      assert.equal(r.status, 200);
      assert.equal(r.body.mantras.length, SEED.mantras.length);
      assert.equal(r.body.categories.length, SEED.categories.length);
      assert.ok(r.body.mantras.every(m => !('_id' in m)), 'no Mongo _id leaks to the browser');
    });

    test('mantra writes need the admin PIN', async () => {
      assert.equal((await call('POST', '/api/mantras', { title: 'X' })).status, 401);
      assert.equal((await call('POST', '/api/mantras', { title: 'X' }, { 'X-Admin-Pin': '1008' })).status, 401);
      assert.equal((await call('POST', '/api/admin/verify', null, admin)).status, 200);
    });

    test('admin can add, edit and delete a mantra', async () => {
      const created = await call('POST', '/api/mantras', { title: 'Test Shanti Mantra', sanskrit_text: 'ॐ शान्तिः' }, admin);
      assert.equal(created.status, 201);
      const id = created.body.mantra.id;

      const list = await call('GET', '/api/mantras');
      assert.equal(list.body.mantras[0].id, id, 'newest mantra is listed first');
      assert.equal(list.body.mantras.length, SEED.mantras.length + 1);

      const updated = await call('PUT', `/api/mantras/${id}`, { title: 'Renamed', _id: 'hack' }, admin);
      assert.equal(updated.status, 200);
      assert.equal(updated.body.mantra.title, 'Renamed');
      assert.equal(updated.body.mantra.id, id);

      assert.equal((await call('DELETE', `/api/mantras/${id}`, null, admin)).status, 200);
      assert.equal((await call('DELETE', `/api/mantras/${id}`, null, admin)).status, 404);
      assert.ok(fs.readFileSync(process.env.GURUJI_SEED_FILE, 'utf8').includes('GURUJI_MANTRAS_SEED'), 'offline seed file refreshed');
    });

    let consult;
    test('consultation booking: validates input and sets the price on the server', async () => {
      const bad = await call('POST', '/api/bookings', { type: 'consultation', serviceId: 'combined_consultation', devotee: { name: 'Ravi', mobile: '12345', email: 'r@x.com' } });
      assert.equal(bad.status, 422);
      const badSvc = await call('POST', '/api/bookings', { type: 'consultation', serviceId: 'free_reading', devotee: { name: 'Ravi', mobile: '9123456789', email: 'r@x.com' } });
      assert.equal(badSvc.status, 422);

      const r = await call('POST', '/api/bookings', {
        type: 'consultation', serviceId: 'combined_consultation', amount: 1, handedness: 'Right-handed',
        slot: { date: 'Today, 20 Nov 2026', time: '10:45 AM' },
        devotee: { name: 'Ravi Kumar', mobile: '+91 91234 56789', email: 'Ravi@Example.com' }
      });
      assert.equal(r.status, 201);
      consult = r.body.booking;
      assert.match(consult.orderId, /^GURUJI-PLM-[A-Z0-9]+$/);
      assert.equal(consult.amount, 10, 'amount sent by the browser is ignored');
      assert.equal(consult.status, 'PENDING_PAYMENT');
      assert.equal(consult.devotee.mobile, '9123456789');
      assert.equal(consult.devotee.email, 'ravi@example.com');
      assert.ok(!('history' in consult));
    });

    test('a booking is only visible with the matching mobile number', async () => {
      assert.equal((await call('GET', `/api/bookings/${consult.orderId}`)).status, 404);
      assert.equal((await call('GET', `/api/bookings/${consult.orderId}?mobile=9999999999`)).status, 404);
      const r = await call('GET', `/api/bookings/${consult.orderId}?mobile=9123456789`);
      assert.equal(r.status, 200);
      assert.equal(r.body.booking.service.title, 'Astro-Palmistry Correlation');
    });

    test('booking lifecycle: payment then birth details and photos', async () => {
      const early = await call('PATCH', `/api/bookings/${consult.orderId}`, { event: 'details_submitted', mobile: '9123456789', details: {} });
      assert.equal(early.status, 409, 'details only after payment');

      const wrongMobile = await call('PATCH', `/api/bookings/${consult.orderId}`, { event: 'payment_success', mobile: '9000000000' });
      assert.equal(wrongMobile.status, 404);

      const paid = await call('PATCH', `/api/bookings/${consult.orderId}`, { event: 'payment_success', mobile: '9123456789' });
      assert.equal(paid.status, 200);
      assert.equal(paid.body.booking.status, 'PAID');
      assert.equal(paid.body.booking.payment.status, 'SUCCESS');

      // Photos carry real bytes now, uploaded one at a time before the details
      // are submitted. A 1x1 PNG is enough to prove the round trip.
      const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      for (const [slot, name] of [[1, 'both.png'], [2, 'left.png']]) {
        const up = await call('POST', `/api/bookings/${consult.orderId}/photos`,
          { mobile: '9123456789', slot, name, type: 'image/png', data: PNG });
        assert.equal(up.status, 201, 'a seeker can upload a palm photo');
        assert.ok(up.body.photo.id.startsWith('palm-'));
      }

      const details = await call('PATCH', `/api/bookings/${consult.orderId}`, {
        event: 'details_submitted', mobile: '9123456789',
        details: { name: 'Ravi Kumar', dob: '1992-01-15', tob: '06:45', pob: 'Hyderabad', questions: 'Career' }
      });
      assert.equal(details.status, 200);
      const b = details.body.booking;
      assert.equal(b.status, 'DETAILS_RECEIVED');
      assert.equal(b.devotee.dob, '1992-01-15');
      assert.equal(b.devotee.pob, 'Hyderabad');
      assert.equal(b.devotee.mobile, '9123456789', 'existing devotee fields are kept');
      assert.equal(b.photos.length, 2, 'submitting the details does not wipe the uploaded photos');

      // The bytes come back to the seeker, and only to people entitled to them.
      const shot = b.photos[0];
      const mine = await call('GET', `/api/bookings/${consult.orderId}/photos/${shot.id}?mobile=9123456789`);
      assert.equal(mine.status, 401, 'a GET carries no body, so an unidentified reader is refused');
      const asStaff = await call('GET', `/api/bookings/${consult.orderId}/photos/${shot.id}`, null, admin);
      assert.equal(asStaff.status, 200, 'Guruji can open the photo');
      // The public image route must never serve it.
      assert.equal((await call('GET', `/api/media/${shot.id}`)).status, 404,
        'a palm photo is not reachable by guessing an id');

      assert.equal((await call('PATCH', `/api/bookings/${consult.orderId}`, { event: 'hack', mobile: '9123456789' })).status, 422);
    });

    const dayIST = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const lakshmi = { name: 'Lakshmi Rao', mobile: '98765 43210', gotram: 'Kasyapa Gotram' };
    const home = { line1: '12-3-45, Temple Street', line2: 'Near Rama Mandir', city: 'Hyderabad', state: 'Telangana', pincode: '500001' };

    test('pooja booking totals the selected sevas on the server', async () => {
      const base = { type: 'pooja', poojaDate: dayIST(3), poojaSlot: 'morning', devotee: lakshmi, prasadam: { deliver: false } };
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaIds: ['made_up'] })).status, 422);
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaIds: [] })).status, 422);
      const r = await call('POST', '/api/bookings', { ...base, poojaIds: ['navagraha_shanti', 'shani_shanti', 'shani_shanti'] });
      assert.equal(r.status, 201);
      assert.match(r.body.booking.orderId, /^GURUJI-PJA-/);
      assert.equal(r.body.booking.amount, 7200);
      assert.equal(r.body.booking.poojas.length, 2, 'duplicates removed');
      assert.equal(r.body.booking.poojaSlot.label, '8:00 – 10:00 AM');
      assert.equal(r.body.booking.devotee.dob, '', 'date of birth is optional');
    });

    test('pooja date must be from tomorrow and within 90 days; slot must exist', async () => {
      const base = { type: 'pooja', poojaIds: ['ganapathi_homam'], poojaSlot: 'morning', devotee: lakshmi };
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaDate: dayIST(0) })).status, 422, 'today is too late');
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaDate: dayIST(-2) })).status, 422);
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaDate: dayIST(120) })).status, 422);
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaDate: 'soon' })).status, 422);
      assert.equal((await call('POST', '/api/bookings', { ...base, poojaDate: dayIST(5), poojaSlot: 'midnight' })).status, 422);
      assert.equal((await call('GET', `/api/pooja-slots?date=${dayIST(0)}`)).status, 422);
    });

    test('prasadam delivery needs a complete address', async () => {
      const base = { type: 'pooja', poojaIds: ['ganapathi_homam'], poojaDate: dayIST(6), poojaSlot: 'sandhya', devotee: lakshmi };
      assert.equal((await call('POST', '/api/bookings', { ...base, prasadam: { deliver: true, address: { ...home, pincode: '12345' } } })).status, 422);
      assert.equal((await call('POST', '/api/bookings', { ...base, prasadam: { deliver: true, address: { ...home, line1: '' } } })).status, 422);
      assert.equal((await call('POST', '/api/bookings', { ...base, prasadam: { deliver: true, address: { ...home, city: '' } } })).status, 422);
      const ok = await call('POST', '/api/bookings', { ...base, prasadam: { deliver: true, address: home } });
      assert.equal(ok.status, 201);
      assert.equal(ok.body.booking.prasadam.address.pincode, '500001');
      assert.equal(ok.body.booking.prasadam.address.city, 'Hyderabad');
    });

    test('a pooja slot closes when it is full (paid and recently started bookings count)', async () => {
      const date = dayIST(10);
      const before = await call('GET', `/api/pooja-slots?date=${date}`);
      assert.equal(before.status, 200);
      assert.equal(before.body.slots.length, 4);
      const pratah = before.body.slots.find(x => x.id === 'pratah');
      assert.equal(pratah.remaining, 3);

      const book = (mobile) => call('POST', '/api/bookings', { type: 'pooja', poojaIds: ['ganapathi_homam'], poojaDate: date, poojaSlot: 'pratah', devotee: { name: 'Devotee', mobile } });
      const first = await book('9000000001');
      await call('PATCH', `/api/bookings/${first.body.booking.orderId}`, { event: 'payment_success', mobile: '9000000001' });
      await book('9000000002');                        // unpaid, but just started: still holds the slot
      const third = await book('9000000003');
      await call('PATCH', `/api/bookings/${third.body.booking.orderId}`, { event: 'payment_failed', mobile: '9000000003' });  // failed: frees it
      assert.equal((await book('9000000004')).status, 201);

      const after = await call('GET', `/api/pooja-slots?date=${date}`);
      const p2 = after.body.slots.find(x => x.id === 'pratah');
      assert.equal(p2.remaining, 0);
      assert.equal(p2.available, false);
      assert.equal(after.body.slots.find(x => x.id === 'morning').remaining, 3, 'other slots unaffected');

      const full = await book('9000000005');
      assert.equal(full.status, 409);
      assert.match(full.body.error, /filled up/);
    });

    test('reviews: validated, saved, and verified only for a paid booking', async () => {
      assert.equal((await call('POST', '/api/reviews', { rating: 5, comment: 'short' })).status, 422);
      assert.equal((await call('POST', '/api/reviews', { rating: 9, comment: 'Long enough comment here' })).status, 422);

      const anon = await call('POST', '/api/reviews', { name: 'Anon', rating: 4, comment: 'Lovely and calm guidance.' });
      assert.equal(anon.status, 201);
      assert.equal(anon.body.review.verified, false);

      const real = await call('POST', '/api/reviews', { name: 'Ravi Kumar', rating: 5, comment: 'Very clear and kind guidance.', orderId: consult.orderId, mobile: '9123456789' });
      assert.equal(real.body.review.verified, true);

      const list = await call('GET', '/api/reviews');
      assert.equal(list.body.reviews[0].name, 'Ravi Kumar', 'newest first');
      assert.equal(list.body.reviews.length, 2);
    });

    test('the owner can hide, reply to and delete a review', async () => {
      const posted = await call('POST', '/api/reviews', { name: 'Meena', rating: 5, comment: 'A calm and careful reading.' });
      const id = posted.body.review.id;

      assert.equal((await call('GET', '/api/admin/reviews')).status, 401, 'staff only');
      const all = await call('GET', '/api/admin/reviews', null, admin);
      assert.equal(all.status, 200);
      assert.ok(all.body.reviews.some(r => r.id === id));

      // Hiding takes it off the public list but keeps it in the dashboard
      assert.equal((await call('PATCH', `/api/admin/reviews/${id}`, { hidden: true }, admin)).status, 200);
      const publicList = await call('GET', '/api/reviews');
      assert.ok(!publicList.body.reviews.some(r => r.id === id), 'hidden reviews leave the site');
      const stillThere = await call('GET', '/api/admin/reviews', null, admin);
      assert.ok(stillThere.body.reviews.some(r => r.id === id), 'the owner can still see it');

      // A reply shows under the review once it is back up
      await call('PATCH', `/api/admin/reviews/${id}`, { hidden: false, reply: 'Thank you, Meena.' }, admin);
      const back = await call('GET', '/api/reviews');
      const shown = back.body.reviews.find(r => r.id === id);
      assert.equal(shown.reply, 'Thank you, Meena.');

      assert.equal((await call('DELETE', `/api/admin/reviews/${id}`, null, admin)).status, 200);
      assert.equal((await call('DELETE', `/api/admin/reviews/${id}`, null, admin)).status, 404);
    });

    test('the overview counts the work waiting and never leaks to a visitor', async () => {
      assert.equal((await call('GET', '/api/admin/overview')).status, 401);
      const res = await call('GET', '/api/admin/overview', null, admin);
      assert.equal(res.status, 200);
      const o = res.body;
      assert.equal(o.daily.length, 14, 'two weeks of daily figures');
      assert.ok(o.bookings.total >= 1);
      assert.equal(typeof o.revenue.month, 'number');
      assert.ok(Array.isArray(o.upcoming));
      assert.ok(Array.isArray(o.topServices));
      assert.ok(Array.isArray(o.system.missing));
      assert.equal(o.bookings.total, Object.values(o.bookings.byStatus).reduce((t, n) => t + n, 0));
    });

    test('the sign-in check reports each link in the chain', async () => {
      assert.equal((await call('GET', '/api/admin/sign-in-check')).status, 401, 'staff only');
      const res = await call('GET', '/api/admin/sign-in-check', null, admin);
      assert.equal(res.status, 200);
      const names = res.body.checks.map(c => c.name);
      assert.ok(names.includes('Staff addresses configured'));
      assert.ok(names.includes('Name lookup for googleapis.com'));
      assert.ok(names.includes('Google certificates reachable'));
      assert.ok(Array.isArray(res.body.proxyEnv), 'proxy variables are reported');
      assert.ok(names.includes('Firebase project'));
      assert.equal(res.body.firebaseProjectId, 'palm-56063');

      // No staff address is set in these tests, so that check must fail and say how to fix it
      const emails = res.body.checks.find(c => c.name === 'Staff addresses configured');
      assert.equal(emails.ok, false);
      assert.match(emails.fix, /ADMIN_EMAILS/);
      assert.equal(res.body.ok, false);

      // Addresses are never returned in full
      assert.ok(!JSON.stringify(res.body).includes('@gmail.com'));
    });

    test('the staff notification bell has a count to show, and only for staff', async () => {
      assert.equal((await call('GET', '/api/staff/unread')).status, 401, 'staff only');
      const res = await call('GET', '/api/staff/unread', null, admin);
      assert.equal(res.status, 200);
      assert.equal(typeof res.body.unread, 'number');
      assert.ok(res.body.unread >= 0);
      assert.equal(typeof res.body.byBooking, 'object');
      // threads and byBooking describe the same set, so they cannot disagree
      assert.equal(res.body.threads, Object.keys(res.body.byBooking).length);
      const summed = Object.values(res.body.byBooking).reduce((t, n) => t + n, 0);
      assert.equal(res.body.unread, summed, 'the total is the sum of the threads');
    });

    test('a seeker cannot read an unread count without identifying themselves', async () => {
      const res = await call('GET', '/api/customer/unread');
      assert.equal(res.status, 401);
    });


    test('bookings and enquiries download as CSV', async () => {
      const res = await fetch(base + '/api/admin/bookings/export', { headers: admin });
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /text\/csv/);
      const text = await res.text();
      assert.match(text.split('\n')[0], /^Reference,Created,Type,Status/);
      assert.ok(text.split('\n').length > 1, 'at least one row');

      const enq = await fetch(base + '/api/admin/enquiries/export', { headers: admin });
      assert.equal(enq.status, 200);
      assert.equal((await fetch(base + '/api/admin/bookings/export')).status, 401);
    });

    test('the dashboard can compare the saved content with the code', async () => {
      // A section saved from the dashboard overrides the code from then on, so
      // the owner needs to see what the saved copy is holding back before
      // restoring anything. The API hands over both versions and the save time.
      const before = await call('GET', '/api/admin/content', null, admin);
      assert.equal(before.status, 200);
      assert.ok(before.body.defaults, 'the code version comes back for comparison');

      const saved = await call('PUT', '/api/admin/content/pillars',
        { value: [{ title: 'Guidance', text: 'Edited here', icon: 'fa-hand', link: '/services' }] }, admin);
      assert.equal(saved.status, 200);

      const after = await call('GET', '/api/admin/content', null, admin);
      assert.ok(after.body.edited.includes('pillars'));
      assert.equal(after.body.content.pillars.length, 1, 'the site now shows the saved copy');
      assert.equal(after.body.defaults.pillars.length, 4, 'the code still has four');
      assert.ok(after.body.savedAt.pillars.updatedAt, 'and when it was saved');

      const reset = await call('DELETE', '/api/admin/content/pillars', null, admin);
      assert.equal(reset.status, 200);
      assert.equal(reset.body.value.length, 4, 'restoring hands back the code version');
      const restored = await call('GET', '/api/admin/content', null, admin);
      assert.ok(!restored.body.edited.includes('pillars'));
    });

    test('site content is served, and the admin can edit and reset a section', async () => {
      const pub = await call('GET', '/api/content');
      assert.equal(pub.status, 200);
      const core = pub.body.content.services.filter(x => x.core);
      assert.equal(core.length, 4, 'four core consultations');
      assert.ok(pub.body.content.services.every(x => x.published !== false), 'drafts are not public');

      assert.equal((await call('GET', '/api/admin/content')).status, 401);
      const all = await call('GET', '/api/admin/content', null, admin);
      assert.equal(all.status, 200);

      const edited = JSON.parse(JSON.stringify(all.body.content.services));
      edited[0] = { ...edited[0], title: 'Detailed Palm Analysis (updated)', price: 599 };
      edited.push({ ...edited[0], slug: 'draft-service', title: 'Draft', published: false });
      assert.equal((await call('PUT', '/api/admin/content/services', { value: edited })).status, 401);
      assert.equal((await call('PUT', '/api/admin/content/services', { value: edited }, admin)).status, 200);

      const after = await call('GET', '/api/content');
      assert.equal(after.body.content.services[0].title, 'Detailed Palm Analysis (updated)');
      assert.ok(!after.body.content.services.some(x => x.slug === 'draft-service'), 'unpublished items stay hidden');

      // the edited price is what the booking is charged
      const b = await call('POST', '/api/bookings', {
        type: 'consultation', serviceId: 'palmistry_reading',
        devotee: { name: 'Price Check', mobile: '9123456780', email: 'p@example.com' }
      });
      assert.equal(b.status, 201, JSON.stringify(b.body));
      assert.equal(b.body.booking.amount, 599);

      // bad edits are refused
      assert.equal((await call('PUT', '/api/admin/content/services', { value: [{ title: 'No slug' }] }, admin)).status, 422);
      assert.equal((await call('PUT', '/api/admin/content/services', { value: {} }, admin)).status, 422);
      assert.equal((await call('PUT', '/api/admin/content/nonsense', { value: [] }, admin)).status, 404);

      assert.equal((await call('DELETE', '/api/admin/content/services', null, admin)).status, 200);
      assert.equal((await call('GET', '/api/content')).body.content.services[0].title, 'Detailed Palm Analysis');
    });

    test('enquiries are validated, stored and visible to the admin', async () => {
      assert.equal((await call('POST', '/api/enquiries', { name: 'A', phone: '9123456789', message: 'Hello there' })).status, 422, 'name too short');
      assert.equal((await call('POST', '/api/enquiries', { name: 'Asha Rao', phone: '12345', message: 'Hello there' })).status, 422, 'bad mobile');
      assert.equal((await call('POST', '/api/enquiries', { name: 'Asha Rao', phone: '9123456789', message: 'Hi' })).status, 422, 'message too short');
      assert.equal((await call('POST', '/api/enquiries', { kind: 'booking', name: 'Asha Rao', phone: '9123456789' })).status, 422, 'service required');
      assert.equal((await call('POST', '/api/enquiries', { name: 'Asha Rao', phone: '9123456789', message: 'Hello there', website: 'spam' })).status, 422, 'honeypot');
      assert.equal((await call('POST', '/api/enquiries', { kind: 'booking', name: 'Asha Rao', phone: '9123456789', service: 'muhurta-marriage', preferredDate: '2000-01-01' })).status, 422, 'past date');

      const created = await call('POST', '/api/enquiries', {
        kind: 'booking', name: 'Asha Rao', phone: '+91 91234 56789', email: 'Asha@Example.com',
        service: 'marriage-muhurta', mode: 'online', message: 'Please suggest a date.'
      });
      assert.equal(created.status, 201);
      const ref = created.body.enquiry.reference;
      assert.match(ref, /^GPE-[A-Z0-9]+$/);
      assert.equal(created.body.enquiry.service.title, 'Marriage Muhurta');
      assert.equal(created.body.enquiry.contact.email, 'asha@example.com');

      assert.equal((await call('GET', `/api/enquiries/${ref}?mobile=9000000000`)).status, 404, 'needs the right mobile');
      const mine = await call('GET', `/api/enquiries/${ref}?mobile=9123456789`);
      assert.equal(mine.status, 200);
      assert.equal(mine.body.enquiry.status, 'NEW');

      assert.equal((await call('GET', '/api/admin/enquiries')).status, 401);
      const list = await call('GET', '/api/admin/enquiries?q=asha', null, admin);
      assert.equal(list.body.enquiries.length, 1);
      assert.equal((await call('PATCH', `/api/admin/enquiries/${ref}`, { status: 'NOPE' }, admin)).status, 422);
      const upd = await call('PATCH', `/api/admin/enquiries/${ref}`, { status: 'CONTACTED', note: 'Called back' }, admin);
      assert.equal(upd.body.enquiry.status, 'CONTACTED');
      assert.equal((await call('GET', `/api/enquiries/${ref}?mobile=9123456789`)).body.enquiry.adminNote, undefined, 'internal notes stay internal');
    });

    test('the admin can list bookings and change their status', async () => {
      const b = await call('POST', '/api/bookings', {
        type: 'consultation', serviceId: 'palmistry_reading',
        devotee: { name: 'Status Test', mobile: '9123456781', email: 's@example.com' }
      });
      const id = b.body.booking.orderId;
      assert.equal((await call('GET', '/api/admin/bookings')).status, 401);
      const list = await call('GET', '/api/admin/bookings?q=Status%20Test', null, admin);
      assert.equal(list.body.bookings.length, 1);
      assert.equal((await call('PATCH', `/api/admin/bookings/${id}`, { status: 'SCHEDULED', note: 'Call at 6' }, admin)).body.booking.status, 'SCHEDULED');
      assert.equal((await call('PATCH', `/api/admin/bookings/${id}`, { status: 'WRONG' }, admin)).status, 422);
      const pub = await call('GET', `/api/bookings/${id}?mobile=9123456781`);
      assert.equal(pub.body.booking.adminNote, undefined, 'internal notes stay internal');
    });

    test('admin images are stored, served and deleted', async () => {
      const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
      assert.equal((await call('POST', '/api/admin/media', { name: 'x.png', type: 'image/png', data: png })).status, 401);
      assert.equal((await call('POST', '/api/admin/media', { name: 'x.txt', type: 'text/plain', data: png }, admin)).status, 422);
      const up = await call('POST', '/api/admin/media', { name: 'x.png', type: 'image/png', data: 'data:image/png;base64,' + png }, admin);
      assert.equal(up.status, 201);
      const res = await fetch(base + up.body.media.url);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'image/png');
      assert.equal((await call('GET', '/api/admin/media', null, admin)).body.media.length, 1);
      assert.equal((await call('DELETE', `/api/admin/media/${up.body.media.id}`, null, admin)).status, 200);
      assert.equal((await fetch(base + up.body.media.url)).status, 404);
    });

    test('robots.txt and sitemap.xml list the live pages', async () => {
      const robots = await fetch(base + '/robots.txt');
      assert.equal(robots.status, 200);
      const txt = await robots.text();
      assert.match(txt, /Disallow: \/admin/);
      assert.match(txt, /Sitemap: http:\/\/127\.0\.0\.1:\d+\/sitemap\.xml/);

      const sm = await fetch(base + '/sitemap.xml');
      assert.equal(sm.status, 200);
      assert.match(sm.headers.get('content-type'), /xml/);
      const xml = await sm.text();
      for (const p of ['/about', '/services/astro-palmistry-correlation', '/reiki-healing', '/courses/reiki-level-1', '/resources/what-is-sankalpa', '/faqs']) {
        assert.ok(xml.includes(`<loc>${base}${p}</loc>`), `sitemap lists ${p}`);
      }
      assert.ok(!xml.includes('/admin'), 'the admin page is not in the sitemap');
    });

    test('consent is recorded at sign-up when given, and with the booking on the payment page', async () => {
      // 1. Sign-up no longer needs the agreement: it is asked before payment.
      const noConsent = await call('POST', '/api/customer/register', {
        name: 'Ravi Signup', email: 'ravi.signup@example.com', password: 'password123'
      });
      assert.equal(noConsent.status, 200);
      assert.equal(noConsent.body.consentId, undefined);

      // 2. The payment page sends it with the booking, which records it and
      //    gives the account the mobile it signed up without.
      const auth = { Authorization: 'Bearer ' + noConsent.body.token };
      const booked = await call('POST', '/api/bookings', {
        type: 'consultation', serviceId: 'combined_consultation',
        slot: { date: 'Mon, 1 Jun', time: '10:00 AM' },
        devotee: { name: 'Ravi Signup', mobile: '9811122233', email: 'ravi.signup@example.com' },
        consent: true
      }, auth);
      assert.equal(booked.status, 201);
      assert.ok(booked.body.booking.consent === undefined || booked.body.booking.consent.at, 'consent stamp');
      const stored = await store.getBooking(booked.body.booking.orderId);
      assert.ok(stored.consent && stored.consent.id, 'the booking keeps the consent record id');
      const me = await call('GET', '/api/customer/me', null, auth);
      assert.equal(me.body.customer.mobile, '9811122233', 'the account picked up the mobile');
      const ravi = await call('GET', '/api/admin/consents?q=Ravi', null, admin);
      assert.ok(ravi.body.consents.some(c => c.consentSource === 'booking_payment' && c.mobile === '9811122233'));

      // 3. Valid consent: true succeeds with 200 and issues token & consentId
      const valid = await call('POST', '/api/customer/register', {
        name: 'Suresh Sharma',
        mobile: '9876543210',
        email: 'suresh@example.com',
        password: 'password123',
        consent: true,
        disclaimerAccepted: true,
        termsAccepted: true,
        privacyAccepted: true,
        serviceAcknowledgement: true,
        serviceType: 'consultation',
        consentSource: 'portal_signup'
      });
      assert.equal(valid.status, 200);
      assert.ok(valid.body.token);
      assert.ok(valid.body.consentId);
      assert.equal(valid.body.customer.name, 'Suresh Sharma');

      // 4. Admin can list consent records
      const adminConsents = await call('GET', '/api/admin/consents?q=Suresh', null, admin);
      assert.equal(adminConsents.status, 200);
      assert.ok(adminConsents.body.consents.length >= 1);
      const record = adminConsents.body.consents.find(c => c.email === 'suresh@example.com');
      assert.ok(record);
      assert.equal(record.disclaimerAccepted, true);
      assert.equal(record.termsAccepted, true);
      assert.equal(record.privacyAccepted, true);
      assert.equal(record.documentVersions.disclaimer, '1.0');

      // 5. Admin can export CSV of consents
      const csvRes = await fetch(base + '/api/admin/consents/export', { headers: admin });
      assert.equal(csvRes.status, 200);
      assert.match(csvRes.headers.get('content-type'), /text\/csv/);
      const csvText = await csvRes.text();
      assert.ok(csvText.includes('Suresh Sharma'));
      assert.ok(csvText.includes('suresh@example.com'));
      assert.ok(csvText.includes('ID,Timestamp,Customer ID,Name,Email,Mobile'));
    });

    test('unknown routes and methods', async () => {
      assert.equal((await call('GET', '/api/nope')).status, 404);
      assert.equal((await call('DELETE', '/api/reviews')).status, 405);
      for (const f of ['/db.js', '/server.js', '/payments.js', '/session.js', '/chart.js', '/report.js',
                       '/course-lessons.js', '/.env', '/.env.example', '/package.json', '/data/bookings.json',
                       '/test/api.test.js', '/scripts/preflight.js', '/docs/SESSIONS.md', '/deploy/guruji.service']) {
        assert.equal((await fetch(base + f)).status, 404, `${f} is not downloadable`);
      }
      // page addresses of the single-page site all serve the app
      for (const p of ['/about', '/services/astro-palmistry-correlation', '/reiki-healing', '/courses', '/resources', '/faqs', '/contact', '/track', '/disclaimer', '/terms', '/privacy-policy', '/cancellation-refund-policy', '/consent-policy', '/grievance']) {
        const res = await fetch(base + p);
        assert.equal(res.status, 200, p);
        assert.match(res.headers.get('content-type'), /text\/html/);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Cashfree payments, against a stand-in gateway (no network, no real keys)
// ---------------------------------------------------------------------------
describe('Cashfree payments', () => {
  let server, base, store, gateway;

  const call = async (method, url, body) => {
    const res = await fetch(base + url, {
      method, headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  before(async () => {
    process.env.PAYMENT_MODE = 'cashfree';
    delete require.cache[require.resolve('../server')];
    const { createHandler } = require('../server');
    store = await createStore({ client: new FakeMongoClient(), dbName: 'pay_test' });
    gateway = {
      mode: 'sandbox', enabled: true, orders: new Map(), created: [],
      async createOrder(o) {
        gateway.created.push(o);
        gateway.orders.set(o.orderId, { status: 'ACTIVE', amount: o.amount });
        return { orderId: o.orderId, paymentSessionId: 'session_' + o.orderId };
      },
      async getOrder(id) {
        const o = gateway.orders.get(id);
        if (!o) throw new Error('unknown order');
        return { status: o.status, amount: o.amount, currency: 'INR', raw: {} };
      }
    };
    server = require('http').createServer(createHandler(store, { gateway }));
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    server.close(); await store.close();
    delete process.env.PAYMENT_MODE;
    delete require.cache[require.resolve('../server')];
  });

  const newBooking = async (mobile = '9811111111') => (await call('POST', '/api/bookings', {
    type: 'consultation', serviceId: 'combined_consultation',
    devotee: { name: 'Pay Test', mobile, email: 'pay@example.com' }
  })).body.booking;

  test('health reports the live gateway', async () => {
    const h = (await call('GET', '/api/health')).body;
    assert.equal(h.payments, 'cashfree');
    assert.equal(h.paymentsReady, true);
  });

  test('the order sent to Cashfree matches what Cashfree accepts', async () => {
    const b = await newBooking('9888888881');
    await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    const o = gateway.created[gateway.created.length - 1];
    assert.match(o.orderId, /^[A-Za-z0-9_-]{3,45}$/, 'order_id: letters, numbers, _ and -, 3–45 chars');
    assert.match(o.customer.phone, /^\d{10}$/);
    assert.ok(o.amount >= 1, 'at least ₹1');
    assert.ok(o.returnUrl.length <= 250, 'return_url within 250 characters');
    assert.match(o.returnUrl, /^https?:\/\//);
  });

  test('a booking reference the gateway would reject never reaches it', async () => {
    const { createCashfree } = require('../payments');
    const cf = createCashfree({ enabled: true, appId: 'a', secret: 'b', mode: 'sandbox', baseUrl: 'https://x' }, async () => { throw new Error('should not be called'); });
    await assert.rejects(() => cf.createOrder({ orderId: 'has spaces!', amount: 549, customer: { phone: '9811111111' }, returnUrl: 'https://x/y' }), /Invalid booking reference/);
    await assert.rejects(() => cf.createOrder({ orderId: 'GURUJI-PLM-AB12_1', amount: 0, customer: { phone: '9811111111' }, returnUrl: 'https://x/y' }), /at least/);
  });

  test('the browser cannot mark a booking paid itself', async () => {
    const b = await newBooking();
    const r = await call('PATCH', `/api/bookings/${b.orderId}`, { event: 'payment_success', mobile: b.devotee.mobile });
    assert.equal(r.status, 403, 'only the gateway confirms payments');
    assert.equal((await call('GET', `/api/bookings/${b.orderId}?mobile=${b.devotee.mobile}`)).body.booking.status, 'PENDING_PAYMENT');
  });

  test('a payment session is created for the booking amount, and only with the right mobile', async () => {
    const b = await newBooking('9822222222');
    assert.equal((await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: '9000000000' })).status, 404);
    const r = await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    assert.equal(r.status, 200);
    assert.match(r.body.paymentSessionId, /^session_/);
    const order = gateway.created[gateway.created.length - 1];
    assert.equal(order.amount, b.amount, 'the server sets the amount, not the browser');
    assert.equal(order.customer.phone, b.devotee.mobile);
    assert.match(order.returnUrl, new RegExp(`ref=${b.orderId}`));
  });

  test('a booking is only marked paid once the gateway says PAID', async () => {
    const b = await newBooking('9833333333');
    const s1 = await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    const gatewayOrderId = gateway.created[gateway.created.length - 1].orderId;
    assert.ok(s1.body.paymentSessionId);

    let v = await call('POST', `/api/bookings/${b.orderId}/verify-payment`, { mobile: b.devotee.mobile });
    assert.equal(v.body.booking.status, 'PENDING_PAYMENT', 'still unpaid at the gateway');

    gateway.orders.get(gatewayOrderId).status = 'PAID';
    v = await call('POST', `/api/bookings/${b.orderId}/verify-payment`, { mobile: b.devotee.mobile });
    assert.equal(v.body.booking.status, 'PAID');
    assert.equal(v.body.booking.payment.status, 'SUCCESS');
    assert.ok(v.body.booking.payment.paidAt);
  });

  test('a short payment is not accepted', async () => {
    const b = await newBooking('9844444444');
    await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    const gatewayOrderId = gateway.created[gateway.created.length - 1].orderId;
    Object.assign(gateway.orders.get(gatewayOrderId), { status: 'PAID', amount: 0 });
    const v = await call('POST', `/api/bookings/${b.orderId}/verify-payment`, { mobile: b.devotee.mobile });
    assert.equal(v.body.booking.status, 'PENDING_PAYMENT', 'the amount must match');
  });

  test('an expired payment marks the booking failed, and a retry gets a new gateway order', async () => {
    const b = await newBooking('9855555555');
    await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    const first = gateway.created[gateway.created.length - 1].orderId;
    gateway.orders.get(first).status = 'EXPIRED';
    assert.equal((await call('GET', `/api/bookings/${b.orderId}?mobile=${b.devotee.mobile}`)).body.booking.status, 'PAYMENT_FAILED');

    await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    const second = gateway.created[gateway.created.length - 1].orderId;
    assert.notEqual(second, first, 'each attempt is its own gateway order');
    gateway.orders.get(second).status = 'PAID';
    assert.equal((await call('GET', `/api/bookings/${b.orderId}?mobile=${b.devotee.mobile}`)).body.booking.status, 'PAID');
  });

  test('the webhook confirms from the gateway, never from its own body', async () => {
    const b = await newBooking('9866666666');
    await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    const gatewayOrderId = gateway.created[gateway.created.length - 1].orderId;

    // a forged "paid" webhook changes nothing while the gateway still says ACTIVE
    await call('POST', '/api/payments/cashfree/webhook', { type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: gatewayOrderId } } });
    assert.equal((await store.getBooking(b.orderId)).status, 'PENDING_PAYMENT');

    gateway.orders.get(gatewayOrderId).status = 'PAID';
    await call('POST', '/api/payments/cashfree/webhook', { type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: gatewayOrderId } } });
    assert.equal((await store.getBooking(b.orderId)).status, 'PAID');

    // nonsense references are ignored quietly
    assert.equal((await call('POST', '/api/payments/cashfree/webhook', { data: { order: { order_id: '../../etc/passwd' } } })).status, 200);
  });

  test('an already paid booking cannot start another payment', async () => {
    const b = await newBooking('9877777777');
    await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile });
    gateway.orders.get(gateway.created[gateway.created.length - 1].orderId).status = 'PAID';
    await call('POST', `/api/bookings/${b.orderId}/verify-payment`, { mobile: b.devotee.mobile });
    assert.equal((await call('POST', `/api/bookings/${b.orderId}/payment`, { mobile: b.devotee.mobile })).status, 409);
  });
});

test('Cashfree keys are read from the environment only', () => {
  const { cashfreeConfig } = require('../payments');
  assert.equal(cashfreeConfig({}).enabled, false);
  const cfg = cashfreeConfig({ CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret', CASHFREE_ENV: 'production' });
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.baseUrl, 'https://api.cashfree.com/pg');
  assert.equal(cashfreeConfig({ CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 's' }).baseUrl, 'https://sandbox.cashfree.com/pg');
  const src = fs.readFileSync(path.join(__dirname, '..', 'payments.js'), 'utf8');
  assert.ok(!/TEST|[0-9a-f]{32}/.test(src.replace(/CASHFREE_[A-Z_]+/g, '')), 'no keys are hard-coded');
});

test('the secret key is sent only as a Cashfree header, and gateway errors are not leaked', async () => {
  const { createCashfree } = require('../payments');
  const calls = [];
  const fake = async (url, opts) => { calls.push([url, opts]); return { ok: true, json: async () => ({ order_id: 'o1', payment_session_id: 'ps' }) }; };
  const cf = createCashfree({ enabled: true, appId: 'app-id', secret: 'super-secret', mode: 'sandbox', baseUrl: 'https://sandbox.cashfree.com/pg', apiVersion: '2023-08-01' }, fake);
  await cf.createOrder({ orderId: 'GURUJI-PLM-1_1', amount: 749, customer: { phone: '9811111111' }, returnUrl: 'https://x/y' });
  const [url, opts] = calls[0];
  assert.equal(url, 'https://sandbox.cashfree.com/pg/orders');
  assert.equal(opts.headers['x-client-secret'], 'super-secret');
  assert.equal(opts.headers['x-client-id'], 'app-id');
  assert.equal(opts.headers['x-api-version'], '2023-08-01');
  assert.match(JSON.parse(opts.body).customer_details.customer_id, /^[A-Za-z0-9]{3,50}$/);
  assert.ok(!opts.body.includes('super-secret'), 'the secret never goes in the body');

  const failing = async () => ({ ok: false, status: 401, json: async () => ({ message: 'authentication Failed: invalid clientId' }) });
  const cf2 = createCashfree({ enabled: true, appId: 'a', secret: 'b', mode: 'sandbox', baseUrl: 'https://sandbox.cashfree.com/pg' }, failing);
  await assert.rejects(() => cf2.getOrder('x'), (e) => !/clientId|authentication/i.test(e.message));
});

test('MONGODB_URI with the <db_password> placeholder falls back to files', async () => {
  const store = await createStore({ uri: 'mongodb+srv://u:<db_password>@cluster0.example.net/' });
  assert.equal(store.mode, 'file');
});

test('unreachable MongoDB falls back to files instead of crashing', async () => {
  const failing = { connect: async () => { throw new Error('getaddrinfo ENOTFOUND'); }, close: async () => {} };
  const store = await createStore({ client: failing, dbName: 'x' });
  assert.equal(store.mode, 'file');
});
