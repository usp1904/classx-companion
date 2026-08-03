const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('../lib/database');
const { getSyllabusTree, searchHybrid, resolveConceptGraph, getProblemDetails } = require('../lib/ragService');

test('database: core schema tables exist', () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  for (const t of ['subjects', 'chapters', 'topics', 'problems', 'solutions', 'concept_nodes', 'concept_edges']) {
    assert.ok(tables.includes(t), `missing table ${t}`);
  }
});

test('ragService: returns well-shaped results on empty/unseeded DB', () => {
  assert.ok(Array.isArray(getSyllabusTree()));
  const search = searchHybrid('Linear');
  assert.ok(Array.isArray(search.problems));
  assert.ok(Array.isArray(search.topics));
  assert.ok(Array.isArray(search.concepts));
  assert.equal(resolveConceptGraph('c-lin-eq-2var'), null);
  assert.equal(getProblemDetails('p-ncert-3.2-1'), null);
});
