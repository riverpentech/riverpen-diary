'use client';

import { Lock, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import MoodPicker from '@/components/entry/MoodPicker';
import TagPicker from '@/components/entry/TagPicker';

export interface EntryMetaValues {
    title: string;
    html: string;
    entryDate: string;
    entryTime: string;
    mood: string;
    tags: string[];
    location: string;
    isPrivate: boolean;
}

interface EntryMetaPanelProps {
    values: EntryMetaValues;
    onChange: (values: EntryMetaValues) => void;
}

export default function EntryMetaPanel({ values, onChange }: EntryMetaPanelProps) {
    const set = (patch: Partial<EntryMetaValues>) => onChange({ ...values, ...patch });

    return (
        <div className="space-y-5 rounded-2xl border border-border/80 bg-card/60 px-5 py-4">
            <div className="flex flex-wrap items-end gap-4">
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Date
                    <input type="date" value={values.entryDate} onChange={(event) => set({ entryDate: event.target.value })} className="mt-1.5 block rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/50" />
                </label>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Time
                    <input type="time" value={values.entryTime} onChange={(event) => set({ entryTime: event.target.value })} className="mt-1.5 block rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/50" />
                </label>
                <label className="min-w-[180px] flex-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Location
                    <span className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <input value={values.location} onChange={(event) => set({ location: event.target.value })} placeholder="Where were you?" className="w-full bg-transparent text-[13px] normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground/70" />
                    </span>
                </label>
            </div>
            <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Mood</p>
                <MoodPicker value={values.mood} onChange={(mood) => set({ mood })} compact />
            </div>
            <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Tags</p>
                <TagPicker value={values.tags} onChange={(tags) => set({ tags })} />
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-3">
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground"><Lock className="h-3.5 w-3.5" />Private entry — only visible to you</span>
                <Switch checked={values.isPrivate} onCheckedChange={(isPrivate) => set({ isPrivate })} />
            </div>
        </div>
    );
}
