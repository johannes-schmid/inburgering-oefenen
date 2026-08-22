/**
 * Load the generated B1 dataset off disk.
 *
 * The content lives as one JSON file per (onderdeel, examen) under `generated/`, written by
 * `scripts/generate-b1-content.mjs` and committed. JSON rather than a `.mjs` literal like
 * A2's, for one reason: it is produced incrementally by a long, resumable, paid-for run, and a
 * generator that has to splice into a hand-shaped module either rewrites the whole file every
 * time or grows a fragile marker convention. A per-exam file is also the review unit — a diff
 * shows exactly which oefenexamen changed.
 *
 * A missing file is an empty exam, not an error: `--partial` exists so an onderdeel can be
 * seeded and played locally while it is being authored, and `validateDataset()` is what refuses
 * a short dataset when it matters. Reading it here as a hard failure would make the very first
 * run impossible — nothing is generated yet at that point.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../a2-content/lib.mjs';
import { EXAM_COUNT } from './rules.mjs';

const DIR = path.join(ROOT, 'scripts', 'b1-content', 'generated');

export function generatedPath(skill, number) {
  return path.join(DIR, `${skill}-${String(number).padStart(2, '0')}.json`);
}

export function readExam(skill, number) {
  const p = generatedPath(skill, number);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeExam(skill, number, data) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(generatedPath(skill, number), `${JSON.stringify(data, null, 2)}\n`);
}

/** The ten exams of one onderdeel, in order. A gap is `[]`, so indexes stay meaningful. */
export function loadSkill(skill) {
  return Array.from({ length: EXAM_COUNT }, (_, i) => readExam(skill, i + 1) ?? []);
}
