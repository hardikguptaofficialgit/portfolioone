import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, ArrowLeft } from 'lucide-react';

interface SnakeProps {
    onBack?: () => void;
}

export const Snake = ({ onBack }: SnakeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game constants
    const GRID_SIZE = 20;
    const SPEED = 80;

    useEffect(() => {
        const saved = localStorage.getItem('stryker_snake_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    useEffect(() => {
        if (gameState === 'gameover') {
            const currentHigh = parseInt(localStorage.getItem('stryker_games_highscore') || '0');
            if (score > currentHigh) {
                localStorage.setItem('stryker_games_highscore', score.toString());
            }

            const snakeHigh = parseInt(localStorage.getItem('stryker_snake_highscore') || '0');
            if (score > snakeHigh) {
                setHighScore(score);
                localStorage.setItem('stryker_snake_highscore', score.toString());
            }
        }
    }, [gameState, score]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Calculate grid dimensions based on container size
        const resizeCanvas = () => {
            // Snap to grid size
            const width = Math.floor(container.clientWidth / GRID_SIZE) * GRID_SIZE;
            const height = Math.floor(container.clientHeight / GRID_SIZE) * GRID_SIZE;
            canvas.width = width;
            canvas.height = height;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let gameLoop: NodeJS.Timeout;
        const tileCountX = canvas.width / GRID_SIZE;
        const tileCountY = canvas.height / GRID_SIZE;

        // Game state
        let snake = [{ x: 10, y: 10 }];
        let velocity = { x: 0, y: 0 };
        let food = { x: 15, y: 15, type: 'normal' }; // normal, poison
        let particles: { x: number, y: number, life: number, color: string }[] = [];

        const resetGame = () => {
            snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
            velocity = { x: 0, y: 0 };
            spawnFood();
            setScore(0);
            particles = [];
        };

        const spawnFood = () => {
            // 20% chance of poison apple
            const isPoison = Math.random() < 0.2;

            food = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY),
                type: isPoison ? 'poison' : 'normal'
            };

            // Prevent spawning on snake
            for (const part of snake) {
                if (part.x === food.x && part.y === food.y) {
                    spawnFood();
                    break;
                }
            }
        };

        const update = () => {
            if (velocity.x === 0 && velocity.y === 0) return;

            let headX = snake[0].x + velocity.x;
            let headY = snake[0].y + velocity.y;

            // Portal Walls (Wrap around)
            if (headX < 0) headX = tileCountX - 1;
            if (headX >= tileCountX) headX = 0;
            if (headY < 0) headY = tileCountY - 1;
            if (headY >= tileCountY) headY = 0;

            const head = { x: headX, y: headY };

            // Self collision
            for (const part of snake) {
                if (head.x === part.x && head.y === part.y) {
                    setGameState('gameover');
                    return;
                }
            }

            snake.unshift(head);

            // Eat food
            if (head.x === food.x && head.y === food.y) {
                if (food.type === 'poison') {
                    setScore(prev => Math.max(0, prev - 5));
                    // Shrink snake
                    if (snake.length > 1) snake.pop();
                    if (snake.length > 1) snake.pop();
                    // Create red particles
                    for (let i = 0; i < 5; i++) particles.push({ x: head.x * GRID_SIZE, y: head.y * GRID_SIZE, life: 10, color: '#ef4444' });
                } else {
                    setScore(prev => prev + 1);
                    // Create white particles
                    for (let i = 0; i < 5; i++) particles.push({ x: head.x * GRID_SIZE, y: head.y * GRID_SIZE, life: 10, color: '#ffffff' });
                }
                spawnFood();
            } else {
                snake.pop();
            }
        };

        const draw = () => {
            // Clear
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid (Subtle)
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 1;
            for (let i = 0; i < tileCountX; i++) {
                ctx.beginPath();
                ctx.moveTo(i * GRID_SIZE, 0);
                ctx.lineTo(i * GRID_SIZE, canvas.height);
                ctx.stroke();
            }
            for (let j = 0; j < tileCountY; j++) {
                ctx.beginPath();
                ctx.moveTo(0, j * GRID_SIZE);
                ctx.lineTo(canvas.width, j * GRID_SIZE);
                ctx.stroke();
            }

            // Draw Snake
            snake.forEach((part, index) => {
                ctx.fillStyle = index === 0 ? '#ffffff' : '#a1a1aa'; // Head white, body gray
                ctx.fillRect(part.x * GRID_SIZE + 1, part.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);

                if (index === 0) {
                    // Eyes
                    ctx.fillStyle = '#000000';
                    // Simple logic to place eyes based on direction could go here, but keeping simple
                    ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 4, 4, 4);
                    ctx.fillRect(part.x * GRID_SIZE + 12, part.y * GRID_SIZE + 4, 4, 4);
                }
            });

            // Draw Food
            ctx.fillStyle = food.type === 'poison' ? '#ef4444' : '#ffffff';
            ctx.shadowColor = food.type === 'poison' ? '#ef4444' : '#ffffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(
                food.x * GRID_SIZE + GRID_SIZE / 2,
                food.y * GRID_SIZE + GRID_SIZE / 2,
                GRID_SIZE / 2 - 4,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Particles
            particles.forEach((p, i) => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 10;
                ctx.fillRect(p.x + Math.random() * 20 - 10, p.y + Math.random() * 20 - 10, 4, 4);
                p.life--;
                if (p.life <= 0) particles.splice(i, 1);
            });
            ctx.globalAlpha = 1;
        };

        const loop = () => {
            if (gameState === 'playing') {
                update();
                draw();
            }
        };

        if (gameState === 'playing') {
            gameLoop = setInterval(loop, SPEED);
        } else {
            draw();
        }

        const handleKey = (e: KeyboardEvent) => {
            // Prevent default scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'ArrowUp':
                    if (velocity.y !== 1) velocity = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                    if (velocity.y !== -1) velocity = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                    if (velocity.x !== 1) velocity = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                    if (velocity.x !== -1) velocity = { x: 1, y: 0 };
                    break;
            }

            if (gameState === 'playing' && velocity.x === 0 && velocity.y === 0) {
                // First move starts the snake
            }
        };

        window.addEventListener('keydown', handleKey);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleKey);
            clearInterval(gameLoop);
        };
    }, [gameState]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-zinc-950 overflow-hidden outline-none" tabIndex={0}>
            <canvas
                ref={canvasRef}
                className="block"
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
                        {gameState === 'start' ? 'NEON SNAKE' : 'GAME OVER'}
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
                                <span>{gameState === 'start' ? 'START GAME' : 'TRY AGAIN'}</span>
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

                    <div className="mt-6 flex flex-col items-center gap-2 text-xs text-zinc-500 font-mono">
                        <p>Use [ARROWS] to Move</p>
                        <p className="text-red-400">Avoid Red Poison Apples (-5 Score)</p>
                        <p className="text-blue-400">Walls are Portals</p>
                    </div>
                </div>
            )}
        </div>
    );
};
