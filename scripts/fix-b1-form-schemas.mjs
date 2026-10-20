#!/usr/bin/env node
/**
 * Zet elk B1-formulier om naar de vorm die speler en beheer lezen, en herstelt een formulier
 * dat zijn rijen kwijt is uit de seedbron.
 *
 * Waarom: de B1-seed schreef `{sections:[{heading, rows:[{kind,…}]}]}`; de speler las alleen
 * `sections[].fields[]`. Alle elf B1-schema's toonden daardoor een leeg "Het formulier". B1 1.10
 * ("Vragenlijst van de bakker") was bovendien via het beheerscherm opgeslagen, dat de oude vorm
 * niet kende en de rijen wiste. `lib/form-schema.ts` leest nu beide vormen; dit script maakt de
 * data zelf eenduidig, zodat het beheerscherm hem ook kan bewerken.
 *
 *   node scripts/fix-b1-form-schemas.mjs              # lokaal
 *   node scripts/fix-b1-form-schemas.mjs --dry-run    # alleen tonen
 *   node scripts/fix-b1-form-schemas.mjs --production # productie
 *
 * `convertFormSchema` moet hetzelfde opleveren als `normalizeFormSchema` in lib/form-schema.ts;
 * `tests-unit/form-schema.test.ts` legt dat vast.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, isLocalUrl, createDb } from './a2-content/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fromRow(row, key) {
  const label = row.label ?? '';
  if (row.kind === 'static') return { key, label, type: 'static', value: row.value ?? '' };
  if (row.kind === 'choice') return { key, label, type: row.multiple ? 'checkbox' : 'radio', options: row.options ?? [] };
  const multiline = !row.prefill && !/^vul\b/i.test(row.placeholder ?? '');
  return {
    key,
    label,
    type: 'text',
    ...(row.placeholder ? { placeholder: row.placeholder } : {}),
    ...(row.prefill ? { prefill: row.prefill } : {}),
    ...(multiline ? { multiline: true } : {}),
  };
}

/** Oude `rows`-vorm → `{sections:[{title, fields}]}`. De `fields`-vorm blijft zoals hij is. */
export function convertFormSchema(schema) {
  if (!schema?.sections) return schema;
  return {
    sections: schema.sections.map((sec, i) => ({
      title: sec.title ?? sec.heading ?? '',
      fields: Array.isArray(sec.rows)
        ? sec.rows.map((r, j) => fromRow(r, `s${i + 1}-r${j + 1}`))
        : (sec.fields ?? []),
    })),
  };
}

const inputCount = schema =>
  (convertFormSchema(schema)?.sections ?? []).reduce((n, s) => n + s.fields.filter(f => f.type !== 'static').length, 0);

function seedTask(examNumber, sortOrder) {
  const file = path.join(ROOT, 'scripts', 'b1-content', 'generated', `schrijven-${String(examNumber).padStart(2, '0')}.json`);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const tasks = Array.isArray(data) ? data : data.tasks;
  return tasks?.[sortOrder - 1] ?? null;
}

async function main() {
  const PRODUCTION = process.argv.includes('--production');
  const DRY = process.argv.includes('--dry-run');
  const env = loadEnv({ production: PRODUCTION });
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!isLocalUrl(url) && !PRODUCTION) {
    console.error(`WEIGERD: ${url} is niet lokaal. Geef --production als dat de bedoeling is.`);
    process.exit(1);
  }
  if (PRODUCTION && isLocalUrl(url)) {
    console.error('--production gegeven maar de url is lokaal.');
    process.exit(1);
  }
  console.log(`→ ${url}${DRY ? ' (dry-run)' : ''}`);
  const db = createDb({ supabaseUrl: url, serviceKey: env.SUPABASE_SERVICE_KEY });

  const exams = await db.selectRows('exams', 'select=id,number&level=eq.b1&skill=eq.schrijven&number=gt.0');
  const byId = new Map(exams.map(e => [e.id, e.number]));
  const tasks = await db.selectRows(
    'open_tasks',
    `select=id,exam_id,sort_order,title,task_type,form_schema&form_schema=not.is.null&exam_id=in.(${exams.map(e => e.id).join(',')})`
  );

  let changed = 0;
  for (const t of tasks) {
    const number = byId.get(t.exam_id);
    let source = t.form_schema;
    let note = '';
    if (inputCount(source) === 0) {
      const seed = seedTask(number, t.sort_order);
      if (!seed?.form_schema || (seed.title && t.title && seed.title.trim() !== t.title.trim())) {
        console.error(`  ! B1 ${number}.${t.sort_order} (#${t.id}) is leeg en de seedbron past niet — overgeslagen`);
        continue;
      }
      source = seed.form_schema;
      note = ' (hersteld uit de seedbron)';
    }
    const next = convertFormSchema(source);
    if (JSON.stringify(next) === JSON.stringify(t.form_schema)) continue;
    console.log(`  B1 ${number}.${t.sort_order} #${t.id} ${t.task_type}: ${inputCount(next)} invulregels${note}`);
    changed++;
    if (!DRY) await db.patch('open_tasks', `id=eq.${t.id}`, { form_schema: next });
  }
  console.log(`${changed} van ${tasks.length} schema's ${DRY ? 'zouden wijzigen' : 'bijgewerkt'}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
