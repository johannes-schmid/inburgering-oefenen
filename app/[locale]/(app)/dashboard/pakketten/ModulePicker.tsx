'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type Ref } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgePercent, Check, ListChecks, Loader2, Lock, Minus, Plus, Sparkles, TriangleAlert, X } from 'lucide-react';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark, { type Track } from '@/components/horizon/ExamMark';
import type { Level, OnaSlug, OnderdeelSlug } from '@/data/skills';
import {
  applyDiscount,
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
import { DISCOUNT_CODE_STORAGE_KEY, findDiscountCode, type DiscountCode } from '@/lib/discount-codes';

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
  /** Wat er in deze module zit, kort, zoals het op de tegel staat. De server bepaalt het. */
  includes: string[];
  /** Already paid for — shown as owned and excluded from the total. */
  owned: boolean;
  /** Van jou en het abonnement verlengt hem. */
  renews: boolean;
  /** Van jou, opgezegd, open tot deze datum (`YYYY-MM-DD`). */
  until: string | null;
};

/** Het lopende abonnement. Zonder abonnement is de kiezer een gewone checkout. */
export type PickerSubscription = {
  periodEnd: string;
  monthlyCents: number;
  /** Alles is opgezegd maar loopt nog; een module aanzetten hervat het abonnement. */
  resuming?: boolean;
};

type Quote = {
  newlyGranted: string[];
  restored: string[];
  removed: string[];
  chargeNowCents: number;
  waived: boolean;
  monthlyAfterCents: number;
  monthlyNowCents: number;
  periodEnd: string;
  cancelsSubscription: boolean;
};

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

/** `2026-12-08` → `8 december`, zonder `new Date()`: dat verschuift de dag in de helft van de tijdzones. */
function day(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return m && d ? `${d} ${MONTHS[m - 1]}` : iso;
}

function moduleName(m: PickerModule): string {
  if (m.skill === 'knm') return 'KNM';
  if (m.skill === 'ona') return 'ONA';
  return `${m.label[0].toUpperCase()}${m.label.slice(1)} ${m.levelLabel}`;
}

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
 *
 * Een kortingscode komt uit `?code=` (de knop op `/welkom-knm`), uit wat de browser eerder
 * onthield (wie via "Gratis beginnen" binnenkwam, heeft geen code in de link), of uit het veld.
 * De server controleert hem opnieuw; hier toont hij alleen wat je gaat betalen.
 */
export default function ModulePicker({
  modules,
  locale,
  initialSelection,
  initialCode,
  subscription,
}: {
  modules: PickerModule[];
  locale: string;
  initialSelection: ModuleSlug[];
  initialCode: string | null;
  subscription: PickerSubscription | null;
}) {
  if (subscription) return <ChangePicker modules={modules} locale={locale} subscription={subscription} initialAdd={initialSelection} />;
  return <CheckoutPicker modules={modules} locale={locale} initialSelection={initialSelection} initialCode={initialCode} />;
}

function CheckoutPicker({
  modules,
  locale,
  initialSelection,
  initialCode,
}: {
  modules: PickerModule[];
  locale: string;
  initialSelection: ModuleSlug[];
  initialCode: string | null;
}) {
  const [selected, setSelected] = useState<ModuleSlug[]>(initialSelection);
  const [discount, setDiscount] = useState<DiscountCode | null>(() => findDiscountCode(initialCode));
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const incRef = useRef<HTMLDialogElement>(null);
  const openIncluded = () => incRef.current?.showModal();

  const buyable = useMemo(() => modules.filter(m => !m.owned), [modules]);
  const listTotal = priceForSelection(selected);
  const total = discount ? applyDiscount(listTotal, discount.pct) : listTotal;
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

  useEffect(() => {
    if (discount) {
      try { localStorage.setItem(DISCOUNT_CODE_STORAGE_KEY, discount.code); } catch {}
      return;
    }
    let remembered: string | null = null;
    try { remembered = localStorage.getItem(DISCOUNT_CODE_STORAGE_KEY); } catch {}
    const found = findDiscountCode(remembered);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage bestaat pas na hydratie
    if (found) setDiscount(found);
  }, [discount]);

  function applyCode(e: FormEvent) {
    e.preventDefault();
    const found = findDiscountCode(codeInput);
    if (!found) {
      setCodeError('Deze kortingscode kennen we niet. Controleer de spelling.');
      return;
    }
    setCodeError(null);
    setCodeInput('');
    setDiscount(found);
  }

  function removeCode() {
    try { localStorage.removeItem(DISCOUNT_CODE_STORAGE_KEY); } catch {}
    setDiscount(null);
  }

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
    track('checkout_initiated', {
      modules: selected.join(','),
      module_count: selected.length,
      amount_cents: total,
      discount_code: discount?.code ?? null,
    });
    try {
      const res = await fetch('/api/checkout-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: selected, locale, code: discount?.code }),
      });
      const json = await res.json();
      if (json.code === 'invalid_code') removeCode();
      // Er loopt intussen een abonnement (een tweede tabblad, of de betaling kwam net binnen):
      // dan is dit een wijziging, en die toont de pagina na herladen.
      if (json.code === 'use_change') { window.location.reload(); return; }
      if (!res.ok || !json.checkoutUrl) throw new Error(json.error || 'Betalen is niet gelukt.');
      // /betaling-gelukt polls /api/payment-status with this id, and that is the path that grants
      // the modules and creates the subscription when the webhook has not fired.
      if (json.paymentId) {
        try { localStorage.setItem('io_pending_payment_id', json.paymentId); } catch {}
      }
      // Straight to Mollie. No interstitial: the choice was made on this page.
      window.location.assign(json.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Betalen is niet gelukt.');
      setBusy(false);
    }
  }

  const picked = selected
    .map(slug => modules.find(m => m.slug === slug))
    .filter((m): m is PickerModule => m !== undefined);

  const consent = (
    /* Mollie is explicit that an iDEAL transaction is not itself an authorisation for direct
       debit, so the consent to a recurring collection has to be given here, in our own words,
       before the candidate leaves for the payment screen. */
    <>
      Je start een maandelijks abonnement van {euro(total || MODULE_PRICE_CENTS)} per maand. Het
      wordt elke maand automatisch verlengd en via SEPA-incasso van je rekening afgeschreven,
      totdat je opzegt. Opzeggen kan elk moment bij <strong>Mijn account</strong>.
    </>
  );

  return (
    <div className="g-mp">
      <div className="g-mp-main">
      <div className="g-mp-allin">
        <p>
          <b>Alles inbegrepen.</b> Elke module heeft alle oefenexamens van het onderdeel, en je
          herhaalt zo vaak je wilt.
        </p>
        <button type="button" onClick={openIncluded} className="g-mp-allin-btn">
          Bekijk alles
          <ArrowRight strokeWidth={2.5} className="rtl-flip" aria-hidden />
        </button>
      </div>
      <div className="g-mp-code">
        {discount ? (
          <p className="g-mp-code-on">
            <BadgePercent aria-hidden />
            <span>
              <b>{discount.code}</b> is toegepast: {discount.pct}% korting op je abonnement, elke maand.
            </span>
            <button type="button" onClick={removeCode} className="g-mp-code-x">Verwijderen</button>
          </p>
        ) : (
          <form onSubmit={applyCode} className="g-mp-code-form">
            <label htmlFor="g-mp-code-in">Heb je een kortingscode?</label>
            <span className="g-mp-code-row">
              <input
                id="g-mp-code-in"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value); setCodeError(null); }}
                className="g-mp-code-in"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={codeError ? true : undefined}
                aria-describedby={codeError ? 'g-mp-code-err' : undefined}
              />
              <button type="submit" className="g-btn g-btn-ghost g-btn-sm" disabled={!codeInput.trim()}>
                Toepassen
              </button>
            </span>
          </form>
        )}
        {codeError && (
          <p id="g-mp-code-err" className="g-mp-error" role="alert">
            <TriangleAlert aria-hidden />
            {codeError}
          </p>
        )}
      </div>

      {groups.map(group => {
        /* Het trackmerk benoemt waar je voor betaalt (§G1 regel 5: groot waar je kiest of koopt).
           KNM en ONA hebben geen niveau; hun merk volgt uit het onderdeel. */
        const track: Track | null = group.level;
        return (
          <section key={group.levelLabel} className="g-mp-group">
            <h2 className="g-mp-gh">
              {/* KNM en ONA staan samen onder "Andere modules": geen niveau, geen bundel. Elke tegel
                  draagt zijn eigen merk, dus de kop heeft er geen. */}
              {track && <ExamMark track={track} size={36} />}
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
                      <span className="g-mp-inc">
                        {mod.includes.map(line => (
                          <span key={line}><Check aria-hidden strokeWidth={2.75} />{line}</span>
                        ))}
                      </span>
                      <span className="g-mp-price">
                        {mod.owned
                          ? <em>{mod.until ? `Open tot ${day(mod.until)}` : 'Je hebt dit al'}</em>
                          : <>{euro(MODULE_PRICE_CENTS)} <small>p/m</small></>}
                      </span>
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

      <p className="g-mp-small g-mp-small-main">{consent}</p>
      </div>

      {/* ── Running total: de prijs staat op Nacht (§G1 regel 4). Op desktop een vaste kolom
          naast de keuze, op mobiel een balk onderaan. ── */}
      <aside className="g-mp-bar" data-empty={selected.length === 0} aria-label="Jouw keuze">
        <div className="g-mp-sum min-w-0">
          <p className="g-mp-bar-label">
            {selected.length === 0
              ? 'Nog niets gekozen'
              : `${selected.length} ${selected.length === 1 ? 'onderdeel' : 'onderdelen'} gekozen`}
          </p>
          {picked.length > 0 && (
            <ul className="g-mp-lines">
              {picked.map(m => (
                <li key={m.slug}>
                  <span className="g-cap">
                    {m.skill === 'knm' ? 'KNM' : m.skill === 'ona' ? 'ONA' : `${m.label} ${m.levelLabel}`}
                  </span>
                  <span>{euro(MODULE_PRICE_CENTS)}</span>
                </li>
              ))}
              {discount && (
                <li className="g-mp-line-discount">
                  <span>Korting {discount.code}</span>
                  <span>−{euro(listTotal - total)}</span>
                </li>
              )}
            </ul>
          )}
          <button type="button" onClick={openIncluded} className="g-mp-side-link">
            <ListChecks aria-hidden />
            Wat zit er in elke module?
          </button>
          <p className="g-mp-bar-total">
            {discount && listTotal > 0 && <s>{euro(listTotal)}</s>}
            {euro(total)} <small>per maand</small>
          </p>
          {discount && listTotal > 0 && (
            <p className="g-mp-bar-saving">Met {discount.code}: {discount.pct}% korting, elke maand</p>
          )}
          {saving > 0 && <p className="g-mp-bar-saving">Je bespaart {euro(saving)} per maand</p>}
          {selected.length === 3 && groups.length === 1 && (
            // Three modules cost €29,85 and four cost €29,95 — ten cents more for a whole extra
            // onderdeel. Single-level only: with two levels on sale the quoted saving could be
            // one that no completion of the basket reaches.
            <p className="g-mp-bar-nudge">
              Voor {euro(BUNDLE_PRICE_CENTS - listTotal)} meer krijg je het vierde onderdeel er ook bij.
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
          {error && (
            <p className="g-mp-error" role="alert">
              <TriangleAlert aria-hidden />
              {error}
            </p>
          )}
          <p className="g-mp-small g-mp-small-side">{consent}</p>
        </div>
      </aside>

      <IncludedDialog ref={incRef} modules={modules} />
    </div>
  );
}

/**
 * Een lopend abonnement aanpassen (co-terming, 08-11).
 *
 * Elke tegel is een schakelaar voor "verlengt na de wijziging". Wat je aanzet gaat meteen open en
 * kost nu het resterende deel van de periode; wat je uitzet blijft open tot de verlengdatum. Het
 * bedrag komt van `/api/change-modules` (preview), zodat wat hier staat is wat Mollie vraagt — de
 * kiezer rekent zelf niets uit.
 *
 * Bevestigen gaat via een dialoog: er wordt geld afgeschreven zonder dat de kandidaat langs een
 * betaalscherm gaat, en dat hoort een eigen, expliciete stap te zijn.
 */
function ChangePicker({
  modules,
  locale,
  subscription,
  initialAdd,
}: {
  modules: PickerModule[];
  locale: string;
  subscription: PickerSubscription;
  initialAdd: ModuleSlug[];
}) {
  const router = useRouter();
  const renewing = useMemo(() => modules.filter(m => m.renews).map(m => m.slug), [modules]);
  const [wanted, setWanted] = useState<ModuleSlug[]>(() => [...new Set([...renewing, ...initialAdd])]);
  /* De offerte hoort bij één selectie. Klikt iemand verder voordat hij binnen is, dan is hij voor
     een andere selectie en telt hij niet: zo staat er nooit een bedrag naast de verkeerde tegels. */
  const [result, setResult] = useState<{ key: string; quote: Quote | null; error: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const incRef = useRef<HTMLDialogElement>(null);

  const add = wanted.filter(s => !renewing.includes(s));
  const remove = renewing.filter(s => !wanted.includes(s));
  const changed = add.length > 0 || remove.length > 0;
  const addKey = add.join(',');
  const removeKey = remove.join(',');
  const key = `${addKey}|${removeKey}`;
  const current = result?.key === key ? result : null;
  const quote = current?.quote ?? null;
  const loading = changed && current === null;
  const quoteError = current?.error ?? null;

  useEffect(() => {
    if (!addKey && !removeKey) return;
    const ctrl = new AbortController();
    const forKey = `${addKey}|${removeKey}`;
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/change-modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ add: addKey ? addKey.split(',') : [], remove: removeKey ? removeKey.split(',') : [], locale, confirm: false }),
          signal: ctrl.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.code === 'no_subscription' ? 'reload' : 'Het bedrag kon niet worden berekend.');
        setResult({ key: forKey, quote: json.quote as Quote, error: null });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        if (err instanceof Error && err.message === 'reload') { window.location.reload(); return; }
        setResult({ key: forKey, quote: null, error: err instanceof Error ? err.message : 'Het bedrag kon niet worden berekend.' });
      }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [addKey, removeKey, locale]);

  const groups = useMemo(() => {
    const out: { level: Level | null; levelLabel: string; mods: PickerModule[] }[] = [];
    for (const m of modules) {
      const g = out.find(x => x.levelLabel === m.levelLabel);
      if (g) g.mods.push(m);
      else out.push({ level: m.level, levelLabel: m.levelLabel, mods: [m] });
    }
    return out;
  }, [modules]);

  function toggle(slug: ModuleSlug) {
    setError(null);
    setDone(false);
    setWanted(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/change-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add, remove, locale, confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.code === 'charge_failed'
          ? 'De afschrijving is geweigerd. Er is niets veranderd. Probeer het later opnieuw of neem contact met ons op.'
          : 'Je wijziging is niet gelukt. Er is niets veranderd.');
      }
      if (json.mode === 'checkout' && json.checkoutUrl) {
        try { localStorage.setItem('io_pending_payment_id', json.paymentId); } catch {}
        window.location.assign(json.checkoutUrl);
        return;
      }
      // De kiezer blijft staan en haalt alleen de nieuwe stand op. De melding is component-state en
      // geen URL-parameter: die liet elke ?gewijzigd=… een verwerkte wijziging melden. En `busy` gaat
      // hier zelf terug, anders bleef de knop na de eerste wijziging grijs tot iemand herlaadde.
      confirmRef.current?.close();
      setDone(true);
      setBusy(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Je wijziging is niet gelukt.');
      setBusy(false);
    }
  }

  const byslug = (s: string) => modules.find(m => m.slug === s);
  const added = add.map(byslug).filter((m): m is PickerModule => m !== undefined);
  const removed = remove.map(byslug).filter((m): m is PickerModule => m !== undefined);
  const end = day(subscription.periodEnd);
  const ready = changed && quote !== null && !loading;

  function tileState(mod: PickerModule, on: boolean): { text: string; tone?: 'stop' } {
    if (mod.renews) return on ? { text: 'Verlengt elke maand' } : { text: `Stopt, open tot ${end}`, tone: 'stop' };
    if (mod.until) return on ? { text: 'Verlengt weer' } : { text: `Open tot ${day(mod.until)}` };
    return { text: '' };
  }

  return (
    <div className="g-mp">
      <div className="g-mp-main">
        {done && (
          <p className="g-notice" role="status">
            <Check aria-hidden />
            <span>Je wijziging is verwerkt. Je krijgt een bevestiging per e-mail.</span>
          </p>
        )}
        <div className="g-mp-allin">
          <p>
            <b>Zet onderdelen aan of uit.</b> Wat je aanzet, staat meteen open. Wat je uitzet, blijft
            open tot {end}. Daarna betaal je één bedrag per maand.
          </p>
          <button type="button" onClick={() => incRef.current?.showModal()} className="g-mp-allin-btn">
            Bekijk alles
            <ArrowRight strokeWidth={2.5} className="rtl-flip" aria-hidden />
          </button>
        </div>

        {groups.map(group => (
          <section key={group.levelLabel} className="g-mp-group">
            <h2 className="g-mp-gh">
              {group.level && <ExamMark track={group.level} size={36} />}
              {group.level ? `Niveau ${group.levelLabel}` : group.levelLabel}
            </h2>
            <div className="g-mp-grid" role="group" aria-label={group.levelLabel}>
              {group.mods.map(mod => {
                const on = wanted.includes(mod.slug);
                const state = tileState(mod, on);
                return (
                  <button
                    key={mod.slug}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(mod.slug)}
                    className="g-tile"
                    data-stop={state.tone === 'stop' || undefined}
                  >
                    <CategoryMark category={mod.skill} size={44} />
                    <span className="min-w-0 pe-7">
                      <span className="g-tile-title g-cap">{mod.skill === 'knm' ? 'KNM' : mod.label}</span>
                      <span className="g-mp-inc">
                        {mod.includes.map(line => (
                          <span key={line}><Check aria-hidden strokeWidth={2.75} />{line}</span>
                        ))}
                      </span>
                      <span className="g-mp-price">
                        {state.text
                          ? <em className={state.tone === 'stop' ? 'g-mp-stop' : undefined}>{state.text}</em>
                          : <>{euro(MODULE_PRICE_CENTS)} <small>p/m</small></>}
                      </span>
                    </span>
                    <span className="g-tile-tick" aria-hidden>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className="g-mp-bar" data-empty={!changed} data-idle={!changed || undefined} aria-label="Jouw abonnement" aria-live="polite">
        <div className="g-mp-sum min-w-0">
          <p className="g-mp-bar-label">{changed ? 'Jouw wijziging' : subscription.resuming ? 'Opgezegd' : 'Je abonnement'}</p>
          {changed && (
            <ul className="g-mp-lines g-mp-lines-always">
              {added.map(m => (
                <li key={m.slug}>
                  <span className="g-mp-delta"><Plus aria-hidden />{moduleName(m)}</span>
                  <span>{m.until ? 'verlengt weer' : 'nu open'}</span>
                </li>
              ))}
              {removed.map(m => (
                <li key={m.slug}>
                  <span className="g-mp-delta"><Minus aria-hidden />{moduleName(m)}</span>
                  <span>open tot {end}</span>
                </li>
              ))}
            </ul>
          )}

          {!changed && subscription.resuming ? (
            <p className="g-mp-bar-nudge">Er wordt niets meer afgeschreven. Je onderdelen lopen tot {end}.</p>
          ) : !changed ? (
            <>
              <p className="g-mp-bar-total">{euro(subscription.monthlyCents)} <small>per maand</small></p>
              <p className="g-mp-bar-nudge">Volgende betaling op {end}.</p>
            </>
          ) : (
            <dl className="g-mp-quote" data-loading={loading || undefined}>
              <div>
                <dt>Nu betalen</dt>
                <dd>{quote ? euro(quote.chargeNowCents) : '—'}</dd>
              </div>
              <div>
                <dt>Vanaf {end}</dt>
                <dd>{quote ? (quote.cancelsSubscription ? 'niets meer' : <>{euro(quote.monthlyAfterCents)} <small>p/m</small></>) : '—'}</dd>
              </div>
              {quote?.waived && <p className="g-mp-bar-nudge">De paar dagen tot {end} krijg je erbij.</p>}
              {quote && quote.chargeNowCents > 0 && (
                <p className="g-mp-bar-nudge">Alleen de dagen tot {end}. Daarna één bedrag per maand.</p>
              )}
            </dl>
          )}
        </div>

        <div className="g-mp-act">
          <button
            type="button"
            onClick={() => confirmRef.current?.showModal()}
            disabled={!ready || busy}
            className="g-btn g-btn-oranje g-btn-lg"
          >
            {loading ? (<><Loader2 className="g-spin" aria-hidden /> Bedrag berekenen…</>) : (
              <>
                Wijziging bekijken
                <ArrowRight strokeWidth={2.5} className="rtl-flip" aria-hidden />
              </>
            )}
          </button>
          <p className="g-mp-trust">
            <Lock aria-hidden />
            Je kunt elk onderdeel apart opzeggen. Opzeggen kost niets.
          </p>
          {(error ?? quoteError) && (
            <p className="g-mp-error" role="alert">
              <TriangleAlert aria-hidden />
              {error ?? quoteError}
            </p>
          )}
        </div>
      </aside>

      <dialog
        ref={confirmRef}
        className="g-inc g-cf"
        aria-labelledby="g-cf-title"
        onClick={e => { if (e.target === e.currentTarget && !busy) e.currentTarget.close(); }}
      >
        {quote && (
          <div className="g-inc-in">
            <header className="g-inc-head">
              <div>
                <h2 id="g-cf-title">Klopt dit?</h2>
                <p>Controleer je wijziging. Pas als je bevestigt, verandert er iets.</p>
              </div>
              <form method="dialog">
                <button type="submit" className="g-inc-x" aria-label="Sluiten" disabled={busy}>
                  <X aria-hidden />
                </button>
              </form>
            </header>

            <dl className="g-cf-rows">
              {added.filter(m => !quote.restored.includes(m.slug)).length > 0 && (
                <div>
                  <dt>Erbij, staat meteen open</dt>
                  <dd>{added.filter(m => !quote.restored.includes(m.slug)).map(moduleName).join(', ')}</dd>
                </div>
              )}
              {added.filter(m => quote.restored.includes(m.slug)).length > 0 && (
                <div>
                  <dt>Verlengt weer</dt>
                  <dd>{added.filter(m => quote.restored.includes(m.slug)).map(moduleName).join(', ')}</dd>
                </div>
              )}
              {removed.length > 0 && (
                <div>
                  <dt>Opgezegd</dt>
                  <dd>{removed.map(moduleName).join(', ')}, open tot en met {end}</dd>
                </div>
              )}
              <div>
                <dt>Nu betalen</dt>
                <dd className="g-cf-num">{euro(quote.chargeNowCents)}</dd>
              </div>
              <div>
                <dt>Vanaf {end} per maand</dt>
                <dd className="g-cf-num">{quote.cancelsSubscription ? 'niets meer' : euro(quote.monthlyAfterCents)}</dd>
              </div>
            </dl>

            {/* Toestemming voor de incasso in onze eigen woorden, vóór er iets wordt afgeschreven —
                dezelfde reden als de toestemmingsregel in de checkout. */}
            <p className="g-cf-consent">
              {quote.chargeNowCents > 0
                ? <>We schrijven nu {euro(quote.chargeNowCents)} af op dezelfde manier als je maandbedrag. Kan dat niet, dan betaal je het via iDEAL. </>
                : <>Je betaalt nu niets. </>}
              {quote.cancelsSubscription
                ? <>Na {end} schrijven we niets meer af.</>
                : <>Vanaf {end} wordt elke maand {euro(quote.monthlyAfterCents)} afgeschreven, totdat je opzegt.</>}
            </p>

            {error && (
              <p className="g-mp-error" role="alert">
                <TriangleAlert aria-hidden />
                {error}
              </p>
            )}

            <div className="g-cf-act">
              <form method="dialog">
                <button type="submit" className="g-btn g-btn-ghost" disabled={busy}>Terug</button>
              </form>
              <button type="button" onClick={confirm} disabled={busy} className="g-btn g-btn-oranje">
                {busy
                  ? (<><Loader2 className="g-spin" aria-hidden /> Bezig…</>)
                  : quote.chargeNowCents > 0 ? `Bevestigen en ${euro(quote.chargeNowCents)} betalen` : 'Bevestigen'}
              </button>
            </div>
          </div>
        )}
      </dialog>

      <IncludedDialog ref={incRef} modules={modules} />
    </div>
  );
}

/**
 * Alles wat een module bevat, in één overzicht. Een native `<dialog>`: Esc, focusval en de
 * achtergrond horen er gratis bij. KNM en ONA staan er alleen in als ze hier te koop zijn.
 */
function IncludedDialog({ ref, modules }: { ref: Ref<HTMLDialogElement>; modules: PickerModule[] }) {
  const knm = modules.find(m => m.skill === 'knm');
  const ona = modules.find(m => m.skill === 'ona');
  const hasA2 = modules.some(m => m.level === 'a2');

  const sections: { title: string; lines: string[]; note?: string }[] = [
    {
      title: 'In elke taalmodule',
      lines: [
        'Alle 10 oefenexamens van het onderdeel',
        'Alle opgaven nagekeken door een NT2-docent',
        'Onbeperkt herhalen',
        'Score per onderdeel en per vraagtype',
        'Studiedashboard met je voortgang',
      ],
    },
    {
      title: 'Lezen en Luisteren',
      lines: ['Uitleg bij elke vraag', 'Luisterfragmenten met twee stemmen'],
    },
    {
      title: 'Schrijven en Spreken',
      lines: [
        'Onbeperkt nakijken op de criteria van de docent',
        'Feedback per criterium, met het voorbeeldantwoord ernaast',
      ],
      note: 'Een model past de criteria van de docent toe. De score is oefenfeedback, geen uitslag van DUO.',
    },
    ...(hasA2
      ? [{ title: 'Op niveau A2 ook', lines: ['Lessen bij het onderdeel', 'Woordenlijst met vertaling en audio'] }]
      : []),
    ...(knm ? [{ title: 'KNM', lines: knm.includes }] : []),
    ...(ona ? [{ title: 'ONA', lines: ona.includes }] : []),
  ];

  return (
    <dialog
      ref={ref}
      className="g-inc"
      aria-labelledby="g-inc-title"
      onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
    >
      <div className="g-inc-in">
        <header className="g-inc-head">
          <div>
            <span className="g-mono">Alles inbegrepen</span>
            <h2 id="g-inc-title">Wat je krijgt bij elke module</h2>
            <p>
              Eén module is één onderdeel, voor {euro(MODULE_PRICE_CENTS)} per maand. Alles hieronder
              zit erin, zonder extra kosten.
            </p>
          </div>
          <form method="dialog">
            <button type="submit" className="g-inc-x" aria-label="Sluiten">
              <X aria-hidden />
            </button>
          </form>
        </header>

        <div className="g-inc-grid">
          {sections.map(sec => (
            <section key={sec.title} className="g-inc-sec">
              <h3>{sec.title}</h3>
              <ul>
                {sec.lines.map(line => (
                  <li key={line}><Check aria-hidden strokeWidth={2.75} />{line}</li>
                ))}
              </ul>
              {sec.note && <p className="g-inc-note">{sec.note}</p>}
            </section>
          ))}
        </div>

        <footer className="g-inc-foot">
          <span>
            <Sparkles aria-hidden />
            Alle vier van één niveau: {euro(BUNDLE_PRICE_CENTS)} <s>{euro(BUNDLE_LIST_PRICE_CENTS)}</s> p/m
          </span>
          <span>
            <Lock aria-hidden />
            Maandelijks opzegbaar · iDEAL of creditcard
          </span>
        </footer>
      </div>
    </dialog>
  );
}
