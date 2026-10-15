'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Clock, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import GlasSwitch from '@/components/glas/Switch';
import PayBadges from '../_components/glas/PayBadges';
import type { Level, SkillSlug } from '@/data/skills';
import {
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  MODULE_PRICE_CENTS,
  euro,
  priceForSelection,
  savingForSelection,
  type ModuleSlug,
} from '@/lib/pricing';

export type BuilderModule = {
  slug: ModuleSlug;
  skill: SkillSlug;
  name: string;
  meta: string;
  /** Onwaar waar het onderdeel op dit niveau nog geen inhoud heeft (B1 Luisteren). */
  available: boolean;
};

export type BuilderLevel = {
  level: Level;
  title: string;
  sub: string;
  modules: BuilderModule[];
};

export type BuilderAddOn = {
  slug: ModuleSlug;
  track: 'knm' | 'ona';
  title: string;
  meta: string;
  /** Een regel onder de meta, bijv. dat de docent ONA nog nakijkt. */
  note?: string;
};

/**
 * De configurator van /premium: kies per niveau de onderdelen, zet KNM of ONA erbij, en zie wat
 * het kost. Elke prijs hier komt uit `priceForSelection` — dezelfde functie die de checkout
 * server-side opnieuw draait, dus de bundelkorting verschijnt pas waar hij echt geldt.
 *
 * Betalen gebeurt hier niet. De knop stuurt naar `/register` met als `next` het pakkettenscherm
 * in het portaal, met de keuze in `?kies=`; daar staat dezelfde keuze al aangevinkt.
 */
export default function PlanBuilder({
  locale,
  levels,
  addOns,
  free,
}: {
  locale: string;
  levels: BuilderLevel[];
  addOns: BuilderAddOn[];
  free: { examCount: number; graded: number };
}) {
  const t = useTranslations('premium_page');
  const [selected, setSelected] = useState<ModuleSlug[]>([]);

  const total = priceForSelection(selected);
  const saving = savingForSelection(selected);

  const names = useMemo(() => {
    const out = new Map<ModuleSlug, string>();
    for (const l of levels) for (const m of l.modules) out.set(m.slug, `${l.title} ${m.name}`);
    for (const a of addOns) out.set(a.slug, a.title);
    return out;
  }, [levels, addOns]);

  const toggle = (slug: ModuleSlug) =>
    setSelected(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));

  const next = `/${locale}/dashboard/pakketten${selected.length ? `?kies=${selected.join(',')}` : ''}`;

  return (
    <div className="g-pb">
      <div className="g-pb-plans">
        {/* ── Gratis ── */}
        <article className="g-pb-card g-pb-free">
          <header className="g-pb-head">
            <h3>{t('free_title')}</h3>
            <p>{t('free_sub')}</p>
          </header>
          <div className="g-pb-price">
            <span className="g-pb-amt g-tnum">€0</span>
            <span className="g-pb-unit">{t('free_price_note')}</span>
          </div>
          <Link href="/register" className="g-btn g-btn-ghost w-full">
            {t('free_cta')}
          </Link>
          <ul className="g-pb-list">
            {[
              t('free_f1', { count: free.examCount }),
              t('free_f2'),
              t('free_f3', { n: free.graded }),
              t('free_f4'),
            ].map(f => (
              <li key={f}><Check aria-hidden="true" /><span>{f}</span></li>
            ))}
          </ul>
          <Link href="/oefenen" className="g-tlink text-sm self-start mt-auto">
            {t('free_link')}
            <ArrowRight className="rtl-flip size-4" aria-hidden="true" />
          </Link>
        </article>

        {/* ── Eén kaart per niveau ── */}
        {levels.map(lvl => {
          const inLevel = selected.filter(s => lvl.modules.some(m => m.slug === s));
          const buyable = lvl.modules.filter(m => m.available);
          const bundleReachable = buyable.length === lvl.modules.length;
          const allOn = buyable.length > 0 && buyable.every(m => selected.includes(m.slug));
          const levelTotal = priceForSelection(inLevel);
          const levelSaving = savingForSelection(inLevel);
          const featured = bundleReachable;

          const setAll = () =>
            setSelected(prev =>
              allOn
                ? prev.filter(s => !buyable.some(m => m.slug === s))
                : [...new Set([...prev, ...buyable.map(m => m.slug)])],
            );

          return (
            <article key={lvl.level} className="g-pb-card" data-featured={featured || undefined} data-active={inLevel.length > 0 || undefined}>
              {featured && (
                <p className="g-pb-band">
                  <span>{t('level_band', { bundle: euro(BUNDLE_PRICE_CENTS) })}</span>
                  <s className="g-tnum">{euro(BUNDLE_LIST_PRICE_CENTS)}</s>
                </p>
              )}
              <header className="g-pb-head">
                <h3>
                  <ExamMark track={lvl.level} size={34} />
                  {lvl.title}
                </h3>
                <p>{lvl.sub}</p>
              </header>

              <div className="g-pb-price" aria-live="polite">
                <span className="g-pb-amt g-tnum">{euro(inLevel.length ? levelTotal : MODULE_PRICE_CENTS)}</span>
                <span className="g-pb-unit">
                  {inLevel.length ? t('level_total_note', { count: inLevel.length }) : t('level_from')}
                </span>
              </div>

              <button type="button" onClick={setAll} disabled={buyable.length === 0} className={`g-btn w-full ${featured && !allOn ? 'g-btn-navy' : 'g-btn-ghost'}`}>
                {allOn
                  ? t('level_all_clear')
                  : bundleReachable
                    ? t('level_all_btn', { bundle: euro(BUNDLE_PRICE_CENTS) })
                    : t('level_some_btn', { count: buyable.length })}
              </button>

              <div className="g-pb-rows" role="group" aria-label={lvl.title}>
                {lvl.modules.map(m => {
                  const on = selected.includes(m.slug);
                  return (
                    <button
                      key={m.slug}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-disabled={!m.available || undefined}
                      onClick={() => { if (m.available) toggle(m.slug); }}
                      className="g-pb-row"
                    >
                      <span className="g-pb-box" aria-hidden="true"><Check strokeWidth={3} /></span>
                      <CategoryMark category={m.skill} size={30} />
                      <span className="g-pb-row-t">
                        <b>{m.name}</b>
                        <small>{m.available ? m.meta : t('row_unavailable')}</small>
                      </span>
                      <span className="g-pb-row-p g-tnum">
                        {m.available ? euro(MODULE_PRICE_CENTS) : <Clock aria-hidden="true" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="g-pb-foot" data-tone={levelSaving > 0 ? 'win' : undefined}>
                {levelSaving > 0
                  ? t('level_bundle_on', { saving: euro(levelSaving) })
                  : bundleReachable && inLevel.length === buyable.length - 1
                    ? t('level_nudge', { diff: euro(BUNDLE_PRICE_CENTS - levelTotal) })
                    : bundleReachable
                      ? t('level_bundle_hint')
                      : t('level_no_bundle')}
              </p>
            </article>
          );
        })}
      </div>

      {/* ── Los erbij: KNM en ONA, buiten de niveaubundels ── */}
      <section className="g-pb-addons" aria-labelledby="pb-addons-h">
        <div className="g-pb-addons-head">
          <h3 id="pb-addons-h">{t('addons_title')}</h3>
          <p>{t('addons_sub')}</p>
        </div>
        <div className="g-pb-addons-grid">
          {addOns.map(a => {
            const on = selected.includes(a.slug);
            const id = `pb-addon-${a.track}`;
            return (
              <div key={a.slug} className="g-pb-addon" data-on={on || undefined}>
                <ExamMark track={a.track} size={40} />
                <div className="g-pb-addon-t">
                  <b id={id}>{a.title}</b>
                  <small>{a.meta}</small>
                  {a.note && <em>{a.note}</em>}
                </div>
                <span className="g-pb-addon-p g-tnum">
                  {euro(MODULE_PRICE_CENTS)}<small>{t('per_month_short')}</small>
                </span>
                <GlasSwitch checked={on} onClick={() => toggle(a.slug)} aria-labelledby={id} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Het totaal, op Nacht (§G1 regel 4) ── */}
      <div className="g-pb-bar g-on-dark" data-empty={selected.length === 0 || undefined}>
        <div className="g-pb-bar-sum" aria-live="polite">
          <span className="g-pb-bar-label">
            {selected.length === 0 ? t('bar_empty') : t('bar_count', { count: selected.length })}
          </span>
          <span className="g-pb-bar-total g-tnum">
            {euro(total)} <small>{t('bar_per_month')}</small>
          </span>
          {saving > 0 && <span className="g-pb-bar-save">{t('bar_saving', { saving: euro(saving) })}</span>}
        </div>

        {selected.length > 0 ? (
          <ul className="g-pb-chips" aria-label={t('bar_chosen')}>
            {selected.map(s => (
              <li key={s}>
                <button type="button" onClick={() => toggle(s)} aria-label={t('bar_remove', { name: names.get(s) ?? s })}>
                  {names.get(s)}
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="g-pb-bar-hint">{t('bar_hint')}</p>
        )}

        <div className="g-pb-bar-act">
          {selected.length > 0 ? (
            <Link href={{ pathname: '/register', query: { next } }} className="g-btn g-btn-oranje g-btn-lg">
              {t('bar_cta')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" disabled className="g-btn g-btn-lg">
              {t('bar_cta')}
            </button>
          )}
          <PayBadges label={t('bar_steps')} />
        </div>
      </div>
    </div>
  );
}
