'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, FileCheck2, X } from 'lucide-react';
import { HorizonBanner } from '@/components/horizon';
import { AudioPrefRow } from './ReadAloud';
import AudioPlayer from './AudioPlayer';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { completeExamAttempt, startExamAttempt } from '@/lib/attempts';
import { awardCorrectAnswer, awardXp } from '@/lib/xp';
import { track } from '@/lib/analytics';
import { sendGAEvent } from '@next/third-parties/google';
import {
  examPctFromTaskPcts,
  isPassing,
  pctFromCriteria,
  type CriterionScore,
  type RubricCriterion,
} from '@/lib/rubrics';
import type { ExamContent, OpenTaskItem, OptionItem, QuestionItem, StimulusItem } from '@/lib/exam-content';
import StimulusPane from './StimulusPane';
import McqQuestion from './McqQuestion';
import ConceptAdvice from '@/components/lessons/ConceptAdvice';
import WritingTask, { type WritingAnswer } from './WritingTask';
import SpeakingTask, { type SpeakingAnswer } from './SpeakingTask';
import RubricFeedback, {
  type FeedbackHighlight,
  type RubricFeedbackState,
} from './RubricFeedback';

import { DEV_FLOW_PARAM, devToolsEnabled, examFlow } from '@/lib/dev-tools';

/**
 * `grading` zit tussen inleveren en de uitslag, en alleen bij een rubriekonderdeel.
 *
 * Vóór 14-09 sprong het scherm meteen naar `results` en werd er ónder die uitslag nog genakeken.
 * De kandidaat zag dan "Je antwoorden zijn opgeslagen" zonder score — `openResultFrom` houdt de
 * score terug zolang één beantwoorde opdracht niet is nagekeken — en had geen enkele reden om te
 * blijven wachten. Nu is het wachten zelf een scherm, met een teller erbij.
 */
type Phase = 'intro' | 'instructie' | 'part' | 'tekstintro' | 'exam' | 'grading' | 'results';

/**
 * De leestijd vóór een luisterfragment, in seconden, en de speelregel die eraan vastzit.
 *
 * DUO's eigen instructie: "U krijgt eerst 25 seconden de tijd om de opgave goed door te lezen.
 * Daarna start de tekst vanzelf" en "U kunt de tekst maar één keer beluisteren."
 *
 * **Bewust alleen B1.** A2 Luisteren heeft veertig gepubliceerde examens en klanten die er nu in
 * zitten; die halverwege strenger maken verandert stil hun examen. Wil de eigenaar het daar ook,
 * dan is dit de ene plek: haal `level === 'b1'` weg.
 */
const LUISTEREN_LEESTIJD_SECONDEN = 25;

/**
 * De gesproken uitleg op het instructiescherm. Eén bestand in `public/`, niet in Storage: hij is
 * voor elk luisterexamen hetzelfde en verandert alleen als de instructie zelf verandert — dan
 * hoort hij ook in dezelfde commit als de tekst, en dat is precies wat een bestand in de repo
 * afdwingt en een rij in Storage niet.
 */
const LUISTEREN_INSTRUCTIE_AUDIO = '/audio/exam/b1-luisteren-instructie.mp3';

/** Hoeveel opdrachten tegelijk worden nagekeken bij het inleveren. */
const GRADE_CONCURRENCY = 3;

/**
 * Whether feedback is shown during the sitting.
 *
 * `practice` is the default and shows the rubric result after each answer — the owner's decision,
 * and the better learning loop. It is stamped on `exam_attempts.feedback_mode` because it changes
 * what the score means: in practice the candidate can revise an answer after being told what was
 * wrong, so that score does not predict DUO and must not be read as readiness.
 */
type FeedbackMode = 'practice' | 'exam';

/** What we know about one open task's grade, client-side. */
type TaskGrade = {
  state: RubricFeedbackState;
  submissionId: number | null;
  criteria: RubricCriterion[];
  scores: CriterionScore[];
  overall: string | null;
  tips: string[];
  /** The text the highlights index into: the written answer, or the transcript for Spreken. */
  answerText: string | null;
  highlights: FeedbackHighlight[];
  error: string | null;
};

const EMPTY_GRADE: TaskGrade = {
  state: 'idle',
  submissionId: null,
  criteria: [],
  scores: [],
  overall: null,
  tips: [],
  answerText: null,
  highlights: [],
  error: null,
};

/** Did the candidate put anything in this task? */
function hasAnswer(w: WritingAnswer | undefined, s: SpeakingAnswer | undefined): boolean {
  return Boolean(w?.text?.trim() || w?.json || s?.blob);
}

/**
 * The sitting's result for a rubric skill.
 *
 * Pure, and takes its maps as arguments, so the render path can pass state and the submit path can
 * pass refs. Reading the refs directly made this unusable in render — a ref read during render is
 * exactly the desync the refs exist to avoid.
 *
 * Percentages are averaged per task rather than points summed, so a task with more criteria does
 * not silently weigh more — DUO weights the four Schrijven opdrachten equally. `pct` is null while
 * any answered task is still ungraded, which the dashboard renders as "wordt beoordeeld" rather
 * than a number that is about to move.
 */
function openResultFrom(
  tasks: OpenTaskItem[],
  written: Record<number, WritingAnswer>,
  spoken: Record<number, SpeakingAnswer>,
  grades: Record<number, TaskGrade>,
  passThresholdPct: number
): { pct: number | null; passed: boolean | null } {
  const answered = tasks.filter(t => hasAnswer(written[t.id], spoken[t.id]));
  if (answered.length === 0) return { pct: null, passed: null };

  const answeredPcts = answered.map(t => {
    const g = grades[t.id];
    if (!g || g.state !== 'graded') return null;
    return pctFromCriteria(g.scores, g.criteria);
  });

  // A skipped opdracht counts as zero. Averaging only what was attempted would score four blank
  // tasks and one good one as a pass.
  const withSkipped = [...answeredPcts, ...Array<number>(tasks.length - answered.length).fill(0)];
  const pct = examPctFromTaskPcts(withSkipped);
  return { pct, passed: isPassing(pct, passThresholdPct) };
}

/** One step of the exam: an MCQ question with its stimulus, or an open task. */
type Step =
  /**
   * `stimulus` is null for a **standalone** question — KNM's whole bank. The player then
   * renders one full-width column instead of the two-pane split, because there is no text or
   * fragment to put beside it and an empty left pane reads as content that failed to load.
   */
  | { kind: 'mcq'; stimulus: StimulusItem | null; question: QuestionItem; partId: number | null }
  | { kind: 'task'; task: OpenTaskItem; partId: number | null };

type Props = {
  content: ExamContent;
  /** Compleet plan — per-question explanations in the MCQ review. */
  canSeeExplanations: boolean;
};

/**
 * Rubric feedback is **not** tier-gated, deliberately.
 *
 * Grading costs money per use, so it is rationed by the free allowance instead — two graded
 * exercises per skill, enforced server-side in `lib/grading-limits.ts`. Hiding the feedback behind
 * Compleet as well would mean paying a model to produce text the candidate cannot read, which is the
 * worst of both: our cost, no conversion, and a candidate who spent their allowance on a score with
 * no explanation. The paywall arrives when the allowance runs out, which is the moment the value has
 * actually been demonstrated.
 *
 * Per-question explanations on Lezen/Luisteren stay Compleet: those are free to serve.
 */
const RUBRIC_FEEDBACK_IS_GATED = false;

const RECORDING_BUCKET = 'speaking-submissions';

export default function ExamShell({ content, canSeeExplanations }: Props) {
  const { exam, parts, stimuli, standalone, tasks, sectionNames } = content;
  const supabase = useMemo(() => createClient(), []);
  const isOpenSkill = exam.skill === 'schrijven' || exam.skill === 'spreken';
  /** Zie `LUISTEREN_LEESTIJD_SECONDEN`: de examenstand is er voorlopig alleen voor B1. */
  const strengLuisteren = exam.skill === 'luisteren' && exam.level === 'b1';
  // Terug naar het onderdeel waar dit examen bij hoort, niet naar het hoofddashboard.
  const dashboardHref = exam.level
    ? ({ pathname: '/dashboard/[level]/[skill]', params: { level: exam.level, skill: exam.skill } } as const)
    : ('/dashboard/knm' as const);

  const steps = useMemo<Step[]>(() => {
    if (isOpenSkill) return tasks.map(task => ({ kind: 'task' as const, task, partId: task.part_id }));
    return [
      ...stimuli.flatMap(s =>
        s.questions.map(question => ({ kind: 'mcq' as const, stimulus: s, question, partId: s.part_id }))
      ),
      // Appended, not interleaved: an onderdeel has one shape or the other. Lezen and
      // Luisteren are all stimulus-backed and this list is empty; KNM is all standalone and
      // the first list is. Ordering across the two would need a key neither table shares.
      ...standalone.map(question => ({
        kind: 'mcq' as const, stimulus: null, question, partId: null,
      })),
    ];
  }, [isOpenSkill, stimuli, standalone, tasks]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(exam.duration_seconds);
  /** question id → chosen option. Answers stay editable until submit, as in the real exam. */
  const [chosen, setChosen] = useState<Record<number, OptionItem>>({});
  const [written, setWritten] = useState<Record<number, WritingAnswer>>({});
  const [spoken, setSpoken] = useState<Record<number, SpeakingAnswer>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('practice');
  /** task id → its grade. Populated as the candidate presses "Nakijken", or at submit. */
  const [grades, setGrades] = useState<Record<number, TaskGrade>>({});
  /** De teller van het nakijkscherm: hoeveel van hoeveel zijn klaar. */
  const [gradingProgress, setGradingProgress] = useState({ done: 0, total: 0 });
  const [regrading, setRegrading] = useState(false);

  const secondsRef = useRef(exam.duration_seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef<number | null>(null);
  // The timer's auto-submit fires from an interval that closed over the first render, so it
  // would score an empty answer set. These refs are the escape hatch; they are written in an
  // effect rather than during render so React can bail out of a render without desyncing them.
  const chosenRef = useRef(chosen);
  useEffect(() => { chosenRef.current = chosen; }, [chosen]);
  // The open-answer paths had the same bug and no such hatch: `saveOpenSubmissions` read
  // `written`/`spoken` straight from the render closure, so a timer auto-submit saved whatever
  // the candidate had typed as of the first render — usually nothing.
  const writtenRef = useRef(written);
  useEffect(() => { writtenRef.current = written; }, [written]);
  const spokenRef = useRef(spoken);
  useEffect(() => { spokenRef.current = spoken; }, [spoken]);
  const gradesRef = useRef(grades);
  useEffect(() => { gradesRef.current = grades; }, [grades]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, [supabase]);

  /**
   * Local-only: jump into the middle of a sitting or straight onto the result screen.
   *
   * It fills `chosen` / `written` / `spoken` and moves the phase — it never calls
   * `submitExam`, so nothing is written to `exam_attempts`, `user_question_results` or the
   * grader. The result screen derives its score, verdict and per-tekstsoort breakdown from
   * those answers, so seeding them is what makes the screen real rather than mocked.
   *
   * `devToolsEnabled()` is false in any production build, which makes the param inert there.
   */
  useEffect(() => {
    if (!devToolsEnabled()) return;
    const flow = examFlow(new URLSearchParams(window.location.search).get(DEV_FLOW_PARAM));
    if (!flow || steps.length === 0) return;

    if (flow === 'grading') {
      // Alleen het wachtscherm zelf; er wordt niets nagekeken en niets opgeslagen.
      setGradingProgress({ done: 9, total: 14 });
      setPhase('grading');
      return;
    }

    if (flow === 'results_empty') {
      // Ingeleverd, nog niet nagekeken — the state an open skill sits in between submitting
      // and the grader coming back. No recording is invented: a Blob nobody can play back is
      // worse than an obviously empty one.
      setWritten(Object.fromEntries(tasks.map(t => [
        t.id,
        { text: 'Beste meneer De Vries,\n\nIk schrijf u over de cursus van volgende week. Ik kan helaas niet komen omdat ik moet werken.\n\nMet vriendelijke groet,\nSam', json: null },
      ])));
      setSpoken({});
      setPhase('results');
      return;
    }

    const wantPct = flow === 'results_fail' ? 30 : 85;
    const answered = flow === 'mid' ? Math.floor(steps.length / 2) : steps.length;
    const picks: Record<number, OptionItem> = {};
    steps.forEach((step, i) => {
      if (step.kind !== 'mcq' || i >= answered) return;
      const opts = step.question.options;
      if (opts.length === 0) return;
      const wantCorrect = (i * 100) / answered < wantPct;
      const pick = wantCorrect
        ? opts.find(o => o.is_correct) ?? opts[0]
        : opts.find(o => !o.is_correct) ?? opts[0];
      picks[step.question.id] = pick;
    });
    setChosen(picks);

    if (flow === 'mid') {
      // No timer is started: a dev jump is for looking at the screen, and a running clock
      // would auto-submit real rows out from under it.
      setIdx(answered);
      setPhase('exam');
    } else {
      setPhase('results');
    }
  }, [steps, tasks]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  /* ── Scoring ── */

  const totalItems = steps.length;

  const score = useMemo(
    () => Object.values(chosen).filter(o => o.is_correct).length,
    [chosen]
  );

  const catScores = useMemo(() => {
    const acc: Record<string, { correct: number; total: number }> = {};
    for (const step of steps) {
      if (step.kind !== 'mcq') continue;
      // The sub-topic is on the stimulus where there is one and on the question where there
      // is not (KNM). Reading only the stimulus put every KNM answer under "Overig" and threw
      // away the 43-way breakdown that is the most useful part of a KNM result.
      const sectionId = step.stimulus?.section_id ?? step.question.section_id;
      const name = sectionId ? sectionNames[sectionId] : null;
      const key = name ?? 'Overig';
      acc[key] ??= { correct: 0, total: 0 };
      acc[key].total++;
      if (chosen[step.question.id]?.is_correct) acc[key].correct++;
    }
    return acc;
  }, [steps, chosen, sectionNames]);

  /**
   * De vragen die fout zijn gegaan, als input voor het conceptadvies.
   *
   * Alleen beantwoorde vragen: een overgeslagen vraag is geen bewijs dat een concept ontbreekt,
   * en hem meerekenen zou het advies laten sturen op wat de kandidaat niet heeft gezien.
   */
  const wrongQuestionIds = useMemo(
    () => steps
      .filter(s => s.kind === 'mcq')
      .map(s => s.question.id)
      .filter(id => chosen[id] && !chosen[id].is_correct),
    [steps, chosen],
  );

  /* ── Lifecycle ── */

  async function startExam() {
    secondsRef.current = exam.duration_seconds;
    setSecondsLeft(exam.duration_seconds);
    setIdx(0);
    setPhase(phaseFor(0));

    stopTimer();
    timerRef.current = setInterval(() => {
      secondsRef.current--;
      setSecondsLeft(secondsRef.current);
      if (secondsRef.current <= 0) { stopTimer(); void submitExam(); }
    }, 1000);

    sendGAEvent('event', 'exam_started', { skill: exam.skill, exam_number: exam.number });
    track('exam_started', { source: 'oefenexamen', skill: exam.skill, exam_number: exam.number });

    if (userId) {
      const id = await startExamAttempt(supabase, {
        userId, skill: exam.skill, level: exam.level, examNumber: exam.number, examId: exam.id,
        feedbackMode: isOpenSkill ? feedbackMode : 'exam',
      });
      attemptRef.current = id;
      setAttemptId(id);
    }
  }

  /** The part whose instruction screen precedes step `i`, if any. */
  function firstPartFor(i: number): typeof parts[number] | null {
    const step = steps[i];
    if (!step?.partId) return null;
    const prev = i > 0 ? steps[i - 1]?.partId : null;
    if (prev === step.partId) return null;
    const part = parts.find(p => p.id === step.partId);
    return part?.show_instruction ? part : null;
  }

  /**
   * De luistertekst waarvan stap `i` het eerste fragment is, als die een ingesproken intro heeft.
   *
   * DUO zet vóór elke tekst een introtrack: de verteller leest de titel en het scenario voor en
   * daarna hoor je het begin van het gesprek, zonder dat er al een vraag bij hoort. Dat is hier
   * een **scherm** en geen stap, net als het instructiescherm van een `exam_part`: `totalItems`
   * telt de vragen, en een examen van 39 vragen moet er 39 blijven tellen ook al zie je zes
   * schermen extra.
   *
   * Er is geen aparte rij per gesprek — `intro_audio_url` staat alleen op het eerste fragment,
   * dus "heeft deze stimulus een intro" ís de groepering. Zie de migratie
   * `20260916160000_stimuli_intro_audio` voor waarom dat geen zevende stimulus is.
   */
  function firstIntroFor(i: number): StimulusItem | null {
    const step = steps[i];
    if (step?.kind !== 'mcq' || !step.stimulus?.intro_audio_url) return null;
    const prev = i > 0 ? steps[i - 1] : null;
    const prevId = prev?.kind === 'mcq' ? prev.stimulus?.id : null;
    return prevId === step.stimulus.id ? null : step.stimulus;
  }

  /** Het instructiescherm van een deel gaat vóór de tekstintro — het kadert de hele deeltoets. */
  function phaseFor(i: number): Phase {
    if (firstPartFor(i)) return 'part';
    if (firstIntroFor(i)) return 'tekstintro';
    return 'exam';
  }

  function goTo(next: number) {
    if (next < 0 || next >= totalItems) return;
    setIdx(next);
    setPhase(phaseFor(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitExam() {
    if (submitting || submitted) return;
    setSubmitting(true);
    stopTimer();

    const answers = chosenRef.current;
    const computed = Object.values(answers).filter(o => o.is_correct).length;
    const pct = totalItems > 0 ? Math.round((computed / totalItems) * 100) : 0;
    const passed = pct >= exam.pass_threshold_pct;
    const attempt = attemptRef.current;

    // Bij een rubriekonderdeel wordt er na het inleveren nog nagekeken, en dat duurt. Het
    // nakijkscherm gaat er dus vóór — anders leest een uitslag zonder score als een kapotte pagina.
    const pendingAtSubmit = isOpenSkill && userId
      ? tasks.filter(t => hasAnswerFor(t.id) && gradesRef.current[t.id]?.state !== 'graded')
      : [];
    setGradingProgress({ done: 0, total: pendingAtSubmit.length });
    setPhase(pendingAtSubmit.length > 0 ? 'grading' : 'results');

    if (userId) {
      if (!isOpenSkill) {
        // One row per answered question. Written here rather than on each click so a
        // candidate who changes an answer — which the real exam allows — does not leave a
        // trail of superseded results that would skew the mastery series.
        const rows = steps.flatMap(s => {
          if (s.kind !== 'mcq') return [];
          const o = answers[s.question.id];
          if (!o) return [];
          return [{
            user_id: userId,
            question_id: s.question.id,
            exam: exam.number,
            attempt_id: attempt,
            chosen_option_id: o.id,
            was_correct: o.is_correct,
          }];
        });
        if (rows.length) await supabase.from('user_question_results').insert(rows);
        for (const s of steps) {
          if (s.kind === 'mcq' && answers[s.question.id]?.is_correct) {
            awardCorrectAnswer(supabase, userId, s.question.id);
          }
        }
      } else {
        // Grade anything not already graded. In Oefenmodus most tasks are done by now; in
        // Examenmodus none are, which is the whole point of that mode.
        //
        // Drie tegelijk, niet één voor één: een Spreken-examen heeft zestien opdrachten en elke
        // beurt is een Scribe-call plus een modelcall. Serieel is dat minutenlang wachten op een
        // scherm dat niets doet. Meer dan drie is het niet, want elke beurt kost geld bij twee
        // leveranciers en een burst is precies wat de rate limit hoort te zien.
        const queue = [...pendingAtSubmit];
        const runner = async () => {
          for (;;) {
            const task = queue.shift();
            if (!task) return;
            await gradeTask(task);
            setGradingProgress(p => ({ ...p, done: p.done + 1 }));
          }
        };
        await Promise.all(
          Array.from({ length: Math.min(GRADE_CONCURRENCY, pendingAtSubmit.length) }, runner)
        );
        setPhase('results');
      }

      if (attempt) {
        const openResult = isOpenSkill
          ? openResultFrom(tasks, writtenRef.current, spokenRef.current, gradesRef.current, exam.pass_threshold_pct)
          : null;
        await completeExamAttempt(supabase, attempt, {
          // A rubric skill has no auto score until every answered task is graded. This used to
          // write 0 / 0% / false, which is not "awaiting grading" — it is a fail, and it showed up
          // on the dashboard as one while dragging the candidate's average down.
          score: isOpenSkill ? null : computed,
          total: totalItems,
          pct: isOpenSkill ? openResult!.pct : pct,
          passed: isOpenSkill ? openResult!.passed : passed,
          catScores,
          passThresholdPct: exam.pass_threshold_pct,
        });
      }
      void awardXp(supabase, userId, 'exam_completed', exam.number);
      if (!isOpenSkill && passed) void awardXp(supabase, userId, 'exam_passed', exam.number);
    }

    sendGAEvent('event', 'exam_finished', {
      skill: exam.skill, exam_number: exam.number, score: computed, total: totalItems, pct, passed,
    });
    track('exam_finished', {
      source: 'oefenexamen', skill: exam.skill, exam_number: exam.number,
      score: computed, total: totalItems, pct, passed,
    });

    // Vangnet: als er onderweg iets misgaat blijft het nakijkscherm anders staan, en dat is een
    // scherm zonder uitweg. De uitslag mag onvolledig zijn; hij mag niet onbereikbaar zijn.
    setPhase('results');
    setSubmitted(true);
    setSubmitting(false);
  }

  /**
   * De opdrachten die bij het inleveren niet konden worden nagekeken alsnog nakijken.
   *
   * Nodig omdat `exam_attempts` bij het inleveren `pct: null` krijgt zodra één beantwoorde opdracht
   * ongenakeken is — dat is bedoeld ("wordt beoordeeld" in plaats van een cijfer dat nog gaat
   * bewegen), maar er was niets dat die staat ooit nog ophief. De poging wordt daarom na afloop
   * opnieuw afgesloten met de dan bekende uitslag.
   */
  async function regradeFailed() {
    if (regrading) return;
    setRegrading(true);
    try {
      for (const task of tasks) {
        if (!hasAnswerFor(task.id)) continue;
        if (gradesRef.current[task.id]?.state !== 'error') continue;
        await gradeTask(task);
      }
      const attempt = attemptRef.current;
      if (attempt) {
        const openResult = openResultFrom(
          tasks, writtenRef.current, spokenRef.current, gradesRef.current, exam.pass_threshold_pct
        );
        await completeExamAttempt(supabase, attempt, {
          score: null,
          total: totalItems,
          pct: openResult.pct,
          passed: openResult.passed,
          catScores,
          passThresholdPct: exam.pass_threshold_pct,
        });
      }
    } finally {
      setRegrading(false);
    }
  }

  /** Is there anything to grade for this task? Reads refs, so callers must not be in render. */
  function hasAnswerFor(taskId: number): boolean {
    return hasAnswer(writtenRef.current[taskId], spokenRef.current[taskId]);
  }

  /**
   * Write one `open_submissions` row and return its id.
   *
   * Append-only by design: re-answering after feedback inserts a *second* row rather than
   * overwriting, so the trail of what the candidate did with the feedback survives. The last row
   * per (attempt, task) is the one that counts.
   */
  async function createSubmission(
    uid: string,
    attempt: number | null,
    task: OpenTaskItem
  ): Promise<number | null> {
    const w = writtenRef.current[task.id];
    const s = spokenRef.current[task.id];

    // The row is inserted first so the recording can be named after it. A revision must not
    // overwrite the audio an earlier grade was computed from, and the submission id is the one
    // identifier that is already unique per revision — a timestamp would work too, but reading a
    // clock here is an impure call in a component body and the id is more useful anyway: given a
    // storage path you can find the submission it belongs to.
    const { data, error } = await supabase
      .from('open_submissions')
      .insert({
        user_id: uid,
        exam_id: exam.id,
        task_id: task.id,
        attempt_id: attempt,
        answer_text: w?.text?.trim() || null,
        answer_json: w?.json ?? null,
        audio_seconds: s?.seconds != null ? Math.round(s.seconds) : null,
        status: 'submitted',
      })
      .select('id')
      .single();

    if (error) return null;
    const submissionId = (data as { id: number }).id;

    if (s?.blob) {
      const path = `${uid}/${attempt ?? 'losse-opname'}/${task.id}-${submissionId}.wav`;
      const { error: upErr } = await supabase.storage
        .from(RECORDING_BUCKET)
        .upload(path, s.blob, { contentType: 'audio/wav', upsert: false });
      // The bucket is private, so the path is stored rather than a URL — the grading surface signs
      // it on demand.
      if (!upErr) {
        await supabase.from('open_submissions').update({ audio_url: path }).eq('id', submissionId);
      }
    }

    return submissionId;
  }

  /**
   * Save this task's answer and ask for its rubric grade.
   *
   * Triggered by the candidate pressing "Nakijken", not by a typing pause: every call costs money
   * at two providers, and the candidate is the one who knows when the answer is finished.
   */
  async function gradeTask(task: OpenTaskItem): Promise<TaskGrade> {
    const uid = userId;
    if (!uid) {
      const g: TaskGrade = {
        ...EMPTY_GRADE,
        state: 'error',
        error: 'Log in om je antwoord te laten nakijken.',
      };
      setGrades(p => ({ ...p, [task.id]: g }));
      return g;
    }

    setGrades(p => ({ ...p, [task.id]: { ...EMPTY_GRADE, state: 'grading' } }));

    const submissionId = await createSubmission(uid, attemptRef.current, task);
    if (!submissionId) {
      const g: TaskGrade = {
        ...EMPTY_GRADE,
        state: 'error',
        error: 'Je antwoord kon niet worden opgeslagen.',
      };
      setGrades(p => ({ ...p, [task.id]: g }));
      return g;
    }

    try {
      const res = await fetch('/api/grade-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Nakijken is niet gelukt.');

      const g: TaskGrade = {
        state: 'graded',
        submissionId,
        criteria: json.rubric?.criteria ?? [],
        scores: json.criteria ?? [],
        overall: json.overall ?? null,
        tips: json.tips ?? [],
        answerText: json.answerText ?? null,
        highlights: json.highlights ?? [],
        error: null,
      };
      setGrades(p => ({ ...p, [task.id]: g }));
      return g;
    } catch (err) {
      // The submission row survives either way, so the docent still sees the answer and the
      // candidate has not lost work.
      const g: TaskGrade = {
        ...EMPTY_GRADE,
        state: 'error',
        submissionId,
        error: err instanceof Error ? err.message : 'Nakijken is niet gelukt.',
      };
      setGrades(p => ({ ...p, [task.id]: g }));
      return g;
    }
  }

  /* ── Views ── */

  if (phase === 'grading') {
    return <GradingScreen done={gradingProgress.done} total={gradingProgress.total} />;
  }

  if (phase === 'intro') {
    return (
      <ExamIntroScreen
        content={content}
        totalItems={totalItems}
        isOpenSkill={isOpenSkill}
        /* The read-aloud onboarding, KNM only — see `readAloud` on `McqQuestion` below. */
        readAloudSample={exam.skill === 'knm' ? (content.standalone.find(q => q.prompt_audio_url)?.prompt_audio_url ?? null) : null}
        feedbackMode={feedbackMode}
        onFeedbackModeChange={setFeedbackMode}
        /* Het instructiescherm gaat vóór `startExam`, niet erna: daar begint de klok van 90
           minuten, en de uitleg lezen hoort de kandidaat geen examentijd te kosten. */
        onStart={() => (strengLuisteren ? setPhase('instructie') : void startExam())}
      />
    );
  }

  if (phase === 'instructie') {
    return <LuisterInstructie onStart={() => void startExam()} />;
  }

  if (phase === 'part') {
    const part = firstPartFor(idx);
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">
          {part?.title}
        </span>
        <div
          className="rounded-2xl bg-surface-container-lowest"
          style={{ padding: '1.5rem 1.625rem', boxShadow: 'var(--shadow-card-md)' }}
        >
          {part?.instruction_html ? (
            <div
              className="exam-task-prompt exam-rich exam-rich-scroll text-on-surface"
              dangerouslySetInnerHTML={{ __html: part.instruction_html }}
            />
          ) : (
            <p className="text-sm text-on-surface-variant m-0">Lees de opdracht goed door.</p>
          )}
          {/* Tag-level rules live in .exam-rich in app/globals.css — see the note there. */}
          <style>{`
            .exam-task-prompt { font-size: 0.95rem; line-height: 1.7; }
          `}</style>
        </div>
        <button
          type="button"
          onClick={() => setPhase(firstIntroFor(idx) ? 'tekstintro' : 'exam')}
          className="exam-primary-btn inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm border-0 cursor-pointer self-start"
          style={{ padding: '0.8rem 1.5rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
        >
          Verder
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </button>
        <PrimaryBtnStyles />
      </div>
    );
  }

  if (phase === 'tekstintro') {
    const s = firstIntroFor(idx);
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">
          {sectionNames[s?.section_id ?? -1] ?? 'Luisteren'}
        </span>
        <div
          className="rounded-2xl bg-surface-container-lowest flex flex-col gap-4"
          style={{ padding: '1.5rem 1.625rem', boxShadow: 'var(--shadow-card-md)' }}
        >
          {s?.title && (
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface m-0">{s.title}</h2>
          )}
          {s?.intro && (
            <p className="text-sm leading-relaxed text-on-surface-variant m-0">{s.intro}</p>
          )}
          {s?.intro_audio_url && <AudioPlayer src={s.intro_audio_url} label="Introductie" />}
        </div>
        <button
          type="button"
          onClick={() => setPhase('exam')}
          className="exam-primary-btn inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm border-0 cursor-pointer self-start"
          style={{ padding: '0.8rem 1.5rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
        >
          Verder
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </button>
        <PrimaryBtnStyles />
      </div>
    );
  }

  if (phase === 'exam') {
    const step = steps[idx];
    if (!step) return null;
    const answeredCount = isOpenSkill
      ? tasks.filter(t => written[t.id]?.text?.trim() || written[t.id]?.json || spoken[t.id]?.blob).length
      : Object.keys(chosen).length;

    return (
      <div className="flex flex-col gap-5">
        <TimerBar
          secondsLeft={secondsLeft}
          total={exam.duration_seconds}
          step={idx + 1}
          steps={totalItems}
          answered={answeredCount}
        />

        {step.kind === 'mcq' && step.stimulus === null ? (
          // Standalone question (KNM): one column, centred to a readable measure rather than
          // stretched across the grid's full width, which would leave a 1,200px line length.
          <div className="max-w-2xl w-full mx-auto">
            <McqQuestion
              question={step.question}
              questionNumber={idx + 1}
              total={totalItems}
              chosenId={chosen[step.question.id]?.id ?? null}
              onSelect={o => setChosen(prev => ({ ...prev, [step.question.id]: o }))}
              showFeedback={false}
              sectionName={step.question.section_id ? sectionNames[step.question.section_id] : undefined}
              /* KNM only. Its bank is the one with per-option audio, and reading a Luisteren
                 question aloud would speak over the fragment the item tests. */
              readAloud={exam.skill === 'knm'}
            />
          </div>
        ) : step.kind === 'mcq' ? (
          <div className="grid gap-5 lg:grid-cols-2 items-start">
            {/* The key decides whether the pane survives moving between two questions on one
                stimulus, and the two skills want opposite things:
                  · Lezen keys on the stimulus, so the text stays mounted and does not
                    re-scroll while the candidate works through its questions;
                  · Luisteren keys on stimulus+question, so the fragment remounts and the audio
                    plays again from 0:00 for every question, the way DUO presents it (owner's
                    decision, 2026-08-07). Die remount is bij B1 ook wat elke vraag zijn eigen
                    25 seconden leestijd geeft — zie `LUISTEREN_LEESTIJD_SECONDEN`. Bij A2 blijft
                    herhalen onbeperkt.
                Changing this back would silently change what the exam tests. */}
            <StimulusPane
              key={exam.skill === 'luisteren'
                ? `${step.stimulus!.id}:${step.question.id}`
                : step.stimulus!.id}
              stimulus={step.stimulus!}
              examenAudio={strengLuisteren ? { readSeconds: LUISTEREN_LEESTIJD_SECONDEN } : undefined}
            />
            <McqQuestion
              question={step.question}
              questionNumber={idx + 1}
              total={totalItems}
              chosenId={chosen[step.question.id]?.id ?? null}
              onSelect={o => setChosen(prev => ({ ...prev, [step.question.id]: o }))}
              showFeedback={false}
              sectionName={step.stimulus!.section_id ? sectionNames[step.stimulus!.section_id] : undefined}
            />
          </div>
        ) : step.task.task_type === 'speaking' ? (
          <SpeakingTask
            task={step.task}
            answer={spoken[step.task.id] ?? { blob: null, seconds: 0 }}
            onChange={a => setSpoken(prev => ({ ...prev, [step.task.id]: a }))}
            taskNumber={idx + 1}
            total={totalItems}
            // Examenmodus withholds the readback: DUO gives none, and reading your own words while
            // speaking trains self-correction rather than speaking.
            liveTranscript={feedbackMode === 'practice'}
            feedback={
              feedbackMode === 'practice' && (grades[step.task.id]?.state ?? 'idle') !== 'idle' ? (
                <TaskReview
                  task={step.task}
                  grade={grades[step.task.id] ?? EMPTY_GRADE}
                  hasAnswer={hasAnswer(written[step.task.id], spoken[step.task.id])}
                  canSeeDetail={!RUBRIC_FEEDBACK_IS_GATED || canSeeExplanations}
                  passThresholdPct={exam.pass_threshold_pct}
                  onGrade={() => void gradeTask(step.task)}
                  hideAction
                  compact
                />
              ) : null
            }
            review={
              feedbackMode === 'practice'
                ? {
                    state: (grades[step.task.id] ?? EMPTY_GRADE).state,
                    onGrade: () => void gradeTask(step.task),
                    answerText: (grades[step.task.id] ?? EMPTY_GRADE).answerText,
                    highlights: (grades[step.task.id] ?? EMPTY_GRADE).highlights,
                  }
                : undefined
            }
          />
        ) : (
          <WritingTask
            task={step.task}
            answer={written[step.task.id] ?? { text: '', json: null }}
            onChange={a => setWritten(prev => ({ ...prev, [step.task.id]: a }))}
            taskNumber={idx + 1}
            total={totalItems}
            canSeeModelAnswer={canSeeExplanations}
            review={
              feedbackMode === 'practice'
                ? {
                    state: (grades[step.task.id] ?? EMPTY_GRADE).state,
                    onGrade: () => void gradeTask(step.task),
                    answerText: (grades[step.task.id] ?? EMPTY_GRADE).answerText,
                    highlights: (grades[step.task.id] ?? EMPTY_GRADE).highlights,
                  }
                : undefined
            }
            feedback={
              feedbackMode === 'practice' && (grades[step.task.id]?.state ?? 'idle') !== 'idle' ? (
                <TaskReview
                  task={step.task}
                  grade={grades[step.task.id] ?? EMPTY_GRADE}
                  hasAnswer={hasAnswer(written[step.task.id], spoken[step.task.id])}
                  canSeeDetail={!RUBRIC_FEEDBACK_IS_GATED || canSeeExplanations}
                  passThresholdPct={exam.pass_threshold_pct}
                  onGrade={() => void gradeTask(step.task)}
                  hideAction
                  layout="wide"
                />
              ) : null
            }
          />
        )}

        {/* Per-answer feedback, Oefenmodus only. In Examenmodus the candidate gets nothing until
            submit, which is what makes that sitting's score comparable to a real exam. */}
        <div className="exam-nav flex items-center justify-between gap-3 flex-wrap">
          {/* Bij streng luisteren is er geen weg terug, en dat is geen strengheid om de
              strengheid: `StimulusPane` remount per vraag, dus "Vorige" zou het fragment
              opnieuw starten en de kandidaat een tweede luisterbeurt geven — precies wat de
              instructie zegt dat er niet is. DUO's luisterexamen loopt om dezelfde reden
              alleen vooruit. De lege `span` houdt `justify-between` heel. */}
          {strengLuisteren ? (
            <span aria-hidden />
          ) : (
          <button
            type="button"
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            className="exam-ghost-btn inline-flex items-center gap-2 rounded-xl font-semibold text-sm cursor-pointer bg-surface-container text-on-surface-variant"
            style={{ padding: '0.7rem 1.1rem', border: 0 }}
          >
            <ArrowLeft size={15} strokeWidth={2.4} aria-hidden />
            Vorige
          </button>
          )}

          {idx < totalItems - 1 ? (
            <button
              type="button"
              onClick={() => goTo(idx + 1)}
              className="exam-primary-btn inline-flex items-center gap-2 rounded-xl font-bold text-sm border-0 cursor-pointer"
              style={{ padding: '0.8rem 1.5rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
            >
              Volgende
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submitExam()}
              disabled={submitting}
              className="exam-primary-btn inline-flex items-center gap-2 rounded-xl font-bold text-sm border-0 cursor-pointer text-white disabled:opacity-60"
              style={{ padding: '0.8rem 1.5rem', background: '#002b6d', boxShadow: 'var(--shadow-card-md)' }}
            >
              <FileCheck2 size={16} strokeWidth={2.4} aria-hidden />
              {submitting ? 'Inleveren…' : 'Examen inleveren'}
            </button>
          )}
        </div>

        <style>{`
          /* Feedback makes this page several screens long. Pinning the step controls means the
             candidate never has to scroll past their own assessment to continue — the reason the
             next action felt lost. Sticky rather than fixed, so it stays in flow and does not cover
             the last line of content. */
          .exam-nav {
            position: sticky; bottom: 0; z-index: 20;
            margin: 0 -0.75rem -0.5rem; padding: 0.75rem;
            background: linear-gradient(to top, var(--color-surface) 72%, transparent);
            backdrop-filter: blur(4px);
          }
          @media (max-width: 768px) { .exam-nav { bottom: 78px; } }
          .exam-ghost-btn { transition: background-color .16s ease, transform .16s ease; }
          .exam-ghost-btn:not(:disabled):hover { background: var(--color-surface-container-high); transform: translateY(-1px); }
          .exam-ghost-btn:disabled { opacity: 0.45; cursor: default; }
          .exam-ghost-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) { .exam-ghost-btn { transition: none; } }
        `}</style>
        <PrimaryBtnStyles />
      </div>
    );
  }

  /* ── Results ── */

  const pct = totalItems > 0 ? Math.round((score / totalItems) * 100) : 0;
  const passed = pct >= exam.pass_threshold_pct;

  if (isOpenSkill) {
    const open = openResultFrom(tasks, written, spoken, grades, exam.pass_threshold_pct);
    const answeredTasks = tasks.filter(t => hasAnswer(written[t.id], spoken[t.id]));
    const ungraded = answeredTasks.filter(t => grades[t.id]?.state !== 'graded');
    // Een mislukte nakijkbeurt is géén "de docent kijkt er nog naar": daar komt niemand meer langs.
    // Het verschil stond nergens op het scherm, waardoor een rate limit of een paywall als een
    // wachtrij las en de kandidaat bleef wachten op een uitslag die nooit kwam.
    const failed = answeredTasks.filter(t => grades[t.id]?.state === 'error');
    const failedReason = failed.map(t => grades[t.id]?.error).find(Boolean) ?? null;

    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div
          className="rounded-3xl"
          style={{
            background:
              open.passed === true
                // §7.2 scene states: a pass is the *primary* surface with the sun high, not a
                // green one. Green is in no token file, and "passed" in this system reads as
                // "official", which is what the navy says.
                ? 'var(--gradient-brand)'
                : open.pct == null
                  ? 'var(--gradient-brand)'
                  : 'linear-gradient(135deg,#5f2200 0%,#a24000 55%,#fe762c 100%)',
            padding: '2rem 1.875rem',
          }}
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-widest m-0 mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {open.pct == null ? 'Ingeleverd' : open.passed ? 'Gehaald' : 'Nog niet gehaald'}
          </p>
          <h1
            className="font-headline font-extrabold text-white m-0 mb-2"
            style={{ fontSize: '1.6rem', letterSpacing: '-0.03em', textWrap: 'balance' }}
          >
            {open.pct == null ? 'Je antwoorden zijn opgeslagen' : `${open.pct}%`}
          </h1>
          <p className="text-sm leading-relaxed m-0" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {open.pct == null
              ? 'De docent kijkt je antwoorden na. Je ziet je beoordeling terug in je dashboard.'
              : 'Voorbeoordeling met de beoordelingscriteria van de docent. Zij controleert je beoordeling; je ziet het in je dashboard zodra dat gebeurd is.'}
          </p>
          {answeredTasks.length < tasks.length && (
            <p className="text-sm leading-relaxed m-0 mt-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Je hebt {tasks.length - answeredTasks.length} van de {tasks.length} opdrachten
              overgeslagen. Die tellen als 0 mee.
            </p>
          )}
          {feedbackMode === 'practice' && (
            <p className="text-xs leading-relaxed m-0 mt-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Dit was een oefensessie met feedback tijdens het examen. Wil je weten of je er klaar
              voor bent, doe het dan nog eens in de examenmodus.
            </p>
          )}
        </div>

        {ungraded.length - failed.length > 0 && (
          <p className="text-sm text-on-surface-variant m-0">
            {ungraded.length - failed.length === 1
              ? 'Eén opdracht wordt nog nagekeken.'
              : `${ungraded.length - failed.length} opdrachten worden nog nagekeken.`}
          </p>
        )}

        {failed.length > 0 && (
          <div
            className="rounded-2xl flex flex-col gap-2"
            style={{ background: '#fcecdd', padding: '1rem 1.15rem' }}
          >
            <p className="text-sm font-bold m-0" style={{ color: '#a24000' }}>
              {failed.length === 1
                ? 'Eén opdracht kon niet worden nagekeken.'
                : `${failed.length} opdrachten konden niet worden nagekeken.`}
            </p>
            {failedReason && (
              <p className="text-sm leading-relaxed m-0" style={{ color: '#a24000' }}>
                {failedReason}
              </p>
            )}
            <p className="text-sm leading-relaxed m-0" style={{ color: '#a24000' }}>
              Je antwoorden zijn bewaard. Probeer het opnieuw — je verliest je werk niet.
            </p>
            <button
              type="button"
              onClick={() => void regradeFailed()}
              disabled={regrading}
              className="exam-primary-btn inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm self-start disabled:opacity-60"
              style={{ padding: '0.7rem 1.2rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
            >
              {regrading ? 'Bezig met nakijken…' : 'Opnieuw laten nakijken'}
            </button>
          </div>
        )}

        {/* Per opdracht, in the order they were sat. */}
        {tasks.map((task, i) => {
          const g = grades[task.id];
          if (!g || g.state !== 'graded') return null;
          return (
            <section key={task.id} className="flex flex-col gap-2">
              <h2
                className="font-headline font-bold text-on-surface m-0"
                style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
              >
                Opdracht {i + 1}
                {task.title ? ` — ${task.title}` : ''}
              </h2>
              <RubricFeedback
                criteria={g.criteria}
                scores={g.scores}
                answerText={g.answerText}
                highlights={g.highlights}
                canSeeDetail={!RUBRIC_FEEDBACK_IS_GATED || canSeeExplanations}
                premiumHref="/dashboard/pakketten?vanaf=rubriek-feedback"
                passThresholdPct={exam.pass_threshold_pct}
              />
              {canSeeExplanations && g.overall && (
                <p className="text-sm leading-relaxed text-on-surface-variant m-0">{g.overall}</p>
              )}
            </section>
          );
        })}

        <Link
          href={dashboardHref}
          className="exam-primary-btn inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm no-underline self-start"
          style={{ padding: '0.8rem 1.5rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
        >
          Naar je dashboard
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </Link>
        <PrimaryBtnStyles />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-3xl flex items-center justify-between gap-6 flex-wrap"
        style={{
          background: passed
            ? 'var(--gradient-brand)'
            : 'linear-gradient(135deg,#5f2200 0%,#a24000 55%,#fe762c 100%)',
          padding: '2rem 1.875rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest m-0 mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {passed ? 'Gehaald' : 'Nog niet gehaald'}
          </p>
          <h1
            className="font-headline font-extrabold text-white m-0 mb-2"
            style={{ fontSize: '1.6rem', letterSpacing: '-0.03em', textWrap: 'balance' }}
          >
            {score} van {totalItems} goed
          </h1>
          <p className="text-sm m-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Onze oefengrens is {exam.pass_threshold_pct}%. DUO maakt zijn eigen cesuur niet openbaar.
          </p>
        </div>
        <div
          className="font-headline font-extrabold text-white flex-shrink-0"
          style={{ fontSize: '3rem', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}
        >
          {pct}%
        </div>
      </div>

      {Object.keys(catScores).length > 0 && (
        <div
          className="rounded-2xl bg-surface-container-lowest"
          style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-ambient)' }}
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 m-0 mb-3">
            Resultaat per tekstsoort
          </p>
          <div className="flex flex-col gap-2">
            {Object.entries(catScores).map(([name, cs]) => {
              const cp = cs.total ? Math.round((cs.correct / cs.total) * 100) : 0;
              // Three bands, all from the palette. The greens are gone: the system's only
              // "attention" colour is clay and its only "wrong" colour is the `error` token
              // (§7.3 — never introduce a new hue to carry a status).
              const col = cp >= 70 ? '#002b6d' : cp >= 40 ? '#a24000' : '#ba1a1a';
              return (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container"
                  style={{ padding: '0.6rem 0.95rem' }}
                >
                  <span className="text-sm text-on-surface">{name}</span>
                  <span
                    className="text-sm font-bold whitespace-nowrap"
                    style={{ color: col, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {cs.correct}/{cs.total} · {cp}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Van fout antwoord naar de les die het uitlegt.
          Naast de tekstsoort-uitsplitsing hierboven en niet in plaats daarvan: die zegt waar
          het misging, dit zegt wat je eraan doet. Rendert niets als de items van dit examen nog
          niet aan concepten hangen — zie `ConceptAdvice`. */}
      {exam.level && (
        <ConceptAdvice
          level={exam.level}
          onderdeel={exam.skill}
          wrongQuestionIds={wrongQuestionIds}
          labels={{
            head: 'Dit verklaart je fouten',
            misses: '{n}x fout in dit examen',
            lesson: 'les beschikbaar',
          }}
        />
      )}

      <div
        className="rounded-2xl bg-surface-container-lowest"
        style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-ambient)' }}
      >
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 m-0 mb-3">
          Jouw antwoorden
        </p>
        <ol className="list-none m-0 p-0 flex flex-col gap-2.5">
          {steps.map((s, i) => {
            if (s.kind !== 'mcq') return null;
            const pick = chosen[s.question.id];
            const right = pick?.is_correct ?? false;
            const correct = s.question.options.find(o => o.is_correct);
            return (
              <li key={s.question.id} className="flex gap-3">
                <span
                  className="inline-flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 26, height: 26, marginTop: 1,
                    background: right ? 'rgba(254,118,44,0.16)' : 'rgba(186,26,26,0.10)',
                    color: right ? '#a24000' : '#ba1a1a',
                  }}
                >
                  {right
                    ? <Check size={14} strokeWidth={3} aria-hidden />
                    : <X size={14} strokeWidth={3} aria-hidden />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="text-sm font-semibold text-on-surface m-0 mb-0.5">
                    {i + 1}. {s.question.prompt}
                  </p>
                  <p className="text-xs text-on-surface-variant m-0">
                    {pick
                      ? <>Jouw antwoord: <strong>{pick.label}</strong></>
                      : <>Niet beantwoord</>}
                    {!right && correct && <> · juist: <strong>{correct.label}</strong></>}
                  </p>
                  {canSeeExplanations && !right && s.question.explanation && (
                    <p className="text-xs text-on-surface-variant mt-1 mb-0" style={{ lineHeight: 1.6 }}>
                      {s.question.explanation}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {!canSeeExplanations && (
          <div
            className="mt-4 rounded-xl flex items-center justify-between gap-4 flex-wrap"
            style={{ padding: '0.9rem 1.1rem', background: '#fff6ec', border: '1px solid #f5cba6' }}
          >
            <p className="text-sm m-0" style={{ color: '#a24000' }}>
              Uitleg per vraag zit in het Compleet-pakket.
            </p>
            <Link
              href="/premium"
              className="text-sm font-bold no-underline whitespace-nowrap"
              style={{ color: '#a24000' }}
            >
              Bekijk de pakketten →
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={dashboardHref}
          className="exam-ghost-btn inline-flex items-center gap-2 rounded-xl font-semibold text-sm no-underline bg-surface-container text-on-surface-variant"
          style={{ padding: '0.7rem 1.1rem' }}
        >
          <ArrowLeft size={15} strokeWidth={2.4} aria-hidden />
          Alle examens
        </Link>
      </div>
      {attemptId === null && userId && (
        <p className="text-xs text-on-surface-variant m-0">
          Deze poging kon niet worden opgeslagen. Probeer het later opnieuw.
        </p>
      )}
      <style>{`
        .exam-ghost-btn { transition: background-color .16s ease, transform .16s ease; }
        .exam-ghost-btn:hover { background: var(--color-surface-container-high); transform: translateY(-1px); }
        .exam-ghost-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .exam-ghost-btn { transition: none; } }
      `}</style>
      <PrimaryBtnStyles />
    </div>
  );
}

/* ── Sub-views ── */

/**
 * Het instructiescherm van B1 Luisteren: hoe dit examen werkt, voordat de klok loopt.
 *
 * ## Waarom dit scherm er is
 * Twee dingen aan dit onderdeel verrassen je als niemand ze vertelt: de audio start uit zichzelf
 * na 25 seconden, en je hoort elk fragment maar één keer. Een kandidaat die dat ontdekt tijdens
 * vraag 1 is vraag 1 kwijt. DUO zet er daarom een instructiescherm vóór, met gesproken uitleg.
 *
 * ## Waarom de tekst van ons is en niet van DUO
 * Het referentiemateriaal is auteursrechtelijk beschermd en wordt alleen voor de *vorm* gebruikt
 * (CLAUDE.md §9). Bovendien zou letterlijk overnemen hier onwaar worden: DUO zegt "drie of vier
 * antwoordmogelijkheden" en "klik op Volgende", en bij ons zijn het er altijd drie. Dezelfde
 * feiten, onze woorden, en gecontroleerd tegen wat de speler echt doet.
 *
 * ## Het afspelen is ook het gebaar
 * De browser blokkeert programmatisch afspelen tot de gebruiker één keer iets heeft aangeklikt.
 * Wie hier de uitleg beluistert, deblokkeert daarmee de autostart van vraag 1. Wie dat niet doet
 * krijgt bij de eerste vraag een startknop in plaats van een autostart — `AudioPlayer` vangt het
 * geblokkeerde `play()` op en laat de knop staan.
 */
function LuisterInstructie({ onStart }: { onStart: () => void }) {
  const regels = [
    'Je maakt een luisterexamen. De opgaven horen bij zes verschillende gesprekken.',
    'Bij elk gesprek hoor je eerst een introductie: waar het gesprek over gaat, en hoe het begint. Daar hoort nog geen vraag bij.',
    'Daarna hoor je steeds een stukje van het gesprek. Bij elk stukje hoort één vraag.',
    'Je krijgt eerst 25 seconden om de vraag en de antwoorden te lezen. Daarna start het fragment vanzelf.',
    'Je hoort elk fragment één keer. Je kunt niet pauzeren, terugspoelen of opnieuw luisteren.',
    'Bij elke vraag staan drie antwoorden. Klik het goede antwoord aan.',
    'Je mag je antwoord veranderen zolang je bij de vraag bent. Het laatste antwoord telt.',
    'Klik op ‘Volgende’ om naar de volgende vraag te gaan. Terug naar een vraag die je gehad hebt kan niet.',
    'Je hebt 90 minuten voor het hele examen. De tijd begint zodra je op ‘Start het examen’ klikt.',
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div
        className="rounded-3xl relative overflow-hidden"
        style={{ background: 'var(--gradient-brand)', padding: '2rem 1.875rem 2.25rem' }}
      >
        <p className="text-[0.65rem] font-bold uppercase tracking-widest m-0 mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Voordat je begint
        </p>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold m-0 mb-4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
          Zo werkt het luisterexamen
        </h1>
        <p className="text-sm leading-relaxed m-0 mb-5" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Luister naar de uitleg of lees hem hieronder. Dit examen werkt net als het echte
          examen van DUO.
        </p>
        <AudioPlayer src={LUISTEREN_INSTRUCTIE_AUDIO} label="Gesproken uitleg" />
      </div>

      <div className="rounded-2xl bg-surface-container-lowest" style={{ padding: '1.5rem 1.625rem', boxShadow: 'var(--shadow-card-md)' }}>
        <ul className="flex flex-col gap-3.5 m-0 p-0" style={{ listStyle: 'none' }}>
          {regels.map((r, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="flex-shrink-0 inline-flex items-center justify-center rounded-full font-bold"
                style={{
                  width: 22, height: 22, marginTop: 1,
                  background: 'rgba(0,43,109,0.08)',
                  color: 'var(--color-primary)',
                  fontSize: '0.7rem',
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-on-surface">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="exam-primary-btn inline-flex items-center justify-center gap-2 rounded-xl font-bold border-0 cursor-pointer self-start"
        style={{ padding: '0.9rem 1.75rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
      >
        Start het examen
        <ArrowRight size={17} strokeWidth={2.5} aria-hidden className="rtl-flip" />
      </button>
    </div>
  );
}

function ExamIntroScreen({
  content,
  totalItems,
  isOpenSkill,
  readAloudSample,
  feedbackMode,
  onFeedbackModeChange,
  onStart,
}: {
  content: ExamContent;
  totalItems: number;
  /** Only the rubric skills have per-answer feedback to withhold, so only they get the choice. */
  isOpenSkill: boolean;
  /**
   * A question clip to offer as a sample, or null where this onderdeel has no read-aloud.
   *
   * Non-null is what puts the autoplay question on the start screen. Pressing the sample is
   * also the gesture that unlocks programmatic playback for the whole sitting — without it the
   * first question is silent and reads as broken.
   */
  readAloudSample: string | null;
  feedbackMode: FeedbackMode;
  onFeedbackModeChange: (mode: FeedbackMode) => void;
  onStart: () => void;
}) {
  const { exam } = content;
  const empty = totalItems === 0;
  /* Zelfde regel als in de shell; zie `LUISTEREN_LEESTIJD_SECONDEN`. */
  const strengLuisteren = exam.skill === 'luisteren' && exam.level === 'b1';

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {/* The exam-set header is the same Dutch Horizon banner as every page header on the public
          site, so a candidate arriving from `/oefenexamen/...` lands on a surface that looks like
          the one they clicked from. No sun disc: the card is only ~200px tall and the stats run to
          the right edge, so there is no empty flank the accent could occupy without landing on
          copy (§7.3). */}
      <div
        className="rounded-3xl relative overflow-hidden"
        style={{ background: 'var(--gradient-brand)', padding: '2rem 1.875rem 2.25rem' }}
      >
        <HorizonBanner desktopHouses={11} desktopHeight={56} mobileHouses={5} mobileHeight={40} seed={7} sun={false} />
        <p className="relative text-[0.65rem] font-bold uppercase tracking-widest m-0 mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Oefenexamen {exam.number}
        </p>
        <h1
          className="relative font-headline font-extrabold text-white m-0 mb-4"
          style={{ fontSize: '1.7rem', letterSpacing: '-0.02em', textWrap: 'balance' }}
        >
          {exam.title || `Oefenexamen ${exam.skill} ${exam.number}`}
        </h1>
        <dl className="relative flex flex-wrap gap-7 m-0">
          <Stat value={String(totalItems)} label={exam.skill === 'spreken' || exam.skill === 'schrijven' ? 'opdrachten' : 'vragen'} />
          <Stat value={String(Math.round(exam.duration_seconds / 60))} label="minuten" />
          <Stat value={`${exam.pass_threshold_pct}%`} label="oefengrens" />
        </dl>
      </div>

      <div
        className="rounded-2xl bg-surface-container-lowest"
        style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-ambient)' }}
      >
        {/* Bij streng luisteren gaat "heen en terug" niet op — daar loopt het examen alleen
            vooruit. Eén zin die niet klopt over hoe de navigatie werkt kost de kandidaat een
            vraag voordat hij doorheeft dat het anders is. */}
        <p className="text-sm leading-relaxed text-on-surface-variant m-0">
          {strengLuisteren ? (
            <>
              De klok loopt zodra je begint. Je hoort elk fragment één keer en gaat steeds
              vooruit; teruggaan naar een vraag kan niet. Op het volgende scherm staat de
              volledige uitleg. Alle opgaven zijn gemaakt en nagekeken door een NT2-docent.
            </>
          ) : (
            <>
              De klok loopt zodra je begint. Je kunt heen en terug tussen de vragen en je antwoord
              nog aanpassen tot je inlevert. Alle opgaven zijn gemaakt en nagekeken door een
              NT2-docent.
            </>
          )}
        </p>
      </div>

      {readAloudSample && !empty && (
        <AudioPrefRow
          sampleUrl={readAloudSample}
          labels={{
            heading: 'Vragen voorlezen',
            onDesc: 'Elke vraag en elk antwoord wordt automatisch voorgelezen.',
            offDesc: 'Zet dit aan om elke vraag te laten voorlezen.',
            playSample: 'Beluister',
            stopSample: 'Stop',
            turnOn: 'Voorlezen aanzetten',
            turnOff: 'Voorlezen uitzetten',
          }}
        />
      )}

      {isOpenSkill && !empty && (
        <fieldset className="rounded-2xl bg-surface-container-lowest border-0 m-0" style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-ambient)' }}>
          <legend className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 p-0 mb-3">
            Hoe wil je oefenen?
          </legend>
          <div className="flex flex-col gap-2.5">
            {([
              {
                value: 'practice' as const,
                title: 'Oefenmodus',
                body: 'Je krijgt na elke opdracht feedback en kunt je antwoord aanpassen. Zo leer je het snelst.',
              },
              {
                value: 'exam' as const,
                title: 'Examenmodus',
                body: 'Je krijgt je beoordeling pas na het inleveren, zoals bij het echte examen. Alleen zo weet je of je er klaar voor bent.',
              },
            ]).map(opt => (
              <label
                key={opt.value}
                className="flex items-start gap-3 rounded-xl cursor-pointer"
                style={{
                  padding: '0.85rem 1rem',
                  border: `1.5px solid ${feedbackMode === opt.value ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: feedbackMode === opt.value ? 'rgba(0,43,109,0.04)' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="feedback-mode"
                  value={opt.value}
                  checked={feedbackMode === opt.value}
                  onChange={() => onFeedbackModeChange(opt.value)}
                  style={{ marginTop: 3, accentColor: 'var(--color-primary)' }}
                />
                <span>
                  <span className="block text-sm font-bold text-on-surface">{opt.title}</span>
                  <span className="block text-xs leading-relaxed text-on-surface-variant mt-0.5">
                    {opt.body}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {empty ? (
        <p className="text-sm text-on-surface-variant m-0">
          Dit examen heeft nog geen opgaven. Kom binnenkort terug.
        </p>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className="exam-primary-btn inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm border-0 cursor-pointer self-start"
          style={{ padding: '0.85rem 1.6rem', background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
        >
          Start het examen
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </button>
      )}
      <PrimaryBtnStyles />
    </div>
  );
}

/**
 * The "Nakijken" affordance and the result of pressing it.
 *
 * Explicit button, not an auto-grade: each press spends money at two providers, and only the
 * candidate knows when the answer is finished. Re-grading is allowed (revising after feedback is
 * the point of Oefenmodus) but `/api/grade-open` caps it at three per task.
 */
function TaskReview({
  task,
  grade,
  hasAnswer,
  canSeeDetail,
  passThresholdPct,
  onGrade,
  hideAction = false,
  compact = false,
  layout = 'stack',
}: {
  task: OpenTaskItem;
  grade: TaskGrade;
  hasAnswer: boolean;
  canSeeDetail: boolean;
  passThresholdPct: number;
  onGrade: () => void;
  /** Spreken renders its own "Nakijken" inside the transcript pane, next to the words. */
  hideAction?: boolean;
  compact?: boolean;
  layout?: 'stack' | 'wide';
}) {
  const busy = grade.state === 'grading';
  const graded = grade.state === 'graded';

  return (
    <div className="flex flex-col gap-3">
      {grade.state !== 'idle' && (
        <RubricFeedback
          criteria={grade.criteria}
          scores={grade.scores}
          answerText={grade.answerText}
          highlights={grade.highlights}
          state={grade.state}
          canSeeDetail={canSeeDetail}
          answerShownElsewhere={hideAction}
          compact={compact}
          layout={layout}
          tips={grade.tips}
          premiumHref="/dashboard/pakketten?vanaf=rubriek-feedback"
          errorMessage={grade.error}
          passThresholdPct={passThresholdPct}
          onRetry={onGrade}
        />
      )}

      {graded && grade.overall && canSeeDetail && layout !== 'wide' && (
        <div
          className="rounded-2xl bg-surface-container-lowest"
          style={{
            padding: compact ? '0.8rem 0.9rem' : '1rem 1.125rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-on-surface m-0`}>
            {grade.overall}
          </p>
          {grade.tips.length > 0 && (
            <ul className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-on-surface-variant mt-2 mb-0 pl-5`}>
              {grade.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hideAction && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onGrade}
            disabled={busy || !hasAnswer}
            className="exam-ghost-btn inline-flex items-center gap-2 rounded-xl font-bold text-sm cursor-pointer"
            style={{
              padding: '0.7rem 1.15rem',
              border: '1.5px solid var(--color-primary)',
              background: 'transparent',
              color: 'var(--color-primary)',
            }}
          >
            <Check size={15} strokeWidth={2.6} aria-hidden />
            {busy ? 'Nakijken…' : graded ? 'Opnieuw nakijken' : 'Nakijken'}
          </button>
          {!hasAnswer && (
            <span className="text-xs text-on-surface-variant">
              {task.task_type === 'speaking'
                ? 'Neem eerst je antwoord op.'
                : 'Schrijf eerst je antwoord.'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 pl-3.5" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
      <dd
        className="font-headline font-extrabold text-white m-0"
        style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </dd>
      <dt className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </dt>
    </div>
  );
}

function TimerBar({
  secondsLeft,
  total,
  step,
  steps,
  answered,
}: {
  secondsLeft: number;
  total: number;
  step: number;
  steps: number;
  answered: number;
}) {
  const pct = total > 0 ? (secondsLeft / total) * 100 : 0;
  const warn = secondsLeft <= 300;
  const m = Math.floor(Math.max(secondsLeft, 0) / 60);
  const s = Math.max(secondsLeft, 0) % 60;

  return (
    <div
      className="rounded-2xl bg-surface-container-lowest flex items-center gap-4 flex-wrap"
      style={{ padding: '0.75rem 1.1rem', boxShadow: 'var(--shadow-card)' }}
    >
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
        {step} / {steps}
      </span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, minWidth: 80, background: '#e0e3e5' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: warn ? 'var(--color-error)' : 'linear-gradient(to right,#a24000,#fe762c)',
            transition: 'width 1s linear',
          }}
        />
      </div>
      <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
        {answered} beantwoord
      </span>
      <span
        className="inline-flex items-center gap-1.5 font-headline font-bold text-sm whitespace-nowrap"
        style={{ color: warn ? 'var(--color-error)' : '#a24000', fontVariantNumeric: 'tabular-nums' }}
      >
        <Clock size={14} strokeWidth={2.5} aria-hidden />
        {m}:{s < 10 ? '0' : ''}{s}
      </span>
    </div>
  );
}

/**
 * Het wachtscherm tussen inleveren en de uitslag.
 *
 * Eén scherm met een teller, want het nakijken duurt bij Spreken echt even: per opdracht een
 * transcriptie plus een modelcall. De beweging is `transform` en `opacity` — de balk schaalt, de
 * drie stippen pulsen — en bij `prefers-reduced-motion` blijft alleen de teller over, die het
 * eigenlijke antwoord op "gebeurt er nog iets?" is.
 */
function GradingScreen({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div
        className="rounded-3xl"
        style={{ background: 'var(--gradient-brand)', padding: '2.5rem 1.875rem' }}
      >
        <p
          className="text-[0.65rem] font-bold uppercase tracking-widest m-0 mb-2"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Ingeleverd
        </p>
        <h1
          className="font-headline font-extrabold text-white m-0 mb-2"
          style={{ fontSize: '1.6rem', letterSpacing: '-0.03em', textWrap: 'balance' }}
        >
          We kijken je opdrachten na
        </h1>
        <p className="text-sm leading-relaxed m-0" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Blijf even op deze pagina. Je krijgt je beoordeling zodra alle opdrachten klaar zijn.
        </p>

        <div
          className="mt-6 rounded-full overflow-hidden"
          style={{ height: '6px', background: 'rgba(255,255,255,0.22)' }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label="Opdrachten nagekeken"
        >
          <div
            className="exam-grade-bar h-full w-full origin-left"
            style={{ background: '#fe762c', transform: `scaleX(${total > 0 ? done / total : 0})` }}
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <p className="text-sm font-bold text-white m-0" aria-live="polite">
            {done} van de {total} nagekeken
            <span className="font-normal" style={{ color: 'rgba(255,255,255,0.7)' }}> · {pct}%</span>
          </p>
          <span className="exam-grade-dots inline-flex gap-1" aria-hidden>
            <i /><i /><i />
          </span>
        </div>
      </div>
      <GradingScreenStyles />
    </div>
  );
}

function GradingScreenStyles() {
  return (
    <style>{`
      .exam-grade-bar { transition: transform .5s cubic-bezier(0.22,1,0.36,1); }
      .exam-grade-dots i {
        width: 6px; height: 6px; border-radius: 9999px; background: rgba(255,255,255,0.75);
        animation: exam-grade-pulse 1.2s cubic-bezier(0.22,1,0.36,1) infinite;
      }
      .exam-grade-dots i:nth-child(2) { animation-delay: .15s; }
      .exam-grade-dots i:nth-child(3) { animation-delay: .3s; }
      @keyframes exam-grade-pulse {
        0%, 100% { opacity: .35; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .exam-grade-bar { transition: none; }
        .exam-grade-dots { display: none; }
      }
    `}</style>
  );
}

function PrimaryBtnStyles() {
  return (
    <style>{`
      .exam-primary-btn { transition: transform .18s cubic-bezier(0.22,1,0.36,1), box-shadow .18s ease; }
      .exam-primary-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: var(--shadow-btn-orange-hover); }
      .exam-primary-btn:not(:disabled):active { transform: translateY(0) scale(0.98); }
      .exam-primary-btn:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) { .exam-primary-btn { transition: none; } }
    `}</style>
  );
}
