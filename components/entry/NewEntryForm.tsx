'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic, Square, Trash2 } from 'lucide-react';
import MoodPicker from '@/components/entry/MoodPicker';

interface NewEntryFormProps {
    initialPrompt: string;
    initialMood: string;
    initialVoiceMode: boolean;
}

interface VoiceAudio {
    dataUrl: string;
    durationSeconds: number;
}

export default function NewEntryForm({ initialPrompt, initialMood, initialVoiceMode }: NewEntryFormProps) {
    const router = useRouter();
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startedAtRef = useRef(0);
    const [title, setTitle] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [content, setContent] = useState(initialPrompt ? `${initialPrompt}\n\n` : '');
    const [mood, setMood] = useState(initialMood);
    const [voiceAudio, setVoiceAudio] = useState<VoiceAudio | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [recording, setRecording] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!recording) return;
        const timer = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 500);
        return () => window.clearInterval(timer);
    }, [recording]);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const recorder = recorderRef.current;
        if (recorder?.state === 'recording') recorder.stop();
        recorder?.stream.getTracks().forEach((track) => track.stop());
    }, [previewUrl]);

    const startRecording = async () => {
        setError('');
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setError('Audio recording is not available in this browser. You can still write your entry.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorderRef.current = recorder;
            chunksRef.current = [];
            startedAtRef.current = Date.now();
            setElapsedSeconds(0);
            setVoiceAudio(null);
            setPreviewUrl((previous) => {
                if (previous) URL.revokeObjectURL(previous);
                return '';
            });
            recorder.ondataavailable = (event) => {
                if (event.data.size) chunksRef.current.push(event.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                stream.getTracks().forEach((track) => track.stop());
                if (blob.size) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                            setVoiceAudio({
                                dataUrl: reader.result,
                                durationSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
                            });
                            setPreviewUrl(URL.createObjectURL(blob));
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            };
            recorder.start();
            setRecording(true);
        } catch {
            setError('Microphone access was not available. Check your browser permissions or write your entry instead.');
        }
    };

    const stopRecording = () => {
        const recorder = recorderRef.current;
        if (recorder?.state === 'recording') {
            recorder.stop();
            setRecording(false);
        }
    };

    const removeRecording = () => {
        setVoiceAudio(null);
        setPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return '';
        });
    };

    const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        if (recording) {
            setError('Stop the recording before saving your entry.');
            return;
        }
        if (!content.trim() && !voiceAudio) {
            setError('Write a few words or record a voice note before saving.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
                    content,
                    mood,
                    voiceAudio,
                }),
            });
            const result = await response.json() as { id?: string; error?: string };
            if (!response.ok || !result.id) {
                setError(result.error || 'Unable to save this entry.');
                setSaving(false);
                return;
            }
            router.push(`/entry/${result.id}`);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Unable to save this entry.');
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Link href="/" className="text-sm text-muted-foreground transition hover:text-foreground">← Back to today</Link>
            <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {initialVoiceMode ? 'Voice note' : 'New diary entry'}
                </p>
                <h1 className="mt-2 font-heading text-2xl font-semibold">What would you like to remember?</h1>

                <form onSubmit={submit} className="mt-7 space-y-6">
                    <label className="block space-y-2">
                        <span className="text-sm font-medium">Title <span className="font-normal text-muted-foreground">(optional)</span></span>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={200}
                            placeholder="Give this memory a name"
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium">Tags <span className="font-normal text-muted-foreground">(comma separated, optional)</span></span>
                        <input
                            value={tagsText}
                            onChange={(event) => setTagsText(event.target.value)}
                            maxLength={624}
                            placeholder="Personal, Work, Ideas"
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium">Your entry</span>
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={100_000}
                            rows={10}
                            placeholder="Start wherever you are…"
                            className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                    </label>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">How are you feeling?</p>
                        <MoodPicker value={mood} onChange={setMood} compact />
                    </div>

                    <div className="rounded-2xl border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium">Add a voice note</p>
                                <p className="mt-1 text-xs text-muted-foreground">Recordings are saved with this entry; no transcript is generated automatically.</p>
                            </div>
                            {recording ? (
                                <button type="button" onClick={stopRecording} className="flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground">
                                    <Square className="h-4 w-4" /> Stop · {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
                                </button>
                            ) : (
                                <button type="button" onClick={startRecording} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:border-pen/50">
                                    <Mic className="h-4 w-4" /> {voiceAudio ? 'Record again' : 'Start recording'}
                                </button>
                            )}
                        </div>
                        {voiceAudio && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <audio controls src={previewUrl || voiceAudio.dataUrl} className="min-w-0 flex-1" />
                                <button type="button" onClick={removeRecording} aria-label="Remove recording" className="rounded-lg p-2 text-muted-foreground transition hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

                    <button type="submit" disabled={saving || recording} className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
                        {saving ? 'Saving…' : 'Save entry'}
                    </button>
                </form>
            </div>
        </div>
    );
}
