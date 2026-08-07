# StrykerOS Portfolio

Windows-inspired portfolio site with a Supabase-backed content admin, local blog publishing, Cloudinary image uploads, and Resend newsletter subscription.

## Quick start

```bash
npm install
npm run dev
```

## Vercel deploy

Use Vercel for this project.

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`

Portfolio content falls back to `content/portfolio.json`, but `/admin` edits are saved in Supabase.
Portfolio content falls back to `content/portfolio.json`, but `/admin` edits are saved in Supabase. Newsletter subscriptions are handled by `api/newsletter/subscribe.ts` and also use Supabase storage:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Admin login requires:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

AI chat uses GitHub Models through a server-side API route:

- `GITHUB_TOKEN` with the GitHub Models `models` scope
- `GITHUB_MODELS_MODEL` optional, defaults to `openai/gpt-4o`

Newsletter welcome emails additionally need:

- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`

Cloudinary image uploads and blog image imports need:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The authenticated admin blog importer can do a one-time import from DEV:

- `DEV_IMPORT_USERNAME` optional
- `DEV_API_KEY` optional, useful for importing authenticated/personal articles

## Content

- Canonical content: `content/portfolio.json`
- Admin route: `/admin`
- Portfolio table schema: `supabase/portfolio_schema.sql`
- Newsletter schema: `supabase/newsletter_schema.sql`
