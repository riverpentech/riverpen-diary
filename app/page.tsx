'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { PenLine, Mic, BookOpen, Loader2 } from 'lucide-react';
import PromptCard from '@/components/dashboard/PromptCard';
import MoodPicker from '@/components/entry/MoodPicker';
import MonthGrid from '@/components/calendar/MonthGrid';
import VoiceHighlights from '@/components/dashboard/VoiceHIghlights';
import { usePreferences } from '@/constants';
import { formatEntryDate, greeting, previewOf } from '@/lib/entryUtils';
import { countEntriesByLocalDate, getDiaryDateRanges, shouldShowReminder, type HomeDiaryEntry, type HomeVoiceEntry } from '@/lib/homeData';
import { useLocalDateTime } from '@/lib/useLocalDateTime';

interface HomeDataResponse {
    recentEntries: HomeDiaryEntry[];
    monthEntries: { entryDate: string }[];
    hasEntryToday: boolean;
    voiceEntries: HomeVoiceEntry[];
    error?: string;
}

type HomeResult =
    | { requestKey: string; data: HomeDataResponse }
    | { requestKey: string; error: string };

export default function Home() {
    const { user, prefs, isLoading: prefsLoading } = usePreferences();
    const router = useRouter();
    const now = useLocalDateTime();
    const todayKey = now?.format('YYYY-MM-DD') || '';
    const [selectedCursor, setSelectedCursor] = useState<moment.Moment | null>(null);
    const cursor = selectedCursor || now?.clone() || null;
    const monthKey = cursor?.format('YYYY-MM') || '';
    const requestKey = `${monthKey}:${todayKey}`;
    const [homeResult, setHomeResult] = useState<HomeResult | null>(null);
    const activeResult = homeResult?.requestKey === requestKey ? homeResult : null;
    const data = activeResult && 'data' in activeResult ? activeResult.data : undefined;
    const loadError = activeResult && 'error' in activeResult ? activeResult.error : '';
    const recent = data?.recentEntries || [];
    const voiceEntries = data?.voiceEntries || [];
    const monthCounts = countEntriesByLocalDate(data?.monthEntries || []);
    const hasEntryToday = data?.hasEntryToday ?? null;
    const loading = prefsLoading || Boolean(user && (!requestKey || !activeResult));

    useEffect(() => {
        if (!prefsLoading && user && !prefs.onboarding_complete) {
            router.replace('/onboarding');
        }
    }, [prefsLoading, prefs.onboarding_complete, router, user]);

    useEffect(() => {
        if (!monthKey || !todayKey || prefsLoading || !user) return;

        const controller = new AbortController();
        const localToday = moment(todayKey, 'YYYY-MM-DD', true);
        const monthCursor = moment(monthKey, 'YYYY-MM', true);
        const query = new URLSearchParams(getDiaryDateRanges(monthCursor, localToday));
        fetch(`/api/entries?${query}`, { cache: 'no-store', signal: controller.signal })
            .then(async (response) => {
                const result = await response.json() as HomeDataResponse;
                if (controller.signal.aborted) return;
                if (!response.ok) throw new Error(result.error || 'Unable to load your diary.');
                setHomeResult({ requestKey, data: result });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setHomeResult({
                    requestKey,
                    error: error instanceof Error ? error.message : 'Unable to load your diary.',
                });
            });

        return () => controller.abort();
    }, [monthKey, prefsLoading, requestKey, todayKey, user]);

    const firstName = (user?.name || user?.email || '').split(' ')[0];

    const showReminder = Boolean(now && !loading && !loadError && shouldShowReminder(
        prefs.reminders,
        hasEntryToday,
        prefs.reminder_time || '19:00',
        now,
    ));

    return (
        <div className="mx-auto w-full max-w-7xl min-w-0 space-y-10">
            {showReminder && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pen/30 bg-pen-soft px-4 py-3 text-[12.5px] text-pen-deep">
                    <span>You haven&apos;t written today. A few sentences are enough.</span>
                    <Link href="/entry/new" className="font-medium underline underline-offset-2">
                        Write now
                    </Link>
                </div>
            )}

            <section>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {now?.format('dddd, D MMMM YYYY') || 'Today'}
                </p>
                <h1 className="mt-2 max-w-xl font-heading text-[26px] font-semibold leading-[1.2] tracking-tight sm:text-[32px]">
                    {now ? greeting(firstName, now) : `Good morning${firstName ? `, ${firstName}` : ''}`}. What would you like to remember about today?
                </h1>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                        href="/entry/new"
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99]"
                    >
                        <PenLine className="h-4 w-4" strokeWidth={1.9} />
                        Write an entry
                    </Link>
                    <Link
                        href="/entry/new?voice=1"
                        className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium transition hover:border-pen/50 hover:text-pen-deep"
                    >
                        <span className="relative flex h-4 w-4 items-center justify-center">
                            <Mic className="h-4 w-4" strokeWidth={1.9} />
                        </span>
                        Speak instead
                    </Link>
                </div>
            </section>

            <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
                <div className="min-w-0 space-y-6">
                    <PromptCard
                        onWrite={(prompt) =>
                            router.push(`/entry/new?prompt=${encodeURIComponent(prompt)}`)
                        }
                    />

                    <div>
                        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            How are you feeling right now?
                        </p>
                        <MoodPicker
                            value=""
                            onChange={(mood) =>
                                mood && router.push(`/entry/new?mood=${encodeURIComponent(mood)}`)
                            }
                            compact
                        />
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-heading text-[15px] font-semibold">Recent entries</h2>
                            <Link
                                href="/diary"
                                className="text-[12px] text-muted-foreground transition hover:text-foreground"
                            >
                                See all
                            </Link>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : loadError ? (
                            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                {loadError}
                            </p>
                        ) : recent.length ? (
                            <div className="space-y-2.5">
                                {recent.map((entry) => (
                                    <Link key={entry.id} href={`/entry/${entry.id}`} className="block rounded-2xl border border-border p-4 transition hover:border-pen/50">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate font-medium">{entry.title || 'Untitled'}</p>
                                            <span className="shrink-0 text-xs text-muted-foreground">{formatEntryDate(entry.entryDate)}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                            {previewOf(entry.contentText || entry.content || '') || 'No text saved.'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                                <BookOpen className="mx-auto h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
                                <p className="mt-3 font-heading text-[15px] font-medium">
                                    Your diary is waiting for its first page.
                                </p>
                                <p className="mt-1 text-[13px] text-muted-foreground">
                                    Start with one sentence about today — or just speak.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="min-w-0 rounded-2xl border border-border/80 bg-card/60 p-4">
                    <MonthGrid
                        compact
                        cursor={cursor}
                        today={todayKey}
                        entriesByDate={monthCounts}
                        onSelect={(date) => router.push(`/calendar?date=${date}`)}
                        onPrev={() => setSelectedCursor((value) => (value || now?.clone() || moment()).subtract(1, 'month'))}
                        onNext={() => setSelectedCursor((value) => (value || now?.clone() || moment()).add(1, 'month'))}
                    />
                    <Link
                        href="/calendar"
                        className="mt-3 block rounded-lg border border-border/80 py-2 text-center text-[12px] text-muted-foreground transition hover:text-foreground"
                    >
                        Open calendar
                    </Link>
                </aside>
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-heading text-[15px] font-semibold">
                        <Mic className="h-4 w-4 text-pen-deep" strokeWidth={1.9} />
                        Recent voice entries
                    </h2>
                    <Link
                        href="/entry/new?voice=1"
                        className="text-[12px] text-muted-foreground transition hover:text-foreground"
                    >
                        Record a note
                    </Link>
                </div>
                <VoiceHighlights entries={voiceEntries} isLoading={loading} error={loadError} />
            </section>
        </div>
    );
}
