/**
 * De grammaticasyllabus per cursus — blok B "Grammatica", met de hand vastgelegd, in git.
 *
 * Dit is de opzet van de eigenaar (oktober 2026): per (niveau, onderdeel) een genummerde lijst
 * onderwerpen met *wat je leert*, de voorbeelden en een lesvideo. Hij vervangt de indeling op
 * `concept_groups` in stap 2 van de leerroute.
 *
 * ── EEN ONDERWERP IS GEEN NIEUWE KOPIE VAN DE REGEL ──────────────────────────
 * De regels staan nog steeds één keer in de database, in het regelhuis van hun niveau
 * (`RULES_HOME`, blok B van Lezen). Een onderwerp **wijst** naar één of meer van die lessen
 * (`lessons`) en zet er de kop, de leerdoelzin en de video van dít onderdeel boven. Zo zegt
 * Luisteren "Je hoort niet en geen, ook als iemand snel praat" en Schrijven "Je kiest niet of
 * geen", terwijl de uitleg en de opgaven over `niet`/`geen` maar één keer bestaan en één keer
 * door de docent worden nagekeken.
 *
 * Een verwijzing is `niveau:onderdeel:lesslug`, waarbij het onderdeel dat van het blok is waar
 * de les fysiek staat — voor een regelles dus altijd `lezen`, ook in de cursus Spreken. Een
 * B1-onderwerp mag naar een A2-les wijzen: zo werken de rijen *Herhaling A2*.
 *
 * ── DE VIDEO'S ───────────────────────────────────────────────────────────────
 * `VIDEOS` is de catalogus, op titel, duur en YouTube-link zoals de eigenaar ze aanleverde in
 * *A2-cursus: grammatica* en *B1-cursus: grammatica* (Drive, 08-10). Een rij met "Geen video"
 * heeft `video: null`. Een `url: null` toont een lege videoplek in plaats van een kapotte speler;
 * een YouTube- of Google Drive-link wordt als embed getoond (`lib/lessons/video-embed.ts`).
 */

import type { Level, SkillSlug } from '@/data/skills';

export type GrammarVideo = {
  title: string;
  /** Zoals aangeleverd, `m:ss`. */
  duration: string;
  url: string | null;
};

/** `niveau:onderdeel:lesslug` — het onderdeel van het blok waar de les fysiek staat. */
export type LessonRef = `${Level}:${SkillSlug}:${string}`;

export type GrammarTopic = {
  /** Het rijnummer uit de opzet, 1-gebaseerd en per cursus. */
  n: number;
  title: string;
  /** *Wat leer je?* — één zin, A2-Nederlands. */
  learn: string;
  /** De voorbeeldregel uit de opzet. */
  examples: string;
  /** Sleutel in `VIDEOS`, of `null` voor "geen video". */
  video: VideoKey | null;
  lessons: LessonRef[];
};

export const VIDEOS = {
  'aanwijzende-vnw':           { title: 'Aanwijzende voornaamwoorden', duration: '2:46', url: 'https://www.youtube.com/watch?v=IbQyQpWLV1k' },
  'ontkenning':                { title: 'Ontkenning', duration: '2:50', url: 'https://www.youtube.com/watch?v=UEAKUATmbzg' },
  'trappen':                   { title: 'Vergrotende en overtreffende trap', duration: '6:23', url: 'https://www.youtube.com/watch?v=QaKGH-9pQ5c' },
  'gebiedende-wijs':           { title: 'Gebiedende wijs', duration: '2:05', url: 'https://www.youtube.com/watch?v=wmJBdTGf7X8' },
  'perfectum-imperfectum':     { title: 'Voltooid tegenwoordige tijd en verleden tijd', duration: '2:16', url: 'https://www.youtube.com/watch?v=Ped_jjovPuc' },
  'voegwoorden-2':             { title: 'Voegwoorden, deel 2', duration: '8:00', url: 'https://www.youtube.com/watch?v=9zTJcckIIYY' },
  'betrekkelijke-vnw':         { title: 'Betrekkelijke voornaamwoorden', duration: '6:13', url: 'https://www.youtube.com/watch?v=r1m3F8Up0bo' },
  'lijdende-vorm':             { title: 'Lijdende vorm', duration: '4:02', url: 'https://www.youtube.com/watch?v=oGwIy4-UrAE' },
  'voegwoorden-1':             { title: 'Voegwoorden, deel 1', duration: '2:54', url: 'https://www.youtube.com/watch?v=9OBUvTiPaMc' },
  'modale-werkwoorden':        { title: 'Modale werkwoorden', duration: '4:52', url: 'https://www.youtube.com/watch?v=SVwkdG7U9fQ' },
  'scheidbare-werkwoorden':    { title: 'Scheidbare werkwoorden', duration: '5:50', url: 'https://www.youtube.com/watch?v=KoL1Zg6Axac' },
  'zinsbouw':                  { title: 'Zinsbouw', duration: '6:13', url: 'https://www.youtube.com/watch?v=3XYNM_SoyxI' },
  'lidwoorden':                { title: 'Lidwoorden', duration: '3:24', url: 'https://www.youtube.com/watch?v=zEj1pbv55SM' },
  'meervoud':                  { title: 'Meervoud', duration: '4:35', url: 'https://www.youtube.com/watch?v=Tw29Y65Kz74' },
  'persoonlijke-vnw':          { title: 'Persoonlijke voornaamwoorden', duration: '3:58', url: 'https://www.youtube.com/watch?v=igcmoh3ZJJU' },
  'persoonlijke-vnw-voorwerp': { title: 'Persoonlijke voornaamwoorden als voorwerp', duration: '5:20', url: 'https://www.youtube.com/watch?v=_IovjENb724' },
  'bezittelijke-vnw':          { title: 'Bezittelijke voornaamwoorden', duration: '4:46', url: 'https://www.youtube.com/watch?v=ZOdpIdMek-c' },
  'bijvoeglijke-nw':           { title: 'Bijvoeglijke naamwoorden', duration: '3:06', url: 'https://www.youtube.com/watch?v=vF7Dfe7dIsY' },
  'regelmatige-ww':            { title: 'Regelmatige werkwoorden', duration: '3:32', url: 'https://www.youtube.com/watch?v=XznFFzHg21s' },
  'hebben-en-zijn':            { title: 'Hebben en zijn', duration: '2:34', url: 'https://www.youtube.com/watch?v=hdRjcWkC_qk' },
  'perfectum':                 { title: 'Voltooid tegenwoordige tijd', duration: '9:58', url: 'https://www.youtube.com/watch?v=JX_X3BhAS9k' },
  'wederkerende-ww':           { title: 'Wederkerende werkwoorden', duration: '4:41', url: 'https://www.youtube.com/watch?v=Jnhgwe8u1lE' },
  'toekomende-tijd':           { title: 'Toekomende tijd', duration: '2:20', url: 'https://www.youtube.com/watch?v=Uv9da12shy4' },
  'er-en-daar':                { title: 'Er en daar', duration: '4:36', url: 'https://www.youtube.com/watch?v=UszVSc-nS_c' },
  'er-1':                      { title: 'Er, deel 1', duration: '3:23', url: 'https://www.youtube.com/watch?v=zF0oTsxQobk' },
  'zou-1':                     { title: 'Zou, deel 1', duration: '2:23', url: 'https://www.youtube.com/watch?v=tOnts8TUa00' },
  'lijdende-vorm-1':           { title: 'Lijdende vorm, deel 1', duration: '4:02', url: 'https://www.youtube.com/watch?v=oGwIy4-UrAE' },
  'om-te':                     { title: 'Om te + infinitief', duration: '1:34', url: 'https://www.youtube.com/watch?v=dqa-mgRvpwA' },
  'betrekkelijke-vnw-1':       { title: 'Betrekkelijke voornaamwoorden, deel 1', duration: '6:13', url: 'https://www.youtube.com/watch?v=r1m3F8Up0bo' },
  'indirecte-rede':            { title: 'Indirecte rede', duration: '2:52', url: 'https://www.youtube.com/watch?v=Bu1N6yL39VQ' },
  'voegwoorden-b1':            { title: 'Voegwoorden', duration: '4:34', url: 'https://www.youtube.com/watch?v=osYXmygi6yo' },
  'moeten-hoeven':             { title: 'Moeten en hoeven', duration: '2:56', url: 'https://www.youtube.com/watch?v=ke8l-ikRCyE' },
  'scheidbare-ww-b1':          { title: 'Scheidbare werkwoorden', duration: '3:15', url: 'https://www.youtube.com/watch?v=0KaJRVzTOuc' },
  'verleden-tijd':             { title: 'Verleden tijd', duration: '5:57', url: 'https://www.youtube.com/watch?v=k12jZf2Cy3w' },
  'te-infinitief':             { title: 'Te + infinitief', duration: '2:20', url: 'https://www.youtube.com/watch?v=ascuaT9QIrs' },
  'zinsbouw-b1':               { title: 'Zinsbouw', duration: '2:00', url: 'https://www.youtube.com/watch?v=EuRrPWoZ-1g' },
  'aan-het':                   { title: 'Zijn aan het + infinitief', duration: '2:59', url: 'https://www.youtube.com/watch?v=oZ52AcGu-lA' },
} as const satisfies Record<string, GrammarVideo>;

export type VideoKey = keyof typeof VIDEOS;

// ── De lessen waar de onderwerpen naar wijzen ────────────────────────────────
// A2-regelhuis (a2, lezen, B). b1–b28 bestaan; b29–b37 zijn er bij gekomen voor deze opzet.
const A2 = {
  hoofdzin: 'a2:lezen:b1-hoofdzin-woordorde',
  inversie: 'a2:lezen:b2-inversie',
  voegwoorden: 'a2:lezen:b3-voegwoorden-hoofdzin',
  bijzinOmdat: 'a2:lezen:b4-bijzin-omdat-als',
  bijzinDat: 'a2:lezen:b5-bijzin-dat-of',
  vragen: 'a2:lezen:b7-vragen-maken',
  presens: 'a2:lezen:b8-tegenwoordige-tijd',
  presensOnr: 'a2:lezen:b9-onregelmatige-tegenwoordige-tijd',
  perfectum: 'a2:lezen:b10-perfectum-regelmatig',
  perfectumOnr: 'a2:lezen:b11-perfectum-onregelmatig',
  hebbenZijn: 'a2:lezen:b12-hebben-of-zijn',
  imperfectum: 'a2:lezen:b13-verleden-tijd',
  futurum: 'a2:lezen:b14-toekomende-tijd',
  gebiedend: 'a2:lezen:b15-gebiedende-wijs',
  scheidbaar: 'a2:lezen:b16-scheidbare-werkwoorden',
  modaal: 'a2:lezen:b18-modale-werkwoorden',
  wederkerend: 'a2:lezen:b19-wederkerende-werkwoorden',
  lidwoorden: 'a2:lezen:b21-lidwoorden',
  meervoud: 'a2:lezen:b22-meervoud',
  vergrotend: 'a2:lezen:b23-vergrotende-trap',
  overtreffend: 'a2:lezen:b24-overtreffende-trap',
  persVnw: 'a2:lezen:b25-persoonlijk-vnw-onderwerp',
  persVnwLijdend: 'a2:lezen:b26-persoonlijk-vnw-lijdend',
  voorzetsels: 'a2:lezen:b27-voorzetsels-plaats',
  verwijswoorden: 'a2:lezen:b29-verwijswoorden',
  ontkenning: 'a2:lezen:b30-ontkenning',
  hoeveelheden: 'a2:lezen:b31-hoeveelheden',
  tijdsaanduidingen: 'a2:lezen:b32-tijdsaanduidingen',
  betrekkelijk: 'a2:lezen:b33-betrekkelijk-vnw',
  lijdend: 'a2:lezen:b34-lijdende-vorm',
  bezittelijk: 'a2:lezen:b35-bezittelijk-vnw',
  erIs: 'a2:lezen:b36-er-is-er-zijn',
  bijvoeglijk: 'a2:lezen:b37-bijvoeglijk-naamwoord',
  // Eigen blok B van de cursus, niet in het regelhuis.
  getallen: 'a2:luisteren:b1-getallen-en-tijden',
  verkorteSpraak: 'a2:luisteren:b2-verkorte-spraak',
  signaalHoren: 'a2:luisteren:b5-signaalwoorden-horen',
  jeOfU: 'a2:schrijven:b2-je-of-u',
  spellingWw: 'a2:schrijven:b3-spelling-werkwoord',
  verbindingswoorden: 'a2:schrijven:b5-verbindingswoorden',
  tijdKloppend: 'a2:schrijven:b6-tijd-kloppend',
  zinAfMaken: 'a2:schrijven:b1-zin-af-maken',
} as const satisfies Record<string, LessonRef>;

// B1-regelhuis (b1, lezen, B). Allemaal nieuw.
const B1 = {
  erDaarWaar: 'b1:lezen:b1-er-daar-waar',
  ontkenning: 'b1:lezen:b2-ontkenning',
  vergelijken: 'b1:lezen:b3-vergelijken',
  tijdenHerkennen: 'b1:lezen:b4-tijden-herkennen',
  zou: 'b1:lezen:b5-zou-zouden',
  lijdend: 'b1:lezen:b6-lijdende-vorm',
  teInfinitief: 'b1:lezen:b7-te-infinitief',
  bijzinnen: 'b1:lezen:b8-bijzinnen',
  betrekkelijk: 'b1:lezen:b9-betrekkelijk-vnw',
  indirecteRede: 'b1:lezen:b10-indirecte-rede',
  signaalwoorden: 'b1:lezen:b11-signaalwoorden',
  modaalHoeven: 'b1:lezen:b12-modale-hoeven',
  scheidbaar: 'b1:lezen:b13-scheidbare-werkwoorden',
  bijvoeglijk: 'b1:lezen:b14-bijvoeglijk-naamwoord',
  vasteVoorzetsels: 'b1:lezen:b15-vaste-voorzetsels',
  werkwoordspelling: 'b1:lezen:b16-werkwoordspelling',
  plusquamperfectum: 'b1:lezen:b17-plusquamperfectum',
  modaalVoltooid: 'b1:lezen:b18-modale-voltooid',
  werkwoordsvolgorde: 'b1:lezen:b19-werkwoordsvolgorde',
  wederkerend: 'b1:lezen:b20-wederkerende-werkwoorden',
  verledenVertellen: 'b1:lezen:b21-verleden-vertellen',
  aanHet: 'b1:lezen:b22-aan-het',
  futurum: 'b1:lezen:b23-toekomende-tijd',
  meningGeven: 'b1:lezen:b24-mening-geven',
} as const satisfies Record<string, LessonRef>;

const HERHALING_WW: LessonRef[] = [A2.presens, A2.perfectum, A2.perfectumOnr];
const HERHALING_ZINSBOUW: LessonRef[] = [A2.hoofdzin, A2.inversie];
const HERHALING_VOEGWOORDEN: LessonRef[] = [A2.voegwoorden, A2.bijzinOmdat];

const B1_HERHALING: GrammarTopic[] = [
  { n: 1, title: 'Herhaling A2: werkwoorden (presens en perfectum)', learn: 'Je herhaalt de tegenwoordige tijd en de voltooide tijd.', examples: 'ik werk, hij werkt, ik heb gewerkt, ik ben gegaan', video: 'perfectum', lessons: HERHALING_WW },
  { n: 2, title: 'Herhaling A2: zinsbouw en inversie', learn: 'Je herhaalt waar het werkwoord in de zin staat.', examples: 'Morgen ga ik naar mijn werk. Ga je mee?', video: 'zinsbouw', lessons: HERHALING_ZINSBOUW },
  { n: 3, title: 'Herhaling A2: voegwoorden (conjuncties)', learn: 'Je herhaalt en, maar, want, dus, omdat en als.', examples: 'Ik blijf thuis, want ik ben ziek. Ik blijf thuis omdat ik ziek ben.', video: 'voegwoorden-1', lessons: HERHALING_VOEGWOORDEN },
];

export const GRAMMAR_SYLLABUS: Record<Level, Record<SkillSlug, GrammarTopic[]>> = {
  a2: {
    lezen: [
      { n: 1, title: 'Verwijswoorden en aanwijzende voornaamwoorden (demonstratief pronomen)', learn: 'Je ziet naar wie of wat een woord verwijst.', examples: 'hij, ze, het, daar, deze, dit, die, dat', video: 'aanwijzende-vnw', lessons: [A2.verwijswoorden, A2.persVnw] },
      { n: 2, title: 'Ontkenning (negatie)', learn: 'Je ziet dat een zin het tegenovergestelde betekent.', examples: 'niet, geen, nooit, niemand, niets', video: 'ontkenning', lessons: [A2.ontkenning] },
      { n: 3, title: 'Hoeveelheden', learn: 'Je begrijpt hoeveel iets is.', examples: 'minstens, maximaal, ongeveer, allebei, de helft', video: null, lessons: [A2.hoeveelheden] },
      { n: 4, title: 'Vergrotende en overtreffende trap (comparatief en superlatief)', learn: 'Je vergelijkt prijzen en producten.', examples: 'goedkoper dan, beter, het best, het grootst', video: 'trappen', lessons: [A2.vergrotend, A2.overtreffend] },
      { n: 5, title: 'Tijdsaanduidingen', learn: 'Je begrijpt wanneer iets gebeurt.', examples: 'geleden, sinds, tot, binnen twee weken', video: null, lessons: [A2.tijdsaanduidingen] },
      { n: 6, title: 'Gebiedende wijs (imperatief)', learn: 'Je begrijpt instructies op formulieren en borden.', examples: 'Vul hier uw naam in. Niet roken.', video: 'gebiedende-wijs', lessons: [A2.gebiedend] },
      { n: 7, title: 'Voltooide en verleden tijd (perfectum en imperfectum)', learn: 'Je ziet of iets nu gebeurt of al gebeurd is.', examples: 'hij werkt, hij werkte, hij heeft gewerkt', video: 'perfectum-imperfectum', lessons: [A2.perfectum, A2.imperfectum] },
      { n: 8, title: 'Bijzinnen', learn: 'Je vindt het werkwoord aan het eind van de zin.', examples: 'Ik blijf thuis omdat ik ziek ben.', video: 'voegwoorden-2', lessons: [A2.bijzinOmdat, A2.bijzinDat] },
      { n: 9, title: 'Betrekkelijke voornaamwoorden (relatief pronomen)', learn: 'Je begrijpt over wie of wat het gaat.', examples: 'de man die daar woont, het huis dat te koop is', video: 'betrekkelijke-vnw', lessons: [A2.betrekkelijk] },
      { n: 10, title: 'Lijdende vorm (passief)', learn: 'Je begrijpt zinnen met wordt en worden in brieven.', examples: 'De brief wordt verstuurd. Uw pas wordt opgestuurd.', video: 'lijdende-vorm', lessons: [A2.lijdend] },
      { n: 11, title: 'Voegwoorden (conjuncties)', learn: 'Je ziet de volgorde, de reden en de tegenstelling.', examples: 'eerst, daarna, want, dus, maar, toch', video: 'voegwoorden-1', lessons: [A2.voegwoorden] },
    ],
    luisteren: [
      { n: 1, title: 'Getallen, tijd en datum', learn: 'Je verstaat tijden, data en prijzen.', examples: 'half zes, kwart over drie, op 12 maart, € 4,50', video: null, lessons: [A2.getallen] },
      { n: 2, title: 'Hoeveelheden en vergelijkingen (comparatief en superlatief)', learn: 'Je verstaat hoeveel iets is en wat meer of minder is.', examples: 'meer, minder, evenveel, ongeveer, het goedkoopst', video: 'trappen', lessons: [A2.hoeveelheden, A2.vergrotend, A2.overtreffend] },
      { n: 3, title: 'Tijdsaanduidingen', learn: 'Je hoort wanneer iets gebeurt.', examples: 'straks, zo meteen, vorige week, over tien minuten', video: null, lessons: [A2.tijdsaanduidingen] },
      { n: 4, title: 'Ontkenning (negatie)', learn: 'Je hoort niet en geen, ook als iemand snel praat.', examples: 'Ik kan niet komen. Ik heb geen tijd.', video: 'ontkenning', lessons: [A2.ontkenning] },
      { n: 5, title: 'Spreektaal: verkorte vormen', learn: 'Je herkent korte vormen.', examples: "'k, 't, ie, m'n, d'r: Waar is ie?", video: null, lessons: [A2.verkorteSpraak] },
      { n: 6, title: 'Gebiedende wijs (imperatief)', learn: 'Je begrijpt instructies.', examples: 'Kom binnen. Neem de tweede straat links.', video: 'gebiedende-wijs', lessons: [A2.gebiedend] },
      { n: 7, title: 'Modale werkwoorden', learn: 'Je hoort wat moet, mag of kan.', examples: 'U moet even wachten. U mag hier niet parkeren.', video: 'modale-werkwoorden', lessons: [A2.modaal] },
      { n: 8, title: 'Scheidbare werkwoorden', learn: 'Je hoort het tweede deel van het werkwoord aan het eind.', examples: 'Ik haal je om zes uur op.', video: 'scheidbare-werkwoorden', lessons: [A2.scheidbaar] },
      { n: 9, title: 'Werkwoordstijden herkennen (presens, imperfectum, perfectum, futurum)', learn: 'Je hoort of iets al gebeurd is of nog komt.', examples: 'Ik was thuis. Ik heb al gegeten. Ik ga morgen werken.', video: 'perfectum-imperfectum', lessons: [A2.presens, A2.imperfectum, A2.perfectum, A2.futurum] },
      { n: 10, title: 'Vraagzinnen', learn: 'Je begrijpt wat iemand vraagt.', examples: 'Waar woont u? Heeft u een afspraak? Wilt u even wachten?', video: 'zinsbouw', lessons: [A2.vragen] },
      { n: 11, title: 'Voegwoorden (conjuncties)', learn: 'Je hoort de reden of de tegenstelling.', examples: 'want, omdat, dus, maar', video: 'voegwoorden-1', lessons: [A2.voegwoorden, A2.bijzinOmdat, A2.signaalHoren] },
    ],
    schrijven: [
      { n: 1, title: 'Lidwoorden en aanwijzende voornaamwoorden (artikels en demonstratief pronomen)', learn: 'Je kiest de of het, en deze of dit.', examples: 'de tafel, het huis, een boek; deze tafel, dit huis', video: 'lidwoorden', lessons: [A2.lidwoorden, A2.verwijswoorden] },
      { n: 2, title: 'Meervoud en verkleinwoorden (pluralis en diminutief)', learn: 'Je schrijft het meervoud en kleine woorden goed.', examples: 'huizen, bomen, tafels, huisje', video: 'meervoud', lessons: [A2.meervoud] },
      { n: 3, title: 'Persoonlijke voornaamwoorden als onderwerp (personaal pronomen: subject)', learn: 'Je weet wie iets doet.', examples: 'ik, jij, u, hij, zij, wij, jullie', video: 'persoonlijke-vnw', lessons: [A2.persVnw, A2.jeOfU] },
      { n: 4, title: 'Persoonlijke voornaamwoorden als voorwerp (personaal pronomen: object)', learn: 'Je kiest het goede woord na het werkwoord.', examples: 'Hij helpt mij. Ik bel hem.', video: 'persoonlijke-vnw-voorwerp', lessons: [A2.persVnwLijdend] },
      { n: 5, title: 'Bezittelijke voornaamwoorden (possessief pronomen)', learn: 'Je schrijft van wie iets is.', examples: 'mijn fiets, jouw tas, zijn huis, ons huis', video: 'bezittelijke-vnw', lessons: [A2.bezittelijk] },
      { n: 6, title: 'Bijvoeglijke naamwoorden en vergrotende en overtreffende trap (adjectief, comparatief en superlatief)', learn: 'Je beschrijft en vergelijkt.', examples: 'een mooie dag, een mooi huis, groter dan, het grootst', video: 'bijvoeglijke-nw', lessons: [A2.bijvoeglijk, A2.vergrotend, A2.overtreffend] },
      { n: 7, title: 'Werkwoorden: tegenwoordige tijd (presens)', learn: 'Je schrijft het werkwoord goed, ook met d en t.', examples: 'ik werk, hij werkt, hij wordt, werk jij?', video: 'regelmatige-ww', lessons: [A2.presens, A2.spellingWw] },
      { n: 8, title: 'Werkwoorden: hebben en zijn', learn: 'Je kent alle vormen van hebben en zijn.', examples: 'ik heb, hij heeft; ik ben, hij is', video: 'hebben-en-zijn', lessons: [A2.presensOnr] },
      { n: 9, title: 'Modale werkwoorden', learn: 'Je zet het tweede werkwoord aan het eind.', examples: 'Ik kan morgen niet komen.', video: 'modale-werkwoorden', lessons: [A2.modaal] },
      { n: 10, title: 'Scheidbare werkwoorden', learn: 'Je zet het eerste deel aan het eind.', examples: 'opbellen: Ik bel je morgen op.', video: 'scheidbare-werkwoorden', lessons: [A2.scheidbaar] },
      { n: 11, title: 'Voltooid tegenwoordige tijd (perfectum)', learn: 'Je schrijft over gisteren of vorige week.', examples: 'Ik heb gewerkt. Ik ben naar huis gegaan.', video: 'perfectum', lessons: [A2.perfectum, A2.perfectumOnr, A2.hebbenZijn, A2.tijdKloppend] },
      { n: 12, title: 'Voorzetsels (preposities)', learn: 'Je kiest het goede woord voor plaats en tijd.', examples: 'op maandag, in mei, naar school, met de bus', video: null, lessons: [A2.voorzetsels] },
      { n: 13, title: 'Ontkenning (negatie)', learn: 'Je kiest niet of geen.', examples: 'Ik heb geen tijd. Ik kom niet.', video: 'ontkenning', lessons: [A2.ontkenning] },
      { n: 14, title: 'Zinsbouw en inversie', learn: 'Je zet het werkwoord op de goede plek, ook in vragen.', examples: 'Ik werk vandaag thuis. Vandaag werk ik thuis. Werk je vandaag?', video: 'zinsbouw', lessons: [A2.hoofdzin, A2.inversie, A2.vragen, A2.zinAfMaken] },
      { n: 15, title: 'Voegwoorden 1 (conjuncties)', learn: 'Je maakt van twee zinnen één zin.', examples: 'en, maar, want, dus: Ik kom niet, want ik ben ziek.', video: 'voegwoorden-1', lessons: [A2.voegwoorden, A2.verbindingswoorden] },
      { n: 16, title: 'Voegwoorden 2 en bijzinnen (conjuncties)', learn: 'Je zet het werkwoord aan het eind van de zin.', examples: 'omdat, als, dat: Ik kom niet omdat ik ziek ben.', video: 'voegwoorden-2', lessons: [A2.bijzinOmdat, A2.bijzinDat] },
    ],
    spreken: [
      { n: 1, title: 'Persoonlijke en bezittelijke voornaamwoorden (personaal en possessief pronomen)', learn: 'Je praat over jezelf en anderen.', examples: 'Mijn naam is… Dat is mijn man. Hij helpt mij.', video: 'persoonlijke-vnw', lessons: [A2.persVnw, A2.persVnwLijdend, A2.bezittelijk] },
      { n: 2, title: 'Vergrotende en overtreffende trap (comparatief en superlatief)', learn: 'Je vergelijkt en kiest.', examples: 'Deze is goedkoper. Dit vind ik het leukst.', video: 'trappen', lessons: [A2.vergrotend, A2.overtreffend] },
      { n: 3, title: 'Werkwoorden: tegenwoordige tijd (presens)', learn: 'Je gebruikt de belangrijkste werkwoorden vlot.', examples: 'ik ben, ik heb, ik ga, ik woon, ik werk', video: 'regelmatige-ww', lessons: [A2.presens, A2.presensOnr] },
      { n: 4, title: 'Wederkerende werkwoorden (reflexieve werkwoorden)', learn: 'Je zegt hoe het met je gaat.', examples: 'Ik voel me goed. Ik vergis me.', video: 'wederkerende-ww', lessons: [A2.wederkerend] },
      { n: 5, title: 'Modale werkwoorden en beleefde vragen', learn: 'Je vraagt iets beleefd en zegt wat je wilt of moet.', examples: 'Mag ik iets vragen? Kunt u mij helpen? Ik wil graag…', video: 'modale-werkwoorden', lessons: [A2.modaal] },
      { n: 6, title: 'Scheidbare werkwoorden', learn: 'Je maakt een afspraak.', examples: 'Zullen we iets afspreken? Ik bel je morgen op.', video: 'scheidbare-werkwoorden', lessons: [A2.scheidbaar] },
      { n: 7, title: 'Voltooid tegenwoordige tijd (perfectum)', learn: 'Je vertelt over gisteren of het weekend.', examples: 'Ik heb gekookt. Ik ben naar de markt gegaan. Ik was ziek.', video: 'perfectum', lessons: [A2.perfectum, A2.perfectumOnr, A2.hebbenZijn] },
      { n: 8, title: 'Toekomende tijd (futurum)', learn: 'Je vertelt over je plannen.', examples: 'Ik ga morgen werken. Ik zal je bellen.', video: 'toekomende-tijd', lessons: [A2.futurum] },
      { n: 9, title: 'Ontkenning (negatie)', learn: 'Je zegt nee.', examples: 'Ik weet het niet. Ik heb geen auto.', video: 'ontkenning', lessons: [A2.ontkenning] },
      { n: 10, title: 'Er is, er zijn en voorzetsels', learn: 'Je zegt waar iets of iemand is.', examples: 'Er is een winkel naast het station. Ik ben bij de dokter.', video: 'er-en-daar', lessons: [A2.erIs, A2.voorzetsels] },
      { n: 11, title: 'Vraagzinnen en inversie', learn: 'Je stelt vragen en zet het werkwoord op de goede plek.', examples: 'Waar woon je? Morgen ga ik naar school.', video: 'zinsbouw', lessons: [A2.vragen, A2.inversie] },
      { n: 12, title: 'Voegwoorden en bijzinnen (conjuncties)', learn: 'Je zegt wat je vindt en waarom.', examples: 'Ik vind dat… Ik blijf thuis omdat ik moe ben. Ik heb liever…', video: 'voegwoorden-2', lessons: [A2.bijzinOmdat, A2.bijzinDat] },
    ],
  },
  b1: {
    lezen: [
      ...B1_HERHALING,
      { n: 4, title: 'Er, daar en waar (voornaamwoordelijk bijwoord)', learn: 'Je begrijpt waar er, daar en waar naar verwijzen.', examples: 'Ik heb er twee. Ik denk erover na. Het huis waarin ik woon.', video: 'er-1', lessons: [B1.erDaarWaar] },
      { n: 5, title: 'Ontkenning (negatie)', learn: 'Je begrijpt het verschil tussen nog niet, niet meer en pas.', examples: 'Hij rookt niet meer. De winkel gaat pas om tien uur open.', video: 'ontkenning', lessons: [B1.ontkenning] },
      { n: 6, title: 'Vergrotende en overtreffende trap (comparatief en superlatief)', learn: 'Je begrijpt vergelijkingen in teksten.', examples: 'net zo duur als, steeds meer, hoe eerder hoe beter', video: 'trappen', lessons: [B1.vergelijken] },
      { n: 7, title: 'Werkwoordstijden herkennen (imperfectum, perfectum, plusquamperfectum)', learn: 'Je ziet in welke volgorde dingen gebeurd zijn.', examples: 'Toen ik aankwam, was de trein al vertrokken.', video: 'perfectum-imperfectum', lessons: [B1.tijdenHerkennen] },
      { n: 8, title: 'Zou en zouden (conditionalis)', learn: 'Je begrijpt adviezen, wensen en situaties die niet echt zijn.', examples: 'U zou een afspraak moeten maken. Als ik tijd had, zou ik komen.', video: 'zou-1', lessons: [B1.zou] },
      { n: 9, title: 'Lijdende vorm (passief)', learn: 'Je begrijpt formele teksten, regels en nieuwsberichten.', examples: 'Het formulier moet worden ingevuld. Het gebouw werd in 1920 gebouwd.', video: 'lijdende-vorm-1', lessons: [B1.lijdend] },
      { n: 10, title: 'Om te + infinitief', learn: 'Je herkent zinnen met te, om te en zonder te.', examples: 'Het is moeilijk om dat uit te leggen. Hij vertrok zonder te betalen.', video: 'om-te', lessons: [B1.teInfinitief] },
      { n: 11, title: 'Bijzinnen (conjuncties)', learn: 'Je begrijpt lange zinnen met hoewel, zodat, doordat en nadat.', examples: 'Hoewel hij ziek was, ging hij naar zijn werk.', video: 'voegwoorden-2', lessons: [B1.bijzinnen] },
      { n: 12, title: 'Betrekkelijke voornaamwoorden (relatief pronomen)', learn: 'Je begrijpt over wie of wat de bijzin gaat.', examples: 'de collega met wie ik werk, alles wat je nodig hebt', video: 'betrekkelijke-vnw-1', lessons: [B1.betrekkelijk] },
      { n: 13, title: 'Indirecte rede', learn: 'Je begrijpt wat iemand anders gezegd of gevraagd heeft.', examples: 'De dokter zegt dat ik moet rusten. Ze vroeg of ik ook kwam.', video: 'indirecte-rede', lessons: [B1.indirecteRede] },
      { n: 14, title: 'Signaalwoorden en voegwoorden (conjuncties)', learn: 'Je volgt de opbouw en de argumenten van een tekst.', examples: 'daarom, daardoor, bovendien, echter, ten eerste, kortom', video: 'voegwoorden-b1', lessons: [B1.signaalwoorden] },
    ],
    luisteren: [
      ...B1_HERHALING,
      { n: 4, title: 'Ontkenning (negatie)', learn: 'Je hoort het verschil tussen nog niet, niet meer en geen … meer.', examples: 'Ik heb nog geen antwoord. Er is geen plek meer.', video: 'ontkenning', lessons: [B1.ontkenning] },
      { n: 5, title: 'Modale werkwoorden en hoeven', learn: 'Je hoort wat moet, mag of niet hoeft.', examples: 'U hoeft niet te betalen. U mag hier niet fietsen.', video: 'moeten-hoeven', lessons: [B1.modaalHoeven] },
      { n: 6, title: 'Scheidbare werkwoorden', learn: 'Je herkent het werkwoord, ook als de delen ver uit elkaar staan.', examples: 'Ik bel u morgen even terug. …dat ik u morgen terugbel.', video: 'scheidbare-ww-b1', lessons: [B1.scheidbaar] },
      { n: 7, title: 'Werkwoordstijden herkennen (imperfectum, perfectum, futurum)', learn: 'Je hoort of iets al gebeurd is, nu bezig is of nog komt.', examples: 'Ik was aan het koken toen je belde. Het zal wel druk worden.', video: 'perfectum-imperfectum', lessons: [B1.tijdenHerkennen] },
      { n: 8, title: 'Zou en zouden (conditionalis)', learn: 'Je begrijpt beleefde verzoeken en adviezen.', examples: 'Zou u even willen wachten? Je zou met je huisarts moeten praten.', video: 'zou-1', lessons: [B1.zou] },
      { n: 9, title: 'Indirecte vragen en indirecte rede', learn: 'Je begrijpt vragen en berichten die iemand doorgeeft.', examples: 'Weet u waar het station is? Hij vroeg of je terugbelt.', video: 'indirecte-rede', lessons: [B1.indirecteRede] },
      { n: 10, title: 'Bijzinnen (conjuncties)', learn: 'Je hoort de reden, het gevolg of de voorwaarde.', examples: '…doordat de trein vertraging had. …tenzij het regent.', video: 'voegwoorden-2', lessons: [B1.bijzinnen] },
      { n: 11, title: 'Signaalwoorden en voegwoorden (conjuncties)', learn: 'Je volgt de opbouw van een verhaal of nieuwsbericht.', examples: 'eerst, daarna, bovendien, daarom, toch', video: 'voegwoorden-b1', lessons: [B1.signaalwoorden] },
    ],
    schrijven: [
      ...B1_HERHALING,
      { n: 4, title: 'Bijvoeglijke naamwoorden (adjectief)', learn: 'Je schrijft bijvoeglijke naamwoorden goed, ook na iets en niets.', examples: 'iets leuks, niets nieuws, het oude huis, een oud huis', video: null, lessons: [B1.bijvoeglijk] },
      { n: 5, title: 'Vergrotende en overtreffende trap (comparatief en superlatief)', learn: 'Je vergelijkt en weegt dingen af.', examples: 'net zo groot als, minder duur dan, het meest geschikt', video: 'trappen', lessons: [B1.vergelijken] },
      { n: 6, title: 'Er, daar en waar (voornaamwoordelijk bijwoord)', learn: 'Je verwijst terug zonder woorden te herhalen.', examples: 'Ik heb erover nagedacht. Daar ben ik het mee eens.', video: 'er-1', lessons: [B1.erDaarWaar] },
      { n: 7, title: 'Werkwoorden met een vast voorzetsel', learn: 'Je kiest het juiste voorzetsel bij het werkwoord.', examples: 'wachten op, denken aan, zich ergeren aan, reageren op', video: null, lessons: [B1.vasteVoorzetsels] },
      { n: 8, title: 'Werkwoordspelling (presens, imperfectum, perfectum)', learn: 'Je schrijft alle werkwoordsvormen goed, ook de d/t-vormen.', examples: 'hij vindt, ik vond, hij antwoordde, ik heb gewacht', video: 'verleden-tijd', lessons: [B1.werkwoordspelling] },
      { n: 9, title: 'Voltooid verleden tijd (plusquamperfectum)', learn: 'Je schrijft wat eerder gebeurd was.', examples: 'Ik had het formulier al opgestuurd.', video: null, lessons: [B1.plusquamperfectum] },
      { n: 10, title: 'Modale werkwoorden in de voltooide tijd', learn: 'Je schrijft over wat je moest, kon of wilde.', examples: 'Ik heb niet kunnen komen. Ik had eerder willen bellen.', video: null, lessons: [B1.modaalVoltooid] },
      { n: 11, title: 'Zou en zouden (conditionalis)', learn: 'Je schrijft beleefde verzoeken en situaties die niet echt zijn.', examples: 'Zou u mij kunnen laten weten…? Als ik het had geweten, zou ik gebeld hebben.', video: 'zou-1', lessons: [B1.zou] },
      { n: 12, title: 'Lijdende vorm (passief)', learn: 'Je schrijft formeel en zakelijk.', examples: 'Het pakket is gisteren bezorgd. Er wordt nog naar gekeken.', video: 'lijdende-vorm-1', lessons: [B1.lijdend] },
      { n: 13, title: 'Te + infinitief', learn: 'Je gebruikt om te, zonder te en door te.', examples: 'Ik schrijf u om informatie te vragen. Door veel te oefenen, …', video: 'te-infinitief', lessons: [B1.teInfinitief] },
      { n: 14, title: 'Zinsbouw met meer werkwoorden', learn: 'Je zet meerdere werkwoorden in de juiste volgorde.', examples: '…omdat ik niet heb kunnen komen.', video: 'zinsbouw-b1', lessons: [B1.werkwoordsvolgorde] },
      { n: 15, title: 'Bijzinnen (conjuncties)', learn: 'Je verbindt zinnen met hoewel, zodat, doordat, nadat en voordat.', examples: 'Ik bel u nadat ik de brief heb gelezen.', video: 'voegwoorden-b1', lessons: [B1.bijzinnen] },
      { n: 16, title: 'Betrekkelijke voornaamwoorden (relatief pronomen)', learn: 'Je schrijft langere zinnen met die, dat, wie, wat en waar.', examples: 'de medewerker met wie ik sprak, het product waarover ik klaag', video: 'betrekkelijke-vnw-1', lessons: [B1.betrekkelijk] },
      { n: 17, title: 'Indirecte rede', learn: 'Je geeft weer wat iemand gezegd of gevraagd heeft.', examples: 'Mijn buurman zei dat hij geen tijd had. Ik wil graag weten of…', video: 'indirecte-rede', lessons: [B1.indirecteRede] },
      { n: 18, title: 'Signaalwoorden en voegwoorden (conjuncties)', learn: 'Je bouwt een tekst logisch op en geeft argumenten.', examples: 'ten eerste, bovendien, daarom, echter, kortom', video: 'voegwoorden-2', lessons: [B1.signaalwoorden] },
    ],
    spreken: [
      ...B1_HERHALING,
      { n: 4, title: 'Vergrotende en overtreffende trap (comparatief en superlatief)', learn: 'Je vergelijkt en zegt wat je voorkeur heeft.', examples: 'Ik woon liever in de stad dan in een dorp. Dit vind ik het belangrijkst.', video: 'trappen', lessons: [B1.vergelijken] },
      { n: 5, title: 'Er, daar en waar (voornaamwoordelijk bijwoord)', learn: 'Je verwijst terug in een gesprek.', examples: 'Daar heb ik geen zin in. Ik denk er nog over na.', video: 'er-1', lessons: [B1.erDaarWaar] },
      { n: 6, title: 'Werkwoorden met een vast voorzetsel', learn: 'Je gebruikt vaste combinaties in een gesprek.', examples: 'Ik kijk uit naar… Ik ben bang voor… Ik houd van…', video: null, lessons: [B1.vasteVoorzetsels] },
      { n: 7, title: 'Wederkerende werkwoorden (reflexieve werkwoorden)', learn: 'Je praat over gevoelens en herinneringen.', examples: 'Ik herinner me dat… Ik erger me aan… Ik bereid me voor.', video: 'wederkerende-ww', lessons: [B1.wederkerend] },
      { n: 8, title: 'Verleden tijd en voltooide tijd (imperfectum en perfectum)', learn: 'Je vertelt een verhaal over vroeger.', examples: 'Toen ik in Nederland kwam, sprak ik nog geen Nederlands. Ik heb toen een cursus gedaan.', video: 'perfectum-imperfectum', lessons: [B1.verledenVertellen] },
      { n: 9, title: 'Zijn aan het + infinitief', learn: 'Je zegt waar je mee bezig bent of was.', examples: 'Ik ben aan het koken. Ik was aan het werken toen je belde.', video: 'aan-het', lessons: [B1.aanHet] },
      { n: 10, title: 'Toekomende tijd (futurum)', learn: 'Je praat over plannen en verwachtingen.', examples: 'Ik zal het morgen regelen. Het zal wel meevallen.', video: 'toekomende-tijd', lessons: [B1.futurum] },
      { n: 11, title: 'Zou en zouden (conditionalis)', learn: 'Je geeft advies, noemt een wens en praat over situaties die niet echt zijn.', examples: 'Je zou eens … moeten. Ik zou graag… Als ik meer tijd had, zou ik…', video: 'zou-1', lessons: [B1.zou] },
      { n: 12, title: 'Hoeven en te + infinitief', learn: 'Je zegt wat niet nodig is en wat je probeert of van plan bent.', examples: 'Je hoeft niet te komen. Ik probeer elke dag te oefenen.', video: 'te-infinitief', lessons: [B1.modaalHoeven, B1.teInfinitief] },
      { n: 13, title: 'Bijzinnen (conjuncties)', learn: 'Je geeft redenen, gevolgen en voorwaarden.', examples: '…doordat de bus te laat was. …zodat ik op tijd ben. …tenzij het regent.', video: 'voegwoorden-b1', lessons: [B1.bijzinnen] },
      { n: 14, title: 'Indirecte rede', learn: 'Je vertelt na wat iemand gezegd of gevraagd heeft.', examples: 'Hij zei dat hij later kwam. Ze vroeg of ik mee wilde.', video: 'indirecte-rede', lessons: [B1.indirecteRede] },
      { n: 15, title: 'Mening geven en argumenteren (conjuncties)', learn: 'Je geeft je mening, reageert op anderen en onderbouwt je mening.', examples: 'Ik ben het (niet) met je eens. Volgens mij… Daarom vind ik…', video: null, lessons: [B1.meningGeven] },
    ],
  },
};

/**
 * Lessen uit het eigen blok B van een cursus die geen onderwerp dekt — uitspraak, klank,
 * hoofdletters. Ze blijven bereikbaar als een korte reeks ná de onderwerpen, zodat de
 * herindeling geen nagekeken les uit de cursus laat vallen.
 */
export const GRAMMAR_EXTRAS: Partial<Record<`${Level}:${SkillSlug}`, { title: string; lessons: LessonRef[] }>> = {
  'a2:luisteren': {
    title: 'Klank en nadruk',
    lessons: ['a2:luisteren:b3-klanken-die-lijken', 'a2:luisteren:b4-klemtoon-en-nadruk'],
  },
  'a2:schrijven': {
    title: 'Spelling',
    lessons: ['a2:schrijven:b4-hoofdletters-leestekens'],
  },
  'a2:spreken': {
    title: 'Uitspraak',
    lessons: [
      'a2:spreken:b1-klanken-ui-eu-ij', 'a2:spreken:b2-lijk-en-ig', 'a2:spreken:b3-ng-en-nk',
      'a2:spreken:b4-uw-ouw-auw', 'a2:spreken:b5-tie-en-sch', 'a2:spreken:b6-klemtoon',
    ],
  },
};

export function grammarTopics(level: Level, onderdeel: SkillSlug): GrammarTopic[] {
  return GRAMMAR_SYLLABUS[level][onderdeel];
}

export function grammarTopic(level: Level, onderdeel: SkillSlug, n: number): GrammarTopic | null {
  return grammarTopics(level, onderdeel).find(t => t.n === n) ?? null;
}

export function videoOf(topic: GrammarTopic): GrammarVideo | null {
  return topic.video ? VIDEOS[topic.video] : null;
}

export function parseLessonRef(ref: LessonRef): { level: Level; onderdeel: SkillSlug; slug: string } {
  const [level, onderdeel, slug] = ref.split(':') as [Level, SkillSlug, string];
  return { level, onderdeel, slug };
}
