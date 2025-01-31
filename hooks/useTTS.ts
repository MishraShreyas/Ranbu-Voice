"use client";

import { CartesiaClient, WebPlayer } from "@cartesia/cartesia-js";
import { useEffect, useRef, useState } from "react";

export default function useTTS(cartesia: CartesiaClient | null) {
    const websocket = useRef<any | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (cartesia) {
            const initializeWebSocket = async () => {
                if (!websocket.current) {
                    websocket.current = cartesia.tts.websocket({ sampleRate: 44100 });

                    try {
                        await websocket.current.connect();
                    } catch (error) {
                        console.error(`Failed to connect to Cartesia: ${error}`);
                    }
                }
            };

            initializeWebSocket();
        }
    }, [cartesia, websocket]);

    const startPlayer = async (response: any) => {
        const player = new WebPlayer({ bufferDuration: 0.02 });
        setIsPlaying(true);
        await player.play(response.source);
        setIsPlaying(false);
    };

    const speak = async (text: string) => {
        if (!cartesia) {
            console.warn("Cartesia is null, speak is a no-op");
            return;
        }

        const startTime = performance.now();

        try {
            const response = await websocket.current.send({
                modelId: "sonic-english",
                voice: {
                    mode: "id",
                    id: "95d51f79-c397-46f9-b49a-23763d3eaa2d",
                },
                transcript: text,
            });

            let receivedFirst = false;
            for await (const message of response.events("message")) {
                if (!receivedFirst) {
                    const endTime = performance.now();
                    console.log(`[SPEACH]: ${(endTime - startTime).toFixed(2)} ms`);
                    await startPlayer(response);
                    receivedFirst = true;
                }
            }
        } catch (error) {
            console.error(`Error sending message: ${error}`);
        }
    };

    return { speak, isPlaying: cartesia ? isPlaying : false };
}