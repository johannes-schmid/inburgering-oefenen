'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookA, Check, ChevronRight, Clock, Download, FileCheck2, Flag, Info, LayoutGrid, PenLine, Play, RotateCcw, TriangleAlert, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatedNumber, CategoryMark, Field, PassChanceCard, ScoreRing, glasButton, type Category, type PassChanceLevel } from '@/components/glas';
import { calculateSlaagkans } from '@/lib/exam-readiness';
import PassBurst from './PassBurst';
import './glas-player.css';
import { AudioPrefRow } from './ReadAloud';
import AudioPlayer, { Wave } from './AudioPlayer';
import MicCheck from './MicCheck';
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
import GuestSignupOverlay from './GuestSignupOverlay';
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
 * A2 Luisteren: de leestijd tussen de voorgelezen situatie en het fragment. Korter dan B1, want
 * een A2-vraag heeft drie korte antwoorden; herhalen blijft daar wel vrij (zie `ListenSequence`).
 */
const A2_LUISTEREN_LEESTIJD_SECONDEN = 15;

/** De geluidstest op het startscherm. Bron: `scripts/exam-content/narration/geluidstest.txt`. */
const GELUIDSTEST_AUDIO = '/audio/exam/geluidstest.mp3';

/**
 * De gesproken uitleg op het instructiescherm. Eén bestand in `public/`, niet in Storage: hij is
 * voor elk luisterexamen hetzelfde en verandert alleen als de instructie zelf verandert — dan
 * hoort hij ook in dezelfde commit als de tekst, en dat is precies wat een bestand in de repo
 * afdwingt en een rij in Storage niet.
 */
const LUISTEREN_INSTRUCTIE_AUDIO = '/audio/exam/b1-luisteren-instructie.mp3';

/** Hoeveel opdrachten tegelijk worden nagekeken bij het inleveren. */
const GRADE_CONCURRENCY = 3;

/** DUO waarschuwt een kwartier voor het einde; alleen bij een examen dat langer duurt dan dit. */
const WAARSCHUWING_SECONDEN = 15 * 60;
const WAARSCHUWING_VANAF_DUUR = 20 * 60;
/** De stappen van de loep. De keuze wordt per kijker onthouden (alleen gemak, mag leeg zijn). */
const ZOOM_STAPPEN = [1, 1.15, 1.3, 1.5] as const;
const ZOOM_KEY = 'examen-zoom';

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
  /**
   * Gezet als er géén account achter deze zitting zit: de gast mag `limit` vragen maken en
   * krijgt daarna `GuestSignupOverlay`. Weglaten is de normale, ingelogde zitting.
   *
   * Er wordt voor een gast niets weggeschreven — elke schrijfactie in dit bestand hangt al aan
   * `userId`, dat zonder sessie `null` blijft. De antwoorden gaan naar `sessionStorage` en
   * worden na het inloggen teruggezet; dat is wat "voortgang bewaard" op de kaart waarmaakt.
   */
  guest?: { limit: number; locale: string; returnTo: string } | null;
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

export default function ExamShell({ content, canSeeExplanations, guest = null }: Props) {
  const { exam, parts, stimuli, standalone, tasks, sectionNames } = content;
  const supabase = useMemo(() => createClient(), []);
  const isOpenSkill = exam.skill === 'schrijven' || exam.skill === 'spreken';
  /** Zie `LUISTEREN_LEESTIJD_SECONDEN`: de examenstand is er voorlopig alleen voor B1. */
  const strengLuisteren = exam.skill === 'luisteren' && exam.level === 'b1';
  /** A2 Luisteren loopt zoals DUO: situatie, leestijd, fragment, en dan de vraag voorgelezen. */
  const a2Luisteren = exam.skill === 'luisteren' && exam.level === 'a2';
  /** B1 Spreken loopt zoals DUO: voorgelezen, kijk- of voorbereidingstijd, pieptoon, opname. */
  const b1Spreken = exam.skill === 'spreken' && exam.level === 'b1';
  /** B1 Lezen: bij DUO staan de teksten in een papieren tekstboekje; wij bieden een tabblad en een PDF. */
  const b1Lezen = exam.skill === 'lezen' && exam.level === 'b1';
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

  /**
   * De groepen van de voortgangsbalk (glas.html §10): één segment per tekstdeel, niet per vraag.
   * Een deeltoets (`part`) of een stimulus is een groep; losse vragen (KNM) en losse opdrachten
   * worden in blokjes van acht gezet, zodat veertig vragen geen veertig streepjes worden.
   */
  const groups = useMemo(() => {
    const keys = steps.map((s, i) => {
      if (s.partId) return `p${s.partId}`;
      if (s.kind === 'mcq' && s.stimulus) return `s${s.stimulus.id}`;
      return `c${Math.floor(i / 8)}`;
    });
    const out: { start: number; size: number }[] = [];
    keys.forEach((k, i) => {
      if (i > 0 && keys[i - 1] === k) out[out.length - 1].size++;
      else out.push({ start: i, size: 1 });
    });
    // Te veel kleine groepen leest als ruis: terugvallen op tien gelijke blokken.
    if (out.length > 14) {
      const per = Math.ceil(steps.length / 10);
      return Array.from({ length: Math.ceil(steps.length / per) }, (_, g) => ({
        start: g * per,
        size: Math.min(per, steps.length - g * per),
      }));
    }
    return out;
  }, [steps]);

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
  /** Staat de aanmeldkaart over het examen? Alleen een gast kan hem krijgen. */
  const [wall, setWall] = useState(false);
  /** Het kruisje in de glazen balk vraagt eerst of je echt wilt stoppen. */
  const [closing, setClosing] = useState(false);
  /** "Examen inleveren" vraagt eerst of het definitief is, met wat er nog open staat. */
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  /** A2 Luisteren: de vraag waarvan het fragment net is afgelopen, en die nu voorgelezen wordt. */
  const [readFor, setReadFor] = useState<number | null>(null);
  /** Gemarkeerde stappen (0-based), zoals het vlaggetje bij DUO: "hier kom ik nog op terug". */
  const [flags, setFlags] = useState<Record<number, true>>({});
  /** Het overzichtsscherm: alle nummers, wat beantwoord en gemarkeerd is, en inleveren. */
  const [overview, setOverview] = useState(false);
  /** De kwartierwaarschuwing is weggeklikt ("Sluit"); hij komt daarna niet terug. */
  const [warn15Closed, setWarn15Closed] = useState(false);
  const [zoom, setZoom] = useState(0);
  /** De loep van de vorige keer; gelezen bij de start, want de server kent `localStorage` niet. */
  function restoreZoom() {
    try {
      const v = Number(window.localStorage.getItem(ZOOM_KEY));
      if (v > 0 && v < ZOOM_STAPPEN.length) setZoom(v);
    } catch { /* privévenster: dan begint de loep op 100% */ }
  }
  function changeZoom(next: number) {
    const z = Math.min(Math.max(next, 0), ZOOM_STAPPEN.length - 1);
    setZoom(z);
    try { window.localStorage.setItem(ZOOM_KEY, String(z)); } catch { /* idem */ }
  }
  /** Lezen op een smal scherm: tekst of vraag in beeld, per stimulus onthouden. */
  const [paneFor, setPaneFor] = useState<{ id: number | null; v: 'tekst' | 'vragen' }>({ id: null, v: 'tekst' });

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

  /**
   * De sleutel waaronder de antwoorden van een gast tussen twee pagina's blijven staan.
   *
   * `sessionStorage` en niet de database: er is geen account om ze aan te hangen, en een
   * gastzitting hoort geen rij in `exam_attempts` te maken die bij niemand hoort. Per examen,
   * zodat twee tabbladen elkaars werk niet overschrijven.
   */
  const resumeKey = `exam-resume:${exam.id}`;

  // Bewaren zolang hij gast is.
  useEffect(() => {
    if (!guest) return;
    try {
      const ids: Record<number, number> = {};
      for (const [qid, option] of Object.entries(chosen)) ids[Number(qid)] = option.id;
      sessionStorage.setItem(resumeKey, JSON.stringify(ids));
    } catch {
      // Private mode, volle opslag: de zitting mag hier niet op stuklopen.
    }
  }, [guest, chosen, resumeKey]);

  /**
   * Terugzetten zodra hij géén gast meer is — dat is de terugkeer van Google.
   *
   * Eenmalig, en de sleutel wordt meteen opgeruimd: anders zou een tweede zitting van hetzelfde
   * examen beginnen met de antwoorden van de vorige, en dat is geen hervatten maar spoken.
   */
  const resumedRef = useRef(false);
  useEffect(() => {
    if (guest || resumedRef.current || steps.length === 0) return;
    resumedRef.current = true;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(resumeKey);
      if (raw) sessionStorage.removeItem(resumeKey);
    } catch {
      return;
    }
    if (!raw) return;

    let ids: Record<string, number>;
    try { ids = JSON.parse(raw) as Record<string, number>; } catch { return; }

    const picks: Record<number, OptionItem> = {};
    for (const step of steps) {
      if (step.kind !== 'mcq') continue;
      const optionId = ids[String(step.question.id)];
      const option = step.question.options.find(o => o.id === optionId);
      if (option) picks[step.question.id] = option;
    }
    const count = Object.keys(picks).length;
    if (count === 0) return;

    setChosen(picks);
    void startExam().then(() => goTo(Math.min(count, steps.length - 1)));
    track('exam_guest_resumed', { skill: exam.skill, exam_number: exam.number, answered: count });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest, steps, resumeKey]);

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
    restoreZoom();
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
    // De grens van de gast. Vooruit is de vraag die hij niet meer gratis krijgt; terug mag
    // altijd, anders zou de kaart ook zijn eigen antwoorden afsluiten.
    if (guest && next > idx && next >= guest.limit) {
      setWall(true);
      track('exam_guest_wall', { skill: exam.skill, exam_number: exam.number, answered: Object.keys(chosen).length });
      return;
    }
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

  const answeredCount = isOpenSkill
    ? tasks.filter(t => written[t.id]?.text?.trim() || written[t.id]?.json || spoken[t.id]?.blob).length
    : Object.keys(chosen).length;

  const isDone = (st: Step) =>
    st.kind === 'mcq' ? Boolean(chosen[st.question.id]) : hasAnswer(written[st.task.id], spoken[st.task.id]);
  const segments: Segment[] = groups.map(g => ({
    size: g.size,
    done: steps.slice(g.start, g.start + g.size).filter(isDone).length,
    current: idx >= g.start && idx < g.start + g.size,
  }));

  /**
   * B1 Spreken in Examenmodus loopt zoals bij DUO alleen vooruit: elke opdracht start vanzelf,
   * je neemt één keer op, en er is geen overzicht om terug te springen.
   */
  const lineair = b1Spreken && feedbackMode === 'exam';
  /** Bij streng luisteren mag je vooruit springen, niet terug: terug speelt het fragment opnieuw. */
  const canJumpTo = (n: number) => !lineair && (!strengLuisteren || n > idx);

  /** The glass bar above every in-sitting screen: close, segmented progress, tools, the clock. */
  const bar = (
    <>
      <ExamBar
        skill={exam.skill}
        segments={segments}
        step={idx + 1}
        steps={totalItems}
        secondsLeft={secondsLeft}
        onClose={() => setClosing(true)}
        flag={phase === 'exam' && !lineair
          ? { on: Boolean(flags[idx]), toggle: () => setFlags(prev => {
              const next = { ...prev };
              if (next[idx]) delete next[idx]; else next[idx] = true;
              return next;
            }) }
          : null}
        zoom={{ level: zoom, max: ZOOM_STAPPEN.length - 1, set: changeZoom }}
      />
      {!warn15Closed && exam.duration_seconds > WAARSCHUWING_VANAF_DUUR && secondsLeft > 0 && secondsLeft <= WAARSCHUWING_SECONDEN && (
        <div className="g-xwarn" role="status">
          <Clock aria-hidden />
          <span>Nog 15 minuten. Kijk in het overzicht of u alles hebt gedaan.</span>
          <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => setWarn15Closed(true)}>
            Sluit
          </button>
        </div>
      )}
    </>
  );
  const zoomStyle = zoom > 0 ? ({ zoom: ZOOM_STAPPEN[zoom] } as React.CSSProperties) : undefined;
  const closeDialog = closing && (
    <CloseDialog href={dashboardHref} onStay={() => setClosing(false)} />
  );

  if (phase === 'part') {
    const part = firstPartFor(idx);
    return (
      <ExamFrame skill={exam.skill}>
        {bar}
        <div className="g-xbody" style={{ maxWidth: 760, width: '100%', marginInline: 'auto' }}>
          <span className="g-mono">{part?.title}</span>
          {b1Spreken && part && (
            /* DUO leest de instructie van elk deel voor, met een voorbeeld, en begint daarna
               vanzelf aan de eerste opdracht. "Verder" blijft om het over te slaan. */
            <PartInstructieAudio
              key={part.id}
              src={`/audio/exam/b1-spreken-deel${part.sort_order}.mp3`}
              onEnded={() => setPhase(firstIntroFor(idx) ? 'tekstintro' : 'exam')}
            />
          )}
          {part?.instruction_html ? (
            /* Tag-level rules live in .exam-rich in app/globals.css — see the note there. */
            <div
              className="g-xprompt exam-rich exam-rich-scroll"
              style={{ marginTop: 12 }}
              dangerouslySetInnerHTML={{ __html: part.instruction_html }}
            />
          ) : (
            <p className="g-xintro-line" style={{ marginTop: 12 }}>Lees de opdracht goed door.</p>
          )}
        </div>
        <div className="g-xfoot g-glass">
          <span className="g-xfoot-sp" />
          <button
            type="button"
            onClick={() => setPhase(firstIntroFor(idx) ? 'tekstintro' : 'exam')}
            className="g-btn g-btn-navy g-btn-sm"
          >
            Verder
            <ArrowRight className="rtl-flip" aria-hidden />
          </button>
        </div>
        {closeDialog}
      </ExamFrame>
    );
  }

  if (phase === 'tekstintro') {
    const s = firstIntroFor(idx);
    return (
      <ExamFrame skill={exam.skill}>
        {bar}
        <div className="g-xbody" style={{ maxWidth: 760, width: '100%', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="g-mono">{sectionNames[s?.section_id ?? -1] ?? 'Luisteren'}</span>
          {s?.title && <h2 className="g-xtitle" style={{ margin: 0 }}>{s.title}</h2>}
          {s?.intro && <p className="g-xintro-line">{s.intro}</p>}
          {s?.intro_audio_url && <AudioPlayer src={s.intro_audio_url} label="Introductie" />}
        </div>
        <div className="g-xfoot g-glass">
          <span className="g-xfoot-sp" />
          <button type="button" onClick={() => setPhase('exam')} className="g-btn g-btn-navy g-btn-sm">
            Verder
            <ArrowRight className="rtl-flip" aria-hidden />
          </button>
        </div>
        {closeDialog}
      </ExamFrame>
    );
  }

  if (phase === 'exam') {
    const step = steps[idx];
    if (!step) return null;
    const isTextStimulus = step.kind === 'mcq' && step.stimulus?.kind === 'text';
    const stimId = step.kind === 'mcq' ? step.stimulus?.id ?? null : null;
    const pane = paneFor.id === stimId ? paneFor.v : 'tekst';

    return (
      <ExamFrame skill={exam.skill}>
        {bar}

        <div className="g-xzoom" style={zoomStyle}>
        {step.kind === 'mcq' && step.stimulus === null ? (
          // Standalone question (KNM): one column, centred to a readable measure rather than
          // stretched across the grid's full width, which would leave a 1,200px line length.
          <div style={{ maxWidth: 760, width: '100%', marginInline: 'auto' }}>
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
          <>
            {/* Glas §10: op een smal scherm staan tekst en vragen niet onder elkaar maar achter
                een schakelaar — een DUO-tekst is langer dan één scherm, en de vraag eronder
                verdwijnt dan uit beeld. Alleen bij een tekst; bij luisteren horen de capsule en de
                vraag juist samen in beeld. */}
            {isTextStimulus && (
              <div className="g-xswitch" role="tablist" aria-label="Weergave">
                {(['tekst', 'vragen'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={pane === v}
                    onClick={() => setPaneFor({ id: stimId, v })}
                  >
                    {v === 'tekst' ? 'Tekst' : 'Vraag'}
                  </button>
                ))}
              </div>
            )}
            <div className="g-xlezen" data-pane={isTextStimulus ? pane : undefined}>
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
              <div className="g-xlezen-text">
                <StimulusPane
                  key={exam.skill === 'luisteren'
                    ? `${step.stimulus!.id}:${step.question.id}`
                    : step.stimulus!.id}
                  stimulus={step.stimulus!}
                  examenAudio={strengLuisteren ? { readSeconds: LUISTEREN_LEESTIJD_SECONDEN } : undefined}
                  sectionName={step.stimulus!.section_id ? sectionNames[step.stimulus!.section_id] : undefined}
                  textHref={b1Lezen && step.stimulus!.kind === 'text'
                    ? `/nl/tekstboekje/${exam.level}/${exam.number}#tekst-${stimuli.filter(x => x.kind === 'text').findIndex(x => x.id === step.stimulus!.id) + 1}`
                    : undefined}
                  listen={a2Luisteren ? {
                    readSeconds: A2_LUISTEREN_LEESTIJD_SECONDEN,
                    onReplay: () => setReadFor(null),
                    onFragmentEnd: () => setReadFor(step.question.id),
                  } : undefined}
                />
              </div>
              <div className="g-xlezen-q">
                <McqQuestion
                  question={step.question}
                  questionNumber={idx + 1}
                  total={totalItems}
                  chosenId={chosen[step.question.id]?.id ?? null}
                  onSelect={o => setChosen(prev => ({ ...prev, [step.question.id]: o }))}
                  showFeedback={false}
                  sectionName={step.stimulus!.section_id ? sectionNames[step.stimulus!.section_id] : undefined}
                  readAloud={a2Luisteren}
                  readAloudArmed={readFor === step.question.id}
                />
              </div>
            </div>
          </>
        ) : step.task.task_type === 'speaking' ? (
          <SpeakingTask
            key={step.task.id}
            task={step.task}
            run={b1Spreken ? {
              once: feedbackMode === 'exam',
              onFinished: () => (idx < totalItems - 1 ? goTo(idx + 1) : setConfirmSubmit(true)),
            } : undefined}
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
                  title={`Opdracht ${idx + 1} · beoordeling`}
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
                  pendingText={written[step.task.id]?.text ?? null}
                  title={`Opdracht ${idx + 1}${step.task.title ? ` · ${step.task.title}` : ''}`}
                  hideAction
                  layout="wide"
                />
              ) : null
            }
          />
        )}
        </div>

        {/* The step controls ride in a glass pill at the foot of the shell (sticky, so they stay
            in reach under several screens of feedback). In Examenmodus the candidate gets nothing
            until submit, which is what makes that sitting's score comparable to a real exam. */}
        <div className="g-xfoot g-glass exam-nav">
          {/* Bij streng luisteren is er geen weg terug, en dat is geen strengheid om de
              strengheid: `StimulusPane` remount per vraag, dus "Vorige" zou het fragment
              opnieuw starten en de kandidaat een tweede luisterbeurt geven — precies wat de
              instructie zegt dat er niet is. DUO's luisterexamen loopt om dezelfde reden
              alleen vooruit. */}
          {!strengLuisteren && !lineair && (
            <button
              type="button"
              onClick={() => goTo(idx - 1)}
              disabled={idx === 0}
              className="g-btn g-btn-ghost g-btn-sm"
            >
              <ArrowLeft className="rtl-flip" aria-hidden />
              Vorige
            </button>
          )}
          <span className="g-xfoot-sp" />
          <span className="g-xfoot-meta">
            {lineair && idx < totalItems - 1 ? 'De volgende opdracht start vanzelf.' : `${answeredCount} beantwoord`}
          </span>

          {!lineair && (
            <button type="button" onClick={() => setOverview(true)} className="g-btn g-btn-ghost g-btn-sm g-xfoot-ov" aria-label="Overzicht">
              <LayoutGrid aria-hidden />
              <span>Overzicht</span>
            </button>
          )}

          {lineair && idx < totalItems - 1 ? null : idx < totalItems - 1 ? (
            <button type="button" onClick={() => goTo(idx + 1)} className="g-btn g-btn-navy g-btn-sm">
              Volgende
              <ArrowRight className="rtl-flip" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              className="g-btn g-btn-navy g-btn-sm"
            >
              <FileCheck2 aria-hidden />
              {submitting ? 'Inleveren…' : 'Examen inleveren'}
            </button>
          )}
        </div>

        {closeDialog}

        {overview && (
          <OverviewDialog
            items={steps.map((st, i) => ({ n: i + 1, done: isDone(st), flagged: Boolean(flags[i]), current: i === idx }))}
            noun={isOpenSkill ? 'opdrachten' : 'vragen'}
            canJump={n => canJumpTo(n - 1)}
            onJump={n => { setOverview(false); goTo(n - 1); }}
            onStay={() => setOverview(false)}
            onSubmit={() => { setOverview(false); setConfirmSubmit(true); }}
          />
        )}

        {confirmSubmit && (
          <SubmitDialog
            secondsLeft={secondsLeft}
            open={steps.map((st, i) => (isDone(st) ? null : i + 1)).filter((n): n is number => n !== null)}
            flagged={Object.keys(flags).length}
            noun={isOpenSkill ? 'opdrachten' : 'vragen'}
            onOverview={lineair ? undefined : () => { setConfirmSubmit(false); setOverview(true); }}
            onStay={() => setConfirmSubmit(false)}
            onSubmit={() => { setConfirmSubmit(false); void submitExam(); }}
          />
        )}

        {/* De gastgrens. Het examen blijft eronder staan — zie `GuestSignupOverlay`. */}
        {wall && guest && (
          <GuestSignupOverlay
            answered={Object.keys(chosen).length}
            nextNumber={Math.min(guest.limit + 1, totalItems)}
            locale={guest.locale}
            returnTo={guest.returnTo}
          />
        )}
      </ExamFrame>
    );
  }

  /* ── Results ── */

  const pct = totalItems > 0 ? Math.round((score / totalItems) * 100) : 0;
  const passed = pct >= exam.pass_threshold_pct;
  const examLabel = `${skillLabel(exam.skill, exam.level)} · examen ${exam.number}`;
  const usedMin = Math.max(0, Math.round((exam.duration_seconds - secondsLeft) / 60));
  const totalMin = Math.round(exam.duration_seconds / 60);

  if (isOpenSkill) {
    const open = openResultFrom(tasks, written, spoken, grades, exam.pass_threshold_pct);
    const answeredTasks = tasks.filter(t => hasAnswer(written[t.id], spoken[t.id]));
    const ungraded = answeredTasks.filter(t => grades[t.id]?.state !== 'graded');
    // Een mislukte nakijkbeurt is géén "de docent kijkt er nog naar": daar komt niemand meer langs.
    // Het verschil stond nergens op het scherm, waardoor een rate limit of een paywall als een
    // wachtrij las en de kandidaat bleef wachten op een uitslag die nooit kwam.
    const failed = answeredTasks.filter(t => grades[t.id]?.state === 'error');
    const failedReason = failed.map(t => grades[t.id]?.error).find(Boolean) ?? null;
    // Eén segment per opdracht: gevuld = die opdracht haalde de oefengrens.
    const taskResults = tasks.map(t => {
      const g = grades[t.id];
      if (!g || g.state !== 'graded') return false;
      const tp = pctFromCriteria(g.scores, g.criteria);
      return tp != null && tp >= exam.pass_threshold_pct;
    });

    return (
      <ResultsFrame>
        <section className="g-xres">
          <div className="g-xres-ring">
            <ScoreRing
              results={taskResults}
              passPct={exam.pass_threshold_pct}
              size={176}
              label={open.pct == null ? 'Nog niet nagekeken' : `${open.pct}% van de punten`}
            >
              <b>{open.pct == null ? '—' : <AnimatedNumber value={open.pct} suffix="%" locales="nl" />}</b>
              <small>{open.pct == null ? 'ingeleverd' : 'van de punten'}</small>
            </ScoreRing>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {open.passed === true && <PassBurst label="Gehaald" />}
              <span className={`g-xbdg ${open.pct == null ? '' : open.passed ? 'g-xbdg-goed' : 'g-xbdg-fout'}`}>
                {open.pct == null ? null : open.passed ? <Check strokeWidth={3} aria-hidden /> : <X strokeWidth={3} aria-hidden />}
                {open.pct == null ? 'Ingeleverd' : open.passed ? 'Gehaald' : 'Nog niet gehaald'}
              </span>
            </div>
            <h1>{open.pct == null ? 'Je antwoorden zijn opgeslagen' : examLabel}</h1>
            <p>
              {open.pct == null
                ? 'De docent kijkt je antwoorden na. Je ziet je beoordeling terug in je dashboard.'
                : 'Een taalmodel beoordeelde je antwoorden met de criteria van de docent. Zij controleert die beoordeling; je ziet het in je dashboard zodra dat gebeurd is. Dit is oefenfeedback, geen uitslag van DUO.'}
            </p>
            {answeredTasks.length < tasks.length && (
              <p>
                Je hebt {tasks.length - answeredTasks.length} van de {tasks.length} opdrachten
                overgeslagen. Die tellen als 0 mee.
              </p>
            )}
            {feedbackMode === 'practice' && (
              <p className="g-xnotice" style={{ fontSize: 13.5 }}>
                <Info aria-hidden />
                <span>
                  Dit was een oefensessie met feedback tijdens het examen. Wil je weten of je er klaar
                  voor bent, doe het dan nog eens in de examenmodus.
                </span>
              </p>
            )}
          </div>
        </section>

        {open.pct != null && (
          <PassChance pct={open.pct} />
        )}

        {ungraded.length - failed.length > 0 && (
          <p className="g-xintro-line">
            {ungraded.length - failed.length === 1
              ? 'Eén opdracht wordt nog nagekeken.'
              : `${ungraded.length - failed.length} opdrachten worden nog nagekeken.`}
          </p>
        )}

        {failed.length > 0 && (
          <div className="g-xcard" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="g-xrv-err" style={{ fontWeight: 700 }}>
              <TriangleAlert aria-hidden />
              {failed.length === 1
                ? 'Eén opdracht kon niet worden nagekeken.'
                : `${failed.length} opdrachten konden niet worden nagekeken.`}
            </p>
            {failedReason && <p className="g-xintro-line">{failedReason}</p>}
            <p className="g-xintro-line">
              Je antwoorden zijn bewaard. Probeer het opnieuw — je verliest je werk niet.
            </p>
            <button
              type="button"
              onClick={() => void regradeFailed()}
              disabled={regrading}
              className="g-btn g-btn-navy g-btn-sm"
              style={{ alignSelf: 'flex-start' }}
            >
              <RotateCcw aria-hidden />
              {regrading ? 'Bezig met nakijken…' : 'Opnieuw laten nakijken'}
            </button>
          </div>
        )}

        {/* Per opdracht, in the order they were sat. */}
        {tasks.map((task, i) => {
          const g = grades[task.id];
          if (!g || g.state !== 'graded') return null;
          return (
            <section key={task.id} className="g-xstack" style={{ gap: 8 }}>
              <RubricFeedback
                criteria={g.criteria}
                scores={g.scores}
                answerText={g.answerText}
                highlights={g.highlights}
                canSeeDetail={!RUBRIC_FEEDBACK_IS_GATED || canSeeExplanations}
                premiumHref="/dashboard/pakketten?vanaf=rubriek-feedback"
                passThresholdPct={exam.pass_threshold_pct}
                medium={exam.skill === 'spreken' ? 'opname' : 'tekst'}
                title={`Opdracht ${i + 1}${task.title ? ` · ${task.title}` : ''}`}
              />
              {canSeeExplanations && g.overall && (
                <p className="g-xintro-line" style={{ paddingInline: 4 }}>{g.overall}</p>
              )}
            </section>
          );
        })}

        <div className="g-xrow-act">
          <Link href={dashboardHref} className={glasButton({ variant: 'navy' })}>
            Naar je dashboard
            <ArrowRight className="rtl-flip" aria-hidden />
          </Link>
        </div>
      </ResultsFrame>
    );
  }

  const ringResults = steps.flatMap(s => (s.kind === 'mcq' ? [Boolean(chosen[s.question.id]?.is_correct)] : []));
  const wrong = ringResults.filter(r => !r).length;

  return (
    <ResultsFrame>
      <section className="g-xres">
        <div className="g-xres-ring">
          <ScoreRing results={ringResults} passPct={exam.pass_threshold_pct} size={176} label={`${score} van ${totalItems} goed`}>
            <b><AnimatedNumber value={score} locales="nl" /><span>/{totalItems}</span></b>
            <small>{pct}% goed</small>
          </ScoreRing>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {passed && <PassBurst label="Gehaald" />}
            <span className={`g-xbdg ${passed ? 'g-xbdg-goed' : 'g-xbdg-fout'}`}>
              {passed ? <Check strokeWidth={3} aria-hidden /> : <X strokeWidth={3} aria-hidden />}
              {passed ? 'Gehaald' : 'Nog niet gehaald'}
            </span>
          </div>
          <h1>{examLabel}</h1>
          <p>
            Elke streep is een vraag: gevuld is goed, leeg is fout. Het oranje streepje is onze
            oefengrens van {exam.pass_threshold_pct}%. DUO maakt zijn eigen cesuur niet openbaar.
          </p>
          <div className="g-xkpis">
            <div className="g-xkpi g-xkpi-g"><b><Check strokeWidth={3} aria-hidden />{score}</b><small>goed</small></div>
            <div className="g-xkpi g-xkpi-f"><b><X strokeWidth={3} aria-hidden />{wrong}</b><small>fout of open</small></div>
            <div className="g-xkpi"><b><Clock aria-hidden />{usedMin}</b><small>van {totalMin} min</small></div>
          </div>
        </div>
      </section>

      <div className="g-xres-cols">
        <div className="g-xstack">
          {Object.keys(catScores).length > 0 && (
            <div className="g-xcard">
              <span className="g-mono">Resultaat per tekstsoort</span>
              {Object.entries(catScores).map(([name, cs]) => {
                const cp = cs.total ? cs.correct / cs.total : 0;
                // Navy where it went well, clay where there is something to win — never a new hue
                // for a status, and the number beside the bar carries the meaning.
                const col = cp >= 0.7 ? 'var(--navy)' : 'var(--klei)';
                return (
                  <div key={name} className="g-xttrow">
                    <span>{name}</span>
                    <span className="g-xbar2"><i style={{ background: col, transform: `scaleX(${cp})` }} /></span>
                    <span className="g-mono g-tnum">{cs.correct}/{cs.total}</span>
                  </div>
                );
              })}
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
              variant="glas"
              labels={{
                head: 'Dit verklaart je fouten',
                misses: '{n}x fout in dit examen',
                lesson: 'les beschikbaar',
              }}
            />
          )}

          <PassChance pct={pct} />
        </div>

        <div className="g-xstack">
          <div className="g-xcard" style={{ paddingBottom: 8 }}>
            <span className="g-mono">Jouw antwoorden</span>
            <ol className="g-xanslist" style={{ padding: 0 }}>
              {steps.map((s, i) => {
                if (s.kind !== 'mcq') return null;
                const pick = chosen[s.question.id];
                const right = pick?.is_correct ?? false;
                const correct = s.question.options.find(o => o.is_correct);
                return (
                  <li key={s.question.id} className="g-xansrow">
                    <span className={`g-xmk ${right ? 'g-xmk-g' : pick ? 'g-xmk-f' : 'g-xmk-o'}`}>
                      {right ? <Check strokeWidth={3} aria-label="Goed" /> : <X strokeWidth={3} aria-label={pick ? 'Fout' : 'Niet beantwoord'} />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <b>Vraag {i + 1}</b>
                      <small>{s.question.prompt}</small>
                      <small>
                        {pick
                          ? <>Jouw antwoord: <strong>{pick.label}</strong></>
                          : <>Niet beantwoord</>}
                        {!right && correct && <> · juist: <strong>{correct.label}</strong></>}
                      </small>
                      {canSeeExplanations && !right && s.question.explanation && (
                        <small style={{ marginTop: 4 }}>{s.question.explanation}</small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {!canSeeExplanations && (
              <div className="g-xupsell">
                <span>Uitleg per vraag zit in het Compleet-pakket.</span>
                <Link href="/premium" className="g-tlink" style={{ color: 'var(--klei)', fontSize: 14 }}>
                  Bekijk de pakketten
                  <ArrowRight className="rtl-flip" size={15} aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="g-xrow-act">
        <Link href={dashboardHref} className={glasButton({ variant: 'ghost' })}>
          <ArrowLeft className="rtl-flip" aria-hidden />
          Alle examens
        </Link>
        {attemptId === null && userId && (
          <p className="g-xintro-line" style={{ fontSize: 13 }}>
            Deze poging kon niet worden opgeslagen. Probeer het later opnieuw.
          </p>
        )}
      </div>
    </ResultsFrame>
  );
}

/* ── Sub-views ── */

const SKILL_NAME: Record<string, string> = {
  lezen: 'Lezen', luisteren: 'Luisteren', schrijven: 'Schrijven', spreken: 'Spreken', knm: 'KNM',
};

function skillLabel(skill: string, level: string | null): string {
  const name = SKILL_NAME[skill] ?? skill;
  return level ? `${name} ${level.toUpperCase()}` : name;
}

/** Een segment van de voortgangsbalk: hoeveel stappen erin zitten en hoeveel daarvan af zijn. */
type Segment = { size: number; done: number; current: boolean };

/**
 * De schil van glas.html §10: een veld áchter de schil (Nevel bij lezen, Gracht bij de rest), met
 * daarop de glazen balk, de vraag op wit en de glazen actiebalk. Het veld is een eigen laag en
 * niet de schil zelf, anders knipt het en plakt de balk nergens meer aan.
 */
function ExamFrame({ skill, children }: { skill: string; children: React.ReactNode }) {
  return (
    <div className="g-xshell" dir="ltr" lang="nl">
      <Field variant={skill === 'lezen' ? 'nevel' : 'gracht'} className="g-xshell-bg" aria-hidden />
      {children}
    </div>
  );
}

/** De uitslag: dezelfde ondergrond als de schil, zonder balk — de klok is gestopt. */
function ResultsFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="g-xshell" style={{ gap: 14 }} dir="ltr" lang="nl">
      <Field variant="licht" className="g-xshell-bg" aria-hidden />
      {children}
    </div>
  );
}

function ExamBar({
  skill,
  segments,
  step,
  steps,
  secondsLeft,
  onClose,
  flag,
  zoom,
}: {
  skill: string;
  segments: Segment[];
  step: number;
  steps: number;
  secondsLeft: number;
  onClose: () => void;
  /** Het vlaggetje voor de huidige stap; null waar markeren niets betekent. */
  flag: { on: boolean; toggle: () => void } | null;
  zoom: { level: number; max: number; set: (level: number) => void };
}) {
  const warn = secondsLeft <= 300;
  const m = Math.floor(Math.max(secondsLeft, 0) / 60);
  const sec = Math.max(secondsLeft, 0) % 60;
  return (
    <div className="g-xbar g-glass">
      <button type="button" className="g-xbar-x" onClick={onClose} aria-label="Examen sluiten">
        <X aria-hidden />
      </button>
      <span className="g-xbar-mark"><CategoryMark category={skill as Category} size={28} /></span>
      {/* Eén segment per tekstdeel (of per deeltoets), niet per vraag: zo deelt DUO het examen op. */}
      <div
        className="g-xsegs"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps}
        aria-valuenow={step}
        aria-label={`Vraag ${step} van ${steps}`}
      >
        {segments.map((sg, i) => (
          <span key={i} className="g-xseg" style={sg.current ? { background: 'rgba(0,43,109,.18)' } : undefined}>
            <b style={{ transform: `scaleX(${sg.size ? sg.done / sg.size : 0})` }} />
          </span>
        ))}
      </div>
      <span className="g-xbar-step">{step}/{steps}</span>
      <span className="g-xbar-tools">
        <button
          type="button"
          className="g-xbar-tool"
          onClick={() => zoom.set(zoom.level - 1)}
          disabled={zoom.level === 0}
          aria-label="Tekst kleiner"
          title="Tekst kleiner"
        >
          <ZoomOut aria-hidden />
        </button>
        <button
          type="button"
          className="g-xbar-tool"
          onClick={() => zoom.set(zoom.level + 1)}
          disabled={zoom.level === zoom.max}
          aria-label="Tekst groter"
          title="Tekst groter"
        >
          <ZoomIn aria-hidden />
        </button>
        {flag && (
          <button
            type="button"
            className="g-xbar-tool g-xbar-flag"
            onClick={flag.toggle}
            aria-pressed={flag.on}
            aria-label={flag.on ? 'Markering weghalen' : 'Markeren om later terug te komen'}
            title={flag.on ? 'Markering weghalen' : 'Markeren'}
          >
            <Flag aria-hidden />
          </button>
        )}
      </span>
      <span className={`g-xtimer${warn ? ' g-xtimer-warn' : ''}`} role="timer" aria-label={`Nog ${m} minuten en ${sec} seconden`}>
        <Clock aria-hidden />
        {m}:{sec < 10 ? '0' : ''}{sec}
      </span>
    </div>
  );
}

/** Stoppen gaat niet per ongeluk: het kruisje vraagt het eerst. */
function CloseDialog({ href, onStay }: { href: React.ComponentProps<typeof Link>['href']; onStay: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStay]);
  return (
    <div className="g-xdialog-stage" role="dialog" aria-modal="true" aria-labelledby="exam-close-title" onClick={onStay}>
      <div className="g-xdialog" onClick={e => e.stopPropagation()}>
        <h2 id="exam-close-title">Stoppen met dit examen?</h2>
        <p>Je antwoorden worden niet ingeleverd. Je kunt het examen later opnieuw beginnen.</p>
        <div className="g-xdialog-act">
          <button type="button" className="g-btn g-btn-navy g-btn-sm" onClick={onStay} autoFocus>
            Verder met het examen
          </button>
          <Link href={href} className={glasButton({ variant: 'ghost', size: 'sm' })}>
            Stoppen
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * De voorgelezen instructie van een deel van B1 Spreken. Speelt vanzelf (de klik op "Start het
 * examen" was het gebaar) en zet daarna het examen in gang. Weigert de browser het afspelen, of
 * is er geen opname, dan blijft het gewoon een scherm met een knop "Verder".
 */
function PartInstructieAudio({ src, onEnded }: { src: string; onEnded: () => void }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    void ref.current?.play().catch(() => setBlocked(true));
  }, [src]);
  return (
    <div className="g-xrun" style={{ marginTop: 14 }}>
      <audio
        ref={ref}
        src={src}
        preload="auto"
        onTimeUpdate={e => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
        onEnded={onEnded}
        onError={() => setBlocked(true)}
      />
      {blocked ? (
        <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => { setBlocked(false); void ref.current?.play().catch(() => setBlocked(true)); }}>
          <Play aria-hidden />
          Beluister de instructie
        </button>
      ) : (
        <>
          <Wave progress={progress} />
          <small aria-live="polite">U hoort de instructie. Daarna begint de eerste opdracht vanzelf.</small>
        </>
      )}
    </div>
  );
}

/**
 * Het overzicht, zoals DUO het onder "Overzicht" toont: elk nummer met zijn stand
 * (onbeantwoord, beantwoord, gemarkeerd), en een klik brengt je erheen. Van hieruit lever je in.
 *
 * Gemarkeerd is een vlaggetje én een kleur, nooit alleen kleur.
 */
function OverviewDialog({
  items,
  noun,
  canJump,
  onJump,
  onStay,
  onSubmit,
}: {
  items: { n: number; done: boolean; flagged: boolean; current: boolean }[];
  noun: 'vragen' | 'opdrachten';
  canJump: (n: number) => boolean;
  onJump: (n: number) => void;
  onStay: () => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStay]);
  const one = noun === 'vragen' ? 'vraag' : 'opdracht';
  const done = items.filter(i => i.done).length;
  return (
    <div className="g-xdialog-stage" role="dialog" aria-modal="true" aria-labelledby="exam-overview-title" onClick={onStay}>
      <div className="g-xdialog g-xdialog-submit" onClick={e => e.stopPropagation()}>
        <h2 id="exam-overview-title">Overzicht</h2>
        <p>
          U heeft <b className="g-tnum">{done} van de {items.length}</b> {noun} beantwoord. Klik op een
          nummer om naar die {one} te gaan.
        </p>
        <div className="g-xover" role="group" aria-label={`Alle ${noun}`}>
          {items.map(it => {
            const state = it.done ? 'beantwoord' : 'onbeantwoord';
            return (
              <button
                key={it.n}
                type="button"
                className="g-tnum"
                data-state={state}
                data-flag={it.flagged || undefined}
                aria-current={it.current ? 'step' : undefined}
                disabled={!canJump(it.n) && !it.current}
                onClick={() => onJump(it.n)}
                aria-label={`${one} ${it.n}, ${state}${it.flagged ? ', gemarkeerd' : ''}`}
              >
                {it.n}
                {it.flagged && <Flag aria-hidden />}
              </button>
            );
          })}
        </div>
        <ul className="g-xlegend" aria-hidden>
          <li><i data-state="onbeantwoord" />Onbeantwoord</li>
          <li><i data-state="beantwoord" />Beantwoord</li>
          <li><i data-state="onbeantwoord" data-flag><Flag /></i>Gemarkeerd</li>
        </ul>
        <div className="g-xdialog-act">
          <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={onStay} autoFocus>
            Terug naar het examen
          </button>
          <button type="button" className="g-btn g-btn-navy g-btn-sm" onClick={onSubmit}>
            <FileCheck2 aria-hidden />
            Inleveren
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inleveren is definitief, dus de knop vraagt het eerst — met de resterende tijd, wat nog open
 * staat en wat nog gemarkeerd is, zoals DUO's eigen inleverscherm. Springen gaat via het overzicht.
 */
function SubmitDialog({
  secondsLeft,
  open,
  flagged,
  noun,
  onOverview,
  onStay,
  onSubmit,
}: {
  secondsLeft: number;
  /** De nummers (1-based) die nog geen antwoord hebben. */
  open: number[];
  /** Hoeveel stappen nog gemarkeerd staan. */
  flagged: number;
  noun: 'vragen' | 'opdrachten';
  /** Terug naar het overzicht; ontbreekt waar er geen overzicht is (B1 Spreken, examenmodus). */
  onOverview?: () => void;
  onStay: () => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStay]);
  const left = Math.max(secondsLeft, 0);
  const m = Math.floor(left / 60);
  const sec = left % 60;
  const one = noun === 'vragen' ? 'vraag' : 'opdracht';
  return (
    <div className="g-xdialog-stage" role="dialog" aria-modal="true" aria-labelledby="exam-submit-title" onClick={onStay}>
      <div className="g-xdialog g-xdialog-submit" onClick={e => e.stopPropagation()}>
        <h2 id="exam-submit-title">Weet u zeker dat u het examen wilt inleveren?</h2>
        <p className="g-xsubmit-row">
          <Clock aria-hidden />
          <span>
            U heeft nog <b className="g-tnum">{m} {m === 1 ? 'minuut' : 'minuten'} en {sec} {sec === 1 ? 'seconde' : 'seconden'}</b> over.
          </span>
        </p>
        {open.length > 0 ? (
          <>
            <p className="g-xsubmit-row is-warn">
              <TriangleAlert aria-hidden />
              <span>
                U heeft <b>{open.length} {open.length === 1 ? one : noun}</b> niet ingevuld.
              </span>
            </p>
          </>
        ) : (
          <p className="g-xsubmit-row">
            <Check aria-hidden />
            <span>U heeft alle {noun} ingevuld.</span>
          </p>
        )}
        {flagged > 0 && (
          <p className="g-xsubmit-row">
            <Flag aria-hidden />
            <span>
              Er {flagged === 1 ? 'staat' : 'staan'} nog <b>{flagged} {flagged === 1 ? one : noun}</b> gemarkeerd.
            </span>
          </p>
        )}
        {onOverview && (open.length > 0 || flagged > 0) && (
          <button type="button" className="g-xlink" onClick={onOverview}>
            <LayoutGrid aria-hidden />
            Bekijk het overzicht
          </button>
        )}
        <div className="g-xdialog-act">
          <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={onStay} autoFocus>
            Terug naar het examen
          </button>
          <button type="button" className="g-btn g-btn-navy g-btn-sm" onClick={onSubmit}>
            <FileCheck2 aria-hidden />
            Definitief inleveren
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * De slaagkans na dit examen, uit de bestaande regel (`calculateSlaagkans`): met één examen weegt
 * de 50%-aanname nog zwaar mee, en dat is eerlijk — één examen zegt weinig. Geen AI-oordeel.
 */
function PassChance({ pct }: { pct: number }) {
  const { band } = calculateSlaagkans([pct]);
  const level = (band === 'high' ? 4 : band === 'good' ? 3 : band === 'fair' ? 2 : 1) as PassChanceLevel;
  const word = ['', 'Nog niet', 'Bijna', 'Goed', 'Sterk'][level];
  return (
    <PassChanceCard
      level={level}
      label="Slaagkans na dit examen"
      word={word}
      line="Eén examen zegt nog weinig. Elk examen dat je erbij maakt, maakt dit preciezer."
      scaleLabels={['Nog niet', 'Bijna', 'Goed', 'Sterk']}
    />
  );
}

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
    <article className="g-xintro" dir="ltr" lang="nl">
      <Field variant="nacht" className="g-xintro-hd">
        <span className="g-xcrumb">Luisteren B1 <ChevronRight className="rtl-flip" aria-hidden /> <b>Voordat je begint</b></span>
        <h1>Zo werkt het luisterexamen</h1>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 15, lineHeight: 1.6, margin: '10px 0 0', maxWidth: '52ch' }}>
          Luister naar de uitleg of lees hem hieronder. Dit examen werkt net als het echte
          examen van DUO.
        </p>
      </Field>
      <div className="g-xintro-bd">
        <AudioPlayer src={LUISTEREN_INSTRUCTIE_AUDIO} label="Gesproken uitleg" />
        <ol className="g-xrules">
          {regels.map((r, i) => (
            <li key={i}>
              <span className="n">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={onStart} className="g-btn g-btn-navy g-btn-lg" style={{ alignSelf: 'flex-start' }}>
          Start het examen
          <ArrowRight className="rtl-flip" aria-hidden />
        </button>
      </div>
    </article>
  );
}

/**
 * Het welkom van een examen, naar DUO's eigen startscherm: in de u-vorm, zoals het echte
 * examen, met per onderdeel wat de kandidaat daar vooraf hoort te weten. Luisteren en Spreken
 * krijgen een geluidstest — dat afspelen is meteen het gebaar dat het automatisch afspelen in
 * de rest van de zitting vrijgeeft — en Spreken ook een microfoontest, zodat de opname die bij
 * B1 vanzelf start niet pas bij opdracht 1 om toestemming vraagt.
 *
 * De B1-feiten (tekstboekje, woordenboek, de tijden van Spreken) staan met bron in
 * SEO/facts.md; de tijden van Spreken komen hier uit de opdrachten zelf, niet uit een vaste zin.
 */
function ExamWelcome({ content, totalItems }: { content: ExamContent; totalItems: number }) {
  const { exam, tasks, stimuli, parts } = content;
  const name = SKILL_NAME[exam.skill] ?? exam.skill;
  const level = exam.level === 'b1' ? 'B1' : 'A2';
  const minutes = Math.round(exam.duration_seconds / 60);
  const b1 = exam.level === 'b1';

  const soorten: string[] = [];
  if (exam.skill === 'spreken' && !b1) {
    for (const t of tasks) {
      const n = t.images.length;
      const label = t.image_usage === 'react'
        ? 'vragen waarin iemand iets tegen u zegt (op het echte examen is dit een video)'
        : `vragen met ${n} ${n === 1 ? 'plaatje' : 'plaatjes'}`;
      if (!soorten.includes(label)) soorten.push(label);
    }
  }

  /* B1 Spreken: per deel het aantal opdrachten en de tijden, uit de opdrachten zelf. */
  const delen = b1 && exam.skill === 'spreken'
    ? parts.map(p => {
        const ts = tasks.filter(t => t.part_id === p.id);
        const spreek = Math.max(0, ...ts.map(t => t.max_record_seconds));
        const preps = ts.map(t => t.prep_seconds ?? 0).filter(x => x > 0);
        const allPrep = preps.length === ts.length;
        return { title: p.title, count: ts.length, spreek, prep: preps.length ? Math.max(...preps) : 0, allPrep };
      }).filter(d => d.count > 0)
    : [];

  /* B1 Schrijven: welke opdrachten kort zijn (een zin afmaken) en welke lang, als reeksen. */
  const reeksen: { from: number; to: number; kort: boolean }[] = [];
  if (b1 && exam.skill === 'schrijven') {
    tasks.forEach((t, i) => {
      const kort = t.task_type === 'sentence_completion';
      const last = reeksen[reeksen.length - 1];
      if (last && last.kort === kort) last.to = i + 1;
      else reeksen.push({ from: i + 1, to: i + 1, kort });
    });
  }
  const nKort = reeksen.filter(r => r.kort).reduce((n, r) => n + r.to - r.from + 1, 0);

  return (
    <>
      <section className="g-xwelcome" aria-labelledby="exam-welcome">
        <h2 id="exam-welcome">Welkom</h2>
        <p>U gaat het oefenexamen {name} {level} maken.</p>
        {exam.skill === 'spreken' && b1 ? (
          <>
            <p>Het examen heeft {delen.length === 2 ? 'twee' : delen.length} delen:</p>
            <ol>
              {delen.map(d => (
                <li key={d.title}>
                  <b>{d.title}</b>: {d.count} opdrachten.{' '}
                  {d.prep > 0 && d.allPrep && <>U krijgt eerst {d.prep} seconden om na te denken. </>}
                  {d.prep > 0 && !d.allPrep && <>Bij een plaatje krijgt u eerst {d.prep} seconden om te kijken. </>}
                  U hebt {d.spreek} seconden spreektijd.
                </li>
              ))}
            </ol>
            <p>
              U hoort elke opdracht. Na een pieptoon begint de opname vanzelf. Een tweede pieptoon
              betekent dat de tijd om is. In de examenmodus hoort u elke opdracht één keer en gaat het
              examen vanzelf verder, net als bij DUO.
            </p>
          </>
        ) : exam.skill === 'spreken' && soorten.length > 0 ? (
          <>
            <p>Het examen heeft {soorten.length === 4 ? 'vier' : soorten.length} soorten vragen:</p>
            <ol>{soorten.map(l => <li key={l}>{l}</li>)}</ol>
            <p>U hoort elke opdracht ook. Daarna neemt u uw antwoord op.</p>
          </>
        ) : exam.skill === 'schrijven' && b1 ? (
          <>
            <p>U krijgt {totalItems} opdrachten:</p>
            <ul className="g-xreeks">
              {reeksen.map(r => (
                <li key={r.from}>
                  <span className="g-tnum">Opdracht {r.from === r.to ? r.from : `${r.from}–${r.to}`}</span>
                  <b>{r.kort ? 'kort' : 'lang'}</b>
                </li>
              ))}
            </ul>
            {nKort > 0 && <p>Gebruik maximaal 20 minuten voor de korte opdrachten.</p>}
            <p>U mag zelf bepalen in welke volgorde u de opdrachten maakt. Via Overzicht gaat u naar elke opdracht.</p>
          </>
        ) : exam.skill === 'schrijven' ? (
          <p>U krijgt {totalItems} schrijfopdrachten. Schrijf in hele zinnen, en houd u aan het aantal zinnen dat de opdracht vraagt.</p>
        ) : exam.skill === 'lezen' && b1 ? (
          <>
            <p>
              U krijgt {stimuli.length} teksten en {totalItems} vragen. Boven elke vraag staat bij welke
              tekst die hoort.
            </p>
            <p>
              Op het echte examen staan de teksten in een papieren tekstboekje en de vragen op de
              computer. In het tekstboekje mag u aantekeningen maken en zinnen onderstrepen.
            </p>
          </>
        ) : (
          <p>U moet in dit examen {totalItems} vragen beantwoorden.</p>
        )}
        {exam.skill === 'luisteren' && (
          <p>
            Bij elke vraag hoort u eerst de situatie. Dan leest u de vraag, en daarna start het
            fragment vanzelf. Na het fragment worden de vraag en de antwoorden voorgelezen. U kunt
            altijd opnieuw luisteren.
          </p>
        )}
        <p>U mag {minutes} minuten over het examen doen. Veel succes!</p>
      </section>

      {exam.skill === 'lezen' && b1 && (
        <section className="g-xsoundcheck" aria-labelledby="exam-tekstboekje">
          <h3 id="exam-tekstboekje">Het tekstboekje</h3>
          <p>
            Download de {stimuli.length} teksten als PDF en print ze, of zet ze naast het examen op een
            tweede scherm. Tijdens het examen kunt u elke tekst ook in een nieuw tabblad openen.
          </p>
          <a
            href={`/api/tekstboekje-pdf/${exam.level}/${exam.number}`}
            className={glasButton({ variant: 'ghost', size: 'sm' })}
            style={{ alignSelf: 'flex-start' }}
          >
            <Download aria-hidden />
            Download het tekstboekje (PDF)
          </a>
        </section>
      )}

      {b1 && (exam.skill === 'lezen' || exam.skill === 'schrijven') && (
        <p className="g-xnotice">
          <BookA strokeWidth={2.2} aria-hidden />
          <span>
            Op het echte examen mag u een papieren <strong>Van Dale Pocketwoordenboek NT2</strong>{' '}
            gebruiken, zonder briefjes of aantekeningen erin. Andere woordenboeken en elektronische
            hulpmiddelen mogen niet.
          </span>
        </p>
      )}

      {exam.skill === 'schrijven' && !b1 && (
        <p className="g-xnotice">
          <PenLine strokeWidth={2.2} aria-hidden />
          <span>
            <strong>Het echte examen maakt u met pen en papier.</strong> Schrijven is het enige
            A2-examen dat niet op de computer is. Oefen daarom ook eens met de hand: dan weet u
            hoeveel tijd dat kost.
          </span>
        </p>
      )}

      {(exam.skill === 'luisteren' || exam.skill === 'spreken') && (
        <section className="g-xsoundcheck" aria-labelledby="exam-soundcheck">
          <h3 id="exam-soundcheck">Geluid testen</h3>
          <p>Hoort u de stem goed? Zet het geluid op uw computer of telefoon harder of zachter.</p>
          <AudioPlayer src={GELUIDSTEST_AUDIO} compact />
        </section>
      )}

      {exam.skill === 'spreken' && <MicCheck />}

      <p className="g-xintro-small">Alle opgaven zijn gemaakt en nagekeken door een NT2-docent.</p>
    </>
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

  /* Glas §10 "Intro": een Nacht-kop met kruimelpad, titel en drie getallen; daaronder op wit de
     uitleg, de keuze en één navy startknop. */
  return (
    <article className="g-xintro" dir="ltr" lang="nl">
      <Field variant="nacht" className="g-xintro-hd">
        <span className="g-xcrumb">
          {skillLabel(exam.skill, exam.level)}
          <ChevronRight className="rtl-flip" aria-hidden />
          <b>Oefenexamen {exam.number}</b>
        </span>
        <h1>{exam.title || `Oefenexamen ${exam.skill} ${exam.number}`}</h1>
        <dl className="g-xstats3">
          <div><dd>{totalItems}</dd><dt>{exam.skill === 'spreken' || exam.skill === 'schrijven' ? 'opdrachten' : 'vragen'}</dt></div>
          <div><dd>{Math.round(exam.duration_seconds / 60)}</dd><dt>minuten</dt></div>
          <div><dd>{exam.pass_threshold_pct}%</dd><dt>oefengrens</dt></div>
        </dl>
      </Field>

      <div className="g-xintro-bd">
        {(exam.level === 'a2' || (exam.level === 'b1' && !strengLuisteren)) && !empty ? (
          <ExamWelcome content={content} totalItems={totalItems} />
        ) : (
          /* Bij streng luisteren gaat "heen en terug" niet op — daar loopt het examen alleen
             vooruit. Eén zin die niet klopt over hoe de navigatie werkt kost de kandidaat een
             vraag voordat hij doorheeft dat het anders is. */
          <p>
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
        )}

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
          <>
            <p className="g-xintro-q" id="exam-mode-q">Hoe wil je oefenen?</p>
            <fieldset className="g-xmode" aria-labelledby="exam-mode-q">
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
                <label key={opt.value} className={feedbackMode === opt.value ? 'on' : undefined}>
                  <input
                    type="radio"
                    name="feedback-mode"
                    value={opt.value}
                    checked={feedbackMode === opt.value}
                    onChange={() => onFeedbackModeChange(opt.value)}
                  />
                  <b><span className="rd" aria-hidden />{opt.title}</b>
                  {opt.body}
                </label>
              ))}
            </fieldset>
          </>
        )}

        {empty ? (
          <p>Dit examen heeft nog geen opgaven. Kom binnenkort terug.</p>
        ) : (
          <button type="button" onClick={onStart} className="g-btn g-btn-navy g-btn-lg" style={{ alignSelf: 'flex-start' }}>
            Start het examen
            <ArrowRight className="rtl-flip" aria-hidden />
          </button>
        )}
      </div>
    </article>
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
  pendingText = null,
  title,
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
  pendingText?: string | null;
  title?: string;
}) {
  const busy = grade.state === 'grading';
  const graded = grade.state === 'graded';

  return (
    <div className="g-xstack" style={{ gap: 12 }}>
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
          pendingText={pendingText}
          medium={task.task_type === 'speaking' ? 'opname' : 'tekst'}
          title={title}
        />
      )}

      {graded && grade.overall && canSeeDetail && layout !== 'wide' && (
        <div className="g-xcard" style={{ padding: compact ? '14px 16px' : undefined }}>
          <p className="g-xintro-line" style={{ color: 'var(--ink)' }}>{grade.overall}</p>
          {grade.tips.length > 0 && (
            <ul className="g-xintro-line" style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>
              {grade.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hideAction && (
        <div className="g-xactions">
          <button
            type="button"
            onClick={onGrade}
            disabled={busy || !hasAnswer}
            className="g-btn g-btn-ghost g-btn-sm"
          >
            <Check strokeWidth={2.6} aria-hidden />
            {busy ? 'Nakijken…' : graded ? 'Opnieuw nakijken' : 'Nakijken'}
          </button>
          {!hasAnswer && (
            <span className="g-xfoot-meta">
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

/**
 * Het wachtscherm tussen inleveren en de uitslag.
 *
 * Eén scherm met een teller, want het nakijken duurt bij Spreken echt even: per opdracht een
 * transcriptie plus een modelcall. De beweging is `transform` en `opacity` — de balk schaalt, de
 * drie stippen springen — en bij `prefers-reduced-motion` blijft alleen de teller over, die het
 * eigenlijke antwoord op "gebeurt er nog iets?" is.
 */
function GradingScreen({ done, total }: { done: number; total: number }) {
  return (
    <Field variant="nevel" className="g-xgrading" dir="ltr" lang="nl">
      <span className="g-mono">Ingeleverd</span>
      <h1>We kijken je opdrachten na</h1>
      <span className="g-xdots" aria-hidden><i /><i /><i /></span>
      <div
        className="g-xprog"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Opdrachten nagekeken"
      >
        <i style={{ transform: `scaleX(${total > 0 ? done / total : 0})` }} />
      </div>
      <p aria-live="polite" style={{ color: 'var(--ink)', fontWeight: 600 }}>
        {done} van de {total} opdrachten nagekeken
      </p>
      <p>
        Een taalmodel past de criteria van de docent toe. Blijf even op deze pagina; je krijgt je
        beoordeling zodra alle opdrachten klaar zijn.
      </p>
    </Field>
  );
}
