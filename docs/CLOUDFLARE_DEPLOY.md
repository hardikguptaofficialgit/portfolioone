# Cloudflare Pages Deployment

This project is ready to deploy as a Vite static site with Cloudflare Pages Functions.

## Build Settings

- Framework preset: `Vite`
- Install command: `npm ci`
- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `functions`

The repo also includes `wrangler.toml`:

```toml
name = "portfolioone"
compatibility_date = "2026-06-09"
pages_build_output_dir = "dist"
```

## Runtime Routes

- `/api/portfolio` and `/api/portfolio/*` are served by `functions/api/portfolio/[[path]].ts`.
- `/api/devto/articles` is served by `functions/api/devto/articles.ts`.
- `/api/newsletter/subscribe` is served by `functions/api/newsletter/subscribe.ts`.
- `public/_routes.json` limits Function invocation to `/api/*`.
- `public/_redirects` sends client-side app routes back to `index.html`.

## Optional Cloudflare Bindings

The site no longer requires Supabase for the MVP read path.

Add these KV bindings in Cloudflare Pages > Settings > Bindings when you want persistence:

- `PORTFOLIO_KV`: stores editable portfolio content under `portfolio:main`.
- `NEWSLETTER_KV`: stores newsletter subscribers under `newsletter:subscriber:<email>`.

Add these environment variables/secrets as needed:

- `PORTFOLIO_API_KEY`: bearer token required for portfolio writes.
- `DEVTO_USERNAME`: defaults to `strykerinside`.
- `DEV_API_KEY`: optional; uses DEV.to authenticated article fetch when present.
- `RESEND_API_KEY`: optional; sends welcome newsletter email.
- `NEWSLETTER_FROM_EMAIL`: required only when `RESEND_API_KEY` is set.

## Direct Deploy

```bash
npm run deploy:cloudflare
```

Or connect the GitHub repository in Cloudflare Pages and use the build settings above.
