/**
 * De acht stemmen, en waarom het déze acht zijn.
 *
 * ## De wissel van 16-09
 * De oorspronkelijke vier waren `generated` stemmen uit Voice Design: opgewekt uit een
 * prompt die om Standaardnederlands vroeg. Bij `man_older` landde dat niet — er zat een
 * hoorbaar accent in. Dat is niet te repareren met een instelling: bij een gegenereerde stem
 * zit het accent in het sample, en `/v1/text-to-dialogue` accepteert sowieso alleen
 * `stability` (geen `speed`, geen `similarity_boost`, geen `style`). De enige uitweg is een
 * ander `voice_id`.
 *
 * Alle vier zijn daarom vervangen door stemmen uit de gedeelde bibliotheek met een expliciet
 * `accent: standard`, beluisterd door de eigenaar in drie auditierondes.
 *
 * ## De uitbreiding naar acht (16-09)
 * DUO zet in één B1-Luisterenexamen **dertien stemmen** in: zes gesprekken van twee sprekers,
 * plus een verteller, en geen enkele spreker keert terug in een andere tekst (geteld op het
 * openbaar examen 2025 — zes losse Cito-opnames uit 2013 t/m 2018). Met vier stemmen zou
 * dezelfde stem vier verschillende personen spelen. Acht stemmen geven 28 paren in plaats van
 * 6, waardoor elke tekst van een examen een eigen combinatie kan krijgen.
 *
 * | sleutel | stem | soort |
 * |---|---|---|
 * | `woman_young` | Melanie — Engaging, Authentic Narrator | high_quality |
 * | `woman_older` | Emma — Calm, Clear and Confident | **professional** |
 * | `man_young`   | Jan | **professional** |
 * | `man_older`   | Remko — Clear Dutch Narrator | **professional** |
 * | `woman_roos`  | Roos — Kind, Articulate and Confident | **professional** |
 * | `woman_noa`   | Noa | high_quality |
 * | `man_eric`    | Eric Sijbesma — Natural and Authentic | **professional** |
 * | `man_richard` | Richard — Raspy, Natural and Clear | **professional** |
 *
 * `professional` betekent gekloond van een echte Nederlandse spreker in plaats van opgewekt,
 * dus er is geen gegenereerd sample waar een accent in kan sluipen. Dat is de reden dat zes
 * van de acht die soort hebben.
 *
 * **`age` is een tweewaardige as, geen leeftijd.** Eric en Richard staan in de bibliotheek als
 * `middle_aged`; hier zijn ze `older`, want de as bestaat om ze van Jan te onderscheiden en de
 * beheerschermen tonen alleen "jonger" of "ouder". Drie vrouwenstemmen zijn `young`: in de
 * keuzelijst is de naam wat ze uit elkaar houdt, niet de as.
 *
 * ## Geen snelheidscorrectie
 * Deze vier nieuwe stemmen zijn er voor de **dialoog**-route, en `eleven_v3` kent geen `speed`.
 * Ze staan ook niet in `NARRATOR` of `LESSON_NARRATOR`, de enige plekken waar de
 * enkele-stemroutes `speed: 0.9` meesturen. Er wordt op deze stemmen dus niets versneld of
 * vertraagd — niet in de API-aanroep en niet achteraf (`POST_ATEMPO` staat op `null`). Besluit
 * eigenaar 16-09, en het is de bedoeling dat dat zo blijft.
 *
 * ## De sleutels zijn de stabiele laag, niet de id's
 * Elke `voice_cast` in de database en in `scripts/*-content/` verwijst naar een sleutel
 * hierboven, nooit naar een `voice_id`. Daarom raakte deze wissel geen enkel contentbestand
 * en geen enkele test. Houd dat zo: een `voice_id` hoort nergens anders hardgecodeerd te staan.
 *
 * De vier oorspronkelijke sleutels heten nog naar hun rol (`man_older`), de vier nieuwe naar
 * hun persoon (`man_eric`). Dat is geen slordigheid: hernoemen van de eerste vier zou elke
 * bestaande `voice_cast` in de database moeten meeverhuizen, en een rolnaam is een leugen zodra
 * er meer dan één stem in dezelfde rol past.
 *
 * ## Let op: reeds ingesproken audio verandert niet
 * De mp3's die al in Storage staan — onder meer de ~100 A2-luisterfragmenten — zijn met de
 * óude stemmen gerenderd en blijven dat tot ze opnieuw worden gegenereerd. Zolang dat niet is
 * gebeurd, klinkt A2 anders dan wat er na deze datum wordt ingesproken. Dat is een bewuste,
 * uitgestelde kostenpost (`man_older` alleen al zit in 69 van die fragmenten), geen bug.
 *
 * ## Tempo
 * `stability` blijft 0.5 ("Natural") en er wordt niet vertraagd. Zie de toelichting bij
 * `POST_ATEMPO` in `scripts/generate-free-practice-audio.mjs` voor de meting waar dat op rust.
 */
import voices from '@/data/tts-voices.json';

export type VoiceKey = keyof typeof voices;

export type Voice = {
  id: string;
  name: string;
  gender: 'female' | 'male';
  age: 'young' | 'older';
  /**
   * `'narrator'` betekent: deze stem speelt nooit een personage.
   *
   * Zonder dit veld zou de verteller gewoon een vrouwenstem zijn en dus in elke castingpool
   * belanden — `voicesForGender`, de keuzelijst in /admin, de automatische casting van de
   * leerlaag. Dan kan ze in gesprek 4 de geïnterviewde spelen en in gesprek 5 de examenleiding,
   * en juist dát onderscheid is wat een verteller een verteller maakt.
   */
  role?: 'narrator';
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

/**
 * De examenleiding van B1 Luisteren — de stem die het scenario voorleest.
 *
 * DUO zet bij élke tekst een aparte introtrack waarin een verteller eerst de titel noemt, dan
 * voorleest waar het gesprek over gaat, en afsluit met "U hoort nu eerst het begin van het
 * gesprek. Hierbij is nog geen opgave." Scribe telt in zo'n track drie sprekers: de verteller
 * plus de twee die daarna praten. Zij is dus nadrukkelijk geen van beiden.
 *
 * **Waarom juist deze stem, en niet `NARRATOR` of `LESSON_NARRATOR`.** Dit is de oorspronkelijke
 * `woman_older` van vóór de wissel van 16-09 — de stem die in de reeds ingesproken A2-audio te
 * horen is. Keuze van de eigenaar: wat er al staat moet niet ineens anders klinken. Dat het ook
 * nog eens de beste pasvorm is, is meegenomen: deze stem leest het scenario op **126 wpm**,
 * midden in de 114–132 wpm die DUO's eigen vertellerstracks aanhouden. Emma doet 143.
 *
 * Er wordt niet aan het tempo gedraaid: `speed` blijft 1.0. Op 0.9 komt deze stem op 122 wpm
 * uit — vier woorden per minuut verschil, en dus geen reden om aan de opname te zitten.
 */
export const LUISTEREN_NARRATOR: VoiceKey = 'narrator';

export function voiceId(key: VoiceKey): string {
  return VOICES[key].id;
}

/**
 * The voice must match the speaker's gender. A character called Sara, or one addressed as
 * "mevrouw", is voiced by a female voice; Peter or "meneer" by a male voice. Casting is per
 * item — see CASTING in scripts/generate-free-practice-audio.mjs.
 */
export function voicesForGender(gender: Voice['gender']): VoiceKey[] {
  return castableVoices().filter(k => VOICES[k].gender === gender);
}

/**
 * Elke stem die een personage mag spelen — dus alles behalve de verteller.
 *
 * Dit is de lijst waar een castingkeuze uit gemaakt wordt: de keuzelijsten in /admin, de
 * automatische casting in `scripts/lesson-content/author.mjs`, en `LUISTEREN_CAST`. `VOICES`
 * zelf blijft de volledige verzameling, want de verteller moet wél opzoekbaar zijn.
 */
export function castableVoices(): VoiceKey[] {
  return (Object.keys(VOICES) as VoiceKey[]).filter(k => VOICES[k].role !== 'narrator');
}
