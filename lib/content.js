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
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        title = parsed.chapter || null;
      } catch (_) {}
      out.push({
        subject: subject.name,
        lessonId: path.basename(f.name, '.json'),
        title: title || path.basename(f.name, '.json').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        path: filePath
      });
    }
  }
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

module.exports = { listLessons, getLessonById, contentRoot };
