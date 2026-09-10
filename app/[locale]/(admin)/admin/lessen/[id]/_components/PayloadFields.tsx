'use client';

import { Plus, X } from 'lucide-react';
import type { ItemKind } from '@/lib/lessons/items';
import { ITEM_FIELDS, type Field } from './item-fields';

/**
 * De payload van één item, als formulier.
 *
 * Eén renderer voor veertien soorten, gestuurd door `ITEM_FIELDS`. Wat hij bewust **niet** doet is
 * valideren: elke regel over wat mag staat in de zod-schema's en in `validateItem`, en een tweede
 * set regels in de invoervelden zou betekenen dat de editor iets weigert dat de seeder accepteert
 * of andersom. De velden nemen alles aan; de kaart eromheen zegt wat er mis is.
 *
 * Lijstvelden houden altijd één lege rij onderaan aan om in te typen. Die lege rij wordt bij het
 * opslaan weggegooid (`cleanPayload`), zodat een half getypte chip nooit als lege string de
 * database in gaat.
 */
export default function PayloadFields({
  kind,
  payload,
  onChange,
}: {
  kind: ItemKind;
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const fields = ITEM_FIELDS[kind];

  function set(key: string, value: unknown) {
    onChange({ ...payload, [key]: value });
  }

  if (!fields) {
    // Een soort zonder spec. Kan alleen gebeuren als `ITEM_KINDS` groeit en deze tabel niet:
    // dan liever de rauwe JSON dan een leeg formulier boven bestaande content.
    return (
      <label className="lei-field">
        <span className="lei-label">Payload (JSON)</span>
        <textarea
          className="lei-input lei-mono"
          rows={8}
          value={JSON.stringify(payload, null, 2)}
          onChange={e => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* half getypte JSON is geen fout */ }
          }}
        />
      </label>
    );
  }

  return (
    <div className="lei-fields">
      {fields.map(field => (
        <FieldRow key={field.key} field={field} value={payload[field.key]} onChange={v => set(field.key, v)} />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <span className="lei-label">
      {field.label}
      {field.hint && <em className="lei-hint">{field.hint}</em>}
    </span>
  );

  switch (field.type) {
    case 'line':
      return (
        <label className="lei-field">
          {label}
          <input
            className="lei-input"
            type="text"
            value={asString(value)}
            onChange={e => onChange(e.target.value)}
          />
        </label>
      );

    case 'html':
      return (
        <label className="lei-field">
          {label}
          <textarea
            className="lei-input"
            rows={field.rows ?? 4}
            value={asString(value)}
            onChange={e => onChange(e.target.value)}
          />
        </label>
      );

    case 'number':
      return (
        <label className="lei-field lei-field-short">
          {label}
          <input
            className="lei-input"
            type="number"
            value={value == null ? '' : String(value)}
            onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
      );

    case 'select':
      return (
        <label className="lei-field lei-field-short">
          {label}
          <select className="lei-input" value={asString(value)} onChange={e => onChange(e.target.value)}>
            {field.choices.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      );

    case 'strings':
    case 'numbers': {
      const list = Array.isArray(value) ? value.map(v => (v == null ? '' : String(v))) : [];
      const rows = [...list, ''];
      return (
        <div className="lei-field">
          {label}
          <div className="lei-list">
            {rows.map((row, i) => (
              <div className="lei-list-row" key={i}>
                <input
                  className="lei-input"
                  type={field.type === 'numbers' ? 'number' : 'text'}
                  value={row}
                  onChange={e => {
                    const next = [...list];
                    const parsed = field.type === 'numbers' ? Number(e.target.value) : e.target.value;
                    if (i < next.length) next[i] = parsed as never;
                    else next.push(parsed as never);
                    onChange(next);
                  }}
                />
                {i < list.length && (
                  <RemoveButton onClick={() => onChange(list.filter((_, j) => j !== i))} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'rows': {
      const list = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      return (
        <div className="lei-field">
          {label}
          <div className="lei-list">
            {list.map((row, i) => (
              <div className="lei-list-row" key={i}>
                {field.columns.map(col => (
                  <input
                    key={col.key}
                    className="lei-input"
                    type="text"
                    placeholder={col.label}
                    aria-label={`${field.label} — ${col.label}`}
                    value={asString(row?.[col.key])}
                    onChange={e => {
                      const next = list.map((r, j) => (j === i ? { ...r, [col.key]: e.target.value } : r));
                      onChange(next);
                    }}
                  />
                ))}
                <RemoveButton onClick={() => onChange(list.filter((_, j) => j !== i))} />
              </div>
            ))}
            <AddButton
              label={`Rij toevoegen aan ${field.label.toLowerCase()}`}
              onClick={() => onChange([...list, Object.fromEntries(field.columns.map(c => [c.key, '']))])}
            />
          </div>
        </div>
      );
    }

    case 'columns': {
      const list = Array.isArray(value)
        ? (value as { heading?: string; phrases?: string[] }[])
        : [];
      return (
        <div className="lei-field">
          {label}
          <div className="lei-columns">
            {list.map((col, i) => {
              const phrases = Array.isArray(col.phrases) ? col.phrases : [];
              const patch = (next: Partial<{ heading: string; phrases: string[] }>) =>
                onChange(list.map((c, j) => (j === i ? { ...c, ...next } : c)));
              return (
                <div className="lei-column" key={i}>
                  <div className="lei-list-row">
                    <input
                      className="lei-input"
                      type="text"
                      placeholder="Kop"
                      aria-label="Kop van de kolom"
                      value={asString(col.heading)}
                      onChange={e => patch({ heading: e.target.value })}
                    />
                    <RemoveButton onClick={() => onChange(list.filter((_, j) => j !== i))} />
                  </div>
                  {[...phrases, ''].map((phrase, k) => (
                    <div className="lei-list-row" key={k}>
                      <input
                        className="lei-input"
                        type="text"
                        placeholder="Zin"
                        aria-label="Zin in de kolom"
                        value={phrase}
                        onChange={e => {
                          const next = [...phrases];
                          if (k < next.length) next[k] = e.target.value;
                          else next.push(e.target.value);
                          patch({ phrases: next });
                        }}
                      />
                      {k < phrases.length && (
                        <RemoveButton onClick={() => patch({ phrases: phrases.filter((_, j) => j !== k) })} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            <AddButton
              label="Kolom toevoegen"
              onClick={() => onChange([...list, { heading: '', phrases: [''] }])}
            />
          </div>
        </div>
      );
    }
  }
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="lei-icon-btn" onClick={onClick} aria-label="Rij verwijderen">
      <X size={14} strokeWidth={2.6} />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="lei-add" onClick={onClick}>
      <Plus size={14} strokeWidth={2.8} /> {label}
    </button>
  );
}
