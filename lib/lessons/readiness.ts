/**
 * "Examenklaar" — één getal per onderdeel, en het is ONS getal.
 *
 * Het portaal had twee losse assen: hoeveel lessen je af hebt en hoeveel examens je gemaakt
 * hebt. Allebei waar, allebei onvoldoende — een kandidaat met tien examens op 45% staat op
 * "100% geoefend" en is niet klaar. Deze functie voegt ze samen tot het getal dat op de ring
 * staat.
 *
 * **Het is nadrukkelijk geen slaagkans.** `SEO/facts.md` §9 verbiedt het publiceren van een
 * onnavolgbare slaagnorm; DUO publiceert er geen. Dus: het heet "examenklaar", het is van ons,
 * en de formule staat hier op één plek in plaats van verspreid over de schermen die hem tonen
 * — dezelfde discipline als `masteryPct` in `lessons.ts`.
 *
 * De twee helften wegen even zwaar, en dat is het hele punt. Alleen lessen kan niet boven de
 * 50 uitkomen ("je hebt het gelezen, je hebt het niet laten zien") en alleen examens ook niet
 * ("je scoort, maar de stof die je niet raakte is ongetest"). Ontbreekt een helft helemaal —
 * er is geen cursus, of er is nog geen examen gepubliceerd — dan telt de andere voor het
 * geheel, want anders zou een onderdeel zonder cursus voor eeuwig op maximaal 50 staan en dat
 * is een uitspraak over onze content, niet over de kandidaat.
 */

export type ReadinessInput = {
  /** Afgeronde lessen en het totaal van de cursus. Totaal 0 = er is geen cursus. */
  lessonsDone: number;
  lessonsTotal: number;
  /** Gemaakte examens en hoeveel er in dit onderdeel zitten. */
  examsDone: number;
  examCount: number;
  /** Gemiddelde beste score over de gemaakte examens, of null als er niets gescoord is. */
  averagePct: number | null;
};

export type Readiness = {
  /** 0–100, of null als er over dit onderdeel niets te zeggen valt. */
  pct: number | null;
  /** De leerhelft, 0–1, of null als er geen cursus is. */
  learn: number | null;
  /** De oefenhelft, 0–1, of null als er geen examens gemaakt zijn. */
  practice: number | null;
};

export function readiness(input: ReadinessInput): Readiness {
  const learn = input.lessonsTotal > 0
    ? clamp01(input.lessonsDone / input.lessonsTotal)
    : null;

  /**
   * Dekking maal kwaliteit, en niet één van de twee.
   *
   * Drie van de tien examens op 80% is niet hetzelfde als tien van de tien op 24%, en een
   * gemiddelde alleen zou het eerste als "80% klaar" lezen terwijl zeven examens ongezien
   * zijn. Zonder gescoord examen bestaat deze helft niet — een gemaakt maar nog niet nagekeken
   * open examen (`averagePct === null`) is geen 0, dat zou een nakijkwachtrij als een
   * onvoldoende tonen.
   */
  const practice = input.examCount > 0 && input.examsDone > 0 && input.averagePct !== null
    ? clamp01((input.examsDone / input.examCount) * (input.averagePct / 100))
    : null;

  if (learn === null && practice === null) return { pct: null, learn, practice };
  if (learn === null) return { pct: Math.round(practice! * 100), learn, practice };
  if (practice === null) return { pct: Math.round(learn * 50), learn, practice };
  return { pct: Math.round((learn * 0.5 + practice * 0.5) * 100), learn, practice };
}

/**
 * Het gemiddelde over meerdere onderdelen, voor de ring boven een niveau.
 *
 * Onderdelen zonder enig cijfer tellen niet mee in de deler: Spreken dat nog niet bestaat mag
 * A2 niet naar beneden trekken, want dat zou onze roadmap als de voortgang van de kandidaat
 * presenteren.
 */
export function averageReadiness(list: Readiness[]): number | null {
  const known = list.map(r => r.pct).filter((p): p is number => p !== null);
  if (known.length === 0) return null;
  return Math.round(known.reduce((a, b) => a + b, 0) / known.length);
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
