'use client';

import Link from 'next/link';
import moment from 'moment';
import { Mic, Loader2, ArrowRight } from 'lucide-react';
import { previewOf } from '@/lib/entryUtils';
import type { HomeVoiceEntry } from '@/lib/homeData';

interface VoiceHighlightsProps {
    entries: HomeVoiceEntry[];
    isLoading: boolean;
    error: string;
}

const duration = (seconds?: number | null) => {
    if (!seconds) return null;
    const total = Math.round(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export default function VoiceHighlights({ entries, isLoading, error }: VoiceHighlightsProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>;
    }

    if (!entries.length) {
        return (
            <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center">
                <Mic className="mx-auto h-5 w-5 text-pen-deep" strokeWidth={1.7} />
                <p className="mt-3 font-heading text-[15px] font-medium">No spoken entries yet.</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Tap the mic and talk — your reflections land here.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-2.5 sm:grid-cols-3">
            {entries.map((entry) => {
                const note = entry.voiceRecordings[0];
                const length = duration(note?.durationSeconds);
                return (
                    <Link
                        key={entry.id}
                        href={`/entry/${entry.id}`}
                        className="group flex flex-col rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-pen/50 hover:shadow-[0_6px_24px_-16px_rgba(15,23,42,0.35)]"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                <Mic className="h-3.5 w-3.5 text-pen-deep" strokeWidth={1.9} />
                                {moment(entry.entryDate).format('D MMM')}
                            </span>
                            {length && <span className="text-[11px] tabular-nums text-muted-foreground">{length}</span>}
                        </div>
                        <h3 className="mt-2 line-clamp-1 font-heading text-[14px] font-semibold">{entry.title || 'Voice note'}</h3>
                        <p className="mt-1 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                            {previewOf(entry.contentText || entry.content || '') || 'No transcript saved.'}
                        </p>
                        <span className="mt-3 flex items-center gap-1 text-[11.5px] text-muted-foreground transition group-hover:text-pen-deep">
                            {note?.detectedLanguage || entry.language || 'Listen back'}
                            <ArrowRight className="h-3 w-3" />
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
