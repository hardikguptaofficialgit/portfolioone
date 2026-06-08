# StrykerOS Portfolio

Windows-inspired portfolio site with a **unified content layer** and **Portfolio MCP** for AI-managed updates.

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

The portfolio API is served by Vercel Serverless Functions under `/api/portfolio`.
Public reads work from the committed seed content. Portfolio writes and newsletter
subscriptions require Supabase environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORTFOLIO_API_KEY` for protected portfolio writes

Newsletter welcome emails additionally need:

- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`

## Portfolio MCP

See [docs/PORTFOLIO_MCP.md](docs/PORTFOLIO_MCP.md) for API keys, Supabase setup, Cursor/ChatGPT configuration, and available tools.

- Canonical content: `content/portfolio.json`
- API: `/api/portfolio`
- MCP package: `packages/portfolio-mcp`
