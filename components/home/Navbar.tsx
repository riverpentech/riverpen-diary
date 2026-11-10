'use client'

import Link from "next/link";
import Image from "next/image";
import {LineChart, Search, Moon, Sun} from "lucide-react";
import { usePreferences } from "@/constants";

export default function Navbar() {
    const {updatePrefs } = usePreferences()
    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark')
        updatePrefs({theme: isDark ? 'light' : 'dark'})
    }

    return(
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg2/90 px-4 py-3 backdrop-blur lg:hidden">
            <Link href="/" aria-label="R Diary home" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-rprimary">
                <Image src="/diary-logo.png" alt="R Diary" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
                <span>RiverPen<span className="text-ramber"> Diary</span></span>
            </Link>
            <div className="flex items-center gap-1">
                <Link href="/search" aria-label="search" className="rounded-lg p-2 text-rslate hover:text-foreground">
                    <Search className="h-4.5 w-4.5 " strokeWidth={1.8} />
                </Link>
                <Link href="/insights" aria-label="Insights" className="rounded-lg p-2 text-rslate transition hover:text-foreground">
                    <LineChart className="h-4.5 w-4.5" strokeWidth={1.8} />
                </Link>
                <button type="button" onClick={toggleTheme} aria-label="Theme" className="rounded-lg p-2 text-rslate hover:text-foreground">
                    <Moon className="h-4.5 w-4.5 dark:hidden" strokeWidth={1.8} />
                    <Sun className="hidden h-4.5 w-4.5 dark:block" />
                </button>

            </div>
        </header>
    )
}