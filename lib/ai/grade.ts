import { generateObject, jsonSchema } from 'ai';
import {
  GRADER_AUDIO,
  GRADER_TEMPERATURE,
  GRADER_TEXT,
  GRADER_TIMEOUT_MS,
  assertGatewayConfigured,
} from './gateway';
import { describeSignals, type SpeechSignals } from './transcribe';
import { MAX_CRITERION_SCORE, type Rubric, type RubricCriterion } from '@/lib/rubrics';

/**
 * Applying a docent's rubric to one open answer.
 *
 * This is the only place a grading prompt exists. The shape of the whole thing follows from one
 * constraint: **the docent's criteria are the authority, the model is the instrument.** So the
 * rubric's own `system_prompt` goes first, the criteria and their four anchors are quoted verbatim,
 * and the model is told to pick an anchor — not to form an opinion about good Dutch.
 *
 * ## Why the output schema is built at runtime
 * The criterion keys live in `rubrics.criteria`, authored by the docent and different per category.
 * A static Zod object cannot express "one entry per key in this database row", so the schema is
 * assembled per call with `jsonSchema()` and the keys pinned to an `enum`. That turns "the model
 * invented a criterion" and "the model skipped one" into validation failures the SDK retries,
 * instead of silently short rows in `open_criterion_scores`.
 *
 * ## Few-shot
 * Examples come from `grading_examples WHERE use_as_fewshot` — submissions the docent corrected and
 * then promoted. Examples with `use_as_fewshot = false` are the **test set** and must never be fed
 * in here; that split is what makes /admin/beoordeling/evals mean anything.
 */

export type GradeCriterionResult = {
  key: string;
  score: number;
  feedback: string;
};

export type GradeResult = {
  criteria: GradeCriterionResult[];
  overall: string;
  tips: string[];
};

/** The task, loaded server-side. Includes fields never sent to the browser (`model_answer`). */
export type GradeTask = {
  id: number;
  task_type: string;
  title: string | null;
  prompt_html: string | null;
  bullet_points: unknown;
  email_to: string | null;
  email_cc: string | null;
  email_subject: string | null;
  greeting: string | null;
  closing: string | null;
  min_sentences: number | null;
  form_schema: unknown;
  image_usage: 'none' | 'describe' | 'choose' | 'cover_all';
  max_record_seconds: number;
  model_answer: string | null;
  images: { sort_order: number; caption: string | null; alt_text: string | null; group_label: string | null }[];
};

export type GradeAnswer = {
  answer_text: string | null;
  answer_json: Record<string, unknown> | null;
  transcript: string | null;
  audio_seconds: number | null;
  speech_signals: SpeechSignals | null;
  /** WAV bytes for Spreken. Present ⇒ the audio model is used and the audio is attached. */
  audio: Uint8Array | null;
};

export type FewShotExample = {
  answer_text: string | null;
  transcript: string | null;
  teacher_result: unknown;
  notes: string | null;
};

const IMAGE_RULE: Record<GradeTask['image_usage'], string> = {
  none: '',
  describe: 'De kandidaat moest steeds het plaatje gebruiken in het antwoord.',
  choose: 'De kandidaat moest één plaatje kiezen en die keuze toelichten.',
  cover_all: 'De kandidaat moest alle plaatjes gebruiken.',
};

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** The rubric, quoted so the model has the anchors rather than a paraphrase of them. */
function renderRubric(rubric: Rubric): string {
  const lines: string[] = ['BEOORDELINGSCRITERIA VAN DE DOCENT', ''];
  for (const c of rubric.criteria) {
    lines.push(`### ${c.criterion}  (sleutel: ${c.key})`);
    if (c.description) lines.push(c.description);
    for (const level of ['0', '1', '2', '3'] as const) {
      lines.push(`  ${level} = ${c.anchors[level]}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

/** What the candidate was asked to do. */
function renderTask(task: GradeTask): string {
  const lines: string[] = ['DE OPDRACHT', ''];
  if (task.title) lines.push(`Titel: ${task.title}`);
  const prompt = stripHtml(task.prompt_html);
  if (prompt) lines.push(prompt);

  const bullets = asStringArray(task.bullet_points);
  if (bullets.length) {
    lines.push('', 'De kandidaat moest deze punten behandelen:');
    for (const b of bullets) lines.push(`- ${b}`);
  }

  if (task.task_type === 'email') {
    const chrome = [
      task.email_to && `Aan: ${task.email_to}`,
      task.email_cc && `Cc: ${task.email_cc}`,
      task.email_subject && `Onderwerp: ${task.email_subject}`,
    ].filter((s): s is string => Boolean(s));
    if (chrome.length) lines.push('', 'De e-mail stond al klaar met:', ...chrome);
    if (task.greeting || task.closing) {
      lines.push(
        '',
        `Aanhef ("${task.greeting ?? ''}") en afsluiting ("${task.closing ?? ''}") waren ` +
          'voorgedrukt. Reken die niet mee als eigen werk van de kandidaat.'
      );
    }
  }

  if (task.min_sentences) {
    lines.push('', `Gevraagd: minimaal ${task.min_sentences} zinnen.`);
  }

  if (task.images.length) {
    lines.push('', `Bij de opdracht stonden ${task.images.length} plaatje(s):`);
    for (const img of [...task.images].sort((a, b) => a.sort_order - b.sort_order)) {
      const label = [img.group_label, img.caption ?? img.alt_text]
        .filter((s): s is string => Boolean(s))
        .join(' — ');
      lines.push(`- ${label || '(geen omschrijving)'}`);
    }
    // Captions are content ("gestolen", "kapot"): the candidate was meant to use those words, so
    // the grader needs them even though it never sees the pictures themselves.
    lines.push(
      'Je ziet de plaatjes zelf niet. Bovenstaande omschrijvingen zijn wat er op staat; ' +
        'woorden bij een plaatje horen in het antwoord gebruikt te worden.'
    );
  }

  const rule = IMAGE_RULE[task.image_usage];
  if (rule) lines.push('', rule);

  if (task.model_answer?.trim()) {
    lines.push(
      '',
      'VOORBEELDANTWOORD VAN DE DOCENT (een antwoord dat volledig voldoet; niet de enige ' +
        'goede uitwerking — gebruik het als maatstaf, niet als sjabloon):',
      task.model_answer.trim()
    );
  }

  return lines.join('\n');
}

function renderAnswer(task: GradeTask, answer: GradeAnswer): string {
  const lines: string[] = ['HET ANTWOORD VAN DE KANDIDAAT', ''];

  if (answer.answer_json && Object.keys(answer.answer_json).length > 0) {
    lines.push('Ingevuld formulier:');
    for (const [k, v] of Object.entries(answer.answer_json)) {
      lines.push(`- ${k}: ${v === '' || v == null ? '(leeg gelaten)' : String(v)}`);
    }
  }

  if (answer.answer_text?.trim()) {
    lines.push(answer.answer_text.trim());
  }

  if (answer.transcript != null) {
    lines.push(
      '',
      'Transcriptie van de opname (automatisch, kan fouten bevatten — de opname zelf is ' +
        'leidend):',
      answer.transcript.trim() || '(geen spraak herkend)'
    );
  }

  if (answer.speech_signals) {
    lines.push(
      '',
      'GEMETEN SIGNALEN uit de opname (feiten, geen beoordeling):',
      describeSignals(answer.speech_signals, task.max_record_seconds, answer.audio_seconds)
    );
  }

  if (
    !answer.answer_text?.trim() &&
    !answer.transcript?.trim() &&
    !(answer.answer_json && Object.keys(answer.answer_json).length)
  ) {
    lines.push('(De kandidaat heeft niets ingeleverd.)');
  }

  return lines.join('\n');
}

function renderFewShot(examples: FewShotExample[]): string {
  if (examples.length === 0) return '';
  const lines: string[] = [
    'EERDER DOOR DE DOCENT BEOORDEELD',
    '',
    'Dit zijn echte antwoorden met de cijfers die de docent zelf gaf. Gebruik ze om te ijken ' +
      'hoe streng of mild deze criteria bedoeld zijn.',
    '',
  ];
  for (const [i, ex] of examples.entries()) {
    lines.push(`--- voorbeeld ${i + 1} ---`);
    const body = (ex.answer_text ?? ex.transcript ?? '').trim();
    lines.push(`Antwoord: ${body || '(leeg)'}`);
    lines.push(`Beoordeling van de docent: ${JSON.stringify(ex.teacher_result)}`);
    if (ex.notes?.trim()) lines.push(`Toelichting van de docent: ${ex.notes.trim()}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

/**
 * The output contract, pinned to this rubric's criterion keys.
 *
 * `enum` on the keys plus `minItems`/`maxItems` equal to the criterion count is what forces one
 * entry per criterion. Without it the model happily returns three of five and the percentage
 * silently changes meaning.
 */
function buildSchema(criteria: RubricCriterion[]) {
  const keys = criteria.map(c => c.key);
  return jsonSchema<GradeResult>({
    type: 'object',
    additionalProperties: false,
    required: ['criteria', 'overall', 'tips'],
    properties: {
      criteria: {
        type: 'array',
        minItems: keys.length,
        maxItems: keys.length,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['key', 'score', 'feedback'],
          properties: {
            key: { type: 'string', enum: keys, description: 'De sleutel van het criterium.' },
            score: {
              type: 'integer',
              minimum: 0,
              maximum: MAX_CRITERION_SCORE,
              description: 'Het cijfer van het anker dat het antwoord het beste beschrijft.',
            },
            feedback: {
              type: 'string',
              description:
                'Eén of twee korte zinnen in eenvoudig Nederlands (A2), gericht aan de ' +
                'kandidaat met "je". Noem iets concreets uit het antwoord.',
            },
          },
        },
      },
      overall: {
        type: 'string',
        description: 'Twee of drie zinnen samenvatting, in eenvoudig Nederlands, met "je".',
      },
      tips: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: { type: 'string' },
        description: 'Concrete dingen die de kandidaat de volgende keer anders kan doen.',
      },
    },
  });
}

const BASE_INSTRUCTION = [
  'Je past de beoordelingscriteria van een NT2-docent toe op het antwoord van een kandidaat die',
  'het Nederlandse inburgeringsexamen op A2-niveau oefent.',
  '',
  'Regels:',
  '- Gebruik alleen de criteria en ankerbeschrijvingen die je krijgt. Voeg niets toe.',
  '- Kies per criterium het anker dat het antwoord het beste beschrijft en geef dat cijfer.',
  '- A2 is een beginnersniveau. Eenvoudige zinnen met fouten zijn normaal en horen geen laag',
  '  cijfer te krijgen zolang de boodschap duidelijk is.',
  '- Beoordeel wat er staat, niet wat je had gehoopt te lezen of horen.',
  '- Schrijf alle feedback in het Nederlands op A2-niveau: korte zinnen, "je", gewone woorden.',
  '- Geef geen herschreven modelantwoord.',
].join('\n');

/**
 * Grade one answer. Throws on model or validation failure; the caller records that on the
 * submission (`grade_error`) so the docent sees a stuck answer instead of a silent gap.
 */
export async function gradeOpenAnswer({
  rubric,
  task,
  answer,
  examples = [],
}: {
  rubric: Rubric;
  task: GradeTask;
  answer: GradeAnswer;
  examples?: FewShotExample[];
}): Promise<GradeResult> {
  assertGatewayConfigured();

  if (rubric.criteria.length === 0) {
    throw new Error(`Rubriek ${rubric.id} heeft geen criteria — er valt niets te beoordelen.`);
  }

  const system = [
    rubric.system_prompt?.trim() || BASE_INSTRUCTION,
    '',
    renderRubric(rubric),
  ].join('\n');

  const parts = [renderTask(task), renderFewShot(examples), renderAnswer(task, answer)]
    .filter(Boolean)
    .join('\n\n---\n\n');

  const useAudio = answer.audio != null && answer.audio.byteLength > 0;

  const content: Parameters<typeof generateObject>[0]['messages'] = [
    {
      role: 'user',
      content: useAudio
        ? [
            { type: 'text' as const, text: parts },
            {
              type: 'text' as const,
              text:
                'Hieronder de opname zelf. Beoordeel uitspraak en verstaanbaarheid op basis van ' +
                'wat je hoort, niet op basis van de transcriptie. Een accent is geen fout.',
            },
            { type: 'file' as const, mediaType: 'audio/wav', data: answer.audio! },
          ]
        : [{ type: 'text' as const, text: parts }],
    },
  ];

  const { object } = await generateObject({
    model: useAudio ? GRADER_AUDIO : GRADER_TEXT,
    schema: buildSchema(rubric.criteria),
    system,
    messages: content,
    temperature: GRADER_TEMPERATURE,
    abortSignal: AbortSignal.timeout(GRADER_TIMEOUT_MS),
  });

  const result = object as GradeResult;

  // The schema pins the keys, but a provider that ignores `enum` would otherwise write rows keyed
  // to a criterion the rubric does not have — invisible in the UI, fatal to every chart.
  const known = new Set(rubric.criteria.map(c => c.key));
  const unknownKeys = result.criteria.filter(c => !known.has(c.key)).map(c => c.key);
  if (unknownKeys.length) {
    throw new Error(`Beoordeling bevat onbekende criteria: ${unknownKeys.join(', ')}`);
  }
  const missing = [...known].filter(k => !result.criteria.some(c => c.key === k));
  if (missing.length) {
    throw new Error(`Beoordeling mist criteria: ${missing.join(', ')}`);
  }

  return result;
}
