/**
 * Het formulier van een Schrijven-opdracht, vastgelegd in een test.
 *
 * Elf B1-formulieren toonden maandenlang een leeg vlak: de seed schreef `rows`, de speler las
 * `fields`, en er faalde niets. Deze test leest elke B1-seedbron door dezelfde
 * `normalizeFormSchema` als de speler en eist dat er iets in te vullen valt — en dat het
 * conversiescript precies hetzelfde oplevert, zodat data en speler niet uiteen kunnen lopen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formFieldCount, formLabels, normalizeFormSchema } from '@/lib/form-schema';
import { convertFormSchema } from '../scripts/fix-b1-form-schemas.mjs';

const DIR = path.join(__dirname, '..', 'scripts', 'b1-content', 'generated');
const files = fs.readdirSync(DIR).filter(f => /^schrijven-\d+\.json$/.test(f));

const schemas = files.flatMap(f => {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const tasks: { title?: string; task_type?: string; form_schema?: unknown }[] = Array.isArray(data) ? data : data.tasks;
  return tasks.filter(t => t.form_schema).map(t => ({ name: `${f} · ${t.title}`, schema: t.form_schema }));
});

describe('Schrijven-formulieren', () => {
  it('vindt de B1-formulieren in de seedbron', () => {
    expect(files.length).toBe(10);
    expect(schemas.length).toBeGreaterThanOrEqual(10);
  });

  it.each(schemas)('$name heeft invulregels', ({ schema }) => {
    expect(formFieldCount(schema)).toBeGreaterThan(0);
  });

  it.each(schemas)('$name: het conversiescript = wat de speler leest', ({ schema }) => {
    const converted = convertFormSchema(schema);
    expect(converted.sections).toEqual(normalizeFormSchema(schema));
    // Eenmaal omgezet blijft het schema gelijk: opnieuw lezen verandert niets.
    expect(normalizeFormSchema(converted)).toEqual(converted.sections);
  });

  it('leest de A2-vorm met sleutels zoals hij is', () => {
    const schema = {
      sections: [{ title: 'Persoonsgegevens', fields: [{ key: 'achternaam', type: 'text', label: 'Achternaam' }] }],
    };
    expect(normalizeFormSchema(schema)).toEqual([
      { title: 'Persoonsgegevens', fields: [{ key: 'achternaam', type: 'text', label: 'Achternaam' }] },
    ]);
  });

  it('een leeggemaakte sectie telt als kapot', () => {
    // Zo stond B1 1.10 in de database na een opslag via het oude beheerscherm.
    const wiped = { sections: [{ title: 'Hoe vaak koopt u iets?', fields: [] }, { title: '', fields: [] }] };
    expect(formFieldCount(wiped)).toBe(0);
  });

  it('vaste regels tellen niet als invulregel, keuzes wel', () => {
    const schema = {
      sections: [
        {
          heading: 'Uw gegevens',
          rows: [
            { kind: 'static', label: 'Naam', value: 'A. Ferreira' },
            { kind: 'choice', label: 'Hoe vaak?', options: ['vaak', 'soms'], multiple: true },
            { kind: 'text', label: 'Onderwerp', placeholder: 'Vul het onderwerp in' },
          ],
        },
      ],
    };
    const [sec] = normalizeFormSchema(schema);
    expect(sec.title).toBe('Uw gegevens');
    expect(sec.fields.map(f => f.type)).toEqual(['static', 'checkbox', 'text']);
    expect(sec.fields[2].multiline).toBeUndefined();
    expect(formFieldCount(schema)).toBe(2);
    expect(formLabels(schema)['s1-r2']).toBe('Hoe vaak?');
  });
});
