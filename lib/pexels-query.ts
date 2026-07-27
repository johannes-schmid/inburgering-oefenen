// Maps Dutch KNM topic words → descriptive English visual search phrases
const TOPIC_MAP: [RegExp, string][] = [
  [/volkslied/, 'Dutch national anthem singing'],
  [/tweede kamer/, 'Dutch parliament house of representatives'],
  [/eerste kamer/, 'Dutch senate parliament'],
  [/minister.?president/, 'Dutch prime minister government'],
  [/minister(?!ie)/, 'minister government press conference'],
  [/grondwet/, 'constitution law document'],
  [/koningin|koningshuis|koninklijk/, 'Dutch royal family queen'],
  [/\bkoning\b/, 'Dutch king monarchy'],
  [/burgemeester/, 'Dutch mayor city hall'],
  [/gemeente/, 'Dutch municipality city hall'],
  [/provincie/, 'Dutch province region map'],
  [/parlement|politiek/, 'Dutch parliament politics'],
  [/stemmen|verkiezing|referendum/, 'voting election ballot'],
  [/politie|agent\b/, 'Dutch police officer'],
  [/rechtbank|rechter|rechtsstaat/, 'court of law justice'],
  [/belasting(?:dienst)?/, 'tax office paperwork'],
  [/uwv|werkloosheid|uitkering/, 'unemployment benefit office Netherlands'],
  [/ziekenhuis|ziekenzorg/, 'hospital Netherlands healthcare'],
  [/huisarts|dokter/, 'general practitioner doctor Netherlands'],
  [/school|onderwijs|leerling/, 'school education Netherlands classroom'],
  [/universiteit|hogeschool/, 'university students Netherlands'],
  [/kinderopvang/, 'childcare daycare Netherlands'],
  [/huren|huurwoning|huurder/, 'rental housing apartment Netherlands'],
  [/hypotheek/, 'mortgage house buying Netherlands'],
  [/woning|huis\b/, 'house neighborhood Netherlands'],
  [/werk\b|werken|werkgever/, 'work employment office Netherlands'],
  [/inkomen|salaris|loon/, 'salary income work Netherlands'],
  [/integratie|inburgering/, 'integration newcomers Netherlands society'],
  [/vluchtel|asiel/, 'refugees asylum Netherlands'],
  [/deltawerken|watersnood/, 'Delta Works flood protection Netherlands'],
  [/polders|dijk/, 'Dutch polder dike landscape'],
  [/windmolen/, 'windmills Netherlands landscape'],
  [/fiets/, 'cycling bicycle Netherlands'],
  [/amsterdam/, 'Amsterdam Netherlands canal city'],
  [/rijksmuseum/, 'Rijksmuseum Amsterdam art museum'],
  [/anne frank/, 'Anne Frank Amsterdam history'],
  [/holocaust|jodenvervolging/, 'Holocaust World War II memorial'],
  [/tweede wereldoorlog|wo ?ii|bezetting/, 'World War II Netherlands occupation'],
  [/voc|kolonial/, 'Dutch colonial history VOC'],
  [/indonesi/, 'Indonesia Dutch colonial history'],
  [/surinam/, 'Suriname Dutch Caribbean'],
  [/slavernij/, 'slavery history memorial'],
  [/willem van oranje|wilhelmus/, 'William of Orange Netherlands history'],
  [/gouden eeuw/, 'Dutch Golden Age painting art'],
  [/tulpen|tulip/, 'tulips Netherlands flower fields'],
  [/kaas\b/, 'Dutch cheese Gouda market'],
  [/klompen/, 'wooden clogs Netherlands traditional'],
  [/sinterklaas/, 'Sinterklaas Dutch tradition celebration'],
  [/koningsdag/, 'Koningsdag Kings Day Netherlands celebration'],
  [/bevrijdingsdag/, 'Liberation Day Netherlands celebration'],
  [/dodenherdenking/, 'Netherlands war memorial remembrance'],
  [/nationale feestdag/, 'Dutch national holiday celebration'],
  [/griekenland|eu\b|europese unie/, 'European Union parliament Brussels'],
  [/navo|nato/, 'NATO alliance military'],
  [/vn\b|verenigde naties/, 'United Nations assembly'],
  [/godsdienst|religie|kerk/, 'religion church Netherlands diversity'],
  [/moskee|islam/, 'mosque Muslim Netherlands'],
  [/discrimin/, 'discrimination equality protest Netherlands'],
  [/taal\b|nederland(s)\b/, 'Dutch language learning Netherlands'],
];

const CATEGORY_CONTEXT: Record<string, string> = {
  'Geschiedenis en Geografie': 'Dutch history Netherlands',
  'Staatsinrichting en Rechtsstaat': 'Dutch government law Netherlands',
  'Maatschappij en Samenleven': 'Dutch society community Netherlands',
  'Werk en Inkomen': 'work employment Netherlands',
  'Gezondheid en Zorg': 'healthcare Netherlands',
  'Onderwijs': 'education school Netherlands',
  'Wonen': 'housing neighborhood Netherlands',
};

const QUESTION_PREFIXES = [
  'hoe heet', 'hoe lang', 'hoe vaak', 'hoe veel', 'hoe groot', 'hoe werkt', 'hoe noem',
  'wat is de naam', 'wat zijn de', 'wat is het', 'wat is een', 'wat is de', 'wat zijn',
  'wat doet de', 'wat doet een', 'wat doet', 'wat heeft', 'wat betekent', 'wat was',
  'welke taken', 'welke wet', 'welke dag', 'welk jaar', 'welke', 'welk',
  'wie is de', 'wie zijn de', 'wie is', 'wie zijn', 'wie heeft',
  'waar is', 'waar zijn', 'waar ligt', 'waar staat', 'waar woont',
  'wanneer is', 'wanneer was', 'wanneer werd', 'wanneer',
  'waarom is', 'waarom zijn', 'waarom was', 'waarom',
  'hoeveel', 'in welk', 'op welke', 'bij welke',
];

const STOP_WORDS = new Set([
  'de', 'het', 'een', 'van', 'in', 'voor', 'door', 'op', 'met', 'aan', 'bij', 'tot',
  'uit', 'over', 'na', 'om', 'te', 'en', 'of', 'dat', 'dit', 'die', 'deze', 'er',
  'ook', 'als', 'zijn', 'heeft', 'wordt', 'worden', 'werd', 'is', 'was', 'maar', 'dan',
  'zich', 'hun', 'hen', 'hem', 'haar', 'wij', 'zij', 'hij', 'ze', 'je', 'jij', 'uw',
  'nog', 'al', 'wel', 'niet', 'geen', 'meer', 'zeer', 'heel', 'erg', 'altijd', 'nooit',
  'nederland', 'nederlandse', 'nederlanders',
]);

export function buildPexelsQuery(question: string, category: string): string {
  const lower = question.toLowerCase().replace(/[?!.,;:()]/g, ' ').replace(/\s+/g, ' ').trim();

  // Check topic map first (most specific match wins)
  for (const [pattern, phrase] of TOPIC_MAP) {
    if (pattern.test(lower)) return phrase;
  }

  // Strip question prefix
  let text = lower;
  for (const prefix of QUESTION_PREFIXES) {
    if (text.startsWith(prefix + ' ')) {
      text = text.slice(prefix.length).trim();
      break;
    }
  }

  // Keep meaningful nouns (drop stop words, keep words > 3 chars)
  const nouns = text.split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w)).slice(0, 3);
  const context = CATEGORY_CONTEXT[category] ?? 'Netherlands';

  return nouns.length > 0 ? `${nouns.join(' ')} ${context}` : context;
}
