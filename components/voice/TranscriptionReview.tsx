'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TranscriptionReviewProps {
    result?: { text?: string; language?: string; uncertainWords?: string[] };
    initialText?: string;
    audioUrl?: string;
    onRetry?: () => void;
    onRecordMore?: () => void;
    onInsert: (text: string, mode: 'append' | 'cursor' | 'replace') => void;
    onDiscard: () => void;
    hasContent: boolean;
    hasSelection: boolean;
}

export default function TranscriptionReview({ result, initialText = '', audioUrl, onRetry, onRecordMore, onInsert, onDiscard, hasContent, hasSelection }: TranscriptionReviewProps) {
    const [text, setText] = useState(result?.text || initialText);
    return <div className="space-y-4">
        {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        {result?.language && <p className="text-xs text-muted-foreground">Detected language: {result.language}</p>}
        <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} placeholder="Review or type a transcription before inserting it." />
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => onInsert(text.trim(), 'append')} disabled={!text.trim()}><Check className="mr-2 h-4 w-4" />{hasContent ? 'Append to entry' : 'Insert into diary'}</Button>
            {hasContent && <Button variant="outline" onClick={() => onInsert(text.trim(), 'cursor')} disabled={!text.trim()}>Insert at cursor</Button>}
            {hasSelection && <Button variant="outline" onClick={() => onInsert(text.trim(), 'replace')} disabled={!text.trim()}>Replace selection</Button>}
            {onRecordMore && <Button variant="outline" onClick={onRecordMore}>Record more</Button>}
            {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
            <Button variant="ghost" onClick={onDiscard}><X className="mr-2 h-4 w-4" />Discard</Button>
        </div>
    </div>;
}
