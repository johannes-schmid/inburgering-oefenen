'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Plus, Search, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type QuestionRow = {
  id: number;
  sort_order: number;
  prompt: string;
  has_explanation: boolean;
  option_layout: 'text' | 'image' | 'image_grid';
  option_count: number;
  has_correct: boolean;
  review_status: 'pending' | 'validated';
  updated_at: string | null;
  stimulus_id: number;
  stimulus_title: string | null;
  stimulus_kind: string;
  stimulus_order: number;
  skill: string;
  exam_number: number;
};

/**
 * The flat question list.
 *
 * This replaced a KNM table that carried its **own** edit drawer writing
 * `category`/`option_a..c` — a second save path that broke silently when the schema changed.
 * There is now exactly one editor (`/admin/questions/[id]/edit`), so a schema change can only
 * break one place.
 *
 * Bulk validate stays here because it is the one action that is genuinely list-shaped: the
 * docent reviews a screenful and signs them off together.
 */
export default function QuestionsTable({
  rows,
  locale,
}: {
  rows: QuestionRow[];
  locale: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [skill, setSkill] = useState('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'validated' | 'problem'>('all');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const skills = useMemo(() => [...new Set(rows.map(r => r.skill))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return rows.filter(r => {
      if (skill !== 'all' && r.skill !== skill) return false;
      const broken = !r.has_correct || r.option_count < 3 || !r.has_explanation;
      if (status === 'problem' && !broken) return false;
      if (status === 'pending' && r.review_status !== 'pending') return false;
      if (status === 'validated' && r.review_status !== 'validated') return false;
      if (!q) return true;
      return `${r.id} ${r.prompt} ${r.stimulus_title ?? ''} ${r.skill}`.toLowerCase().includes(q);
    });
  }, [rows, term, skill, status]);

  const problems = rows.filter(r => !r.has_correct || r.option_count < 3 || !r.has_explanation).length;

  function toggle(id: number) {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function validateSelected() {
    if (!picked.size) return;
    setBusy(true);
    await createClient()
      .from('questions')
      .update({ review_status: 'validated', reviewed_at: new Date().toISOString() })
      .in('id', [...picked]);
    setBusy(false);
    setPicked(new Set());
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface m-0">Vragen</h1>
          <p className="text-sm text-on-surface-variant mt-1 mb-0">
            {rows.length} vragen
            {problems > 0 && <span className="text-error"> · {problems} met een probleem</span>}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/questions/new`}
          className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors no-underline"
        >
          <Plus size={15} aria-hidden />
          Nieuwe vraag
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search
            size={15}
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
          <input
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Zoek in vragen…"
            className="field"
            style={{ paddingLeft: '2.1rem', width: 260 }}
          />
        </div>

        <select value={skill} onChange={e => setSkill(e.target.value)} className="field">
          <option value="all">Alle vaardigheden</option>
          {skills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={status}
          onChange={e => setStatus(e.target.value as typeof status)}
          className="field"
        >
          <option value="all">Alle statussen</option>
          <option value="pending">Nog nakijken</option>
          <option value="validated">Nagekeken</option>
          <option value="problem">Met een probleem</option>
        </select>

        {picked.size > 0 && (
          <button
            type="button"
            onClick={validateSelected}
            disabled={busy}
            className="inline-flex items-center gap-1.5 bg-success text-white px-3.5 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Check size={15} aria-hidden />}
            {picked.size} afvinken
          </button>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr className="bg-surface-container-low text-left">
              <Th style={{ width: 34 }}><span className="sr-only">Selecteren</span></Th>
              <Th style={{ width: 58 }}>ID</Th>
              <Th style={{ width: 100 }}>Examen</Th>
              <Th>Stimulus</Th>
              <Th>Vraag</Th>
              <Th style={{ width: 110 }}>Opties</Th>
              <Th style={{ width: 130 }}>Status</Th>
              <Th style={{ width: 76 }}><span className="sr-only">Acties</span></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const broken =
                !r.has_correct ? 'geen juist antwoord'
                : r.option_count < 3 ? `maar ${r.option_count} opties`
                : !r.has_explanation ? 'geen uitleg'
                : null;

              return (
                <tr key={r.id} className="border-t border-outline-variant hover:bg-surface-container-low">
                  <Td>
                    <input
                      type="checkbox"
                      checked={picked.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Vraag ${r.id} selecteren`}
                      className="accent-primary w-4 h-4"
                    />
                  </Td>
                  <Td className="tabular-nums text-on-surface-variant">{r.id}</Td>
                  <Td className="whitespace-nowrap text-xs text-on-surface-variant capitalize">
                    {r.skill} {r.exam_number}
                  </Td>
                  <Td className="text-xs text-on-surface-variant">
                    <span className="tabular-nums">{r.stimulus_order}.</span>{' '}
                    {r.stimulus_title || r.stimulus_kind}
                  </Td>
                  <Td>
                    <span className="text-on-surface line-clamp-2">{r.prompt}</span>
                  </Td>
                  <Td className="text-xs text-on-surface-variant whitespace-nowrap">
                    {r.option_count}
                    {r.option_layout !== 'text' && ` · ${r.option_layout === 'image' ? 'afb.' : 'afb. set'}`}
                  </Td>
                  <Td>
                    {broken ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
                        <TriangleAlert size={12} strokeWidth={2.4} aria-hidden />
                        {broken}
                      </span>
                    ) : (
                      <span
                        className={`text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.review_status === 'validated'
                            ? 'bg-success/15 text-success'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {r.review_status === 'validated' ? 'nagekeken' : 'concept'}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Link
                      href={`/${locale}/admin/questions/${r.id}/edit`}
                      className="text-xs font-medium text-primary hover:underline no-underline"
                    >
                      Bewerken
                    </Link>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3.5 py-8 text-center text-sm text-on-surface-variant">
                  {rows.length === 0
                    ? 'Nog geen vragen. Maak eerst een stimulus aan bij een examen.'
                    : 'Geen vragen voor deze filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .field {
          border: 1px solid var(--color-outline-variant);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: var(--color-surface);
          color: var(--color-on-surface);
        }
        .field:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
      style={style}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3.5 py-2.5 align-top ${className}`}>{children}</td>;
}
