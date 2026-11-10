'use client';

import React from 'react';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface MonthGridProps {
    cursor?: moment.Moment | null;
    today: string;
    entriesByDate?: Record<string, number>;
    selectedDate?: string;
    onSelect?: (date: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
    compact?: boolean;
}

export default function MonthGrid({
    cursor,
    today,
    entriesByDate = {},
    selectedDate,
    onSelect,
    onPrev,
    onNext,
    compact = false,
}: MonthGridProps) {
    if (!cursor) {
        return (
            <div className="flex min-h-56 items-center justify-center" role="status" aria-label="Loading calendar">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const currentCursor = cursor.clone();
    const monthStart = currentCursor.clone().startOf('month');
    const gridStart = monthStart.clone().startOf('isoWeek');
    const days = Array.from({ length: 42 }, (_, index) => gridStart.clone().add(index, 'days'));
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <p className="font-heading text-sm font-semibold">{currentCursor.format('MMMM YYYY')}</p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onPrev}
                        aria-label="Previous month"
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        aria-label="Next month"
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day, index) => (
                    <div key={`${day}-${index}`} className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                        {day}
                    </div>
                ))}

                {days.map((day) => {
                    const key = day.format('YYYY-MM-DD');
                    const inMonth = day.month() === currentCursor.month();
                    const count = entriesByDate[key] || 0;
                    const isSelected = selectedDate === key;
                    const isToday = key === today;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelect?.(key)}
                            className={`relative flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                compact ? 'h-9 text-[12px]' : 'h-11 text-[13px]'
                            } ${isSelected
                                ? 'bg-primary font-medium text-primary-foreground'
                                : inMonth
                                    ? 'text-foreground hover:bg-muted'
                                    : 'text-muted-foreground/35 hover:bg-muted/50'} ${
                                isToday && !isSelected ? 'ring-1 ring-inset ring-primary/40' : ''
                            }`}
                        >
                            {day.date()}
                            {count > 0 && (
                                <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-pen'}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
