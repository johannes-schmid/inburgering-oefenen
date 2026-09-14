/**
 * De zwaktekaart, als pure rekenkern.
 *
 * ── WAAROM DIT LOS STAAT VAN DE QUERY ────────────────────────────────────────
 * `lib/vaardigheden-server.ts` haalt de rijen op, dit bestand maakt er balken van. De splitsing
 * bestaat om dezelfde reden als bij `readiness.ts` en `learning-queues.ts`: het rekenwerk hier is
 * waar een fout een verkéérd cijfer oplevert in plaats van een leeg scherm, en dat wil je in een
 * unittest kunnen vastzetten zonder database.
 *
 * ── ÉÉN RIJVORM VOOR TWEE BRONNEN ────────────────────────────────────────────
 * Lezen en Luisteren meten met goed/fout per vraag, Schrijven en Spreken met 0–3 per criterium.
 * Dat zijn twee schalen, en ze mogen niet in één getal worden gegoten — 2.1 / 3 is geen 70%, want
 * de anker­beschrijvingen van de rubriek zijn geen percentages. Dus draagt `WeaknessRow` allebei:
 * `pct` vult de balk (dat is puur breedte) en `detail` zegt in woorden waar het getal vandaan komt.
 * De kaart toont daarom "11 van 18 goed · over 4 examens" óf "2.1 / 3 · over 3 sessies", nooit een
 * percentage dat een rubriekscore nadoet.
 */

import { MAX_CRITERION_SCORE } from './rubrics';

/**
 * Onder deze grens toont een rij geen balk maar "nog te weinig gegevens".
 *
 * Drie beantwoorde vragen die toevallig alle drie fout gingen is geen zwakte, het is ruis, en een
 * balk op 0% leest als een oordeel. Zelfde gedachte als `MIN_ATTEMPTED` in `exam-readiness.ts` en
 * als NULL = ongeverifieerd in het schema: liever niets zeggen dan iets verzinnen.
 */
export const MIN_ANSWERS = 6;

export type WeaknessConcept = {
  slug: string;
  name: string;
  /** Hoe vaak dit concept aan een fout antwoord hing. */
  misses: number;
  /** De les die het repareert, of null als die er (nog) niet is. */
  href: string | null;
  lessonTitle: string | null;
};

export type WeaknessRow = {
  key: string;
  label: string;
  /** Eén zin die zegt wat de vaardigheid is; bij een rubriekcriterium is er geen. */
  one_liner: string | null;
  /** 0–100 voor de balkbreedte, of null bij te weinig gegevens. */
  pct: number | null;
  /** Hoeveel antwoorden of beoordelingen erachter zitten. */
  n: number;
  /** De regel onder de balk: waar dit getal vandaan komt, in woorden. */
  detail: string;
  /** Alleen bij een rubriek: de laatste score en het verschil met de eerste sessie. */
  score: number | null;
  delta: number | null;
  /** De concepten die de missers verklaren, zwaarste eerst. Leeg bij een rubriekcriterium. */
  concepts: WeaknessConcept[];
};

/** Eén antwoord uit `user_question_results`, al teruggebracht tot wat hier telt. */
export type TaggedAnswer = {
  questionId: number;
  wasCorrect: boolean;
  answeredAt: string;
  /** De concept-slugs die aan die vraag hangen. Nul is toegestaan en betekent: telt nergens mee. */
  conceptSlugs: string[];
};

/**
 * De laatste stand per vraag, niet elke poging.
 *
 * `user_question_results` is append-only, dus een vraag die je de derde keer goed doet staat er
 * drie keer in. Alle drie meetellen zou een kandidaat straffen voor het feit dát hij geoefend
 * heeft — precies het tegenovergestelde van wat deze kaart moet aanmoedigen. `learning-queues.ts`
 * doet dezelfde replay; die staat daar inline en wordt hier bewust niet uit gehaald, want die
 * module heeft nog drie andere rollups aan dezelfde lus hangen.
 *
 * Verwacht chronologisch oplopende invoer — de query sorteert erop.
 */
export function latestPerQuestion(answers: TaggedAnswer[]): Map<number, TaggedAnswer> {
  const out = new Map<number, TaggedAnswer>();
  for (const a of answers) out.set(a.questionId, a);
  return out;
}

export type VaardigheidInput = {
  slug: string;
  name_nl: string;
  one_liner: string;
  concepts: string[];
};

/**
 * Van getagde antwoorden naar balken, zwakste eerst.
 *
 * Een vraag telt mee in elke vaardigheid die hij raakt — een vraag met twee concepten uit twee
 * vaardigheden is ook echt bewijs voor allebei. Binnen één vaardigheid telt hij hoogstens één
 * keer, anders zou een zwaar getagde vraag zijn eigen balk domineren.
 *
 * Een vraag zonder tags telt nergens: niet als fout en niet als goed. Dat is de eerlijke uitkomst
 * van een examen dat de docent nog niet heeft gekoppeld, en het alternatief — hem bij "overig"
 * zetten — zou een balk opleveren die niets meet.
 */
export function rollupVaardigheden(
  vaardigheden: VaardigheidInput[],
  answers: TaggedAnswer[],
  conceptNames: Map<string, string>,
  lessons: Map<string, { href: string; title: string | null }>,
  examCount: number,
): WeaknessRow[] {
  const latest = [...latestPerQuestion(answers).values()];

  const rows = vaardigheden.map(v => {
    const mine = new Set(v.concepts);
    let seen = 0;
    let correct = 0;
    const misses = new Map<string, number>();

    for (const a of latest) {
      const hits = a.conceptSlugs.filter(s => mine.has(s));
      if (hits.length === 0) continue;
      seen += 1;
      if (a.wasCorrect) correct += 1;
      else for (const s of hits) misses.set(s, (misses.get(s) ?? 0) + 1);
    }

    const enough = seen >= MIN_ANSWERS;
    const concepts: WeaknessConcept[] = [...misses.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 2)
      .map(([slug, n]) => ({
        slug,
        name: conceptNames.get(slug) ?? slug,
        misses: n,
        href: lessons.get(slug)?.href ?? null,
        lessonTitle: lessons.get(slug)?.title ?? null,
      }));

    return {
      key: v.slug,
      label: v.name_nl,
      one_liner: v.one_liner,
      pct: enough ? Math.round((correct / seen) * 100) : null,
      n: seen,
      detail: enough
        ? `${correct} van ${seen} goed${examCount > 0 ? ` · over ${examCount} ${examCount === 1 ? 'examen' : 'examens'}` : ''}`
        : 'Nog te weinig gegevens',
      score: null,
      delta: null,
      concepts: enough ? concepts : [],
    } satisfies WeaknessRow;
  });

  return sortWeakestFirst(rows);
}

/**
 * Zwakste eerst, en rijen zonder oordeel onderaan.
 *
 * Een vaardigheid waarover niets te zeggen valt hoort niet bovenaan te staan alsof hij het
 * dringendst is. Dat is dezelfde keuze als de `?? 101` in de sortering van `swRows`.
 */
export function sortWeakestFirst(rows: WeaknessRow[]): WeaknessRow[] {
  return [...rows].sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101) || a.label.localeCompare(b.label));
}

/** 0..3 → 0..100, voor de balkbreedte van een rubriekrij. */
export function scoreToPct(score: number): number {
  return Math.round((score / MAX_CRITERION_SCORE) * 100);
}
