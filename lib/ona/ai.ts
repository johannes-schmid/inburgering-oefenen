import { randomUUID } from 'node:crypto';
import { generateObject, jsonSchema } from 'ai';
import { GRADER_TEXT, GRADER_TIMEOUT_MS } from '@/lib/ai/gateway';
import { providerOf, recordAiUsage } from '@/lib/ai/usage';
import type { OnaCard } from '@/data/ona/cards';
import { ONA_GESPREK_BANK } from '@/data/ona/eindgesprek';
import { isAnswered, keepFlag, type OnaFlag } from './rules';

/**
 * De twee modelaanroepen van ONA. **Het model schrijft nooit een antwoord voor de kandidaat.**
 *
 * Dat is een productregel (het eindgesprek vraagt naar *jouw* redenen; een herschreven kaart is
 * fraude-gevoelig) en hij staat op drie plekken vast:
 *   1. de systeemprompt verbiedt het;
 *   2. het schema heeft geen veld waar een tekst in past, alleen een korte vraag;
 *   3. `keepFlag` gooit alles weg wat geen korte vraag is.
 *
 * Het model past de regels van de docent toe; het oordeel "geslaagd" bestaat hier niet. Zie
 * CLAUDE.md §2 (AI helpt, zij beslist) en `docs/decisions/ai-compliance.md`.
 */

const TAG = 'feature:ona';

const BASE_RULES = [
  'Je helpt iemand die het ONA-portfolio voor de inburgering invult. Hij schrijft in eenvoudig Nederlands (niveau A2).',
  'Je schrijft NOOIT een antwoord, een zin of een voorbeeld dat hij kan overnemen. Je verbetert geen taal en geen spelling.',
  'Je stelt alleen korte vragen in eenvoudig Nederlands: korte zinnen, "je" en niet "u", zonder moeilijke woorden.',
  'Je geeft geen cijfer en zegt nooit of iets goed genoeg is voor DUO.',
].join('\n');

/* ── De check van één kaart ─────────────────────────────────────────────────────────────────── */

export async function checkOnaCard(opts: {
  card: OnaCard;
  beroep: string;
  answers: Record<string, string>;
}): Promise<OnaFlag[]> {
  const { card, beroep, answers } = opts;
  const answered = card.prompts.filter(p => isAnswered(answers[p.id]));
  if (answered.length === 0) return [];

  const promptIds = answered.map(p => p.id);
  const schema = jsonSchema<{ flags: OnaFlag[] }>({
    type: 'object',
    additionalProperties: false,
    required: ['flags'],
    properties: {
      flags: {
        type: 'array',
        maxItems: 6,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['promptId', 'type', 'question'],
          properties: {
            promptId: { type: 'string', enum: promptIds },
            type: { type: 'string', enum: ['doorvragen', 'beroep', 'onvolledig'] },
            question: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
  });

  const system = [
    BASE_RULES,
    '',
    'Je leest één resultaatkaart. Je geeft per antwoord hooguit één vlag, en alleen als het nodig is:',
    '- "onvolledig": de vraag vraagt om een aantal dingen (bijvoorbeeld drie beroepen, twee namen) en er staan er minder.',
    `- "beroep": het antwoord lijkt niet over het gewenste beroep "${beroep}" te gaan. Vrijwilligerswerk is geen beroep.`,
    '- "doorvragen": het antwoord noemt iets zonder reden of voorbeeld. In het eindgesprek vraagt DUO dan "waarom?" of "kun je een voorbeeld geven?".',
    'Is een antwoord in orde? Geef dan geen vlag. Geen vlaggen is een goed resultaat.',
    'Het veld "question" is één vraag aan de kandidaat, die eindigt op een vraagteken en maximaal 25 woorden heeft. Noem daarin wat hij zelf schreef, maar geef geen antwoord.',
  ].join('\n');

  const body = [
    `Gewenst beroep: ${beroep}`,
    `Resultaatkaart ${card.number}: ${card.title}`,
    '',
    ...answered.map(p => `[${p.id}] Vraag: ${p.label}\nAntwoord: ${answers[p.id].trim()}`),
  ].join('\n');

  const requestId = randomUUID();
  try {
    const { object, usage } = await generateObject({
      model: GRADER_TEXT,
      schema,
      system,
      prompt: body,
      temperature: 0.2,
      providerOptions: { gateway: { tags: [TAG, 'ona:check'] } },
      abortSignal: AbortSignal.timeout(GRADER_TIMEOUT_MS),
    });
    void recordAiUsage({
      kind: 'ona_check', provider: providerOf(GRADER_TEXT), model: GRADER_TEXT, requestId,
      inputTokens: usage?.inputTokens ?? null, outputTokens: usage?.outputTokens ?? null,
    });
    const seen = new Set<string>();
    return (object.flags ?? []).filter(f => {
      if (seen.has(f.promptId) || !keepFlag(card, answers, f)) return false;
      seen.add(f.promptId);
      return true;
    }).map(f => ({ ...f, question: f.question.trim() }));
  } catch (err) {
    void recordAiUsage({
      kind: 'ona_check', provider: providerOf(GRADER_TEXT), model: GRADER_TEXT, requestId,
      ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'unknown',
    });
    throw err;
  }
}

/* ── Het oefengesprek ───────────────────────────────────────────────────────────────────────── */

export type GesprekTurn =
  | { role: 'vraag'; cardNo: number; text: string }
  | { role: 'antwoord'; text: string };

export type GesprekFeedbackItem = {
  /** Index van de vraag in het transcript (alleen vragen tellen). */
  vraag: number;
  uitgelegd: 'ja' | 'deels' | 'nee';
  /** Een vraag om over na te denken — geen voorbeeldantwoord. */
  denkvraag: string;
};

type CardContext = { card: OnaCard; answers: Record<string, string> };

function cardContextText(ctx: CardContext[]): string {
  return ctx.map(({ card, answers }) => {
    const lines = card.prompts
      .filter(p => isAnswered(answers[p.id]))
      .map(p => `  - ${p.label}\n    Hij schreef: ${answers[p.id].trim()}`);
    const bank = (ONA_GESPREK_BANK[card.number] ?? []).map(q => `  * ${q}`).join('\n');
    return `Kaart ${card.number} (${card.title}):\n${lines.join('\n')}\n  Vragen van de docent voor deze kaart:\n${bank}`;
  }).join('\n\n');
}

function transcriptText(turns: GesprekTurn[]): string {
  return turns.map(t => (t.role === 'vraag' ? `Examinator: ${t.text}` : `Kandidaat: ${t.text}`)).join('\n');
}

export async function nextGesprekQuestion(opts: {
  beroep: string;
  cards: CardContext[];
  turns: GesprekTurn[];
}): Promise<{ cardNo: number; text: string }> {
  const cardNos = opts.cards.map(c => c.card.number);
  const schema = jsonSchema<{ cardNo: number; question: string }>({
    type: 'object',
    additionalProperties: false,
    required: ['cardNo', 'question'],
    properties: {
      cardNo: { type: 'integer', enum: cardNos },
      question: { type: 'string', maxLength: 240 },
    },
  });

  const system = [
    BASE_RULES,
    '',
    'Je speelt een medewerker van DUO in het ONA-eindgesprek. Dit is oefenen.',
    'Je stelt steeds één vraag over wat de kandidaat zelf op zijn kaarten schreef. Je kiest een vraag uit de vragen van de docent en maakt hem persoonlijk met zijn eigen woorden.',
    'Gaf hij net een kort antwoord zonder reden of voorbeeld? Vraag dan door: "Waarom?", "Kun je een voorbeeld geven?", "Wat deed je toen?".',
    'Stel geen vraag twee keer. Wissel van kaart als een kaart genoeg besproken is. Beoordeel zijn antwoord niet.',
  ].join('\n');

  const prompt = [
    `Gewenst beroep: ${opts.beroep}`,
    '',
    cardContextText(opts.cards),
    '',
    opts.turns.length ? `Het gesprek tot nu toe:\n${transcriptText(opts.turns)}` : 'Het gesprek begint nu. Stel de eerste vraag.',
  ].join('\n');

  const requestId = randomUUID();
  const { object, usage } = await generateObject({
    model: GRADER_TEXT,
    schema,
    system,
    prompt,
    temperature: 0.5,
    providerOptions: { gateway: { tags: [TAG, 'ona:gesprek'] } },
    abortSignal: AbortSignal.timeout(GRADER_TIMEOUT_MS),
  });
  void recordAiUsage({
    kind: 'ona_gesprek', provider: providerOf(GRADER_TEXT), model: GRADER_TEXT, requestId,
    inputTokens: usage?.inputTokens ?? null, outputTokens: usage?.outputTokens ?? null,
  });
  const cardNo = cardNos.includes(object.cardNo) ? object.cardNo : cardNos[0];
  return { cardNo, text: object.question.trim() };
}

export async function gesprekFeedback(opts: {
  beroep: string;
  cards: CardContext[];
  turns: GesprekTurn[];
}): Promise<GesprekFeedbackItem[]> {
  const questionCount = opts.turns.filter(t => t.role === 'vraag').length;
  if (questionCount === 0) return [];

  const schema = jsonSchema<{ items: GesprekFeedbackItem[] }>({
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        maxItems: questionCount,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['vraag', 'uitgelegd', 'denkvraag'],
          properties: {
            vraag: { type: 'integer', minimum: 0, maximum: questionCount - 1 },
            uitgelegd: { type: 'string', enum: ['ja', 'deels', 'nee'] },
            denkvraag: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
  });

  const system = [
    BASE_RULES,
    '',
    'Het oefengesprek is voorbij. Kijk per vraag van de examinator (genummerd vanaf 0) naar het antwoord van de kandidaat.',
    'Vraag je één ding af: legde hij uit WAAROM, of gaf hij een voorbeeld? "ja", "deels" of "nee". Taalfouten tellen niet.',
    'Bij "deels" of "nee" geef je een denkvraag die hem helpt zijn eigen reden te vinden. Bij "ja" een korte vraag om nog verder te denken.',
    'De denkvraag eindigt op een vraagteken en bevat geen antwoord.',
  ].join('\n');

  let i = -1;
  const numbered = opts.turns.map(t => {
    if (t.role === 'vraag') { i += 1; return `[vraag ${i}] Examinator: ${t.text}`; }
    return `Kandidaat: ${t.text}`;
  }).join('\n');

  const requestId = randomUUID();
  const { object, usage } = await generateObject({
    model: GRADER_TEXT,
    schema,
    system,
    prompt: `Gewenst beroep: ${opts.beroep}\n\n${numbered}`,
    temperature: 0.2,
    providerOptions: { gateway: { tags: [TAG, 'ona:terugblik'] } },
    abortSignal: AbortSignal.timeout(GRADER_TIMEOUT_MS),
  });
  void recordAiUsage({
    kind: 'ona_gesprek', provider: providerOf(GRADER_TEXT), model: GRADER_TEXT, requestId,
    inputTokens: usage?.inputTokens ?? null, outputTokens: usage?.outputTokens ?? null,
  });
  return (object.items ?? [])
    .filter(it => it.denkvraag?.trim().endsWith('?'))
    .map(it => ({ ...it, denkvraag: it.denkvraag.trim() }));
}
