import { connection } from 'next/server';
import { notFound, redirect } from 'next/navigation';
import AuthServiceUnavailable from '@/components/home/AuthServiceUnavailable';
import EntryEditorClient, { type InitialEntry } from '@/components/entry/EntryEditorClient';
import prisma from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/serverAuth';

type EntryParams = Promise<{ id: string }>;

export const instant = false;

export default async function EntryPage({ params }: { params: EntryParams }) {
    await connection();
    const session = await getServerAuthSession();
    if (session.status === 'unauthenticated') redirect('/signin');
    if (session.status === 'unavailable') return <AuthServiceUnavailable />;
    const { id } = await params;

    const entry = await prisma.diaryEntry.findFirst({
        where: { id, userId: session.userId },
        include: {
            tags: { select: { name: true } },
            attachments: {
                orderBy: { createdAt: 'asc' },
                select: { id: true, fileUrl: true, fileType: true, fileName: true },
            },
            voiceRecordings: {
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            },
        },
    });

    if (!entry) notFound();

    const initialEntry: InitialEntry = {
        id: entry.id,
        title: entry.title || '',
        content: entry.content || '',
        entryDate: entry.entryDate.toISOString(),
        mood: entry.mood || '',
        location: entry.location || '',
        language: entry.language || 'en',
        hasVoice: entry.hasVoice,
        isFavorite: entry.isFavorite,
        isArchived: entry.isArchived,
        tags: entry.tags.map((tag) => tag.name),
        attachments: entry.attachments,
    };

    return <EntryEditorClient initialPrompt="" initialMood={entry.mood || ''} initialVoiceMode={false} initialEntry={initialEntry} />;
}
