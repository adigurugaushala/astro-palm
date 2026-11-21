#!/usr/bin/env node
// Is this server ready to take real devotees? Run on the host after deploying:
//   npm run preflight
// It never prints a secret — only whether each one is set and whether it works.
'use strict';

const path = require('path');
const fs = require('fs');

// .env, loaded the same way server.js loads it
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const rows = [];
const add = (what, ok, detail) => rows.push({ what, ok, detail });
const set = (k) => !!(process.env[k] && process.env[k].trim() && !process.env[k].includes('<'));

(async () => {
  // Node
  const major = Number(process.versions.node.split('.')[0]);
  add('Node.js 18 or newer', major >= 18, 'running ' + process.versions.node);

  // Dependencies
  let deps = true;
  for (const m of ['mongodb', 'astronomia', 'pdfkit']) {
    try { require.resolve(m); } catch (e) { deps = false; }
  }
  add('Dependencies installed', deps, deps ? 'mongodb, astronomia, pdfkit' : 'run npm install --omit=dev');

  // Database
  if (!set('MONGODB_URI')) {
    add('MONGODB_URI', false, 'not set — storage would be temporary files and payments stay off');
  } else {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || 'guruji');
      await db.command({ ping: 1 });
      const n = await db.collection('bookings').estimatedDocumentCount();
      add('MongoDB reachable', true, `database "${db.databaseName}", ${n} booking(s)`);
    } catch (e) {
      const hint = /auth/i.test(e.message) ? 'wrong user or password'
        : /ENOTFOUND|querySrv/i.test(e.message) ? 'host not found — check the connection string'
        : /timed out|ETIMEDOUT/i.test(e.message) ? "this server's IP is probably not in Atlas → Network Access"
        : e.message.slice(0, 80);
      add('MongoDB reachable', false, hint);
    } finally { await client.close().catch(() => {}); }
  }

  // Staff PINs
  add('ADMIN_PIN set', set('ADMIN_PIN'), set('ADMIN_PIN') ? `${process.env.ADMIN_PIN.length} characters` : 'the admin dashboard would use the built-in default');
  add('GURUJI_PIN set', set('GURUJI_PIN'), set('GURUJI_PIN') ? `${process.env.GURUJI_PIN.length} characters` : "Guruji's case area would be unreachable");

  // Payments
  const cf = set('CASHFREE_APP_ID') && set('CASHFREE_SECRET_KEY');
  add('Cashfree keys set', cf, cf ? `environment: ${process.env.CASHFREE_ENV || 'sandbox'}` : 'payments run in simulated mode');
  if (cf && (process.env.CASHFREE_ENV || 'sandbox') !== 'production') {
    add('Cashfree environment', false, 'CASHFREE_ENV is not "production" — no real money will move');
  }

  // Sessions
  const jaas = set('JITSI_APP_ID') && set('JITSI_KID') && set('JITSI_PRIVATE_KEY');
  const selfHosted = set('JITSI_DOMAIN') && set('JITSI_APP_ID') && set('JITSI_APP_SECRET');
  add('Private consultation rooms', jaas || selfHosted,
    jaas ? 'Jitsi as a Service (JaaS)' : selfHosted ? 'self-hosted Jitsi with JWT'
         : 'no keys — rooms fall back to the public meet.jit.si, where anyone with the link can enter');

  // Listening
  add('HOST', true, (process.env.HOST || '127.0.0.1') + (process.env.HOST === '0.0.0.0'
    ? ' (managed hosting)' : ' (behind a reverse proxy — set HOST=0.0.0.0 on managed hosting)'));
  add('PORT', true, String(process.env.PORT || 3456));

  const pad = Math.max(...rows.map(r => r.what.length));
  console.log('\nGuruji Palmistry — deployment preflight\n');
  for (const r of rows) console.log(` ${r.ok ? '✓' : '✗'}  ${r.what.padEnd(pad)}  ${r.detail}`);
  const blocking = rows.filter(r => !r.ok);
  console.log('');
  if (!blocking.length) { console.log('Ready. Open /api/health to confirm the same from the outside.\n'); process.exit(0); }
  console.log(`${blocking.length} item(s) to fix before taking real bookings:`);
  for (const r of blocking) console.log('  - ' + r.what);
  console.log('');
  process.exit(1);
})();
