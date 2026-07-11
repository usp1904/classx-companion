/**
 * MCP connector pattern
 *
 * Expects environment variables:
 *   MCP_ENDPOINT - full URL of the MCP query endpoint
 *   MCP_API_KEY  - optional bearer token for Authorization
 *
 * This module is intentionally generic so it can be wired to any
 * RAG / vector search / document retrieval service that supports an
 * HTTP query endpoint.
 */
const fetchImpl = global.fetch || (() => {
  try {
    return require('node-fetch');
  } catch (err) {
    throw new Error('Global fetch is not available. Install node-fetch or use Node 18+.');
  }
})();

const MCP_ENDPOINT = process.env.MCP_ENDPOINT;
const MCP_API_KEY = process.env.MCP_API_KEY;
const DEFAULT_TIMEOUT_MS = 10000;

function createFetchWithTimeout(url, options = {}) {
  const { timeout, ...fetchOptions } = options;
  if (!timeout || typeof AbortController === 'undefined') {
    return fetchImpl(url, fetchOptions);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetchImpl(url, { ...fetchOptions, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

async function fetchCurriculumChunk(query) {
  if (!MCP_ENDPOINT) {
    return { ok: false, error: 'MCP_ENDPOINT is not configured' };
  }

  const requestBody = {
    query,
    source: 'classx-companion',
    limit: 1
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (MCP_API_KEY) {
    headers.Authorization = `Bearer ${MCP_API_KEY}`;
  }

  try {
    const response = await createFetchWithTimeout(MCP_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      timeout: DEFAULT_TIMEOUT_MS
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        ok: false,
        error: `MCP request failed (${response.status})`,
        status: response.status,
        details
      };
    }

    const data = await response.json();
    return {
      ok: true,
      source: 'mcp',
      query,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: 'MCP connector error',
      details: error.message
    };
  }
}

module.exports = { fetchCurriculumChunk };
