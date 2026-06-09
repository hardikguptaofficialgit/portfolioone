# StrykerOS Portfolio

Windows-inspired portfolio site with a static portfolio content layer, DEV.to blog views, and newsletter subscription.

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

Portfolio content is bundled from `content/portfolio.json`; there is no portfolio API or MCP server.
Newsletter subscriptions are handled by `api/newsletter/subscribe.ts` and require Supabase storage:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Newsletter welcome emails additionally need:

- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`

## Content

- Canonical content: `content/portfolio.json`
- Newsletter schema: `supabase/newsletter_schema.sql`
