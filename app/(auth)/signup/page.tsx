'use client'

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signUp } from "@riverpen/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { toast } from "@/components/ui/sonner";

export default function SignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [returnTo] = useState(safeReturnTo);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signUp({ name, email, password });
            toast.success("Account created successfully!", {
                description: "Welcome to RiverPen Diary.",
                emoji: "🎉",
                toastAnimation: "bounce",
            });
            window.location.href = safeReturnTo();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Registration failed";
            setError(msg);
            toast.error("Sign up failed", {
                description: msg,
                emoji: "🚨",
                toastAnimation: "wiggle",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            icon={UserPlus}
            title="Create an account"
            subtitle="Start writing your thoughts today"
            footer={
                <span>
                    Already have an account?{" "}
                    <Link
                        href={"/signin" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
                        className="text-rprimary font-semibold hover:text-rlight transition-colors hover:underline"
                    >
                        Log in
                    </Link>
                </span>
            }
        >
            {error && (
                <div className="mb-5 flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2 group">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground/90 group-focus-within:text-rprimary transition-colors">
                        Full Name
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-rprimary transition-colors duration-200" aria-hidden="true" />
                        <Input
                            id="name"
                            type="text"
                            autoComplete="name"
                            autoFocus
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 h-12 bg-background/60 border-border/80 hover:border-rprimary/40 focus:border-rprimary focus:ring-2 focus:ring-rprimary/20 transition-all rounded-xl"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/90 group-focus-within:text-rprimary transition-colors">
                        Email Address
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-rprimary transition-colors duration-200" aria-hidden="true" />
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 bg-background/60 border-border/80 hover:border-rprimary/40 focus:border-rprimary focus:ring-2 focus:ring-rprimary/20 transition-all rounded-xl"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground/90 group-focus-within:text-rprimary transition-colors">
                        Password
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-rprimary transition-colors duration-200" aria-hidden="true" />
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-12 bg-background/60 border-border/80 hover:border-rprimary/40 focus:border-rprimary focus:ring-2 focus:ring-rprimary/20 transition-all rounded-xl"
                            required
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-medium text-white shadow-md shadow-rprimary/25 hover:shadow-lg hover:shadow-rprimary/40 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        "Create account"
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}
