"use client";

// import Groq from "groq-sdk";
import React, { useEffect, useState, useCallback } from "react";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import AudioAnimation from "@/components/AudioAnimation";
import { AIProvider, useAI } from "@/components/AISettings/AIContext";
import ChatHistory from "@/components/ChatHistory";
import { Toggle } from "@/components/ui/toggle";
import { MessageCircle, Mic, Settings } from "lucide-react";
import AIConfig from "@/components/AISettings/AIConfig";

// const toolHandlers: { [key: string]: (...args: any[]) => any } = {

// }

function App() {
    const { cartesia, groq, model, voiceModel, history, prompt } = useAI();

    const { isRecording, startRecording, stopRecording, volume } =
        useAudioRecorder({
            onTranscribe: async (transcription: string) => {
                history.current = [
                    ...history.current,
                    { role: "user", content: transcription },
                ];

                await triggerCompletionFlow();
            },
            onRecordingStart: () => {
                history.current = [...history.current];
            },
            onRecordingEnd: () => {
                // No additional actions needed for now
            },
            groq,
        });

    const [showMessages, setShowMessages] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);

    const handleShowMessages = (press: boolean) => {
        setShowMessages(press);
        setShowConfig(false);
    };

    const handleShowConfig = (press: boolean) => {
        setShowConfig(press);
        setShowMessages(false);
    }

    const handleMicrophonePress = () => {
        startRecording();
    };

    const handleMicrophoneRelease = useCallback(() => {
        stopRecording();
    }, [stopRecording]);

    const triggerCompletionFlow = async () => {

        const { contentBuffer: response } = await groq.streamCompletion(
            history.current,
            model,
            prompt
        );

        // In the completion flow we also handle 
        // calling the generated toolCalls in case there are any, which can recursively
        // call triggerCompletionFlow in case
        // more toolCalls are generated.
        // if (toolCalls.length > 0) {
        //     await handleToolCalls(toolCalls);
        // }

        if (response.length > 0) {
            history.current = [
                ...history.current,
                { role: "assistant", content: response },
            ];

            const src = await cartesia.getSpeakSource(response, voiceModel);

            if (src) {
                setIsPlaying(true);
                await cartesia.startPlayer(src);
                setIsPlaying(false);
            }
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

    // const handleToolCalls = async (
    //     toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]
    // ) => {
    //     // Assumed only called with toolCalls > 0
    //     if (toolCalls.length == 0) {
    //         throw new Error("only call handleToolCalls with toolCalls > 0");
    //     }

    //     history.current = [
    //         ...history.current,
    //         { role: "assistant", tool_calls: toolCalls },
    //     ];

    //     for (const toolCall of toolCalls) {
    //         const { function: toolFunction } = toolCall;
    //         if (toolFunction && toolHandlers[toolFunction.name]) {
    //             const toolResponse = await toolHandlers[toolFunction.name](
    //                 JSON.parse(toolFunction.arguments)
    //             );

    //             history.current = [
    //                 ...history.current,
    //                 { role: "tool", content: toolResponse, tool_call_id: toolCall.id },
    //             ];
    //         }
    //     }
    //     await triggerCompletionFlow();
    // };

    return (
        <div className="flex h-full flex-col">
            <div className="p-4">
                <h1 className="text-3xl font-bold text-center">RANBU</h1>
            </div>
            {!showMessages && !showConfig && (
                <div className="flex justify-center items-center h-full absolute top-0 left-0 w-full">
                    <AudioAnimation playing={isPlaying} />
                </div>
            )}
            <div id="chat-container" className="p-2 flex-grow overflow-x-auto">
                <div className="flex fixed bottom-4 left-4 gap-2">
                    <Toggle
                        variant='outline'
                        onPressedChange={handleShowMessages}
                        pressed={showMessages}
                        className="group"
                    >
                        <MessageCircle className={`text-primary group-data-[state=on]:text-orange-800`} />
                    </Toggle>
                    <Toggle
                        variant='outline'
                        onPressedChange={handleShowConfig}
                        pressed={showConfig}
                        className="group"
                    >
                        <Settings className={`text-primary group-data-[state=on]:text-orange-800`} />
                    </Toggle>
                </div>
                <div className="fixed bottom-4 right-4 select-none cursor-pointer">
                    <div
                        id="microphone-button"
                        data-recording={isRecording}
                        className={`p-6 rounded-full ${isRecording ? "recording-animation" : ""
                            } bg-foreground data-[recording=true]:bg-primary transition-all duration-200 ease-in-out data-[recording=true]:shadow-lg`}
                        style={{
                            transform: `scale(${1 + volume / 100 + (isRecording ? 0.1 : 0)})`,
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
                            <Mic className="pointer-events-none size-8 text-orange-800" />
                        </div>
                    </div>
                </div>

                {showMessages && <ChatHistory />}

                {showConfig && <AIConfig />}
            </div>
        </div>
    );
}

export default function Home() {
    useEffect(() => {
        const touchHandler = (ev: TouchEvent | MouseEvent) => {
            let currentElement = ev.target as HTMLElement | null;
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
        <AIProvider>
            <App />
        </AIProvider>
    );
}