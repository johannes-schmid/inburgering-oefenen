import type { OnderdeelSlug } from '@/data/skills';
import type { Spoor } from '@/lib/lessons/sporen';

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
  | 'lessen';

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

export type LearnPanelSection = {
  id: string;
  label: string;
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

// ---------------------------------------------------------------------------
// De tweede kolom binnen een spoor
// ---------------------------------------------------------------------------

/**
 * De tweede kolom binnen één module van een spoor — Grammatica of Examentraining.
 *
 * Een aparte vorm naast `LearnPanelData`, want de as is een andere: daar is het "welke les van
 * welk blok", hier is het "de zeven lessen van déze module, en welke module je open hebt". Er
 * valt dus niets uit te klappen; de moduleswitcher bovenaan doet wat de secties daar doen.
 *
 * Waarom hij bestaat: zonder tweede kolom moest je voor "even les 5" eerst terug naar de
 * modulepagina, en dat zijn drie navigatielagen (onderdeel → spoor → module) boven een les die
 * er maar één diep in zit (eigenaar, 03-09). Alles hierin gaat als payload naar een client
 * component en moet JSON-serialiseerbaar zijn.
 */
export type ModulePanelItem = {
  href: string;
  label: string;
  done?: boolean;
  current?: boolean;
  locked?: boolean;
};

export type ModulePanelData = {
  /** "Module" — het kopje boven de switcher. */
  kicker: string;
  name: string;
  /** Waar de terugweg heen gaat: het spoor. Draagt ook de naam van het spoor. */
  backHref: string;
  backLabel: string;
  /** De andere modules van dit spoor, voor de switcher. Inclusief de huidige. */
  siblings: { href: string; label: string; current: boolean; pct: number; done: number; total: number }[];
  done: number;
  total: number;
  pct: number;
  lessons: ModulePanelItem[];
  /** De module hierna, onderaan de kolom. `null` op de laatste. */
  next: { href: string; label: string; kicker: string } | null;
};

/**
 * De modulekolom uit een spoor en de module waar je in zit.
 *
 * Hier en niet in de twee pagina's: de modulepagina en de lespagina tonen exact dezelfde
 * kolom, en twee kopieën lopen uiteen. De labels komen mee, want dit bestand mag geen
 * vertalingen lezen.
 */
export function modulePanel(
  spoor: Spoor,
  moduleSlug: string,
  opts: {
    kicker: string;
    spoorTitle: string;
    spoorHref: string;
    moduleHref: (slug: string) => string;
    lessonHref: (slug: string) => string;
    /** Waar een niet-gekochte les heen wijst — het aanbod, met het onderdeel erin. */
    lockedHref: (slug: string) => string;
    nextKicker: string;
    /** De les waar je nu op staat; op de modulepagina zelf is er geen. */
    currentLessonId?: number | null;
    owned: boolean;
  },
): ModulePanelData | null {
  const index = spoor.modules.findIndex(m => m.slug === moduleSlug);
  if (index < 0) return null;
  const mod = spoor.modules[index];
  const following = spoor.modules[index + 1] ?? null;

  return {
    kicker: opts.kicker,
    name: mod.name,
    backHref: opts.spoorHref,
    backLabel: opts.spoorTitle,
    /* Elke module draagt zijn eigen percentage mee, ook in het keuzemenu: "hoe ver ben ik in
       de andere modules" is precies de vraag die je stelt op het moment dat je erin kijkt. */
    siblings: spoor.modules.map(m => ({
      href: opts.moduleHref(m.slug),
      label: m.name,
      current: m.slug === mod.slug,
      pct: m.pct,
      done: m.done,
      total: m.total,
    })),
    done: mod.done,
    total: mod.total,
    pct: mod.pct,
    lessons: mod.lessons.map(les => ({
      href: opts.owned || les.is_free
        ? opts.lessonHref(les.slug)
        : opts.lockedHref(les.slug),
      label: les.title,
      done: les.progress?.state === 'done',
      current: les.id === opts.currentLessonId,
      locked: !opts.owned && !les.is_free,
    })),
    next: following
      ? { href: opts.moduleHref(following.slug), label: following.name, kicker: opts.nextKicker }
      : null,
  };
}
