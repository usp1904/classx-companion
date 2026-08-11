/**
 * Feature flags.
 *
 * Every new capability should be added here as a flag with a safe default.
 * Flags can be overridden via env vars (`FEATURE_<NAME>=true|false`).
 *
 * Why this exists: it lets us deploy code that's not yet ready for everyone,
 * and turn things on/off without a redeploy (just bounce the process).
 *
 * Future tweaks: add a new entry to the table below. No other file changes
 * required to gate the feature.
 */
'use strict';

const env = process.env;

function readFlag(name, defaultValue) {
  const envName = `FEATURE_${name.toUpperCase()}`;
  if (env[envName] === undefined) return defaultValue;
  const v = String(env[envName]).toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return defaultValue;
}

// Single source of truth for every on/off switch in the app.
const flags = {
  // Endpoints / features
  aiTutor: readFlag('ai_tutor', true),
  semanticCache: readFlag('semantic_cache', true),
  promptCascade: readFlag('prompt_cascade', true),
  contentApi: readFlag('content_api', true),
  lessons: readFlag('lessons', true),
  syllabusSearch: readFlag('syllabus_search', true),
  mcpConnector: readFlag('mcp_connector', true),
  kgConnector: readFlag('kg_connector', true),
  tutorScaffold: readFlag('tutor_scaffold', true),

  // Experimental — off by default
  streamingResponses: readFlag('streaming_responses', true),
  requestCoalescing: readFlag('request_coalescing', false),

  // LangGraph-powered agent workflows
  langGraph: readFlag('lang_graph', true),

  // Caveman + RTK compression and SuperMemory persistence
  superMemory: readFlag('super_memory', true),
  cavemanCompression: readFlag('caveman_compression', true),

  // VidyaSethu MVP — engagement (auth + gamification + analytics)
  engagement: readFlag('engagement', true),
};

function isEnabled(name) {
  return Boolean(flags[name]);
}

function list() {
  return { ...flags };
}

module.exports = { isEnabled, list, flags };
