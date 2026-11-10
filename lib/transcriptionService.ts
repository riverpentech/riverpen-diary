'use client';

export interface RecordingSession {
    analyser: AnalyserNode | null;
    pause: () => void;
    resume: () => void;
    stop: () => Promise<Blob>;
    cancel: () => void;
}

export interface TranscriptionResult {
    text: string;
    rawTranscript: string;
    languages: string[];
    language: string;
    uncertainWords: string[];
    confidence: string;
}

interface SpeechRecognitionResultEventLike {
    resultIndex: number;
    results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
}

interface RecordingOptions { quality?: 'standard' | 'high' | string }
interface TranscribeOptions {
    blob: Blob;
    preferredLanguage?: string;
    onStage?: (stage: string) => void;
}

function pickMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || '';
}

export async function createRecordingSession({ quality = 'standard' }: RecordingOptions = {}): Promise<RecordingSession> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot access the microphone.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: quality === 'high' ? 128000 : 64000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const finished = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })); });
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    try {
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
    } catch { /* Recording still works without a waveform analyser. */ }
    recorder.start(1000);
    const cleanup = () => {
        stream.getTracks().forEach((track) => track.stop());
        void audioContext?.close();
    };
    return {
        analyser,
        pause: () => { if (recorder.state === 'recording') recorder.pause(); },
        resume: () => { if (recorder.state === 'paused') recorder.resume(); },
        stop: async () => { if (recorder.state !== 'inactive') recorder.stop(); const blob = await finished; cleanup(); return blob; },
        cancel: () => { if (recorder.state !== 'inactive') recorder.stop(); cleanup(); },
    };
}

export async function transcribeAudio({ blob, preferredLanguage, onStage }: TranscribeOptions): Promise<TranscriptionResult> {
    onStage?.('uploading');
    const body = new FormData();
    body.append('audio', blob, `diary-recording.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`);
    if (preferredLanguage) body.append('preferredLanguage', preferredLanguage);
    onStage?.('recognising');
    const response = await fetch('/api/transcription', { method: 'POST', body });
    const result = await response.json() as Partial<TranscriptionResult> & { error?: string };
    if (!response.ok || typeof result.text !== 'string') throw new Error(result.error || 'Unable to transcribe the recording.');
    onStage?.('validating');
    onStage?.('done');
    return {
        text: result.text,
        rawTranscript: result.rawTranscript || result.text,
        languages: result.languages || ['Unknown'],
        language: result.language || 'Unknown',
        uncertainWords: result.uncertainWords || [],
        confidence: result.confidence || 'medium',
    };
}

export const transcriptionService = { transcribeAudio };

export function createLivePreview({ language = 'en-US', onText }: { language?: string; onText?: (text: string) => void }) {
    const Recognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
        || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Recognition) return null;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    let buffer = '';
    recognition.onresult = (event) => {
        let interim = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const chunk = event.results[index][0].transcript;
            if (event.results[index].isFinal) buffer += `${chunk} `;
            else interim += chunk;
        }
        onText?.((buffer + interim).trim());
    };
    recognition.onerror = () => undefined;
    try { recognition.start(); } catch { return null; }
    return { stop: () => { try { recognition.stop(); } catch { /* already stopped */ } } };
}
