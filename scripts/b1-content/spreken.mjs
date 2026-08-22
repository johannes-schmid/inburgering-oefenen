/**
 * B1 Spreken — ten oefenexamens, read from `generated/spreken-NN.json`.
 *
 * Kept as its own module so the dataset's import surface matches A2's
 * (`import { SPREKEN_EXAMS } from './spreken.mjs'`) and `index.mjs` reads the same either way.
 * The content itself is generated; see `dataset.mjs` for why it lives in JSON.
 */
import { loadSkill } from './dataset.mjs';

export const SPREKEN_EXAMS = loadSkill('spreken');
