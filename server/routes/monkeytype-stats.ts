const MONKEYTYPE_USER = 'stryker_inside';
const PROFILE_URL = `https://monkeytype.com/profile/${MONKEYTYPE_USER}`;
const CACHE_MS = 5 * 60 * 1000;

type ModeStat = { seconds: number; wpm: number; acc: number };

let cache: { at: number; payload: { ok: true; profileUrl: string; modes: ModeStat[] } } | null = null;

function pickPersonalBests(data: {
  personalBests?: { time?: Record<string, { wpm?: number; acc?: number }[]> };
}) {
  const time = data.personalBests?.time ?? {};
  const modes: ModeStat[] = [];

  for (const key of ['15', '30', '60', '120']) {
    const entry = time[key]?.[0];
    if (!entry || typeof entry.wpm !== 'number') continue;
    modes.push({
      seconds: Number(key),
      wpm: Math.round(entry.wpm),
      acc: typeof entry.acc === 'number' ? Math.round(entry.acc) : 0,
    });
  }

  return modes;
}

export default async function handler(req: { method?: string }, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    if (cache && Date.now() - cache.at < CACHE_MS) {
      res.status(200).json(cache.payload);
      return;
    }

    const response = await fetch(`https://api.monkeytype.com/users/${MONKEYTYPE_USER}/profile`);
    if (!response.ok) {
      res.status(502).json({ error: 'Monkeytype profile unavailable.' });
      return;
    }

    const json = (await response.json()) as { data?: unknown };
    const modes = pickPersonalBests((json.data ?? {}) as Parameters<typeof pickPersonalBests>[0]);
    const payload = { ok: true as const, profileUrl: PROFILE_URL, modes };
    cache = { at: Date.now(), payload };

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Monkeytype stats request failed.',
    });
  }
}
