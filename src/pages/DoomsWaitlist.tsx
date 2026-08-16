import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { GradientBackdrop } from '@/components/dooms/GradientBackdrop';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

type FormStatus = 'idle' | 'loading' | 'success' | 'already' | 'error';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function DoomsWaitlist() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  const submitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/dooms/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          website,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Something went wrong.');
      }

      if (payload.alreadyJoined) {
        setStatus('already');
        setMessage(payload.message || 'You are already on the waitlist.');
        return;
      }

      setStatus('success');
      setMessage(payload.message || 'You are on the waitlist.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  const joined = status === 'success' || status === 'already';

  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-neutral-100 antialiased">
      <GradientBackdrop className="-z-10 hidden" /> 
      
      {/* Deep purple gradient background matching the reference image */}
      <div 
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 150% 70% at 50% 120%, #3f198c 0%, #000000 100%)'
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="flex items-center justify-between"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-300 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
       
        </motion.header>

        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE }}
            className="w-full max-w-[460px]"
          >
            {/* Pure black form container */}
            <div className="relative rounded-[26px] border border-white/10 bg-black p-2 shadow-2xl">
              <div className="relative overflow-hidden rounded-[18px] border border-white/5 bg-black p-7 sm:p-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative">
                  <motion.div variants={itemVariants} className="mb-5 flex justify-center">
                    <div className="relative">
                      <img
                        src="/dooms.png"
                        alt="Dooms mascot"
                        className="relative h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10"
                      />
                    </div>
                  </motion.div>

                  <motion.h1
                    variants={itemVariants}
                    className="text-center text-3xl font-semibold tracking-tight text-white sm:text-[2rem]"
                  >
                    Join the Dooms waitlist
                  </motion.h1>
                  <motion.p variants={itemVariants} className="mt-2 text-center text-sm leading-relaxed text-neutral-400">
                  A chat app built around a team of AI agents. Be first in line when we open access.
                  </motion.p>

                  <AnimatePresence mode="wait">
                    {joined ? (
                    <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-8 rounded-2xl border border-white bg-black px-5 py-6 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black">
                      <Check className="h-6 w-6" strokeWidth={2.8} />
                    </div>
                  
                    <p className="text-[16px] font-semibold tracking-[-0.02em] text-white">
                      {message}
                    </p>
                  
                    <p className="mt-2 text-[13px] leading-5 text-white/50">
                      We will email you when your spot opens.
                    </p>
                  </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        variants={itemVariants}
                        onSubmit={submitWaitlist}
                        className="mt-8 space-y-3"
                      >
                        <div className="space-y-2">
                          <label htmlFor="dooms-name" className="sr-only">
                            Name
                          </label>
                          <input
                            id="dooms-name"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Name (optional)"
                            maxLength={80}
                            className="h-11 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3.5 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="dooms-email" className="sr-only">
                            Email
                          </label>
                          <input
                            id="dooms-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@email.com"
                            maxLength={254}
                            className="h-11 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3.5 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/20"
                          />
                        </div>

                        <input
                          tabIndex={-1}
                          autoComplete="off"
                          aria-hidden
                          value={website}
                          onChange={(event) => setWebsite(event.target.value)}
                          className="hidden"
                          name="website"
                        />

                        <button
                          type="submit"
                          disabled={status === 'loading'}
                          className={cn(
                            'mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                            'bg-white text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70',
                          )}
                        >
                          {status === 'loading' ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            'Join waitlist'
                          )}
                        </button>

                        {status === 'error' && message ? (
                          <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-sm text-rose-400"
                          >
                            {message}
                          </motion.p>
                        ) : null}
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <motion.p variants={itemVariants} className="mt-6 text-center text-xs leading-relaxed text-neutral-500">
                  We assure you - no spam :)                 </motion.p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}