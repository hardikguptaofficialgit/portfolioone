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

                {/* DEV.to Follow Section */}
                <div className="w-full bg-zinc-950 rounded-xl overflow-hidden relative">
                    <div className="p-8 flex flex-col items-center gap-4">
                        {/* DEV.to Logo/Header */}
                        <div className="flex items-center gap-3">
                            <img 
                                src="https://media2.dev.to/dynamic/image/quality=100/https://dev-to-uploads.s3.amazonaws.com/uploads/logos/resized_logo_UQww2soKuUsjaOGNB38o.png" 
                                alt="DEV.to Logo"
                                className="w-16 h-16 object-contain rounded-lg"
                            />
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-bold text-white">Follow on DEV.to</h2>
                                <p className="text-sm text-zinc-400">@strykerinside</p>
                            </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-center text-zinc-400 max-w-md">
                            Get the latest tutorials, guides, and technical insights. Join the community of developers learning together.
                        </p>
                        
                        {/* Follow Button */}
                        <a
                            href="https://dev.to/strykerinside"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Follow on DEV.to
                        </a>
                        
                        {/* Stats */}
                        <div className="flex gap-6 mt-2">
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">Latest</div>
                                <div className="text-xs text-zinc-500">Articles</div>
                            </div>
                            <div className="w-px bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">Tech</div>
                                <div className="text-xs text-zinc-500">Tutorials</div>
                            </div>
                            <div className="w-px bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">Dev</div>
                                <div className="text-xs text-zinc-500">Community</div>
                            </div>
                        </div>
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