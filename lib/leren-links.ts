// Single source of truth for mapping a KNM question/topic to the exact leren
// lesson that teaches it. Consumed by InlineQuiz (exam results), the fouten
// learning queue, and the analyse page.
//
// Chain: question.section_id → sections.slug → DB_SECTION_TO_LEREN[slug]
//        → { themaSlug, sectionId } → /{locale}/leren/{themaSlug}?section={sectionId}

export type LerenLink = { themaSlug: string; sectionId: string };
export type CategoryMeta = { icon: string; themaSlug: string; themaLabel: string };

export const LEREN_CATEGORY_META: Record<string, CategoryMeta> = {
  'Geschiedenis en Geografie':       { icon: '🌍', themaSlug: 'thema-1-geschiedenis-en-geografie', themaLabel: 'Thema 1' },
  'Wonen':                            { icon: '🏠', themaSlug: 'thema-2-wonen',                      themaLabel: 'Thema 2' },
  'Gezondheid en Gezondheidszorg':    { icon: '🏥', themaSlug: 'thema-3-gezondheid',                 themaLabel: 'Thema 3' },
  'Onderwijs en Opvoeding':           { icon: '🎓', themaSlug: 'thema-4-onderwijs',                  themaLabel: 'Thema 4' },
  'Werk en Inkomen':                  { icon: '💼', themaSlug: 'thema-5-werk',                       themaLabel: 'Thema 5' },
  'Instanties':                       { icon: '🏛️', themaSlug: 'thema-6-instanties',                 themaLabel: 'Thema 6' },
  'Staatsinrichting en Rechtsstaat':  { icon: '⚖️', themaSlug: 'thema-7-regering-en-wet',            themaLabel: 'Thema 7' },
};

export const DB_SECTION_TO_LEREN: Record<string, LerenLink> = {
  'gg-gouden-eeuw':           { themaSlug: 'thema-1-geschiedenis-en-geografie', sectionId: 'gouden-eeuw' },
  'gg-geografie-provincies':  { themaSlug: 'thema-1-geschiedenis-en-geografie', sectionId: 'kaart' },
  'gg-wo2-holocaust':         { themaSlug: 'thema-1-geschiedenis-en-geografie', sectionId: 'woii' },
  'gg-slavernij-kolonies':    { themaSlug: 'thema-1-geschiedenis-en-geografie', sectionId: 'kolonien' },
  'gg-eu-international':       { themaSlug: 'thema-1-geschiedenis-en-geografie', sectionId: 'na-de-oorlog' },
  'gg-herdenkingen':          { themaSlug: 'thema-1-geschiedenis-en-geografie', sectionId: 'na-de-oorlog' },
  'wo-huren':                 { themaSlug: 'thema-2-wonen', sectionId: 'huurcontract' },
  'wo-kopen':                 { themaSlug: 'thema-2-wonen', sectionId: 'huis-vinden' },
  'wo-verzekeringen':         { themaSlug: 'thema-2-wonen', sectionId: 'belastingen' },
  'wo-energie-utilities':     { themaSlug: 'thema-2-wonen', sectionId: 'energie' },
  'wo-afval-milieu':          { themaSlug: 'thema-2-wonen', sectionId: 'afval' },
  'wo-toeslagen-belasting':   { themaSlug: 'thema-2-wonen', sectionId: 'belastingen' },
  'wo-samenwonen-trouwen':    { themaSlug: 'thema-2-wonen', sectionId: 'huurcontract' },
  'gz-huisarts':              { themaSlug: 'thema-3-gezondheid', sectionId: 'huisarts' },
  'gz-zorgverzekering':       { themaSlug: 'thema-3-gezondheid', sectionId: 'zorgverzekering' },
  'gz-apotheek-medicijnen':   { themaSlug: 'thema-3-gezondheid', sectionId: 'apotheek' },
  'gz-specialist-tandarts':   { themaSlug: 'thema-3-gezondheid', sectionId: 'doorverwijzen' },
  'gz-zwangerschap-baby':     { themaSlug: 'thema-3-gezondheid', sectionId: 'kind' },
  'gz-geestelijk-ouderenzorg':{ themaSlug: 'thema-3-gezondheid', sectionId: 'thuiszorg' },
  'oo-schoolsysteem':         { themaSlug: 'thema-4-onderwijs', sectionId: 'leerplicht' },
  'oo-leerplicht':            { themaSlug: 'thema-4-onderwijs', sectionId: 'vakanties' },
  'oo-ouders-school':         { themaSlug: 'thema-4-onderwijs', sectionId: 'ouders' },
  'oo-opvoeding-hulp':        { themaSlug: 'thema-4-onderwijs', sectionId: 'opvoeden' },
  'oo-kinderopvang-financien':{ themaSlug: 'thema-4-onderwijs', sectionId: 'kosten' },
  'oo-feestdagen':            { themaSlug: 'thema-4-onderwijs', sectionId: 'vakanties' },
  'wi-werk-zoeken':           { themaSlug: 'thema-5-werk', sectionId: 'werk-zoeken' },
  'wi-arbeidscontract':       { themaSlug: 'thema-5-werk', sectionId: 'contract' },
  'wi-salaris-belasting':     { themaSlug: 'thema-5-werk', sectionId: 'salaris' },
  'wi-uitkering-uwv':         { themaSlug: 'thema-5-werk', sectionId: 'uitkeringen' },
  'wi-zelfstandige-kvk':      { themaSlug: 'thema-5-werk', sectionId: 'uitkeringen' },
  'wi-vakbond-or':            { themaSlug: 'thema-5-werk', sectionId: 'meer-dan-werken' },
  'wi-inburgering-map':       { themaSlug: 'thema-5-werk', sectionId: 'talenten' },
  'in-gemeente':              { themaSlug: 'thema-6-instanties', sectionId: 'gemeente' },
  'in-belasting-digid':       { themaSlug: 'thema-6-instanties', sectionId: 'belastingdienst' },
  'in-politie-veiligheid':    { themaSlug: 'thema-6-instanties', sectionId: 'hulpdiensten' },
  'in-ind-nationaliteit':     { themaSlug: 'thema-6-instanties', sectionId: 'gemeente' },
  'in-juridisch-ombudsman':   { themaSlug: 'thema-6-instanties', sectionId: 'hulp-bij-problemen' },
  'in-uitkeringen-svb':       { themaSlug: 'thema-6-instanties', sectionId: 'svb' },
  'sr-democratie-kiesrecht':  { themaSlug: 'thema-7-regering-en-wet', sectionId: 'democratie' },
  'sr-machtenscheiding':      { themaSlug: 'thema-7-regering-en-wet', sectionId: 'machtenscheiding' },
  'sr-grondrechten':          { themaSlug: 'thema-7-regering-en-wet', sectionId: 'wetten' },
  'sr-koningshuis':           { themaSlug: 'thema-7-regering-en-wet', sectionId: 'bestuur' },
  'sr-strafrecht-normen':     { themaSlug: 'thema-7-regering-en-wet', sectionId: 'wetten' },
};

// Section-level lesson link for a DB section slug (e.g. 'wo-huren').
export function lerenLinkForSectionSlug(slug: string | null | undefined): LerenLink | null {
  if (!slug) return null;
  return DB_SECTION_TO_LEREN[slug] ?? null;
}

// Thema-level lesson link for a question category (no section anchor).
export function lerenLinkForCategory(category: string): LerenLink | null {
  const meta = LEREN_CATEGORY_META[category];
  return meta ? { themaSlug: meta.themaSlug, sectionId: '' } : null;
}

export function buildLerenHref(locale: string, link: LerenLink): string {
  return `/${locale}/leren/${link.themaSlug}${link.sectionId ? `?section=${link.sectionId}` : ''}`;
}
