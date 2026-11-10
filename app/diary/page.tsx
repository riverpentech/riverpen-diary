'use client'

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PenLine, Loader2, BookOpen, Search } from 'lucide-react';
import EntryCard from '@/components/entry/EntryCard';
import EmptyState from '@/components/EmptyState';
import { MOODS, DEFAULT_TAGS } from '@/constants';
import { Button } from '@/components/ui/button';

const TABS = [
    { value: 'all', label: 'All' },
    { value: 'pinned', label: 'Pinned' },
    { value: 'archived', label: 'Archived' }
];

interface DiaryEntry {
    id: string;
    title: string | null;
    content: string | null;
    contentText: string | null;
    mood: string | null;
    entryDate: string;
    hasVoice: boolean;
    hasPhotos: boolean;
    isArchived: boolean;
    isFavorite: boolean;
    tags: string[];
}

interface DiaryPageResponse {
    items?: DiaryEntry[];
    total?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
    knownTags?: string[];
    error?: string;
}

function diaryPageUrl(tab: string, mood: string, tag: string, cursor?: string | null) {
    const params = new URLSearchParams({ view: 'diary', tab });
    if (mood) params.set('mood', mood);
    if (tag) params.set('tag', tag);
    if (cursor) params.set('cursor', cursor);
    return `/api/entries?${params.toString()}`;
}

type EntryUpdate = Partial<Pick<DiaryEntry, 'isFavorite' | 'isArchived'>>;

export default function Diary() {
    const [tab, setTab] = useState('all');
    const [mood, setMood] = useState('');
    const [tag, setTag] = useState('');
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [knownTags, setKnownTags] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const requestVersion = useRef(0);

    useEffect(() => {
        const controller = new AbortController();
        const version = ++requestVersion.current;
        // This effect resets the request state before starting a new filtered fetch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setCursor(null);
        setHasMore(false);
        setLoadingMore(false);
        setError('');
        (async () => {
            try {
                const response = await fetch(diaryPageUrl(tab, mood, tag), {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const page = await response.json() as DiaryPageResponse;
                if (!response.ok) {
                    if (version === requestVersion.current) {
                        setEntries([]);
                        setTotal(0);
                        setError(page.error || 'Unable to load diary entries.');
                    }
                    return;
                }
                if (version !== requestVersion.current) return;
                setEntries(page.items || []);
                setCursor(page.nextCursor || null);
                setHasMore(Boolean(page.hasMore));
                setTotal(page.total || 0);
                setKnownTags(page.knownTags || []);
            } catch (loadError) {
                if (controller.signal.aborted || version !== requestVersion.current) return;
                setEntries([]);
                setTotal(0);
                setError(loadError instanceof Error ? loadError.message : 'Unable to load diary entries.');
            } finally {
                if (version === requestVersion.current) setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [tab, mood, tag, retryCount]);

    const loadMore = async () => {
        if (!cursor || loadingMore) return;
        const version = requestVersion.current;
        setLoadingMore(true);
        setError('');
        try {
            const response = await fetch(diaryPageUrl(tab, mood, tag, cursor), {
                cache: 'no-store',
            });
            const page = await response.json() as DiaryPageResponse;
            if (!response.ok) {
                if (version === requestVersion.current) setError(page.error || 'Unable to load older entries.');
                return;
            }
            if (version !== requestVersion.current) return;
            setEntries((previous) => [...previous, ...(page.items || [])]);
            setCursor(page.nextCursor || null);
            setHasMore(Boolean(page.hasMore));
            setTotal(page.total || 0);
            setKnownTags(page.knownTags || []);
        } catch (loadError) {
            if (version === requestVersion.current) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to load older entries.');
            }
        } finally {
            if (version === requestVersion.current) setLoadingMore(false);
        }
    };

    const handleEntryUpdated = (entryId: string, update: EntryUpdate) => {
        const movesOutOfTab = tab === 'archived'
            ? update.isArchived === false
            : tab === 'pinned'
                ? update.isArchived === true || update.isFavorite === false
                : update.isArchived === true;

        setEntries((previous) => movesOutOfTab
            ? previous.filter((entry) => entry.id !== entryId)
            : previous.map((entry) => entry.id === entryId ? { ...entry, ...update } : entry));
        if (movesOutOfTab) setTotal((previous) => Math.max(0, previous - 1));
    };

    const tags = Array.from(new Set([...knownTags, ...DEFAULT_TAGS])).slice(0, 12);

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-heading text-[24px] font-semibold tracking-tight">My diary</h1>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        {total} {total === 1 ? 'entry' : 'entries'}{tab === 'archived' ? ' archived' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/search" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] text-muted-foreground transition hover:text-foreground">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Link>
                    <Link href="/entry/new" className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90">
                        <PenLine className="h-3.5 w-3.5" /> New entry
                    </Link>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border/70 pb-3">
                {TABS.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setTab(item.value)}
                        className={`rounded-full px-3 py-1.5 text-[12.5px] transition ${
                            tab === item.value ? 'bg-river-soft font-medium text-river-deep dark:text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <select
                        value={mood}
                        onChange={(event) => setMood(event.target.value)}
                        className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-[12px] text-muted-foreground outline-none focus:border-primary/40"
                    >
                        <option value="">Any mood</option>
                        {MOODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <select
                        value={tag}
                        onChange={(event) => setTag(event.target.value)}
                        className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-[12px] text-muted-foreground outline-none focus:border-primary/40"
                    >
                        <option value="">Any tag</option>
                        {tags.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
            </div>

            {error && (
                <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button>
                </div>
            )}

            <div className="mt-5">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : entries.length ? (
                    <div className="space-y-2.5">
                        {entries.map((entry) => <EntryCard key={entry.id} entry={entry} onEntryUpdated={handleEntryUpdated} />)}
                        {hasMore && (
                            <div className="pt-3 text-center">
                                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? 'Loading…' : 'Load older entries'}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : error ? null : (
                    <EmptyState
                        icon={BookOpen}
                        title={tab === 'archived' ? 'Nothing archived' : 'No entries yet'}
                        description={tab === 'archived' ? 'Entries you archive will rest here, out of the way.' : 'Your first page is one sentence away.'}
                    >
                        <Link href="/entry/new" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground">
                            <PenLine className="h-3.5 w-3.5" /> Write an entry
                        </Link>
                    </EmptyState>
                )}
            </div>
        </div>
    );
}