/**
 * De leerroute van één onderdeel: woordenschat → grammatica → examentraining.
 *
 * **De drie stappen zijn geen nieuwe indeling — het is `ConceptKind`.** Elk concept is al
 * getypeerd als `woordenschat`, `grammatica` of `strategie`, en elke les hangt via
 * `lesson_concepts` aan concepten. Deze module doet niets anders dan die ene as omdraaien: van
 * "welke concepten zitten er in dit onderdeel" naar "hoe ver ben je per stap". Een vierde
 * indeling verzinnen (een kolom `track` op `lessons`, of een lijstje in de code) zou een tweede
 * waarheid zijn naast een as die de docent al invult in `/admin`.
 *
 * `strategie` heet naar buiten **Examentraining**: dat is wat de kandidaat erin doet, en het is
 * de stap waar de tien oefenexamens onder hangen.
 *
 * ## Het getal
 *
 * Eén score van 0–100 per stap, en hij is van ons — dezelfde discipline als `masteryPct` en
 * `readiness()`. Hij bestaat uit maximaal drie helften die even zwaar wegen:
 *
 * - **leren**: hoeveel van de lessen die déze stap uitleggen je hebt afgerond;
 * - **beheersing**: het gemiddelde `mastery_pct` over de concepten van deze stap, waarbij een
 *   concept dat je nog nooit hebt gezien voor 0 meetelt — anders zou "één concept aangeraakt en
 *   goed" als 100 lezen terwijl de rest van de stap ongezien is;
 * - **oefenen** (alleen Examentraining): dekking × kwaliteit over de tien oefenexamens, precies
 *   de `practice`-helft van `readiness()`;
 * - **woorden** (alleen Woordenschat): hoeveel van de woordkaarten van dit onderdeel op `known`
 *   staan. Dit is de helft die de stap überhaupt laat bestaan bij A2 Lezen, waar de docent nog
 *   geen `woordenschat`-concept heeft vrijgegeven maar wel 126 woorden heeft geschreven.
 *
 * Ontbreekt een helft helemaal — er zijn geen lessen die deze stap uitleggen, of er is nog geen
 * examen gemaakt — dan telt de rest voor het geheel. Dat is dezelfde keuze als in
 * `readiness.ts`, en om dezelfde reden: een stap zonder lessen voor eeuwig op maximaal 50 zetten
 * is een uitspraak over ónze content, niet over de kandidaat.
 *
 * **`null` betekent "hier valt niets over te zeggen", niet 0.** Een onderdeel waar de docent nog
 * geen concept van deze soort heeft vrijgegeven krijgt `score: null` en de kaart zegt dat erbij.
 */

import type { Concept, ConceptKind, LessonBlock, LessonSummary, Mastery } from './lessons';

/** De drie stappen, in de volgorde waarin ze gedaan horen te worden. */
export const LEERROUTE_KINDS: ConceptKind[] = ['woordenschat', 'grammatica', 'strategie'];

export type LeerModule = {
  kind: ConceptKind;
  /**
   * Heeft deze stap iets om te doen? Concepten *of* woordkaarten is genoeg.
   *
   * Los van `conceptCount`, want dat was tot 02-09 hetzelfde en dat is precies waar de kaart
   * van Woordenschat op leeg viel terwijl er 126 woorden klaarstonden.
   */
  hasContent: boolean;
  /** Hoeveel concepten van deze soort er in dit onderdeel zitten. 0 = de docent heeft er nog geen. */
  conceptCount: number;
  /** Hoeveel daarvan `isMastered`-waardig zijn volgens hun eigen percentage (≥ 80). */
  conceptsStrong: number;
  /** De lessen die deze stap uitleggen, en hoeveel je daarvan af hebt. */
  lessonsDone: number;
  lessonsTotal: number;
  /** Gemiddelde beheersing over de concepten van deze stap, of null als er geen concepten zijn. */
  masteryPct: number | null;
  /** 0–100, of null als er over deze stap niets te zeggen valt. */
  score: number | null;
  /** De eerstvolgende les van deze stap die nog niet af is. */
  next: { slug: string; title: string } | null;
  /** De woordkaarten van dit onderdeel — alleen gevuld op de Woordenschat-stap. */
  words: { known: number; total: number } | null;
  /**
   * De naam die de cursus zelf aan deze stap geeft, of `null` voor de vertaalde naam.
   *
   * Bestaat voor de middelste stap: bij Lezen heet blok B "Grammatica", bij Spreken
   * "Uitspraak". Zie `Spoor.name` in `sporen.ts`.
   */
  title: string | null;
};

/** Vanaf welk percentage deze module een concept "sterk" noemt. Zelfde grens als `MASTERY_THRESHOLD`. */
const STRONG_PCT = 80;

export function buildLeerroute(input: {
  concepts: Concept[];
  mastery: Map<number, Mastery>;
  /** Per concept-id de les die het in dít (niveau, onderdeel) uitlegt — `fetchTeachersForCourse`. */
  teachers: Map<number, { slug: string; title: string }>;
  blocks: LessonBlock[];
  /**
   * De oefenhelft van Examentraining: dekking × kwaliteit over de tien examens, 0–1, of null als
   * er nog geen nagekeken examen is. Komt uit `readiness()` zodat er één formule bestaat.
   */
  examPractice: number | null;
  /**
   * De woordkaarten van dit onderdeel: hoeveel er op `known` staan van hoeveel er zijn. Ze horen
   * bij Woordenschat en bij niets anders — `fetchWordCounts` levert ze.
   */
  wordCounts?: { known: number; total: number };
  /**
   * De lessen van het leerspoor van deze stap, als die er is — `fetchSporen`.
   *
   * Overschrijft de `teaches`-telling hieronder, en dat is een correctie: Examentraining leidt
   * zeventien lessen op in de blokken C, D en E en maar vijf daarvan leggen een
   * `strategie`-concept uit. De kaart zei daardoor "0 / 5" naast een spoorscherm dat er
   * zeventien toont, en twee getallen voor hetzelfde ding op twee schermen naast elkaar is een
   * bug ook als beide op zichzelf klopten.
   */
  spoorLessons?: Partial<Record<ConceptKind, { done: number; total: number; name?: string | null }>>;
}): LeerModule[] {
  const { concepts, mastery, teachers, blocks, examPractice, wordCounts, spoorLessons } = input;

  /* De lessen op slug, in cursusvolgorde. `blocks` is al gesorteerd, dus de eerste onafgeronde
     les die we tegenkomen is ook echt de eerstvolgende. */
  const lessons: LessonSummary[] = blocks.flatMap(b => b.lessons);
  const bySlug = new Map(lessons.map(l => [l.slug, l]));

  return LEERROUTE_KINDS.map(kind => {
    const own = concepts.filter(c => c.kind === kind);

    /* De lessen van deze stap: de `teaches`-lessen van haar concepten, ontdubbeld — één les kan
       twee concepten van dezelfde soort uitleggen, en die mag niet twee keer meetellen. */
    const slugs = new Set<string>();
    for (const c of own) {
      const teacher = teachers.get(c.id);
      if (teacher && bySlug.has(teacher.slug)) slugs.add(teacher.slug);
    }
    const own_lessons = lessons.filter(l => slugs.has(l.slug));
    /* Alleen als het spoor echt lessen heeft: een leeg spoor mag een stap die zijn lessen
       langs de `teaches`-relatie wél kent niet op 0 / 0 zetten. */
    const raw = spoorLessons?.[kind];
    const spoor = raw && raw.total > 0 ? raw : undefined;
    const lessonsTotal = spoor?.total ?? own_lessons.length;
    const lessonsDone = spoor?.done ?? own_lessons.filter(l => l.progress?.state === 'done').length;

    const pcts = own.map(c => mastery.get(c.id)?.mastery_pct ?? 0);
    const masteryPct = own.length > 0
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / own.length)
      : null;
    const conceptsStrong = pcts.filter(p => p >= STRONG_PCT).length;

    const words = kind === 'woordenschat' && wordCounts && wordCounts.total > 0 ? wordCounts : null;

    const halves: number[] = [];
    if (lessonsTotal > 0) halves.push(lessonsDone / lessonsTotal);
    if (masteryPct !== null) halves.push(masteryPct / 100);
    if (kind === 'strategie' && examPractice !== null) halves.push(examPractice);
    if (words) halves.push(words.known / words.total);

    const score = halves.length > 0
      ? Math.round((halves.reduce((a, b) => a + b, 0) / halves.length) * 100)
      : null;

    return {
      kind,
      /**
       * Concepten óf woordkaarten óf lessen in het spoor.
       *
       * `lessonsTotal > 0` is er op 08-09 bij gekomen, en het repareert de middelste stap van de
       * drie nieuwe cursussen. Blok B is daar geen grammatica maar de vaardigheid zelf, en die
       * leunt op strategieconcepten — die hebben `kind: 'strategie'` en landen dus in de dérde
       * stap. De tweede kaart telde daardoor nul concepten en zei "nog geen inhoud", met een
       * spoorscherm eronder waar zes lessen klaarstonden. Precies dezelfde fout als bij
       * Woordenschat op 02-09: een kaart die leeg valt terwijl de content er is.
       */
      hasContent: own.length > 0 || words !== null || lessonsTotal > 0,
      conceptCount: own.length,
      conceptsStrong,
      lessonsDone,
      lessonsTotal,
      masteryPct,
      score,
      next: own_lessons.find(l => l.progress?.state !== 'done') ?? null,
      words,
      title: raw?.name ?? null,
    };
  });
}
