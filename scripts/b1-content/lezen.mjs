/**
 * B1 Lezen — ten oefenexamens, read from `generated/lezen-NN.json`.
 *
 * Kept as its own module so the dataset's import surface matches A2's
 * (`import { LEZEN_EXAMS } from './lezen.mjs'`) and `index.mjs` reads the same either way.
 * The content itself is generated; see `dataset.mjs` for why it lives in JSON.
 */
import { loadSkill } from './dataset.mjs';

export const LEZEN_EXAMS = loadSkill('lezen');
