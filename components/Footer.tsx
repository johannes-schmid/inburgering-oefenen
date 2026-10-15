import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DEFAULT_LEVEL, LEVELS, SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import LogoMark from '@/components/site/LogoMark';
import ExamMark from '@/components/horizon/ExamMark';
import Field from '@/components/glas/Field';
import { skillParam } from '@/i18n/skill-slugs';

/**
 * De publieke footer in Glas: **F1 "licht glas"** (§G5, glas.html §13). Een glazen kaart op het
 * veld Licht, met de vier track-merken onder het logo. De skyline is met pensioen.
 *
 * De links zijn dezelfde als vóór Glas en blijven dat: de footer is de enige site-brede link naar
 * de twee niveau-overzichten, de onderdeelpagina's, /platform, /premium en /docent (de header heeft
 * vier platte links). Haal er geen weg om de kaart op te ruimen.
 */
export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');
  const tSkills = useTranslations('skills');

  return (
    <Field as="footer" variant="licht" className="g-foot">
      <div className="mx-auto max-w-[1240px]">
        <div className="g-foot-card g-glass">
          <div className="g-foot-brand">
            <Link href="/" className="g-foot-logo">
              <LogoMark size={32} />
              Inburgering Oefenen
            </Link>
            <p>{t('tagline')}</p>
            <div className="g-foot-marks">
              <ExamMark track="a2" size={36} />
              <ExamMark track="b1" size={36} />
              <ExamMark track="knm" size={36} />
              <ExamMark track="ona" size={36} />
            </div>
          </div>

          <div>
            <h2>{t('platform')}</h2>
            <nav aria-label="Footer navigatie">
              <ul>
                {/* De twee niveau-overzichten bovenaan (25-09): dat zijn de pagina's voor
                    "inburgering examen oefenen a2/b1", en de voettekst is de enige site-brede link. */}
                {LEVELS.map(level => (
                  <li key={level}>
                    <Link href={{ pathname: '/oefenexamen/[level]', params: { level } }}>{t(`level_${level}`)}</Link>
                  </li>
                ))}
                {SKILLS.map(skill => (
                  <li key={skill.slug}>
                    {/* `skillParam`: next-intl vertaalt alleen het statische deel van een route. */}
                    <Link href={{ pathname: '/oefenexamen/[level]/[skill]', params: { level: DEFAULT_LEVEL, skill: skillParam(skill.slug, locale) } }}>
                      {tSkills(`${skill.key}.name`)}
                    </Link>
                  </li>
                ))}
                <li><Link href="/oefenexamen/knm">{tSkills('knm.name')}</Link></li>
                <li><Link href="/platform">{t('platformOverview')}</Link></li>
                <li><Link href="/premium">{t('premium')}</Link></li>
                <li><Link href="/docent">{t('aboutTeacher')}</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <h2>{t('guides')}</h2>
            <nav aria-label="Kennisgidsen">
              <ul>
                <li><Link href="/gidsen">{t('allGuides')}</Link></li>
                <li><Link href="/inburgering">{t('inburgering')}</Link></li>
                <li><Link href="/knm">{t('knm')}</Link></li>
                <li><Link href="/taalexamens">{t('taalexamens')}</Link></li>
                {FEATURES.blog && <li><Link href="/blog">{t('blog')}</Link></li>}
              </ul>
            </nav>
          </div>

          <div>
            <h2>{t('legal')}</h2>
            <nav aria-label="Juridische links">
              <ul>
                <li><Link href="/redactie">{t('editorial')}</Link></li>
                <li><Link href="/privacybeleid">{t('privacy')}</Link></li>
                <li><Link href="/gebruiksvoorwaarden">{t('terms')}</Link></li>
                <li><Link href="/terugbetalingsbeleid">{t('refund')}</Link></li>
                <li><Link href="/contact">{t('contact')}</Link></li>
                <li>
                  <a href="https://www.instagram.com/inburgeringoefenen.nl/" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="g-foot-legal">
          <span>{t('copyright')}</span>
          <span>Samen Sterk in Taal · KVK 77533216 · BTW NL003205081B10 · van Naeltwijckstraat 13, 2274 NV Voorburg</span>
          <span>{t('byTeacher')}</span>
        </div>
      </div>
    </Field>
  );
}
