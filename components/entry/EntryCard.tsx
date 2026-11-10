'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Mic, Pin, Archive, Loader2 } from 'lucide-react';
import moment from 'moment';
import { getMood } from '@/constants';
import { previewOf } from '@/lib/entryUtils';

interface EntryCardEntry {
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

type EntryUpdate = Partial<Pick<EntryCardEntry, 'isFavorite' | 'isArchived'>>;

export default function EntryCard({
    entry,
    onEntryUpdated = () => undefined,
}: {
    entry: EntryCardEntry;
    onEntryUpdated?: (entryId: string, update: EntryUpdate) => void;
}) {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const mood = getMood(entry.mood || '');
    const preview = previewOf(entry.contentText || entry.content || '');

    const updateEntry = async (update: EntryUpdate) => {
        setUpdating(true);
        setError('');
        try {
            const response = await fetch('/api/entries', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: entry.id, ...update }),
            });
            const result = await response.json() as { error?: string };
            if (!response.ok) {
                setError(result.error || 'Unable to update this entry.');
                return;
            }
            onEntryUpdated(entry.id, update);
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : 'Unable to update this entry.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <article className="rounded-2xl border border-border/80 bg-card px-5 py-4 transition-all hover:border-primary/30 hover:shadow-[0_6px_24px_-16px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
                <Link href={`/entry/${entry.id}`} className="group min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        <time dateTime={entry.entryDate}>{moment(entry.entryDate).format('ddd, D MMM')}</time>
                        {entry.isFavorite && <Pin className="h-3 w-3 text-pen-deep" />}
                        {entry.isArchived && <Archive className="h-3 w-3" />}
                    </div>
                    <h3 className="mt-1.5 truncate font-heading text-[15px] font-semibold text-foreground transition-colors group-hover:text-river-deep dark:group-hover:text-primary">
                        {entry.title || 'Untitled entry'}
                    </h3>
                    {preview && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{preview}</p>}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {mood && (
                            <span className={`flex items-center gap-1 text-[11px] font-medium ${mood.tone}`}>
                <mood.Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                                {mood.label}
              </span>
                        )}
                        {(entry.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">{tag}</span>
                        ))}
                        {entry.hasPhotos && <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.7} />}
                        {entry.hasVoice && <Mic className="h-3.5 w-3.5 text-pen-deep" strokeWidth={1.7} />}
                    </div>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        aria-label={entry.isFavorite ? 'Unpin entry' : 'Pin entry'}
                        aria-pressed={entry.isFavorite}
                        title={entry.isFavorite ? 'Unpin entry' : 'Pin entry'}
                        disabled={updating}
                        onClick={() => updateEntry({ isFavorite: !entry.isFavorite })}
                        className={`rounded-lg p-2 transition hover:bg-muted disabled:opacity-50 ${entry.isFavorite ? 'text-pen-deep' : 'text-muted-foreground'}`}
                    >
                        {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        aria-label={entry.isArchived ? 'Restore entry' : 'Archive entry'}
                        title={entry.isArchived ? 'Restore entry' : 'Archive entry'}
                        disabled={updating}
                        onClick={() => updateEntry({ isArchived: !entry.isArchived })}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                        <Archive className="h-4 w-4" />
                    </button>
                </div>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
        </article>
    );
}