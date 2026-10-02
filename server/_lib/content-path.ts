import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const withSlash = (dir: string) => (dir.endsWith('/') ? dir : `${dir}/`);

export const resolveContentDir = (): string => {
  const candidates = [
    fileURLToPath(new URL('../../content/', import.meta.url)),
    join(process.cwd(), 'content'),
    join(process.cwd(), '..', 'content'),
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, 'site.json'))) return withSlash(dir);
  }

  throw new Error('Portfolio content directory not found.');
};
