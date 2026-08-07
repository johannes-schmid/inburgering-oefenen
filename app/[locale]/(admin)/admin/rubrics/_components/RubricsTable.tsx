'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Plus } from 'lucide-react';
import { categoriesForSkill, categoryLabel, type RubricSkill } from '@/lib/rubrics';
import { levelLabel, type Level } from '@/data/skills';

export type RubricRow = {
  id: number;
  level: Level;
  skill: RubricSkill;
  task_type: string;
  version: number;
  active: boolean;
  created_at: string | null;
  criterion_count: number;
  has_prompt: boolean;
  used_count: number;
};

const SKILLS: RubricSkill[] = ['schrijven', 'spreken'];

/**
 * Grouped by category rather than listed flat, because the question the docent actually has is
 * "which categories do I still have no live rubric for?" — and a flat list of versions buries it.
 * A category with no active rubric is called out: every open task in it will fail to grade.
 */
export default function RubricsTable({
  rows,
  locale,
  level,
}: {
  rows: RubricRow[];
  locale: string;
  /** From `?niveau=`, set by the sidebar sub-menu. It scopes the coverage warning too. */
  level: Level;
}) {
  const [skill, setSkill] = useState<RubricSkill | 'all'>('all');

  const groups = useMemo(() => {
    return SKILLS.filter(s => skill === 'all' || s === skill).map(s => ({
      skill: s,
      categories: categoriesForSkill(s).map(category => ({
        category,
        versions: rows
          .filter(r => r.level === level && r.skill === s && r.task_type === category)
          .sort((a, b) => b.version - a.version),
      })),
    }));
  }, [rows, skill, level]);

  /**
   * Uncovered categories in the level being viewed.
   *
   * Counted per level, because coverage is per level: an active A2 `email` rubric says nothing
   * about whether B1 `email` can be graded. Counting across both would report full coverage
   * while every B1 Schrijven task silently fails to grade.
   */
  const missing = useMemo(
    () =>
      SKILLS.flatMap(s =>
        categoriesForSkill(s).filter(
          c => !rows.some(r => r.level === level && r.skill === s && r.task_type === c && r.active)
        )
      ).length,
    [rows, level]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.08em] text-secondary">
            Niveau {levelLabel(level)}
          </p>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Rubrieken
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            De beoordelingscriteria per soort opdracht. Het model past deze criteria toe; jij
            bepaalt wat ze zijn en controleert elke beoordeling.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/rubrics/new`}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors"
        >
          <Plus size={16} aria-hidden />
          Nieuwe rubriek
        </Link>
      </header>

      {missing > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-4">
          <AlertTriangle size={18} className="text-secondary shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-on-surface leading-relaxed">
            <strong className="font-semibold">
              {missing} {missing === 1 ? 'categorie heeft' : 'categorieën hebben'} op{' '}
              {levelLabel(level)} nog geen actieve rubriek.
            </strong>{' '}
            Opdrachten in die categorieën kunnen niet beoordeeld worden — de kandidaat levert in en
            krijgt geen feedback.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...SKILLS] as const).map(s => (
          <button
            key={s}
            onClick={() => setSkill(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              skill === s
                ? 'bg-primary text-white'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {s === 'all' ? 'Alle' : s === 'schrijven' ? 'Schrijven' : 'Spreken'}
          </button>
        ))}
      </div>

      {groups.map(g => (
        <section key={g.skill} className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-outline">
            {g.skill === 'schrijven' ? 'Schrijven' : 'Spreken'}
          </h2>

          <div className="space-y-2">
            {g.categories.map(({ category, versions }) => {
              const active = versions.find(v => v.active);
              return (
                <div
                  key={category}
                  className="rounded-xl border border-outline-variant bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-headline text-[0.95rem] font-bold text-on-surface">
                        {categoryLabel(category)}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {active ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-primary font-semibold">
                              <Check size={12} strokeWidth={3} aria-hidden /> v{active.version} actief
                            </span>
                            {' · '}
                            {active.criterion_count} criteria
                            {active.used_count > 0 &&
                              ` · ${active.used_count} beoordelingen gebruikt`}
                            {!active.has_prompt && ' · geen eigen instructie'}
                          </>
                        ) : versions.length > 0 ? (
                          <span className="text-secondary font-semibold">
                            {versions.length} versie{versions.length === 1 ? '' : 's'}, geen actief
                          </span>
                        ) : (
                          <span className="text-secondary font-semibold">Nog geen rubriek</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {versions.map(v => (
                        <Link
                          key={v.id}
                          href={`/${locale}/admin/rubrics/${v.id}/edit`}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums transition-colors ${
                            v.active
                              ? 'bg-primary text-white'
                              : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                          title={
                            v.used_count > 0
                              ? `v${v.version} — ${v.used_count} beoordelingen; bewerken maakt een nieuwe versie`
                              : `v${v.version} — nog niet gebruikt; bewerken past deze versie aan`
                          }
                        >
                          v{v.version}
                        </Link>
                      ))}
                      {/* Labelled when there is nothing yet: eight rows whose only affordance is a
                          bare "+" gives the docent no idea that this is where a rubric is made. */}
                      <Link
                        href={`/${locale}/admin/rubrics/new?skill=${g.skill}&category=${category}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
                          versions.length === 0
                            ? 'px-3 py-1.5 bg-primary text-white hover:bg-primary-container'
                            : 'px-2.5 py-1 border border-dashed border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                        title={
                          versions.length === 0
                            ? `Rubriek maken voor ${categoryLabel(category)}`
                            : 'Nieuwe versie voor deze categorie'
                        }
                      >
                        <Plus size={12} strokeWidth={3} aria-hidden />
                        {versions.length === 0 && 'Rubriek maken'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
