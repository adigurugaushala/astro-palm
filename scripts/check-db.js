#!/usr/bin/env node
/**
 * Checks that MONGODB_URI reaches the database, and says plainly what is wrong
 * when it does not. Run it with:  npm run db:check
 *
 * It reads .env (like the server does) and never prints the password.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'guruji';
const hide = (s) => String(s).replace(/\/\/([^:]+):[^@]*@/, '//$1:***@');

if (!uri) {
  console.log('MONGODB_URI is not set. The site will use local JSON files in ./data');
  process.exit(1);
}
if (uri.includes('<db_password>')) {
  console.log('MONGODB_URI still contains the <db_password> placeholder. Replace it with the real password.');
  process.exit(1);
}

(async () => {
  const { MongoClient } = require('mongodb');
  console.log(`Connecting to ${hide(uri)} (database: ${dbName}) …`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.command({ ping: 1 });
    const names = (await db.listCollections().toArray()).map(c => c.name).sort();
    console.log('Connected.');
    console.log('Collections:', names.length ? names.join(', ') : '(none yet — they are created on first use)');
    const counts = {};
    for (const c of ['bookings', 'enquiries', 'mantras', 'content', 'media', 'reviews']) {
      if (names.includes(c)) counts[c] = await db.collection(c).countDocuments();
    }
    if (Object.keys(counts).length) console.log('Documents:', JSON.stringify(counts));
    // a round trip proves the user can write, not only read
    await db.collection('_connection_check').insertOne({ at: new Date() });
    await db.collection('_connection_check').drop();
    console.log('Read and write both work. The site is ready to use this database.');
    process.exitCode = 0;
  } catch (err) {
    const m = String(err.message || err);
    console.log('Could not use the database.');
    if (/bad auth|Authentication failed/i.test(m)) {
      console.log('→ The username or password is wrong. Check the database user in Atlas → Database Access.');
    } else if (/ENOTFOUND|querySrv/i.test(m)) {
      console.log('→ The cluster address could not be resolved. Check the host in the connection string, and that this machine has internet access.');
    } else if (/IP|not allowed|whitelist/i.test(m)) {
      console.log('→ This machine\'s IP address is not allowed. Atlas → Network Access → add your IP, and 0.0.0.0/0 for a serverless host such as Vercel.');
    } else if (/not authorized/i.test(m)) {
      console.log(`→ The user connected but may not have access to "${dbName}". Give it readWrite on that database in Atlas → Database Access.`);
    } else if (/timed out|ETIMEDOUT/i.test(m)) {
      console.log('→ Timed out. This is usually Atlas → Network Access blocking the IP address, or a firewall on port 27017.');
    }
    console.log('Details:', hide(m).slice(0, 300));
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
})();
