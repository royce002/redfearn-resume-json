const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'standalone.html');
let html = fs.readFileSync(file, 'utf8');

const logoSrc = 'assets/images/jobs/advantis/logo.avif';
if (html.includes(logoSrc)) {
  console.log('standalone.html already uses jobs/advantis/logo.avif');
  process.exit(0);
}

const re =
  /(<article class="rc-job" id="advantis-medical-staffing">[\s\S]*?<div class="rc-job-brand-grids">[\s\S]*?<ul class="rc-fifth-grid">)([\s\S]*?)(<\/ul>)/i;

const match = html.match(re);
if (!match) {
  console.error('Could not find advantis-medical-staffing brand grid');
  process.exit(1);
}

const replacement =
  match[1] +
  `<li class="rc-fifth-grid__cell rc-job-brand-cell"><img class="rc-job-brand-img" src="${logoSrc}" alt="Advantis Medical logo" loading="lazy" decoding="async" fetchpriority="low" /><span class="rc-job-brand-caption">Advantis Medical Staffing</span></li>` +
  match[3];

html = html.replace(re, replacement);
fs.writeFileSync(file, html);
console.log('Patched standalone.html brand logo →', logoSrc);
