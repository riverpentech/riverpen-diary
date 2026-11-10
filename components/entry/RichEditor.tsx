'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, type ComponentProps, type ComponentType, type RefAttributes } from 'react';
import dynamic from 'next/dynamic';
import type ReactQuillType from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as ComponentType<ComponentProps<typeof ReactQuillType> & RefAttributes<ReactQuillType>>;

export interface RichEditorHandle {
    insertText: (text: string, mode?: 'append' | 'cursor' | 'replace') => void;
    hasSelection: () => boolean;
    focus: () => void;
}

interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const MODULES = { toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link'], ['clean']] };
const FORMATS = ['header', 'bold', 'italic', 'underline', 'list', 'blockquote', 'link'];
interface SelectionRange { index: number; length: number }

const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor({ value, onChange, placeholder }, ref) {
    const quillRef = useRef<ReactQuillType>(null);
    const lastRangeRef = useRef<SelectionRange | null>(null);

    useEffect(() => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return undefined;
        const handler = (range: SelectionRange | null) => { if (range) lastRangeRef.current = range; };
        editor.on('selection-change', handler);
        return () => { editor.off('selection-change', handler); };
    }, []);

    useImperativeHandle(ref, () => ({
        insertText(text, mode = 'append') {
            const editor = quillRef.current?.getEditor();
            if (!editor) return;
            const current = editor.getSelection() || lastRangeRef.current;
            if (mode === 'replace' && current && current.length > 0) {
                editor.deleteText(current.index, current.length, 'user');
                editor.insertText(current.index, text, 'user');
                editor.setSelection(current.index + text.length, 0);
            } else {
                const index = mode === 'cursor' && current ? current.index : editor.getLength() - 1;
                const payload = `${mode === 'append' ? '\n\n' : ''}${text}\n`;
                editor.insertText(Math.max(0, index), payload, 'user');
                editor.setSelection(index + payload.length, 0);
            }
            onChange(editor.root.innerHTML);
            editor.focus();
        },
        hasSelection: () => {
            const range = quillRef.current?.getEditor().getSelection() || lastRangeRef.current;
            return Boolean(range && range.length > 0);
        },
        focus: () => quillRef.current?.getEditor().focus(),
    }));

    return <div className="rp-editor"><ReactQuill ref={quillRef} theme="snow" value={value} onChange={onChange} modules={MODULES} formats={FORMATS} placeholder={placeholder || 'Start writing, or speak and let RiverPen write for you…'} /></div>;
});

export default RichEditor;
