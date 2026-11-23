# StrykerOS Portfolio

Windows-inspired portfolio site with structured portfolio content and Markdown-first publishing.

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
| `content/blogs/` | Obsidian vault containing blog posts as Markdown |
| `content/photos.json` | Photo gallery events |
| `content/site-metrics.json` | Portfolio view counter (API writes locally) |
| `content/dooms-waitlist.json` | Dooms waitlist entries (API writes locally) |

Static images live under `public/images/`.

## Blog posts

Open **`content/blogs/`** as an Obsidian vault. Write technical articles in the vault root and personal pieces in `Writings/`. Both collections are loaded directly from Markdown; there are no blog or writing JSON files. Pasted Obsidian images are saved to `public/images/blogs/` and work in published posts. The portfolio's **Writing** menu opens the Blogs and Writings collections. See **[content/BLOGS.md](content/BLOGS.md)** for setup and frontmatter fields.

## Environment

Only needed for **Ask AI / chat**:

- `GITHUB_TOKEN` - GitHub token with [Models API](https://docs.github.com/en/rest/models) access
- `GITHUB_MODELS_MODEL` - optional, default `openai/gpt-4o`

Portfolio, blogs, waitlist, and views use **`content/*.json`** only - no database env vars.
