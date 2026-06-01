import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'content', 'portfolio.json');
const destDir = join(root, 'api', '_lib');
const dest = join(destDir, 'portfolio.seed.json');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('Synced portfolio seed -> api/_lib/portfolio.seed.json');
