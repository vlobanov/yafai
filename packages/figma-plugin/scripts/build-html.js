import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

// Read the built CSS and JS
const css = readFileSync(join(distDir, 'ui.css'), 'utf-8');
const js = readFileSync(join(distDir, 'ui.js'), 'utf-8');

// Create the HTML file with inlined CSS and JS
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yafai AI</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>${js}</script>
</body>
</html>`;

writeFileSync(join(distDir, 'ui.html'), html);
console.log('Built ui.html');
