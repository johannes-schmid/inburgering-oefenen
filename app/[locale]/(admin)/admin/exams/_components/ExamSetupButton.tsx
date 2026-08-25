'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { Level, OnderdeelSlug, SkillSlug } from '@/data/skills';
import type { ExamSetup } from '@/lib/admin/exam-setup';
import ExamSetupSheet from './ExamSetupSheet';

/**
 * "Opzet" beside an onderdeel's heading on the Examens overview.
 *
 * This is the sheet's only entry point. It used to live inside one exam's builder, which put a
 * (level, skill)-wide edit behind a button labelled with a single exam — the docent's mental
 * model there is "examen 3", and everything she changed applied to all ten. Here the ten cards
 * it governs are on screen underneath it, so the scope is the page rather than a warning banner
 * (the banner stays anyway; two of the panels write rows she cannot see).
 *
 * A client island only because the sheet needs open state — the page around it stays a server
 * component and the setup is fetched there.
 */
export default function ExamSetupButton({
  level,
  skill,
  setup,
}: {
  /**
   * `null` for KNM — see the catalogue axis in data/skills.ts. The button renders **nothing**
   * in that case, deliberately.
   *
   * Every panel inside the sheet saves with `.eq('level', level)`, and `.eq('level', null)`
   * matches no rows in PostgREST while still returning 200 — so a KNM "Opslaan" would report
   * success and change nothing, which is the exact failure this repo has already been bitten
   * by twice (the RLS-denied UPDATE, and `fetchExamsForSkill`). KNM's format is set by
   * `20260824120000_knm_onderdeel.sql`; making the sheet level-nullable is its own change.
   */
  level: Level | null;
  skill: OnderdeelSlug;
  setup: ExamSetup;
}) {
  const [open, setOpen] = useState(false);

  if (level === null) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Opzet van ${skill} bewerken`}
        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-surface-container-high"
      >
        <Settings2 size={13} aria-hidden /> Opzet
      </button>
      <ExamSetupSheet
        open={open}
        level={level}
        skill={skill as SkillSlug}
        setup={setup}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
