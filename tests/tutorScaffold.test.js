const test = require('node:test');
const assert = require('node:assert/strict');
const tutorScaffold = require('../lib/tutorScaffold');
const syllabus = require('../lib/syllabus');

const SUBJECTS = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics'];

function firstChapter(subjectId) {
  const s = syllabus.getSubjectById(subjectId);
  return s.chapters[0];
}

test('scaffold: builds for every subject + first chapter', () => {
  for (const id of SUBJECTS) {
    const ch = firstChapter(id);
    const lesson = tutorScaffold.getScaffold({ subjectId: id, chapterId: ch.id });
    assert.ok(lesson, `${id}/${ch.id}`);
    assert.equal(lesson.subject, id);
    assert.ok(lesson.concepts.length >= 1, `${id} concepts`);
    assert.ok(lesson.outcomes.length >= 4, `${id} outcomes`);
    assert.ok(lesson.mind_maps && lesson.mind_maps.root, `${id} mind map`);
    assert.ok(lesson.model_papers.patterns.length >= 3, `${id} mp patterns`);
    assert.ok(Array.isArray(lesson.quizzes.simple), `${id} quiz tiers`);
    assert.ok(Array.isArray(lesson.quizzes.medium), `${id} quiz tiers`);
    assert.ok(Array.isArray(lesson.quizzes.complex), `${id} quiz tiers`);
    assert.ok(lesson.media_overview, `${id} media overview`);
  }
});

test('scaffold: mathematics keeps theorems/exercises/vedic/rd/rs; others exclude them', () => {
  const math = tutorScaffold.getScaffold({ subjectId: 'mathematics', chapterId: firstChapter('mathematics').id });
  assert.equal(math.features.theorems, true);
  assert.ok(Object.keys(math.exercises).length >= 0);
  assert.ok(math.vedic_math_shortcuts.length >= 0);
  assert.ok(math.rd_sharma_extensions.book, 'rd sharma present for math');
  assert.ok(math.rs_aggarwal_extensions.book, 'rs aggarwal present for math');

  for (const id of ['physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics']) {
    const lesson = tutorScaffold.getScaffold({ subjectId: id, chapterId: firstChapter(id).id });
    assert.equal(lesson.theorems.length, 0, `${id} theorems excluded`);
    assert.deepEqual(Object.keys(lesson.exercises), [], `${id} exercises excluded`);
    assert.equal(lesson.vedic_math_shortcuts.length, 0, `${id} vedic excluded`);
    assert.equal(lesson.rd_sharma_extensions.book, undefined, `${id} no RD`);
    assert.equal(lesson.rs_aggarwal_extensions.book, undefined, `${id} no RS`);
  }
});

test('scaffold: every concept has foundation->frontier explanation ladder', () => {
  const lesson = tutorScaffold.getScaffold({ subjectId: 'civics', chapterId: firstChapter('civics').id });
  for (const c of lesson.concepts) {
    assert.equal(c.explanation.length, 4, c.name);
    assert.deepEqual(c.explanation.map(e => e.level), ['foundation', 'intermediate', 'advanced', 'frontier'], c.name);
  }
});

test('scaffold: reels are 20s, ad-free, whitelist-only URLs', () => {
  for (const id of SUBJECTS) {
    const lesson = tutorScaffold.getScaffold({ subjectId: id, chapterId: firstChapter(id).id });
    for (const r of lesson.media_overview.reels) {
      assert.equal(r.seconds, 20, `${id}:${r.concept}`);
      assert.equal(r.ad_free, true, `${id}:${r.concept}`);
      assert.ok(r.url.startsWith('https://www.youtube.com/watch?v='), r.url);
      assert.ok(r.embed_url.startsWith('https://www.youtube.com/embed/'), r.embed_url);
      assert.ok(r.embed_url.includes('rel=0'), 'ads/related blocked');
      assert.ok(r.embed_url.includes('modestbranding=1'), 'modest branding');
    }
    assert.equal(lesson.media_overview.seconds_limit, 20, id);
  }
});

test('scaffold: step-by-step Q&A with bullets and examples', () => {
  const econ = tutorScaffold.getScaffold({ subjectId: 'economics', chapterId: firstChapter('economics').id });
  if (econ.concepts) {
    for (const piece of econ.model_papers.simple) {
      assert.ok(Array.isArray(piece.steps) && piece.steps.length >= 1, 'bullet steps present');
    }
  }
  const civ = tutorScaffold.getScaffold({ subjectId: 'civics', chapterId: firstChapter('civics').id });
  assert.ok(Array.isArray(civ.model_papers.simple));
});

test('scaffold: unknown subject/chapter returns null', () => {
  assert.equal(tutorScaffold.getScaffold({ subjectId: 'nope', chapterId: 'x' }), null);
  assert.equal(tutorScaffold.getScaffold({ subjectId: 'mathematics', chapterId: 'no-such-chapter' }), null);
});

test('scaffold: does not leak long videos (hard 20s cap)', () => {
  const lesson = tutorScaffold.getScaffold({ subjectId: 'biology', chapterId: firstChapter('biology').id });
  for (const c of lesson.concepts) {
    if (c.video_url) assert.ok(c.reel_seconds <= 20, c.name);
  }
});

test('scaffold: subject-family alignment — no math/engineering leak into social or economics', () => {
  const eq = { id: 'x', name: 'Sample Chapter', subject_id: 'civics', board_source: 'CBSE_NCERT', topics: [{ name: 'Sense of Collective Belonging', description: 'Social Studies topic' }], problems: [] };
  const lesson = tutorScaffold.getScaffoldForDbChapter(eq, firstChapter('civics'));
  const c = lesson.concepts[0];
  assert.equal(tutorScaffold.familyOf('civics'), 'social');
  assert.equal(c.engineering_domains, '', 'social has no engineering domains');
  assert.ok(!/engineer|AI & Data Science|Actuary|Quant|mathematician/i.test(c.future_careers), 'no math careers in social');
  assert.ok(/Civil Services|Teacher|Policy Analyst|Journalist/i.test(c.future_careers), 'social careers present');
  assert.ok(!/mathematical concept/i.test(c.purpose), 'no math purpose phrase');

  const econ = tutorScaffold.getScaffoldForDbChapter({ ...eq, subject_id: 'economics', topics: [{ name: 'GDP', description: 'economic measure' }] }, firstChapter('economics'));
  assert.equal(tutorScaffold.familyOf('economics'), 'economics');
  assert.equal(econ.concepts[0].engineering_domains, '');
  assert.ok(/Economist|Banker|Financial Analyst|Policy Analyst/i.test(econ.concepts[0].future_careers), 'econ careers present');

  const math = tutorScaffold.getScaffoldForDbChapter({ ...eq, subject_id: 'mathematics', topics: [{ name: 'Real Numbers', description: '' }] }, firstChapter('mathematics'));
  assert.equal(tutorScaffold.familyOf('mathematics'), 'mathematics');
  assert.ok(math.concepts[0].engineering_domains.length > 0, 'math keeps engineering domains');
  assert.ok(/AI\/ML Engineer|Data Scientist/i.test(math.concepts[0].future_careers), 'math careers kept');
});

test('scaffold: physics uses science-family prose, not math', () => {
  const eq = { id: 'x', name: 'Electricity', subject_id: 'physics', board_source: 'CBSE_NCERT', topics: [{ name: 'Ohm\u2019s Law', description: '' }], problems: [] };
  const lesson = tutorScaffold.getScaffoldForDbChapter(eq, firstChapter('physics'));
  const c = lesson.concepts[0];
  assert.equal(tutorScaffold.familyOf('physics'), 'science');
  assert.ok(/Medical Doctor|Physicist|Research Scientist/i.test(c.future_careers), 'science careers');
  assert.ok(!/Actuary|Quantitative Analyst/i.test(c.future_careers), 'no pure-math careers');
});

test('scaffold: DB-backed lesson carries real Q&A from db problems', () => {
  const dbChapter = {
    id: 'nationalism-in-india',
    name: 'Nationalism in India',
    subject_id: 'history',
    board_source: 'CBSE_NCERT',
    topics: [{ id: 't1', name: 'Salt Satyagraha', description: 'Gandhi\u2019s Dandi March' }],
    problems: [
      { id: 'p1', topic_id: 't1', question_text: 'Explain the significance of the Salt March led by Mahatma Gandhi in 1930.', question_latex: '' }
    ]
  };
  const sl = firstChapter('history');
  const lesson = tutorScaffold.getScaffoldForDbChapter(dbChapter, sl);
  assert.ok(lesson.model_papers.simple.length >= 1, 'real Q&A present');
  assert.equal(lesson.model_papers.simple[0].question, 'Explain the significance of the Salt March led by Mahatma Gandhi in 1930.');
  assert.ok(lesson.quizzes.simple.length >= 1);
});