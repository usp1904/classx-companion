const fs = require('fs');
const c = fs.readFileSync('frontend/app.js', 'utf8');
let depth = 0, paren = 0, brack = 0, line = 1, inStr = null, inTpl = 0, inComment = false, inLineComment = false, inRegExp = false;
const stringMap = { '"': '"', "'": "'", '`': '`' };
let prev = '';
for (let i = 0; i < c.length; i++) {
  const ch = c[i];
  if (ch === '\n') {
    line++;
    inLineComment = false;
  }
  if (inLineComment) { prev = ch; continue; }
  if (inStr) {
    if (ch === inStr && prev !== '\\') inStr = null;
  } else if (inComment) {
    if (prev === '*' && ch === '/') inComment = false;
  } else if (ch === '/' && i + 1 < c.length && c[i+1] === '/') {
    inLineComment = true;
  } else if (ch === '/' && i + 1 < c.length && c[i+1] === '*') {
    inComment = true;
  } else if (ch === '"' || ch === "'" || ch === '`') {
    inStr = ch;
  } else if (ch === '{') depth++;
  else if (ch === '}') depth--;
  else if (ch === '(') paren++;
  else if (ch === ')') paren--;
  else if (ch === '[') brack++;
  else if (ch === ']') brack--;
  prev = ch;
}
console.log('FINAL: depth=', depth, 'paren=', paren, 'brack=', brack, 'lines=', line);
