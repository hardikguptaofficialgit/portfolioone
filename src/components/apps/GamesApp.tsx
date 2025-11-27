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
        <div className="h-full bg-zinc-950 p-8 flex flex-col items-center justify-center">
            <div className="text-center mb-12">
                <h2 className="text-5xl font-black text-white tracking-tighter mb-4 italic">
                    STRYKER ARCADE
                </h2>
                <p className="text-zinc-400 text-lg max-w-md mx-auto">
                    Select a game to start playing. High scores are saved locally.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Flappy Bird Card */}
                <motion.button

                    onClick={() => setActiveGame('flappy')}
                    className="group relative h-64 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-white/10  transition-transform duration-300">
                            <Bird className="w-10 h-10 text-black" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Flappy Bird</h3>
                        <p className="text-zinc-500 text-sm">Dynamic difficulty & precision flight</p>
                    </div>
                </motion.button>

                {/* Snake Card */}
                <motion.button

                    onClick={() => setActiveGame('snake')}
                    className="group relative h-64 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-white/10  transition-transform duration-300">
                            <Waves className="w-10 h-10 text-black" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Neon Snake</h3>
                        <p className="text-zinc-500 text-sm">Portal walls & poison apples</p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};
