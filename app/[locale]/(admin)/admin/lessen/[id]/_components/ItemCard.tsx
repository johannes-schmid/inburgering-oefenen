'use client';

import { ChevronDown, ChevronUp, Trash2, TriangleAlert } from 'lucide-react';
import { OPTION_LABELS, type LessonItemDraft } from '@/lib/admin/lesson-write';
import { TIERS, TIER_LABEL, isExerciseKind, type Tier } from '@/lib/lessons/items';
import PayloadFields from './PayloadFields';
import { KIND_LABEL, itemSummary } from './item-fields';

/**
 * Eén item in de lesstroom: dicht een regel, open een formulier.
 *
 * ── UITLEG EN OPGAVE ZIJN DEZELFDE KAART, MET EEN ANDER GEZICHT ──────────────
 * Ze staan in één tabel en in één sortering, en dat is de didactiek van deze laag: na de uitleg
 * oefen je meteen. Twee soorten kaarten zouden dat op het scherm weer uit elkaar trekken. Wat een
 * opgave *extra* heeft — een trap en een verplichte uitleg-achteraf — staat er dus onder in
 * plaats van ernaast.
 *
 * ── DE TRAP IS GEEN MOEILIJKHEIDSCIJFER ──────────────────────────────────────
 * 0 receptief, 1 halfproductief, 2 productief. Het label staat er voluit bij, want "tier 1" zegt
 * een docent niets en de keuze bepaalt wat `user_concept_mastery` als "kan dit zelf" telt.
 */
export default function ItemCard({
  draft,
  index,
  open,
  problem,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: {
  draft: LessonItemDraft;
  index: number;
  open: boolean;
  problem: string | null;
  onToggle: () => void;
  onChange: (next: LessonItemDraft) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const isExercise = isExerciseKind(draft.kind);
  const summary = itemSummary(draft.kind, draft.payload);

  return (
    <li className={`lei-item${open ? ' is-open' : ''}${isExercise ? ' is-exercise' : ''}${problem ? ' has-problem' : ''}`}>
      <div className="lei-item-head">
        {/* De plek in de stroom, niet `sort_order`: die is een databasewaarde die bij sommige
            geseede lessen op 0 begint, en "item 0" bestaat voor een docent niet. */}
        <span className="lei-num">{index + 1}</span>

        <button type="button" className="lei-item-open" onClick={onToggle} aria-expanded={open}>
          <span className="lei-kind">{KIND_LABEL[draft.kind]}</span>
          {isExercise && draft.tier !== null && (
            <span className="lei-tier">trap {draft.tier} · {TIER_LABEL[draft.tier]}</span>
          )}
          <span className="lei-summary">{summary || <em>nog leeg</em>}</span>
          <span className="lei-caret" aria-hidden>
            {open ? <ChevronUp size={15} strokeWidth={2.6} /> : <ChevronDown size={15} strokeWidth={2.6} />}
          </span>
        </button>

        <span className="lei-item-tools">
          <button type="button" className="lei-icon-btn" onClick={() => onMove(-1)} aria-label="Naar boven">
            <ChevronUp size={14} strokeWidth={2.8} />
          </button>
          <button type="button" className="lei-icon-btn" onClick={() => onMove(1)} aria-label="Naar beneden">
            <ChevronDown size={14} strokeWidth={2.8} />
          </button>
          <button type="button" className="lei-icon-btn is-danger" onClick={onRemove} aria-label="Item verwijderen">
            <Trash2 size={14} strokeWidth={2.4} />
          </button>
        </span>
      </div>

      {problem && (
        <p className="lei-problem">
          <TriangleAlert size={13} strokeWidth={2.6} aria-hidden /> {problem}
        </p>
      )}

      {open && (
        <div className="lei-item-body">
          <PayloadFields
            kind={draft.kind}
            payload={draft.payload}
            onChange={payload => onChange({ ...draft, payload })}
          />

          {isExercise && (
            <>
              <div className="lei-field lei-field-short">
                <span className="lei-label">Trap</span>
                <select
                  className="lei-input"
                  value={draft.tier ?? 0}
                  onChange={e => onChange({ ...draft, tier: Number(e.target.value) as Tier })}
                >
                  {TIERS.map(t => (
                    <option key={t} value={t}>{t} · {TIER_LABEL[t]}</option>
                  ))}
                </select>
              </div>

              <label className="lei-field">
                <span className="lei-label">
                  Waarom is dit het antwoord?
                  <em className="lei-hint">Verplicht bij een opgave — dit is wat de laag les maakt in plaats van toets.</em>
                </span>
                <textarea
                  className="lei-input"
                  rows={3}
                  value={draft.explanation}
                  onChange={e => onChange({ ...draft, explanation: e.target.value })}
                />
              </label>
            </>
          )}

          {draft.kind === 'mcq' && <Options draft={draft} onChange={onChange} />}
        </div>
      )}
    </li>
  );
}

/**
 * De opties van een meerkeuzeopgave.
 *
 * Drie of vier, precies één juist. Toevoegen en weghalen gaat aan de staart, want een optie is
 * geïdentificeerd door zijn **label**: rij B weghalen en de rest opschuiven zou label C naar B
 * verplaatsen, en bij het opslaan wordt per label gereconcilieerd — dan verandert stil wat een
 * eerdere cursist heeft aangeklikt.
 */
function Options({
  draft,
  onChange,
}: {
  draft: LessonItemDraft;
  onChange: (next: LessonItemDraft) => void;
}) {
  const options = draft.options;

  return (
    <div className="lei-field">
      <span className="lei-label">
        Opties
        <em className="lei-hint">Drie of vier. Vink het juiste antwoord aan.</em>
      </span>
      <div className="lei-list">
        {options.map((o, i) => (
          <div className="lei-list-row" key={o.label}>
            <span className="lei-opt-label">{o.label}</span>
            <input
              className="lei-input"
              type="text"
              aria-label={`Optie ${o.label}`}
              value={o.body}
              onChange={e => onChange({
                ...draft,
                options: options.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)),
              })}
            />
            <label className="lei-correct">
              <input
                type="radio"
                name={`correct-${draft.id ?? draft.sort_order}`}
                checked={o.is_correct}
                onChange={() => onChange({
                  ...draft,
                  options: options.map((x, j) => ({ ...x, is_correct: j === i })),
                })}
              />
              goed
            </label>
          </div>
        ))}
      </div>
      <div className="lei-list-row">
        {options.length < 4 && (
          <button
            type="button"
            className="lei-add"
            onClick={() => onChange({
              ...draft,
              options: [...options, { label: OPTION_LABELS[options.length], body: '', is_correct: false }],
            })}
          >
            Optie {OPTION_LABELS[options.length]} toevoegen
          </button>
        )}
        {options.length > 3 && (
          <button
            type="button"
            className="lei-add"
            onClick={() => {
              const kept = options.slice(0, -1);
              onChange({
                ...draft,
                // Als het juiste antwoord eraf ging, valt hij terug op A. Zonder juist antwoord
                // opslaan kan niet, en dan is A een keuze die de docent ziet en kan wijzigen.
                options: kept.some(o => o.is_correct)
                  ? kept
                  : kept.map((o, j) => ({ ...o, is_correct: j === 0 })),
              });
            }}
          >
            Optie {options[options.length - 1].label} weghalen
          </button>
        )}
      </div>
    </div>
  );
}
