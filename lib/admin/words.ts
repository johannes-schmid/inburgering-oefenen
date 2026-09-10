/**
 * De leerwoorden voor `/admin/woorden`.
 *
 * Server-only. Apart van `lib/lessons/words-server.ts`, dat de portaalkant leest: daar is een
 * woord altijd onderdeel van een deck of een lijst en hangt de query aan een les, hier is de rij
 * zélf het onderwerp en moet élke kolom mee — inclusief de kolommen die het portaal nooit toont
 * (`review_status`, `translations_reviewed`).
 *
 * **Door `fetchAll`, niet door een kale `select()`.** Die kapt stil op 1.000 rijen. Vandaag zijn
 * het 126 woorden voor A2-Lezen, maar dit scherm is precies de plek waar een docent er honderden
 * bij gaat zetten, en een lijst die stil op duizend stopt is een lijst die liegt over wat er is.
 */

import { createClient } from '@/lib/supabase/server';
import { fetchAll } from '@/lib/admin/fetch-all';
import type { Level, SkillSlug } from '@/data/skills';

export type AdminWord = {
  id: number;
  level: Level;
  onderdeel: string;
  theme: string;
  dutch: string;
  article: string | null;
  plural: string | null;
  frame: string | null;
  meaning_nl: string;
  example: string | null;
  usage: 'receptief' | 'productief';
  audio_url: string | null;
  sort_order: number;
  review_status: 'pending' | 'validated';
  translation_en: string | null;
  translation_ar: string | null;
  translations_reviewed: boolean;
};

export async function fetchAdminWords(level: Level, onderdeel: SkillSlug): Promise<AdminWord[]> {
  try {
    const supabase = await createClient();
    return await fetchAll<AdminWord>((from, to) => supabase
      .from('lesson_words')
      // Als letterlijke string en niet als constante: de gegenereerde Supabase-types parsen de
      // selectie op typeniveau, en een variabele wordt daar een `GenericStringError`.
      .select('id, level, onderdeel, theme, dutch, article, plural, frame, meaning_nl, example, usage, audio_url, sort_order, review_status, translation_en, translation_ar, translations_reviewed')
      .eq('level', level)
      .eq('onderdeel', onderdeel)
      .order('theme')
      .order('sort_order')
      .range(from, to));
  } catch {
    // De leegvorm en geen throw: hetzelfde als in `lessons-server.ts`. Een onbereikbare tabel moet
    // een leeg scherm geven met zijn tabs erop, niet een 500 op /admin.
    return [];
  }
}
