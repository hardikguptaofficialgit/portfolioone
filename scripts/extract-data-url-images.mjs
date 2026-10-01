import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectsPath = path.join(root, 'content', 'projects.json');
const data = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

for (const project of data.projects) {
  const url = project.imageUrl;
  if (typeof url !== 'string' || !url.startsWith('data:image/')) continue;
  const match = url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) continue;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buf = Buffer.from(match[2], 'base64');
  const rel = `/images/projects/${project.id}.${ext}`;
  const dest = path.join(root, 'public', rel.replace(/^\//, '').replace(/\//g, path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  project.imageUrl = rel;
  console.log('extracted', project.id, '->', rel, `(${buf.length} bytes)`);
}

fs.writeFileSync(projectsPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
