# StrykerOS Portfolio

Windows-inspired portfolio site with JSON-backed content and local blog publishing.

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
| `content/dooms-waitlist.json` | Dooms waitlist entries (API writes locally) |

Static images live under `public/images/`.

## Blog posts

Edit `content/blogs.json` → `blogPosts` array. Each post’s **`body` is Markdown** (GFM) inside a JSON string. See **[content/BLOGS.md](content/BLOGS.md)** and copy **`content/blog-post.template.json`** for a starter object.

## Environment

Only needed for **Ask AI / chat**:

- `GITHUB_TOKEN` — GitHub token with [Models API](https://docs.github.com/en/rest/models) access
- `GITHUB_MODELS_MODEL` — optional, default `openai/gpt-4o`

Portfolio, blogs, waitlist, and views use **`content/*.json`** only — no database env vars.
