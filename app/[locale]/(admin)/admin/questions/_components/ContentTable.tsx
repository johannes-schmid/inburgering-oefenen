'use client';

import { useMemo, useState, useCallback } from 'react';
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
  AudioLines, Check, ChevronDown, CircleAlert, FunnelIcon, ImageIcon, Pencil, Plus, SearchIcon,
  TextIcon, XIcon,
} from 'lucide-react';

import { Badge } from '@/components/reui/badge';
import { DataGrid } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from '@/components/reui/frame';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
} from '@/components/ui/input-group';

import { catalogueOnderdelen, type Level } from '@/data/skills';
import { levelParam } from '@/lib/admin/nav';
import type { ContentRow } from '@/lib/admin/content-rows';
import type { AuthoringContext, AuthoringStimulus } from '@/lib/admin/authoring';
import { examLabel, isBacklog } from '@/lib/admin/backlog';
import CatalogueProgress from './CatalogueProgress';

const SKILL_LABELS: Record<string, string> = {
  lezen: 'Lezen',
  luisteren: 'Luisteren',
  schrijven: 'Schrijven',
  spreken: 'Spreken',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Concept',
  validated: 'Nagekeken',
};

const HEADER_CLS = 'text-on-surface font-medium';

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
 * Does this row belong under the catalogue tab being viewed?
 *
 * The `null` tab **is** KNM (see `AdminLevel` in lib/admin/nav.ts), and it shows only rows
 * whose own level is null.
 *
 * Before that tab existed, a null-level row showed under *every* level tab, on the reasoning
 * that hiding it from both would make it unreachable from the only screen that lists items.
 * That reasoning is now satisfied by KNM having a tab of its own, and leaving the old rule in
 * place would put 419 KNM questions inside the A2 and B1 tabs as well — where they are not
 * part of the catalogue those tabs count.
 */
function atLevel(rowLevel: Level | null, tab: Level | null): boolean {
  return rowLevel === tab;
}

/**
 * One line in the grid: either a fragment (the parent) or an item hanging off it.
 *
 * Lezen and Luisteren are authored as "a text, and the 2–3 questions about it" — that unit is
 * what moves between exams, and a flat list of questions hid it. So the fragment is a row and
 * its questions nest underneath, which also makes an orphan fragment (no questions yet) and an
 * over-full one visible at a glance rather than only in the publish validator.
 *
 * Schrijven and Spreken have no stimulus at all, so those tabs stay flat.
 */
type GridRow =
  | { kind: 'fragment'; uid: string; stimulus: AuthoringStimulus; items: ContentRow[] }
  | { kind: 'item'; uid: string; row: ContentRow; nested: boolean };

/**
 * The authoring surface: every item of one onderdeel, grouped under the fragment it belongs to.
 *
 * **This is where content is written.** `/admin/exams` assigns items to the ten slots and does
 * not create or edit them (owner's decision, 2026-08-07) — two screens able to author the same
 * rows meant two places to break the same constraints, and the exam builder's job is "is examen
 * 3 complete?", not "what does this fragment say?".
 *
 * The level comes from the URL (`?niveau=`), set by the sidebar's sub-menu — not from a dropdown
 * here. A2 and B1 are two separately authored catalogues, so it is a place you navigate to, and
 * it has to survive a reload and be linkable. Everything else here is a filter within one level
 * and stays client-side state.
 *
 * Filtering is client-side over the whole set on purpose: 40 exams × up to 25 items is a few
 * hundred rows, which is nothing to hold in memory and makes tab switching instant.
 */
export default function ContentTable({
  rows,
  locale,
  level,
  authoring,
  initialSkill,
}: {
  rows: ContentRow[];
  locale: string;
  /** `null` is the KNM tab — see `AdminLevel`. */
  level: Level | null;
  authoring: AuthoringContext;
  /** `?onderdeel=` — how the exam builder deep-links into the right tab. */
  initialSkill?: string;
}) {
  const router = useRouter();

  /** The onderdeel tabs of this catalogue: the four taalonderdelen, or KNM alone. */
  const tabs = useMemo(() => catalogueOnderdelen(level), [level]);

  const [skill, setSkill] = useState<string>(
    tabs.find(s => s.slug === initialSkill)?.slug ?? tabs[0].slug
  );
  const [examFilter, setExamFilter] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [query, setQuery] = useState('');
  /**
   * A fragment is edited on its own page, not in a drawer — `/admin/fragmenten/[id]`.
   *
   * The drawer could show about a fifth of a fragment at a time, and its questions were edited on
   * a different screen from the text they are about. `openFragment` is the only way this table
   * opens one, so there is exactly one place that decides where a fragment is edited.
   */
  const openFragment = useCallback(
    (id: number) => router.push(`/${locale}/admin/fragmenten/${id}`),
    [router, locale]
  );
  /**
   * Every item is edited on a full page, never in the drawer — owner's instruction, 2026-08-27.
   *
   * Where that page is depends on what the item *is*, which is the whole point:
   *
   * - a **Schrijven/Spreken opgave** goes to `/admin/opgaven/[id]/edit`, which now carries a live
   *   candidate preview, the review status and a walk to the next opgave;
   * - an **MCQ question hanging off a fragment** goes to the *fragment* page with that question
   *   opened. A Lezen question edited away from the text it is about is exactly what that page
   *   exists to prevent, so it is not given a page of its own;
   * - a **standalone question** (KNM has no stimulus) has no fragment to open, so it goes to
   *   `/admin/questions/[id]/edit`.
   *
   * The drawer stays mounted for its other job — it is still what a row *previews* into from the
   * exam builder — but nothing in this table opens it any more.
   */
  const openItem = useCallback(
    (row: ContentRow) => {
      if (row.kind === 'task') {
        router.push(`/${locale}/admin/opgaven/${row.id}/edit`);
      } else if (row.stimulusId) {
        router.push(`/${locale}/admin/fragmenten/${row.stimulusId}?vraag=${row.id}`);
      } else {
        router.push(`/${locale}/admin/questions/${row.id}/edit`);
      }
    },
    [router, locale]
  );
  /** Collapsed fragments, by id. Expanded is the default — the nesting is the point. */
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const isOpenSkill = skill === 'schrijven' || skill === 'spreken';

  // Per level, so switching to B1 shows how much of each skill is authored there rather than
  // A2's totals over an empty table.
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) if (atLevel(r.level, level)) m[r.skill] = (m[r.skill] ?? 0) + 1;
    return m;
  }, [rows, level]);

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
      if (examFilter.length && !examFilter.includes(r.examNumber)) return false;
      if (statusFilter.length && !statusFilter.includes(r.reviewStatus)) return false;
      if (onlyIncomplete && !isIncomplete(r)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.stimulusTitle ?? '').toLowerCase().includes(q) ||
        r.typeLabel.toLowerCase().includes(q)
      );
    });
  }, [forSkill, examFilter, statusFilter, onlyIncomplete, query]);

  const stimuliForSkill = useMemo(
    () => authoring.stimuli.filter(s => s.skill === skill),
    [authoring.stimuli, skill]
  );

  const sectionsForSkill = useMemo(
    () => authoring.sections.filter(s => s.topic === skill),
    [authoring.sections, skill]
  );

  const backlogExamId = authoring.backlogExamIds[skill as keyof typeof authoring.backlogExamIds];
  const hasFilters = !!query || examFilter.length > 0 || statusFilter.length > 0 || onlyIncomplete;

  /**
   * Fragments first, each followed by its (filtered) questions.
   *
   * A fragment stays in the list even when the filters hide all of its questions, as long as it
   * matches the filters itself — "which fragment has nothing on it yet" is exactly the question
   * this screen exists to answer, and dropping empty parents would hide it. Standalone questions
   * (no stimulus — the shape a KNM-style onderdeel would use) come last, unnested.
   */
  const gridRows = useMemo<GridRow[]>(() => {
    if (isOpenSkill) {
      return filtered.map(r => ({ kind: 'item' as const, uid: r.uid, row: r, nested: false }));
    }

    const byStimulus = new Map<number, ContentRow[]>();
    const standalone: ContentRow[] = [];
    for (const r of filtered) {
      if (r.stimulusId == null) { standalone.push(r); continue; }
      const list = byStimulus.get(r.stimulusId);
      if (list) list.push(r); else byStimulus.set(r.stimulusId, [r]);
    }

    const examOf = (s: AuthoringStimulus) => s.examNumber;
    const visible = stimuliForSkill
      .filter(s => {
        if (byStimulus.has(s.id)) return true;
        // An empty fragment has no question to carry the filters, so it is judged on its own
        // exam and status. A text search is about wording, so it matches on the title.
        if (examFilter.length && !examFilter.includes(examOf(s))) return false;
        if (statusFilter.length && !statusFilter.includes(s.review_status)) return false;
        if (onlyIncomplete) return true;
        const q = query.trim().toLowerCase();
        return !q || (s.title ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => examOf(a) - examOf(b) || a.sort_order - b.sort_order);

    const out: GridRow[] = [];
    for (const s of visible) {
      const items = byStimulus.get(s.id) ?? [];
      out.push({ kind: 'fragment', uid: `stimulus:${s.id}`, stimulus: s, items });
      if (!collapsed.has(s.id)) {
        for (const r of [...items].sort((a, b) => a.sortOrder - b.sortOrder)) {
          out.push({ kind: 'item', uid: r.uid, row: r, nested: true });
        }
      }
    }
    for (const r of standalone) {
      out.push({ kind: 'item', uid: r.uid, row: r, nested: false });
    }
    return out;
  }, [
    isOpenSkill, filtered, stimuliForSkill, collapsed,
    examFilter, statusFilter, onlyIncomplete, query,
  ]);

  function toggleCollapsed(id: number) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const columns = useMemo<ColumnDef<GridRow>[]>(() => [
    {
      id: 'edit',
      header: '',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (r.kind === 'fragment') openFragment(r.stimulus.id);
              else openItem(r.row);
            }}
            aria-label={r.kind === 'fragment' ? 'Fragment bewerken' : 'Item bewerken'}
            className="text-on-surface-variant hover:text-primary transition-colors p-1"
          >
            <Pencil size={14} aria-hidden />
          </button>
        );
      },
      size: 44,
      enableSorting: false,
      enableResizing: false,
    },
    {
      id: 'examNumber',
      header: ({ column }) => <DataGridColumnHeader title="Examen" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const n = row.original.kind === 'fragment'
          ? row.original.stimulus.examNumber
          : row.original.row.examNumber;
        return (
          <span className="text-sm tabular-nums text-on-surface-variant">
            {isBacklog(n) ? 'Backlog' : n}
          </span>
        );
      },
      size: 90,
      enableSorting: false,
    },
    {
      id: 'sortOrder',
      header: ({ column }) => <DataGridColumnHeader title="#" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-on-surface-variant">
          {row.original.kind === 'fragment'
            ? row.original.stimulus.sort_order
            : row.original.row.sortOrder}
        </span>
      ),
      size: 56,
      enableSorting: false,
    },
    {
      id: 'title',
      header: ({ column }) => <DataGridColumnHeader title="Inhoud" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const r = row.original;
        if (r.kind === 'fragment') {
          const s = r.stimulus;
          const isCollapsed = collapsed.has(s.id);
          const Icon = s.kind === 'audio' ? AudioLines : s.kind === 'image' ? ImageIcon : TextIcon;
          return (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleCollapsed(s.id); }}
              aria-expanded={!isCollapsed}
              className="flex items-center gap-2 min-w-0 text-left w-full"
            >
              <ChevronDown
                size={14}
                aria-hidden
                className="text-on-surface-variant shrink-0"
                style={{
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform .16s ease',
                }}
              />
              <Icon size={13} aria-hidden className="text-on-surface-variant shrink-0" />
              <span className="text-sm font-semibold text-on-surface truncate">
                {s.title || `${s.kind} fragment`}
              </span>
            </button>
          );
        }
        // The rule plus the indent is what makes the group read as a group: the fragment title
        // starts after a chevron and an icon, so a nested question needs to clear both or it
        // sits to the *left* of its own parent.
        return (
          <div
            className={
              r.nested
                ? 'min-w-0 ml-[7px] border-l-2 border-outline-variant pl-[38px]'
                : 'min-w-0'
            }
          >
            <p className="text-sm text-on-surface m-0 truncate">{r.row.title}</p>
            {!r.nested && r.row.stimulusTitle && (
              <p className="text-xs text-on-surface-variant m-0 truncate">{r.row.stimulusTitle}</p>
            )}
          </div>
        );
      },
      size: 330,
      enableSorting: false,
    },
    {
      id: 'sectionName',
      header: ({ column }) => <DataGridColumnHeader title="Tekstsoort" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const r = row.original;
        // On a nested question the tekstsoort is the fragment's and is already on the row
        // above; repeating it down the group is noise. An open task carries its own.
        if (r.kind === 'item' && r.nested) return null;
        const name = r.kind === 'fragment'
          ? authoring.sections.find(x => x.id === r.stimulus.section_id)?.name_nl ?? null
          : r.row.sectionName;
        return name
          ? <span className="text-xs text-on-surface-variant whitespace-nowrap">{name}</span>
          : <span className="text-xs font-semibold text-[#a24000] whitespace-nowrap">Geen</span>;
      },
      size: 140,
      enableSorting: false,
    },
    {
      id: 'typeLabel',
      header: ({ column }) => <DataGridColumnHeader title="Soort" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const r = row.original;
        if (r.kind === 'fragment') {
          const n = r.items.length;
          return (
            <span className="text-xs text-on-surface-variant whitespace-nowrap">
              {n} {n === 1 ? 'vraag' : 'vragen'}
            </span>
          );
        }
        return (
          <span className="text-sm text-on-surface-variant whitespace-nowrap">{r.row.typeLabel}</span>
        );
      },
      size: 120,
      enableSorting: false,
    },
    {
      id: 'complete',
      header: ({ column }) => <DataGridColumnHeader title="Compleet" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const r = row.original;
        if (r.kind === 'fragment') {
          // The fragment's own gap, not its questions': no audio file, or nothing asked about it.
          const gaps: string[] = [];
          if (r.stimulus.kind === 'audio' && !r.stimulus.audio_url) gaps.push('audio');
          if (r.items.length === 0) gaps.push('vragen');
          if (gaps.length === 0) return <span className="text-on-surface-variant text-sm">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-warning whitespace-nowrap">
              <CircleAlert size={13} strokeWidth={2.4} aria-hidden />
              {gaps.join(', ')}
            </span>
          );
        }
        const missing = missingFields(r.row);
        if (missing.length === 0) return <span className="text-on-surface-variant text-sm">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-warning whitespace-nowrap">
            <CircleAlert size={13} strokeWidth={2.4} aria-hidden />
            {missing.join(', ')}
          </span>
        );
      },
      size: 150,
      enableSorting: false,
    },
    {
      id: 'reviewStatus',
      header: ({ column }) => <DataGridColumnHeader title="Status" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const status = row.original.kind === 'fragment'
          ? row.original.stimulus.review_status
          : row.original.row.reviewStatus;
        return status === 'validated'
          ? <Badge size="sm" variant="success-light"><Check size={11} aria-hidden /> Nagekeken</Badge>
          : <Badge size="sm" variant="secondary">Concept</Badge>;
      },
      size: 120,
      enableSorting: false,
    },
  ], [collapsed, authoring.sections]);

  const table = useReactTable({
    columns,
    data: gridRows,
    pageCount: Math.ceil((gridRows.length || 0) / pagination.pageSize),
    getRowId: (row: GridRow) => row.uid,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const fragmentCount = gridRows.filter(r => r.kind === 'fragment').length;

  return (
    <div className="space-y-4">
      <Tabs value={skill} onValueChange={setSkill}>
        <TabsList>
          {tabs.map(s => (
            <TabsTrigger key={s.slug} value={s.slug}>
              {SKILL_LABELS[s.slug]}
              <span className="ml-2 text-xs tabular-nums text-on-surface-variant">
                {counts[s.slug] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <CatalogueProgress rows={forSkill} level={level} skill={skill} />

      <DataGrid
        table={table}
        recordCount={gridRows.length || 0}
        tableLayout={{ columnsResizable: true, columnsVisibility: true, width: 'auto' }}
        tableClassNames={{ edgeCell: 'px-4' }}
        onRowClick={row => {
          const r = row as GridRow;
          if (r.kind === 'fragment') openFragment(r.stimulus.id);
          else openItem(r.row);
        }}
        emptyMessage="Geen items die aan deze filters voldoen."
      >
        <Frame className="w-full" stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>
              {SKILL_LABELS[skill]}
              <span className="ml-2 text-xs font-normal text-on-surface-variant">
                {filtered.length}{hasFilters ? ` van ${forSkill.length}` : ''} items
                {!isOpenSkill && ` · ${fragmentCount} fragmenten`}
                {pendingCount > 0 && ` · ${pendingCount} concept`}
              </span>
            </FrameTitle>

            <div className="flex items-center gap-2.5">
              <InputGroup className="bg-background w-56">
                <InputGroupAddon align="inline-start"><SearchIcon /></InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek in vragen…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query.length > 0 && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton aria-label="Wissen" title="Wissen" size="icon-xs" onClick={() => setQuery('')}>
                      <XIcon />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline">
                      <FunnelIcon />
                      Examen
                      {examFilter.length > 0 && <Badge size="sm" variant="info-light">{examFilter.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-52 max-h-80 overflow-y-auto" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Examen</div>
                    {examNumbers.map(n => (
                      <div key={n} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`exam-${n}`}
                          checked={examFilter.includes(n)}
                          onCheckedChange={c =>
                            setExamFilter(prev => c === true ? [...prev, n] : prev.filter(v => v !== n))
                          }
                        />
                        <Label htmlFor={`exam-${n}`} className="flex grow items-center justify-between gap-1.5 font-normal">
                          {examLabel(n)}
                          <span className="text-muted-foreground">
                            {forSkill.filter(r => r.examNumber === n).length}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline">
                      <FunnelIcon />
                      Status
                      {statusFilter.length > 0 && <Badge size="sm" variant="info-light">{statusFilter.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-52" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Status</div>
                    {(['pending', 'validated'] as const).map(s => (
                      <div key={s} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`status-${s}`}
                          checked={statusFilter.includes(s)}
                          onCheckedChange={c =>
                            setStatusFilter(prev => c === true ? [...prev, s] : prev.filter(v => v !== s))
                          }
                        />
                        <Label htmlFor={`status-${s}`} className="flex grow items-center justify-between gap-1.5 font-normal">
                          {STATUS_LABELS[s]}
                          <span className="text-muted-foreground">
                            {forSkill.filter(r => r.reviewStatus === s).length}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant={onlyIncomplete ? 'default' : 'outline'}
                onClick={() => setOnlyIncomplete(v => !v)}
              >
                <CircleAlert />
                Onvolledig
                <Badge size="sm" variant={onlyIncomplete ? 'secondary' : 'info-light'}>{incompleteCount}</Badge>
              </Button>

              {!isOpenSkill && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/${locale}/admin/fragmenten/nieuw?niveau=${levelParam(level)}&onderdeel=${skill}`
                    )
                  }
                  disabled={!backlogExamId}
                  title={backlogExamId ? undefined : 'Geen backlog voor dit onderdeel gevonden.'}
                >
                  <Plus />
                  Fragment
                </Button>
              )}

              <Link
                href={
                  isOpenSkill
                    ? `/${locale}/admin/opgaven/new?skill=${skill}`
                    : `/${locale}/admin/questions/new`
                }
                className="inline-flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-xl text-sm font-medium no-underline hover:bg-primary-container transition-colors"
              >
                <Plus size={15} aria-hidden />
                {isOpenSkill ? 'Nieuwe opdracht' : 'Nieuwe vraag'}
              </Link>

              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQuery(''); setExamFilter([]); setStatusFilter([]); setOnlyIncomplete(false);
                  }}
                >
                  Wissen
                </Button>
              )}
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

    </div>
  );
}
