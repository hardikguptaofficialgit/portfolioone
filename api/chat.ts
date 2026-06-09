type ChatRole = 'user' | 'assistant' | 'system';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type JsonObject = Record<string, unknown>;

const SYSTEM_PROMPT = `You are Hardik - an AI persona representing Hardik Gupta.

Identity:
Hardik Gupta
Learner - Builder - Full Stack Developer
Jaipur, Rajasthan, India
strykerinside.vercel.app
hardikgupta8792@gmail.com

Background:
You have founded and built multiple AI-powered products and platforms across education, productivity, and consumer apps.

Experience:
- Building - NuviBrainz, an AI-driven JEE prep ecosystem with revision intelligence, analytics, and generative tools.
- Full Stack Developer - Linkit, an AI-powered link manager that reached 100+ users in 15 days.
- Web Developer - NextRound AI, an interview-prep Chrome extension with summaries and insights.
- Full Stack Developer - AstroNuvi, a RatnAI-powered astrology platform serving 1,200+ users.
- Freelance Developer - Socivo, a London-based marketing agency.
- Senior Technical Executive - FED KIIT.
- Web Developer - GeeksForGeeks KIIT.

Technical expertise:
ReactJS, Tailwind CSS, NodeJS, ExpressJS, Firebase, TypeScript, Git, Docker, Redis, Vercel, Render, PostHog, C, HTML, CSS, JavaScript.

Education:
KIIT University - CSE (AI/ML) - 2024-2028

Speak as Hardik with concise, practical, technically credible answers. If someone asks for direct contact, mention hardikgupta8792@gmail.com.`;

const parseBody = (req: { body?: unknown }): JsonObject => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as JsonObject;
    } catch {
      return {};
    }
  }
  return req.body as JsonObject;
};

const normalizeMessages = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return [];

  const normalized: ChatMessage[] = [];

  for (const message of value) {
    if (!message || typeof message !== 'object') continue;

    const candidate = message as Partial<ChatMessage>;
    if (candidate.role !== 'user' && candidate.role !== 'assistant') continue;
    if (typeof candidate.content !== 'string' || !candidate.content.trim()) continue;

    normalized.push({
      role: candidate.role,
      content: candidate.content.trim().slice(0, 4000),
    });
  }

  return normalized.slice(-12);
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'GitHub Models token is not configured.' });
    return;
  }

  const body = parseBody(req);
  const messages = normalizeMessages(body.messages);
  if (!messages.length) {
    res.status(400).json({ error: 'Send at least one message.' });
    return;
  }

  try {
    const githubRes = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        model: process.env.GITHUB_MODELS_MODEL || 'openai/gpt-4o',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const payload = await githubRes.json().catch(() => ({}));
    if (!githubRes.ok) {
      const message =
        typeof payload?.message === 'string'
          ? payload.message
          : typeof payload?.error?.message === 'string'
            ? payload.error.message
            : 'GitHub Models request failed.';
      res.status(githubRes.status).json({ error: message });
      return;
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      res.status(502).json({ error: 'GitHub Models returned an empty response.' });
      return;
    }

    res.status(200).json({ ok: true, message: content.trim() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Chat request failed.' });
  }
}
