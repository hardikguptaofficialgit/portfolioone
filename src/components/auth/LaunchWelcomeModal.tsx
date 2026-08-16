import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

interface LaunchWelcomeModalProps {
  open: boolean;
  onDismiss: () => void;
}

export const LaunchWelcomeModal = ({ open, onDismiss }: LaunchWelcomeModalProps) => {
  const isDark = useDesktopStore((state) => state.settings.darkMode);
  const updateSettings = useDesktopStore((state) => state.updateSettings);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const T = isDark
    ? {
        overlay: 'bg-black/75',
        panel: 'bg-zinc-950 border border-zinc-800/90 shadow-[0_28px_80px_rgba(0,0,0,0.65)]',
        title: 'text-white',
        body: 'text-zinc-400',
        input: 'border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#d0fffe]',
        subscribeBtn: 'bg-zinc-800 text-white hover:bg-zinc-700',
        themeToggle: 'border-zinc-700/80 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800',
        success: 'text-emerald-400',
        info: 'text-zinc-300',
        error: 'text-rose-400',
      }
    : {
        overlay: 'bg-[#dbe7f5]/65',
        panel: 'bg-[#fdfdfb] border border-[#d9dde7] shadow-[0_24px_72px_rgba(60,82,114,0.25)]',
        title: 'text-[#131a23]',
        body: 'text-[#5d6675]',
        input: 'border-[#bfc7d4] text-[#111827] placeholder:text-[#7f8794] focus:border-[#305f9d]',
        subscribeBtn: 'bg-[#1c2a3d] text-white hover:bg-[#24344a]',
        themeToggle: 'border-[#c8d2e2] bg-white/80 text-[#1c2a3d] hover:bg-[#eef3fb]',
        success: 'text-emerald-600',
        info: 'text-[#4b5563]',
        error: 'text-rose-600',
      };

  const subscribeToNewsletter = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error('Enter a valid email address.');
    }

    const response = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(typeof payload?.error === 'string' ? payload.error : 'Subscription failed.');
    }

    return {
      alreadySubscribed: Boolean(payload?.alreadySubscribed),
      message:
        typeof payload?.message === 'string'
          ? payload.message
          : 'Subscribed successfully.',
    };
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      setNewsletterMsg({ text: 'Enter an email address.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await subscribeToNewsletter(newsletterEmail);
      setNewsletterMsg({
        text: result.message,
        type: result.alreadySubscribed ? 'info' : 'success',
      });
      if (!result.alreadySubscribed) {
        setNewsletterEmail('');
      }
    } catch (error) {
      setNewsletterMsg({
        text: error instanceof Error ? error.message : 'Subscription failed.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            Join the Stryker Newsletter
          </h2>

          <p className={`text-sm mt-1 mb-6 max-w-sm ${T.body}`}>
            Subscribe for product updates, engineering notes, and new writing.
          </p>

          <div className="w-full space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="launch-newsletter-email"
                name="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleNewsletterSubscribe();
                  }
                }}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className={`flex-1 px-3 py-2 text-sm bg-transparent border-b focus:outline-none transition ${T.input}`}
              />

              <button
                type="button"
                onClick={() => void handleNewsletterSubscribe()}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium transition disabled:opacity-50 rounded-md ${T.subscribeBtn}`}
              >
                {isSubmitting ? '...' : 'Subscribe'}
              </button>
            </div>

            {newsletterMsg ? (
              <p
                className={`text-xs text-left ${
                  newsletterMsg.type === 'success'
                    ? T.success
                    : newsletterMsg.type === 'info'
                      ? T.info
                      : T.error
                }`}
              >
                {newsletterMsg.text}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className={`mt-6 text-xs transition-colors ${T.body} hover:opacity-80`}
          >
            Continue without subscribing
          </button>
        </div>
      </div>
    </div>
  );
};
