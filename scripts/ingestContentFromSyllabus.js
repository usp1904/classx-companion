const fs = require('fs');
const path = require('path');
const { db, initDatabase } = require('../lib/database');

console.log('Generating content JSON files from syllabus.json...');
initDatabase();

const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus.json');
if (!fs.existsSync(syllabusPath)) {
  console.error('syllabus.json not found at', syllabusPath);
  process.exit(1);
}
const syllabus = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));

// Helper to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

syllabus.subjects.forEach(subject => {
  const subjectDir = path.join(__dirname, '..', 'content', subject.id);
  ensureDir(subjectDir);
  subject.chapters.forEach(chapter => {
    const chapterFile = path.join(subjectDir, `${chapter.id}.json`);
    // Build a simple lesson structure
    const lesson = {
      id: chapter.id,
      chapter: chapter.name,
      title: chapter.summary,
      concepts: chapter.topics || [],
      theorems: chapter.theorems || [],
      exercises: chapter.exercises || []
    };
    // Write only if not exists to avoid overwriting existing math content
    if (!fs.existsSync(chapterFile)) {
      fs.writeFileSync(chapterFile, JSON.stringify(lesson, null, 2), 'utf8');
      console.log(`Created ${chapterFile}`);
    } else {
      console.log(`Skipped existing ${chapterFile}`);
    }
  });
});

console.log('Content generation complete.');
