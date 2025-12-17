import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlappyBird } from '@/components/games/FlappyBird';
import { Snake } from '@/components/games/Snake';
import { Gamepad2, Waves, Bird } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GamesApp = () => {
    const [activeGame, setActiveGame] = useState<'menu' | 'flappy' | 'snake'>('menu');

    if (activeGame === 'flappy') {
        return <FlappyBird onBack={() => setActiveGame('menu')} />;
    }

    if (activeGame === 'snake') {
        return <Snake onBack={() => setActiveGame('menu')} />;
    }

    return (
        <div className="h-full bg-zinc-950 p-4 md:p-6 overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 italic">
                        STRYKER ARCADE
                    </h2>
                    <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto">
                        Select a game to start playing. High scores are saved locally.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                    {/* Flappy Bird Card */}
                    <button
                        onClick={() => setActiveGame('flappy')}
                        className="group relative h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-colors"
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-white/10">
                                <Bird className="w-7 h-7 text-black" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Flappy Bird</h3>
                            <p className="text-zinc-500 text-xs">Dynamic difficulty & precision flight</p>
                        </div>
                    </button>

                    {/* Snake Card */}
                    <button
                        onClick={() => setActiveGame('snake')}
                        className="group relative h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-colors"
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-white/10">
                                <Waves className="w-7 h-7 text-black" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Neon Snake</h3>
                            <p className="text-zinc-500 text-xs">Portal walls & poison apples</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
