/**
 * Centralized configuration.
 *
 * All runtime configuration flows through this file. Every value can be
 * overridden via environment variables. Defaults are tuned for local dev
 * and a single VM "Phase 1" deployment.
 *
 * Future tweaks: change the env var, or edit the default here. The rest of
 * the codebase reads from this single module — no scattered `process.env.X`
 * reads anywhere else.
 */
'use strict';

function bool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return defaultValue;
}

function num(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

const config = {
  server: {
    port: num(process.env.PORT, 3000),
    host: process.env.HOST || '0.0.0.0',
    trustProxy: bool(process.env.TRUST_PROXY, false)
  },

  security: {
    enableHelmet: bool(process.env.ENABLE_HELMET, true),
    enableRateLimit: bool(process.env.ENABLE_RATE_LIMIT, true),
    enableRequestCoalescing: bool(process.env.ENABLE_REQUEST_COALESCING, false),
    rateLimitWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    rateLimitMax: num(process.env.RATE_LIMIT_MAX, 120)
  },

  connectors: {
    mcp: {
      endpoint: process.env.MCP_ENDPOINT || '',
      apiKey: process.env.MCP_API_KEY || '',
      timeoutMs: num(process.env.MCP_TIMEOUT_MS, 10_000)
    },
    kg: {
      endpoint: process.env.KG_ENDPOINT || '',
      apiKey: process.env.KG_API_KEY || '',
      timeoutMs: num(process.env.KG_TIMEOUT_MS, 10_000)
    }
  },

  ai: {
    // Provider: 'stub' (deterministic, no LLM) | 'ollama' (local model) | 'openrouter' (free tier)
    provider: (process.env.AI_PROVIDER || 'stub').toLowerCase(),
    // Prompt cascade: route by detected difficulty
    enableCascade: bool(process.env.AI_ENABLE_CASCADE, true),
    // Semantic cache: deduplicate repeated questions
    enableSemanticCache: bool(process.env.AI_ENABLE_SEMANTIC_CACHE, true),
    cache: {
      maxEntries: num(process.env.AI_CACHE_MAX_ENTRIES, 500),
      // Cosine similarity threshold for cache hit (0..1). Higher = stricter.
      similarityThreshold: num(process.env.AI_CACHE_SIMILARITY, 0.95)
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      smallModel: process.env.OLLAMA_SMALL_MODEL || 'llama3.2:1b',
      mediumModel: process.env.OLLAMA_MEDIUM_MODEL || 'llama3.1:8b',
      largeModel: process.env.OLLAMA_LARGE_MODEL || 'qwen2.5:14b',
      timeoutMs: num(process.env.OLLAMA_TIMEOUT_MS, 30_000)
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    }
  },

  content: {
    // Root directory for authored lessons
    root: process.env.CONTENT_ROOT || 'content'
  },

  doomLoop: {
    // Hard ceiling on iterations per loop invocation
    maxIterations: num(process.env.DOOM_LOOP_MAX_ITERATIONS, 10),
    // Consecutive identical outputs before loop is killed
    maxRepetitions: num(process.env.DOOM_LOOP_MAX_REPETITIONS, 3),
    // State fingerprint keys used for repetition detection
    fingerprintKeys: (process.env.DOOM_LOOP_FINGERPRINT_KEYS || 'score,recommended_difficulty,passes,hint_level').split(',')
  },

  logging: {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase()
  }
};

// Freeze so accidental mutation is impossible.
Object.freeze(config);
Object.freeze(config.server);
Object.freeze(config.security);
Object.freeze(config.connectors);
Object.freeze(config.connectors.mcp);
Object.freeze(config.connectors.kg);
Object.freeze(config.ai);
Object.freeze(config.ai.cache);
Object.freeze(config.ai.ollama);
Object.freeze(config.ai.openrouter);
Object.freeze(config.content);
Object.freeze(config.doomLoop);
Object.freeze(config.logging);

module.exports = config;
