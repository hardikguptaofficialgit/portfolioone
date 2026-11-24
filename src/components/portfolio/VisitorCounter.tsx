import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

const SESSION_KEY = 'portfolio_view_session_v1';

export function VisitorCounter() {
  const [views, setViews] = useState<number | null>(null);
  const isDark = useDesktopStore((state) => state.settings.darkMode);

  useEffect(() => {
    let cancelled = false;
    const applyCount = (count: number, markSeen: boolean) => {
      if (cancelled || !Number.isFinite(count)) return;
      setViews(count);
      if (markSeen) sessionStorage.setItem(SESSION_KEY, '1');
    };

    const load = async () => {
      const seen = sessionStorage.getItem(SESSION_KEY) === '1';
      try {
        const { isExternalPortfolioViewsEnabled, hitExternalPortfolioViews, peekExternalPortfolioViews } =
          await import('@/lib/portfolio/external-views');
        if (isExternalPortfolioViewsEnabled()) {
          const count = seen ? await peekExternalPortfolioViews() : await hitExternalPortfolioViews();
          if (typeof count === 'number') {
            applyCount(count, !seen);
            return;
          }
        }
      } catch {
        // Use the static metrics file when the hosted counter is unavailable.
      }

      try {
        const response = await fetch('/site-metrics.json', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as { portfolioViews?: number };
        if (typeof payload.portfolioViews === 'number') applyCount(payload.portfolioViews, false);
      } catch {
        // The counter stays in its quiet loading state when metrics are unavailable.
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      aria-label={`Portfolio visitors: ${views === null ? 'loading' : views.toLocaleString()}`}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${
        isDark
          ? 'border-white/10 text-zinc-400'
          : 'border-black/10 text-zinc-500'
      }`}
    >
      <Eye size={14} strokeWidth={1.8} className="opacity-70" aria-hidden="true" />
      <span className="font-medium tracking-wide">Visitors</span>
      <span className={`min-w-[2ch] font-semibold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
        {views === null ? '—' : views.toLocaleString()}
      </span>
    </div>
  );
}
