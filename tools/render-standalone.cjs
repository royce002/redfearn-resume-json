/**
 * Render standalone.html from PHP with UTF-8-safe output (Windows-safe).
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'standalone.html');

const html = execFileSync('php', [path.join(__dirname, 'render-standalone.php')], {
  encoding: 'utf8',
  cwd: ROOT,
  maxBuffer: 20 * 1024 * 1024,
});

fs.writeFileSync(OUT, html, 'utf8');
console.log(`render-standalone.cjs wrote ${html.length} bytes → standalone.html`);
