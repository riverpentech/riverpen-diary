import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            {Icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
                </div>
            )}
            <h3 className="font-heading text-base font-semibold">{title}</h3>
            {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
            {children && <div className="mt-5">{children}</div>}
        </div>
    );
}