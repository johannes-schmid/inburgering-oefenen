import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import {
  MAX_TARGET_WORDS,
  MIN_TARGET_WORDS,
  reviseQuestions,
  rewriteStimulusLength,
} from '@/lib/ai/rewrite';
import { countWords, stripHtml, stripSpeakers } from '@/lib/admin/length-targets';
import { isLevel, isSkillSlug } from '@/data/skills';
import { OPTION_LABELS, type OptionLabel } from '@/lib/admin/question-write';

/**
 * "Herschrijf naar N woorden" and "Vragen bijwerken".
 *
 * Returns objects for form fields; **writes nothing**, like `/api/admin/suggest-item` and
 * `/api/admin/draft-content`. It cannot save a fragment, cannot publish one and cannot move
 * `review_status` to `validated` — the docent reads the rewrite and saves it herself.
 *
 * Admin-only: it spends gateway credits per call and the content it reads and returns is exam
 * material.
 *
 * Everything the model returns is re-validated here rather than trusted:
 * - The rewritten field must be non-empty, or the docent's text would be replaced by nothing.
 * - A revised question keeps **exactly** the labels and option count it was sent with, and
 *   exactly one correct option. A dropped or added option would cascade
 *   `user_question_results.chosen_option_id` to NULL at save time and erase what past candidates
 *   picked; two correct options cannot be saved at all
 *   (`question_options_one_correct_idx`).
 * - `changed: false` questions are dropped from the response, so an unchanged question is never
 *   patched with a re-typed copy of itself.
 */

/** One line of steering, not a place to paste a document. */
const MAX_INSTRUCTION = 300;

/** Far past any A2 or B1 fragment, and past anything worth paying to tokenise. */
const MAX_CONTENT = 8000;

/** More than any fragment carries — A2 Lezen is 1–3 vragen, B1 Lezen 4–7. */
const MAX_QUESTIONS = 12;

type Body = {
  target?: unknown;
  level?: unknown;
  skill?: unknown;
  kind?: unknown;
  targetWords?: unknown;
  intro?: unknown;
  title?: unknown;
  content?: unknown;
  instruction?: unknown;
  stimulusText?: unknown;
  questions?: unknown;
};

type IncomingQuestion = {
  sort_order: number;
  prompt: string;
  explanation: string;
  options: { label: OptionLabel; body: string; is_correct: boolean }[];
};

function parseQuestions(raw: unknown): IncomingQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: IncomingQuestion[] = [];
  for (const q of raw.slice(0, MAX_QUESTIONS)) {
    if (!q || typeof q !== 'object') continue;
    const r = q as Record<string, unknown>;
    if (typeof r.sort_order !== 'number' || typeof r.prompt !== 'string') continue;
    const options = Array.isArray(r.options)
      ? r.options
          .filter(
            (o): o is { label: OptionLabel; body: string; is_correct: boolean } =>
              !!o &&
              typeof o === 'object' &&
              OPTION_LABELS.includes((o as { label?: unknown }).label as OptionLabel) &&
              typeof (o as { body?: unknown }).body === 'string'
          )
          .map(o => ({ label: o.label, body: o.body, is_correct: Boolean(o.is_correct) }))
      : [];
    if (options.length < 2) continue;
    out.push({
      sort_order: r.sort_order,
      prompt: r.prompt,
      explanation: typeof r.explanation === 'string' ? r.explanation : '',
      options,
    });
  }
  return out;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const level = isLevel(body.level) ? body.level : null;
  if (!level) return NextResponse.json({ error: 'Onbekend niveau.' }, { status: 400 });

  const skill = typeof body.skill === 'string' ? body.skill : '';
  if (!isSkillSlug(skill)) return NextResponse.json({ error: 'Onbekend onderdeel.' }, { status: 400 });

  try {
    if (body.target === 'stimulus') {
      const kind = body.kind === 'audio' ? 'audio' : body.kind === 'text' ? 'text' : null;
      if (!kind) {
        return NextResponse.json(
          { error: 'Herschrijven kan alleen bij een tekst- of audiofragment.' },
          { status: 400 }
        );
      }

      const content = typeof body.content === 'string' ? body.content.trim().slice(0, MAX_CONTENT) : '';
      if (!content) {
        return NextResponse.json(
          { error: 'Er is nog geen tekst om te herschrijven. Schrijf eerst iets, of gebruik “Magisch invullen”.' },
          { status: 400 }
        );
      }

      const asked = Number(body.targetWords);
      if (!Number.isFinite(asked) || asked < MIN_TARGET_WORDS || asked > MAX_TARGET_WORDS) {
        return NextResponse.json(
          { error: `Geef een doellengte tussen ${MIN_TARGET_WORDS} en ${MAX_TARGET_WORDS} woorden.` },
          { status: 400 }
        );
      }
      const targetWords = Math.round(asked);

      // Counted the way the meter under the field counts, so the number the docent sees and the
      // number the prompt is given can never disagree.
      const currentWords = countWords(kind === 'audio' ? stripSpeakers(content) : stripHtml(content));

      const out = await rewriteStimulusLength({
        level,
        skill,
        kind,
        targetWords,
        currentWords,
        intro: typeof body.intro === 'string' ? body.intro : '',
        title: typeof body.title === 'string' ? body.title : '',
        content,
        instruction:
          typeof body.instruction === 'string'
            ? body.instruction.slice(0, MAX_INSTRUCTION).trim() || undefined
            : undefined,
      });

      const rewritten = (kind === 'text' ? out.body_html : out.script).trim();
      if (!rewritten) {
        return NextResponse.json(
          { error: 'Het voorstel kwam leeg terug. Probeer het nog eens.' },
          { status: 502 }
        );
      }

      const words = countWords(kind === 'audio' ? stripSpeakers(rewritten) : stripHtml(rewritten));

      return NextResponse.json({
        rewrite: {
          kind,
          body_html: kind === 'text' ? rewritten : '',
          script: kind === 'audio' ? rewritten : '',
          note: out.note ?? '',
          words,
          targetWords,
          previousWords: currentWords,
        },
      });
    }

    if (body.target === 'questions') {
      const stimulusText =
        typeof body.stimulusText === 'string' ? body.stimulusText.trim().slice(0, MAX_CONTENT) : '';
      if (!stimulusText) {
        return NextResponse.json(
          { error: 'Dit fragment heeft nog geen tekst om de vragen tegen te controleren.' },
          { status: 400 }
        );
      }

      const questions = parseQuestions(body.questions);
      if (questions.length === 0) {
        return NextResponse.json(
          { error: 'Er staan nog geen vragen op dit fragment om bij te werken.' },
          { status: 400 }
        );
      }

      const out = await reviseQuestions({ level, skill, stimulusText, questions });

      const bySort = new Map(questions.map(q => [q.sort_order, q]));
      const revised: {
        sort_order: number;
        prompt: string;
        explanation: string;
        options: { label: OptionLabel; body: string; is_correct: boolean }[];
        reason: string;
      }[] = [];
      const skipped: number[] = [];

      for (const r of out.questions) {
        const original = bySort.get(r.sort_order);
        if (!original) continue;
        if (!r.changed) { skipped.push(r.sort_order); continue; }

        // Rebuilt from the *original* label list rather than from what came back: the shape of a
        // question is not something a length rewrite may change, and a missing label here would
        // otherwise reach the save as a deleted option row.
        const byLabel = new Map(r.options.map(o => [o.label, o]));
        const options = original.options.map(o => {
          const next = byLabel.get(o.label);
          return {
            label: o.label,
            body: (next?.body ?? o.body).trim() || o.body,
            is_correct: next ? next.is_correct : o.is_correct,
          };
        });

        // Exactly one correct. Falling back to the original key rather than to A: if the model
        // marked none, the docent's own answer key is the better guess than the first option.
        const correct = options.filter(o => o.is_correct);
        if (correct.length !== 1) {
          const keep =
            correct[0]?.label ?? original.options.find(o => o.is_correct)?.label ?? options[0].label;
          for (const o of options) o.is_correct = o.label === keep;
        }

        revised.push({
          sort_order: r.sort_order,
          prompt: r.prompt.trim() || original.prompt,
          explanation: r.explanation.trim() || original.explanation,
          options,
          reason: r.reason ?? '',
        });
      }

      return NextResponse.json({ revision: { revised, skipped } });
    }

    return NextResponse.json({ error: 'Onbekend doel.' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[rewrite-length]', body.target, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
