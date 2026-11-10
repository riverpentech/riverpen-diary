import React from "react";
import Link from "next/link";

interface AuthLayoutProps {
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
    title: string;
    subtitle?: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
}

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 overflow-hidden selection:bg-rprimary/30 selection:text-white">
            {/* Ambient Animated Glows */}
            <div
                className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rprimary/15 blur-[120px] animate-pulse-slow"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rlight/15 blur-[140px] animate-pulse-slow"
                style={{ animationDelay: "3s" }}
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-rprimary/5 blur-[160px]"
                aria-hidden="true"
            />

            <div className="relative w-full max-w-md z-10 transition-all duration-300">
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity mb-6"
                    >
                        <span className="text-rprimary">RiverPen</span>{" "}
                        <span className="text-ramber">Diary</span>
                    </Link>

                    <div className="flex justify-center mb-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rprimary to-rlight opacity-60 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse-slow" />
                            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rprimary to-rlight shadow-lg shadow-rprimary/25 ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105">
                                <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                    {subtitle && <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>}
                </div>

                <div className="relative rounded-2xl border border-rprimary/25 bg-card/90 backdrop-blur-xl p-8 shadow-[0_0_50px_-10px_rgba(48,132,242,0.18)] transition-all duration-300 hover:border-rprimary/40 hover:shadow-[0_0_60px_-8px_rgba(48,132,242,0.25)]">
                    {children}
                </div>

                {footer && (
                    <div className="text-center text-sm text-muted-foreground mt-6">{footer}</div>
                )}
            </div>
        </div>
    );
}
