"use client";

import { useEffect, useRef } from "react";

export default function AudioAnimation({ playing }: { playing: boolean }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const progressRef = useRef<number>(0); // Store progress between rerenders
    const timestampRef = useRef<number>(0); // Store progress between rerenders

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const baseColor = "var(--color-foreground)";
        const playingColors = ["var(--color-destructive)", "#B84735", "#833B2F", "#762417"];
        const animationSpeed = playing ? 5 : 0.5; // Fast for true, slow for false

        const centerCircle = container.querySelector(
            ".center-circle"
        ) as HTMLDivElement;
        const circles = container.querySelectorAll(
            ".oscillating-circle"
        ) as NodeListOf<HTMLDivElement>;

        const animate = (timestamp: number) => {
            if (!timestamp) return;
            const delta = timestamp - timestampRef.current;
            const progress = progressRef.current + (delta * animationSpeed) / 9000;
            progressRef.current = progress;
            timestampRef.current = timestamp;

            // Update center circle color
            if (centerCircle) {
                centerCircle.style.backgroundColor = playing
                    ? playingColors[0]
                    : baseColor;
            }

            // Update oscillating circles border color and animation
            circles.forEach((circle, index) => {
                circle.style.borderColor = playing ? playingColors[index] : baseColor;
                const scale =
                    1 + (0.5 * Math.sin((progress + index * 0.3) * (2 * Math.PI)) + 0.5);
                circle.style.transform = `scale(${scale})`;
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [playing]);

    return (
        <div
            id="audio-animation-container"
            ref={containerRef}
            className="relative w-[min(350px,60vw)] h-[min(350px,60vw)] aspect-square"
        >
            <div
                className="center-circle absolute w-1/2 h-1/2 rounded-full bg-foreground transition-all duration-500 ease-in-out left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="oscillating-circle absolute w-1/2 h-1/2 rounded-full transition-all duration-500 ease-in-out left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-foreground"
                />
            ))}
        </div>
    );
};