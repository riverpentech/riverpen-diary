'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Check, ChevronDown, CloudOff, Copy, Loader2, Mic, MoreHorizontal, Pin, Trash2 } from 'lucide-react';
import { usePreferences } from '@/constants';
import { buildEntryPayload, countWords, diaryDateParts, formatEntryDate, htmlToText, nowTime, todayISO } from '@/lib/entryUtils';
import { getMood } from '@/constants';
import RichEditor, { type RichEditorHandle } from '@/components/entry/RichEditor';
import EntryMetaPanel, { type EntryMetaValues } from '@/components/entry/EntryMetaPanel';
import PhotoAttachments, { type PhotoAttachmentRecord } from '@/components/entry/PhotoAttachment';
import VoiceRecorder from '@/components/voice/VoiceRecorder';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EntryEditorClientProps {
    initialPrompt: string;
    initialMood: string;
    initialVoiceMode: boolean;
    initialEntry?: InitialEntry;
}

export interface InitialEntry {
    id: string;
    title: string;
    content: string;
    entryDate: string;
    mood: string;
    location: string;
    language: string;
    hasVoice: boolean;
    isFavorite: boolean;
    isArchived: boolean;
    tags: string[];
    attachments: PhotoAttachmentRecord[];
}

type Status = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

export default function EntryEditorClient({ initialPrompt, initialMood, initialVoiceMode, initialEntry }: EntryEditorClientProps) {
    const router = useRouter();
    const { prefs } = usePreferences();
    const editorRef = useRef<RichEditorHandle>(null);
    const pendingRef = useRef<Promise<string | null> | null>(null);
    const [entryId, setEntryId] = useState<string | null>(initialEntry?.id || null);
    const [status, setStatus] = useState<Status>('idle');
    const [touched, setTouched] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [pinned, setPinned] = useState(initialEntry?.isFavorite || false);
    const [archived, setArchived] = useState(initialEntry?.isArchived || false);
    const [hasVoice, setHasVoice] = useState(initialEntry?.hasVoice || false);
    const language = 'en';
    const [photos, setPhotos] = useState<PhotoAttachmentRecord[]>(initialEntry?.attachments || []);
    const [voiceOpen, setVoiceOpen] = useState(initialVoiceMode);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [values, setValues] = useState<EntryMetaValues>({
        title: initialEntry?.title || '',
        html: initialEntry?.content || (initialPrompt ? `<p><em>${initialPrompt}</em></p><p><br></p>` : ''),
        entryDate: initialEntry ? diaryDateParts(initialEntry.entryDate).date : todayISO(),
        entryTime: initialEntry ? diaryDateParts(initialEntry.entryDate).time : nowTime(),
        mood: initialEntry?.mood || initialMood,
        tags: initialEntry?.tags || [],
        location: initialEntry?.location || '',
        isPrivate: true,
    });

    const update = (patch: Partial<EntryMetaValues>) => {
        setValues((current) => ({ ...current, ...patch }));
        setTouched(true);
    };

    const save = useCallback(async (): Promise<string | null> => {
        if (pendingRef.current) return pendingRef.current;
        if (!navigator.onLine) { setStatus('offline'); return null; }
        if (!htmlToText(values.html) && !hasVoice) {
            setStatus('idle');
            return null;
        }
        const task = (async () => {
            setStatus('saving');
            const payload = buildEntryPayload({ ...values, hasVoice, language });
            const response = await fetch(entryId ? `/api/entries/${entryId}` : '/api/entries', {
                method: entryId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, isFavorite: pinned, isArchived: archived }),
            });
            const result = await response.json() as { id?: string; error?: string };
            if (!response.ok || !result.id) throw new Error(result.error || 'Unable to save this entry.');
            setStatus('saved');
            if (!entryId) { setEntryId(result.id); router.replace(`/entry/${result.id}`); }
            return result.id;
        })().catch((error: unknown) => { setStatus('error'); console.error(error); return null; });
        pendingRef.current = task;
        try { return await task; } finally { pendingRef.current = null; }
    }, [archived, entryId, hasVoice, language, pinned, router, values]);

    useEffect(() => {
        if (!touched || !prefs.auto_save || voiceOpen) return undefined;
        const timer = window.setTimeout(() => { void save(); }, 900);
        return () => window.clearTimeout(timer);
    }, [prefs.auto_save, save, touched, voiceOpen]);

    const saveVoice = async (transcript: string) => {
        if (!entryId) {
            const payload = buildEntryPayload({ ...values, hasVoice: true, language });
            const createResponse = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    content: transcript || payload.content,
                    contentText: transcript || payload.contentText,
                    hasVoice: true,
                }),
            });
            const created = await createResponse.json() as { id?: string; error?: string };
            if (!createResponse.ok || !created.id) throw new Error(created.error || 'Unable to save the voice entry.');
            setEntryId(created.id);
            setHasVoice(true);
            router.replace(`/entry/${created.id}`);
            return;
        }

        // The transcript is inserted into the editor below and persisted by the normal entry autosave.
        // Future audio persistence can use /api/entries/[id]/voice without changing this text flow.
        setHasVoice(true);
    };

    const removeEntry = async () => {
        if (entryId) await fetch(`/api/entries/${entryId}`, { method: 'DELETE' });
        router.push('/diary');
    };

    const duplicate = async () => {
        const id = await save();
        if (!id) return;
        const response = await fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...buildEntryPayload({ ...values, hasVoice, language }), title: `${values.title || 'Untitled entry'} (copy)`, tags: values.tags, content: values.html }) });
        const result = await response.json() as { id?: string };
        if (result.id) router.push(`/entry/${result.id}`);
    };

    const text = htmlToText(values.html);
    const mood = getMood(values.mood);

    return <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
            <Link href="/diary" className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><ArrowLeft className="h-4 w-4" />My diary</Link>
            <div className="flex items-center gap-1">
                <span className="mr-1 flex items-center gap-1 text-[11px] text-muted-foreground">{status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}{status === 'saved' && <Check className="h-3 w-3 text-pen-deep" />}{status === 'offline' && <CloudOff className="h-3 w-3" />}{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'offline' ? 'Offline changes' : status === 'error' ? 'Not saved' : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => void save()} className="text-[12px] text-muted-foreground">Save</Button>
                <DropdownMenu><DropdownMenuTrigger aria-label="Entry actions" className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => { setPinned((value) => !value); setTouched(true); }}><Pin className="mr-2 h-3.5 w-3.5" />{pinned ? 'Unpin entry' : 'Pin entry'}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setArchived((value) => !value); setTouched(true); }}><Archive className="mr-2 h-3.5 w-3.5" />{archived ? 'Unarchive' : 'Archive'}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void duplicate()}><Copy className="mr-2 h-3.5 w-3.5" />Duplicate</DropdownMenuItem><DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" />Delete entry</DropdownMenuItem>
                </DropdownMenuContent></DropdownMenu>
            </div>
        </div>
        <input value={values.title} onChange={(event) => update({ title: event.target.value })} placeholder="Give this moment a title" className="w-full bg-transparent font-heading text-[26px] font-semibold leading-tight outline-none placeholder:text-muted-foreground/50 sm:text-[30px]" />
        <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => setDetailsOpen((open) => !open)} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground">{formatEntryDate(values.entryDate, 'ddd, D MMM YYYY')} · {values.entryTime}<ChevronDown className={`h-3 w-3 ${detailsOpen ? 'rotate-180' : ''}`} /></button>{mood && <span className={`flex items-center gap-1 text-[12px] font-medium ${mood.tone}`}><mood.Icon className="h-3.5 w-3.5" />{mood.label}</span>}<Button type="button" size="sm" onClick={() => setVoiceOpen(true)} className="ml-auto gap-1.5 rounded-full bg-primary/10 text-primary" variant="ghost"><Mic className="h-4 w-4" />Speak</Button></div>
        {detailsOpen && <div className="mt-4"><EntryMetaPanel values={values} onChange={(next) => { setValues(next); setTouched(true); }} /></div>}
        <div className="mt-4"><RichEditor ref={editorRef} value={values.html} onChange={(html) => update({ html })} /></div>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground"><span>{countWords(text)} {countWords(text) === 1 ? 'word' : 'words'} · {text.length} characters</span><span>{hasVoice ? 'Spoken entry' : ''}{language ? ` · ${language}` : ''}</span></div>
        {entryId ? <PhotoAttachments entryId={entryId} photos={photos} onChange={setPhotos} /> : <p className="mt-7 border-t border-border/70 pt-5 text-xs text-muted-foreground">Save this entry before adding photos.</p>}
        <VoiceRecorder open={voiceOpen} onOpenChange={setVoiceOpen} onInsert={(value, mode) => { editorRef.current?.insertText(value, mode); setHasVoice(true); setTouched(true); }} onSaved={saveVoice} canReplace={() => Boolean(editorRef.current?.hasSelection())} />
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this entry?</AlertDialogTitle><AlertDialogDescription>This removes the words, photos and voice notes in this entry. It cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={() => void removeEntry()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>;
}
