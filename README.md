# StrykerOS Portfolio

Windows-inspired portfolio site with a Supabase-backed project admin, DEV.to blog views, and newsletter subscription.

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
Newsletter subscriptions are handled by `api/newsletter/subscribe.ts` and also use Supabase storage:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Public runtime config is served by `/api/config` from server env vars:

- `DEV_USERNAME`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

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

## Content

- Canonical content: `content/portfolio.json`
- Admin route: `/admin`
- Portfolio table schema: `supabase/portfolio_schema.sql`
- Newsletter schema: `supabase/newsletter_schema.sql`
