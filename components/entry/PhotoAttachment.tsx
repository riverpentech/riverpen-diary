'use client';

import Image from 'next/image';
import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

export interface PhotoAttachmentRecord {
    id: string;
    fileUrl: string;
    fileType: string;
    fileName: string | null;
}

interface PhotoAttachmentsProps {
    entryId: string;
    photos: PhotoAttachmentRecord[];
    onChange?: (photos: PhotoAttachmentRecord[]) => void;
}

export default function PhotoAttachments({ entryId, photos, onChange }: PhotoAttachmentsProps) {
    const urls = Object.fromEntries(photos.map((photo) => [photo.id, photo.fileUrl]));
    const [uploading, setUploading] = useState(false);
    const [viewer, setViewer] = useState<string | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files?.length) return;
        setUploading(true);
        setError('');
        try {
            const created: PhotoAttachmentRecord[] = [];
            for (const file of Array.from(files)) {
                const body = new FormData();
                body.append('entryId', entryId);
                body.append('file', file);
                const response = await fetch('/api/attachments', { method: 'POST', body });
                const result = await response.json() as { attachment?: PhotoAttachmentRecord; error?: string };
                if (!response.ok || !result.attachment) {
                    throw new Error(result.error || 'Unable to upload this image.');
                }
                created.push(result.attachment);
            }
            onChange?.([...photos, ...created]);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload this image.');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const remove = async (photo: PhotoAttachmentRecord) => {
        setError('');
        try {
            const response = await fetch(`/api/attachments?id=${encodeURIComponent(photo.id)}`, { method: 'DELETE' });
            const result = await response.json() as { error?: string };
            if (!response.ok) throw new Error(result.error || 'Unable to remove this image.');
            const next = photos.filter((item) => item.id !== photo.id);
            onChange?.(next);
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : 'Unable to remove this image.');
        }
    };

    return (
        <section className="mt-7 border-t border-border/70 pt-5">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Photos</p>
            <div className="flex flex-wrap items-center gap-2.5">
                {photos.map((photo) => (
                    <div key={photo.id} className="group relative">
                        <button type="button" onClick={() => setViewer(urls[photo.id] || photo.fileUrl)} className="block h-20 w-20 overflow-hidden rounded-xl border border-border">
                            <Image src={urls[photo.id] || photo.fileUrl} alt={photo.fileName || 'Entry photo'} width={80} height={80} className="h-full w-full object-cover" />
                        </button>
                        <button type="button" onClick={() => remove(photo)} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-1 text-background opacity-0 transition group-hover:opacity-100 focus:opacity-100">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" strokeWidth={1.8} />}
                    <span className="text-[10.5px]">{uploading ? 'Adding…' : 'Photo'}</span>
                </button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
            {viewer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setViewer(null)} role="dialog" aria-modal="true">
                    <Image src={viewer} alt="Entry photo" width={1200} height={900} className="max-h-full max-w-full rounded-lg object-contain" />
                    <button type="button" className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white" aria-label="Close photo" onClick={() => setViewer(null)}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </section>
    );
}