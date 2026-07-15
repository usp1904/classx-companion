/**
 * Semantic cache for AI tutor responses.
 *
 * Why: the same questions get asked many times ("What is photosynthesis?").
 * We don't want to re-call the LLM for every one. The cache stores
 * (question, answer) pairs and looks them up by *semantic* similarity, not
 * exact text match.
 *
 * Today: in-memory LRU + bag-of-words cosine similarity (good enough for
 * Phase 0/1 with low cardinality of unique questions).
 *
 * Tomorrow: swap for Redis + real embedding cosine. The interface is
 * `get(question)` / `set(question, answer)`. That's the only contract.
 *
 * Future tweaks:
 *  - Move storage to Redis: replace `_store` with a Redis client.
 *  - Better similarity: replace `_similarity` with a real embedding call.
 *  - Persistence: serialize `_store` to disk on shutdown.
 */
'use strict';

const config = require('./config');
const flags = require('./featureFlags');

class SemanticCache {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || config.ai.cache.maxEntries;
    this.threshold = options.similarityThreshold || config.ai.cache.similarityThreshold;
    this._store = new Map(); // preserves insertion order for LRU eviction
  }

  _tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  _vector(tokens) {
    const freq = Object.create(null);
    for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
    return freq;
  }

  _cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (const k in a) { na += a[k] * a[k]; if (k in b) dot += a[k] * b[k]; }
    for (const k in b) { nb += b[k] * b[k]; }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  _similarity(q1, q2) {
    const v1 = this._vector(this._tokenize(q1));
    const v2 = this._vector(this._tokenize(q2));
    return this._cosine(v1, v2);
  }

  get(question) {
    if (!flags.isEnabled('semanticCache')) return null;
    if (!question || !this._store.size) return null;
    let best = null;
    let bestScore = 0;
    for (const entry of this._store.values()) {
      const score = this._similarity(question, entry.question);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    if (best && bestScore >= this.threshold) {
      // Refresh LRU position
      this._store.delete(best.question);
      this._store.set(best.question, best);
      return { answer: best.answer, score: bestScore, cached: true };
    }
    return null;
  }

  set(question, answer) {
    if (!flags.isEnabled('semanticCache')) return;
    if (!question || !answer) return;
    if (this._store.has(question)) this._store.delete(question);
    this._store.set(question, { question, answer, createdAt: Date.now() });
    // LRU eviction
    while (this._store.size > this.maxEntries) {
      const oldest = this._store.keys().next().value;
      this._store.delete(oldest);
    }
  }

  size() { return this._store.size; }

  clear() { this._store.clear(); }
}

// Singleton — one cache for the whole process.
const cache = new SemanticCache();

module.exports = cache;
module.exports.SemanticCache = SemanticCache;
