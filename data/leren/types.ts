import type { AudioCue } from '@/lib/leren-audio-cues';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

export interface StepTimelineItem {
  badge?: string;
  icon?: string;
  label: string;
  subtitle?: string;
  note?: string;
  variant?: 'primary' | 'secondary' | 'muted';
}

export interface StepTimelineData {
  heading?: string;
  items: StepTimelineItem[];
}

export interface LerenSection {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  contentHtml: string;
  stepTimelines?: Record<string, StepTimelineData>;
  audioUrl?: string;
  audioCues?: AudioCue[];
}

export interface LerenThema {
  id: number;
  slug: string;
  title: string;
  description: string;
  quizCategory: string;
  sections: LerenSection[];
}
