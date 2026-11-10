'use client'

import {BookOpen, CalendarDays, House, LineChart, Search, Settings} from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useUser, type UserDTO } from "@riverpen/auth";
import {
    Smile, Heart, Sparkles, Leaf, CloudRain, CloudLightning, Flame, Moon, Compass
} from 'lucide-react';
export const NAV_ITEMS = [
    { href: '/', label: 'Home', Icon:House },
    { href: '/diary', label: 'My Diary', Icon:BookOpen },
    { href: '/calendar', label: 'Calendar', Icon: CalendarDays},
    { href: '/search', label: 'Search', Icon: Search },
    { href: '/insights', label: 'Insights', Icon: LineChart},
    { href: '/settings', label: 'Settings', Icon: Settings }
]

export const MOBILE_ITEMS = NAV_ITEMS.filter((item) => ['/', '/diary', '/calendar', '/settings'].includes(item.href))

export const DEFAULT_PREFS = {
    theme: 'light',
    font_size: 'medium',
    default_mode: 'typed',
    default_mood: '',
    default_tags: [] as string[],
    auto_save: true,
    reminders: false,
    reminder_time: '19:00',
    auto_language_detection: true,
    preferred_language: 'auto',
    live_transcription: true,
    keep_audio: false,
    voice_quality: 'standard',
    insert_mode: 'append',
    private_by_default: true,
    onboarding_complete: false
};

export type Preferences = typeof DEFAULT_PREFS;

const PREFS_CHANGE_EVENT = 'rdiary:prefs-change';

function subscribeToPreferences(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener(PREFS_CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(PREFS_CHANGE_EVENT, onChange);
    };
}

function getPreferencesSnapshot() {
    try {
        return localStorage.getItem('rdiary_prefs') || '';
    } catch {
        return '';
    }
}

function getServerPreferencesSnapshot() {
    return null;
}

function parsePreferences(saved: string | null): Preferences {
    if (!saved) return DEFAULT_PREFS;
    try {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return { ...DEFAULT_PREFS, ...parsed };
        }
    } catch {
        // ignore invalid stored preferences
    }
    return DEFAULT_PREFS;
}

const FONT_SIZES: Record<string, string> = { small: '1rem', medium: '1.075rem', large: '1.2rem' };

interface PreferencesContextType {
    user: UserDTO | null;
    prefs: Preferences;
    isLoading: boolean;
    updatePrefs: (patch: Partial<Preferences>) => Promise<Preferences>;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoaded } = useUser();
    const savedPreferences = useSyncExternalStore(
        subscribeToPreferences,
        getPreferencesSnapshot,
        getServerPreferencesSnapshot,
    );
    const [sessionPrefs, setSessionPrefs] = useState<Preferences | null>(null);
    const storedPrefs = useMemo(() => parsePreferences(savedPreferences), [savedPreferences]);
    const prefs = sessionPrefs || storedPrefs;
    const isLoading = !isLoaded || savedPreferences === null;

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const resolved = prefs.theme === 'system' ? (media.matches ? 'dark' : 'light') : prefs.theme;
            document.documentElement.classList.toggle('dark', resolved === 'dark');
            document.documentElement.style.setProperty('--editor-size', FONT_SIZES[prefs.font_size] || FONT_SIZES.medium);
        };
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [prefs.theme, prefs.font_size]);

    const updatePrefs = useCallback(async (patch: Partial<Preferences>) => {
        const merged = { ...prefs, ...patch };
        try {
            localStorage.setItem('rdiary_prefs', JSON.stringify(merged));
            window.dispatchEvent(new Event(PREFS_CHANGE_EVENT));
        } catch {
            setSessionPrefs(merged);
        }
        return merged;
    }, [prefs]);

    return (
        <PreferencesContext.Provider value={{ user, prefs, isLoading, updatePrefs }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
    return context;
};



export const MOODS = [
    { value: 'happy', label: 'Happy', Icon: Smile, tone: 'text-amber-500', soft: 'bg-amber-500/10', solid: '#f59e0b' },
    { value: 'grateful', label: 'Grateful', Icon: Heart, tone: 'text-rose-400', soft: 'bg-rose-400/10', solid: '#fb7185' },
    { value: 'excited', label: 'Excited', Icon: Sparkles, tone: 'text-orange-400', soft: 'bg-orange-400/10', solid: '#fb923c' },
    { value: 'calm', label: 'Calm', Icon: Leaf, tone: 'text-teal-500', soft: 'bg-teal-500/10', solid: '#14b8a6' },
    { value: 'sad', label: 'Sad', Icon: CloudRain, tone: 'text-sky-500', soft: 'bg-sky-500/10', solid: '#0ea5e9' },
    { value: 'anxious', label: 'Anxious', Icon: CloudLightning, tone: 'text-violet-400', soft: 'bg-violet-400/10', solid: '#a78bfa' },
    { value: 'frustrated', label: 'Frustrated', Icon: Flame, tone: 'text-red-400', soft: 'bg-red-400/10', solid: '#f87171' },
    { value: 'tired', label: 'Tired', Icon: Moon, tone: 'text-slate-400', soft: 'bg-slate-400/10', solid: '#94a3b8' },
    { value: 'reflective', label: 'Reflective', Icon: Compass, tone: 'text-indigo-400', soft: 'bg-indigo-400/10', solid: '#818cf8' }
];

export const getMood = (value: string) => MOODS.find((m) => m.value === value) || null;

export const DEFAULT_TAGS = ['Personal', 'School', 'Work', 'Family', 'Friends', 'Travel', 'Ideas', 'Goals', 'Memories'];

export const FALLBACK_PROMPTS = [
    'What made today memorable?',
    'What is something you learned today?',
    'What are you grateful for?',
    'What challenged you today?',
    'What would you like to remember about this moment?',
    'What is one thing you hope to accomplish tomorrow?',
    'Who did you spend time with today, and how did it feel?',
    'What is a small thing that went well?'
];

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'sw', label: 'Kiswahili' },
    { code: 'ki', label: 'Kikuyu' }
];