'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Pause, Play, Square, TriangleAlert } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Waveform from '@/components/voice/Waveform';
import TranscriptionReview from '@/components/voice/TranscriptionReview';
import { createLivePreview, createRecordingSession, transcriptionService, type RecordingSession, type TranscriptionResult } from '@/lib/transcriptionService';
import type { Preferences } from '@/constants';

interface VoiceRecorderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prefs?: Preferences;
    onInsert: (text: string, mode: 'append' | 'cursor' | 'replace') => void;
    onSaved?: (text: string) => Promise<void> | void;
    autoStart?: boolean;
    canReplace?: () => boolean;
}

type Status = 'idle' | 'recording' | 'paused' | 'processing' | 'review' | 'error';
const PREVIEW_LANG: Record<string, string> = { en: 'en-US', sw: 'sw-KE', ki: 'sw-KE', auto: 'en-US' };
const STAGE_LABEL: Record<string, string> = { uploading: 'Uploading your recording…', recognising: 'Recognising speech…', validating: 'Detecting language and checking words…', done: 'Finishing…' };
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function VoiceRecorder({ open, onOpenChange, prefs, onInsert, onSaved, autoStart = true, canReplace }: VoiceRecorderProps) {
    const [status, setStatus] = useState<Status>('idle');
    const [elapsed, setElapsed] = useState(0);
    const [liveText, setLiveText] = useState('');
    const [stage, setStage] = useState('');
    const [result, setResult] = useState<TranscriptionResult | null>(null);
    const [error, setError] = useState('');
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const sessionRef = useRef<RecordingSession | null>(null);
    const previewRef = useRef<{ stop: () => void } | null>(null);
    const blockRef = useRef<Blob | null>(null);
    const startedAtRef = useRef(0);
    const pausedAtRef = useRef(0);
    const durationRef = useRef(0);

    useEffect(() => {
        if (status !== 'recording') return undefined;
        const timer = window.setInterval(() => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)), 250);
        return () => window.clearInterval(timer);
    }, [status]);

    const stopEverything = () => {
        previewRef.current?.stop();
        previewRef.current = null;
        sessionRef.current?.cancel();
        sessionRef.current = null;
        setAnalyser(null);
    };

    const reset = () => {
        stopEverything();
        setStatus('idle');
        setElapsed(0);
        setLiveText('');
        setStage('');
        setResult(null);
        setError('');
        blockRef.current = null;
        durationRef.current = 0;
    };

    useEffect(() => {
        // Opening and closing the dialog is the lifecycle boundary for recorder state.
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            reset();
        }
        else if (autoStart) void start();
        // The dialog opening is the intentional start boundary.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    useEffect(() => () => stopEverything(), []);

    async function start() {
        setError('');
        setResult(null);
        setLiveText('');
        setElapsed(0);
        try {
            const session = await createRecordingSession({ quality: prefs?.voice_quality || 'standard' });
            sessionRef.current = session;
            setAnalyser(session.analyser);
            startedAtRef.current = Date.now();
            setStatus('recording');
            if (prefs?.live_transcription) {
                previewRef.current = createLivePreview({ language: PREVIEW_LANG[prefs.preferred_language] || 'en-US', onText: setLiveText });
            }
        } catch (recordingError) {
            setStatus('error');
            const errorName = recordingError instanceof DOMException ? recordingError.name : '';
            setError(errorName === 'NotAllowedError'
                ? 'Microphone access was blocked. Allow the microphone in your browser settings, then try again.'
                : recordingError instanceof Error ? recordingError.message : 'We could not start the microphone.');
        }
    }

    const pause = () => {
        sessionRef.current?.pause();
        previewRef.current?.stop();
        previewRef.current = null;
        pausedAtRef.current = Date.now();
        setStatus('paused');
    };

    const resume = () => {
        sessionRef.current?.resume();
        startedAtRef.current += Date.now() - pausedAtRef.current;
        setStatus('recording');
        if (prefs?.live_transcription) previewRef.current = createLivePreview({ language: PREVIEW_LANG[prefs.preferred_language] || 'en-US', onText: setLiveText });
    };

    async function transcribe(blob: Blob) {
        setStatus('processing');
        setStage('uploading');
        try {
            const value = await transcriptionService.transcribeAudio({ blob, preferredLanguage: prefs?.preferred_language, onStage: setStage });
            setResult(value);
            setStatus('review');
        } catch (transcriptionError) {
            setStatus('error');
            setError(transcriptionError instanceof Error ? transcriptionError.message : 'Transcription failed. You can try again.');
        }
    }

    const stop = async () => {
        const session = sessionRef.current;
        if (!session) return;
        previewRef.current?.stop();
        previewRef.current = null;
        setAnalyser(null);
        durationRef.current = Math.max(1, elapsed);
        const blob = await session.stop();
        sessionRef.current = null;
        blockRef.current = blob;
        await transcribe(blob);
    };

    const handleInsert = async (text: string, mode: 'append' | 'cursor' | 'replace') => {
        if (!result) return;
        const blob = blockRef.current;
        if (!blob) return;
        try {
            // Future audio persistence can upload the recorded blob here. Transcription-only mode intentionally discards it.
            await onSaved?.(text);
            onInsert(text, mode);
            onOpenChange(false);
        } catch (saveError) {
            setStatus('error');
            setError(saveError instanceof Error ? saveError.message : 'Unable to save the voice entry.');
        }
    };

    const recordMore = async () => {
        try {
            if (result && blockRef.current) {
                const text = result.text.trim();
                // Future audio persistence can upload the recorded blob here. Transcription-only mode intentionally discards it.
                await onSaved?.(text);
                if (text) onInsert(text, 'append');
            }
        } catch (saveError) {
            setStatus('error');
            setError(saveError instanceof Error ? saveError.message : 'Unable to save the voice entry.');
            return;
        }
        setResult(null);
        setElapsed(0);
        setLiveText('');
        blockRef.current = null;
        void start();
    };

    const close = () => onOpenChange(false);

    return <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}>
        <DialogContent className="max-w-lg gap-0 border-border/80 p-0 sm:rounded-2xl">
            <div className="border-b border-border/70 px-6 py-4"><p className="font-heading text-[15px] font-semibold">Voice diary</p><p className="text-xs text-muted-foreground">Speak in English, Kiswahili or Kikuyu — language is detected for you.</p></div>
            <div className="px-6 py-6">
                {(status === 'idle' || status === 'recording' || status === 'paused') && <div className="flex flex-col items-center">
                    <button type="button" onClick={status === 'idle' ? () => void start() : undefined} className={`relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground ${status === 'recording' ? 'bg-primary' : 'bg-primary/90'}`} aria-label={status === 'recording' ? 'Recording' : 'Start recording'}>
                        {status === 'recording' && <><span className="absolute inset-0 animate-ping rounded-full bg-pen/30" /><span className="absolute -inset-2 rounded-full border border-pen/40" /></>}
                        {status === 'paused' ? <Play className="h-7 w-7" /> : <Mic className="h-7 w-7" strokeWidth={1.7} />}
                    </button>
                    <p className="mt-4 font-mono text-lg tabular-nums">{formatTime(elapsed)}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{status === 'recording' ? 'Listening' : status === 'paused' ? 'Paused' : 'Ready when you are'}</p>
                    <div className="mt-3 w-full"><Waveform analyser={analyser} active={status === 'recording'} /></div>
                    {prefs?.live_transcription && liveText && <p className="mt-1 line-clamp-2 text-center text-xs italic text-muted-foreground">{liveText}</p>}
                    <div className="mt-5 flex items-center gap-2">{status === 'recording' && <Button variant="outline" size="sm" onClick={pause}><Pause className="mr-1 h-3.5 w-3.5" />Pause</Button>}{status === 'paused' && <Button variant="outline" size="sm" onClick={resume}><Play className="mr-1 h-3.5 w-3.5" />Resume</Button>}<Button size="sm" onClick={() => void stop()} disabled={status === 'idle'}><Square className="mr-1 h-3.5 w-3.5" />Finish & transcribe</Button></div>
                </div>}
                {status === 'processing' && <div className="flex flex-col items-center py-10 text-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><p className="mt-4 text-sm font-medium">{STAGE_LABEL[stage] || 'Working on it…'}</p><p className="mt-1 max-w-xs text-xs text-muted-foreground">Your words are kept exactly as spoken.</p></div>}
                {status === 'review' && result && <TranscriptionReview result={result} hasContent hasSelection={Boolean(canReplace?.())} onInsert={(text, mode) => void handleInsert(text, mode)} onRetry={() => blockRef.current && void transcribe(blockRef.current)} onRecordMore={() => void recordMore()} onDiscard={close} />}
                {status === 'error' && <div className="flex flex-col items-center py-6 text-center"><TriangleAlert className="h-6 w-6 text-pen-deep" /><p className="mt-3 max-w-sm text-sm text-muted-foreground">{error}</p><div className="mt-5 flex gap-2">{blockRef.current && <Button size="sm" onClick={() => void transcribe(blockRef.current as Blob)}>Try again</Button>}<Button size="sm" variant="outline" onClick={() => void start()}>Record again</Button></div></div>}
            </div>
        </DialogContent>
    </Dialog>;
}
