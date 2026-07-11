const test = require('node:test');
const assert = require('node:assert/strict');
const { loadInstructionModules, getInstructionByName } = require('../lib/instructionBank');

test('loads markdown instruction modules from the workspace', () => {
  const modules = loadInstructionModules();
  assert.ok(Array.isArray(modules));
  assert.ok(modules.length >= 5);
  const guard = getInstructionByName('curriculum-guard');
  assert.ok(guard);
  assert.match(guard.content, /NCERT 2026-27/i);
  assert.equal(guard.frontmatter.name, 'curriculum-guard');
});
