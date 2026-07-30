const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const api = require('./routes/api');
const agents = require('./routes/agents');
const config = require('./lib/config');
const logger = require('./lib/logger');
const enterprise = require('./lib/enterprise');
require('./lib/envCheck').validate();
require('./lib/database').initDatabase();


const path = require('path');
const crypto = require('crypto');
const app = express();

// Security: trust proxy if behind a reverse proxy (nginx, cloudflare, etc.)
if (config.server.trustProxy) {
  app.set('trust proxy', 1);
}

// ── Enterprise Middleware ──

// Compression (Brotli/gzip)
app.use(compression({ level: 6, threshold: 256 }));

// Security headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(enterprise.securityHeaders);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Window']
}));

// Request correlation ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Request size validation
app.use(enterprise.requestSizeLimit);

// HTTP request logging + metrics
app.use(enterprise.trackMetrics);
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http('%s %s %d %dms', req.method, req.originalUrl, res.statusCode, Date.now() - start);
  });
  next();
});

app.use(bodyParser.json({ limit: '1mb' }));

// Request coalescing (deduplicate concurrent identical requests)
app.use(enterprise.requestCoalescing);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' }
});
if (config.security.enableRateLimit) {
  app.use('/api', limiter);
}

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true,
  lastModified: true
}));

// Health route at /health
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'ClassX Companion API',
    version: require('./package.json').version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId: req.id,
    agents: process.env.AGENT_BRIDGE_URL ? 'configured' : 'not_configured'
  });
});

// Metrics endpoint (Prometheus-compatible)
app.get('/metrics', enterprise.metricsEndpoint);

// API routes
app.use('/api', api);
app.use('/api/agents', agents);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error [%s]: %s', req.id, err.message);
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('ClassX Companion API v%s listening on http://%s:%d', require('./package.json').version, config.server.host, config.server.port);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

function shutdown(signal) {
  logger.info('Received %s — shutting down gracefully...', signal);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}
