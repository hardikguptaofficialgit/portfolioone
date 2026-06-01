# Portfolio MCP

This repo exposes portfolio content through a **single source of truth** (`content/portfolio.json`), a **REST API** (`/api/portfolio`), and an **MCP server** (`packages/portfolio-mcp`).

## Content model

| File / store | Purpose |
|--------------|---------|
| `content/portfolio.json` | Default seed data (committed to git) |
| Supabase `portfolio_content` | Optional runtime store for production mutations |
| `src/hooks/usePortfolio.ts` | React hook — fetches API, falls back to bundled JSON |

## Environment variables

```env
# Required for write operations (API + MCP)
PORTFOLIO_API_KEY=your-long-random-secret

# MCP server (Cursor / Claude Desktop)
PORTFOLIO_API_URL=http://localhost:8080
# or https://your-domain.vercel.app

# Optional: Supabase for production writes (recommended on Vercel)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Existing DEV.to integration
DEV_API_KEY=
```

Run `supabase/portfolio_schema.sql` in the Supabase SQL editor if you use Supabase storage.

## Local development

1. `npm run dev` — site + portfolio API middleware on port 8080
2. Set `PORTFOLIO_API_KEY` in `.env` (or `.env.local`)
3. Build and run MCP:

```bash
cd packages/portfolio-mcp
npm install
npm run build
```

### Cursor MCP config (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "portfolio": {
      "command": "node",
      "args": ["C:/Disk E/Projects/pp/portfolioone/packages/portfolio-mcp/dist/index.js"],
      "env": {
        "PORTFOLIO_API_URL": "http://localhost:8080",
        "PORTFOLIO_API_KEY": "your-secret"
      }
    }
  }
}
```

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portfolio` | No | Full document |
| PATCH | `/api/portfolio` | Bearer | Merge patch (`{ patch: { ... } }`) |
| GET | `/api/portfolio/projects` | No | List projects |
| POST | `/api/portfolio/projects` | Bearer | Create project |
| GET/PATCH/DELETE | `/api/portfolio/projects/:id` | PATCH/DELETE need auth | Single project |
| GET | `/api/portfolio/schema` | No | MCP tool/resource index |

## MCP tools

- `get_portfolio`, `list_projects`, `get_project`
- `create_project`, `update_project`, `delete_project`
- `update_skills`, `update_profile`
- `create_blog_draft` (DEV.to)

## MCP resources

- `portfolio://full`
- `portfolio://projects`
- `portfolio://schema`

## Production (Vercel)

The site on Vercel **cannot** update `content/portfolio.json` on disk. For MCP/AI writes in production you need **Supabase** (`supabase/portfolio_schema.sql`) plus the env vars below.

Keep the **MCP package in a private repo** (or only on your machine). Only you should hold `PORTFOLIO_API_KEY`. The public site never exposes it.

### Vercel → Project → Settings → Environment Variables

| Variable | Environments | Notes |
|----------|--------------|--------|
| `PORTFOLIO_API_KEY` | Production, Preview | **Server only.** Same secret you use in Cursor MCP. Required for `PATCH` / project CRUD. |
| `SUPABASE_URL` | Production, Preview | Same as `VITE_SUPABASE_URL` if you use one project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Server only.** Never prefix with `VITE_`. Needed for portfolio writes + newsletter API. |
| `DEV_API_KEY` | Production, Preview | DEV.to draft publish (`/api/devto/publish`). |
| `VITE_SUPABASE_URL` | Production, Preview | Newsletter signup in the browser. |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview | Newsletter signup in the browser. |
| `VITE_DEV_USERNAME` | Production, Preview | Optional; default `strykerinside`. |

Do **not** set `PORTFOLIO_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with a `VITE_` prefix.

### MCP pointing at production

On your machine (private MCP / Cursor config only):

```env
PORTFOLIO_API_URL=https://strykerinside.vercel.app
PORTFOLIO_API_KEY=<same as Vercel>
```

## Production notes

- After Supabase-backed content changes, the live site picks them up on the next `/api/portfolio` fetch (React Query ~60s stale time) without redeploy.
- Rotate `PORTFOLIO_API_KEY` if it is ever leaked (chat, screenshot, public repo).
