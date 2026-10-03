# Portfolio view counter (Countty on Cloudflare)

Public worker: **https://countty.linkitofficial25.workers.dev**

Slug: `strykerinside:resume`

The main site reads counts via `VITE_PORTFOLIO_VIEWS_*` (set in root `vercel.json` build env).

## Maintain

```bash
cd countty-worker
npm install --legacy-peer-deps
npx countty peek strykerinside:resume
npm run deploy   # after changing worker.ts / wrangler.jsonc
```

Create slug (auth): use Node with `.env` token or fix CLI env loading, then `POST /create` with `{ "slug": "strykerinside:resume" }`.

Admin token lives in Cloudflare Worker secret `COUNTTY_TOKEN` (not in git).
