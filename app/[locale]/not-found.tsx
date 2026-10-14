import { getTranslations } from 'next-intl/server';
import { ArrowRight, Home } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import CategoryMark from '@/components/horizon/CategoryMark';

/**
 * De 404 van de hele site. Hij staat buiten de `(main)`-layout (een onbekend pad valt in
 * `[...rest]`, dat `notFound()` roept), dus de publieke pil en de footer staan hier zelf: wie
 * verdwaalt, krijgt de kop en drie wegen terug in plaats van een witte pagina. Echte 404-status;
 * zie CLAUDE.md §12 ("soft 404s" opgelost).
 *
 * De drie wegen zijn de drie plekken waar een bezoeker bijna altijd heen wilde: de homepage, de
 * gratis proefvragen en de gidsen. Hun labels zijn de bestaande kopteksten uit `nav`.
 */
export default async function NotFound() {
  const t = await getTranslations('not_found');
  const tNav = await getTranslations('nav');
  const tFoot = await getTranslations('footer');

  return (
    <div className="g-page min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 pt-[var(--nav-h)]">
        <Field variant="gracht" veil="up" className="g-pagehead pb-20 sm:pb-28 px-4">
          <div className="g-wrap text-center flex flex-col items-center">
            <p className="g-404-code g-tnum m-0" aria-hidden="true">404</p>
            <h1 className="g-head g-head-1 mt-4">{t('title')}</h1>
            <p className="g-lead mt-4 mx-auto">{t('description')}</p>
            <Link href="/" className={glasButton({ variant: 'navy', size: 'lg', className: 'mt-7' })}>
              <Home aria-hidden="true" />
              {t('cta')}
            </Link>

            <nav className="g-404-links" aria-label={tNav('ariaMain')}>
              <Link href="/oefenen">
                <CategoryMark category="examen" size={36} />
                {tNav('startDesktop')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
              <Link href="/platform">
                <CategoryMark category="lezen" size={36} />
                {tNav('sec_platform')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
              <Link href="/gidsen">
                <CategoryMark category="gidsen" size={36} />
                {tFoot('allGuides')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </Field>
      </main>
      <Footer />
    </div>
  );
}
