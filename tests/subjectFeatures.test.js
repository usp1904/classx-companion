const test = require('node:test');
const assert = require('node:assert/strict');
const sf = require('../lib/subjectFeatures');

const SUBJECTS = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics'];

test('universal: RAG search and metadata tagging on all subjects', () => {
  for (const id of SUBJECTS) {
    const c = sf.get(id);
    assert.equal(c.ragHybridSearch, true, id);
    assert.equal(c.metadataTagging, true, id);
    assert.equal(c.formulaeOnlyWhenRelevant, true, id);
  }
});

test('universal: interactive excluded and videos enabled for ALL subjects', () => {
  for (const id of SUBJECTS) {
    const c = sf.get(id);
    assert.equal(c.interactive, false, id);
    assert.equal(c.videos, true, id);
  }
});

test('universal: video hard-cap is 20s for every subject', () => {
  for (const id of SUBJECTS) {
    assert.equal(sf.get(id).video_limit, 20, id);
    assert.equal(sf.get(id).video_source, 'youtube_shorts', id);
    assert.equal(sf.get(id).ads_blocked, true, id);
    assert.equal(sf.get(id).goi_compliant, true, id);
    assert.equal(sf.get(id).foundation_to_frontier, true, id);
  }
});

test('enforceVideoLimit: never allows > 20s, for any subject', () => {
  for (const id of SUBJECTS) {
    assert.equal(sf.enforceVideoLimit(id, 20), true, `${id} at 20s`);
    assert.equal(sf.enforceVideoLimit(id, 21), false, `${id} at 21s`);
    assert.equal(sf.enforceVideoLimit(id, 45), false, `${id} at 45s`);
  }
  assert.equal(sf.enforceVideoLimit('physics', 0), true);
  assert.equal(sf.enforceVideoLimit('physics', 'abc'), false);
});

test('mathematics: keeps theorems, exercises, Vedic, RD Sharma, RS Aggarwal, formulae', () => {
  const c = sf.get('mathematics');
  assert.equal(c.theorems, true);
  assert.equal(c.exercises, true);
  assert.equal(c.vedicMaths, true);
  assert.equal(c.rdSharma, true);
  assert.equal(c.rsAggarwal, true);
  assert.equal(c.formulae, true);
  assert.equal(c.solvedExamples, true);
  assert.equal(c.step_by_step, true);
});

test('non-math subjects: exclude theorems, exercises, Vedic Maths, RD/RS references', () => {
  for (const id of ['physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics']) {
    const c = sf.get(id);
    assert.equal(c.theorems, false, id);
    assert.equal(c.exercises, false, id);
    assert.equal(c.vedicMaths, false, id);
    assert.equal(c.rdSharma, false, id);
    assert.equal(c.rsAggarwal, false, id);
    assert.equal(c.step_by_step, true, id);
  }
});

test('science: formulae + topic-wise formulae, chemistry balances equations', () => {
  for (const id of ['physics', 'chemistry', 'biology']) {
    assert.equal(sf.get(id).formulae, true, id);
    assert.equal(sf.get(id).topicWiseFormulae, true, id);
    assert.equal(sf.get(id).scienceExperiments, true, id);
  }
  assert.equal(sf.get('chemistry').chemicalEquationBalancing, true);
  assert.equal(sf.get('physics').chemicalEquationBalancing, false);
});

test('social studies: no formulae, visuals + case studies, videos stay at 20s', () => {
  for (const id of ['history', 'geography', 'civics']) {
    const c = sf.get(id);
    assert.equal(c.formulae, false, id);
    assert.equal(c.infographics, true, id);
    assert.equal(c.maps, true, id);
    assert.equal(c.caseStudies, true, id);
    assert.equal(c.video_limit, 20, id);
  }
});

test('economics: formulae, graphs, charts, calculators', () => {
  const c = sf.get('economics');
  assert.equal(c.formulae, true);
  assert.equal(c.graphs, true);
  assert.equal(c.charts, true);
  assert.equal(c.calculators, true);
  assert.equal(c.theorems, false);
  assert.equal(c.vedicMaths, false);
});

test('model papers: every subject ships 10 years, IIT/JEE aligned, step-by-step', () => {
  for (const id of SUBJECTS) {
    const c = sf.get(id);
    assert.equal(c.modelPapers, true, id);
    assert.equal(c.pastPapersYears, 10, id);
    assert.equal(c.alignedIITJEE, true, id);
    assert.equal(c.model_paper_patterns, true, id);
  }
});

test('mindmaps: every subject incl. Mathematics', () => {
  for (const id of SUBJECTS) {
    assert.equal(sf.get(id).mindmaps, true, id);
  }
});

test('quizzes: every subject, all three tiers present', () => {
  for (const id of SUBJECTS) {
    const c = sf.get(id);
    assert.equal(c.quizzes, true, id);
    assert.deepEqual(c.quiz_tiers, ['simple', 'medium', 'complex'], id);
  }
});

test('media overview: videos + links listed for quick refresh on all subjects', () => {
  for (const id of SUBJECTS) {
    const c = sf.get(id);
    assert.equal(c.media_overview_links, true, id);
    assert.equal(c.video_source, 'youtube_shorts', id);
    assert.equal(c.ads_blocked, true, id);
  }
});

test('dashboard: learn streaks on all subjects', () => {
  for (const id of SUBJECTS) {
    assert.equal(sf.get(id).streaks, true, id);
  }
});

test('qna: bullet-based, 10y patterns, examples on all subjects', () => {
  for (const id of SUBJECTS) {
    const c = sf.get(id);
    assert.equal(c.qna_bullet_based, true, id);
    assert.equal(c.qna_10y_patterns, true, id);
    assert.equal(c.qna_with_examples, true, id);
  }
});

test('ai tutor: answers every subject within syllabus', () => {
  for (const id of SUBJECTS) {
    assert.equal(sf.get(id).ai_tutor_all_subjects, true, id);
  }
});

test('get: unknown subject returns safe default without losing capabilities', () => {
  const c = sf.get('unknown-subject');
  assert.equal(c.theorems, true);
  assert.equal(c.interactive, false);
  assert.ok(c.video_limit <= 20);
  assert.equal(c.ragHybridSearch, true);
});

test('get: null/undefined returns DEFAULT', () => {
  assert.equal(sf.get(null), sf.DEFAULT);
  assert.equal(sf.get(undefined), sf.DEFAULT);
});

test('no overlap: every subject has a config entry', () => {
  for (const id of SUBJECTS) {
    assert.ok(sf.get(id), id);
  }
});