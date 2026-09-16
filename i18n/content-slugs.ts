import { routing, type Locale } from './routing';

/**
 * De slug van een gids of een blogartikel, per taal.
 *
 * Dit is de tweede vertáálde parameterwaarde, naast de onderdeelnaam in `skill-slugs.ts`, en
 * de reden is dezelfde: next-intl vertaalt alleen statische segmenten, dus zonder deze tabel
 * wordt `/en/civic-integration/wat-kost-inburgeren` — een half vertaalde URL op precies het
 * oppervlak dat moet ranken.
 *
 * **Waarom een tabel hier en niet een `slug` op `GuideLocale`.** De vertaling hóórt bij de
 * inhoud, maar `i18n/paths.ts` wordt geïmporteerd door `components/Nav.tsx`, een client
 * component. Een import van `data/guides/index.ts` daarin trekt het complete corpus — 23
 * gidsen aan `articleHtml` — de browserbundel in. Deze tabel draagt alleen slugs.
 *
 * Dat de tabel daardoor naast de inhoud staat in plaats van erin, is precies het risico dat
 * `tests-unit/content-slugs.test.ts` afdekt: die test faalt als er een gids of een post
 * bijkomt zonder rij, als er een rij overblijft zonder gids of post, en als twee rijen
 * dezelfde vertaalde slug claimen.
 *
 * **De Nederlandse slug blijft de interne naam.** Hij is de sleutel in `related`,
 * `relatedPosts`, `guideHref()` en elke `localeHref()`-aanroep, en hij verandert nooit mee.
 * Elke route rekent binnenkomend om met `parseContentSlug` en bouwt uitgaand met
 * `contentSlugParam` — zie `fill()` in `paths.ts`.
 */
type Translated = Record<Exclude<Locale, 'nl'>, string>;

/** Kennisgidsen — `data/guides/`, alle drie de secties. */
const GUIDE_SLUGS: Record<string, Translated> = {
  // Inburgering
  'boete-en-termijn':            { en: 'fines-and-deadlines',            ar: 'الغرامة-والمهلة' },
  'inburgering-stappenplan':     { en: 'integration-step-by-step',       ar: 'خطوات-الاندماج' },
  'moet-ik-inburgeren':          { en: 'do-i-have-to-integrate',         ar: 'هل-يجب-علي-الاندماج' },
  'ona-examen':                  { en: 'ona-exam',                       ar: 'امتحان-ona' },
  'pvt-map-en-ona':              { en: 'pvt-map-and-ona',                ar: 'pvt-map-و-ona' },
  'vrijstelling-en-ontheffing':  { en: 'exemption-and-waiver',           ar: 'الإعفاء-والاستثناء' },
  'wat-kost-inburgeren':         { en: 'what-does-integration-cost',     ar: 'تكلفة-الاندماج' },
  'welke-wet-en-welke-route':    { en: 'which-law-and-which-route',      ar: 'أي-قانون-وأي-مسار' },

  // KNM
  'geschiedenis-en-geografie':        { en: 'history-and-geography',        ar: 'التاريخ-والجغرافيا' },
  'gezondheid-en-gezondheidszorg':    { en: 'health-and-healthcare',        ar: 'الصحة-والرعاية-الصحية' },
  'instanties':                       { en: 'institutions',                 ar: 'المؤسسات' },
  'knm-examen':                       { en: 'knm-exam',                     ar: 'امتحان-knm' },
  'omgangsvormen-waarden-en-normen':  { en: 'customs-values-and-norms',     ar: 'العادات-والقيم-والمعايير' },
  'onderwijs-en-opvoeding':           { en: 'education-and-parenting',      ar: 'التعليم-والتربية' },
  'staatsinrichting-en-rechtsstaat':  { en: 'government-and-rule-of-law',   ar: 'نظام-الدولة-وسيادة-القانون' },
  'werk-en-inkomen':                  { en: 'work-and-income',              ar: 'العمل-والدخل' },
  'wonen':                            { en: 'housing',                      ar: 'السكن' },

  // Taalexamens
  'b1-examen':           { en: 'b1-exam',               ar: 'امتحان-b1' },
  'lezen-examen':        { en: 'reading-exam',          ar: 'امتحان-القراءة' },
  'luisteren-examen':    { en: 'listening-exam',        ar: 'امتحان-الاستماع' },
  'schrijven-examen':    { en: 'writing-exam',          ar: 'امتحان-الكتابة' },
  'spreken-examen':      { en: 'speaking-exam',         ar: 'امتحان-التحدث' },
  'taalexamens-a2-b1':   { en: 'language-exams-a2-b1',  ar: 'امتحانات-اللغة-a2-b1' },
};

/** Blogartikelen — `data/blog-posts.ts`. */
const POST_SLUGS: Record<string, Translated> = {
  'inburgeringsexamen-a2-uitleg':        { en: 'a2-integration-exam-explained',           ar: 'شرح-امتحان-الاندماج-a2' },
  'lezen-examen-inburgering-a2':         { en: 'reading-exam-a2-integration',             ar: 'امتحان-القراءة-الاندماج-a2' },
  'luisteren-examen-inburgering-a2':     { en: 'listening-exam-a2-integration',           ar: 'امتحان-الاستماع-الاندماج-a2' },
  'inburgeringsexamen-zakken-herkansen': { en: 'failing-and-retaking-the-integration-exam', ar: 'الرسوب-وإعادة-امتحان-الاندماج' },
  'taalniveaus-a1-a2-b1-nederlands':     { en: 'dutch-language-levels-a1-a2-b1',          ar: 'مستويات-اللغة-الهولندية-a1-a2-b1' },
  'veelgemaakte-fouten-schrijven-examen-a2': { en: 'common-mistakes-writing-exam-a2',        ar: 'أخطاء-شائعة-امتحان-الكتابة-a2' },
  'want-of-omdat':                       { en: 'want-or-omdat-dutch',                     ar: 'want-أم-omdat' },
  'wederkerende-werkwoorden-nederlands': { en: 'dutch-reflexive-verbs',                   ar: 'الأفعال-الانعكاسية-الهولندية' },
  'spreken-examen-inburgering-tips':     { en: 'speaking-exam-a2-tips',                   ar: 'نصائح-امتحان-التحدث-a2' },
};

/**
 * Eén tabel voor beide. De routes zoeken sectie-gescoped op (`getGuideBySlug(section, slug)`),
 * dus een gids en een post kunnen elkaar niet overschrijven; de test bewaakt dat de
 * Nederlandse én de vertaalde slugs over het geheel uniek zijn.
 */
export const CONTENT_SLUGS: Record<string, Translated> = { ...GUIDE_SLUGS, ...POST_SLUGS };

/** De slug voor in een URL van deze taal. Onbekend of Nederlands: onveranderd terug. */
export function contentSlugParam(slug: string, locale: string): string {
  if (locale === 'nl') return slug;
  return CONTENT_SLUGS[slug]?.[locale as Exclude<Locale, 'nl'>] ?? slug;
}

/**
 * Een URL-waarde terug naar de Nederlandse slug, de interne naam.
 *
 * Accepteert élke taal, niet alleen die van het huidige pad — net als `parseSkillParam`, en om
 * dezelfde reden: de Engelse en Arabische URL's van vóór deze wijziging dragen nog de
 * Nederlandse slug en staan in verstuurde mails, in de index en in links van buiten. Ze
 * blijven werken; `canonicalContentPath` in `paths.ts` stuurt ze met een 308 door.
 */
export function parseContentSlug(value: string): string | undefined {
  const decoded = safeDecode(value);
  if (CONTENT_SLUGS[decoded]) return decoded;
  return Object.keys(CONTENT_SLUGS).find(slug =>
    routing.locales.some(locale => contentSlugParam(slug, locale) === decoded),
  );
}

/** True als deze waarde de slug is die bij dit pad hoort, in deze taal. */
export function isCanonicalContentSlug(value: string, slug: string, locale: string): boolean {
  return safeDecode(value) === contentSlugParam(slug, locale);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
