/**
 * Knowledge Graph connector pattern
 *
 * Expects environment variables:
 *   KG_ENDPOINT - full URL of the knowledge graph resolver endpoint
 *   KG_API_KEY  - optional bearer token for Authorization
 */
const fetchImpl = global.fetch || (() => {
  try {
    return require('node-fetch');
  } catch (err) {
    throw new Error('Global fetch is not available. Install node-fetch or use Node 18+.');
  }
})();

const KG_ENDPOINT = process.env.KG_ENDPOINT;
const KG_API_KEY = process.env.KG_API_KEY;
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

async function resolveEntity(entityId) {
  if (!KG_ENDPOINT) {
    return { ok: false, error: 'KG_ENDPOINT is not configured' };
  }

  const requestBody = {
    id: entityId,
    source: 'classx-companion'
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (KG_API_KEY) {
    headers.Authorization = `Bearer ${KG_API_KEY}`;
  }

  try {
    const response = await createFetchWithTimeout(KG_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      timeout: DEFAULT_TIMEOUT_MS
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        ok: false,
        error: `KG request failed (${response.status})`,
        status: response.status,
        details
      };
    }

    const data = await response.json();
    return {
      ok: true,
      source: 'kg',
      entityId,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: 'KG connector error',
      details: error.message
    };
  }
}

module.exports = { resolveEntity };
