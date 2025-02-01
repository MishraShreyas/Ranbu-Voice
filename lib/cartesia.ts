import { CartesiaClient, WebPlayer } from "@cartesia/cartesia-js";
import { Voice } from "@cartesia/cartesia-js/api";
import Source from "@cartesia/cartesia-js/wrapper/source";
import Websocket from "@cartesia/cartesia-js/wrapper/Websocket";

/**
 * Manages text-to-speech operations using the Cartesia API
 */
export class CartesiaManager {
    /** Instance of CartesiaClient for API interactions */
    private client: CartesiaClient;
    /** WebSocket connection for real-time communication */
    private websocket: Websocket | null = null;
    /** Audio player instance for TTS playback */
    private player: WebPlayer;
    /** List of available voice models */
    private voices: Voice[] = [];

    /**
     * Initializes a new instance of CartesiaManager
     * @throws {Error} If API key is not provided
     */
    constructor() {
        if (!process.env.NEXT_PUBLIC_VOICE_API_KEY) {
            throw new Error("API key is required");
        }

        this.client = new CartesiaClient({
            apiKey: process.env.NEXT_PUBLIC_VOICE_API_KEY
        });

        this.client.voices.list().then((voices) => this.voices = voices);

        this.player = new WebPlayer({ bufferDuration: 0.02 });
        this.initializeWebSocket();
    }

    /**
     * Initializes WebSocket connection for TTS streaming
     * @private
     */
    private async initializeWebSocket() {
        if (!this.websocket) {
            this.websocket = this.client.tts.websocket({ sampleRate: 44100 });
            try {
                await this.websocket.connect();
            } catch (error) {
                console.error(`Failed to connect to Cartesia: ${error}`);
            }
        }
    }

    /**
     * Gets or creates a WebSocket connection
     * @private
     * @returns {Promise<Websocket>} Active WebSocket connection
     */
    private async getWebSocket(): Promise<Websocket> {
        if (!this.websocket) {
            await this.initializeWebSocket();
        }

        return this.websocket!;
    }

    /**
     * Returns the list of available voice models
     * @returns {Voice[]} Array of available voices
     */
    public getVoices(): Voice[] { return this.voices; }

    /**
     * Converts text to speech and plays it using the specified voice model
     * @param text - Text to convert to speech
     * @param modelId - ID of the voice model to use
     * @returns {Promise<Source>} Source object for the audio playback
     */
    public async getSpeakSource(text: string, modelId: string): Promise<Source | undefined> {
        const websocket = await this.getWebSocket();

        const startTime = performance.now();

        try {
            const response = await websocket.send({
                modelId: "sonic-english",
                voice: {
                    mode: "id",
                    id: modelId,
                },
                transcript: text,
            });

            for await (const [] of response.events("message")) {
                const endTime = performance.now();
                console.log(`[SPEECH]: ${(endTime - startTime).toFixed(2)} ms`);
                return response.source;
            }

            return undefined;
        } catch (error) {
            console.error(`Error sending message: ${error}`);
        }
    }

    /**
     * Plays the specified audio source
     * @param src - Source object for the audio playback
     */
    public async startPlayer(src: Source) {
        await this.player.play(src);
    }
}