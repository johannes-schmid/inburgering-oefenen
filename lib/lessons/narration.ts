/**
 * De ingesproken uitleg van een les — de vorm, en de query.
 *
 * Klein genoeg voor één bestand: één tabel, één rij per les. De `review_status` gaat mee naar
 * de client, want de speler móet kunnen zeggen dat een script nog niet is nagekeken — een
 * ingesproken uitleg die klinkt alsof de docent hem heeft goedgekeurd terwijl dat niet zo is,
 * is precies de belofte die dit product verkoopt.
 */

import { createClient } from '@/lib/supabase/server';
import type { ReviewStatus } from './lessons';

/** Eén markering: welk element, op welke seconde, met welke extra uitleg. */
export type NarrationCue = { id: string; at: number; note?: string };

/** Eén woord van het script: de tekst, zijn starttijd, en de alinea waarin het staat. */
export type NarrationWord = { w: string; t: number; p: number };

export type LessonNarration = {
  script: string;
  audioUrl: string;
  durationSeconds: number | null;
  cues: NarrationCue[];
  /** De woorden met hun tijd — het meelezen. Leeg = deze opname is nog zonder alignment. */
  words: NarrationWord[];
  reviewStatus: ReviewStatus;
};

/**
 * De cues uit jsonb, streng gefilterd.
 *
 * De kolom is jsonb met alleen een array-CHECK erop, dus de vorm van elk element is hier de
 * grens tussen database en type. Een cue zonder bruikbaar `id` of `at` wordt weggelaten en niet
 * gerepareerd: een markering op seconde NaN laat de speler stil het verkeerde element oplichten,
 * en dat is erger dan een element dat niet oplicht.
 */
function toCues(raw: unknown): NarrationCue[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .flatMap(x => {
      if (typeof x !== 'object' || x === null) return [];
      const { id, at, note } = x as { id?: unknown; at?: unknown; note?: unknown };
      if (typeof id !== 'string' || id === '') return [];
      const time = Number(at);
      if (!Number.isFinite(time) || time < 0) return [];
      return [{ id, at: time, ...(typeof note === 'string' && note ? { note } : {}) }];
    })
    .sort((a, b) => a.at - b.at);
}

/**
 * De woorden uit jsonb, met dezelfde strengheid als `toCues`.
 *
 * Eén onbruikbaar woord laat de rest staan in plaats van het meelezen om te leggen: een gaatje
 * in de markering is een gaatje, een leeg paneel is een verdwenen feature. Alleen de alinea mag
 * stil terugvallen op 0 — een woord zonder `p` hoort ergens, en de eerste alinea is de enige
 * plek waar hij geen andere alinea in de war schopt.
 */
function toWords(raw: unknown): NarrationWord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(x => {
    if (typeof x !== 'object' || x === null) return [];
    const { w, t, p } = x as { w?: unknown; t?: unknown; p?: unknown };
    if (typeof w !== 'string' || w === '') return [];
    const time = Number(t);
    if (!Number.isFinite(time) || time < 0) return [];
    const para = Number(p);
    return [{ w, t: time, p: Number.isFinite(para) && para >= 0 ? Math.floor(para) : 0 }];
  });
}

/** `null` als deze les geen narratie heeft, of als de audio nog niet gegenereerd is. */
export async function fetchNarration(lessonId: number): Promise<LessonNarration | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_narration')
      .select('script, audio_url, duration_seconds, cues, word_times, review_status')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    // Een rij zonder `audio_url` is een script dat nog niet is ingesproken. Dat is geen speler:
    // een spelerkaart met een knop die niets doet is erger dan geen kaart.
    if (!data?.audio_url) return null;

    return {
      script: data.script as string,
      audioUrl: data.audio_url as string,
      durationSeconds: data.duration_seconds != null ? Number(data.duration_seconds) : null,
      cues: toCues(data.cues),
      words: toWords(data.word_times),
      reviewStatus: data.review_status === 'validated' ? 'validated' : 'pending',
    };
  } catch {
    return null;
  }
}

/**
 * Per cue-id hoe dat deel van de les héét, voor de "nu:"-regel op de speler.
 *
 * De markering op de pagina laat zien *dat* er iets oplicht. Kijk je naar de speler en niet
 * naar de pagina — wat gebeurt zodra je met een telefoon in je hand meeluistert — dan weet je
 * niet wát. Eén regel tekst op de kaart is dat verschil, en de namen kunnen alleen hier
 * gemaakt worden: de kaartlabels staan in de lesitems en de stapnamen in het lesplaatje.
 *
 * Onbekende id's komen er niet in. Een cue die naar een element wijst dat niet bestaat licht
 * niets op, en dan hoort de kaart ook geen naam te verzinnen.
 */
export function narrationCueNames({
  cards, demoCount, visualSteps, labels,
}: {
  /** De labels van de vormkaarten, in dezelfde volgorde als `card-0`, `card-1`, … */
  cards: string[];
  demoCount: number;
  /** Hoeveel stappen het lesplaatje heeft, of 0 als deze les er geen heeft. */
  visualSteps: number;
  labels: { rule: string; demo: string; visual: string; visualStep: string; exercises: string };
}): Record<string, string> {
  const names: Record<string, string> = {
    rule: labels.rule,
    exercises: labels.exercises,
  };
  cards.forEach((label, i) => { names[`card-${i}`] = label; });
  for (let i = 0; i < demoCount; i += 1) {
    names[`demo-${i}`] = labels.demo.replace('{n}', String(i + 1));
  }
  if (visualSteps > 0) {
    names.vis = labels.visual;
    for (let i = 1; i <= visualSteps; i += 1) {
      names[`vis-${i}`] = labels.visualStep.replace('{n}', String(i));
    }
  }
  return names;
}
