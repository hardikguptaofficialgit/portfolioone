import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

interface EmailEntryProps {
  onComplete: (email?: string) => void;
}

export const EmailEntry = ({ onComplete }: EmailEntryProps) => {
  const navigate = useNavigate();
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
        followBtn: 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800',
        divider: 'bg-zinc-800',
        dividerText: 'text-zinc-600',
        itemTitle: 'text-white',
        itemBody: 'text-zinc-500',
        itemArrow: 'text-zinc-500 group-hover:text-white',
        itemHover: 'hover:bg-zinc-900/80',
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
        followBtn: 'bg-[#eef3fb] text-[#1c2a3d] hover:bg-[#e3ebf8] border border-[#d4deec]',
        divider: 'bg-[#dfe5ef]',
        dividerText: 'text-[#7f8794]',
        itemTitle: 'text-[#131a23]',
        itemBody: 'text-[#6c7686]',
        itemArrow: 'text-[#6c7686] group-hover:text-[#1a2f4d]',
        itemHover: 'hover:bg-[#f3f6fc]',
        themeToggle: 'border-[#c8d2e2] bg-white/80 text-[#1c2a3d] hover:bg-[#eef3fb]',
        success: 'text-emerald-600',
        info: 'text-[#4b5563]',
        error: 'text-rose-600',
      };

  const handleThemeToggle = () => {
    updateSettings({ darkMode: !isDark });
  };

  const subscribeToNewsletter = async (email: string): Promise<{ alreadySubscribed: boolean; message: string }> => {
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
      throw new Error(
        typeof payload?.error === 'string'
          ? payload.error
          : 'Subscription failed.'
      );
    }
    return {
      alreadySubscribed: Boolean(payload?.alreadySubscribed),
      message: (() => {
        const base =
          typeof payload?.message === 'string'
            ? payload.message
            : 'Subscribed successfully.';
        if (payload?.welcomeEmailSent === false) {
          return `${base} Welcome email may be delayed.`;
        }
        return base;
      })(),
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
      const message =
        error instanceof Error
          ? error.message
          : 'Subscription failed.';
      setNewsletterMsg({ text: message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center backdrop-blur-sm p-4 ${T.overlay}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-cyan-400/14' : 'bg-sky-400/20'}`}
          animate={{ x: [0, 28, -10, 0], y: [0, 22, -12, 0], scale: [1, 1.08, 0.97, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -bottom-24 -right-20 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-fuchsia-400/10' : 'bg-indigo-400/14'}`}
          animate={{ x: [0, -30, 12, 0], y: [0, -20, 10, 0], scale: [1, 0.95, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: isDark
              ? 'repeating-linear-gradient(120deg, rgba(208,255,254,0.08) 0px, rgba(208,255,254,0.08) 1px, transparent 1px, transparent 14px)'
              : 'repeating-linear-gradient(120deg, rgba(48,95,157,0.13) 0px, rgba(48,95,157,0.13) 1px, transparent 1px, transparent 16px)',
          }}
          animate={{ backgroundPositionX: ['0px', '220px'] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className={`relative w-full max-w-[460px] rounded-2xl flex flex-col overflow-hidden ${T.panel}`}>
        <button
          type="button"
          onClick={handleThemeToggle}
          className={`absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${T.themeToggle}`}
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Top */}
        <div className="px-6 pt-8 pb-6 text-center flex flex-col items-center">
          <img
            src="/harvix_logo.png"
            alt="Stryker"
            className="mb-4 h-12 w-12 rounded-xl object-contain"
            loading="lazy"
          />

          <h2 className={`text-lg font-semibold ${T.title}`}>
            Join the Stryker Newsletter
          </h2>

          <p className={`text-sm mt-1 mb-6 max-w-sm ${T.body}`}>
            Subscribe for product updates, engineering notes, and new writing.
          </p>

          {/* Input + Button */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={newsletterEmail}
                onChange={(e) =>
                  setNewsletterEmail(e.target.value)
                }
                type="email"
                placeholder="name@example.com"
                className={`flex-1 px-3 py-2 text-sm bg-transparent border-b focus:outline-none transition ${T.input}`}
              />

              <button
                onClick={handleNewsletterSubscribe}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium transition disabled:opacity-50 rounded-md ${T.subscribeBtn}`}
              >
                {isSubmitting ? '...' : 'Subscribe'}
              </button>
            </div>

            {newsletterMsg && (
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
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 py-2">
          <div className={`h-px flex-1 ${T.divider}`} />
          <span className={`text-[10px] uppercase tracking-wider ${T.dividerText}`}>
            Explore
          </span>
          <div className={`h-px flex-1 ${T.divider}`} />
        </div>

        {/* Bottom */}
        <div className="px-4 py-4 space-y-1">
          <button
            onClick={() => onComplete()}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition group ${T.itemHover}`}
          >
            <div className="text-left">
              <div className={`text-sm font-medium ${T.itemTitle}`}>
                Interactive Resume
              </div>
              <div className={`text-xs ${T.itemBody}`}>
                Immersive experience
              </div>
            </div>
            <span className={`${T.itemArrow} group-hover:translate-x-1 transition`}>
              →
            </span>
          </button>

          <button
            onClick={() => navigate('/simplified')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition group ${T.itemHover}`}
          >
            <div className="text-left">
              <div className={`text-sm font-medium ${T.itemTitle}`}>
                Hire Me
              </div>
              <div className={`text-xs ${T.itemBody}`}>
                Fast and direct
              </div>
            </div>
            <span className={`${T.itemArrow} group-hover:translate-x-1 transition`}>
              →
            </span>
          </button>

          <button
            onClick={() => navigate('/blogs')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition group ${T.itemHover}`}
          >
            <div className="text-left">
              <div className={`text-sm font-medium ${T.itemTitle}`}>
                Explore Blogs
              </div>
              <div className={`text-xs ${T.itemBody}`}>
                Latest posts
              </div>
            </div>
            <span className={`${T.itemArrow} group-hover:translate-x-1 transition`}>
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
