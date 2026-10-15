import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { THEMAS } from '@/data/leren';
import { KNM_WOORDKAARTEN } from '@/data/woordkaarten';
import { ONA_CARDS } from '@/data/ona/cards';
import { canOpenOnaCard } from '@/lib/ona/access';
import { FEATURES } from '@/lib/features';
import type { OnaState } from '@/lib/ona/server';
import type { SideBlock } from '@/components/lessons/GrammarCourseSide';

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
      .eq('status', 'known');
    return count ?? 0;
  } catch {
    return 0;
  }
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
  locale, userId, owns, open, currentSlug = null,
}: {
  locale: string;
  userId: string;
  owns: boolean;
  open: 'woorden' | 'leren';
  currentSlug?: string | null;
}): Promise<Route> {
  const [t, tNav, tKnm, wordsKnown, themesDone] = await Promise.all([
    getTranslations('grammar'),
    getTranslations('nav'),
    getTranslations('knm'),
    countWordsKnown(userId),
    fetchThemesDone(userId),
  ]);

  const blocks: SideBlock[] = [];
  if (FEATURES.woordkaarten) {
    blocks.push({
      letter: 'woorden', icon: 'woorden', sub: t('route_sub_knm_words'),
      name: tNav('knm_woordkaarten'),
      done: wordsKnown, total: KNM_WORD_TOTAL, complete: wordsKnown >= KNM_WORD_TOTAL,
      href: `/${locale}/dashboard/woordkaarten`, open: open === 'woorden', items: [], extras: null,
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
