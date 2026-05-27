/**
 * Update data/resume.json and data/logos.txt paths via image_manifest.json.
 * Resolves duplicate_of chains, archival/jobs aliases, and syncs gallery dimensions.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'assets', 'images', 'image_manifest.json');
const RESUME_PATH = path.join(ROOT, 'data', 'resume.json');
const LOGOS_PATH = path.join(ROOT, 'data', 'logos.txt');

const manifestList = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

/** @type {Record<string, object>} */
const manifest = {};
for (const entry of manifestList) {
  manifest[entry.rel] = entry;
}

/** @type {Record<string, object>} keyed by new_rel */
const byNewRel = {};
for (const entry of manifestList) {
  if (entry.new_rel) byNewRel[entry.new_rel] = entry;
}

function resolveCanonicalPath(relPath, seen = new Set()) {
  if (!relPath || seen.has(relPath)) return relPath;
  seen.add(relPath);
  const entry = manifest[relPath];
  if (!entry) return relPath;
  if (entry.new_rel) return entry.new_rel;
  if (entry.duplicate_of) return resolveCanonicalPath(entry.duplicate_of, seen);
  return relPath;
}

/** Map resume root-level basename → manifest rel (e.g. archival/foo.webp) */
function buildAliasMap() {
  /** @type {Record<string, string>} */
  const aliases = {};
  for (const rel of Object.keys(manifest)) {
    const base = rel.split('/').pop();
    if (!base) continue;
    if (!aliases[base]) aliases[base] = rel;
    // prefer shorter rel (no archival/ prefix) when both exist
    if (rel.includes('/') && !rel.startsWith('archival/')) {
      aliases[base] = rel;
    }
  }
  // explicit overrides where resume uses wrong prefix
  aliases['fort-worth-seo-web-developer-texas-title-real-estate-mobile.webp'] =
    'archival/fort-worth-seo-web-developer-texas-title-real-estate-mobile.webp';
  aliases['carrollton-php-developer-quick-technologies-sage-homepage-desktop.webp'] =
    'jobs/sage/carrollton-php-developer-quick-technologies-sage-homepage-desktop.webp';
  aliases['carrollton-php-developer-quick-technologies-sage-homepage-mobile.webp'] =
    'jobs/sage/carrollton-php-developer-quick-technologies-sage-homepage-mobile.webp';
  return aliases;
}

const aliases = buildAliasMap();

function resolvePath(relPath) {
  if (!relPath || relPath.startsWith('/') || relPath.startsWith('http')) return relPath;
  const clean = relPath.replace(/\r/g, '').trim();
  let lookup = clean;
  if (!manifest[lookup]) {
    const base = clean.split('/').pop();
    if (base && aliases[base]) lookup = aliases[base];
    else if (base && manifest[`archival/${base}`]) lookup = `archival/${base}`;
  }
  return resolveCanonicalPath(lookup);
}

function dimensionsForCanonical(canonicalPath) {
  const entry = byNewRel[canonicalPath];
  if (!entry || !entry.width || !entry.height) return null;
  return { width: entry.width, height: entry.height };
}

// ── resume.json ───────────────────────────────────────────────────────────
const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
let pathUpdates = 0;
let dimUpdates = 0;

function patchFileField(obj, key = 'file') {
  if (!obj || typeof obj !== 'object') return;
  if (typeof obj[key] === 'string' && obj[key] && !obj[key].startsWith('/') && !obj[key].startsWith('http')) {
    const oldVal = obj[key];
    const newVal = resolvePath(oldVal);
    if (newVal !== oldVal) {
      obj[key] = newVal;
      pathUpdates++;
    }
    if (Array.isArray(obj.gallery) || key === 'file') {
      // sync dimensions on gallery items
    }
  }
}

if (Array.isArray(resume.experience)) {
  for (const job of resume.experience) {
    if (Array.isArray(job.gallery)) {
      for (const item of job.gallery) {
        if (typeof item.file === 'string') {
          const oldVal = item.file;
          const newVal = resolvePath(oldVal);
          if (newVal !== oldVal) {
            item.file = newVal;
            pathUpdates++;
          }
          const dims = dimensionsForCanonical(item.file);
          if (dims) {
            if (item.width !== dims.width || item.height !== dims.height) {
              item.width = dims.width;
              item.height = dims.height;
              dimUpdates++;
            }
          }
        }
      }
    }
    for (const gridKey of ['brandGrid', 'agencyGrid']) {
      const grid = job[gridKey];
      if (!Array.isArray(grid)) continue;
      for (const cell of grid) {
        if (typeof cell.file === 'string') {
          const newVal = resolvePath(cell.file);
          if (newVal !== cell.file) {
            cell.file = newVal;
            pathUpdates++;
          }
        }
      }
    }
  }
}

const portfolio = resume.portfolio;
if (portfolio && typeof portfolio === 'object') {
  if (Array.isArray(portfolio.agency?.partners)) {
    for (const p of portfolio.agency.partners) {
      if (typeof p.file === 'string') {
        const newVal = resolvePath(p.file);
        if (newVal !== p.file) {
          p.file = newVal;
          pathUpdates++;
        }
      }
    }
  }
  if (Array.isArray(portfolio.showcase?.gridOrder)) {
    portfolio.showcase.gridOrder = portfolio.showcase.gridOrder.map((f) => {
      const newVal = resolvePath(f);
      if (newVal !== f) pathUpdates++;
      return newVal;
    });
  }
  if (Array.isArray(portfolio.credentials?.downloads)) {
    for (const dl of portfolio.credentials.downloads) {
      if (typeof dl.icon === 'string') {
        const newVal = resolvePath(dl.icon);
        if (newVal !== dl.icon) {
          dl.icon = newVal;
          pathUpdates++;
        }
      }
    }
  }
}

fs.writeFileSync(RESUME_PATH, JSON.stringify(resume, null, 4) + '\n', 'utf8');

// ── logos.txt ───────────────────────────────────────────────────────────────
const KCM_BRAND_PATHS = {
  'KENNETH COPELAND MINISTRIES': 'brands/KCM-Brand.svg',
  EMIC: 'brands/EMIC-Brand.webp',
  GOVICTORY: 'brands/Victory-Brand-1.webp',
  SWBC: 'brands/SWBC-Brand.webp',
  'SOUTHWEST BELIEVERS CONVENTION': 'brands/SWBC-Brand.webp',
  'VICTORY NEWS TONIGHT': 'brands/Victory-Brand-2.webp',
  'AMERICA STANDS': 'brands/AmericaStands-Brand.webp',
};

const AGENCY_LOGO_OVERRIDES = {
  'AMPLIFI COMMERCE': 'brands/Amplifi-Brand-1.webp',
  'ADVANTIS MEDICAL STAFFING': 'brands/Advantis-Brand-2-2.avif',
  'TARRANT REGIONAL WATER DISTRICT': 'brands/TRVA-Brand.svg',
  'TRINITY RIVER VISION AUTHORITY': 'brands/TRVA-Brand.svg',
  'QUICK TECHNOLOGIES (SAGE)': 'brands/Sage-Brand.svg',
  'QUICK TECHNOLOGIES INC': 'brands/Sage-Brand.svg',
  'FOSSIL INC.': 'brands/Fossil-Brand.webp',
  FOSSIL: 'brands/Fossil-Brand.webp',
  'WEB VIDEO 360': resolvePath('fort-worth-web-developer-webvideo360-agency-logo.webp'),
};

let logosRaw = fs.readFileSync(LOGOS_PATH, 'utf8');
logosRaw = logosRaw.replace(/\r/g, '');
const logoLines = logosRaw.split('\n');
let logoUpdates = 0;

const outLines = logoLines.map((line) => {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('#')) return line.replace(/\r/g, '');
  const parts = line.split('\t');
  if (parts.length < 2) return line.replace(/\r/g, '');
  const label = parts[0].trim().toUpperCase();
  let value = parts.slice(1).join('\t').trim().replace(/\r/g, '');

  if (KCM_BRAND_PATHS[label]) {
    if (value !== KCM_BRAND_PATHS[label]) {
      logoUpdates++;
      return `${parts[0]}\t${KCM_BRAND_PATHS[label]}`;
    }
    return `${parts[0]}\t${value}`;
  }

  if (AGENCY_LOGO_OVERRIDES[label]) {
    const target = AGENCY_LOGO_OVERRIDES[label];
    if (value !== target) {
      logoUpdates++;
      return `${parts[0]}\t${target}`;
    }
    return `${parts[0]}\t${value}`;
  }

  if (value === 'text' || value.startsWith('http')) return `${parts[0]}\t${value}`;

  const resolved = resolvePath(value);
  if (resolved !== value) {
    logoUpdates++;
    return `${parts[0]}\t${resolved}`;
  }
  return `${parts[0]}\t${value}`;
});

fs.writeFileSync(LOGOS_PATH, outLines.join('\n') + (outLines[outLines.length - 1] === '' ? '' : '\n'), 'utf8');

console.log('sync-resume-image-refs complete');
console.log(`  resume.json: ${pathUpdates} path updates, ${dimUpdates} dimension updates`);
console.log(`  logos.txt: ${logoUpdates} updates`);
