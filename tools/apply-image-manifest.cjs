/**
 * Move assets/images files per image_manifest.json (rel → new_rel).
 * Usage: node tools/apply-image-manifest.cjs [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'assets', 'images');
const MANIFEST = path.join(IMAGES, 'image_manifest.json');

const dryRun = process.argv.includes('--dry-run');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const stats = { moved: 0, skippedMissing: 0, skippedExists: 0, skippedEmpty: 0, errors: 0 };
const details = { moved: [], skippedMissing: [], skippedExists: [], errors: [] };

for (const entry of manifest) {
  const { rel, new_rel: newRel } = entry;
  if (!newRel) {
    stats.skippedEmpty++;
    continue;
  }

  const srcPath = path.join(IMAGES, rel.replace(/\//g, path.sep));
  const destPath = path.join(IMAGES, newRel.replace(/\//g, path.sep));

  if (fs.existsSync(destPath)) {
    stats.skippedExists++;
    details.skippedExists.push(newRel);
    continue;
  }

  if (!fs.existsSync(srcPath)) {
    stats.skippedMissing++;
    details.skippedMissing.push(rel);
    continue;
  }

  try {
    if (!dryRun) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.renameSync(srcPath, destPath);
    }
    stats.moved++;
    details.moved.push(`${rel} → ${newRel}`);
  } catch (err) {
    stats.errors++;
    details.errors.push(`${rel}: ${err.message}`);
  }
}

console.log(dryRun ? 'DRY RUN — no files changed\n' : 'Applied image manifest\n');
console.log('Summary:', stats);
if (details.moved.length) {
  console.log(`\nMoved (${details.moved.length}):`);
  details.moved.slice(0, 20).forEach((line) => console.log('  ', line));
  if (details.moved.length > 20) console.log(`  ... and ${details.moved.length - 20} more`);
}
if (details.skippedMissing.length) {
  console.log(`\nMissing source (${details.skippedMissing.length}):`);
  details.skippedMissing.slice(0, 15).forEach((line) => console.log('  ', line));
  if (details.skippedMissing.length > 15) console.log(`  ... and ${details.skippedMissing.length - 15} more`);
}
if (details.errors.length) {
  console.log('\nErrors:');
  details.errors.forEach((line) => console.log('  ', line));
}

process.exit(stats.errors > 0 ? 1 : 0);
