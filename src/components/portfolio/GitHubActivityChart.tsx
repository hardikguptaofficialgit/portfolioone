import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

type ContributionsResponse = {
  contributions?: ContributionDay[];
  total?: Record<string, number>;
};

const LEVEL_CLASS_LIGHT = [
  'bg-[#ebedf0]',
  'bg-[#9be9a8]',
  'bg-[#40c463]',
  'bg-[#30a14e]',
  'bg-[#216e39]',
] as const;

const LEVEL_CLASS_DARK = [
  'bg-zinc-900 border border-zinc-800',
  'bg-emerald-950',
  'bg-emerald-800',
  'bg-emerald-600',
  'bg-emerald-400',
] as const;

const WEEKS = 52;

function buildWeekGrid(days: ContributionDay[]) {
  if (!days.length) return [] as ContributionDay[][];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(sorted[0].date);
  const startDow = start.getDay();
  const padded: (ContributionDay | null)[] = Array(startDow).fill(null);
  sorted.forEach((d) => padded.push(d));

  const weeks: (ContributionDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks.slice(-WEEKS);
}

export function GitHubActivityChart({
  username,
  isDark,
  className,
}: {
  username: string;
  isDark: boolean;
  className?: string;
}) {
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
      .then((r) => {
        if (!r.ok) throw new Error('contributions fetch failed');
        return r.json() as Promise<ContributionsResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setDays(data.contributions ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const weeks = useMemo(() => buildWeekGrid(days), [days]);
  const palette = isDark ? LEVEL_CLASS_DARK : LEVEL_CLASS_LIGHT;
  const total = days.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <div
        className={cn(
          'h-[112px] border animate-pulse',
          isDark ? 'border-zinc-800 bg-zinc-950' : 'border-[#d8d3cb] bg-[#f7f4ef]',
          className,
        )}
      />
    );
  }

  if (error || weeks.length === 0) {
    return (
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'block overflow-hidden border',
          isDark ? 'border-zinc-800 bg-zinc-950' : 'border-[#d8d3cb] bg-white',
          className,
        )}
      >
        <img
          src={`https://ghchart.rshah.org/${username}`}
          alt={`${username} GitHub contribution chart`}
          className="w-full h-auto"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <div
      className={cn(
        'border p-4 space-y-3',
        isDark ? 'border-zinc-800 bg-zinc-950' : 'border-[#d8d3cb] bg-white',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-widest">
        <span className={isDark ? 'text-zinc-300' : 'text-[#4f4036]'}>
          Contribution activity
        </span>
        <span className={isDark ? 'text-zinc-500' : 'text-[#9a8a7d]'}>
          {total.toLocaleString()} / year
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className={isDark ? 'text-zinc-500' : 'text-[#6b5c4f]'}>
          Last 52 weeks
        </span>
        <span className={isDark ? 'text-zinc-500' : 'text-[#9a8a7d]'}>Less — More</span>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="inline-flex gap-[3px] min-w-full">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={day ? `${day.count} contributions on ${day.date}` : undefined}
                  className={cn(
                    'h-[11px] w-[11px] shrink-0',
                    day ? palette[Math.min(day.level, 4)] : 'bg-transparent',
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
