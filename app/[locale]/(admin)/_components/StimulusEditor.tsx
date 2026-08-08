'use client';

import { useState } from 'react';
import { AudioLines, Check, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AdminStimulus } from '@/lib/admin/stimuli';
import { VOICES, type VoiceKey } from '@/lib/tts-voices';
import { speakersInScript } from '@/lib/tts-dialogue';
import { formatRange, formatRules, isSkillSlug, type Level } from '@/data/skills';
import MagicFill from './MagicFill';
import RichTextEditor from './RichTextEditor';

/**
 * Authoring a fragment — the text, image or audio a stimulus's 1..N questions refer to.
 *
 * This lives outside `/admin/exams` on purpose. **Items are written in
 * `/admin/questions` and only assigned in `/admin/exams`** (owner's decision, 2026-08-07):
 * the exam builder answers "is examen 3 complete?", not "what does this fragment say?", and
 * having both screens able to create content meant two places to break the same rules.
 *
 * It owns its own draft state and writes directly, rather than lifting state to a parent, so
 * that either screen can drop it in with an `onSaved` callback and nothing else.
 */

export type StimulusKind = 'text' | 'audio' | 'image';

type Draft = {
  id?: number;
  sort_order: number;
  section_id: number | null;
  kind: StimulusKind;
  intro: string;
  title: string;
  body_html: string;
  image_url: string;
  image_alt: string;
  audio_url: string;
  /** Kept as a string so the field can be cleared; parsed on save. */
  audio_seconds: string;
  script: string;
  voice_cast: Record<string, string>;
  review_status: 'pending' | 'validated';
};

export type Section = { id: number; name_nl: string };

export function blankStimulus(skill: string, nextSortOrder: number): Draft {
  return {
    sort_order: nextSortOrder,
    section_id: null,
    kind: skill === 'luisteren' ? 'audio' : 'text',
    intro: '',
    title: '',
    body_html: '',
    image_url: '',
    image_alt: '',
    audio_url: '',
    audio_seconds: '',
    script: '',
    voice_cast: {},
    review_status: 'pending',
  };
}

export function toStimulusDraft(s: Omit<AdminStimulus, 'questions'>): Draft {
  return {
    id: s.id,
    sort_order: s.sort_order,
    section_id: s.section_id,
    kind: s.kind,
    intro: s.intro ?? '',
    title: s.title ?? '',
    body_html: s.body_html ?? '',
    image_url: s.image_url ?? '',
    image_alt: s.image_alt ?? '',
    audio_url: s.audio_url ?? '',
    audio_seconds: s.audio_seconds == null ? '' : String(s.audio_seconds),
    script: s.script ?? '',
    voice_cast: s.voice_cast ?? {},
    review_status: s.review_status,
  };
}

export default function StimulusEditor({
  examId,
  level,
  skill,
  sections,
  initial,
  onClose,
  onSaved,
  embedded = false,
}: {
  /** Where a new fragment lands. In the questions view this is the backlog. */
  examId: number;
  level: Level;
  skill: string;
  sections: Section[];
  initial: Draft;
  onClose: () => void;
  onSaved: () => void;
  /** Inside a drawer that already draws its own header and frame. */
  embedded?: boolean;
}) {
  const supabase = createClient();
  const [editing, setEditing] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genNote, setGenNote] = useState('');
  const [error, setError] = useState('');

  const rules = isSkillSlug(skill) ? formatRules(level, skill) : null;

  /**
   * Drop a whole suggested fragment into the form.
   *
   * Overwrites the content fields rather than filling only the blanks: this is a draft in a form,
   * nothing is saved, and a button that silently does nothing on a half-written fragment is worse
   * than one that replaces it. `review_status` is never touched — only the docent's own click moves
   * a fragment to `validated`.
   *
   * The audio is **cleared** along with a new script, deliberately. Keeping the old URL would let a
   * fragment be saved whose mp3 says something else entirely, and that mismatch is invisible in
   * admin — the script is what the player never shows.
   */
  function applySuggestion(s: {
    intro: string;
    title: string;
    body_html: string;
    script: string;
    voice_cast: Record<string, string>;
    image_alt: string;
    section_id: number | null;
  }) {
    setEditing(prev => {
      const scriptChanged = prev.kind === 'audio' && s.script.trim() && s.script !== prev.script;
      return {
        ...prev,
        intro: s.intro || prev.intro,
        title: s.title || prev.title,
        body_html: prev.kind === 'text' ? s.body_html || prev.body_html : prev.body_html,
        script: prev.kind === 'audio' ? s.script || prev.script : prev.script,
        voice_cast:
          prev.kind === 'audio' && Object.keys(s.voice_cast).length ? s.voice_cast : prev.voice_cast,
        image_alt: prev.kind === 'image' ? s.image_alt || prev.image_alt : prev.image_alt,
        section_id: s.section_id ?? prev.section_id,
        audio_url: scriptChanged ? '' : prev.audio_url,
        audio_seconds: scriptChanged ? '' : prev.audio_seconds,
      };
    });
  }

  /**
   * Render the dialogue and drop the resulting URL into the audio field.
   *
   * Deliberately does not save: the docent listens first, and a take they reject should not
   * have replaced the one currently in the exam.
   */
  async function generateDraftAudio() {
    setGenBusy(true);
    setGenNote('');
    setError('');
    try {
      const res = await fetch('/api/generate-stimulus-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, script: editing.script, voiceCast: editing.voice_cast }),
      });
      const json = await res.json();
      if (!res.ok || !json.audio_url) throw new Error(json.error || 'Genereren is niet gelukt.');
      // The length comes back with the URL: there is no row to have written it to, and it is
      // not recoverable from the URL once the editor closes.
      setEditing(prev => ({
        ...prev,
        audio_url: json.audio_url,
        audio_seconds: json.audio_seconds == null ? prev.audio_seconds : String(json.audio_seconds),
      }));
      setGenNote('Audio gegenereerd. Luister hem na en sla daarna op.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Genereren is niet gelukt.');
    } finally {
      setGenBusy(false);
    }
  }

  async function save() {
    const d = editing;

    // Mirrors the `stimuli_payload_matches_kind` CHECK so the docent gets a sentence rather
    // than a Postgres constraint name.
    const missing =
      d.kind === 'text' ? !d.body_html.trim()
      : d.kind === 'image' ? !d.image_url.trim()
      : !d.audio_url.trim();
    if (missing) {
      setError(
        d.kind === 'text' ? 'Een tekststimulus heeft een tekst nodig.'
        : d.kind === 'image' ? 'Een afbeeldingsstimulus heeft een afbeelding-URL nodig.'
        : 'Genereer eerst de audio (of plak een URL) voordat je opslaat.'
      );
      return;
    }

    setBusy(true);
    setError('');
    const row = {
      exam_id: examId,
      skill,
      sort_order: d.sort_order,
      section_id: d.section_id,
      kind: d.kind,
      intro: d.intro.trim() || null,
      title: d.title.trim() || null,
      body_html: d.kind === 'text' ? d.body_html : (d.body_html.trim() || null),
      image_url: d.image_url.trim() || null,
      image_alt: d.image_alt.trim() || null,
      audio_url: d.audio_url.trim() || null,
      // Only meaningful on an audio stimulus; a leftover value on a text one would be checked
      // against the audio-length rule and reported as wrong.
      audio_seconds:
        d.kind === 'audio' && d.audio_seconds.trim() && Number.isFinite(Number(d.audio_seconds))
          ? Number(d.audio_seconds)
          : null,
      script: d.script.trim() || null,
      voice_cast: Object.keys(d.voice_cast).length ? d.voice_cast : null,
      review_status: d.review_status,
    };

    const { error: err } = d.id
      ? await supabase.from('stimuli').update(row).eq('id', d.id)
      : await supabase.from('stimuli').insert(row);

    setBusy(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className={embedded ? 'space-y-5' : 'rounded-2xl border border-primary/40 p-4 space-y-5'}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-headline font-bold text-on-surface m-0">
            {editing.id ? `Fragment #${editing.id} bewerken` : 'Nieuw fragment'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="text-on-surface-variant hover:text-on-surface p-1"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      <MagicFill
        placeholder="Bijv. een afspraak afzeggen bij de tandarts (mag leeg)"
        body={() => ({
          target: 'stimulus',
          level,
          skill,
          kind: editing.kind,
          // Sent so the suggestion can pick a tekstsoort; the route only accepts an id back that
          // is in this list, so a hallucinated one cannot reach the save.
          sections,
        })}
        onSuggestion={applySuggestion}
      />

      {/* ── Waar het fragment staat ──────────────────────────────────────────────────────── */}
      <Group title="Plaatsing">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Soort">
            <select
              value={editing.kind}
              onChange={e => setEditing({ ...editing, kind: e.target.value as StimulusKind })}
              className="field"
            >
              <option value="text">Tekst</option>
              <option value="image">Afbeelding</option>
              {skill === 'luisteren' && <option value="audio">Audio</option>}
            </select>
          </Field>
          <Field label="Positie">
            <input
              type="number"
              min={1}
              value={editing.sort_order}
              onChange={e => setEditing({ ...editing, sort_order: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="field tabular-nums"
            />
          </Field>
        </div>

        <Field
          label="Tekstsoort"
          hint={editing.section_id === null ? 'Zonder tekstsoort telt dit fragment nergens mee.' : undefined}
        >
          <select
            value={editing.section_id ?? ''}
            onChange={e => setEditing({ ...editing, section_id: e.target.value ? parseInt(e.target.value, 10) : null })}
            className="field"
          >
            <option value="">Kies een tekstsoort…</option>
            {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name_nl}</option>)}
          </select>
        </Field>
      </Group>

      {/* ── Wat de kandidaat ziet ────────────────────────────────────────────────────────── */}
      <Group title="Inhoud">
        <Field label="Inleiding" hint="De regel boven het fragment: “Jasper ontvangt een e-mail van zijn collega.”">
          <input
            value={editing.intro}
            onChange={e => setEditing({ ...editing, intro: e.target.value })}
            className="field"
          />
        </Field>

        <Field label="Titel">
          <input
            value={editing.title}
            onChange={e => setEditing({ ...editing, title: e.target.value })}
            className="field"
          />
        </Field>

        {editing.kind === 'text' && (
          <Field
            label="Tekst"
            hint="Dit is de linkerkolom die de kandidaat leest. Opmaak wordt als HTML bewaard — via ‹› zie en bewerk je die rechtstreeks."
          >
            <RichTextEditor
              value={editing.body_html}
              onChange={html => setEditing(prev => ({ ...prev, body_html: html }))}
              minHeight={220}
            />
          </Field>
        )}

        {(editing.kind === 'image' || editing.kind === 'audio') && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={editing.kind === 'image' ? 'Afbeelding-URL' : 'Afbeelding-URL (optioneel)'}>
              <input
                value={editing.image_url}
                onChange={e => setEditing({ ...editing, image_url: e.target.value })}
                placeholder="https://…"
                className="field"
              />
            </Field>
            <Field label="Alt-tekst">
              <input
                value={editing.image_alt}
                onChange={e => setEditing({ ...editing, image_alt: e.target.value })}
                className="field"
              />
            </Field>
          </div>
        )}
      </Group>

      {editing.kind === 'audio' && (
        <Group title="Audio">
          <Field
            label="Script"
            hint="Eén regel per beurt, met een sprekerlabel: “A: Goedemorgen.”. Bewaren — zonder script is regenereren onmogelijk."
          >
            <textarea
              value={editing.script}
              onChange={e => setEditing({ ...editing, script: e.target.value })}
              rows={8}
              placeholder={'A: Goedemorgen, kan ik u helpen?\nB: Ja, ik zoek de afdeling burgerzaken.'}
              className="field resize-y font-mono text-xs"
            />
          </Field>

          {/* Casting is authored per speaker. The generator refuses an uncast speaker rather
              than choosing a voice itself — a wrong-gender voice is an audible content bug
              that cannot be recovered from the mp3 afterwards. */}
          <VoiceCasting
            script={editing.script}
            cast={editing.voice_cast}
            onChange={next => setEditing({ ...editing, voice_cast: next })}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generateDraftAudio}
              disabled={genBusy || !editing.script.trim()}
              className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {genBusy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <AudioLines size={15} aria-hidden />}
              {editing.audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
            </button>
            {editing.audio_url && (
              <audio
                controls
                src={editing.audio_url}
                className="h-9 max-w-[280px]"
                // A pasted URL never went through the generator, so nothing wrote its length
                // down. The browser knows it as soon as the metadata loads, and the field
                // stays editable — this fills a gap, it does not lock a value.
                onLoadedMetadata={e => {
                  const seconds = (e.currentTarget as HTMLAudioElement).duration;
                  if (!Number.isFinite(seconds) || seconds <= 0) return;
                  setEditing(prev =>
                    prev.audio_seconds.trim() ? prev : { ...prev, audio_seconds: seconds.toFixed(2) }
                  );
                }}
              />
            )}
          </div>
          {genNote && <p className="text-xs text-on-surface-variant m-0">{genNote}</p>}

          <div className="grid grid-cols-3 gap-3 items-start">
            <div className="col-span-2">
              <Field label="Audio-URL" hint="Wordt ingevuld door de generator. Handmatig plakken kan ook.">
                <input
                  value={editing.audio_url}
                  onChange={e => setEditing({ ...editing, audio_url: e.target.value })}
                  placeholder="https://…/stimulus.mp3"
                  className="field font-mono text-xs"
                />
              </Field>
            </div>
            <Field
              label="Lengte (sec)"
              hint={rules?.audioSeconds ? `Richtlijn ${formatRange(rules.audioSeconds)} sec.` : undefined}
            >
              <input
                type="number"
                min={1}
                step="0.01"
                value={editing.audio_seconds}
                onChange={e => setEditing({ ...editing, audio_seconds: e.target.value })}
                className="field tabular-nums"
              />
            </Field>
          </div>
        </Group>
      )}

      <Group title="Status">
        <Field label="Nakijken">
          <select
            value={editing.review_status}
            onChange={e => setEditing({ ...editing, review_status: e.target.value as 'pending' | 'validated' })}
            className="field"
          >
            <option value="pending">Nog nakijken</option>
            <option value="validated">Nagekeken door docent</option>
          </select>
        </Field>
      </Group>

      {/* Closes the fragment form. Deliberately not sticky: the drawer continues below with the
          fragment's questions, and a bar floating over those reads as if it saved them too. */}
      <div className="border-t border-outline-variant pt-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
          Fragment opslaan
        </button>
      </div>

      <style>{`
        .field {
          width: 100%;
          border: 1px solid var(--color-outline-variant);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: var(--color-surface-container-lowest);
          color: var(--color-on-surface);
        }
        .field:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

/**
 * One labelled block of the form.
 *
 * The editor had thirteen fields in one flat column, which made "waar zet ik de tekstsoort ook
 * alweer" a scanning exercise every time. Grouping them by the question they answer — waar staat
 * het, wat staat erin, hoe klinkt het — is the whole change; nothing about the fields moved.
 */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4">
      <h3 className="m-0 font-headline text-xs font-bold tracking-widest text-on-surface-variant uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-on-surface block">{label}</label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

/**
 * One voice per speaker, derived from the script.
 *
 * The speaker list comes from parsing the script rather than from a fixed A/B pair, so a
 * three-hander or a single announcer both work without a schema or UI change. Voices are the
 * four in data/tts-voices.json and nothing else — adding a fifth is an owner decision, not an
 * authoring one, so there is deliberately no free-text field here.
 *
 * The gender hint beside each option is the whole point of the control: the script establishes
 * who is speaking ("mevrouw De Wit", "Youssef") and the docent has to match it. Nothing
 * downstream can check that for them.
 */
function VoiceCasting({
  script,
  cast,
  onChange,
}: {
  script: string;
  cast: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const speakers = speakersInScript(script);
  if (speakers.length === 0) return null;

  const used = speakers.map(sp => cast[sp]).filter(Boolean);
  const duplicate = new Set(used).size < used.length;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-on-surface block">
        Stemmen ({speakers.length} {speakers.length === 1 ? 'spreker' : 'sprekers'})
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {speakers.map(sp => (
          <div key={sp} className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant w-16 shrink-0 truncate" title={sp}>
              {sp}
            </span>
            <select
              value={cast[sp] ?? ''}
              onChange={e => onChange({ ...cast, [sp]: e.target.value })}
              className="field"
            >
              <option value="">Kies een stem…</option>
              {(Object.keys(VOICES) as VoiceKey[]).map(k => (
                <option key={k} value={k}>
                  {VOICES[k].gender === 'female' ? 'vrouw' : 'man'} · {VOICES[k].age === 'young' ? 'jonger' : 'ouder'}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {duplicate && (
        <p className="text-xs text-error m-0">
          Twee sprekers hebben dezelfde stem. Een dialoog in één stem klinkt als een monoloog.
        </p>
      )}
      <p className="text-xs text-on-surface-variant">
        De stem moet bij de spreker passen: een vrouw krijgt een vrouwenstem, een man een mannenstem.
        Het script bepaalt dat via namen en aanspreekvormen.
      </p>
    </div>
  );
}
