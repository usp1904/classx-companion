const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const bodyParser = require('body-parser');

let server;
let baseUrl;

test.before(() => {
  return new Promise((resolve) => {
    const app = express();
    app.use(bodyParser.json({ limit: '1mb' }));
    const api = require('../routes/api');
    app.use('/api', api);
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => {
  if (server) server.close();
});

function fetch(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      method,
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test('GET /api/syllabus/subjects returns 200 with subjects', async () => {
  const res = await fetch('GET', '/api/syllabus/subjects');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(Array.isArray(res.body.subjects));
});

test('GET /api/syllabus/subjects/:id returns subject', async () => {
  const res = await fetch('GET', '/api/syllabus/subjects/mathematics');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.subject.id, 'mathematics');
});

test('GET /api/syllabus/subjects/:id returns 404 for invalid', async () => {
  const res = await fetch('GET', '/api/syllabus/subjects/nonexistent');
  assert.equal(res.status, 404);
  assert.equal(res.body.ok, false);
});

test('GET /api/syllabus/search?q=... returns results', async () => {
  const res = await fetch('GET', '/api/syllabus/search?q=linear');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/validate-question validates correctly', async () => {
  const res = await fetch('POST', '/api/validate-question', {
    source_exam_origin: 'NCERT',
    academic_source_truth: 'NCERT Class X',
    cognitive_complexity_tier: 'TIER_1_BASIC',
    prerequisite_nodes: ['MATH_CLASS6_FRACTIONS', 'MATH_CLASS10_LINEAR_EQUATIONS']
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/validate-question rejects invalid', async () => {
  const res = await fetch('POST', '/api/validate-question', {});
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
});

test('POST /api/enforce-latex checks plaintext', async () => {
  const res = await fetch('POST', '/api/enforce-latex', { text: '1/2 + x^2' });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
});

test('POST /api/enforce-latex passes clean text', async () => {
  const res = await fetch('POST', '/api/enforce-latex', { text: '$\\frac{1}{2}$' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/convert-latex converts plaintext math', async () => {
  const res = await fetch('POST', '/api/convert-latex', { text: '1/2' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(res.body.converted.includes('\\frac'));
});

test('POST /api/format-math converts and validates plaintext math', async () => {
  const res = await fetch('POST', '/api/format-math', { text: 'x^2 + 1' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(res.body.formatted.includes('$x^2$'));
});

test('POST /api/dual-mode-route routes BOARD mode', async () => {
  const res = await fetch('POST', '/api/dual-mode-route', { mode: 'BOARD', prompt: 'What is force?' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.result.mode, 'BOARD');
});

test('POST /api/dual-mode-route rejects empty body', async () => {
  const res = await fetch('POST', '/api/dual-mode-route', {});
  assert.equal(res.status, 400);
});

test('POST /api/curriculum-guard validates metadata', async () => {
  const res = await fetch('POST', '/api/curriculum-guard', {
    source_exam_origin: 'NCERT',
    academic_source_truth: 'NCERT Class X',
    cognitive_complexity_tier: 'TIER_1_BASIC'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/historical-paper-tags returns tags', async () => {
  const res = await fetch('POST', '/api/historical-paper-tags', {
    source_exam_origin: 'CBSE-2024',
    cognitive_complexity_tier: 'TIER_2_EXTENDED'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(Array.isArray(res.body.tags));
});

test('POST /api/visualize validates viz payload', async () => {
  const res = await fetch('POST', '/api/visualize', {
    rendererType: 'COORDINATE_GRAPH',
    syllabusSource: 'NCERT_2026_27',
    visualizationProperties: { equation: 'y = 2x + 1', xRange: [-10, 10], yRange: [-10, 10] }
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/visualize rejects invalid payload', async () => {
  const res = await fetch('POST', '/api/visualize', { invalid: true });
  assert.equal(res.status, 400);
});

test('GET /api/instructions returns modules', async () => {
  const res = await fetch('GET', '/api/instructions');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(Array.isArray(res.body.instructions));
});

test('GET /api/instructions/:name returns module', async () => {
  const res = await fetch('GET', '/api/instructions/curriculum-guard');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.instruction.name, 'curriculum-guard');
});

test('GET /api/instructions/:name returns 404 for unknown', async () => {
  const res = await fetch('GET', '/api/instructions/nonexistent');
  assert.equal(res.status, 404);
});

test('POST /api/ai/tutor processes questions', async () => {
  const res = await fetch('POST', '/api/ai/tutor', { question: 'What is gravity?', mode: 'BOARD' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/ai/tutor rejects missing question', async () => {
  const res = await fetch('POST', '/api/ai/tutor', {});
  assert.equal(res.status, 400);
});

test('GET /api/mcp/fetch returns error when unconfigured', async () => {
  const res = await fetch('GET', '/api/mcp/fetch?q=newton');
  // No MCP_ENDPOINT configured, returns 500
  assert.equal(res.status, 500);
  assert.equal(res.body.ok, false);
});

test('GET /api/kg/resolve requires id', async () => {
  const res = await fetch('GET', '/api/kg/resolve');
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
});

test('GET /api/kg/resolve with id returns error when unconfigured', async () => {
  const res = await fetch('GET', '/api/kg/resolve?id=123');
  // No KG_ENDPOINT configured, returns 500
  assert.equal(res.status, 500);
  assert.equal(res.body.ok, false);
});

test('GET /api/content/lessons lists authored lessons', async () => {
  const res = await fetch('GET', '/api/content/lessons');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(Array.isArray(res.body.lessons));
});

test('GET /api/content/lessons/:id returns full lesson', async () => {
  const res = await fetch('GET', '/api/content/lessons/real-numbers');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(res.body.lesson);
  assert.ok(res.body.lesson.concepts);
  assert.ok(res.body.lesson.theorems);
  assert.ok(res.body.lesson.exercises);
  assert.ok(res.body.lesson.quizzes);
});

test('GET /api/content/lessons/:id returns 404 for unknown', async () => {
  const res = await fetch('GET', '/api/content/lessons/nonexistent');
  assert.equal(res.status, 404);
  assert.equal(res.body.ok, false);
});

test('GET /api/scaffold/subjects lists all 8 subjects', async () => {
  const res = await fetch('GET', '/api/scaffold/subjects');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(Array.isArray(res.body.subjects));
  assert.deepEqual(res.body.subjects.map(s => s.id).sort(),
    ['biology', 'chemistry', 'civics', 'economics', 'geography', 'history', 'mathematics', 'physics']);
});

test('GET /api/scaffold/:subjectId/:chapterId returns full scaffold lesson', async () => {
  const res = await fetch('GET', '/api/scaffold/mathematics/real-numbers');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.lesson.scaffolded, true);
  assert.ok(res.body.lesson.concepts.length >= 1);
  assert.ok(res.body.lesson.mind_maps.branches.length >= 1);
  assert.ok(res.body.lesson.model_papers.patterns.length >= 1);
  assert.ok(res.body.lesson.media_overview);
});

test('GET /api/content/lessons/:id falls back to subject-aware DB scaffold for un-authored chapters', async () => {
  // Seed a minimal history chapter + topic + problem into the (temp) DB so the
  // scaffold fallback has real data to work with.
  const { db } = require('../lib/database');
  db.prepare("DELETE FROM problems WHERE id='test-nationalism-p1'").run();
  db.prepare("DELETE FROM topics WHERE id='test-nationalism-t1'").run();
  db.prepare("DELETE FROM chapters WHERE id='test-nationalism'").run();
  db.prepare("INSERT OR IGNORE INTO subjects (id, name) VALUES ('history','History')").run();
  db.prepare("INSERT INTO chapters (id, subject_id, name, board_source) VALUES ('test-nationalism','history','Nationalism in India','CBSE_NCERT')").run();
  db.prepare("INSERT INTO topics (id, chapter_id, name, description) VALUES ('test-nationalism-t1','test-nationalism','Sense of Collective Belonging','Social Studies topic')").run();
  db.prepare("INSERT INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text) VALUES ('test-nationalism-p1','test-nationalism-t1','NCERT','Exercise 1',1,'Explain the significance of the Salt March led by Mahatma Gandhi in 1930.')").run();

  const res = await fetch('GET', '/api/content/lessons/test-nationalism');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.lesson.subject, 'history');
  const c = res.body.lesson.concepts.find(x => x.name === 'Sense of Collective Belonging');
  assert.ok(c, 'history concept present');
  assert.ok(!/Actuary|Data Scientist|AI\/ML Engineer/i.test(c.future_careers), 'no math careers leaked');
  assert.ok(res.body.lesson.model_papers.simple.length >= 1, 'real Q&A present');
});

test('GET /api/scaffold/:subjectId/:chapterId/media returns reel URLs', async () => {
  const res = await fetch('GET', '/api/scaffold/physics/light-reflection-refraction/media');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.media.seconds_limit, 20);
  for (const r of res.body.media.reels) {
    assert.ok(String(r.url).startsWith('https://www.youtube.com/watch?v='));
    assert.ok(String(r.embed_url).includes('rel=0'));
    assert.equal(r.seconds, 20);
  }
});

test('GET /api/scaffold/:subjectId/:chapterId returns 404 for unknown chapter', async () => {
  const res = await fetch('GET', '/api/scaffold/mathematics/no-such-chapter');
  assert.equal(res.status, 404);
  assert.equal(res.body.ok, false);
});
