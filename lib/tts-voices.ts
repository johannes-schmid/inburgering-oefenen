import voices from '@/data/tts-voices.json';

export type VoiceKey = keyof typeof voices;

export type Voice = {
  id: string;
  name: string;
  gender: 'female' | 'male';
  age: 'young' | 'older';
};

export const VOICES = voices as Record<VoiceKey, Voice>;

/** Single-narrator surfaces: question read-aloud, lesson audio, woordkaarten. */
export const NARRATOR: VoiceKey = 'woman_young';

export function voiceId(key: VoiceKey): string {
  return VOICES[key].id;
}

/**
 * The voice must match the speaker's gender. A character called Sara, or one addressed as
 * "mevrouw", is voiced by a female voice; Peter or "meneer" by a male voice. Casting is per
 * item — see CASTING in scripts/generate-free-practice-audio.mjs.
 */
export function voicesForGender(gender: Voice['gender']): VoiceKey[] {
  return (Object.keys(VOICES) as VoiceKey[]).filter(k => VOICES[k].gender === gender);
}
