'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel,
  PaginationState, RowSelectionState, SortingState, useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/reui/badge';
import { DataGrid } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from '@/components/reui/frame';
import {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FunnelIcon, SearchIcon, XIcon } from 'lucide-react';
import type { Level, SkillSlug } from '@/data/skills';
import type { AdminWord } from '@/lib/admin/words';

/**
 * De woordenlijst van één (niveau, onderdeel), als tabel — dezelfde vorm als
 * `/admin/woordkaarten`, op een andere tabel.
 *
 * ── WAAROM DEZELFDE VORM EN NIET DEZELFDE COMPONENT ──────────────────────────
 * De ReUI-grid, de zoekbalk, de filterpopovers en het rechterpaneel zijn overgenomen omdat de
 * docent ze al kent. De *kolommen* zijn het niet: `lesson_words` heeft geen foto en geen Turks,
 * heeft wél een `usage` (receptief/productief) en een `frame` ("zich schamen (voor)"), en zijn
 * thema is een vrij tekstveld uit de cursus in plaats van KNM's zeven vaste thema's. Eén component
 * voor beide zou van elk van die verschillen een `if` maken en van het thema een veld dat soms een
 * nummer en soms een naam is.
 *
 * ── DRIE VALLEN DIE HIER AL EENS ZIJN GESPRONGEN ─────────────────────────────
 * 1. **Een door RLS geweigerde UPDATE geeft 200 met nul rijen** en ziet er identiek uit aan een
 *    geslaagde save. Elke schrijfactie hier leest daarom `select('id')` terug en klaagt bij nul.
 * 2. **`bg-primary/10` rendert in de adminbundle volledig dekkend.** De themachip op
 *    `/admin/woordkaarten` is daardoor een massief marineblauw bolletje met een onzichtbaar cijfer
 *    erin. Deze chip gebruikt daarom een letterlijke `rgba()`, zoals §8 voorschrijft.
 * 3. **`usage` en `review_status` zijn CHECK-kolommen.** Ze staan hier als `select` en niet als
 *    vrij tekstveld, want een typefout is geen validatiefout in de UI maar een 400 uit Postgres.
 */
export default function WoordenTable({
  words,
  level,
  onderdeel,
}: {
  words: AdminWord[];
  level: Level;
  onderdeel: SkillSlug;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [usageFilter, setUsageFilter] = useState<'all' | 'receptief' | 'productief'>('all');
  const [audioFilter, setAudioFilter] = useState<'all' | 'with' | 'without'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'pending'>('all');

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }]);

  const [form, setForm] = useState<AdminWord | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** De thema's zoals ze in deze cursus voorkomen — een vrij veld, dus uit de data en niet uit een lijst. */
  const themes = useMemo(
    () => [...new Set(words.map(w => w.theme))].sort((a, b) => a.localeCompare(b, 'nl')),
    [words],
  );

  const filtered = useMemo(() => words.filter(w => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q
      || `${w.id} ${w.dutch} ${w.meaning_nl} ${w.translation_en ?? ''} ${w.example ?? ''}`
        .toLowerCase().includes(q);
    return matchesSearch
      && (!selectedThemes.length || selectedThemes.includes(w.theme))
      && (usageFilter === 'all' || w.usage === usageFilter)
      && (audioFilter === 'all' || (audioFilter === 'with' ? !!w.audio_url : !w.audio_url))
      && (statusFilter === 'all' || w.review_status === statusFilter);
  }), [words, searchQuery, selectedThemes, usageFilter, audioFilter, statusFilter]);

  function openRow(w: AdminWord) {
    setForm({ ...w });
    setSaved(false);
    setError('');
    setConfirmDelete(false);
  }

  /** Een nieuw woord staat in het paneel, niet op een eigen pagina: het is één rij met tien velden. */
  function openNew() {
    openRow({
      id: 0,
      level,
      onderdeel,
      theme: themes[0] ?? '',
      dutch: '',
      article: null,
      plural: null,
      frame: null,
      meaning_nl: '',
      example: null,
      usage: 'receptief',
      audio_url: null,
      // Achteraan in zijn thema, zodat een nieuw woord niet stil vóór de rest komt te staan.
      sort_order: Math.max(0, ...words.map(w => w.sort_order)) + 1,
      review_status: 'pending',
      translation_en: null,
      translation_ar: null,
      translations_reviewed: false,
    });
  }

  function setField<K extends keyof AdminWord>(key: K, value: AdminWord[K]) {
    setForm(f => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  async function save() {
    if (!form) return;
    if (!form.dutch.trim()) { setError('Een woord heeft een Nederlandse vorm nodig.'); return; }
    if (!form.meaning_nl.trim()) { setError('Vul de Nederlandse betekenis in.'); return; }
    if (!form.theme.trim()) { setError('Een woord hoort bij een thema.'); return; }

    setSaving(true);
    setError('');
    const supabase = createClient();

    // Leeg is `null` en niet de lege string: de portaalkant test op aanwezigheid ("heeft dit woord
    // een frame?"), en een lege string is dan waar.
    const nul = (v: string | null) => (v && v.trim() ? v.trim() : null);
    const row = {
      level: form.level,
      onderdeel: form.onderdeel,
      theme: form.theme.trim(),
      dutch: form.dutch.trim(),
      article: nul(form.article),
      plural: nul(form.plural),
      frame: nul(form.frame),
      meaning_nl: form.meaning_nl.trim(),
      example: nul(form.example),
      usage: form.usage,
      sort_order: form.sort_order,
      review_status: form.review_status,
      translation_en: nul(form.translation_en),
      translation_ar: nul(form.translation_ar),
      translations_reviewed: form.translations_reviewed,
    };

    try {
      if (form.id > 0) {
        const { data, error: err } = await supabase
          .from('lesson_words').update(row).eq('id', form.id).select('id');
        if (err) throw new Error(err.message);
        if (!data?.length) throw new Error('er is niets gewijzigd (0 rijen)');
      } else {
        const { data, error: err } = await supabase
          .from('lesson_words').insert(row).select('id').single();
        if (err) throw new Error(err.message);
        setForm(f => (f ? { ...f, id: (data as { id: number }).id } : f));
      }
      setSaved(true);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'onbekende fout');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!form || form.id <= 0) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const supabase = createClient();
    // Een `woordenlijst`-item draagt losse `word_ids` in zijn payload — geen foreign key, dus geen
    // cascade en geen waarschuwing. Het item toont het woord daarna simpelweg niet meer.
    const { error: err } = await supabase.from('lesson_words').delete().eq('id', form.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(null);
    startTransition(() => router.refresh());
  }

  const columns = useMemo<ColumnDef<AdminWord>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Alles selecteren"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          aria-label="Selecteer rij"
          onClick={e => e.stopPropagation()}
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
          onClick={e => { e.stopPropagation(); openRow(row.original); }}
          className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
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
      cell: ({ row }) => <span className="text-xs tabular-nums text-on-surface-variant">{row.original.id}</span>,
      size: 60,
    },
    {
      accessorKey: 'theme',
      id: 'theme',
      header: ({ column }) => <DataGridColumnHeader title="Thema" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span
          className="inline-block max-w-[10rem] truncate rounded-full px-2 py-0.5 text-xs font-bold text-primary"
          // Letterlijke rgba: `bg-primary/10` rendert in deze bundle dekkend, en dan staat er
          // marineblauw op marineblauw.
          style={{ background: 'rgba(0, 43, 109, 0.08)' }}
          title={row.original.theme}
        >
          {row.original.theme}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: 'dutch',
      id: 'dutch',
      header: ({ column }) => <DataGridColumnHeader title="Nederlands" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.article && <span className="mr-1 text-on-surface-variant">{row.original.article}</span>}
          <strong className="font-bold">{row.original.dutch}</strong>
          {row.original.plural && <span className="ml-1 text-xs text-on-surface-variant">· {row.original.plural}</span>}
        </span>
      ),
      size: 210,
    },
    {
      accessorKey: 'meaning_nl',
      id: 'meaning_nl',
      header: ({ column }) => <DataGridColumnHeader title="Betekenis" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{row.original.meaning_nl}</span>,
      size: 260,
    },
    {
      accessorKey: 'translation_en',
      id: 'translation_en',
      header: ({ column }) => <DataGridColumnHeader title="Engels" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="text-xs text-on-surface-variant">
          {row.original.translation_en || '—'}
          {/* De vertalingen zijn machinaal en ongereviewd tot iemand ze nakijkt — precies zoals de
              gidsvertalingen. Dat moet in de lijst te zien zijn, niet alleen in het paneel. */}
          {row.original.translation_en && !row.original.translations_reviewed && (
            <span className="ml-1 text-[0.65rem] font-bold text-secondary">ongereviewd</span>
          )}
        </span>
      ),
      size: 210,
    },
    {
      accessorKey: 'usage',
      id: 'usage',
      header: ({ column }) => <DataGridColumnHeader title="Gebruik" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        // Geen ReUI-`Badge` hier: `primary-light` rendert in de adminbundle dekkend marineblauw en
        // het woord "productief" verdween erin — dezelfde val als de themachip op
        // /admin/woordkaarten. Twee letterlijke `rgba()`-tinten, met de leestekst erboven.
        const productief = row.original.usage === 'productief';
        return (
          <span
            className="inline-block rounded-full px-2 py-0.5 text-xs font-bold"
            style={productief
              ? { background: 'rgba(0, 43, 109, 0.08)', color: 'var(--color-primary)' }
              : { background: '#fcecdd', color: '#a24000' }}
          >
            {row.original.usage}
          </span>
        );
      },
      size: 110,
    },
    {
      id: 'audio',
      header: ({ column }) => <DataGridColumnHeader title="Audio" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (row.original.audio_url
        ? <audio controls preload="none" src={row.original.audio_url} className="h-7 w-32" />
        : <span className="text-xs text-on-surface-variant">—</span>),
      size: 150,
      enableSorting: false,
    },
    {
      accessorKey: 'sort_order',
      id: 'sort_order',
      header: ({ column }) => <DataGridColumnHeader title="Volgorde" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs tabular-nums text-on-surface-variant">{row.original.sort_order}</span>,
      size: 80,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const table = useReactTable({
    columns,
    data: filtered,
    pageCount: Math.ceil((filtered.length || 0) / pagination.pageSize),
    getRowId: row => String(row.id),
    state: { pagination, sorting, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hasFilters = !!searchQuery || selectedThemes.length > 0
    || usageFilter !== 'all' || audioFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${form ? 'pr-[500px]' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          {filtered.length}{hasFilters ? ` van ${words.length}` : ''} woorden
          {themes.length > 0 && ` · ${themes.length} thema's`}
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nieuw woord
        </button>
      </div>

      <DataGrid
        table={table}
        recordCount={filtered.length || 0}
        tableLayout={{ columnsResizable: true, columnsVisibility: true }}
        tableClassNames={{ edgeCell: 'px-4' }}
      >
        <Frame className={`w-full transition-opacity ${isPending ? 'opacity-60' : ''}`} stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>Woordenlijst</FrameTitle>
            <div className="flex items-center gap-2.5">
              <InputGroup className="w-56 bg-background">
                <InputGroupAddon align="inline-start"><SearchIcon /></InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek op woord, betekenis…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Thema</div>
                    {themes.length === 0 && <p className="text-xs text-muted-foreground">Nog geen woorden.</p>}
                    {themes.map(t => (
                      <div key={t} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`thema-${t}`}
                          checked={selectedThemes.includes(t)}
                          onCheckedChange={checked => setSelectedThemes(prev =>
                            checked === true ? [...prev, t] : prev.filter(v => v !== t))}
                        />
                        <Label htmlFor={`thema-${t}`} className="grow font-normal">{t}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <FilterPopover
                label="Gebruik"
                active={usageFilter !== 'all'}
                options={[['all', 'Alle'], ['receptief', 'Receptief'], ['productief', 'Productief']]}
                value={usageFilter}
                onChange={v => setUsageFilter(v as typeof usageFilter)}
              />
              <FilterPopover
                label="Audio"
                active={audioFilter !== 'all'}
                options={[['all', 'Alle'], ['with', 'Met audio'], ['without', 'Zonder audio']]}
                value={audioFilter}
                onChange={v => setAudioFilter(v as typeof audioFilter)}
              />
              <FilterPopover
                label="Status"
                active={statusFilter !== 'all'}
                options={[['all', 'Alle'], ['validated', 'Nagekeken'], ['pending', 'Nog niet nagekeken']]}
                value={statusFilter}
                onChange={v => setStatusFilter(v as typeof statusFilter)}
              />

              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery(''); setSelectedThemes([]);
                    setUsageFilter('all'); setAudioFilter('all'); setStatusFilter('all');
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

      {/* Het rechterpaneel. Zelfde plek en zelfde gedrag als op /admin/woordkaarten. */}
      <div
        className={`fixed top-0 right-0 z-40 flex h-full w-[500px] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${
          form ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between bg-surface-container-lowest px-6 py-5">
          <div>
            <h2 className="font-headline font-semibold text-on-surface">
              {form ? (form.id > 0 ? `${form.article ? `${form.article} ` : ''}${form.dutch}` : 'Nieuw woord') : 'Woord'}
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {level.toUpperCase()} · {onderdeel} — dit woord staat in elke les die ernaar verwijst.
            </p>
          </div>
          <button
            onClick={() => { setForm(null); setConfirmDelete(false); }}
            className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Sluiten"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {form && (
            <>
              {error && <div className="wdn-error">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <PanelField label="Thema">
                  {/* Vrij tekstveld met de bestaande thema's als suggestie: het thema komt uit de
                      cursus, dus een vaste lijst zou een nieuw blok onmogelijk maken — maar een
                      typefout maakt stil een tweede thema met één woord erin. */}
                  <input
                    list="wdn-themes"
                    value={form.theme}
                    onChange={e => setField('theme', e.target.value)}
                    className="wdn-field"
                  />
                  <datalist id="wdn-themes">
                    {themes.map(t => <option key={t} value={t} />)}
                  </datalist>
                </PanelField>
                <PanelField label="Volgorde">
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setField('sort_order', parseInt(e.target.value) || 0)}
                    className="wdn-field"
                  />
                </PanelField>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <PanelField label="Lidwoord">
                  <select
                    value={form.article ?? ''}
                    onChange={e => setField('article', e.target.value || null)}
                    className="wdn-field"
                  >
                    <option value="">—</option>
                    <option value="de">de</option>
                    <option value="het">het</option>
                  </select>
                </PanelField>
                <div className="col-span-2">
                  <PanelField label="Woord">
                    <input value={form.dutch} onChange={e => setField('dutch', e.target.value)} className="wdn-field" />
                  </PanelField>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PanelField label="Meervoud">
                  <input value={form.plural ?? ''} onChange={e => setField('plural', e.target.value)} className="wdn-field" />
                </PanelField>
                <PanelField label="Vaste constructie">
                  <input
                    value={form.frame ?? ''}
                    onChange={e => setField('frame', e.target.value)}
                    placeholder="zich schamen (voor)"
                    className="wdn-field"
                  />
                </PanelField>
              </div>

              <PanelField label="Betekenis (NL)">
                <textarea
                  value={form.meaning_nl}
                  onChange={e => setField('meaning_nl', e.target.value)}
                  rows={2}
                  className="wdn-field resize-none"
                />
              </PanelField>

              <PanelField label="Voorbeeldzin">
                <textarea
                  value={form.example ?? ''}
                  onChange={e => setField('example', e.target.value)}
                  rows={2}
                  className="wdn-field resize-none"
                />
              </PanelField>

              <div className="grid grid-cols-2 gap-3">
                <PanelField label="Gebruik">
                  <select
                    value={form.usage}
                    onChange={e => setField('usage', e.target.value as AdminWord['usage'])}
                    className="wdn-field"
                  >
                    <option value="receptief">receptief — herkennen</option>
                    <option value="productief">productief — zelf gebruiken</option>
                  </select>
                </PanelField>
                <PanelField label="Status">
                  <select
                    value={form.review_status}
                    onChange={e => setField('review_status', e.target.value as AdminWord['review_status'])}
                    className="wdn-field"
                  >
                    <option value="pending">nog niet nagekeken</option>
                    <option value="validated">nagekeken</option>
                  </select>
                </PanelField>
              </div>

              <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">Vertalingen</p>
                <PanelField label="Engels">
                  <input
                    value={form.translation_en ?? ''}
                    onChange={e => setField('translation_en', e.target.value)}
                    className="wdn-field"
                  />
                </PanelField>
                <PanelField label="Arabisch">
                  <input
                    value={form.translation_ar ?? ''}
                    onChange={e => setField('translation_ar', e.target.value)}
                    dir="rtl"
                    className="wdn-field"
                  />
                </PanelField>
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={form.translations_reviewed}
                    onChange={e => setField('translations_reviewed', e.target.checked)}
                  />
                  Vertalingen nagekeken
                </label>
                <p className="text-xs text-on-surface-variant">
                  Aan tot iemand ze heeft nagekeken zegt de kaart zelf dat de vertaling machinaal is —
                  dezelfde mededeling als bij de gidsvertalingen. Vink dit alleen aan als je ze echt
                  hebt gelezen.
                </p>
              </div>

              {form.audio_url && (
                <PanelField label="Audio">
                  <audio controls preload="none" src={form.audio_url} className="w-full" />
                </PanelField>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 bg-surface-container-lowest px-6 py-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'autorenew' : saved ? 'check_circle' : 'save'}
            </span>
            {saving ? 'Opslaan…' : saved ? 'Opgeslagen' : 'Opslaan'}
          </button>

          {form && form.id > 0 && (
            <button
              onClick={remove}
              disabled={saving}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                confirmDelete ? 'bg-error text-white' : 'text-error hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {confirmDelete ? 'Zeker?' : 'Verwijderen'}
            </button>
          )}
          {confirmDelete && (
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-on-surface-variant hover:text-on-surface">
              Annuleren
            </button>
          )}
        </div>
      </div>

      {/* Zelfde inline stijl als /admin/woordkaarten, waar `.field` ook lokaal gedefinieerd staat:
          de adminformulieren hebben geen gedeelde veldklasse in globals.css, en er hier één
          introduceren zou een derde definitie zijn naast die twee. */}
      <style>{`
        .wdn-field{width:100%;border:1px solid var(--color-outline-variant);border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;background:white}
        .wdn-field:focus{border-color:var(--color-primary)}
        /* Expliciet, want de placeholder erfde hier de volle tekstkleur en "zich schamen (voor)"
           las daardoor als een ingevulde waarde. */
        .wdn-field::placeholder{color:var(--color-outline)}
        .wdn-error{background:rgba(186,26,26,0.08);border-radius:0.75rem;padding:0.75rem;font-size:0.875rem;font-weight:700;color:var(--color-error)}
      `}</style>
    </div>
  );
}

const HEADER_CLS = 'text-on-surface font-medium';

function FilterPopover({
  label,
  active,
  options,
  value,
  onChange,
}: {
  label: string;
  active: boolean;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <FunnelIcon />
            {label}
            {active && <Badge size="sm" variant="info-light">1</Badge>}
          </Button>
        }
      />
      <PopoverContent className="w-52" align="end">
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          {options.map(([v, text]) => (
            <div key={v} className="flex items-center gap-2.5">
              <Checkbox id={`${label}-${v}`} checked={value === v} onCheckedChange={() => onChange(v)} />
              <Label htmlFor={`${label}-${v}`} className="grow font-normal">{text}</Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">{label}</label>
      {children}
    </div>
  );
}
