const fs = require('fs');
const code = fs.readFileSync('frontend/app/components/LocationMap.tsx', 'utf8');
let depth = 0;
let paren = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // naive check, ignoring strings/comments for a moment
  for (const char of line) {
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (char === '(') paren++;
    if (char === ')') paren--;
  }
}
console.log({ depth, paren });
