// Devotee accounts: register, sign in, the profile, and the holes that were in
// the first version of this flow.
'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guruji-acct-'));
fs.copyFileSync(path.join(__dirname, '..', 'data', 'mantras.json'), path.join(tmp, 'mantras.json'));
process.env.GURUJI_DATA_DIR = tmp;
process.env.GURUJI_SEED_FILE = path.join(tmp, 'mantras-data.js');
process.env.RATE_LIMIT_MULTIPLIER = '100';
delete process.env.MONGODB_URI;

const { createServer } = require('../server');
const { createStore } = require('../db');

describe('devotee accounts', () => {
  let server, base, store;
  const call = async (method, url, body, headers = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const newAccount = (over = {}) => ({
    name: 'Satish Mokkapati', mobile: '7842733169', email: 'devotee@example.com',
    password: 'Secret123', consent: true, ...over
  });

  before(async () => {
    store = await createStore({ uri: '' });
    server = createServer(store);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => { server.close(); await store.close(); });

  // ---- registration ------------------------------------------------------

  let token;
  test('registering answers with ok AND success, so no client can misread it', async () => {
    // The browser checked data.ok while the server sent only {success:true};
    // every sign-up ended in "Registration failed" on a 200 response.
    const r = await call('POST', '/api/customer/register', newAccount());
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.success, true);
    assert.ok(r.body.token);
    assert.equal(r.body.customer.mobile, '7842733169');
    assert.equal(r.body.customer.passwordHash, undefined, 'no password hash leaves the server');
    token = r.body.token;
  });

  test('registration refuses bad details and missing consent', async () => {
    assert.equal((await call('POST', '/api/customer/register', newAccount({ consent: false, disclaimerAccepted: false, termsAccepted: false, privacyAccepted: false, email: 'a@b.co', mobile: '9000000099' }))).status, 400);
    assert.equal((await call('POST', '/api/customer/register', newAccount({ name: 'x', email: 'new1@example.com', mobile: '9000000098' }))).status, 422);
    assert.equal((await call('POST', '/api/customer/register', newAccount({ mobile: '123', email: 'new2@example.com' }))).status, 422);
    assert.equal((await call('POST', '/api/customer/register', newAccount({ email: 'not-an-email', mobile: '9000000097' }))).status, 422);
  });

  test('a second registration with the wrong password does not take over the account', async () => {
    const r = await call('POST', '/api/customer/register', newAccount({ password: 'DifferentOne' }));
    assert.equal(r.status, 409);
  });

  // ---- the session token -------------------------------------------------

  test('the token works as a Bearer header, an x-customer-token header and a cookie', async () => {
    // The browser sent Authorization: Bearer; the server only read
    // x-customer-token, so the account page could never load a profile.
    for (const headers of [
      { Authorization: `Bearer ${token}` },
      { 'x-customer-token': token },
      { Cookie: `guruji_cust_token=${token}` }
    ]) {
      const r = await call('GET', '/api/customer/me', null, headers);
      assert.equal(r.status, 200, JSON.stringify(headers));
      assert.equal(r.body.customer.email, 'devotee@example.com');
    }
  });

  test('no token, or a made-up one, gets nothing', async () => {
    assert.equal((await call('GET', '/api/customer/me')).status, 401);
    assert.equal((await call('GET', '/api/customer/me', null, { Authorization: 'Bearer deadbeef' })).status, 401);
  });

  test('bookings come back with ok, and only the ones that belong to the account', async () => {
    const mine = await call('POST', '/api/bookings', {
      type: 'consultation', serviceId: 'combined_consultation',
      slot: { date: '2026-12-01', time: '10:00 AM', iso: '2026-12-01' },
      devotee: { name: 'Satish Mokkapati', mobile: '7842733169', email: 'devotee@example.com' }
    });
    assert.equal(mine.status, 201);
    await call('POST', '/api/bookings', {
      type: 'consultation', serviceId: 'combined_consultation',
      slot: { date: '2026-12-01', time: '11:00 AM', iso: '2026-12-01' },
      devotee: { name: 'Someone Else', mobile: '9000000055', email: 'other@example.com' }
    });
    const r = await call('GET', '/api/customer/bookings', null, { Authorization: `Bearer ${token}` });
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.bookings.length, 1);
    assert.equal(r.body.bookings[0].orderId, mine.body.booking.orderId);
  });

  // ---- signing in --------------------------------------------------------

  test('signing in needs the right password', async () => {
    assert.equal((await call('POST', '/api/customer/login', { identifier: 'devotee@example.com', password: 'Secret123' })).status, 200);
    assert.equal((await call('POST', '/api/customer/login', { identifier: '7842733169', password: 'Secret123' })).status, 200);
    assert.equal((await call('POST', '/api/customer/login', { identifier: 'devotee@example.com', password: 'wrong' })).status, 401);
    assert.equal((await call('POST', '/api/customer/login', { identifier: 'nobody@example.com', password: 'Secret123' })).status, 404);
  });

  test('an account made with Google cannot be signed into with a blank password', async () => {
    // This was an account takeover: the check was skipped when the account had
    // no password, so knowing the email address was enough.
    await store.createOrUpdateCustomer({ name: 'Google Only', email: 'googleonly@example.com', mobile: '9000000044', provider: 'google' });
    for (const password of ['', 'anything', 'x'.repeat(40)]) {
      const r = await call('POST', '/api/customer/login', { identifier: 'googleonly@example.com', password });
      assert.equal(r.status, 401, `password "${password}" must not sign in`);
    }
  });

  // ---- the profile -------------------------------------------------------

  test('the profile can be edited, and the session sees the change at once', async () => {
    const r = await call('PATCH', '/api/customer/me', { name: 'Satish M Garu', mobile: '9876543210' }, { Authorization: `Bearer ${token}` });
    assert.equal(r.status, 200);
    assert.equal(r.body.customer.name, 'Satish M Garu');
    assert.equal(r.body.customer.mobile, '9876543210');
    const me = await call('GET', '/api/customer/me', null, { Authorization: `Bearer ${token}` });
    assert.equal(me.body.customer.name, 'Satish M Garu');
    assert.equal(me.body.customer.email, 'devotee@example.com', 'a field left out is left alone');
  });

  test('the profile refuses rubbish, and a number that belongs to someone else', async () => {
    const h = { Authorization: `Bearer ${token}` };
    assert.equal((await call('PATCH', '/api/customer/me', { mobile: '123' }, h)).status, 422);
    assert.equal((await call('PATCH', '/api/customer/me', { email: 'nope' }, h)).status, 422);
    assert.equal((await call('PATCH', '/api/customer/me', { name: 'x' }, h)).status, 422);
    assert.equal((await call('PATCH', '/api/customer/me', { mobile: '9000000044' }, h)).status, 409, 'that mobile is the Google account\'s');
    assert.equal((await call('PATCH', '/api/customer/me', { name: 'Nobody' })).status, 401);
  });

  test('a password can be set from the profile, and a short one is refused', async () => {
    const h = { Authorization: `Bearer ${token}` };
    assert.equal((await call('PATCH', '/api/customer/me', { password: 'short' }, h)).status, 422);
    assert.equal((await call('PATCH', '/api/customer/me', { password: 'BrandNewPass1' }, h)).status, 200);
    assert.equal((await call('POST', '/api/customer/login', { identifier: 'devotee@example.com', password: 'BrandNewPass1' })).status, 200);
    assert.equal((await call('POST', '/api/customer/login', { identifier: 'devotee@example.com', password: 'Secret123' })).status, 401);
    // Editing the name must not wipe the password.
    await call('PATCH', '/api/customer/me', { name: 'Satish Mokkapati' }, h);
    assert.equal((await call('POST', '/api/customer/login', { identifier: 'devotee@example.com', password: 'BrandNewPass1' })).status, 200);
  });

  // ---- Google sign-in endpoint -------------------------------------------

  test('google-auth refuses a token it cannot verify, with a reason', async () => {
    const forged = ['eyJhbGciOiJSUzI1NiIsImtpZCI6IngifQ',
      Buffer.from(JSON.stringify({ aud: 'palm-56063', iss: 'https://securetoken.google.com/palm-56063', exp: 9999999999, sub: 'evil', email: 'attacker@example.com' })).toString('base64url'),
      'AAAA'].join('.');
    const r = await call('POST', '/api/customer/google-auth', { idToken: forged });
    assert.equal(r.status, 401);
    assert.ok(r.body.code, 'the refusal says why');
    assert.notEqual(r.body.code, 'ok');
    assert.equal((await call('POST', '/api/customer/google-auth', {})).status, 422);
  });
});
