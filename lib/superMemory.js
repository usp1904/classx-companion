'use strict';

/**
 * SuperMemory — Semantic persistence layer between Compression Agent and Cache.
 *
 * Stores Caveman-compressed + RTK-tokenized outputs keyed by semantic hash,
 * with TTL, dedup, and provenance tracking.
 *
 * Flow: Drafting → Validate → Provenance Check → Compression Agent
 *       → SuperMemory → Redis Session Cache
 *
 * SuperMemory is "super" because it:
 *   1. Stores by semantic concept key, not raw question text
 *   2. Deduplicates semantically identical queries
 *   3. Tracks provenance (which NCERT ref, which mode)
 *   4. Supports batch recall for multi-concept queries
 */

const crypto = require('crypto');
const logger = require('./logger');
const config = require('./config');
const flags = require('./featureFlags');

// In-memory fallback when Redis unavailable
class MemoryStore {
  constructor() {
    this._store = new Map();
    this._ttlIndex = new Map();
    this._cleanupInterval = null;
  }

  startCleanup(intervalMs = 60000) {
    this._cleanupInterval = setInterval(() => this._evictExpired(), intervalMs);
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  stopCleanup() {
    if (this._cleanupInterval) clearInterval(this._cleanupInterval);
  }

  async get(key) {
    this._evictExpired();
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.ttl && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      this._ttlIndex.delete(key);
      return null;
    }
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  async set(key, value, ttlMs = 86400000) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this._store.set(key, { value, ttl: !!ttlMs, expiresAt, createdAt: Date.now(), accessCount: 0, lastAccessed: Date.now() });
    if (ttlMs) this._ttlIndex.set(key, expiresAt);
    return true;
  }

  async delete(key) {
    this._store.delete(key);
    this._ttlIndex.delete(key);
    return true;
  }

  async has(key) {
    this._evictExpired();
    return this._store.has(key);
  }

  async size() {
    this._evictExpired();
    return this._store.size;
  }

  async keys(pattern) {
    this._evictExpired();
    if (!pattern) return Array.from(this._store.keys());
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this._store.keys()).filter(k => regex.test(k));
  }

  _evictExpired() {
    const now = Date.now();
    for (const [key, expiresAt] of this._ttlIndex) {
      if (expiresAt && now > expiresAt) {
        this._store.delete(key);
        this._ttlIndex.delete(key);
      }
    }
  }

  async getStats() {
    this._evictExpired();
    const entries = Array.from(this._store.values());
    return {
      size: this._store.size,
      totalAccesses: entries.reduce((s, e) => s + (e.accessCount || 0), 0),
      avgAge: entries.length
        ? Math.round(entries.reduce((s, e) => s + (Date.now() - e.createdAt), 0) / entries.length)
        : 0,
    };
  }
}

/**
 * RTK Payload structure (mirrors Python RTKPayload for cross-language compatibility).
 * @typedef {Object} RTKPayload
 * @property {string} conceptKey
 * @property {string} questionHash
 * @property {string|null} ncertRef
 * @property {string|null} anchor
 * @property {string} core
 * @property {string|null} bridge
 * @property {string} mode
 * @property {Object<string,string>} latexMap
 * @property {string} compressedRepr
 */

class SuperMemory {
  constructor(options = {}) {
    this._store = options.store || new MemoryStore();
    this._store.startCleanup(options.cleanupIntervalMs || 60000);
    this._namespace = options.namespace || 'supermemory';
    this._defaultTtlMs = options.defaultTtlMs || 7 * 86400000; // 7 days
    this._hitRate = { hits: 0, misses: 0 };
  }

  /**
   * Internal key format: supermemory:<concept_key>:<mode>
   */
  _buildKey(conceptKey, mode) {
    return `${this._namespace}:${conceptKey}:${(mode || 'DUAL').toUpperCase()}`;
  }

  /**
   * Store a compressed RTK payload in SuperMemory.
   *
   * @param {RTKPayload} rtkPayload - The compressed payload from Compression Agent
   * @param {number} [ttlMs] - Optional TTL override
   * @returns {Promise<boolean>}
   */
  async store(rtkPayload, ttlMs) {
    const key = this._buildKey(rtkPayload.conceptKey, rtkPayload.mode);
    const entry = {
      conceptKey: rtkPayload.conceptKey,
      questionHash: rtkPayload.questionHash,
      ncertRef: rtkPayload.ncertRef || null,
      anchor: rtkPayload.anchor || null,
      core: rtkPayload.core,
      bridge: rtkPayload.bridge || null,
      mode: rtkPayload.mode,
      latexMap: rtkPayload.latexMap || {},
      compressedRepr: rtkPayload.compressedRepr,
      storedAt: Date.now(),
    };

    await this._store.set(key, entry, ttlMs || this._defaultTtlMs);

    // Also store by question hash for quick lookup
    const hashKey = `${this._namespace}:qh:${rtkPayload.questionHash}`;
    await this._store.set(hashKey, key, ttlMs || this._defaultTtlMs);

    logger.debug('SuperMemory: stored %s', key);
    return true;
  }

  /**
   * Retrieve by concept key + mode.
   *
   * @param {string} conceptKey
   * @param {string} [mode='DUAL']
   * @returns {Promise<RTKPayload|null>}
   */
  async recall(conceptKey, mode = 'DUAL') {
    const key = this._buildKey(conceptKey, mode);
    const entry = await this._store.get(key);
    if (entry) {
      this._hitRate.hits++;
      return entry;
    }
    this._hitRate.misses++;
    return null;
  }

  /**
   * Recall by question hash (fast path for exact query match).
   *
   * @param {string} questionHash
   * @returns {Promise<RTKPayload|null>}
   */
  async recallByHash(questionHash) {
    const hashKey = `${this._namespace}:qh:${questionHash}`;
    const conceptKey = await this._store.get(hashKey);
    if (!conceptKey) {
      this._hitRate.misses++;
      return null;
    }
    // The hash key stores the full key; reconstruct and fetch
    const entry = await this._store.get(conceptKey);
    if (entry) {
      this._hitRate.hits++;
      return entry;
    }
    this._hitRate.misses++;
    return null;
  }

  /**
   * Semantic recall: find all stored entries matching a prefix pattern.
   * Used for batch retrieval across related concepts.
   *
   * @param {string} conceptPrefix - e.g. "ck_a1b2" or "ch3_l1"
   * @returns {Promise<Array<RTKPayload>>}
   */
  async recallByPrefix(conceptPrefix) {
    const pattern = `${this._namespace}:${conceptPrefix}:*`;
    const keys = await this._store.keys(pattern);
    const results = [];
    for (const key of keys) {
      const entry = await this._store.get(key);
      if (entry) results.push(entry);
    }
    this._hitRate.hits += results.length;
    if (results.length === 0) this._hitRate.misses++;
    return results;
  }

  /**
   * Forget a specific compressed entry.
   *
   * @param {string} conceptKey
   * @param {string} [mode='DUAL']
   */
  async forget(conceptKey, mode = 'DUAL') {
    const key = this._buildKey(conceptKey, mode);
    await this._store.delete(key);
    logger.debug('SuperMemory: forgot %s', key);
  }

  /**
   * Clear all SuperMemory entries.
   */
  async clear() {
    const pattern = `${this._namespace}:*`;
    const keys = await this._store.keys(pattern);
    for (const key of keys) {
      await this._store.delete(key);
    }
    logger.info('SuperMemory: cleared %d entries', keys.length);
    this._hitRate = { hits: 0, misses: 0 };
  }

  /**
   * Get hit rate stats.
   */
  getHitRate() {
    const total = this._hitRate.hits + this._hitRate.misses;
    return {
      hits: this._hitRate.hits,
      misses: this._hitRate.misses,
      rate: total > 0 ? (this._hitRate.hits / total).toFixed(4) : 0,
    };
  }

  /**
   * Get store-level statistics.
   */
  async getStats() {
    const storeStats = await this._store.getStats();
    return {
      ...storeStats,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * Decompress a stored RTKPayload back into human-readable form.
   * Mirrors Python decompress_rtk().
   *
   * @param {RTKPayload} payload
   * @returns {string}
   */
  static decompress(payload) {
    let result = `Core: ${payload.core}\n`;
    if (payload.anchor) result = `Anchor: ${payload.anchor}\n${result}`;
    if (payload.bridge) result += `Bridge: ${payload.bridge}\n`;

    // Restore LaTeX
    if (payload.latexMap) {
      for (const [key, expr] of Object.entries(payload.latexMap)) {
        result = result.split(key).join(expr);
      }
    }

    return result.trim();
  }
}

// Singleton
let _instance = null;

function getSuperMemory(options) {
  if (!_instance) {
    _instance = new SuperMemory(options);
  }
  return _instance;
}

module.exports = {
  SuperMemory,
  getSuperMemory,
  MemoryStore,
};
