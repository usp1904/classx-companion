const test = require('node:test');
const assert = require('node:assert/strict');

test('logger: structured output format', () => {
  const logger = require('../lib/logger');
  let output = '';
  const origLog = console.log;
  console.log = (msg) => { output = msg; };
  logger.info('test message');
  console.log = origLog;
  const parsed = JSON.parse(output);
  assert.equal(parsed.level, 'info');
  assert.equal(parsed.message, 'test message');
  assert.ok(parsed.timestamp);
});

test('logger: interpolates format strings', () => {
  const logger = require('../lib/logger');
  let output = '';
  const origLog = console.log;
  console.log = (msg) => { output = msg; };
  logger.info('hello %s %d', 'world', 42);
  console.log = origLog;
  const parsed = JSON.parse(output);
  assert.equal(parsed.message, 'hello world 42');
});
