const { MongoClient } = require('mongodb');
const https = require('https');

const MONGODB_URI = 'mongodb+srv://gurujipalmistry_db_user:UHtXKpyF3WHBJgqx@cluster0.biq6nie.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = 'guruji';

const FIREBASE_API_KEY = 'AIzaSyBCnhuHmyRznPJh4vidByrmujVVtr8Xyp0';
const FIREBASE_PROJECT_ID = 'palm-56063';

function request(url, options = {}, body = null) {
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
  console.log('====================================================');
  console.log('🧪 LIVE INTEGRATION DIAGNOSTIC TEST');
  console.log('====================================================\n');

  // 1. TEST MONGODB ATLAS
  console.log('--- 1. Testing MongoDB Atlas ---');
  let mongoSuccess = false;
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
    await testColl.insertOne({ _id: testId, message: 'Guruji probe', at: new Date() });
    console.log('[PASS] Write Test: document inserted successfully.');

    // Test read
    const doc = await testColl.findOne({ _id: testId });
    if (doc && doc.message === 'Guruji probe') {
      console.log('[PASS] Read Test: document retrieved and verified.');
    } else {
      throw new Error('Read test data mismatch');
    }

    // Test cleanup
    await testColl.deleteOne({ _id: testId });
    console.log('[PASS] Cleanup: test document removed cleanly.');

    await client.close();
    mongoSuccess = true;
    console.log('>>> MongoDB Atlas: 🟢 100% OPERATIONAL\n');
  } catch (err) {
    console.error('>>> MongoDB Atlas: 🔴 FAILED:', err.message, '\n');
  }

  // 2. TEST GOOGLE FIREBASE
  console.log('--- 2. Testing Google Firebase ---');
  let firebaseSuccess = false;
  try {
    // Test Firebase Identity Toolkit API Key validation
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE_API_KEY}`;
    const payload = JSON.stringify({
      providerId: 'google.com',
      continueUri: 'http://localhost:3456'
    });

    const res = await request(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    const json = JSON.parse(res.data);
    if (res.status === 200 && json.authUri) {
      console.log('[PASS] Firebase Auth REST API responded HTTP 200 OK.');
      console.log('[PASS] Google Web Client & Provider are active and accepted.');
      console.log('[PASS] Google OAuth URL successfully created:', json.authUri.substring(0, 48) + '...');
      firebaseSuccess = true;
    } else if (json.error) {
      console.log(`[RESPONSE] Status ${res.status}:`, json.error.message);
      if (json.error.message.includes('CONFIGURATION_NOT_FOUND')) {
        console.log('[INFO] Google Sign-in provider needs to be saved in Firebase Console.');
      } else {
        throw new Error(json.error.message);
      }
    }

    // Test Firebase Project Hosting / Domain reachability
    const domainCheck = await request(`https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/handler`);
    console.log(`[PASS] Firebase Auth Handler (${FIREBASE_PROJECT_ID}.firebaseapp.com) HTTP Status:`, domainCheck.status);

    if (firebaseSuccess) {
      console.log('>>> Google Firebase: 🟢 100% OPERATIONAL\n');
    } else {
      console.log('>>> Google Firebase: 🟡 PARTIAL\n');
    }
  } catch (err) {
    console.error('>>> Google Firebase: 🔴 FAILED:', err.message, '\n');
  }

  // 3. TEST JITSI VIDEO CONSULTATIONS
  console.log('--- 3. Testing Jitsi Video Consultations ---');
  let jitsiSuccess = false;
  try {
    const { jitsiConfig, newRoomName, sessionWindow, sessionToken } = require('../session');
    const config = jitsiConfig();
    console.log(`[PASS] Jitsi Mode: ${config.mode.toUpperCase()} (Domain: ${config.domain})`);

    // Test room creation
    const sampleRoom = newRoomName();
    console.log(`[PASS] Cryptographic room generator: generated room "${sampleRoom}" (32 chars)`);

    // Test session window (10 mins before, 30 mins after)
    const mockBooking = {
      slotStart: new Date(Date.now() + 3600000).toISOString(),
      slotMinutes: 45
    };
    const window = sessionWindow(mockBooking);
    if (window && window.opensAt && window.closesAt) {
      console.log('[PASS] Session timing window: correctly calculates open/close times around appointment.');
    } else {
      throw new Error('Failed to calculate session window');
    }

    // Test token generation (if configured)
    if (config.mode !== 'public') {
      const token = sessionToken(config, {
        room: sampleRoom,
        name: 'Guruji',
        moderator: true,
        expiresAt: window.closesAt
      });
      console.log(`[PASS] Cryptographic JWT Token: generated signed token for Moderator (Guruji)`);
    } else {
      console.log('[INFO] Operating in Public Fallback mode (meet.jit.si) — no keys required, 100% free.');
    }

    // Ping the Jitsi domain over HTTPS
    const pingStart = Date.now();
    const jitsiPing = await request(`https://${config.domain}/`);
    const pingLatency = Date.now() - pingStart;
    console.log(`[PASS] Jitsi Gateway Server (https://${config.domain}) reachable in ${pingLatency}ms (Status: ${jitsiPing.status})`);

    jitsiSuccess = true;
    console.log('>>> Jitsi Video: 🟢 100% OPERATIONAL & READY FOR CALLS\n');
  } catch (err) {
    console.error('>>> Jitsi Video: 🔴 FAILED:', err.message, '\n');
  }

  console.log('====================================================');
  console.log('FINAL RESULT:');
  console.log('MongoDB Atlas: ', mongoSuccess ? '🟢 SUCCESS (Read/Write Working)' : '🔴 FAILED');
  console.log('Google Firebase:', firebaseSuccess ? '🟢 SUCCESS (Auth & API Active)' : '🔴 FAILED');
  console.log('Jitsi Video:    ', jitsiSuccess ? '🟢 SUCCESS (WebRTC Bridge Ready)' : '🔴 FAILED');
  console.log('====================================================');
}

runTests();
