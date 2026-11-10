'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DEFAULT_TAGS } from '@/constants';

interface TagPickerProps {
    value: string[];
    onChange: (tags: string[]) => void;
}

export default function TagPicker({ value, onChange }: TagPickerProps) {
    const [known, setKnown] = useState<string[]>([]);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        let active = true;
        fetch('/api/entries?view=diary&tab=all', { cache: 'no-store' })
            .then(async (response) => response.ok ? response.json() as Promise<{ knownTags?: string[] }> : { knownTags: [] })
            .then((result) => { if (active) setKnown(result.knownTags || []); })
            .catch(() => undefined);
        return () => { active = false; };
    }, []);

    const add = (name: string) => {
        const clean = name.trim();
        if (!clean || value.some((tag) => tag.toLowerCase() === clean.toLowerCase()) || value.length >= 12) return;
        onChange([...value, clean]);
        setDraft('');
    };

    const suggestions = Array.from(new Set([...known, ...DEFAULT_TAGS])).filter((tag) => !value.includes(tag));

    return (
        <div>
            {value.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{value.map((tag) => <span key={tag} className="flex items-center gap-1 rounded-full bg-river-soft px-2.5 py-1 text-xs font-medium text-river-deep">{tag}<button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}><X className="h-3 w-3" /></button></span>)}</div>}
            <div className="flex items-center gap-2">
                <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(draft); } }} placeholder="Add a tag…" className="w-36 rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-primary/50" />
                {draft.trim() && <button type="button" onClick={() => add(draft)} aria-label="Add tag"><Plus className="h-3.5 w-3.5" /></button>}
                <div className="flex flex-wrap gap-1">{suggestions.slice(0, 6).map((tag) => <button key={tag} type="button" onClick={() => add(tag)} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{tag}</button>)}</div>
            </div>
        </div>
    );
}
