import { useEffect, useState } from 'react';

type ModeStat = { seconds: number; wpm: number; acc: number };

type StatsPayload = {
  ok: true;
  profileUrl: string;
  modes: ModeStat[];
};

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
        const res = await fetch('/api/monkeytype-stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as StatsPayload;
        if (!cancelled && data.ok && Array.isArray(data.modes)) {
          setModes(data.modes);
        }
      } catch {
        /* ignore - link still works */
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
        href="https://monkeytype.com/profile/stryker_inside"
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
