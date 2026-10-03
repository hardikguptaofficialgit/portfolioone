import { useEffect, useState } from 'react';

type ModeStat = { seconds: number; wpm: number; acc: number };

const PROFILE_URL = 'https://monkeytype.com/profile/stryker_inside';
const MONKEYTYPE_USER = 'stryker_inside';

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

export function MonkeytypeStats({
  isDark,
  divider,
  mutedText,
  subtleText,
}: {
  isDark: boolean;
  divider: string;
  mutedText: string;
  subtleText: string;
}) {
  const [modes, setModes] = useState<ModeStat[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://api.monkeytype.com/users/${MONKEYTYPE_USER}/profile`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: unknown };
        const picked = pickPersonalBests((json.data ?? {}) as Parameters<typeof pickPersonalBests>[0]);
        if (!cancelled && picked.length) setModes(picked);
      } catch {
        /* CORS or network — link still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const peak = modes?.length ? modes.reduce((best, m) => (m.wpm > best.wpm ? m : best), modes[0]) : null;

  return (
    <div className={`px-4 md:px-6 py-5 border-t ${divider}`}>
      <a
        href={PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group mx-auto flex max-w-md flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-colors sm:flex-row sm:justify-between sm:gap-4 ${
          isDark
            ? 'border-zinc-800/90 bg-zinc-950/40 hover:border-zinc-700'
            : 'border-[#e6d8cb] bg-white/50 hover:border-[#d8c8b9]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}
          >
            Monkeytype
          </span>
          {peak && (
            <span className={`text-[10px] ${subtleText}`}>
              peak{' '}
              <span className={`font-mono text-sm font-semibold tabular-nums ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {peak.wpm}
              </span>{' '}
              wpm
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {modes?.map((m) => (
            <span key={m.seconds} className={`text-[11px] ${mutedText}`}>
              <span className={subtleText}>{m.seconds}s</span>{' '}
              <span className={`font-mono font-semibold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {m.wpm}
              </span>
            </span>
          ))}
          {!modes && (
            <span className={`text-[11px] ${subtleText}`}>stryker_inside</span>
          )}
        </div>
      </a>
    </div>
  );
}
