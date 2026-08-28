/**
 * De conceptenbibliotheek en de remediatie. Server-only.
 *
 * Dit is de helft van de leerlaag die het bestaansrecht draagt: zonder
 * `question_concepts` / `open_task_concepts` weet een kandidaat na een gezakt examen dát het
 * fout ging en niet wát hij moet leren.
 */

import { createClient } from '@/lib/supabase/server';
import { ownsKnm, ownsModule } from '@/lib/entitlements';
import {
  KNM_SLUG, SKILLS, isKnm, isSkillSlug,
  type Level, type OnderdeelSlug,
} from '@/data/skills';
import {
  conceptPath, coursePath, lessonPath, masteryPct,
  type Concept, type ConceptDetail, type ConceptGroup, type ConceptKind,
  type ConceptTrack, type Mastery,
} from './lessons';

type Meta = Record<string, unknown> | null;

const CONCEPT_SELECT = `
  id, level, slug, name_nl, kind, one_liner, example_html, sort_order,
  concept_groups ( id, slug, name_nl, sort_order ),
  concept_onderdelen ( onderdeel )
`;

/** Zelfde kolommen, maar met een inner join zodat het onderdeelfilter echt filtert. */
const CONCEPT_SELECT_SCOPED = `
  id, level, slug, name_nl, kind, one_liner, example_html, sort_order,
  concept_groups ( id, slug, name_nl, sort_order ),
  concept_onderdelen!inner ( onderdeel )
`;

type ConceptRow = {
  id: number; level: Level; slug: string; name_nl: string; kind: ConceptKind;
  one_liner: string; example_html: string | null; sort_order: number;
  concept_groups: ConceptGroup | null;
  concept_onderdelen: { onderdeel: OnderdeelSlug }[] | null;
  body_html?: string | null;
  review_status?: string;
  reviewed_by?: string | null;
  reviewed_on?: string | null;
};

function toConcept(row: ConceptRow): Concept {
  return {
    id: row.id,
    level: row.level,
    slug: row.slug,
    name_nl: row.name_nl,
    kind: row.kind,
    one_liner: row.one_liner,
    example_html: row.example_html,
    group: row.concept_groups,
    onderdelen: (row.concept_onderdelen ?? []).map(o => o.onderdeel),
  };
}

/**
 * De conceptenbibliotheek van één niveau.
 *
 * Optioneel gefilterd op onderdeel: dat is wat een kandidaat die alleen Luisteren heeft
 * gekocht op zijn cursuspagina ziet. Het filter gaat over `concept_onderdelen`, dus een
 * `grammatica`-concept komt in meerdere onderdelen terug en een `strategie`-concept in precies
 * één — dat verschil is het hele antwoord op "hoe bereid je iemand voor die alleen Luisteren
 * doet".
 */
export async function fetchConcepts(
  level: Level,
  onderdeel?: OnderdeelSlug,
): Promise<Concept[]> {
  try {
    const supabase = await createClient();

    // Twee aparte queries in plaats van één met een omgebouwde selectstring: de selectstring
    // is deel van het type van de builder, dus hem met `.replace()` samenstellen laat de
    // getypte client de rijvorm verliezen en levert een onbegrijpelijke fout twintig regels
    // verderop.
    //
    // `!inner` op het onderdeelfilter is dragend. Een left join met een filter op de
    // rechterkant geeft de linkerrij terug met een lege array, dus zonder inner zou élk
    // ongetagd concept in élk onderdeel opduiken.
    const { data, error } = onderdeel
      ? await supabase.from('concepts').select(CONCEPT_SELECT_SCOPED)
          .eq('level', level)
          .eq('review_status', 'validated')
          .eq('concept_onderdelen.onderdeel', onderdeel)
          .order('sort_order')
      : await supabase.from('concepts').select(CONCEPT_SELECT)
          .eq('level', level)
          .eq('review_status', 'validated')
          .order('sort_order');

    if (error || !data) return [];

    const concepts = (data as unknown as ConceptRow[]).map(toConcept);

    // Het onderdeelfilter maakt van `concept_onderdelen` een lijst van één; de chips moeten
    // álle onderdelen tonen ("KOMT IN LEZEN · SCHRIJVEN"), dus die worden apart opgehaald.
    if (onderdeel && concepts.length) {
      const chips = await fetchChips(concepts.map(c => c.id));
      for (const c of concepts) c.onderdelen = chips.get(c.id) ?? c.onderdelen;
    }
    return concepts;
  } catch {
    return [];
  }
}

async function fetchChips(conceptIds: number[]): Promise<Map<number, OnderdeelSlug[]>> {
  const out = new Map<number, OnderdeelSlug[]>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('concept_onderdelen')
      .select('concept_id, onderdeel')
      .in('concept_id', conceptIds);
    for (const r of data ?? []) {
      const list = out.get(r.concept_id) ?? [];
      list.push(r.onderdeel as OnderdeelSlug);
      out.set(r.concept_id, list);
    }
    return out;
  } catch {
    return out;
  }
}

/** Eén concept met zijn uitleg. */
export async function fetchConcept(level: Level, slug: string): Promise<ConceptDetail | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('concepts')
      .select(`${CONCEPT_SELECT}, body_html, review_status, reviewed_by, reviewed_on`)
      .eq('level', level)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as ConceptRow;
    return {
      ...toConcept(row),
      body_html: row.body_html ?? null,
      review_status: (row.review_status ?? 'pending') as ConceptDetail['review_status'],
      reviewed_by: row.reviewed_by ?? null,
      reviewed_on: row.reviewed_on ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * De sporen van één concept: waar het geoefend kan worden en of deze kandidaat daar toegang
 * tot heeft.
 *
 * **Het filter is per spoor, niet per niveau.** `ownsModule(meta, level, skill)` per onderdeel,
 * niet "bezit één ding op dit niveau" — anders krijgt iemand die alleen A2 Luisteren heeft
 * gekocht alle vier de sporen als bezit gerenderd, en dat is chrome die zegt dat je iets hebt
 * waar de speler je uit gooit. Precies de fout die de zijbalk op 27-08 maakte.
 *
 * Een niet-bezeten spoor wordt gerenderd als aanbod en niet weggelaten: het concept is dan
 * smaller dan het is, en de kandidaat kan niet zien wat hij zou krijgen.
 */
export async function fetchConceptTracks(
  conceptId: number,
  level: Level,
  meta: Meta,
): Promise<ConceptTrack[]> {
  const teachers = await fetchTeachingLessons(conceptId);

  const tracks: ConceptTrack[] = [];
  for (const skill of SKILLS) {
    const key = `${level}:${skill.slug}`;
    const lesson = teachers.get(key) ?? null;
    tracks.push({
      onderdeel: skill.slug,
      level,
      lesson,
      owned: ownsModule(meta, level, skill.slug),
      href: lesson
        ? lessonPath(level, skill.slug, lesson.slug)
        : coursePath(level, skill.slug),
    });
  }

  // KNM alleen als het concept er een les voor heeft. Het is niet-geniveleerd, dus het hoort
  // niet automatisch bij een A2- of B1-concept — en een leeg KNM-spoor op elke conceptkaart
  // zou de kandidaat een onderdeel aanraden dat over iets anders gaat.
  const knmLesson = teachers.get(KNM_SLUG) ?? null;
  if (knmLesson) {
    tracks.push({
      onderdeel: KNM_SLUG,
      level: null,
      lesson: knmLesson,
      owned: ownsKnm(meta),
      href: `/dashboard/knm`,
    });
  }

  return tracks;
}

type TeacherLesson = { id: number; slug: string; title: string; blockLetter: string };

/**
 * Per (niveau, onderdeel) de les die dit concept uitlegt.
 *
 * `role = 'teaches'` en niet 'reviews': de remediatie moet één bestemming hebben, en een
 * les die er alleen op terugkomt is niet waar je heen wilt als je het net fout deed. De
 * database dwingt af dat er maximaal één per onderdeel is (`lesson_concepts_one_teacher`).
 */
async function fetchTeachingLessons(conceptId: number): Promise<Map<string, TeacherLesson>> {
  const out = new Map<string, TeacherLesson>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_concepts')
      .select(`
        lessons!inner (
          id, slug, title, review_status,
          lesson_blocks!inner ( letter, level, onderdeel )
        )
      `)
      .eq('concept_id', conceptId)
      .eq('role', 'teaches')
      .eq('lessons.review_status', 'validated');

    type Row = {
      lessons: {
        id: number; slug: string; title: string;
        lesson_blocks: { letter: string; level: Level | null; onderdeel: OnderdeelSlug };
      };
    };

    for (const r of (data ?? []) as unknown as Row[]) {
      const b = r.lessons.lesson_blocks;
      const key = b.level ? `${b.level}:${b.onderdeel}` : b.onderdeel;
      out.set(key, { id: r.lessons.id, slug: r.lessons.slug, title: r.lessons.title, blockLetter: b.letter });
    }
    return out;
  } catch {
    return out;
  }
}

// ---------------------------------------------------------------------------
// De remediatie: van foute antwoorden naar concepten
// ---------------------------------------------------------------------------

export type ConceptAdvice = {
  concept: Concept;
  /** Hoeveel van de foute antwoorden dit concept raakt. */
  misses: number;
  /** De zwaarste `weight` waarmee het aan een van die vragen hangt (1..3). */
  weight: number;
  /** Waar je het herstelt — de les die het uitlegt in dit onderdeel, of de cursus. */
  href: string;
  lessonTitle: string | null;
};

/**
 * Welke concepten verklaren deze foute antwoorden?
 *
 * Dit is het resultaatscherm na een examen. Gesorteerd op hoe vaak een concept in de fouten
 * terugkomt en daarna op gewicht, zodat de aanbeveling niet verdund wordt door concepten die
 * de fout niet verklaren — `weight` onderscheidt "deze vraag stáát of valt hiermee" van "het
 * komt er ook in voor".
 *
 * Geeft een lege lijst als niets getagd is. Dat is de eerlijke uitkomst en niet een fout: een
 * examen waarvan de items nog niet gekoppeld zijn kan niets aanbevelen, en het scherm zegt dan
 * niets in plaats van iets te verzinnen.
 */
export async function fetchConceptAdvice(
  wrongQuestionIds: number[],
  level: Level,
  onderdeel: OnderdeelSlug,
  limit = 4,
): Promise<ConceptAdvice[]> {
  if (!wrongQuestionIds.length) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('question_concepts')
      .select(`concept_id, weight, concepts!inner ( ${CONCEPT_SELECT}, review_status )`)
      .in('question_id', wrongQuestionIds)
      .eq('concepts.level', level)
      .eq('concepts.review_status', 'validated');

    if (error || !data) return [];

    type Row = { concept_id: number; weight: number; concepts: ConceptRow };

    const tally = new Map<number, { concept: Concept; misses: number; weight: number }>();
    for (const r of (data as unknown as Row[])) {
      const cur = tally.get(r.concept_id);
      if (cur) {
        cur.misses += 1;
        cur.weight = Math.max(cur.weight, r.weight);
      } else {
        tally.set(r.concept_id, { concept: toConcept(r.concepts), misses: 1, weight: r.weight });
      }
    }

    const ranked = [...tally.values()]
      .sort((a, b) => b.misses - a.misses || b.weight - a.weight)
      .slice(0, limit);

    // De bestemming per concept: de les die het in dít onderdeel uitlegt. Eén query per
    // concept, en dat is er ten hoogste `limit` — geen reden voor een join die de rest van
    // deze module ingewikkelder maakt.
    return await Promise.all(ranked.map(async r => {
      const teachers = await fetchTeachingLessons(r.concept.id);
      const key = isKnm(onderdeel) ? KNM_SLUG : `${level}:${onderdeel}`;
      const lesson = teachers.get(key) ?? null;
      return {
        concept: r.concept,
        misses: r.misses,
        weight: r.weight,
        lessonTitle: lesson?.title ?? null,
        href: lesson && isSkillSlug(onderdeel)
          ? lessonPath(level, onderdeel, lesson.slug)
          : conceptPath(level, r.concept.slug),
      };
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Beheersing
// ---------------------------------------------------------------------------

/** De beheersing van deze kandidaat, per concept-id. */
export async function fetchMastery(
  userId: string | null,
  conceptIds?: number[],
): Promise<Map<number, Mastery>> {
  const out = new Map<number, Mastery>();
  if (!userId) return out;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('user_concept_mastery')
      .select(`concept_id, seen, correct, streak, mastery_pct,
               seen_receptief, correct_receptief, seen_productief, correct_productief`)
      .eq('user_id', userId);

    if (conceptIds?.length) query = query.in('concept_id', conceptIds);

    const { data } = await query;
    for (const r of (data ?? []) as Mastery[]) out.set(r.concept_id, r);
    return out;
  } catch {
    return out;
  }
}

/**
 * Werk de beheersing van één concept bij na een antwoord.
 *
 * Server-side omdat het over meerdere rijen rekent en omdat een client die zijn eigen
 * beheersing mag schrijven hem ook mag verzinnen. Read-modify-write en geen atomaire
 * increment: PostgREST kent geen `col = col + 1`, en een RPC hiervoor zou de enige in deze
 * laag zijn. Het risico is een verloren update bij twee antwoorden in dezelfde tel — dat kost
 * één punt beheersing en is de complexiteit van een lock niet waard.
 */
export async function recordConceptAnswer(
  userId: string,
  conceptId: number,
  wasCorrect: boolean,
  bucket: 'receptief' | 'productief',
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('user_concept_mastery')
      .select(`seen, correct, streak, seen_receptief, correct_receptief,
               seen_productief, correct_productief`)
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .maybeSingle();

    const base = existing ?? {
      seen: 0, correct: 0, streak: 0,
      seen_receptief: 0, correct_receptief: 0, seen_productief: 0, correct_productief: 0,
    };

    const next = {
      seen: base.seen + 1,
      correct: base.correct + (wasCorrect ? 1 : 0),
      // Eén fout antwoord zet de reeks terug op nul. Dat is de bedoeling: "nog 8 goede
      // antwoorden op rij" moet iets betekenen, en een reeks die fouten overslaat betekent niets.
      streak: wasCorrect ? base.streak + 1 : 0,
      seen_receptief: base.seen_receptief + (bucket === 'receptief' ? 1 : 0),
      correct_receptief: base.correct_receptief + (bucket === 'receptief' && wasCorrect ? 1 : 0),
      seen_productief: base.seen_productief + (bucket === 'productief' ? 1 : 0),
      correct_productief: base.correct_productief + (bucket === 'productief' && wasCorrect ? 1 : 0),
    };

    const { error } = await supabase
      .from('user_concept_mastery')
      .upsert({
        user_id: userId,
        concept_id: conceptId,
        ...next,
        mastery_pct: masteryPct(next),
      }, { onConflict: 'user_id,concept_id' });

    // Nooit stil. Een weggegooid resultaat is een verdwenen feature tot je het tegendeel hebt
    // gecontroleerd — dat heeft `user_leren_progress` deze codebase al gekost.
    if (error) console.error('[lessons] beheersing niet bijgewerkt', error.message);
  } catch (e) {
    console.error('[lessons] beheersing niet bijgewerkt', e);
  }
}

/**
 * Op welke niveaus staat er een vrijgegeven conceptenbibliotheek?
 *
 * De portaalchrome heeft dit nodig om te beslissen of een module een "Concepten"-rij krijgt.
 * Het is een **feit over de content** en geen feature flag: `FEATURES.leren` is één boolean en
 * kan niet zeggen "A2 leeft, B1 nog niet", en een tweede vlag ernaast zou een tweede
 * schakelaar voor hetzelfde ding zijn die met de eerste uit elkaar gaat lopen. Zelfde koppeling
 * als de `robots`-gate voor B1, die op `itemCount !== null` staat.
 */
export async function fetchConceptLevels(): Promise<Set<Level>> {
  const out = new Set<Level>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('concepts')
      .select('level')
      .eq('review_status', 'validated');
    for (const r of data ?? []) out.add(r.level as Level);
    return out;
  } catch {
    return out;
  }
}
