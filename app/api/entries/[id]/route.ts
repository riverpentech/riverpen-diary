import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/serverAuth';
import { parseDiaryTags } from '@/lib/diaryData';

type RouteContext = { params: Promise<{ id: string }> };

function failure(status: 'unauthenticated' | 'unavailable') {
    return NextResponse.json({ error: status === 'unauthenticated' ? 'Unauthorized' : 'Authentication service is temporarily unavailable.' }, { status: status === 'unauthenticated' ? 401 : 503 });
}

async function ownedEntry(id: string, userId: string) {
    return prisma.diaryEntry.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function GET(request: Request, context: RouteContext) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return failure(session.status);
    const { id } = await context.params;
    const entry = await prisma.diaryEntry.findFirst({
        where: { id, userId: session.userId },
        include: {
            tags: { select: { name: true } },
            attachments: { orderBy: { createdAt: 'asc' }, select: { id: true, fileUrl: true, fileType: true, fileName: true } },
            voiceRecordings: { orderBy: { createdAt: 'desc' } },
        },
    });
    if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    return NextResponse.json({ ...entry, tags: entry.tags.map((tag) => tag.name) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return failure(session.status);
    const { id } = await context.params;
    if (!await ownedEntry(id, session.userId)) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });

    const body = await request.json() as Record<string, unknown>;
    const tags = parseDiaryTags(body.tags);
    if (tags.error) return NextResponse.json({ error: tags.error }, { status: 400 });
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content : '';
    const contentText = typeof body.contentText === 'string' ? body.contentText : content.replace(/<[^>]+>/g, ' ').trim();
    const hasFavorite = typeof body.isFavorite === 'boolean';
    const hasArchived = typeof body.isArchived === 'boolean';
    const entry = await prisma.$transaction(async (transaction) => {
        const tagRecords = await Promise.all(tags.tags.map((name) => transaction.diaryTag.upsert({
            where: { name_userId: { name, userId: session.userId } },
            create: { name, userId: session.userId },
            update: {},
            select: { id: true },
        })));
        return transaction.diaryEntry.update({
            where: { id },
            data: {
                title: title || null,
                content: content || null,
                contentText: contentText || null,
                mood: typeof body.mood === 'string' ? body.mood || null : null,
                location: typeof body.location === 'string' ? body.location || null : null,
                entryDate: typeof body.entryDate === 'string' && !Number.isNaN(Date.parse(body.entryDate)) ? new Date(body.entryDate) : undefined,
                hasVoice: body.hasVoice === true,
                ...(hasFavorite ? { isFavorite: body.isFavorite as boolean } : {}),
                ...(hasArchived ? { isArchived: body.isArchived as boolean } : {}),
                language: typeof body.language === 'string' ? body.language : undefined,
                tags: { set: tagRecords },
            },
            select: { id: true },
        });
    });
    return NextResponse.json(entry);
}

export async function DELETE(request: Request, context: RouteContext) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return failure(session.status);
    const { id } = await context.params;
    if (!await ownedEntry(id, session.userId)) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    await prisma.diaryEntry.delete({ where: { id } });
    return NextResponse.json({ id });
}
