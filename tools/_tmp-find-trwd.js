const fs = require('fs');
const h = fs.readFileSync('standalone.html', 'utf8');
const i = h.indexOf('tarrant-regional-water-district');
const j = h.indexOf('</article>', i);
const chunk = h.slice(i, j);
const links = [...chunk.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log('links in TRWD section:', links);
console.log('contains rc-job-websites:', chunk.includes('rc-job-websites'));
console.log('contains flyfest:', /flyfest/i.test(chunk));
