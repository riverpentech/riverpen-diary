import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/serverAuth';

const MAX_AUDIO_BYTES = 7 * 1024 * 1024;
const GROQ_TRANSCRIPTION_MODEL = process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo';

export async function POST(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const audio = formData.get('audio') || formData.get('file');
        const preferredLanguage = formData.get('preferredLanguage');

        if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) {
            return NextResponse.json({ error: 'A valid audio recording is required.' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Groq transcription is not configured on the server.' }, { status: 503 });
        }

        const upstream = new FormData();
        upstream.append('file', audio, audio.name || 'diary-recording.webm');
        upstream.append('model', GROQ_TRANSCRIPTION_MODEL);
        upstream.append('response_format', 'verbose_json');
        upstream.append('temperature', '0');
        if (typeof preferredLanguage === 'string' && preferredLanguage !== 'auto') {
            upstream.append('language', preferredLanguage);
        }

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: upstream,
        });
        const result = await response.json() as { text?: unknown; language?: unknown; error?: { message?: unknown } };
        if (!response.ok || typeof result.text !== 'string' || !result.text.trim()) {
            const providerMessage = typeof result.error?.message === 'string' ? result.error.message : 'The transcription provider returned no text.';
            console.error('Groq transcription failed.', { status: response.status, message: providerMessage });
            return NextResponse.json({ error: providerMessage }, { status: 502 });
        }

        const language = typeof result.language === 'string'
            ? result.language
            : typeof preferredLanguage === 'string' && preferredLanguage !== 'auto' ? preferredLanguage : 'Unknown';

        return NextResponse.json({
            text: result.text.trim(),
            rawTranscript: result.text.trim(),
            languages: [language],
            language,
            uncertainWords: [],
            confidence: 'medium',
        });
    } catch (error) {
        console.error('Transcription request failed.', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to transcribe the recording.' }, { status: 502 });
    }
}
