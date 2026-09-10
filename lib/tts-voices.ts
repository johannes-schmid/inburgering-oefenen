import voices from '@/data/tts-voices.json';

export type VoiceKey = keyof typeof voices;

export type Voice = {
  id: string;
  name: string;
  gender: 'female' | 'male';
  age: 'young' | 'older';
};

export const VOICES = voices as Record<VoiceKey, Voice>;

/** Single-narrator surfaces: question read-aloud, woordkaarten. */
export const NARRATOR: VoiceKey = 'woman_young';

/**
 * De stem die een les inspreekt — de oudere vrouwenstem, gekozen door de eigenaar (02-09).
 *
 * Apart van `NARRATOR` en niet in plaats daarvan. Die stem leest *vragen* en *woordkaarten*
 * voor: neutraal materiaal waar de stem niemand hoort te zijn. De narratie is het tegendeel —
 * daar staat een docent naast je die iets uitlegt — en de twee door elkaar halen zou de
 * woordkaarten opeens laten klinken als een les.
 */
export const LESSON_NARRATOR: VoiceKey = 'woman_older';

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
