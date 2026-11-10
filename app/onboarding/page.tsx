'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePreferences } from '@/constants';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, prefs, isLoading, updatePrefs } = usePreferences();
    const [remindersChoice, setRemindersChoice] = useState<boolean | null>(null);
    const [reminderTimeChoice, setReminderTimeChoice] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const reminders = remindersChoice ?? prefs.reminders;
    const reminderTime = reminderTimeChoice ?? prefs.reminder_time ?? '19:00';

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace('/signin');
            return;
        }
        if (prefs.onboarding_complete) {
            router.replace('/');
            return;
        }
    }, [isLoading, prefs.onboarding_complete, router, user]);

    const finishOnboarding = async (enableReminders: boolean) => {
        setSaving(true);
        await updatePrefs({
            reminders: enableReminders,
            reminder_time: reminderTime,
            onboarding_complete: true,
        });
        router.replace('/');
    };

    if (isLoading || !user || prefs.onboarding_complete) {
        return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Preparing your diary…</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg2 px-4 py-10">
            <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-pen-deep">A quieter place to reflect</p>
                <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Make RiverPen yours</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    You can change these choices later in your preferences.
                </p>

                <div className="mt-8 rounded-2xl border border-border p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={reminders}
                            onChange={(event) => setRemindersChoice(event.target.checked)}
                            className="mt-1 h-4 w-4 accent-primary"
                        />
                        <span>
                            <span className="block text-sm font-medium">A gentle daily reminder</span>
                            <span className="mt-1 block text-xs text-muted-foreground">A small nudge if you have not written today.</span>
                        </span>
                    </label>
                    {reminders && (
                        <label className="mt-4 flex items-center justify-between gap-4 text-sm">
                            Reminder time
                            <input
                                type="time"
                                value={reminderTime}
                                onChange={(event) => setReminderTimeChoice(event.target.value)}
                                className="rounded-lg border border-border bg-background px-3 py-2"
                            />
                        </label>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => finishOnboarding(reminders)}
                    disabled={saving}
                    className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Continue to my diary'}
                </button>
                <button
                    type="button"
                    onClick={() => finishOnboarding(false)}
                    disabled={saving}
                    className="mt-3 w-full rounded-xl px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                >
                    Skip reminders
                </button>
            </section>
        </div>
    );
}
