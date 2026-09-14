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
 * De stem van de leerlaag — de oudere vrouwenstem, gekozen door de eigenaar (02-09).
 *
 * Apart van `NARRATOR` en niet in plaats daarvan. Die stem leest de *examenvragen* en de *366
 * KNM-woordkaarten* voor: materiaal waar de stem niemand hoort te zijn.
 *
 * Sinds 14-09 spreekt deze stem ook de **leerwoorden** in (`lesson_words`, via
 * `/api/admin/generate-lesson-word-audio` en `scripts/lesson-content/backfill-word-media.mjs`),
 * nadat de eigenaar vijf varianten had beluisterd. De grens loopt dus langs de laag en niet
 * langs de soort materiaal: alles in een cursus klinkt als dezelfde docent, de KNM-kaarten en de
 * examenvragen houden `NARRATOR`.
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
