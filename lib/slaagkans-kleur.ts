/**
 * De kleurschaal van de slaagkans: klei-oranje bij laag, navy bij hoog.
 *
 * ── WAAROM EEN SCHAAL EN GEEN TWEE TOESTANDEN ────────────────────────────────
 * Oranje is in deze huisstijl het signaalkleur — het wijst aan waar de winst zit. Navy is de
 * huiskleur en zegt niets alarmerends. Een slaagkans die van 22% naar 96% loopt, loopt dus van
 * "hier valt het meeste te halen" naar "beheerst", en dat is één as en geen twee vakjes: het
 * kantelpunt ligt rond de 65%, waar de boventoon van oranje naar navy overgaat.
 *
 * ── ÉÉN BRON VOOR RING ÉN BALK ───────────────────────────────────────────────
 * De ring van de slaagkans en de balken van "Je vaardigheden" staan op hetzelfde scherm en zeggen
 * hetzelfde soort ding. Zou elk zijn eigen verloop hebben, dan zou 58% in de balk een andere
 * temperatuur krijgen dan 58% in de ring, en dan is de kleur geen informatie meer maar decoratie.
 * Daarom rekent alles wat kleurt via `slaagkansKleur()`, en geen enkele plek zet zijn eigen hex.
 *
 * 65% is het laatste punt dat nog helemaal oranje is: het kantelpunt hoort ná de drempel te liggen,
 * niet erop, anders krijgt precies de stand waar de tekst "vanaf 65% is het navy" over gaat de
 * gemengde kleur van de overgang.
 *
 * De functie is puur en heeft geen React nodig: `SlaagkansGauge` is een client component en
 * `SkillWeakness` een server component, en ze delen deze schaal.
 */

/**
 * De ijkpunten. De sprong van oranje naar navy zit bewust tussen 0.65 en 0.76: over een korte
 * boog, zodat er één herkenbaar omslagpunt is in plaats van een lange modderige tussenzone.
 */
const STOPS: [number, [number, number, number]][] = [
  [0.0, [0xa2, 0x40, 0x00]],
  [0.3, [0xd8, 0x53, 0x1a]],
  [0.52, [0xfe, 0x76, 0x2c]],
  [0.65, [0xe0, 0x62, 0x22]],
  [0.76, [0x3f, 0x54, 0x88]],
  [0.86, [0x12, 0x40, 0x7f]],
  [1.0, [0x00, 0x2b, 0x6d]],
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function hex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgbAt(pct: number): [number, number, number] {
  const p = Math.min(1, Math.max(0, pct / 100));
  for (let i = 1; i < STOPS.length; i++) {
    const [pos, col] = STOPS[i];
    const [prevPos, prevCol] = STOPS[i - 1];
    if (p <= pos) {
      const t = pos === prevPos ? 0 : (p - prevPos) / (pos - prevPos);
      return [lerp(prevCol[0], col[0], t), lerp(prevCol[1], col[1], t), lerp(prevCol[2], col[2], t)];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/** De kleur van de schaal op dit percentage. */
export function slaagkansKleur(pct: number) {
  return hex(rgbAt(pct));
}

/** Dezelfde kleur, doorzichtig — voor de tint van de kern en van een rijachtergrond. */
export function slaagkansTint(pct: number, alpha: number) {
  const [r, g, b] = rgbAt(pct);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Het donkerste punt van de schaal: waar elke balk en elke boog begint. */
export const SLAAGKANS_START = slaagkansKleur(0);
