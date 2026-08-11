const express = require('express');
const router = express.Router();
const { validateQuestionMetadata, enforceLaTeX, autoConvertLaTeX, curriculumGuard, generateHistoricalPaperTags, formatMath, dualModeRouter } = require('../lib/validator');
const { loadInstructionModules, getInstructionByName } = require('../lib/instructionBank');
const syllabus = require('../lib/syllabus');
const mcp = require('../services/mcp');
const kg = require('../services/kg');
const aiTutor = require('../services/aiTutor');
const flags = require('../lib/featureFlags');
const content = require('../lib/content');
const ragService = require('../lib/ragService');
const subjectFeatures = require('../lib/subjectFeatures');
const tutorScaffold = require('../lib/tutorScaffold');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, strict: false });
const vizSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'viz.schema.json'), 'utf8'));
const validateViz = ajv.compile(vizSchema);

// POST /api/validate-question
router.post('/validate-question', (req, res) => {
  const payload = req.body;
  const result = validateQuestionMetadata(payload);
  if (!result.valid) return res.status(400).json({ ok: false, errors: result.errors });
  return res.json({ ok: true });
});

// POST /api/curriculum-guard -> validates metadata against syllabus expectations
router.post('/curriculum-guard', (req, res) => {
  const payload = req.body || {};
  const result = curriculumGuard(payload);
  if (!result.ok) return res.status(400).json({ ok: false, issues: result.issues });
  return res.json({ ok: true, metadata: result.metadata });
});

// POST /api/historical-paper-tags -> extracts tags from question metadata
router.post('/historical-paper-tags', (req, res) => {
  const payload = req.body || {};
  const result = generateHistoricalPaperTags(payload);
  if (!result.ok) return res.status(400).json(result);
  return res.json({ ok: true, tags: result.tags });
});

// POST /api/dual-mode-route -> routes output between board and competitive exam styles
router.post('/dual-mode-route', (req, res) => {
  const payload = req.body || {};
  const result = dualModeRouter(payload);
  if (!result.ok) return res.status(400).json(result);
  return res.json({ ok: true, result });
});

// GET /api/syllabus/subjects -> list available subjects
router.get('/syllabus/subjects', (req, res) => {
  const subjects = syllabus.getSubjects();
  return res.json({ ok: true, subjects });
});

// GET /api/dashboard/subject-features -> per-subject dashboard feature flags
router.get('/dashboard/subject-features', (req, res) => {
  return res.json({ ok: true, default: subjectFeatures.get(null), subjects: subjectFeatures.getAll() });
});

// GET /api/dashboard/subject-features/:subjectId -> feature flags for one subject
router.get('/dashboard/subject-features/:subjectId', (req, res) => {
  const features = subjectFeatures.get(req.params.subjectId);
  return res.json({ ok: true, subject: req.params.subjectId, features });
});

// GET /api/syllabus/subjects/:subjectId -> get subject detail and chapters
router.get('/syllabus/subjects/:subjectId', (req, res) => {
  const subjectId = req.params.subjectId;
  const subject = syllabus.getSubjectById(subjectId);
  if (!subject) return res.status(404).json({ ok: false, error: 'Subject not found' });
  return res.json({ ok: true, subject });
});

// GET /api/syllabus/subjects/:subjectId/chapters/:chapterId -> get chapter detail
router.get('/syllabus/subjects/:subjectId/chapters/:chapterId', (req, res) => {
  const subjectId = req.params.subjectId;
  const chapterId = req.params.chapterId;
  const chapter = syllabus.getChapter(subjectId, chapterId);
  if (!chapter) return res.status(404).json({ ok: false, error: 'Chapter not found' });
  return res.json({ ok: true, chapter });
});

// GET /api/syllabus/search?q=... -> search chapter and exercise text across syllabus
router.get('/syllabus/search', (req, res) => {
  const q = req.query.q || '';
  const result = syllabus.searchSyllabus(q);
  return res.json({ ok: true, query: q, result });
});

// GET /api/instructions -> list markdown instruction modules
router.get('/instructions', (req, res) => {
  const modules = loadInstructionModules();
  return res.json({ ok: true, instructions: modules.map(module => ({
    fileName: module.fileName,
    name: module.frontmatter.name,
    description: module.frontmatter.description,
    triggers: module.frontmatter.triggers || []
  })) });
});

// GET /api/instructions/:name -> fetch a specific instruction module
router.get('/instructions/:name', (req, res) => {
  const module = getInstructionByName(req.params.name);
  if (!module) return res.status(404).json({ ok: false, error: 'Instruction not found' });
  return res.json({ ok: true, instruction: {
    fileName: module.fileName,
    name: module.frontmatter.name,
    description: module.frontmatter.description,
    triggers: module.frontmatter.triggers || [],
    content: module.content
  } });
});

// POST /api/visualize -> returns a viz JSON block following viz-generator contract
router.post('/visualize', (req, res) => {
  const payload = req.body || {};
  if (!validateViz(payload)) {
    return res.status(400).json({ ok: false, error: 'Invalid visualization payload', details: validateViz.errors });
  }
  // Enforce the contract with exact fields
  const viz = {
    rendererType: payload.rendererType,
    syllabusSource: payload.syllabusSource,
    visualizationProperties: payload.visualizationProperties
  };
  return res.json({ ok: true, viz });
});

// POST /api/enforce-latex -> checks text for plaintext math
router.post('/enforce-latex', (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string') return res.status(400).json({ ok: false, error: 'text string required' });
  const report = enforceLaTeX(text);
  if (!report.ok) return res.status(400).json({ ok: false, issues: report.issues });
  return res.json({ ok: true });
});

// POST /api/convert-latex -> auto-convert simple plaintext math to LaTeX wrappers
router.post('/convert-latex', (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string') return res.status(400).json({ ok: false, error: 'text string required' });
  const result = autoConvertLaTeX(text);
  return res.json({ ok: true, converted: result.converted, issues: result.issues });
});

// POST /api/format-math -> format math expressions using math-formatter support
router.post('/format-math', (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string') return res.status(400).json({ ok: false, error: 'text string required' });
  const result = formatMath(text);
  if (!result.ok) return res.status(400).json({ ok: false, errors: result.errors });
  return res.json({ ok: true, formatted: result.formatted, issues: result.issues });
});



// POST /api/ai/tutor -> route a student question through the AI tutor service
// Supports SSE streaming: send `{ stream:true }` (or query `?stream=1`) and
// the answer is pushed in `data:` chunks instead of a single buffered JSON.
router.post('/ai/tutor', async (req, res) => {
  const body = req.body || {};
  const wantStream = flags.isEnabled('streamingResponses') &&
    (body.stream === true || body.stream === '1' || req.query.stream === '1');

  const result = await aiTutor.askTutor(body);
  if (!result.ok) {
    return res.status(400).json(result);
  }

  if (!wantStream) {
    return res.json(result);
  }

  const text = (result.answer && result.answer.text) || '';
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const chunks = text.match(/[\s\S]{1,128}/g) || [text];
  for (const c of chunks) {
    res.write(`data: ${JSON.stringify({ delta: c })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ done: true, source: result.source, tier: result.tier })}\n\n`);
  return res.end();
});

// MCP fetch connector
router.get('/mcp/fetch', async (req, res) => {
  const q = req.query.q || 'default';

  try {
    const r = await mcp.fetchCurriculumChunk(q);
    const status = r.ok ? 200 : (r.status || 500);
    return res.status(status).json(r);
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'MCP fetch failed', details: error.message });
  }
});

// KG resolve connector
router.get('/kg/resolve', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ ok: false, error: 'id required' });

  try {
    const r = await kg.resolveEntity(id);
    const status = r.ok ? 200 : (r.status || 500);
    return res.status(status).json(r);
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'KG resolve failed', details: error.message });
  }
});

// GET /api/content/lessons -> list all authored lessons
router.get('/content/lessons', (req, res) => {
  const lessons = content.listLessons();
  return res.json({ ok: true, lessons });
});

// GET /api/content/lessons/:lessonId -> full lesson with all features
// Falls back to a subject-aware DB-scaffolded lesson for chapters without an
// authored file, so non-math subjects get real Q&A and subject-aligned content
// instead of the generic frontend mock.
router.get('/content/lessons/:lessonId', (req, res) => {
  const lesson = content.getLessonById(req.params.lessonId);
  if (lesson) return res.json({ ok: true, lesson: lesson.data });
  if (!flags.isEnabled('tutorScaffold')) return res.status(404).json({ ok: false, error: 'Lesson not found' });

  const dbChapter = ragService.getChapterById(req.params.lessonId);
  if (!dbChapter) return res.status(404).json({ ok: false, error: 'Lesson not found' });

  const slChapter = syllabus.getChapter(dbChapter.subject_id, dbChapter.id);
  const scaffolded = tutorScaffold.getScaffoldForDbChapter(dbChapter, slChapter);
  if (!scaffolded) return res.status(404).json({ ok: false, error: 'Lesson not found' });
  return res.json({ ok: true, lesson: scaffolded });
});

// GET /api/content/flashcards/:lessonId -> flashcards derived from lesson content
router.get('/content/flashcards/:lessonId', (req, res) => {
  const lesson = content.getLessonById(req.params.lessonId);
  if (!lesson) return res.status(404).json({ ok: false, error: 'Lesson not found' });
  const flashcards = content.buildFlashcards(lesson.data);
  return res.json({ ok: true, data: { lessonId: lesson.lessonId, subject: lesson.subject, count: flashcards.length, flashcards } });
});

// ── Tutor scaffold (base content for every subject/chapter) ──────────────

// GET /api/scaffold/subjects -> subjects that can be scaffolded
router.get('/scaffold/subjects', (req, res) => {
  if (!flags.isEnabled('tutorScaffold')) return res.status(404).json({ ok: false, error: 'tutor scaffold disabled' });
  return res.json({ ok: true, subjects: syllabus.getSubjects().map(s => ({ id: s.id, name: s.name, chapters: (s.chapters || []).length })) });
});

// GET /api/scaffold/:subjectId/:chapterId -> full scaffolded lesson for any
// subject+chapter in the syllabus (explanation, Q&A, model papers, mind maps,
// quizzes, media overview with all reel URLs).
router.get('/scaffold/:subjectId/:chapterId', (req, res) => {
  if (!flags.isEnabled('tutorScaffold')) return res.status(404).json({ ok: false, error: 'tutor scaffold disabled' });
  const scaffold = tutorScaffold.getScaffold({ subjectId: req.params.subjectId, chapterId: req.params.chapterId });
  if (!scaffold) return res.status(404).json({ ok: false, error: 'Subject or chapter not found' });
  return res.json({ ok: true, lesson: scaffold });
});

// GET /api/scaffold/:subjectId/:chapterId/media -> Media Overview: every 20s
// ad-free YouTube reel URL for the chapter, for quick refresh and reference.
router.get('/scaffold/:subjectId/:chapterId/media', (req, res) => {
  if (!flags.isEnabled('tutorScaffold')) return res.status(404).json({ ok: false, error: 'tutor scaffold disabled' });
  const scaffold = tutorScaffold.getScaffold({ subjectId: req.params.subjectId, chapterId: req.params.chapterId });
  if (!scaffold) return res.status(404).json({ ok: false, error: 'Subject or chapter not found' });
  return res.json({ ok: true, media: scaffold.media_overview });
});

// DB/RAG Service routes

// GET /api/db/syllabus
router.get('/db/syllabus', (req, res) => {
  const board = req.query.board || null;
  const tree = ragService.getSyllabusTree(board);
  return res.json({ ok: true, syllabus: tree });
});

// GET /api/db/search?q=...
router.get('/db/search', (req, res) => {
  const q = req.query.q || '';
  const results = ragService.searchHybrid(q);
  return res.json({ ok: true, query: q, results });
});

// GET /api/db/problems/:problemId
router.get('/db/problems/:problemId', (req, res) => {
  const details = ragService.getProblemDetails(req.params.problemId);
  if (!details) return res.status(404).json({ ok: false, error: 'Problem not found' });
  return res.json({ ok: true, details });
});

// GET /api/db/concepts/:conceptId
router.get('/db/concepts/:conceptId', (req, res) => {
  const graph = ragService.resolveConceptGraph(req.params.conceptId);
  if (!graph) return res.status(404).json({ ok: false, error: 'Concept not found' });
  return res.json({ ok: true, graph });
});

module.exports = router;
