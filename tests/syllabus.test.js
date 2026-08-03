const test = require('node:test');
const assert = require('node:assert/strict');
const syllabus = require('../lib/syllabus');

const EXPECTED_SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', chapterCount: 14 },
  { id: 'physics', name: 'Physics', chapterCount: 5 },
  { id: 'chemistry', name: 'Chemistry', chapterCount: 5 },
  { id: 'biology', name: 'Biology', chapterCount: 5 },
  { id: 'history', name: 'History', chapterCount: 1 },
  { id: 'geography', name: 'Geography', chapterCount: 1 },
  { id: 'civics', name: 'Civics', chapterCount: 1 },
  { id: 'economics', name: 'Economics', chapterCount: 1 }
];

const EXPECTED_CHAPTERS = {
  mathematics: [
    'real-numbers', 'polynomials', 'pair-of-linear-equations',
    'quadratic-equations', 'arithmetic-progressions',
    'coordinate-geometry', 'triangles', 'circles',
    'introduction-to-trigonometry', 'applications-of-trigonometry',
    'areas-related-to-circles', 'surface-areas-and-volumes',
    'statistics', 'probability'
  ],
  physics: [
    'light-reflection-refraction', 'human-eye-and-colourful-world',
    'electricity', 'magnetic-effects-of-electric-current', 'sources-of-energy'
  ],
  chemistry: [
    'chemical-reactions-equations', 'acids-bases-salts',
    'metals-and-non-metals', 'carbon-and-its-compounds',
    'periodic-classification-elements'
  ],
  biology: [
    'life-processes', 'control-and-coordination',
    'how-do-organisms-reproduce', 'heredity-and-evolution',
    'natural-resources'
  ],
  history: ['nationalism-in-india'],
  geography: ['resources-and-development'],
  civics: ['power-sharing'],
  economics: ['sectors-of-indian-economy']
};

test('getSubjects: returns all 8 subjects with correct metadata', () => {
  const subjects = syllabus.getSubjects();
  assert.equal(subjects.length, 8);
  for (const expected of EXPECTED_SUBJECTS) {
    const found = subjects.find(s => s.id === expected.id);
    assert.ok(found, `Subject ${expected.id} not found`);
    assert.equal(found.name, expected.name);
    assert.equal(found.chapterCount, expected.chapterCount, `${expected.id} should have ${expected.chapterCount} chapters`);
  }
});

test('getSubjectById: returns every subject with all its chapters', () => {
  for (const expected of EXPECTED_SUBJECTS) {
    const subject = syllabus.getSubjectById(expected.id);
    assert.ok(subject, `Subject ${expected.id} not found`);
    assert.equal(subject.name, expected.name);
    assert.equal(subject.chapters.length, expected.chapterCount);
  }
});

test('getSubjectById: returns null for invalid id', () => {
  assert.equal(syllabus.getSubjectById('nonexistent'), null);
});

test('getChapter: returns every chapter for every subject', () => {
  for (const [subjectId, chapterIds] of Object.entries(EXPECTED_CHAPTERS)) {
    for (const chapterId of chapterIds) {
      const chapter = syllabus.getChapter(subjectId, chapterId);
      assert.ok(chapter, `Chapter ${chapterId} not found in ${subjectId}`);
      assert.equal(chapter.id, chapterId);
    }
  }
});

test('getChapter: each chapter has required fields', () => {
  for (const [subjectId, chapterIds] of Object.entries(EXPECTED_CHAPTERS)) {
    for (const chapterId of chapterIds) {
      const chapter = syllabus.getChapter(subjectId, chapterId);
      assert.ok(chapter.name, `Chapter ${chapterId} missing name`);
      assert.ok(chapter.summary, `Chapter ${chapterId} missing summary`);
      assert.ok(Array.isArray(chapter.topics), `Chapter ${chapterId} missing topics`);
      assert.ok(Array.isArray(chapter.exercises), `Chapter ${chapterId} missing exercises`);
    }
  }
});

test('getChapter: returns null for invalid subject', () => {
  assert.equal(syllabus.getChapter('nonexistent', 'real-numbers'), null);
});

test('getChapter: returns null for invalid chapter', () => {
  assert.equal(syllabus.getChapter('mathematics', 'nonexistent'), null);
});

test('searchSyllabus: returns empty result for empty query', () => {
  const result = syllabus.searchSyllabus('');
  assert.equal(result.subjects.length, 0);
  assert.equal(result.chapters.length, 0);
  assert.equal(result.topics.length, 0);
  assert.equal(result.exercises.length, 0);
});

test('searchSyllabus: finds subjects by name', () => {
  const result = syllabus.searchSyllabus('mathematics');
  assert.ok(result.subjects.length > 0);
});

test('searchSyllabus: finds chapters across subjects', () => {
  const result = syllabus.searchSyllabus('linear');
  assert.ok(result.chapters.length > 0 || result.topics.length > 0);
});

test('searchSyllabus: finds topics in all subjects', () => {
  const result = syllabus.searchSyllabus('Theorem');
  assert.ok(result.topics.length >= 2);
});

test('searchSyllabus: is case-insensitive', () => {
  const result1 = syllabus.searchSyllabus('MATHEMATICS');
  const result2 = syllabus.searchSyllabus('mathematics');
  assert.equal(result1.subjects.length, result2.subjects.length);
});

test('searchSyllabus: returns result with expected structure', () => {
  const result = syllabus.searchSyllabus('algebra');
  assert.ok(Array.isArray(result.subjects));
  assert.ok(Array.isArray(result.chapters));
  assert.ok(Array.isArray(result.topics));
  assert.ok(Array.isArray(result.exercises));
});
