import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { THEMAS } from '@/data/leren';
import { KNM_WOORDKAARTEN } from '@/data/woordkaarten';
import { ONA_CARDS } from '@/data/ona/cards';
import { canOpenOnaCard } from '@/lib/ona/access';
import { FEATURES } from '@/lib/features';
import type { OnaState } from '@/lib/ona/server';
import type { SideBlock } from '@/components/lessons/GrammarCourseSide';
import type { LessonWord, WordStatus } from '@/lib/lessons/words';

/**
 * De cursusroute (`CourseRoute`) voor KNM en ONA (eigenaar, 15-10): dezelfde tweede kolom als
 * in de leerlaag van de taalonderdelen, zodat hun leerstof uit de zijbalk kon. De zijbalk houdt
 * één rij per module; de examens staan op het moduleoverzicht.
 */

type Route = { done: number; total: number; blocks: SideBlock[] };
type Meta = Record<string, unknown> | null;

/** De 366 woordkaarten liggen statisch in de repo; dit is hun aantal, niet een query. */
export const KNM_WORD_TOTAL = KNM_WOORDKAARTEN.themes.reduce((n, th) => n + th.words.length, 0);

/**
 * Hoeveel van de 366 woordkaarten de kandidaat kent. Een telling (`head: true`), geen rijen; een
 * fout betekent nul — dit is een cijfer op een kaart, geen reden om het scherm te laten vallen.
 */
export async function countWordsKnown(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('user_word_card_progress')
      .select('word_card_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('known', true);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type KnmWordTheme = { id: number; name: string; words: LessonWord[]; known: number };

/** Het pad van één KNM-woordthema. `theme` op het woord is de sleutel van `WORD_KNOWN_EVENT`. */
export const knmWordThemePath = (locale: string, id: number) => `/${locale}/dashboard/woordkaarten/${id}`;
const knmThemeKey = (id: number) => `knm-${id}`;

/** Thema 1 is open voor iedereen met een account, zoals examen 1 en lesmodule 1. */
export const knmThemeOpen = (id: number, owns: boolean) => id === 1 || owns;

type CardRow = {
  id: number; theme_id: number | null; theme_name: string | null; dutch: string;
  article: string | null; plural: string | null; dutch_description: string | null;
  dutch_example: string | null; image_url: string | null; audio_dutch_word: string | null;
  audio_dutch_sentence: string | null; translation_en: string | null;
  translation_ar: string | null; translation_tr: string | null;
};

/**
 * De KNM-woordkaarten per thema, als `LessonWord` voor dezelfde deck als A2/B1 (eigenaar, 15-10).
 *
 * Uit `word_cards` en niet uit `data/woordkaarten.ts`: alleen de tabel heeft de foto's en de
 * audio, en de id's in het statische bestand (101, 102, …) zijn niet die van de tabel (1, 2, …) —
 * voortgang op een statisch id zou op een ander woord terechtkomen.
 *
 * `user_word_card_progress` kent alleen `known`. Een rij met `known: false` is "Nog leren", geen
 * rij is "nog niet gezien".
 */
export async function fetchKnmWordThemes(userId: string | null): Promise<KnmWordTheme[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('word_cards')
      .select('id, theme_id, theme_name, dutch, article, plural, dutch_description, dutch_example, image_url, audio_dutch_word, audio_dutch_sentence, translation_en, translation_ar, translation_tr')
      .not('theme_id', 'is', null)
      .order('theme_id')
      .order('sort_order')
      .order('id');
    const rows = (data ?? []) as CardRow[];

    const progress = new Map<number, WordStatus>();
    if (userId && rows.length > 0) {
      const { data: prog } = await supabase
        .from('user_word_card_progress')
        .select('word_card_id, known')
        .eq('user_id', userId);
      for (const r of prog ?? []) progress.set(Number(r.word_card_id), r.known ? 'known' : 'learning');
    }

    const names = new Map(KNM_WOORDKAARTEN.themes.map(th => [th.id, th.name]));
    const byTheme = new Map<number, KnmWordTheme>();
    for (const r of rows) {
      const id = Number(r.theme_id);
      const theme = byTheme.get(id) ?? { id, name: names.get(id) ?? r.theme_name ?? `Thema ${id}`, words: [], known: 0 };
      const status = progress.get(r.id) ?? 'unseen';
      theme.words.push({
        id: r.id,
        theme: knmThemeKey(id),
        dutch: r.dutch,
        article: r.article || null,
        plural: r.plural || null,
        frame: null,
        meaningNl: r.dutch_description ?? '',
        example: r.dutch_example || null,
        usage: null,
        imageUrl: r.image_url || null,
        audioUrl: r.audio_dutch_word || null,
        exampleAudioUrl: r.audio_dutch_sentence || null,
        translations: { en: r.translation_en || null, ar: r.translation_ar || null, tr: r.translation_tr || null },
        translationsReviewed: false,
        status,
      });
      if (status === 'known') theme.known++;
      byTheme.set(id, theme);
    }
    return [...byTheme.values()].sort((a, b) => a.id - b.id);
  } catch {
    return [];
  }
}

/** Het eerste thema dat je mag openen en nog niet helemaal kent; anders thema 1. */
export function nextKnmTheme(themes: KnmWordTheme[], owns: boolean): KnmWordTheme | null {
  const open = themes.filter(th => knmThemeOpen(th.id, owns) && th.words.length > 0);
  return open.find(th => th.known < th.words.length) ?? open[0] ?? null;
}

/** De afgeronde KNM-thema's, op `thema_id`. Zelfde afweging als hierboven. */
export async function fetchThemesDone(userId: string): Promise<Set<number>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_leren_progress')
      .select('thema_id')
      .eq('user_id', userId)
      .eq('completed', true);
    return new Set((data ?? []).map(r => Number(r.thema_id)));
  } catch {
    return new Set();
  }
}

export async function knmRoute({
  locale, userId, owns, open, currentSlug = null, currentTheme = null, wordThemes,
}: {
  locale: string;
  userId: string;
  owns: boolean;
  open: 'woorden' | 'leren';
  currentSlug?: string | null;
  /** Het open woordthema; meegegeven door de deckpagina, die de thema's al heeft opgehaald. */
  currentTheme?: number | null;
  wordThemes?: KnmWordTheme[];
}): Promise<Route> {
  const [t, tNav, tKnm, themesDone, fetchedThemes] = await Promise.all([
    getTranslations('grammar'),
    getTranslations('nav'),
    getTranslations('knm'),
    fetchThemesDone(userId),
    wordThemes ? Promise.resolve(wordThemes) : fetchKnmWordThemes(userId),
  ]);

  const blocks: SideBlock[] = [];
  if (FEATURES.woordkaarten) {
    /* Zelfde vorm als blok A van een taalcursus: per thema een rij met gekend/totaal, en de
       stationsteller telt hele thema's — dat is ook wat `CourseRoute` live bijwerkt. */
    const items = fetchedThemes.map(th => {
      const openable = knmThemeOpen(th.id, owns);
      const total = th.words.length;
      return {
        key: `woorden-${th.id}`,
        code: null,
        prefix: tKnm('theme_n', { n: th.id }),
        label: th.name,
        href: openable
          ? knmWordThemePath(locale, th.id)
          : `/${locale}/dashboard/pakketten?onderdeel=knm&vanaf=woorden-${th.id}`,
        done: total > 0 && th.known === total,
        now: th.id === currentTheme,
        locked: !openable,
        theme: knmThemeKey(th.id),
        count: { known: th.known, total },
      };
    });
    const full = items.filter(it => it.done).length;
    blocks.push({
      letter: 'woorden', icon: 'woorden', sub: t('route_sub_knm_words'),
      name: tNav('knm_woordkaarten'),
      done: full, total: items.length, complete: items.length > 0 && full === items.length,
      href: `/${locale}/dashboard/woordkaarten`, open: open === 'woorden', items, extras: null,
    });
  }
  if (FEATURES.leren) {
    /* Thema 1 is open voor iedereen met een account, zoals examen 1 (`/leren`). */
    const items = THEMAS.map((thema, i) => {
      const openable = i === 0 || owns;
      return {
        key: thema.slug,
        kind: 'uitleg' as const,
        code: null,
        label: thema.title,
        meta: tKnm('sections_count', { count: thema.sections.length }),
        href: openable
          ? `/${locale}/leren/${thema.slug}`
          : `/${locale}/dashboard/pakketten?onderdeel=knm&vanaf=leren-${thema.slug}`,
        done: themesDone.has(thema.id),
        now: thema.slug === currentSlug,
        locked: !openable,
      };
    });
    const done = items.filter(it => it.done).length;
    blocks.push({
      letter: 'leren', icon: 'leren', sub: t('route_sub_knm_themes'),
      name: tNav('knm_leren'),
      done, total: items.length, complete: done === items.length,
      href: `/${locale}/leren`, open: open === 'leren', items, extras: null,
    });
  }

  const themes = blocks.find(b => b.letter === 'leren');
  return { done: themes?.done ?? 0, total: themes?.total ?? 0, blocks };
}

export async function onaRoute({
  locale, meta, state, open, currentCard = null,
}: {
  locale: string;
  meta: Meta;
  state: OnaState;
  open: 'portfolio' | 'eindgesprek' | 'inleveren';
  currentCard?: number | null;
}): Promise<Route> {
  const [t, tNav] = await Promise.all([getTranslations('grammar'), getTranslations('nav')]);
  const base = `/${locale}/dashboard/ona`;
  const ready = new Set(state.entries.filter(e => e.status === 'klaar').map(e => e.cardNo));

  const items = ONA_CARDS.map(card => {
    const openable = canOpenOnaCard(meta, card.number);
    return {
      key: `kaart-${card.number}`,
      kind: 'opdracht' as const,
      code: null,
      prefix: t('route_ona_card', { n: card.number }),
      label: card.title,
      href: openable ? `${base}/kaart/${card.number}` : `/${locale}/dashboard/pakketten?onderdeel=ona`,
      done: ready.has(card.number),
      now: card.number === currentCard,
      locked: !openable,
    };
  });
  const done = items.filter(it => it.done).length;

  /* Eindgesprek en inleveren hebben geen teller: `total: 0` verbergt hem in `CourseRoute`. */
  const blocks: SideBlock[] = [
    {
      letter: 'portfolio', icon: 'portfolio', sub: t('route_sub_ona_cards'), name: tNav('ona_portfolio'),
      done, total: items.length, complete: done === items.length,
      href: `${base}/kaart/${currentCard ?? 1}`, open: open === 'portfolio', items, extras: null,
    },
    {
      letter: 'eindgesprek', icon: 'eindgesprek', sub: t('route_sub_ona_talk'), name: tNav('ona_eindgesprek'),
      done: 0, total: 0, complete: false,
      href: `${base}/eindgesprek`, open: open === 'eindgesprek', items: [], extras: null,
    },
    {
      letter: 'inleveren', icon: 'inleveren', sub: t('route_sub_ona_submit'), name: tNav('ona_inleveren'),
      done: 0, total: 0, complete: false,
      href: `${base}/inleveren`, open: open === 'inleveren', items: [], extras: null,
    },
  ];
  return { done, total: items.length, blocks };
}
