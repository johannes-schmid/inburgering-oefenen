import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DEFAULT_LEVEL, LEVELS, SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import LogoMark from '@/components/site/LogoMark';
import { SectionTransition } from '@/components/horizon';
import { skillParam } from '@/i18n/skill-slugs';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');
  const tSkills = useTranslations('skills');

  return (
    <footer className="bg-primary text-white/75">
      {/* The silhouette handover (§7.2): a white band carrying the dot field, with the skyline in
          solid navy tints cut off at the street line by the footer itself — so the houses read as
          silhouettes rather than as a wash. This is the **one** place it appears, which is what
          keeps to the once-per-page rule: every page ends on the footer, so no page needs another. */}
      <SectionTransition className="footer-transition" />
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <LogoMark size={34} surface="dark" />
            <span className="text-xl font-extrabold text-white font-headline tracking-tight">Inburgering Oefenen</span>
          </div>
          <p className="text-sm text-white/55 leading-relaxed max-w-xs">{t('tagline')}</p>
        </div>

        {/* Platform links */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">{t('platform')}</h3>
          <nav className="flex flex-col gap-3 text-sm" aria-label="Footer navigatie">
            {/* Typed `Link`, not a bare `<a>`: the anchor here had no locale prefix, so every
                skill link in the footer sent an EN or AR visitor to the Dutch page. */}
            {/* De twee niveau-overzichten bovenaan (25-09): dat zijn de pagina's voor
                "inburgering examen oefenen a2/b1", en de voettekst is de enige site-brede link. */}
            {LEVELS.map(level => (
              <Link
                key={level}
                href={{ pathname: '/oefenexamen/[level]', params: { level } }}
                className="hover:text-white transition-colors no-underline"
              >
                {t(`level_${level}`)}
              </Link>
            ))}
            {SKILLS.map(skill => (
              <Link
                key={skill.slug}
                /* `skillParam`, want next-intl vertaalt alleen het statische deel van een
                 * route — de parameterwaarde geeft het ongewijzigd door. Zonder dit wordt dit
                 * `/en/practice-exam/a2/lezen`, een 308 naar de vertaalde variant op elke
                 * interne link in de voettekst. */
                href={{ pathname: '/oefenexamen/[level]/[skill]', params: { level: DEFAULT_LEVEL, skill: skillParam(skill.slug, locale) } }}
                className="hover:text-white transition-colors no-underline"
              >
                {tSkills(`${skill.key}.name`)}
              </Link>
            ))}
            {/* KNM, one segment shallower because it is not levelled. */}
            <Link href="/oefenexamen/knm" className="hover:text-white transition-colors no-underline">
              {tSkills('knm.name')}
            </Link>
            {/* The two pages the header links to. The bar is four plain links now, so the footer
                is the only other site-wide route to them. */}
            <Link href="/platform" className="hover:text-white transition-colors no-underline">{t('platformOverview')}</Link>
            <Link href="/premium" className="hover:text-white transition-colors no-underline">{t('premium')}</Link>
            <Link href="/docent" className="hover:text-white transition-colors no-underline">{t('aboutTeacher')}</Link>
          </nav>
        </div>

        {/* Kennisgidsen */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">{t('guides')}</h3>
          <nav className="flex flex-col gap-3 text-sm" aria-label="Kennisgidsen">
            <Link href="/gidsen" className="hover:text-white transition-colors no-underline">{t('allGuides')}</Link>
            <Link href="/inburgering" className="hover:text-white transition-colors no-underline">{t('inburgering')}</Link>
            <Link href="/knm" className="hover:text-white transition-colors no-underline">{t('knm')}</Link>
            <Link href="/taalexamens" className="hover:text-white transition-colors no-underline">{t('taalexamens')}</Link>
            {FEATURES.blog && (
              <Link href="/blog" className="hover:text-white transition-colors no-underline">{t('blog')}</Link>
            )}
          </nav>
        </div>

        {/* Legal links */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">{t('legal')}</h3>
          <nav className="flex flex-col gap-3 text-sm" aria-label="Juridische links">
            <Link href="/privacybeleid" className="hover:text-white transition-colors no-underline">{t('privacy')}</Link>
            <Link href="/gebruiksvoorwaarden" className="hover:text-white transition-colors no-underline">{t('terms')}</Link>
            <Link href="/terugbetalingsbeleid" className="hover:text-white transition-colors no-underline">{t('refund')}</Link>
            <Link href="/contact" className="hover:text-white transition-colors no-underline">{t('contact')}</Link>
            <a
              href="https://www.instagram.com/inburgeringoefenen.nl/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors no-underline flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3 text-xs text-white/70">
          <div className="flex flex-col gap-1">
            <p>{t('copyright')}</p>
            <p>Samen Sterk in Taal · KVK 77533216 · BTW NL003205081B10 · van Naeltwijckstraat 13, 2274 NV Voorburg</p>
          </div>
          <p>{t('byTeacher')}</p>
        </div>
      </div>
    </footer>
  );
}
