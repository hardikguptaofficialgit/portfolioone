import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDesktopStore } from '@/store/desktopStore';
import { PixelThemeToggle } from '@/components/portfolio/PixelThemeToggle';
import { transitionPortfolioTheme } from '@/lib/theme-transition';

const WritingHub = () => {
  const { settings, updateSettings } = useDesktopStore();
  const navigate = useNavigate();
  const isDark = settings.darkMode;
  const toggleTheme = () => {
    const nextDark = !isDark;
    void transitionPortfolioTheme(nextDark, () => updateSettings({ darkMode: nextDark }));
  };

  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const divider = isDark ? 'border-white/10' : 'border-black/10';

  return (
    <main className={`min-h-screen px-5 ${isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-[#faf9f6] text-[#1f1a17]'}`}>
      <div className="mx-auto max-w-3xl">
        <header className={`flex h-16 items-center justify-between border-b ${divider}`}>
          <PixelThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </header>

        <section className="pb-10 pt-16 sm:pt-20">
          <button
            type="button"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className={`mb-8 inline-flex items-center gap-2 text-sm font-medium ${muted} transition-opacity hover:opacity-70`}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <p className={`text-xs font-medium uppercase tracking-[0.18em] ${muted}`}>Words & ideas</p>
          <h1 className="mt-3 font-serif-display text-4xl tracking-tight sm:text-5xl">Writing</h1>
          <p className={`mt-4 max-w-lg text-sm leading-7 ${muted}`}>A place for the things I build, the things I learn, and the thoughts I want to put into words.</p>
        </section>

        <section className={`divide-y ${divider}`}>
          <Link to="/blogs" className="group flex items-center justify-between gap-5 py-6 transition-opacity hover:opacity-65">
            <div>
              <h2 className="font-serif-display text-2xl">Blogs</h2>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>Engineering deep dives, lessons from building products, and notes on technology.</p>
            </div>
            <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link to="/writings" className="group flex items-center justify-between gap-5 py-6 transition-opacity hover:opacity-65">
            <div>
              <h2 className="font-serif-display text-2xl">Writings</h2>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>Personal reflections, small stories, observations, and ideas beyond code.</p>
            </div>
            <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        <p className={`mt-8 text-xs ${muted}`}>Written in Markdown, one thought at a time.</p>
      </div>
    </main>
  );
};

export default WritingHub;
