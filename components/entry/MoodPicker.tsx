import React from 'react';
import { MOODS } from '@/constants';

interface MoodPickerProps {
    value?: string;
    onChange: (mood: string) => void;
    compact?: boolean;
}

export default function MoodPicker({ value, onChange, compact = false }: MoodPickerProps) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {MOODS.map(({ value: moodValue, label, Icon, tone, soft }) => {
                const active = value === moodValue;
                return (
                    <button
                        key={moodValue}
                        type="button"
                        aria-pressed={active}
                        title={label}
                        onClick={() => onChange(active ? '' : moodValue)}
                        className={`group flex items-center gap-1.5 rounded-full border transition-all ${
                            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-[13px]'
                        } ${
                            active
                                ? `border-transparent ${soft} ${tone} font-medium ring-1 ring-inset ring-current/20`
                                : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                        }`}
                    >
                        <Icon className={`h-3.5 w-3.5 ${active ? tone : ''}`} strokeWidth={1.9} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}