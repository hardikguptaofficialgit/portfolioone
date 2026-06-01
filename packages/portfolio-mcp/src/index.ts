#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = (process.env.PORTFOLIO_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const API_KEY = process.env.PORTFOLIO_API_KEY || process.env.MCP_PORTFOLIO_API_KEY || '';

const apiFetch = async (path: string, init: RequestInit = {}) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body?.error === 'string' ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
};

const projectInput = z.object({
  id: z.string().optional(),
  name: z.string(),
  tag: z.string().optional(),
  description: z.string(),
  tech: z.array(z.string()).default([]),
  liveUrl: z.string(),
  githubUrl: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const server = new McpServer({
  name: 'portfolioone',
  version: '1.0.0',
});

server.resource('portfolio-schema', 'portfolio://schema', async () => ({
  contents: [
    {
      uri: 'portfolio://schema',
      mimeType: 'application/json',
      text: JSON.stringify(await apiFetch('/api/portfolio/schema'), null, 2),
    },
  ],
}));

server.resource('portfolio-projects', 'portfolio://projects', async () => {
  const payload = await apiFetch('/api/portfolio/projects');
  return {
    contents: [
      {
        uri: 'portfolio://projects',
        mimeType: 'application/json',
        text: JSON.stringify(payload.data, null, 2),
      },
    ],
  };
});

server.resource('portfolio-full', 'portfolio://full', async () => {
  const payload = await apiFetch('/api/portfolio');
  return {
    contents: [
      {
        uri: 'portfolio://full',
        mimeType: 'application/json',
        text: JSON.stringify(payload.data, null, 2),
      },
    ],
  };
});

server.tool('get_portfolio', 'Read the full portfolio document', {}, async () => {
  const payload = await apiFetch('/api/portfolio');
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
});

server.tool('list_projects', 'List portfolio projects', {}, async () => {
  const payload = await apiFetch('/api/portfolio/projects');
  return { content: [{ type: 'text', text: JSON.stringify(payload.data, null, 2) }] };
});

server.tool(
  'get_project',
  'Get a single project by id/slug',
  { id: z.string().describe('Project slug id') },
  async ({ id }) => {
    const payload = await apiFetch(`/api/portfolio/projects/${encodeURIComponent(id)}`);
    return { content: [{ type: 'text', text: JSON.stringify(payload.data, null, 2) }] };
  }
);

server.tool(
  'create_project',
  'Create or replace a project entry',
  { project: projectInput },
  async ({ project }) => {
    const payload = await apiFetch('/api/portfolio/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }
);

server.tool(
  'update_project',
  'Patch an existing project',
  {
    id: z.string(),
    patch: projectInput.partial(),
  },
  async ({ id, patch }) => {
    const payload = await apiFetch(`/api/portfolio/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }
);

server.tool(
  'delete_project',
  'Archive (default) or hard-delete a project',
  {
    id: z.string(),
    hard: z.boolean().optional(),
  },
  async ({ id, hard }) => {
    const qs = hard ? '?hard=true' : '';
    const payload = await apiFetch(`/api/portfolio/projects/${encodeURIComponent(id)}${qs}`, {
      method: 'DELETE',
    });
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }
);

server.tool(
  'update_skills',
  'Replace skill categories and flat skill list',
  {
    skillCategories: z.array(z.object({ label: z.string(), items: z.array(z.string()) })),
    skillsFlat: z.array(z.string()).optional(),
  },
  async ({ skillCategories, skillsFlat }) => {
    const payload = await apiFetch('/api/portfolio', {
      method: 'PATCH',
      body: JSON.stringify({ patch: { skillCategories, skillsFlat } }),
    });
    return { content: [{ type: 'text', text: JSON.stringify(payload.data, null, 2) }] };
  }
);

server.tool(
  'update_profile',
  'Update profile fields (name, headline, summary, links)',
  {
    profile: z.record(z.unknown()),
  },
  async ({ profile }) => {
    const payload = await apiFetch('/api/portfolio', {
      method: 'PATCH',
      body: JSON.stringify({ patch: { profile } }),
    });
    return { content: [{ type: 'text', text: JSON.stringify(payload.data.profile, null, 2) }] };
  }
);

server.tool(
  'create_blog_draft',
  'Create a DEV.to draft via the portfolio API proxy',
  {
    title: z.string(),
    content: z.string(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
    featuredImage: z.string().optional(),
  },
  async (post) => {
    const payload = await apiFetch('/api/devto/publish', {
      method: 'POST',
      body: JSON.stringify({ posts: [post] }),
    });
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
