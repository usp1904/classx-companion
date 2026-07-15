const test = require('node:test');
const assert = require('node:assert/strict');

test('envCheck: validate does not throw with current env', () => {
  const { validate } = require('../lib/envCheck');
  // Should not exit or throw since there are no REQUIRED_VARS
  validate();
  assert.ok(true);
});
