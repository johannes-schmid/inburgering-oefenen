'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, Lock, Sparkles, TriangleAlert } from 'lucide-react';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark, { type Track } from '@/components/horizon/ExamMark';
import type { Level, OnaSlug, OnderdeelSlug } from '@/data/skills';
import {
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  BUNDLE_SAVING_PCT,
  euro,
  MODULE_PRICE_CENTS,
  priceForSelection,
  savingForSelection,
  type ModuleSlug,
} from '@/lib/pricing';
import { track } from '@/lib/analytics';

export type PickerModule = {
  /** The full `level:skill` module id — what gets posted to checkout. */
  slug: ModuleSlug;
  /** `null` for KNM, which is not examined per CEFR level and forms a group of its own. */
  level: Level | null;
  /** `'A2'`, or `'KNM'` for the onderdeel that has no level. For the group heading. */
  levelLabel: string;
  /** The bare onderdeel, for the icon (which keys on that, not on the module id). */
  skill: OnderdeelSlug | OnaSlug;
  label: string;
  examCount: number;
  /** `null` where DUO's format for this level is unverified. */
  itemCount: number | null;
  itemNoun: string;
  hasRubricFeedback: boolean;
  /**
   * Vervangt de regel "N oefenexamens · M vragen". Voor ONA, dat geen oefenexamens heeft:
   * "0 oefenexamens" op een prijskaart is waar en zegt toch het verkeerde.
   */
  metaLine?: string;
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
  initialSelection: ModuleSlug[];
}) {
  const [selected, setSelected] = useState<ModuleSlug[]>(initialSelection);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyable = useMemo(() => modules.filter(m => !m.owned), [modules]);
  const total = priceForSelection(selected);
  const saving = savingForSelection(selected);
  const allSelected = selected.length === modules.length;

  /**
   * Modules grouped by level, preserving the order the server sent.
   *
   * The bundle discount applies per level (`priceForSelection`), so the levels have to be
   * visually separate — a single flat grid of eight would make "bespaar 25% met alle vier"
   * read as a claim about any four, which is not the offer.
   */
  const groups = useMemo(() => {
    const out: { level: Level | null; levelLabel: string; mods: PickerModule[] }[] = [];
    for (const m of modules) {
      // Op het label en niet op `level`: KNM en ONA hebben allebei geen niveau, en op `level`
      // zouden ze samen onder het kopje "KNM" vallen.
      const g = out.find(x => x.levelLabel === m.levelLabel);
      if (g) g.mods.push(m);
      else out.push({ level: m.level, levelLabel: m.levelLabel, mods: [m] });
    }
    return out;
  }, [modules]);

  function toggle(slug: ModuleSlug) {
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
    track('checkout_initiated', { modules: selected.join(','), module_count: selected.length, amount_cents: total });
    try {
      const res = await fetch('/api/checkout-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: selected, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkoutUrl) throw new Error(json.error || 'Betalen is niet gelukt.');
      // /betaling-gelukt polls /api/payment-status with this id, and that is the path that grants
      // the modules and creates the subscription when the webhook has not fired.
      if (json.paymentId) {
        try { localStorage.setItem('io_pending_payment_id', json.paymentId); } catch {}
      }
      // Straight to Mollie. No interstitial: the choice was made on this page.
      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Betalen is niet gelukt.');
      setBusy(false);
    }
  }

  return (
    <div className="g-mp">
      {groups.map(group => {
        /* Het trackmerk benoemt waar je voor betaalt (§G1 regel 5: groot waar je kiest of koopt).
           KNM en ONA hebben geen niveau; hun merk volgt uit het onderdeel. */
        const first = group.mods[0];
        const track: Track = group.level ?? (first?.skill === 'knm' ? 'knm' : 'ona');
        return (
          <section key={group.levelLabel} className="g-mp-group">
            <h2 className="g-mp-gh">
              <ExamMark track={track} size={36} />
              {/* KNM has no level, so "Niveau KNM" would be a category error on screen. */}
              {group.level ? `Niveau ${group.levelLabel}` : group.levelLabel}
            </h2>
            <div className="g-mp-grid" role="group" aria-label={group.levelLabel}>
              {group.mods.map(mod => {
                const on = selected.includes(mod.slug);
                return (
                  /* Een keuzetegel (§G5) als `checkbox`: hier mag je er meer kiezen, dus geen
                     radio. Gekozen = wit + navy ring + navy vinkje; al van jou = gestippeld. */
                  <button
                    key={mod.slug}
                    type="button"
                    role="checkbox"
                    aria-checked={mod.owned || on}
                    aria-disabled={mod.owned || undefined}
                    onClick={() => { if (!mod.owned) toggle(mod.slug); }}
                    className="g-tile"
                  >
                    <CategoryMark category={mod.skill} size={44} />
                    <span className="min-w-0 pe-7">
                      <span className="g-tile-title g-cap">{mod.skill === 'knm' ? 'KNM' : mod.label}</span>
                      <span className="g-tile-sub">
                        {/* The item count is dropped rather than shown as "—" when DUO's format
                            for this level is unverified: the exam count alone is still true. */}
                        {mod.metaLine ?? (
                          <>
                            {mod.examCount} oefenexamens
                            {mod.itemCount !== null && ` · ${mod.itemCount} ${mod.itemNoun}`}
                          </>
                        )}
                      </span>
                      <span className="g-mp-price">
                        {mod.owned
                          ? <em>Je hebt dit al</em>
                          : <>{euro(MODULE_PRICE_CENTS)} <small>p/m</small></>}
                      </span>
                      {mod.hasRubricFeedback && (
                        <span className="g-mp-perk">Onbeperkt nakijken met de criteria van de docent</span>
                      )}
                    </span>
                    <span className="g-tile-tick" aria-hidden>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {buyable.length === modules.length && groups.length === 1 && (
        <div className="g-mp-bundle">
          {/* The list price stays visible beside the discounted one. A saving claim without its
              reference price is the part consumer-protection rules actually object to. Hidden
              once a second level is on sale: the discount is per level. */}
          <span className="g-bdg g-bdg-klei">
            <Sparkles aria-hidden />
            Bespaar {BUNDLE_SAVING_PCT}% met alle vier de onderdelen
          </span>
          <p className="g-mp-bundle-price">
            {euro(BUNDLE_PRICE_CENTS)}{' '}
            <s>{euro(BUNDLE_LIST_PRICE_CENTS)}</s> <small>p/m</small>
          </p>
          <button type="button" onClick={selectAll} className="g-btn g-btn-ghost g-btn-sm">
            {allSelected ? 'Selectie wissen' : 'Selecteer alle vier'}
            {!allSelected && <ArrowRight strokeWidth={2.5} className="rtl-flip" aria-hidden />}
          </button>
        </div>
      )}

      {/* ── Running total: de prijs staat op Nacht (§G1 regel 4) ── */}
      <div className="g-mp-bar" data-empty={selected.length === 0}>
        <div className="min-w-0">
          <p className="g-mp-bar-label">
            {selected.length === 0
              ? 'Nog niets gekozen'
              : `${selected.length} ${selected.length === 1 ? 'onderdeel' : 'onderdelen'} gekozen`}
          </p>
          <p className="g-mp-bar-total">
            {euro(total)} <small>per maand</small>
          </p>
          {saving > 0 && <p className="g-mp-bar-saving">Je bespaart {euro(saving)} per maand</p>}
          {selected.length === 3 && groups.length === 1 && (
            // Three modules cost €29,85 and four cost €29,95 — ten cents more for a whole extra
            // onderdeel. Single-level only: with two levels on sale the quoted saving could be
            // one that no completion of the basket reaches.
            <p className="g-mp-bar-nudge">
              Voor {euro(BUNDLE_PRICE_CENTS - total)} meer krijg je het vierde onderdeel er ook bij.
            </p>
          )}
        </div>

        <div className="g-mp-act">
          <button
            type="button"
            onClick={checkout}
            disabled={selected.length === 0 || busy}
            className="g-btn g-btn-oranje g-btn-lg"
          >
            {busy ? (
              <>
                <Loader2 className="g-spin" aria-hidden /> Bezig…
              </>
            ) : (
              <>
                Doorgaan naar betalen
                <ArrowRight strokeWidth={2.5} className="rtl-flip" aria-hidden />
              </>
            )}
          </button>
          {/* De betaalvertrouwensregel staat direct onder de knop (CLAUDE.md §9). */}
          <p className="g-mp-trust">
            <Lock aria-hidden />
            Betalen gaat via iDEAL of creditcard. Je kunt maandelijks opzeggen.
          </p>
        </div>
      </div>

      {error && (
        <p className="g-mp-error" role="alert">
          <TriangleAlert aria-hidden />
          {error}
        </p>
      )}

      {/* Mollie is explicit that an iDEAL transaction is not itself an authorisation for direct
          debit, so the consent to a recurring collection has to be given here, in our own words,
          before the candidate leaves for the payment screen. */}
      <p className="g-mp-small">
        Je start een maandelijks abonnement van {euro(total || MODULE_PRICE_CENTS)} per maand. Het
        wordt elke maand automatisch verlengd en via SEPA-incasso van je rekening afgeschreven,
        totdat je opzegt. Opzeggen kan elk moment bij <strong>Mijn account</strong>.
      </p>
    </div>
  );
}
