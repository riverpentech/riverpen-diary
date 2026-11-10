import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/serverAuth';
import {
    buildDiaryListQuery,
    buildDiaryWhere,
    buildEntryUpdateWhere,
    DIARY_PAGE_SIZE,
    isValidDiaryCursor,
    parseDiaryTags,
    type DiaryTab,
} from '@/lib/diaryData';

const MAX_RANGE_MS = 46 * 24 * 60 * 60 * 1000;
const MAX_TODAY_RANGE_MS = 26 * 60 * 60 * 1000;

function parseRange(startValue: string | null, endValue: string | null, maxDuration: number) {
    if (!startValue || !endValue) return null;
    const start = new Date(startValue);
    const end = new Date(endValue);
    const duration = end.getTime() - start.getTime();

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || duration <= 0 || duration > maxDuration) {
        return null;
    }

    return { gte: start, lt: end };
}

function authFailureResponse(status: 'unauthenticated' | 'unavailable') {
    const unauthenticated = status === 'unauthenticated';
    return NextResponse.json(
        { error: unauthenticated ? 'Unauthorized' : 'Authentication service is temporarily unavailable.' },
        { status: unauthenticated ? 401 : 503 },
    );
}

async function getDiaryEntries(userId: string, searchParams: URLSearchParams) {
    const tabValue = searchParams.get('tab') || 'all';
    if (!['all', 'pinned', 'archived'].includes(tabValue)) {
        return NextResponse.json({ error: 'Invalid diary tab.' }, { status: 400 });
    }

    const mood = searchParams.get('mood') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const cursor = searchParams.get('cursor');
    if ((mood && mood.length > 40) || (tag && tag.length > 50)) {
        return NextResponse.json({ error: 'The mood or tag filter is too long.' }, { status: 400 });
    }
    if (cursor !== null && !isValidDiaryCursor(cursor)) {
        return NextResponse.json({ error: 'Invalid diary cursor.' }, { status: 400 });
    }

    const filters = { tab: tabValue as DiaryTab, ...(mood ? { mood } : {}), ...(tag ? { tag } : {}) };
    const where = buildDiaryWhere(userId, filters);

    try {
        if (cursor) {
            const cursorEntry = await prisma.diaryEntry.findFirst({
                where: { ...where, id: cursor },
                select: { id: true },
            });
            if (!cursorEntry) return NextResponse.json({ error: 'Invalid diary cursor.' }, { status: 400 });
        }

        const [rows, total, knownTags] = await Promise.all([
            prisma.diaryEntry.findMany({
                ...buildDiaryListQuery(userId, filters, cursor),
                select: {
                    id: true,
                    title: true,
                    content: true,
                    contentText: true,
                    mood: true,
                    entryDate: true,
                    hasVoice: true,
                    isArchived: true,
                    isFavorite: true,
                    tags: {
                        where: { userId },
                        select: { name: true },
                    },
                    attachments: { select: { id: true } },
                },
            }),
            prisma.diaryEntry.count({ where }),
            prisma.diaryTag.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { name: true },
            }),
        ]);

        const hasMore = rows.length > DIARY_PAGE_SIZE;
        const page = rows.slice(0, DIARY_PAGE_SIZE);
        const items = page.map(({ tags, attachments, ...entry }) => ({
            ...entry,
            tags: tags.map(({ name }) => name),
            hasPhotos: attachments.length > 0,
        }));

        return NextResponse.json({
            items,
            total,
            hasMore,
            nextCursor: hasMore ? page.at(-1)?.id || null : null,
            knownTags: knownTags.map(({ name }) => name),
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return NextResponse.json({ error: 'Unable to load diary entries.' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return authFailureResponse(session.status);

    const { searchParams } = new URL(request.url);
    if (searchParams.get('view') === 'export') {
        const fromValue = searchParams.get('from');
        const toValue = searchParams.get('to');
        const from = fromValue ? new Date(`${fromValue}T00:00:00.000`) : null;
        const to = toValue ? new Date(`${toValue}T23:59:59.999`) : null;
        if ((from && !Number.isFinite(from.getTime())) || (to && !Number.isFinite(to.getTime())) || (from && to && from > to)) {
            return NextResponse.json({ error: 'Invalid export date range.' }, { status: 400 });
        }
        try {
            const entries = await prisma.diaryEntry.findMany({
                where: {
                    userId: session.userId,
                    ...(from && to ? { entryDate: { gte: from, lte: to } } : {}),
                },
                orderBy: { entryDate: 'asc' },
                take: 500,
                include: { tags: { select: { name: true } } },
            });
            return NextResponse.json({
                entries: entries.map(({ tags, ...entry }) => ({ ...entry, tags: tags.map((tag) => tag.name) })),
            }, { headers: { 'Cache-Control': 'no-store' } });
        } catch (error) {
            console.error('Failed to export diary entries.', error);
            return NextResponse.json({ error: 'Unable to export diary entries.' }, { status: 500 });
        }
    }
    if (searchParams.get('view') === 'insights') {
        try {
            const entries = await prisma.diaryEntry.findMany({
                where: { userId: session.userId },
                orderBy: { entryDate: 'asc' },
                take: 500,
                select: { entryDate: true, mood: true, hasVoice: true, tags: { select: { name: true } } },
            });
            const total = await prisma.diaryEntry.count({ where: { userId: session.userId } });
            return NextResponse.json({
                entries: entries.map((entry) => ({
                    entryDate: entry.entryDate,
                    mood: entry.mood,
                    hasVoice: entry.hasVoice,
                    tags: entry.tags.map((tag) => tag.name),
                })),
                total,
            }, { headers: { 'Cache-Control': 'no-store' } });
        } catch {
            return NextResponse.json({ error: 'Unable to load diary insights.' }, { status: 500 });
        }

    }
    if (searchParams.get('view') === 'diary') return getDiaryEntries(session.userId, searchParams);

    const monthRange = parseRange(
        searchParams.get('monthStart'),
        searchParams.get('monthEnd'),
        MAX_RANGE_MS,
    );
    const todayRange = parseRange(
        searchParams.get('todayStart'),
        searchParams.get('todayEnd'),
        MAX_TODAY_RANGE_MS,
    );

    if (!monthRange || !todayRange) {
        return NextResponse.json({ error: 'A valid month and local day range are required.' }, { status: 400 });
    }

    try {
        const [recentEntries, monthEntries, todayCount, voiceEntries] = await Promise.all([
            prisma.diaryEntry.findMany({
                where: { userId: session.userId, isArchived: false },
                orderBy: { entryDate: 'desc' },
                take: 4,
                select: { id: true, title: true, content: true, contentText: true, mood: true, entryDate: true },
            }),
            prisma.diaryEntry.findMany({
                where: { userId: session.userId, isArchived: false, entryDate: monthRange },
                select: { id: true, title: true, content: true, contentText: true, mood: true, entryDate: true },
            }),
            prisma.diaryEntry.count({
                where: { userId: session.userId, isArchived: false, entryDate: todayRange },
            }),
            prisma.diaryEntry.findMany({
                where: { userId: session.userId, isArchived: false, hasVoice: true },
                orderBy: { entryDate: 'desc' },
                take: 3,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    contentText: true,
                    mood: true,
                    entryDate: true,
                    language: true,
                    voiceRecordings: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { durationSeconds: true, detectedLanguage: true },
                    },
                },
            }),
        ]);

        return NextResponse.json(
            { recentEntries, monthEntries, hasEntryToday: todayCount > 0, voiceEntries },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch {
        return NextResponse.json({ error: 'Unable to load diary entries.' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return authFailureResponse(session.status);
    try {
        await prisma.diaryEntry.deleteMany({ where: { userId: session.userId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete diary data.', error);
        return NextResponse.json({ error: 'Unable to delete diary data.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return authFailureResponse(session.status);

    let parsedBody: unknown;

    try {
        parsedBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const body = parsedBody as {
        title?: unknown;
        content?: unknown;
        contentText?: unknown;
        mood?: unknown;
        location?: unknown;
        entryDate?: unknown;
        hasVoice?: unknown;
        language?: unknown;
        tags?: unknown;
    };

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const rawContent = typeof body.content === 'string' ? body.content.trim() : '';
    const contentText = typeof body.contentText === 'string'
        ? body.contentText.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
        : rawContent.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const content = contentText ? rawContent : '';
    const mood = typeof body.mood === 'string' ? body.mood.trim().slice(0, 40) : null;
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 200) : null;
    const language = typeof body.language === 'string' ? body.language.trim().slice(0, 20) : 'en';
    const entryDate = typeof body.entryDate === 'string' ? new Date(body.entryDate) : new Date();
    const parsedTags = parseDiaryTags(body.tags);

    if (parsedTags.error) {
        return NextResponse.json({ error: parsedTags.error }, { status: 400 });
    }

    if (title.length > 200 || content.length > 100_000) {
        return NextResponse.json({ error: 'The title or entry is too long.' }, { status: 400 });
    }
    if (!Number.isFinite(entryDate.getTime())) {
        return NextResponse.json({ error: 'The entry date is invalid.' }, { status: 400 });
    }

    if (!contentText) {
        return NextResponse.json({ error: 'Write an entry or attach a voice recording first.' }, { status: 400 });
    }

    try {
        // Keep this path free of an interactive transaction. Voice-created entries
        // now persist transcript text only; audio storage can be added later here.
        const tags = await Promise.all(parsedTags.tags.map((name) => prisma.diaryTag.upsert({
            where: { name_userId: { name, userId: session.userId } },
            create: { name, userId: session.userId },
            update: {},
            select: { id: true },
        })));

        const entry = await prisma.diaryEntry.create({
            data: {
                userId: session.userId,
                title: title || null,
                content: content || null,
                contentText: contentText || null,
                mood: mood || null,
                location: location || null,
                entryDate,
                hasVoice: body.hasVoice === true,
                language,
                ...(tags.length ? { tags: { connect: tags } } : {}),
            },
            select: { id: true },
        });

        return NextResponse.json({ id: entry.id }, { status: 201 });
    } catch (error) {
        console.error('Failed to create diary entry.', error);
        return NextResponse.json({ error: 'Unable to save this diary entry.' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return authFailureResponse(session.status);

    let parsedBody: unknown;
    try {
        parsedBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const body = parsedBody as { id?: unknown; isFavorite?: unknown; isArchived?: unknown };
    if (typeof body.id !== 'string' || !isValidDiaryCursor(body.id)) {
        return NextResponse.json({ error: 'A valid entry ID is required.' }, { status: 400 });
    }

    const hasFavorite = Object.hasOwn(body, 'isFavorite');
    const hasArchived = Object.hasOwn(body, 'isArchived');
    if (!hasFavorite && !hasArchived) {
        return NextResponse.json({ error: 'No entry changes were provided.' }, { status: 400 });
    }
    if ((hasFavorite && typeof body.isFavorite !== 'boolean') || (hasArchived && typeof body.isArchived !== 'boolean')) {
        return NextResponse.json({ error: 'Entry changes must be boolean values.' }, { status: 400 });
    }

    const data = {
        ...(hasFavorite ? { isFavorite: body.isFavorite as boolean } : {}),
        ...(hasArchived ? { isArchived: body.isArchived as boolean } : {}),
    };

    try {
        const result = await prisma.diaryEntry.updateMany({
            where: buildEntryUpdateWhere(session.userId, body.id),
            data,
        });
        if (!result.count) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
        return NextResponse.json({ id: body.id, ...data });
    } catch {
        return NextResponse.json({ error: 'Unable to update this diary entry.' }, { status: 500 });
    }
}
