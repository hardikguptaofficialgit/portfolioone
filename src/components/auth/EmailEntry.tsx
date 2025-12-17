import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';


interface EmailEntryProps {
    onComplete: (email?: string) => void;
}

export const EmailEntry = ({ onComplete }: EmailEntryProps) => {
    const navigate = useNavigate();

    const handleCreativeResume = () => {
        onComplete();
    };

    const handleSimplified = () => {
        navigate('/simplified');
    };



    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCreativeResume();
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
                <div className="w-full p-6 bg-zinc-950 flex flex-col items-center gap-6">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-950 px-2 text-zinc-500">Choose your experience</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <button
                            onClick={handleCreativeResume}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white text-center gap-2 bg-black"
                        >
                            <span className="text-sm font-semibold text-white">
                                View Creative Resume
                            </span>
                            <span className="text-xs text-zinc-400">
                                (Interactive • Time-consuming)
                            </span>
                        </button>


                        <button
                            onClick={handleSimplified}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white text-center gap-2 bg-black"
                        >
                            <span className="text-sm font-semibold text-white">
                                Hire Me
                            </span>
                            <span className="text-xs text-zinc-400">
                                (Simplified • Fast)
                            </span>
                        </button>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};