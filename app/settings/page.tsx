'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import moment from 'moment';
import { Download, KeyRound, Trash2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { usePreferences, type Preferences } from '@/constants';
import { exportAsPdf, exportAsText, exportAsJson, type ExportEntry } from '@/lib/exportDiary';
import { LANGUAGES, MOODS } from '@/constants';
import TagPicker from '@/components/entry/TagPicker';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/60 px-5 py-5">
      <h2 className="font-heading text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[13.5px]">{label}</p>
        {hint && <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const Choice = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg border px-3 py-1.5 text-[12.5px] transition ${
      active ? 'border-primary/40 bg-river-soft font-medium text-river-deep dark:text-primary' : 'border-border text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

export default function Settings() {
  const { user, prefs, updatePrefs } = usePreferences();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [exportRange, setExportRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmAccount, setConfirmAccount] = useState(false);

  useEffect(() => {
    // Settings defaults depend on the browser's local date.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrom(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    setTo(moment().format('YYYY-MM-DD'));
  }, []);

  const set = (patch: Partial<Preferences>) => updatePrefs(patch);

  const handleExport = async (format: 'pdf' | 'txt' | 'json') => {
    setBusy(format);
    setMessage('');
    try {
      const params = new URLSearchParams({ view: 'export' });
      if (exportRange === 'range') {
        params.set('from', from);
        params.set('to', to);
      }
      const response = await fetch(`/api/entries?${params.toString()}`, { cache: 'no-store' });
      const page = await response.json() as { entries?: ExportEntry[]; error?: string };
      if (!response.ok) throw new Error(page.error || 'Unable to export your diary.');
      const entries = page.entries || [];
      if (!entries.length) {
        setMessage('There are no entries in that range to export.');
        return;
      }
      const range = exportRange === 'all' ? null : { from, to };
      if (format === 'pdf') exportAsPdf(entries, range);
      else if (format === 'txt') exportAsText(entries, range);
      else exportAsJson(entries, range);
      setMessage(`Exported ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}.`);
    } finally {
      setBusy('');
    }
  };

  const requestPasswordReset = async () => {
    setBusy('password');
    try {
      if (!user?.email) throw new Error('No email address is available.');
      setMessage('Please use the sign-in page to request a password reset.');
    } catch {
      setMessage('We could not send the reset email. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const wipeDiary = async () => {
    setBusy('wipe');
    try {
      const response = await fetch('/api/entries', { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete diary data.');
      setMessage('All diary entries, photos and voice notes were deleted.');
    } finally {
      setBusy('');
      setConfirmWipe(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-[24px] font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Tune RiverPen to the way you like to write.</p>

      {message && (
        <div className="mt-4 rounded-xl border border-pen/30 bg-pen-soft px-4 py-3 text-[12.5px] text-pen-deep">{message}</div>
      )}

      <div className="mt-6 space-y-4">
        <Section title="Appearance">
          <Row label="Theme" hint="Light is the default; dark mode softens the page at night.">
            <div className="flex gap-1.5">
              {[['light', 'Light'], ['dark', 'Dark'], ['system', 'System']].map(([value, label]) => (
                <Choice key={value} active={prefs.theme === value} onClick={() => set({ theme: value })}>{label}</Choice>
              ))}
            </div>
          </Row>
          <Row label="Writing size" hint="How large your words appear in the diary editor.">
            <div className="flex gap-1.5">
              {[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([value, label]) => (
                <Choice key={value} active={prefs.font_size === value} onClick={() => set({ font_size: value })}>{label}</Choice>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Voice and transcription" description="Speak naturally in English, Kiswahili or Kikuyu. Language is recognised automatically — you never choose it before speaking.">
          <Row label="Transcription engine" hint="Multilingual speech model, with language detection and validation on every recording.">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
            </span>
          </Row>
          <Row label="Automatic language recognition" hint="Detect English, Kiswahili or Kikuyu, including sentences that switch between them.">
            <Switch checked={prefs.auto_language_detection} onCheckedChange={(value) => set({ auto_language_detection: value })} />
          </Row>
          <Row label="Preferred language" hint="Only a hint — automatic recognition stays on.">
            <select
              value={prefs.preferred_language}
              onChange={(event) => set({ preferred_language: event.target.value })}
              className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-[12px] text-muted-foreground outline-none"
            >
              <option value="auto">No preference</option>
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>{language.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Live transcription preview" hint="Show words as you speak. The saved text always comes from the full recording.">
            <Switch checked={prefs.live_transcription} onCheckedChange={(value) => set({ live_transcription: value })} />
          </Row>
          <Row label="Keep my audio recordings" hint="Audio is uploaded privately for transcription. When this is off, the recording is not linked to your entry — only the written words are kept.">
            <Switch checked={prefs.keep_audio} onCheckedChange={(value) => set({ keep_audio: value })} />
          </Row>
          <Row label="Recording quality" hint="Higher quality means larger uploads and slower transcription.">
            <div className="flex gap-1.5">
              {[['standard', 'Standard'], ['high', 'High']].map(([value, label]) => (
                <Choice key={value} active={prefs.voice_quality === value} onClick={() => set({ voice_quality: value })}>{label}</Choice>
              ))}
            </div>
          </Row>
          <p className="rounded-xl bg-muted/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
            Kikuyu is transcribed on a best-effort basis. RiverPen never translates or rewrites what you say, and words it is unsure
            about are flagged for you to review before you save.
          </p>
        </Section>

        <Section title="Diary preferences">
          <Row label="How new entries start" hint="Voice mode opens the recorder as soon as you begin.">
            <div className="flex gap-1.5">
              {[['typed', 'Writing'], ['voice', 'Speaking']].map(([value, label]) => (
                <Choice key={value} active={prefs.default_mode === value} onClick={() => set({ default_mode: value })}>{label}</Choice>
              ))}
            </div>
          </Row>
          <Row label="Default mood" hint="Pre-selected when you open a new entry.">
            <select
              value={prefs.default_mood}
              onChange={(event) => set({ default_mood: event.target.value })}
              className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-[12px] text-muted-foreground outline-none"
            >
              <option value="">No mood</option>
              {MOODS.map((mood) => <option key={mood.value} value={mood.value}>{mood.label}</option>)}
            </select>
          </Row>
          <div>
            <p className="text-[13.5px]">Default tags</p>
            <p className="mb-2 mt-0.5 text-[11.5px] text-muted-foreground">Added to every new entry, and easy to remove.</p>
            <TagPicker value={prefs.default_tags || []} onChange={(tags) => set({ default_tags: tags })} />
          </div>
          <Row label="Auto-save" hint="Save quietly as you write.">
            <Switch checked={prefs.auto_save} onCheckedChange={(value) => set({ auto_save: value })} />
          </Row>
          <Row label="Writing reminders" hint="A gentle nudge on your home page on days you haven't written.">
            <div className="flex items-center gap-2">
              {prefs.reminders && (
                <input
                  type="time"
                  value={prefs.reminder_time || '19:00'}
                  onChange={(event) => set({ reminder_time: event.target.value })}
                  className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-[12px] text-muted-foreground outline-none"
                />
              )}
              <Switch checked={prefs.reminders} onCheckedChange={(value) => set({ reminders: value })} />
            </div>
          </Row>
          <Row label="New entries are private" hint="Private entries are visible only to you.">
            <Switch checked={prefs.private_by_default} onCheckedChange={(value) => set({ private_by_default: value })} />
          </Row>
        </Section>

        <Section title="Privacy and your data">
          <Row label="Password" hint="We'll email you a secure link to set a new one.">
            <Button variant="outline" size="sm" onClick={requestPasswordReset} disabled={busy === 'password'} className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Change
            </Button>
          </Row>

          <div>
            <p className="text-[13.5px]">Export your diary</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Download your entries as PDF, plain text or JSON.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={exportRange}
                onChange={(event) => setExportRange(event.target.value)}
                className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-[12px] text-muted-foreground outline-none"
              >
                <option value="all">All entries</option>
                <option value="range">Date range</option>
              </select>
              {exportRange === 'range' && (
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-border bg-transparent px-2 py-1.5 outline-none" />
                  <span>to</span>
                  <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-lg border border-border bg-transparent px-2 py-1.5 outline-none" />
                </div>
              )}
              {(['pdf', 'txt', 'json'] as const).map((format) => (
                <Button key={format} variant="outline" size="sm" onClick={() => handleExport(format)} disabled={!!busy} className="gap-1.5 uppercase">
                  <Download className="h-3.5 w-3.5" /> {format}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-3.5 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.7} />
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Every entry is tied to your account and readable only by you. Photos are stored privately and opened through short-lived links.
            </p>
          </div>

          <Row label="Delete all diary data" hint="Removes every entry, photo and voice note. This cannot be undone.">
            <Button variant="outline" size="sm" onClick={() => setConfirmWipe(true)} className="gap-1.5 text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </Row>

          <Row label="Delete my account" hint="Account removal is handled by the RiverPen team so your data is erased completely.">
            <Button variant="outline" size="sm" onClick={() => setConfirmAccount(true)} className="gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5" /> Request
            </Button>
          </Row>
        </Section>
      </div>

      <AlertDialog open={confirmWipe} onOpenChange={setConfirmWipe}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all diary data?</AlertDialogTitle>
            <AlertDialogDescription>
              Every entry, photo and voice note will be permanently removed. Your account stays, but the diary becomes empty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my diary</AlertDialogCancel>
            <AlertDialogAction onClick={wipeDiary} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAccount} onOpenChange={setConfirmAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request account deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your account and everything in it. Contact support to complete the request — you can export your diary first
              so you keep your words.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleExport('json')}>Export first</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}