/**
 * Auth helpers (VidyaSethu MVP).
 *
 * Dependency-free, Node-only primitives:
 *  - Password hashing with scrypt (salt + hash, constant-time verify).
 *  - Unsigned but integrity-protected bearer tokens (HMAC-signed payload).
 *
 * Token format: `<base64url(jsonPayload)>.<base64url(hmacSig)>`. We keep this
 * deliberately small and dependency-free to fit the local/sqlite profile —
 * swap for Keycloak / JWT when the platform grows (see VidyaSethu §"Auth").
 */
'use strict';

const crypto = require('crypto');

const KEY_LEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, KEY_LEN, SCRYPT_OPTS).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const idx = stored.indexOf(':');
  if (idx <= 0) return false;
  const salt = stored.slice(0, idx);
  const expected = stored.slice(idx + 1);
  const candidate = crypto.scryptSync(String(password), salt, KEY_LEN, SCRYPT_OPTS).toString('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(candidate, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createToken(userId, secret) {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', String(secret)).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expect = crypto.createHmac('sha256', String(secret)).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken };