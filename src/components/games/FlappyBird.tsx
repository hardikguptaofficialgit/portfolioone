import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlappyBirdProps {
    onBack?: () => void;
}

export const FlappyBird = ({ onBack }: FlappyBirdProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game constants
    const GRAVITY = 0.5;
    const JUMP = -8;
    const PIPE_SPEED = 3;
    const PIPE_SPAWN_RATE = 100;

    useEffect(() => {
        const saved = localStorage.getItem('stryker_flappy_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    useEffect(() => {
        if (gameState === 'gameover') {
            const currentHigh = parseInt(localStorage.getItem('stryker_games_highscore') || '0');
            if (score > currentHigh) {
                localStorage.setItem('stryker_games_highscore', score.toString());
            }

            const flappyHigh = parseInt(localStorage.getItem('stryker_flappy_highscore') || '0');
            if (score > flappyHigh) {
                setHighScore(score);
                localStorage.setItem('stryker_flappy_highscore', score.toString());
            }
        }
    }, [gameState, score]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let frames = 0;

        // Game state
        let birdY = canvas.height / 2;
        let birdVelocity = 0;
        let pipes: { x: number; topHeight: number; passed: boolean; gap: number }[] = [];

        const birdSize = 24;
        const birdX = canvas.width / 3; // Position bird at 1/3 of screen

        let currentScore = 0;

        const resetGame = () => {
            birdY = canvas.height / 2;
            birdVelocity = 0;
            pipes = [];
            frames = 0;
            currentScore = 0;
            setScore(0);
        };

        const draw = () => {
            // Clear canvas
            ctx.fillStyle = '#09090b'; // zinc-950
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (gameState === 'playing') {
                // Update physics
                birdVelocity += GRAVITY;
                birdY += birdVelocity;

                // Spawn pipes
                if (frames % PIPE_SPAWN_RATE === 0) {
                    // Dynamic Gap: Gets smaller as score increases
                    const difficultyMultiplier = Math.min(score * 2, 60); // Cap reduction at 60px
                    const currentGap = Math.max(140 - difficultyMultiplier, 90); // Min gap 90px

                    const minPipeHeight = 50;
                    const maxPipeHeight = canvas.height - currentGap - minPipeHeight;
                    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;

                    pipes.push({ x: canvas.width, topHeight, passed: false, gap: currentGap });
                }

                // Update pipes
                pipes.forEach(pipe => {
                    pipe.x -= PIPE_SPEED;
                });

                // Remove off-screen pipes
                if (pipes.length > 0 && pipes[0].x < -60) {
                    pipes.shift();
                }

                // Collision detection
                // Floor/Ceiling
                if (birdY + birdSize > canvas.height || birdY < 0) {
                    setGameState('gameover');
                }

                // Pipes
                pipes.forEach(pipe => {
                    // Check if bird is within pipe's horizontal area
                    if (birdX + birdSize > pipe.x && birdX < pipe.x + 60) { // Pipe width 60
                        // Check vertical collision
                        if (birdY < pipe.topHeight || birdY + birdSize > pipe.topHeight + pipe.gap) {
                            setGameState('gameover');
                        }
                    }

                    // Score update
                    if (!pipe.passed && birdX > pipe.x + 60) {
                        currentScore++;
                        setScore(currentScore);
                        pipe.passed = true;
                    }
                });

                frames++;
            }

            // Draw Pipes
            pipes.forEach(pipe => {
                ctx.fillStyle = '#27272a'; // zinc-800
                // Top pipe
                ctx.fillRect(pipe.x, 0, 60, pipe.topHeight);
                // Bottom pipe
                ctx.fillRect(pipe.x, pipe.topHeight + pipe.gap, 60, canvas.height - (pipe.topHeight + pipe.gap));

                // Pipe Borders (for visibility)
                ctx.strokeStyle = '#52525b'; // zinc-600
                ctx.lineWidth = 2;
                ctx.strokeRect(pipe.x, 0, 60, pipe.topHeight);
                ctx.strokeRect(pipe.x, pipe.topHeight + pipe.gap, 60, canvas.height - (pipe.topHeight + pipe.gap));
            });

            // Draw Bird
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(birdX, birdY, birdSize, birdSize, 4);
            ctx.fill();

            // Draw Eye
            ctx.fillStyle = '#000000';
            ctx.fillRect(birdX + birdSize - 8, birdY + 4, 4, 4);

            // Draw Wing
            ctx.fillStyle = '#e4e4e7'; // zinc-200
            ctx.fillRect(birdX - 2, birdY + 10, 12, 6);

            // Draw Score (Playing)
            if (gameState === 'playing') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.font = 'bold 120px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(currentScore.toString(), canvas.width / 2, canvas.height / 2);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        if (gameState === 'playing') {
            draw();
        } else {
            // Static draw for start/gameover
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Bird static
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(birdX, birdY, birdSize, birdSize, 4);
            ctx.fill();
        }

        const handleJump = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                if (gameState === 'playing') {
                    birdVelocity = JUMP;
                } else if (gameState === 'start' || gameState === 'gameover') {
                    resetGame();
                    setGameState('playing');
                    birdVelocity = JUMP;
                }
            }
        };

        const handleClick = () => {
            if (gameState === 'playing') {
                birdVelocity = JUMP;
            }
        };

        window.addEventListener('keydown', handleJump);
        canvas.addEventListener('mousedown', handleClick);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleJump);
            canvas.removeEventListener('mousedown', handleClick);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameState]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-zinc-950 overflow-hidden">
            <canvas
                ref={canvasRef}
                className="block cursor-pointer outline-none"
            />

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-4 z-10">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="px-4 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold mr-2">High Score</span>
                    <span className="text-white font-mono font-bold">{highScore}</span>
                </div>
            </div>

            {gameState !== 'playing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-20">
                    <h3 className="text-4xl font-black tracking-tighter mb-2 italic">
                        {gameState === 'start' ? 'FLAPPY BIRD' : 'CRASHED!'}
                    </h3>

                    {gameState === 'gameover' && (
                        <div className="flex flex-col items-center mb-8 animate-in zoom-in duration-300">
                            <span className="text-zinc-400 text-sm uppercase tracking-widest">Final Score</span>
                            <span className="text-6xl font-mono font-bold text-white">{score}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => setGameState('playing')}
                            className="group relative px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <div className="flex items-center gap-2">
                                {gameState === 'start' ? <Play size={20} fill="black" /> : <RotateCcw size={20} />}
                                <span>{gameState === 'start' ? 'START FLIGHT' : 'RETRY MISSION'}</span>
                            </div>
                        </button>

                        {onBack && (
                            <button
                                onClick={onBack}
                                className="px-8 py-2 bg-transparent border border-zinc-700 text-zinc-400 rounded-full font-medium hover:bg-zinc-900 hover:text-white transition-colors text-sm"
                            >
                                BACK TO MENU
                            </button>
                        )}
                    </div>

                    <p className="mt-6 text-xs text-zinc-500 font-mono">
                        [SPACE] or [CLICK] to Jump
                    </p>
                </div>
            )}
        </div>
    );
};
