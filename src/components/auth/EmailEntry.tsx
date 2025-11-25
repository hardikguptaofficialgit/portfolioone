import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EmailEntryProps {
    onComplete: (email?: string) => void;
}

export const EmailEntry = ({ onComplete }: EmailEntryProps) => {
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEmail(val);
        setIsValid(validateEmail(val));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isValid) {
            onComplete(email);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleSkip();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
            <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col gap-6">
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-light tracking-tight text-white">Welcome</h2>
                        <p className="text-zinc-400">Enter your email to continue to the portfolio.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/20 focus:ring-white/20 h-12 text-lg"
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={!isValid}
                            className="w-full h-12 text-lg font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
                        >
                            Continue <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                        Skip for now
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
