const fs = require('fs');
const path = require('path');

// Base content folder
const baseContent = path.join(__dirname, '..', 'content');

// Define board folders and subjects
const data = {
  science: {
    cbse_ncert: ['physics', 'chemistry', 'biology'],
    ap_state: ['physics', 'chemistry', 'biology'],
    telangana_state: ['physics', 'chemistry', 'biology']
  },
  social: {
    cbse_ncert: ['history', 'civics', 'geography', 'economics'],
    ap_state: ['history', 'civics', 'geography', 'economics'],
    telangana_state: ['history', 'civics', 'geography', 'economics']
  }
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created folder', dir);
  }
}

function writePlaceholder(subjectPath, subject) {
  const placeholder = {
    subject,
    board_source: path.basename(path.dirname(subjectPath)).toUpperCase(),
    chapters: []
  };
  fs.writeFileSync(subjectPath, JSON.stringify(placeholder, null, 2));
  console.log('Created', subjectPath);
}

Object.entries(data).forEach(([category, boards]) => {
  Object.entries(boards).forEach(([board, subjects]) => {
    const boardDir = path.join(baseContent, category, board);
    ensureDir(boardDir);
    subjects.forEach(sub => {
      const filePath = path.join(boardDir, `${sub}.json`);
      if (!fs.existsSync(filePath)) {
        writePlaceholder(filePath, sub.charAt(0).toUpperCase() + sub.slice(1));
      }
    });
  });
});

console.log('Placeholder syllabus files created.');
