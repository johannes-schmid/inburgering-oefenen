'use client';

import { useMemo, useState } from 'react';
import { Check, CircleAlert, Search } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_LEVEL, LEVELS, SKILLS, levelLabel, type Level } from '@/data/skills';
import type { ContentRow } from '@/lib/admin/content-rows';
import ContentSheet from './ContentSheet';

const SKILL_LABELS: Record<string, string> = {
  lezen: 'Lezen',
  luisteren: 'Luisteren',
  schrijven: 'Schrijven',
  spreken: 'Spreken',
};

const STATUS_LABELS: Record<string, string> = {
  all: 'Alle statussen',
  pending: 'Concept',
  validated: 'Nagekeken',
};

/**
 * What is missing on an item, as a list of Dutch words.
 *
 * A `null` flag means the field does not apply here — a Lezen question has no audio to be missing —
 * and is skipped rather than counted as incomplete. Shared by the column and the filter so the
 * count on the toggle can never disagree with the rows it shows.
 */
function missingFields(row: ContentRow): string[] {
  const missing: string[] = [];
  if (row.hasAnswerKey === false) missing.push('antwoord');
  if (row.hasExplanation === false) missing.push('uitleg');
  if (row.hasAudio === false) missing.push('audio');
  if (row.hasImages === false) missing.push('plaatjes');
  if (row.hasModelAnswer === false) missing.push('voorbeeld');
  if (row.hasRubric === false) missing.push('rubriek');
  return missing;
}

function isIncomplete(row: ContentRow): boolean {
  return missingFields(row).length > 0;
}

/**
 * The merged content list.
 *
 * Filtering is client-side over the whole set on purpose: 40 exams × up to 25 items is a few
 * hundred rows, which is nothing to hold in memory and makes tab switching instant. If the corpus
 * ever reaches a size where that stops being true, this is the component to paginate — the data
 * loader is already a single call.
 */
/**
 * Does this row belong under the level tab being viewed?
 *
 * A `null` level means the onderdeel is not CEFR-graded (KNM's shape), so it shows under
 * every tab rather than none — it is required alongside A2 *and* B1, and hiding it from both
 * would make its content unreachable from the only screen that lists items.
 */
function atLevel(rowLevel: Level | null, tab: Level): boolean {
  return rowLevel === null || rowLevel === tab;
}

export default function ContentTable({ rows, locale }: { rows: ContentRow[]; locale: string }) {
  const [skill, setSkill] = useState<string>(SKILLS[0].slug);
  const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);
  const [exam, setExam] = useState('all');
  const [status, setStatus] = useState('all');
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [query, setQuery] = useState('');
  const [openUid, setOpenUid] = useState<string | null>(null);

  // Per level, so switching to B1 shows how much of each skill is authored there rather than
  // A2's totals over an empty table.
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) if (atLevel(r.level, level)) m[r.skill] = (m[r.skill] ?? 0) + 1;
    return m;
  }, [rows, level]);

  const levelCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) for (const l of LEVELS) if (atLevel(r.level, l)) m[l] = (m[l] ?? 0) + 1;
    return m;
  }, [rows]);

  const forSkill = useMemo(
    () => rows.filter(r => atLevel(r.level, level) && r.skill === skill),
    [rows, level, skill]
  );

  const examNumbers = useMemo(
    () => [...new Set(forSkill.map(r => r.examNumber))].sort((a, b) => a - b),
    [forSkill]
  );

  const incompleteCount = useMemo(() => forSkill.filter(isIncomplete).length, [forSkill]);
  const pendingCount = useMemo(
    () => forSkill.filter(r => r.reviewStatus === 'pending').length,
    [forSkill]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forSkill.filter(r => {
      if (exam !== 'all' && String(r.examNumber) !== exam) return false;
      if (status !== 'all' && r.reviewStatus !== status) return false;
      if (onlyIncomplete && !isIncomplete(r)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.stimulusTitle ?? '').toLowerCase().includes(q) ||
        r.typeLabel.toLowerCase().includes(q)
      );
    });
  }, [forSkill, exam, status, onlyIncomplete, query]);

  const open = rows.find(r => r.uid === openUid) ?? null;

  return (
    <div className="space-y-4">
      <Tabs
        value={skill}
        onValueChange={v => {
          setSkill(String(v));
          // The exam filter is per skill — Lezen 7 and Spreken 7 are different exams, and keeping
          // the number selected across a tab switch silently hides most of the new tab.
          setExam('all');
          setOnlyIncomplete(false);
        }}
      >
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {SKILLS.map(s => (
            <TabsTrigger key={s.slug} value={s.slug} className="flex-none px-3">
              {SKILL_LABELS[s.slug]}
              <span className="ml-1.5 text-xs text-on-surface-variant tabular-nums">
                {counts[s.slug] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant"
            aria-hidden
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek in vragen en opdrachten…"
            aria-label="Zoeken"
            className="h-9 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pr-3 pl-9 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <Select value={exam} onValueChange={v => setExam(String(v))}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Examen">
            {/* Base UI renders the raw value unless given a render function, which showed
                "all" and "a2" in the triggers. */}
            <SelectValue>{(v: unknown) => (v === 'all' ? 'Alle examens' : `Examen ${v}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle examens</SelectItem>
            {examNumbers.map(n => (
              <SelectItem key={n} value={String(n)}>
                Examen {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={v => setStatus(String(v))}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Status">
            <SelectValue>{(v: unknown) => STATUS_LABELS[String(v)] ?? 'Status'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="pending">Concept ({pendingCount})</SelectItem>
            <SelectItem value="validated">Nagekeken</SelectItem>
          </SelectContent>
        </Select>

        {/* A toggle rather than a third dropdown: "wat moet ik nog afmaken" is the one question
            this screen exists to answer, and it should be one click away. */}
        <button
          type="button"
          onClick={() => setOnlyIncomplete(v => !v)}
          aria-pressed={onlyIncomplete}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors ${
            onlyIncomplete
              ? 'border-primary bg-primary text-white'
              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <CircleAlert size={14} aria-hidden />
          Alleen onvolledig
          <span className="tabular-nums opacity-70">{incompleteCount}</span>
        </button>

        {/* A real filter now: `exams.level` exists (20260802000000_b1_level.sql) and every
            ContentRow carries it. The count beside each option is what makes an empty B1 list
            read as "nothing authored yet" rather than as a broken filter. */}
        <Select value={level} onValueChange={v => setLevel(v as Level)}>
          <SelectTrigger className="h-9 w-[130px]" aria-label="Niveau">
            <SelectValue>{(v: unknown) => String(v).toUpperCase()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map(l => (
              <SelectItem key={l} value={l}>
                {levelLabel(l)}
                <span className="ml-1.5 tabular-nums opacity-60">{levelCounts[l] ?? 0}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Examen</TableHead>
              <TableHead className="w-[46px] text-right">#</TableHead>
              <TableHead>Inhoud</TableHead>
              <TableHead className="w-[150px]">Soort</TableHead>
              <TableHead className="w-[170px]">Compleet</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-on-surface-variant">
                  {forSkill.length === 0
                    ? 'Nog geen content voor dit onderdeel.'
                    : 'Niets gevonden met deze filters.'}
                </TableCell>
              </TableRow>
            )}

            {filtered.map(r => (
              <TableRow
                key={r.uid}
                onClick={() => setOpenUid(r.uid)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenUid(r.uid);
                  }
                }}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-secondary"
              >
                <TableCell className="text-xs text-on-surface-variant tabular-nums">
                  {r.examNumber}
                  {!r.examPublished && <span title="Niet gepubliceerd"> ·</span>}
                </TableCell>
                <TableCell className="text-right text-xs text-on-surface-variant tabular-nums">
                  {r.sortOrder}
                </TableCell>
                <TableCell className="max-w-0">
                  <p className="truncate text-sm text-on-surface">{r.title}</p>
                  {r.stimulusTitle && (
                    <p className="truncate text-xs text-on-surface-variant">{r.stimulusTitle}</p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-on-surface-variant">{r.typeLabel}</TableCell>
                <TableCell>
                  <Completeness row={r} />
                </TableCell>
                <TableCell>
                  {r.reviewStatus === 'validated' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803d]">
                      <Check size={13} strokeWidth={2.6} aria-hidden /> Nagekeken
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-on-surface-variant">
                      Concept
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-on-surface-variant">
        {filtered.length} van {forSkill.length} items
      </p>

      <ContentSheet
        row={open}
        locale={locale}
        onClose={() => setOpenUid(null)}
      />
    </div>
  );
}

/**
 * What is still missing on this item.
 *
 * Only shows what is *absent*: a row of green ticks is noise on a screen whose whole job is to
 * find the gaps. A `null` flag means the field does not apply to this item — a Lezen question has
 * no audio to be missing — and is skipped rather than shown as incomplete.
 */
function Completeness({ row }: { row: ContentRow }) {
  const missing = missingFields(row);
  if (missing.length === 0) {
    return <span className="text-xs text-on-surface-variant">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <CircleAlert size={13} aria-hidden />
      {missing.join(', ')}
    </span>
  );
}
