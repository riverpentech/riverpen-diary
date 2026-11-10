import { NextResponse } from 'next/server';

export async function POST() {
    // Audio persistence is intentionally disabled for now. Keep this route as the future
    // integration point when hosted voice files should be stored again.
    return NextResponse.json({ error: 'Audio persistence is currently disabled.' }, { status: 410 });
    /*
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const entry = await prisma.diaryEntry.findFirst({ where: { id, userId: session.userId }, select: { id: true } });
    if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    const body = await request.json() as { audioUrl?: unknown; durationSeconds?: unknown; transcript?: unknown; detectedLanguage?: unknown };
    if (typeof body.audioUrl !== 'string' || body.audioUrl.length > 7 * 1024 * 1024) return NextResponse.json({ error: 'Invalid recording.' }, { status: 400 });
    try {
        const audioUrl = await uploadVoiceDataUrl(body.audioUrl);
        const recording = await prisma.voiceRecording.create({
            data: {
                entryId: id,
                audioUrl,
                durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : null,
                transcript: typeof body.transcript === 'string' ? body.transcript : null,
                detectedLanguage: typeof body.detectedLanguage === 'string' ? body.detectedLanguage : null,
            },
            select: { id: true },
        });
        await prisma.diaryEntry.update({ where: { id }, data: { hasVoice: true } });
        return NextResponse.json(recording, { status: 201 });
    } catch (error) {
        console.error('Failed to save voice recording.', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save the voice recording.' }, { status: 500 });
    }
    */
}
