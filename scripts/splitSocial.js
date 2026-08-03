// Splits the single "Social Studies" syllabus subject into four subjects —
// History, Geography, Civics, Economics — preserving the existing chapters.
// Run: node scripts/splitSocial.js
'use strict';

const fs = require('fs');
const path = require('path');

const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus.json');
const data = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));

const social = data.subjects.find(s => s.id === 'social-studies');
if (!social) {
  console.log('No social-studies subject found; nothing to do.');
  process.exit(0);
}

const byChapter = {};
for (const c of social.chapters) byChapter[c.id] = c;

const branches = [
  { id: 'history',  name: 'History',        desc: 'NCERT Class X History (India and the Contemporary World II) — nationalism and the making of the modern world.',            chapterId: 'nationalism-in-india' },
  { id: 'geography',name: 'Geography',      desc: 'NCERT Class X Geography — Contemporary India II: resources, land, water, agriculture and industries.',                          chapterId: 'resources-and-development' },
  { id: 'civics',   name: 'Civics',         desc: 'NCERT Class X Civics — Democratic Politics II: power sharing, federalism and democratic reforms.',                                    chapterId: 'power-sharing' },
  { id: 'economics',name: 'Economics',      desc: 'NCERT Class X Economics — Understanding Economic Development: sectors, money and globalisation.',                                      chapterId: 'sectors-of-indian-economy' }
];

const newSubjects = branches
  .filter(b => byChapter[b.chapterId])
  .map(b => ({
    id: b.id,
    name: b.name,
    description: b.desc,
    chapters: [byChapter[b.chapterId]]
  }));

data.subjects = data.subjects.filter(s => s.id !== 'social-studies').concat(newSubjects);

fs.writeFileSync(syllabusPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('Split social-studies into:', newSubjects.map(s => s.name).join(', '));
console.log('Total subjects now:', data.subjects.length);