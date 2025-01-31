"use client";

import Groq from "groq-sdk";
import { CartesiaClient } from "@cartesia/cartesia-js";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import useTTS from "@/hooks/useTTS";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import { streamCompletion } from "@/lib/groq";
import AudioAnimation from "@/components/AudioAnimation";

const GROQ_ORANGE = "#F55036";
const GRAY_COLOR = "#30323E";

function App({
    cartesiaApiKey,
    groqApiKey,
}: {
    cartesiaApiKey: string;
    groqApiKey: string;
}) {
    const cartesia = cartesiaApiKey
        ? new CartesiaClient({
            apiKey: cartesiaApiKey,
        })
        : null;

    const groq = new Groq({
        apiKey: groqApiKey,
        dangerouslyAllowBrowser: true,
    });

    const historyRef = useRef<Groq.Chat.ChatCompletionMessageParam[]>([]);
    const [historyLastUpdate, setHistoryLastUpdate] = useState(new Date());
    const { speak, isPlaying } = useTTS(cartesia);

    const { isRecording, startRecording, stopRecording, volume } =
        useAudioRecorder({
            onTranscribe: async (transcription: string) => {
                historyRef.current = [
                    ...historyRef.current,
                    { role: "user", content: transcription },
                ];

                await triggerCompletionFlow();
            },
            onRecordingStart: () => {
                historyRef.current = [...historyRef.current];
            },
            onRecordingEnd: () => {
                // No additional actions needed for now
            },
            groq,
        });

    const [isShowingMessages, setIsShowingMessages] = useState(cartesia === null);

    const handleClick = () => {
        setIsShowingMessages(!isShowingMessages);
    };

    const handleMicrophonePress = () => {
        startRecording();
    };

    const handleMicrophoneRelease = useCallback(() => {
        stopRecording();
    }, [stopRecording]);

    const triggerCompletionFlow = async () => {

        const { contentBuffer: response, toolCalls } = await streamCompletion(
            historyRef.current,
            groq
        );
        setHistoryLastUpdate(new Date());

        // In the completion flow we also handle 
        // calling the generated toolCalls in case there are any, which can recursively
        // call triggerCompletionFlow in case
        // more toolCalls are generated.
        // if (toolCalls.length > 0) {
        //   await handleToolCalls(toolCalls);
        // }

        if (response.length > 0) {
            setHistoryLastUpdate(new Date());
            historyRef.current = [
                ...historyRef.current,
                { role: "assistant", content: response },
            ];
            await speak(response);
        }
    };

    // trigger handleMicrophoneRelease when the focus is lost
    useEffect(() => {
        const handleFocusLoss = () => {
            handleMicrophoneRelease();
        };
        window.addEventListener("focus", handleFocusLoss);
        return () => window.removeEventListener("focus", handleFocusLoss);
    }, [handleMicrophoneRelease]);

    // Scroll to bottom when history changes
    useEffect(() => {
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        const observer = new MutationObserver(() => {
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
        if (chatContainer) {
            observer.observe(chatContainer, { childList: true, subtree: true });
        }

        return () => observer.disconnect();
    }, []);

    //   const handleToolCalls = async (
    //     toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]
    //   ) => {
    //     // Assumed only called with toolCalls > 0
    //     if (toolCalls.length == 0) {
    //       throw new Error("only call handleToolCalls with toolCalls > 0");
    //     }

    //     historyRef.current = [
    //       ...historyRef.current,
    //       { role: "assistant", tool_calls: toolCalls },
    //     ];

    //     for (const toolCall of toolCalls) {
    //       const { function: toolFunction } = toolCall;
    //       if (toolFunction && toolHandlers[toolFunction.name]) {
    //         const toolResponse = await toolHandlers[toolFunction.name](
    //           JSON.parse(toolFunction.arguments)
    //         );

    //         historyRef.current = [
    //           ...historyRef.current,
    //           { role: "tool", content: toolResponse, tool_call_id: toolCall.id },
    //         ];
    //       }
    //     }
    //     await triggerCompletionFlow();
    //   };

    return (
        <div className="flex h-full flex-col">
            <div className="p-4">
                <Image width={80} height={40} src="groq.svg" alt="groq" />
            </div>
            {!isShowingMessages && (
                <div className="flex justify-center items-center h-full absolute top-0 left-0 w-full">
                    <AudioAnimation playing={isPlaying} />
                </div>
            )}
            <div id="chat-container" className="p-2 flex-grow overflow-x-auto">
                <div
                    className="fixed bottom-4 left-4 p-2 rounded-full cursor-pointer select-none"
                    style={{
                        backgroundColor: isShowingMessages ? GROQ_ORANGE : GRAY_COLOR,
                    }}
                    onClick={handleClick}
                >
                    <Image
                        src={
                            isShowingMessages ? "chat-bubble-white.svg" : "chat-bubble.svg"
                        }
                        alt="chat bubble"
                        width={20}
                        height={20}
                    />
                </div>
                <div className="fixed bottom-4 right-4 select-none cursor-pointer">
                    <div
                        id="microphone-button"
                        className={`p-6 rounded-full ${isRecording ? "recording-animation" : ""
                            }`}
                        style={{
                            backgroundColor: isRecording ? GROQ_ORANGE : GRAY_COLOR,
                            transition: "transform 0.05s ease",
                            transform: `scale(${1 + volume / 100 + (isRecording ? 0.1 : 0)})`,
                            boxShadow: isRecording
                                ? "0 0 39px 37px rgba(245, 80, 54, 0.7)"
                                : "none",
                        }}
                        onMouseDown={handleMicrophonePress}
                        onMouseUp={handleMicrophoneRelease}
                        onTouchStart={handleMicrophonePress}
                        onTouchEnd={handleMicrophoneRelease}
                    >
                        <div
                            style={{
                                transform: `scale(${1 / (1 + volume / 100)})`,
                            }}
                        >
                            <Image
                                src={isRecording ? "microphone-white.svg" : "microphone.svg"}
                                className="pointer-events-none"
                                alt="microphone"
                                width={30}
                                height={30}
                            />
                        </div>
                    </div>
                </div>

                {isShowingMessages && (
                    <>
                        <div className="flex flex-col pb-24">
                            {historyRef.current.slice().map((message: any, index) => (
                                <div
                                    key={index}
                                    className={`p-2 mb-4 rounded-lg ${message.role === "user"
                                        ? "message-user self-end"
                                        : "message-assistant self-start"
                                        }`}
                                >
                                    {message.role === "tool" ? (
                                        <pre>
                                            {JSON.stringify(JSON.parse(message.content), null, 2)}
                                        </pre>
                                    ) : message.role === "assistant" && message.tool_calls ? (
                                        <pre>{JSON.stringify(message.tool_calls, null, 2)}</pre>
                                    ) : (
                                        message.content
                                    )}
                                    {index === historyRef.current.length - 1 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {historyLastUpdate.toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {historyRef.current.length == 0 && (
                            <div className="flex justify-center items-center">
                                <p>Start a conversation by asking a question.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function Home() {
    useEffect(() => {
        const touchHandler = (ev: any) => {
            let currentElement = ev.target;
            while (currentElement) {
                if (currentElement.id === "microphone-button") {
                    ev.preventDefault();
                    break;
                }
                currentElement = currentElement.parentElement;
            }
        };

        document.addEventListener("touchstart", touchHandler, { passive: false });
        document.addEventListener("touchmove", touchHandler, { passive: false });
        document.addEventListener("touchend", touchHandler, { passive: false });
        document.addEventListener("touchcancel", touchHandler, { passive: false });

        return () => {
            document.removeEventListener("touchstart", touchHandler);
            document.removeEventListener("touchmove", touchHandler);
            document.removeEventListener("touchend", touchHandler);
            document.removeEventListener("touchcancel", touchHandler);
        };
    }, []);

    return (
        <App cartesiaApiKey={process.env.NEXT_PUBLIC_VOICE_API_KEY as string} groqApiKey={process.env.NEXT_PUBLIC_CHAT_API_KEY as string} />
    );
}