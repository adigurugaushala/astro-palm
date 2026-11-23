// Who may open the two dashboards, end to end, through the real HTTP handler.
//
// Both authorised addresses must reach BOTH the admin dashboard and the case
// area; every other Google account must be refused; and no request may name its
// own role. A Google stand-in supplies the signing certificate so the whole
// path — signature, claims, address list, session token, each protected route —
// is exercised without reaching the network.
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

// The key pair is generated here, so the suite needs no files and always runs.
// crypto.createPublicKey() reads a public key PEM exactly as it reads one of
// Google's certificates, so the stand-in is a faithful substitute.
const { publicKey: pubPem, privateKey: keyObj } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guruji-access-'));
fs.copyFileSync(path.join(__dirname, '..', 'data', 'mantras.json'), path.join(tmp, 'mantras.json'));
process.env.GURUJI_DATA_DIR = tmp;
process.env.GURUJI_SEED_FILE = path.join(tmp, 'mantras-data.js');
process.env.FIREBASE_PROJECT_ID = 'palm-56063';
process.env.RATE_LIMIT_MULTIPLIER = '100';
process.env.MONGODB_URI = '';
process.env.PAYMENT_MODE = 'simulated';
process.env.ADMIN_PIN = 'owner-pin-test';
process.env.GURUJI_PIN = 'guruji-pin-test';

// Both addresses on both lists — the policy this project runs under
const STAFF_A = 'first-staff@example.com';
const STAFF_B = 'second-staff@example.org';
process.env.ADMIN_EMAILS = `${STAFF_A},${STAFF_B}`;
process.env.GURUJI_EMAILS = `${STAFF_A},${STAFF_B}`;

const server = require('../server');
const { createStore } = require('../db');

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('staff access control', () => {
  const privateKey = crypto.createPrivateKey(keyObj);
  const cert = pubPem;
  let srv, base;

  const token = (email, over = {}) => {
    const now = Math.floor(Date.now() / 1000);
    const head = b64({ alg: 'RS256', kid: 'kid-1' });
    const body = b64({
      aud: 'palm-56063', iss: 'https://securetoken.google.com/palm-56063',
      sub: 'uid-' + email, email, email_verified: true, name: 'Staff Person',
      iat: now - 10, exp: now + 3600, ...over
    });
    const sig = crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), privateKey).toString('base64url');
    return `${head}.${body}.${sig}`;
  };

  const call = async (method, url, body, headers = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const signIn = (email) => call('POST', '/api/admin/verify', { idToken: token(email) });

  before(async () => {
    server._setGoogleCertFetchForTest(() => ({ 'kid-1': cert }));
    const store = await createStore({ uri: '' });
    srv = http.createServer(server.createHandler(store));
    await new Promise(r => srv.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${srv.address().port}`;
  });
  after(() => { server._setGoogleCertFetchForTest(null); srv && srv.close(); });

  // ---- the four authorised combinations --------------------------------

  for (const email of [STAFF_A, STAFF_B]) {
    test(`${email} opens the admin dashboard`, async () => {
      const res = await signIn(email);
      assert.equal(res.status, 200);
      assert.equal(res.body.role, 'owner');
      assert.equal(res.body.email, email);
      assert.ok(res.body.token, 'a session token is issued');

      const auth = { 'x-admin-token': res.body.token };
      for (const url of ['/api/admin/bookings', '/api/admin/enquiries', '/api/admin/overview', '/api/admin/content', '/api/admin/reviews', '/api/admin/consents']) {
        assert.equal((await call('GET', url, null, auth)).status, 200, url);
      }
    });

    test(`${email} opens the case area`, async () => {
      const res = await signIn(email);
      const auth = { 'x-admin-token': res.body.token };
      assert.equal((await call('GET', '/api/guruji/cases', null, auth)).status, 200);
    });
  }

  test('an address written with capitals and spaces is still recognised', async () => {
    const res = await signIn(`  ${STAFF_A.toUpperCase()}  `.trim());
    assert.equal(res.status, 200, 'the email is normalised before it is compared');
    assert.equal(res.body.role, 'owner');
  });

  // ---- everyone else ----------------------------------------------------

  test('any other Google account is refused from both dashboards', async () => {
    const res = await signIn('someone-else@example.com');
    assert.equal(res.status, 403, 'a verified identity that is not on the list is 403, not 401');
    assert.match(res.body.error, /not on the staff list/);
    assert.ok(!res.body.token, 'no session token is issued');
  });

  test('a token this server did not verify opens nothing', async () => {
    // right shape, wrong signature
    const forged = token(STAFF_A).slice(0, -6) + 'AAAAAA';
    const res = await call('POST', '/api/admin/verify', { idToken: forged });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'bad_signature');

    // an unsigned token claiming to be staff
    const now = Math.floor(Date.now() / 1000);
    const naked = [b64({ alg: 'none' }), b64({ aud: 'palm-56063', email: STAFF_A, exp: now + 3600 }), ''].join('.');
    assert.equal((await call('POST', '/api/admin/verify', { idToken: naked })).status, 401);
  });

  test('an expired token is refused', async () => {
    const now = Math.floor(Date.now() / 1000);
    const res = await call('POST', '/api/admin/verify', { idToken: token(STAFF_A, { exp: now - 600, iat: now - 4000 }) });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'token_expired');
  });

  test('a token from another Firebase project is refused', async () => {
    const res = await call('POST', '/api/admin/verify', { idToken: token(STAFF_A, { aud: 'someone-elses-project' }) });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'wrong_project');
  });

  // ---- the request cannot name its own role -----------------------------

  test('a request cannot grant itself a role', async () => {
    // Everything a browser might try to assert about itself
    const lies = [
      { role: 'owner' }, { email: STAFF_A }, { uid: 'uid-' + STAFF_A },
      { role: 'owner', email: STAFF_A, permissions: ['all'] }
    ];
    for (const lie of lies) {
      assert.equal((await call('POST', '/api/admin/verify', lie)).status, 401, JSON.stringify(lie));
    }
    // and on a protected route directly
    assert.equal((await call('GET', '/api/admin/bookings', null, { 'x-admin-role': 'owner' })).status, 401);
    assert.equal((await call('PATCH', '/api/admin/bookings/GURUJI-PLM-NOPE', { status: 'PAID', role: 'owner' })).status, 401);
  });

  test('a made-up session token opens nothing', async () => {
    const auth = { 'x-admin-token': crypto.randomBytes(32).toString('hex') };
    assert.equal((await call('GET', '/api/admin/bookings', null, auth)).status, 401);
    assert.equal((await call('GET', '/api/guruji/cases', null, auth)).status, 401);
  });

  test('every protected route refuses a request with no credentials at all', async () => {
    const routes = [
      ['GET', '/api/admin/bookings'], ['GET', '/api/admin/enquiries'], ['GET', '/api/admin/overview'],
      ['GET', '/api/admin/content'], ['GET', '/api/admin/reviews'], ['GET', '/api/admin/consents'],
      ['GET', '/api/admin/consents/export'], ['GET', '/api/admin/bookings/export'], ['GET', '/api/admin/media'],
      ['GET', '/api/admin/sign-in-check'], ['GET', '/api/guruji/cases'],
      ['PUT', '/api/admin/content/pillars'], ['DELETE', '/api/admin/content/pillars'],
      ['POST', '/api/mantras'], ['GET', '/api/guruji/cases/GURUJI-PLM-NOPE'],
      ['PUT', '/api/guruji/cases/GURUJI-PLM-NOPE/report'], ['PUT', '/api/guruji/cases/GURUJI-PLM-NOPE/notes'],
      ['POST', '/api/guruji/cases/GURUJI-PLM-NOPE/status'], ['POST', '/api/guruji/cases/GURUJI-PLM-NOPE/claim'],
      ['POST', '/api/guruji/cases/GURUJI-PLM-NOPE/ready']
    ];
    for (const [method, url] of routes) {
      const res = await call(method, url, method === 'GET' ? undefined : {});
      assert.equal(res.status, 401, `${method} ${url} should need authorization, got ${res.status}`);
    }
  });

  // ---- sessions ---------------------------------------------------------

  test('signing out stops the session token working', async () => {
    const res = await signIn(STAFF_B);
    const auth = { 'x-admin-token': res.body.token };
    assert.equal((await call('GET', '/api/admin/bookings', null, auth)).status, 200);
    assert.equal((await call('POST', '/api/admin/logout', {}, auth)).status, 200);
    assert.equal((await call('GET', '/api/admin/bookings', null, auth)).status, 401, 'the token is dead after signing out');
  });

  test('a case is claimed under the verified address, not one the browser sends', async () => {
    const made = await call('POST', '/api/bookings', {
      type: 'consultation', serviceId: 'combined_consultation',
      devotee: { name: 'Claim Test', mobile: '9100000099', email: 'claim@example.com' }
    });
    const orderId = made.body.booking.orderId;
    await call('PATCH', `/api/bookings/${orderId}`, { event: 'payment_success', mobile: '9100000099' });

    const res = await signIn(STAFF_A);
    const auth = { 'x-admin-token': res.body.token };
    const claimed = await call('POST', `/api/guruji/cases/${orderId}/claim`, { name: 'Somebody Else' }, auth);
    assert.equal(claimed.status, 200);
    assert.equal(claimed.body.case.assignedTo, STAFF_A, 'the name in the body is ignored');
  });

  // ---- the PIN is not a way around any of this --------------------------

  test('the Guruji PIN does not open the owner dashboard', async () => {
    const pin = { 'x-admin-pin': 'guruji-pin-test' };
    assert.equal((await call('GET', '/api/guruji/cases', null, pin)).status, 200, 'it does open the case area');
    assert.equal((await call('GET', '/api/admin/bookings', null, pin)).status, 403);
    assert.equal((await call('GET', '/api/admin/overview', null, pin)).status, 403);
    assert.equal((await call('GET', '/api/admin/sign-in-check', null, pin)).status, 403);
    assert.equal((await call('GET', '/api/admin/consents', null, pin)).status, 403);
  });

  test('a wrong PIN opens nothing', async () => {
    // note: a trailing space is not a case to test — HTTP strips whitespace
    // around a header value, so the server never sees one
    for (const pin of ['', 'owner-pin-tes', 'owner-pin-testt', 'OWNER-PIN-TEST', 'x'.repeat(64)]) {
      const res = await call('GET', '/api/admin/bookings', null, { 'x-admin-pin': pin });
      assert.equal(res.status, 401, `PIN ${JSON.stringify(pin)} must not be accepted`);
    }
  });

  test('the owner PIN and an authorised Google account reach the same places', async () => {
    const byPin = { 'x-admin-pin': 'owner-pin-test' };
    const byGoogle = { 'x-admin-token': (await signIn(STAFF_A)).body.token };
    for (const url of ['/api/admin/bookings', '/api/admin/overview', '/api/guruji/cases']) {
      const a = await call('GET', url, null, byPin);
      const b = await call('GET', url, null, byGoogle);
      assert.equal(a.status, b.status, url);
      assert.equal(a.status, 200, url);
    }
  });
});
