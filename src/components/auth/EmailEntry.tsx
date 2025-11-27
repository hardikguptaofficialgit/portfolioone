import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmailEntryProps {
    onComplete: (email?: string) => void;
}

export const EmailEntry = ({ onComplete }: EmailEntryProps) => {

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
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
            <div className="w-full max-w-[520px] p-1 rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col items-center">

                {/* Iframe Container */}
                <div className="w-full bg-zinc-950 rounded-xl overflow-hidden relative">

                    <div className="dark-iframe-wrapper">
                        <iframe
                            src="https://strykerinside.substack.com/embed"
                            width="100%"
                            height="360"
                            className="dark-iframe"
                            frameBorder="0"
                            scrolling="no"
                            title="Subscribe to Stryker"
                        />
                    </div>
                </div>

                {/* Footer / Skip Area */}
                <div className="w-full p-4 bg-zinc-950 flex flex-col items-center gap-3">
                    <div className="relative w-full">
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
                        className="w-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Skip for now
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};