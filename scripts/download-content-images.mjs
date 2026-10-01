import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public', 'images');

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, { headers: { 'User-Agent': 'portfolioone-content-sync/1.0' } }, (res) => {
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

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const jobs = [
  { url: 'https://linkitapp.in/v1.png', rel: 'projects/linkit.png' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1744129312/n_rz5riq.png', rel: 'projects/nuvibrainz.png' },
  { url: 'https://i.imgur.com/vzPtssA.png', rel: 'projects/pigglu-khelega.png' },
  { url: 'https://opensourcehire.vercel.app/assets/logo-M4ZsasB2.png', rel: 'projects/opensource-hire.png' },
  {
    url: 'https://github.com/hardikguptaofficialgit/velocitytransit/raw/main/velocitytransitdark.png',
    rel: 'projects/velocity-transit.png',
  },
  { url: 'https://www.google.com/s2/favicons?domain=sparkeefy.com&sz=128', rel: 'logos/sparkeefy.png' },
  { url: 'https://www.google.com/s2/favicons?domain=reticle.sh&sz=128', rel: 'logos/reticle.png' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743285/1764948681199_h5kftg.jpg', rel: 'photos/growth-hackathon-1.jpg' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743085/growthhack_khmjaz.jpg', rel: 'photos/growth-hackathon-2.jpg' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743085/googledev_jea6og.jpg', rel: 'photos/gdg-hackathon.jpg' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743086/ycombinator_lfwhvf.jpg', rel: 'photos/yc-hackathon.jpg' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743085/sih_syvawh.jpg', rel: 'photos/sih-1.jpg' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743085/1758603766202_xdnag2.jpg', rel: 'photos/sih-2.jpg' },
  { url: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1770743085/fabrithon_cxglxr.jpg', rel: 'photos/fabrithon.jpg' },
];

ensureDir(path.join(publicDir, 'projects'));
ensureDir(path.join(publicDir, 'logos'));
ensureDir(path.join(publicDir, 'photos'));

for (const job of jobs) {
  const dest = path.join(publicDir, job.rel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log('skip', job.rel);
    continue;
  }
  console.log('get', job.url);
  await download(job.url, dest);
  console.log(' ->', job.rel);
}

const patchJson = (file, mutator) => {
  const p = path.join(root, 'content', file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  mutator(data);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
};

patchJson('projects.json', (data) => {
  const map = {
    linkit: '/images/projects/linkit.png',
    nuvibrainz: '/images/projects/nuvibrainz.png',
    'pigglu-khelega': '/images/projects/pigglu-khelega.png',
    'opensource-hire': '/images/projects/opensource-hire.png',
    'velocity-transit': '/images/projects/velocity-transit.png',
  };
  for (const project of data.projects) {
    if (map[project.id]) project.imageUrl = map[project.id];
  }
});

patchJson('photos.json', (data) => {
  const byId = {
    'growth-hackathon-banglore-2025': ['/images/photos/growth-hackathon-1.jpg', '/images/photos/growth-hackathon-2.jpg'],
    'gdg-hackathon-2025': ['/images/photos/gdg-hackathon.jpg'],
    'ycombinator-hackathon-2025': ['/images/photos/yc-hackathon.jpg'],
    sih2025: ['/images/photos/sih-1.jpg', '/images/photos/sih-2.jpg'],
    fabrithon: ['/images/photos/fabrithon.jpg'],
  };
  for (const event of data.photoEvents) {
    if (byId[event.id]) event.images = byId[event.id];
  }
});

patchJson('experience.json', (data) => {
  for (const item of data.simplifiedExperience ?? []) {
    if (item.id === 'sparkeefy-backend') item.logoUrl = '/images/logos/sparkeefy.png';
    if (item.id === 'reticle-oss') item.logoUrl = '/images/logos/reticle.png';
    if (item.id === 'nextround-intern') item.logoUrl = '/nextroundai.jpg';
  }
});

console.log('Updated content JSON image paths.');
