'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Check, ChevronDown, Loader2, Pencil, Plus, Trash2, TriangleAlert, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AdminStimulus, PublishIssue } from '@/lib/admin/stimuli';

type Exam = {
  id: number;
  skill: string;
  number: number;
  title: string | null;
  is_free: boolean;
  published: boolean;
};

type Section = { id: number; name_nl: string };

type Task = {
  id: number;
  sort_order: number;
  task_type: string;
  title: string | null;
  image_usage: string;
  review_status: string;
};

type StimulusDraft = {
  id?: number;
  sort_order: number;
  section_id: number | null;
  kind: 'text' | 'audio' | 'image';
  intro: string;
  title: string;
  body_html: string;
  image_url: string;
  image_alt: string;
  audio_url: string;
  script: string;
  review_status: 'pending' | 'validated';
};

/**
 * The authoring surface for one exam.
 *
 * It is organised around stimuli because the content is: a stimulus is the left pane, and
 * 1..N questions hang off it. Publishing is gated on `exam_publish_issues()` — a database
 * validator rather than a trigger, so incomplete work stays savable — and the button is
 * disabled only on `error` rows, never on warnings.
 */
export default function ExamBuilder({
  locale,
  exam,
  stimuli,
  issues,
  sections,
  tasks,
}: {
  locale: string;
  exam: Exam;
  stimuli: AdminStimulus[];
  issues: PublishIssue[];
  sections: Section[];
  tasks: Task[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState<StimulusDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(stimuli[0]?.id ?? null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const isOpenSkill = exam.skill === 'schrijven' || exam.skill === 'spreken';
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity !== 'error');

  function blankStimulus(): StimulusDraft {
    return {
      sort_order: (stimuli.at(-1)?.sort_order ?? 0) + 1,
      section_id: null,
      kind: exam.skill === 'luisteren' ? 'audio' : 'text',
      intro: '',
      title: '',
      body_html: '',
      image_url: '',
      image_alt: '',
      audio_url: '',
      script: '',
      review_status: 'pending',
    };
  }

  function toDraft(s: AdminStimulus): StimulusDraft {
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
      script: s.script ?? '',
      review_status: s.review_status,
    };
  }

  async function saveStimulus() {
    if (!editing) return;
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
        : 'Een audiostimulus heeft een audio-URL nodig.'
      );
      return;
    }

    setBusy(true);
    setError('');
    const row = {
      exam_id: exam.id,
      skill: exam.skill,
      sort_order: d.sort_order,
      section_id: d.section_id,
      kind: d.kind,
      intro: d.intro.trim() || null,
      title: d.title.trim() || null,
      body_html: d.kind === 'text' ? d.body_html : (d.body_html.trim() || null),
      image_url: d.image_url.trim() || null,
      image_alt: d.image_alt.trim() || null,
      audio_url: d.audio_url.trim() || null,
      script: d.script.trim() || null,
      review_status: d.review_status,
    };

    const { error: err } = d.id
      ? await supabase.from('stimuli').update(row).eq('id', d.id)
      : await supabase.from('stimuli').insert(row);

    setBusy(false);
    if (err) { setError(err.message); return; }
    setEditing(null);
    router.refresh();
  }

  async function deleteStimulus(id: number) {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setBusy(true);
    const { error: err } = await supabase.from('stimuli').delete().eq('id', id);
    setBusy(false);
    setConfirmDelete(null);
    if (err) { setError(err.message); return; }
    router.refresh();
  }

  async function togglePublished() {
    setBusy(true);
    setError('');
    const { error: err } = await supabase
      .from('exams')
      .update({ published: !exam.published })
      .eq('id', exam.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      {/* ── Publish gate ── */}
      <div className="rounded-2xl border border-outline-variant p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-on-surface m-0">
              {exam.published ? 'Dit examen staat live.' : 'Dit examen is nog een concept.'}
            </p>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              {errors.length === 0
                ? 'De controle vindt geen blokkerende problemen.'
                : `${errors.length} ${errors.length === 1 ? 'probleem' : 'problemen'} blokkeren publicatie.`}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePublished}
            disabled={busy || (!exam.published && errors.length > 0)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              exam.published
                ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                : 'bg-primary text-white hover:bg-primary-container'
            }`}
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
            {exam.published ? 'Offline halen' : 'Publiceren'}
          </button>
        </div>

        {issues.length > 0 && (
          <ul className="list-none m-0 mt-3 p-0 space-y-1.5">
            {[...errors, ...warnings].map((i, n) => (
              <li key={n} className="flex items-start gap-2 text-xs">
                <span className={i.severity === 'error' ? 'text-error' : 'text-warning'} style={{ marginTop: 1 }}>
                  {i.severity === 'error'
                    ? <TriangleAlert size={13} strokeWidth={2.4} aria-hidden />
                    : <AlertTriangle size={13} strokeWidth={2.4} aria-hidden />}
                </span>
                <span className="text-on-surface-variant">
                  <span className="font-medium text-on-surface">{i.entity}</span>
                  {i.entity_id != null && <span className="tabular-nums"> #{i.entity_id}</span>} — {i.issue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Open tasks (Schrijven / Spreken) ── */}
      {isOpenSkill && (
        <section>
          <h2 className="text-base font-headline font-bold text-on-surface mb-3">Opdrachten</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Nog geen opdrachten. Die worden beheerd bij <span className="font-medium">Opgaven</span>.
            </p>
          ) : (
            <ul className="list-none m-0 p-0 space-y-2">
              {tasks.map(t => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant px-3.5 py-2.5"
                >
                  <span className="text-sm text-on-surface">
                    <span className="tabular-nums text-on-surface-variant">{t.sort_order}.</span>{' '}
                    {t.title || `${t.task_type} opdracht`}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {t.task_type}
                    {t.image_usage !== 'none' && ` · ${t.image_usage}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Stimuli (Lezen / Luisteren) ── */}
      {!isOpenSkill && (
        <section>
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-base font-headline font-bold text-on-surface m-0">
              Stimuli <span className="text-on-surface-variant font-normal">({stimuli.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => { setEditing(blankStimulus()); setError(''); }}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors"
            >
              <Plus size={15} aria-hidden />
              Nieuwe stimulus
            </button>
          </div>

          {stimuli.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Nog geen stimuli. Een vraag kan pas bestaan als er een tekst, afbeelding of
              fragment is om naar te verwijzen.
            </p>
          )}

          <ul className="list-none m-0 p-0 space-y-2">
            {stimuli.map(s => {
              const open = openId === s.id;
              return (
                <li key={s.id} className="rounded-xl border border-outline-variant overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : s.id)}
                      className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                      aria-expanded={open}
                    >
                      <ChevronDown
                        size={15}
                        aria-hidden
                        style={{
                          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform .16s ease',
                          flexShrink: 0,
                        }}
                        className="text-on-surface-variant"
                      />
                      <span className="text-sm text-on-surface truncate">
                        <span className="tabular-nums text-on-surface-variant">{s.sort_order}.</span>{' '}
                        {s.title || `${s.kind} stimulus`}
                      </span>
                      <span className="text-xs text-on-surface-variant whitespace-nowrap ml-auto">
                        {s.kind} · {s.questions.length} {s.questions.length === 1 ? 'vraag' : 'vragen'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setEditing(toDraft(s)); setError(''); }}
                      aria-label="Stimulus bewerken"
                      className="text-on-surface-variant hover:text-primary transition-colors p-1"
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStimulus(s.id)}
                      aria-label="Stimulus verwijderen"
                      title={confirmDelete === s.id ? 'Klik opnieuw om te verwijderen — de vragen gaan mee' : 'Verwijderen'}
                      className={`transition-colors p-1 ${
                        confirmDelete === s.id ? 'text-error' : 'text-on-surface-variant hover:text-error'
                      }`}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>

                  {open && (
                    <div className="border-t border-outline-variant px-3.5 py-3 bg-surface-container-low space-y-3">
                      {s.intro && <p className="text-xs text-on-surface-variant m-0 italic">{s.intro}</p>}

                      {s.kind === 'text' && s.body_html && (
                        <div
                          className="text-xs text-on-surface leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: s.body_html }}
                        />
                      )}
                      {s.kind === 'image' && s.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image_url} alt={s.image_alt ?? ''} className="rounded-lg max-w-xs" />
                      )}
                      {s.kind === 'audio' && (
                        s.audio_url
                          ? <audio controls src={s.audio_url} className="w-full max-w-sm" />
                          : <p className="text-xs text-error m-0">Nog geen audio gegenereerd.</p>
                      )}

                      <ul className="list-none m-0 p-0 space-y-1.5">
                        {s.questions.map(q => {
                          const correct = q.question_options.find(o => o.is_correct);
                          return (
                            <li key={q.id} className="flex items-start justify-between gap-3">
                              <span className="text-xs text-on-surface">
                                <span className="tabular-nums text-on-surface-variant">{q.sort_order}.</span>{' '}
                                {q.prompt}
                                <span className="text-on-surface-variant">
                                  {' '}· {q.question_options.length} opties
                                  {q.option_layout !== 'text' && ` · ${q.option_layout}`}
                                  {correct ? ` · juist ${correct.label}` : ' · GEEN JUIST ANTWOORD'}
                                </span>
                              </span>
                              <Link
                                href={`/${locale}/admin/questions/${q.id}/edit`}
                                className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                              >
                                Bewerken
                              </Link>
                            </li>
                          );
                        })}
                      </ul>

                      <Link
                        href={`/${locale}/admin/questions/new`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Plus size={13} aria-hidden />
                        Vraag toevoegen
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Stimulus editor ── */}
      {editing && (
        <div className="rounded-2xl border border-primary/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-headline font-bold text-on-surface m-0">
              {editing.id ? `Stimulus #${editing.id} bewerken` : 'Nieuwe stimulus'}
            </h3>
            <button
              type="button"
              onClick={() => { setEditing(null); setError(''); }}
              aria-label="Sluiten"
              className="text-on-surface-variant hover:text-on-surface p-1"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Soort">
              <select
                value={editing.kind}
                onChange={e => setEditing({ ...editing, kind: e.target.value as StimulusDraft['kind'] })}
                className="field"
              >
                <option value="text">Tekst</option>
                <option value="image">Afbeelding</option>
                {exam.skill === 'luisteren' && <option value="audio">Audio</option>}
              </select>
            </Field>
            <Field label="Positie">
              <input
                type="number"
                min={1}
                value={editing.sort_order}
                onChange={e => setEditing({ ...editing, sort_order: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className="field"
              />
            </Field>
            <Field label="Tekstsoort">
              <select
                value={editing.section_id ?? ''}
                onChange={e => setEditing({ ...editing, section_id: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="field"
              >
                <option value="">—</option>
                {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name_nl}</option>)}
              </select>
            </Field>
          </div>

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
            <Field label="Tekst (HTML)" hint="Alinea's als <p>…</p>. Dit is de linkerkolom die de kandidaat leest.">
              <textarea
                value={editing.body_html}
                onChange={e => setEditing({ ...editing, body_html: e.target.value })}
                rows={8}
                className="field resize-y font-mono text-xs"
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

          {editing.kind === 'audio' && (
            <>
              <Field label="Audio-URL" hint="Bestand in de question-audio bucket.">
                <input
                  value={editing.audio_url}
                  onChange={e => setEditing({ ...editing, audio_url: e.target.value })}
                  placeholder="https://…/stimulus.mp3"
                  className="field"
                />
              </Field>
              <Field
                label="Script"
                hint="De dialoog waar de audio uit is gegenereerd. Bewaren, anders is regenereren onmogelijk."
              >
                <textarea
                  value={editing.script}
                  onChange={e => setEditing({ ...editing, script: e.target.value })}
                  rows={6}
                  className="field resize-y font-mono text-xs"
                />
              </Field>
            </>
          )}

          <Field label="Status">
            <select
              value={editing.review_status}
              onChange={e => setEditing({ ...editing, review_status: e.target.value as 'pending' | 'validated' })}
              className="field"
            >
              <option value="pending">Nog nakijken</option>
              <option value="validated">Nagekeken door docent</option>
            </select>
          </Field>

          <button
            type="button"
            onClick={saveStimulus}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
            Opslaan
          </button>
        </div>
      )}

      <style>{`
        .field {
          width: 100%;
          border: 1px solid var(--color-outline-variant);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: var(--color-surface);
          color: var(--color-on-surface);
        }
        .field:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Field({
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
