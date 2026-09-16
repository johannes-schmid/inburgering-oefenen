/**
 * The authoring plan: what each of the thirty B1 oefenexamens is *about*, decided here rather
 * than left to the generator.
 *
 * ## Why a plan file exists at all
 * Ask a model for "a B1 tekst with vragen" sixty times and you get sixty texts about a
 * fictional company's new coffee policy. The failure is not quality per text — each one reads
 * fine — it is that the *set* has no coverage: the same register, the same three topics, the
 * same rhetorical move, and titles so alike that the duplicate-title check is the only thing
 * that notices. A candidate who works through ten oefenexamens would meet one text ten times.
 *
 * So the topic, the tekstsoort and the communicative purpose of every single item are fixed
 * here, in git, reviewable in a diff, and the generator's job is narrowed to writing the Dutch.
 * This is also what makes a re-run reproducible: the same plan produces the same exam shape,
 * and a re-generated tekst lands in the same slot with the same tekstsoort.
 *
 * ## Where the topics come from
 * DUO's B1 material sits squarely in the adult-life domains the Wi2021 leerroutes prepare for:
 * werk en solliciteren, beroepsopleiding en stage, gezondheid en zorg, wonen en buurt, geld en
 * regelingen, en meedoen in de samenleving. The sixty subjects below are spread across those
 * six domains, and the six tekstsoorten of `SECTION_SLUGS` are used in a fixed order per exam
 * so every candidate meets each genre once per sitting — which is how DUO builds one too.
 *
 * Nothing here is copied from DUO's booklets. Those are copyright and secret (CLAUDE.md,
 * "DUO reference material is copyright"); what was taken from them is the *format* — six
 * teksten, 35 vragen, this genre mix, this length band.
 */

/* ── Lezen ───────────────────────────────────────────────────────────────── */

/**
 * Six teksten per exam, in a fixed genre order. `intro` is the one-line "waar komt deze tekst
 * vandaan" DUO always prints above the tekst; it is authored per slot because it frames what
 * kind of reading the candidate is being asked to do.
 */
export const LEZEN_GENRES = [
  { section: 'website',    genre: 'een pagina op de website van een organisatie of opleider' },
  { section: 'studieboek', genre: 'een stuk uit een studieboek of cursusmap' },
  { section: 'folder',     genre: 'een folder of brochure van een dienst of instelling' },
  { section: 'artikel',    genre: 'een informatief artikel uit een krant, vakblad of personeelsblad' },
  { section: 'regels',     genre: 'een instructie, handleiding of set regels' },
  { section: 'brief',      genre: 'een formele brief of e-mail van een organisatie aan een persoon' },
];

/**
 * Ten exams × six slots. Each entry is the subject of one tekst, in the slot whose genre it is
 * written as. Read down a column to see one genre across ten exams; read across a row to see
 * one exam.
 */
export const LEZEN_TOPICS = [
  // exam 1
  ['hoe een regionaal opleidingscentrum zijn avondopleidingen inricht',
   'wat een ondernemingsraad doet en welke rechten het personeel heeft',
   'thuiszorg aanvragen: wie het regelt, wat het kost en hoe lang het duurt',
   'waarom steeds meer werkgevers hun personeel zelf laten opleiden',
   'de huisregels van een bedrijfskantine en de afspraken over afval',
   'een brief van de gemeente over een aanvraag voor bijzondere bijstand'],
  // exam 2
  ['het aanbod van een taalschool: cursussen, niveaus en het intakegesprek',
   'soorten arbeidscontracten en wat een proeftijd betekent',
   'een folder over een klachtenloket voor huurders',
   'het tekort aan stageplaatsen in de zorg en wat scholen eraan doen',
   'de veiligheidsinstructie voor het werken met een heftruck',
   'een brief van een woningcorporatie over onderhoud aan de gevel'],
  // exam 3
  ['een vrijwilligersorganisatie die taalcoaches koppelt aan nieuwkomers',
   'hoe een cao tot stand komt en voor wie hij geldt',
   'een folder over de bibliotheek: lidmaatschap, cursussen en het taalcafé',
   'waarom bedrijven vaker een vierdaagse werkweek proberen',
   'de instructie voor het schoonmaken en afsluiten van een keuken',
   'een brief van een zorgverzekeraar over de eigen bijdrage en het eigen risico'],
  // exam 4
  ['een online opleider die thuisstudie en avondlessen combineert',
   'wat een functioneringsgesprek is en hoe je je erop voorbereidt',
   'een folder over schuldhulpverlening bij de gemeente',
   'hoe een kinderboerderij met vrijwilligers wordt gerund',
   'de gebruiksaanwijzing van een tilhulp in de ouderenzorg',
   'een brief van een school aan ouders over een verandering in de schooltijden'],
  // exam 5
  ['het stagebureau van een hogeschool: wat het doet en wat het van studenten vraagt',
   'de rol van de bedrijfsarts bij ziekte en re-integratie',
   'een folder over een sportcentrum met kortingsregelingen voor gezinnen',
   'waarom kleine winkels samen een winkeliersvereniging beginnen',
   'de regels voor het bewaren en bereiden van voedsel in een restaurant',
   'een brief van het UWV over het aanvragen van een uitkering'],
  // exam 6
  ['een leerwerkbedrijf dat mensen zonder diploma aan een vak helpt',
   'hoe pensioen wordt opgebouwd en wat er gebeurt als je van baan wisselt',
   'een folder over een gezondheidscentrum: huisarts, fysiotherapeut en diëtist',
   'de opkomst van deelauto\'s in stadswijken',
   'de brandinstructie en het vluchtplan van een verzorgingshuis',
   'een brief van een taxibedrijf aan een sollicitant over een gesprek'],
  // exam 7
  ['een organisatie die mensen begeleidt bij het vinden van werk na langere tijd thuis',
   'wat een arbeidsconflict is en welke stappen je kunt zetten',
   'een folder over een kinderopvang: dagindeling, kosten en wachtlijst',
   'waarom bedrijven steeds meer aandacht besteden aan werkdruk',
   'de handleiding voor een kassasysteem in een supermarkt',
   'een brief van de belastingdienst over een voorlopige aanslag'],
  // exam 8
  ['een ROC dat opleidingen in de techniek aanbiedt met baangarantie',
   'de verschillen tussen een uitzendbureau, detachering en vast werk',
   'een folder over een wijkcentrum met activiteiten voor nieuwe bewoners',
   'hoe supermarkten proberen minder eten weg te gooien',
   'de werkinstructie voor het aannemen en controleren van een levering',
   'een brief van een verhuurder over een huurverhoging en het huurcontract'],
  // exam 9
  ['een opleiding tot kraamverzorgende: inhoud, stage en werk erna',
   'wat medezeggenschap op een school betekent voor ouders en personeel',
   'een folder over het Nationaal Warmtefonds en het isoleren van een huis',
   'waarom er te weinig mannen in het basisonderwijs werken',
   'de instructie voor het gebruik van beschermende kleding in een laboratorium',
   'een brief van een energieleverancier over het jaarafrekening en het termijnbedrag'],
  // exam 10
  ['een fotografieopleiding en de opdrachten die studenten buiten de school doen',
   'hoe een sollicitatieprocedure bij een grote werkgever verloopt',
   'een folder over mantelzorgondersteuning in de gemeente',
   'de groei van het aantal mensen dat een tweede opleiding begint na hun dertigste',
   'de regels voor het lenen en terugbrengen van gereedschap op een bouwplaats',
   'een brief van een tandartspraktijk over een nieuwe manier van afspraken maken'],
];

/**
 * How the 35 vragen are spread over the six teksten, per exam.
 *
 * Every row sums to 35 and every entry is inside the 4–7 rule. The rows differ on purpose:
 * DUO's own two booklets split them 4,6,6,5,7,7 and 6,5,6,6,7,5, so a single fixed split would
 * be a pattern our exams have and the real one does not.
 */
export const LEZEN_SPLITS = [
  [6, 5, 6, 6, 7, 5],
  [4, 6, 6, 5, 7, 7],
  [5, 6, 5, 7, 6, 6],
  [7, 5, 6, 5, 6, 6],
  [6, 6, 7, 5, 5, 6],
  [5, 7, 5, 6, 6, 6],
  [6, 4, 7, 6, 6, 6],
  [7, 6, 5, 6, 5, 6],
  [5, 6, 6, 7, 6, 5],
  [6, 7, 6, 5, 6, 5],
];

/* ── Schrijven ───────────────────────────────────────────────────────────── */

/**
 * The eight `sentence_completion` opdrachten per exam.
 *
 * `medium` decides how the given text renders: a `mail` gets the Aan/Onderwerp header block,
 * a `bericht` is a post on a website or an intranet notice and gets none. DUO mixes them
 * roughly six to two, which is what this follows.
 */
export const SCHRIJVEN_COMPLETIONS = [
  // exam 1
  [['mail', 'de ICT-afdeling vragen om een groter beeldscherm voor je werkplek'],
   ['mail', 'een collega vragen mee te denken over de inrichting van de nieuwe kantine'],
   ['mail', 'medestudenten laten weten hoe de groepsindeling geregeld wordt'],
   ['mail', 'een klant uitleggen waarom een bestelling in twee delen komt'],
   ['mail', 'vrienden vragen model te staan voor een schoolopdracht'],
   ['bericht', 'op de website van een zwembad melden dat de banen anders verdeeld worden'],
   ['bericht', 'op een buurtsite vragen om tips voor een gezin dat komt wonen'],
   ['mail', 'collega\'s overtuigen mee te doen aan de opruimdag']],
  // exam 2
  [['mail', 'de opleiding vragen of je een toets later mag maken'],
   ['mail', 'een leverancier vragen wanneer een bestelling geleverd wordt'],
   ['mail', 'de buurt informeren over werkzaamheden in de straat'],
   ['bericht', 'op het intranet vragen wie er meedoet aan de bedrijfsloop'],
   ['mail', 'een klant bedanken en uitleggen wat er verder gebeurt'],
   ['mail', 'je stagebegeleider vragen om een gesprek over je stage'],
   ['bericht', 'op een marktplaatsachtige site je oude bureau aanbieden'],
   ['mail', 'een cursist uitleggen waarom een les niet doorgaat']],
  // exam 3
  [['mail', 'de gemeente vragen wat je moet doen om afval te laten ophalen'],
   ['mail', 'een collega vragen jouw dienst over te nemen'],
   ['bericht', 'op de website van een wijkcentrum een nieuwe cursus aankondigen'],
   ['mail', 'een klant laten weten dat een product weer op voorraad is'],
   ['mail', 'je docent vragen om uitleg over een opdracht'],
   ['mail', 'de verhuurder melden dat er iets kapot is in je woning'],
   ['bericht', 'op een forum vragen naar ervaringen met een avondopleiding'],
   ['mail', 'collega\'s vragen ideeën te sturen voor een teamdag']],
  // exam 4
  [['mail', 'de opleiding laten weten dat je met een andere groep wilt meedoen'],
   ['mail', 'een klant uitleggen hoe hij een klacht kan doorgeven'],
   ['bericht', 'op het intranet melden dat de kantine tijdelijk dicht is'],
   ['mail', 'een leverancier vragen om een goedkoper alternatief'],
   ['mail', 'je leidinggevende vragen om een cursus te mogen volgen'],
   ['mail', 'een buurtbewoner uitnodigen voor een bijeenkomst'],
   ['bericht', 'op een website vragen om hulp bij het vervoeren van een kast'],
   ['mail', 'medestudenten uitleggen hoe jullie de groepsopdracht verdelen']],
  // exam 5
  [['mail', 'de huisartsenpraktijk vragen een afspraak te verzetten'],
   ['mail', 'een collega vragen je in te werken op een nieuw systeem'],
   ['bericht', 'op de website van een bibliotheek een taalcafé aankondigen'],
   ['mail', 'een klant uitleggen waarom de levering later is'],
   ['mail', 'je stagebegeleider vertellen wat je de eerste week hebt gedaan'],
   ['mail', 'de school vragen wat je kind mee moet nemen op schoolreis'],
   ['bericht', 'op een forum tips vragen over het isoleren van een huurwoning'],
   ['mail', 'collega\'s vragen wie er op de open dag wil helpen']],
  // exam 6
  [['mail', 'de gemeente vragen hoe je een gehandicaptenparkeerkaart aanvraagt'],
   ['mail', 'een klant laten weten dat zijn abonnement verlengd wordt'],
   ['bericht', 'op het intranet vragen wie er spullen wil doneren voor een actie'],
   ['mail', 'je docent laten weten dat je een presentatie samen wilt doen'],
   ['mail', 'een leverancier vragen om een factuur opnieuw te sturen'],
   ['mail', 'de verhuurder vragen of je de tuin mag veranderen'],
   ['bericht', 'op een website een gebruikte fiets aanbieden met uitleg'],
   ['mail', 'collega\'s informeren over een nieuwe manier van roosteren']],
  // exam 7
  [['mail', 'het opleidingsbureau vragen of je een certificaat kunt krijgen'],
   ['mail', 'een klant uitleggen wat hij zelf kan proberen voordat er iemand komt'],
   ['bericht', 'op de website van een kinderopvang de zomeractiviteiten aankondigen'],
   ['mail', 'je leidinggevende vragen om andere werktijden'],
   ['mail', 'een collega bedanken voor het overnemen van je dienst'],
   ['mail', 'de gemeente melden dat een lantaarnpaal kapot is'],
   ['bericht', 'op een forum vragen hoe anderen werk en studie combineren'],
   ['mail', 'medestudenten vragen te reageren op een enquête']],
  // exam 8
  [['mail', 'de opleiding vragen of eerdere werkervaring meetelt'],
   ['mail', 'een klant laten weten dat een reparatie niet meer kan'],
   ['bericht', 'op het intranet melden dat er een nieuw kassasysteem komt'],
   ['mail', 'je stagebegeleider vragen om extra uitleg over je opdracht'],
   ['mail', 'een leverancier vragen om vroeger te leveren'],
   ['mail', 'de school vragen om een gesprek over de resultaten van je kind'],
   ['bericht', 'op een website vragen wie er mee wil rijden naar het werk'],
   ['mail', 'collega\'s uitleggen waarom de vergadering verplaatst is']],
  // exam 9
  [['mail', 'de zorgverzekeraar vragen of een behandeling vergoed wordt'],
   ['mail', 'een klant uitleggen hoe hij zijn gegevens kan wijzigen'],
   ['bericht', 'op de website van een sportclub nieuwe trainers zoeken'],
   ['mail', 'je docent vragen of je een opdracht later mag inleveren'],
   ['mail', 'een collega vragen mee te kijken naar een moeilijke klant'],
   ['mail', 'de energieleverancier vragen om een lager termijnbedrag'],
   ['bericht', 'op een forum vragen naar ervaringen met mantelzorg'],
   ['mail', 'collega\'s vragen hun werkkleding op tijd in te leveren']],
  // exam 10
  [['mail', 'het stagebureau vragen om een andere stageplek'],
   ['mail', 'een klant laten weten dat hij een tegoed krijgt'],
   ['bericht', 'op het intranet vragen wie mee wil doen aan een cursus Nederlands'],
   ['mail', 'je leidinggevende vragen om een tweede werkschoenpaar'],
   ['mail', 'een leverancier melden dat een levering niet klopt'],
   ['mail', 'de gemeente vragen wanneer de straat weer open is'],
   ['bericht', 'op een website vragen om een oppas voor je hond'],
   ['mail', 'medestudenten uitleggen hoe de excursie geregeld is']],
];

/**
 * The four long opdrachten per exam: the category, and what it is about.
 *
 * Exactly one `form` per exam (the quota), and the other three drawn from email, letter,
 * picture_report and data_text so the pool rotates across the ten. `picture_report` is the
 * only one that costs pictures, so it appears in half the exams; `data_text` carries an
 * authored tabel or grafiek in its prompt and appears in the other half plus two.
 */
export const SCHRIJVEN_LONG = [
  [['email', 'je docent vragen of je het tentamen in een andere week mag doen'],
   ['form', 'een vragenlijst van de bakker in je straat over zijn assortiment'],
   ['picture_report', 'een verslag over je eerste werkdag in een fietsenmakerij'],
   ['letter', 'een sollicitatiebrief voor een baan als buschauffeur']],

  [['letter', 'een briefje in de buurt om klanten te krijgen voor je werk als hondenuitlater'],
   ['form', 'een formulier van de gemeente om overlast in de straat te melden'],
   ['email', 'een e-mail namens de studentenraad aan de directie over de studieplekken'],
   ['data_text', 'een advies aan je leidinggevende op basis van een enquête over de bedrijfskleding']],

  [['email', 'een e-mail aan je verhuurder over achterstallig onderhoud'],
   ['form', 'een aanmeldformulier voor een cursus met open vragen over je motivatie'],
   ['picture_report', 'een verslag over een dag meelopen in een tuincentrum'],
   ['letter', 'een sollicitatiebrief voor een baan als winkelmedewerker']],

  [['data_text', 'een verslag over het ziekteverzuim op je afdeling op basis van een tabel'],
   ['form', 'een klachtenformulier van een webwinkel'],
   ['email', 'een e-mail aan de gemeente over te weinig speelplekken in de wijk'],
   ['letter', 'een brief aan de school van je kind over het overblijven']],

  [['email', 'een e-mail aan je opleiding met het verzoek om studiebegeleiding'],
   ['form', 'een vragenlijst van je werkgever over werkdruk'],
   ['picture_report', 'een verslag over een introductiedag voor nieuwe medewerkers'],
   ['letter', 'een sollicitatiebrief voor een baan in de thuiszorg']],

  [['data_text', 'een advies over de kantine op basis van een grafiek met bezoekcijfers'],
   ['form', 'een formulier om een subsidie voor een buurtactiviteit aan te vragen'],
   ['email', 'een e-mail aan een leverancier over een verkeerde levering'],
   ['letter', 'een briefje aan de buren over een verbouwing bij jou thuis']],

  [['email', 'een e-mail aan je leidinggevende met een voorstel voor andere werktijden'],
   ['form', 'een inschrijfformulier voor een vrijwilligersorganisatie'],
   ['picture_report', 'een verslag over een dag stage in een fietsenwinkel'],
   ['letter', 'een sollicitatiebrief voor een baan als receptionist']],

  [['data_text', 'een advies over het aanbod van een sportcentrum op basis van een tabel'],
   ['form', 'een formulier van de woningcorporatie om een reparatie te melden'],
   ['email', 'een e-mail aan een opleiding met een vraag over vrijstellingen'],
   ['letter', 'een brief aan een verzekeraar over een afgewezen vergoeding']],

  [['email', 'een e-mail aan de ouderraad over een schoolreis'],
   ['form', 'een vragenlijst van de bibliotheek over het cursusaanbod'],
   ['picture_report', 'een verslag over een dag meewerken in een verzorgingshuis'],
   ['letter', 'een sollicitatiebrief voor een baan als chauffeur bij een bakkerij']],

  [['data_text', 'een advies over het personeelsuitje op basis van een tabel met voorkeuren'],
   ['form', 'een aanvraagformulier voor een tegemoetkoming in de schoolkosten'],
   ['email', 'een e-mail aan je werkgever met een voorstel voor minder afval op het werk'],
   ['letter', 'een briefje in de buurt om hulp te vragen bij een straatfeest']],
];

/* ── Spreken ─────────────────────────────────────────────────────────────── */

/**
 * Sixteen opgaven per exam: eight korte in deel 1, eight langere in deel 2.
 *
 * `[image_usage, subject]`. The picture rule is chosen per opgave, and the per-exam mix is what
 * `SPREKEN_QUOTA` checks: four to seven without a plaatje, and the rest spread over react,
 * describe, choose and cover_all. Deel 1 leans on `react` and `none` (a paar woorden of twee
 * zinnen); deel 2 leans on `cover_all` and `choose`, where the candidate has to build a longer
 * answer out of what the plaatjes show.
 */
export const SPREKEN_PLAN = [
  // exam 1
  [[['react', 'een medestudent wil de presentatie op het laatste moment omgooien'],
    ['react', 'een collega bij de receptie vraagt naar een pakket dat kwijt is'],
    ['none', 'je gaat vier dagen werken en kiest welke dag je vrij neemt'],
    ['react', 'een klant in de bloemenwinkel wil een boeket voor een jubileum'],
    ['none', 'je werkgever biedt een cursus aan op zaterdagochtend; wil je die volgen'],
    ['describe', 'leg de nieuwe schoonmaker uit wat er in de voorraadkast staat'],
    ['none', 'de excursie van je opleiding is afgelast; zeg wat je daarvan vindt'],
    ['describe', 'een bewoner van het verzorgingshuis wil niet naar de activiteit']],
   [['cover_all', 'vertel een nieuwe medewerker wat het programma van de inwerkdag is'],
    ['none', 'vertel welk land je zou willen bezoeken en waarom'],
    ['cover_all', 'leg een nieuwe student uit hoe hij het boekenkastsysteem gebruikt'],
    ['cover_all', 'vertel een bezorger wat hij moet doen bij aankomst op het terrein'],
    ['choose', 'beschrijf voor een collega hoe de twee nieuwe werkplekken eruitzien'],
    ['none', 'je zus twijfelt tussen zwemmen en fitness; geef advies'],
    ['choose', 'adviseer je neef welke tas hij meeneemt naar zijn eerste werkdag'],
    ['none', 'er werken weinig vrouwen in de techniek; zeg wat je daarvan vindt']]],
  // exam 2
  [[['react', 'een collega vraagt of je zijn dienst wilt overnemen'],
    ['none', 'je kunt kiezen tussen thuiswerken en op kantoor werken'],
    ['react', 'een klant in de winkel kan het product niet vinden'],
    ['describe', 'leg uit wat er op het rooster aan de muur staat'],
    ['none', 'de kantine gaat minder lang open; zeg wat je daarvan vindt'],
    ['react', 'een medestudent snapt de opdracht niet en vraagt jou om hulp'],
    ['none', 'je krijgt de kans om een cursus te volgen naast je werk'],
    ['describe', 'een kind op de opvang is gevallen; zeg iets tegen het kind']],
   [['cover_all', 'leg een nieuwe collega uit wat hij op zijn eerste dag moet doen'],
    ['none', 'vertel welke sport je een vriend zou aanraden en waarom'],
    ['cover_all', 'leg uit hoe iemand de wasmachine op het werk moet gebruiken'],
    ['choose', 'adviseer welke van twee zalen het beste past voor een bijeenkomst'],
    ['cover_all', 'vertel wat er op de open dag van jouw opleiding te doen is'],
    ['none', 'steeds meer mensen werken door na hun pensioen; wat vind je daarvan'],
    ['choose', 'adviseer een collega welke werkschoenen hij moet kiezen'],
    ['none', 'vertel wat jij belangrijk vindt in een goede leidinggevende']]],
  // exam 3
  [[['react', 'de buurman klaagt over geluid uit jouw woning'],
    ['none', 'je mag kiezen tussen een vaste werkplek en een flexplek'],
    ['react', 'een klant wil een product ruilen zonder bon'],
    ['describe', 'leg uit wat je op het bord bij de ingang ziet staan'],
    ['none', 'er komt een cursus Nederlands op het werk; zeg wat je daarvan vindt'],
    ['react', 'een collega vraagt waarom je te laat bent'],
    ['none', 'je moet kiezen tussen een dag extra werken of een dag extra vrij'],
    ['describe', 'een nieuwe bewoner in de buurt kent niemand; zeg iets tegen hem']],
   [['cover_all', 'leg een collega uit hoe hij de winkel moet afsluiten'],
    ['none', 'vertel welke opleiding je zou kiezen als je opnieuw kon beginnen'],
    ['cover_all', 'vertel wat het programma van de buurtdag is'],
    ['choose', 'adviseer welke van twee woningen beter past voor een gezin'],
    ['cover_all', 'leg uit hoe iemand zich moet aanmelden voor de bibliotheek'],
    ['none', 'veel mensen doen vrijwilligerswerk; zeg wat je daarvan vindt'],
    ['choose', 'adviseer een vriendin welke cursus ze het beste kan volgen'],
    ['none', 'vertel hoe jij je werk en je gezin combineert']]],
  // exam 4
  [[['react', 'een klant is boos omdat hij lang moet wachten'],
    ['none', 'je kiest tussen een cursus op zaterdag of twee avonden per week'],
    ['react', 'een medestudent vraagt of hij jouw aantekeningen mag kopiëren'],
    ['describe', 'leg uit wat op de prijslijst van de kantine staat'],
    ['none', 'het werkoverleg wordt van een uur naar een half uur; wat vind je'],
    ['react', 'je leidinggevende vraagt hoe je stage gaat'],
    ['none', 'je moet kiezen tussen dichtbij werken of meer verdienen'],
    ['describe', 'iemand is de weg kwijt in het ziekenhuis; help hem']],
   [['cover_all', 'leg uit wat een bezoeker bij aankomst op het bedrijf moet doen'],
    ['none', 'vertel welke stad je iemand zou aanraden om te bezoeken'],
    ['cover_all', 'leg een nieuwe medewerker uit hoe de koffiemachine werkt'],
    ['choose', 'adviseer welke van twee cadeaus je voor een collega kiest'],
    ['cover_all', 'vertel wat er bij een verhuizing allemaal geregeld moet worden'],
    ['none', 'steeds meer winkels zijn op zondag open; wat vind je daarvan'],
    ['choose', 'adviseer welke van twee fietsen het beste is voor woon-werkverkeer'],
    ['none', 'vertel wat volgens jou een goede stageplek maakt']]],
  // exam 5
  [[['react', 'een collega wil ruilen van vakantieweek'],
    ['none', 'je kiest tussen een grote of een kleine werkgever'],
    ['react', 'een klant vraagt of je een product kunt bezorgen'],
    ['describe', 'leg uit wat er op het formulier aan de balie gevraagd wordt'],
    ['none', 'de werkkleding wordt voortaan door het bedrijf gewassen; wat vind je'],
    ['react', 'een medestudent is gezakt voor een toets en is er stil van'],
    ['none', 'je mag kiezen tussen extra salaris of extra vrije dagen'],
    ['describe', 'een oudere mevrouw kan haar boodschappen niet dragen; help haar']],
   [['cover_all', 'leg uit hoe iemand een afspraak bij de huisarts maakt'],
    ['none', 'vertel welk beroep je zou kiezen als geld niet uitmaakte'],
    ['cover_all', 'vertel wat er op de dag van de verhuizing van het kantoor gebeurt'],
    ['choose', 'adviseer welke van twee sportabonnementen past bij een gezin'],
    ['cover_all', 'leg een collega uit hoe hij een levering moet controleren'],
    ['none', 'kinderen krijgen steeds jonger een telefoon; wat vind je daarvan'],
    ['choose', 'adviseer welke van twee vakantiebestemmingen beter is voor een groep'],
    ['none', 'vertel hoe jij het beste Nederlands leert']]],
  // exam 6
  [[['react', 'een klant wil zijn abonnement opzeggen'],
    ['none', 'je kiest tussen met de fiets of met de bus naar je werk'],
    ['react', 'een collega vraagt of je even kunt meekijken'],
    ['describe', 'leg uit wat er op het rooster van de sportzaal staat'],
    ['none', 'de school wil later beginnen met de lessen; wat vind je daarvan'],
    ['react', 'je buurvrouw vraagt of je op haar plantjes wilt letten'],
    ['none', 'je mag kiezen tussen een stage dichtbij of een leerzamere stage ver weg'],
    ['describe', 'een kind kan zijn moeder niet vinden in de supermarkt']],
   [['cover_all', 'leg uit wat er allemaal moet gebeuren voor een personeelsfeest'],
    ['none', 'vertel welke cursus jij je collega\'s zou aanraden'],
    ['cover_all', 'leg iemand uit hoe hij de printer moet gebruiken'],
    ['choose', 'adviseer welke van twee auto\'s beter past bij een klein bedrijf'],
    ['cover_all', 'vertel wat een nieuwe bewoner in de wijk allemaal kan doen'],
    ['none', 'steeds meer mensen kopen tweedehands; wat vind je daarvan'],
    ['choose', 'adviseer welke van twee opleidingen beter is voor een carrièreswitch'],
    ['none', 'vertel wat jou motiveert in je werk']]],
  // exam 7
  [[['react', 'een medestudent wil de groepsopdracht anders verdelen'],
    ['none', 'je kiest tussen een opleiding met veel of weinig stage'],
    ['react', 'een klant klaagt dat het product kapot is aangekomen'],
    ['describe', 'leg uit wat er op de instructiekaart bij de machine staat'],
    ['none', 'het bedrijf gaat over op vier dagen van negen uur; wat vind je'],
    ['react', 'je leidinggevende vraagt waarom je een cursus wilt volgen'],
    ['none', 'je mag kiezen tussen alleen werken of in een team'],
    ['describe', 'een collega heeft zich gesneden in de keuken']],
   [['cover_all', 'leg uit hoe iemand zich inschrijft voor de cursus'],
    ['none', 'vertel welke verandering op jouw werk je zou willen'],
    ['cover_all', 'vertel wat er tijdens de open dag van de school gebeurt'],
    ['choose', 'adviseer welke van twee laptops geschikt is voor een opleiding'],
    ['cover_all', 'leg een collega uit hoe hij de kassa moet afsluiten'],
    ['none', 'veel mensen werken thuis; zeg wat de nadelen daarvan zijn'],
    ['choose', 'adviseer welke van twee zalen past voor een cursus van twintig mensen'],
    ['none', 'vertel wat jij een goede buur maakt']]],
  // exam 8
  [[['react', 'een klant vraagt om korting omdat hij vaak komt'],
    ['none', 'je kiest tussen vast werk met minder salaris of tijdelijk werk met meer'],
    ['react', 'een collega vergeet steeds zijn spullen op te ruimen'],
    ['describe', 'leg uit wat er op de plattegrond bij de ingang staat'],
    ['none', 'de gemeente wil de straat autovrij maken; wat vind je daarvan'],
    ['react', 'een medestudent vraagt of je samen wilt leren voor de toets'],
    ['none', 'je mag kiezen tussen een cursus Nederlands of een vakcursus'],
    ['describe', 'een bezoeker weet niet waar hij zich moet melden']],
   [['cover_all', 'leg uit hoe iemand een pakket klaarmaakt voor verzending'],
    ['none', 'vertel welk vak jij het liefst zou leren en waarom'],
    ['cover_all', 'vertel wat er op de eerste dag van de opleiding gebeurt'],
    ['choose', 'adviseer welke van twee planten geschikt is voor de kantine'],
    ['cover_all', 'leg een nieuwe collega uit hoe de voorraad wordt bijgehouden'],
    ['none', 'supermarkten gooien veel eten weg; wat vind je daarvan'],
    ['choose', 'adviseer welke van twee routes je met de fiets zou nemen'],
    ['none', 'vertel hoe jij met drukte op je werk omgaat']]],
  // exam 9
  [[['react', 'een klant wil een klacht doorgeven over een medewerker'],
    ['none', 'je kiest tussen een baan met reizen of een baan dichtbij'],
    ['react', 'een collega vraagt of je zijn presentatie wilt doen'],
    ['describe', 'leg uit wat er op de menukaart van het restaurant staat'],
    ['none', 'op school komt een verbod op telefoons; wat vind je daarvan'],
    ['react', 'je stagebegeleider vraagt wat je nog wilt leren'],
    ['none', 'je mag kiezen tussen een grote of een kleine groep in de les'],
    ['describe', 'een oudere man in het verzorgingshuis wil naar buiten']],
   [['cover_all', 'leg uit hoe iemand een fiets moet repareren'],
    ['none', 'vertel welke activiteit je voor de buurt zou organiseren'],
    ['cover_all', 'vertel wat er tijdens de bedrijfsuitje-dag gebeurt'],
    ['choose', 'adviseer welke van twee cursussen past bij iemand die wil doorgroeien'],
    ['cover_all', 'leg uit hoe iemand een kamer klaarmaakt voor een nieuwe bewoner'],
    ['none', 'jongeren beginnen later met werken; wat vind je daarvan'],
    ['choose', 'adviseer welke van twee kantoorindelingen beter werkt'],
    ['none', 'vertel wat jij nodig hebt om goed te kunnen leren']]],
  // exam 10
  [[['react', 'een klant wil een afspraak op een dag dat het niet kan'],
    ['none', 'je kiest tussen een opleiding in de techniek of in de zorg'],
    ['react', 'een collega vindt dat jij te veel praat tijdens het werk'],
    ['describe', 'leg uit wat er op het bord met de openingstijden staat'],
    ['none', 'de bibliotheek gaat een dag minder open; wat vind je daarvan'],
    ['react', 'een medestudent vraagt of je hem wilt helpen met Nederlands'],
    ['none', 'je mag kiezen tussen een stage in een groot of een klein bedrijf'],
    ['describe', 'een klant met een kinderwagen komt niet door de deur']],
   [['cover_all', 'leg uit hoe iemand een foto-opdracht voor de opleiding aanpakt'],
    ['none', 'vertel welk boek of welke film je iemand zou aanraden'],
    ['cover_all', 'vertel wat er allemaal geregeld wordt voor de excursie'],
    ['choose', 'adviseer welke van twee telefoons beter is voor het werk'],
    ['cover_all', 'leg een collega uit hoe hij de tuin van een klant aanpakt'],
    ['none', 'mensen bewegen te weinig; zeg wat daaraan te doen is'],
    ['choose', 'adviseer welke van twee kantines gezonder eten aanbiedt'],
    ['none', 'vertel wat jij over vijf jaar wilt doen']]],
];

/* ── Luisteren ───────────────────────────────────────────────────────────── */

/**
 * Zes teksten per examen, in een vaste volgorde van tekstsoort.
 *
 * Een "tekst" is bij Luisteren geen tekst maar **één heel gesprek tussen twee mensen**, dat in
 * losse fragmenten wordt geknipt; elk fragment draagt precies één vraag. Dat is de vorm die
 * DUO gebruikt en het is wat B1 van A2 onderscheidt: bij A2 staat elk fragment op zichzelf,
 * bij B1 loopt één gesprek door zes tot negen vragen heen en moet de kandidaat de draad
 * vasthouden.
 *
 * `intro` is de regel die DUO boven elke tekst afdrukt én inspreekt ("U gaat luisteren naar een
 * gesprek met…"). Hij wordt per slot geschreven, want hij vertelt de kandidaat wie er praten —
 * zonder die namen is een vraag over "de vrouw" niet te beantwoorden.
 *
 * De verdeling over de vier tekstsoorten is 3 informatief, 1 beschouwend, 1 persuasief,
 * 1 instructief. Informatief is oververtegenwoordigd omdat het beroepsportret — iemand die
 * over zijn werk of opleiding vertelt — DUO's meest gebruikte vorm is.
 */
export const LUISTEREN_GENRES = [
  { section: 'informatief',  genre: 'een interview waarin iemand vertelt hoe zijn of haar werk eruitziet' },
  { section: 'beschouwend',  genre: 'een gesprek waarin iemand terugkijkt en afweegt hoe iets is gelopen' },
  { section: 'informatief',  genre: 'een gesprek waarin iemand uitlegt hoe een dienst of regeling werkt' },
  { section: 'persuasief',   genre: 'een gesprek waarin iemand de ander van een keuze probeert te overtuigen' },
  { section: 'instructief',  genre: 'een gesprek waarin iemand stap voor stap uitlegt hoe je iets aanpakt' },
  { section: 'informatief',  genre: 'een interview over een opleiding, een stage of een overstap naar ander werk' },
];

/**
 * Tien examens × zes gesprekken. Elke regel is het onderwerp van één gesprek, in het slot
 * waarvan het de tekstsoort draagt. Zelfde bron als `LEZEN_TOPICS`: de Wi2021-domeinen van het
 * volwassen leven — werk, opleiding, zorg, wonen, geld en meedoen — en niets ervan komt uit
 * DUO's boekjes.
 */
export const LUISTEREN_TOPICS = [
  // examen 1
  ['een wijkverpleegkundige over een werkdag die nooit loopt zoals hij gepland is',
   'een monteur die na twintig jaar overstapte op elektrische auto’s en terugkijkt',
   'een medewerker van het UWV legt uit hoe een WW-aanvraag stap voor stap verloopt',
   'een fietsenwinkel probeert klanten aan een onderhoudsabonnement te helpen',
   'een kok legt uit hoe je een keuken inricht zodat je veilig en snel werkt',
   'een onderwijsassistente over haar opleiding naast haar baan'],
  // examen 2
  ['een buschauffeuse over de nachtdienst en wat dat met je ritme doet',
   'een ondernemer kijkt terug op het eerste jaar van zijn eigen zaak',
   'een woningcorporatie legt uit hoe de wachtlijst voor een sociale huurwoning werkt',
   'een sportschool probeert een twijfelende klant aan een proefperiode te helpen',
   'een tuinman legt uit hoe je een kleine achtertuin onderhoudt door het jaar heen',
   'een verzorgende IG over de overstap van de horeca naar de zorg'],
  // examen 3
  ['een apothekersassistent over wat er allemaal achter de balie gebeurt',
   'een leidinggevende kijkt terug op een reorganisatie op zijn afdeling',
   'een medewerker van de gemeente legt uit hoe je bijzondere bijstand aanvraagt',
   'een energiecoach probeert een bewoner tot isoleren te bewegen',
   'een fietsenmaker legt uit hoe je zelf een band plakt en wat je nodig hebt',
   'een installateur over een leerbaan: vier dagen werken, één dag school'],
  // examen 4
  ['een conducteur over de drukste uren en de gesprekken die hij voert',
   'een docent kijkt terug op twee jaar lesgeven aan volwassenen',
   'een medewerker van de bibliotheek legt uit wat een lidmaatschap allemaal geeft',
   'een makelaar probeert een huurder aan het idee van kopen te laten wennen',
   'een schilder legt uit hoe je een kamer voorbereidt voordat je verft',
   'een laborant over het hbo-traject dat zij deeltijd volgde'],
  // examen 5
  ['een pakketbezorger over de route, de tijdsdruk en de klanten',
   'een vrijwilliger kijkt terug op tien jaar werk bij de voedselbank',
   'een medewerker van de belastingdienst legt uit wat huurtoeslag is en wie het krijgt',
   'een buurtinitiatief probeert bewoners aan een gezamenlijke moestuin te helpen',
   'een kapper legt uit hoe je thuis je haar verzorgt tussen afspraken door',
   'een beveiliger over het diploma dat je nodig hebt en hoe je het haalt'],
  // examen 6
  ['een doktersassistente over de telefoon, de triage en de drukke ochtenden',
   'een teamleider kijkt terug op de overstap naar thuiswerken',
   'een medewerker van DigiD legt uit hoe je veilig inlogt bij de overheid',
   'een kringloopwinkel probeert klanten tot tweedehands kopen te overtuigen',
   'een elektricien legt uit hoe je een stekkerdoos veilig gebruikt',
   'een pedagogisch medewerker over de bbl-opleiding in de kinderopvang'],
  // examen 7
  ['een heftruckchauffeur over het magazijn, de piekweken en de veiligheid',
   'een ouder kijkt terug op de zoektocht naar kinderopvang',
   'een medewerker van het CJG legt uit welke hulp er voor gezinnen is',
   'een werkgever probeert een medewerker aan een cursus Nederlands te helpen',
   'een naaister legt uit hoe je een broek zelf korter maakt',
   'een schoonmaker over de stap naar teamleider en de cursus die daarbij hoorde'],
  // examen 8
  ['een gastvrouw in een verzorgingshuis over haar dag en de bewoners',
   'een sporter kijkt terug op een blessure en de weg terug',
   'een medewerker van de ANWB legt uit wat je doet bij pech onderweg',
   'een gemeente probeert bewoners tot afval scheiden te bewegen',
   'een imker legt uit hoe je begint met bijen houden in een stadstuin',
   'een ict-medewerker over een zij-instroomtraject van acht maanden'],
  // examen 9
  ['een marktkoopman over de opbouw, het weer en het vaste klantenbestand',
   'een mantelzorger kijkt terug op het jaar waarin haar moeder ziek werd',
   'een medewerker van het waterschap legt uit waar de waterschapsbelasting heen gaat',
   'een fysiotherapeut probeert een patiënt aan dagelijkse oefeningen te krijgen',
   'een bakker legt uit hoe je thuis brood bakt met weinig gereedschap',
   'een verkeersregelaar over de cursus en de dagen dat hij wordt ingezet'],
  // examen 10
  ['een dierenartsassistente over spoedgevallen en gesprekken met baasjes',
   'een student kijkt terug op een studie die hij halverwege heeft omgegooid',
   'een medewerker van de woonbond legt uit wat je rechten zijn als huurder',
   'een vervoerbedrijf probeert reizigers aan de ov-chipkaart-app te helpen',
   'een hovenier legt uit hoe je een tuin winterklaar maakt',
   'een administratief medewerker over een certificaat dat zij in avonduren haalde'],
];

/**
 * Hoeveel vragen elk van de zes gesprekken draagt. Elke regel telt op tot 39 en elke waarde
 * valt binnen `FORMAT.luisteren.fragmentsPerText` (5–9).
 *
 * Net als bij `LEZEN_SPLITS` verschillen de regels expres: DUO's boekjes van 2024 en 2025
 * splitsten 6,9,6,8,9 en 5,7,9,6,6,6, dus een vaste verdeling zou een patroon zijn dat het
 * echte examen niet heeft.
 */
export const LUISTEREN_SPLITS = [
  [7, 6, 7, 6, 7, 6],
  [6, 7, 5, 7, 6, 8],
  [8, 6, 6, 5, 7, 7],
  [5, 7, 7, 6, 8, 6],
  [7, 5, 6, 8, 6, 7],
  [6, 8, 7, 5, 6, 7],
  [7, 7, 6, 6, 5, 8],
  [6, 6, 8, 7, 7, 5],
  [8, 7, 5, 6, 7, 6],
  [5, 6, 7, 7, 8, 6],
];

/**
 * Welke twee stemmen elk gesprek spreken — spreker A en spreker B, als sleutels uit
 * `data/tts-voices.json`.
 *
 * **Waarom dit in het plan staat en niet in de generator.** DUO zet dertien stemmen in per
 * examen en hergebruikt geen enkele spreker tussen de teksten (geteld op 2025: zes losse
 * Cito-opnames). Wij hebben er acht, dus hergebruik is onvermijdelijk — maar het mag niet
 * toevallig zijn. Deze tabel zorgt voor drie dingen, bewaakt door `checkLuisteren`:
 *
 *   1. binnen één examen is elk paar anders, dus geen twee gesprekken klinken hetzelfde;
 *   2. geen stem staat in twee gesprekken die op elkaar volgen;
 *   3. één of twee van de zes paren zijn twee mannen of twee vrouwen, zoals bij DUO —
 *      een examen waarin elk gesprek man-vrouw is, is te makkelijk uit elkaar te houden.
 *
 * Wie van de twee de interviewer is, bepaalt de generator niet: `LUISTEREN_GENRES` zegt het en
 * de gegenereerde `intro` noemt de namen.
 */
export const LUISTEREN_CAST = [
  // examen 1
  [['man_eric', 'man_young'], ['woman_roos', 'man_older'], ['woman_noa', 'woman_older'],
   ['man_richard', 'woman_young'], ['woman_roos', 'man_eric'], ['man_young', 'woman_noa']],
  // examen 2
  [['woman_young', 'man_older'], ['man_eric', 'woman_noa'], ['man_richard', 'man_young'],
   ['woman_older', 'man_eric'], ['woman_roos', 'woman_noa'], ['woman_older', 'man_richard']],
  // examen 3
  [['woman_noa', 'man_richard'], ['woman_older', 'woman_roos'], ['man_young', 'man_eric'],
   ['woman_noa', 'man_older'], ['man_richard', 'woman_young'], ['woman_roos', 'man_young']],
  // examen 4
  [['man_older', 'woman_roos'], ['woman_young', 'man_eric'], ['man_richard', 'woman_noa'],
   ['woman_older', 'man_young'], ['man_eric', 'man_older'], ['woman_roos', 'woman_young']],
  // examen 5
  [['woman_older', 'man_eric'], ['man_young', 'woman_roos'], ['woman_noa', 'man_richard'],
   ['woman_older', 'woman_roos'], ['woman_young', 'man_young'], ['man_eric', 'woman_noa']],
  // examen 6
  [['man_young', 'woman_noa'], ['woman_roos', 'man_richard'], ['man_older', 'woman_young'],
   ['woman_noa', 'woman_roos'], ['man_eric', 'man_richard'], ['woman_older', 'man_older']],
  // examen 7
  [['woman_roos', 'man_older'], ['man_eric', 'woman_older'], ['woman_young', 'man_young'],
   ['man_richard', 'woman_noa'], ['woman_older', 'woman_young'], ['man_older', 'man_eric']],
  // examen 8
  [['man_richard', 'woman_young'], ['woman_noa', 'man_older'], ['man_eric', 'woman_roos'],
   ['woman_older', 'man_richard'], ['man_young', 'man_older'], ['woman_roos', 'woman_noa']],
  // examen 9
  [['woman_noa', 'man_young'], ['man_older', 'woman_roos'], ['woman_older', 'man_eric'],
   ['man_richard', 'man_young'], ['woman_roos', 'woman_older'], ['man_eric', 'woman_young']],
  // examen 10
  [['man_older', 'woman_older'], ['woman_young', 'man_richard'], ['man_eric', 'man_young'],
   ['woman_roos', 'woman_young'], ['man_older', 'woman_noa'], ['man_richard', 'woman_roos']],
];
