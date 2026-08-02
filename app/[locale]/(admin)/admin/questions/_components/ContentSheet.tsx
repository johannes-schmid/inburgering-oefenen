'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AudioLines, BadgeCheck, Check, ExternalLink, Loader2, Sparkles, TriangleAlert,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { ContentRow } from '@/lib/admin/content-rows';
import type { AuthorAction } from '@/lib/ai/author';

/**
 * The editing drawer for one item, whichever table it came from.
 *
 * ## What it deliberately does not carry
 * Per-option image sets, stimulus reassignment and the form-schema editor stay in the full-page
 * editors. A drawer that does everything is a second implementation of those forms, and the
 * option-reconciliation rules in `QuestionForm` (options matched **by label**, never deleted and
 * re-inserted, because a delete cascades `user_question_results.chosen_option_id` to NULL) are
 * exactly the kind of thing that gets lost in a re-implementation. The drawer edits text and
 * status; "Volledige editor" opens the rest.
 *
 * ## AI drafting writes to the form, never to the database
 * Every "voorstellen" button fills a field the docent then reads, edits and saves herself, and no
 * AI action touches `review_status`. That is what keeps "door een docent gevalideerd" true while
 * still saving her the blank page.
 */

type QuestionDetail = {
  id: number;
  prompt: string;
  explanation: string | null;
  review_status: 'pending' | 'validated';
  prompt_audio_url: string | null;
  question_options: { id: number; label: string; body: string | null; is_correct: boolean }[];
  stimuli: { id: number; title: string | null; kind: string; body_html: string | null; script: string | null; audio_url: string | null } | null;
};

type TaskDetail = {
  id: number;
  title: string | null;
  prompt_html: string | null;
  prompt_script: string | null;
  model_answer: string | null;
  review_status: 'pending' | 'validated';
  prompt_audio_url: string | null;
};

export default function ContentSheet({
  row,
  locale,
  onClose,
}: {
  row: ContentRow | null;
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [task, setTask] = useState<TaskDetail | null>(null);
  /** Which row the loaded detail belongs to; `loading` is derived from it rather than stored. */
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!row) return;
    // Every setState below happens after an await. Setting a "loading" flag synchronously here
    // is what react-hooks/set-state-in-effect objects to, and deriving it from `loadedUid`
    // avoids the extra render as well as the lint error.
    if (!force && loadedUid === row.uid) return;
    if (row.kind === 'question') {
      const { data, error: err } = await supabase
        .from('questions')
        .select(
          'id, prompt, explanation, review_status, prompt_audio_url, ' +
            'question_options(id, label, body, is_correct), ' +
            'stimuli(id, title, kind, body_html, script, audio_url)'
        )
        .eq('id', row.id)
        .single();
      if (err) setError(err.message);
      else {
        setQuestion(data as unknown as QuestionDetail);
        setTask(null);
      }
    } else {
      const { data, error: err } = await supabase
        .from('open_tasks')
        .select('id, title, prompt_html, prompt_script, model_answer, review_status, prompt_audio_url')
        .eq('id', row.id)
        .single();
      if (err) setError(err.message);
      else {
        setTask(data as unknown as TaskDetail);
        setQuestion(null);
      }
    }
    setLoadedUid(row.uid);
  }, [row, supabase, loadedUid]);

  useEffect(() => {
    // The rule flags any setState reachable from an effect. Here the effect is doing exactly what
    // effects are for — synchronising with an external system (the database) when the selected row
    // changes — and the state it sets is the fetched row, after an await. The `loadedUid` guard
    // above means it cannot loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const loading = row != null && loadedUid !== row.uid;

  /** Ask for a draft and drop it into a field. Never saves — the docent does that. */
  async function draft(action: AuthorAction, current: string, apply: (text: string) => void) {
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const context =
        row?.kind === 'question'
          ? [question?.stimuli?.body_html, question?.stimuli?.script, question?.prompt]
              .filter(Boolean)
              .join('\n\n')
          : [task?.title, task?.prompt_html].filter(Boolean).join('\n\n');

      const res = await fetch('/api/admin/draft-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: current, context, skill: row?.skill }),
      });
      const json = await res.json();
      if (!res.ok || !json.text) throw new Error(json.error || 'Het voorstel is niet gelukt.');
      apply(json.text);
      setNote('Voorstel ingevuld. Lees het na en sla het op — het is nog niet bewaard.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Het voorstel is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  async function save(patch: Record<string, unknown>) {
    if (!row) return;
    setBusy('save');
    setError(null);
    const table = row.kind === 'question' ? 'questions' : 'open_tasks';
    const { error: err } = await supabase.from(table).update(patch).eq('id', row.id);
    setBusy(null);
    if (err) {
      setError(err.message);
      return;
    }
    setNote('Opgeslagen.');
    router.refresh();
    void load(true);
  }

  async function generateAudio(kind: 'question' | 'stimulus' | 'task') {
    setBusy(`audio-${kind}`);
    setError(null);
    setNote(null);
    try {
      const [url, body] =
        kind === 'stimulus'
          ? ['/api/generate-stimulus-audio', { stimulusId: question?.stimuli?.id, force: true }]
          : kind === 'task'
            ? ['/api/generate-question-audio', { openTaskId: row?.id }]
            : ['/api/generate-question-audio', { id: row?.id }];

      const res = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Audio genereren is niet gelukt.');
      // The stimulus route reports per-item failures inside a 200 — a batch where everything
      // failed is not an error response, and treating it as success would be a lie.
      if (Array.isArray(json.failed) && json.failed.length > 0) {
        throw new Error(json.failed.map((f: { error: string }) => f.error).join('; '));
      }
      setNote('Audio gegenereerd.');
      router.refresh();
      void load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio genereren is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  const validated = (question ?? task)?.review_status === 'validated';

  return (
    <Sheet open={row != null} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {row && (
          <div className="flex flex-col gap-5 p-6">
            <header className="pr-8">
              <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                {row.skill} · examen {row.examNumber} · #{row.sortOrder}
              </p>
              <h2 className="mt-1 font-headline text-lg leading-snug font-bold text-on-surface">
                {row.kind === 'question' ? 'Vraag bewerken' : 'Opdracht bewerken'}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {validated ? (
                  // Green, not the brand orange: "nagekeken" is the good state, and orange reads
                  // as needs-attention next to the concept badge.
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803d]">
                    <Check size={13} strokeWidth={2.6} aria-hidden /> Nagekeken
                  </span>
                ) : (
                  <Badge variant="outline" className="text-on-surface-variant">Concept</Badge>
                )}
                <span className="text-xs text-on-surface-variant">{row.typeLabel}</span>
              </div>
            </header>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 size={15} className="animate-spin" aria-hidden /> Laden…
              </p>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-error-container/20 p-3 text-sm text-error">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
                {error}
              </p>
            )}
            {note && <p className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">{note}</p>}

            {question && (
              <QuestionEditor
                q={question}
                busy={busy}
                onChange={setQuestion}
                onDraft={draft}
                onSave={save}
                onAudio={generateAudio}
              />
            )}

            {task && (
              <TaskEditor
                t={task}
                busy={busy}
                skill={row.skill}
                onChange={setTask}
                onDraft={draft}
                onSave={save}
                onAudio={generateAudio}
              />
            )}

            <footer className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4">
              {/* Validation is a human action and is its own button, never a side effect of
                  saving text — that distinction is the entire "door een docent gevalideerd" claim. */}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => save({ review_status: validated ? 'pending' : 'validated' })}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  validated
                    ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    : 'bg-primary text-white hover:bg-primary-container'
                }`}
              >
                <BadgeCheck size={15} aria-hidden />
                {validated ? 'Terug naar concept' : 'Markeer als nagekeken'}
              </button>

              <Link
                href={
                  row.kind === 'question'
                    ? `/${locale}/admin/questions/${row.id}/edit`
                    : `/${locale}/admin/opgaven/${row.id}/edit`
                }
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
              >
                Volledige editor
                <ExternalLink size={14} aria-hidden />
              </Link>
            </footer>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Editors ──────────────────────────────────────────────────────────────────────────────── */

type DraftFn = (action: AuthorAction, current: string, apply: (t: string) => void) => void;

function QuestionEditor({
  q, busy, onChange, onDraft, onSave, onAudio,
}: {
  q: QuestionDetail;
  busy: string | null;
  onChange: (q: QuestionDetail) => void;
  onDraft: DraftFn;
  onSave: (patch: Record<string, unknown>) => void;
  onAudio: (k: 'question' | 'stimulus' | 'task') => void;
}) {
  return (
    <div className="space-y-5">
      {q.stimuli && (
        <section className="rounded-xl border border-outline-variant p-3.5">
          <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            Stimulus · {q.stimuli.kind}
          </p>
          <p className="mt-1 text-sm font-medium text-on-surface">{q.stimuli.title || '—'}</p>
          {q.stimuli.kind === 'audio' && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {q.stimuli.audio_url && <audio controls src={q.stimuli.audio_url} className="h-9 max-w-[260px]" />}
              <AiButton
                busy={busy === 'audio-stimulus'}
                disabled={busy !== null}
                onClick={() => onAudio('stimulus')}
                icon="audio"
              >
                {q.stimuli.audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
              </AiButton>
            </div>
          )}
        </section>
      )}

      <Field label="Vraag">
        <textarea
          value={q.prompt}
          onChange={e => onChange({ ...q, prompt: e.target.value })}
          rows={3}
          className="admin-field"
        />
        <Row>
          <AiButton busy={busy === 'draft_question'} disabled={busy !== null}
            onClick={() => onDraft('draft_question', q.prompt, t => onChange({ ...q, prompt: t }))}>
            Voorstellen
          </AiButton>
          <AiButton busy={busy === 'simpler'} disabled={busy !== null}
            onClick={() => onDraft('simpler', q.prompt, t => onChange({ ...q, prompt: t }))}>
            Makkelijker
          </AiButton>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ prompt: q.prompt })} />
        </Row>
      </Field>

      <section>
        <p className="mb-2 text-sm font-medium text-on-surface">Antwoordopties</p>
        <ul className="list-none space-y-1.5 p-0">
          {[...q.question_options].sort((a, b) => a.label.localeCompare(b.label)).map(o => (
            <li key={o.id} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 w-5 shrink-0 font-bold ${o.is_correct ? 'text-primary' : 'text-on-surface-variant'}`}>
                {o.label}
              </span>
              <span className="text-on-surface">{o.body || <em className="text-on-surface-variant">afbeelding</em>}</span>
              {o.is_correct && <Check size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-on-surface-variant">
          Opties en het juiste antwoord wijzig je in de volledige editor — die bewaart de koppeling
          met eerder gegeven antwoorden.
        </p>
      </section>

      <Field label="Uitleg">
        <textarea
          value={q.explanation ?? ''}
          onChange={e => onChange({ ...q, explanation: e.target.value })}
          rows={4}
          placeholder="Waarom is dit het juiste antwoord?"
          className="admin-field"
        />
        <Row>
          <AiButton busy={busy === 'draft_explanation'} disabled={busy !== null}
            onClick={() => onDraft('draft_explanation', q.explanation ?? '', t => onChange({ ...q, explanation: t }))}>
            Voorstellen
          </AiButton>
          <AiButton busy={busy === 'shorter'} disabled={busy !== null}
            onClick={() => onDraft('shorter', q.explanation ?? '', t => onChange({ ...q, explanation: t }))}>
            Korter
          </AiButton>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ explanation: q.explanation })} />
        </Row>
      </Field>

      <Field label="Vraag voorlezen">
        <div className="flex flex-wrap items-center gap-2">
          {q.prompt_audio_url && <audio controls src={q.prompt_audio_url} className="h-9 max-w-[260px]" />}
          <AiButton busy={busy === 'audio-question'} disabled={busy !== null} onClick={() => onAudio('question')} icon="audio">
            {q.prompt_audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
          </AiButton>
        </div>
      </Field>
    </div>
  );
}

function TaskEditor({
  t, busy, skill, onChange, onDraft, onSave, onAudio,
}: {
  t: TaskDetail;
  busy: string | null;
  skill: string;
  onChange: (t: TaskDetail) => void;
  onDraft: DraftFn;
  onSave: (patch: Record<string, unknown>) => void;
  onAudio: (k: 'question' | 'stimulus' | 'task') => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Titel">
        <input
          value={t.title ?? ''}
          onChange={e => onChange({ ...t, title: e.target.value })}
          className="admin-field"
        />
        <Row>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ title: t.title })} />
        </Row>
      </Field>

      <Field label="Opdracht">
        <textarea
          value={t.prompt_html ?? ''}
          onChange={e => onChange({ ...t, prompt_html: e.target.value })}
          rows={6}
          className="admin-field font-mono text-xs"
        />
        <Row>
          <AiButton busy={busy === 'draft_task'} disabled={busy !== null}
            onClick={() => onDraft('draft_task', t.prompt_html ?? '', v => onChange({ ...t, prompt_html: v }))}>
            Voorstellen
          </AiButton>
          <AiButton busy={busy === 'longer'} disabled={busy !== null}
            onClick={() => onDraft('longer', t.prompt_html ?? '', v => onChange({ ...t, prompt_html: v }))}>
            Langer
          </AiButton>
          <AiButton busy={busy === 'shorter'} disabled={busy !== null}
            onClick={() => onDraft('shorter', t.prompt_html ?? '', v => onChange({ ...t, prompt_html: v }))}>
            Korter
          </AiButton>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ prompt_html: t.prompt_html })} />
        </Row>
      </Field>

      {skill === 'spreken' && (
        <Field label="Gesproken opdracht" hint="Wat de kandidaat hoort. Niet hetzelfde als de tekst hierboven.">
          <textarea
            value={t.prompt_script ?? ''}
            onChange={e => onChange({ ...t, prompt_script: e.target.value })}
            rows={3}
            className="admin-field"
          />
          <Row>
            <SaveButton busy={busy === 'save'} onClick={() => onSave({ prompt_script: t.prompt_script })} />
            <AiButton busy={busy === 'audio-task'} disabled={busy !== null} onClick={() => onAudio('task')} icon="audio">
              {t.prompt_audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
            </AiButton>
          </Row>
          {t.prompt_audio_url && <audio controls src={t.prompt_audio_url} className="mt-2 h-9 max-w-[260px]" />}
        </Field>
      )}

      <Field label="Voorbeeldantwoord" hint="Wordt nooit naar de kandidaat gestuurd — het is de scoringssleutel.">
        <textarea
          value={t.model_answer ?? ''}
          onChange={e => onChange({ ...t, model_answer: e.target.value })}
          rows={5}
          className="admin-field"
        />
        <Row>
          <AiButton busy={busy === 'draft_model_answer'} disabled={busy !== null}
            onClick={() => onDraft('draft_model_answer', t.model_answer ?? '', v => onChange({ ...t, model_answer: v }))}>
            Voorstellen
          </AiButton>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ model_answer: t.model_answer })} />
        </Row>
      </Field>
    </div>
  );
}

/* ── Bits ─────────────────────────────────────────────────────────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-on-surface">{label}</label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
      <style>{`
        .admin-field {
          width:100%; border-radius:12px; border:1.5px solid var(--color-outline-variant);
          background:var(--color-surface-container-lowest); padding:9px 12px; font:inherit;
          font-size:0.875rem; color:var(--color-on-surface); resize:vertical;
        }
        .admin-field:focus { outline:none; border-color:var(--color-primary); }
      `}</style>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5 pt-0.5">{children}</div>;
}

function AiButton({
  children, busy, disabled, onClick, icon = 'ai',
}: {
  children: React.ReactNode;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  icon?: 'ai' | 'audio';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" aria-hidden />
      ) : icon === 'audio' ? (
        <AudioLines size={13} aria-hidden />
      ) : (
        <Sparkles size={13} aria-hidden />
      )}
      {children}
    </button>
  );
}

function SaveButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
    >
      {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Check size={13} aria-hidden />}
      Opslaan
    </button>
  );
}
