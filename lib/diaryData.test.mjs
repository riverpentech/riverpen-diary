import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildDiaryListQuery,
    buildDiaryWhere,
    buildEntryUpdateWhere,
    isValidDiaryCursor,
    parseDiaryTags,
} from './diaryData.ts';

test('builds user-scoped filters for all, pinned, and archived entries', () => {
    assert.deepEqual(buildDiaryWhere('user-1', { tab: 'all', mood: 'calm', tag: 'Work' }), {
        userId: 'user-1',
        isArchived: false,
        mood: 'calm',
        tags: { some: { userId: 'user-1', name: 'Work' } },
    });
    assert.deepEqual(buildDiaryWhere('user-1', { tab: 'pinned' }), {
        userId: 'user-1',
        isArchived: false,
        isFavorite: true,
    });
    assert.deepEqual(buildDiaryWhere('user-1', { tab: 'archived' }), {
        userId: 'user-1',
        isArchived: true,
    });
});

test('builds stable, bounded page queries with an exclusive cursor', () => {
    assert.deepEqual(buildDiaryListQuery('user-1', { tab: 'all' }), {
        where: { userId: 'user-1', isArchived: false },
        orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
        take: 21,
    });
    assert.deepEqual(buildDiaryListQuery('user-1', { tab: 'all' }, 'entry-20'), {
        where: { userId: 'user-1', isArchived: false },
        orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
        take: 21,
        cursor: { id: 'entry-20' },
        skip: 1,
    });
});

test('accepts only well-formed diary cursors', () => {
    assert.equal(isValidDiaryCursor('ckxyz123'), true);
    assert.equal(isValidDiaryCursor(''), false);
    assert.equal(isValidDiaryCursor('bad cursor'), false);
    assert.equal(isValidDiaryCursor('x'.repeat(192)), false);
});

test('normalizes and deduplicates valid tags and rejects malformed tag input', () => {
    assert.deepEqual(parseDiaryTags([' Work ', 'work', 'Family']), { tags: ['Work', 'Family'] });
    assert.deepEqual(parseDiaryTags(undefined), { tags: [] });
    assert.equal(parseDiaryTags('Work').error, 'Tags must be a list of names.');
    assert.equal(parseDiaryTags(['']).error, 'Tags must be non-empty names of at most 50 characters.');
    assert.equal(parseDiaryTags(['x'.repeat(51)]).error, 'Tags must be non-empty names of at most 50 characters.');
    assert.equal(parseDiaryTags(Array.from({ length: 13 }, (_, index) => `tag-${index}`)).error, 'An entry can have at most 12 tags.');
});

test('scopes entry updates by both entry ID and authenticated user ID', () => {
    assert.deepEqual(buildEntryUpdateWhere('user-1', 'entry-9'), {
        id: 'entry-9',
        userId: 'user-1',
    });
});
