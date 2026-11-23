// The Google sign-in check: a real signature is accepted, anything else is not.
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

process.env.FIREBASE_PROJECT_ID = 'palm-56063';
const server = require('../server');

const CERT_DIR = process.env.TEST_CERT_DIR || '/tmp/certgen';
const haveCerts = fs.existsSync(path.join(CERT_DIR, 'cert.pem'));

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function makeToken(claims, { kid = 'test-key', alg = 'RS256', key, tamper = false } = {}) {
  const head = b64({ alg, kid });
  const body = b64(claims);
  let sig = 'AAAA';
  if (key) {
    sig = crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), key).toString('base64url');
    if (tamper) sig = sig.slice(0, -4) + (sig.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  }
  return `${head}.${body}.${sig}`;
}

const goodClaims = (over = {}) => ({
  aud: 'palm-56063',
  iss: 'https://securetoken.google.com/palm-56063',
  sub: 'firebase-uid-123',
  email: 'devotee@example.com',
  email_verified: true,
  name: 'Satish M',
  iat: Math.floor(Date.now() / 1000) - 10,
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...over
});

describe('Firebase ID token verification', { skip: haveCerts ? false : 'no test certificate available' }, () => {
  const privateKey = fs.readFileSync(path.join(CERT_DIR, 'key.pem'), 'utf8');
  const cert = fs.readFileSync(path.join(CERT_DIR, 'cert.pem'), 'utf8');
  server._setGoogleCertsForTest({ 'test-key': cert });

  test('a properly signed token is accepted', async () => {
    const user = await server.verifyFirebaseToken(makeToken(goodClaims(), { key: privateKey }));
    assert.ok(user, 'token should verify: ' + server.verifyFirebaseToken.lastError);
    assert.equal(user.email, 'devotee@example.com');
    assert.equal(user.displayName, 'Satish M');
    assert.equal(user.localId, 'firebase-uid-123');
  });

  test('an unsigned token is refused — this was an account-takeover hole', async () => {
    const forged = makeToken(goodClaims({ email: 'attacker@example.com' }));
    assert.equal(await server.verifyFirebaseToken(forged), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'bad_signature');
  });

  test('a tampered signature is refused', async () => {
    const t = makeToken(goodClaims(), { key: privateKey, tamper: true });
    assert.equal(await server.verifyFirebaseToken(t), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'bad_signature');
  });

  test('a token whose payload was edited after signing is refused', async () => {
    const real = makeToken(goodClaims(), { key: privateKey });
    const [h, , sig] = real.split('.');
    const swapped = [h, b64(goodClaims({ email: 'attacker@example.com' })), sig].join('.');
    assert.equal(await server.verifyFirebaseToken(swapped), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'bad_signature');
  });

  test('alg: none is refused', async () => {
    const t = makeToken(goodClaims(), { alg: 'none' });
    assert.equal(await server.verifyFirebaseToken(t), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'bad_algorithm');
  });

  test('a token for another Firebase project is refused', async () => {
    const t = makeToken(goodClaims({ aud: 'some-other-project' }), { key: privateKey });
    assert.equal(await server.verifyFirebaseToken(t), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'wrong_project');
  });

  test('an expired token is refused', async () => {
    const t = makeToken(goodClaims({ exp: Math.floor(Date.now() / 1000) - 600 }), { key: privateKey });
    assert.equal(await server.verifyFirebaseToken(t), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'token_expired');
  });

  test('an unknown signing key is refused', async () => {
    const t = makeToken(goodClaims(), { key: privateKey, kid: 'not-a-google-key' });
    assert.equal(await server.verifyFirebaseToken(t), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'unknown_key_id');
  });

  test('a token with no email is refused', async () => {
    const c = goodClaims(); delete c.email;
    const t = makeToken(c, { key: privateKey });
    assert.equal(await server.verifyFirebaseToken(t), null);
    assert.equal(server.verifyFirebaseToken.lastError, 'no_email');
  });

  test('rubbish is refused', async () => {
    assert.equal(await server.verifyFirebaseToken('not-a-token'), null);
    assert.equal(await server.verifyFirebaseToken(''), null);
    assert.equal(await server.verifyFirebaseToken(null), null);
  });
});

// Staff sign-in with Google: which address opens which dashboard.
describe('staff Google sign-in', { skip: haveCerts ? false : 'no test certificate available' }, () => {
  const fs2 = require('fs');
  const privateKey = fs2.readFileSync(path.join(CERT_DIR, 'key.pem'), 'utf8');
  const cert = fs2.readFileSync(path.join(CERT_DIR, 'cert.pem'), 'utf8');

  const owner = 'owner-person@example.com';
  const guruji = 'guruji-person@example.net';

  let server, base, store;
  const verify = async (email) => {
    const token = makeToken(goodClaims({ email }), { key: privateKey });
    const res = await fetch(base + '/api/admin/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  test('each list opens its own dashboard, and nobody else gets in', async () => {
    process.env.ADMIN_EMAILS = owner;
    process.env.GURUJI_EMAILS = guruji;
    process.env.RATE_LIMIT_MULTIPLIER = '100';
    delete process.env.MONGODB_URI;
    delete require.cache[require.resolve('../server')];
    delete require.cache[require.resolve('../db')];
    const freshServer = require('../server');
    const { createStore } = require('../db');
    freshServer._setGoogleCertsForTest({ 'test-key': cert });

    store = await createStore({ uri: '' });
    server = freshServer.createServer(store);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;

    const asOwner = await verify(owner);
    assert.equal(asOwner.status, 200);
    assert.equal(asOwner.body.role, 'owner');
    assert.ok(asOwner.body.token);

    const asGuruji = await verify(guruji);
    assert.equal(asGuruji.status, 200);
    assert.equal(asGuruji.body.role, 'guruji', "Guruji's address must not get the owner role");

    const stranger = await verify('someone-else@example.org');
    assert.equal(stranger.status, 403);

    // Capitals and stray spaces in the stored list must not lock anyone out.
    assert.equal((await verify(owner.toUpperCase())).body.role, 'owner');

    server.close();
    await store.close();
  });
});
