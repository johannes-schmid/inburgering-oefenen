'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  BookmarkPlus,
  ChartNoAxesColumn,
  Check,
  Loader2,
  RefreshCw,
  SearchIcon,
  TriangleAlert,
  XIcon,
} from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import { DataGrid } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from '@/components/reui/frame';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { createClient } from '@/lib/supabase/client';
import { categoryLabel, MAX_CRITERION_SCORE, pctFromCriteria } from '@/lib/rubrics';
import { signRecording } from '../_actions';
import type { InboxRow } from '../page';

/**
 * The docent's review inbox: list on the left, one submission open on the right.
 *
 * ## Both scores are kept, and that is the point
 * Her score is written as a **second row** in `open_criterion_scores` with `source='teacher'`, next
 * to the model's `source='ai'` row — `UNIQUE (submission_id, criterion_key, source)` allows exactly
 * that. Overwriting the model's row would be simpler and would destroy the only dataset that can
 * answer "is the model systematically too soft on grammatica?", which is what
 * /admin/beoordeling/evals runs on.
 *
 * So the drawer pre-fills her fields from the model's scores — agreeing is one click — but the
 * moment she saves, two independent judgements exist for every criterion.
 *
 * Writes go through the browser client like every other admin surface. That works because the
 * grading migration added an admin UPDATE policy on `open_submissions`; the baseline had SELECT
 * only, which would have failed silently at RLS with a "saved" button that saved nothing.
 */

const HEADER_CLS = 'text-on-surface font-medium';

const STATUS_LABEL: Record<InboxRow['status'], string> = {
  submitted: 'Nog niet nagekeken',
  ai_graded: 'Voorbeoordeeld',
  teacher_reviewed: 'Nagekeken',
};

const STATUS_VARIANT: Record<InboxRow['status'], 'secondary' | 'info-light' | 'success-light'> = {
  submitted: 'secondary',
  ai_graded: 'info-light',
  teacher_reviewed: 'success-light',
};

const SIGNAL_LABEL: Record<string, string> = {
  word_count: 'woorden',
  words_per_minute: 'woorden/min',
  low_confidence_word_rate: 'onzeker herkend',
  longest_silence_secs: 'langste stilte',
  mean_logprob: 'gem. zekerheid',
};

type Draft = Record<string, { score: number | null; feedback: string }>;

function fmtDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function GradingInbox({ rows, locale }: { rows: InboxRow[]; locale: string }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState<'all' | 'schrijven' | 'spreken'>('all');
  const [selected, setSelected] = useState<InboxRow | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);

  const filtered = useMemo(
    () =>
      rows.filter(r => {
        if (skill !== 'all' && r.skill !== skill) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (r.task_title ?? '').toLowerCase().includes(q) ||
          categoryLabel(r.category).toLowerCase().includes(q) ||
          (r.answer_text ?? '').toLowerCase().includes(q) ||
          (r.transcript ?? '').toLowerCase().includes(q)
        );
      }),
    [rows, skill, search]
  );

  const failed = rows.filter(r => r.grade_error).length;
  const ungraded = rows.filter(r => r.status === 'submitted').length;

  const columns = useMemo<ColumnDef<InboxRow>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="Ingeleverd" column={column} className={HEADER_CLS} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-on-surface-variant tabular-nums">
            {fmtDateTime(row.original.created_at)}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'skill',
        header: ({ column }) => (
          <DataGridColumnHeader title="Onderdeel" column={column} className={HEADER_CLS} />
        ),
        cell: ({ row }) => (
          <span className="text-sm capitalize">{row.original.skill}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <DataGridColumnHeader title="Soort opdracht" column={column} className={HEADER_CLS} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{categoryLabel(row.original.category)}</span>
        ),
        size: 210,
      },
      {
        id: 'answer',
        header: () => <span className={HEADER_CLS}>Antwoord</span>,
        cell: ({ row }) => {
          const body = row.original.answer_text ?? row.original.transcript ?? '';
          return (
            <span className="text-sm text-on-surface-variant line-clamp-1">
              {body.trim() || (row.original.has_audio ? '(alleen opname)' : '(leeg)')}
            </span>
          );
        },
        size: 260,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} className={HEADER_CLS} />
        ),
        cell: ({ row }) =>
          row.original.grade_error ? (
            <Badge variant="secondary" className="gap-1">
              <TriangleAlert className="w-3 h-3" />
              Mislukt
            </Badge>
          ) : (
            <Badge variant={STATUS_VARIANT[row.original.status]}>
              {STATUS_LABEL[row.original.status]}
            </Badge>
          ),
        size: 150,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filtered,
    pageCount: Math.ceil((filtered.length || 0) / pagination.pageSize),
    getRowId: row => String(row.id),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${
        selected ? 'pr-[560px]' : ''
      }`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Beoordelen</h1>
        <p className="text-on-surface-variant text-sm">
          {filtered.length} inzending{filtered.length === 1 ? '' : 'en'} open
          {ungraded > 0 && (
            <>
              <span className="mx-2 text-outline-variant">·</span>
              {ungraded} nog niet voorbeoordeeld
            </>
          )}
          {failed > 0 && (
            <>
              <span className="mx-2 text-outline-variant">·</span>
              <span className="text-secondary font-medium">{failed} mislukt</span>
            </>
          )}
        </p>
        </div>
        <Link
          href={`/${locale}/admin/beoordeling/evals`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          <ChartNoAxesColumn size={15} aria-hidden />
          Overeenkomst met jouw beoordeling
        </Link>
      </div>

      <DataGrid
        table={table}
        recordCount={filtered.length || 0}
        tableLayout={{ columnsResizable: true, columnsVisibility: true }}
        tableClassNames={{ edgeCell: 'px-4' }}
        onRowClick={row => setSelected(row as InboxRow)}
        emptyMessage={
          <span className="text-sm text-on-surface-variant">
            {rows.length === 0
              ? 'Nog geen inzendingen om na te kijken. Zodra een kandidaat een schrijf- of spreekopdracht inlevert, staat die hier.'
              : 'Geen inzendingen die aan dit filter voldoen.'}
          </span>
        }
      >
        <Frame className="w-full" stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>Wachtrij</FrameTitle>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                {(['all', 'schrijven', 'spreken'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSkill(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      skill === s
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {s === 'all' ? 'Alle' : s === 'schrijven' ? 'Schrijven' : 'Spreken'}
                  </button>
                ))}
              </div>
              <InputGroup className="bg-background w-56">
                <InputGroupAddon align="inline-start">
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek in antwoorden…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>
          </FrameHeader>
          <FramePanel className="p-0 shadow-none">
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>
          <FrameFooter className="py-1.5 pr-2 pl-2.5">
            <DataGridPagination />
          </FrameFooter>
        </Frame>
      </DataGrid>

      {/* The shell stays mounted so the slide transition has something to animate; the body is
          keyed on the submission id so switching rows remounts it with fresh state, rather than an
          effect resetting six useStates on every selection change. */}
      {/* Slid with an explicit `transform` rather than Tailwind's `translate-x-full`. In v4 that
          utility emits the standalone `translate` property, which Chromium only understands from
          104 — and `check-ui.mjs` ships Chromium 101, so the panel rendered on top of the table in
          every screenshot while being fine in a real browser. An unverifiable component is worse
          than a slightly more verbose one. */}
      <div
        className="fixed top-0 right-0 h-full w-[540px] bg-white border-l border-outline-variant shadow-2xl z-40 flex flex-col"
        style={{
          transform: selected ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .2s cubic-bezier(0.22,1,0.36,1)',
        }}
        aria-hidden={!selected}
      >
        {selected && (
          <SubmissionDrawer
            key={selected.id}
            row={selected}
            onClose={() => setSelected(null)}
            onSaved={() => {
              setSelected(null);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Pre-fill from the model so that agreeing costs one click — but write her own rows on save. */
function initialDraft(row: InboxRow): Draft {
  const next: Draft = {};
  for (const c of row.criteria) {
    const teacher = row.scores.find(s => s.criterion_key === c.key && s.source === 'teacher');
    const ai = row.scores.find(s => s.criterion_key === c.key && s.source === 'ai');
    const src = teacher ?? ai;
    next[c.key] = { score: src?.score ?? null, feedback: teacher?.feedback ?? ai?.feedback ?? '' };
  }
  return next;
}

function SubmissionDrawer({
  row,
  onClose,
  onSaved,
}: {
  row: InboxRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(row));
  const [notes, setNotes] = useState(row.teacher_notes ?? '');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [regrading, setRegrading] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAudio() {
    const result = await signRecording(row.id);
    if ('error' in result) setAudioError(result.error);
    else setAudioUrl(result.url);
  }

  async function regrade() {
    setRegrading(true);
    setError(null);
    try {
      const res = await fetch('/api/grade-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: row.id, force: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || 'Opnieuw nakijken mislukt.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opnieuw nakijken mislukt.');
    } finally {
      setRegrading(false);
    }
  }

  async function save() {
    const missing = row.criteria.filter(c => draft[c.key]?.score == null);
    if (missing.length > 0) {
      setError(
        `Geef een cijfer voor: ${missing.map(m => m.criterion).join(', ')}. Een criterium zonder cijfer verdwijnt uit het percentage.`
      );
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    try {
      const rows = row.criteria.map(c => ({
        submission_id: row.id,
        rubric_id: row.rubric_id,
        rubric_version: row.rubric_version,
        criterion_key: c.key,
        score: draft[c.key].score as number,
        feedback: draft[c.key].feedback.trim() || null,
        source: 'teacher' as const,
      }));

      const { error: scoreErr } = await supabase
        .from('open_criterion_scores')
        .upsert(rows, { onConflict: 'submission_id,criterion_key,source' });
      if (scoreErr) throw scoreErr;

      const { error: subErr } = await supabase
        .from('open_submissions')
        .update({
          teacher_result: {
            criteria: rows.map(r => ({
              key: r.criterion_key,
              score: r.score,
              feedback: r.feedback,
            })),
          },
          teacher_notes: notes.trim() || null,
          status: 'teacher_reviewed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (subErr) throw subErr;

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function promote() {
    setError(null);
    const supabase = createClient();
    const { error: exErr } = await supabase.from('grading_examples').insert({
      skill: row.skill,
      task_type: row.category,
      task_id: row.task_id,
      answer_text: row.answer_text,
      transcript: row.transcript,
      teacher_result: {
        criteria: row.criteria.map(c => ({
          key: c.key,
          score: draft[c.key]?.score ?? null,
          feedback: draft[c.key]?.feedback ?? null,
        })),
      },
      notes: notes.trim() || null,
      use_as_fewshot: true,
      source_submission_id: row.id,
    });
    if (exErr) setError(exErr.message);
    else setPromoted(true);
  }

  const aiPct = pctFromCriteria(
    row.scores.filter(s => s.source === 'ai'),
    row.criteria
  );
  const draftPct = pctFromCriteria(
    row.criteria
      .filter(c => draft[c.key]?.score != null)
      .map(c => ({ criterion_key: c.key, score: draft[c.key].score as number })),
    row.criteria
  );

  return (
    <>
          <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant/50 shrink-0">
            <div className="min-w-0">
              <h2 className="font-headline font-semibold text-on-surface truncate">
                {categoryLabel(row.category)}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {row.skill} {row.exam_number ? `· examen ${row.exam_number}` : ''} ·{' '}
                {fmtDateTime(row.created_at)}
                {row.rubric_version != null && ` · rubriek v${row.rubric_version}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
              aria-label="Sluiten"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">
                {error}
              </div>
            )}

            {row.grade_error && (
              <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-3 space-y-2">
                <p className="text-sm text-on-surface flex items-start gap-2">
                  <TriangleAlert size={15} className="text-secondary shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">Voorbeoordeling mislukt:</strong>{' '}
                    {row.grade_error}
                  </span>
                </p>
                <button
                  onClick={regrade}
                  disabled={regrading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                >
                  {regrading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Opnieuw proberen
                </button>
              </div>
            )}

            <Section title="De opdracht">
              {row.task_title && (
                <p className="text-sm font-medium text-on-surface">{row.task_title}</p>
              )}
              {row.task_prompt && (
                <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                  {stripHtml(row.task_prompt)}
                </p>
              )}
              {row.bullet_points.length > 0 && (
                <ul className="text-sm text-on-surface-variant list-disc pl-5 space-y-0.5">
                  {row.bullet_points.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              {row.min_sentences && (
                <p className="text-xs text-outline">Minimaal {row.min_sentences} zinnen gevraagd.</p>
              )}
              {row.images.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {row.images.map(img => (
                    <figure key={img.sort_order} className="w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={img.alt_text ?? ''}
                        className="w-24 h-20 object-cover rounded-lg border border-outline-variant"
                      />
                      {(img.caption || img.group_label) && (
                        <figcaption className="text-[0.65rem] text-outline mt-1 leading-tight">
                          {[img.group_label, img.caption].filter(Boolean).join(' · ')}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Het antwoord">
              {row.answer_json && Object.keys(row.answer_json).length > 0 && (
                <dl className="text-sm rounded-xl border border-outline-variant divide-y divide-outline-variant/60 overflow-hidden">
                  {Object.entries(row.answer_json).map(([k, v]) => (
                    <div key={k} className="flex gap-3 px-3 py-2">
                      <dt className="text-on-surface-variant w-1/3 shrink-0">{k}</dt>
                      <dd className="text-on-surface min-w-0">
                        {String(v || '') || <span className="text-outline">leeg gelaten</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {row.answer_text?.trim() && (
                <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed rounded-xl bg-surface-container-low p-3">
                  {row.answer_text}
                </p>
              )}

              {row.has_audio && (
                <div className="space-y-2">
                  {audioUrl ? (
                    <audio src={audioUrl} controls className="w-full" />
                  ) : (
                    <button
                      onClick={loadAudio}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Opname beluisteren
                      {row.audio_seconds ? ` (${row.audio_seconds}s)` : ''}
                    </button>
                  )}
                  {audioError && <p className="text-xs text-error">{audioError}</p>}
                </div>
              )}

              {row.transcript != null && (
                <div>
                  <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-1">
                    Transcriptie
                  </p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {row.transcript.trim() || '(geen spraak herkend)'}
                  </p>
                </div>
              )}

              {row.speech_signals && (
                <div>
                  <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-1.5">
                    Gemeten signalen
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(row.speech_signals)
                      .filter(([, v]) => v != null)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-xs px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant tabular-nums"
                        >
                          {SIGNAL_LABEL[k] ?? k}:{' '}
                          <strong className="text-on-surface font-semibold">
                            {k === 'low_confidence_word_rate'
                              ? `${Math.round((v as number) * 100)}%`
                              : v}
                          </strong>
                        </span>
                      ))}
                  </div>
                  <p className="text-[0.68rem] text-outline mt-1.5 leading-relaxed">
                    Gemeten uit de opname, geen beoordeling. Handig bij verstaanbaarheid.
                  </p>
                </div>
              )}

              {!row.answer_text?.trim() && !row.has_audio && !row.answer_json && (
                <p className="text-sm text-outline">De kandidaat heeft niets ingeleverd.</p>
              )}
            </Section>

            {row.criteria.length === 0 ? (
              <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-3 text-sm text-on-surface">
                Er is geen rubriek voor <strong>{categoryLabel(row.category)}</strong>. Maak er eerst
                één aan bij Rubrieken — zonder criteria valt er niets te scoren.
              </div>
            ) : (
              <Section
                title="Jouw beoordeling"
                aside={
                  <span className="text-xs text-on-surface-variant tabular-nums">
                    {aiPct != null && <>model {aiPct}%</>}
                    {aiPct != null && draftPct != null && ' → '}
                    {draftPct != null && (
                      <strong className="text-primary font-bold">jij {draftPct}%</strong>
                    )}
                  </span>
                }
              >
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  De cijfers zijn voorgevuld met de voorbeoordeling. Pas aan waar je het anders ziet
                  — beide blijven bewaard, zodat we kunnen meten waar het model afwijkt.
                </p>

                {row.criteria.map(c => {
                  const ai = row.scores.find(s => s.criterion_key === c.key && s.source === 'ai');
                  const d = draft[c.key] ?? { score: null, feedback: '' };
                  const changed = ai != null && d.score != null && d.score !== ai.score;
                  return (
                    <div
                      key={c.key}
                      className="rounded-xl border border-outline-variant p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface">{c.criterion}</p>
                          {c.description && (
                            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                              {c.description}
                            </p>
                          )}
                        </div>
                        {changed && (
                          <Badge variant="info-light" className="shrink-0">
                            gewijzigd
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: MAX_CRITERION_SCORE + 1 }, (_, n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setDraft(p => ({ ...p, [c.key]: { ...d, score: n } }))
                            }
                            title={c.anchors?.[String(n) as '0']}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-bold tabular-nums transition-colors ${
                              d.score === n
                                ? 'bg-primary text-white'
                                : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {n}
                            {ai?.score === n && (
                              <span
                                className={`ml-1 text-[0.6rem] font-medium ${
                                  d.score === n ? 'text-white/70' : 'text-outline'
                                }`}
                              >
                                model
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {d.score != null && c.anchors?.[String(d.score) as '0'] && (
                        <p className="text-[0.7rem] text-outline leading-relaxed italic">
                          {c.anchors[String(d.score) as '0']}
                        </p>
                      )}

                      <textarea
                        value={d.feedback}
                        onChange={e =>
                          setDraft(p => ({ ...p, [c.key]: { ...d, feedback: e.target.value } }))
                        }
                        rows={2}
                        placeholder="Feedback voor de kandidaat…"
                        className="w-full border border-outline-variant rounded-lg px-2.5 py-2 text-sm resize-y outline-none focus:border-primary bg-surface"
                      />
                    </div>
                  );
                })}

                {row.ai_overall && (
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-1">
                      Samenvatting van het model
                    </p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {row.ai_overall}
                    </p>
                    {row.ai_tips.length > 0 && (
                      <ul className="text-sm text-on-surface-variant list-disc pl-5 mt-1.5 space-y-0.5">
                        {row.ai_tips.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wide">
                    Notitie (alleen voor jou)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Waarom wijk je af? Dit komt mee als je dit antwoord als voorbeeld gebruikt."
                    className="w-full border border-outline-variant rounded-lg px-2.5 py-2 text-sm resize-y outline-none focus:border-primary bg-surface"
                  />
                </div>
              </Section>
            )}
          </div>

          <div className="border-t border-outline-variant/50 px-6 py-4 shrink-0 flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              disabled={saving || row.criteria.length === 0}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Opslaan…
                </>
              ) : (
                <>
                  <Check size={15} /> Nagekeken
                </>
              )}
            </button>

            <button
              onClick={promote}
              disabled={promoted || row.criteria.length === 0}
              className="inline-flex items-center gap-2 border border-outline-variant px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
              title="Voeg dit antwoord met jouw cijfers toe als ijkvoorbeeld voor toekomstige voorbeoordelingen"
            >
              <BookmarkPlus size={15} />
              {promoted ? 'Toegevoegd' : 'Gebruik als voorbeeld'}
            </button>

            <button
              onClick={regrade}
              disabled={regrading}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-50"
            >
              {regrading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Opnieuw voorbeoordelen
            </button>
          </div>
    </>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wide">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
