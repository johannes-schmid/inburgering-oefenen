import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { isOnaAvailable } from '@/lib/ona/access';
import { glasButton } from '@/components/glas/Button';
import { Link } from '@/i18n/navigation';
import { localeHref } from '@/i18n/paths';

/** De tekstkolom van de hero, gedeeld door `/` en `/home-b` zodat de twee varianten dezelfde kop, knoppen en trackrij tonen. */
export default async function HomeHeroCopy({ locale, headingId }: { locale: string; headingId: string }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  /* The four parts of the inburgeringstraject, in the order a candidate meets them, with what is
     actually shipped. `live: false` renders the "binnenkort" chip — see the comment on the row in
     the hero for why a bare list of four would be a false claim. A2 is the shipped product; B1's
     thirty exams exist but sit behind the docent's review gate (`noindex`, see `data/skills.ts`);
     KNM is the documented fifth onderdeel and is not built; ONA is announced and not built. */
  const TRACKS = [
    { key: 'track_a2', live: true },
    /* B1 went live 2026-08-23: the docent signed off the thirty B1 oefenexamens, so its pages
       are indexed and its modules buyable. This chip, `TRACKS` on `/platform`, the `robots` on
       `oefenexamen/[level]/[skill]` and the `LEVELS` loop in `app/sitemap.ts` are one decision
       in four files and move together. */
    { key: 'track_b1', live: true },
    /* KNM went live 2026-08-24, when its content moved across from knmoefenen.nl: ten
       oefenexamens, seven lesmodules and 366 woordkaarten, all authored on that platform by
       the same docent. This chip, the tile below, `TRACKS` on `/platform`, the KNM rows in
       `app/sitemap.ts` and `lib/llms.ts`, and the table at the top of `CLAUDE.md` are one
       decision in six places and move together. */
    { key: 'track_knm', live: true },
    /* ONA volgt `isOnaAvailable()` — dezelfde vlag als het portaal, het menu en de checkout. */
    { key: 'track_ona', live: isOnaAvailable() },
  ] as const;

  const [heroLead, heroMuted] = t('hero_line1').split(' — ');

  return (
    <div>
      <span className="g-seal g-seal-sm g-glass g-glass-strong">
        <img src="/images/amber-van-der-zalm-264.webp" alt="" width={22} height={22} />
        <b>{t('hero_badge')}</b>
      </span>
      <h1 id={headingId}>
        {heroLead}
        {heroMuted && <> <span>{heroMuted}</span></>}
      </h1>
      <p className="g-lead">{t('hero_subheading')}</p>
      <div className="g-ctas">
        <a href={localeHref(locale, `oefenen`)} className={glasButton({ variant: 'navy', size: 'lg' })}>
          {t('cta_primary')}
          <ArrowRight className="rtl-flip" aria-hidden="true" />
        </a>
        <Link href="/platform" className={glasButton({ variant: 'ghost', size: 'lg' })}>
          {t('cta_secondary')}
        </Link>
      </div>

      <ul className="g-hero-proof" aria-label={t('blocks_heading')}>
        {TRACKS.map(track => {
          const levelHref = track.key === 'track_a2' ? localeHref(locale, 'oefenexamen/a2')
            : track.key === 'track_b1' ? localeHref(locale, 'oefenexamen/b1')
            : null;
          const mark = track.live
            ? <Check aria-hidden="true" className="text-goed" />
            : <Clock aria-hidden="true" />;
          return (
            <li key={track.key}>
              {levelHref ? (
                <a href={levelHref}>{mark}{t(track.key)}</a>
              ) : (
                <span>
                  {mark}{t(track.key)}
                  {!track.live && <span className="g-bdg g-bdg-grijs !h-5 !px-2 !text-[11px]">{t('pkg_soon')}</span>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
