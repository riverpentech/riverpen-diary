import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import EntryEditorClient from '@/components/entry/EntryEditorClient';

interface NewEntryPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const instant = false;

function first(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function NewEntryPage({ searchParams }: NewEntryPageProps) {
    const params = await searchParams;
    return <Suspense fallback={<div className="flex min-h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
        <EntryEditorClient initialPrompt={first(params.prompt)} initialMood={first(params.mood)} initialVoiceMode={first(params.voice) === '1'} />
    </Suspense>;
}
