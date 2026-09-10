/**
 * Hoe een lesitem wordt weggeschreven. Eén kopie, want de regels zijn niet te raden.
 *
 * De leerlaag was tot nu toe alleen-lezen in `/admin`: de seeder schreef de items en de docent
 * kon ze vrijgeven of terugtrekken, niets ertussenin. Dit is de schrijfkant, en hij erft vier
 * regels van `question-write.ts` en de migratie van de leerlaag:
 *
 *   1. **Opties worden per label gereconcilieerd, nooit verwijderd en opnieuw ingevoegd.** Een
 *      delete cascadeert stil naar wat kandidaten hebben gekozen. Bij `lesson_item_options` staat
 *      dat antwoord in `user_concept_mastery`-tellingen in plaats van in een kolom, maar de vorm
 *      is dezelfde en de gewoonte mag niet per tabel verschillen.
 *   2. **Elke optierij gaat eerst `is_correct: false` de deur uit**, en één ervan wordt daarna
 *      omgezet. `lesson_item_options_one_correct_idx` is `UNIQUE (item_id) WHERE is_correct`, dus
 *      het nieuwe juiste antwoord wegschrijven terwijl het oude nog waar is, is een dubbele
 *      sleutel.
 *   3. **Omgesorteerde items worden eerst geparkeerd op een negatieve `sort_order`.**
 *      `lesson_items_sort_key` is DEFERRABLE, maar uitstel helpt alleen *binnen één transactie* en
 *      PostgREST doet elk request in zijn eigen. Twee items omwisselen faalt daarom op de eerste
 *      UPDATE. Dit staat zelfs als commentaar op de constraint in de migratie.
 *   4. **De validatie is `validateItem` uit `lib/lessons/items.ts`**, niet een tweede lijst hier.
 *      Dat is dezelfde functie die de seeder en de generator gebruiken; een eigen set regels in de
 *      editor zou betekenen dat de docent iets kan opslaan wat de seeder afkeurt.
 *
 * Client-veilig: neemt de Supabase-client als argument in plaats van er een te maken, zodat dit in
 * een browsercomponent draait zonder `lib/supabase/server` de bundle in te trekken.
 */

import {
  GAP, isExerciseKind, validateItem,
  type ItemKind, type LessonItem, type OptionLabel, type Tier,
} from '@/lib/lessons/items';

export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export type LessonOptionDraft = {
  id?: number;
  label: OptionLabel;
  body: string;
  is_correct: boolean;
};

export type LessonItemDraft = {
  id?: number;
  kind: ItemKind;
  sort_order: number;
  tier: Tier | null;
  /** De vorm die bij `kind` hoort. Los getypeerd omdat de editor hem veld voor veld bouwt. */
  payload: Record<string, unknown>;
  explanation: string;
  options: LessonOptionDraft[];
};

/**
 * De leegvorm per soort.
 *
 * Elk veld dat het schema verplicht stelt staat er als lege string of lege lijst in, zodat de
 * editor een veld kan tekenen zonder per soort te weten wat er hoort te bestaan. Waar het schema
 * een minimum aantal rijen eist (`gap_choice.choices` ≥ 2, `matchen.pairs` ≥ 2) staan die rijen er
 * al: een nieuw item dat meteen rood is omdat er nog geen rij bestaat om te vullen, leest als een
 * fout in de editor in plaats van als werk dat nog moet gebeuren.
 */
const BLANK_PAYLOADS: Record<ItemKind, () => Record<string, unknown>> = {
  uitleg: () => ({ body_html: '', cards: [] }),
  voorbeeld: () => ({ sentence_html: '', note: null }),
  leestekst: () => ({ title: '', body_html: '', source: null, words: [], marks: [], audio_url: null }),
  audio: () => ({ audio_url: '', label: null, transcript: null }),
  video: () => ({ video_url: '', poster_url: null, label: null, seconds: null }),
  woordenlijst: () => ({ theme: '', word_ids: [] }),
  zinnenbank: () => ({ columns: [{ heading: '', phrases: [''] }] }),
  mcq: () => ({ prompt: '', intro: null, layout: 'text' }),
  gap_choice: () => ({ sentence: `Hij woont ${GAP} Amsterdam.`, choices: ['', ''], answer: '' }),
  gap_type: () => ({ sentence: `Hij woont ${GAP} Amsterdam.`, answer: '', accept: [], hint: null }),
  woordorde: () => ({ instruction: null, tokens: ['', '', ''], answer: ['', '', ''] }),
  matchen: () => ({ instruction: null, pairs: [{ left: '', right: '' }, { left: '', right: '' }] }),
  open_zin: () => ({ prompt: '', starter: null, model_answer: '', checklist: [] }),
  markeren: () => ({ instruction: '', body_html: '', targets: [{ label: '', text: '' }] }),
  naspreken: () => ({ prompt: null, target: '', focus: '', audio_url: null, script: null, voice_key: null }),
  opnemen: () => ({
    prompt: '', intro: null, image_urls: [], image_alt: null,
    model_answer: '', checklist: [],
    // 60 seconden is wat het examen per spreekopdracht geeft; zie TASK_RULES in data/skills.ts.
    record_seconds: 60,
  }),
};

/** Een nieuw item van deze soort, op deze plek in de stroom. */
export function blankItem(kind: ItemKind, sortOrder: number): LessonItemDraft {
  return {
    kind,
    sort_order: sortOrder,
    // Een opgave heeft altijd een trap; trap 0 is de receptieve, waar een reeks meestal begint.
    tier: isExerciseKind(kind) ? 0 : null,
    payload: BLANK_PAYLOADS[kind](),
    explanation: '',
    options: kind === 'mcq'
      ? OPTION_LABELS.slice(0, 3).map((label, i) => ({
        label, body: '', is_correct: i === 0,
      }))
      : [],
  };
}

/** Een item uit de database, klaar om bewerkt te worden. */
export function toDraft(item: LessonItem): LessonItemDraft {
  return {
    id: item.id,
    kind: item.kind,
    sort_order: item.sort_order,
    tier: item.tier,
    payload: { ...(item.payload as Record<string, unknown>) },
    explanation: item.explanation ?? '',
    options: item.options.map(o => ({
      id: o.id,
      label: o.label,
      body: o.body ?? '',
      is_correct: o.is_correct,
    })),
  };
}

/**
 * Wat er mis is met dit item, in de woorden van de docent — of `null`.
 *
 * Loopt door `validateItem`, dus door de zod-schema's plus de vier regels die tussen de kolommen
 * liggen. De eerste melding is genoeg: ze staan naast het item en een lijst van zeven regels over
 * één ontbrekend veld helpt niemand.
 */
export function validateDraft(d: LessonItemDraft, index?: number): string | null {
  const issues = validateItem(toValidatable(d), index ?? 0);
  if (issues.length === 0) return null;
  const where = index == null ? '' : `Item ${index + 1}: `;
  return `${where}${issues[0].message}`;
}

/** De vorm die `validateItem` verwacht. */
function toValidatable(d: LessonItemDraft) {
  return {
    kind: d.kind,
    sort_order: d.sort_order,
    tier: d.tier,
    payload: cleanPayload(d.payload),
    explanation: d.explanation.trim() || null,
    section_slug: null,
    options: d.options.map((o, i) => ({
      label: o.label,
      body: o.body.trim(),
      image_urls: [],
      image_alt: null,
      is_correct: o.is_correct,
      sort_order: i + 1,
    })),
  };
}

/**
 * Trim de payload en gooi de lege staarten van lijsten weg.
 *
 * De editor houdt een lege rij onderaan een lijst aan zodat er iets is om in te typen; die rij mag
 * niet als leeg element de database in, want `nonEmpty` keurt hem af en de docent ziet dan een
 * fout over een rij die ze nooit bewust heeft gemaakt.
 */
function cleanPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Een leeg optioneel veld hoort `null` te zijn en geen lege string: `nonEmpty` zou de lege
      // string afkeuren op een veld dat helemaal niet ingevuld hoefde te worden.
      out[key] = trimmed === '' ? null : trimmed;
      continue;
    }
    if (Array.isArray(value)) {
      out[key] = value
        .map(v => (typeof v === 'string' ? v.trim() : v))
        .filter(v => {
          if (typeof v === 'string') return v !== '';
          if (v && typeof v === 'object') {
            return Object.values(v as Record<string, unknown>)
              .some(x => (typeof x === 'string' ? x.trim() !== '' : x != null));
          }
          return v != null;
        })
        .map(v => (v && typeof v === 'object' && !Array.isArray(v) ? cleanPayload(v as Record<string, unknown>) : v));
      continue;
    }
    out[key] = value;
  }
  // `body_html` en vrienden mogen niet null worden — `safeHtml` eist een string. De null die
  // hierboven is gezet blijft staan; het schema meldt hem als "verplicht", wat klopt.
  return out;
}

/** Minimale vorm van de Supabase-client die dit nodig heeft. */
type Db = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

/**
 * Schrijf de hele inhoud van één les weg: de items, hun opties en de verwijderde rijen.
 *
 * De volgorde is niet verwisselbaar:
 *
 *   1. **Parkeren.** Elk bewaard item waarvan de plek verschuift, gaat eerst op `-id`.
 *   2. **Schrijven.** Per item de rij, dan de opties (false-first, per label gereconcilieerd,
 *      juiste antwoord als laatste omgezet).
 *   3. **Verwijderen.** Als laatste, zodat een fout halverwege niets heeft weggegooid.
 *
 * Gooit bij de eerste databasefout, zodat de aanroeper niet elke stap hoeft door te geven.
 */
export async function saveLessonItems(
  supabase: Db,
  lessonId: number,
  drafts: LessonItemDraft[],
  removedIds: number[],
  /** Waar elk bewaard item **in de database** staat — niet waar het concept zegt dat het staat. */
  savedOrder: Map<number, number>,
): Promise<void> {
  const moved = drafts.filter(d => d.id && savedOrder.get(d.id) !== d.sort_order);
  for (const d of moved) {
    const { error } = await supabase.from('lesson_items').update({ sort_order: -d.id! }).eq('id', d.id!);
    if (error) throw new Error(error.message);
  }

  for (const d of drafts) {
    const row = {
      lesson_id: lessonId,
      sort_order: d.sort_order,
      kind: d.kind,
      tier: d.tier,
      payload: cleanPayload(d.payload),
      explanation: d.explanation.trim() || null,
    };

    let itemId = d.id;
    if (itemId) {
      const { data, error } = await supabase.from('lesson_items').update(row).eq('id', itemId).select('id');
      if (error) throw new Error(error.message);
      // Een door RLS geweigerde UPDATE geeft 200 met nul rijen en is anders niet van succes te
      // onderscheiden — de val die dit project al twee keer heeft gehad.
      if (!data?.length) throw new Error(`item ${itemId} is niet gewijzigd (0 rijen)`);
    } else {
      const { data, error } = await supabase.from('lesson_items').insert(row).select('id').single();
      if (error) throw new Error(error.message);
      itemId = (data as { id: number }).id;
    }

    if (d.kind !== 'mcq') {
      // Een soort die geen opties draagt kan er wel eens gehad hebben — een mcq die `gap_type`
      // is geworden. `validateItem` keurt losse optierijen af, dus ze moeten echt weg.
      const { error } = await supabase.from('lesson_item_options').delete().eq('item_id', itemId!);
      if (error) throw new Error(error.message);
      continue;
    }

    const optionRows = d.options.map((o, i) => ({
      item_id: itemId!,
      label: o.label,
      sort_order: i + 1,
      body: o.body.trim(),
      is_correct: false,
    }));
    const up = await supabase
      .from('lesson_item_options')
      .upsert(optionRows, { onConflict: 'item_id,label' });
    if (up.error) throw new Error(up.error.message);

    const kept = d.options.map(o => o.label);
    const del = await supabase
      .from('lesson_item_options')
      .delete()
      .eq('item_id', itemId!)
      .not('label', 'in', `(${kept.join(',')})`);
    if (del.error) throw new Error(del.error.message);

    const correct = d.options.find(o => o.is_correct);
    if (correct) {
      const cor = await supabase
        .from('lesson_item_options')
        .update({ is_correct: true })
        .eq('item_id', itemId!)
        .eq('label', correct.label);
      if (cor.error) throw new Error(cor.error.message);
    }
  }

  for (const id of removedIds) {
    const { error } = await supabase.from('lesson_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
