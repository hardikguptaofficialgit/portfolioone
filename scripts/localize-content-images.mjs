import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const publicImages = path.join(root, 'public', 'images');

const CONTENT_FILES = [
  'site.json',
  'skills.json',
  'projects.json',
  'experience.json',
  'blogs.json',
  'photos.json',
];

const URL_RE = /https?:\/\/[^\s"'<>)\]]+/gi;

const extFromUrl = (url) => {
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i);
    if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  } catch {
    /* ignore */
  }
  return 'bin';
};

const isLikelyImageUrl = (url) => {
  if (/res\.cloudinary\.com/i.test(url)) return true;
  if (/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(url)) return true;
  if (/imgur\.com|i\.imgur\.com/i.test(url)) return true;
  if (/google\.com\/s2\/favicons/i.test(url)) return true;
  if (/linkitapp\.in\/v\d+\.png/i.test(url)) return true;
  if (/github\.com\/.*\/raw\//i.test(url)) return true;
  if (/vercel\.app\/assets\//i.test(url)) return true;
  return false;
};

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, { headers: { 'User-Agent': 'portfolioone-localize/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`${url} -> HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });

const urlToLocalPath = (url) => {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
  let subdir = 'misc';
  if (/portfolio\/blogs\//i.test(url)) subdir = 'blogs';
  else if (/favicons/i.test(url)) subdir = 'logos';
  else if (/photo|hackathon|sih|fabrithon|growth/i.test(url)) subdir = 'photos';
  else if (/project|linkit|nuvi|opensource|velocity|pigglu/i.test(url)) subdir = 'projects';
  const ext = extFromUrl(url);
  return `/images/${subdir}/${hash}.${ext}`;
};

const cache = new Map();

const localizeUrl = async (url) => {
  if (!isLikelyImageUrl(url)) return url;
  if (cache.has(url)) return cache.get(url);
  const localPath = urlToLocalPath(url);
  const dest = path.join(root, 'public', localPath.replace(/^\//, '').replace(/\//g, path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
    console.log('get', url.slice(0, 80) + (url.length > 80 ? '…' : ''));
    await download(url, dest);
  } else {
    console.log('skip', localPath);
  }
  cache.set(url, localPath);
  return localPath;
};

const walk = async (value) => {
  if (typeof value === 'string') {
    let out = value;
    const matches = [...value.matchAll(URL_RE)];
    for (const m of matches) {
      const raw = m[0];
      const localized = await localizeUrl(raw);
      if (localized !== raw) out = out.split(raw).join(localized);
    }
    return out;
  }
  if (Array.isArray(value)) {
    const arr = [];
    for (const item of value) arr.push(await walk(item));
    return arr;
  }
  if (value && typeof value === 'object') {
    const obj = {};
    for (const [k, v] of Object.entries(value)) obj[k] = await walk(v);
    return obj;
  }
  return value;
};

fs.mkdirSync(publicImages, { recursive: true });

for (const file of CONTENT_FILES) {
  const p = path.join(contentDir, file);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const next = await walk(data);
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log('patched', file);
}

// Fix broken relative paths from old exports
const expPath = path.join(contentDir, 'experience.json');
if (fs.existsSync(expPath)) {
  const exp = JSON.parse(fs.readFileSync(expPath, 'utf8'));
  for (const item of exp.simplifiedExperience ?? []) {
    if (item.logoUrl?.startsWith('./public/')) {
      item.logoUrl = item.logoUrl.replace('./public', '');
    }
    if (item.logoUrl === '/nextroundai.jpg' || item.id === 'nextround-intern') {
      item.logoUrl = '/nextroundai.jpg';
    }
  }
  fs.writeFileSync(expPath, JSON.stringify(exp, null, 2) + '\n', 'utf8');
}

console.log('Done. Localized', cache.size, 'unique image URLs.');
