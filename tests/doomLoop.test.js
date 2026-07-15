'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { DoomLoop, createDoomGuard } = require('../lib/doomLoop');

test('DoomLoop: check passes on first call', () => {
  const dl = new DoomLoop({ maxIterations: 5, maxRepetitions: 3 });
  const r = dl.check({ score: 0.5 });
  assert.equal(r.ok, true);
  assert.equal(r.terminated, false);
  assert.equal(r.iterationsUsed, 1);
});

test('DoomLoop: terminates on maxIterations', () => {
  const dl = new DoomLoop({ maxIterations: 2, maxRepetitions: 5 });
  dl.check({ score: 0.5 });
  const r = dl.check({ score: 0.5 });
  assert.equal(r.ok, true);
  const r2 = dl.check({ score: 0.5 });
  assert.equal(r2.ok, false);
  assert.equal(r2.terminated, true);
  assert.equal(r2.reason, 'max_iterations_exceeded');
});

test('DoomLoop: terminates on state repetition', () => {
  const dl = new DoomLoop({ maxIterations: 10, maxRepetitions: 3 });
  dl.check({ score: 0.5 });
  dl.check({ score: 0.5 });
  const r = dl.check({ score: 0.5 });
  assert.equal(r.ok, false);
  assert.equal(r.terminated, true);
  assert.equal(r.reason, 'state_repetition');
  assert.equal(r.repetitions, 3);
});

test('DoomLoop: changing state avoids repetition', () => {
  const dl = new DoomLoop({ maxIterations: 10, maxRepetitions: 3 });
  dl.check({ score: 0.3 });
  dl.check({ score: 0.6 });
  const r = dl.check({ score: 0.9 });
  assert.equal(r.ok, true);
  assert.equal(r.terminated, false);
});

test('DoomLoop: fingerprint only uses configured keys', () => {
  const dl = new DoomLoop({
    maxIterations: 10,
    maxRepetitions: 3,
    fingerprintKeys: ['score', 'recommended_difficulty']
  });
  const fp1 = dl.fingerprint({ score: 0.5, recommended_difficulty: 'MEDIUM', extra: 'ignored' });
  const fp2 = dl.fingerprint({ score: 0.5, recommended_difficulty: 'MEDIUM', extra: 'different' });
  assert.equal(fp1, fp2);
});

test('DoomLoop: reset clears history', () => {
  const dl = new DoomLoop({ maxIterations: 10, maxRepetitions: 3 });
  dl.check({ score: 0.5 });
  dl.check({ score: 0.5 });
  dl.reset();
  assert.equal(dl.iterationCount, 0);
  const r = dl.check({ score: 0.5 });
  assert.equal(r.ok, true);
});

test('DoomLoop: iterationCount returns correct count', () => {
  const dl = new DoomLoop({ maxIterations: 10, maxRepetitions: 3 });
  assert.equal(dl.iterationCount, 0);
  dl.check({ score: 0.5 });
  assert.equal(dl.iterationCount, 1);
  dl.check({ score: 0.5 });
  assert.equal(dl.iterationCount, 2);
});

test('DoomLoop: deep path fingerprinting', () => {
  const dl = new DoomLoop({
    maxIterations: 10,
    maxRepetitions: 3,
    fingerprintKeys: ['tutor_output.mode', 'evaluator_output.score']
  });
  const state = { tutor_output: { mode: 'DUAL' }, evaluator_output: { score: 0.7 } };
  const fp = dl.fingerprint(state);
  assert.ok(fp.includes('DUAL'));
  assert.ok(fp.includes('0.7'));
});

test('DoomLoop: _deepGet returns undefined for missing path', () => {
  const dl = new DoomLoop();
  assert.equal(dl._deepGet({ a: 1 }, 'b.c'), undefined);
});

test('createDoomGuard: returns guard and wrap function', () => {
  const { guard, wrap } = createDoomGuard('test_loop', 5);
  assert.ok(guard instanceof DoomLoop);
  assert.equal(typeof wrap, 'function');
});
