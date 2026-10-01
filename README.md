# StrykerOS Portfolio

Windows-inspired portfolio site with JSON-backed content, local blog publishing, and optional Resend newsletter emails.

## Quick start

```bash
npm install
npm run dev
```

## Vercel deploy

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`

## Content (edit these files)

| File | What it holds |
|------|----------------|
| `content/site.json` | Profile, social links, sections, education, achievements |
| `content/skills.json` | Skill categories and flat list |
| `content/projects.json` | Projects |
| `content/experience.json` | Timeline + simplified resume experience |
| `content/blogs.json` | Blog posts |
| `content/photos.json` | Photo gallery events |
| `content/site-metrics.json` | Portfolio view counter (API writes locally) |
| `content/newsletter-subscribers.json` | Newsletter signups (API writes locally) |
| `content/dooms-waitlist.json` | Dooms waitlist entries (API writes locally) |

Static images live under `public/images/`. To pull the latest from Supabase (one-time or refresh) and localize images:

```bash
node scripts/sync-from-supabase.mjs
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

## Environment

AI chat (optional):

- `GITHUB_TOKEN` with GitHub Models `models` scope
- `GITHUB_MODELS_MODEL` optional, defaults to `openai/gpt-4o`

Newsletter welcome emails (optional):

- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`
