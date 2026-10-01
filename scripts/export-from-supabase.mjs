import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const loadEnv = () => {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
};

const env = loadEnv();
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

const fetchJson = async (pathAndQuery) => {
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${pathAndQuery} -> ${res.status} ${text}`);
  }
  return res.json();
};

const contentDir = path.join(root, 'content');
const write = (name, data) => {
  fs.writeFileSync(path.join(contentDir, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
};

const rows = await fetchJson('portfolio_content?select=id,data,updated_at');
const main = rows.find((r) => r.id === 'main');
if (!main?.data) {
  console.error('No portfolio_content row with id=main. Rows:', rows.map((r) => r.id).join(', ') || '(none)');
  process.exit(1);
}

const portfolio = main.data;
console.log('Fetched portfolio_content/main, updated_at:', main.updated_at);

write('site.json', {
  version: portfolio.version ?? 1,
  profile: portfolio.profile,
  socialLinks: portfolio.socialLinks ?? [],
  sections: portfolio.sections ?? {},
  education: portfolio.education ?? [],
  achievements: portfolio.achievements ?? [],
  certifications: portfolio.certifications ?? [],
  ...(portfolio.newsletterSettings ? { newsletterSettings: portfolio.newsletterSettings } : {}),
});

write('skills.json', {
  skillCategories: portfolio.skillCategories ?? [],
  skillsFlat: portfolio.skillsFlat ?? [],
});

write('projects.json', { projects: portfolio.projects ?? [] });
write('experience.json', {
  experience: portfolio.experience ?? [],
  simplifiedExperience: portfolio.simplifiedExperience ?? [],
});
write('blogs.json', { blogPosts: portfolio.blogPosts ?? [] });
write('photos.json', { photoEvents: portfolio.photoEvents ?? [] });

// Optional: site metrics
const metrics = rows.find((r) => r.id === 'site_metrics');
if (metrics?.data?.portfolioViews != null) {
  write('site-metrics.json', { portfolioViews: metrics.data.portfolioViews });
  console.log('Wrote site-metrics.json views:', metrics.data.portfolioViews);
}

// Newsletter subscribers
try {
  const subscribers = await fetchJson(
    'newsletter_subscribers?select=id,email,is_active,subscribed_at,updated_at&order=subscribed_at.asc'
  );
  write('newsletter-subscribers.json', { subscribers });
  console.log('Wrote newsletter-subscribers.json count:', subscribers.length);
} catch (e) {
  console.warn('newsletter_subscribers:', e.message);
}

// Dooms waitlist (fallback row in portfolio_content or dedicated table)
try {
  const waitlistRows = await fetchJson('dooms_waitlist?select=email,name,joined_at&order=joined_at.asc');
  write('dooms-waitlist.json', { entries: waitlistRows });
  console.log('Wrote dooms-waitlist.json count:', waitlistRows.length);
} catch {
  const fallback = rows.find((r) => r.id === 'dooms_waitlist');
  if (fallback?.data?.entries) {
    write('dooms-waitlist.json', { entries: fallback.data.entries });
    console.log('Wrote dooms-waitlist.json from portfolio_content fallback');
  }
}

console.log('Counts:', {
  projects: portfolio.projects?.length ?? 0,
  blogPosts: portfolio.blogPosts?.length ?? 0,
  experience: portfolio.experience?.length ?? 0,
  simplifiedExperience: portfolio.simplifiedExperience?.length ?? 0,
  photoEvents: portfolio.photoEvents?.length ?? 0,
});
