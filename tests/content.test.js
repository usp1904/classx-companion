const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../lib/content');

test('listLessons: returns array', () => {
  const lessons = content.listLessons();
  assert.ok(Array.isArray(lessons));
});

test('listLessons: finds mathematics lessons', () => {
  const lessons = content.listLessons();
  const mathLessons = lessons.filter(l => l.subject === 'mathematics');
  assert.ok(mathLessons.length >= 1);
});

test('getLessonById: retrieves known lesson', () => {
  const lesson = content.getLessonById('real-numbers');
  assert.ok(lesson);
  assert.equal(lesson.subject, 'mathematics');
  assert.ok(lesson.data);
});

test('getLessonById: returns null for unknown lesson', () => {
  const lesson = content.getLessonById('nonexistent-lesson');
  assert.equal(lesson, null);
});

test('getLessonById: blocks path traversal', () => {
  const lesson = content.getLessonById('../etc/passwd');
  assert.equal(lesson, null);
});

test('getLessonById: blocks absolute paths', () => {
  const lesson = content.getLessonById('/etc/passwd');
  assert.equal(lesson, null);
});

test('contentRoot: returns a string path', () => {
  const root = content.contentRoot();
  assert.ok(typeof root === 'string');
  assert.ok(root.length > 0);
});

test('buildFlashcards: derives cards from lesson content', () => {
  const lesson = content.getLessonById('circles');
  const cards = content.buildFlashcards(lesson.data);
  assert.ok(cards.length > 0);
  for (const c of cards) {
    assert.ok(c.id);
    assert.ok(c.front);
    assert.ok('back' in c);
    assert.ok(c.source);
  }
});

test('buildFlashcards: tolerates malformed input', () => {
  assert.deepEqual(content.buildFlashcards(null), []);
  assert.deepEqual(content.buildFlashcards({}), []);
  assert.deepEqual(content.buildFlashcards({ exercises: 'not-an-object' }), []);
});
