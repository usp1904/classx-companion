const test = require('node:test');
const assert = require('node:assert/strict');

test('classifyDifficulty: classifies SIMPLE questions', () => {
  const { classifyDifficulty } = require('../services/aiTutor');
  assert.equal(classifyDifficulty('What is Newton\'s first law?'), 'SIMPLE');
  assert.equal(classifyDifficulty('Define force'), 'SIMPLE');
  assert.equal(classifyDifficulty('Name the planets'), 'SIMPLE');
});

test('classifyDifficulty: classifies HARD questions', () => {
  const { classifyDifficulty } = require('../services/aiTutor');
  assert.equal(classifyDifficulty('Derive the quadratic formula'), 'HARD');
  assert.equal(classifyDifficulty('Prove Pythagoras theorem'), 'HARD');
  assert.equal(classifyDifficulty('Analyse the impact of force'), 'HARD');
});

test('classifyDifficulty: defaults to MEDIUM for ambiguous', () => {
  const { classifyDifficulty } = require('../services/aiTutor');
  assert.equal(classifyDifficulty('Tell me about gravity'), 'MEDIUM');
  assert.equal(classifyDifficulty(''), 'MEDIUM');
});

test('classifyDifficulty: handles null/undefined', () => {
  const { classifyDifficulty } = require('../services/aiTutor');
  assert.equal(classifyDifficulty(null), 'MEDIUM');
  assert.equal(classifyDifficulty(undefined), 'MEDIUM');
});

test('StubProvider: returns structured response', async () => {
  const { _internal: { StubProvider } } = require('../services/aiTutor');
  const provider = new StubProvider();
  const result = await provider.generate({ prompt: 'What is force?', tier: 'SIMPLE' });
  assert.ok(result.text);
  assert.ok(result.text.includes('Class 6 Anchor'));
  assert.ok(result.text.includes('NCERT Core'));
  assert.ok(result.text.includes('JEE/NEET Bridge'));
  assert.equal(result.provider, 'stub');
  assert.equal(result.tier, 'SIMPLE');
});

test('StubProvider: includes context when provided', async () => {
  const { _internal: { StubProvider } } = require('../services/aiTutor');
  const provider = new StubProvider();
  const result = await provider.generate({ prompt: 'What is force?', tier: 'SIMPLE', context: { lessonId: 'ch3-l1' } });
  assert.ok(result.usedContext);
  assert.ok(result.text.includes('ch3-l1'));
});

test('getProvider: returns stub by default', () => {
  const { getProvider } = require('../services/aiTutor');
  const provider = getProvider();
  assert.equal(provider.name, 'stub');
});

test('askTutor: rejects missing question', async () => {
  const { askTutor } = require('../services/aiTutor');
  const result = await askTutor({});
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test('askTutor: processes valid request', async () => {
  const { askTutor } = require('../services/aiTutor');
  const result = await askTutor({ question: 'What is gravity?', mode: 'BOARD' });
  assert.equal(result.ok, true);
  assert.equal(result.source, 'stub');
  assert.ok(result.tier);
  assert.ok(result.answer);
});
