const test = require('node:test');
const assert = require('node:assert/strict');

test('config: is frozen and immutable', () => {
  const config = require('../lib/config');
  const original = config.server.port;
  try { config.server.port = 9999; } catch (_) {}
  assert.equal(config.server.port, original);
});

test('config: has expected structure', () => {
  const config = require('../lib/config');
  assert.ok(config.server);
  assert.ok(config.security);
  assert.ok(config.connectors);
  assert.ok(config.ai);
  assert.ok(config.content);
  assert.ok(config.logging);
  assert.ok(typeof config.server.port === 'number');
  assert.ok(typeof config.security.enableRateLimit === 'boolean');
});

test('config: has sensible defaults', () => {
  const config = require('../lib/config');
  assert.equal(config.server.port, 3000);
  assert.equal(config.ai.provider, 'stub');
  assert.equal(config.logging.level, 'info');
});
