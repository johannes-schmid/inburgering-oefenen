'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  blankItem, saveLessonItems, toDraft, validateDraft, type LessonItemDraft,
} from '@/lib/admin/lesson-write';
import { EXERCISE_KINDS, ITEM_KINDS, isExerciseKind, type ItemKind } from '@/lib/lessons/items';
import type { AdminLessonDetail } from '@/lib/lessons/lessons-server';
import ItemCard from './ItemCard';
import { KIND_LABEL } from './item-fields';

/**
 * De inhoud van één les, bewerkbaar: de leerstof en de opgaven die eraan hangen.
 *
 * ── ÉÉN STROOM, MET EEN FILTER — GEEN TWEE LIJSTEN ───────────────────────────
 * `lesson_items` is bewust één tabel met één sortering: "na de uitleg oefen je meteen" is wat deze
 * laag toevoegt aan de gidsen die er al zijn, en dat is één lijst. Twee kolommen op het scherm
 * (uitleg links, opgaven rechts) zou die belofte weer uit elkaar trekken en bovendien twee
 * sorteringen suggereren die niet bestaan. Wie alleen de opgaven wil nakijken zet daarom het
 * filter om; verplaatsen kan alleen in "Alles", want een pijltje in een gefilterde lijst zou een
 * item over onzichtbare buren heen tillen.
 *
 * ── ÉÉN DRAFT, ÉÉN SAVE ──────────────────────────────────────────────────────
 * Dezelfde keuze als op de fragmentpagina. Alles staat in de state van dit component en gaat met
 * één "Opslaan" naar de database, in de volgorde die `saveLessonItems` afdwingt: eerst parkeren,
 * dan schrijven, verwijderen als laatste. Een half afgemaakt item kan zo niet stil achterblijven
 * op een scherm waar iemand vanaf navigeert.
 *
 * ── VALIDATIE IS `validateItem`, NIET IETS EIGENS ────────────────────────────
 * Dezelfde functie die de seeder en de generator gebruiken. Een eigen set regels hier zou
 * betekenen dat de docent iets kan opslaan wat de seeder afkeurt — of erger, dat de editor iets
 * weigert dat al in de database staat.
 *
 * ── OPSLAAN IS GEEN NAKIJKEN ─────────────────────────────────────────────────
 * Bewerken raakt `checked_by` niet aan. Dat lijkt onlogisch tot je het omdraait: als opslaan het
 * stempel zou zetten, zou een komma verplaatsen betekenen dat de les is nagekeken, en als het het
 * stempel zou wíssen, zou niemand ooit een typefout durven verbeteren in een vrijgegeven les. Het
 * stempel is een aparte handeling in `LessonStatus`.
 */
export default function LessonEditor({ lesson }: { lesson: AdminLessonDetail }) {
  const router = useRouter();

  const [meta, setMeta] = useState({
    title: lesson.title,
    what_you_learn: lesson.what_you_learn ?? '',
    minutes: lesson.minutes,
    is_free: lesson.is_free,
  });
  const [items, setItems] = useState<LessonItemDraft[]>(() => lesson.items.map(toDraft));
  const [removed, setRemoved] = useState<number[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'alles' | 'leerstof' | 'opgaven'>('alles');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  /** Waar elk bewaard item **in de database** staat. Een reorder herschrijft alleen de draft. */
  const savedOrder = useMemo(
    () => new Map(lesson.items.map(i => [i.id, i.sort_order])),
    [lesson.items],
  );

  const problems = useMemo(
    () => items.map((d, i) => validateDraft(d, i)),
    [items],
  );
  const exerciseCount = items.filter(d => isExerciseKind(d.kind)).length;
  const blocking = problems.filter(Boolean).length;

  function patch(index: number, next: LessonItemDraft) {
    setItems(list => list.map((d, i) => (i === index ? next : d)));
    setNote('');
  }

  /** Herschrijf `sort_order` uit de array — de array is de waarheid op dit scherm. */
  function renumber(list: LessonItemDraft[]): LessonItemDraft[] {
    return list.map((d, i) => ({ ...d, sort_order: i + 1 }));
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems(list => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return renumber(next);
    });
    setOpenIndex(cur => (cur === index ? target : cur === target ? index : cur));
    setNote('');
  }

  function remove(index: number) {
    const d = items[index];
    // Een bewaard item wordt pas echt verwijderd door "Opslaan", zodat een misklik terug te
    // draaien is met opnieuw laden in plaats van door de content opnieuw te schrijven.
    if (d.id) setRemoved(prev => [...prev, d.id!]);
    setItems(list => renumber(list.filter((_, i) => i !== index)));
    setOpenIndex(null);
    setNote('');
  }

  function add(kind: ItemKind) {
    setItems(list => [...list, blankItem(kind, list.length + 1)]);
    setOpenIndex(items.length);
    setAdding(false);
    setNote('');
  }

  async function save() {
    const first = problems.findIndex(p => p !== null);
    if (first >= 0) {
      setError(problems[first]!);
      setOpenIndex(first);
      return;
    }
    if (!meta.title.trim()) { setError('De les heeft een titel nodig.'); return; }
    if (exerciseCount === 0) { setError('Een les moet minstens één opgave hebben.'); return; }

    setBusy(true);
    setError('');
    setNote('');
    const supabase = createClient();

    try {
      const { data, error: metaError } = await supabase
        .from('lessons')
        .update({
          title: meta.title.trim(),
          what_you_learn: meta.what_you_learn.trim() || null,
          minutes: meta.minutes,
          is_free: meta.is_free,
        })
        .eq('id', lesson.id)
        .select('id');
      if (metaError) throw new Error(metaError.message);
      // Nul rijen is hier een RLS-weigering die zich voordoet als een geslaagde save.
      if (!data?.length) throw new Error('de les is niet gewijzigd (0 rijen)');

      await saveLessonItems(supabase, lesson.id, items, removed, savedOrder);

      setRemoved([]);
      setNote('Opgeslagen.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'onbekende fout');
    } finally {
      setBusy(false);
    }
  }

  const shown = items
    .map((d, i) => ({ d, i }))
    .filter(({ d }) =>
      filter === 'alles'
      || (filter === 'opgaven') === isExerciseKind(d.kind));

  return (
    <div className="lei">
      <section className="lei-card">
        <h2 className="lei-card-title">De les</h2>
        <div className="lei-fields">
          <label className="lei-field">
            <span className="lei-label">Titel</span>
            <input
              className="lei-input"
              type="text"
              value={meta.title}
              onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
            />
          </label>
          <label className="lei-field">
            <span className="lei-label">
              Wat je leert
              <em className="lei-hint">Één alinea, in de tweede persoon, vóór de eerste opgave.</em>
            </span>
            <textarea
              className="lei-input"
              rows={3}
              value={meta.what_you_learn}
              onChange={e => setMeta(m => ({ ...m, what_you_learn: e.target.value }))}
            />
          </label>
          <div className="lei-row">
            <label className="lei-field lei-field-short">
              <span className="lei-label">Minuten</span>
              <input
                className="lei-input"
                type="number"
                value={meta.minutes ?? ''}
                onChange={e => setMeta(m => ({
                  ...m, minutes: e.target.value === '' ? null : Number(e.target.value),
                }))}
              />
            </label>
            <label className="lei-check">
              <input
                type="checkbox"
                checked={meta.is_free}
                onChange={e => setMeta(m => ({ ...m, is_free: e.target.checked }))}
              />
              Gratis les
            </label>
            <span className="lei-slug">slug: {lesson.slug}</span>
          </div>
        </div>
      </section>

      <div className="lei-toolbar">
        <nav className="lei-filter" aria-label="Wat je bewerkt">
          {(['alles', 'leerstof', 'opgaven'] as const).map(f => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'is-on' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'alles' ? `Alles (${items.length})`
                : f === 'leerstof' ? `Leerstof (${items.length - exerciseCount})`
                  : `Opgaven (${exerciseCount})`}
            </button>
          ))}
        </nav>

        <div className="lei-actions">
          {blocking > 0 && (
            <span className="lei-warn">
              <TriangleAlert size={13} strokeWidth={2.6} aria-hidden />
              {blocking} {blocking === 1 ? 'item' : 'items'} nog niet in orde
            </span>
          )}
          {note && <span className="lei-note">{note}</span>}
          <button type="button" className="lei-btn is-primary" onClick={save} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
            Opslaan
          </button>
        </div>
      </div>

      {error && <p className="lei-error">{error}</p>}

      <ul className="lei-items">
        {shown.map(({ d, i }) => (
          <ItemCard
            key={d.id ?? `nieuw-${i}`}
            draft={d}
            index={i}
            open={openIndex === i}
            problem={problems[i]}
            onToggle={() => setOpenIndex(cur => (cur === i ? null : i))}
            onChange={next => patch(i, next)}
            onMove={delta => move(i, delta)}
            onRemove={() => remove(i)}
          />
        ))}
      </ul>

      {filter !== 'alles' && (
        <p className="lei-hint-line">
          Verplaatsen kan alleen in “Alles” — in een gefilterde lijst zou een pijltje een item over
          items heen tillen die je niet ziet.
        </p>
      )}

      {adding ? (
        <div className="lei-kinds">
          <p className="lei-kinds-head">Leerstof</p>
          <div className="lei-kinds-row">
            {ITEM_KINDS.filter(k => !isExerciseKind(k)).map(k => (
              <button key={k} type="button" className="lei-btn" onClick={() => add(k)}>{KIND_LABEL[k]}</button>
            ))}
          </div>
          <p className="lei-kinds-head">Opgaven</p>
          <div className="lei-kinds-row">
            {EXERCISE_KINDS.map(k => (
              <button key={k} type="button" className="lei-btn" onClick={() => add(k)}>{KIND_LABEL[k]}</button>
            ))}
          </div>
          <button type="button" className="lei-btn is-plain" onClick={() => setAdding(false)}>Annuleren</button>
        </div>
      ) : (
        <button type="button" className="lei-btn is-primary lei-add-item" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={2.8} aria-hidden /> Item toevoegen
        </button>
      )}
    </div>
  );
}
