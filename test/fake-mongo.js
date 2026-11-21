// Minimal in-memory stand-in for the MongoDB Node.js driver — only the
// methods db.js uses. Lets the API be tested without a database server.
'use strict';

const clone = (v) => (v === undefined ? v : structuredClone(v));
let nextId = 1;

function getPath(obj, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, key, value) {
  const parts = key.split('.');
  let o = obj;
  for (const p of parts.slice(0, -1)) { if (o[p] == null || typeof o[p] !== 'object') o[p] = {}; o = o[p]; }
  o[parts[parts.length - 1]] = value;
}
function matchValue(actual, cond) {
  if (cond instanceof RegExp) return typeof actual === 'string' && cond.test(actual);
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    return Object.entries(cond).every(([op, v]) => {
      if (op === '$in') return v.includes(actual);
      if (op === '$gt') return actual !== undefined && actual > v;
      if (op === '$ne') return actual !== v;
      if (op === '$exists') return (actual !== undefined) === Boolean(v);
      throw new Error('fake-mongo: unsupported operator ' + op);
    });
  }
  return actual === cond;
}
const matches = (doc, filter) => Object.entries(filter).every(([k, v]) =>
  k === '$or' ? v.some(f => matches(doc, f)) : matchValue(getPath(doc, k), v));

class Cursor {
  constructor(docs) { this.docs = docs; }
  sort(spec) {
    const keys = Object.entries(spec);
    this.docs.sort((a, b) => {
      for (const [k, dir] of keys) {
        const x = getPath(a, k), y = getPath(b, k);
        if (x === y) continue;
        if (x === undefined) return 1 * dir;   // missing sorts lowest (Mongo semantics)
        if (y === undefined) return -1 * dir;
        return (x < y ? -1 : 1) * dir;
      }
      return 0;
    });
    return this;
  }
  limit(n) { this.docs = this.docs.slice(0, n); return this; }
  async toArray() { return this.docs.map(clone); }
}

class Collection {
  constructor() { this.docs = []; this.unique = []; }
  async createIndex(spec, opts = {}) { if (opts.unique) this.unique.push(Object.keys(spec)[0]); return 'ok'; }
  checkUnique(doc) {
    for (const k of this.unique) {
      if (this.docs.some(d => getPath(d, k) === getPath(doc, k))) {
        const e = new Error(`E11000 duplicate key error: ${k}`); e.code = 11000; throw e;
      }
    }
  }
  async countDocuments(filter = {}) { return this.docs.filter(d => matches(d, filter)).length; }
  async insertOne(doc) { const d = { _id: nextId++, ...clone(doc) }; this.checkUnique(d); this.docs.push(d); return { insertedId: d._id }; }
  async insertMany(docs) { for (const d of docs) await this.insertOne(d); return { insertedCount: docs.length }; }
  find(filter = {}) { return new Cursor(this.docs.filter(d => matches(d, filter))); }
  async findOne(filter) { return clone(this.docs.find(d => matches(d, filter)) || null); }
  async findOneAndUpdate(filter, update, opts = {}) {
    if (opts.includeResultMetadata !== false) throw new Error('db.js must pass includeResultMetadata:false');
    const d = this.docs.find(x => matches(x, filter));
    if (!d) return null;
    for (const [k, v] of Object.entries(update.$set || {})) setPath(d, k, clone(v));
    for (const [k, v] of Object.entries(update.$push || {})) { const arr = getPath(d, k) || []; arr.push(clone(v)); setPath(d, k, arr); }
    return clone(d);
  }
  async updateOne(filter, update, opts = {}) {
    let d = this.docs.find(x => matches(x, filter));
    if (!d) {
      if (!opts.upsert) return { matchedCount: 0 };
      d = { _id: nextId++, ...clone(filter) };
      this.docs.push(d);
    }
    for (const [k, v] of Object.entries(update.$set || {})) setPath(d, k, clone(v));
    return { matchedCount: 1 };
  }
  async updateMany(filter, update) {
    const hits = this.docs.filter(d => matches(d, filter));
    for (const d of hits) for (const [k, v] of Object.entries(update.$set || {})) setPath(d, k, clone(v));
    return { matchedCount: hits.length, modifiedCount: hits.length };
  }
  async deleteOne(filter) { const i = this.docs.findIndex(d => matches(d, filter)); if (i >= 0) this.docs.splice(i, 1); return { deletedCount: i >= 0 ? 1 : 0 }; }
}

class FakeMongoClient {
  constructor() { this.dbs = new Map(); this.connected = false; }
  async connect() { this.connected = true; return this; }
  async close() { this.connected = false; }
  db(name) {
    if (!this.dbs.has(name)) {
      const cols = new Map();
      this.dbs.set(name, { collection: (c) => { if (!cols.has(c)) cols.set(c, new Collection()); return cols.get(c); }, _cols: cols });
    }
    return this.dbs.get(name);
  }
}

module.exports = { FakeMongoClient };
