import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = join(__dirname, '..', 'src', 'ui.html');
const distPath = join(__dirname, '..', 'dist', 'ui.html');

// Read and copy the HTML file
const html = readFileSync(srcPath, 'utf-8');
writeFileSync(distPath, html);

console.log('UI built successfully!');
