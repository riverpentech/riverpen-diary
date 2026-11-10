import moment, { type Moment } from 'moment';

export interface DiaryDateEntry {
    entryDate: string | Date;
}

export interface HomeDiaryEntry extends DiaryDateEntry {
    id: string;
    title: string | null;
    content: string | null;
    contentText: string | null;
    mood: string | null;
}

export interface HomeVoiceEntry extends HomeDiaryEntry {
    language: string | null;
    voiceRecordings: {
        durationSeconds: number | null;
        detectedLanguage: string | null;
    }[];
}

export function getDiaryDateRanges(cursor: Moment, now: Moment = moment()) {
    const monthStart = cursor.clone().startOf('month');
    const todayStart = now.clone().startOf('day');

    return {
        monthStart: monthStart.toISOString(),
        monthEnd: monthStart.clone().add(1, 'month').toISOString(),
        todayStart: todayStart.toISOString(),
        todayEnd: todayStart.clone().add(1, 'day').toISOString(),
    };
}

export function countEntriesByLocalDate(entries: DiaryDateEntry[]): Record<string, number> {
    return entries.reduce<Record<string, number>>((counts, entry) => {
        const date = moment(entry.entryDate).format('YYYY-MM-DD');
        counts[date] = (counts[date] || 0) + 1;
        return counts;
    }, {});
}

export function shouldShowReminder(
    remindersEnabled: boolean,
    hasEntryToday: boolean | null,
    reminderTime: string,
    now: Moment = moment(),
): boolean {
    if (!remindersEnabled || hasEntryToday !== false) return false;

    const dueAt = moment(`${now.format('YYYY-MM-DD')} ${reminderTime}`, 'YYYY-MM-DD HH:mm', true);
    return dueAt.isValid() && now.isSameOrAfter(dueAt, 'minute');
}
