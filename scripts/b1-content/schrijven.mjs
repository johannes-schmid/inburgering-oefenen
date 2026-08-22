/**
 * B1 Schrijven — ten oefenexamens, read from `generated/schrijven-NN.json`.
 *
 * Kept as its own module so the dataset's import surface matches A2's
 * (`import { SCHRIJVEN_EXAMS } from './schrijven.mjs'`) and `index.mjs` reads the same either way.
 * The content itself is generated; see `dataset.mjs` for why it lives in JSON.
 */
import { loadSkill } from './dataset.mjs';

export const SCHRIJVEN_EXAMS = loadSkill('schrijven');
