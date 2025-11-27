import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Play } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';

export const GamesWidget = () => {
    const { openWindow } = useDesktopStore();
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        // Load high score from local storage if available
        const saved = localStorage.getItem('stryker_games_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const handleOpenArcade = () => {
        openWindow({
            title: 'Stryker Arcade',
            icon: 'gamepad',
            content: 'games',
            width: 900,
            height: 600,
            x: 100,
            y: 50,
        });
    };

    return (
        <div
            onClick={handleOpenArcade}
            className="group relative w-64 h-32 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:bg-zinc-900/80 transition-all duration-300"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900 via-black to-black" />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="relative h-full p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-white/5 rounded-lg  transition-colors">
                        <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span>{highScore}</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1 group-hover:text-purple-400 transition-colors">
                        Arcade
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400">
                        2 Games Available
                    </div>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-white bg-purple-600 px-3 py-1.5 rounded-full shadow-lg shadow-purple-600/20">
                        <Play size={10} fill="currentColor" />
                        PLAY
                    </div>
                </div>
            </div>
        </div>
    );
};
