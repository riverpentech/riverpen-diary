'use client';

import { useEffect, useState } from 'react';
import { Mic, Trash2 } from 'lucide-react';
import moment from 'moment';

interface VoiceNote {
    id: string;
    audioUrl: string;
    durationSeconds: number | null;
    transcript: string | null;
    detectedLanguage: string | null;
    createdAt: string;
}

interface VoiceNotesProps {
    entryId: string | null;
    refreshKey?: number;
}

export default function VoiceNotes({ entryId, refreshKey = 0 }: VoiceNotesProps) {
    const [notes, setNotes] = useState<VoiceNote[]>([]);
    useEffect(() => {
        if (!entryId) return undefined;
        let active = true;
        fetch(`/api/entries/${entryId}`, { cache: 'no-store' })
            .then(async (response) => response.ok ? response.json() as Promise<{ voiceRecordings?: VoiceNote[] }> : { voiceRecordings: [] })
            .then((result) => { if (active) setNotes(result.voiceRecordings || []); })
            .catch(() => undefined);
        return () => { active = false; };
    }, [entryId, refreshKey]);

    if (!notes.length) return null;
    return <div className="mt-8 border-t border-border/70 pt-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Voice notes on this entry</p>
        <div className="space-y-2">{notes.map((note) => <div key={note.id} className="rounded-xl border border-border/80 bg-card/60 px-4 py-3">
            <div className="flex items-center gap-3"><Mic className="h-4 w-4 text-pen-deep" /><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{Math.round(note.durationSeconds || 0)}s{note.detectedLanguage ? ` · ${note.detectedLanguage}` : ''}</p><p className="text-[11px] text-muted-foreground">{moment(note.createdAt).format('D MMM, HH:mm')}</p></div>{note.audioUrl && <audio src={note.audioUrl} controls className="h-8 max-w-[180px]" />}<Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></div>
            {note.transcript && <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{note.transcript}</p>}
        </div>)}</div>
    </div>;
}
