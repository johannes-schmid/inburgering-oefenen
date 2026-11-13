'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { DataGrid } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from '@/components/reui/frame';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink, Loader2, Mail, SearchIcon, XIcon } from 'lucide-react';
import { REVIEW_COOLDOWN_DAYS, canRequestReview, usageBand, type UsageBand } from '@/lib/admin/review-score';
import { TRUSTPILOT_REVIEW_URL } from '@/lib/email/templates/review-request';
import type { ReviewRow } from '../page';

/**
 * Reviews: iedereen die betaald heeft, gesorteerd op hoeveel ze het product gebruikt hebben, met
 * per rij een knop die het reviewverzoek verstuurt.
 *
 * De knop vraagt een tweede klik ("Bevestig"): de mail gaat naar een echte klant en is niet terug
 * te halen, en in een dichte tabel zit een misklik zo. Na het versturen staat de rij op "Gevraagd"
 * en blijft de knop dicht tot de wachttijd om is — dezelfde regel die de route afdwingt.
 */

type Status = 'open' | 'asked';
type StatusFilter = 'all' | Status;

const HEADER_CLS = 'text-on-surface font-medium';

const BAND: Record<UsageBand, { label: string; fill: string }> = {
  hoog: { label: 'veel gebruikt', fill: '#002b6d' },
  midden: { label: 'gemiddeld', fill: 'rgba(0,43,109,0.55)' },
  laag: { label: 'weinig gebruikt', fill: 'rgba(0,43,109,0.28)' },
};

const LOCALE_LABEL = { nl: 'NL', en: 'EN', ar: 'AR' } as const;

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function ScoreCell({ row }: { row: ReviewRow }) {
  const band = BAND[usageBand(row.score)];
  const { parts } = row;
  return (
    <div
      className="flex items-center gap-2.5"
      title={`Examens ${parts.exams}/40 · actieve dagen ${parts.days}/20 · lessen ${parts.lessons}/20 · nagekeken ${parts.graded}/15 · woordkaarten ${parts.cards}/5`}
    >
      <span className="w-7 text-right text-sm font-semibold tabular-nums text-on-surface">{row.score}</span>
      <span className="flex flex-col gap-1">
        <span
          className="block h-1.5 w-20 overflow-hidden rounded-full"
          style={{ background: 'rgba(0,43,109,0.08)' }}
          role="progressbar"
          aria-valuenow={row.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Gebruiksscore"
        >
          <span className="block h-full rounded-full" style={{ width: `${row.score}%`, background: band.fill }} />
        </span>
        <span className="text-[11px] leading-none text-on-surface-variant">{band.label}</span>
      </span>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className={`font-medium tabular-nums ${value ? 'text-on-surface' : 'text-on-surface-variant'}`}>{value}</span>
      <span className="text-on-surface-variant"> {label}</span>
    </span>
  );
}

type SendState = { phase: 'idle' | 'armed' | 'sending' } | { phase: 'error'; message: string };

function RequestButton({
  row,
  requestedAt,
  onSent,
}: {
  row: ReviewRow;
  requestedAt: string | null;
  onSent: (id: string, sentAt: string) => void;
}) {
  const [state, setState] = useState<SendState>({ phase: 'idle' });

  // Een gewapende knop die blijft staan is een misklik die wacht: na vier seconden weer dicht.
  useEffect(() => {
    if (state.phase !== 'armed') return;
    const timer = setTimeout(() => setState({ phase: 'idle' }), 4000);
    return () => clearTimeout(timer);
  }, [state.phase]);

  if (!canRequestReview(requestedAt)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant whitespace-nowrap">
        <Check className="size-3.5" style={{ color: '#002b6d' }} aria-hidden />
        Gevraagd op {fmtDate(requestedAt)}
      </span>
    );
  }

  async function send() {
    setState({ phase: 'sending' });
    try {
      const res = await fetch('/api/admin/request-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: row.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { sentAt?: string; error?: string };
      if (res.status === 409 && json.sentAt) return onSent(row.id, json.sentAt);
      if (!res.ok || !json.sentAt) {
        return setState({ phase: 'error', message: json.error ?? 'Versturen is mislukt.' });
      }
      onSent(row.id, json.sentAt);
    } catch {
      setState({ phase: 'error', message: 'Geen verbinding. Probeer het opnieuw.' });
    }
  }

  const armed = state.phase === 'armed';
  const sending = state.phase === 'sending';

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant={armed ? 'default' : 'outline'}
        disabled={sending}
        onClick={e => {
          e.stopPropagation();
          if (armed) void send();
          else setState({ phase: 'armed' });
        }}
        className="transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
        aria-label={armed ? `Bevestig: verstuur reviewverzoek naar ${row.email}` : `Vraag ${row.email} om een review`}
      >
        {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
        {sending ? 'Versturen…' : armed ? 'Bevestig versturen' : requestedAt ? 'Vraag opnieuw' : 'Vraag review'}
      </Button>
      {state.phase === 'error' && (
        <span role="alert" className="text-[11px]" style={{ color: '#a24000' }}>
          {state.message}
        </span>
      )}
      {state.phase !== 'error' && requestedAt && (
        <span className="text-[11px] text-on-surface-variant">eerder gevraagd op {fmtDate(requestedAt)}</span>
      )}
    </div>
  );
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Iedereen' },
  { value: 'open', label: 'Nog te vragen' },
  { value: 'asked', label: 'Gevraagd' },
];

export default function ReviewsTable({ rows }: { rows: ReviewRow[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  // Wat in deze sessie verstuurd is, bovenop wat de server meegaf.
  const [sent, setSent] = useState<Record<string, string>>({});

  const counts = useMemo(() => {
    const c = { all: rows.length, open: 0, asked: 0 };
    for (const r of rows) c[canRequestReview(sent[r.id] ?? r.requested_at) ? 'open' : 'asked'] += 1;
    return c;
  }, [rows, sent]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(r => {
      const status: Status = canRequestReview(sent[r.id] ?? r.requested_at) ? 'open' : 'asked';
      const matchesStatus = filter === 'all' || status === filter;
      const matchesSearch = !q || r.email.toLowerCase().includes(q) || (r.name ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rows, searchQuery, filter, sent]);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'score', desc: true }]);

  const columns = useMemo<ColumnDef<ReviewRow>[]>(() => [
    {
      accessorKey: 'email',
      id: 'email',
      header: ({ column }) => <DataGridColumnHeader title="Klant" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <div className="min-w-0 py-0.5">
          <span className="block max-w-[190px] truncate text-sm font-medium text-on-surface">
            {row.original.name ?? row.original.email}
          </span>
          <span className="block max-w-[190px] truncate text-[11px] text-on-surface-variant">
            {row.original.name ? `${row.original.email} · ` : ''}mail in {LOCALE_LABEL[row.original.locale]}
          </span>
        </div>
      ),
      size: 220,
      enableSorting: true,
    },
    {
      accessorKey: 'score',
      id: 'score',
      header: ({ column }) => <DataGridColumnHeader title="Gebruiksscore" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <ScoreCell row={row.original} />,
      size: 160,
      enableSorting: true,
    },
    {
      id: 'usage',
      accessorFn: r => r.exams_completed,
      header: ({ column }) => <DataGridColumnHeader title="Gebruik" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            <Stat value={r.exams_completed} label={r.exams_completed === 1 ? 'examen' : 'examens'} />
            <Stat value={r.lessons_done} label={r.lessons_done === 1 ? 'les' : 'lessen'} />
            <Stat value={r.graded_tasks} label="nagekeken" />
            <Stat value={r.active_days} label={r.active_days === 1 ? 'dag actief' : 'dagen actief'} />
          </div>
        );
      },
      size: 210,
      enableSorting: true,
    },
    {
      id: 'paid',
      accessorFn: r => r.payments_total_cents,
      header: ({ column }) => <DataGridColumnHeader title="Betaald" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="text-xs">
            <span className="font-medium tabular-nums text-on-surface">{fmtAmount(r.payments_total_cents)}</span>
            <span className="text-on-surface-variant"> · {r.payments_count}×</span>
            <span className="block text-[11px] text-on-surface-variant">
              sinds {fmtDate(r.first_payment_at)} · {r.subscribed ? 'loopt' : 'gestopt'}
            </span>
          </div>
        );
      },
      size: 160,
      enableSorting: true,
    },
    {
      accessorKey: 'last_active_at',
      id: 'last_active_at',
      header: ({ column }) => <DataGridColumnHeader title="Laatst actief" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => <span className="text-xs text-on-surface-variant">{fmtDate(row.original.last_active_at)}</span>,
      size: 130,
      enableSorting: true,
    },
    {
      id: 'request',
      accessorFn: r => sent[r.id] ?? r.requested_at ?? '',
      header: ({ column }) => <DataGridColumnHeader title="Reviewverzoek" column={column} className={HEADER_CLS} />,
      cell: ({ row }) => (
        <RequestButton
          row={row.original}
          requestedAt={sent[row.original.id] ?? row.original.requested_at}
          onSent={(id, sentAt) => setSent(prev => ({ ...prev, [id]: sentAt }))}
        />
      ),
      size: 190,
      enableSorting: true,
    },
  ], [sent]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData.length || 0) / pagination.pageSize),
    getRowId: (row: ReviewRow) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-[68ch]">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Reviews</h1>
          <p className="text-sm text-on-surface-variant">
            {counts.all} betalende {counts.all === 1 ? 'klant' : 'klanten'}
            <span className="mx-2 text-outline-variant">·</span>
            {counts.open} nog te vragen
            <span className="mx-2 text-outline-variant">·</span>
            {counts.asked} gevraagd
          </p>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            De score (0–100) telt afgeronde examens, actieve dagen, lessen, nagekeken opdrachten en woordkaarten.
            Hij sorteert alleen: Trustpilot staat niet toe dat je alleen tevreden klanten uitnodigt, dus iedereen
            die betaald heeft staat hier. Na een verzoek blijft de knop {REVIEW_COOLDOWN_DAYS} dagen dicht.
          </p>
        </div>
        <a
          href={TRUSTPILOT_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          Trustpilot-pagina
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <DataGrid
        table={table}
        recordCount={filteredData.length || 0}
        tableLayout={{ columnsResizable: true, columnsVisibility: true }}
        tableClassNames={{ edgeCell: 'px-4' }}
        emptyMessage={
          rows.length === 0
            ? 'Nog niemand heeft betaald. Zodra er een betaling binnen is, staat de klant hier.'
            : 'Geen klanten met dit filter.'
        }
      >
        <Frame className="w-full" stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <FrameTitle>Betalende klanten</FrameTitle>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1" role="group" aria-label="Filter op reviewverzoek">
                {FILTERS.map(f => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant="ghost"
                    aria-pressed={filter === f.value}
                    style={filter === f.value ? { background: 'rgba(0,43,109,0.08)', color: '#002b6d' } : undefined}
                    onClick={() => {
                      setFilter(f.value);
                      setPagination(p => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    {f.label}
                    <span className="tabular-nums text-muted-foreground">{counts[f.value]}</span>
                  </Button>
                ))}
              </div>
              <InputGroup className="w-56 bg-background">
                <InputGroupAddon align="inline-start"><SearchIcon /></InputGroupAddon>
                <InputGroupInput
                  placeholder="Zoek op naam of e-mail…"
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
