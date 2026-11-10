'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { Loader2 } from 'lucide-react';
import MonthGrid from '@/components/calendar/MonthGrid';
import { countEntriesByLocalDate, getDiaryDateRanges, type HomeDiaryEntry } from '@/lib/homeData';
import { formatEntryDate, previewOf } from '@/lib/entryUtils';
import { useLocalDateTime } from '@/lib/useLocalDateTime';

interface CalendarResponse {
    monthEntries: HomeDiaryEntry[];
    error?: string;
}

interface CalendarResult {
    requestKey: string;
    entries?: HomeDiaryEntry[];
    error?: string;
}

const EMPTY_ENTRIES: HomeDiaryEntry[] = [];

function parseInitialDate(value: string): moment.Moment | null {
    if (!value) return null;
    const parsed = moment(value, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed : null;
}

export default function CalendarView({ initialDate }: { initialDate: string }) {
    const router = useRouter();
    const now = useLocalDateTime();
    const today = now?.format('YYYY-MM-DD') || '';
    const [selectedCursor, setSelectedCursor] = useState<moment.Moment | null>(() => parseInitialDate(initialDate));
    const cursor = selectedCursor || (today ? moment(today, 'YYYY-MM-DD', true) : null);
    const [selectedDateValue, setSelectedDateValue] = useState(() => {
        return parseInitialDate(initialDate)?.format('YYYY-MM-DD') || '';
    });
    const selectedDate = selectedDateValue || today;
    const monthKey = cursor?.format('YYYY-MM') || '';
    const requestKey = `${monthKey}:${today}`;
    const [calendarResult, setCalendarResult] = useState<CalendarResult | null>(null);
    const activeResult = calendarResult?.requestKey === requestKey ? calendarResult : null;
    const entries = activeResult?.entries || EMPTY_ENTRIES;
    const counts = countEntriesByLocalDate(entries);
    const loading = Boolean(!cursor || !today || !activeResult);
    const error = activeResult?.error || '';

    useEffect(() => {
        if (!monthKey || !today) return;
        const controller = new AbortController();
        const monthCursor = moment(monthKey, 'YYYY-MM', true);
        const query = new URLSearchParams(getDiaryDateRanges(monthCursor, moment(today, 'YYYY-MM-DD', true)));

        fetch(`/api/entries?${query}`, { cache: 'no-store', signal: controller.signal })
            .then(async (response) => {
                const result = await response.json() as CalendarResponse;
                if (controller.signal.aborted) return;
                if (!response.ok) throw new Error(result.error || 'Unable to load this month.');
                setCalendarResult({ requestKey, entries: result.monthEntries || [] });
            })
            .catch((fetchError: unknown) => {
                if (controller.signal.aborted) return;
                setCalendarResult({
                    requestKey,
                    error: fetchError instanceof Error ? fetchError.message : 'Unable to load this month.',
                });
            });

        return () => controller.abort();
    }, [monthKey, requestKey, today]);

    const selectedEntries = useMemo(
        () => entries.filter((entry) => moment(entry.entryDate).format('YYYY-MM-DD') === selectedDate),
        [entries, selectedDate],
    );

    const selectDate = (date: string) => {
        setSelectedDateValue(date);
        const dateMoment = moment(date, 'YYYY-MM-DD', true);
        if (dateMoment.isValid() && (!cursor || !dateMoment.isSame(cursor, 'month'))) setSelectedCursor(dateMoment);
        router.replace(`/calendar?date=${date}`, { scroll: false });
    };

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Look back</p>
                <h1 className="mt-2 font-heading text-3xl font-semibold">Calendar</h1>
            </div>

            <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
                <section className="h-fit rounded-2xl border border-border/80 bg-card/60 p-4">
                    <MonthGrid
                        cursor={cursor}
                        today={today}
                        entriesByDate={counts}
                        selectedDate={selectedDate}
                        onSelect={selectDate}
                        onPrev={() => setSelectedCursor((value) => (value || moment(today, 'YYYY-MM-DD')).clone().subtract(1, 'month'))}
                        onNext={() => setSelectedCursor((value) => (value || moment(today, 'YYYY-MM-DD')).clone().add(1, 'month'))}
                    />
                    <Link href="/entry/new" className="mt-4 block rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                        Write an entry
                    </Link>
                </section>

                <section className="min-w-0">
                    <h2 className="font-heading text-lg font-semibold">{selectedDate ? formatEntryDate(selectedDate, 'dddd, D MMMM YYYY') : 'Selected day'}</h2>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : error ? (
                        <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>
                    ) : selectedEntries.length ? (
                        <div className="mt-4 space-y-3">
                            {selectedEntries.map((entry) => (
                                <Link key={entry.id} href={`/entry/${entry.id}`} className="block rounded-2xl border border-border bg-card p-5 transition hover:border-pen/50">
                                    <h3 className="font-heading font-semibold">{entry.title || 'Untitled'}</h3>
                                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{previewOf(entry.contentText || entry.content || '') || 'No text saved.'}</p>
                                    {entry.mood && <span className="mt-3 inline-block rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground">{entry.mood}</span>}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                            <p className="text-sm text-muted-foreground">No entries for this day yet.</p>
                            <Link href="/entry/new" className="mt-3 inline-block text-sm font-medium text-pen-deep hover:underline">Write about this day</Link>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
