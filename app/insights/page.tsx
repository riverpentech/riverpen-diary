'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import { Loader2, Flame, BookOpen, CalendarDays, Tag } from 'lucide-react';
import { MOODS } from '@/constants';

interface InsightEntry {
    entryDate: string;
    mood: string | null;
    hasVoice: boolean;
    tags: string[];
}

interface InsightsResponse {
    entries?: InsightEntry[];
    total?: number;
    error?: string;
}

function dayKey(value: string): string {
    return moment(value).format('YYYY-MM-DD');
}

function streaksFrom(dates: string[]): { current: number; longest: number } {
    const unique = Array.from(new Set(dates)).sort();
    if (!unique.length) return { current: 0, longest: 0 };

    let longest = 1;
    let run = 1;
    for (let index = 1; index < unique.length; index += 1) {
        const difference = moment(unique[index]).diff(moment(unique[index - 1]), 'days');
        run = difference === 1 ? run + 1 : 1;
        longest = Math.max(longest, run);
    }

    const knownDates = new Set(unique);
    let current = 0;
    let cursor = moment();
    if (!knownDates.has(cursor.format('YYYY-MM-DD'))) cursor = cursor.subtract(1, 'day');
    while (knownDates.has(cursor.format('YYYY-MM-DD'))) {
        current += 1;
        cursor = cursor.subtract(1, 'day');
    }
    return { current, longest };
}

export default function Insights() {
    const [entries, setEntries] = useState<InsightEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        fetch('/api/entries?view=insights', { cache: 'no-store' })
            .then(async (response) => {
                const result = await response.json() as InsightsResponse;
                if (!response.ok) throw new Error(result.error || 'Unable to load diary insights.');
                return result;
            })
            .then((result) => {
                if (!active) return;
                setEntries(result.entries || []);
                setTotal(result.total || 0);
            })
            .catch(() => {
                if (active) {
                    setEntries([]);
                    setTotal(0);
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    if (loading) {
        return <div className="flex justify-center py-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
    }

    const dates = entries.map((entry) => dayKey(entry.entryDate));
    const { current, longest } = streaksFrom(dates);
    const thisMonth = entries.filter((entry) => moment(entry.entryDate).isSame(moment(), 'month')).length;
    const tagCounts: Record<string, number> = {};
    entries.forEach((entry) => entry.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const moodCounts = MOODS.map((mood) => ({
        ...mood,
        count: entries.filter((entry) => entry.mood === mood.value).length,
    })).filter((mood) => mood.count > 0);
    const maxMood = Math.max(1, ...moodCounts.map((mood) => mood.count));
    const stats = [
        { label: 'Entries written', value: total, Icon: BookOpen },
        { label: 'This month', value: thisMonth, Icon: CalendarDays },
        { label: 'Current streak', value: `${current} ${current === 1 ? 'day' : 'days'}`, Icon: Flame },
        { label: 'Longest streak', value: `${longest} ${longest === 1 ? 'day' : 'days'}`, Icon: Flame },
    ];

    return (
        <div>
            <h1 className="font-heading text-[24px] font-semibold tracking-tight">Insights</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">A quiet look back at your writing — never a judgement.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(({ label, value, Icon }) => <div key={label} className="rounded-2xl border border-border/80 bg-card/60 px-4 py-4"><Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} /><p className="mt-3 font-heading text-[22px] font-semibold leading-none">{value}</p><p className="mt-1.5 text-[11.5px] text-muted-foreground">{label}</p></div>)}
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-border/80 bg-card/60 px-5 py-5">
                    <h2 className="font-heading text-[15px] font-semibold">Moods across your entries</h2>
                    {moodCounts.length ? <div className="mt-4 space-y-2.5">{moodCounts.map((mood) => <div key={mood.value} className="flex items-center gap-3"><mood.Icon className={`h-3.5 w-3.5 shrink-0 ${mood.tone}`} /><span className="w-20 shrink-0 text-[12px] text-muted-foreground">{mood.label}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(mood.count / maxMood) * 100}%`, backgroundColor: mood.solid }} /></div><span className="w-6 text-right text-[11px] tabular-nums text-muted-foreground">{mood.count}</span></div>)}</div> : <p className="mt-3 text-[13px] text-muted-foreground">Add a mood to an entry and it will appear here.</p>}
                </div>
                <div className="rounded-2xl border border-border/80 bg-card/60 px-5 py-5">
                    <h2 className="flex items-center gap-2 font-heading text-[15px] font-semibold"><Tag className="h-4 w-4 text-muted-foreground" />Your themes</h2>
                    {topTags.length ? <div className="mt-4 flex flex-wrap gap-2">{topTags.map(([tag, count]) => <span key={tag} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground">{tag} <span className="text-muted-foreground/60">{count}</span></span>)}</div> : <p className="mt-3 text-[13px] text-muted-foreground">Tag a few entries to see the themes you return to.</p>}
                    <div className="mt-6 border-t border-border/70 pt-4"><p className="text-[12px] leading-relaxed text-muted-foreground">{entries.some((entry) => entry.hasVoice) ? 'Some of these pages began as spoken words — your voice, captured as writing.' : 'Your pages are entirely your own writing.'}</p></div>
                </div>
            </div>
        </div>
    );
}
