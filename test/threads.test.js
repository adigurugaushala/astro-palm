// The seeker's chat: one thread per booking plus a general thread, palm photos
// that are really stored, and files sent into a conversation.
//
// The rule these tests exist to protect is that a conversation belongs to one
// person. A thread key is not a password: every read and every write is checked
// against the signed-in account, so knowing an order id gets you nothing.
'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guruji-threads-'));
fs.copyFileSync(path.join(__dirname, '..', 'data', 'mantras.json'), path.join(tmp, 'mantras.json'));
process.env.GURUJI_DATA_DIR = tmp;
process.env.GURUJI_SEED_FILE = path.join(tmp, 'mantras-data.js');
process.env.RATE_LIMIT_MULTIPLIER = '100';
process.env.ADMIN_PIN = 'owner-pin-threads';
process.env.GURUJI_PIN = 'guruji-pin-threads';
process.env.PAYMENT_MODE = 'simulated';
delete process.env.MONGODB_URI;

const { createServer } = require('../server');
const { createStore } = require('../db');

// A 1x1 PNG: enough to prove the bytes make the round trip.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n').toString('base64');

describe('seeker threads, palm photos and attachments', () => {
  let server, base, store;
  const GURUJI = { 'x-admin-pin': 'guruji-pin-threads' };

  const call = async (method, url, body, headers = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    const ct = res.headers.get('content-type') || '';
    return {
      status: res.status,
      type: ct,
      disposition: res.headers.get('content-disposition') || '',
      cache: res.headers.get('cache-control') || '',
      body: ct.includes('json') ? await res.json().catch(() => null) : null,
      bytes: ct.includes('json') ? 0 : (await res.arrayBuffer()).byteLength
    };
  };

  const signUp = async (name, mobile) => {
    const r = await call('POST', '/api/customer/register', { name, mobile, consent: true });
    assert.equal(r.status, 200, `${name} could register`);
    return { auth: { Authorization: `Bearer ${r.body.token}` }, mobile };
  };

  const bookFor = async (who, name) => {
    const r = await call('POST', '/api/bookings', {
      type: 'consultation', serviceId: 'palmistry_reading',
      devotee: { name, mobile: who.mobile, email: '' }
    }, who.auth);
    assert.equal(r.status, 201);
    return r.body.booking.orderId;
  };

  let ravi, meera, raviOrder, raviPhotoId;

  before(async () => {
    store = await createStore({ uri: '' });
    server = createServer(store);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
    ravi = await signUp('Ravi Kumar', '9811100011');
    meera = await signUp('Meera Devi', '9811100022');
    raviOrder = await bookFor(ravi, 'Ravi Kumar');
  });
  after(async () => { server.close(); await store.close(); });

  // ---- palm photos ---------------------------------------------------------

  test('a palm photo is stored, and only the right people can open it', async () => {
    const up = await call('POST', `/api/bookings/${raviOrder}/photos`,
      { slot: 1, name: 'left.png', type: 'image/png', data: PNG }, ravi.auth);
    assert.equal(up.status, 201, 'the seeker uploads the photo itself, not just its name');
    raviPhotoId = up.body.photo.id;

    const mine = await call('GET', `/api/bookings/${raviOrder}/photos/${raviPhotoId}`, null, ravi.auth);
    assert.equal(mine.status, 200);
    assert.match(mine.type, /^image\//, 'the bytes come back as an image');
    assert.ok(mine.bytes > 0);
    assert.match(mine.cache, /private/, 'a palm photo never sits in a shared cache');

    assert.equal((await call('GET', `/api/bookings/${raviOrder}/photos/${raviPhotoId}`, null, GURUJI)).status,
      200, 'Guruji can open it');
    assert.equal((await call('GET', `/api/bookings/${raviOrder}/photos/${raviPhotoId}`, null, meera.auth)).status,
      404, 'another seeker cannot');
    assert.equal((await call('GET', `/api/bookings/${raviOrder}/photos/${raviPhotoId}`)).status,
      401, 'nor can a stranger');
    assert.equal((await call('GET', `/api/media/${raviPhotoId}`)).status,
      404, 'and it is not reachable through the public image route');
  });

  test('re-uploading a slot replaces the photo rather than piling them up', async () => {
    for (let i = 0; i < 3; i++) {
      await call('POST', `/api/bookings/${raviOrder}/photos`,
        { slot: 2, name: `right-${i}.png`, type: 'image/png', data: PNG }, ravi.auth);
    }
    const t = await call('GET', '/api/customer/threads', null, ravi.auth);
    assert.equal(t.status, 200);
    const b = await store.getBooking(raviOrder);
    assert.equal(b.photos.filter(p => p.slot === 2).length, 1);
  });

  test('a file that is not an image is refused', async () => {
    const bad = await call('POST', `/api/bookings/${raviOrder}/photos`,
      { slot: 3, name: 'notes.pdf', type: 'application/pdf', data: PDF }, ravi.auth);
    assert.equal(bad.status, 422);
  });

  // ---- threads -------------------------------------------------------------

  test('a seeker has one thread per booking plus a general thread', async () => {
    const r = await call('GET', '/api/customer/threads', null, ravi.auth);
    assert.equal(r.status, 200);
    const kinds = r.body.threads.map(t => t.kind).sort();
    assert.deepEqual(kinds, ['booking', 'general']);
    assert.ok(r.body.threads.some(t => t.key === raviOrder));
    assert.ok(r.body.threads.some(t => t.key === 'GENERAL-9811100011'));
  });

  test('messages never cross between threads', async () => {
    const general = 'GENERAL-9811100011';
    await call('POST', `/api/customer/threads/${raviOrder}/messages`, { text: 'About my reading' }, ravi.auth);
    await call('POST', `/api/customer/threads/${general}/messages`, { text: 'Do you teach classes?' }, ravi.auth);

    const a = await call('GET', `/api/customer/threads/${raviOrder}/messages`, null, ravi.auth);
    const b = await call('GET', `/api/customer/threads/${general}/messages`, null, ravi.auth);
    assert.deepEqual(a.body.messages.map(m => m.text), ['About my reading']);
    assert.deepEqual(b.body.messages.map(m => m.text), ['Do you teach classes?']);
  });

  test('a thread key is not a password: another seeker is simply not found', async () => {
    assert.equal((await call('GET', `/api/customer/threads/${raviOrder}/messages`, null, meera.auth)).status, 404);
    assert.equal((await call('POST', `/api/customer/threads/${raviOrder}/messages`,
      { text: 'let me in' }, meera.auth)).status, 404);
    // Meera cannot read Ravi's general thread by spelling out his number either.
    assert.equal((await call('GET', '/api/customer/threads/GENERAL-9811100011/messages', null, meera.auth)).status, 404);
    // And her own general thread is her own.
    assert.equal((await call('GET', '/api/customer/threads/GENERAL-9811100022/messages', null, meera.auth)).status, 200);
  });

  test('signing out closes every thread', async () => {
    assert.equal((await call('GET', '/api/customer/threads')).status, 401);
    assert.equal((await call('GET', `/api/customer/threads/${raviOrder}/messages`)).status, 401);
  });

  test("a general thread reaches Guruji's inbox, with its unread count", async () => {
    await call('POST', '/api/customer/threads/GENERAL-9811100022/messages',
      { text: 'Namaste Guruji' }, meera.auth);
    const r = await call('GET', '/api/guruji/cases', null, GURUJI);
    assert.equal(r.status, 200);
    const row = r.body.cases.find(c => c.orderId === 'GENERAL-9811100022');
    assert.ok(row, 'a message that belongs to no booking is still shown to Guruji');
    assert.equal(row.kind, 'general');
    assert.equal(row.devotee.name, 'Meera Devi');
    assert.ok(row.unread >= 1);
  });

  test('Guruji can reply to a general thread, and the seeker sees it', async () => {
    const sent = await call('POST', '/api/guruji/threads/GENERAL-9811100022/messages',
      { text: 'Namaste. Yes, classes run every month.' }, GURUJI);
    assert.equal(sent.status, 201);
    const seen = await call('GET', '/api/customer/threads/GENERAL-9811100022/messages', null, meera.auth);
    assert.ok(seen.body.messages.some(m => m.from === 'guruji' && /classes run/.test(m.text)));
  });

  test("an unread reply raises the seeker's badge, general thread included", async () => {
    await call('POST', '/api/guruji/threads/GENERAL-9811100011/messages', { text: 'A note for Ravi' }, GURUJI);
    const r = await call('GET', '/api/customer/unread', null, ravi.auth);
    assert.equal(r.status, 200);
    assert.ok(r.body.unread >= 1, 'a reply with no booking behind it still counts');
    assert.ok(r.body.bookings['GENERAL-9811100011'] >= 1);
  });

  // ---- attachments ---------------------------------------------------------

  test('a marked copy of a palm photo can be sent, opened and downloaded', async () => {
    const marked = await call('POST', `/api/guruji/cases/${raviOrder}/marked-photo`,
      { sourceId: raviPhotoId, name: 'marked-left.png', type: 'image/png', data: PNG }, GURUJI);
    assert.equal(marked.status, 201);
    const mediaId = marked.body.marked.id;

    // Stored, but not yet sent: the seeker must not see it by guessing.
    assert.equal((await call('GET', `/api/customer/threads/${raviOrder}/files/${mediaId}`, null, ravi.auth)).status,
      404, 'a file is reachable only once it has been sent into the thread');

    const sent = await call('POST', `/api/guruji/threads/${raviOrder}/messages`, {
      text: 'I have marked your heart line.',
      attachment: { kind: 'image', mediaId, name: 'marked-left.png', size: marked.body.marked.size }
    }, GURUJI);
    assert.equal(sent.status, 201);

    const msgs = await call('GET', `/api/customer/threads/${raviOrder}/messages`, null, ravi.auth);
    const withFile = msgs.body.messages.find(m => m.attachment);
    assert.ok(withFile, 'the photo arrives in the chat');
    assert.equal(withFile.attachment.kind, 'image');

    const open = await call('GET', `/api/customer/threads/${raviOrder}/files/${mediaId}`, null, ravi.auth);
    assert.equal(open.status, 200);
    assert.ok(open.bytes > 0);
    assert.equal((await call('GET', `/api/customer/threads/${raviOrder}/files/${mediaId}`, null, meera.auth)).status,
      404, 'and nobody else can open it');
  });

  test('the reading PDF arrives in the chat with a download', async () => {
    const up = await call('POST', `/api/guruji/cases/${raviOrder}/report-file`,
      { name: 'reading.pdf', data: PDF }, GURUJI);
    assert.equal(up.status, 201);
    const mediaId = up.body.reportFile.mediaId;

    await call('POST', `/api/guruji/threads/${raviOrder}/messages`, {
      text: 'Your reading is ready.',
      attachment: { kind: 'pdf', mediaId, name: 'reading.pdf', size: up.body.reportFile.size }
    }, GURUJI);

    const inline = await call('GET', `/api/customer/threads/${raviOrder}/files/${mediaId}`, null, ravi.auth);
    assert.equal(inline.status, 200);
    assert.match(inline.type, /pdf/);

    const saved = await call('GET', `/api/customer/threads/${raviOrder}/files/${mediaId}?download=1`, null, ravi.auth);
    assert.equal(saved.status, 200);
    assert.match(saved.disposition, /^attachment; filename="reading\.pdf"/,
      'pressing Download saves the file rather than opening it');
  });

  test('a message must carry words or a file, and a made-up file is refused', async () => {
    assert.equal((await call('POST', `/api/guruji/threads/${raviOrder}/messages`, {}, GURUJI)).status, 422);
    assert.equal((await call('POST', `/api/guruji/threads/${raviOrder}/messages`,
      { attachment: { kind: 'pdf', mediaId: 'doc-does-not-exist', name: 'x.pdf' } }, GURUJI)).status, 404);
  });

  test('only Guruji may write into a thread as Guruji', async () => {
    assert.equal((await call('POST', `/api/guruji/threads/${raviOrder}/messages`, { text: 'hi' })).status, 401);
    assert.equal((await call('POST', `/api/guruji/threads/${raviOrder}/messages`,
      { text: 'hi' }, ravi.auth)).status, 401);
    // A seeker writing to their own thread is recorded as the seeker, never as Guruji.
    await call('POST', `/api/customer/threads/${raviOrder}/messages`, { text: 'thank you' }, ravi.auth);
    const msgs = await call('GET', `/api/customer/threads/${raviOrder}/messages`, null, ravi.auth);
    const last = msgs.body.messages[msgs.body.messages.length - 1];
    assert.equal(last.from, 'devotee');
    assert.equal(last.name, 'Ravi Kumar');
  });
});
