/**
 * Vaardigheden — de bovenste laag van de zwaktekaart, voor Lezen en Luisteren.
 *
 * ── WAAROM DIT BESTAAT ───────────────────────────────────────────────────────
 * Schrijven en Spreken vertellen een kandidaat al wát hij moet oefenen, en ze doen dat omdat
 * hun cijfer is opgesplitst: de rubriek geeft vier criteria, `CriterionProgress` toont ze
 * zwakste-eerst. "62%" zegt niets; "inhoud 1.3 / 3" zegt wat je morgen doet.
 *
 * Lezen en Luisteren hadden die opsplitsing niet. Hun enige as was de tekstsoort ("Brief
 * 2/4"), en dat is geen leerdoel — je bent niet slecht in *brieven*. De concepten zijn dat
 * wél, maar er zijn er 25 bij Lezen en 33 bij Luisteren, en 33 rijen is geen kaart maar een
 * inventaris. Dus: vier tot vijf vaardigheden als kop, de concepten eronder als detail.
 *
 * ── HET IS EEN LEZING, GEEN NIEUWE RIJ ───────────────────────────────────────
 * Een vaardigheid staat niet in de database en krijgt geen tabel. Het is een groepering ván
 * bestaande concepten, en daarmee een taxonomie-uitspraak — die hoort in `data/`, naast
 * `skills.ts`, waar een hertagging door de docent een diff is en geen migratie.
 *
 * Het woord is ook niet nieuw. `CriterionProgress` heet op het scherm al "Je vaardigheden";
 * dat is precies wat deze lijst voor de andere twee onderdelen maakt. De taxonomie van
 * CLAUDE.md §3 (Woord · Taalregel · Examentip · Module · Les) blijft ongemoeid: een
 * vaardigheid is geen ding dat de kandidaat opent, het is de kop boven een balk.
 *
 * ── WAAROM SCHRIJVEN, SPREKEN EN KNM HIER NIET IN STAAN ──────────────────────
 * Schrijven en Spreken hébben hun vaardigheden al: de criteria van de rubriek (`inhoud`,
 * `woordgebruik`, `grammatica`, `verstaanbaarheid`), gescoord 0–3 per antwoord. Die hier
 * nog eens opschrijven zou twee lijsten maken die uit elkaar kunnen lopen.
 *
 * KNM heeft geen concepten — `concepts.level` is `a2` of `b1` en KNM-vragen hebben geen
 * niveau. Zijn as is het thema (`sections`), en die werkt. Een vijfde vaardighedenlijst
 * verzinnen voor een onderdeel dat al een werkende as heeft is winst noch waarheid.
 *
 * ── ELK CONCEPT VALT IN PRECIES ÉÉN VAARDIGHEID ──────────────────────────────
 * Geen dubbeling en geen wees, en `tests-unit/vaardigheden.test.ts` bewaakt het. Een concept
 * in twee vaardigheden zou zijn fouten dubbel tellen en beide balken laten zakken; een
 * concept in géén vaardigheid zou stil uit de kaart vallen — precies de fout van 10-09,
 * waar één kolom met twee lezingen twee totalen gaf voor dezelfde rijen zonder dat er iets
 * logde.
 */

import type { OnderdeelSlug } from './skills';

export type Vaardigheid = {
  /** Stabiele sleutel; komt in geen URL voor, maar wel in `SkillWeakness` als React-key. */
  slug: string;
  name_nl: string;
  /** Wat het is, in A2-Nederlands — dit staat onder de balk. */
  one_liner: string;
  /** De concept-slugs die eronder vallen. Zie de kop: precies één vaardigheid per concept. */
  concepts: string[];
};

/**
 * Lezen: vinden, precies lezen, woorden, zinnen, werkwoorden.
 *
 * De eerste twee zijn de examenmechaniek en de laatste drie de taal. Die volgorde is niet
 * alfabetisch en niet toevallig: bij A2 Lezen is meerkeuze de vorm, dus een verkeerde
 * werkwoordsuitgang kost niets, maar een gemiste `behalve` kost de vraag. Wat het meeste
 * kost staat vooraan wanneer twee vaardigheden even zwak zijn.
 */
const LEZEN: Vaardigheid[] = [
  {
    slug: 'informatie-vinden',
    name_nl: 'Informatie vinden',
    one_liner: 'Weten waar in de tekst het antwoord staat, zonder alles te lezen.',
    concepts: ['lezen-zoekend-lezen', 'lezen-vraag-eerst', 'lezen-afzender-datum-actie'],
  },
  {
    slug: 'precies-lezen',
    name_nl: 'Precies lezen',
    one_liner: 'De kleine woorden die het antwoord omdraaien: maar, behalve, alleen, het goedkoopst.',
    concepts: [
      'lezen-signaalwoorden',
      'voegwoorden-hoofdzin',
      'modale-werkwoorden',
      'vergrotende-trap',
      'overtreffende-trap',
      'frequentie',
    ],
  },
  {
    slug: 'woorden-begrijpen',
    name_nl: 'Woorden begrijpen',
    one_liner: 'Een woord dat je niet kent uit de rest van de zin halen.',
    concepts: ['lezen-woord-raden', 'voorzetsels-plaats'],
  },
  {
    slug: 'zinnen-begrijpen',
    name_nl: 'Zinnen begrijpen',
    one_liner: 'Zien hoe een zin in elkaar zit en waar een woord naar verwijst.',
    concepts: [
      'hoofdzin-woordorde',
      'inversie',
      'bijzin-omdat-als',
      'bijzin-dat-of',
      'om-te',
      'persoonlijk-vnw-onderwerp',
      'persoonlijk-vnw-lijdend',
    ],
  },
  {
    slug: 'werkwoorden-herkennen',
    name_nl: 'Werkwoorden herkennen',
    one_liner: 'Zien of iets al gebeurd is, nu gebeurt of nog moet gebeuren.',
    concepts: [
      'onregelmatige-tegenwoordige-tijd',
      'perfectum-regelmatig',
      'perfectum-onregelmatig',
      'verleden-tijd',
      'toekomende-tijd',
      'gebiedende-wijs',
      'scheidbare-werkwoorden',
    ],
  },
];

/**
 * Luisteren: verstaan, vasthouden, precies horen, de situatie, en de taal eronder.
 *
 * `verstaan` staat vooraan omdat het de enige vaardigheid is die niets met begrijpen te
 * maken heeft: wie `man` en `maan` niet uit elkaar houdt verliest de vraag voordat er iets
 * te redeneren valt. Het is ook de enige plek waar `klemtoon` en `lange-korte-klank` thuis
 * kunnen — twee regels die (nog) geen les hebben, zie `RULES_WITHOUT_LESSON`.
 */
const LUISTEREN: Vaardigheid[] = [
  {
    slug: 'verstaan',
    name_nl: 'Verstaan',
    one_liner: 'Horen welk woord er staat, ook als het snel gaat of erop lijkt.',
    concepts: [
      'luisteren-klanken-die-lijken',
      'luisteren-verkorte-spraak',
      'luisteren-klemtoon-en-nadruk',
      'klemtoon',
      'lange-korte-klank',
    ],
  },
  {
    slug: 'details-vasthouden',
    name_nl: 'Details vasthouden',
    one_liner: 'Getallen, tijden en prijzen onthouden terwijl het gesprek doorgaat.',
    concepts: ['luisteren-getallen-en-tijden', 'luisteren-kernwoorden', 'luisteren-voorspellen'],
  },
  {
    slug: 'precies-luisteren',
    name_nl: 'Precies luisteren',
    one_liner: 'Het kleine woordje horen dat het antwoord verandert — en het antwoord dat te goed past.',
    concepts: [
      'luisteren-signaalwoorden-horen',
      'luisteren-kleine-woordjes',
      'luisteren-afleiders',
      'luisteren-andere-woorden',
      'luisteren-vraag-eerst',
      'voegwoorden-hoofdzin',
      'modale-werkwoorden',
      'frequentie',
      'vergrotende-trap',
      'overtreffende-trap',
    ],
  },
  {
    slug: 'situatie-volgen',
    name_nl: 'De situatie volgen',
    one_liner: 'Weten wie er praat, tegen wie, en wat voor soort bericht het is.',
    concepts: [
      'luisteren-gesprek-of-bericht',
      'luisteren-wie-zegt-wat',
      'vragen-maken',
      'persoonlijk-vnw-onderwerp',
      'persoonlijk-vnw-lijdend',
    ],
  },
  {
    slug: 'zinnen-en-tijden',
    name_nl: 'Zinnen en tijden',
    one_liner: 'Horen hoe de zin loopt en wanneer iets gebeurde.',
    concepts: [
      'bijzin-omdat-als',
      'bijzin-dat-of',
      'onregelmatige-tegenwoordige-tijd',
      'perfectum-regelmatig',
      'perfectum-onregelmatig',
      'verleden-tijd',
      'toekomende-tijd',
      'gebiedende-wijs',
      'scheidbare-werkwoorden',
      'voorzetsels-plaats',
    ],
  },
];

/**
 * Alleen de twee meerkeuze-taalonderdelen. `Partial` is de waarheid en geen gemak: Schrijven,
 * Spreken en KNM hébben hun as al, en een lege array voor hen zou lezen als "nog in te
 * vullen".
 */
export const VAARDIGHEDEN: Partial<Record<OnderdeelSlug, Vaardigheid[]>> = {
  lezen: LEZEN,
  luisteren: LUISTEREN,
};

/** De vaardigheden van een onderdeel, of een lege lijst als dit onderdeel er geen heeft. */
export function vaardighedenFor(onderdeel: OnderdeelSlug): Vaardigheid[] {
  return VAARDIGHEDEN[onderdeel] ?? [];
}

/**
 * concept-slug → vaardigheid, voor één onderdeel.
 *
 * Dit is de kant die de aggregatie gebruikt: zij komt binnen met een concept-id per fout
 * antwoord en moet weten in welke balk dat valt. Een concept dat hier niet in staat telt
 * nergens in mee — zie `lib/vaardigheden-server.ts`.
 */
export function vaardigheidByConcept(onderdeel: OnderdeelSlug): Map<string, Vaardigheid> {
  const out = new Map<string, Vaardigheid>();
  for (const v of vaardighedenFor(onderdeel)) {
    for (const slug of v.concepts) out.set(slug, v);
  }
  return out;
}
