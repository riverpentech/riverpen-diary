'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import MobileNav from '@/components/home/MobileNav';
import Navbar from '@/components/home/Navbar';
import Sidebar from '@/components/home/Sidebar';

function AppShellContent({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isStandalone = pathname === '/signin' || pathname === '/signup' || pathname === '/onboarding';

    return (
        <>
            {!isStandalone && <Sidebar />}
            {!isStandalone && <Navbar />}
            <main
                className={isStandalone
                    ? 'min-h-screen flex-1'
                    : 'min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:ml-62 lg:px-8 lg:py-8 lg:pb-8'}
            >
                {children}
            </main>
            {!isStandalone && <MobileNav />}
        </>
    );
}

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:ml-62 lg:px-8 lg:py-8 lg:pb-8">{children}</main>}>
            <AppShellContent>{children}</AppShellContent>
        </Suspense>
    );
}
