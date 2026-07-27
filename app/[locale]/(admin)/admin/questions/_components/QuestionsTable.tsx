'use client';

import { useMemo, useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { buildPexelsQuery } from '@/lib/pexels-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ColumnDef,
  getCoreRowModel,
    getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/reui/badge';
import { DataGrid } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import {
  Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle,
} from '@/components/reui/frame';
import {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchIcon, XIcon, FunnelIcon } from 'lucide-react';

type ReviewStatus = 'pending' | 'validated';

type Question = {
  id: number;
  category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct: 'A' | 'B' | 'C';
  explanation: string;
  image_url: string | null;
  exam: number | null;
  review_status: ReviewStatus;
  updated_at: string | null;
  reviewed_at: string | null;
  audio_question?: string | null;
  audio_a?: string | null;
  audio_b?: string | null;
  audio_c?: string | null;
};

const CATEGORIES = [
  'Geschiedenis en Geografie',
  'Staatsinrichting en Rechtsstaat',
  'Maatschappij en Samenleven',
  'Werk en Inkomen',
  'Gezondheid en Zorg',
  'Onderwijs',
  'Wonen',
];

const CAT_COLORS: Record<string, string> = {
  'Geschiedenis en Geografie': 'bg-blue-50 text-blue-700 border-blue-200',
  'Staatsinrichting en Rechtsstaat': 'bg-purple-50 text-purple-700 border-purple-200',
  'Maatschappij en Samenleven': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Werk en Inkomen': 'bg-amber-50 text-amber-700 border-amber-200',
  'Gezondheid en Zorg': 'bg-rose-50 text-rose-700 border-rose-200',
  'Onderwijs': 'bg-sky-50 text-sky-700 border-sky-200',
  'Wonen': 'bg-orange-50 text-orange-700 border-orange-200',
};

const HEADER_CLS = 'text-on-surface font-medium';

function fmtDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('nl-NL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

type Props = {
  questions: Question[];
  categories: string[];
};

export default function QuestionsTable({ questions, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ── Filters (client-side, URL-initialised) ─────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReviewStatus[]>([]);
  const [imageFilter, setImageFilter] = useState<'all' | 'with' | 'without'>('all');
  const [examFilter, setExamFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Initialise filters from URL params once on mount
  useEffect(() => {
    const exam = searchParams.get('exam');
    if (exam === 'assigned' || exam === 'unassigned') setExamFilter(exam);
    const status = searchParams.get('status');
    if (status === 'pending' || status === 'validated') setSelectedStatuses([status]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Row selection ───────────────────────────────────────────────────────
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  // ── Edit panel state ────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Question | null>(null);
  const [form, setForm] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return questions.filter((item) => {
      const matchesCat = !selectedCats.length || selectedCats.includes(item.category);
      const matchesStatus = !selectedStatuses.length || selectedStatuses.includes(item.review_status);
      const matchesImage = imageFilter === 'all' || (imageFilter === 'with' ? !!item.image_url : !item.image_url);
      const matchesExam = examFilter === 'all' || (examFilter === 'assigned' ? item.exam !== null : item.exam === null);
      const matchesSearch = !q ||
        `${item.id} ${item.question} ${item.option_a} ${item.option_b} ${item.option_c} ${item.explanation} ${item.category}`
          .toLowerCase().includes(q);
      return matchesCat && matchesStatus && matchesImage && matchesExam && matchesSearch;
    });
  }, [questions, searchQuery, selectedCats, selectedStatuses, imageFilter, examFilter]);

  const statusCounts = useMemo(() => {
    return questions.reduce<Record<string, number>>((acc, item) => {
      acc[item.review_status] = (acc[item.review_status] || 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  function openRow(q: Question) {
    setSelected(q);
    setForm({ ...q });
    setSaved(false);
    setError('');
    setAudioError('');
    setConfirmDelete(false);
  }

  async function handleGenerateAudio() {
    if (!form) return;
    setGeneratingAudio(true);
    setAudioError('');
    try {
      const res = await fetch('/api/generate-question-audio', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: form.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onbekende fout');
      setForm(f => f ? { ...f, ...data } : f);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setAudioError(err instanceof Error ? err.message : 'Genereren mislukt');
    } finally {
      setGeneratingAudio(false);
    }
  }

  function setField<K extends keyof Question>(key: K, value: Question[K]) {
    setForm(f => f ? { ...f, [key]: value } : f);
    setSaved(false);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');

    let imageUrl = form.image_url || null;
    if (imageUrl?.startsWith('https://images.pexels.com')) {
      try {
        const res = await fetch('/api/upload-pexels-image', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: imageUrl, questionId: form.id }),
        });
        const data = await res.json();
        if (data.publicUrl) imageUrl = data.publicUrl;
      } catch { /* keep Pexels URL as fallback */ }
    }

    const supabase = createClient();
    const { error: err } = await supabase.from('questions').update({
      category: form.category,
      question: form.question,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      correct: form.correct,
      explanation: form.explanation,
      image_url: imageUrl,
      exam: form.exam || null,
      review_status: form.review_status,
    }).eq('id', form.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (!form) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('questions').delete().eq('id', form.id);
    setSelected(null);
    startTransition(() => router.refresh());
  }

  async function handleBulkValidate() {
    const selectedIds = Object.keys(rowSelection).map(Number);
    if (!selectedIds.length) return;
    setBulkSaving(true);
    const supabase = createClient();
    await supabase.from('questions').update({ review_status: 'validated' }).in('id', selectedIds);
    setBulkSaving(false);
    setRowSelection({});
    startTransition(() => router.refresh());
  }

  function toggleCat(checked: boolean, value: string) {
    setSelectedCats(prev => checked ? [...prev, value] : prev.filter(v => v !== value));
  }
  function toggleStatus(checked: boolean, value: ReviewStatus) {
    setSelectedStatuses(prev => checked ? [...prev, value] : prev.filter(v => v !== value));
  }

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }]);

  const columns = useMemo<ColumnDef<Question>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Alles selecteren"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Selecteer rij"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 44,
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); openRow(row.original); }}
          className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Bewerken"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      ),
      size: 44,
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      id: 'id',
      header: ({ column }) => <DataGridColumnHeader title="ID" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-on-surface-variant text-xs tabular-nums">{row.original.id}</span>,
      size: 60,
      enableSorting: true,
    },
    {
      accessorKey: 'question',
      id: 'question',
      header: ({ column }) => <DataGridColumnHeader title="Vraag" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="line-clamp-2 text-sm leading-snug">{row.original.question}</span>,
      size: 280,
      enableSorting: true,
    },
    {
      accessorKey: 'review_status',
      id: 'review_status',
      header: ({ column }) => <DataGridColumnHeader title="Status" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => row.original.review_status === 'validated'
        ? <Badge variant="success-light">Gevalideerd</Badge>
        : <Badge variant="warning-light">In afwachting</Badge>,
      size: 130,
      enableSorting: true,
    },
    {
      accessorKey: 'image_url',
      id: 'image_url',
      header: ({ column }) => <DataGridColumnHeader title="Foto" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <ImageStatusCell url={row.original.image_url} />,
      size: 60,
      enableSorting: false,
    },
    {
      id: 'audio',
      header: ({ column }) => <DataGridColumnHeader title="Audio" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => row.original.audio_question
        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700"><span className="material-symbols-outlined text-[14px]">graphic_eq</span></span>
        : <span className="text-xs text-on-surface-variant">—</span>,
      size: 60,
      enableSorting: false,
    },
    {
      accessorKey: 'category',
      id: 'category',
      header: ({ column }) => <DataGridColumnHeader title="Categorie" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CAT_COLORS[row.original.category] ?? 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
          {row.original.category.split(' ')[0]}
        </span>
      ),
      size: 130,
      enableSorting: true,
    },
    {
      accessorKey: 'option_a',
      id: 'option_a',
      header: ({ column }) => <DataGridColumnHeader title="Optie A" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const isCorrect = row.original.correct === 'A';
        return (
          <span className={`line-clamp-2 text-xs leading-snug ${isCorrect ? 'text-emerald-700 font-medium' : 'text-on-surface-variant'}`}>
            {row.original.option_a}
          </span>
        );
      },
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: 'option_b',
      id: 'option_b',
      header: ({ column }) => <DataGridColumnHeader title="Optie B" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const isCorrect = row.original.correct === 'B';
        return (
          <span className={`line-clamp-2 text-xs leading-snug ${isCorrect ? 'text-emerald-700 font-medium' : 'text-on-surface-variant'}`}>
            {row.original.option_b}
          </span>
        );
      },
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: 'option_c',
      id: 'option_c',
      header: ({ column }) => <DataGridColumnHeader title="Optie C" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const isCorrect = row.original.correct === 'C';
        return (
          <span className={`line-clamp-2 text-xs leading-snug ${isCorrect ? 'text-emerald-700 font-medium' : 'text-on-surface-variant'}`}>
            {row.original.option_c}
          </span>
        );
      },
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: 'explanation',
      id: 'explanation',
      header: ({ column }) => <DataGridColumnHeader title="Uitleg" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="line-clamp-2 text-xs text-on-surface-variant leading-snug">{row.original.explanation}</span>,
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: 'correct',
      id: 'correct',
      header: ({ column }) => <DataGridColumnHeader title="Juist" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const c = row.original.correct;
        return (
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${c === 'A' ? 'bg-blue-100 text-blue-700' : c === 'B' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {c}
          </span>
        );
      },
      size: 64,
      enableSorting: true,
    },
    {
      accessorKey: 'exam',
      id: 'exam',
      header: ({ column }) => <DataGridColumnHeader title="Examen" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant tabular-nums">{row.original.exam ?? '—'}</span>,
      size: 80,
      enableSorting: true,
    },
    {
      accessorKey: 'updated_at',
      id: 'updated_at',
      header: ({ column }) => <DataGridColumnHeader title="Bijgewerkt" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{fmtDate(row.original.updated_at)}</span>,
      size: 110,
      enableSorting: true,
    },
    {
      accessorKey: 'reviewed_at',
      id: 'reviewed_at',
      header: ({ column }) => <DataGridColumnHeader title="Beoordeeld" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{fmtDate(row.original.reviewed_at)}</span>,
      size: 110,
      enableSorting: true,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: Question) => String(row.id),
    state: { pagination, sorting, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  const hasFilters = !!searchQuery || selectedCats.length > 0 || selectedStatuses.length > 0 || imageFilter !== 'all' || examFilter !== 'all';

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${selected ? 'pr-[540px]' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Vragen</h1>
          <p className="text-on-surface-variant text-sm">
            {filteredData.length}{hasFilters ? ` van ${questions.length}` : ''} vragen
            <span className="mx-2 text-outline-variant">·</span>
            {statusCounts.validated ?? 0} gevalideerd, {statusCounts.pending ?? 0} in afwachting
          </p>
        </div>
        <button
          onClick={() => router.push(`${pathname}/new`)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nieuwe vraag
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm text-on-surface font-medium">{selectedCount} geselecteerd</span>
          <button
            onClick={handleBulkValidate}
            disabled={bulkSaving}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">{bulkSaving ? 'autorenew' : 'check_circle'}</span>
            {bulkSaving ? 'Bezig…' : 'Valideer geselecteerde'}
          </button>
          <button
            onClick={() => setRowSelection({})}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors ml-auto"
          >
            Deselecteer
          </button>
        </div>
      )}

      <DataGrid
        table={table}
        recordCount={filteredData?.length || 0}
        tableLayout={{ columnsResizable: true, columnsVisibility: true }}
        tableClassNames={{ edgeCell: 'px-4' }}
      >
        <Frame className={`w-full transition-opacity ${isPending ? 'opacity-60' : ''}`} stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>Vragenbank</FrameTitle>
            <div className="flex items-center gap-2.5">
              <InputGroup className="bg-background w-56">
                <InputGroupAddon align="inline-start"><SearchIcon /></InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek op vraag, antwoord…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery.length > 0 && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton aria-label="Wissen" title="Wissen" size="icon-xs" onClick={() => setSearchQuery('')}>
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
                      Status
                      {selectedStatuses.length > 0 && <Badge size="sm" variant="info-light">{selectedStatuses.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Status</div>
                    {(['validated', 'pending'] as ReviewStatus[]).map((s) => (
                      <div key={s} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`st-${s}`}
                          checked={selectedStatuses.includes(s)}
                          onCheckedChange={(c) => toggleStatus(c === true, s)}
                        />
                        <Label htmlFor={`st-${s}`} className="flex grow items-center justify-between gap-1.5 font-normal">
                          {s === 'validated' ? 'Gevalideerd' : 'In afwachting'}
                          <span className="text-muted-foreground">{statusCounts[s] ?? 0}</span>
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
                      Categorie
                      {selectedCats.length > 0 && <Badge size="sm" variant="info-light">{selectedCats.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Categorie</div>
                    {categories.map((c) => (
                      <div key={c} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`cat-${c}`}
                          checked={selectedCats.includes(c)}
                          onCheckedChange={(checked) => toggleCat(checked === true, c)}
                        />
                        <Label htmlFor={`cat-${c}`} className="grow font-normal">{c}</Label>
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
                      Foto
                      {imageFilter !== 'all' && <Badge size="sm" variant="info-light">1</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-44" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Afbeelding</div>
                    {(['all', 'with', 'without'] as const).map((v) => (
                      <div key={v} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`img-${v}`}
                          checked={imageFilter === v}
                          onCheckedChange={() => setImageFilter(v)}
                        />
                        <Label htmlFor={`img-${v}`} className="grow font-normal">
                          {v === 'all' ? 'Alle' : v === 'with' ? 'Met foto' : 'Zonder foto'}
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
                      Examen
                      {examFilter !== 'all' && <Badge size="sm" variant="info-light">1</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-44" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Examentoewijzing</div>
                    {([
                      { value: 'all', label: 'Alle' },
                      { value: 'assigned', label: 'Toegewezen' },
                      { value: 'unassigned', label: 'Niet-toegewezen' },
                    ] as const).map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`exam-${value}`}
                          checked={examFilter === value}
                          onCheckedChange={() => setExamFilter(value)}
                        />
                        <Label htmlFor={`exam-${value}`} className="grow font-normal">{label}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedCats([]); setSelectedStatuses([]); setImageFilter('all'); setExamFilter('all'); }}>
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

      {/* Edit panel */}
      <div className={`fixed top-0 right-0 h-full w-[500px] bg-white border-l border-outline-variant shadow-2xl z-40 flex flex-col transition-transform duration-200 ease-out ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant/50 shrink-0">
          <div>
            <h2 className="font-headline font-semibold text-on-surface">{form?.id ? `Vraag #${form.id}` : 'Vraag'}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Wijzigingen worden direct opgeslagen in de database.</p>
          </div>
          <button
            onClick={() => { setSelected(null); setConfirmDelete(false); }}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {form && (
            <>
              {error && <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>}

              {/* Review status control */}
              <div className="rounded-xl border border-outline-variant p-3 space-y-2.5 bg-surface-container-lowest">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wide">Beoordeling</label>
                  {form.review_status === 'validated'
                    ? <Badge variant="success-light">Gevalideerd</Badge>
                    : <Badge variant="warning-light">In afwachting</Badge>}
                </div>
                <div className="flex gap-2">
                  {(['pending', 'validated'] as ReviewStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('review_status', s)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        form.review_status === s
                          ? s === 'validated' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-amber-400 text-amber-950 border-amber-400'
                          : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface'
                      }`}
                    >
                      {s === 'validated' ? 'Gevalideerd' : 'In afwachting'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant">
                  Laatst beoordeeld: <span className="font-medium text-on-surface">{fmtDate(form.reviewed_at)}</span>
                  <span className="mx-1.5 text-outline-variant">·</span>
                  Bijgewerkt: <span className="font-medium text-on-surface">{fmtDate(form.updated_at)}</span>
                </p>
              </div>

              <PanelField label="Categorie">
                <select value={form.category} onChange={e => setField('category', e.target.value)} className="field">
                  <option value="">Kies categorie…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </PanelField>

              <PanelField label="Vraag">
                <textarea value={form.question} onChange={e => setField('question', e.target.value)} rows={3} className="field resize-none" />
                {form.audio_question && <AudioPlayer src={form.audio_question} label="Vraag" />}
              </PanelField>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-on-surface uppercase tracking-wide">Antwoorden</p>
                  {(form.audio_question || form.audio_a || form.audio_b || form.audio_c) && (
                    <div className="flex items-center gap-1.5">
                      <PlayAllButton
                        tracks={[form.audio_question, form.audio_a, form.audio_b, form.audio_c].filter(Boolean) as string[]}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAudio}
                        disabled={generatingAudio}
                        title="Audio opnieuw genereren"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-[14px] ${generatingAudio ? 'animate-spin' : ''}`}>
                          {generatingAudio ? 'autorenew' : 'refresh'}
                        </span>
                        {generatingAudio ? 'Bezig…' : 'Opnieuw'}
                      </button>
                    </div>
                  )}
                </div>
                {(['A', 'B', 'C'] as const).map(opt => {
                  const key = `option_${opt.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c';
                  const audioKey = `audio_${opt.toLowerCase()}` as 'audio_a' | 'audio_b' | 'audio_c';
                  const isCorrect = form.correct === opt;
                  return (
                    <div key={opt} className="space-y-1">
                      <div className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-outline-variant bg-white'}`}>
                        <button
                          type="button"
                          onClick={() => setField('correct', opt)}
                          className={`w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-colors ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                        >
                          {opt}
                        </button>
                        <input value={form[key]} onChange={e => setField(key, e.target.value)} className="flex-1 text-sm bg-transparent outline-none" placeholder={`Optie ${opt}`} />
                      </div>
                      {form[audioKey] && <AudioPlayer src={form[audioKey] as string} label={`Optie ${opt}`} />}
                    </div>
                  );
                })}
                <p className="text-xs text-on-surface-variant">Klik op de letter om het juiste antwoord te markeren.</p>
              </div>

              {!form.audio_question && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">volume_off</span>
                  <span className="text-xs text-amber-800 flex-1">
                    {form.review_status === 'validated'
                      ? 'Nog geen audio gegenereerd voor deze vraag.'
                      : 'Valideer de vraag eerst voor je audio genereert.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAudio}
                    disabled={generatingAudio || form.review_status !== 'validated'}
                    className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${generatingAudio ? 'animate-spin' : ''}`}>
                      {generatingAudio ? 'autorenew' : 'graphic_eq'}
                    </span>
                    {generatingAudio ? 'Genereren…' : 'Genereer audio'}
                  </button>
                </div>
              )}
              {audioError && <p className="text-xs text-error">{audioError}</p>}

              <PanelField label="Uitleg">
                <textarea value={form.explanation} onChange={e => setField('explanation', e.target.value)} rows={3} className="field resize-none" />
              </PanelField>

              <PanelField label="Examen nr.">
                <input type="number" value={form.exam ?? ''} onChange={e => setField('exam', e.target.value ? parseInt(e.target.value) : null)} placeholder="1–10" className="field" />
              </PanelField>

              <PexelsImagePicker
                question={form.question}
                category={form.category}
                value={form.image_url ?? ''}
                onChange={url => setField('image_url', url)}
              />
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/50 flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {saving ? (
              <><span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>Opslaan…</>
            ) : saved ? (
              <><span className="material-symbols-outlined text-[16px]">check_circle</span>Opgeslagen ✓</>
            ) : (
              <><span className="material-symbols-outlined text-[16px]">save</span>Opslaan</>
            )}
          </button>

          {form && form.id > 0 && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmDelete ? 'bg-error text-white' : 'border border-error/30 text-error hover:bg-error/5'}`}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {confirmDelete ? 'Zeker?' : 'Verwijderen'}
            </button>
          )}
          {confirmDelete && (
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-on-surface-variant hover:text-on-surface">Annuleren</button>
          )}
        </div>
      </div>

      <style>{`.field{width:100%;border:1px solid var(--color-outline-variant);border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;background:white}.field:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function AudioPlayer({ src, label }: { src: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
  }

  return (
    <div className="flex items-center gap-2 mt-1 px-2.5 py-1.5 bg-primary/5 border border-primary/15 rounded-lg">
      <audio
        key={src}
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        className="h-6 w-6 shrink-0 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">{playing ? 'pause' : 'play_arrow'}</span>
      </button>
      <div className="flex-1 h-1 bg-primary/15 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
      <span className="text-[10px] text-on-surface-variant shrink-0">{label}</span>
    </div>
  );
}

function PlayAllButton({ tracks }: { tracks: string[] }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);

  function playNext(idx: number) {
    if (idx >= tracks.length) { setPlaying(false); return; }
    const audio = new Audio(tracks[idx]);
    audioRef.current = audio;
    audio.onended = () => { indexRef.current = idx + 1; playNext(idx + 1); };
    audio.play();
  }

  function handlePlay() {
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    setPlaying(true);
    indexRef.current = 0;
    playNext(0);
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
    >
      <span className="material-symbols-outlined text-[14px]">{playing ? 'stop' : 'play_circle'}</span>
      {playing ? 'Stop' : 'Alles afspelen'}
    </button>
  );
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-on-surface uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function ImageStatusCell({ url }: { url: string | null }) {
  const [valid, setValid] = useState<boolean | null>(url ? null : false);
  useEffect(() => {
    if (!url) { setValid(false); return; }
    setValid(null);
    const img = new window.Image();
    img.onload = () => setValid(true);
    img.onerror = () => setValid(false);
    img.src = url;
  }, [url]);
  if (valid === null) return <span className="text-xs text-on-surface-variant opacity-50">…</span>;
  if (!valid) return <span className="text-xs text-on-surface-variant">—</span>;
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700"><span className="material-symbols-outlined text-[14px]">image</span></span>;
}

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  alt: string;
};

function PexelsImagePicker({
  question,
  category,
  value,
  onChange,
}: {
  question: string;
  category: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [autoQueried, setAutoQueried] = useState(false);

  const isStoredImage = value && !value.startsWith('https://images.pexels.com');
  const [storedImageBroken, setStoredImageBroken] = useState(false);
  useEffect(() => { setStoredImageBroken(false); }, [value]);

  // Reset when a different question is opened
  useEffect(() => {
    setAutoQueried(false);
    setPhotos([]);
    setSearchInput('');
  }, [question]);

  const fetchPhotos = useCallback(async (q: string, autoSelect = false) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pexels-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const fetched: PexelsPhoto[] = data.photos ?? [];
      setPhotos(fetched);
      if (autoSelect && fetched.length > 0) {
        onChange(fetched[0].src.large);
      }
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    // Don't auto-select if an image is already saved — only auto-query for no-image questions
    if (autoQueried || !question.trim() || !category || isStoredImage) return;
    setAutoQueried(true);
    const fetchQuery = async () => {
      try {
        const res = await fetch(`/api/pexels-query?question=${encodeURIComponent(question)}&category=${encodeURIComponent(category)}`);
        const data = await res.json();
        const q = data.query || buildPexelsQuery(question, category);
        setSearchInput(q);
        fetchPhotos(q, !value); // only auto-select if no image yet
      } catch {
        const q = buildPexelsQuery(question, category);
        setSearchInput(q);
        fetchPhotos(q, !value);
      }
    };
    fetchQuery();
  }, [question, category, autoQueried, fetchPhotos, value, isStoredImage]);

  const selectedPexelsPhoto = photos.find(p => p.src.large === value);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-on-surface uppercase tracking-wide">Afbeelding</p>

      {/* Stored / saved image */}
      {isStoredImage && (
        <div className="space-y-1.5">
          <p className={`text-[11px] font-medium flex items-center gap-1.5 ${storedImageBroken ? 'text-red-600' : 'text-on-surface-variant'}`}>
            <span className={`material-symbols-outlined text-[14px] ${storedImageBroken ? 'text-red-600' : 'text-emerald-600'}`}>
              {storedImageBroken ? 'broken_image' : 'check_circle'}
            </span>
            {storedImageBroken ? 'Afbeelding niet gevonden (URL ongeldig)' : 'Huidige afbeelding (opgeslagen)'}
          </p>
          {!storedImageBroken && (
            <div className="relative rounded-xl overflow-hidden border border-outline-variant group w-full" style={{ aspectRatio: '16/6' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Huidige afbeelding" className="w-full h-full object-cover" onError={() => setStoredImageBroken(true)} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="flex items-center gap-1.5 bg-white/90 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Verwijderen
                </button>
              </div>
            </div>
          )}
          {storedImageBroken && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              URL wissen en nieuwe foto kiezen
            </button>
          )}
          <p className="text-[11px] text-on-surface-variant">Kies hieronder een andere Pexels-foto om te vervangen.</p>
        </div>
      )}

      {/* Pexels photo selected (not yet saved to storage) */}
      {value && !isStoredImage && (
        <div className="relative rounded-xl overflow-hidden border border-primary/40 group w-full" style={{ aspectRatio: '16/6' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Geselecteerde afbeelding" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 bg-white/90 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Verwijderen
            </button>
          </div>
          {selectedPexelsPhoto && (
            <span className="absolute bottom-2 right-2 text-white/70 text-[10px] bg-black/50 px-2 py-0.5 rounded-full">
              © {selectedPexelsPhoto.photographer} via Pexels
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchPhotos(searchInput))}
          placeholder="Zoek Pexels-foto…"
          className="field flex-1"
        />
        <button
          type="button"
          onClick={() => fetchPhotos(searchInput)}
          disabled={loading}
          className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">search</span>
          )}
          Zoeken
        </button>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => {
            const selected = photo.src.large === value;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onChange(selected ? (isStoredImage ? value : '') : photo.src.large)}
                title={photo.photographer}
                className={`relative rounded-xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/40'
                }`}
                style={{ aspectRatio: '4/3' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                {selected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[28px] drop-shadow">check_circle</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
