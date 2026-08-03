/**
 * Shared HTTP client.
 *
 * Extracts the one fetch-with-timeout primitive that several external
 * connectors (MCP, KG, agent bridge) were each re-implementing. Centralising
 * it removes duplication and gives every connector identical timeout,
 * AbortController, and global-fetch fallback semantics.
 */
'use strict';

const fetchImpl = global.fetch || (() => {
  try {
    return require('node-fetch');
  } catch (err) {
    throw new Error('Global fetch is not available. Install node-fetch or use Node 18+.');
  }
})();

/**
 * fetch() that aborts the request after `timeout` ms (when supported).
 * Passed `options` are forwarded as-is except `timeout`, which is consumed.
 */
function fetchWithTimeout(url, options = {}) {
  const { timeout, ...fetchOptions } = options;
  if (!timeout || typeof AbortController === 'undefined') {
    return fetchImpl(url, fetchOptions);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetchImpl(url, { ...fetchOptions, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Convenience helper for JSON POSTs (the dominant pattern in this app).
 * Returns the raw Response; callers inspect `.ok`, `.status`, `.json()`.
 */
function postJson(url, { body, headers = {}, timeout } = {}) {
  return fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    timeout
  });
}

module.exports = { fetchImpl, fetchWithTimeout, postJson };