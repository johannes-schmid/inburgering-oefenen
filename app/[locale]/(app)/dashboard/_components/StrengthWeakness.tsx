import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import type { Concept, Mastery } from '@/lib/lessons/lessons';
import { isMastered } from '@/lib/lessons/lessons';

export type SwRow = {
  concept: Concept;
  mastery: Mastery | null;
  /** De les die dit concept uitlegt, als die er is — pad zonder localeprefix. */
  lessonHref: string | null;
};

/**
 * Sterk & zwak, per concept.
 *
 * Vier vakjes in plaats van een balk, en dat is een keuze: een balk van 31% leest als een
 * meting op de procent nauwkeurig, terwijl dit getal uit een handvol antwoorden komt. Vier
 * stappen zeggen wat het is — een indruk, geen meetlat.
 *
 * **Nul vakjes en "geen data" zijn niet hetzelfde als zwak.** Een concept waar de kandidaat
 * nog geen opgave over heeft gemaakt krijgt lege vakjes en het woord erbij; het kleurt niet
 * oranje, want "nog niet gedaan" als zwakte tonen maakt van de hele cursus een tekortkoming.
 * Zelfde regel als het streepje in `ReadinessRing`.
 */
export default async function StrengthWeakness({
  locale,
  rows,
}: {
  locale: string;
  rows: SwRow[];
}) {
  const t = await getTranslations('portal');

  const weakest = rows
    .filter(r => r.mastery && r.mastery.seen > 0 && !isMastered(r.mastery) && r.mastery.mastery_pct < 60)
    .sort((a, b) => a.mastery!.mastery_pct - b.mastery!.mastery_pct)[0];

  return (
    <section className="panel">
      <h2 className="mini-head">{t('sw_head')}</h2>

      {rows.length === 0 ? (
        <p className="text-[0.82rem] text-on-surface-variant" style={{ lineHeight: 1.6 }}>{t('sw_empty')}</p>
      ) : (
        <>
          <ul className="sw">
            {rows.map(({ concept, mastery }) => {
              const known = mastery !== null && mastery.seen > 0;
              const pct = known ? mastery.mastery_pct : null;
              const weak = pct !== null && pct < 60;
              const filled = pct === null ? 0 : Math.max(1, Math.round(pct / 25));
              return (
                <li key={concept.id}>
                  <span className="nm">{concept.name_nl}</span>
                  <span className="cells" aria-hidden>
                    {[0, 1, 2, 3].map(i => (
                      <i key={i} className={i < filled ? (weak ? 'w' : 'f') : ''} />
                    ))}
                  </span>
                  <span className={`val${weak ? ' weak' : ''}`}>
                    {pct === null ? t('sw_nodata') : `${pct}%`}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="legend">
            <span><i className="w" />{t('sw_legend_weak')}</span>
            <span><i className="f" />{t('sw_legend_strong')}</span>
            <span><i />{t('sw_legend_nodata')}</span>
          </p>

          {weakest?.lessonHref && (
            <a href={`/${locale}${weakest.lessonHref}`} className="sw-cta">
              {t('sw_to_lesson', { name: weakest.concept.name_nl })}
              <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" />
            </a>
          )}
        </>
      )}

      <style>{`
        .sw { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:9px; }
        .sw li { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:12px; }
        .sw .nm { font-size:0.8rem; color:var(--color-on-surface); min-width:0; }
        .sw .cells { display:flex; gap:3px; }
        .sw .cells i { width:15px; height:15px; border-radius:4px; background:var(--color-surface-container-high); }
        .sw .cells i.f { background:var(--color-primary-container); }
        .sw .cells i.w { background:var(--color-secondary-container); }
        .sw .val { font-size:0.72rem; font-weight:700; color:var(--color-on-surface-variant); min-width:56px; text-align:end; font-variant-numeric:tabular-nums; }
        .sw .val.weak { color:var(--color-secondary); }
        .legend { display:flex; flex-wrap:wrap; gap:14px; margin-top:14px; font-size:0.68rem; color:var(--color-on-surface-variant); }
        .legend i { display:inline-block; width:9px; height:9px; border-radius:3px; margin-inline-end:5px; background:var(--color-surface-container-high); }
        .legend i.f { background:var(--color-primary-container); }
        .legend i.w { background:var(--color-secondary-container); }
        .sw-cta { display:inline-flex; align-items:center; gap:7px; margin-top:14px; border-radius:999px; padding:6px 12px; font-size:0.72rem; font-weight:800; text-decoration:none; background:#fcecdd; color:var(--color-secondary); }
        .sw-cta:hover { text-decoration:underline; }
      `}</style>
    </section>
  );
}
