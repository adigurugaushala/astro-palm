// Copies only the files the browser needs into ./public for static hosting (Vercel).
// Server code, data files, tests and design references are never published.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');
const PUBLIC_FILES = ['index.html', 'styles.css', 'app.js', 'site.js', 'chart-ui.js', 'i18n.js', 'motion.js', 'guruji-assist.js', 'palm-assessment-data.js', 'palm-assessment.js', 'data.js', 'content-data.js', 'gotras-data.js', 'mantras-data.js', 'mantras-db.js', 'manifest.webmanifest'];
const PUBLIC_DIRS = ['assets'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const f of PUBLIC_FILES) fs.copyFileSync(path.join(root, f), path.join(out, f));
// Version the page's own scripts and styles by content, so browsers that
// cached an older copy pick up a new deployment straight away.
{
  const crypto = require('crypto');
  const file = path.join(out, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const hash = crypto.createHash('sha1');
  for (const m of html.matchAll(/(?:src|href)="\/([\w./-]+\.(?:js|css))"/g)) {
    try { hash.update(fs.readFileSync(path.join(root, m[1]))); } catch (e) { /* skip */ }
  }
  for (const f of ['guruji-assist.js', 'palm-assessment.js', 'palm-assessment-data.js']) hash.update(fs.readFileSync(path.join(root, f)));
  const v = hash.digest('hex').slice(0, 10);
  fs.writeFileSync(file, html.replace(/((?:src|href)="\/[\w./-]+\.(?:js|css))"/g, `$1?v=${v}"`));
}
for (const d of PUBLIC_DIRS) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });

const count = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`[build] public/ ready — ${count(out)} files`);
