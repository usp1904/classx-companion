const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateQuestionMetadata,
  enforceLaTeX,
  autoConvertLaTeX,
  curriculumGuard,
  generateHistoricalPaperTags,
  formatMath,
  dualModeRouter
} = require('../lib/validator');

test('validateQuestionMetadata: accepts valid metadata', () => {
  const result = validateQuestionMetadata({
    source_exam_origin: 'NCERT',
    academic_source_truth: 'NCERT Class X',
    cognitive_complexity_tier: 'TIER_1_BASIC',
    prerequisite_nodes: ['MATH_CLASS6_FRACTIONS']
  });
  assert.equal(result.valid, true);
});

test('validateQuestionMetadata: rejects invalid metadata', () => {
  const result = validateQuestionMetadata({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('validateQuestionMetadata: rejects null', () => {
  const result = validateQuestionMetadata(null);
  assert.equal(result.valid, false);
});

test('enforceLaTeX: passes clean text', () => {
  const result = enforceLaTeX('Solve $\\frac{1}{2}$ for $x$');
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test('enforceLaTeX: flags plaintext fraction', () => {
  const result = enforceLaTeX('Solve 1/2 for x');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(i => i.includes('1/2')));
});

test('enforceLaTeX: flags caret power', () => {
  const result = enforceLaTeX('x^2 + 1');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(i => i.includes('x^2')));
});

test('enforceLaTeX: empty string passes', () => {
  const result = enforceLaTeX('');
  assert.equal(result.ok, true);
});

test('autoConvertLaTeX: converts fraction', () => {
  const result = autoConvertLaTeX('1/2');
  assert.ok(result.converted.includes('\\frac'));
});

test('autoConvertLaTeX: converts power', () => {
  const result = autoConvertLaTeX('x^2');
  assert.ok(result.converted.includes('^'));
});

test('autoConvertLaTeX: leaves existing LaTeX untouched', () => {
  const result = autoConvertLaTeX('$\\alpha$ is 1/2');
  assert.ok(result.converted.includes('\\alpha'));
});

test('curriculumGuard: accepts valid metadata', () => {
  const result = curriculumGuard({
    source_exam_origin: 'NCERT',
    academic_source_truth: 'NCERT Class X',
    cognitive_complexity_tier: 'TIER_1_BASIC'
  });
  assert.equal(result.ok, true);
});

test('curriculumGuard: rejects null', () => {
  const result = curriculumGuard(null);
  assert.equal(result.ok, false);
});

test('curriculumGuard: rejects invalid tier', () => {
  const result = curriculumGuard({
    source_exam_origin: 'NCERT',
    academic_source_truth: 'NCERT Class X',
    cognitive_complexity_tier: 'INVALID_TIER'
  });
  assert.equal(result.ok, false);
});

test('curriculumGuard: warns on board source with JEE tier', () => {
  const result = curriculumGuard({
    source_exam_origin: 'NCERT Board Exam',
    academic_source_truth: 'NCERT Class X',
    cognitive_complexity_tier: 'TIER_3_JEE_NEET_CHALLENGE'
  });
  assert.equal(result.ok, false);
});

test('generateHistoricalPaperTags: returns tags from metadata', () => {
  const result = generateHistoricalPaperTags({
    source_exam_origin: 'CBSE-2024',
    academic_source_truth: 'NCERT',
    cognitive_complexity_tier: 'TIER_2_EXTENDED',
    prerequisite_nodes: ['quadratic_equations'],
    tags: ['algebra']
  });
  assert.equal(result.ok, true);
  assert.ok(result.tags.includes('CBSE-2024'));
  assert.ok(result.tags.includes('NCERT'));
  assert.ok(result.tags.includes('quadratic_equations'));
  assert.ok(result.tags.includes('algebra'));
});

test('generateHistoricalPaperTags: rejects non-object', () => {
  const result = generateHistoricalPaperTags('not an object');
  assert.equal(result.ok, false);
});

test('formatMath: formats correctly', () => {
  const result = formatMath('1/2 + x^2');
  assert.equal(result.ok, true);
  assert.ok(result.formatted.includes('\\frac'));
  assert.ok(result.formatted.includes('$x^2$'));
});

test('formatMath: rejects non-string', () => {
  const result = formatMath(42);
  assert.equal(result.ok, false);
});

test('dualModeRouter: routes to BOARD mode', () => {
  const result = dualModeRouter({ mode: 'BOARD', prompt: 'What is force?' });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'BOARD');
  assert.ok(result.output.includes('Board-style'));
});

test('dualModeRouter: routes to COMPETITIVE mode', () => {
  const result = dualModeRouter({ mode: 'COMPETITIVE', prompt: 'Derive F=ma' });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'COMPETITIVE');
  assert.ok(result.output.includes('Competitive'));
});

test('dualModeRouter: routes to DUAL mode', () => {
  const result = dualModeRouter({ mode: 'DUAL', prompt: 'What is gravity?' });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'DUAL');
  assert.ok(result.board);
  assert.ok(result.competitive);
});

test('dualModeRouter: rejects missing mode', () => {
  const result = dualModeRouter({ prompt: 'test' });
  assert.equal(result.ok, false);
});

test('dualModeRouter: rejects missing prompt', () => {
  const result = dualModeRouter({ mode: 'BOARD' });
  assert.equal(result.ok, false);
});

test('dualModeRouter: rejects invalid mode', () => {
  const result = dualModeRouter({ mode: 'INVALID', prompt: 'test' });
  assert.equal(result.ok, false);
});

test('dualModeRouter: handles empty payload', () => {
  const result = dualModeRouter({});
  assert.equal(result.ok, false);
});
