// GURUJI — storage layer
//
// One interface, two backends:
//   • MongoStore — used when MONGODB_URI is set and the cluster is reachable
//   • FileStore  — JSON files in ./data, used when there is no database (local dev / outage)
//
// Collections: mantras, mantra_categories, bookings, reviews, enquiries,
// content (admin edits to the site content), media (images uploaded in admin).

'use strict';

const fs = require('fs');
const path = require('path');

const BUNDLED_DATA_DIR = path.join(__dirname, 'data');
// Vercel functions can only write to /tmp (and it is wiped between cold starts — use MongoDB in production)
const DATA_DIR = process.env.GURUJI_DATA_DIR || (process.env.VERCEL ? '/tmp/guruji-data' : BUNDLED_DATA_DIR);
const MANTRAS_FILE = path.join(DATA_DIR, 'mantras.json');
if (DATA_DIR !== BUNDLED_DATA_DIR && !fs.existsSync(MANTRAS_FILE)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.copyFileSync(path.join(BUNDLED_DATA_DIR, 'mantras.json'), MANTRAS_FILE);
  } catch (e) { /* tests point GURUJI_DATA_DIR at their own copy */ }
}
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const MEDIA_FILE = path.join(DATA_DIR, 'media.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONSENTS_FILE = path.join(DATA_DIR, 'consents.json');

/** Applies admin list filters (status / type / text) to bookings or enquiries. */
function filterRecords(list, { status, type, q } = {}) {
  const needle = (q || '').toLowerCase();
  return list.filter(r =>
    (!status || r.status === status) &&
    (!type || r.type === type) &&
    (!needle || JSON.stringify([r.orderId, r.reference, r.devotee, r.contact, r.service]).toLowerCase().includes(needle)));
}

// Booking states that occupy a pooja slot
const HOLDING_STATUSES = ['PAID', 'DETAILS_RECEIVED', 'COMPLETED'];

// Fields we never send back to the browser
const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

// ---------------------------------------------------------------------------
// File backend
// ---------------------------------------------------------------------------
function readJson(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`[db] Could not read ${path.basename(file)}:`, e.message);
  }
  return fallback;
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file); // atomic replace so a crash never leaves half a file
}

class FileStore {
  constructor() { this.mode = process.env.VERCEL ? 'file-temporary' : 'file'; }
  async init() { return this; }
  async close() {}

  // Mantras
  async getMantraLibrary() {
    const d = readJson(MANTRAS_FILE, { categories: [], mantras: [] });
    return { categories: d.categories || [], mantras: d.mantras || [] };
  }
  async createMantra(mantra) {
    const d = await this.getMantraLibrary();
    d.mantras.unshift(mantra);
    writeJson(MANTRAS_FILE, d);
    return mantra;
  }
  async updateMantra(id, updates) {
    const d = await this.getMantraLibrary();
    const i = d.mantras.findIndex(m => m.id === id);
    if (i === -1) return null;
    d.mantras[i] = { ...d.mantras[i], ...updates, id };
    writeJson(MANTRAS_FILE, d);
    return d.mantras[i];
  }
  async deleteMantra(id) {
    const d = await this.getMantraLibrary();
    const i = d.mantras.findIndex(m => m.id === id);
    if (i === -1) return null;
    const [removed] = d.mantras.splice(i, 1);
    writeJson(MANTRAS_FILE, d);
    return removed;
  }

  // Bookings
  async createBooking(booking) {
    const all = readJson(BOOKINGS_FILE, []);
    all.unshift(booking);
    writeJson(BOOKINGS_FILE, all);
    return booking;
  }
  async getBooking(orderId) {
    return readJson(BOOKINGS_FILE, []).find(b => b.orderId === orderId) || null;
  }
  /** Bookings holding a pooja slot: confirmed ones, plus unpaid ones started recently. */
  async countPoojaSlot(date, slot, pendingSince) {
    return readJson(BOOKINGS_FILE, []).filter(b =>
      b.type === 'pooja' && b.poojaDate === date && b.poojaSlot && b.poojaSlot.id === slot &&
      (HOLDING_STATUSES.includes(b.status) || (b.status === 'PENDING_PAYMENT' && b.createdAt > pendingSince))
    ).length;
  }
  async listBookings(filter = {}, limit = 200) {
    return filterRecords(readJson(BOOKINGS_FILE, []), filter).slice(0, limit);
  }
  async updateBooking(orderId, set, pushHistory) {
    const all = readJson(BOOKINGS_FILE, []);
    const i = all.findIndex(b => b.orderId === orderId);
    if (i === -1) return null;
    all[i] = { ...all[i], ...set };
    if (pushHistory) all[i].history = [...(all[i].history || []), pushHistory];
    writeJson(BOOKINGS_FILE, all);
    return all[i];
  }

  // Reviews
  async listReviews(limit) {
    return readJson(REVIEWS_FILE, []).slice(0, limit);
  }
  async createReview(review) {
    const all = readJson(REVIEWS_FILE, []);
    all.unshift(review);
    writeJson(REVIEWS_FILE, all);
    return review;
  }

  // Chat messages between a seeker and Guruji
  async addMessage(message) {
    const all = readJson(MESSAGES_FILE, []);
    all.push(message);
    writeJson(MESSAGES_FILE, all);
    return message;
  }
  async listMessages(orderId, since) {
    return readJson(MESSAGES_FILE, [])
      .filter(m => m.orderId === orderId && (!since || m.at > since))
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  async markMessagesRead(orderId, reader) {
    const all = readJson(MESSAGES_FILE, []);
    let n = 0;
    for (const m of all) if (m.orderId === orderId && m.from !== reader && !m.readAt) { m.readAt = new Date().toISOString(); n++; }
    if (n) writeJson(MESSAGES_FILE, all);
    return n;
  }
  async unreadCounts() {
    const counts = {};
    for (const m of readJson(MESSAGES_FILE, [])) {
      if (m.from === 'devotee' && !m.readAt) counts[m.orderId] = (counts[m.orderId] || 0) + 1;
    }
    return counts;
  }

  // Enquiries (contact / booking requests)
  async createEnquiry(enquiry) {
    const all = readJson(ENQUIRIES_FILE, []);
    all.unshift(enquiry);
    writeJson(ENQUIRIES_FILE, all);
    return enquiry;
  }
  async getEnquiry(reference) {
    return readJson(ENQUIRIES_FILE, []).find(e => e.reference === reference) || null;
  }
  async listEnquiries(filter = {}, limit = 200) {
    return filterRecords(readJson(ENQUIRIES_FILE, []), filter).slice(0, limit);
  }
  async updateEnquiry(reference, set, pushHistory) {
    const all = readJson(ENQUIRIES_FILE, []);
    const i = all.findIndex(e => e.reference === reference);
    if (i === -1) return null;
    all[i] = { ...all[i], ...set };
    if (pushHistory) all[i].history = [...(all[i].history || []), pushHistory];
    writeJson(ENQUIRIES_FILE, all);
    return all[i];
  }

  // Site content edited in admin: { section: value }
  async getContentOverrides() {
    const d = readJson(CONTENT_FILE, {});
    const out = {};
    for (const [k, v] of Object.entries(d)) out[k] = v.value;
    return out;
  }
  /** When each saved section was last changed, and by which role. */
  async getContentMeta() {
    const d = readJson(CONTENT_FILE, {});
    const out = {};
    for (const [k, v] of Object.entries(d)) out[k] = { updatedAt: v.updatedAt || '', updatedBy: v.updatedBy || '' };
    return out;
  }
  async setContentSection(section, value, meta = {}) {
    const d = readJson(CONTENT_FILE, {});
    d[section] = { value, updatedAt: new Date().toISOString(), ...meta };
    writeJson(CONTENT_FILE, d);
    return value;
  }
  async deleteContentSection(section) {
    const d = readJson(CONTENT_FILE, {});
    delete d[section];
    writeJson(CONTENT_FILE, d);
  }

  // Uploaded images (base64 in a JSON file — fine for a handful of images in local dev)
  async saveMedia(item) {
    const all = readJson(MEDIA_FILE, []);
    all.unshift(item);
    writeJson(MEDIA_FILE, all);
    return item;
  }
  async getMedia(id) { return readJson(MEDIA_FILE, []).find(m => m.id === id) || null; }
  async listMedia() { return readJson(MEDIA_FILE, []).map(({ data, ...m }) => m); }
  async deleteMedia(id) {
    const all = readJson(MEDIA_FILE, []);
    const i = all.findIndex(m => m.id === id);
    if (i === -1) return false;
    all.splice(i, 1);
    writeJson(MEDIA_FILE, all);
    return true;
  }

  // Customer accounts
  async createOrUpdateCustomer(data) {
    const all = readJson(USERS_FILE, []);
    const mobile = (data.mobile || '').replace(/\D/g, '').slice(-10);
    const email = (data.email || '').toLowerCase().trim();
    const now = new Date().toISOString();
    let idx = all.findIndex(u => (email && u.email === email) || (mobile && u.mobile === mobile));
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...data, mobile: mobile || all[idx].mobile, email: email || all[idx].email, updatedAt: now };
    } else {
      const user = {
        id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: data.name || '',
        mobile,
        email,
        passwordHash: data.passwordHash || '',
        provider: data.provider || 'local',
        createdAt: now,
        updatedAt: now
      };
      all.unshift(user);
      idx = 0;
    }
    writeJson(USERS_FILE, all);
    const { passwordHash, ...safe } = all[idx];
    return safe;
  }
  async findCustomer(identifier) {
    if (!identifier) return null;
    const all = readJson(USERS_FILE, []);
    const clean = String(identifier).trim().toLowerCase();
    const mobile = clean.replace(/\D/g, '').slice(-10);
    const user = all.find(u => (u.email && u.email === clean) || (mobile && u.mobile === mobile) || u.id === identifier);
    return user || null;
  }
  async listCustomerBookings(mobile, email) {
    const allBookings = readJson(BOOKINGS_FILE, []);
    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    return allBookings.filter(b => {
      const m = b.devotee && b.devotee.mobile ? b.devotee.mobile.replace(/\D/g, '').slice(-10) : '';
      const e = b.devotee && b.devotee.email ? b.devotee.email.trim().toLowerCase() : '';
      return (cleanMobile && m === cleanMobile) || (cleanEmail && e === cleanEmail);
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  // Customer legal consents
  async recordConsent(data) {
    const all = readJson(CONSENTS_FILE, []);
    const consent = {
      id: 'cst_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      customerId: data.customerId || '',
      name: data.name || '',
      email: (data.email || '').toLowerCase().trim(),
      mobile: (data.mobile || '').replace(/\D/g, '').slice(-10),
      disclaimerAccepted: Boolean(data.disclaimerAccepted !== false),
      termsAccepted: Boolean(data.termsAccepted !== false),
      privacyAccepted: Boolean(data.privacyAccepted !== false),
      serviceSpecificAcknowledgement: Boolean(data.serviceSpecificAcknowledgement),
      serviceType: data.serviceType || 'general',
      documentVersions: data.documentVersions || {
        disclaimer: '1.0',
        terms: '1.0',
        privacy: '1.0',
        refund: '1.0',
        consentPolicy: '1.0',
        grievance: '1.0'
      },
      consentSource: data.consentSource || 'portal_signup',
      ip: data.ip || '127.0.0.1',
      userAgent: data.userAgent || '',
      timestamp: data.timestamp || new Date().toISOString()
    };
    all.unshift(consent);
    writeJson(CONSENTS_FILE, all);
    return consent;
  }
  async listConsents(filter = {}, limit = 100) {
    let all = readJson(CONSENTS_FILE, []);
    const { q, serviceType, startDate, endDate } = filter;
    if (serviceType) {
      all = all.filter(c => c.serviceType === serviceType);
    }
    if (startDate) {
      all = all.filter(c => c.timestamp >= startDate);
    }
    if (endDate) {
      all = all.filter(c => c.timestamp <= endDate);
    }
    if (q) {
      const clean = q.toLowerCase().trim();
      all = all.filter(c =>
        (c.name && c.name.toLowerCase().includes(clean)) ||
        (c.email && c.email.toLowerCase().includes(clean)) ||
        (c.mobile && c.mobile.includes(clean)) ||
        (c.id && c.id.toLowerCase().includes(clean))
      );
    }
    return all.slice(0, limit);
  }
  async getConsentHistory(customerId) {
    if (!customerId) return [];
    const all = readJson(CONSENTS_FILE, []);
    const clean = String(customerId).trim().toLowerCase();
    const mobile = clean.replace(/\D/g, '').slice(-10);
    return all.filter(c => c.customerId === customerId || c.email === clean || (mobile && c.mobile === mobile));
  }
}

// ---------------------------------------------------------------------------
// MongoDB backend
// ---------------------------------------------------------------------------
class MongoStore {
  /** @param {import('mongodb').MongoClient} client */
  constructor(client, dbName) {
    this.mode = 'mongodb';
    this.client = client;
    this.dbName = dbName;
  }

  async init() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.mantras = this.db.collection('mantras');
    this.categories = this.db.collection('mantra_categories');
    this.bookings = this.db.collection('bookings');
    this.reviews = this.db.collection('reviews');
    this.enquiries = this.db.collection('enquiries');
    this.content = this.db.collection('content');
    this.media = this.db.collection('media');
    this.messages = this.db.collection('messages');
    this.users = this.db.collection('users');
    this.consents = this.db.collection('consents');

    await Promise.all([
      this.mantras.createIndex({ id: 1 }, { unique: true }),
      this.categories.createIndex({ id: 1 }, { unique: true }),
      this.bookings.createIndex({ orderId: 1 }, { unique: true }),
      this.bookings.createIndex({ createdAt: -1 }),
      this.bookings.createIndex({ type: 1, poojaDate: 1, 'poojaSlot.id': 1 }),
      this.reviews.createIndex({ createdAt: -1 }),
      this.enquiries.createIndex({ reference: 1 }, { unique: true }),
      this.enquiries.createIndex({ createdAt: -1 }),
      this.content.createIndex({ section: 1 }, { unique: true }),
      this.media.createIndex({ id: 1 }, { unique: true }),
      this.messages.createIndex({ orderId: 1, at: 1 }),
      this.messages.createIndex({ from: 1, readAt: 1 }),
      this.users.createIndex({ id: 1 }, { unique: true }),
      this.users.createIndex({ email: 1 }),
      this.users.createIndex({ mobile: 1 }),
      this.consents.createIndex({ id: 1 }, { unique: true }),
      this.consents.createIndex({ customerId: 1 }),
      this.consents.createIndex({ email: 1 }),
      this.consents.createIndex({ mobile: 1 }),
      this.consents.createIndex({ timestamp: -1 })
    ]);
    await this.seedMantrasIfEmpty();
    return this;
  }

  async close() { await this.client.close(); }

  /** First run: copy the existing library from data/mantras.json into the database. */
  async seedMantrasIfEmpty() {
    const [mCount, cCount] = await Promise.all([this.mantras.countDocuments({}), this.categories.countDocuments({})]);
    if (mCount > 0 && cCount > 0) return;
    const seed = readJson(MANTRAS_FILE, { categories: [], mantras: [] });
    if (cCount === 0 && seed.categories.length) {
      await this.categories.insertMany(seed.categories.map((c, order) => ({ ...c, order })));
    }
    if (mCount === 0 && seed.mantras.length) {
      await this.mantras.insertMany(seed.mantras.map((m, order) => ({ ...m, order })));
    }
    console.log(`[db] Seeded MongoDB with ${seed.mantras.length} mantras and ${seed.categories.length} categories.`);
  }

  // Mantras
  async getMantraLibrary() {
    const [categories, mantras] = await Promise.all([
      this.categories.find({}).sort({ order: 1 }).toArray(),
      // newest first, then the original seed order
      this.mantras.find({}).sort({ created_at: -1, order: 1 }).toArray()
    ]);
    const strip = (d) => { const { _id, order, ...rest } = d; return rest; };
    return { categories: categories.map(strip), mantras: mantras.map(strip) };
  }
  async createMantra(mantra) {
    await this.mantras.insertOne({ ...mantra });
    return mantra;
  }
  async updateMantra(id, updates) {
    const { _id, ...safe } = updates;
    const doc = await this.mantras.findOneAndUpdate({ id }, { $set: { ...safe, id } }, { returnDocument: 'after', includeResultMetadata: false });
    return doc ? stripMongoId(doc) : null;
  }
  async deleteMantra(id) {
    const doc = await this.mantras.findOne({ id });
    if (!doc) return null;
    await this.mantras.deleteOne({ id });
    return stripMongoId(doc);
  }

  // Bookings
  async createBooking(booking) {
    await this.bookings.insertOne({ ...booking });
    return booking;
  }
  async getBooking(orderId) {
    return stripMongoId(await this.bookings.findOne({ orderId }));
  }
  async countPoojaSlot(date, slot, pendingSince) {
    return this.bookings.countDocuments({
      type: 'pooja', poojaDate: date, 'poojaSlot.id': slot,
      $or: [{ status: { $in: HOLDING_STATUSES } }, { status: 'PENDING_PAYMENT', createdAt: { $gt: pendingSince } }]
    });
  }
  async listBookings(filter = {}, limit = 200) {
    const docs = await this.bookings.find(mongoFilter(filter, ['orderId', 'devotee.name', 'devotee.mobile', 'devotee.email']))
      .sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(stripMongoId);
  }
  async updateBooking(orderId, set, pushHistory) {
    const update = { $set: set };
    if (pushHistory) update.$push = { history: pushHistory };
    const doc = await this.bookings.findOneAndUpdate({ orderId }, update, { returnDocument: 'after', includeResultMetadata: false });
    return doc ? stripMongoId(doc) : null;
  }

  // Reviews
  async listReviews(limit) {
    const docs = await this.reviews.find({}).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    return docs.map(stripMongoId);
  }
  async createReview(review) {
    await this.reviews.insertOne({ ...review });
    return review;
  }

  // Chat messages
  async addMessage(message) {
    await this.messages.insertOne({ ...message });
    return message;
  }
  async listMessages(orderId, since) {
    const q = { orderId };
    if (since) q.at = { $gt: since };
    const docs = await this.messages.find(q).sort({ at: 1 }).limit(500).toArray();
    return docs.map(stripMongoId);
  }
  async markMessagesRead(orderId, reader) {
    const res = await this.messages.updateMany(
      { orderId, from: { $ne: reader }, readAt: { $exists: false } },
      { $set: { readAt: new Date().toISOString() } });
    return res.modifiedCount || 0;
  }
  async unreadCounts() {
    const docs = await this.messages.find({ from: 'devotee', readAt: { $exists: false } }).toArray();
    const counts = {};
    for (const m of docs) counts[m.orderId] = (counts[m.orderId] || 0) + 1;
    return counts;
  }

  // Enquiries
  async createEnquiry(enquiry) {
    await this.enquiries.insertOne({ ...enquiry });
    return enquiry;
  }
  async getEnquiry(reference) {
    return stripMongoId(await this.enquiries.findOne({ reference }));
  }
  async listEnquiries(filter = {}, limit = 200) {
    const docs = await this.enquiries.find(mongoFilter(filter, ['reference', 'contact.name', 'contact.phone', 'contact.email']))
      .sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(stripMongoId);
  }
  async updateEnquiry(reference, set, pushHistory) {
    const update = { $set: set };
    if (pushHistory) update.$push = { history: pushHistory };
    const doc = await this.enquiries.findOneAndUpdate({ reference }, update, { returnDocument: 'after', includeResultMetadata: false });
    return doc ? stripMongoId(doc) : null;
  }

  // Site content
  async getContentOverrides() {
    const docs = await this.content.find({}).toArray();
    const out = {};
    for (const d of docs) out[d.section] = d.value;
    return out;
  }
  /** When each saved section was last changed, and by which role. */
  async getContentMeta() {
    const docs = await this.content.find({}).toArray();
    const out = {};
    for (const d of docs) out[d.section] = { updatedAt: d.updatedAt || '', updatedBy: d.updatedBy || '' };
    return out;
  }
  async setContentSection(section, value, meta = {}) {
    await this.content.updateOne({ section }, { $set: { section, value, updatedAt: new Date().toISOString(), ...meta } }, { upsert: true });
    return value;
  }
  async deleteContentSection(section) { await this.content.deleteOne({ section }); }

  // Media
  async saveMedia(item) { await this.media.insertOne({ ...item }); return item; }
  async getMedia(id) { return stripMongoId(await this.media.findOne({ id })); }
  async listMedia() {
    const docs = await this.media.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(({ _id, data, ...m }) => m);
  }
  async deleteMedia(id) { return (await this.media.deleteOne({ id })).deletedCount > 0; }

  // Customer accounts
  async createOrUpdateCustomer(data) {
    const mobile = (data.mobile || '').replace(/\D/g, '').slice(-10);
    const email = (data.email || '').toLowerCase().trim();
    const now = new Date().toISOString();
    const query = [];
    if (email) query.push({ email });
    if (mobile) query.push({ mobile });
    const existing = query.length ? await this.users.findOne({ $or: query }) : null;
    if (existing) {
      const update = { ...data, updatedAt: now };
      if (mobile) update.mobile = mobile;
      if (email) update.email = email;
      await this.users.updateOne({ _id: existing._id }, { $set: update });
      const updated = await this.users.findOne({ _id: existing._id });
      const { passwordHash, ...safe } = stripMongoId(updated);
      return safe;
    } else {
      const user = {
        id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: data.name || '',
        mobile,
        email,
        passwordHash: data.passwordHash || '',
        provider: data.provider || 'local',
        createdAt: now,
        updatedAt: now
      };
      await this.users.insertOne({ ...user });
      const { passwordHash, ...safe } = user;
      return safe;
    }
  }
  async findCustomer(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const mobile = clean.replace(/\D/g, '').slice(-10);
    const or = [{ id: identifier }];
    if (clean.includes('@')) or.push({ email: clean });
    if (mobile.length === 10) or.push({ mobile });
    const doc = await this.users.findOne({ $or: or });
    return doc ? stripMongoId(doc) : null;
  }
  async listCustomerBookings(mobile, email) {
    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const or = [];
    if (cleanMobile) or.push({ 'devotee.mobile': { $regex: cleanMobile + '$' } });
    if (cleanEmail) or.push({ 'devotee.email': cleanEmail });
    if (!or.length) return [];
    const docs = await this.bookings.find({ $or: or }).sort({ createdAt: -1 }).toArray();
    return docs.map(stripMongoId);
  }

  // Customer legal consents
  async recordConsent(data) {
    const consent = {
      id: 'cst_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      customerId: data.customerId || '',
      name: data.name || '',
      email: (data.email || '').toLowerCase().trim(),
      mobile: (data.mobile || '').replace(/\D/g, '').slice(-10),
      disclaimerAccepted: Boolean(data.disclaimerAccepted !== false),
      termsAccepted: Boolean(data.termsAccepted !== false),
      privacyAccepted: Boolean(data.privacyAccepted !== false),
      serviceSpecificAcknowledgement: Boolean(data.serviceSpecificAcknowledgement),
      serviceType: data.serviceType || 'general',
      documentVersions: data.documentVersions || {
        disclaimer: '1.0',
        terms: '1.0',
        privacy: '1.0',
        refund: '1.0',
        consentPolicy: '1.0',
        grievance: '1.0'
      },
      consentSource: data.consentSource || 'portal_signup',
      ip: data.ip || '127.0.0.1',
      userAgent: data.userAgent || '',
      timestamp: data.timestamp || new Date().toISOString()
    };
    await this.consents.insertOne({ ...consent });
    return consent;
  }
  async listConsents(filter = {}, limit = 100) {
    const query = {};
    if (filter.serviceType) query.serviceType = filter.serviceType;
    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = filter.startDate;
      if (filter.endDate) query.timestamp.$lte = filter.endDate;
    }
    if (filter.q) {
      const rx = new RegExp(filter.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { email: rx }, { mobile: rx }, { id: rx }];
    }
    const docs = await this.consents.find(query).sort({ timestamp: -1 }).limit(limit).toArray();
    return docs.map(stripMongoId);
  }
  async getConsentHistory(customerId) {
    if (!customerId) return [];
    const clean = String(customerId).trim().toLowerCase();
    const mobile = clean.replace(/\D/g, '').slice(-10);
    const or = [{ customerId }, { email: clean }];
    if (mobile.length === 10) or.push({ mobile });
    const docs = await this.consents.find({ $or: or }).sort({ timestamp: -1 }).toArray();
    return docs.map(stripMongoId);
  }
}

/** Admin list filter → Mongo query. Text search is a case-insensitive "contains" on a few fields. */
function mongoFilter({ status, type, q } = {}, textFields) {
  const f = {};
  if (status) f.status = status;
  if (type) f.type = type;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    f.$or = textFields.map(k => ({ [k]: rx }));
  }
  return f;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
/**
 * Connects to MongoDB when MONGODB_URI is set; otherwise (or if the connection
 * fails) returns the file store so the site keeps working.
 * `options.client` lets tests inject a driver-compatible client.
 */
async function createStore(options = {}) {
  const uri = options.uri ?? process.env.MONGODB_URI;
  const dbName = options.dbName ?? process.env.MONGODB_DB ?? 'guruji';

  if (!uri && !options.client) {
    console.log('[db] MONGODB_URI not set — using local JSON files in ./data');
    return new FileStore().init();
  }
  if (uri && uri.includes('<db_password>')) {
    console.warn('[db] MONGODB_URI still contains <db_password>. Put the real password in .env — using local JSON files for now.');
    return new FileStore().init();
  }

  try {
    let client = options.client;
    if (!client) {
      const { MongoClient, ServerApiVersion } = require('mongodb');
      client = new MongoClient(uri, {
        serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
        serverSelectionTimeoutMS: 8000,
        appName: 'guruji-web'
      });
    }
    const store = await new MongoStore(client, dbName).init();
    console.log(`[db] Connected to MongoDB (database "${dbName}")`);
    return store;
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB: ${err.message}`);
    console.error('[db] Check the password in .env and that this machine\'s IP is in Atlas → Network Access. Falling back to local JSON files.');
    return new FileStore().init();
  }
}

module.exports = { createStore, FileStore, MongoStore };
