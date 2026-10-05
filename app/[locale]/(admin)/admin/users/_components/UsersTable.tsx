'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/reui/badge';
import { DataGrid } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from '@/components/reui/frame';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, SearchIcon, XIcon, FunnelIcon } from 'lucide-react';
import type { UserRow, Access } from '../page';

/**
 * Het gebruikersoverzicht: één rij per account, de details in een lade rechts.
 *
 * De kolommen beantwoorden de vraag van de eigenaar over de gratis accounts: wát hebben ze
 * geprobeerd (examens per module), hoever zijn ze met het gratis nakijktegoed (10 per open
 * onderdeel, `FREE_GRADED_PER_SKILL`), en wie heeft ooit betaald. "Betaald ooit" is een eigen
 * filter naast het huidige pakket, zodat een opgezegde abonnee niet in de gratis stapel verdwijnt.
 */

type Filter = Access | 'paid_ever';

const FILTER_LABELS: Record<Filter, string> = {
  free: 'Gratis',
  modules: 'Met pakket',
  legacy: 'Oude aankoop',
  paid_ever: 'Ooit betaald',
};

/** Een module-chip in het merkblauw. `bg-primary/10` rendert dekkend in de admin-bundel, vandaar de rgba. */
function ModuleChip({ children, size }: { children: React.ReactNode; size: 'sm' | 'default' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium whitespace-nowrap ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      }`}
      style={{ background: 'rgba(0,43,109,0.08)', color: '#002b6d' }}
    >
      {children}
    </span>
  );
}

const HEADER_CLS = 'text-on-surface font-medium';

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('nl-NL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function matchesFilter(u: UserRow, f: Filter): boolean {
  return f === 'paid_ever' ? u.payments_count > 0 : u.access === f;
}

/** Het gratis nakijktegoed als balk: "3/10". Een betaald onderdeel heeft geen plafond. */
function GradedBar({ label, used, limit, unlimited }: { label: string; used: number; limit: number; unlimited: boolean }) {
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));
  const full = !unlimited && used >= limit;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[11px] text-on-surface-variant w-7 shrink-0">{label}</span>
      <span
        className="h-1.5 w-16 rounded-full overflow-hidden shrink-0"
        style={{ background: 'rgba(0,43,109,0.08)' }}
        role="progressbar"
        aria-valuenow={used}
        aria-valuemax={unlimited ? undefined : limit}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: unlimited ? 'rgba(0,43,109,0.25)' : full ? '#a24000' : '#002b6d',
          }}
        />
      </span>
      <span className="text-[11px] tabular-nums text-on-surface-variant whitespace-nowrap">
        {unlimited ? (used > 0 ? `${used} · onbeperkt` : 'onbeperkt') : `${used}/${limit}`}
      </span>
    </div>
  );
}

function PackageChips({ u, size = 'sm' }: { u: UserRow; size?: 'sm' | 'default' }) {
  if (u.access === 'free') {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge size={size} variant="secondary">Gratis</Badge>
        {u.lapsed_modules.length > 0 && (
          <span className="text-[10px] text-on-surface-variant">
            verlopen: {u.lapsed_modules.join(', ')}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {u.modules.map(m => (
        <ModuleChip key={m} size={size}>{m}</ModuleChip>
      ))}
      {u.modules_until && (
        <span className="text-[10px] text-on-surface-variant basis-full">
          opgezegd · tot {fmtDate(u.modules_until)}
        </span>
      )}
    </div>
  );
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-on-surface uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

type Props = { users: UserRow[] };

export default function UsersTable({ users }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { free: 0, modules: 0, legacy: 0, paid_ever: 0 };
    for (const u of users) {
      c[u.access] += 1;
      if (u.payments_count > 0) c.paid_ever += 1;
    }
    return c;
  }, [users]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => {
      const matchesAccess = !filters.length || filters.some(f => matchesFilter(u, f));
      const matchesSearch = !q || u.email.toLowerCase().includes(q);
      return matchesAccess && matchesSearch;
    });
  }, [users, searchQuery, filters]);

  const hasFilters = !!searchQuery || filters.length > 0;

  function toggleFilter(checked: boolean, value: Filter) {
    setFilters(prev => (checked ? [...prev, value] : prev.filter(v => v !== value)));
  }

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);

  const columns = useMemo<ColumnDef<UserRow>[]>(() => [
    {
      accessorKey: 'email',
      id: 'email',
      header: ({ column }) => <DataGridColumnHeader title="E-mail" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-on-surface truncate block max-w-[220px]">{row.original.email}</span>
      ),
      size: 230,
      enableSorting: true,
    },
    {
      id: 'access',
      accessorFn: u => (u.access === 'free' ? 0 : u.access === 'modules' ? u.modules.length : 99),
      header: ({ column }) => <DataGridColumnHeader title="Pakket" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <PackageChips u={row.original} />,
      size: 200,
      enableSorting: true,
    },
    {
      id: 'graded',
      accessorFn: u => u.graded.schrijven + u.graded.spreken,
      header: ({ column }) => <DataGridColumnHeader title="Nakijken" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const u = row.original;
        const covers = (skill: string) =>
          u.access === 'legacy' || u.modules.some(m => m.toLowerCase().endsWith(skill));
        return (
          <div className="flex flex-col gap-1 py-0.5">
            <GradedBar label="Schr." used={u.graded.schrijven} limit={u.graded_limit} unlimited={covers('schrijven')} />
            <GradedBar label="Spr." used={u.graded.spreken} limit={u.graded_limit} unlimited={covers('spreken')} />
          </div>
        );
      },
      size: 215,
      enableSorting: true,
    },
    {
      id: 'exams',
      accessorFn: u => u.exams.reduce((s, e) => s + e.attempts, 0),
      header: ({ column }) => <DataGridColumnHeader title="Examens" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const { exams } = row.original;
        if (!exams.length) return <span className="text-xs text-on-surface-variant">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {exams.map(e => (
              <span
                key={e.module}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-on-surface whitespace-nowrap"
                style={{ background: 'rgba(0,43,109,0.06)' }}
                title={`${e.attempts} zitting${e.attempts === 1 ? '' : 'en'}, ${e.passed} geslaagd, beste ${e.best_pct ?? '–'}%`}
              >
                {e.passed > 0 && <Check className="w-3 h-3" style={{ color: '#a24000' }} aria-label="geslaagd" />}
                {e.label}
                <span className="tabular-nums text-on-surface-variant">{e.attempts}</span>
              </span>
            ))}
          </div>
        );
      },
      size: 260,
      enableSorting: true,
    },
    {
      id: 'lessons',
      accessorFn: u => u.lessons_done,
      header: ({ column }) => <DataGridColumnHeader title="Lessen" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const { lessons_done, lessons_started } = row.original;
        if (!lessons_started) return <span className="text-xs text-on-surface-variant">—</span>;
        return (
          <span className="text-xs tabular-nums">
            <span className="font-medium text-on-surface">{lessons_done}</span>
            <span className="text-on-surface-variant"> af · {lessons_started} gestart</span>
          </span>
        );
      },
      size: 120,
      enableSorting: true,
    },
    {
      accessorKey: 'last_active_at',
      id: 'last_active_at',
      header: ({ column }) => <DataGridColumnHeader title="Laatste activiteit" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{fmtDate(row.original.last_active_at)}</span>,
      size: 130,
      enableSorting: true,
    },
    {
      accessorKey: 'created_at',
      id: 'created_at',
      header: ({ column }) => <DataGridColumnHeader title="Aangemeld" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{fmtDate(row.original.created_at)}</span>,
      size: 110,
      enableSorting: true,
    },
  ], []);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData.length || 0) / pagination.pageSize),
    getRowId: (row: UserRow) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-[padding] duration-300 ${selected ? 'pr-[540px]' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Gebruikers</h1>
          <p className="text-on-surface-variant text-sm">
            {filteredData.length}{hasFilters ? ` van ${users.length}` : ''} gebruikers
            <span className="mx-2 text-outline-variant">·</span>
            {counts.free} gratis, {counts.modules} met pakket
            {counts.legacy > 0 && `, ${counts.legacy} oude aankoop`}
            <span className="mx-2 text-outline-variant">·</span>
            {counts.paid_ever} ooit betaald
          </p>
        </div>
      </div>

      <DataGrid
        table={table}
        recordCount={filteredData.length || 0}
        tableLayout={{ columnsResizable: true, columnsVisibility: true }}
        tableClassNames={{ edgeCell: 'px-4' }}
        onRowClick={(row) => setSelected(row as UserRow)}
      >
        <Frame className="w-full" stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>Gebruikersoverzicht</FrameTitle>
            <div className="flex items-center gap-2.5">
              <InputGroup className="bg-background w-56">
                <InputGroupAddon align="inline-start"><SearchIcon /></InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek op e-mail…"
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
                      Pakket
                      {filters.length > 0 && <Badge size="sm" variant="secondary">{filters.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Toegang</div>
                    {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
                      <div key={f} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`filter-${f}`}
                          checked={filters.includes(f)}
                          onCheckedChange={(c) => toggleFilter(c === true, f)}
                        />
                        <Label htmlFor={`filter-${f}`} className="flex grow items-center justify-between gap-1.5 font-normal">
                          {FILTER_LABELS[f]}
                          <span className="text-muted-foreground">{counts[f]}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setFilters([]); }}>
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

      <div
        className={`fixed top-0 right-0 h-full w-[500px] bg-white z-40 flex flex-col transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none ${selected ? 'translate-x-0 visible' : 'translate-x-full invisible'}`}
        aria-hidden={!selected}
        style={{ boxShadow: '0 0 32px rgba(0,43,109,0.10)' }}
      >
        <div className="flex items-start justify-between px-6 py-5 bg-surface-container-low shrink-0">
          <div className="min-w-0">
            <h2 className="font-headline font-semibold text-on-surface truncate max-w-[360px]">{selected?.email}</h2>
            <div className="mt-1.5">{selected && <PackageChips u={selected} size="default" />}</div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container active:scale-95"
            aria-label="Sluiten"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {selected && (
            <>
              <div className="rounded-xl p-4 space-y-3 bg-surface-container-low">
                <p className="text-xs font-semibold text-on-surface uppercase tracking-wide">Account</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Aangemeld</p>
                    <p className="font-medium text-on-surface">{fmtDate(selected.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Laatste login</p>
                    <p className="font-medium text-on-surface">{fmtDate(selected.last_sign_in_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Laatste activiteit</p>
                    <p className="font-medium text-on-surface">{fmtDate(selected.last_active_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Woordkaarten gekend</p>
                    <p className="font-medium text-on-surface tabular-nums">{selected.cards_known}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">User ID</p>
                    <p className="font-mono text-xs text-on-surface-variant break-all">{selected.id}</p>
                  </div>
                </div>
              </div>

              <PanelField label="Betalingen">
                {selected.last_payment ? (
                  <div className="rounded-xl p-3 bg-surface-container-low space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-on-surface">
                        {fmtAmount(selected.payments_total_cents)} totaal
                      </span>
                      <ModuleChip size="default">
                        {selected.payments_count} betaling{selected.payments_count === 1 ? '' : 'en'}
                      </ModuleChip>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Laatste: {fmtAmount(selected.last_payment.amount_cents)} op {fmtDateTime(selected.last_payment.created_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Nog niets betaald.</p>
                )}
              </PanelField>

              <PanelField label="Gratis nakijktegoed">
                <div className="rounded-xl p-3 bg-surface-container-low space-y-2">
                  <GradedBar
                    label="Schr."
                    used={selected.graded.schrijven}
                    limit={selected.graded_limit}
                    unlimited={selected.access === 'legacy' || selected.modules.some(m => m.endsWith('Schrijven'))}
                  />
                  <GradedBar
                    label="Spr."
                    used={selected.graded.spreken}
                    limit={selected.graded_limit}
                    unlimited={selected.access === 'legacy' || selected.modules.some(m => m.endsWith('Spreken'))}
                  />
                  <p className="text-[11px] text-on-surface-variant">
                    Een gratis account krijgt {selected.graded_limit} nagekeken opdrachten per onderdeel.
                  </p>
                </div>
              </PanelField>

              <PanelField label="Examens per module">
                {selected.exams.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Nog geen examen afgerond.</p>
                ) : (
                  <div className="rounded-xl bg-surface-container-low overflow-hidden">
                    {selected.exams.map((e, i) => (
                      <div
                        key={e.module}
                        className={`flex items-center justify-between gap-3 px-3 py-2 ${i % 2 === 1 ? 'bg-surface-container' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface">{e.label}</p>
                          <p className="text-[11px] text-on-surface-variant">laatst {fmtDate(e.last_at)}</p>
                        </div>
                        <div className="text-right text-xs tabular-nums whitespace-nowrap">
                          <p className="text-on-surface">
                            {e.attempts} zitting{e.attempts === 1 ? '' : 'en'}
                            {e.passed > 0 && (
                              <span className="inline-flex items-center gap-0.5 ml-1.5" style={{ color: '#a24000' }}>
                                <Check className="w-3 h-3" />{e.passed} geslaagd
                              </span>
                            )}
                          </p>
                          <p className="text-on-surface-variant">beste {e.best_pct ?? '–'}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PanelField>

              <PanelField label="Lessen">
                <p className="text-sm text-on-surface">
                  <span className="font-semibold tabular-nums">{selected.lessons_done}</span> afgerond
                  <span className="text-on-surface-variant"> · {selected.lessons_started} gestart</span>
                </p>
              </PanelField>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
