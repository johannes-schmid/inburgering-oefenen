'use client';

import { useMemo, useState, useTransition } from 'react';
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
import { SearchIcon, XIcon, FunnelIcon } from 'lucide-react';
import type { UserRow, ActivityEvent } from '../page';

const PLAN_LABELS: Record<UserRow['plan'], string> = {
  free: 'Gratis',
  premium: 'Professioneel',
  premium_plus: 'Compleet',
};

const PLAN_BADGE_VARIANT: Record<UserRow['plan'], 'secondary' | 'info-light' | 'success-light'> = {
  free: 'secondary',
  premium: 'info-light',
  premium_plus: 'success-light',
};

const ACTIVITY_ICON: Record<ActivityEvent['type'], string> = {
  exam: 'quiz',
  leren: 'menu_book',
  woordkaart: 'style',
};

const HEADER_CLS = 'text-on-surface font-medium';

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('nl-NL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('nl-NL', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
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
  const [isPending, startTransition] = useTransition();
  void startTransition; // keep for future refresh

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<UserRow['plan'][]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const planCounts = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, u) => {
      acc[u.plan] = (acc[u.plan] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => {
      const matchesPlan = !selectedPlans.length || selectedPlans.includes(u.plan);
      const matchesSearch = !q || u.email.toLowerCase().includes(q);
      return matchesPlan && matchesSearch;
    });
  }, [users, searchQuery, selectedPlans]);

  const hasFilters = !!searchQuery || selectedPlans.length > 0;

  function togglePlan(checked: boolean, value: UserRow['plan']) {
    setSelectedPlans(prev => checked ? [...prev, value] : prev.filter(v => v !== value));
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
      size: 240,
      enableSorting: true,
    },
    {
      accessorKey: 'plan',
      id: 'plan',
      header: ({ column }) => <DataGridColumnHeader title="Pakket" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <Badge variant={PLAN_BADGE_VARIANT[row.original.plan]}>
          {PLAN_LABELS[row.original.plan]}
        </Badge>
      ),
      size: 120,
      enableSorting: true,
    },
    {
      accessorKey: 'last_sign_in_at',
      id: 'last_sign_in_at',
      header: ({ column }) => <DataGridColumnHeader title="Laatste login" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{fmtDate(row.original.last_sign_in_at)}</span>,
      size: 120,
      enableSorting: true,
    },
    {
      id: 'last_payment',
      header: ({ column }) => <DataGridColumnHeader title="Betaling" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const p = row.original.last_payment;
        if (!p) return <span className="text-xs text-on-surface-variant">—</span>;
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-on-surface">{fmtAmount(p.amount_cents)}</span>
            <span className="text-[10px] text-on-surface-variant block">{fmtDate(p.created_at)}</span>
          </div>
        );
      },
      size: 100,
      enableSorting: false,
    },
    {
      id: 'exams',
      header: ({ column }) => <DataGridColumnHeader title="Examens" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const { exams_passed, exams_completed } = row.original;
        if (!exams_completed) return <span className="text-xs text-on-surface-variant">—</span>;
        return (
          <span className="text-xs tabular-nums">
            <span className="text-emerald-700 font-medium">{exams_passed}</span>
            <span className="text-on-surface-variant">/{exams_completed}</span>
          </span>
        );
      },
      size: 80,
      enableSorting: false,
    },
    {
      id: 'themas',
      header: ({ column }) => <DataGridColumnHeader title="Lessen" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-on-surface-variant">{row.original.themas_completed || '—'}</span>
      ),
      size: 70,
      enableSorting: false,
    },
    {
      id: 'cards',
      header: ({ column }) => <DataGridColumnHeader title="Kaarten" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const { cards_known, cards_seen } = row.original;
        if (!cards_seen) return <span className="text-xs text-on-surface-variant">—</span>;
        return (
          <span className="text-xs tabular-nums">
            <span className="text-emerald-700 font-medium">{cards_known}</span>
            <span className="text-on-surface-variant">/{cards_seen}</span>
          </span>
        );
      },
      size: 80,
      enableSorting: false,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${selected ? 'pr-[540px]' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Gebruikers</h1>
          <p className="text-on-surface-variant text-sm">
            {filteredData.length}{hasFilters ? ` van ${users.length}` : ''} gebruikers
            <span className="mx-2 text-outline-variant">·</span>
            {planCounts.premium_plus ?? 0} Compleet, {planCounts.premium ?? 0} Professioneel, {planCounts.free ?? 0} Gratis
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
        <Frame className={`w-full transition-opacity ${isPending ? 'opacity-60' : ''}`} stacked dense>
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
                      {selectedPlans.length > 0 && <Badge size="sm" variant="info-light">{selectedPlans.length}</Badge>}
                    </Button>
                  }
                />
                <PopoverContent className="w-52" align="end">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">Pakket</div>
                    {(['free', 'premium', 'premium_plus'] as UserRow['plan'][]).map((p) => (
                      <div key={p} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`plan-${p}`}
                          checked={selectedPlans.includes(p)}
                          onCheckedChange={(c) => togglePlan(c === true, p)}
                        />
                        <Label htmlFor={`plan-${p}`} className="flex grow items-center justify-between gap-1.5 font-normal">
                          {PLAN_LABELS[p]}
                          <span className="text-muted-foreground">{planCounts[p] ?? 0}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedPlans([]); }}>
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

      {/* Slide-out detail drawer */}
      <div className={`fixed top-0 right-0 h-full w-[500px] bg-white border-l border-outline-variant shadow-2xl z-40 flex flex-col transition-transform duration-200 ease-out ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant/50 shrink-0">
          <div>
            <h2 className="font-headline font-semibold text-on-surface truncate max-w-[360px]">{selected?.email}</h2>
            <div className="flex items-center gap-2 mt-1">
              {selected && (
                <Badge variant={PLAN_BADGE_VARIANT[selected.plan]}>
                  {PLAN_LABELS[selected.plan]}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {selected && (
            <>
              {/* Account */}
              <div className="rounded-xl border border-outline-variant p-4 space-y-3 bg-surface-container-lowest">
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
                  <div className="col-span-2">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">User ID</p>
                    <p className="font-mono text-xs text-on-surface-variant break-all">{selected.id}</p>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <PanelField label="Betaling">
                {selected.last_payment ? (
                  <div className="rounded-xl border border-outline-variant p-3 bg-surface-container-lowest space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-on-surface">{fmtAmount(selected.last_payment.amount_cents)}</span>
                      <Badge variant="success-light">Betaald</Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {selected.last_payment.product === 'premium' ? 'Professioneel Pakket' :
                       selected.last_payment.product === 'premium_plus' ? 'Compleet Pakket' :
                       selected.last_payment.product === 'upgrade_to_plus' ? 'Upgrade naar Compleet' :
                       selected.last_payment.product}
                      <span className="mx-1.5 text-outline-variant">·</span>
                      {fmtDateTime(selected.last_payment.created_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Geen betaling gevonden.</p>
                )}
              </PanelField>

              {/* Progress summary */}
              <PanelField label="Voortgang">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-outline-variant p-3 bg-surface-container-lowest text-center">
                    <p className="text-lg font-bold text-on-surface tabular-nums">
                      <span className="text-emerald-700">{selected.exams_passed}</span>
                      <span className="text-on-surface-variant text-sm font-medium">/{selected.exams_completed}</span>
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Examens geslaagd</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant p-3 bg-surface-container-lowest text-center">
                    <p className="text-lg font-bold text-on-surface tabular-nums">{selected.themas_completed}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Lessen afgerond</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant p-3 bg-surface-container-lowest text-center">
                    <p className="text-lg font-bold text-on-surface tabular-nums">
                      <span className="text-emerald-700">{selected.cards_known}</span>
                      <span className="text-on-surface-variant text-sm font-medium">/{selected.cards_seen}</span>
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Kaarten gekend</p>
                  </div>
                </div>
              </PanelField>

              {/* Activity timeline */}
              <PanelField label="Recente activiteit">
                {selected.activity.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Nog geen activiteit.</p>
                ) : (
                  <div className="space-y-1">
                    {selected.activity.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-outline-variant/40 last:border-0">
                        <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                          ev.type === 'exam' ? 'text-blue-600' :
                          ev.type === 'leren' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>{ACTIVITY_ICON[ev.type]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-on-surface leading-snug">{ev.label}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{fmtDateTime(ev.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PanelField>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
