import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const output = [
  read('src/document-head.html'),
  '<style>\n', read('src/styles.css'), '\n</style>\n</head>\n<body>\n',
  read('src/body.html'), '\n<script>\n', read('src/engine.js'),
  '\n</script>\n<script>\n', read('src/app.js'),
  '\n</script>\n</body>\n</html>\n'
].join('');
const target = path.join(root, 'index.html');
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) {
    console.error('FAIL: index.html differs from source files. Run npm run build.');
    process.exitCode = 1;
  } else {
    console.log('PASS: index.html matches modular sources exactly');
  }
} else {
  writeFileSync(target, output, 'utf8');
  console.log('Built index.html from src/');
}
