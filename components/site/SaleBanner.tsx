'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { glasButton } from '@/components/glas/Button';
import { BLACK_FRIDAY } from '@/lib/black-friday';
import { saleTimeLeft, type TimeLeft } from '@/lib/sale';
import { useSaleOffer } from '@/lib/use-sale-offer';

export const SALE_DISMISS_KEY = 'io_sale_bf_dismissed';

/**
 * Zet `data-sale` op `<html>` vóór de eerste paint, zodat de ruimte voor de balk er al is en de
 * pagina niet verspringt. Alleen voor wie geen sessie heeft (de meeste bezoekers van de publieke
 * site); of een ingelogd account in aanmerking komt, weet pas `useSaleOffer`.
 */
export const SALE_PREPAINT_SCRIPT = `(function(){try{var n=Date.now();if(n<${Date.parse(BLACK_FRIDAY.startsAt)}||n>=${Date.parse(BLACK_FRIDAY.endsAt)})return;if(/(?:^|;\\s*)sb-[^=]*-auth-token/.test(document.cookie))return;if(sessionStorage.getItem('${SALE_DISMISS_KEY}')==='1')return;document.documentElement.setAttribute('data-sale','')}catch(e){}})();`;

/** De klok, elke seconde; `null` als de actie voorbij is of nog niet vaststaat. */
export function useSaleClock(enabled: boolean): TimeLeft | null {
  const [left, setLeft] = useState<TimeLeft | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setLeft(saleTimeLeft());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return left;
}

/** Dagen, uren, minuten, seconden in vier tegels. */
export function SaleClock({ left, className = '' }: { left: TimeLeft; className?: string }) {
  const t = useTranslations('sale');
  const units: [number, string][] = [
    [left.days, t('unit_d')],
    [left.hours, t('unit_h')],
    [left.minutes, t('unit_m')],
    [left.seconds, t('unit_s')],
  ];
  return (
    <span className={`g-salebar-units ${className}`} role="timer" aria-live="off">
      {units.map(([n, u]) => (
        <span key={u} className="g-salebar-unit">
          <b>{String(n).padStart(2, '0')}</b>
          <small>{u}</small>
        </span>
      ))}
    </span>
  );
}

/**
 * De Black Friday-balk: zwart, bovenaan, boven de menu's (keuze eigenaar), op de publieke site én
 * in het portaal. `html[data-sale]` reserveert de hoogte (`--sale-h`) en schuift nav, zijbalk en
 * kop omlaag; zie `glas-components.css`. Niet in de examenspeler en niet op `/betaling-gelukt`.
 *
 * Alleen voor wie niets open heeft (`useSaleOffer`); wegklikken onthoudt de browser per sessie.
 */
export default function SaleBanner({ surface }: { surface: 'public' | 'portal' }) {
  const t = useTranslations('sale');
  const pathname = usePathname();
  const eligible = useSaleOffer();
  const left = useSaleClock(eligible === true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let gone = false;
    try { gone = sessionStorage.getItem(SALE_DISMISS_KEY) === '1'; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage bestaat pas na hydratie
    if (gone) setDismissed(true);
  }, []);

  const hiddenHere =
    surface === 'portal' && (pathname.startsWith('/oefenexamen') || pathname.startsWith('/betaling-gelukt'));
  const visible = eligible === true && !dismissed && left !== null && !hiddenHere;

  // De gereserveerde ruimte volgt wat er echt staat: weg voor wie premium blijkt, erbij voor een
  // ingelogd account dat in aanmerking komt, weg na wegklikken of als de klok op nul staat.
  useEffect(() => {
    if (eligible === null) return;
    const root = document.documentElement;
    if (visible) root.setAttribute('data-sale', '');
    else root.removeAttribute('data-sale');
  }, [eligible, visible]);

  if (!visible || !left) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(SALE_DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };

  const onPicker = pathname.startsWith('/dashboard/pakketten');

  return (
    <aside className="g-salebar" aria-label={t('aria')}>
      <div className="g-salebar-in">
        <p className="g-salebar-title">
          <span className="g-salebar-tag">Black Friday</span>
          <span className="g-salebar-long">{t('bar_title', { pct: BLACK_FRIDAY.pct })}</span>
          <span className="g-salebar-short">{t('bar_title_short', { pct: BLACK_FRIDAY.pct })}</span>
        </p>
        <div className="g-salebar-clock">
          <span className="g-salebar-ends">{t('ends')}</span>
          <SaleClock left={left} />
        </div>
        {onPicker ? (
          <span aria-hidden />
        ) : (
          <Link
            href={surface === 'portal' ? '/dashboard/pakketten' : '/premium'}
            className={glasButton({ variant: 'oranje', size: 'sm', className: 'g-salebar-cta' })}
          >
            {t('cta')}
            <ArrowRight strokeWidth={2.5} className="rtl-flip" aria-hidden />
          </Link>
        )}
        <button type="button" onClick={dismiss} className="g-sale-x" aria-label={t('close')}>
          <X strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
