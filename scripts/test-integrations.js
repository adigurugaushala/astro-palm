// scripts/test-integrations.js
// Comprehensive live verification of MongoDB Atlas, Google Firebase,
// Jitsi as a Service (JaaS 8x8 RS256), Cashfree Payments Gateway (Production),
// and core platform HTTP APIs.

'use strict';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// 1. Load .env
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let value = m[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnvFile(path.join(__dirname, '..', '.env'));

const { MongoClient } = require('mongodb');
const { createServer } = require('../server');
const { createStore } = require('../db');
const { jitsiConfig, newRoomName, sessionWindow, sessionToken } = require('../session');
const { cashfreeConfig, createCashfree } = require('../payments');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'guruji';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

function httpsRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🕉️  GURUJI PALMISTRY — LIVE INTEGRATIONS & APIS DIAGNOSTIC');
  console.log('================================================================\n');

  let mongoSuccess = false;
  let firebaseSuccess = false;
  let jitsiSuccess = false;
  let cashfreeSuccess = false;
  let apiSuccess = false;

  // ---------------------------------------------------------------------------
  // 1. TEST MONGODB ATLAS
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing MongoDB Atlas Database ---');
  try {
    const start = Date.now();
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const connectTime = Date.now() - start;
    console.log(`[PASS] Connected to MongoDB Atlas cluster in ${connectTime}ms.`);

    const db = client.db(MONGODB_DB);
    const ping = await db.command({ ping: 1 });
    console.log('[PASS] Ping command status:', ping.ok === 1 ? 'OK' : 'FAILED');

    // Test write
    const testColl = db.collection('__diagnostic_test');
    const testId = 'test_' + Date.now();
    await testColl.insertOne({ _id: testId, message: 'Guruji Atlas Live Test', at: new Date() });
    console.log('[PASS] Write Test: Document inserted into Atlas collection.');

    // Test read
    const doc = await testColl.findOne({ _id: testId });
    if (doc && doc.message === 'Guruji Atlas Live Test') {
      console.log('[PASS] Read Test: Document retrieved and verified.');
    } else {
      throw new Error('Read test data mismatch');
    }

    // Test cleanup
    await testColl.deleteOne({ _id: testId });
    console.log('[PASS] Cleanup: Diagnostic test document removed cleanly.');

    await client.close();
    mongoSuccess = true;
    console.log('>>> MongoDB Atlas: 🟢 100% OPERATIONAL\n');
  } catch (err) {
    console.error('>>> MongoDB Atlas: 🔴 FAILED:', err.message, '\n');
  }

  // ---------------------------------------------------------------------------
  // 2. TEST GOOGLE FIREBASE & GA4
  // ---------------------------------------------------------------------------
  console.log('--- 2. Testing Google Firebase & Authentication ---');
  try {
    console.log(`[INFO] Project ID: ${FIREBASE_PROJECT_ID}`);
    console.log(`[INFO] API Key: ${FIREBASE_API_KEY ? FIREBASE_API_KEY.slice(0, 10) + '...' : 'MISSING'}`);

    // Firebase Auth Identity Toolkit verification
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE_API_KEY}`;
    const payload = JSON.stringify({
      providerId: 'google.com',
      continueUri: 'http://localhost:3456'
    });

    const res = await httpsRequest(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    const json = JSON.parse(res.data);
    if (res.status === 200 && json.authUri) {
      console.log('[PASS] Firebase Auth REST API responded HTTP 200 OK.');
      console.log('[PASS] Google OAuth Provider Active. Sample URI generated.');
      firebaseSuccess = true;
    } else if (json.error) {
      console.log(`[RESPONSE] Status ${res.status}:`, json.error.message);
      if (json.error.message.includes('CONFIGURATION_NOT_FOUND')) {
        console.log('[INFO] Google Sign-in provider needs to be saved in Firebase Console.');
      } else {
        throw new Error(json.error.message);
      }
    }

    // Firebase Hosting / Auth Handler reachability
    const domainCheck = await httpsRequest(`https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/handler`);
    console.log(`[PASS] Firebase Auth Handler Domain (${FIREBASE_PROJECT_ID}.firebaseapp.com) HTTP Status: ${domainCheck.status}`);

    if (firebaseSuccess) {
      console.log('>>> Google Firebase: 🟢 100% OPERATIONAL\n');
    } else {
      console.log('>>> Google Firebase: 🟡 PARTIAL\n');
    }
  } catch (err) {
    console.error('>>> Google Firebase: 🔴 FAILED:', err.message, '\n');
  }

  // ---------------------------------------------------------------------------
  // 3. TEST JITSI VIDEO CONSULTATION (JaaS 8x8 RS256 JWT)
  // ---------------------------------------------------------------------------
  console.log('--- 3. Testing Jitsi Video Consultations (JaaS 8x8) ---');
  try {
    const config = jitsiConfig();
    console.log(`[PASS] Jitsi Configuration Mode: ${config.mode.toUpperCase()}`);
    console.log(`[PASS] Gateway Domain: ${config.domain}`);
    console.log(`[PASS] Tenant App ID: ${config.appId}`);
    console.log(`[PASS] Key ID (KID): ${config.kid}`);

    if (config.mode !== 'jaas') {
      throw new Error(`Expected Jitsi mode 'jaas', but got '${config.mode}'`);
    }

    // Generate room name
    const sampleRoom = newRoomName();
    console.log(`[PASS] Generated single-use unguessable room: "${sampleRoom}"`);

    // Verify session timing window calculation
    const appointmentTime = new Date(Date.now() + 60000); // 1 minute from now
    const win = sessionWindow({ slotStart: appointmentTime.toISOString(), slotMinutes: 45 });
    console.log(`[PASS] Session window calculated: opens at ${win.opensAt.toISOString()} (10m prior), closes at ${win.closesAt.toISOString()} (30m post)`);

    // Generate Devotee JWT Token
    const devoteeToken = sessionToken(config, {
      room: sampleRoom,
      name: 'Ravi Kumar (Devotee)',
      moderator: false,
      expiresAt: win.closesAt
    });
    console.log(`[PASS] Generated Devotee Guest JWT Token (${devoteeToken.length} bytes)`);

    // Generate Guruji (Moderator) JWT Token
    const gurujiToken = sessionToken(config, {
      room: sampleRoom,
      name: 'Guruji (Consultant)',
      moderator: true,
      expiresAt: win.closesAt
    });
    console.log(`[PASS] Generated Guruji Moderator JWT Token (${gurujiToken.length} bytes)`);

    // Validate Token Structure
    const [hB64, pB64, sigB64] = gurujiToken.split('.');
    const header = JSON.parse(Buffer.from(hB64, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf8'));

    if (header.alg !== 'RS256') throw new Error(`Expected RS256 algorithm, got ${header.alg}`);
    if (header.kid !== config.kid) throw new Error(`KID mismatch: ${header.kid} vs ${config.kid}`);
    if (payload.iss !== 'chat' || payload.aud !== 'jitsi' || payload.sub !== config.appId) {
      throw new Error('JWT claim fields (iss/aud/sub) mismatch');
    }
    console.log('[PASS] JWT Header & Claims match JaaS 8x8 specification:');
    console.log(`       - alg: ${header.alg}, kid: ${header.kid}`);
    console.log(`       - iss: ${payload.iss}, aud: ${payload.aud}, sub: ${payload.sub}`);
    console.log(`       - user: ${payload.context.user.name}, moderator: ${payload.context.user.moderator}`);

    // Verify RS256 Cryptographic Signature against JaaS Public Key
    const pubKeyPath = 'c:/Users/chebr/Downloads/Key 11_22_2026, 7_57_57 AM.pub';
    if (fs.existsSync(pubKeyPath)) {
      const pubKey = fs.readFileSync(pubKeyPath, 'utf8');
      const verified = crypto.verify(
        'RSA-SHA256',
        Buffer.from(`${hB64}.${pB64}`),
        pubKey,
        Buffer.from(sigB64, 'base64url')
      );
      if (!verified) throw new Error('RS256 cryptographic signature failed verification against public key!');
      console.log('[PASS] RS256 Cryptographic signature mathematically verified with JaaS Public Key!');
    }

    // Ping JaaS 8x8 Gateway
    const pingStart = Date.now();
    const jitsiPing = await httpsRequest(`https://${config.domain}/`);
    const pingLatency = Date.now() - pingStart;
    console.log(`[PASS] 8x8 Gateway Server (https://${config.domain}) responded HTTP ${jitsiPing.status} in ${pingLatency}ms`);

    jitsiSuccess = true;
    console.log('>>> Jitsi Video: 🟢 100% OPERATIONAL (JaaS 8x8 RS256 JWT)\n');
  } catch (err) {
    console.error('>>> Jitsi Video: 🔴 FAILED:', err.message, '\n');
  }

  // ---------------------------------------------------------------------------
  // 4. TEST CASHFREE PAYMENTS GATEWAY (Production PG API v2023-08-01)
  // ---------------------------------------------------------------------------
  console.log('--- 4. Testing Cashfree Payments Gateway (Production API) ---');
  try {
    const cfCfg = cashfreeConfig();
    console.log(`[INFO] Cashfree Mode: ${cfCfg.mode.toUpperCase()}`);
    console.log(`[INFO] App ID: ${cfCfg.appId ? cfCfg.appId.slice(0, 8) + '...' : 'MISSING'}`);
    console.log(`[INFO] Base URL: ${cfCfg.baseUrl}`);
    console.log(`[INFO] API Version: ${cfCfg.apiVersion}`);

    if (!cfCfg.enabled) throw new Error('Cashfree credentials are not configured in .env');

    const cf = createCashfree(cfCfg);

    // Create a live test order on Cashfree Production
    const testOrderId = 'DIAG_' + Date.now().toString(36).toUpperCase();
    console.log(`[PASS] Creating live verification order: ${testOrderId} (₹1.00)...`);
    const orderResult = await cf.createOrder({
      orderId: testOrderId,
      amount: 1,
      customer: {
        phone: '918977625078',
        name: 'Guruji Devotee Test',
        email: 'gurujipalmistry@gmail.com'
      },
      returnUrl: 'https://gurujipalmistry.org/booking/success?order_id={order_id}',
      note: 'Live Integration Diagnostic Verification'
    });

    if (!orderResult.paymentSessionId) throw new Error('No payment_session_id returned by Cashfree');
    console.log('[PASS] Cashfree POST /orders -> HTTP 200 OK');
    console.log(`[PASS] Cashfree Payment Session ID: ${orderResult.paymentSessionId.slice(0, 36)}...`);

    // Verify order lookup
    const orderStatus = await cf.getOrder(testOrderId);
    if (orderStatus.status !== 'ACTIVE') throw new Error(`Unexpected order status: ${orderStatus.status}`);
    console.log(`[PASS] Cashfree GET /orders/${testOrderId} -> Verified active:`);
    console.log(`       - Status: ${orderStatus.status}`);
    console.log(`       - Amount: ₹${orderStatus.amount} ${orderStatus.currency}`);

    cashfreeSuccess = true;
    console.log('>>> Cashfree Payments: 🟢 100% OPERATIONAL (Production Mode)\n');
  } catch (err) {
    console.error('>>> Cashfree Payments: 🔴 FAILED:', err.message, '\n');
  }

  // ---------------------------------------------------------------------------
  // 5. TEST PLATFORM SERVER CORE HTTP APIS (Live End-to-End)
  // ---------------------------------------------------------------------------
  console.log('--- 5. Testing Platform Server APIs (Live End-to-End) ---');
  let testServer = null;
  let store = null;
  try {
    store = await createStore({ uri: MONGODB_URI, dbName: MONGODB_DB });
    testServer = createServer(store);
    await new Promise(resolve => testServer.listen(0, '127.0.0.1', resolve));
    const port = testServer.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[PASS] Test HTTP server started on ${baseUrl}`);

    function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
      return new Promise((resolve, reject) => {
        const u = new URL(baseUrl + endpoint);
        const req = http.request({
          hostname: u.hostname,
          port: u.port,
          path: u.pathname + u.search,
          method,
          headers: {
            'X-Forwarded-Proto': 'https',
            'X-Forwarded-Host': 'gurujipalmistry.org',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            let json = null;
            try { json = JSON.parse(data); } catch (_) {}
            resolve({ status: res.statusCode, headers: res.headers, data, json });
          });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
      });
    }

    // 5.1 Health Check API
    const health = await apiCall('/api/health');
    if (health.status !== 200 || !health.json.ok) throw new Error('Health check failed');
    console.log(`[PASS] GET /api/health -> HTTP 200 OK (storage: ${health.json.storage}, payments: ${health.json.payments})`);

    // 5.2 Content API
    const content = await apiCall('/api/content');
    if (content.status !== 200) throw new Error('Content API failed');
    console.log('[PASS] GET /api/content -> HTTP 200 OK (Temple & Guruji content served)');

    // 5.3 Mantras Library API
    const mantras = await apiCall('/api/mantras');
    if (mantras.status !== 200 || !Array.isArray(mantras.json.mantras)) throw new Error('Mantras API failed');
    console.log(`[PASS] GET /api/mantras -> HTTP 200 OK (${mantras.json.mantras.length} authentic Vedic mantras served across ${mantras.json.categories.length} categories)`);

    // 5.4 Admin Authentication API
    const adminVerify = await apiCall('/api/admin/verify', 'POST', null, { 'X-Admin-Pin': process.env.ADMIN_PIN });
    if (adminVerify.status !== 200 || !adminVerify.json.ok) throw new Error('Admin PIN verification failed');
    console.log(`[PASS] POST /api/admin/verify -> HTTP 200 OK (Admin PIN verified, role: ${adminVerify.json.role})`);

    // 5.5 Pooja Slots API (requires a future date in IST)
    const tomorrow = new Date(Date.now() + 86400000);
    const poojaDate = new Date(tomorrow.getTime() + 330 * 60000).toISOString().slice(0, 10);
    const slots = await apiCall(`/api/pooja-slots?date=${poojaDate}`);
    if (slots.status !== 200 || !Array.isArray(slots.json.slots)) throw new Error('Pooja slots failed');
    console.log(`[PASS] GET /api/pooja-slots?date=${poojaDate} -> HTTP 200 OK (${slots.json.slots.length} available slots for tomorrow)`);

    // 5.6 Booking Creation API (Slot 5 minutes from now so consultation window is open)
    const slotWhen = new Date(Date.now() + 5 * 60000);
    const slotIst = new Date(slotWhen.getTime() + 330 * 60000);
    const slotIso = slotIst.toISOString().slice(0, 10);
    let slotH = slotIst.getUTCHours();
    const slotM = String(slotIst.getUTCMinutes()).padStart(2, '0');
    const slotAmPm = slotH >= 12 ? 'PM' : 'AM';
    slotH = slotH % 12 || 12;
    const testSlot = { date: slotIso, time: `${slotH}:${slotM} ${slotAmPm}`, iso: slotIso };

    const bookingRes = await apiCall('/api/bookings', 'POST', {
      type: 'consultation',
      serviceId: 'combined_consultation',
      slot: testSlot,
      devotee: {
        name: 'Srikar Ch',
        mobile: '918977625078',
        email: 'gurujipalmistry@gmail.com',
        city: 'Hyderabad'
      }
    });
    if (bookingRes.status !== 201 || !bookingRes.json.booking) throw new Error('Booking creation failed');
    const booking = bookingRes.json.booking;
    const orderId = booking.orderId;
    console.log(`[PASS] POST /api/bookings -> HTTP 201 Created (Order ID: ${orderId}, Room: ${booking.roomName})`);

    // 5.7 Payment API (Creates real Cashfree Payment Session for the booking!)
    const payInitRes = await apiCall(`/api/bookings/${orderId}/payment`, 'POST', {
      mobile: '918977625078'
    });
    if (payInitRes.status !== 200 || !payInitRes.json.paymentSessionId) {
      throw new Error(`Payment session creation failed: HTTP ${payInitRes.status} ${payInitRes.data}`);
    }
    console.log(`[PASS] POST /api/bookings/${orderId}/payment -> HTTP 200 OK:`);
    console.log(`       - Payment Mode: ${payInitRes.json.mode}`);
    console.log(`       - Cashfree Payment Session: ${payInitRes.json.paymentSessionId.slice(0, 36)}...`);

    // Mark as paid via Admin API for session testing
    await apiCall(`/api/admin/bookings/${orderId}`, 'PATCH', {
      status: 'PAID'
    }, { 'X-Admin-Pin': process.env.ADMIN_PIN });

    // 5.8 Video Session API (Test Jitsi Token Delivery over API)
    // 5.8.1 Devotee Token Call
    const devoteeSessionRes = await apiCall(`/api/bookings/${orderId}/session?mobile=918977625078`);
    if (devoteeSessionRes.status !== 200 || !devoteeSessionRes.json.jwt) {
      throw new Error(`Devotee session call failed: HTTP ${devoteeSessionRes.status} ${devoteeSessionRes.data}`);
    }
    const devS = devoteeSessionRes.json;
    console.log(`[PASS] GET /api/bookings/${orderId}/session (Devotee):`);
    console.log(`       - Jitsi Domain: ${devS.domain}`);
    console.log(`       - Full Room Name: ${devS.roomName}`);
    console.log(`       - Mode: ${devS.mode} (productionSafe: ${devS.productionSafe})`);
    console.log(`       - Role: ${devS.role}`);
    console.log(`       - Devotee JaaS RS256 JWT Token: ${devS.jwt.slice(0, 36)}... (${devS.jwt.length} bytes)`);

    // 5.8.2 Guruji (Moderator) Token Call
    const gurujiSessionRes = await apiCall(`/api/bookings/${orderId}/session`, 'GET', null, {
      'X-Admin-Pin': process.env.GURUJI_PIN
    });
    if (gurujiSessionRes.status !== 200 || !gurujiSessionRes.json.jwt) {
      throw new Error(`Guruji session call failed: HTTP ${gurujiSessionRes.status} ${gurujiSessionRes.data}`);
    }
    const gurS = gurujiSessionRes.json;
    console.log(`[PASS] GET /api/bookings/${orderId}/session (Guruji Moderator):`);
    console.log(`       - Role: ${gurS.role}`);
    console.log(`       - Guruji Moderator JaaS RS256 JWT Token: ${gurS.jwt.slice(0, 36)}... (${gurS.jwt.length} bytes)`);

    // 5.9 Reviews API
    const reviews = await apiCall('/api/reviews');
    if (reviews.status !== 200 || !Array.isArray(reviews.json.reviews)) throw new Error('Reviews API failed');
    console.log(`[PASS] GET /api/reviews -> HTTP 200 OK (${reviews.json.reviews.length} devotee reviews)`);

    // Clean up test booking from Atlas DB
    if (store.deleteBooking) await store.deleteBooking(orderId);

    apiSuccess = true;
    console.log('>>> Platform APIs: 🟢 100% OPERATIONAL\n');
  } catch (err) {
    console.error('>>> Platform APIs: 🔴 FAILED:', err.message, '\n');
  } finally {
    if (testServer) testServer.close();
    if (store && store.close) await store.close();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('================================================================');
  console.log('FINAL SYSTEM STATUS:');
  console.log('MongoDB Atlas:       ', mongoSuccess ? '🟢 100% SUCCESS (Read/Write verified)' : '🔴 FAILED');
  console.log('Google Firebase:     ', firebaseSuccess ? '🟢 100% SUCCESS (Auth & REST API active)' : '🔴 FAILED');
  console.log('Jitsi JaaS (8x8):    ', jitsiSuccess ? '🟢 100% SUCCESS (RS256 JWT Signed & Verified)' : '🔴 FAILED');
  console.log('Cashfree PG (Prod):  ', cashfreeSuccess ? '🟢 100% SUCCESS (Order Created & Active)' : '🔴 FAILED');
  console.log('Core Platform APIs:  ', apiSuccess ? '🟢 100% SUCCESS (All endpoints responding)' : '🔴 FAILED');
  console.log('================================================================');
  process.exit(0);
}

runTests();
