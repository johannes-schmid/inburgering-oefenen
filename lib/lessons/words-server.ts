/**
 * De woordkaarten van de leerlaag — de queries.
 *
 * Apart van `lessons-server.ts` omdat dat bestand al zeshonderd regels is en over lessen gaat;
 * dit gaat over één tabel en zijn voortgangstabel. Zelfde discipline: elke functie vangt zijn
 * eigen fout op en geeft een lege uitkomst terug, want een trage query mag een portaalscherm niet
 * omvergooien.
 */

import { createClient } from '@/lib/supabase/server';
import type { Level, OnderdeelSlug } from '@/data/skills';
import { themeRank } from '@/data/lesson-themes';
import {
  type LessonWord,
  type WordStatus,
  type WordTheme,
  WORD_STATUSES,
} from './words';

const WORD_COLS =
  'id, theme, dutch, article, plural, frame, meaning_nl, example, usage, audio_url, ' +
  'translation_en, translation_ar, translations_reviewed, sort_order';

type Row = {
  id: number;
  theme: string;
  dutch: string;
  article: string | null;
  plural: string | null;
  frame: string | null;
  meaning_nl: string;
  example: string | null;
  usage: string;
  audio_url: string | null;
  translation_en: string | null;
  translation_ar: string | null;
  translations_reviewed: boolean | null;
  sort_order: number | null;
};

function toWord(r: Row, status: WordStatus): LessonWord {
  return {
    id: r.id,
    theme: r.theme,
    dutch: r.dutch,
    article: r.article,
    plural: r.plural,
    frame: r.frame,
    meaningNl: r.meaning_nl,
    example: r.example,
    // De CHECK op de kolom laat maar twee waarden toe; de cast is hier de grens tussen de
    // database en het type, niet een aanname.
    usage: r.usage === 'productief' ? 'productief' : 'receptief',
    audioUrl: r.audio_url,
    translations: { en: r.translation_en, ar: r.translation_ar },
    translationsReviewed: r.translations_reviewed ?? false,
    status,
  };
}

/**
 * Alle woorden van één onderdeel, gegroepeerd per thema, met de voortgang van deze kandidaat.
 *
 * Twee queries en geen join: de voortgangstabel staat achter RLS op `auth.uid()`, dus hem als
 * embedded resource meenemen zou voor een gast een lege array geven die niet van "nog niets
 * gedaan" te onderscheiden is. Los ophalen maakt dat verschil expliciet.
 *
 * **Geen filter op `review_status`.** De woorden worden vandaag al binnen de lessen gerenderd
 * (`fetchLessonWords`) zonder die poort, en twee schermen die dezelfde 126 woorden verschillend
 * tonen is erger dan één poort die er nog niet is. Wat wél zichtbaar is: `translationsReviewed`,
 * want de vertalingen zijn machinaal.
 */
export async function fetchWordThemes(
  level: Level,
  onderdeel: OnderdeelSlug,
  userId: string | null,
): Promise<WordTheme[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_words')
      .select(WORD_COLS)
      .eq('level', level)
      .eq('onderdeel', onderdeel)
      .order('sort_order');

    const rows = (data ?? []) as unknown as Row[];
    if (rows.length === 0) return [];

    const progress = await fetchWordProgress(userId, rows.map(r => r.id));

    // Een `Map` en geen object: de thema-slugs komen uit de database en `theme` kan in principe
    // `constructor` zijn. Op een plain object zou dat een functie teruggeven in plaats van een
    // lijst, en dan valt de pagina om op iets wat geen enkele test zou vinden.
    const byTheme = new Map<string, LessonWord[]>();
    for (const r of rows) {
      const list = byTheme.get(r.theme) ?? [];
      list.push(toWord(r, progress.get(r.id) ?? 'unseen'));
      byTheme.set(r.theme, list);
    }

    /* Op de vaste themavolgorde, niet op de volgorde waarin de woorden uit de query kwamen:
       daar hangt de "Thema N"-chip aan, en die mag niet verschuiven als er een woord bij komt. */
    const entries = [...byTheme.entries()].sort(([a], [b]) => {
      const d = themeRank(a) - themeRank(b);
      return d !== 0 ? d : a.localeCompare(b);
    });

    return entries.map(([slug, words]) => {
      const known = words.filter(w => w.status === 'known').length;
      const touched = words.filter(w => w.status !== 'unseen').length;
      return {
        slug,
        words,
        known,
        touched,
        pct: words.length > 0 ? Math.round((known / words.length) * 100) : 0,
      };
    });
  } catch {
    return [];
  }
}

/** Eén thema, of null als het in dit onderdeel niet bestaat. */
export async function fetchWordTheme(
  level: Level,
  onderdeel: OnderdeelSlug,
  theme: string,
  userId: string | null,
): Promise<WordTheme | null> {
  const themes = await fetchWordThemes(level, onderdeel, userId);
  return themes.find(t => t.slug === theme) ?? null;
}

async function fetchWordProgress(
  userId: string | null,
  wordIds: number[],
): Promise<Map<number, WordStatus>> {
  const out = new Map<number, WordStatus>();
  if (!userId || wordIds.length === 0) return out;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_lesson_word_progress')
      .select('lesson_word_id, status')
      .eq('user_id', userId)
      .in('lesson_word_id', wordIds);

    for (const r of data ?? []) {
      const status = r.status as WordStatus;
      // Een onbekende status uit de database wordt `unseen` en geen crash: de CHECK bewaakt de
      // kolom, maar dit scherm hoort niet te breken als er ooit een vijfde waarde bij komt.
      if (WORD_STATUSES.includes(status)) out.set(r.lesson_word_id, status);
    }
    return out;
  } catch {
    return out;
  }
}

/**
 * Hoeveel woorden van dit onderdeel gekend zijn — het getal dat stap 1 van de leerroute draagt.
 *
 * Aparte, lichtere functie dan `fetchWordThemes`: het onderdeelscherm heeft alleen de twee
 * getallen nodig en niet 126 kaarten met hun vertalingen erbij.
 */
export async function fetchWordCounts(
  level: Level,
  onderdeel: OnderdeelSlug,
  userId: string | null,
): Promise<{ known: number; total: number }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_words')
      .select('id')
      .eq('level', level)
      .eq('onderdeel', onderdeel);

    const ids = (data ?? []).map(r => r.id as number);
    if (ids.length === 0) return { known: 0, total: 0 };

    const progress = await fetchWordProgress(userId, ids);
    const known = [...progress.values()].filter(s => s === 'known').length;
    return { known, total: ids.length };
  } catch {
    return { known: 0, total: 0 };
  }
}
