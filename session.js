// GURUJI PALMISTRY — private video and audio sessions on Jitsi
//
// A booking gets one random room, used once. The server decides who may enter
// and when, and signs a short-lived token; the browser never chooses the room
// or the role.
//
// Three ways to run it, in order of preference:
//   1. JaaS (8x8 Jitsi as a Service), RS256 — JITSI_APP_ID, JITSI_KID, JITSI_PRIVATE_KEY
//   2. Self-hosted Jitsi with JWT auth, HS256 — JITSI_DOMAIN, JITSI_APP_ID, JITSI_APP_SECRET
//   3. Public meet.jit.si with an unguessable room name and NO token.
//      Anyone with the room name can walk in, so this is for demos only.

'use strict';

const crypto = require('crypto');

const num = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback);
const OPEN_BEFORE_MIN = num(process.env.JITSI_OPEN_BEFORE_MIN, 10);   // the room opens this long before the slot
const CLOSE_AFTER_MIN = num(process.env.JITSI_CLOSE_AFTER_MIN, 30);   // and closes this long after it ends
const DEFAULT_MINUTES = 45;   // session length when the service does not say

function jitsiConfig(env = process.env) {
  const appId = (env.JITSI_APP_ID || '').trim();
  const privateKey = (env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  const kid = (env.JITSI_KID || '').trim();
  const secret = (env.JITSI_APP_SECRET || '').trim();
  const domain = (env.JITSI_DOMAIN || '').trim();

  if (appId && kid && privateKey) {
    return { mode: 'jaas', domain: domain || '8x8.vc', appId, kid, privateKey, roomPrefix: appId + '/', production: true };
  }
  if (appId && secret && domain) {
    return { mode: 'self-hosted', domain, appId, secret, roomPrefix: '', production: true };
  }
  return { mode: 'public', domain: domain || 'meet.jit.si', roomPrefix: '', production: false };
}

/** A room nobody can guess: 32 characters of base32, used by exactly one booking. */
function newRoomName() {
  return 'guruji-' + crypto.randomBytes(20).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).toLowerCase();
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function signJwt(payload, { alg, key, kid }) {
  const header = { alg, typ: 'JWT' };
  if (kid) header.kid = kid;
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = alg === 'RS256'
    ? crypto.sign('RSA-SHA256', Buffer.from(body), key)
    : crypto.createHmac('sha256', key).update(body).digest();
  return `${body}.${b64url(signature)}`;
}

/**
 * The token for one person for one room. Moderator rights go to Guruji only;
 * the seeker is always a guest.
 */
function sessionToken(config, { room, name, moderator, expiresAt }) {
  const now = Math.floor(Date.now() / 1000);
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000);
  const user = { name: name || 'Guest', moderator: String(Boolean(moderator)) };

  if (config.mode === 'jaas') {
    return signJwt({
      aud: 'jitsi', iss: 'chat', sub: config.appId, room, nbf: now - 10, exp,
      context: { user: { ...user, id: crypto.randomUUID() }, features: { livestreaming: false, recording: false, transcription: false, 'outbound-call': false } }
    }, { alg: 'RS256', key: config.privateKey, kid: config.kid });
  }
  if (config.mode === 'self-hosted') {
    return signJwt({
      aud: config.appId, iss: config.appId, sub: config.domain, room, nbf: now - 10, exp,
      context: { user }, moderator: Boolean(moderator)
    }, { alg: 'HS256', key: config.secret });
  }
  return null;   // public mode has no token
}

/** When the room opens and closes, from the booking's slot. */
function sessionWindow(booking) {
  const start = booking.slotStart ? new Date(booking.slotStart) : null;
  if (!start || isNaN(start)) return null;
  const minutes = Number(booking.slotMinutes) || DEFAULT_MINUTES;
  const end = new Date(start.getTime() + minutes * 60000);
  return {
    start, end,
    opensAt: new Date(start.getTime() - OPEN_BEFORE_MIN * 60000),
    closesAt: new Date(end.getTime() + CLOSE_AFTER_MIN * 60000)
  };
}

module.exports = { jitsiConfig, newRoomName, sessionToken, sessionWindow, signJwt, OPEN_BEFORE_MIN, CLOSE_AFTER_MIN, DEFAULT_MINUTES };
