import { CartesiaManager } from "@/lib/cartesia";
import { GroqManager } from "@/lib/groq";
import Groq from 'groq-sdk';
import { createContext, RefObject, useContext, useRef, useState } from 'react';

interface AIContextType {
    groq: GroqManager;
    cartesia: CartesiaManager;

    history: RefObject<Groq.Chat.Completions.ChatCompletionMessageParam[]>;

    model: string;
    setModel: (model: string) => void;

    voiceModel: string;
    setVoiceModel: (voiceModel: string) => void;

    prompt: string;
    setPrompt: (prompt: string) => void;
}

interface AIProviderProps {
    children: React.ReactNode;
}

export const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: AIProviderProps) {
    const historyRef = useRef<Groq.Chat.ChatCompletionMessageParam[]>([]);

    const groq = useRef<GroqManager | null>(null);
    const [chatModel, setChatModel] = useState<string>('llama3-70b-8192');

    const cartesia = useRef<CartesiaManager | null>(null);
    const [voiceModel, setVoiceModel] = useState<string>("95d51f79-c397-46f9-b49a-23763d3eaa2d");

    if (!groq.current) {
        groq.current = new GroqManager();
    }

    if (!cartesia.current) {
        cartesia.current = new CartesiaManager();
    }

    const [prompt, setPrompt] = useState<string>(`
You are a helpful assistant.
        
You are Ranbu.

Respond in brief natural sentences.
    `);

    return <AIContext.Provider value={{
        groq: groq.current,
        cartesia: cartesia.current,

        history: historyRef,

        model: chatModel,
        setModel: setChatModel,

        voiceModel,
        setVoiceModel,

        prompt,
        setPrompt,
    }}>
        {children}
    </AIContext.Provider>;
}

export function useAI() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}
