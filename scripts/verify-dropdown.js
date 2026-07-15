const content = require('../lib/content');
const lessons = content.listLessons();
console.log('Dropdown entries:');
lessons.filter(l => l.subject === 'mathematics').forEach((l, i) => {
  console.log((i+1) + '. title="' + l.title + '" id=' + l.lessonId + ' ch' + l.chapterNumber);
});
console.log('');
const math = lessons.filter(l => l.subject === 'mathematics');
console.log('Total math in dropdown:', math.length);
const leaked = lessons.find(l => l.lessonId === 'ch3-l1');
console.log('ch3-l1 in dropdown?', leaked ? 'YES (leaking!)' : 'NO (correctly filtered)');
const hasLower = math.filter(l => l.title[0] !== l.title[0].toUpperCase());
console.log('Chapters starting with lowercase?', hasLower.length > 0 ? hasLower.map(l => l.title).join(', ') : 'none');
