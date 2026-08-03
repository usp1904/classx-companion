const test = require('node:test');
const assert = require('node:assert/strict');
const flags = require('../lib/featureFlags');

test('list: returns all feature flags', () => {
  const all = flags.list();
  assert.ok(all.aiTutor === true);
  assert.ok(all.semanticCache === true);
  assert.ok(all.promptCascade === true);
  assert.ok(all.streamingResponses === true);
  assert.ok(all.requestCoalescing === false);
});

test('isEnabled: returns true for enabled flags', () => {
  assert.equal(flags.isEnabled('aiTutor'), true);
});

test('isEnabled: returns false for disabled flags', () => {
  assert.equal(flags.isEnabled('requestCoalescing'), false);
});

test('isEnabled: returns false for unknown flags', () => {
  assert.equal(flags.isEnabled('nonexistent'), false);
});
