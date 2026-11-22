// GURUJI — web server
// Serves the site and the JSON API. Storage is MongoDB when MONGODB_URI is set
// (see .env.example), otherwise local JSON files in ./data.

'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Configuration (.env is loaded without extra dependencies)
// ---------------------------------------------------------------------------
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
loadEnvFile(path.join(__dirname, '.env'));

const { createStore } = require('./db');
const DEFAULT_CONTENT = require('./content-data');
const { cashfreeConfig, createCashfree, PaymentGatewayError } = require('./payments');
const { jitsiConfig, newRoomName, sessionToken, sessionWindow, OPEN_BEFORE_MIN, CLOSE_AFTER_MIN, DEFAULT_MINUTES } = require('./session');
const { computeChart } = require('./chart');
const { buildReportPdf } = require('./report');
const { courseOutline, courseLessons } = require('./course-lessons');

const BASE_DIR = __dirname;
const PORT = Number(process.env.PORT) || 3456;
const HOST = process.env.HOST || '127.0.0.1';
// Admin access. On a hosted deployment the admin area stays locked until ADMIN_PIN is set.
const ADMIN_PIN = process.env.ADMIN_PIN || (process.env.VERCEL ? '' : '1008');
const EDITOR_PIN = process.env.EDITOR_PIN || '';   // optional second role: can edit site content, cannot see bookings
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'gsrikar888@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);
const verifiedAdminTokens = new Map();
const CASHFREE = cashfreeConfig();
const JITSI = jitsiConfig();
// Guruji signs in to his own case area with this PIN; the owner PIN works there too.
const GURUJI_PIN = process.env.GURUJI_PIN || '';
// 'cashfree' when Cashfree keys are configured; otherwise 'simulated' (test mode, no money moves)
const PAYMENT_MODE = process.env.PAYMENT_MODE || (CASHFREE.enabled ? 'cashfree' : 'simulated');
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_MEDIA_BODY_BYTES = 3 * 1024 * 1024;

if (!process.env.ADMIN_PIN) {
  console.warn(process.env.VERCEL
    ? '[server] ADMIN_PIN is not set — the admin area is disabled. Add ADMIN_PIN in Vercel → Settings → Environment Variables.'
    : '[server] ADMIN_PIN is not set — using the local default PIN. Set ADMIN_PIN in .env before going live.');
}
if (PAYMENT_MODE === 'cashfree' && !CASHFREE.enabled) {
  console.warn('[server] PAYMENT_MODE=cashfree but CASHFREE_APP_ID / CASHFREE_SECRET_KEY are missing.');
}
if (CASHFREE.enabled) {
  console.log(`[server] Cashfree payments enabled (${CASHFREE.mode}, API ${CASHFREE.apiVersion}).`);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json'
};

// Files that must never be served to the browser
const PRIVATE_PATHS = [
  // Server-side modules. course-lessons.js holds the paid lesson text, so it
  // matters as much as the keys in payments.js.
  /^\/(server|db|payments|session|chart|report|course-lessons)\.js$/,
  /^\/api\//, /^\/vercel\.json$/, /^\/package(-lock)?\.json$/, /\.md$/i, /\.env/i,
  /^\/scripts\//, /^\/data\//, /^\/test\//, /^\/docs\//, /^\/deploy\//,
  /^\/node_modules\//, /^\/design-references\//, /\/\./
];

// ---------------------------------------------------------------------------
// Catalogue — prices are decided here, never trusted from the browser
// ---------------------------------------------------------------------------
const CONSULTATIONS = {
  palmistry_reading:     { title: 'Detailed Palm Analysis', price: 549, duration: '30 Mins' },
  astrology_correlation: { title: 'Comprehensive Kundali Analysis', price: 549, duration: '30 Mins' },
  combined_consultation: { title: 'Astro-Palmistry Correlation', price: 749, duration: '45 Mins' },
  followup_session:      { title: '15-Min Follow-up Consultation', price: 750, duration: '15 Mins' }
};
const POOJAS = {
  ganapathi_homam:      { name: 'Ganapathi Homam', price: 3100 },
  navagraha_shanti:     { name: 'Navagraha Shanti', price: 5100 },
  shani_shanti:         { name: 'Shani Shanti', price: 2100 },
  pitru_runa_vimochana: { name: 'Pitru Runa Vimochana', price: 5100 },
  ayushya_homam:        { name: 'Ayushya Homam', price: 3100 },
  santana_prapti:       { name: 'Santana Prapti', price: 4100 }
};

// Pooja time slots and how many families each slot can take on one day
const POOJA_SLOTS = [
  { id: 'pratah',    label: '6:00 – 8:00 AM',     name: 'Pratah Kaal' },
  { id: 'morning',   label: '8:00 – 10:00 AM',    name: 'Morning' },
  { id: 'madhyahna', label: '10:00 AM – 12:00 PM', name: 'Madhyahna' },
  { id: 'sandhya',   label: '5:00 – 7:00 PM',     name: 'Sandhya Kaal' }
];
const POOJA_SLOT_CAPACITY = Math.max(1, Number(process.env.POOJA_SLOT_CAPACITY) || 3);
const POOJA_BOOKING_WINDOW_DAYS = 90;
const PENDING_HOLD_MINUTES = 15; // an unpaid booking keeps its slot this long

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
class HttpError extends Error {
  // message is a plain string, or { code, message, ...extra } when the browser
  // needs to tell one 409 from another
  constructor(status, message) {
    super(typeof message === 'string' ? message : message.message);
    this.status = status;
    if (message && typeof message === 'object') Object.assign(this, message);
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  // On Vercel the platform may already have read and parsed the body
  if ('body' in req) {
    let parsed;
    try { parsed = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body; }
    catch (e) { return Promise.reject(new HttpError(400, 'Invalid JSON payload')); }
    if (parsed === undefined || parsed === null) parsed = {};
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return Promise.reject(new HttpError(400, 'Invalid JSON payload'));
    return Promise.resolve(parsed);
  }
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) { reject(new HttpError(413, 'Payload too large')); req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
        resolve(parsed);
      } catch (e) { reject(new HttpError(400, 'Invalid JSON payload')); }
    });
    req.on('error', reject);
  });
}

/** A latitude or longitude, or null when it is missing or out of range. */
const coord = (v, limit) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? Math.round(n * 1e6) / 1e6 : null;
};
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const nowIso = () => new Date().toISOString();

/** Today's date in India as YYYY-MM-DD (pooja dates are local to the temple). */
function todayIST(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
/** Returns an error message, or null when the pooja date is bookable. */
function poojaDateProblem(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || isNaN(Date.parse(date))) return 'Please choose the pooja date';
  if (date < todayIST(1)) return 'Pooja dates can be booked from tomorrow onwards';
  if (date > todayIST(POOJA_BOOKING_WINDOW_DAYS)) return `Pooja dates can be booked up to ${POOJA_BOOKING_WINDOW_DAYS} days ahead`;
  return null;
}
const pendingSinceIso = () => new Date(Date.now() - PENDING_HOLD_MINUTES * 60000).toISOString();

async function slotAvailability(store, date) {
  const since = pendingSinceIso();
  return Promise.all(POOJA_SLOTS.map(async slot => {
    const taken = await store.countPoojaSlot(date, slot.id, since);
    const remaining = Math.max(0, POOJA_SLOT_CAPACITY - taken);
    return { ...slot, remaining, available: remaining > 0 };
  }));
}

function normaliseMobile(v) {
  const digits = String(v || '').replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function newOrderId(type) {
  const prefix = type === 'pooja' ? 'PJA' : type === 'course' ? 'CRS' : 'PLM';
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `GURUJI-${prefix}-${stamp}${rand}`;
}

function safeEqual(given, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
/** Verify a Firebase Google ID Token with Google Identity Toolkit */
async function verifyFirebaseToken(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey || !idToken) return null;
  const payload = JSON.stringify({ idToken });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:lookup?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200 && json.users && json.users[0]) {
            resolve(json.users[0]);
          } else {
            resolve(null);
          }
        } catch (_) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

/** 'owner' (everything), 'guruji' (cases, chat, sessions), 'editor' (site content) or null. */
function adminRole(req) {
  const pin = req.headers['x-admin-pin'];
  if (safeEqual(pin, ADMIN_PIN)) return 'owner';
  if (safeEqual(pin, GURUJI_PIN)) return 'guruji';
  if (safeEqual(pin, EDITOR_PIN)) return 'editor';
  const token = req.headers['x-admin-token'];
  if (token && verifiedAdminTokens.has(token)) {
    const entry = verifiedAdminTokens.get(token);
    if (Date.now() < entry.expiresAt) return entry.role;
    verifiedAdminTokens.delete(token);
  }
  return null;
}
/** Staff who may open a case: Guruji, or the owner. */
function requireGuruji(req) {
  const role = adminRole(req);
  if (!role) throw new HttpError(401, 'Sign in to open this case');
  if (!['guruji', 'owner'].includes(role)) throw new HttpError(403, 'Only Guruji can open a case');
  return role;
}
/** Owners can do everything; editors can manage content (mantras, pages, images). */
function requireAdmin(req, need = 'owner') {
  if (!ADMIN_PIN && !ADMIN_EMAILS.length) throw new HttpError(503, 'The admin area is not configured yet (no PIN or admin email set)');
  const role = adminRole(req);
  if (!role) throw new HttpError(401, 'Admin authorization required');
  if (need === 'owner' && role !== 'owner') throw new HttpError(403, 'Only the owner account can do this');
  if (need === 'editor' && !['owner', 'editor'].includes(role)) throw new HttpError(403, 'This account cannot edit the site content');
  return role;
}

// Simple per-IP, per-endpoint limit for write endpoints (protects the database from spam).
// RATE_LIMIT_MULTIPLIER raises every limit — useful behind a shared office IP, and in tests.
const RATE_LIMIT_MULTIPLIER = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);
function createRateLimiter() {
  const hits = new Map();
  return function rateLimit(req, bucket, baseLimit = 30, windowMs = 60_000) {
    const limit = baseLimit * RATE_LIMIT_MULTIPLIER;
    const key = (req.socket.remoteAddress || 'unknown') + '|' + bucket;
    const now = Date.now();
    const entry = hits.get(key) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    hits.set(key, entry);
    if (hits.size > 10_000) hits.clear(); // bound memory
    if (entry.count > limit) throw new HttpError(429, 'Too many requests — please wait a minute and try again');
  };
}

/** Public view of a booking (no internal history). */
const publicBooking = (b) => {
  if (!b) return b;
  const { history, adminNote, ...rest } = b;
  return rest;
};

// Keep the offline seed file the browser loads in sync with the library
async function writeMantrasSeedFile(store) {
  if (process.env.VERCEL) return; // static files are served from Vercel's CDN; the browser refreshes from /api/mantras
  try {
    const data = await store.getMantraLibrary();
    const jsContent = `// GURUJI - Mantras & Stotras Comprehensive Vedic Library Data Store\n` +
      `// Generated by server.js from the mantras database — do not edit by hand.\n\n` +
      `const GURUJI_MANTRAS_CATEGORIES = ${JSON.stringify(data.categories, null, 2)};\n\n` +
      `const GURUJI_MANTRAS_SEED = ${JSON.stringify(data.mantras, null, 2)};\n`;
    fs.writeFileSync(process.env.GURUJI_SEED_FILE || path.join(BASE_DIR, 'mantras-data.js'), jsContent, 'utf8');
  } catch (e) {
    console.error('[server] Could not refresh mantras-data.js:', e.message);
  }
}

// ---------------------------------------------------------------------------
// Site content (defaults in content-data.js, edits from the admin dashboard)
// ---------------------------------------------------------------------------
const CONTENT_SECTIONS = Object.keys(DEFAULT_CONTENT).filter(k => k !== 'version');
const LIST_SECTIONS_WITH_PUBLISH = ['services', 'courses', 'articles', 'testimonials'];
const SLUG_RX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Cached on the store, so a warm instance does not re-read the database on every request
async function getContent(store) {
  const cache = store.__contentCache;
  if (cache && Date.now() - cache.at < 15000) return cache.value;
  let overrides = {};
  try { overrides = await store.getContentOverrides(); } catch (e) { console.error('[server] content overrides unavailable:', e.message); }
  const merged = { ...DEFAULT_CONTENT };
  for (const k of CONTENT_SECTIONS) if (overrides[k] !== undefined) merged[k] = overrides[k];
  store.__contentCache = { at: Date.now(), value: merged };
  return merged;
}
function publicContent(content) {
  const out = {};
  for (const k of CONTENT_SECTIONS) {
    out[k] = LIST_SECTIONS_WITH_PUBLISH.includes(k) && Array.isArray(content[k])
      ? content[k].filter(item => item && item.published !== false)
      : content[k];
  }
  return out;
}

/** Checks an edited section before it is saved; returns the cleaned value. */
function validateContentSection(section, value) {
  if (!CONTENT_SECTIONS.includes(section)) throw new HttpError(404, 'Unknown content section');
  const def = DEFAULT_CONTENT[section];
  if (Array.isArray(def) !== Array.isArray(value) || typeof value !== 'object' || value === null) {
    throw new HttpError(422, `Section "${section}" must be ${Array.isArray(def) ? 'a list' : 'an object'}`);
  }
  if (['services', 'courses', 'articles'].includes(section)) {
    const seen = new Set();
    value.forEach((item, i) => {
      if (!item || typeof item !== 'object') throw new HttpError(422, `Item ${i + 1} is not valid`);
      if (!str(item.title)) throw new HttpError(422, `Item ${i + 1} needs a title`);
      if (!SLUG_RX.test(item.slug || '')) throw new HttpError(422, `"${item.title}": the URL slug may only use lowercase letters, numbers and dashes`);
      if (seen.has(item.slug)) throw new HttpError(422, `Two items use the slug "${item.slug}"`);
      seen.add(item.slug);
      if (item.price !== null && item.price !== undefined && item.price !== '' && !(Number(item.price) >= 0)) {
        throw new HttpError(422, `"${item.title}": price must be a number, or empty for "price on request"`);
      }
      item.price = item.price === '' || item.price === undefined ? null : item.price === null ? null : Math.round(Number(item.price));
    });
  }
  return value;
}

/** Bookable consultation: legacy id (palmistry_reading …) or a service slug with an online price. */
async function findConsultation(store, serviceId) {
  const content = await getContent(store);
  const svc = (content.services || []).find(s => s.published !== false && s.bookingType === 'consultation' &&
    (s.consultationId === serviceId || s.slug === serviceId));
  if (svc) {
    if (!(Number(svc.price) > 0)) throw new HttpError(422, 'This service is booked by enquiry — please use the enquiry form');
    return { id: serviceId, title: svc.title, price: Number(svc.price), duration: svc.duration || '' };
  }
  const legacy = CONSULTATIONS[serviceId];
  return legacy ? { id: serviceId, ...legacy } : null;
}
/** Online pooja price: admin-edited service price when set, otherwise the built-in catalogue. */
async function findPooja(store, poojaId) {
  const base = POOJAS[poojaId];
  if (!base) return null;
  const content = await getContent(store);
  const svc = (content.services || []).find(s => s.poojaId === poojaId);
  if (svc && svc.published === false) return null;
  const price = svc && Number(svc.price) > 0 ? Number(svc.price) : base.price;
  return { id: poojaId, name: base.name, price };
}

/** "10:45 AM" or "6:00" plus a date in IST → an ISO instant, or '' if it cannot be read. */
function slotStartISO(dateISO, timeText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO || '')) return '';
  const m = String(timeText || '').match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!m) return '';
  let hour = Number(m[1]) % 12;
  if ((m[3] || '').toUpperCase() === 'PM') hour += 12;
  if (!m[3] && Number(m[1]) > 12) hour = Number(m[1]);
  const minute = Number(m[2] || 0);
  // the times are India Standard Time, which is UTC+5:30 all year
  const utc = Date.UTC(...dateISO.split('-').map(Number).map((v, i) => (i === 1 ? v - 1 : v)), hour, minute) - 330 * 60000;
  return new Date(utc).toISOString();
}

/** "45 Mins" / "30 minutes" / "45–60 Mins Ritual" → minutes. */
function minutesFromDuration(text) {
  const m = String(text || '').match(/(\d{2,3})/g);
  return m ? Number(m[m.length - 1]) : DEFAULT_MINUTES;
}

/**
 * Who is asking about this booking.
 * Returns { who:'guruji'|'devotee', name, moderator }, null when the mobile
 * does not match, or undefined when nothing was offered at all (so the caller
 * can answer 401 rather than 404).
 */
function bookingActor(req, booking, body = {}) {
  const role = adminRole(req);
  if (role === 'guruji' || role === 'owner') return { who: 'guruji', name: 'Guruji', moderator: true };
  const mobile = normaliseMobile(body.mobile);
  if (!mobile) return undefined;
  if (!booking) return null;
  return booking.devotee && booking.devotee.mobile === mobile
    ? { who: 'devotee', name: booking.devotee.name || 'Devotee', moderator: false }
    : null;
}

function newReference(prefix) {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `${prefix}-${stamp}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

/** Optional e-mail notification through Resend (RESEND_API_KEY + NOTIFY_EMAIL). Never blocks a booking. */
async function notifyOwner(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'Guruji Palmistry <onboarding@resend.dev>',
        to: to.split(',').map(x => x.trim()).filter(Boolean),
        subject,
        text: lines.filter(Boolean).join('\n')
      }),
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (e) {
    console.error('[server] notification e-mail failed:', e.message);
    return false;
  }
}

/** Public site address used in payment return links. */
function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http')).split(',')[0];
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0];
  return `${proto}://${host}`;
}

const BOOKING_STATUSES = ['PENDING_PAYMENT', 'PAYMENT_FAILED', 'PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
// A session room only opens for a booking that is paid and not cancelled
const SESSION_STATUSES = ['PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT'];
const PAID_STATUSES = ['PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT', 'COMPLETED'];
const progressOf = (lessons, done) => {
  const total = lessons.length;
  const finished = lessons.filter(l => done[l.id]).length;
  return { done: finished, total, percent: total ? Math.round(finished * 100 / total) : 0 };
};
// What Guruji sees in his case list
const CASE_STATUSES = ['PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT', 'COMPLETED'];
const ENQUIRY_STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CLOSED', 'CANCELLED'];
const ENQUIRY_KINDS = ['booking', 'course', 'contact'];
const MEDIA_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------
function buildApi(store, { gateway = createCashfree(CASHFREE) } = {}) {
  const rateLimit = createRateLimiter();

  /** Asks Cashfree for the real status of a booking's payment and records it. */
  async function syncPayment(booking) {
    if (!booking.payment || booking.payment.provider !== 'cashfree' || !booking.payment.gatewayOrderId) return booking;
    if (!['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(booking.status)) return booking;
    const order = await gateway.getOrder(booking.payment.gatewayOrderId);
    const at = nowIso();
    if (order.status === 'PAID') {
      if (Math.abs(order.amount - booking.amount) > 0.5) {
        console.error(`[payments] amount mismatch on ${booking.orderId}: paid ${order.amount}, expected ${booking.amount}`);
        return booking;
      }
      const updated = await store.updateBooking(booking.orderId, {
        status: 'PAID', updatedAt: at,
        payment: { ...booking.payment, status: 'SUCCESS', paidAt: at }
      }, { at, event: 'payment_success', by: 'cashfree' });
      await notifyOwner(`Paid booking ${booking.orderId} — ₹${booking.amount}`, [
        `Service: ${booking.service && booking.service.title}`, `Name: ${booking.devotee.name}`, `Mobile: ${booking.devotee.mobile}`,
        booking.poojaDate ? `Pooja date: ${booking.poojaDate} (${booking.poojaSlot && booking.poojaSlot.label})` : ''
      ]);
      return updated;
    }
    if (['EXPIRED', 'TERMINATED'].includes(order.status) && booking.status === 'PENDING_PAYMENT') {
      return store.updateBooking(booking.orderId, {
        status: 'PAYMENT_FAILED', updatedAt: at, payment: { ...booking.payment, status: 'FAILED', failedAt: at }
      }, { at, event: 'payment_failed', by: 'cashfree' });
    }
    return booking;
  }

  return [
    // Health -----------------------------------------------------------------
    ['GET', /^\/api\/health$/, async () => [200, {
      ok: true, storage: store.mode, payments: PAYMENT_MODE,
      paymentEnv: PAYMENT_MODE === 'cashfree' ? CASHFREE.mode : undefined,
      paymentsReady: PAYMENT_MODE !== 'cashfree' ? undefined : store.mode !== 'file-temporary',
      sessions: JITSI.mode, sessionsProductionSafe: JITSI.production
    }]],

    // Search engines ---------------------------------------------------------
    ['GET', /^\/robots\.txt$/, async (req) => {
      const origin = siteOrigin(req);
      return [200, { __raw: Buffer.from(
        `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /payment/\n\nSitemap: ${origin}/sitemap.xml\n`), type: 'text/plain; charset=utf-8' }];
    }],

    ['GET', /^\/sitemap\.xml$/, async (req) => {
      const origin = siteOrigin(req);
      const content = await getContent(store);
      const pages = [
        ['/', '1.0', 'weekly'], ['/about', '0.8', 'monthly'], ['/services', '0.9', 'weekly'],
        ['/reiki-healing', '0.9', 'monthly'], ['/courses', '0.8', 'weekly'], ['/resources', '0.8', 'weekly'],
        ['/faqs', '0.6', 'monthly'], ['/contact', '0.7', 'monthly'], ['/palmistry', '0.7', 'monthly'],
        ['/mantras', '0.6', 'monthly'], ['/book/consultation', '0.7', 'monthly'], ['/book/pooja', '0.7', 'monthly'],
        ['/privacy-policy', '0.3', 'yearly'], ['/terms', '0.3', 'yearly'], ['/cancellation-refund-policy', '0.3', 'yearly']
      ];
      for (const c of content.serviceCategories || []) pages.push([c.link || `/services/category/${c.id}`, '0.7', 'monthly']);
      for (const x of content.services || []) if (x.published !== false) pages.push([`/services/${x.slug}`, x.core ? '0.9' : '0.6', 'monthly']);
      for (const x of content.courses || []) if (x.published !== false) pages.push([`/courses/${x.slug}`, '0.6', 'monthly']);
      for (const x of content.articles || []) if (x.published !== false) pages.push([`/resources/${x.slug}`, '0.6', 'monthly', x.date]);
      const seen = new Set();
      const body = pages.filter(([loc]) => !seen.has(loc) && seen.add(loc)).map(([loc, pri, freq, mod]) =>
        `  <url><loc>${origin}${loc}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}<changefreq>${freq}</changefreq><priority>${pri}</priority></url>`).join('\n');
      return [200, { __raw: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`), type: 'application/xml; charset=utf-8' }];
    }],

    // Site content -----------------------------------------------------------
    ['GET', /^\/api\/content$/, async (req) => {
      rateLimit(req, 'content', 600);
      return [200, { content: publicContent(await getContent(store)) }];
    }],

    // Uploaded images
    ['GET', /^\/api\/media\/([a-z0-9-]+)$/, async (req, [, id]) => {
      const item = await store.getMedia(id);
      if (!item) throw new HttpError(404, 'Image not found');
      return [200, { __raw: Buffer.from(item.data, 'base64'), type: item.type }];
    }],

    // Admin ------------------------------------------------------------------
    // Tells the browser which door the PIN opens: owner, guruji or editor
    ['POST', /^\/api\/admin\/verify$/, async (req) => {
      rateLimit(req, 'admin', 20);
      const body = await readJsonBody(req).catch(() => ({}));
      if (body && body.idToken) {
        const user = await verifyFirebaseToken(body.idToken);
        if (user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          const sessionToken = crypto.randomBytes(32).toString('hex');
          verifiedAdminTokens.set(sessionToken, { email: user.email, role: 'owner', expiresAt: Date.now() + 3600000 });
          return [200, { ok: true, role: 'owner', email: user.email, token: sessionToken }];
        }
        const userEmail = user && user.email ? user.email : 'Google Account';
        throw new HttpError(403, `Access denied for ${userEmail}. Only registered temple admins can sign in.`);
      }
      if (!ADMIN_PIN && !GURUJI_PIN && !EDITOR_PIN && !ADMIN_EMAILS.length) throw new HttpError(503, 'The staff area is not configured yet (no PIN or admin email is set)');
      const role = adminRole(req);
      if (!role) throw new HttpError(401, 'That PIN was not recognised');
      return [200, { ok: true, role }];
    }],

    ['GET', /^\/api\/admin\/content$/, async (req) => {
      requireAdmin(req, 'editor');
      const content = await getContent(store);
      const overrides = await store.getContentOverrides();
      return [200, { content, edited: Object.keys(overrides), sections: CONTENT_SECTIONS }];
    }],

    ['PUT', /^\/api\/admin\/content\/([A-Za-z]+)$/, async (req, [, section]) => {
      const role = requireAdmin(req, 'editor');
      const body = await readJsonBody(req);
      const value = validateContentSection(section, body.value);
      await store.setContentSection(section, value, { updatedBy: role });
      store.__contentCache = null;
      return [200, { success: true, section, value }];
    }],

    ['DELETE', /^\/api\/admin\/content\/([A-Za-z]+)$/, async (req, [, section]) => {
      requireAdmin(req, 'editor');
      if (!CONTENT_SECTIONS.includes(section)) throw new HttpError(404, 'Unknown content section');
      await store.deleteContentSection(section);
      store.__contentCache = null;
      return [200, { success: true, section, value: DEFAULT_CONTENT[section] }];
    }],

    ['GET', /^\/api\/admin\/media$/, async (req) => {
      requireAdmin(req, 'editor');
      return [200, { media: await store.listMedia() }];
    }],

    ['POST', /^\/api\/admin\/media$/, async (req) => {
      requireAdmin(req, 'editor');
      rateLimit(req, 'media', 20);
      const body = await readJsonBody(req, MAX_MEDIA_BODY_BYTES);
      const type = str(body.type, 40);
      if (!MEDIA_TYPES[type]) throw new HttpError(422, 'Please upload a JPG, PNG, WebP or GIF image');
      const data = String(body.data || '').replace(/^data:[^,]+,/, '');
      const bytes = Buffer.from(data, 'base64');
      if (!bytes.length) throw new HttpError(422, 'The image is empty');
      if (bytes.length > 2 * 1024 * 1024) throw new HttpError(413, 'Images must be 2 MB or smaller');
      const id = 'img-' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
      const item = { id, name: str(body.name, 120) || id + MEDIA_TYPES[type], type, size: bytes.length, data: bytes.toString('base64'), createdAt: nowIso() };
      await store.saveMedia(item);
      const { data: _omit, ...meta } = item;
      return [201, { success: true, media: { ...meta, url: `/api/media/${id}` } }];
    }],

    ['DELETE', /^\/api\/admin\/media\/([a-z0-9-]+)$/, async (req, [, id]) => {
      requireAdmin(req, 'editor');
      if (!(await store.deleteMedia(id))) throw new HttpError(404, 'Image not found');
      return [200, { success: true }];
    }],

    ['GET', /^\/api\/admin\/bookings$/, async (req, m, url) => {
      requireAdmin(req, 'owner');
      const f = { status: str(url.searchParams.get('status'), 30), type: str(url.searchParams.get('type'), 20), q: str(url.searchParams.get('q'), 60) };
      return [200, { bookings: await store.listBookings(f, 300), statuses: BOOKING_STATUSES }];
    }],

    ['PATCH', /^\/api\/admin\/bookings\/([A-Z0-9-]+)$/, async (req, [, orderId]) => {
      requireAdmin(req, 'owner');
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      if (!booking) throw new HttpError(404, 'Booking not found');
      const at = nowIso();
      const set = { updatedAt: at };
      if (body.status !== undefined) {
        if (!BOOKING_STATUSES.includes(body.status)) throw new HttpError(422, 'Unknown status');
        set.status = body.status;
      }
      const note = str(body.note, 500);
      if (note) set.adminNote = note;
      const updated = await store.updateBooking(orderId, set, { at, event: 'admin_update', status: set.status, note, by: 'owner' });
      return [200, { success: true, booking: updated }];
    }],

    ['GET', /^\/api\/admin\/enquiries$/, async (req, m, url) => {
      requireAdmin(req, 'owner');
      const f = { status: str(url.searchParams.get('status'), 30), type: str(url.searchParams.get('kind'), 20), q: str(url.searchParams.get('q'), 60) };
      return [200, { enquiries: await store.listEnquiries(f, 300), statuses: ENQUIRY_STATUSES }];
    }],

    ['PATCH', /^\/api\/admin\/enquiries\/([A-Z0-9-]+)$/, async (req, [, ref]) => {
      requireAdmin(req, 'owner');
      const body = await readJsonBody(req);
      const enquiry = await store.getEnquiry(ref);
      if (!enquiry) throw new HttpError(404, 'Enquiry not found');
      const at = nowIso();
      const set = { updatedAt: at };
      if (body.status !== undefined) {
        if (!ENQUIRY_STATUSES.includes(body.status)) throw new HttpError(422, 'Unknown status');
        set.status = body.status;
      }
      const note = str(body.note, 500);
      if (note) set.adminNote = note;
      const updated = await store.updateEnquiry(ref, set, { at, event: 'admin_update', status: set.status, note });
      return [200, { success: true, enquiry: updated }];
    }],

    // Enquiries (contact form, service / course booking requests) -----------
    ['POST', /^\/api\/enquiries$/, async (req) => {
      rateLimit(req, 'enquiry', 10);
      const b = await readJsonBody(req);
      if (str(b.website)) throw new HttpError(422, 'Please try again'); // honeypot field — real visitors never fill it
      const contact = {
        name: str(b.name, 120), email: str(b.email, 160).toLowerCase(), phone: normaliseMobile(b.phone),
        whatsapp: b.whatsapp === undefined ? true : !!b.whatsapp
      };
      if (contact.name.length < 2) throw new HttpError(422, 'Please enter your full name');
      if (!contact.phone) throw new HttpError(422, 'Please enter a valid 10-digit Indian mobile / WhatsApp number');
      if (contact.email && !isEmail(contact.email)) throw new HttpError(422, 'Please enter a valid email address');
      const kind = ENQUIRY_KINDS.includes(b.kind) ? b.kind : 'contact';

      const content = await getContent(store);
      const slug = str(b.service, 120);
      const svc = (content.services || []).find(s => s.slug === slug) || (content.courses || []).find(c => c.slug === slug);
      const service = slug ? { slug, title: svc ? svc.title : slug } : null;
      if (kind !== 'contact' && !service) throw new HttpError(422, 'Please choose a service');

      const preferredDate = str(b.preferredDate, 10);
      if (preferredDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || isNaN(Date.parse(preferredDate))) throw new HttpError(422, 'Please choose a valid preferred date');
        if (preferredDate < todayIST(0)) throw new HttpError(422, 'The preferred date cannot be in the past');
      }
      const mode = ['online', 'offline'].includes(b.mode) ? b.mode : '';
      const message = str(b.message, 2000);
      if (kind === 'contact' && message.length < 5) throw new HttpError(422, 'Please write a short message');

      const enquiry = {
        reference: newReference('GPE'), kind, type: kind, status: 'NEW',
        contact, service, consultationType: str(b.consultationType, 80),
        preferredDate, preferredTime: str(b.preferredTime, 40), mode, message,
        createdAt: nowIso(), updatedAt: nowIso(), history: [{ at: nowIso(), event: 'created' }]
      };
      await store.createEnquiry(enquiry);
      const emailed = await notifyOwner(`New ${kind} enquiry ${enquiry.reference}${service ? ' — ' + service.title : ''}`, [
        `Name: ${contact.name}`, `Phone / WhatsApp: ${contact.phone}`, contact.email ? `Email: ${contact.email}` : '',
        service ? `Service: ${service.title}` : '', enquiry.consultationType ? `Type: ${enquiry.consultationType}` : '',
        preferredDate ? `Preferred: ${preferredDate} ${enquiry.preferredTime}` : '', mode ? `Mode: ${mode}` : '', message ? `\n${message}` : ''
      ]);
      const { history, ...pub } = enquiry;
      return [201, { success: true, enquiry: pub, emailed }];
    }],

    ['GET', /^\/api\/enquiries\/([A-Z0-9-]+)$/, async (req, [, ref], url) => {
      rateLimit(req, 'enquiry-read', 60);
      const e = await store.getEnquiry(ref);
      if (!e || e.contact.phone !== normaliseMobile(url.searchParams.get('mobile'))) throw new HttpError(404, 'Enquiry not found');
      const { history, adminNote, ...pub } = e;
      return [200, { enquiry: pub }];
    }],

    // Self-paced courses -------------------------------------------------------
    ['GET', /^\/api\/courses\/([a-z0-9-]+)\/outline$/, async (req, [, slug]) => {
      rateLimit(req, 'course-outline', 120);
      const outline = courseOutline(slug);
      if (!outline) throw new HttpError(404, 'That course has no self-paced lessons yet');
      return [200, { outline }];
    }],

    ['GET', /^\/api\/bookings\/([A-Z0-9-]+)\/course$/, async (req, [, orderId], url) => {
      rateLimit(req, 'course-read', 120);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, { mobile: url.searchParams.get('mobile') });
      if (!booking || !actor) throw new HttpError(actor === undefined ? 401 : 404, 'Enrolment not found');
      if (booking.type !== 'course' || !booking.course) throw new HttpError(404, 'This booking is not a course enrolment');
      if (!PAID_STATUSES.includes(booking.status)) {
        throw new HttpError(409, { code: 'not_paid', message: 'The lessons open once the enrolment is paid' });
      }
      const lessons = courseLessons(booking.course.slug);
      if (!lessons) throw new HttpError(404, 'This course has no lessons');
      const done = booking.course.lessons || {};
      return [200, {
        course: { slug: booking.course.slug, title: booking.service.title },
        devotee: { name: booking.devotee.name },
        lessons: lessons.map(l => ({ ...l, done: !!done[l.id], doneAt: done[l.id] || null })),
        progress: progressOf(lessons, done)
      }];
    }],

    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/course\/progress$/, async (req, [, orderId]) => {
      rateLimit(req, 'course-progress', 120);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, body);
      if (!booking || !actor) throw new HttpError(actor === undefined ? 401 : 404, 'Enrolment not found');
      if (booking.type !== 'course' || !booking.course) throw new HttpError(404, 'This booking is not a course enrolment');
      if (!PAID_STATUSES.includes(booking.status)) throw new HttpError(409, { code: 'not_paid', message: 'The lessons open once the enrolment is paid' });
      const lessons = courseLessons(booking.course.slug) || [];
      const lessonId = str(body.lessonId, 40);
      if (!lessons.some(l => l.id === lessonId)) throw new HttpError(422, 'Unknown lesson');
      const done = { ...(booking.course.lessons || {}) };
      if (body.done === false) delete done[lessonId]; else done[lessonId] = nowIso();
      const course = { ...booking.course, lessons: done, lastLesson: lessonId };
      const progress = progressOf(lessons, done);
      const set = { course, updatedAt: nowIso() };
      if (progress.percent === 100 && booking.status !== 'COMPLETED') set.status = 'COMPLETED';
      await store.updateBooking(orderId, set, { at: nowIso(), event: 'lesson_' + (body.done === false ? 'reopened' : 'completed'), by: actor.who, lessonId });
      return [200, { progress, done: !!done[lessonId] }];
    }],

    // Birth chart ------------------------------------------------------------
    ['GET', /^\/api\/bookings\/([A-Z0-9-]+)\/chart$/, async (req, [, orderId], url) => {
      rateLimit(req, 'chart-read', 60);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, { mobile: url.searchParams.get('mobile') });
      if (!booking || !actor) throw new HttpError(actor === undefined ? 401 : 404, 'Booking not found');
      if (!booking.chart) throw new HttpError(404, 'No chart has been cast for this booking yet');
      return [200, { chart: booking.chart }];
    }],

    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/chart$/, async (req, [, orderId]) => {
      rateLimit(req, 'chart-make', 20);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, body);
      if (!booking || !actor) throw new HttpError(actor === undefined ? 401 : 404, 'Booking not found');
      const d = booking.devotee || {};
      const input = {
        date: str(body.date, 10) || d.dob,
        time: str(body.time, 5) || d.tob || '12:00',
        lat: body.lat !== undefined ? coord(body.lat, 90) : d.lat,
        lon: body.lon !== undefined ? coord(body.lon, 180) : d.lon,
        tzMinutes: body.tzMinutes === undefined ? 330 : Number(body.tzMinutes),
        place: str(body.place, 120) || d.pob || ''
      };
      if (!input.date) throw new HttpError(422, 'A date of birth is needed before the chart can be cast');
      if (input.lat == null || input.lon == null) throw new HttpError(422, 'The latitude and longitude of the birth place are needed');
      let chart;
      try { chart = computeChart(input); } catch (e) { throw new HttpError(422, e.message); }
      const updated = await store.updateBooking(orderId, { chart, updatedAt: nowIso() }, { at: nowIso(), event: 'chart_cast', by: actor.who });
      return [200, { chart: updated.chart }];
    }],

    // Chat between the devotee and Guruji ---------------------------------------
    ['GET', /^\/api\/bookings\/([A-Z0-9-]+)\/messages$/, async (req, [, orderId], url) => {
      rateLimit(req, 'chat-read', 600);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, { mobile: url.searchParams.get('mobile') });
      if (!booking || !actor) throw new HttpError(actor === undefined ? 401 : 404, 'Booking not found');
      const since = str(url.searchParams.get('since'), 40);
      const messages = await store.listMessages(orderId, since);
      await store.markMessagesRead(orderId, actor.who);
      return [200, { messages, you: actor.who }];
    }],

    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/messages$/, async (req, [, orderId]) => {
      rateLimit(req, 'chat-send', 60);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, body);
      if (!booking || !actor) throw new HttpError(actor === undefined ? 401 : 404, 'Booking not found');
      const text = str(body.text, 2000);
      if (!text) throw new HttpError(422, 'Please write a message');
      const message = {
        id: 'msg-' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
        orderId, from: actor.who, name: actor.name, text, at: nowIso()
      };
      await store.addMessage(message);
      return [201, { message }];
    }],

    // Video and audio session --------------------------------------------------
    ['GET', /^\/api\/bookings\/([A-Z0-9-]+)\/session$/, async (req, [, orderId], url) => {
      rateLimit(req, 'session', 60);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, { mobile: url.searchParams.get('mobile') });
      if (actor === undefined) throw new HttpError(401, 'Sign in to join the session');
      if (!booking || !actor) throw new HttpError(404, 'Booking not found');
      if (!SESSION_STATUSES.includes(booking.status)) {
        const finished = ['COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED'].includes(booking.status);
        throw new HttpError(409, finished
          ? { code: 'ended', message: 'This consultation is complete, so the room is closed' }
          : { code: 'not_paid', message: 'This booking is not confirmed, so the room is closed' });
      }

      if (booking.sessionEndedAt) {
        throw new HttpError(409, { code: 'ended', message: 'Guruji has closed this session', endedAt: booking.sessionEndedAt });
      }
      const win = sessionWindow(booking);
      if (!win) throw new HttpError(409, { code: 'no_slot', message: 'This booking has no appointment time yet. We will confirm one with you.' });
      const now = Date.now();
      if (now < win.opensAt.getTime()) {
        throw new HttpError(409, { code: 'too_early', message: `The room opens ${OPEN_BEFORE_MIN} minutes before your time`, opensAt: win.opensAt.toISOString(), closesAt: win.closesAt.toISOString() });
      }
      if (now > win.closesAt.getTime()) {
        throw new HttpError(409, { code: 'ended', message: 'This session has ended', opensAt: win.opensAt.toISOString(), closesAt: win.closesAt.toISOString() });
      }
      const roomName = booking.roomName || newRoomName();
      if (!booking.roomName) await store.updateBooking(orderId, { roomName }, null);
      const jwt = sessionToken(JITSI, {
        room: roomName, name: actor.name, moderator: actor.moderator, expiresAt: win.closesAt
      });
      return [200, {
        domain: JITSI.domain,
        roomName: JITSI.roomPrefix + roomName,
        jwt,
        displayName: actor.name,
        role: actor.moderator ? 'moderator' : 'guest',
        opensAt: win.opensAt.toISOString(),
        closesAt: win.closesAt.toISOString(),
        startsAt: win.start.toISOString(),
        mode: JITSI.mode,
        productionSafe: JITSI.production
      }];
    }],

    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/session\/joined$/, async (req, [, orderId]) => {
      rateLimit(req, 'session-joined', 60);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, body);
      if (actor === undefined) throw new HttpError(401, 'Sign in to join the session');
      if (!booking || !actor) throw new HttpError(404, 'Booking not found');
      const field = actor.who === 'guruji' ? 'gurujiJoinedAt' : 'devoteeJoinedAt';
      if (booking[field]) return [200, { success: true, already: true }];   // idempotent
      const at = nowIso();
      const set = { [field]: at };
      if (!booking.sessionStartedAt) set.sessionStartedAt = at;
      await store.updateBooking(orderId, set, { at, event: 'session_joined', by: actor.who });
      return [200, { success: true }];
    }],

    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/session\/end$/, async (req, [, orderId]) => {
      rateLimit(req, 'session-end', 30);
      requireGuruji(req);
      const booking = await store.getBooking(orderId);
      if (!booking) throw new HttpError(404, 'Booking not found');
      if (booking.sessionEndedAt) return [200, { success: true, already: true, booking: publicBooking(booking) }];
      const at = nowIso();
      const status = booking.report && booking.report.status === 'ready' ? 'COMPLETED' : 'AWAITING_REPORT';
      const updated = await store.updateBooking(orderId, { sessionEndedAt: at, status, updatedAt: at },
        { at, event: 'session_ended', by: 'guruji', status });
      return [200, { success: true, booking: publicBooking(updated) }];
    }],

    // Guruji's cases -----------------------------------------------------------
    ['GET', /^\/api\/guruji\/cases$/, async (req, m, url) => {
      requireGuruji(req);
      const filter = { status: str(url.searchParams.get('status'), 30), q: str(url.searchParams.get('q'), 60) };
      const all = await store.listBookings(filter, 300);
      const cases = all.filter(b => CASE_STATUSES.includes(b.status));
      const unread = await store.unreadCounts();
      return [200, {
        cases: cases.map(b => ({ ...b, unread: unread[b.orderId] || 0 })),
        statuses: CASE_STATUSES
      }];
    }],

    ['GET', /^\/api\/guruji\/cases\/([A-Z0-9-]+)$/, async (req, [, orderId]) => {
      requireGuruji(req);
      const booking = await store.getBooking(orderId);
      if (!booking) throw new HttpError(404, 'Case not found');
      const messages = await store.listMessages(orderId);
      return [200, { case: booking, messages }];
    }],

    ['POST', /^\/api\/guruji\/cases\/([A-Z0-9-]+)\/claim$/, async (req, [, orderId]) => {
      const role = requireGuruji(req);
      const body = await readJsonBody(req).catch(() => ({}));
      const booking = await store.getBooking(orderId);
      if (!booking) throw new HttpError(404, 'Case not found');
      const by = str(body.name, 60) || (role === 'owner' ? 'Owner' : 'Guruji');
      const at = nowIso();
      const updated = await store.updateBooking(orderId, { assignedTo: by, assignedAt: at, updatedAt: at },
        { at, event: 'case_claimed', by });
      return [200, { success: true, case: updated }];
    }],

    ['PUT', /^\/api\/guruji\/cases\/([A-Z0-9-]+)\/report$/, async (req, [, orderId]) => {
      requireGuruji(req);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      if (!booking) throw new HttpError(404, 'Case not found');
      const previous = booking.report || {};
      const report = {
        palm: str(body.palm, 20000),
        correlation: str(body.correlation, 20000),
        summary: str(body.summary, 20000),
        remedies: str(body.remedies, 20000),
        status: previous.status === 'ready' ? 'ready' : 'draft',
        version: (previous.version || 0) + 1,
        updatedAt: nowIso(),
        readyAt: previous.readyAt
      };
      const updated = await store.updateBooking(orderId, { report, updatedAt: report.updatedAt },
        { at: report.updatedAt, event: 'report_saved', version: report.version });
      return [200, { success: true, report: updated.report }];
    }],

    ['POST', /^\/api\/guruji\/cases\/([A-Z0-9-]+)\/ready$/, async (req, [, orderId]) => {
      requireGuruji(req);
      const booking = await store.getBooking(orderId);
      if (!booking) throw new HttpError(404, 'Case not found');
      if (!booking.report || !(booking.report.summary || booking.report.palm)) {
        throw new HttpError(422, 'Please write the reading before marking it ready');
      }
      const at = nowIso();
      const report = { ...booking.report, status: 'ready', readyAt: at };
      const updated = await store.updateBooking(orderId, { report, status: 'COMPLETED', updatedAt: at },
        { at, event: 'report_ready', by: 'guruji' });
      return [200, { success: true, case: updated }];
    }],

    // The report, as a PDF ------------------------------------------------------
    ['GET', /^\/api\/bookings\/([A-Z0-9-]+)\/report\.pdf$/, async (req, [, orderId], url) => {
      rateLimit(req, 'report-pdf', 30);
      const booking = await store.getBooking(orderId);
      const actor = bookingActor(req, booking, { mobile: url.searchParams.get('mobile') });
      if (actor === undefined) throw new HttpError(401, 'Sign in to open this report');
      if (!booking || !actor) throw new HttpError(404, 'Booking not found');
      const ready = booking.report && booking.report.status === 'ready';
      if (!ready && actor.who !== 'guruji') throw new HttpError(409, 'Your reading is not ready yet. We will tell you as soon as it is.');
      const { settings } = await getContent(store);
      const pdf = await buildReportPdf(booking, settings || {});
      return [200, { __raw: pdf, type: 'application/pdf', filename: `guruji-reading-${booking.orderId}.pdf` }];
    }],

    // Payments (Cashfree) ----------------------------------------------------
    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/payment$/, async (req, [, orderId]) => {
      rateLimit(req, 'payment-create', 15);
      if (PAYMENT_MODE !== 'cashfree') throw new HttpError(409, 'Online payments are in test mode');
      // Bookings must outlive the request that created them before we take money for one
      if (store.mode === 'file-temporary') {
        console.error('[payments] refusing to take a payment: storage is temporary. Set MONGODB_URI.');
        throw new HttpError(503, 'Online payment is briefly unavailable. Please send an enquiry, or try again shortly.');
      }
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      if (!booking || booking.devotee.mobile !== normaliseMobile(body.mobile)) throw new HttpError(404, 'Booking not found');
      if (!['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(booking.status)) throw new HttpError(409, 'This booking is already paid');
      if (booking.type === 'pooja' && booking.status === 'PAYMENT_FAILED') {
        // the slot hold may have lapsed — re-check before taking money
        const taken = await store.countPoojaSlot(booking.poojaDate, booking.poojaSlot.id, pendingSinceIso());
        if (taken >= POOJA_SLOT_CAPACITY) throw new HttpError(409, 'That time slot has just filled up — please choose another slot or date');
      }
      const attempt = ((booking.payment && booking.payment.attempts) || 0) + 1;
      const origin = siteOrigin(req);
      const order = await gateway.createOrder({
        orderId: `${booking.orderId}_${attempt}`,
        amount: booking.amount,
        customer: { phone: booking.devotee.mobile, name: booking.devotee.name, email: booking.devotee.email },
        returnUrl: `${origin}/payment/return?ref=${encodeURIComponent(booking.orderId)}`,
        notifyUrl: origin.startsWith('https://') ? `${origin}/api/payments/cashfree/webhook` : undefined,
        note: booking.service && booking.service.title
      });
      const at = nowIso();
      await store.updateBooking(booking.orderId, {
        status: 'PENDING_PAYMENT', updatedAt: at,
        payment: { provider: 'cashfree', status: 'PENDING', gatewayOrderId: order.orderId, attempts: attempt, startedAt: at }
      }, { at, event: 'payment_started', gatewayOrderId: order.orderId });
      return [200, { paymentSessionId: order.paymentSessionId, mode: gateway.mode, orderId: booking.orderId }];
    }],

    ['POST', /^\/api\/bookings\/([A-Z0-9-]+)\/verify-payment$/, async (req, [, orderId]) => {
      rateLimit(req, 'payment-verify', 30);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      if (!booking || booking.devotee.mobile !== normaliseMobile(body.mobile)) throw new HttpError(404, 'Booking not found');
      const updated = await syncPayment(booking);
      return [200, { booking: publicBooking(updated) }];
    }],

    // Cashfree calls this after a payment. We never trust its body: it only tells us
    // which order to re-check, and the status is fetched from Cashfree's API.
    ['POST', /^\/api\/payments\/cashfree\/webhook$/, async (req) => {
      rateLimit(req, 'webhook', 120);
      const body = await readJsonBody(req).catch(() => ({}));
      const gatewayOrderId = str(body && body.data && body.data.order && body.data.order.order_id, 80);
      const orderId = gatewayOrderId.replace(/_\d+$/, '');
      if (!/^GURUJI-[A-Z]{3}-[A-Z0-9]+$/.test(orderId)) return [200, { ok: true }];
      const booking = await store.getBooking(orderId);
      if (booking && booking.payment && booking.payment.gatewayOrderId === gatewayOrderId) {
        try { await syncPayment(booking); } catch (e) { console.error('[payments] webhook sync failed:', e.message); }
      }
      return [200, { ok: true }];
    }],

    // Mantras ----------------------------------------------------------------
    ['GET', /^\/api\/mantras$/, async () => [200, await store.getMantraLibrary()]],

    ['POST', /^\/api\/mantras$/, async (req) => {
      requireAdmin(req, 'editor');
      const mantra = await readJsonBody(req);
      if (!str(mantra.title)) throw new HttpError(422, 'Field "title" is required');
      delete mantra._id;
      if (!mantra.id) {
        mantra.id = mantra.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      }
      mantra.created_at = nowIso();
      mantra.updated_at = mantra.created_at;
      try {
        await store.createMantra(mantra);
      } catch (e) {
        if (e && e.code === 11000) throw new HttpError(409, 'A mantra with this id already exists');
        throw e;
      }
      await writeMantrasSeedFile(store);
      return [201, { success: true, mantra }];
    }],

    ['PUT', /^\/api\/mantras\/([^/]+)$/, async (req, [, id]) => {
      requireAdmin(req, 'editor');
      const updates = await readJsonBody(req);
      delete updates._id;
      updates.updated_at = nowIso();
      const mantra = await store.updateMantra(id, updates);
      if (!mantra) throw new HttpError(404, 'Mantra not found');
      await writeMantrasSeedFile(store);
      return [200, { success: true, mantra }];
    }],

    ['DELETE', /^\/api\/mantras\/([^/]+)$/, async (req, [, id]) => {
      requireAdmin(req, 'editor');
      const removed = await store.deleteMantra(id);
      if (!removed) throw new HttpError(404, 'Mantra not found');
      await writeMantrasSeedFile(store);
      return [200, { success: true, removed }];
    }],

    // Pooja slots -------------------------------------------------------------
    ['GET', /^\/api\/pooja-slots$/, async (req, m, url) => {
      rateLimit(req, 'slots', 120);
      const date = url.searchParams.get('date');
      const problem = poojaDateProblem(date);
      if (problem) throw new HttpError(422, problem);
      return [200, { date, capacity: POOJA_SLOT_CAPACITY, slots: await slotAvailability(store, date) }];
    }],

    // Bookings ---------------------------------------------------------------
    ['POST', /^\/api\/bookings$/, async (req) => {
      rateLimit(req, 'booking-create', 20);
      const b = await readJsonBody(req);
      const type = ['pooja', 'consultation', 'course'].includes(b.type) ? b.type : null;
      if (!type) throw new HttpError(422, 'Booking type must be "consultation", "pooja" or "course"');

      const d = b.devotee || {};
      const devotee = {
        name: str(d.name, 120), mobile: normaliseMobile(d.mobile), email: str(d.email, 160).toLowerCase(),
        gotram: str(d.gotram, 80), dob: str(d.dob, 20)
      };
      if (devotee.name.length < 2) throw new HttpError(422, 'Please enter the devotee\'s full name');
      if (!devotee.mobile) throw new HttpError(422, 'Please enter a valid 10-digit Indian mobile number');
      if (type !== 'pooja' && !isEmail(devotee.email)) throw new HttpError(422, 'Please enter a valid email address');
      if (devotee.email && !isEmail(devotee.email)) throw new HttpError(422, 'Please enter a valid email address');

      const booking = {
        orderId: newOrderId(type),
        roomName: newRoomName(), type, status: 'PENDING_PAYMENT', currency: 'INR',
        devotee, createdAt: nowIso(), updatedAt: nowIso(),
        payment: { provider: PAYMENT_MODE, status: 'PENDING' },
        history: [{ at: nowIso(), event: 'created' }]
      };

      if (type === 'course') {
        const slug = str(b.courseSlug, 120);
        const outline = courseOutline(slug);
        if (!outline) throw new HttpError(422, 'That course is not open for self-paced enrolment');
        const content = await getContent(store);
        const course = (content.courses || []).find(c => c.slug === slug && c.published !== false);
        if (!course) throw new HttpError(404, 'Unknown course');
        booking.service = { id: slug, title: course.title, duration: `${outline.lessonCount} lessons` };
        booking.amount = Number(course.price) > 0 ? Number(course.price) : outline.price || 0;
        booking.course = { slug, lessons: {}, startedAt: nowIso() };
        delete booking.roomName;
        if (booking.amount === 0) {
          // A free course needs no gateway: the enrolment is live at once.
          booking.status = 'PAID';
          booking.payment = { provider: 'none', status: 'FREE', paidAt: nowIso() };
          booking.history.push({ at: nowIso(), event: 'enrolled' });
        }
      } else if (type === 'consultation') {
        const svc = await findConsultation(store, str(b.serviceId, 120));
        if (!svc) throw new HttpError(422, 'Unknown consultation service');
        booking.service = { id: svc.id, title: svc.title, duration: svc.duration };
        booking.amount = svc.price;
        booking.slot = { date: str(b.slot && b.slot.date, 60), time: str(b.slot && b.slot.time, 20) };
        booking.slotStart = slotStartISO(str(b.slot && b.slot.iso, 10), str(b.slot && b.slot.time, 20));
        booking.slotMinutes = minutesFromDuration(svc.duration);
        booking.handedness = str(b.handedness, 30);
      } else {
        const ids = Array.isArray(b.poojaIds) ? [...new Set(b.poojaIds.map(String))].slice(0, 10) : [];
        const poojas = (await Promise.all(ids.map(id => findPooja(store, id)))).filter(Boolean);
        if (!poojas.length || poojas.length !== ids.length) throw new HttpError(422, 'Please select at least one valid pooja');
        booking.poojas = poojas;
        booking.amount = poojas.reduce((s, p) => s + p.price, 0);
        booking.service = { id: 'pooja_sevas', title: 'Pooja Seva: ' + poojas.map(p => p.name).join(', '), duration: '45-60 Mins Ritual' };

        // Date and time slot of the pooja
        const date = str(b.poojaDate, 10);
        const dateProblem = poojaDateProblem(date);
        if (dateProblem) throw new HttpError(422, dateProblem);
        const slot = POOJA_SLOTS.find(s => s.id === b.poojaSlot);
        if (!slot) throw new HttpError(422, 'Please choose a pooja time slot');
        if (await store.countPoojaSlot(date, slot.id, pendingSinceIso()) >= POOJA_SLOT_CAPACITY) {
          throw new HttpError(409, 'That time slot has just filled up — please choose another slot or date');
        }
        booking.poojaDate = date;
        booking.poojaSlot = { id: slot.id, label: slot.label, name: slot.name };
        booking.slot = { date, time: slot.label };
        booking.slotStart = slotStartISO(date, slot.label.split('–')[0].trim() + (/AM|PM/.test(slot.label.split('–')[0]) ? '' : slot.label.slice(-2)));
        booking.slotMinutes = 120;

        // Prasadam delivery address
        const pr = b.prasadam || {};
        booking.prasadam = { deliver: !!pr.deliver };
        if (pr.deliver) {
          const a = pr.address || {};
          const address = {
            line1: str(a.line1, 160), line2: str(a.line2, 160), city: str(a.city, 80),
            state: str(a.state, 80), pincode: str(a.pincode, 6)
          };
          if (address.line1.length < 5) throw new HttpError(422, 'Please enter the house / street address for prasadam delivery');
          if (address.city.length < 2) throw new HttpError(422, 'Please enter the city for prasadam delivery');
          if (address.state.length < 2) throw new HttpError(422, 'Please choose the state for prasadam delivery');
          if (!/^[1-9]\d{5}$/.test(address.pincode)) throw new HttpError(422, 'Please enter a valid 6-digit PIN code');
          booking.prasadam.address = address;
        }
      }

      if (booking.payment.status !== 'FREE') booking.payment.provider = PAYMENT_MODE;
      await store.createBooking(booking);
      return [201, { success: true, booking: publicBooking(booking), payments: PAYMENT_MODE }];
    }],

    ['GET', /^\/api\/bookings\/([A-Z0-9-]+)$/, async (req, [, orderId], url) => {
      rateLimit(req, 'booking-read', 60);
      const booking = await store.getBooking(orderId);
      // A booking is only shown to someone who also knows the mobile number it was made with
      if (!booking || booking.devotee.mobile !== normaliseMobile(url.searchParams.get('mobile'))) {
        throw new HttpError(404, 'Booking not found');
      }
      let current = booking;
      if (booking.status === 'PENDING_PAYMENT' && booking.payment && booking.payment.gatewayOrderId) {
        try { current = await syncPayment(booking); } catch (e) { /* show the stored status if the gateway is unreachable */ }
      }
      return [200, { booking: publicBooking(current) }];
    }],

    ['PATCH', /^\/api\/bookings\/([A-Z0-9-]+)$/, async (req, [, orderId]) => {
      rateLimit(req, 'booking-update', 30);
      const body = await readJsonBody(req);
      const booking = await store.getBooking(orderId);
      if (!booking || booking.devotee.mobile !== normaliseMobile(body.mobile)) throw new HttpError(404, 'Booking not found');

      const at = nowIso();
      let set;
      switch (body.event) {
        case 'payment_success':
          // With a real gateway this must come from its verified callback, never from the browser.
          if (PAYMENT_MODE !== 'simulated') throw new HttpError(403, 'Payments are confirmed by the payment gateway');
          if (!['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(booking.status)) return [200, { success: true, booking: publicBooking(booking) }];
          set = { status: 'PAID', payment: { provider: PAYMENT_MODE, status: 'SUCCESS', paidAt: at } };
          break;
        case 'payment_failed':
          if (booking.status !== 'PENDING_PAYMENT') return [200, { success: true, booking: publicBooking(booking) }];
          set = { status: 'PAYMENT_FAILED', payment: { provider: PAYMENT_MODE, status: 'FAILED', failedAt: at } };
          break;
        case 'details_submitted': {
          if (!['PAID', 'DETAILS_RECEIVED'].includes(booking.status)) throw new HttpError(409, 'Please complete payment first');
          const d = body.details || {};
          const photos = Array.isArray(body.photos) ? body.photos.slice(0, 10).map(p => ({
            slot: Number(p.slot) || 0, name: str(p.name, 120), size: Number(p.size) || 0, type: str(p.type, 40)
          })) : [];
          set = {
            status: 'DETAILS_RECEIVED',
            'devotee.name': str(d.name, 120) || booking.devotee.name,
            'devotee.gotram': str(d.gotram, 80), 'devotee.dob': str(d.dob, 20), 'devotee.tob': str(d.tob, 20),
            'devotee.pob': str(d.pob, 120), 'devotee.questions': str(d.questions, 1000),
            // the chart is cast from these, so they are stored as numbers or not at all
            'devotee.lat': coord(d.lat, 90), 'devotee.lon': coord(d.lon, 180),
            photos
          };
          // file store has no dot-notation: expand there
          if (store.mode.startsWith('file')) {   // 'file' and 'file-temporary' have no dot-notation
            const devotee = { ...booking.devotee };
            for (const k of Object.keys(set)) if (k.startsWith('devotee.')) { devotee[k.slice(8)] = set[k]; delete set[k]; }
            set.devotee = devotee;
          }
          break;
        }
        default:
          throw new HttpError(422, 'Unknown booking event');
      }
      set.updatedAt = at;
      const updated = await store.updateBooking(orderId, set, { at, event: body.event });
      return [200, { success: true, booking: publicBooking(updated) }];
    }],

    // Reviews ----------------------------------------------------------------
    ['GET', /^\/api\/reviews$/, async () => [200, { reviews: await store.listReviews(50) }]],

    ['POST', /^\/api\/reviews$/, async (req) => {
      rateLimit(req, 'review', 5);
      const r = await readJsonBody(req);
      const comment = str(r.comment, 1000);
      const rating = Math.round(Number(r.rating));
      if (comment.length < 10) throw new HttpError(422, 'Please write at least 10 characters');
      if (!(rating >= 1 && rating <= 5)) throw new HttpError(422, 'Rating must be between 1 and 5');

      // A review is "verified" only when it is tied to a real, paid booking
      let verified = false;
      if (r.orderId && r.mobile) {
        const booking = await store.getBooking(str(r.orderId, 40));
        verified = !!booking && booking.devotee.mobile === normaliseMobile(r.mobile) && booking.status !== 'PENDING_PAYMENT';
      }
      const review = {
        id: 'rev-' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex'),
        name: str(r.name, 80) || 'Devotee', location: str(r.location, 80), rating, comment,
        consultation: str(r.consultation, 120), verified, createdAt: nowIso()
      };
      await store.createReview(review);
      return [201, { success: true, review }];
    }]
  ];
}

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
// Page addresses of the single-page site (/about, /services/…, /reiki-healing …) all load index.html
const SPA_ROUTE_RX = /^\/(?:about|services|reiki-healing|courses|resources|faqs|contact|book|track|palmistry|mantras|admin|guruji|session|learn|payment|privacy-policy|terms|cancellation-refund-policy|search)(?:\/[A-Za-z0-9-]*)*\/?$/;

function serveStatic(req, res, pathname) {
  let reqPath = pathname === '/' || pathname === '' || SPA_ROUTE_RX.test(pathname) ? '/index.html' : pathname;
  if (PRIVATE_PATHS.some(rx => rx.test(reqPath))) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found');
  }
  const fullPath = path.resolve(BASE_DIR, '.' + path.posix.normalize(reqPath));
  if (fullPath !== BASE_DIR && !fullPath.startsWith(BASE_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }
  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // An address with no file extension is a page of the site: let the app show its own "not found"
      if (!path.extname(reqPath) && (req.headers.accept || '').includes('text/html')) {
        const page = fs.readFileSync(path.join(BASE_DIR, 'index.html'));
        res.writeHead(404, { 'Content-Type': MIME_TYPES['.html'], 'Cache-Control': 'no-cache' });
        return res.end(page);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' || fullPath.endsWith('mantras-data.js') ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(fullPath).pipe(res);
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
/** Request handler shared by the local server and the Vercel function. */
function createHandler(store, { serveFiles = true, gateway } = {}) {
  const routes = buildApi(store, gateway ? { gateway } : undefined);
  return async (req, res) => {
    let url;
    let pathname;
    try {
      url = new URL(req.url, 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('400 Bad Request');
    }

    // /robots.txt and /sitemap.xml are generated from the live content, like the API
    const GENERATED = pathname === '/robots.txt' || pathname === '/sitemap.xml';
    if (!pathname.startsWith('/api/') && !GENERATED) {
      if (serveFiles) return serveStatic(req, res, pathname);
      return sendJson(res, 404, { error: 'Not found' });
    }

    const matching = routes.filter(([, rx]) => rx.test(pathname));
    if (!matching.length) return sendJson(res, 404, { error: 'Not found' });
    const route = matching.find(([method]) => method === req.method);
    if (!route) return sendJson(res, 405, { error: 'Method not allowed' });

    try {
      const [status, payload] = await route[2](req, pathname.match(route[1]), url);
      if (payload && payload.__raw) {
        const cache = payload.filename ? 'private, no-store' : GENERATED ? 'public, max-age=3600' : 'public, max-age=86400';
        const headers = { 'Content-Type': payload.type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' };
        if (payload.filename) headers['Content-Disposition'] = `inline; filename="${payload.filename}"`;
        res.writeHead(status, headers);
        return res.end(payload.__raw);
      }
      sendJson(res, status, payload);
    } catch (err) {
      if (err instanceof HttpError || err instanceof PaymentGatewayError) {
        const body = { error: err.message };
        for (const k of ['code', 'opensAt', 'closesAt']) if (err[k]) body[k] = err[k];
        return sendJson(res, err.status, body);
      }
      console.error(`[server] ${req.method} ${pathname} failed:`, err);
      sendJson(res, 500, { error: 'Something went wrong on our side. Please try again.' });
    }
  };
}

function createServer(store) {
  return http.createServer(createHandler(store));
}

// One store per warm serverless instance — connecting to MongoDB on every request would be slow
let sharedStore = null;
function getSharedStore() {
  if (!sharedStore) sharedStore = createStore().catch(err => { sharedStore = null; throw err; });
  return sharedStore;
}

async function start() {
  const store = await createStore();
  const server = createServer(store);
  server.listen(PORT, HOST, () => {
    console.log(`GURUJI server listening on ${HOST}:${PORT}  (storage: ${store.mode})`);
    if (HOST === '127.0.0.1') console.log('[server] Bound to localhost only. Behind a reverse proxy that is right; on a managed host set HOST=0.0.0.0.');
  });
  const shutdown = async () => {
    server.close();
    await store.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) start();

module.exports = { createServer, createHandler, getSharedStore, CONSULTATIONS, POOJAS, SPA_ROUTE_RX, slotStartISO, minutesFromDuration };
