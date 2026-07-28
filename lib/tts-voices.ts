import voices from '@/data/tts-voices.json';

export type VoiceKey = keyof typeof voices;

export type Voice = {
  id: string;
  name: string;
  gender: 'female' | 'male';
};

export const VOICES = voices as Record<VoiceKey, Voice>;

export const NARRATOR: VoiceKey = 'roos';

export const DIALOGUE_VOICES: { A: VoiceKey; B: VoiceKey } = { A: 'roos', B: 'eric' };

export function voiceId(key: VoiceKey): string {
  return VOICES[key].id;
}
