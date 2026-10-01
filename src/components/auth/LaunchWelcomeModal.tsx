import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

interface LaunchWelcomeModalProps {
  open: boolean;
  onDismiss: () => void;
}

export const LaunchWelcomeModal = ({ open, onDismiss }: LaunchWelcomeModalProps) => {
  const isDark = useDesktopStore((state) => state.settings.darkMode);
  const updateSettings = useDesktopStore((state) => state.updateSettings);

  const T = isDark
    ? {
        overlay: 'bg-black/75',
        panel: 'bg-zinc-950 border border-zinc-800/90 shadow-[0_28px_80px_rgba(0,0,0,0.65)]',
        title: 'text-white',
        body: 'text-zinc-400',
        continueBtn: 'bg-zinc-800 text-white hover:bg-zinc-700',
        themeToggle: 'border-zinc-700/80 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800',
      }
    : {
        overlay: 'bg-[#dbe7f5]/65',
        panel: 'bg-[#fdfdfb] border border-[#d9dde7] shadow-[0_24px_72px_rgba(60,82,114,0.25)]',
        title: 'text-[#131a23]',
        body: 'text-[#5d6675]',
        continueBtn: 'bg-[#1c2a3d] text-white hover:bg-[#24344a]',
        themeToggle: 'border-[#c8d2e2] bg-white/80 text-[#1c2a3d] hover:bg-[#eef3fb]',
      };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onDismiss]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4 ${T.overlay}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-welcome-title"
        className={`relative w-full max-w-[460px] rounded-2xl flex flex-col overflow-hidden ${T.panel}`}
      >
        <button
          type="button"
          onClick={() => updateSettings({ darkMode: !isDark })}
          className={`absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${T.themeToggle}`}
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="px-6 pt-8 pb-8 text-center flex flex-col items-center">
          <img
            src="/harvix_logo.png"
            alt="Stryker"
            className="mb-4 h-12 w-12 rounded-xl object-contain"
            loading="lazy"
          />

          <h2 id="launch-welcome-title" className={`text-lg font-semibold ${T.title}`}>
            Welcome to stryker.inside
          </h2>

          <p className={`text-sm mt-1 mb-6 max-w-sm ${T.body}`}>
            Projects, writing, and the interactive desktop — pick what you want to explore.
          </p>

          <button
            type="button"
            onClick={onDismiss}
            className={`w-full px-4 py-2.5 text-sm font-medium transition rounded-md ${T.continueBtn}`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
