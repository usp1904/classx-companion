const test = require('node:test');
const assert = require('node:assert/strict');
const { SemanticCache } = require('../lib/semanticCache');

test('SemanticCache: stores and retrieves exact match', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.9 });
  cache.set('What is Newton\'s first law?', 'An object at rest stays at rest.');
  const result = cache.get('What is Newton\'s first law?');
  assert.ok(result);
  assert.equal(result.cached, true);
  assert.ok(result.score >= 0.9);
});

test('SemanticCache: returns null for uncached question', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.99 });
  cache.set('What is gravity?', 'A force.');
  const result = cache.get('Who was the first president?');
  assert.equal(result, null);
});

test('SemanticCache: finds similar question above threshold', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.3 });
  cache.set('what is photosynthesis', 'Plants make food.');
  const result = cache.get('photosynthesis');
  assert.ok(result, 'Should find similar question');
  assert.ok(result.score >= 0.3);
});

test('SemanticCache: respects maxEntries with eviction', () => {
  const cache = new SemanticCache({ maxEntries: 3, similarityThreshold: 0.99 });
  cache.set('q1', 'a1');
  cache.set('q2', 'a2');
  cache.set('q3', 'a3');
  cache.set('q4', 'a4');
  assert.equal(cache.size(), 3);
  // q1 should be evicted, q2-q4 remain
  assert.equal(cache.get('q1'), null);
  assert.ok(cache.get('q2'));
  assert.ok(cache.get('q3'));
  assert.ok(cache.get('q4'));
});

test('SemanticCache: clear removes all entries', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.9 });
  cache.set('q1', 'a1');
  cache.set('q2', 'a2');
  cache.clear();
  assert.equal(cache.size(), 0);
});

test('SemanticCache: size returns correct count', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.9 });
  assert.equal(cache.size(), 0);
  cache.set('q1', 'a1');
  assert.equal(cache.size(), 1);
  cache.set('q2', 'a2');
  assert.equal(cache.size(), 2);
});

test('SemanticCache: get returns null for empty cache', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.9 });
  assert.equal(cache.get('anything'), null);
});

test('SemanticCache: set with null question does nothing', () => {
  const cache = new SemanticCache({ maxEntries: 10, similarityThreshold: 0.9 });
  cache.set(null, 'answer');
  assert.equal(cache.size(), 0);
});

test('SemanticCache: LRU refresh on get hit', () => {
  const cache = new SemanticCache({ maxEntries: 2, similarityThreshold: 0.99 });
  cache.set('q1', 'a1');
  cache.set('q2', 'a2');
  cache.get('q1'); // refresh q1
  cache.set('q3', 'a3'); // should evict q2 (oldest), not q1
  assert.ok(cache.get('q1'));
  assert.equal(cache.get('q2'), null);
  assert.ok(cache.get('q3'));
});
