'use client'

import Link from "next/link";
import {usePathname} from "next/navigation";
import {MOBILE_ITEMS} from "@/constants";
import {Mic} from "lucide-react";

export default function MobileNav() {
    const pathname = usePathname();
    const [left, right] = [MOBILE_ITEMS.slice(0, 2), MOBILE_ITEMS.slice(2)]
    const item = ({ href, label, Icon}: (typeof MOBILE_ITEMS)[number]) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                key={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-colors ${
                    isActive ? 'text-rprimary' : 'text-rslate'
                }`}
            >
                <Icon className="h-4.75 w-4.75 " strokeWidth={1.8} />
                {label}
            </Link>
        );
    }
    return(
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-md items-center px-2 pb-[env(safe-area-inset-bottom)]">
                {left.map(item)}
                <Link
                    href="/entry/new?voice=1"
                    aria-label="Record a voice entry"
                    className="mx-1 -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rprimary shadow-lg shadow-primary/25 transition active:scale-95"
                >
                    <Mic className="h-6 w-6" strokeWidth={1.8}/>
                </Link>
                {right.map(item)}
            </div>
        </nav>
    )
}