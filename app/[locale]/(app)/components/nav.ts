import type { OnderdeelSlug } from '@/data/skills';

/**
 * Which portal page is current. A plain type in its own module so the shell (a client
 * component) and the pages (server components) can share it without either importing the
 * other — a type exported from a `'use client'` file drags the whole module into the server
 * graph.
 */
export type PortalNav =
  /** The portal overview at `/dashboard` — every module at once. */
  | 'overview'
  /** One module's own overview at `/dashboard/[level]` or `/dashboard/knm`. */
  | 'overview-module'
  | OnderdeelSlug
  | 'profile'
  /** KNM's lesmodules op `/leren`. */
  | 'leren'
  | 'woordkaarten'
  /** De lescursus van één taalonderdeel op `/dashboard/[level]/[skill]/leren`. */
  | 'lessen'
  /** ONA: een kaart schrijven, het eindgesprek oefenen, inleveren. Het overzicht is `overview-module`. */
  | 'ona-portfolio'
  | 'ona-eindgesprek'
  | 'ona-inleveren';

/**
 * De tweede kolom — en die verschijnt alleen binnen een lesmodule.
 *
 * De portaalchrome is sinds 29-08 wéér één zijbalk (beslissing eigenaar, naar de mockup
 * "Studieportaal Navigatie Opties"): twee vaste kolommen zeiden op elke pagina twee dingen
 * terwijl er op de meeste maar één te zeggen valt. Een tweede kolom is nu een *uitzondering*
 * met een reden: je zit in een cursus of in de conceptenbibliotheek, en dan is "welke les /
 * welk concept" een echte tweede as die de hele bezoekduur meegaat.
 *
 * De pagina bouwt hem, niet de chrome: alleen de pagina kent de blokken, de voortgang en welk
 * item het huidige is. Alles hierin moet JSON-serialiseerbaar zijn — het gaat als payload naar
 * een client component — en mag dus nooit een beoordelingssleutel dragen.
 */
export type LearnPanelItem = {
  /** `/…`-pad zonder localeprefix. */
  href: string;
  label: string;
  /** Afgerond: het vinkje. */
  done?: boolean;
  /** De les of het concept waar je nu op staat. */
  current?: boolean;
  /** Wel gebouwd, niet van jou — leidt naar het aanbod, en dat zegt het slotje. */
  locked?: boolean;
};

/**
 * Het glyph naast een sectiekop in het lespaneel.
 *
 * Een **sleutel** en geen component: alles in `LearnPanelData` gaat als payload naar een client
 * component en moet JSON-serialiseerbaar zijn. `LearnPanel` zet hem om naar een lucide-glyph.
 *
 * **Lucide en geen categoriemerk** (§7). Een conceptgroep — *Zinnen bouwen*, *Werkwoorden &
 * tijd* — is geen onderdeel, geen track en geen KNM-thema, en dus is er geen officieel merk
 * voor; er één per groep bijtekenen is precies de eenmalige vorm in één scherm waar §7 tegen
 * waarschuwt. De glyphs zijn hier navigatie: ze maken zes kapitaalkoppen onder elkaar
 * scanbaar (eigenaar, 15-09), meer claimen ze niet.
 */
export type SectionIcon =
  | 'zinnen' | 'tijd' | 'soorten' | 'verbuigen' | 'verwijzen' | 'klank'
  | 'bouwstenen' | 'uitleg' | 'training' | 'toets' | 'woorden' | 'regel';

/**
 * Van moduleslug naar glyph. De sleutels zijn `concept_groups.slug` plus de blokletters van
 * het examenspoor; alles wat hier niet in staat valt terug op `bouwstenen` — het eigen blok B
 * van de cursus (Bouwstenen, Klank en tempo, Uitspraak, Grammatica) is precies dat geval, en
 * een nieuwe conceptgroep van de docent krijgt zo een glyph in plaats van een gat.
 */
const MODULE_ICON: Record<string, SectionIcon> = {
  'zinnen-bouwen': 'zinnen',
  'werkwoorden-tijd': 'tijd',
  'soorten-werkwoorden': 'soorten',
  'woorden-verbuigen': 'verbuigen',
  verwijzen: 'verwijzen',
  'spelling-uitspraak': 'klank',
  c: 'uitleg',
  d: 'training',
  e: 'toets',
};

export type LearnPanelSection = {
  id: string;
  label: string;
  /** Het glyph voor de kop. Weglaten geeft geen glyph. */
  icon?: SectionIcon;
  /** Eén letter voor een blok (A–E); null voor een conceptgroep. */
  letter?: string | null;
  done?: number;
  total?: number;
  items: LearnPanelItem[];
};

export type LearnPanelData = {
  title: string;
  /** Waar "terug" heen gaat: de cursuspagina of de pagina van het onderdeel. */
  backHref: string;
  backLabel: string;
  sections: LearnPanelSection[];
};

/**
 * De cursus als lespaneel.
 *
 * Hier en niet in de pagina's, want vier pagina's (de cursus, één les, de bibliotheek, één
 * concept) tonen dezelfde lijst en twee kopieën ervan lopen uit elkaar — dezelfde reden als
 * voor `lib/admin/nav.ts`. De labels komen mee als argument: dit bestand mag geen vertalingen
 * lezen, en de aanroeper heeft `getTranslations` al.
 *
 * `owned` is per onderdeel en niet "bezit iets op dit niveau": een gratis les blijft open, de
 * rest krijgt een slotje dat naar het aanbod wijst.
 */
export function coursePanel(
  blocks: {
    id: number; letter: string; name_nl: string;
    lessons: { slug: string; title: string; is_free: boolean; progress: { state: string } | null }[];
  }[],
  opts: {
    title: string; backHref: string; backLabel: string;
    lessonHref: (slug: string) => string;
    currentSlug?: string | null;
    owned: boolean;
  },
): LearnPanelData {
  return {
    title: opts.title,
    backHref: opts.backHref,
    backLabel: opts.backLabel,
    sections: blocks
      .filter(b => b.lessons.length > 0)
      .map(block => ({
        id: `block-${block.id}`,
        label: block.name_nl,
        letter: block.letter,
        done: block.lessons.filter(l => l.progress?.state === 'done').length,
        total: block.lessons.length,
        items: block.lessons.map(lesson => ({
          href: opts.lessonHref(lesson.slug),
          label: lesson.title,
          done: lesson.progress?.state === 'done',
          current: lesson.slug === opts.currentSlug,
          locked: !opts.owned && !lesson.is_free,
        })),
      })),
  };
}

/** Dezelfde lijst voor de naslagpagina van één taalregel: één sectie per regelgroep. */
export function conceptsPanel(
  groups: { key: string; name: string; concepts: { slug: string; name_nl: string }[] }[],
  opts: {
    title: string; backHref: string; backLabel: string;
    conceptHref: (slug: string) => string;
    currentSlug?: string | null;
  },
): LearnPanelData {
  return {
    title: opts.title,
    backHref: opts.backHref,
    backLabel: opts.backLabel,
    sections: groups.map(group => ({
      id: group.key,
      label: group.name,
      icon: MODULE_ICON[group.key] ?? 'regel',
      letter: null,
      total: group.concepts.length,
      items: group.concepts.map(c => ({
        href: opts.conceptHref(c.slug),
        label: c.name_nl,
        current: c.slug === opts.currentSlug,
      })),
    })),
  };
}
