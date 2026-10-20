/**
 * Het formulier van een Schrijven-opdracht: één vorm voor speler, beheer en beoordeling.
 *
 * Er staan twee vormen in de database. A2 en het beheerscherm schrijven
 * `{sections:[{title, fields:[{key, label, type}]}]}`; de B1-seed schreef
 * `{sections:[{heading, rows:[{kind:'static'|'choice'|'text', …}]}]}`. De speler las alleen de
 * eerste, dus elk B1-formulier toonde een leeg vlak — zonder fout, zonder log. Daarom loopt
 * álles wat een `form_schema` leest via `normalizeFormSchema`, en kan een sectie zonder velden
 * niet meer stil verdwijnen: `formFieldCount` is wat de test en de controle tellen.
 *
 * Puur en zonder imports, zodat de clientspeler en de unit-tests hem kunnen laden.
 */

export type FormField = {
  key: string;
  label: string;
  /** `static` is een vooraf ingevulde regel (naam, adres) die de kandidaat niet invult. */
  type: 'text' | 'date' | 'radio' | 'checkbox' | 'static';
  options?: string[];
  placeholder?: string;
  /** Bij `static`: de tekst die er al staat. */
  value?: string;
  /** Beginwaarde van een invulregel, die de kandidaat mag aanpassen. */
  prefill?: string;
  /** Een antwoord van een paar zinnen in plaats van één regel. */
  multiline?: boolean;
};

export type FormSection = { title: string; fields: FormField[] };

export type FormSchema = {
  sections?: { title?: string; fields: FormField[] }[];
  fields?: FormField[];
};

type LegacyRow = {
  kind?: string;
  label?: string;
  value?: string;
  options?: string[];
  multiple?: boolean;
  placeholder?: string;
  prefill?: string;
};

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

/** Een korte invulregel ("Vul het onderwerp in") blijft één regel; de rest vraagt om zinnen. */
function rowIsMultiline(row: LegacyRow): boolean {
  if (row.prefill) return false;
  return !/^vul\b/i.test(row.placeholder ?? '');
}

function fromRow(row: LegacyRow, key: string): FormField {
  const label = row.label ?? '';
  if (row.kind === 'static') return { key, label, type: 'static', value: row.value ?? '' };
  if (row.kind === 'choice') {
    return { key, label, type: row.multiple ? 'checkbox' : 'radio', options: row.options ?? [] };
  }
  return {
    key,
    label,
    type: 'text',
    ...(row.placeholder ? { placeholder: row.placeholder } : {}),
    ...(row.prefill ? { prefill: row.prefill } : {}),
    ...(rowIsMultiline(row) ? { multiline: true } : {}),
  };
}

function cleanField(f: Record<string, unknown>, fallbackKey: string): FormField {
  const type = str(f.type);
  return {
    key: str(f.key) || fallbackKey,
    label: str(f.label) ?? '',
    type: type === 'date' || type === 'radio' || type === 'checkbox' || type === 'static' ? type : 'text',
    ...(Array.isArray(f.options) ? { options: f.options.filter((o): o is string => typeof o === 'string') } : {}),
    ...(str(f.placeholder) ? { placeholder: str(f.placeholder) } : {}),
    ...(str(f.value) !== undefined ? { value: str(f.value) } : {}),
    ...(str(f.prefill) ? { prefill: str(f.prefill) } : {}),
    ...(f.multiline === true ? { multiline: true } : {}),
  };
}

/**
 * Elke bekende vorm → secties met velden. Een rij uit de oude vorm krijgt de sleutel
 * `s{sectie}-r{rij}` (1-gebaseerd), zodat dezelfde rij na de conversie dezelfde sleutel houdt.
 */
export function normalizeFormSchema(schema: unknown): FormSection[] {
  if (!schema || typeof schema !== 'object') return [];
  const s = schema as Record<string, unknown>;

  if (Array.isArray(s.fields) && !Array.isArray(s.sections)) {
    return [{ title: '', fields: (s.fields as Record<string, unknown>[]).map((f, j) => cleanField(f, `s1-r${j + 1}`)) }];
  }
  if (!Array.isArray(s.sections)) return [];

  return (s.sections as Record<string, unknown>[]).map((sec, i) => {
    const title = str(sec.title) ?? str(sec.heading) ?? '';
    if (Array.isArray(sec.rows)) {
      return { title, fields: (sec.rows as LegacyRow[]).map((r, j) => fromRow(r, `s${i + 1}-r${j + 1}`)) };
    }
    const fields = Array.isArray(sec.fields) ? (sec.fields as Record<string, unknown>[]) : [];
    return { title, fields: fields.map((f, j) => cleanField(f, `s${i + 1}-r${j + 1}`)) };
  });
}

/** Het aantal regels dat de kandidaat zelf invult — een formulier met 0 is kapot. */
export function formFieldCount(schema: unknown): number {
  return normalizeFormSchema(schema).reduce((n, s) => n + s.fields.filter(f => f.type !== 'static').length, 0);
}

/** sleutel → label, zodat de beoordeling "Welke producten koopt u…" leest in plaats van "s2-r1". */
export function formLabels(schema: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const sec of normalizeFormSchema(schema)) for (const f of sec.fields) out[f.key] = f.label;
  return out;
}
