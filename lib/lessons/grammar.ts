/**
 * Stap 2 van de leerroute — de grammatica uit `data/grammar-syllabus.ts` — de vormen en de
 * pure functies erover.
 *
 * Sinds oktober 2026 (eigenaar) is stap 2 geen indeling op `concept_groups` meer maar een
 * genummerde lijst onderwerpen per cursus. Een onderwerp wijst naar één of meer bestaande
 * lessen (`LessonRef`); dit bestand rekent uit hoe ver je per onderwerp bent. De query staat in
 * `grammar-server.ts`. Client-veilig: geen import uit `lib/supabase/*`.
 *
 * ── EEN ONDERWERP IS AF ALS AL ZIJN LESSEN AF ZIJN ───────────────────────────
 * En een les die nog niet bestaat is níét af. Een onderwerp dat naar een les wijst die de
 * docent nog schrijft, staat dus open, ook als de andere helft gedaan is: anders zegt het
 * vinkje "klaar" over iets wat nog niet bestaat.
 */

import type { Level, SkillSlug } from '@/data/skills';
import type { GrammarTopic, LessonRef } from '@/data/grammar-syllabus';
import type { ReviewStatus } from './lessons';

/** Eén les waar een onderwerp naar wijst, zoals hij in de database staat — of niet. */
export type TopicLesson = {
  ref: LessonRef;
  /** `null`: de les bestaat nog niet. Die wordt geschreven; de pagina zegt dat. */
  id: number | null;
  slug: string;
  title: string | null;
  review_status: ReviewStatus | null;
  is_free: boolean;
  done: boolean;
};

export type GrammarTopicState = {
  n: number;
  title: string;
  lessons: TopicLesson[];
  done: boolean;
  /** Geschreven lessen / alle lessen waar het onderwerp naar wijst. */
  written: number;
};

export type GrammarExtras = {
  title: string;
  lessons: TopicLesson[];
};

export type GrammarStep = {
  topics: GrammarTopicState[];
  extras: GrammarExtras | null;
  done: number;
  total: number;
  pct: number;
};

/** Bestaat de les en heeft deze kandidaat hem afgerond? */
export function topicDone(lessons: TopicLesson[]): boolean {
  return lessons.length > 0 && lessons.every(l => l.id !== null && l.done);
}

export function buildGrammarStep(
  topics: GrammarTopic[],
  extras: { title: string; lessons: LessonRef[] } | null | undefined,
  resolve: (ref: LessonRef) => TopicLesson,
): GrammarStep {
  const states = topics.map(t => {
    const lessons = t.lessons.map(resolve);
    return {
      n: t.n,
      title: t.title,
      lessons,
      done: topicDone(lessons),
      written: lessons.filter(l => l.id !== null).length,
    };
  });
  const done = states.filter(s => s.done).length;
  const total = states.length;
  return {
    topics: states,
    extras: extras ? { title: extras.title, lessons: extras.lessons.map(resolve) } : null,
    done,
    total,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

/** Het onderwerp waar je verdergaat: het eerste dat nog niet af is, en anders het eerste. */
export function nextTopic(step: GrammarStep): GrammarTopicState | null {
  return step.topics.find(t => !t.done) ?? step.topics[0] ?? null;
}

/** Het onderwerp waar deze les in staat — het eerste, als hij in meer onderwerpen staat. */
export function topicOfLesson(step: GrammarStep, lessonId: number): GrammarTopicState | null {
  return step.topics.find(t => t.lessons.some(l => l.id === lessonId)) ?? null;
}

/**
 * Het label van een onderwerp: "B3 · Vragen bij een brief".
 *
 * `B` omdat stap 2 in de cursus blok B is, en het nummer is het rijnummer uit de opzet — niet
 * een index, want dan zou een weggelaten rij alle nummers erna verschuiven.
 */
export function topicCode(n: number): string {
  return `B${n}`;
}

/** Topic 1 van elke cursus is gratis met een account — dezelfde rol als `is_free` op les 1. */
export function isFreeTopic(n: number): boolean {
  return n === 1;
}

export function grammarStepPath(level: Level, onderdeel: SkillSlug): string {
  return `/dashboard/${level}/${onderdeel}/grammatica`;
}

export function topicPath(level: Level, onderdeel: SkillSlug, n: number): string {
  return `${grammarStepPath(level, onderdeel)}/${n}`;
}

// ---------------------------------------------------------------------------
// De cursus als vijf rijen — de zijkaart van het onderwerpscherm
// ---------------------------------------------------------------------------

export type OutlineBlock = {
  letter: string;
  /** `null` voor blok B: die heet in elke cursus hetzelfde, en de aanroeper vertaalt hem. */
  name: string | null;
  done: number;
  total: number;
  complete: boolean;
};

export type CourseOutline = {
  blocks: OutlineBlock[];
  done: number;
  total: number;
  pct: number;
  /** Het eerste blok dat nog niet af is — "blok C loopt" — of `null` als alles af is. */
  current: string | null;
};

/**
 * De cursus in vijf rijen, met blok B uit de grammaticastap in plaats van uit de database.
 *
 * Blok B telt **onderwerpen**, niet lessen: dat is wat de kandidaat in stap 2 ziet, en de
 * lessen achter een onderwerp kunnen in een ander blok staan (het regelhuis). Het eigen blok B
 * van de cursus telt dus niet nog eens mee — die lessen zitten in de onderwerpen of in de
 * extra reeks. "30 van 62 lessen" is daarmee lessen van A, C, D en E plus onderwerpen van B.
 */
export function courseOutline(
  blocks: { letter: string; name_nl: string; lessons: { progress: { state: string } | null }[] }[],
  step: GrammarStep,
): CourseOutline {
  const rows: OutlineBlock[] = [];
  const letters = [...new Set([...blocks.map(b => b.letter), 'B'])].sort();
  for (const letter of letters) {
    if (letter === 'B') {
      rows.push({ letter, name: null, done: step.done, total: step.total, complete: step.total > 0 && step.done === step.total });
      continue;
    }
    const b = blocks.find(x => x.letter === letter);
    if (!b || b.lessons.length === 0) continue;
    const done = b.lessons.filter(l => l.progress?.state === 'done').length;
    rows.push({ letter, name: b.name_nl, done, total: b.lessons.length, complete: done === b.lessons.length });
  }
  const done = rows.reduce((n, r) => n + r.done, 0);
  const total = rows.reduce((n, r) => n + r.total, 0);
  return {
    blocks: rows,
    done,
    total,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
    current: rows.find(r => !r.complete && r.total > 0)?.letter ?? null,
  };
}
