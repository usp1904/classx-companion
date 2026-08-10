// Strip every function body from Media onward, see if app parses
const fs = require('fs');
const vm = require('vm');
let code = fs.readFileSync('frontend/app.js', 'utf8');
const lines = code.split('\n');
// Find line of `function Media`
const startIdx = lines.findIndex(l => /function Media\(\{ lesson \}\)/.test(l));
console.log('Media starts at line', startIdx + 1);
// Truncate everything from Media onward
const truncated = lines.slice(0, startIdx).join('\n') + '\n';
console.log('truncated length:', truncated.length);
try {
  new vm.Script(truncated, {filename:'app.js'});
  console.log('Without Media: OK');
} catch(e) {
  console.log('Without Media: ERR:', e.message);
}
