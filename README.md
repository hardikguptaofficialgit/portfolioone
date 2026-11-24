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

Static images live under `public/images/`. Obsidian attachments are saved inside the vault at `content/blogs/Attachments/` and copied to `public/images/blogs/obsidian/` automatically by the dev server and production build. The copied folder is generated and ignored by Git; commit the original files in the vault instead.

## Blog posts

Open **`content/blogs/`** as an Obsidian vault. Write technical articles in the vault root and personal pieces in `Writings/`. Both collections are loaded directly from Markdown; there are no blog or writing JSON files. While `npm run dev` is running, saved Markdown changes and pasted images trigger an automatic browser refresh. Pasted images are saved to `content/blogs/Attachments/` and synced locally for preview; production builds copy them for publishing. The portfolio's **Writing** menu opens the Blogs and Writings collections. See **[content/BLOGS.md](content/BLOGS.md)** for setup and frontmatter fields.

### Local writing → GitHub publishing

1. Start the local site with `npm run dev` and keep that terminal running.
2. Write and paste images in Obsidian. Save the note; the local portfolio refreshes automatically.
3. When the post is ready, review `git status` and preview it locally.
4. Commit the Markdown and original attachments, then push your branch:

   ```bash
   git add content/blogs
   git commit -m "Add or update blog posts"
   git push origin main
   ```

   Replace `main` with your working branch when needed. No automatic commit or push runs while you write.

## Environment

Only needed for **Ask AI / chat**:

- `GITHUB_TOKEN` - GitHub token with [Models API](https://docs.github.com/en/rest/models) access
- `GITHUB_MODELS_MODEL` - optional, default `openai/gpt-4o`

Portfolio, blogs, waitlist, and views use **`content/*.json`** only - no database env vars.
