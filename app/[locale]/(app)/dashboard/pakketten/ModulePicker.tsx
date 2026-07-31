'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, Lock, Sparkles, TriangleAlert } from 'lucide-react';
import SkillIcon from '@/components/site/SkillIcon';
import type { SkillSlug } from '@/data/skills';
import {
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  BUNDLE_SAVING_PCT,
  euro,
  MODULE_PRICE_CENTS,
  priceForSelection,
  savingForSelection,
} from '@/lib/pricing';

export type PickerModule = {
  slug: SkillSlug;
  label: string;
  examCount: number;
  itemCount: number;
  itemNoun: string;
  hasRubricFeedback: boolean;
  /** Already paid for — shown as owned and excluded from the total. */
  owned: boolean;
};

/**
 * Combine modules and see what it costs, then go straight to payment.
 *
 * The previous version was four separate "ontgrendel" buttons, which forced a choice between one
 * module and everything and hid the fact that two or three is allowed. Toggling makes the offer
 * legible: the total updates, and the bundle line only appears once selecting a fourth is actually
 * cheaper than not.
 *
 * The total here is presentation. `/api/checkout-modules` recomputes it from the module list, so a
 * tampered client gets the real price.
 */
export default function ModulePicker({
  modules,
  locale,
  initialSelection,
}: {
  modules: PickerModule[];
  locale: string;
  initialSelection: SkillSlug[];
}) {
  const [selected, setSelected] = useState<SkillSlug[]>(initialSelection);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyable = useMemo(() => modules.filter(m => !m.owned), [modules]);
  const total = priceForSelection(selected);
  const saving = savingForSelection(selected);
  const allSelected = selected.length === modules.length;

  function toggle(slug: SkillSlug) {
    setError(null);
    setSelected(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));
  }

  function selectAll() {
    setError(null);
    setSelected(allSelected ? [] : buyable.map(m => m.slug));
  }

  async function checkout() {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: selected, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkoutUrl) throw new Error(json.error || 'Betalen is niet gelukt.');
      // Straight to Mollie. No interstitial: the choice was made on this page.
      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Betalen is niet gelukt.');
      setBusy(false);
    }
  }

  return (
    <div className="mp">
      <div className="mp-grid">
        {modules.map(mod => {
          const on = selected.includes(mod.slug);
          return (
            <label
              key={mod.slug}
              className={`mp-card${on ? ' mp-on' : ''}${mod.owned ? ' mp-owned' : ''}`}
            >
              <input
                type="checkbox"
                checked={mod.owned || on}
                disabled={mod.owned}
                onChange={() => toggle(mod.slug)}
                className="sr-only"
              />

              <span className="mp-check" aria-hidden="true">
                {(on || mod.owned) && <Check size={13} strokeWidth={3.4} />}
              </span>

              <span className="mp-head">
                <SkillIcon skill={mod.slug} size="md" />
                <span className="min-w-0">
                  <span className="mp-name">{mod.label}</span>
                  <span className="mp-meta">
                    {mod.examCount} oefenexamens · {mod.itemCount} {mod.itemNoun}
                  </span>
                </span>
              </span>

              <span className="mp-price">
                {mod.owned ? <em>Je hebt dit al</em> : <>{euro(MODULE_PRICE_CENTS)} <small>p/m</small></>}
              </span>

              {mod.hasRubricFeedback && (
                <span className="mp-perk">Onbeperkt nakijken met de criteria van de docent</span>
              )}
            </label>
          );
        })}
      </div>

      {buyable.length === modules.length && (
        <div className="mp-bundle">
          {/* The list price stays visible beside the discounted one. A saving claim without its
              reference price is the part consumer-protection rules actually object to. */}
          <span className="mp-bundle-badge">
            <Sparkles size={13} strokeWidth={2.4} aria-hidden />
            Bespaar {BUNDLE_SAVING_PCT}% met alle vier de onderdelen
          </span>
          <p className="mp-bundle-price">
            {euro(BUNDLE_PRICE_CENTS)}{' '}
            <s>{euro(BUNDLE_LIST_PRICE_CENTS)}</s> <small>p/m</small>
          </p>
          <button type="button" onClick={selectAll} className="mp-all">
            {allSelected ? 'Selectie wissen' : 'Selecteer alle vier'}
            {!allSelected && <ArrowRight size={15} strokeWidth={2.5} aria-hidden />}
          </button>
        </div>
      )}

      {/* ── Running total ── */}
      <div className="mp-bar" data-empty={selected.length === 0}>
        <div className="min-w-0">
          <p className="mp-bar-label">
            {selected.length === 0
              ? 'Nog niets gekozen'
              : `${selected.length} ${selected.length === 1 ? 'onderdeel' : 'onderdelen'} gekozen`}
          </p>
          <p className="mp-bar-total">
            {euro(total)} <small>per maand</small>
          </p>
          {saving > 0 && <p className="mp-bar-saving">Je bespaart {euro(saving)} per maand</p>}
          {selected.length === 3 && (
            // Three modules cost €29,85 and four cost €29,95 — ten cents more for a whole extra
            // onderdeel. Not saying so would be withholding the obvious.
            <p className="mp-bar-nudge">
              Voor {euro(BUNDLE_PRICE_CENTS - total)} meer krijg je het vierde onderdeel er ook bij.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={checkout}
          disabled={selected.length === 0 || busy}
          className="mp-cta"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="mp-spin" aria-hidden /> Bezig…
            </>
          ) : (
            <>
              Doorgaan naar betalen
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mp-error">
          <TriangleAlert size={14} aria-hidden />
          {error}
        </p>
      )}

      {/* Mollie is explicit that an iDEAL transaction is not itself an authorisation for direct
          debit, so the consent to a recurring collection has to be given here, in our own words,
          before the candidate leaves for the payment screen. */}
      <p className="mp-consent">
        Je start een maandelijks abonnement van {euro(total || MODULE_PRICE_CENTS)} per maand. Het
        wordt elke maand automatisch verlengd en via SEPA-incasso van je rekening afgeschreven,
        totdat je opzegt. Opzeggen kan elk moment bij <strong>Mijn account</strong>.
      </p>

      <p className="mp-foot">
        <Lock size={13} aria-hidden />
        Betalen gaat via iDEAL of creditcard. Je kunt maandelijks opzeggen.
      </p>

      <style>{`
        .mp-grid { display:grid; grid-template-columns:1fr; gap:12px; }
        @media (min-width:640px)  { .mp-grid { grid-template-columns:repeat(2,1fr); } }
        @media (min-width:1024px) { .mp-grid { grid-template-columns:repeat(4,1fr); } }

        .mp-card {
          position:relative; display:flex; flex-direction:column; gap:10px; padding:18px;
          border-radius:18px; cursor:pointer; background:var(--color-surface-container-lowest);
          border:1.5px solid var(--color-surface-container-high); box-shadow:var(--shadow-card);
          transition:border-color .18s ease, box-shadow .18s ease, transform .18s cubic-bezier(0.22,1,0.36,1);
        }
        .mp-card:hover { transform:translateY(-2px); }
        .mp-card:focus-within { outline:3px solid var(--color-secondary); outline-offset:2px; }
        .mp-on { border-color:var(--color-primary); box-shadow:0 10px 28px rgba(0,43,109,0.16); }
        .mp-owned { cursor:default; opacity:0.62; }
        .mp-owned:hover { transform:none; }

        .mp-check {
          position:absolute; top:14px; right:14px; width:22px; height:22px; border-radius:7px;
          display:flex; align-items:center; justify-content:center;
          border:1.5px solid var(--color-outline-variant); background:#fff; color:#fff;
          transition:background-color .16s ease, border-color .16s ease;
        }
        .mp-on .mp-check, .mp-owned .mp-check { background:var(--color-primary); border-color:var(--color-primary); }

        .mp-head { display:flex; align-items:flex-start; gap:10px; padding-right:28px; }
        .mp-name { display:block; font-family:var(--font-headline); font-size:1rem; font-weight:800; color:var(--color-on-surface); text-transform:capitalize; }
        .mp-meta { display:block; font-size:0.72rem; color:var(--color-outline); margin-top:2px; }

        .mp-price { font-family:var(--font-headline); font-size:1.35rem; font-weight:800; letter-spacing:-0.03em; color:var(--color-primary); }
        .mp-price small { font-size:0.7rem; font-weight:600; color:var(--color-outline); }
        .mp-price em { font-size:0.8rem; font-style:normal; font-weight:700; color:var(--color-outline); }

        .mp-perk { font-size:0.72rem; line-height:1.45; color:var(--color-on-surface-variant); }

        .mp-bundle {
          margin-top:12px; padding:16px 18px; border-radius:16px; text-align:center;
          display:flex; flex-direction:column; align-items:center; gap:8px;
          background:var(--color-surface-container-lowest);
          border:1.5px solid var(--color-surface-container-high);
          box-shadow:var(--shadow-card);
        }
        .mp-bundle-badge {
          display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px;
          background:#fff1e6; color:var(--color-secondary);
          font-size:0.74rem; font-weight:800; letter-spacing:0.01em;
        }
        .mp-bundle-price {
          margin:0; font-family:var(--font-headline); font-size:1.5rem; font-weight:800;
          letter-spacing:-0.03em; color:var(--color-primary);
        }
        .mp-bundle-price s { font-size:0.95rem; font-weight:700; color:var(--color-outline); margin-left:4px; }
        .mp-bundle-price small { font-size:0.72rem; font-weight:600; color:var(--color-outline); }

        .mp-all {
          display:inline-flex; align-items:center; justify-content:center; gap:7px;
          background:none; border:1.5px solid var(--color-outline-variant);
          border-radius:12px; padding:9px 18px; font:inherit; font-size:0.82rem; font-weight:700;
          color:var(--color-primary); cursor:pointer;
          transition:background-color .16s ease, border-color .16s ease;
        }
        .mp-all:hover { background:var(--color-surface-container-low); border-color:var(--color-primary); }
        .mp-all:focus-visible { outline:3px solid var(--color-secondary); outline-offset:2px; }

        .mp-bar {
          display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;
          margin-top:16px; padding:18px 20px; border-radius:18px;
          background:linear-gradient(135deg,#001d4e 0%,#002b6d 55%,#003580 100%);
          box-shadow:0 10px 30px rgba(0,27,78,0.22);
          position:sticky; bottom:0; z-index:20;
        }
        @media (max-width:768px) { .mp-bar { bottom:78px; } }
        .mp-bar[data-empty='true'] { background:var(--color-surface-container); box-shadow:none; }
        .mp-bar[data-empty='true'] .mp-bar-label,
        .mp-bar[data-empty='true'] .mp-bar-total { color:var(--color-on-surface-variant); }

        .mp-bar-label { margin:0; font-size:0.68rem; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.6); }
        .mp-bar-total { margin:2px 0 0; font-family:var(--font-headline); font-size:1.75rem; font-weight:800; letter-spacing:-0.03em; color:#fff; }
        .mp-bar-total small { font-size:0.78rem; font-weight:600; color:rgba(255,255,255,0.66); }
        .mp-bar-saving { margin:4px 0 0; font-size:0.8rem; font-weight:700; color:#ffd9bd; }
        .mp-bar-nudge { margin:4px 0 0; font-size:0.8rem; color:rgba(255,255,255,0.78); }

        .mp-cta {
          display:inline-flex; align-items:center; gap:9px; padding:13px 22px; border:0;
          border-radius:13px; font:inherit; font-size:0.9rem; font-weight:800; cursor:pointer;
          color:#5f2200; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange);
          transition:transform .2s cubic-bezier(0.22,1,0.36,1);
        }
        .mp-cta:hover:not(:disabled) { transform:translateY(-2px); }
        .mp-cta:disabled { opacity:0.45; cursor:default; }
        .mp-cta:focus-visible { outline:3px solid #fff; outline-offset:2px; }

        .mp-error { display:flex; align-items:center; gap:7px; margin:12px 0 0; font-size:0.82rem; color:var(--color-error); }
        .mp-consent { margin:14px 0 0; font-size:0.76rem; line-height:1.6; color:var(--color-on-surface-variant); }
        .mp-foot { display:flex; align-items:center; gap:7px; margin:14px 0 0; font-size:0.75rem; color:var(--color-outline); }
        .mp-spin { animation:mp-rotate 900ms linear infinite; }
        @keyframes mp-rotate { to { transform:rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .mp-card, .mp-cta, .mp-check, .mp-all { transition:none; }
          .mp-card:hover, .mp-cta:hover:not(:disabled) { transform:none; }
          .mp-spin { animation:none; }
        }
      `}</style>
    </div>
  );
}
