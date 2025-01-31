import Groq, { toFile } from "groq-sdk";

export async function transcribe(blob: Blob, groq: Groq) {
    const startTime = performance.now();
    const response = await groq.audio.translations.create({
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

export async function streamCompletion(
    messages: Groq.Chat.ChatCompletionMessageParam[],
    groq: Groq
): Promise<{
    contentBuffer: string;
    toolCalls: Groq.Chat.ChatCompletionMessageToolCall[];
}> {
    const startTime = performance.now();
    const stream = true;
    const toolCallDeltas = [];

    const response = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a helpful assistant.
        
You are Ranbu.

Respond in brief natural sentences.`// Use tools when appropriate before giving a response. Only use a tool if it is necessary.`,
            },
            ...messages,
        ],
        // tools: [getWeatherSchema],
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 1024,
        seed: 42,
        top_p: 1,
        stream: stream,
    });

    let contentBuffer = "";
    if (stream) {
        // @ts-ignore
        for await (const chunk of response) {
            if (chunk.choices[0]?.delta?.content) {
                contentBuffer += chunk.choices[0]?.delta?.content;
            }
            if (chunk.choices[0].delta.tool_calls) {
                toolCallDeltas.push(...chunk.choices[0].delta.tool_calls);
            }
        }
    } else {
        // @ts-ignore
        contentBuffer = response.choices[0].message.content;
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