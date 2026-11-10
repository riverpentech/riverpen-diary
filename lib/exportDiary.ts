export interface ExportEntry {
    id?: string;
    title?: string | null;
    content?: string | null;
    contentText?: string | null;
    mood?: string | null;
    entryDate?: string;
    tags?: string[];
}

interface ExportRange {
    from: string;
    to: string;
}

function plainContent(entry: ExportEntry): string {
    return entry.contentText || (entry.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function download(content: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function rangeLabel(range: ExportRange | null): string {
    return range ? ` (${range.from} to ${range.to})` : '';
}

export function exportAsJson(entries: ExportEntry[], range: ExportRange | null) {
    download(JSON.stringify({ exportedAt: new Date().toISOString(), range, entries }, null, 2), `rivepen-diary${rangeLabel(range)}.json`, 'application/json');
}

export function exportAsText(entries: ExportEntry[], range: ExportRange | null) {
    const text = entries.map((entry) => [
        entry.title || 'Untitled entry',
        entry.entryDate || '',
        entry.mood ? `Mood: ${entry.mood}` : '',
        entry.tags?.length ? `Tags: ${entry.tags.join(', ')}` : '',
        plainContent(entry),
    ].filter(Boolean).join('\n')).join('\n\n---\n\n');
    download(text, `rivepen-diary${rangeLabel(range)}.txt`, 'text/plain;charset=utf-8');
}

export function exportAsPdf(entries: ExportEntry[], range: ExportRange | null) {
    const text = entries.map((entry) => `${entry.title || 'Untitled entry'}\n${entry.entryDate || ''}\n\n${plainContent(entry)}`).join('\n\n---\n\n');
    download(text, `rivepen-diary${rangeLabel(range)}.pdf`, 'application/pdf');
}
