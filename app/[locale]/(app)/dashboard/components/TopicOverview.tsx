'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from '@/components/ui/item';
import type { KnmQuestion } from '@/data/questions';

export type SectionMeta = {
  id: number;
  slug: string;
  name_nl: string;
  sort_order: number;
  topic: string;
};

type Status = 'beheerst' | 'herhalen' | 'nieuw';

function getStatus(q: KnmQuestion, results: Record<number, boolean>): Status {
  if (!(q.id in results)) return 'nieuw';
  return results[q.id] ? 'beheerst' : 'herhalen';
}

const BADGE: Record<Status, { bg: string; color: string; border: string; label: string }> = {
  beheerst: { bg: '#EEF7EE', color: '#1a7a3c', border: '#bbf7d0', label: 'Beheerst' },
  herhalen: { bg: '#FFF4EE', color: '#a24000', border: '#f4d5c0', label: 'Herhalen' },
  nieuw:    { bg: '#f2f4f6', color: '#747782', border: '#e6e8ea', label: 'Nieuw' },
};

type Props = {
  category: string;
  questions: KnmQuestion[];
  sections: SectionMeta[];
  results: Record<number, boolean>;
  onPractice: (subset: KnmQuestion[]) => void;
  onBack?: () => void;
};

export default function TopicOverview({ category, questions, sections, results, onPractice, onBack }: Props) {
  const [sectionFilter, setSectionFilter] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const filtered = sectionFilter === null
    ? questions
    : questions.filter(q => q.section_id === sectionFilter);

  const beheerst = filtered.filter(q => getStatus(q, results) === 'beheerst').length;
  const herhalen = filtered.filter(q => getStatus(q, results) === 'herhalen').length;
  const nieuw     = filtered.filter(q => getStatus(q, results) === 'nieuw').length;
  const total     = filtered.length;
  const backlog   = filtered.filter(q => getStatus(q, results) !== 'beheerst');
  const masteredPct  = total > 0 ? (beheerst / total) * 100 : 0;
  const herhalenPct  = total > 0 ? (herhalen / total) * 100 : 0;
  const overallPct   = total > 0 ? Math.round((beheerst / total) * 100) : 0;

  const sectionMap = new Map(sections.map(s => [s.id, s]));

  // ── Single-question detail view ──────────────────────────────────────────
  if (selectedIdx !== null) {
    const q = filtered[selectedIdx];
    const status = getStatus(q, results);
    const badge  = BADGE[status];
    const sec    = q.section_id ? sectionMap.get(q.section_id) : null;
    const options: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

    return (
      <div>
        {/* Nav bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => setSelectedIdx(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
            onMouseOver={e => { e.currentTarget.style.background = '#eceef0'; e.currentTarget.style.color = '#002b6d'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#434651'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Terug
          </button>
          <span style={{ fontSize: 13, color: '#9fa3b0', fontWeight: 500 }}>
            {selectedIdx + 1} / {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setSelectedIdx(i => Math.max(0, (i ?? 0) - 1))}
              disabled={selectedIdx === 0}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e6e8ea', background: '#fff', color: selectedIdx === 0 ? '#d0d3de' : '#434651', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selectedIdx === 0 ? 'default' : 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <button
              onClick={() => setSelectedIdx(i => Math.min(filtered.length - 1, (i ?? 0) + 1))}
              disabled={selectedIdx === filtered.length - 1}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e6e8ea', background: '#fff', color: selectedIdx === filtered.length - 1 ? '#d0d3de' : '#434651', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selectedIdx === filtered.length - 1 ? 'default' : 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Question card — styled like woordkaarten list item */}
        <div style={{
          background: '#fff',
          border: `1.5px solid ${badge.border}`,
          borderRadius: 16,
          padding: '20px 20px 20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 16,
          transition: 'border-color .15s',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Meta: number + section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#191c1e', background: '#f2f4f6', padding: '2px 8px', borderRadius: 9999 }}>
                #{selectedIdx + 1}
              </span>
              {sec && (
                <span style={{ fontSize: 11, color: '#9fa3b0', fontWeight: 500 }}>{sec.name_nl}</span>
              )}
            </div>

            {/* Question text */}
            <p style={{ fontSize: 15, fontWeight: 700, color: '#191c1e', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5, margin: '0 0 16px' }}>
              {q.question}
            </p>

            {/* Answer options — read-only, highlight correct */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map(opt => {
                const label = q[`option${opt}` as 'optionA' | 'optionB' | 'optionC'];
                const isCorrect = opt === q.correct;
                return (
                  <div
                    key={opt}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: isCorrect ? 700 : 400,
                      color: isCorrect ? '#1a7a3c' : '#434651',
                      background: isCorrect ? '#EEF7EE' : '#f8f9fb',
                      border: `1px solid ${isCorrect ? '#bbf7d0' : '#e6e8ea'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontWeight: 700, opacity: isCorrect ? 1 : 0.45, fontSize: 12, flexShrink: 0 }}>{opt}.</span>
                    {label}
                    {isCorrect && (
                      <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a7a3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {q.explanation && (
              <p style={{ fontSize: 12, color: '#6e7282', lineHeight: 1.6, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f2f4f6' }}>
                {q.explanation}
              </p>
            )}

            {/* Status badge */}
            <span style={{
              display: 'inline-block',
              marginTop: 16,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: badge.color,
              background: badge.bg,
              padding: '3px 10px',
              borderRadius: 9999,
            }}>
              {badge.label}
            </span>
          </div>

          {/* Check button — woordkaarten style */}
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 12,
              border: `1.5px solid ${status === 'beheerst' ? '#16a34a' : '#e6e8ea'}`,
              background: status === 'beheerst' ? '#f0fdf4' : '#fff',
              color: status === 'beheerst' ? '#16a34a' : '#d0d3de',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
        </div>
      </div>
    );
  }

  // ── Overview ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', marginBottom: 14 }}
              onMouseOver={e => { e.currentTarget.style.background = '#eceef0'; e.currentTarget.style.color = '#002b6d'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#434651'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Terug naar overzicht
            </button>
          )}
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#002b6d', lineHeight: 1.2, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            {category}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1a7a3c', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a7a3c', display: 'inline-block', flexShrink: 0 }} />
              {beheerst} beheerst
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#a24000', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fe762c', display: 'inline-block', flexShrink: 0 }} />
              {herhalen} herhalen
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6e7282', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0e3e5', display: 'inline-block', flexShrink: 0 }} />
              {nieuw} nieuw
            </span>
          </div>
        </div>
        <span style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: overallPct >= 80 ? '#1a7a3c' : overallPct >= 40 ? '#a24000' : '#002b6d', flexShrink: 0, lineHeight: 1 }}>
          {overallPct}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', borderRadius: 99, overflow: 'hidden', height: 8, background: '#e0e3e5', marginBottom: 20 }}>
        {masteredPct > 0 && <div style={{ width: `${masteredPct}%`, background: '#1a7a3c', transition: 'width 0.4s ease' }} />}
        {herhalenPct > 0 && <div style={{ width: `${herhalenPct}%`, background: '#fe762c', transition: 'width 0.4s ease' }} />}
      </div>

      {/* Practice buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => onPractice([...backlog].sort(() => Math.random() - 0.5))}
          disabled={backlog.length === 0}
          style={{
            flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 12, border: 'none', cursor: backlog.length === 0 ? 'default' : 'pointer',
            fontWeight: 700, fontSize: 14, fontFamily: 'Manrope, sans-serif',
            background: backlog.length === 0 ? '#f2f4f6' : 'linear-gradient(135deg,#002b6d,#1d428a)',
            color: backlog.length === 0 ? '#9aa0ab' : '#fff',
            boxShadow: backlog.length === 0 ? 'none' : '0 3px 10px rgba(0,43,109,0.25)',
            transition: 'transform 0.15s,box-shadow 0.15s',
          }}
          onMouseOver={e => { if (backlog.length > 0) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(0,43,109,0.35)'; } }}
          onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = backlog.length === 0 ? 'none' : '0 3px 10px rgba(0,43,109,0.25)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {backlog.length === 0
            ? 'Verder oefenen (alles beheerst!)'
            : `Verder oefenen — ${backlog.length} vragen`}
        </button>
        <button
          onClick={() => onPractice([...filtered].sort(() => Math.random() - 0.5))}
          disabled={filtered.length === 0}
          style={{
            flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 12, border: '1.5px solid #c4d4f0', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, background: '#fff', color: '#002b6d',
            boxShadow: '0 1px 4px rgba(0,43,109,0.06)', transition: 'border-color 0.15s,box-shadow 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#8aaada'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,43,109,0.1)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#c4d4f0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,43,109,0.06)'; }}
        >
          Alle vragen oefenen — {filtered.length}
        </button>
      </div>

      {/* Section filter dropdown */}
      {sections.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-semibold bg-white transition-colors hover:bg-[#f2f4f6] focus-visible:outline-none"
              style={{
                minWidth: 180, maxWidth: 280,
                borderColor: sectionFilter !== null ? '#002b6d' : '#e0e3e5',
                color: sectionFilter !== null ? '#002b6d' : '#434651',
              }}
            >
              <span className="truncate">
                {sectionFilter === null ? 'Alle secties' : sections.find(s => s.id === sectionFilter)?.name_nl ?? 'Alle secties'}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSectionFilter(null)}>
                  <Item size="xs" className="w-full py-1">
                    <ItemContent className="gap-0">
                      <ItemTitle className={sectionFilter === null ? 'text-primary font-semibold' : ''}>
                        Alle secties
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                </DropdownMenuItem>
                {sections.map(s => (
                  <DropdownMenuItem key={s.id} onClick={() => setSectionFilter(s.id)}>
                    <Item size="xs" className="w-full py-1">
                      <ItemContent className="gap-0">
                        <ItemTitle className={sectionFilter === s.id ? 'text-primary font-semibold' : ''}>
                          {s.name_nl}
                        </ItemTitle>
                      </ItemContent>
                    </Item>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Question grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filtered.map((q, idx) => {
          const status = getStatus(q, results);
          const badge  = BADGE[status];
          const sec    = q.section_id != null ? sectionMap.get(q.section_id) : null;
          return (
            <button
              key={q.id}
              onClick={() => setSelectedIdx(idx)}
              style={{
                background: '#fff',
                border: `1.5px solid ${badge.border}`,
                borderRadius: 12,
                padding: '10px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,43,109,0.08)'; e.currentTarget.style.borderColor = status === 'beheerst' ? '#86efac' : status === 'herhalen' ? '#e8a882' : '#c4d4f0'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = badge.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: sec ? 4 : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9fa3b0' }}>#{idx + 1}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: badge.color, background: badge.bg, padding: '2px 7px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                  {badge.label}
                </span>
              </div>
              {sec && (
                <p style={{ fontSize: 11, color: '#9fa3b0', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {sec.name_nl}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
