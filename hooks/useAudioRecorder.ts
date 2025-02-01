"use client";

import { GroqManager } from "@/lib/groq";
import { useEffect, useRef, useState } from "react";

const PLAY_RECORDED_AUDIO = false;

interface UseAudioRecorderProps {
    onTranscribe: (transcription: string) => void;
    onRecordingStart: () => void;
    onRecordingEnd: () => void;
    groq: GroqManager;
}

export default function useAudioRecorder({
    onTranscribe,
    onRecordingStart,
    onRecordingEnd,
    groq,
}: UseAudioRecorderProps) {
    const isRecording = useRef<boolean>(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null
    );
    const audioChunksRef = useRef<Blob[]>([]);
    const [mimeType, setMimeType] = useState<string>("audio/webm;codecs=opus");
    const [supportedMimeTypes, setSupportedMimeTypes] = useState<string[]>([]);
    const [volume, setVolume] = useState<number>(0);

    useEffect(() => {
        const typesToCheck = [
            "audio/webm",
            "audio/webm;codecs=opus",
            "audio/webm;codecs=vorbis",
            "audio/ogg",
            "audio/ogg;codecs=opus",
            "audio/ogg;codecs=vorbis",
            "audio/mp4",
            "audio/mp4;codecs=mp4a.40.2",
            "audio/wav",
            "audio/mpeg",
        ];
        const supportedTypes = typesToCheck.filter((type) =>
            MediaRecorder.isTypeSupported(type)
        );
        setSupportedMimeTypes(supportedTypes);

        // set mime type to the first supported type
        setMimeType(supportedTypes[0]);
    }, []);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Media Devices will not work on this browser.");
            return;
        }
        onRecordingStart();
        isRecording.current = true;
        const audioConstraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000,
            },
        };
        const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            console.error(`MIME type ${mimeType} is not supported on this browser.`);
            return;
        }
        const recorderOptions = {
            mimeType,
            audioBitsPerSecond: 96000 / 4,
        };
        const recorder = new MediaRecorder(stream, recorderOptions);
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        recorder.ondataavailable = (event: BlobEvent) => {
            audioChunksRef.current.push(event.data);
        };
        recorder.start();
        setMediaRecorder(recorder);
        audioChunksRef.current = [];

        const getVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setVolume(average);
            requestAnimationFrame(getVolume);
        };
        getVolume();
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.onstop = () => {
                handleChunks();
            };
        }
        mediaRecorder?.stop();
        mediaRecorder?.stream
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
        isRecording.current = false;
        onRecordingEnd();
        setVolume(0);
    };

    async function handleChunks() {
        let transcription = "";
        for (const chunk of audioChunksRef.current) {
            if (PLAY_RECORDED_AUDIO) {
                const audioUrl = URL.createObjectURL(chunk);
                const audio = new Audio(audioUrl);
                audio.play();
            }

            console.log(`Audio chunk size: ${chunk.size} bytes`);
            transcription += (await groq.transcribe(chunk)).text;
        }

        // We trim by default to avoid problematic leading/trailing whitespace
        transcription = transcription.trim();

        if (transcription.length > 0) {
            onTranscribe(transcription);
        }
    }

    return {
        isRecording: isRecording.current,
        volume,
        startRecording,
        stopRecording,
    };
};