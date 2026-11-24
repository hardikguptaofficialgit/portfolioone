import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

const SESSION_KEY = 'portfolio_view_session_v1';

export function VisitorCounter() {
  const [views, setViews] = useState<number | null>(null);
  const isDark = useDesktopStore((state) => state.settings.darkMode);
  const reduceMotion = useReducedMotion();

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
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Portfolio visitors: ${views === null ? 'loading' : views.toLocaleString()}`}
      className={`fixed bottom-5 right-5 z-[100] inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2 shadow-lg backdrop-blur-xl transition-colors duration-300 ${
        isDark
          ? 'border-white/[0.12] bg-zinc-950/75 text-zinc-300 shadow-black/20'
          : 'border-black/[0.09] bg-white/85 text-zinc-600 shadow-black/[0.08]'
      }`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {!reduceMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Eye size={14} strokeWidth={1.8} className="opacity-70" aria-hidden="true" />
      <span className="text-[11px] font-medium tracking-wide">Visitors</span>
      <span className={`min-w-[2ch] text-xs font-semibold tabular-nums ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        {views === null ? '—' : views.toLocaleString()}
      </span>
    </motion.aside>
  );
}
