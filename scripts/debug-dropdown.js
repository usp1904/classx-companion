const content = require('../lib/content');
const lessons = content.listLessons();
console.log('Total lessons:', lessons.length);
console.log('');
console.log('=== Mathematics chapter dropdown ===');
lessons.filter(l => l.subject === 'mathematics').forEach(l => {
  console.log('lessonId=' + l.lessonId + ' | title="' + l.title + '" | ch=' + l.chapterNumber);
});
console.log('');
console.log('Files NOT in listing (no chapterNumber):');
const fs = require('fs');
const dir = 'content/mathematics';
fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
  const raw = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  if (!raw.chapterNumber) {
    console.log('  ' + f + ' | chapter="' + (raw.chapter || '') + '"');
  }
});

console.log('');
console.log('=== Raw chapter field from each content file ===');
fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().forEach(f => {
  const raw = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  console.log('  ' + f + ' | chapter="' + raw.chapter + '"');
});
