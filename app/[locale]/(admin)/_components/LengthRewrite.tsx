'use client';

import { useState } from 'react';
import { Loader2, ListChecks, Ruler } from 'lucide-react';
import {
  MAX_TARGET_WORDS,
  MIN_TARGET_WORDS,
  SPEECH_WPM,
  lengthTarget,
  type LengthField,
} from '@/lib/admin/length-targets';
import type { Level } from '@/data/skills';

/**
 * "Hoe lang moet dit worden?" — a target length the docent names, and a rewrite to that length.
 *
 * The meter above it already says how long the text is and what the guideline is. This is the
 * missing half: the machine-authored dataset runs consistently short of that band, and fixing one
 * fragment by hand is ten minutes of retyping a text that was fine apart from its length.
 *
 * Three things about it are deliberate:
 *
 * - **The target is a field, not the richtlijn.** It is *seeded* from the guideline (its midpoint)
 *   because that is the useful default, but the docent overrules it per fragment — a mededeling
 *   and a brief are not the same length and the guideline is one band for both. It is not stored:
 *   the number describes this one rewrite, and persisting it would need a migration and would turn
 *   an advisory guideline into a per-row standard.
 * - **The rewrite lands in the field and nothing is saved.** Same promise as "Magisch invullen",
 *   and it is structural — `/api/admin/rewrite-length` writes nothing at all.
 * - **Updating the questions is a second button.** Lengthening a text can strand a question, but
 *   a rewrite that silently touched the answer key would be the one change on this screen the
 *   docent cannot see. She decides, after reading the new text.
 */
export default function LengthRewrite({
  level,
  skill,
  field,
  kind,
  intro,
  title,
  content,
  onRewrite,
  questionCount = 0,
  onReviseQuestions,
}: {
  level: Level;
  skill: string;
  /** Which meter this sits under — used only to seed the target from that field's guideline. */
  field: LengthField;
  kind: 'text' | 'audio';
  intro: string;
  title: string;
  /** The text as the form currently has it: `body_html` for a leestekst, the script for audio. */
  content: string;
  onRewrite: (next: string) => void;
  questionCount?: number;
  /** Provided by the fragment page, which owns the questions. Returns a line for the docent. */
  onReviseQuestions?: () => Promise<string>;
}) {
  const target = lengthTarget(level, field, skill);

  /**
   * The guideline in **words**, whatever unit it is stated in.
   *
   * A script's band is seconds (`exam_formats.audio_seconds`, the one measured target), and the
   * lever the docent has is words — so it is converted at the rate the generator actually renders
   * at. Seeding the number field with "35" from a 25–45 second band would have asked for a
   * thirty-five-word fragment, which is a fifth of the right length.
   */
  const inWords = (seconds: number) => Math.round((seconds / 60) * SPEECH_WPM);
  const wordBand: [number, number] | null = !target
    ? null
    : target.unit === 'seconden'
      ? [inWords(target.min), inWords(target.max)]
      : target.unit === 'woorden'
        ? [target.min, target.max]
        : null;
  const seeded = wordBand ? Math.round((wordBand[0] + wordBand[1]) / 2) : 100;

  const [words, setWords] = useState(String(seeded));
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState<'rewrite' | 'questions' | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const asked = Number(words);
  const valid = Number.isFinite(asked) && asked >= MIN_TARGET_WORDS && asked <= MAX_TARGET_WORDS;

  async function rewrite() {
    setBusy('rewrite');
    setError('');
    setNote('');
    try {
      const res = await fetch('/api/admin/rewrite-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'stimulus',
          level,
          skill,
          kind,
          targetWords: Math.round(asked),
          intro,
          title,
          content,
          instruction: instruction.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.rewrite) throw new Error(json.error || 'Herschrijven is niet gelukt.');
      const next = kind === 'audio' ? json.rewrite.script : json.rewrite.body_html;
      onRewrite(next);
      setNote(
        `Van ${json.rewrite.previousWords} naar ${json.rewrite.words} woorden` +
          (json.rewrite.note ? ` — ${json.rewrite.note}` : '') +
          ' Lees na en sla zelf op.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Herschrijven is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  async function revise() {
    if (!onReviseQuestions) return;
    setBusy('questions');
    setError('');
    setNote('');
    try {
      setNote(await onReviseQuestions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bijwerken is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-outline-variant bg-surface-container p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface">
            <Ruler size={12} aria-hidden />
            Doellengte
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={MIN_TARGET_WORDS}
              max={MAX_TARGET_WORDS}
              step={10}
              value={words}
              onChange={e => setWords(e.target.value)}
              className="w-20 rounded-xl border border-outline-variant bg-surface px-2.5 py-2 text-sm tabular-nums text-on-surface outline-none focus:border-primary"
            />
            <span className="text-xs text-on-surface-variant">woorden</span>
          </div>
        </div>

        <button
          type="button"
          onClick={rewrite}
          disabled={busy !== null || !valid || !content.trim()}
          title={!content.trim() ? 'Er is nog geen tekst om te herschrijven.' : undefined}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container transition-transform hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transform-none"
        >
          {busy === 'rewrite' ? (
            <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <Ruler size={15} aria-hidden />
          )}
          Herschrijf naar deze lengte
        </button>

        {onReviseQuestions && (
          <button
            type="button"
            onClick={revise}
            disabled={busy !== null || questionCount === 0}
            title={questionCount === 0 ? 'Er staan nog geen vragen op dit fragment.' : undefined}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
          >
            {busy === 'questions' ? (
              <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <ListChecks size={15} aria-hidden />
            )}
            Vragen bijwerken
            {questionCount > 0 && (
              <span className="text-xs font-normal tabular-nums text-on-surface-variant">
                ({questionCount})
              </span>
            )}
          </button>
        )}
      </div>

      {/* Its own row: on one line with the number and the two buttons it collapsed to about
          thirty characters, which is a field that looks broken rather than optional. */}
      <input
        value={instruction}
        onChange={e => setInstruction(e.target.value)}
        placeholder="Extra instructie (mag leeg) — bijv. “houd de openingstijden erin”"
        className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
      />

      <p className="m-0 text-xs text-on-surface-variant">
        {target && wordBand
          ? `De richtlijn is ${target.min} tot ${target.max} ${target.unit}` +
            (target.unit === 'seconden'
              ? ` — ongeveer ${wordBand[0]} tot ${wordBand[1]} woorden gesproken tekst`
              : '') +
            '; hier zet je de lengte voor dít fragment.'
          : 'Zet hier de lengte voor dit fragment.'}{' '}
        Er wordt niets opgeslagen — de tekst komt in het veld hierboven te staan.
        {onReviseQuestions &&
          ' “Vragen bijwerken” kijkt de vragen na tegen de nieuwe tekst en laat wat nog klopt ongemoeid.'}
      </p>

      {!valid && (
        <p className="m-0 text-xs text-error">
          Geef een doellengte tussen {MIN_TARGET_WORDS} en {MAX_TARGET_WORDS} woorden.
        </p>
      )}
      {error && <p className="m-0 text-xs text-error">{error}</p>}
      {note && <p className="m-0 text-xs text-[#a24000]">{note}</p>}
    </div>
  );
}
