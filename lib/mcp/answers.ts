import { createAdminClient } from '@/lib/supabase/admin';
import { fetchConceptAdvice } from '@/lib/lessons/concepts-server';
import { isKnm, isLevel, isOnderdeelSlug, type Level, type OnderdeelSlug } from '@/data/skills';
import type { McpContext } from './context';
import { canOpenExam, gateFor, siteUrl, tierFor } from './entitlement';
import type { McqVerdict, TaalregelHint, ToolOutcome } from './types';
import { staticItem } from './static-taster';

/**
 * Het antwoord nakijken — op de server, tegen `question_options.is_correct`.
 *
 * ChatGPT beslist nooit zelf of iets goed is. De vraag wordt met de service-sleutel gelezen (de
 * sleutel verlaat de server niet), de toegang wordt opnieuw beoordeeld (een anonieme gebruiker mag
 * alleen een vraag nakijken die hem is uitgedeeld; een gekoppeld account alleen een vraag uit een
 * examen dat hij mag openen), en het resultaat gaat als één rij naar `user_question_results` —
 * zonder `attempt_id`, het patroon van de losse oefenvragen op het dashboard. Daardoor telt het
 * mee in het vaardighedenpaneel en in `fetchConceptAdvice`, zonder dat die iets hoeven te weten
 * van ChatGPT.
 */
type QuestionRow = {
  id: number;
  prompt: string;
  explanation: string;
  exam_id: number;
  exams: { level: Level | null; skill: OnderdeelSlug; number: number; published: boolean; is_free: boolean };
  question_options: { id: number; label: string; body: string | null; is_correct: boolean }[];
};

export async function loadQuestion(questionId: number): Promise<QuestionRow | null> {
  const { data } = await createAdminClient()
    .from('questions')
    .select('id, prompt, explanation, exam_id, exams!inner(level, skill, number, published, is_free), question_options(id, label, body, is_correct)')
    .eq('id', questionId)
    .maybeSingle();
  const row = data as unknown as QuestionRow | null;
  if (!row || !row.exams?.published) return null;
  return row;
}

async function anonymousWasServed(subjectHash: string | null, q: QuestionRow): Promise<boolean> {
  if (!subjectHash) return q.exams.is_free && q.exams.number === 1;
  const { data } = await createAdminClient()
    .from('mcp_anonymous_usage')
    .select('served_question_ids')
    .eq('subject_hash', subjectHash)
    .eq('onderdeel', q.exams.skill)
    .eq('level', q.exams.level ?? '')
    .maybeSingle();
  return ((data as { served_question_ids?: number[] } | null)?.served_question_ids ?? []).includes(q.id);
}

/** De statische A2-taster: nakijken tegen `data/free-practice.ts`, niets opslaan. */
async function checkStatic(ctx: McpContext, questionId: number, label: 'A' | 'B' | 'C' | 'D'): Promise<ToolOutcome<McqVerdict>> {
  const hit = staticItem(questionId);
  if (!hit) return { ok: false, gate: gateFor('unavailable', 'a2', 'lezen') };
  if (ctx.kind === 'anonymous' && ctx.subjectHash) {
    const { data } = await createAdminClient()
      .from('mcp_anonymous_usage')
      .select('served_question_ids')
      .eq('subject_hash', ctx.subjectHash)
      .eq('onderdeel', hit.skill)
      .eq('level', 'a2')
      .maybeSingle();
    const served = (data as { served_question_ids?: number[] } | null)?.served_question_ids ?? [];
    if (!served.includes(questionId)) return { ok: false, gate: gateFor('taster_exhausted', 'a2', hit.skill) };
  }
  const bodies: Record<string, string | undefined> = { A: hit.item.optionA, B: hit.item.optionB, C: hit.item.optionC, D: hit.item.optionD };
  if (!bodies[label]) return { ok: false, gate: gateFor('unavailable', 'a2', hit.skill) };
  return {
    ok: true,
    data: {
      questionId,
      correct: label === hit.item.correct,
      chosenLabel: label,
      correctLabel: hit.item.correct,
      correctBody: bodies[hit.item.correct] ?? null,
      explanation: hit.item.explanation,
      taalregel: null,
      saved: false,
    },
  };
}

export async function checkMcq(
  ctx: McpContext,
  questionId: number,
  label: 'A' | 'B' | 'C' | 'D',
): Promise<ToolOutcome<McqVerdict>> {
  if (questionId < 0) return checkStatic(ctx, questionId, label);
  const q = await loadQuestion(questionId);
  if (!q) return { ok: false, gate: gateFor('unavailable', null, 'lezen') };
  const { level, skill: onderdeel } = q.exams;

  if (ctx.kind === 'anonymous') {
    if (!(await anonymousWasServed(ctx.subjectHash, q))) return { ok: false, gate: gateFor('taster_exhausted', level, onderdeel) };
  } else if (!canOpenExam(tierFor(ctx.meta, level, onderdeel), q.exams.is_free)) {
    return { ok: false, gate: gateFor('module_required', level, onderdeel) };
  }

  const chosen = q.question_options.find(o => o.label === label);
  const correct = q.question_options.find(o => o.is_correct);
  if (!chosen || !correct) return { ok: false, gate: gateFor('unavailable', level, onderdeel) };
  const wasCorrect = chosen.is_correct;

  let saved = false;
  if (ctx.kind === 'user') {
    const { error } = await ctx.db.from('user_question_results').insert({
      user_id: ctx.userId,
      question_id: q.id,
      exam: q.exams.number,
      chosen_option_id: chosen.id,
      was_correct: wasCorrect,
    });
    saved = !error;
    if (error) console.warn('[mcp] antwoord niet opgeslagen:', error.message);
  }

  const taalregel = !wasCorrect ? await taalregelFor(q.id, level, onderdeel) : null;

  return {
    ok: true,
    data: {
      questionId: q.id,
      correct: wasCorrect,
      chosenLabel: label,
      correctLabel: correct.label as McqVerdict['correctLabel'],
      correctBody: correct.body,
      explanation: q.explanation,
      taalregel,
      saved,
    },
  };
}

/** De taalregel die bij deze misser hoort, met de les die hem uitlegt — alleen voor de taalonderdelen. */
export async function taalregelFor(questionId: number, level: Level | null, onderdeel: OnderdeelSlug): Promise<TaalregelHint | null> {
  if (!isLevel(level) || isKnm(onderdeel) || !isOnderdeelSlug(onderdeel)) return null;
  const [advice] = await fetchConceptAdvice([questionId], level, onderdeel, 1);
  if (!advice) return null;
  return {
    name: advice.concept.name_nl,
    oneLiner: advice.concept.one_liner,
    url: `${siteUrl()}${advice.href}?utm_source=chatgpt&utm_medium=app`,
  };
}

/**
 * De uitleg zonder (opnieuw) te antwoorden: dezelfde docent-uitleg als na het nakijken. Anoniem
 * alleen voor een uitgedeelde vraag; gekoppeld alleen binnen de eigen toegang.
 */
export async function explainQuestion(
  ctx: McpContext,
  questionId: number,
  chosenLabel: 'A' | 'B' | 'C' | 'D' | null,
): Promise<ToolOutcome<Omit<McqVerdict, 'correct' | 'chosenLabel' | 'saved'> & { chosenLabel: string | null; chosenWasCorrect: boolean | null }>> {
  if (questionId < 0) {
    const r = await checkStatic(ctx, questionId, chosenLabel ?? 'A');
    if (!r.ok) return r;
    const { correct, chosenLabel: _c, saved: _s, ...rest } = r.data;
    return { ok: true, data: { ...rest, chosenLabel, chosenWasCorrect: chosenLabel ? correct : null } };
  }
  const q = await loadQuestion(questionId);
  if (!q) return { ok: false, gate: gateFor('unavailable', null, 'lezen') };
  const { level, skill: onderdeel } = q.exams;

  if (ctx.kind === 'anonymous') {
    if (!(await anonymousWasServed(ctx.subjectHash, q))) return { ok: false, gate: gateFor('taster_exhausted', level, onderdeel) };
  } else if (!canOpenExam(tierFor(ctx.meta, level, onderdeel), q.exams.is_free)) {
    return { ok: false, gate: gateFor('module_required', level, onderdeel) };
  }

  const correct = q.question_options.find(o => o.is_correct);
  if (!correct) return { ok: false, gate: gateFor('unavailable', level, onderdeel) };
  const chosen = chosenLabel ? q.question_options.find(o => o.label === chosenLabel) ?? null : null;
  const chosenWasCorrect = chosen ? chosen.is_correct : null;

  return {
    ok: true,
    data: {
      questionId: q.id,
      chosenLabel: chosen?.label ?? null,
      chosenWasCorrect,
      correctLabel: correct.label as McqVerdict['correctLabel'],
      correctBody: correct.body,
      explanation: q.explanation,
      taalregel: chosenWasCorrect === false ? await taalregelFor(q.id, level, onderdeel) : null,
    },
  };
}
