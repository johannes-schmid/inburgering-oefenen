// GEGENEREERD uit lib/lessons/items.ts door load-items.mjs. Niet bewerken, niet committen.
/**
 * De item-soorten van een les, en wat elk ervan in zijn payload draagt.
 *
 * Een les is ÉÉN lijst van items: uitlegblokken en opgaven door elkaar, op één `sort_order`.
 * Twee tabellen zou twee sorteringen betekenen die op elkaar moeten passen, en de hele
 * belofte van deze laag is dat je na de uitleg meteen oefent — dat is één lijst, niet twee
 * schermen.
 *
 * Dit bestand is de ENIGE waarheid over die payloads en is **client-veilig**: alleen types,
 * schema's en pure functies, geen enkele import uit `lib/supabase/*`. De queries staan in
 * `lessons-server.ts`. Dezelfde splitsing als `backlog.ts` / `backlog-server.ts`, en om
 * dezelfde reden: de editor is een clientcomponent, en één module zou `lib/supabase/server`
 * de browserbundle in sleuren en de build laten falen.
 *
 * Drie plekken lezen deze schema's en dat is het punt van hun bestaan:
 *   1. `scripts/lesson-content/generate.mjs` valideert wat het model teruggaf, vóór opslag;
 *   2. `scripts/lesson-content/seed.mjs` valideert opnieuw vóór het naar de database schrijft;
 *   3. `/admin/lessen/[id]` valideert bij het opslaan door de docent.
 *
 * Structured outputs weigeren `minItems > 1`, `maximum` en `minimum`, dus aantallen en
 * grenzen worden hier afgedwongen en niet in het JSON-schema dat het model krijgt.
 */
import { z } from 'zod';
// ---------------------------------------------------------------------------
// De soorten
// ---------------------------------------------------------------------------
/**
 * Elke soort die in een les kan staan. Moet gelijk blijven aan de CHECK op
 * `lesson_items.kind` — de database is de tweede muur, niet de eerste.
 */
export const ITEM_KINDS = [
    // uitleg en materiaal — vragen niets, hebben geen `tier`
    'uitleg', 'voorbeeld', 'leestekst', 'audio', 'video', 'woordenlijst', 'zinnenbank',
    // opgaven — hebben altijd een `tier` en een `explanation`
    'mcq', 'gap_choice', 'gap_type', 'woordorde', 'matchen', 'open_zin', 'markeren',
];
/**
 * De soorten die een antwoord vragen.
 *
 * Dit onderscheid draagt drie regels: alleen deze krijgen een `tier`, alleen deze verplichten
 * een `explanation`, en alleen deze tellen mee in de voortgang van een les. Een les die
 * alleen uit uitleg bestaat is geen halve les — maar hij is ook nooit "0 van 0 gedaan".
 */
export const EXERCISE_KINDS = [
    'mcq', 'gap_choice', 'gap_type', 'woordorde', 'matchen', 'open_zin', 'markeren',
];
const EXERCISE_SET = new Set(EXERCISE_KINDS);
export function isExerciseKind(kind) {
    return EXERCISE_SET.has(kind);
}
/**
 * De moeilijkheidstrap van een opgave.
 *
 * 0 = receptief (herkennen), 1 = ertussenin, 2 = productief (zelf maken). Geen sortering maar
 * een didactisch feit: het is waarom een les met alleen meerkeuzevragen niets bewijst, en het
 * is wat blok E laat zeggen "je kent dit receptief en je kunt het nog niet maken" in plaats
 * van een cijfer. Woordenschatopgaven beginnen op 1.
 */
export const TIERS = [0, 1, 2];
export const TIER_LABEL = {
    0: 'receptief',
    1: 'halfproductief',
    2: 'productief',
};
/** Voor `user_concept_mastery`, dat receptief en productief apart telt. */
export function tierBucket(tier) {
    // Trap 1 telt als productief: hij vraagt de kandidaat iets te máken, ook al is het met
    // steun. Hem bij receptief tellen zou het cijfer dat "je kunt dit zelf" moet betekenen
    // laten stijgen van opgaven waarin de helft al voorgezegd is.
    return tier === 0 ? 'receptief' : 'productief';
}
// ---------------------------------------------------------------------------
// Gedeelde bouwstenen
// ---------------------------------------------------------------------------
const nonEmpty = z.string().trim().min(1);
/**
 * Beperkte inline-HTML voor lesteksten.
 *
 * Niet gesanitiseerd hier — de content komt uit onze eigen pijplijn en uit `/admin`, en wordt
 * met `dangerouslySetInnerHTML` gerenderd zoals `data/guides` dat ook doet. Wat deze check
 * wél doet is het weren van de tags waar dat een echt gat zou zijn.
 */
const safeHtml = nonEmpty.refine(s => !/<\s*(script|iframe|object|embed|link|style|form)\b/i.test(s), { message: 'script/iframe/style/form zijn niet toegestaan in lescontent' });
/** Eén optielabel. Spiegelt `lesson_item_options.label`. */
export const OPTION_LABELS = ['A', 'B', 'C', 'D'];
/**
 * Opties staan NIET in de payload maar in `lesson_item_options`, precies zoals
 * `question_options`. Twee redenen: de partiële unique index die één juist antwoord afdwingt
 * kan niet in jsonb, en een optie die verwijderd wordt moet per label gereconcilieerd kunnen
 * worden in plaats van weggegooid en opnieuw ingevoegd — bij examenvragen zou dat
 * `user_question_results.chosen_option_id` op NULL zetten en wissen wat kandidaten kozen.
 */
export const optionInputSchema = z.object({
    label: z.enum(OPTION_LABELS),
    body: z.string().nullable().optional(),
    image_urls: z.array(z.string()).default([]),
    image_alt: z.string().nullable().optional(),
    is_correct: z.boolean(),
    sort_order: z.number().int().nonnegative(),
});
/**
 * Het gat in een zin, geschreven als `___` (drie underscores).
 *
 * Eén notatie, overal. De mockup schrijft het zo en de renderer splitst erop; een tweede
 * notatie (`{...}`, `[[gap]]`) zou betekenen dat de helft van de opgaven stil als platte
 * tekst rendert met het gat er zichtbaar in.
 */
export const GAP = '___';
const withOneGap = nonEmpty.refine(s => s.split(GAP).length === 2, { message: `de zin moet precies één gat bevatten, geschreven als ${GAP}` });
// ---------------------------------------------------------------------------
// De payloads, per soort
// ---------------------------------------------------------------------------
/** Uitleg: de regel, met optioneel twee voorbeeldkaarten ("MET HEBBEN" / "MET ZIJN"). */
export const uitlegPayload = z.object({
    body_html: safeHtml,
    cards: z.array(z.object({ label: nonEmpty, example_html: safeHtml })).max(3).default([]),
});
/** Eén voorbeeldzin; `<mark>` omsluit het fragment dat het concept toont. */
export const voorbeeldPayload = z.object({
    sentence_html: safeHtml,
    note: z.string().nullable().optional(),
});
/**
 * Een leestekst met woordhulp.
 *
 * `words` is de woordhulp naast de tekst (de oranje kolom in de mockup) en `marks` zijn de
 * grammaticale fragmenten. Beide zijn *strings die in de tekst voorkomen*, geen posities:
 * een index verschuift bij elke redactionele correctie en dan markeert de kolom stilzwijgend
 * het verkeerde woord.
 */
export const leestekstPayload = z.object({
    source: z.string().nullable().optional(),
    title: nonEmpty,
    body_html: safeHtml,
    words: z.array(z.object({ word: nonEmpty, meaning: nonEmpty })).default([]),
    marks: z.array(nonEmpty).default([]),
    audio_url: z.string().nullable().optional(),
});
export const audioPayload = z.object({
    audio_url: nonEmpty,
    label: z.string().nullable().optional(),
    transcript: z.string().nullable().optional(),
});
/**
 * Een lesvideo.
 *
 * De soort bestaat vanaf dag één en géén les vult hem (eigenaar, 27-08): de docent kan later
 * opnemen zonder migratie, en een les zonder video is geen gat — de geschreven uitleg *is* de
 * les.
 */
export const videoPayload = z.object({
    video_url: nonEmpty,
    poster_url: z.string().nullable().optional(),
    seconds: z.number().int().positive().nullable().optional(),
    label: z.string().nullable().optional(),
});
/**
 * De leerwoorden van deze les.
 *
 * Draagt alleen `word_ids` — de woorden zelf staan in `lesson_words`. Ze hier kopiëren zou
 * betekenen dat een correctie aan een woord op de ene plek landt en op de andere niet.
 */
export const woordenlijstPayload = z.object({
    theme: nonEmpty,
    word_ids: z.array(z.number().int().positive()).default([]),
});
/** "Handige zinnen": functionele frasen, gegroepeerd per communicatief doel. */
export const zinnenbankPayload = z.object({
    columns: z.array(z.object({
        heading: nonEmpty,
        phrases: z.array(nonEmpty).min(1),
    })).min(1),
});
/** Meerkeuze. Opties staan in `lesson_item_options`, niet hier. */
export const mcqPayload = z.object({
    prompt: nonEmpty,
    intro: z.string().nullable().optional(),
    layout: z.enum(['text', 'image', 'image_grid']).default('text'),
});
/** Zin met een gat en een woordbank van chips ("te / om / voor / dat"). */
export const gapChoicePayload = z.object({
    sentence: withOneGap,
    choices: z.array(nonEmpty).min(2).max(6),
    answer: nonEmpty,
}).refine(v => v.choices.includes(v.answer), {
    message: 'het juiste antwoord moet één van de aangeboden chips zijn',
    path: ['answer'],
});
/**
 * Zin met een gat en een vrij invoerveld.
 *
 * `accept` draagt de aanvaardbare varianten náást `answer`. Nodig omdat één juiste vorm vaak
 * meerdere spellingen heeft ("z'n"/"zijn") en een kandidaat die het goed heeft nooit te horen
 * mag krijgen dat het fout is. De vergelijking is genormaliseerd — zie `matchesTyped`.
 */
export const gapTypePayload = z.object({
    sentence: withOneGap,
    answer: nonEmpty,
    accept: z.array(nonEmpty).default([]),
    hint: z.string().nullable().optional(),
});
/** Woorden in de juiste volgorde slepen. `answer` is de juiste volgorde van `tokens`. */
export const woordordePayload = z.object({
    instruction: z.string().nullable().optional(),
    tokens: z.array(nonEmpty).min(3).max(12),
    answer: z.array(nonEmpty).min(3).max(12),
}).refine(v => v.tokens.length === v.answer.length
    && [...v.tokens].sort().join(' ') === [...v.answer].sort().join(' '), { message: 'answer moet dezelfde tokens bevatten als tokens, in de juiste volgorde', path: ['answer'] });
/** Koppelen: links een vorm, rechts een functie of betekenis. */
export const matchenPayload = z.object({
    instruction: z.string().nullable().optional(),
    pairs: z.array(z.object({ left: nonEmpty, right: nonEmpty })).min(2).max(8),
});
/**
 * Een vrije zin met een voorbeeldantwoord, dat de kandidaat zelf vergelijkt.
 *
 * Bewust NIET rubriek-beoordeeld: dat kost een modelcall per zin, en de Schrijven-rubrieken
 * bestaan om een hele opgave te beoordelen, niet één oefenzin. `model_answer` staat daarom
 * in de payload en mág de client bereiken — anders dan `open_tasks.model_answer`, dat een
 * beoordelingssleutel is en nooit naar een clientcomponent mag.
 */
export const openZinPayload = z.object({
    prompt: nonEmpty,
    starter: z.string().nullable().optional(),
    model_answer: nonEmpty,
    checklist: z.array(nonEmpty).default([]),
});
/**
 * Markeer in een tekst waar iets staat — de strategie-opgave uit blok C.
 *
 * `targets` zijn strings die letterlijk in `body_html` voorkomen, om dezelfde reden als bij
 * `leestekst.marks`: een positie verschuift bij elke redactie.
 */
export const markerenPayload = z.object({
    instruction: nonEmpty,
    body_html: safeHtml,
    targets: z.array(z.object({ label: nonEmpty, text: nonEmpty })).min(1).max(5),
});
// ---------------------------------------------------------------------------
// Het discriminated union
// ---------------------------------------------------------------------------
export const PAYLOAD_SCHEMAS = {
    uitleg: uitlegPayload,
    voorbeeld: voorbeeldPayload,
    leestekst: leestekstPayload,
    audio: audioPayload,
    video: videoPayload,
    woordenlijst: woordenlijstPayload,
    zinnenbank: zinnenbankPayload,
    mcq: mcqPayload,
    gap_choice: gapChoicePayload,
    gap_type: gapTypePayload,
    woordorde: woordordePayload,
    matchen: matchenPayload,
    open_zin: openZinPayload,
    markeren: markerenPayload,
};
/** Eén item zoals het de database in gaat. */
export const itemInputSchema = z.object({
    kind: z.enum(ITEM_KINDS),
    sort_order: z.number().int().nonnegative(),
    tier: z.union([z.literal(0), z.literal(1), z.literal(2)]).nullable().default(null),
    payload: z.unknown(),
    explanation: z.string().nullable().default(null),
    section_slug: z.string().nullable().default(null),
    options: z.array(optionInputSchema).default([]),
});
/**
 * Valideer één item volledig: zijn payload tegen zijn eigen schema, plus de vier regels die
 * tussen de kolommen liggen en die geen enkel payload-schema kan zien.
 *
 * Geeft een lijst meldingen terug in plaats van te gooien, omdat elke aanroeper ze anders
 * gebruikt: de generator geeft ze aan het model terug als *de regel die gebroken is* (nooit
 * "probeer opnieuw"), de seeder logt ze en stopt, en de editor zet ze naast het veld.
 */
export function validateItem(raw, index) {
    const base = itemInputSchema.safeParse(raw);
    if (!base.success) {
        return base.error.issues.map(i => ({
            index, kind: 'onbekend',
            message: `${i.path.join('.') || '(item)'}: ${i.message}`,
        }));
    }
    const item = base.data;
    const issues = [];
    const push = (message) => issues.push({ index, kind: item.kind, message });
    const payload = PAYLOAD_SCHEMAS[item.kind].safeParse(item.payload);
    if (!payload.success) {
        for (const i of payload.error.issues) {
            push(`payload.${i.path.join('.') || '(root)'}: ${i.message}`);
        }
    }
    const isExercise = isExerciseKind(item.kind);
    // 1. Alleen een opgave heeft een trap, en elke opgave heeft er één. Een uitlegblok met een
    //    tier zou meetellen in de beheersing van een concept zonder ooit iets gevraagd te hebben.
    if (isExercise && item.tier === null)
        push('een opgave moet een tier hebben (0, 1 of 2)');
    if (!isExercise && item.tier !== null)
        push('alleen een opgave heeft een tier');
    // 2. Elke opgave legt uit waarom het antwoord goed is. Zonder uitleg is de opgave een toets
    //    en geen les, en dit is de laag die moet léren.
    if (isExercise && !item.explanation?.trim())
        push('een opgave moet een explanation hebben');
    // 3. Alleen `mcq` heeft optierijen, en dan 3 of 4 met precies één juiste — dezelfde vorm
    //    als `question_options`, waar de partiële unique index dat afdwingt.
    if (item.kind === 'mcq') {
        if (item.options.length < 3 || item.options.length > 4) {
            push(`mcq heeft 3 of 4 opties, niet ${item.options.length}`);
        }
        const correct = item.options.filter(o => o.is_correct).length;
        if (correct !== 1)
            push(`mcq heeft precies één juist antwoord, niet ${correct}`);
        const labels = item.options.map(o => o.label);
        if (new Set(labels).size !== labels.length)
            push('mcq heeft een dubbel optielabel');
    }
    else if (item.options.length > 0) {
        push(`${item.kind} draagt geen optierijen`);
    }
    return issues;
}
/**
 * Valideer een hele lesinhoud.
 *
 * Naast de items zelf twee dingen die alleen over de lijst als geheel te zeggen zijn.
 */
export function validateItems(items) {
    const issues = items.flatMap((raw, i) => validateItem(raw, i));
    const parsed = items
        .map(raw => itemInputSchema.safeParse(raw))
        .filter(r => r.success)
        .map(r => r.data);
    // De sortering moet een echte ordening zijn. Twee items op dezelfde plek is in de database
    // een constraintfout; hier gevangen zodat de generator het hoort vóór de seeder faalt.
    const orders = parsed.map(i => i.sort_order);
    if (new Set(orders).size !== orders.length) {
        issues.push({ index: -1, kind: '(les)', message: 'twee items hebben dezelfde sort_order' });
    }
    // Een les zonder opgave is geen les in deze laag: uitleg en oefening horen in dezelfde
    // stroom te staan, en dat is precies wat deze laag toevoegt aan de gidsen die er al zijn.
    if (!parsed.some(i => isExerciseKind(i.kind))) {
        issues.push({ index: -1, kind: '(les)', message: 'een les moet minstens één opgave hebben' });
    }
    return issues;
}
// ---------------------------------------------------------------------------
// Nakijken
// ---------------------------------------------------------------------------
/**
 * Normaliseer een getypt antwoord voordat je het vergelijkt.
 *
 * Kleine letters, weggevallen accenten, rechte apostrof, dubbele spaties eruit, en
 * afsluitende punctuatie eraf. Een A2-kandidaat die "Omdat hij ziek is." typt heeft het goed,
 * en de opgave gaat niet over hoofdletters — hem daarop laten struikelen is de snelste manier
 * om een correcte les als kapot te laten voelen.
 */
export function normaliseTyped(s) {
    return s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[\u2018\u2019\u02bc]/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/[.!?,;:]+$/, '')
        .trim();
}
/** Is dit getypte antwoord goed? Vergelijkt tegen `answer` én elke variant in `accept`. */
export function matchesTyped(given, answer, accept = []) {
    const g = normaliseTyped(given);
    return g.length > 0 && [answer, ...accept].some(a => normaliseTyped(a) === g);
}
