'use client';

import { useMemo, useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

type WordCard = {
  id: number;
  theme_id: number;
  theme_name: string;
  dutch: string;
  article: string;
  plural: string;
  dutch_description: string;
  dutch_example: string;
  translation_en: string;
  description_en: string;
  translation_ar: string;
  description_ar: string;
  translation_tr: string;
  description_tr: string;
  sort_order: number;
  image_url: string | null;
  audio_dutch_word?: string | null;
  audio_dutch_sentence?: string | null;
};

const THEME_NAMES: Record<number, string> = {
  1: 'Geschiedenis en Geografie',
  2: 'Staatsinrichting en Rechtsstaat',
  3: 'Maatschappij en Samenleven',
  4: 'Werk en Inkomen',
  5: 'Gezondheid en Zorg',
  6: 'Onderwijs',
  7: 'Wonen',
};

const HEADER_CLS = 'text-on-surface font-medium';

type Props = {
  cards: WordCard[];
};

export default function WoordkaartenTable({ cards }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [imageFilter, setImageFilter] = useState<'all' | 'with' | 'without'>('all');
  const [audioFilter, setAudioFilter] = useState<'all' | 'with' | 'without'>('all');

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [selected, setSelected] = useState<WordCard | null>(null);
  const [form, setForm] = useState<WordCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return cards.filter((item) => {
      const matchesTheme = !selectedThemes.length || selectedThemes.includes(item.theme_id);
      const matchesImage = imageFilter === 'all' || (imageFilter === 'with' ? !!item.image_url : !item.image_url);
      const matchesAudio = audioFilter === 'all' || (audioFilter === 'with' ? !!item.audio_dutch_word : !item.audio_dutch_word);
      const matchesSearch = !q ||
        `${item.id} ${item.dutch} ${item.translation_en} ${item.dutch_description}`.toLowerCase().includes(q);
      return matchesTheme && matchesImage && matchesAudio && matchesSearch;
    });
  }, [cards, searchQuery, selectedThemes, imageFilter, audioFilter]);

  function openRow(c: WordCard) {
    setSelected(c);
    setForm({ ...c });
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
      const res = await fetch('/api/generate-wordcard-audio', {
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

  function setField<K extends keyof WordCard>(key: K, value: WordCard[K]) {
    setForm(f => f ? { ...f, [key]: value } : f);
    setSaved(false);
  }

  function setTheme(id: number) {
    setForm(f => f ? { ...f, theme_id: id, theme_name: THEME_NAMES[id] } : f);
    setSaved(false);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');

    let imageUrl = form.image_url || null;
    if (imageUrl?.startsWith('https://images.pexels.com')) {
      try {
        const res = await fetch('/api/upload-wordcard-image', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: imageUrl, wordcardId: form.id }),
        });
        const data = await res.json();
        if (data.publicUrl) imageUrl = data.publicUrl;
      } catch { /* keep Pexels URL as fallback */ }
    }

    const supabase = createClient();
    const { error: err } = await supabase.from('word_cards').update({
      theme_id: form.theme_id,
      theme_name: form.theme_name,
      dutch: form.dutch,
      article: form.article,
      plural: form.plural,
      dutch_description: form.dutch_description,
      dutch_example: form.dutch_example,
      translation_en: form.translation_en,
      description_en: form.description_en,
      translation_ar: form.translation_ar,
      description_ar: form.description_ar,
      translation_tr: form.translation_tr,
      description_tr: form.description_tr,
      sort_order: form.sort_order,
      image_url: imageUrl,
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
    await supabase.from('word_cards').delete().eq('id', form.id);
    setSelected(null);
    startTransition(() => router.refresh());
  }

  function toggleTheme(checked: boolean, value: number) {
    setSelectedThemes(prev => checked ? [...prev, value] : prev.filter(v => v !== value));
  }

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }]);

  const columns = useMemo<ColumnDef<WordCard>[]>(() => [
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
      accessorKey: 'theme_id',
      id: 'theme_id',
      header: ({ column }) => <DataGridColumnHeader title="Thema" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
          {row.original.theme_id}
        </span>
      ),
      size: 70,
      enableSorting: true,
    },
    {
      accessorKey: 'dutch',
      id: 'dutch',
      header: ({ column }) => <DataGridColumnHeader title="Nederlands" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.article && <span className="text-on-surface-variant mr-1">{row.original.article}</span>}
          {row.original.dutch}
        </span>
      ),
      size: 200,
      enableSorting: true,
    },
    {
      accessorKey: 'translation_en',
      id: 'translation_en',
      header: ({ column }) => <DataGridColumnHeader title="Engels" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{row.original.translation_en}</span>,
      size: 180,
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
      cell: ({ row }) => row.original.audio_dutch_word
        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700"><span className="material-symbols-outlined text-[14px]">graphic_eq</span></span>
        : <span className="text-xs text-on-surface-variant">—</span>,
      size: 60,
      enableSorting: false,
    },
    {
      accessorKey: 'sort_order',
      id: 'sort_order',
      header: ({ column }) => <DataGridColumnHeader title="Volgorde" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant tabular-nums">{row.original.sort_order}</span>,
      size: 80,
      enableSorting: true,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: WordCard) => String(row.id),
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
  const hasFilters = !!searchQuery || selectedThemes.length > 0 || imageFilter !== 'all' || audioFilter !== 'all';

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${selected ? 'pr-[540px]' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Woordkaarten</h1>
          <p className="text-on-surface-variant text-sm">
            {filteredData.length}{hasFilters ? ` van ${cards.length}` : ''} kaarten
          </p>
        </div>
        <button
          onClick={() => router.push(`${pathname}/new`)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nieuwe kaart
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm text-on-surface font-medium">{selectedCount} geselecteerd</span>
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
            <FrameTitle>Woordenlijst</FrameTitle>
            <div className="flex items-center gap-2.5">
              <InputGroup className="bg-background w-56">
                <InputGroupAddon align="inline-start"><SearchIcon /></InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek op woord, vertaling…"
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
                      Thema
                      {selectedThemes.length > 0 && <Badge size="sm" variant="info-light">{selectedThemes.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Thema</div>
                    {[1, 2, 3, 4, 5, 6, 7].map((t) => (
                      <div key={t} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`theme-${t}`}
                          checked={selectedThemes.includes(t)}
                          onCheckedChange={(checked) => toggleTheme(checked === true, t)}
                        />
                        <Label htmlFor={`theme-${t}`} className="grow font-normal">Thema {t}: {THEME_NAMES[t]}</Label>
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
                      Audio
                      {audioFilter !== 'all' && <Badge size="sm" variant="info-light">1</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-44" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Audio</div>
                    {(['all', 'with', 'without'] as const).map((v) => (
                      <div key={v} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`audio-${v}`}
                          checked={audioFilter === v}
                          onCheckedChange={() => setAudioFilter(v)}
                        />
                        <Label htmlFor={`audio-${v}`} className="grow font-normal">
                          {v === 'all' ? 'Alle' : v === 'with' ? 'Met audio' : 'Zonder audio'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedThemes([]); setImageFilter('all'); setAudioFilter('all'); }}>
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
            <h2 className="font-headline font-semibold text-on-surface">{form ? `${form.article ? form.article + ' ' : ''}${form.dutch}` : 'Woordkaart'}</h2>
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

              <div className="grid grid-cols-2 gap-3">
                <PanelField label="Thema">
                  <select value={form.theme_id} onChange={e => setTheme(parseInt(e.target.value))} className="field">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => <option key={i} value={i}>Thema {i}</option>)}
                  </select>
                </PanelField>
                <PanelField label="Volgorde">
                  <input type="number" value={form.sort_order} onChange={e => setField('sort_order', parseInt(e.target.value) || 0)} className="field" />
                </PanelField>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <PanelField label="Lidwoord">
                  <select value={form.article} onChange={e => setField('article', e.target.value)} className="field">
                    <option value="">—</option>
                    <option value="de">de</option>
                    <option value="het">het</option>
                  </select>
                </PanelField>
                <div className="col-span-2">
                  <PanelField label="Woord">
                    <input value={form.dutch} onChange={e => setField('dutch', e.target.value)} className="field" />
                  </PanelField>
                </div>
              </div>
              {form.audio_dutch_word && <AudioPlayer src={form.audio_dutch_word} label="Woord" />}

              <PanelField label="Meervoud">
                <input value={form.plural} onChange={e => setField('plural', e.target.value)} className="field" />
              </PanelField>

              <PanelField label="Omschrijving (NL)">
                <textarea value={form.dutch_description} onChange={e => setField('dutch_description', e.target.value)} rows={2} className="field resize-none" />
              </PanelField>

              <PanelField label="Voorbeeldzin">
                <textarea value={form.dutch_example} onChange={e => setField('dutch_example', e.target.value)} rows={2} className="field resize-none" />
                {form.audio_dutch_sentence && <AudioPlayer src={form.audio_dutch_sentence} label="Zin" />}
              </PanelField>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-on-surface uppercase tracking-wide">Audio</p>
                  {(form.audio_dutch_word || form.audio_dutch_sentence) && (
                    <div className="flex items-center gap-1.5">
                      <PlayAllButton
                        tracks={[form.audio_dutch_word, form.audio_dutch_sentence].filter(Boolean) as string[]}
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

                {!form.audio_dutch_word && (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">volume_off</span>
                    <span className="text-xs text-amber-800 flex-1">
                      Nog geen audio gegenereerd voor woord en zin.
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAudio}
                      disabled={generatingAudio}
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
              </div>

              <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Engels</p>
                <PanelField label="Vertaling EN">
                  <input value={form.translation_en} onChange={e => setField('translation_en', e.target.value)} className="field" />
                </PanelField>
                <PanelField label="Omschrijving EN">
                  <input value={form.description_en} onChange={e => setField('description_en', e.target.value)} className="field" />
                </PanelField>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Arabisch</p>
                <PanelField label="Vertaling AR">
                  <input value={form.translation_ar} onChange={e => setField('translation_ar', e.target.value)} dir="rtl" className="field" />
                </PanelField>
                <PanelField label="Omschrijving AR">
                  <input value={form.description_ar} onChange={e => setField('description_ar', e.target.value)} dir="rtl" className="field" />
                </PanelField>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Turks</p>
                <PanelField label="Vertaling TR">
                  <input value={form.translation_tr} onChange={e => setField('translation_tr', e.target.value)} className="field" />
                </PanelField>
                <PanelField label="Omschrijving TR">
                  <input value={form.description_tr} onChange={e => setField('description_tr', e.target.value)} className="field" />
                </PanelField>
              </div>

              <WordcardImagePicker
                dutch={form.dutch}
                translationEn={form.translation_en}
                example={form.dutch_example}
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

function WordcardImagePicker({
  dutch,
  translationEn,
  example,
  value,
  onChange,
}: {
  dutch: string;
  translationEn: string;
  example: string;
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

  // Reset when a different card is opened
  useEffect(() => {
    setAutoQueried(false);
    setPhotos([]);
    setSearchInput('');
  }, [dutch]);

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
    // Don't auto-select if an image is already saved — only auto-query for no-image cards
    if (autoQueried || !dutch.trim() || isStoredImage) return;
    setAutoQueried(true);
    const fetchQuery = async () => {
      const fallback = translationEn || dutch;
      try {
        const res = await fetch(
          `/api/wordcard-pexels-query?dutch=${encodeURIComponent(dutch)}&translation_en=${encodeURIComponent(translationEn)}&example=${encodeURIComponent(example)}`
        );
        const data = await res.json();
        const q = data.query || fallback;
        setSearchInput(q);
        fetchPhotos(q, !value);
      } catch {
        setSearchInput(fallback);
        fetchPhotos(fallback, !value);
      }
    };
    fetchQuery();
  }, [dutch, translationEn, example, autoQueried, fetchPhotos, value, isStoredImage]);

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
