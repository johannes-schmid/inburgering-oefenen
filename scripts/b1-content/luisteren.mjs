/**
 * B1 Luisteren — tien oefenexamens, gelezen uit `generated/luisteren-NN.json`.
 *
 * Zelfde vorm als `lezen.mjs`, met één verschil in wat een element is: bij Lezen is een
 * element één tekst met vier tot zeven vragen, hier is het één heel **gesprek** met vijf tot
 * negen fragmenten die elk precies één vraag dragen. De database ziet die fragmenten als 39
 * losse stimuli; het gesprek is een groep in de authoring, geen rij.
 */
import { loadSkill } from './dataset.mjs';

export const LUISTEREN_EXAMS = loadSkill('luisteren');
