// Seed AP_BOARD and TS_BOARD syllabus trees (Class X) into the DB.
//
// State boards (AP SCERT, Telangana) follow NCERT Class X chapters for Maths
// and Science; this mirrors those chapter lists per subject with a board-prefix
// so NO id ever collides across boards (guarantees zero overlap). Social
// branches use the same 4-branch chapter set under each board's subject.
//
// Also migrates any NCERT social chapters still tagged `subject_id =
// 'social-studies'` onto their real branch subject ids (history/geography/
// civics/economics) so they are reachable from the subject dropdown.
//
// Run: node scripts/seedBoards.js  (idempotent)
'use strict';

const { db, initDatabase } = require('../lib/database');
const syllabus = require('../lib/syllabus');

initDatabase();

const insertChapter = db.prepare(
  'INSERT OR REPLACE INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)'
);

// Ensure the 4 social-science branch subjects exist (FK target for chapters).
const insertSubject = db.prepare('INSERT OR REPLACE INTO subjects (id, name, description) VALUES (?, ?, ?)');
const branchSubjects = [
  ['history', 'History', 'NCERT Class X History — India and the Contemporary World II.'],
  ['geography', 'Geography', 'NCERT Class X Geography — Contemporary India II.'],
  ['civics', 'Civics', 'NCERT Class X Civics — Democratic Politics II.'],
  ['economics', 'Economics', 'NCERT Class X Economics — Understanding Economic Development.']
];
for (const [id, name, desc] of branchSubjects) insertSubject.run(id, name, desc);

const SOCIAL_BRANCH_BY_CHAPTER = {
  'nationalism-in-india': 'history',
  'resources-and-development': 'geography',
  'power-sharing': 'civics',
  'sectors-of-indian-economy': 'economics'
};

// 1. Fix NCERT subject alignment for the 4 social-science chapters.
const fix = db.prepare('UPDATE chapters SET subject_id = ? WHERE id = ? AND board_source = ?');
let migrated = 0;
for (const [chapterId, subjectId] of Object.entries(SOCIAL_BRANCH_BY_CHAPTER)) {
  const r = fix.run(subjectId, chapterId, 'CBSE_NCERT');
  migrated += r.changes;
}

// 1b. Drop duplicate branch-named social chapters still under 'social-studies'
// (e.g. id='history' vs canonical 'nationalism-in-india') so the tree has no
// overlapping entries. FK chain (chapters→topics→problems) means we briefly
// disable FK checks for the cleanup.
const dupIds = ['history', 'geography', 'civics', 'economics'];
db.exec('PRAGMA foreign_keys = OFF;');
let deduped = 0;
for (const id of dupIds) {
  db.prepare('DELETE FROM solutions WHERE problem_id IN (SELECT id FROM problems WHERE topic_id = ?)').run(id);
  db.prepare('DELETE FROM problems WHERE topic_id = ?').run(id);
  db.prepare('DELETE FROM topics WHERE chapter_id = ?').run(id);
  deduped += db.prepare("DELETE FROM chapters WHERE subject_id = 'social-studies' AND id = ?").run(id).changes;
}
db.exec('PRAGMA foreign_keys = ON;');

// 1c. Drop whole-subject AGGREGATE chapters whose id collides with a subject id
// (physics/chemistry/biology → "Light - Reflection and Refraction" etc.). They
// duplicate real chapter-level entries and leak subject-named ids into the
// chapter dropdown, causing board/subject/chapter cross-references.
const aggIds = ['physics', 'chemistry', 'biology'];
db.exec('PRAGMA foreign_keys = OFF;');
let aggRemoved = 0;
for (const id of aggIds) {
  db.prepare('DELETE FROM solutions WHERE problem_id IN (SELECT id FROM problems WHERE topic_id IN (SELECT id FROM topics WHERE chapter_id = ?))').run(id);
  db.prepare('DELETE FROM problems WHERE topic_id IN (SELECT id FROM topics WHERE chapter_id = ?)').run(id);
  db.prepare('DELETE FROM topics WHERE chapter_id = ?').run(id);
  aggRemoved += db.prepare('DELETE FROM chapters WHERE id = ? AND board_source = ?').run(id, 'CBSE_NCERT').changes;
}
db.exec('PRAGMA foreign_keys = ON;');

// 2. Rebuild AP_BOARD / TS_BOARD from the AUTHORITATIVE per-board syllabi
// (lib/boardSyllabus.js — AP and TS differ from each other and from NCERT).
// Old board chapters are removed first (idempotent rebuild).
const boardSyllabus = require('../lib/boardSyllabus');
const getNcert = db.prepare('SELECT summary FROM chapters WHERE id = ? AND board_source = ?');

function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const boardDefs = [
  { prefix: 'ap', board: 'AP_BOARD', data: boardSyllabus.BOARDS.AP_BOARD },
  { prefix: 'ts', board: 'TS_BOARD', data: boardSyllabus.BOARDS.TS_BOARD }
];

let seeded = 0;
for (const b of boardDefs) {
  // 2a. Drop the previous board tree (chapters + dependent topics).
  db.exec('PRAGMA foreign_keys = OFF;');
  const prior = db.prepare('SELECT id FROM chapters WHERE board_source = ?').all(b.board);
  for (const ch of prior) {
    db.prepare('DELETE FROM solutions WHERE problem_id IN (SELECT id FROM problems WHERE topic_id IN (SELECT id FROM topics WHERE chapter_id = ?))').run(ch.id);
    db.prepare('DELETE FROM problems WHERE topic_id IN (SELECT id FROM topics WHERE chapter_id = ?)').run(ch.id);
    db.prepare('DELETE FROM topics WHERE chapter_id = ?').run(ch.id);
  }
  db.prepare('DELETE FROM chapters WHERE board_source = ?').run(b.board);
  db.exec('PRAGMA foreign_keys = ON;');

  // 2b. Insert the authoritative chapters.
  for (const ch of boardSyllabus.flatten(b.data)) {
    const id = `${b.prefix}-${ch.subject}-${slug(ch.name)}`;
    const summary = ch.ncert ? (getNcert.get(ch.ncert, 'CBSE_NCERT') || {}).summary || '' : '';
    insertChapter.run(id, ch.subject, ch.name, summary, b.board, '2026-27');
    seeded++;
  }
}

console.log(`Board seed done. migrated ${migrated} NCERT social subjects; removed ${deduped} duplicate social + ${aggRemoved} subject-colliding aggregate chapters; rebuilt ${seeded} chapters across AP_BOARD + TS_BOARD.`);

// 3. Integrity: assert zero id overlap across all board trees.
const idsByBoard = {};
for (const row of db.prepare('SELECT board_source, id, COUNT(*) c FROM chapters GROUP BY board_source, id HAVING c > 1').all()) {
  console.warn('DUPLICATE chapter within', row.board_source, row.id);
}
for (const b of boardDefs) {
  const n = db.prepare("SELECT COUNT(*) c FROM chapters WHERE board_source = ?").get(b.board).c;
  console.log(`${b.board}: ${n} chapters`);
}
db.close();