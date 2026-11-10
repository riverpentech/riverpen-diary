'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, PenLine } from 'lucide-react';
import MonthGrid from '@/components/calendar/MonthGrid';
import EntryCard from '@/components/entry/EntryCard';
import EmptyState from '@/components/EmptyState';

interface CalendarEntry {
    id: string;
    title: string | null;
    content: string | null;
    contentText: string | null;
    mood: string | null;
    entryDate: string;
    hasVoice: boolean;
    hasPhotos: boolean;
    isArchived: boolean;
    isFavorite: boolean;
    tags: string[];
}

type CalendarView = 'month' | 'week' | 'day';

export default function Calendar() {
    const [view, setView] = useState<CalendarView>('month');
    const [cursor, setCursor] = useState<moment.Moment | null>(null);
    const [selected, setSelected] = useState('');
    const [today, setToday] = useState('');
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const current = moment();
        // The current date must be read on the client to avoid unstable prerender data.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCursor(current);
        setSelected(current.format('YYYY-MM-DD'));
        setToday(current.format('YYYY-MM-DD'));
    }, []);

    useEffect(() => {
        if (!cursor) return undefined;
        const start = (view === 'month' ? cursor.clone().startOf('month').startOf('isoWeek') : view === 'week' ? cursor.clone().startOf('isoWeek') : cursor.clone().startOf('day')).toISOString();
        const end = (view === 'month' ? cursor.clone().endOf('month').endOf('isoWeek') : view === 'week' ? cursor.clone().endOf('isoWeek') : cursor.clone().endOf('day')).toISOString();
        const todayStart = moment().startOf('day').toISOString();
        const todayEnd = moment().startOf('day').add(1, 'day').toISOString();
        const controller = new AbortController();
        // Reset loading state before requesting the newly selected range.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        fetch(`/api/entries?monthStart=${encodeURIComponent(start)}&monthEnd=${encodeURIComponent(end)}&todayStart=${encodeURIComponent(todayStart)}&todayEnd=${encodeURIComponent(todayEnd)}`, { cache: 'no-store', signal: controller.signal })
            .then(async (response) => response.ok ? response.json() as Promise<{ monthEntries?: CalendarEntry[] }> : { monthEntries: [] })
            .then((result) => setEntries(result.monthEntries || []))
            .catch((error: unknown) => { if (!controller.signal.aborted) console.error(error); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [cursor, view]);

    const counts = useMemo(() => entries.reduce<Record<string, number>>((accumulator, entry) => {
        const key = moment(entry.entryDate).format('YYYY-MM-DD');
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {}), [entries]);
    const dayEntries = entries.filter((entry) => moment(entry.entryDate).format('YYYY-MM-DD') === selected);
    const shift = (direction: number) => {
        const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
        const next = cursor!.clone().add(direction, unit);
        setCursor(next);
        setSelected(next.format('YYYY-MM-DD'));
    };
    const selectDate = (date: string) => { setSelected(date); setCursor(moment(date, 'YYYY-MM-DD')); };

    return <div>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-[24px] font-semibold">Calendar</h1><p className="mt-1 text-[13px] text-muted-foreground">{view === 'day' ? cursor?.format('dddd, D MMMM YYYY') : cursor?.format('MMMM YYYY')}</p></div>
            <div className="flex items-center gap-2"><div className="flex rounded-lg border border-border p-0.5">{(['month', 'week', 'day'] as CalendarView[]).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded-md px-2.5 py-1.5 text-[12px] capitalize ${view === item ? 'bg-river-soft font-medium text-river-deep' : 'text-muted-foreground'}`}>{item}</button>)}</div><button type="button" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => shift(1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></button><Link href={`/entry/new?date=${selected}`} className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground"><PenLine className="h-3.5 w-3.5" />Write</Link></div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]"><div className="rounded-2xl border border-border/80 bg-card/60 p-4">{loading || !cursor || !today ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : <MonthGrid cursor={cursor!} today={today} entriesByDate={counts} selectedDate={selected} onSelect={selectDate} onPrev={() => shift(-1)} onNext={() => shift(1)} />}</div><div><div className="mb-3 flex items-center justify-between"><h2 className="font-heading text-[15px] font-semibold">{selected ? moment(selected).format('dddd, D MMMM') : 'Calendar'}</h2><Link href={`/entry/new?date=${selected}`} className="text-[12px] text-river-deep">Add entry</Link></div>{dayEntries.length ? <div className="space-y-2.5">{dayEntries.map((entry) => <EntryCard key={entry.id} entry={entry} onEntryUpdated={() => undefined} />)}</div> : <EmptyState icon={CalendarDays} title="A quiet day" description="You can still write about this day — memories often arrive late." />}</div></div>
    </div>;
}
