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
