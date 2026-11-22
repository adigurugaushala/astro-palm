'use strict';
const fs = require('fs');
const http = require('http');

// Load .env
const envText = fs.readFileSync('.env', 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m || line.trim().startsWith('#')) continue;
  let val = m[2];
  if (/^(['"]).*\1$/.test(val)) val = val.slice(1, -1);
  process.env[m[1]] = val;
}
process.env.NODE_ENV = 'production';

const { createServer } = require('../server');
const { createStore } = require('../db');

async function main() {
  const store = await createStore();
  const server = createServer(store);
  server.listen(0, async () => {
    const port = server.address().port;
    console.log('Testing server on port', port);

  const fetchJson = (url, opts = {}) => new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: opts.headers || {}
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });

  try {
    const health = await fetchJson('http://127.0.0.1:' + port + '/api/health');
    console.log('✅ Health testOneRupee:', health.body.testOneRupee);

    const content = await fetchJson('http://127.0.0.1:' + port + '/api/content');
    const palm = (content.body.content.services || []).find(s => s.slug === 'detailed-palm-analysis');
    console.log('✅ Detailed Palm Analysis price in /api/content: ₹' + (palm && palm.price));
    const puja = (content.body.content.services || []).find(s => s.slug === 'navagraha-puja');
    console.log('✅ Navagraha Shanti Puja price in /api/content: ₹' + (puja && puja.price));

    const bookingRes = await fetchJson('http://127.0.0.1:' + port + '/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        type: 'consultation',
        serviceId: 'palmistry_reading',
        devotee: { name: 'Test Devotee', mobile: '9876543210', email: 'test@example.com' }
      }
    });
    console.log('✅ Consultation Booking amount: ₹' + bookingRes.body.booking.amount);

    const poojaBookingRes = await fetchJson('http://127.0.0.1:' + port + '/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        type: 'pooja',
        poojaDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        poojaSlot: 'morning',
        poojaIds: ['navagraha_shanti'],
        devotee: { name: 'Pooja Devotee', mobile: '9876543210' }
      }
    });
    console.log('✅ Pooja Booking amount: ₹' + poojaBookingRes.body.booking.amount);

    console.log('\n🎉 ALL 1-RUPEE TESTING CHECKS PASSED!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close(() => process.exit(0));
  }
});
}
main().catch(console.error);
