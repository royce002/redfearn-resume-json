/**
 * Verify every image path referenced in resume.json + logos.txt exists under assets/images/.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'assets', 'images');
const RESUME_PATH = path.join(ROOT, 'data', 'resume.json');
const LOGOS_PATH = path.join(ROOT, 'data', 'logos.txt');

const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
const refs = new Set();

function addRef(f) {
  if (!f || typeof f !== 'string') return;
  if (f.startsWith('/') || f.startsWith('http')) return;
  refs.add(f.replace(/\\/g, '/'));
}

if (resume.basics?.image) addRef(resume.basics.image);
for (const p of Object.values(resume.personas || {})) {
  if (p.image) addRef(p.image);
}
for (const job of resume.experience || []) {
  for (const g of job.gallery || []) addRef(g.file);
  for (const b of job.brandGrid || []) addRef(b.file);
  for (const a of job.agencyGrid || []) addRef(a.file);
}
const portfolio = resume.portfolio;
if (portfolio) {
  for (const p of portfolio.agency?.partners || []) addRef(p.file);
  for (const f of portfolio.showcase?.gridOrder || []) addRef(f);
  for (const d of portfolio.credentials?.downloads || []) addRef(d.icon);
}

for (const line of fs.readFileSync(LOGOS_PATH, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const parts = t.split('\t');
  if (parts.length < 2) continue;
  const val = parts.slice(1).join('\t').trim();
  if (val && val !== 'text' && !val.startsWith('http')) addRef(val);
}

const missing = [];
const found = [];
for (const ref of refs) {
  const full = path.join(IMAGES, ref.replace(/\//g, path.sep));
  if (fs.existsSync(full)) found.push(ref);
  else missing.push(ref);
}

console.log(`Image path verification (${refs.size} refs)`);
console.log(`  found:   ${found.length}`);
console.log(`  missing: ${missing.length}`);
if (missing.length) {
  console.log('\nMissing files:');
  missing.forEach((r) => console.log('  ', r));
  process.exit(1);
}
console.log('\nAll referenced image paths exist locally.');
process.exit(0);
