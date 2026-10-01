import { useEffect, useMemo, useState } from 'react';
import { githubSnakeSrc } from '@/lib/github-snake';
import { cn } from '@/lib/utils';

type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

type ContributionsResponse = {
  contributions?: ContributionDay[];
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
  if (!days.length) return [] as (ContributionDay | null)[][];

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

function computeLongestStreak(days: ContributionDay[]) {
  const activeDates = [...new Set(days.filter((d) => d.count > 0).map((d) => d.date))].sort();
  if (!activeDates.length) return 0;

  let longest = 1;
  let run = 1;

  for (let i = 1; i < activeDates.length; i += 1) {
    const prev = new Date(activeDates[i - 1]);
    const curr = new Date(activeDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (diffDays > 1) {
      run = 1;
    }
  }

  return longest;
}

function StatCard({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-sm border px-4 py-3.5 min-w-0',
        isDark ? 'border-zinc-800 bg-black/40' : 'border-[#e6d8cb] bg-white/80',
      )}
    >
      <p className={cn('text-[10px] font-semibold uppercase tracking-[0.16em]', isDark ? 'text-zinc-500' : 'text-[#9a8a7d]')}>
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight',
          isDark ? 'text-zinc-100' : 'text-[#1f1a17]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function GitHubActivityChart({
  username,
  isDark,
  className,
  repoCount,
  totalStars,
}: {
  username: string;
  isDark: boolean;
  className?: string;
  repoCount?: number;
  totalStars?: number;
}) {
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [contribError, setContribError] = useState(false);
  const [contribLoading, setContribLoading] = useState(true);
  const [followers, setFollowers] = useState<number | null>(null);
  const [publicRepos, setPublicRepos] = useState<number | null>(null);
  const [snakeState, setSnakeState] = useState<'checking' | 'ready' | 'missing'>('checking');

  const snakeSrc = githubSnakeSrc(isDark);
  const profileUrl = `https://github.com/${username}`;

  useEffect(() => {
    let cancelled = false;
    setSnakeState('checking');
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSnakeState('ready');
    };
    img.onerror = () => {
      if (!cancelled) setSnakeState('missing');
    };
    img.src = snakeSrc;
    return () => {
      cancelled = true;
    };
  }, [snakeSrc]);

  useEffect(() => {
    let cancelled = false;
    setContribLoading(true);
    setContribError(false);

    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
      .then((r) => {
        if (!r.ok) throw new Error('contributions fetch failed');
        return r.json() as Promise<ContributionsResponse>;
      })
      .then((data) => {
        if (!cancelled) setDays(data.contributions ?? []);
      })
      .catch(() => {
        if (!cancelled) setContribError(true);
      })
      .finally(() => {
        if (!cancelled) setContribLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`)
      .then((r) => {
        if (!r.ok) throw new Error('user fetch failed');
        return r.json() as Promise<{ public_repos?: number; followers?: number }>;
      })
      .then((user) => {
        if (cancelled) return;
        if (repoCount == null) setPublicRepos(user.public_repos ?? null);
        setFollowers(user.followers ?? null);
      })
      .catch(() => {
        /* optional */
      });

    return () => {
      cancelled = true;
    };
  }, [username, repoCount]);

  const weeks = useMemo(() => buildWeekGrid(days), [days]);
  const palette = isDark ? LEVEL_CLASS_DARK : LEVEL_CLASS_LIGHT;
  const totalContributions = days.reduce((sum, d) => sum + d.count, 0);
  const longestStreak = useMemo(() => computeLongestStreak(days), [days]);

  const reposDisplay = repoCount ?? publicRepos;
  const starsDisplay = totalStars;
  const shellClass = cn(
    'border rounded-sm overflow-hidden',
    isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-[#d8c8b9] bg-white/90',
    className,
  );

  const loading = contribLoading && snakeState === 'checking';

  if (loading) {
    return <div className={cn(shellClass, 'h-[280px] animate-pulse', isDark ? 'bg-zinc-950' : 'bg-[#f7f4ef]')} />;
  }

  return (
    <div className={cn(shellClass, 'p-4 sm:p-5 space-y-5')}>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Public repos"
          value={reposDisplay == null ? '-' : reposDisplay.toLocaleString()}
          isDark={isDark}
        />
        <StatCard
          label="Total stars"
          value={starsDisplay == null ? '-' : starsDisplay.toLocaleString()}
          isDark={isDark}
        />
        <StatCard
          label="Contributions"
          value={contribError ? '-' : totalContributions.toLocaleString()}
          isDark={isDark}
        />
      </div>

      <p className={cn('text-[11px] uppercase tracking-widest', isDark ? 'text-zinc-500' : 'text-[#9a8a7d]')}>
        {followers != null ? `${followers.toLocaleString()} followers · ` : ''}
        longest streak {contribError ? '-' : `${longestStreak} days`}
      </p>

      <div className={cn('space-y-3 border-t pt-4', isDark ? 'border-zinc-800' : 'border-[#e6d8cb]')}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-widest', isDark ? 'text-zinc-300' : 'text-[#4f4036]')}>
              Contribution activity
            </p>
            <p className={cn('mt-1 text-[11px]', isDark ? 'text-zinc-500' : 'text-[#6b5c4f]')}>
              Last 52 weeks on GitHub
            </p>
          </div>
          <p className={cn('text-sm font-mono font-semibold tabular-nums', isDark ? 'text-emerald-400/90' : 'text-[#216e39]')}>
            {contribError ? '-' : `${totalContributions.toLocaleString()} total`}
          </p>
        </div>

        {contribError || weeks.length === 0 ? (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={`https://ghchart.rshah.org/${username}`}
              alt={`${username} GitHub contribution chart`}
              className="w-full h-auto rounded-sm"
              loading="lazy"
            />
          </a>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className={isDark ? 'text-zinc-500' : 'text-[#6b5c4f]'}>Less</span>
              <span className={isDark ? 'text-zinc-500' : 'text-[#9a8a7d]'}>More</span>
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
                          'h-[11px] w-[11px] shrink-0 rounded-[2px]',
                          day ? palette[Math.min(day.level, 4)] : 'bg-transparent',
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {snakeState === 'ready' && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'block border-t pt-4 transition-opacity hover:opacity-95',
            isDark ? 'border-zinc-800' : 'border-[#e6d8cb]',
          )}
        >
          <p className={cn('mb-3 text-xs uppercase tracking-widest', isDark ? 'text-zinc-400' : 'text-[#6b5c4f]')}>
            Contribution snake
          </p>
          <img
            src={snakeSrc}
            alt={`${username} GitHub contribution snake`}
            className="w-full h-auto rounded-sm"
            loading="lazy"
            decoding="async"
          />
        </a>
      )}
    </div>
  );
}
