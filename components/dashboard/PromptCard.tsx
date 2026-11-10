'use client';

import React, { useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { FALLBACK_PROMPTS } from '@/constants';

interface PromptCardProps {
    onWrite?: (prompt: string) => void;
}

export default function PromptCard({ onWrite }: PromptCardProps) {
    const [index, setIndex] = useState(0);
    const [hidden, setHidden] = useState(false);

    if (hidden) return null;

    const prompt = FALLBACK_PROMPTS[index % FALLBACK_PROMPTS.length];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-pen/25 bg-pen-soft/70 px-5 py-4">
            <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pen-deep" strokeWidth={1.8} />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-pen-deep">Today&apos;s prompt</p>
                    <p className="mt-1 font-heading text-[15px] font-medium leading-snug text-foreground">{prompt}</p>
                    <div className="mt-3 flex items-center gap-3 text-[12px]">
                        <button
                            type="button"
                            onClick={() => onWrite?.(prompt)}
                            className="font-medium text-river-deep hover:underline dark:text-primary cursor-pointer"
                        >
                            Write about this
                        </button>
                        <button
                            type="button"
                            onClick={() => setIndex((value) => value + 1)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <RefreshCw className="h-3 w-3" /> Another
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setHidden(true)}
                    aria-label="Dismiss prompt"
                    className="text-muted-foreground/70 hover:text-foreground cursor-pointer"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
