"use client";

import { useEffect, useRef } from "react";

const GRAY_COLOR = "#30323E";

export default function AudioAnimation({ playing }: { playing: boolean }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const progressRef = useRef<number>(0); // Store progress between rerenders
    const timestampRef = useRef<number>(0); // Store progress between rerenders

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const baseColor = GRAY_COLOR;
        const playingColors = ["#F55036", "#B84735", "#833B2F", "#762417"];
        const animationSpeed = playing ? 5 : 0.5; // Fast for true, slow for false

        const centerCircle = container.querySelector(
            ".center-circle"
        ) as HTMLDivElement;
        const circles = container.querySelectorAll(
            ".oscillating-circle"
        ) as NodeListOf<HTMLDivElement>;

        const animate = (timestamp: number) => {
            if (!timestamp) return;
            let delta = timestamp - timestampRef.current;
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
                circle.style.transform = `translate(-50%, -50%) scale(${scale})`;
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
            style={{
                position: "relative",
                width: `${Math.min(window.innerWidth * 0.6, 350)}px`,
                height: `${Math.min(window.innerWidth * 0.6, 350)}px`,
            }}
        >
            <div
                className="center-circle"
                style={{
                    position: "absolute",
                    width: "50%",
                    height: "50%",
                    borderRadius: "50%",
                    backgroundColor: GRAY_COLOR,
                    transition: "background-color 0.5s ease",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            />
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="oscillating-circle"
                    style={{
                        position: "absolute",
                        width: "50%",
                        height: "50%",
                        borderRadius: "50%",
                        transition: "border-color 0.5s ease",
                        border: `1px solid ${GRAY_COLOR}`,
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                    }}
                />
            ))}
        </div>
    );
};