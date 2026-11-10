import type { Prisma } from '@prisma/client';

export type DiaryTab = 'all' | 'pinned' | 'archived';

export interface DiaryFilters {
    tab: DiaryTab;
    mood?: string;
    tag?: string;
}

export const DIARY_PAGE_SIZE = 20;

export function buildDiaryWhere(userId: string, filters: DiaryFilters): Prisma.DiaryEntryWhereInput {
    const where: Prisma.DiaryEntryWhereInput = { userId };

    if (filters.tab === 'archived') {
        where.isArchived = true;
    } else {
        where.isArchived = false;
        if (filters.tab === 'pinned') where.isFavorite = true;
    }

    if (filters.mood) where.mood = filters.mood;
    if (filters.tag) where.tags = { some: { userId, name: filters.tag } };

    return where;
}

export function buildDiaryListQuery(userId: string, filters: DiaryFilters, cursor?: string | null) {
    const query = {
        where: buildDiaryWhere(userId, filters),
        orderBy: [{ entryDate: 'desc' as const }, { id: 'desc' as const }],
        take: DIARY_PAGE_SIZE + 1,
    };

    return cursor ? { ...query, cursor: { id: cursor }, skip: 1 } : query;
}

export function isValidDiaryCursor(cursor: unknown): cursor is string {
    return typeof cursor === 'string' && /^[A-Za-z0-9_-]{1,191}$/.test(cursor);
}

export function parseDiaryTags(value: unknown): { tags: string[]; error?: string } {
    if (value === undefined) return { tags: [] };
    if (!Array.isArray(value)) return { tags: [], error: 'Tags must be a list of names.' };
    if (value.length > 12) return { tags: [], error: 'An entry can have at most 12 tags.' };

    const tags: string[] = [];
    const seen = new Set<string>();

    for (const valueItem of value) {
        if (typeof valueItem !== 'string') {
            return { tags: [], error: 'Tags must be non-empty names of at most 50 characters.' };
        }

        const name = valueItem.trim();
        if (!name || name.length > 50) {
            return { tags: [], error: 'Tags must be non-empty names of at most 50 characters.' };
        }

        const normalized = name.toLowerCase();
        if (!seen.has(normalized)) {
            seen.add(normalized);
            tags.push(name);
        }
    }

    return { tags };
}

export function buildEntryUpdateWhere(userId: string, entryId: string): Prisma.DiaryEntryWhereUniqueInput {
    return { id: entryId, userId };
}
