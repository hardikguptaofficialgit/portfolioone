import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

const WELCOME_LINE_1 = "Hey - I'm Hardik (aka Stryker).";
const WELCOME_LINE_2 = 'Welcome to my corner of the internet.';
const WELCOME_MESSAGE = `${WELCOME_LINE_1}\n${WELCOME_LINE_2}`;

function useTypewriter(text: string, active: boolean, msPerChar = 32) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, active, msPerChar]);

  const done = count >= text.length;
  return { visible: text.slice(0, count), done };
}

interface LaunchWelcomeModalProps {
  open: boolean;
  onDismiss: () => void;
}

export const LaunchWelcomeModal = ({ open, onDismiss }: LaunchWelcomeModalProps) => {
  const isDark = useDesktopStore((state) => state.settings.darkMode);
  const updateSettings = useDesktopStore((state) => state.updateSettings);
  const { visible, done } = useTypewriter(WELCOME_MESSAGE, open);
  const newlineAt = visible.indexOf('\n');
  const line1 = newlineAt === -1 ? visible : visible.slice(0, newlineAt);
  const line2 = newlineAt === -1 ? '' : visible.slice(newlineAt + 1);
  const onLine2 = newlineAt !== -1;

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
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4 sm:p-6 ${T.overlay}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-welcome-title"
        className={`relative w-full max-w-[min(100%,28rem)] sm:max-w-md rounded-2xl flex flex-col overflow-hidden ${T.panel}`}
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

        <div className="px-5 sm:px-6 pt-8 pb-8 text-center flex flex-col items-center w-full">
          <img
            src="/harvix_logo.png"
            alt="Stryker"
            className="mb-5 h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain shrink-0"
            loading="lazy"
          />

          <h2 id="launch-welcome-title" className="sr-only">
            {WELCOME_MESSAGE}
          </h2>

          <div
            className="text-[0.9375rem] sm:text-base leading-snug sm:leading-relaxed w-full min-h-[5.25rem] sm:min-h-[5.75rem] mb-6 px-0.5 flex flex-col gap-2 sm:gap-2.5"
            aria-live="polite"
          >
            <p className={`font-semibold text-pretty m-0 ${T.title}`}>
              <span>{line1}</span>
              {!onLine2 && (
                <span
                  className={`inline-block w-[2px] h-[1em] align-[-0.12em] ml-0.5 ${isDark ? 'bg-zinc-300' : 'bg-[#1c2a3d]'} ${done ? 'opacity-0' : 'animate-pulse'}`}
                  aria-hidden
                />
              )}
            </p>
            <p className={`font-medium text-pretty m-0 min-h-[1.35em] ${T.body}`}>
              <span>{line2}</span>
              {onLine2 && (
                <span
                  className={`inline-block w-[2px] h-[1em] align-[-0.12em] ml-0.5 ${isDark ? 'bg-zinc-400' : 'bg-[#5d6675]'} ${done ? 'opacity-0' : 'animate-pulse'}`}
                  aria-hidden
                />
              )}
            </p>
          </div>

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
