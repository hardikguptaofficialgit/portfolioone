import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface EmailEntryProps {
  onComplete: (email?: string) => void;
}

export const EmailEntry = ({ onComplete }: EmailEntryProps) => {
  const navigate = useNavigate();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscribeToNewsletter = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error('Enter a valid email address.');
    }
    const key = 'newsletter_subscribers';
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    if (!existing.includes(normalized)) {
      existing.push(normalized);
      localStorage.setItem(key, JSON.stringify(existing));
    }
    return true;
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      setNewsletterMsg({ text: 'Enter an email address.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await subscribeToNewsletter(newsletterEmail);
      setNewsletterMsg({
        text: 'Subscribed successfully.',
        type: 'success',
      });
      setNewsletterEmail('');
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-[460px] bg-zinc-950 rounded-xl flex flex-col">
        {/* Top */}
        <div className="px-6 pt-8 pb-6 text-center flex flex-col items-center">
          <img
            src="https://media2.dev.to/dynamic/image/quality=100/https://dev-to-uploads.s3.amazonaws.com/uploads/logos/resized_logo_UQww2soKuUsjaOGNB38o.png"
            alt="DEV.to Logo"
            className="w-12 h-12 mb-4"
          />

          <h2 className="text-lg font-semibold text-white">
            Join the Community
          </h2>

          <p className="text-sm text-zinc-500 mt-1 mb-6 max-w-sm">
            Follow on DEV or subscribe for updates and insights.
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
                className="flex-1 px-3 py-2 text-sm bg-transparent border-b border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition"
              />

              <button
                onClick={handleNewsletterSubscribe}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'Subscribe'}
              </button>
            </div>

            {newsletterMsg && (
              <p
                className={`text-xs text-left ${
                  newsletterMsg.type === 'success'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {newsletterMsg.text}
              </p>
            )}

            {/* DEV Button */}
            <a
              href="https://dev.to/strykerinside"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition"
            >
              Follow @strykerinside on DEV
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 py-2">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-600">
            Explore
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Bottom */}
        <div className="px-4 py-4 space-y-1">
          <button
            onClick={() => onComplete()}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-zinc-900 transition group"
          >
            <div className="text-left">
              <div className="text-sm text-white font-medium">
                Interactive Resume
              </div>
              <div className="text-xs text-zinc-500">
                Immersive experience
              </div>
            </div>
            <span className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition">
              →
            </span>
          </button>

          <button
            onClick={() => navigate('/simplified')}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-zinc-900 transition group"
          >
            <div className="text-left">
              <div className="text-sm text-white font-medium">
                Hire Me
              </div>
              <div className="text-xs text-zinc-500">
                Fast and direct
              </div>
            </div>
            <span className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition">
              →
            </span>
          </button>

          <button
            onClick={() => navigate('/blogs')}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-zinc-900 transition group"
          >
            <div className="text-left">
              <div className="text-sm text-white font-medium">
                Explore Blogs
              </div>
              <div className="text-xs text-zinc-500">
                Latest posts
              </div>
            </div>
            <span className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
