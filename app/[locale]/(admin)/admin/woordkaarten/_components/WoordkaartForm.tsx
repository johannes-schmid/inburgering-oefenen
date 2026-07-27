'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type WordCard = {
  id?: number;
  theme_id: number;
  theme_name: string;
  dutch: string;
  article: string;
  plural: string;
  dutch_description: string;
  dutch_example: string;
  translation_en: string;
  description_en: string;
  translation_ar: string;
  description_ar: string;
  translation_tr: string;
  description_tr: string;
  sort_order: number;
};

const THEME_NAMES: Record<number, string> = {
  1: 'Geschiedenis en Geografie',
  2: 'Staatsinrichting en Rechtsstaat',
  3: 'Maatschappij en Samenleven',
  4: 'Werk en Inkomen',
  5: 'Gezondheid en Zorg',
  6: 'Onderwijs',
  7: 'Wonen',
};

export default function WoordkaartForm({
  initial,
  locale,
}: {
  initial?: Partial<WordCard>;
  locale: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<WordCard>({
    theme_id: 1,
    theme_name: 'Geschiedenis en Geografie',
    dutch: '',
    article: '',
    plural: '',
    dutch_description: '',
    dutch_example: '',
    translation_en: '',
    description_en: '',
    translation_ar: '',
    description_ar: '',
    translation_tr: '',
    description_tr: '',
    sort_order: 0,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = !initial?.id;

  function set<K extends keyof WordCard>(key: K, value: WordCard[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setTheme(id: number) {
    setForm(f => ({ ...f, theme_id: id, theme_name: THEME_NAMES[id] }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const supabase = createClient();

    const payload = { ...form };
    delete (payload as Partial<WordCard>).id;

    const { error: err } = isNew
      ? await supabase.from('word_cards').insert(payload)
      : await supabase.from('word_cards').update(payload).eq('id', form.id!);

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      if (isNew) router.push(`/${locale}/admin/woordkaarten`);
      else router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const supabase = createClient();
    await supabase.from('word_cards').delete().eq('id', form.id!);
    router.push(`/${locale}/admin/woordkaarten`);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Thema">
          <select value={form.theme_id} onChange={e => setTheme(parseInt(e.target.value))} className="field">
            {[1,2,3,4,5,6,7].map(i => <option key={i} value={i}>Thema {i}: {THEME_NAMES[i]}</option>)}
          </select>
        </Field>
        <Field label="Volgorde">
          <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} className="field" />
        </Field>
      </div>

      <Section title="Nederlands">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Lidwoord">
            <select value={form.article} onChange={e => set('article', e.target.value)} className="field">
              <option value="">—</option>
              <option value="de">de</option>
              <option value="het">het</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Woord *">
              <input value={form.dutch} onChange={e => set('dutch', e.target.value)} required className="field" />
            </Field>
          </div>
        </div>
        <Field label="Meervoud">
          <input value={form.plural} onChange={e => set('plural', e.target.value)} className="field" />
        </Field>
        <Field label="Omschrijving (NL)">
          <textarea value={form.dutch_description} onChange={e => set('dutch_description', e.target.value)} rows={2} className="field resize-none" />
        </Field>
        <Field label="Voorbeeldzin">
          <textarea value={form.dutch_example} onChange={e => set('dutch_example', e.target.value)} rows={2} className="field resize-none" />
        </Field>
      </Section>

      <Section title="Engels">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vertaling EN">
            <input value={form.translation_en} onChange={e => set('translation_en', e.target.value)} className="field" />
          </Field>
          <Field label="Omschrijving EN">
            <input value={form.description_en} onChange={e => set('description_en', e.target.value)} className="field" />
          </Field>
        </div>
      </Section>

      <Section title="Arabisch">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vertaling AR">
            <input value={form.translation_ar} onChange={e => set('translation_ar', e.target.value)} dir="rtl" className="field" />
          </Field>
          <Field label="Omschrijving AR">
            <input value={form.description_ar} onChange={e => set('description_ar', e.target.value)} dir="rtl" className="field" />
          </Field>
        </div>
      </Section>

      <Section title="Turks">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vertaling TR">
            <input value={form.translation_tr} onChange={e => set('translation_tr', e.target.value)} className="field" />
          </Field>
          <Field label="Omschrijving TR">
            <input value={form.description_tr} onChange={e => set('description_tr', e.target.value)} className="field" />
          </Field>
        </div>
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {saving ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>Opslaan…</>
          ) : saved ? (
            <><span className="material-symbols-outlined text-[18px]">check_circle</span>Opgeslagen ✓</>
          ) : (
            <><span className="material-symbols-outlined text-[18px]">save</span>Opslaan</>
          )}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete ? 'bg-error text-white' : 'border border-error/30 text-error hover:bg-error/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {confirmDelete ? 'Zeker verwijderen?' : 'Verwijderen'}
          </button>
        )}
        {confirmDelete && (
          <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-on-surface-variant hover:text-on-surface">
            Annuleren
          </button>
        )}
      </div>

      <style>{`.field { width: 100%; border: 1px solid var(--color-outline-variant); border-radius: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; } .field:focus { border-color: var(--color-primary); }`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}
