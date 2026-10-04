/**
 * Dezelfde vormen als `lib/mcp/types.ts`, herhaald omdat het widget los van de Next-app wordt
 * gebundeld en niets uit `lib/` mag meeslepen. Houd ze gelijk; de server is de bron.
 */
export type Label = 'A' | 'B' | 'C' | 'D';

export type Gate = {
  reason: string;
  title_nl: string;
  message_nl: string;
  message_en: string;
  action: { label_nl: string; label_en: string; url: string } | null;
};

export type Option = { label: Label; body: string | null; imageUrls: string[]; audioUrl: string | null };

export type McqExercise = {
  kind: 'mcq';
  questionId: number;
  level: 'a2' | 'b1' | null;
  onderdeel: string;
  onderdeelLabel: string;
  examNumber: number;
  section: string | null;
  instruction: string | null;
  stimulus:
    | { kind: 'text'; title: string | null; html: string }
    | { kind: 'audio'; url: string; introAudioUrl: string | null }
    | { kind: 'image'; url: string; alt: string | null }
    | null;
  question: string;
  questionImageUrl: string | null;
  questionAudioUrl: string | null;
  options: Option[];
  tasterRemaining?: number;
};

export type WritingExercise = {
  kind: 'writing';
  taskId: number;
  level: 'a2' | 'b1';
  onderdeel: 'schrijven';
  onderdeelLabel: string;
  examNumber: number;
  taskType: string;
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

export type Verdict = {
  questionId: number;
  correct: boolean;
  chosenLabel: Label;
  correctLabel: Label;
  correctBody: string | null;
  explanation: string;
  taalregel: { name: string; oneLiner: string; url: string } | null;
  saved: boolean;
};

export type WritingVerdict = {
  taskId: number;
  status: string;
  overall: string | null;
  tips: string[];
  criteria: { key: string; score: number; maxScore: number; feedback: string | null }[];
};

export type Payload =
  | { exercise: Exercise }
  | { verdict: Verdict }
  | { writing: WritingVerdict }
  | { gate: Gate }
  | { explanation: unknown }
  | Record<string, unknown>;
