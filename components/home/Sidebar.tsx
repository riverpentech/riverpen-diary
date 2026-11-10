'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, PenLine, Sun, LogOut } from "lucide-react";
import { useAuth } from "@riverpen/auth";
import { NAV_ITEMS, usePreferences } from "@/constants";

const Sidebar = () => {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const { user, prefs, updatePrefs } = usePreferences();
    const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : prefs.theme === 'dark';
    const firstName = (user?.name || user?.email || '').split(' ')[0];

    const toggleTheme = () => {
        const dark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : prefs.theme === 'dark';
        updatePrefs({ theme: dark ? 'light' : 'dark' });
    };

    const handleLogout = async () => {
        await signOut();
    };

    return(
        <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 w-62 border-r border-border/70 bg-card px-5 py-6">
            <Link href="/">
                <h1 className="text-2xl font-semibold tracking-tight text-rprimary">
                    RiverPen
                    <span className="text-ramber"> Diary</span>
                </h1>
            </Link>
            <Link href="/entry/new" className="flex items-center justify-center gap-2 mt-8 px-4 py-3 text-sm font-medium text-rprimary shadow-sm transition hover:bg-rprimary/90 hover:text-ramber active:scale-[0.99]">
                <PenLine className="h-4 w-4" />
                New entry
            </Link>

            <nav>
                {NAV_ITEMS.map(({ href, label, Icon }) => {
                    const isActive = href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`) === true;
                    return (
                        <Link
                            href={href}
                            key={href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                isActive 
                                ? 'bg-muted font-medium text-robsidian dark:text-rprimary'
                                    : 'text-rslate hover:bg-rslate/70 hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-4.5 w-4.5" strokeWidth={1.8}/>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-6 border-t border-border/70 pt-4">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rslate transition-colors hover:bg-rslate/70 hover:text-foreground cursor-pointer"
                    >
                    {isDark ? <Sun className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.8} />}
                    {isDark ? 'Light' : 'Dark'}
                </button>

                <div className="mt-4 flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rprimary/10 font-heading text-sm font-semibold text-rprimary">
                            {(firstName || 'R').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{user?.name || 'Your diary'}</p>
                            <p className="truncate text-xs text-rslate">Private to you</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        aria-label="Log out"
                        title="Log out"
                        className="rounded-lg p-2 text-rslate transition-colors hover:bg-rslate/20 hover:text-foreground cursor-pointer"
                    >
                        <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;