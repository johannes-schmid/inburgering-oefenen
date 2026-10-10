/**
 * De B1-conceptenbibliotheek: het regelhuis van B1. Met de hand vastgelegd, in git.
 *
 * ── WAAR DIT VANDAAN KOMT ────────────────────────────────────────────────────
 * Afgeleid uit de B1-opzet van de eigenaar in `data/grammar-syllabus.ts` (oktober 2026). Elk
 * B1-onderwerp daar wijst naar één les `b1:lezen:bN-<slug>`; elk van die 24 lessen legt hier
 * precies één concept uit, met dezelfde slug zonder het `bN-`-voorvoegsel. De volgorde van
 * `B1_CONCEPTS` ís de lesvolgorde van blok B (b1 … b24) en moet dus gelijk blijven aan de
 * `B1`-constante in de syllabus — `tests-unit/lesson-syllabus.test.ts` bewaakt dat.
 *
 * B1 is niet A2 met zwaardere voorbeelden: de B1-onderwerpen gaan over nog niet / niet meer /
 * pas, de plusquamperfectum, zou, de lijdende vorm met modaal werkwoord, hoewel/zodat/tenzij.
 * De *Herhaling A2*-rijen van de opzet wijzen naar A2-lessen en staan hier dus niet.
 *
 * ── `onderdelen` IS WAT DE OPZET ZEGT, `kern` IS DE AFWEGING ─────────────────
 * `onderdelen` = de B1-cursussen waarvan een onderwerp naar deze les wijst. Niet afgewogen
 * maar overgenomen; de test vergelijkt het met de syllabus, dus een nieuwe verwijzing daar
 * zonder aanpassing hier is een rode test en geen stille scheefgroei.
 *
 * `kern` volgt dezelfde maatstaf als `concepts-a2.mjs`: bij Schrijven en Spreken bouw je de zin
 * zelf, dus daar is elke regel kern. Bij Lezen en Luisteren alleen als een gemiste vorm de
 * betekenis omdraait — `niet meer` tegen `nog niet`, `hoewel` tegen `omdat`, `zou moeten`
 * tegen `moet`, wat eerder gebeurde. Een lijdende vorm of een betrekkelijk voornaamwoord
 * herkennen is bij Lezen genoeg.
 *
 * ── `lesson_note` ────────────────────────────────────────────────────────────
 * Wat de les moet behandelen: de som van wat de onderwerpen in álle onderdelen beloven. Een
 * B1-les dekt vaak meer vormen dan één A2-les (b8 heeft zes voegwoorden), en zonder deze lijst
 * schrijft het model een les over de eerste twee. Zelfde veld als in `concepts-a2.mjs`; alleen
 * de grammaticabrief in `author.mjs` leest het, het gaat niet de database in.
 */

export const B1_GROUPS = [
  { slug: 'zinnen-bouwen',          name_nl: 'Zinnen bouwen',           sort_order: 10 },
  { slug: 'werkwoorden-tijd',       name_nl: 'Werkwoorden & tijd',      sort_order: 20 },
  { slug: 'soorten-werkwoorden',    name_nl: 'Soorten werkwoorden',     sort_order: 30 },
  { slug: 'woorden-verbuigen',      name_nl: 'Woorden verbuigen',       sort_order: 40 },
  { slug: 'verwijzen-verbinden',    name_nl: 'Verwijzen en verbinden',  sort_order: 50 },
];

const ALL = ['lezen', 'luisteren', 'schrijven', 'spreken'];
const PRODUCTIEF = ['schrijven', 'spreken'];

/** Waar je hem zelf goed moet doen: productief altijd, receptief alleen als hij de betekenis draagt. */
const BETEKENIS = new Set([
  'ontkenning', 'vergelijken', 'tijden-herkennen', 'zou-zouden', 'bijzinnen',
  'indirecte-rede', 'signaalwoorden', 'modale-hoeven',
]);

function kernFor(slug, onderdelen) {
  return onderdelen.filter(o => PRODUCTIEF.includes(o) || BETEKENIS.has(slug));
}

/** Eén concept, met `kern` afgeleid. */
function concept(c) {
  return { kind: 'grammatica', ...c, kern: kernFor(c.slug, c.onderdelen) };
}

/** De 24 concepten, in lesvolgorde b1 … b24. */
export const B1_CONCEPTS = [
  concept({
    slug: 'er-daar-waar', name_nl: 'er, daar en waar', group: 'verwijzen-verbinden', sort_order: 510,
    onderdelen: ['lezen', 'schrijven', 'spreken'],
    one_liner: 'Met er, daar en waar verwijs je terug zonder het woord te herhalen.',
    example_html: 'Ik heb <mark>erover</mark> nagedacht.',
    lesson_note: 'er bij een getal (Ik heb er twee); er + voorzetsel als verwijzing (erover, eraan, ermee: Ik denk erover na); daar + voorzetsel aan het begin van de zin (Daar ben ik het mee eens; Daar heb ik geen zin in); waar + voorzetsel in een bijzin (het huis waarin ik woon); het voorzetsel splitst af naar het eind (Ik denk er nog over na).',
  }),
  concept({
    slug: 'ontkenning', name_nl: 'nog niet, niet meer, pas', group: 'verwijzen-verbinden', sort_order: 520,
    onderdelen: ['lezen', 'luisteren'],
    one_liner: 'nog niet, niet meer en pas lijken op elkaar, maar betekenen iets anders.',
    example_html: 'Hij rookt <mark>niet meer</mark>.',
    lesson_note: 'nog niet (het gebeurt later wel); niet meer (vroeger wel, nu niet); nog geen en geen … meer (Ik heb nog geen antwoord; Er is geen plek meer); pas (later dan je denkt: De winkel gaat pas om tien uur open); het verschil horen en lezen in een snelle zin.',
  }),
  concept({
    slug: 'vergelijken', name_nl: 'net zo … als, steeds meer', group: 'woorden-verbuigen', sort_order: 410,
    onderdelen: ['lezen', 'schrijven', 'spreken'],
    one_liner: 'Vergelijken op B1: gelijk, minder, steeds meer en hoe … hoe.',
    example_html: 'Deze fiets is <mark>net zo duur als</mark> die.',
    lesson_note: 'net zo … als (net zo duur als, net zo groot als); minder … dan (minder duur dan); steeds meer / steeds + vergrotende trap; hoe eerder hoe beter; liever … dan (Ik woon liever in de stad dan in een dorp); het meest + bijvoeglijk naamwoord (het meest geschikt) en het belangrijkst.',
  }),
  concept({
    slug: 'tijden-herkennen', name_nl: 'Welke tijd is het?', group: 'werkwoorden-tijd', sort_order: 210,
    onderdelen: ['lezen', 'luisteren'],
    one_liner: 'Aan het werkwoord zie en hoor je wat eerst gebeurde en wat nog komt.',
    example_html: 'Toen ik aankwam, <mark>was</mark> de trein al <mark>vertrokken</mark>.',
    lesson_note: 'imperfectum (ik werkte, hij ging), perfectum (ik heb gewerkt), plusquamperfectum (was vertrokken, had gegeten) en futurum met zullen (Het zal wel druk worden) naast elkaar herkennen; de volgorde van gebeurtenissen uit de tijden afleiden; was aan het + infinitief als bezig zijn in het verleden (Ik was aan het koken toen je belde).',
  }),
  concept({
    slug: 'zou-zouden', name_nl: 'zou en zouden', group: 'werkwoorden-tijd', sort_order: 220,
    onderdelen: ALL,
    one_liner: 'Met zou geef je advies, vraag je beleefd iets en praat je over wat niet echt is.',
    example_html: 'U <mark>zou</mark> een afspraak <mark>moeten</mark> maken.',
    lesson_note: 'advies: je zou … moeten; beleefd verzoek: Zou u even willen wachten? Zou u mij kunnen laten weten…?; wens: Ik zou graag…; situatie die niet echt is: Als ik tijd had, zou ik komen; verleden die niet gebeurd is: Als ik het had geweten, zou ik gebeld hebben; het werkwoord achteraan.',
  }),
  concept({
    slug: 'lijdende-vorm', name_nl: 'De lijdende vorm', group: 'werkwoorden-tijd', sort_order: 230,
    onderdelen: ['lezen', 'schrijven'],
    one_liner: 'In formele teksten staat vaak niet wie het doet: het formulier wordt ingevuld.',
    example_html: 'Het formulier <mark>moet worden ingevuld</mark>.',
    lesson_note: 'worden + voltooid deelwoord in het presens (wordt verstuurd); werd/werden in het verleden (Het gebouw werd in 1920 gebouwd); is/zijn + voltooid deelwoord voor voltooid (Het pakket is gisteren bezorgd); met een modaal werkwoord (moet worden ingevuld); door + de doener; er wordt … (Er wordt nog naar gekeken); formele brieven, regels en nieuwsberichten.',
  }),
  concept({
    slug: 'te-infinitief', name_nl: 'om te, zonder te, door te', group: 'zinnen-bouwen', sort_order: 110,
    onderdelen: ['lezen', 'schrijven', 'spreken'],
    one_liner: 'te + het hele werkwoord, met om, zonder of door ervoor — of na proberen.',
    example_html: 'Hij vertrok <mark>zonder te betalen</mark>.',
    lesson_note: 'om … te voor een doel (Ik schrijf u om informatie te vragen); zonder … te (Hij vertrok zonder te betalen); door … te voor de manier (Door veel te oefenen, …); te na proberen, van plan zijn, beginnen, vergeten (Ik probeer elke dag te oefenen; Ik ben van plan te verhuizen); Het is moeilijk om … te; scheidbaar werkwoord met te ertussen (uit te leggen).',
  }),
  concept({
    slug: 'bijzinnen', name_nl: 'hoewel, zodat, doordat, tenzij', group: 'zinnen-bouwen', sort_order: 120,
    onderdelen: ALL,
    one_liner: 'Na deze woorden staat het werkwoord achteraan. Elk woord geeft een ander verband.',
    example_html: '<mark>Hoewel</mark> hij ziek was, ging hij naar zijn werk.',
    lesson_note: 'hoewel (tegenstelling); zodat (gevolg/doel); doordat (oorzaak); nadat en voordat (tijdsvolgorde: Ik bel u nadat ik de brief heb gelezen); tenzij (voorwaarde: …tenzij het regent); werkwoorden achteraan in de bijzin; bijzin vooraan geeft inversie in de hoofdzin (Hoewel hij ziek was, ging hij…); doordat versus omdat en zodat.',
  }),
  concept({
    slug: 'betrekkelijk-vnw', name_nl: 'die, dat, wie, wat, waar', group: 'zinnen-bouwen', sort_order: 130,
    onderdelen: ['lezen', 'schrijven'],
    one_liner: 'Met een betrekkelijk voornaamwoord zeg je meer over een persoon of ding.',
    example_html: 'de collega <mark>met wie</mark> ik werk',
    lesson_note: 'die bij de-woorden en meervoud, dat bij het-woorden; voorzetsel + wie bij personen (de medewerker met wie ik sprak); wat na alles, iets, niets (alles wat je nodig hebt); waar + voorzetsel bij dingen (het product waarover ik klaag); werkwoord achteraan in de bijzin; begrijpen naar wie of wat de bijzin verwijst.',
  }),
  concept({
    slug: 'indirecte-rede', name_nl: 'Hij zei dat… — Ze vroeg of…', group: 'zinnen-bouwen', sort_order: 140,
    onderdelen: ALL,
    one_liner: 'Je vertelt na wat iemand zei of vroeg. Het werkwoord gaat naar achteren.',
    example_html: 'Ze vroeg <mark>of ik ook kwam</mark>.',
    lesson_note: 'zeggen dat … (De dokter zegt dat ik moet rusten); vragen of … bij een ja/nee-vraag (Ze vroeg of ik mee wilde); vraagwoord als verbinding bij een indirecte vraag (Weet u waar het station is?); de tijd en het persoonlijk voornaamwoord veranderen mee in het verleden (Mijn buurman zei dat hij geen tijd had); beleefd: Ik wil graag weten of…',
  }),
  concept({
    slug: 'signaalwoorden', name_nl: 'daarom, bovendien, echter, kortom', group: 'verwijzen-verbinden', sort_order: 530,
    onderdelen: ['lezen', 'luisteren', 'schrijven'],
    one_liner: 'Signaalwoorden laten zien hoe een tekst is opgebouwd: reden, gevolg, tegenstelling, conclusie.',
    example_html: 'De bus was te laat. <mark>Daardoor</mark> miste ik mijn afspraak.',
    lesson_note: 'opsomming en volgorde: ten eerste, eerst, daarna, bovendien; gevolg en reden: daarom, daardoor; tegenstelling: echter, toch, maar; conclusie: kortom; inversie na daarom/daardoor/toch/bovendien aan het begin van de zin; de opbouw van een tekst of nieuwsbericht volgen en zelf een argument opbouwen.',
  }),
  concept({
    slug: 'modale-hoeven', name_nl: 'moeten, mogen, hoeven … te', group: 'soorten-werkwoorden', sort_order: 310,
    onderdelen: ['luisteren', 'spreken'],
    one_liner: 'Moet het, mag het, of hoeft het niet? Na hoeven komt altijd te.',
    example_html: 'U <mark>hoeft</mark> niet <mark>te</mark> betalen.',
    lesson_note: 'moeten (verplicht); mogen en niet mogen (toegestaan / verboden: U mag hier niet fietsen); niet hoeven … te (niet nodig: Je hoeft niet te komen); hoeven alleen met niet of geen; het verschil tussen moet niet, hoeft niet en mag niet horen; het tweede werkwoord achteraan.',
  }),
  concept({
    slug: 'scheidbare-werkwoorden', name_nl: 'Scheidbare werkwoorden ver uit elkaar', group: 'soorten-werkwoorden', sort_order: 320,
    onderdelen: ['luisteren'],
    one_liner: 'Het tweede deel staat soms ver achteraan, en in een bijzin plakt het weer vast.',
    example_html: 'Ik <mark>bel</mark> u morgen even <mark>terug</mark>.',
    lesson_note: 'in de hoofdzin staat het eerste deel ver van het werkwoord (Ik bel u morgen even terug); in de bijzin weer aan elkaar (…dat ik u morgen terugbel); met een modaal werkwoord aan elkaar achteraan (Ik wil u terugbellen); het werkwoord herkennen als de delen ver uit elkaar staan; betekenisverschil door het eerste deel (opbellen, terugbellen).',
  }),
  concept({
    slug: 'bijvoeglijk-naamwoord', name_nl: 'iets leuks, het oude huis', group: 'woorden-verbuigen', sort_order: 420,
    onderdelen: ['schrijven'],
    one_liner: 'Met of zonder -e, en na iets en niets een -s.',
    example_html: '<mark>iets leuks</mark>, <mark>niets nieuws</mark>',
    lesson_note: '-e na de, het, deze, die, mijn (het oude huis); geen -e bij een het-woord na een, geen of zonder lidwoord (een oud huis); -s na iets, niets, veel, weinig (iets leuks, niets nieuws); stofnamen en -en-bijvoeglijke naamwoorden (houten, gouden) krijgen geen -e; spelling: een korte klinker verdubbelt de medeklinker (wit → witte), een lange klinker verliest een letter (groot → grote).',
  }),
  concept({
    slug: 'vaste-voorzetsels', name_nl: 'Werkwoorden met een vast voorzetsel', group: 'soorten-werkwoorden', sort_order: 330,
    onderdelen: ['schrijven', 'spreken'],
    one_liner: 'Bij veel werkwoorden hoort altijd hetzelfde voorzetsel. Leer ze samen.',
    example_html: 'Ik <mark>kijk uit naar</mark> uw antwoord.',
    lesson_note: 'wachten op, denken aan, reageren op, houden van, zorgen voor; zich ergeren aan, zich voorbereiden op; bang zijn voor, uitkijken naar, het eens zijn met; het voorzetsel blijft bij het werkwoord ook in een vraag of bijzin; er/daar + voorzetsel als je het ding niet herhaalt (Ik wacht erop).',
  }),
  concept({
    slug: 'werkwoordspelling', name_nl: 'd of t, -de of -te', group: 'werkwoorden-tijd', sort_order: 240,
    onderdelen: ['schrijven'],
    one_liner: 'Hij vindt, ik vond, hij antwoordde: alle vormen goed schrijven.',
    example_html: 'Hij <mark>antwoordde</mark> meteen.',
    lesson_note: 'presens: stam + t bij hij/zij/het en jij (hij vindt, hij wordt), geen t bij inversie met jij (vind jij); imperfectum regelmatig: -te of -de met de regel van \'t kofschip (ik wachtte, hij antwoordde); imperfectum onregelmatig (ik vond, hij ging); voltooid deelwoord met -t of -d (ik heb gewacht, ik heb gebeld); veelgemaakte fouten: wordt/word, vind/vindt, gebeurd/gebeurt.',
  }),
  concept({
    slug: 'plusquamperfectum', name_nl: 'Ik had het al gedaan', group: 'werkwoorden-tijd', sort_order: 250,
    onderdelen: ['schrijven'],
    one_liner: 'had of was + voltooid deelwoord: wat eerder gebeurd was dan iets anders in het verleden.',
    example_html: 'Ik <mark>had</mark> het formulier al <mark>opgestuurd</mark>.',
    lesson_note: 'had + voltooid deelwoord (Ik had het formulier al opgestuurd); was + voltooid deelwoord bij beweging en verandering (Toen ik aankwam, was de trein al vertrokken); combineren met imperfectum in één zin met toen of nadat; hebben of zijn kiezen zoals in de voltooide tijd.',
  }),
  concept({
    slug: 'modale-voltooid', name_nl: 'Ik heb niet kunnen komen', group: 'soorten-werkwoorden', sort_order: 340,
    onderdelen: ['schrijven'],
    one_liner: 'In de voltooide tijd staan modale werkwoorden als infinitief: heb kunnen komen.',
    example_html: 'Ik <mark>heb</mark> niet <mark>kunnen komen</mark>.',
    lesson_note: 'heb/heeft + modaal werkwoord als infinitief + hoofdwerkwoord (Ik heb niet kunnen komen; Ik heb moeten werken); had + … willen (Ik had eerder willen bellen) voor iets wat niet gebeurd is; geen gekund/gemoeten als er een ander werkwoord bij staat; met een bijzin: …omdat ik niet heb kunnen komen.',
  }),
  concept({
    slug: 'werkwoordsvolgorde', name_nl: 'Meer werkwoorden achteraan', group: 'zinnen-bouwen', sort_order: 150,
    onderdelen: ['schrijven'],
    one_liner: 'Twee of drie werkwoorden achteraan in de zin: in welke volgorde?',
    example_html: '…omdat ik niet <mark>heb kunnen komen</mark>.',
    lesson_note: 'in de hoofdzin: persoonsvorm op plaats twee, de andere werkwoorden achteraan (Ik had eerder willen bellen); in de bijzin alle werkwoorden achteraan (…omdat ik niet heb kunnen komen); de gewone volgorde: persoonsvorm, modaal werkwoord, hoofdwerkwoord; te + infinitief achteraan; scheidbaar werkwoord blijft aan elkaar in de cluster (…dat ik hem heb willen opbellen).',
  }),
  concept({
    slug: 'wederkerende-werkwoorden', name_nl: 'Ik herinner me…', group: 'soorten-werkwoorden', sort_order: 350,
    onderdelen: ['spreken'],
    one_liner: 'Werkwoorden met me, je, zich, ons: vaak over gevoelens en herinneringen.',
    example_html: 'Ik <mark>herinner me</mark> dat ik toen heel zenuwachtig was.',
    lesson_note: 'de vormen me, je, zich, ons, jullie/je, zich; zich herinneren, zich ergeren aan, zich voorbereiden op, zich voelen, zich vergissen, zich zorgen maken; de plek van het wederkerend voornaamwoord na de persoonsvorm en bij inversie (Gisteren voelde ik me…); in een bijzin (…dat ik me erger aan…).',
  }),
  concept({
    slug: 'verleden-vertellen', name_nl: 'Een verhaal over vroeger', group: 'werkwoorden-tijd', sort_order: 260,
    onderdelen: ['spreken'],
    one_liner: 'Imperfectum voor de achtergrond, perfectum voor wat je gedaan hebt.',
    example_html: 'Toen ik in Nederland <mark>kwam</mark>, <mark>sprak</mark> ik nog geen Nederlands.',
    lesson_note: 'imperfectum voor een situatie of achtergrond in het verleden (Toen ik in Nederland kwam, sprak ik nog geen Nederlands); perfectum voor een afgerond feit (Ik heb toen een cursus gedaan); toen + bijzin met imperfectum; veelgebruikte onregelmatige vormen (kwam, sprak, was, had, ging); afwisselen binnen één verhaal.',
  }),
  concept({
    slug: 'aan-het', name_nl: 'Ik ben aan het koken', group: 'werkwoorden-tijd', sort_order: 270,
    onderdelen: ['spreken'],
    one_liner: 'zijn + aan het + het hele werkwoord: waar je nu of toen mee bezig was.',
    example_html: 'Ik <mark>ben aan het koken</mark>.',
    lesson_note: 'ben/is/zijn aan het + infinitief (Ik ben aan het koken); was/waren aan het in het verleden (Ik was aan het werken toen je belde); met een lijdend voorwerp ervoor (Ik ben de was aan het doen); het verschil met de gewone tegenwoordige tijd.',
  }),
  concept({
    slug: 'toekomende-tijd', name_nl: 'zullen en gaan', group: 'werkwoorden-tijd', sort_order: 280,
    onderdelen: ['spreken'],
    one_liner: 'Met zullen beloof of verwacht je iets; met gaan zeg je wat je van plan bent.',
    example_html: 'Ik <mark>zal</mark> het morgen <mark>regelen</mark>.',
    lesson_note: 'zullen voor een belofte (Ik zal het morgen regelen); zullen voor een verwachting (Het zal wel meevallen); gaan + infinitief voor een plan (Ik ga volgend jaar verhuizen); presens met een tijdwoord (Morgen bel ik je); zullen we … als voorstel.',
  }),
  concept({
    slug: 'mening-geven', name_nl: 'Je mening geven en onderbouwen', group: 'verwijzen-verbinden', sort_order: 540,
    onderdelen: ['spreken'],
    one_liner: 'Zeg wat je vindt, reageer op een ander en geef een reden.',
    example_html: '<mark>Volgens mij</mark> is dat een goed plan, <mark>omdat</mark> …',
    lesson_note: 'mening geven: Ik vind dat…, Volgens mij…, Ik denk dat…; reageren: Ik ben het (niet) met je eens, Daar ben ik het mee eens, Dat klopt, maar…; onderbouwen: omdat, want, daarom (Daarom vind ik…); inversie na volgens mij en daarom; werkwoord achteraan na dat en omdat.',
  }),
];

/** Welke B1-concepten horen bij dit onderdeel. */
export function b1ConceptsFor(onderdeel) {
  return B1_CONCEPTS.filter(c => c.onderdelen.includes(onderdeel));
}

/** Het B1-regelhuis: élk concept heeft een les, in deze volgorde (b1 … b24). */
export function b1RulesHomeConcepts() {
  return B1_CONCEPTS.filter(c => c.kind === 'grammatica');
}
