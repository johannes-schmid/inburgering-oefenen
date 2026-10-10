/**
 * Stap 2 van de leerroute — de query.
 *
 * Zoekt de lessen op waar de onderwerpen van één cursus naar wijzen (`data/grammar-syllabus.ts`)
 * en hangt de voortgang van deze kandidaat eraan. Eén query voor de lessen, één voor de
 * voortgang, ongeacht hoeveel onderwerpen er zijn.
 *
 * ── OOK `pending`, EN OOK WAT ER NOG NIET IS ─────────────────────────────────
 * `fetchCourse` laat een `pending` les weg uit elk blok; deze functie niet. Een onderwerp
 * wijst met naam naar een les, en die les wordt op het onderwerpscherm geopend — met dezelfde
 * banner als de lespagina zelf. Een les die nog helemaal niet bestaat komt terug met
 * `id: null`, en het onderwerpscherm zegt dan "deze les wordt nog geschreven". Nooit een 404:
 * de syllabus is ouder dan een deel van de lessen waar hij naar wijst.
 */

import { createClient } from '@/lib/supabase/server';
import type { Level, SkillSlug } from '@/data/skills';
import {
  GRAMMAR_EXTRAS, grammarTopics, parseLessonRef, type LessonRef,
} from '@/data/grammar-syllabus';
import { fetchLessonProgress } from './lessons-server';
import type { ReviewStatus } from './lessons';
import { buildGrammarStep, type GrammarStep, type TopicLesson } from './grammar';

/** Alleen de blokletter van een les die meedoet: blok B, in welk onderdeel dan ook. */
const GRAMMAR_LETTER = 'B';

export function grammarRefs(level: Level, onderdeel: SkillSlug): LessonRef[] {
  const extras = GRAMMAR_EXTRAS[`${level}:${onderdeel}`];
  return [
    ...new Set([
      ...grammarTopics(level, onderdeel).flatMap(t => t.lessons),
      ...(extras?.lessons ?? []),
    ]),
  ];
}

type Row = {
  id: number;
  slug: string;
  title: string;
  is_free: boolean;
  review_status: ReviewStatus;
  lesson_blocks: { level: Level | null; onderdeel: SkillSlug; letter: string };
};

export async function fetchGrammarStep(
  level: Level,
  onderdeel: SkillSlug,
  userId: string | null,
): Promise<GrammarStep> {
  const refs = grammarRefs(level, onderdeel);
  const byRef = new Map<string, Row>();

  try {
    const supabase = await createClient();
    const slugs = [...new Set(refs.map(r => parseLessonRef(r).slug))];
    const { data } = await supabase
      .from('lessons')
      .select('id, slug, title, is_free, review_status, lesson_blocks!inner(level, onderdeel, letter)')
      .in('slug', slugs)
      .eq('lesson_blocks.letter', GRAMMAR_LETTER);

    /* Op (niveau, onderdeel, slug) en niet op slug alleen: een slug is per blok uniek, en
       `b1-ontkenning` kan in A2 en in B1 tegelijk bestaan. */
    for (const r of (data ?? []) as unknown as Row[]) {
      byRef.set(`${r.lesson_blocks.level}:${r.lesson_blocks.onderdeel}:${r.slug}`, r);
    }
  } catch {
    // Geen lessen te lezen is hetzelfde als "nog niet geschreven" — geen 500 op het cursusscherm.
  }

  const ids = [...byRef.values()].map(r => r.id);
  const progress = userId && ids.length ? await fetchLessonProgress(userId, ids) : new Map();

  const resolve = (ref: LessonRef): TopicLesson => {
    const row = byRef.get(ref);
    const { slug } = parseLessonRef(ref);
    if (!row) {
      return { ref, id: null, slug, title: null, review_status: null, is_free: false, done: false };
    }
    return {
      ref,
      id: row.id,
      slug,
      title: row.title,
      review_status: row.review_status,
      is_free: row.is_free,
      done: progress.get(row.id)?.state === 'done',
    };
  };

  return buildGrammarStep(grammarTopics(level, onderdeel), GRAMMAR_EXTRAS[`${level}:${onderdeel}`], resolve);
}
