'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { previewOf } from '@/lib/entryUtils';
import { getMood } from '@/constants';

interface SearchEntry {
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

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [entries, setEntries] = useState<SearchEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/entries?view=diary&tab=all', { cache: 'no-store' })
            .then(async (response) => response.ok ? response.json() as Promise<{ items?: SearchEntry[] }> : { items: [] })
            .then((result) => setEntries(result.items || []))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, []);

    const results = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return entries;
        return entries.filter((entry) => [entry.title, entry.contentText, entry.mood, ...entry.tags].filter(Boolean).join(' ').toLowerCase().includes(normalized));
    }, [entries, query]);

    return <div>
        <h1 className="font-heading text-[24px] font-semibold">Search your diary</h1>
        <div className="relative mt-5 max-w-xl"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entries, moods or tags…" className="w-full rounded-xl border border-border bg-card px-10 py-3 text-sm outline-none focus:border-primary" /></div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : <div className="mt-6 space-y-3">{results.map((entry) => { const mood = getMood(entry.mood || ''); return <Link key={entry.id} href={`/entry/${entry.id}`} className="block rounded-2xl border border-border/80 bg-card px-5 py-4 hover:border-primary/30"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{new Date(entry.entryDate).toLocaleDateString()}</span>{mood && <span className={mood.tone}>{mood.label}</span>}</div><h2 className="mt-1 font-heading font-semibold">{entry.title || 'Untitled entry'}</h2><p className="mt-1 text-sm text-muted-foreground">{previewOf(entry.contentText || entry.content || '')}</p></Link>; })}</div>}
    </div>;
}
