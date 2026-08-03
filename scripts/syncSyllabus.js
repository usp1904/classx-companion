// Syllabus sync job (CI/CD "Syllabus Sync" stage).
//
// Today syllabus JSON is the single source of truth; DB board-trees are seeded
// separately. This script is the plug point where an external scheduler would
// pull updated NCERT / CBSE / AP / Telangana syllabus, then resync the index.
// It: (1) loads and validates data/syllabus.json, (2) asserts every required
// subject (incl. the 4 social-science branches) is present, (3) reports the
// chapter inventory. Exits non-zero on any integrity failure so CI fails fast.
'use strict';

const fs = require('fs');
const path = require('path');

const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus.json');
const REQUIRED_SUBJECTS = [
  'mathematics', 'physics', 'chemistry', 'biology',
  'history', 'geography', 'civics', 'economics'
];

let data;
try {
  data = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
} catch (err) {
  console.error('Syllabus sync FAILED — could not parse syllabus.json:', err.message);
  process.exit(1);
}

if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
  console.error('Syllabus sync FAILED — no subjects in syllabus.json');
  process.exit(1);
}

const ids = new Set(data.subjects.map(s => s.id));
const missing = REQUIRED_SUBJECTS.filter(id => !ids.has(id));
if (missing.length) {
  console.error('Syllabus sync FAILED — missing required subjects:', missing.join(', '));
  process.exit(1);
}

let chapterTotal = 0;
for (const s of data.subjects) {
  if (!Array.isArray(s.chapters)) {
    console.error(`Syllabus sync FAILED — '${s.id}' has no chapters array`);
    process.exit(1);
  }
  chapterTotal += s.chapters.length;
}

console.log('[syllabus-sync] OK — subjects=%d (required 8 present), total chapters=%d',
  data.subjects.length, chapterTotal);
process.exit(0);