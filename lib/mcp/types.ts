import type { Level, OnderdeelSlug } from '@/data/skills';

/**
 * De vormen die over de draad gaan tussen de MCP-tools en ChatGPT (en het widget).
 *
 * Alles hier is bewust klein en zonder sleutel: geen `is_correct`, geen `explanation` in een
 * opgave, geen `model_answer`, geen Mollie-ids. Wat de kandidaat niet op het scherm hoort te
 * zien, komt hier niet in.
 */

export type Tier = 'anonymous' | 'connected' | 'module';

export type GateReason =
  | 'login_required'
  | 'taster_exhausted'
  | 'module_required'
  | 'grading_limit'
  | 'unavailable';

export type Gate = {
  reason: GateReason;
  title_nl: string;
  message_nl: string;
  message_en: string;
  /** Een informatiepagina op de site — nooit een afrekenlink (OpenAI-beleid). */
  action: { label_nl: string; label_en: string; url: string } | null;
};

export type ExerciseOption = {
  label: 'A' | 'B' | 'C' | 'D';
  body: string | null;
  imageUrls: string[];
  audioUrl: string | null;
};

export type McqExercise = {
  kind: 'mcq';
  questionId: number;
  level: Level | null;
  onderdeel: OnderdeelSlug;
  onderdeelLabel: string;
  examNumber: number;
  /** De tekstsoort of het KNM-thema, in het Nederlands. */
  section: string | null;
  /** De instructieregel boven de tekst of het fragment ("Lees eerst de vraag."). */
  instruction: string | null;
  stimulus:
    | { kind: 'text'; title: string | null; html: string }
    | { kind: 'audio'; url: string; introAudioUrl: string | null }
    | { kind: 'image'; url: string; alt: string | null }
    | null;
  question: string;
  questionImageUrl: string | null;
  questionAudioUrl: string | null;
  options: ExerciseOption[];
  /** Hoeveel van de gratis proefvragen deze gebruiker hierna nog heeft (alleen anoniem). */
  tasterRemaining?: number;
};

export type WritingExercise = {
  kind: 'writing';
  taskId: number;
  level: Level;
  onderdeel: 'schrijven';
  onderdeelLabel: string;
  examNumber: number;
  taskType: 'email' | 'short_text' | 'form' | 'picture_note' | 'speaking';
  title: string | null;
  promptHtml: string | null;
  bulletPoints: string[];
  email: { to: string | null; cc: string | null; subject: string | null } | null;
  greeting: string | null;
  closing: string | null;
  minSentences: number | null;
  images: { url: string; caption: string | null; alt: string | null }[];
};

export type Exercise = McqExercise | WritingExercise;

export type TaalregelHint = {
  name: string;
  oneLiner: string;
  /** De les op de site die de regel uitlegt. */
  url: string;
};

export type McqVerdict = {
  questionId: number;
  correct: boolean;
  chosenLabel: 'A' | 'B' | 'C' | 'D';
  correctLabel: 'A' | 'B' | 'C' | 'D';
  correctBody: string | null;
  /** De uitleg van de docent — geen AI. */
  explanation: string;
  taalregel: TaalregelHint | null;
  /** Of dit antwoord in de voortgang is opgeslagen (alleen met een gekoppeld account). */
  saved: boolean;
};

export type WritingVerdict = {
  taskId: number;
  status: 'ai_graded' | 'teacher_reviewed';
  overall: string | null;
  tips: string[];
  criteria: { key: string; score: number; maxScore: number; feedback: string | null }[];
};

export type ToolOutcome<T> = { ok: true; data: T } | { ok: false; gate: Gate };
