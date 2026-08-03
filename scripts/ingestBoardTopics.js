// Auto-ingest board syllabus → full document tree (subjects → chapters →
// topics), so AP_BOARD / TS_BOARD are resolved and learnable exactly like the
// CBSE/NCERT tree (which already carries real topic content).
//
// Sources, in order of preference:
//   1. `SYLLABUS_WEB_URL` (env) — a JSON feed of a board's curriculum:
//        { board: 'AP_BOARD', subjects: [{ id, chapters: [{ id, name, summary, topics: [{ name, description }] }] }] }
//      Fetched with a timeout; on any network/parse failure we fall back.
//   2. Derived from the RESOLVED NCERT tree — each board chapter mirrors its
//      NCERT chapter, so its topics are cloned (board-scoped ids, corrected
//      document tree paths). Zero overlap, no fabricated content.
//
// Run: node scripts/ingestBoardTopics.js   (idempotent)
'use strict';

const { db, initDatabase } = require('../lib/database');
const ragService = require('../lib/ragService');
const httpClient = require('../lib/httpClient');
const boardSyllabus = require('../lib/boardSyllabus');

initDatabase();

const insertTopic = db.prepare(
  'INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)'
);
const getTopics = db.prepare('SELECT id, name, description FROM topics WHERE chapter_id = ?');

const BOARDS = ['AP_BOARD', 'TS_BOARD'];

async function fetchWebSyllabus(board) {
  const url = process.env.SYLLABUS_WEB_URL;
  if (!url) return null;
  try {
    const res = await httpClient.fetchWithTimeout(url, { timeout: 8000 });
    if (!res.ok) return null;
    const feed = await res.json();
    const mapped = { board, subjects: {} };
    for (const subj of feed.subjects || []) {
      for (const ch of subj.chapters || []) {
        mapped.subjects[ch.id] = { name: ch.name, summary: ch.summary || '', topics: (ch.topics || []).map(t => ({ name: t.name, description: t.description || '' })) };
      }
    }
    return mapped;
  } catch (_) {
    return null;
  }
}

/** Board chapter id → source NCERT chapter id, via lib/boardSyllabus (the board
 *  chapters no longer mirror NCERT ids — the authoritative map does the linking). */
function ncertChapterId(board, boardId) {
  const prefix = board === 'AP_BOARD' ? 'ap-' : 'ts-';
  for (const ch of boardSyllabus.flatten(boardSyllabus.BOARDS[board])) {
    if (!ch.ncert) continue;
    const slugId = `${prefix}${ch.subject}-${slug(ch.name)}`;
    if (slugId === boardId) return ch.ncert;
  }
  return null;
}

function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ingest() {
  let seeded = 0;
  for (const board of BOARDS) {
    const web = await fetchWebSyllabus(board);
    const chapters = ragService.getSyllabusTree(board);
    for (const ch of chapters) {
      const topicRows = [];
      if (web && web.subjects[ch.id]) {
        for (const t of web.subjects[ch.id].topics) {
          topicRows.push({ id: `${board}_${ch.id}_t${topicRows.length}`, name: t.name, description: t.description });
        }
      } else {
        const srcId = ncertChapterId(board, ch.id);
        if (!srcId) continue;
        for (const t of getTopics.all(srcId)) {
          topicRows.push({ id: `b-${board}-${t.id}`, name: t.name, description: t.description });
        }
      }
      for (const t of topicRows) {
        const path = `${ch.subject_id} > ${ch.name} > ${t.name}`;
        insertTopic.run(t.id, ch.id, t.name, t.description, path);
        seeded++;
      }
    }
    console.log(`${board}: resolved ${chapters.length} chapters, ${seeded} topics so far (source: ${web ? 'WEB' : 'NCERT-derived'})`);
  }
  console.log(`Board topic ingest done. total topics seeded: ${seeded}`);
  db.close();
}

ingest().catch(err => { console.error('ingest failed:', err.message); process.exit(1); });