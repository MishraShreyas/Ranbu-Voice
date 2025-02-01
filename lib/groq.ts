import Groq, { toFile } from "groq-sdk";

/** API key for Groq authentication */
const API_KEY = process.env.NEXT_PUBLIC_CHAT_API_KEY;

/**
 * Manages interactions with the Groq API for transcription and chat completions
 */
export class GroqManager {
    /** Instance of Groq client */
    private client: Groq;
    /** List of available Groq models */
    private models: string[] = [];

    /**
     * Initializes a new instance of GroqManager
     * @throws {Error} If API key is not provided
     */
    constructor() {
        if (!API_KEY) {
            throw new Error("API key is required");
        }

        this.client = new Groq({
            apiKey: API_KEY,
            dangerouslyAllowBrowser: true
        });

        this.client.models.list().then((models) => {
            this.models = models.data.map((model) => model.id);
        });
    }

    /**
     * Returns the list of available Groq models
     * @returns {string[]} Array of model IDs
     */
    public getModels(): string[] { return this.models; }

    /**
     * Transcribes an audio blob to text using Whisper model
     * @param blob - Audio blob to transcribe
     * @returns {Promise<Groq.Audio.Transcription>} Transcription response
     */
    public async transcribe(blob: Blob): Promise<Groq.Audio.Transcription> {
        const startTime = performance.now();
        const response = await this.client.audio.transcriptions.create({
            file: await toFile(blob, "audio.webm"),
            model: "whisper-large-v3",
            prompt: "",
            response_format: "json",
            temperature: 0,
        });
        const endTime = performance.now();
        console.log(`[TRANSCRIPTION]: ${(endTime - startTime).toFixed(2)} ms`);
        return response;
    }

    /**
     * Streams a chat completion using the specified model and messages
     * @param messages - Array of chat messages
     * @param model - ID of the model to use
     * @param prompt - System prompt to guide the model's behavior
     * @returns {Promise<{contentBuffer: string, toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]}>} 
     *          Object containing the completion content and any tool calls
     */
    public async streamCompletion(
        messages: Groq.Chat.ChatCompletionMessageParam[],
        model: string,
        prompt: string
    ): Promise<{ contentBuffer: string; toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]; }> {
        const startTime = performance.now();
        const toolCallDeltas = [];

        const response = await this.client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                ...messages,
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 1024,
            seed: 42,
            top_p: 1,
            stream: true,
        });

        let contentBuffer = "";
        for await (const chunk of response) {
            if (chunk.choices[0]?.delta?.content) {
                contentBuffer += chunk.choices[0]?.delta?.content;
            }
            if (chunk.choices[0].delta.tool_calls) {
                toolCallDeltas.push(...chunk.choices[0].delta.tool_calls);
            }
        }

        const endTime = performance.now();
        console.log(`[COMPLETION]: ${(endTime - startTime).toFixed(2)} ms`);

        // Convert toolCallDeltas to toolCalls
        const toolCallBuffers: {
            [key: number]: Groq.Chat.ChatCompletionMessageToolCall;
        } = {};

        for (const toolCallDelta of toolCallDeltas) {
            const index = toolCallDelta.index;
            if (!toolCallBuffers[index]) {
                toolCallBuffers[index] = {
                    id: toolCallDelta.id || "",
                    type: "function",
                    function: {
                        arguments: "",
                        name: "",
                    },
                };
            }
            if (toolCallDelta.function?.arguments) {
                toolCallBuffers[index].function.arguments +=
                    toolCallDelta.function.arguments;
            }
            if (toolCallDelta.function?.name) {
                toolCallBuffers[index].function.name += toolCallDelta.function.name;
            }
        }

        const toolCalls: Groq.Chat.ChatCompletionMessageToolCall[] =
            Object.values(toolCallBuffers);

        return { contentBuffer, toolCalls };
    }
}
