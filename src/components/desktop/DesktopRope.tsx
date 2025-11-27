import React, { useEffect, useRef } from 'react';
import { useDesktopStore } from '@/store/desktopStore';

interface Point {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    pinned: boolean;
}

interface Stick {
    p1: Point;
    p2: Point;
    length: number;
}

export const DesktopRope = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { settings } = useDesktopStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let animationFrameId: number;

        const logoImg = new Image();
        logoImg.src = '/card.png';

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            // Re-center the pinned point
            if (points.length > 0) {
                points[0].x = width * 0.2;
                points[0].y = -50;        // reduced height (lower anchor)
                points[0].oldX = width * 0.2;
                points[0].oldY = -50;
            }

        };

        // Physics Configuration
        const points: Point[] = [];
        const sticks: Stick[] = [];
        const numPoints = 20;
        // Make it shorter: 15% of screen height
        const ropeLength = height * 0.15;
        const segmentLength = ropeLength / numPoints;
        const gravity = 0.5;
        const friction = 0.98;

        // Initialize Rope
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: width * 0.2,
                y: i * segmentLength,
                oldX: width * 0.2,
                oldY: i * segmentLength,
                pinned: i === 0,
            });
        }

        for (let i = 0; i < points.length - 1; i++) {
            sticks.push({
                p1: points[i],
                p2: points[i + 1],
                length: segmentLength,
            });
        }

        // Mouse State
        let mouseX = 0;
        let mouseY = 0;
        let isMouseDown = false;
        let draggedPoint: Point | null = null;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const handleMouseDown = (e: MouseEvent) => {
            isMouseDown = true;
            // Find nearest point
            let minDist = 60; // Increased grab radius for better UX with image
            let nearest: Point | null = null;

            for (const p of points) {
                if (p.pinned) continue;
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = p;
                }
            }
            draggedPoint = nearest;
        };

        const handleMouseUp = () => {
            isMouseDown = false;
            draggedPoint = null;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        handleResize();

        const updatePoints = () => {
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                if (p.pinned) continue;

                if (p === draggedPoint) {
                    p.x = mouseX;
                    p.y = mouseY;
                    p.oldX = mouseX;
                    p.oldY = mouseY;
                    continue;
                }

                const vx = (p.x - p.oldX) * friction;
                const vy = (p.y - p.oldY) * friction;

                p.oldX = p.x;
                p.oldY = p.y;

                p.x += vx;
                p.y += vy;
                p.y += gravity;

                // Mouse Interaction (Push/Wind)
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 50 && !draggedPoint) {
                    const force = (50 - dist) / 50;
                    const angle = Math.atan2(dy, dx);
                    p.x += Math.cos(angle) * force * 2;
                    p.y += Math.sin(angle) * force * 2;
                }
            }
        };

        const updateSticks = () => {
            for (let iter = 0; iter < 5; iter++) {
                for (const stick of sticks) {
                    const dx = stick.p2.x - stick.p1.x;
                    const dy = stick.p2.y - stick.p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const diff = stick.length - dist;
                    const percent = diff / dist / 2;
                    const offsetX = dx * percent;
                    const offsetY = dy * percent;

                    const stiffness = 0.1;

                    if (!stick.p1.pinned) {
                        stick.p1.x -= offsetX * stiffness;
                        stick.p1.y -= offsetY * stiffness;
                    }
                    if (!stick.p2.pinned) {
                        stick.p2.x += offsetX * stiffness;
                        stick.p2.y += offsetY * stiffness;
                    }

                    if (stick.p1.pinned && !stick.p2.pinned) {
                        stick.p2.x += offsetX * stiffness * 2;
                        stick.p2.y += offsetY * stiffness * 2;
                    }
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }

            // Draw to the last point
            if (points.length > 1) {
                const last = points[points.length - 1];
                const secondLast = points[points.length - 2];
                ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = settings.darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
            ctx.stroke();

            // Draw the logo image at the end
            const endPoint = points[points.length - 1];

            if (logoImg.complete && logoImg.naturalWidth > 0) {
                const size = 240; // Size of the logo
                ctx.save();
                ctx.translate(endPoint.x, endPoint.y);

                // Optional: Rotate image based on the angle of the last stick for more realism
                // const lastStick = sticks[sticks.length - 1];
                // const angle = Math.atan2(lastStick.p2.y - lastStick.p1.y, lastStick.p2.x - lastStick.p1.x);
                // ctx.rotate(angle - Math.PI / 2);

                // Draw image centered
                ctx.drawImage(logoImg, -size / 2, -size / 2, size, size);
                ctx.restore();
            } else {
                // Fallback if image not loaded yet
                ctx.beginPath();
                ctx.arc(endPoint.x, endPoint.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = settings.darkMode ? 'white' : 'black';
                ctx.fill();
            }
        };

        const animate = () => {
            updatePoints();
            updateSticks();
            draw();
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, [settings.darkMode]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-[5] pointer-events-auto"
        />
    );
};
