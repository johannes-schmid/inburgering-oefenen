/**
 * Welke velden één lesitem heeft, per soort.
 *
 * Zestien soorten met elk hun eigen payload betekent zonder deze tabel zestien formulieren, en
 * dat is veertien plekken waar een veld dat het schema verplicht stelt kan ontbreken. Deze spec is
 * de brug tussen `PAYLOAD_SCHEMAS` in `lib/lessons/items.ts` en één generieke renderer: elk veld
 * hier hoort bij precies één sleutel in dat schema, en de vorm (`html`, `strings`, `rows`) zegt
 * alleen hoe je het invult — nooit of het geldig is. Dat blijft `validateItem`.
 *
 * **Deze lijst mag niet uit de pas lopen met de schema's.** Een nieuwe soort krijgt hier een
 * regel; een soort die er geen heeft, valt in de editor terug op de rauwe JSON in plaats van
 * onzichtbaar te zijn — een leeg formulier voor een bestaand item is hoe content stil verdwijnt.
 */

import { GAP, type ItemKind } from '@/lib/lessons/items';

export type Field =
  /** Eén regel platte tekst. */
  | { type: 'line'; key: string; label: string; hint?: string }
  /** Meerdere regels met beperkte inline-HTML (`<em>`, `<strong>`, `<mark>`). */
  | { type: 'html'; key: string; label: string; hint?: string; rows?: number }
  /** Een geheel getal, of leeg. */
  | { type: 'number'; key: string; label: string; hint?: string }
  /** Een vaste keuze. */
  | { type: 'select'; key: string; label: string; choices: readonly string[]; hint?: string }
  /** Een lijst losse regels — chips, tokens, markeringen, checklistregels. */
  | { type: 'strings'; key: string; label: string; hint?: string }
  /** Een lijst getallen — vandaag alleen `woordenlijst.word_ids`. */
  | { type: 'numbers'; key: string; label: string; hint?: string }
  /** Een lijst rijtjes met vaste kolommen — kaarten, woordhulp, paren, doelen. */
  | { type: 'rows'; key: string; label: string; columns: { key: string; label: string }[]; hint?: string }
  /** De kolommen van een zinnenbank: een kop met een lijst frasen eronder. */
  | { type: 'columns'; key: string; label: string; hint?: string };

const GAP_HINT = `Schrijf het gat als ${GAP} (drie underscores). Precies één per zin.`;

export const ITEM_FIELDS: Record<ItemKind, Field[]> = {
  uitleg: [
    { type: 'html', key: 'body_html', label: 'De regel', rows: 6, hint: 'De uitleg zelf. <em> en <strong> mogen.' },
    {
      type: 'rows', key: 'cards', label: 'Voorbeeldkaarten', hint: 'Maximaal drie, bijvoorbeeld "MET HEBBEN" / "MET ZIJN".',
      columns: [{ key: 'label', label: 'Kop' }, { key: 'example_html', label: 'Voorbeeld' }],
    },
  ],
  voorbeeld: [
    { type: 'html', key: 'sentence_html', label: 'De zin', rows: 3, hint: 'Zet <mark> om het fragment dat het concept toont.' },
    { type: 'line', key: 'note', label: 'Noot' },
  ],
  leestekst: [
    { type: 'line', key: 'title', label: 'Titel' },
    { type: 'line', key: 'source', label: 'Bron' },
    { type: 'html', key: 'body_html', label: 'De tekst', rows: 10 },
    {
      type: 'rows', key: 'words', label: 'Woordhulp', hint: 'Het woord moet letterlijk in de tekst staan.',
      columns: [{ key: 'word', label: 'Woord' }, { key: 'meaning', label: 'Betekenis' }],
    },
    { type: 'strings', key: 'marks', label: 'Te markeren fragmenten', hint: 'Strings die letterlijk in de tekst voorkomen — geen posities.' },
    { type: 'line', key: 'audio_url', label: 'Audio-URL' },
  ],
  audio: [
    { type: 'line', key: 'audio_url', label: 'Audio-URL' },
    { type: 'line', key: 'label', label: 'Label' },
    { type: 'html', key: 'transcript', label: 'Transcript', rows: 6 },
  ],
  video: [
    { type: 'line', key: 'video_url', label: 'Video-URL' },
    { type: 'line', key: 'poster_url', label: 'Poster-URL' },
    { type: 'number', key: 'seconds', label: 'Duur (seconden)' },
    { type: 'line', key: 'label', label: 'Label' },
  ],
  woordenlijst: [
    { type: 'line', key: 'theme', label: 'Thema' },
    { type: 'numbers', key: 'word_ids', label: 'Woord-ids', hint: 'De woorden zelf staan in lesson_words; hier staan alleen hun ids.' },
  ],
  zinnenbank: [
    { type: 'columns', key: 'columns', label: 'Kolommen', hint: 'Eén kolom per communicatief doel.' },
  ],
  mcq: [
    { type: 'html', key: 'prompt', label: 'De vraag', rows: 3 },
    { type: 'line', key: 'intro', label: 'Intro' },
    { type: 'select', key: 'layout', label: 'Opmaak van de opties', choices: ['text', 'image', 'image_grid'] },
  ],
  gap_choice: [
    { type: 'line', key: 'sentence', label: 'De zin', hint: GAP_HINT },
    { type: 'strings', key: 'choices', label: 'Chips', hint: 'Twee tot zes.' },
    { type: 'line', key: 'answer', label: 'Juiste chip', hint: 'Moet letterlijk één van de chips zijn.' },
  ],
  gap_type: [
    { type: 'line', key: 'sentence', label: 'De zin', hint: GAP_HINT },
    { type: 'line', key: 'answer', label: 'Juiste antwoord' },
    { type: 'strings', key: 'accept', label: 'Ook goed', hint: "Varianten die ook goed zijn — \"z'n\" naast \"zijn\"." },
    { type: 'line', key: 'hint', label: 'Hint' },
  ],
  woordorde: [
    { type: 'html', key: 'instruction', label: 'Opdrachtregel', rows: 2 },
    { type: 'strings', key: 'tokens', label: 'Woorden zoals ze aangeboden worden', hint: 'Drie tot twaalf.' },
    { type: 'strings', key: 'answer', label: 'De juiste volgorde', hint: 'Dezelfde woorden, in de goede volgorde.' },
  ],
  matchen: [
    { type: 'html', key: 'instruction', label: 'Opdrachtregel', rows: 2 },
    {
      type: 'rows', key: 'pairs', label: 'Paren', hint: 'Twee tot acht.',
      columns: [{ key: 'left', label: 'Links' }, { key: 'right', label: 'Rechts' }],
    },
  ],
  open_zin: [
    { type: 'html', key: 'prompt', label: 'De opdracht', rows: 3 },
    { type: 'line', key: 'starter', label: 'Voorzet' },
    { type: 'html', key: 'model_answer', label: 'Voorbeeldantwoord', rows: 3, hint: 'De cursist vergelijkt hier zelf mee — dit is geen beoordelingssleutel.' },
    { type: 'strings', key: 'checklist', label: 'Checklist' },
  ],
  markeren: [
    { type: 'html', key: 'instruction', label: 'Opdrachtregel', rows: 2 },
    { type: 'html', key: 'body_html', label: 'De tekst', rows: 8 },
    {
      type: 'rows', key: 'targets', label: 'Te vinden', hint: 'De tekst moet letterlijk in de tekst hierboven staan.',
      columns: [{ key: 'label', label: 'Label' }, { key: 'text', label: 'Tekst' }],
    },
  ],
  naspreken: [
    { type: 'html', key: 'prompt', label: 'Opdrachtregel', rows: 2 },
    { type: 'line', key: 'target', label: 'De zin die de cursist nazegt' },
    { type: 'line', key: 'focus', label: 'Waar moet hij op letten', hint: 'Bijvoorbeeld: de -lijk klinkt als -luk.' },
    { type: 'line', key: 'audio_url', label: 'Audio-URL van het voorbeeld', hint: 'Leeg zolang het nog niet is ingesproken — de opgave zegt dat dan zelf.' },
    { type: 'html', key: 'script', label: 'Inspreektekst', rows: 3, hint: 'De brontekst voor de TTS-run. Nakijken wát er gezegd wordt gebeurt hier.' },
    { type: 'line', key: 'voice_key', label: 'Stem', hint: 'Een sleutel uit data/tts-voices.json — nooit een ElevenLabs-id.' },
  ],
  opnemen: [
    { type: 'html', key: 'prompt', label: 'De opdracht', rows: 3 },
    { type: 'line', key: 'intro', label: 'Intro' },
    { type: 'strings', key: 'image_urls', label: 'Plaatjes', hint: 'URLs in onze eigen Storage.' },
    { type: 'line', key: 'image_alt', label: 'Alt-tekst bij de plaatjes' },
    { type: 'html', key: 'model_answer', label: 'Voorbeeldantwoord', rows: 3, hint: 'De cursist vergelijkt hier zelf mee — dit is geen beoordelingssleutel.' },
    { type: 'strings', key: 'checklist', label: 'Checklist' },
    { type: 'number', key: 'record_seconds', label: 'Spreektijd (seconden)', hint: 'Het examen geeft 60 seconden per opdracht.' },
  ],
};

/** Wat er in de kop van een itemkaart staat. */
export const KIND_LABEL: Record<ItemKind, string> = {
  uitleg: 'Uitleg',
  voorbeeld: 'Voorbeeld',
  leestekst: 'Leestekst',
  audio: 'Audio',
  video: 'Video',
  woordenlijst: 'Woordenlijst',
  zinnenbank: 'Zinnenbank',
  mcq: 'Meerkeuze',
  gap_choice: 'Gat met chips',
  gap_type: 'Gat, zelf typen',
  woordorde: 'Woordorde',
  matchen: 'Matchen',
  open_zin: 'Open zin',
  markeren: 'Markeren',
  naspreken: 'Naspreken',
  opnemen: 'Opnemen',
};

/**
 * De regel die in de dichtgeklapte kaart staat, zodat de docent een item herkent zonder het te
 * openen. Per soort een ander veld, want "de eerste string in de payload" is bij `leestekst` de
 * bron en bij `mcq` de intro.
 */
export function itemSummary(kind: ItemKind, payload: Record<string, unknown>): string {
  const pick = (key: string) => {
    const v = payload[key];
    return typeof v === 'string' ? v : '';
  };
  // Een `switch` en geen object-literal: in een literal worden **alle** takken uitgerekend, en
  // `payload.answer.join(' ')` voor `woordorde` liep dan ook op een `gap_type` — waar `answer` een
  // string is. Dat was een 500 op de hele pagina, voor een regel samenvattingstekst.
  let raw = '';
  switch (kind) {
    case 'uitleg': raw = pick('body_html'); break;
    case 'voorbeeld': raw = pick('sentence_html'); break;
    case 'leestekst': raw = pick('title'); break;
    case 'audio': raw = pick('label') || pick('audio_url'); break;
    case 'video': raw = pick('label') || pick('video_url'); break;
    case 'woordenlijst': raw = pick('theme'); break;
    case 'zinnenbank': raw = ''; break;
    case 'mcq': raw = pick('prompt'); break;
    case 'gap_choice':
    case 'gap_type': raw = pick('sentence'); break;
    case 'woordorde':
      raw = Array.isArray(payload.answer) ? (payload.answer as string[]).join(' ') : '';
      break;
    case 'matchen':
    case 'markeren': raw = pick('instruction'); break;
    case 'open_zin': raw = pick('prompt'); break;
  }

  const text = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 110 ? `${text.slice(0, 108)}…` : text;
}
