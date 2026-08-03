/**
 * Content loader.
 *
 * Reads authored lessons from `content/<subject>/<lessonId>.json` (or
 * wherever `CONTENT_ROOT` points to). One JSON file = one lesson. The
 * schema is documented in ARCHITECTURE.md §5.3.
 *
 * Why JSON and not Markdown or DB: JSON is the single source of truth
 * for both the frontend renderer and the AI tutor (the tutor needs
 * structured outcomes, prerequisites, and blocks to ground its answers).
 * Markdown would lose structure; a DB is overkill for static content.
 *
 * Future tweaks:
 *  - Add a `version` field and a migration step here.
 *  - Add a content cache (LRU) if directory listings get large.
 *  - Support hot-reload by watching the directory with `fs.watch`.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

function contentRoot() {
  return path.resolve(process.cwd(), config.content.root);
}

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { __error: err.message, __file: filePath };
  }
}

function listLessons() {
  const root = contentRoot();
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const subject of fs.readdirSync(root, { withFileTypes: true })) {
    if (!subject.isDirectory()) continue;
    const subjectDir = path.join(root, subject.name);
    for (const f of fs.readdirSync(subjectDir, { withFileTypes: true })) {
      if (!f.isFile() || !f.name.endsWith('.json')) continue;
      const filePath = path.join(subjectDir, f.name);
      let title = null;
      let chapterNumber = null;
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        title = parsed.chapter || null;
        chapterNumber = parsed.chapterNumber || null;
      } catch (_) {}
      if (chapterNumber === null) continue;
      out.push({
        subject: subject.name,
        lessonId: path.basename(f.name, '.json'),
        title: title || path.basename(f.name, '.json').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        chapterNumber,
        path: filePath
      });
    }
  }
  out.sort((a, b) => a.chapterNumber - b.chapterNumber);
  return out;
}

function getLessonById(lessonId) {
  if (!lessonId || /[\\/]/.test(lessonId)) return null; // path-traversal guard
  const root = contentRoot();
  if (!fs.existsSync(root)) return null;
  for (const subject of fs.readdirSync(root, { withFileTypes: true })) {
    if (!subject.isDirectory()) continue;
    const filePath = path.join(root, subject.name, `${lessonId}.json`);
    if (fs.existsSync(filePath)) {
      const data = safeReadJson(filePath);
      if (data.__error) return null;
      return { subject: subject.name, lessonId, data };
    }
  }
  return null;
}

module.exports = { listLessons, getLessonById, contentRoot, buildFlashcards };

/**
 * Derive flashcards (front/back) from a lesson's structured content.
 * Sources: concepts (name→description), theorems (name→statement),
 * exercises (question→solution). Pure; no I/O.
 */
function buildFlashcards(lesson) {
  const cards = [];
  if (!lesson || typeof lesson !== 'object') return cards;

  if (Array.isArray(lesson.concepts)) {
    for (const c of lesson.concepts) {
      if (c && c.name) cards.push({ front: c.name, back: c.description || '', source: 'concept' });
    }
  }
  if (Array.isArray(lesson.theorems)) {
    for (const t of lesson.theorems) {
      if (t && t.name) cards.push({ front: t.name, back: t.statement || '', source: 'theorem' });
    }
  }
  if (lesson.exercises && typeof lesson.exercises === 'object') {
    for (const key of Object.keys(lesson.exercises)) {
      const ex = lesson.exercises[key];
      if (!ex || !Array.isArray(ex.problems)) continue;
      for (const p of ex.problems) {
        if (p && p.question) {
          cards.push({ front: p.question, back: p.solution || '', source: `exercise:${ex.title || key}` });
        }
      }
    }
  }
  return cards.map((c, i) => ({ id: `fc-${i + 1}`, ...c }));
}
