-- Portfolio content store for MCP / API mutations (run in Supabase SQL editor)

create table if not exists public.portfolio_content (
  id text primary key default 'main',
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

-- No public policies: only service role (server API) reads/writes this table.

create index if not exists portfolio_content_updated_at_idx
  on public.portfolio_content (updated_at desc);
