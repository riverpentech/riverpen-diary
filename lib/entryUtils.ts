import moment from 'moment';

const DIARY_TIME_ZONE = 'Africa/Nairobi';

function kenyaParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: DIARY_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])) as Record<string, string>;
}

export function diaryDateParts(date: string | Date) {
    const value = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date);
    const parts = kenyaParts(value);
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function greeting(name?: string, now: moment.Moment = moment()): string {
    const hour = now.hour();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
        timeGreeting = 'Good afternoon';
    } else if (hour >= 17) {
        timeGreeting = 'Good evening';
    }

    if (name) {
        return `${timeGreeting}, ${name}`;
    }
    return timeGreeting;
}

export function todayISO(): string {
    return diaryDateParts(new Date()).date;
}

export function previewOf(content: string, maxLength: number = 160): string {
    if (!content) return '';
    // Strip basic HTML/Markdown tags if any
    const plain = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (plain.length <= maxLength) return plain;
    return plain.slice(0, maxLength) + '...';
}

export function formatEntryDate(date: string | Date | moment.Moment, format = 'D MMM YYYY'): string {
    const value = moment.isMoment(date) ? date.toDate() : typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date);
    const parts = kenyaParts(value);
    return moment.utc(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`).format(format);
}

export function htmlToText(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function countWords(text: string): number {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function nowTime(): string {
    return diaryDateParts(new Date()).time;
}

export interface EntryPayloadInput {
    title: string;
    html: string;
    entryDate: string;
    entryTime: string;
    mood: string;
    tags: string[];
    location: string;
    hasVoice: boolean;
    language: string;
}

export function buildEntryPayload(values: EntryPayloadInput) {
    const contentText = htmlToText(values.html);
    const content = contentText ? values.html.trim() : null;
    return {
        title: values.title.trim() || null,
        content,
        contentText: contentText || null,
        mood: values.mood || null,
        location: values.location.trim() || null,
        entryDate: values.entryDate && values.entryTime
            ? new Date(`${values.entryDate}T${values.entryTime}:00+03:00`).toISOString()
            : undefined,
        tags: values.tags,
        hasVoice: values.hasVoice,
        language: values.language || 'en',
    };
}
