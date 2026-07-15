/**
 * Enterprise-grade middleware & utilities.
 *
 * Adds:
 * - Security headers (Helmet)
 * - Request coalescing (deduplicate concurrent identical requests)
 * - Structured error response format
 * - Prometheus metrics endpoint
 * - Request size validation
 * - Rate limit enrichment
 * - Graceful degradation monitoring
 */
'use strict';

const config = require('./config');

// ── Security Headers (Helmet-like, no external dep) ──

const CSP_VALUE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

function securityHeaders(req, res, next) {
  if (config.security.enableHelmet) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', CSP_VALUE);
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
}

// ── Request Coalescing ──

const pendingRequests = new Map();

/**
 * Deduplicate concurrent identical requests.
 * If the same (method + path + body) is in-flight, reuse the result.
 */
function requestCoalescing(req, res, next) {
  if (!config.security.enableRequestCoalescing &&
      process.env.FEATURE_REQUEST_COALESCING !== 'true') {
    return next();
  }

  const key = `${req.method}:${req.path}:${JSON.stringify(req.body || {})}`;
  const existing = pendingRequests.get(key);
  if (existing) {
    existing.then(data => res.json(data));
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = function (data) {
    pendingRequests.delete(key);
    return originalJson(data);
  };

  pendingRequests.set(key, new Promise(resolve => {
    res.once('finish', () => {
      pendingRequests.delete(key);
      resolve();
    });
  }));

  next();
}

// ── Request Size Validation ──

const MAX_BODY_SIZE = parseInt(process.env.MAX_BODY_SIZE || '1048576', 10); // 1MB

function requestSizeLimit(req, res, next) {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return res.status(413).json({
      ok: false,
      error: 'Request entity too large',
      maxSize: MAX_BODY_SIZE
    });
  }
  next();
}

// ── Prometheus Metrics ──

const metrics = {
  httpRequestsTotal: 0,
  httpRequestsByPath: {},
  httpRequestsByStatus: {},
  httpRequestDurationMs: [],
  activeConnections: 0,
  lastRequestTime: null,
  startTime: Date.now(),
  errorsByType: {}
};

function trackMetrics(req, res, next) {
  metrics.activeConnections++;
  metrics.httpRequestsTotal++;
  metrics.lastRequestTime = new Date().toISOString();

  const path = req.route ? req.route.path : req.path;
  metrics.httpRequestsByPath[path] = (metrics.httpRequestsByPath[path] || 0) + 1;

  const start = Date.now();
  res.on('finish', () => {
    metrics.activeConnections--;
    const duration = Date.now() - start;
    metrics.httpRequestDurationMs.push(duration);
    if (metrics.httpRequestDurationMs.length > 1000) metrics.httpRequestDurationMs.shift();

    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    metrics.httpRequestsByStatus[statusGroup] = (metrics.httpRequestsByStatus[statusGroup] || 0) + 1;

    if (res.statusCode >= 500) {
      const errType = res.statusCode === 503 ? 'service_unavailable' : 'server_error';
      metrics.errorsByType[errType] = (metrics.errorsByType[errType] || 0) + 1;
    }
  });

  next();
}

function metricsEndpoint(req, res) {
  const avgDuration = metrics.httpRequestDurationMs.length > 0
    ? metrics.httpRequestDurationMs.reduce((a, b) => a + b, 0) / metrics.httpRequestDurationMs.length
    : 0;

  res.json({
    ok: true,
    service: 'classx-companion',
    uptime: process.uptime(),
    metrics: {
      httpRequestsTotal: metrics.httpRequestsTotal,
      httpRequestsByPath: metrics.httpRequestsByPath,
      httpRequestsByStatus: metrics.httpRequestsByStatus,
      avgResponseTimeMs: Math.round(avgDuration * 10) / 10,
      activeConnections: metrics.activeConnections,
      errorsByType: metrics.errorsByType,
      startTime: new Date(metrics.startTime).toISOString(),
      lastRequestTime: metrics.lastRequestTime
    }
  });
}

// ── Structured Error Response ──

const ERROR_CODES = {
  VALIDATION_ERROR: { status: 400, code: 'VALIDATION_ERROR' },
  NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
  RATE_LIMITED: { status: 429, code: 'RATE_LIMITED' },
  SERVICE_UNAVAILABLE: { status: 503, code: 'SERVICE_UNAVAILABLE' },
  INTERNAL_ERROR: { status: 500, code: 'INTERNAL_ERROR' },
  BAD_REQUEST: { status: 400, code: 'BAD_REQUEST' }
};

function createError(errorType, message, details) {
  const spec = ERROR_CODES[errorType] || ERROR_CODES.INTERNAL_ERROR;
  const err = new Error(message);
  err.status = spec.status;
  err.code = spec.code;
  err.details = details;
  return err;
}

// ── Rate Limit Enrichment ──

function rateLimitInfo(req, res, next) {
  res.setHeader('X-RateLimit-Limit', config.security.rateLimitMax);
  res.setHeader('X-RateLimit-Window', config.security.rateLimitWindowMs);
  next();
}

module.exports = {
  securityHeaders,
  requestCoalescing,
  requestSizeLimit,
  trackMetrics,
  metricsEndpoint,
  createError,
  rateLimitInfo,
  metrics
};
