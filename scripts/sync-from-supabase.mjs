import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (script) => {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('export-from-supabase.mjs');
run('localize-content-images.mjs');
run('extract-data-url-images.mjs');
