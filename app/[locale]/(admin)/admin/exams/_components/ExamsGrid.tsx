'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EXAM_ASSIGNMENTS } from '@/data/exam-assignments';
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: number;
  category: string;
  question: string;
  exam: number | null;
  oefenen: boolean;
  review_status: string | null;
  explanation: string | null;
  image_url: string | null;
}

type Target = number | 'oefenen';

interface Warning {
  type: 'too_few' | 'too_many' | 'unvalidated' | 'missing_explanation' | 'static_mismatch' | 'category_imbalance';
  label: string;
  affectedIds: number[];
}

const CATEGORIES = [
  'Geschiedenis en Geografie',
  'Staatsinrichting en Rechtsstaat',
  'Instanties',
  'Werk en Inkomen',
  'Gezondheid en Gezondheidszorg',
  'Onderwijs en Opvoeding',
  'Wonen',
];

const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
];

const CATEGORY_TEXT_COLORS = [
  'text-blue-600',
  'text-violet-600',
  'text-emerald-600',
  'text-amber-600',
  'text-rose-600',
  'text-cyan-600',
  'text-orange-600',
];

const CATEGORY_BG_LIGHT = [
  'bg-blue-50',
  'bg-violet-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-cyan-50',
  'bg-orange-50',
];

const CATEGORY_TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
];

const CATEGORY_SHORT: Record<string, string> = {
  'Geschiedenis en Geografie': 'Gesch.',
  'Staatsinrichting en Rechtsstaat': 'Staat.',
  'Instanties': 'Instanties',
  'Werk en Inkomen': 'Werk',
  'Gezondheid en Gezondheidszorg': 'Gezond.',
  'Onderwijs en Opvoeding': 'Onderwijs',
  'Wonen': 'Wonen',
};

function CategoryTag({ category }: { category: string }) {
  const idx = CATEGORIES.indexOf(category);
  const tagCls = idx >= 0 ? CATEGORY_TAG_COLORS[idx] : 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${tagCls}`}>
      {CATEGORY_SHORT[category] ?? category}
    </span>
  );
}

// ─── Warnings ────────────────────────────────────────────────────────────────

function buildWarnings(examNumber: number, questions: Question[]): Warning[] {
  const staticIds = new Set(EXAM_ASSIGNMENTS[examNumber] ?? []);
  const warnings: Warning[] = [];

  if (questions.length < 40)
    warnings.push({ type: 'too_few', label: `Minder dan 40 vragen (${questions.length}/40)`, affectedIds: [] });
  if (questions.length > 40)
    warnings.push({ type: 'too_many', label: `Meer dan 40 vragen (${questions.length})`, affectedIds: questions.map(q => q.id) });

  const unvalidated = questions.filter(q => q.review_status !== 'validated');
  if (unvalidated.length > 0)
    warnings.push({ type: 'unvalidated', label: `${unvalidated.length} niet-gevalideerde ${unvalidated.length === 1 ? 'vraag' : 'vragen'}`, affectedIds: unvalidated.map(q => q.id) });

  const missingExpl = questions.filter(q => !q.explanation?.trim());
  if (missingExpl.length > 0)
    warnings.push({ type: 'missing_explanation', label: `${missingExpl.length} ${missingExpl.length === 1 ? 'vraag' : 'vragen'} zonder uitleg`, affectedIds: missingExpl.map(q => q.id) });

  const dbIds = new Set(questions.map(q => q.id));
  const inStaticNotDb = [...staticIds].filter(id => !dbIds.has(id));
  const inDbNotStatic = questions.filter(q => !staticIds.has(q.id));
  if (inStaticNotDb.length > 0 || inDbNotStatic.length > 0)
    warnings.push({ type: 'static_mismatch', label: `Statisch/DB verschil (${inStaticNotDb.length} ontbreekt, ${inDbNotStatic.length} extra)`, affectedIds: [...inStaticNotDb, ...inDbNotStatic.map(q => q.id)] });

  const catCounts: Record<string, number> = {};
  for (const q of questions) catCounts[q.category] = (catCounts[q.category] ?? 0) + 1;
  const dominant = Object.entries(catCounts).find(([, n]) => questions.length > 0 && n / questions.length > 0.5);
  if (dominant)
    warnings.push({ type: 'category_imbalance', label: `Onevenwicht: "${dominant[0]}" is ${Math.round(dominant[1] / questions.length * 100)}%`, affectedIds: questions.filter(q => q.category === dominant[0]).map(q => q.id) });

  return warnings;
}

function WarningIcon({ type }: { type: Warning['type'] }) {
  const map: Record<Warning['type'], [string, string]> = {
    too_few: ['error', 'text-destructive'],
    too_many: ['warning', 'text-amber-500'],
    unvalidated: ['pending_actions', 'text-amber-500'],
    missing_explanation: ['description', 'text-amber-500'],
    static_mismatch: ['sync_problem', 'text-amber-500'],
    category_imbalance: ['info', 'text-blue-500'],
  };
  const [icon, color] = map[type];
  return <span className={`material-symbols-outlined text-[16px] shrink-0 ${color}`}>{icon}</span>;
}

// ─── Stacked category bar ─────────────────────────────────────────────────────

function StackedBar({ counts, total, height = 'h-2.5' }: { counts: number[]; total: number; height?: string }) {
  if (total === 0) return <div className={`${height} rounded-full bg-muted w-full`} />;
  return (
    <div className={`flex ${height} rounded-full overflow-hidden w-full gap-px`}>
      {counts.map((count, i) => {
        if (count === 0) return null;
        return (
          <div
            key={CATEGORIES[i]}
            className={`${CATEGORY_COLORS[i]} flex items-center justify-center shrink-0`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${CATEGORIES[i]}: ${count}`}
          />
        );
      })}
    </div>
  );
}

// ─── Exam Card ────────────────────────────────────────────────────────────────

function ExamCard({ examNumber, questions, warnings, onClick }: {
  examNumber: number;
  questions: Question[];
  warnings: Warning[];
  onClick: () => void;
}) {
  const total = questions.length;
  const counts = CATEGORIES.map(cat => questions.filter(q => q.category === cat).length);
  const countColor = total === 40 ? 'bg-emerald-100 text-emerald-700' : total < 40 ? 'bg-red-100 text-destructive' : 'bg-amber-100 text-amber-700';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all border-border hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Examen</p>
            <p className="text-4xl font-headline font-bold text-on-surface leading-none mt-0.5">{examNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-0.5">
            <Badge className={`${countColor} border-0 font-semibold text-xs`}>{total}/40</Badge>
            {warnings.length > 0 && (
              <Badge className="bg-red-100 text-destructive border-0 font-semibold text-xs gap-1">
                <span className="material-symbols-outlined text-[11px]">error</span>
                {warnings.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Stacked bar */}
        <StackedBar counts={counts} total={total} height="h-2.5" />

        {/* Category counts grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          {CATEGORIES.map((cat, i) => {
            const count = counts[i];
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[i]}`} />
                <span className="text-[10px] text-muted-foreground truncate flex-1 leading-none">
                  {CATEGORY_SHORT[cat]}
                </span>
                <span className={`text-[11px] font-bold tabular-nums leading-none ${count === 0 ? 'text-muted-foreground/40' : CATEGORY_TEXT_COLORS[i]}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sheet: Overzicht tab ─────────────────────────────────────────────────────

function OverzichtTab({ questions, warnings, isPractice = false }: { questions: Question[]; warnings: Warning[]; isPractice?: boolean }) {
  const total = questions.length;
  const counts = CATEGORIES.map(cat => questions.filter(q => q.category === cat).length);
  const ideal = (isPractice ? Math.max(total, 1) : 40) / CATEGORIES.length;
  const validated = questions.filter(q => q.review_status === 'validated').length;
  const withImage = questions.filter(q => q.image_url).length;
  const withExpl = questions.filter(q => q.explanation?.trim()).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Vragen', value: total, warn: isPractice ? false : total !== 40 },
          { label: 'Gevalideerd', value: validated },
          { label: 'Afbeelding', value: withImage },
          { label: 'Met uitleg', value: withExpl },
        ].map(({ label, value, warn }) => (
          <div key={label} className="bg-muted/40 rounded-xl px-3 py-2.5 text-center">
            <p className={`text-xl font-bold font-headline leading-none ${warn ? 'text-destructive' : 'text-on-surface'}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Category mix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-on-surface">Categorieverdeling</p>
          <span className="text-xs text-muted-foreground">ideaal ≈ {Math.round(ideal)} per cat.</span>
        </div>
        <StackedBar counts={counts} total={total} height="h-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {CATEGORIES.map((cat, i) => {
            const count = counts[i];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const tooMany = count > Math.ceil(ideal) + 1;
            const tooFew = count < Math.floor(ideal) - 1;
            return (
              <div key={cat} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${CATEGORY_BG_LIGHT[i]}`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLORS[i]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-on-surface truncate leading-snug">{cat}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{pct}% van totaal</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-lg font-bold font-headline leading-none tabular-nums ${CATEGORY_TEXT_COLORS[i]}`}>
                    {count}
                  </span>
                  {(tooMany || tooFew) && (
                    <span className={`text-[9px] font-semibold leading-none ${tooMany ? 'text-amber-500' : 'text-muted-foreground/50'}`}>
                      {tooMany ? '▲ veel' : '▼ weinig'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-semibold text-on-surface mb-3">Waarschuwingen</p>
            <Accordion className="space-y-2">
              {warnings.map((w, i) => (
                <AccordionItem key={i} value={String(i)} className="border border-border rounded-lg px-3">
                  <AccordionTrigger className="text-sm py-2.5 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <WarningIcon type={w.type} />
                      <span>{w.label}</span>
                    </div>
                  </AccordionTrigger>
                  {w.affectedIds.length > 0 && (
                    <AccordionContent className="pb-3">
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {w.affectedIds.map(id => (
                          <Badge key={id} variant="outline" className="text-xs font-mono">#{id}</Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sheet: Vragen tab ────────────────────────────────────────────────────────

function VragenTab({ questions, onRemove, target }: {
  questions: Question[];
  onRemove: (id: number) => void;
  target: Target;
}) {
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<number | null>(null);
  const supabase = createClient();

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return questions;
    return questions.filter(q =>
      q.question.toLowerCase().includes(s) ||
      String(q.id).includes(s) ||
      q.category.toLowerCase().includes(s)
    );
  }, [search, questions]);

  async function handleRemove(id: number) {
    setRemoving(id);
    const patch = target === 'oefenen' ? { oefenen: false } : { exam: null };
    await supabase.from('questions').update(patch).eq('id', id);
    onRemove(id);
    setRemoving(null);
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Zoek in toegewezen vragen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-9 text-sm"
      />
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {questions.length === 0 ? 'Geen vragen toegewezen' : 'Geen resultaten'}
        </p>
      )}
      <div className="space-y-1">
        {filtered.map(q => {
          const isValidated = q.review_status === 'validated';
          return (
            <div key={q.id} className="flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 w-9 shrink-0">#{q.id}</span>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-sm text-on-surface line-clamp-2 leading-snug">{q.question}</span>
                <CategoryTag category={q.category} />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${isValidated ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  title={isValidated ? 'Gevalideerd' : 'In afwachting'}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-red-50"
                  onClick={() => handleRemove(q.id)}
                  disabled={removing === q.id}
                  title={target === 'oefenen' ? 'Verwijder uit oefenset' : 'Verwijder uit examen'}
                >
                  {removing === q.id
                    ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    : <span className="material-symbols-outlined text-[14px]">remove_circle_outline</span>
                  }
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sheet: Toevoegen tab ─────────────────────────────────────────────────────

function ToevoegenTab({ target, unassigned, onAdd }: {
  target: Target;
  unassigned: Question[];
  onAdd: (q: Question) => void;
}) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<number | null>(null);
  const supabase = createClient();

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return unassigned.slice(0, 25);
    return unassigned.filter(q =>
      q.question.toLowerCase().includes(s) ||
      String(q.id).includes(s) ||
      q.category.toLowerCase().includes(s)
    ).slice(0, 50);
  }, [search, unassigned]);

  async function handleAdd(q: Question) {
    setAdding(q.id);
    const patch = target === 'oefenen' ? { oefenen: true } : { exam: target };
    await supabase.from('questions').update(patch).eq('id', q.id);
    onAdd(q);
    setAdding(null);
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Zoek op tekst, ID of categorie…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-9 text-sm"
        autoFocus
      />
      {unassigned.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Alle vragen zijn al toegewezen</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Geen vragen gevonden</p>
      ) : (
        <>
          <div className="space-y-1">
            {filtered.map(q => {
              return (
                <div key={q.id} className="flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="font-mono text-xs text-muted-foreground mt-0.5 w-9 shrink-0">#{q.id}</span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-sm text-on-surface line-clamp-2 leading-snug">{q.question}</span>
                    <CategoryTag category={q.category} />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleAdd(q)}
                    disabled={adding === q.id}
                    title={target === 'oefenen' ? 'Toevoegen aan oefenset' : 'Toevoegen aan examen'}
                  >
                    {adding === q.id
                      ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-[14px]">add_circle_outline</span>
                    }
                  </Button>
                </div>
              );
            })}
          </div>
          {!search && unassigned.length > 25 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              Zoek om meer te zien — {unassigned.length} niet-toegewezen vragen beschikbaar
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Exam Sheet ───────────────────────────────────────────────────────────────

function ExamSheet({ target, questions, allQuestions, warnings, open, onClose, onAdd, onRemove }: {
  target: Target;
  questions: Question[];
  allQuestions: Question[];
  warnings: Warning[];
  open: boolean;
  onClose: () => void;
  onAdd: (q: Question) => void;
  onRemove: (id: number) => void;
}) {
  const isPractice = target === 'oefenen';
  const unassigned = useMemo(
    () => allQuestions.filter(q => (isPractice ? !q.oefenen : q.exam === null)),
    [allQuestions, isPractice],
  );

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[620px] sm:max-w-[620px] p-0 flex flex-col" side="right">
        {/* Fixed header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-headline font-bold">
              {isPractice ? 'Gratis oefenen' : `Examen ${target}`}
            </SheetTitle>
            {warnings.length > 0 && (
              <Badge className="bg-red-100 text-destructive border-0 gap-1">
                <span className="material-symbols-outlined text-[12px]">error</span>
                {warnings.length} {warnings.length === 1 ? 'melding' : 'meldingen'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="overzicht" className="flex flex-col flex-1 min-h-0 gap-0">
          <TabsList variant="line" className="w-full rounded-none border-b border-border h-10 px-4 justify-start shrink-0 gap-0">
            <TabsTrigger value="overzicht" className="px-3 h-8 rounded-md text-sm data-active:bg-muted data-active:text-on-surface">
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="vragen" className="px-3 h-8 rounded-md text-sm data-active:bg-muted data-active:text-on-surface">
              Vragen ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="toevoegen" className="px-3 h-8 rounded-md text-sm data-active:bg-muted data-active:text-on-surface">
              + Toevoegen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overzicht" className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-5">
              <OverzichtTab questions={questions} warnings={warnings} isPractice={isPractice} />
            </div>
          </TabsContent>

          <TabsContent value="vragen" className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-5">
              <VragenTab questions={questions} onRemove={onRemove} target={target} />
            </div>
          </TabsContent>

          <TabsContent value="toevoegen" className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-5">
              <ToevoegenTab target={target} unassigned={unassigned} onAdd={onAdd} />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Practice (Gratis oefenen) Card ───────────────────────────────────────────

function PracticeCard({ questions, onClick }: { questions: Question[]; onClick: () => void }) {
  const total = questions.length;
  const counts = CATEGORIES.map(cat => questions.filter(q => q.category === cat).length);
  const validated = questions.filter(q => q.review_status === 'validated').length;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all border-primary/30 bg-primary/[0.03] group"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-72 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">bolt</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Gratis oefenflow</p>
            <p className="text-base font-headline font-bold text-on-surface leading-tight">Gratis oefenen</p>
            <p className="text-xs text-muted-foreground truncate">
              /oefenen · {total} {total === 1 ? 'vraag' : 'vragen'} · {validated} gevalideerd
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen vragen toegewezen — klik om vragen te kiezen.</p>
          ) : (
            <>
              <StackedBar counts={counts} total={total} height="h-2.5" />
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {CATEGORIES.map((cat, i) => counts[i] > 0 && (
                  <span key={cat} className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[i]}`} />
                    <span className="text-muted-foreground">{CATEGORY_SHORT[cat]}</span>
                    <span className={`font-bold tabular-nums ${CATEGORY_TEXT_COLORS[i]}`}>{counts[i]}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <Badge className="bg-primary/10 text-primary border-0 font-semibold text-xs shrink-0 gap-1 self-start sm:self-center">
          <span className="material-symbols-outlined text-[13px]">tune</span>
          Beheer
        </Badge>
      </CardContent>
    </Card>
  );
}

// ─── Grid root ────────────────────────────────────────────────────────────────

export default function ExamsGrid({ questions: initialQuestions }: { questions: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

  const pathname = usePathname();
  const questionsBase = pathname.replace(/\/exams$/, '/questions');

  const examDataList = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      const examQuestions = questions.filter(q => q.exam === n);
      return { examNumber: n, questions: examQuestions, warnings: buildWarnings(n, examQuestions) };
    });
  }, [questions]);

  const practiceQuestions = useMemo(() => questions.filter(q => q.oefenen), [questions]);

  const selectedData = selectedTarget === null
    ? null
    : selectedTarget === 'oefenen'
      ? { target: 'oefenen' as Target, questions: practiceQuestions, warnings: [] as Warning[] }
      : { target: selectedTarget as Target, questions: examDataList[selectedTarget - 1].questions, warnings: examDataList[selectedTarget - 1].warnings };

  const totalWarnings = examDataList.reduce((sum, d) => sum + d.warnings.length, 0);

  const handleAdd = useCallback((target: Target, q: Question) => {
    setQuestions(prev => prev.map(pq => pq.id === q.id
      ? (target === 'oefenen' ? { ...pq, oefenen: true } : { ...pq, exam: target })
      : pq));
  }, []);

  const handleRemove = useCallback((target: Target, id: number) => {
    setQuestions(prev => prev.map(pq => pq.id === id
      ? (target === 'oefenen' ? { ...pq, oefenen: false } : { ...pq, exam: null })
      : pq));
  }, []);

  const CATEGORY_SHORT_LIST = CATEGORIES.map((cat, i) => ({ cat, short: CATEGORY_SHORT[cat], color: CATEGORY_COLORS[i] }));

  return (
    <>
      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-border">
        {[
          { label: 'Examen-vragen', value: questions.filter(q => q.exam !== null).length, href: `${questionsBase}?exam=assigned` },
          { label: 'Gevalideerd', value: questions.filter(q => q.exam !== null && q.review_status === 'validated').length, href: `${questionsBase}?exam=assigned&status=validated` },
          { label: 'Niet-toegewezen', value: questions.filter(q => q.exam === null).length, href: `${questionsBase}?exam=unassigned` },
          { label: 'Waarschuwingen', value: totalWarnings, warn: totalWarnings > 0, href: `${questionsBase}?status=pending` },
        ].map(({ label, value, warn, href }) => (
          <a
            key={label}
            href={href}
            className="flex flex-col px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
          >
            <p className={`text-2xl font-bold font-headline group-hover:underline underline-offset-2 ${warn ? 'text-destructive' : 'text-on-surface'}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </a>
        ))}
        <div className="ml-auto flex flex-wrap justify-end gap-x-4 gap-y-1">
          {CATEGORY_SHORT_LIST.map(({ cat, short, color }) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {short}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {examDataList.map(({ examNumber, questions: eq, warnings }) => (
          <ExamCard
            key={examNumber}
            examNumber={examNumber}
            questions={eq}
            warnings={warnings}
            onClick={() => setSelectedTarget(examNumber)}
          />
        ))}
      </div>

      {/* Gratis oefenflow */}
      <div className="mt-4">
        <PracticeCard questions={practiceQuestions} onClick={() => setSelectedTarget('oefenen')} />
      </div>

      {selectedData && (
        <ExamSheet
          target={selectedData.target}
          questions={selectedData.questions}
          allQuestions={questions}
          warnings={selectedData.warnings}
          open={selectedTarget !== null}
          onClose={() => setSelectedTarget(null)}
          onAdd={q => handleAdd(selectedData.target, q)}
          onRemove={id => handleRemove(selectedData.target, id)}
        />
      )}
    </>
  );
}
