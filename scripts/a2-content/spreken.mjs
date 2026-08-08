/**
 * Spreken A2 — ten oefenexamens, each four onderdelen of four opgaven.
 *
 * ## Shape, from DUO's own player
 * Onderdeel 1 is "vragen met een video" at DUO: somebody addresses the candidate directly and asks
 * something, and the candidate answers as themselves. Here it is one still plus the spoken remark
 * (owner's decision, recorded in CLAUDE.md) — which is why every onderdeel-1 opgave carries a
 * `prompt_spoken` and a `voice`: the clip *is* the task, and the voice has to match the person in
 * the picture. Onderdelen 2–4 are 1, 2 and 3 plaatjes, and those counts are a hard publish error.
 *
 * Across onderdelen 2–4 DUO almost always asks a **double question** — "Vertel X. Vertel ook Y." —
 * and the model answers are one or two very short sentences. Both are copied here as format, never
 * as content: the material in `resources/exam-references/` is copyright and is used for shape only.
 *
 * ## Image slots
 * `slot` is a stable key into `images.lock.json`, authored here and never changed. `query` is what
 * gets sent to Pexels the first time; after that the lock file decides, so re-running never swaps
 * the picture under an item the docent has already checked. `variant` picks a different photo from
 * the same query — which is how a `cover_all` sequence gets three different shots of one situation.
 */

/** The four onderdelen. Titles and instructions follow DUO's between-onderdeel screens. */
const PART_META = [
  {
    key: 'react',
    title: 'Onderdeel 1: vragen met een gesprek',
    instruction_html:
      '<p>U ziet vier vragen met een gesprek. U hoort steeds iemand die iets tegen u zegt en u ' +
      'een vraag stelt. Geef antwoord in hele zinnen. U heeft 60 seconden per vraag.</p>',
  },
  {
    key: 'describe',
    title: 'Onderdeel 2: vragen met 1 plaatje',
    instruction_html:
      '<p>U ziet vier vragen met één plaatje. Geef antwoord op de vragen. Gebruik steeds het ' +
      'plaatje.</p>',
  },
  {
    key: 'choose',
    title: 'Onderdeel 3: vragen met 2 plaatjes',
    instruction_html:
      '<p>U ziet vier vragen met twee plaatjes. Kies steeds één van de plaatjes en vertel waarom ' +
      'u dat plaatje kiest.</p>',
  },
  {
    key: 'cover_all',
    title: 'Onderdeel 4: vragen met 3 plaatjes',
    instruction_html:
      '<p>U ziet vier vragen met drie plaatjes. Geef antwoord op de vraag. Gebruik steeds alle ' +
      'plaatjes. Vertel iets bij elk plaatje.</p>',
  },
];

/** Build one exam from four groups of four opgaven, in onderdeel order. */
function exam(groups) {
  return PART_META.map((p, i) => ({
    title: p.title,
    instruction_html: p.instruction_html,
    image_usage: p.key,
    tasks: groups[i],
  }));
}

/** `react` opgave: one still of the speaker, plus what they say. */
const react = (n, i, { says, prompt, answer, query, voice, variant = 0 }) => ({
  prompt,
  prompt_spoken: says,
  voice,
  model_answer: answer,
  images: [{ slot: `spr-${n}-1-${i}`, query, variant }],
});

/** `describe` opgave: one plaatje, a double question about it. */
const describe = (n, i, { prompt, answer, query, variant = 0 }) => ({
  prompt,
  model_answer: answer,
  images: [{ slot: `spr-${n}-2-${i}`, query, variant }],
});

/** `choose` opgave: two comparable plaatjes, a preference plus a reason. */
const choose = (n, i, { prompt, answer, a, b }) => ({
  prompt,
  model_answer: answer,
  images: [
    { slot: `spr-${n}-3-${i}-a`, query: a.q, variant: a.v ?? 0, caption: a.caption ?? null },
    { slot: `spr-${n}-3-${i}-b`, query: b.q, variant: b.v ?? 0, caption: b.caption ?? null },
  ],
});

/** `cover_all` opgave: three plaatjes that belong together, used in order. */
const coverAll = (n, i, { prompt, answer, shots }) => ({
  prompt,
  model_answer: answer,
  images: shots.map((s, k) => ({
    slot: `spr-${n}-4-${i}-${k + 1}`,
    query: s.q,
    variant: s.v ?? 0,
    caption: s.caption ?? null,
  })),
});

/* ───────────────────────────── oefenexamen 1 ───────────────────────────── */

const EXAM_1 = exam([
  [
    react(1, 1, {
      says: 'Hoi! Wij zijn nieuw in deze straat. Waar woont u en hoe lang woont u hier al?',
      prompt: 'Uw nieuwe buurvrouw stelt zich voor. Geef antwoord op haar vraag.',
      answer: 'Ik woon op nummer 24. Ik woon hier nu ongeveer drie jaar.',
      query: 'woman smiling talking neighbour doorway',
      voice: 'woman_young',
    }),
    react(1, 2, {
      says: 'Zeg, ik zoek nog iets leuks voor het weekend. Wat doet u het liefst op een vrije dag?',
      prompt: 'Een collega vraagt iets aan u. Geef antwoord in hele zinnen.',
      answer: 'Op een vrije dag ga ik graag fietsen. Daarna drink ik koffie met een vriendin.',
      query: 'man talking colleague office friendly',
      voice: 'man_young',
    }),
    react(1, 3, {
      says: 'U bent er snel. Hoe komt u meestal naar uw werk?',
      prompt: 'Uw leidinggevende praat met u. Geef antwoord op haar vraag.',
      answer: 'Ik kom meestal met de fiets. Als het regent, neem ik de bus.',
      query: 'older woman manager talking workplace',
      voice: 'woman_older',
    }),
    react(1, 4, {
      says: 'Wat een weer, hè? Wat vindt u van het weer hier in Nederland?',
      prompt: 'Iemand in de wachtkamer begint een gesprek. Geef antwoord.',
      answer: 'Ik vind het vaak te nat. In de zomer vind ik het weer wel fijn.',
      query: 'older man waiting room talking',
      voice: 'man_older',
    }),
  ],
  [
    describe(1, 1, {
      prompt: 'Vertel wat u op het plaatje ziet. Vertel ook wat de mensen aan het doen zijn.',
      answer: 'Ik zie een markt met veel groente en fruit. De mensen kopen boodschappen.',
      query: 'dutch outdoor market vegetables shoppers',
    }),
    describe(1, 2, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook waar deze mensen zijn.',
      answer: 'Ik zie mensen die wachten. Ze zitten in een wachtkamer bij de dokter.',
      query: 'people waiting room doctor clinic',
    }),
    describe(1, 3, {
      prompt: 'Beschrijf dit plaatje. Vertel ook wat u zelf in zo’n keuken zou koken.',
      answer: 'Twee mensen koken samen in een keuken. Ik zou soep met groente maken.',
      query: 'two people cooking home kitchen',
    }),
    describe(1, 4, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat er misgaat.',
      answer: 'Het regent hard en mensen fietsen. Ze worden nat, want ze hebben geen jas aan.',
      query: 'cyclists rain city street netherlands',
    }),
  ],
  [
    choose(1, 1, {
      prompt: 'Waar gaat u liever naartoe in de vakantie? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies het strand, want ik hou van warm weer en zwemmen.',
      a: { q: 'beach holiday sunny sea', caption: 'strand' },
      b: { q: 'mountain hiking holiday', caption: 'bergen' },
    }),
    choose(1, 2, {
      prompt: 'In welk huis zou u liever wonen? Kies één plaatje en leg uit waarom.',
      answer: 'Ik kies het appartement, want het ligt dicht bij het centrum en de winkels.',
      a: { q: 'apartment building city netherlands', caption: 'appartement' },
      b: { q: 'small house garden countryside', caption: 'huis met tuin' },
    }),
    choose(1, 3, {
      prompt: 'Welke sport zou u willen doen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies zwemmen. Zwemmen is goed voor mijn rug en ik vind het rustig.',
      a: { q: 'swimming pool lane swimmer', caption: 'zwemmen' },
      b: { q: 'people playing football field', caption: 'voetballen' },
    }),
    choose(1, 4, {
      prompt: 'Welk cadeau geeft u aan een vriend? Kies er één en leg uit waarom.',
      answer: 'Ik geef de bloemen, want die zijn altijd goed en ze maken de kamer mooi.',
      a: { q: 'bouquet flowers gift', caption: 'bloemen' },
      b: { q: 'stack of books gift', caption: 'boek' },
    }),
  ],
  [
    coverAll(1, 1, {
      prompt: 'Vertel wat deze persoon in de ochtend doet. Gebruik alle drie de plaatjes.',
      answer: 'Eerst staat hij op. Daarna eet hij brood. Dan gaat hij met de fiets weg.',
      shots: [
        { q: 'alarm clock waking up morning bed', caption: 'opstaan' },
        { q: 'breakfast bread coffee table', caption: 'ontbijt' },
        { q: 'man cycling to work morning', caption: 'naar het werk' },
      ],
    }),
    coverAll(1, 2, {
      prompt: 'Vertel het verhaal van deze verjaardag. Gebruik alle plaatjes.',
      answer: 'Ze maakt een taart. Dan komen de gasten met cadeaus. Samen zingen ze een lied.',
      shots: [
        { q: 'baking birthday cake kitchen', caption: 'taart maken' },
        { q: 'friends arriving with presents party', caption: 'gasten' },
        { q: 'birthday party singing candles', caption: 'feest' },
      ],
    }),
    coverAll(1, 3, {
      prompt: 'Vertel wat deze persoon doet. Gebruik alle plaatjes.',
      answer: 'Hij schrijft een lijstje. Dan gaat hij naar de supermarkt. Thuis zet hij alles weg.',
      shots: [
        { q: 'writing shopping list paper', caption: 'lijstje' },
        { q: 'man shopping supermarket trolley', caption: 'supermarkt' },
        { q: 'unpacking groceries kitchen', caption: 'thuis' },
      ],
    }),
    coverAll(1, 4, {
      prompt: 'Vertel wat er misgaat en hoe het afloopt. Gebruik alle plaatjes.',
      answer: 'Haar fiets is stuk. Ze belt de fietsenmaker. Later kan ze weer fietsen.',
      shots: [
        { q: 'broken bicycle flat tyre street', caption: 'kapotte fiets' },
        { q: 'woman calling phone street', caption: 'bellen' },
        { q: 'bicycle repair shop mechanic', caption: 'gemaakt' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 2 ───────────────────────────── */

const EXAM_2 = exam([
  [
    react(2, 1, {
      says: 'Goedemiddag. U wilt zich inschrijven, zei u? Wat voor werk doet u nu?',
      prompt: 'U staat bij de balie van een uitzendbureau. Geef antwoord op de vraag.',
      answer: 'Ik werk nu in een restaurant. Ik doe de afwas en ik help in de keuken.',
      query: 'receptionist desk talking client office',
      voice: 'woman_older',
    }),
    react(2, 2, {
      says: 'Leuk dat u er bent! Waarom wilt u Nederlands leren?',
      prompt: 'De docent van een taalcursus vraagt iets. Geef antwoord in hele zinnen.',
      answer: 'Ik wil beter praten met mijn buren en met de ouders op school.',
      query: 'teacher classroom adults language course',
      voice: 'man_older',
    }),
    react(2, 3, {
      says: 'Wat kan ik voor u doen? Vertel eens waar u last van heeft.',
      prompt: 'U zit bij de huisarts. Geef antwoord op haar vraag.',
      answer: 'Ik heb al een week hoofdpijn. Ik slaap ook heel slecht.',
      query: 'female doctor talking patient consultation',
      voice: 'woman_young',
    }),
    react(2, 4, {
      says: 'Hé buurman! Wij geven zaterdag een feest. Komt u ook, en wat neemt u mee?',
      prompt: 'Uw buurman nodigt u uit. Geef antwoord.',
      answer: 'Ja, graag. Ik kom zaterdagavond en ik neem een salade mee.',
      query: 'man inviting neighbour smiling garden',
      voice: 'man_young',
    }),
  ],
  [
    describe(2, 1, {
      prompt: 'Vertel wat u op het plaatje ziet. Vertel ook wat dit voor plek is.',
      answer: 'Ik zie boeken en tafels. Dit is een bibliotheek, want mensen lezen daar.',
      query: 'public library people reading tables',
    }),
    describe(2, 2, {
      prompt: 'Vertel wat de mensen op dit plaatje doen. Vertel ook of u dat zelf ook doet.',
      answer: 'Ze wachten op de bus. Ik wacht ook vaak op de bus als het regent.',
      query: 'people waiting bus stop city',
    }),
    describe(2, 3, {
      prompt: 'Beschrijf dit plaatje. Vertel ook wat u van dit werk vindt.',
      answer: 'Een man werkt in een winkel en helpt een klant. Dat werk lijkt me leuk.',
      query: 'shop assistant helping customer store',
    }),
    describe(2, 4, {
      prompt: 'Vertel wat u ziet op dit plaatje. Vertel ook waarom dit handig is.',
      answer: 'Ik zie een container voor papier. Dat is handig, want dan gaat papier niet in de vuilnis.',
      query: 'recycling containers street netherlands',
    }),
  ],
  [
    choose(2, 1, {
      prompt: 'Waar eet u liever? Kies één plaatje en vertel waarom.',
      answer: 'Ik eet liever thuis, want dan kan ik zelf koken en het is goedkoper.',
      a: { q: 'family eating dinner at home table', caption: 'thuis eten' },
      b: { q: 'people eating in restaurant', caption: 'in een restaurant' },
    }),
    choose(2, 2, {
      prompt: 'Hoe reist u liever naar een andere stad? Kies één plaatje en leg uit waarom.',
      answer: 'Ik neem liever de trein. In de trein kan ik lezen en ik hoef niet te rijden.',
      a: { q: 'train station platform netherlands', caption: 'met de trein' },
      b: { q: 'driving car highway', caption: 'met de auto' },
    }),
    choose(2, 3, {
      prompt: 'Welke cursus zou u kiezen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de computercursus, want ik wil beter met de computer leren werken.',
      a: { q: 'computer course adults classroom', caption: 'computercursus' },
      b: { q: 'cooking class adults kitchen', caption: 'kookcursus' },
    }),
    choose(2, 4, {
      prompt: 'Waar doet u liever boodschappen? Kies één plaatje en leg uit waarom.',
      answer: 'Ik ga liever naar de markt, want de groente is daar vers en niet duur.',
      a: { q: 'supermarket aisle shopping', caption: 'supermarkt' },
      b: { q: 'street market fresh vegetables stall', caption: 'markt' },
    }),
  ],
  [
    coverAll(2, 1, {
      prompt: 'Vertel wat deze persoon doet. Gebruik alle drie de plaatjes.',
      answer: 'Ze wacht bij de bushalte. Dan zit ze in de bus. Daarna komt ze op haar werk aan.',
      shots: [
        { q: 'woman waiting bus stop', caption: 'wachten' },
        { q: 'passengers inside city bus', caption: 'in de bus' },
        { q: 'woman arriving at office work', caption: 'op het werk' },
      ],
    }),
    coverAll(2, 2, {
      prompt: 'Vertel wat er gebeurt bij de dokter. Gebruik alle plaatjes.',
      answer: 'Hij belt voor een afspraak. Daarna wacht hij. Dan praat hij met de dokter.',
      shots: [
        { q: 'man calling phone at home', caption: 'bellen' },
        { q: 'waiting room chairs patients', caption: 'wachtkamer' },
        { q: 'doctor examining patient', caption: 'bij de dokter' },
      ],
    }),
    coverAll(2, 3, {
      prompt: 'Vertel het verhaal van deze verhuizing. Gebruik alle plaatjes.',
      answer: 'Ze pakken dozen in. Dan rijdt de verhuiswagen. In het nieuwe huis pakken ze uit.',
      shots: [
        { q: 'packing moving boxes home', caption: 'inpakken' },
        { q: 'moving van truck street', caption: 'verhuiswagen' },
        { q: 'unpacking boxes new apartment', caption: 'uitpakken' },
      ],
    }),
    coverAll(2, 4, {
      prompt: 'Vertel wat deze mensen op zaterdag doen. Gebruik alle plaatjes.',
      answer: 'Eerst maken ze het huis schoon. Daarna gaan ze naar het park. ’s Avonds kijken ze tv.',
      shots: [
        { q: 'cleaning house vacuum living room', caption: 'schoonmaken' },
        { q: 'family walking in park', caption: 'naar het park' },
        { q: 'family watching television evening', caption: 'tv kijken' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 3 ───────────────────────────── */

const EXAM_3 = exam([
  [
    react(3, 1, {
      says: 'Goedemorgen. U komt voor de sleutel, hè? Wanneer wilt u de woning bekijken?',
      prompt: 'Iemand van de woningcorporatie praat met u. Geef antwoord op zijn vraag.',
      answer: 'Ik kan woensdagmiddag komen. Na drie uur ben ik vrij.',
      query: 'man handing keys apartment landlord',
      voice: 'man_older',
    }),
    react(3, 2, {
      says: 'Wat leuk dat u meedoet! Wat voor werk wilt u graag als vrijwilliger doen?',
      prompt: 'U meldt zich aan bij een buurthuis. Geef antwoord.',
      answer: 'Ik wil graag helpen met koken. Ik kook thuis ook veel.',
      query: 'volunteer community centre woman talking',
      voice: 'woman_young',
    }),
    react(3, 3, {
      says: 'Uw zoon doet het goed in de klas. Hoe gaat het thuis met zijn huiswerk?',
      prompt: 'U heeft een gesprek met de juf op school. Geef antwoord.',
      answer: 'Thuis maakt hij zijn huiswerk aan de keukentafel. Soms help ik hem met lezen.',
      query: 'teacher parent meeting school classroom',
      voice: 'woman_older',
    }),
    react(3, 4, {
      says: 'Zeg, ik zie u vaak in de tuin. Wat groeit er allemaal bij u?',
      prompt: 'Uw buurman begint een praatje over de tuin. Geef antwoord.',
      answer: 'Ik heb tomaten en kruiden. In de zomer plant ik ook bloemen.',
      query: 'man in garden talking over fence',
      voice: 'man_young',
    }),
  ],
  [
    describe(3, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat deze mensen aan het leren zijn.',
      answer: 'Ik zie volwassenen in een klas. Ze leren Nederlands, want er staan woorden op het bord.',
      query: 'adult students classroom whiteboard lesson',
    }),
    describe(3, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook wanneer u zelf naar zo’n plek gaat.',
      answer: 'Ik zie een apotheek met medicijnen. Ik ga daar als ik ziek ben.',
      query: 'pharmacy counter pharmacist medicine',
    }),
    describe(3, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat u ervan vindt.',
      answer: 'Kinderen spelen op een speelplaats. Ik vind het goed dat kinderen buiten spelen.',
      query: 'children playing playground park',
    }),
    describe(3, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook waarom mensen dit doen.',
      answer: 'Mensen sorteren afval in bakken. Dat doen ze om het milieu te helpen.',
      query: 'person sorting waste recycling bins home',
    }),
  ],
  [
    choose(3, 1, {
      prompt: 'Welke woning zou u kiezen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de woning met een balkon, want dan kan ik buiten zitten.',
      a: { q: 'apartment balcony plants', caption: 'met balkon' },
      b: { q: 'ground floor apartment small garden', caption: 'met tuintje' },
    }),
    choose(3, 2, {
      prompt: 'Hoe leert u liever Nederlands? Kies één plaatje en leg uit waarom.',
      answer: 'Ik leer liever in een klas, want dan kan ik met andere mensen praten.',
      a: { q: 'adult language class group', caption: 'in een klas' },
      b: { q: 'person studying laptop home online', caption: 'thuis op de computer' },
    }),
    choose(3, 3, {
      prompt: 'Waar viert u liever een feest? Kies één plaatje en vertel waarom.',
      answer: 'Ik vier het feest liever in het park, want er is veel ruimte voor de kinderen.',
      a: { q: 'picnic party in park friends', caption: 'in het park' },
      b: { q: 'party at home living room friends', caption: 'thuis' },
    }),
    choose(3, 4, {
      prompt: 'Welk werk zou u liever doen? Kies één plaatje en leg uit waarom.',
      answer: 'Ik werk liever in de winkel, want ik vind het leuk om mensen te helpen.',
      a: { q: 'warehouse worker boxes', caption: 'in een magazijn' },
      b: { q: 'shop worker helping customer', caption: 'in een winkel' },
    }),
  ],
  [
    coverAll(3, 1, {
      prompt: 'Vertel wat deze persoon op een werkdag doet. Gebruik alle plaatjes.',
      answer: 'Ze begint met koffie. Daarna werkt ze achter de computer. ’s Middags eet ze met collega’s.',
      shots: [
        { q: 'woman drinking coffee morning office', caption: 'koffie' },
        { q: 'woman working computer desk', caption: 'werken' },
        { q: 'colleagues having lunch together', caption: 'lunch' },
      ],
    }),
    coverAll(3, 2, {
      prompt: 'Vertel het verhaal van deze dag op school. Gebruik alle plaatjes.',
      answer: 'De vader brengt het kind naar school. In de klas leert het kind lezen. Daarna spelen ze buiten.',
      shots: [
        { q: 'parent bringing child to school', caption: 'naar school' },
        { q: 'children reading in classroom', caption: 'in de klas' },
        { q: 'children playing schoolyard break', caption: 'buiten spelen' },
      ],
    }),
    coverAll(3, 3, {
      prompt: 'Vertel wat er gebeurt als iemand ziek is. Gebruik alle plaatjes.',
      answer: 'Hij voelt zich ziek in bed. Hij gaat naar de dokter. Daarna haalt hij medicijnen.',
      shots: [
        { q: 'sick man in bed thermometer', caption: 'ziek' },
        { q: 'doctor talking to patient office', caption: 'bij de dokter' },
        { q: 'pharmacy customer collecting medicine', caption: 'apotheek' },
      ],
    }),
    coverAll(3, 4, {
      prompt: 'Vertel wat deze mensen samen doen. Gebruik alle drie de plaatjes.',
      answer: 'Ze kopen groente op de markt. Thuis koken ze samen. Daarna eten ze aan tafel.',
      shots: [
        { q: 'buying vegetables market stall', caption: 'boodschappen' },
        { q: 'friends cooking together kitchen', caption: 'koken' },
        { q: 'friends eating dinner together', caption: 'eten' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 4 ───────────────────────────── */

const EXAM_4 = exam([
  [
    react(4, 1, {
      says: 'Welkom bij de sportschool. Wat voor sport wilt u hier gaan doen?',
      prompt: 'U komt bij de balie van een sportschool. Geef antwoord op zijn vraag.',
      answer: 'Ik wil graag fitness doen. Twee keer per week is genoeg voor mij.',
      query: 'gym reception man trainer talking',
      voice: 'man_young',
    }),
    react(4, 2, {
      says: 'U bent nieuw hier, hè? Waar komt u vandaan en hoe bevalt het in Nederland?',
      prompt: 'Een collega maakt een praatje. Geef antwoord in hele zinnen.',
      answer: 'Ik kom uit Marokko. Het bevalt goed, maar het weer is hier kouder.',
      query: 'two colleagues chatting break room',
      voice: 'woman_young',
    }),
    react(4, 3, {
      says: 'Goedemiddag. Uw pakket is te laat, zegt u? Vertelt u eens wat er precies is gebeurd.',
      prompt: 'U belt de klantenservice. Geef antwoord op haar vraag.',
      answer: 'Ik heb vorige week besteld. Het pakket is nog steeds niet gekomen.',
      query: 'customer service woman headset call centre',
      voice: 'woman_older',
    }),
    react(4, 4, {
      says: 'Wij zoeken nog mensen voor de buurtvereniging. Wat zou u willen doen?',
      prompt: 'Iemand van de buurtvereniging spreekt u aan. Geef antwoord.',
      answer: 'Ik wil wel helpen met het schoonmaken van het plein. Dat kan op zaterdag.',
      query: 'older man neighbourhood meeting talking',
      voice: 'man_older',
    }),
  ],
  [
    describe(4, 1, {
      prompt: 'Vertel wat u op het plaatje ziet. Vertel ook wat deze man aan het doen is.',
      answer: 'Ik zie een man met een fiets. Hij maakt de band van zijn fiets.',
      query: 'man repairing bicycle tyre street',
    }),
    describe(4, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook of u hier graag zou komen.',
      answer: 'Ik zie een klein café met tafeltjes buiten. Ik zou daar graag koffie drinken.',
      query: 'small cafe terrace tables outside',
    }),
    describe(4, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat er moeilijk aan is.',
      answer: 'Een vrouw draagt veel tassen. Dat is zwaar en ze kan de deur niet openmaken.',
      query: 'woman carrying many shopping bags',
    }),
    describe(4, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook waarom dit belangrijk is.',
      answer: 'Ik zie een zebrapad met kinderen. Dat is belangrijk, want zo steken ze veilig over.',
      query: 'children crossing zebra crossing street',
    }),
  ],
  [
    choose(4, 1, {
      prompt: 'Wat neemt u liever mee naar het werk? Kies één plaatje en vertel waarom.',
      answer: 'Ik neem liever brood van thuis mee, want dat is goedkoper en gezonder.',
      a: { q: 'packed lunch sandwich box', caption: 'brood van thuis' },
      b: { q: 'takeaway lunch food counter', caption: 'iets kopen' },
    }),
    choose(4, 2, {
      prompt: 'Welke vakantie lijkt u leuker? Kies één plaatje en leg uit waarom.',
      answer: 'Ik kies de stad, want dan kan ik musea bekijken en veel lopen.',
      a: { q: 'city trip tourists street europe', caption: 'stedentrip' },
      b: { q: 'camping tent nature holiday', caption: 'kamperen' },
    }),
    choose(4, 3, {
      prompt: 'Hoe wilt u liever betalen? Kies één plaatje en vertel waarom.',
      answer: 'Ik betaal liever met mijn pas, want dan hoef ik geen geld mee te nemen.',
      a: { q: 'paying with debit card terminal', caption: 'met de pas' },
      b: { q: 'paying cash money hand shop', caption: 'contant' },
    }),
    choose(4, 4, {
      prompt: 'Welk huisdier zou u kiezen? Kies één plaatje en leg uit waarom.',
      answer: 'Ik kies de kat, want een kat kan alleen thuis blijven als ik werk.',
      a: { q: 'cat sitting living room', caption: 'een kat' },
      b: { q: 'dog on a walk park', caption: 'een hond' },
    }),
  ],
  [
    coverAll(4, 1, {
      prompt: 'Vertel wat deze persoon met de was doet. Gebruik alle plaatjes.',
      answer: 'Ze doet de was in de machine. Daarna hangt ze de was op. Later strijkt ze het.',
      shots: [
        { q: 'putting laundry in washing machine', caption: 'wassen' },
        { q: 'hanging laundry to dry', caption: 'ophangen' },
        { q: 'ironing clothes at home', caption: 'strijken' },
      ],
    }),
    coverAll(4, 2, {
      prompt: 'Vertel wat er in de winkel gebeurt. Gebruik alle drie de plaatjes.',
      answer: 'Hij pakt een mandje. Dan kiest hij groente. Bij de kassa betaalt hij.',
      shots: [
        { q: 'shopping basket supermarket entrance', caption: 'mandje' },
        { q: 'choosing vegetables supermarket', caption: 'kiezen' },
        { q: 'paying at supermarket checkout', caption: 'betalen' },
      ],
    }),
    coverAll(4, 3, {
      prompt: 'Vertel het verhaal van deze sollicitatie. Gebruik alle plaatjes.',
      answer: 'Ze leest een vacature. Dan gaat ze op gesprek. Later begint ze in de winkel.',
      shots: [
        { q: 'reading job advertisement newspaper laptop', caption: 'vacature' },
        { q: 'job interview two people office', caption: 'gesprek' },
        { q: 'new employee working shop', caption: 'aan het werk' },
      ],
    }),
    coverAll(4, 4, {
      prompt: 'Vertel wat deze familie in het weekend doet. Gebruik alle plaatjes.',
      answer: 'Ze fietsen naar het bos. Daar eten ze samen brood. Daarna spelen de kinderen.',
      shots: [
        { q: 'family cycling countryside path', caption: 'fietsen' },
        { q: 'family picnic blanket outdoors', caption: 'picknick' },
        { q: 'children playing forest nature', caption: 'spelen' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 5 ───────────────────────────── */

const EXAM_5 = exam([
  [
    react(5, 1, {
      says: 'Goedemiddag. U wilt een rekening openen? Vertelt u eens waarvoor u die nodig heeft.',
      prompt: 'U zit bij de bank. Geef antwoord op haar vraag.',
      answer: 'Ik krijg binnenkort salaris van mijn werk. Daarom heb ik een rekening nodig.',
      query: 'bank employee woman talking customer desk',
      voice: 'woman_older',
    }),
    react(5, 2, {
      says: 'Hé, wij gaan zondag wandelen in het bos. Gaat u mee, en hoe laat kunt u?',
      prompt: 'Een vriend vraagt u iets. Geef antwoord in hele zinnen.',
      answer: 'Ja, leuk. Ik kan pas na twaalf uur, want ’s ochtends werk ik.',
      query: 'friends talking outdoors walking invitation',
      voice: 'man_young',
    }),
    react(5, 3, {
      says: 'De kraan lekt al een week, hoor ik. Wanneer kan ik langskomen om het te maken?',
      prompt: 'De klusjesman van de woningcorporatie belt u. Geef antwoord.',
      answer: 'Kunt u donderdagochtend komen? Dan ben ik thuis tot een uur of twaalf.',
      query: 'plumber repairman talking phone toolbox',
      voice: 'man_older',
    }),
    react(5, 4, {
      says: 'Wij zoeken nog ouders voor het schoolreisje. Kunt u meehelpen, en wat kunt u doen?',
      prompt: 'De juf van school vraagt om hulp. Geef antwoord.',
      answer: 'Ik kan meegaan met de bus. Ik kan ook helpen met het eten.',
      query: 'teacher talking parent school hallway',
      voice: 'woman_young',
    }),
  ],
  [
    describe(5, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat deze mensen aan het vieren zijn.',
      answer: 'Ik zie mensen met taart en slingers. Ze vieren een verjaardag.',
      query: 'people celebrating birthday cake decorations',
    }),
    describe(5, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook hoe vaak u hier komt.',
      answer: 'Ik zie een postkantoor met een balie. Ik kom daar bijna nooit.',
      query: 'post office counter customer parcel',
    }),
    describe(5, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat u zou doen.',
      answer: 'Een man is zijn sleutels kwijt bij de deur. Ik zou de buren om hulp vragen.',
      query: 'man searching pockets front door locked',
    }),
    describe(5, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook waarom mensen hier graag komen.',
      answer: 'Ik zie een groot park met bomen en banken. Mensen komen hier voor de rust.',
      query: 'city park benches trees people',
    }),
  ],
  [
    choose(5, 1, {
      prompt: 'Welke jas zou u kopen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de dikke winterjas, want het wordt hier in de winter erg koud.',
      a: { q: 'warm winter coat clothing store', caption: 'winterjas' },
      b: { q: 'light rain jacket clothing', caption: 'dunne regenjas' },
    }),
    choose(5, 2, {
      prompt: 'Wat doet u liever op een vrije avond? Kies één plaatje en leg uit waarom.',
      answer: 'Ik ga liever naar de bioscoop, want thuis kijk ik toch al veel tv.',
      a: { q: 'cinema audience watching film', caption: 'naar de bioscoop' },
      b: { q: 'reading book sofa at home evening', caption: 'thuis lezen' },
    }),
    choose(5, 3, {
      prompt: 'Welke bijbaan zou u kiezen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies werken in de keuken, want ik kook graag en ik leer daar veel.',
      a: { q: 'kitchen staff restaurant cooking', caption: 'in de keuken' },
      b: { q: 'cleaner cleaning office building', caption: 'schoonmaken' },
    }),
    choose(5, 4, {
      prompt: 'Hoe wilt u liever nieuws volgen? Kies één plaatje en leg uit waarom.',
      answer: 'Ik kijk liever het journaal, want ik begrijp het beter als ik het hoor en zie.',
      a: { q: 'watching news television living room', caption: 'op tv' },
      b: { q: 'reading newspaper at table', caption: 'in de krant' },
    }),
  ],
  [
    coverAll(5, 1, {
      prompt: 'Vertel wat deze persoon in de avond doet. Gebruik alle plaatjes.',
      answer: 'Hij kookt eten. Daarna doet hij de afwas. Dan gaat hij vroeg slapen.',
      shots: [
        { q: 'man cooking dinner kitchen evening', caption: 'koken' },
        { q: 'washing dishes sink kitchen', caption: 'afwassen' },
        { q: 'person sleeping bedroom night', caption: 'slapen' },
      ],
    }),
    coverAll(5, 2, {
      prompt: 'Vertel het verhaal van deze reis. Gebruik alle drie de plaatjes.',
      answer: 'Ze koopt een kaartje. Dan stapt ze in de trein. In de andere stad stapt ze uit.',
      shots: [
        { q: 'buying train ticket machine station', caption: 'kaartje' },
        { q: 'woman sitting in train window', caption: 'in de trein' },
        { q: 'passengers leaving train platform', caption: 'aankomen' },
      ],
    }),
    coverAll(5, 3, {
      prompt: 'Vertel wat deze mensen in de tuin doen. Gebruik alle plaatjes.',
      answer: 'Eerst maken ze de grond klaar. Dan planten ze bloemen. Daarna geven ze water.',
      shots: [
        { q: 'digging garden soil spade', caption: 'grond' },
        { q: 'planting flowers garden hands', caption: 'planten' },
        { q: 'watering plants garden hose', caption: 'water geven' },
      ],
    }),
    coverAll(5, 4, {
      prompt: 'Vertel wat er misgaat en hoe het afloopt. Gebruik alle plaatjes.',
      answer: 'Er is water op de vloer. Ze belt de loodgieter. Daarna is de keuken weer droog.',
      shots: [
        { q: 'water leak kitchen floor', caption: 'lekkage' },
        { q: 'woman on phone kitchen worried', caption: 'bellen' },
        { q: 'plumber fixing pipe under sink', caption: 'gemaakt' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 6 ───────────────────────────── */

const EXAM_6 = exam([
  [
    react(6, 1, {
      says: 'U wilt uw rijbewijs halen, hoor ik. Waarom wilt u leren autorijden?',
      prompt: 'De rij-instructeur stelt u een vraag. Geef antwoord.',
      answer: 'Ik wil autorijden voor mijn werk. Met de bus ben ik te lang onderweg.',
      query: 'driving instructor car talking student',
      voice: 'man_older',
    }),
    react(6, 2, {
      says: 'Goedemorgen! Wat kan ik voor u snijden vandaag?',
      prompt: 'U staat bij de slager. Geef antwoord op haar vraag.',
      answer: 'Ik wil graag een halve kilo kipfilet. En vier gehaktballen, alstublieft.',
      query: 'butcher shop woman serving customer',
      voice: 'woman_young',
    }),
    react(6, 3, {
      says: 'U heeft zich ingeschreven voor de bibliotheek. Wat voor boeken leest u graag?',
      prompt: 'De medewerker van de bibliotheek vraagt iets. Geef antwoord.',
      answer: 'Ik lees graag makkelijke boeken over echte mensen. Ook lees ik kookboeken.',
      query: 'librarian helping visitor library desk',
      voice: 'woman_older',
    }),
    react(6, 4, {
      says: 'Zeg buurman, mijn auto start niet. Kunt u misschien even helpen?',
      prompt: 'Uw buurman vraagt om hulp. Geef antwoord.',
      answer: 'Ja, ik kom zo naar buiten. Ik heb kabels in mijn schuur liggen.',
      query: 'man asking neighbour help car street',
      voice: 'man_young',
    }),
  ],
  [
    describe(6, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat hier verkocht wordt.',
      answer: 'Ik zie een bakker met brood en broodjes. Daar verkopen ze ook koek.',
      query: 'bakery bread display shop',
    }),
    describe(6, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook wat de mensen hier komen doen.',
      answer: 'Ik zie een gemeentehuis met een balie. Mensen halen daar papieren op.',
      query: 'town hall service desk citizens',
    }),
    describe(6, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook of dit gezond is.',
      answer: 'Mensen sporten in een sportschool. Dat is gezond, want ze bewegen veel.',
      query: 'people exercising gym fitness',
    }),
    describe(6, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook wat u van dit weer vindt.',
      answer: 'Ik zie sneeuw op straat en op de auto’s. Ik vind sneeuw mooi, maar koud.',
      query: 'snowy street cars winter city',
    }),
  ],
  [
    choose(6, 1, {
      prompt: 'Welke telefoon zou u kiezen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de goedkope telefoon, want ik bel alleen en ik heb niet veel nodig.',
      a: { q: 'simple mobile phone in hand', caption: 'eenvoudige telefoon' },
      b: { q: 'modern smartphone display store', caption: 'dure smartphone' },
    }),
    choose(6, 2, {
      prompt: 'Waar wilt u liever wonen? Kies één plaatje en leg uit waarom.',
      answer: 'Ik woon liever in het dorp, want daar is het rustig en de huizen zijn goedkoper.',
      a: { q: 'quiet village street houses netherlands', caption: 'in een dorp' },
      b: { q: 'busy city centre street people', caption: 'in de stad' },
    }),
    choose(6, 3, {
      prompt: 'Welke cursus zou u volgen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de naaicursus, want dan kan ik mijn eigen kleren maken.',
      a: { q: 'sewing class women fabric', caption: 'naaicursus' },
      b: { q: 'painting class adults art', caption: 'schildercursus' },
    }),
    choose(6, 4, {
      prompt: 'Wat drinkt u liever in de ochtend? Kies één plaatje en leg uit waarom.',
      answer: 'Ik drink liever thee, want koffie is te sterk voor mij.',
      a: { q: 'cup of tea morning table', caption: 'thee' },
      b: { q: 'cup of coffee morning table', caption: 'koffie' },
    }),
  ],
  [
    coverAll(6, 1, {
      prompt: 'Vertel wat deze persoon doet als het regent. Gebruik alle plaatjes.',
      answer: 'Hij kijkt naar buiten en het regent. Dan pakt hij zijn jas en paraplu. Daarna loopt hij naar de bus.',
      shots: [
        { q: 'looking out window rain', caption: 'regen' },
        { q: 'person taking umbrella coat hallway', caption: 'jas en paraplu' },
        { q: 'person walking rain umbrella street', caption: 'naar buiten' },
      ],
    }),
    coverAll(6, 2, {
      prompt: 'Vertel het verhaal van dit bezoek. Gebruik alle drie de plaatjes.',
      answer: 'Ze koopt bloemen. Dan gaat ze op bezoek bij haar oma. Samen drinken ze thee.',
      shots: [
        { q: 'buying flowers florist shop', caption: 'bloemen kopen' },
        { q: 'young woman visiting elderly grandmother', caption: 'op bezoek' },
        { q: 'two women drinking tea together', caption: 'thee drinken' },
      ],
    }),
    coverAll(6, 3, {
      prompt: 'Vertel wat er op dit feest gebeurt. Gebruik alle plaatjes.',
      answer: 'Ze zetten tafels klaar. Dan komen de gasten binnen. Later dansen ze samen.',
      shots: [
        { q: 'setting tables party preparation', caption: 'klaarzetten' },
        { q: 'guests arriving party entrance', caption: 'gasten' },
        { q: 'people dancing party music', caption: 'dansen' },
      ],
    }),
    coverAll(6, 4, {
      prompt: 'Vertel wat deze persoon met de post doet. Gebruik alle plaatjes.',
      answer: 'Ze haalt een brief uit de bus. Ze leest de brief. Daarna schrijft ze een antwoord.',
      shots: [
        { q: 'taking letter from mailbox', caption: 'post halen' },
        { q: 'woman reading letter at table', caption: 'lezen' },
        { q: 'writing letter by hand desk', caption: 'antwoorden' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 7 ───────────────────────────── */

const EXAM_7 = exam([
  [
    react(7, 1, {
      says: 'U komt voor de tandarts. Wanneer bent u hier voor het laatst geweest?',
      prompt: 'De assistente van de tandarts vraagt iets. Geef antwoord.',
      answer: 'Ik ben ongeveer een jaar geleden geweest. Toen had ik pijn aan een kies.',
      query: 'dental assistant reception talking patient',
      voice: 'woman_young',
    }),
    react(7, 2, {
      says: 'Wij hebben een kamer vrij vanaf oktober. Met hoeveel mensen komt u wonen?',
      prompt: 'De verhuurder belt u over een kamer. Geef antwoord.',
      answer: 'Wij komen met zijn tweeën. Mijn vrouw en ik werken allebei.',
      query: 'landlord man phone apartment keys',
      voice: 'man_older',
    }),
    react(7, 3, {
      says: 'Wat fijn dat u er bent. Wat wilt u dit jaar het liefste leren?',
      prompt: 'Uw begeleider bij de inburgering vraagt iets. Geef antwoord.',
      answer: 'Ik wil het liefst beter leren schrijven. Brieven vind ik nog moeilijk.',
      query: 'social worker talking client office',
      voice: 'woman_older',
    }),
    react(7, 4, {
      says: 'Zeg, ik ga volgende week verhuizen. Kunt u misschien helpen met dragen?',
      prompt: 'Een kennis vraagt om hulp. Geef antwoord.',
      answer: 'Ja hoor, dat wil ik wel doen. Zaterdag ben ik de hele dag vrij.',
      query: 'man asking friend help moving boxes',
      voice: 'man_young',
    }),
  ],
  [
    describe(7, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat deze mensen aan het doen zijn.',
      answer: 'Ik zie mensen in een rij bij een loket. Ze wachten om geholpen te worden.',
      query: 'people queue counter waiting line office',
    }),
    describe(7, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook wat u hier zou kopen.',
      answer: 'Ik zie een winkel met kleding. Ik zou daar een trui kopen.',
      query: 'clothing store racks shirts',
    }),
    describe(7, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat er gevaarlijk is.',
      answer: 'Een man staat op een ladder. Dat is gevaarlijk, want hij kan vallen.',
      query: 'man on ladder painting wall',
    }),
    describe(7, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook waarom mensen dit doen.',
      answer: 'Mensen brengen oude spullen naar een kringloopwinkel. Zo kan iemand anders ze gebruiken.',
      query: 'second hand shop donated items charity',
    }),
  ],
  [
    choose(7, 1, {
      prompt: 'Welke fiets zou u kopen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de gewone fiets, want die is goedkoper en makkelijk te maken.',
      a: { q: 'city bicycle parked street', caption: 'gewone fiets' },
      b: { q: 'electric bike ebike rider', caption: 'elektrische fiets' },
    }),
    choose(7, 2, {
      prompt: 'Waar zou u liever werken? Kies één plaatje en leg uit waarom.',
      answer: 'Ik werk liever buiten, want dan zit ik niet de hele dag stil.',
      a: { q: 'gardener working outdoors park', caption: 'buiten werken' },
      b: { q: 'office worker desk computer', caption: 'op kantoor' },
    }),
    choose(7, 3, {
      prompt: 'Wat eet u liever als ontbijt? Kies één plaatje en vertel waarom.',
      answer: 'Ik eet liever brood, want dat gaat snel en ik heb ’s ochtends weinig tijd.',
      a: { q: 'bread slices breakfast plate', caption: 'brood' },
      b: { q: 'bowl of yoghurt fruit breakfast', caption: 'yoghurt met fruit' },
    }),
    choose(7, 4, {
      prompt: 'Welke les zou u kiezen voor uw kind? Kies één plaatje en leg uit waarom.',
      answer: 'Ik kies zwemles, want zwemmen is in Nederland heel belangrijk.',
      a: { q: 'children swimming lesson pool', caption: 'zwemles' },
      b: { q: 'children music lesson instruments', caption: 'muziekles' },
    }),
  ],
  [
    coverAll(7, 1, {
      prompt: 'Vertel wat deze persoon met de fiets doet. Gebruik alle plaatjes.',
      answer: 'Ze zet haar fiets op slot. Later is de band leeg. Ze brengt hem naar de fietsenmaker.',
      shots: [
        { q: 'locking bicycle rack street', caption: 'op slot' },
        { q: 'flat bicycle tyre close up', caption: 'lekke band' },
        { q: 'bicycle repair shop working', caption: 'fietsenmaker' },
      ],
    }),
    coverAll(7, 2, {
      prompt: 'Vertel het verhaal van deze dag op het strand. Gebruik alle plaatjes.',
      answer: 'Ze rijden naar het strand. Daar liggen ze in de zon. Later eten ze een ijsje.',
      shots: [
        { q: 'car driving to beach road', caption: 'op weg' },
        { q: 'people sunbathing beach towels', caption: 'op het strand' },
        { q: 'eating ice cream summer', caption: 'ijsje' },
      ],
    }),
    coverAll(7, 3, {
      prompt: 'Vertel wat er in deze klas gebeurt. Gebruik alle drie de plaatjes.',
      answer: 'De docent legt iets uit. De cursisten maken oefeningen. Aan het eind krijgen ze een diploma.',
      shots: [
        { q: 'teacher explaining whiteboard adults', caption: 'uitleg' },
        { q: 'adult students writing exercises', caption: 'oefenen' },
        { q: 'receiving certificate diploma ceremony', caption: 'diploma' },
      ],
    }),
    coverAll(7, 4, {
      prompt: 'Vertel wat deze persoon met het pakket doet. Gebruik alle plaatjes.',
      answer: 'Hij pakt de doos in. Dan brengt hij hem naar het postkantoor. Later komt het pakket aan.',
      shots: [
        { q: 'packing cardboard box tape', caption: 'inpakken' },
        { q: 'post office parcel counter', caption: 'wegbrengen' },
        { q: 'delivery courier handing parcel door', caption: 'bezorgd' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 8 ───────────────────────────── */

const EXAM_8 = exam([
  [
    react(8, 1, {
      says: 'Goedemiddag. U wilt een klacht melden over de woning? Vertelt u eens wat er aan de hand is.',
      prompt: 'U belt de woningcorporatie. Geef antwoord op haar vraag.',
      answer: 'De verwarming in de woonkamer doet het niet. Het is er heel koud.',
      query: 'woman call centre headset talking',
      voice: 'woman_older',
    }),
    react(8, 2, {
      says: 'Wij zoeken iemand voor de zaterdag. Hoeveel uur wilt u werken?',
      prompt: 'De eigenaar van een winkel praat met u. Geef antwoord.',
      answer: 'Ik wil graag acht uur op zaterdag werken. Doordeweeks heb ik school.',
      query: 'shop owner man talking applicant',
      voice: 'man_older',
    }),
    react(8, 3, {
      says: 'Uw dochter fietst nu zelf naar school, hè? Hoe gaat dat?',
      prompt: 'Een moeder van school praat met u. Geef antwoord.',
      answer: 'Dat gaat goed. Ze fietst samen met een vriendin en het is niet ver.',
      query: 'two mothers talking school gate',
      voice: 'woman_young',
    }),
    react(8, 4, {
      says: 'Ik hoorde dat u gaat verhuizen. Waar gaat u naartoe en wanneer?',
      prompt: 'Een collega vraagt iets. Geef antwoord in hele zinnen.',
      answer: 'Ik ga naar Utrecht, dichter bij mijn werk. Ik verhuis op 1 september.',
      query: 'colleagues talking coffee break office',
      voice: 'man_young',
    }),
  ],
  [
    describe(8, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat er te koop is.',
      answer: 'Ik zie een kraam op de markt met kaas. Je kunt daar veel soorten kaas kopen.',
      query: 'cheese market stall netherlands',
    }),
    describe(8, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook wat deze vrouw aan het doen is.',
      answer: 'Een vrouw zit achter een computer met papieren. Ze doet haar administratie.',
      query: 'woman working laptop papers desk home',
    }),
    describe(8, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat u ervan vindt.',
      answer: 'Mensen ruimen samen zwerfafval op. Ik vind dat heel goed voor de buurt.',
      query: 'volunteers picking up litter street',
    }),
    describe(8, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook wanneer u hier zou zijn.',
      answer: 'Ik zie een druk station met treinen. Ik ben daar als ik naar mijn familie ga.',
      query: 'busy train station platform commuters',
    }),
  ],
  [
    choose(8, 1, {
      prompt: 'Welke bank zou u in de woonkamer zetten? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de grote bank, want wij krijgen vaak bezoek van familie.',
      a: { q: 'large sofa living room', caption: 'grote bank' },
      b: { q: 'two armchairs living room', caption: 'twee fauteuils' },
    }),
    choose(8, 2, {
      prompt: 'Wat doet u liever in de zomer? Kies één plaatje en leg uit waarom.',
      answer: 'Ik zwem liever in het zwembad, want daar is het water schoon en warm.',
      a: { q: 'outdoor swimming pool summer people', caption: 'in het zwembad' },
      b: { q: 'swimming in lake nature summer', caption: 'in het meer' },
    }),
    choose(8, 3, {
      prompt: 'Welk vervoer kiest u voor korte ritten? Kies één plaatje en vertel waarom.',
      answer: 'Ik ga lopend, want het is gezond en ik hoef niet te wachten.',
      a: { q: 'person walking pavement city', caption: 'lopen' },
      b: { q: 'tram in city street netherlands', caption: 'met de tram' },
    }),
    choose(8, 4, {
      prompt: 'Welk cadeau geeft u aan een kind? Kies er één en leg uit waarom.',
      answer: 'Ik geef het spel, want dan kan het kind samen met anderen spelen.',
      a: { q: 'board game box children playing', caption: 'een spel' },
      b: { q: 'stuffed animal toy gift', caption: 'een knuffel' },
    }),
  ],
  [
    coverAll(8, 1, {
      prompt: 'Vertel wat deze persoon met het eten doet. Gebruik alle plaatjes.',
      answer: 'Ze snijdt groente. Daarna kookt ze soep. Later eet de familie samen.',
      shots: [
        { q: 'cutting vegetables cutting board', caption: 'snijden' },
        { q: 'soup pot cooking stove', caption: 'koken' },
        { q: 'family eating soup at table', caption: 'eten' },
      ],
    }),
    coverAll(8, 2, {
      prompt: 'Vertel het verhaal van deze sollicitatie. Gebruik alle drie de plaatjes.',
      answer: 'Hij schrijft een brief. Dan gaat hij op gesprek. Later krijgt hij goed nieuws aan de telefoon.',
      shots: [
        { q: 'writing application letter laptop', caption: 'brief schrijven' },
        { q: 'interview handshake office', caption: 'gesprek' },
        { q: 'happy man phone good news', caption: 'goed nieuws' },
      ],
    }),
    coverAll(8, 3, {
      prompt: 'Vertel wat er bij de kapper gebeurt. Gebruik alle plaatjes.',
      answer: 'Ze maakt een afspraak. Bij de kapper knippen ze haar haar. Daarna kijkt ze in de spiegel.',
      shots: [
        { q: 'making appointment phone salon', caption: 'afspraak' },
        { q: 'hairdresser cutting hair salon', caption: 'knippen' },
        { q: 'woman looking mirror new haircut', caption: 'klaar' },
      ],
    }),
    coverAll(8, 4, {
      prompt: 'Vertel wat deze mensen in het buurthuis doen. Gebruik alle plaatjes.',
      answer: 'Ze zetten stoelen klaar. Dan drinken ze koffie met elkaar. Daarna praten ze in een groep.',
      shots: [
        { q: 'arranging chairs community hall', caption: 'klaarzetten' },
        { q: 'people drinking coffee community centre', caption: 'koffie' },
        { q: 'group discussion circle community', caption: 'praten' },
      ],
    }),
  ],
]);

/* ───────────────────────────── oefenexamen 9 ───────────────────────────── */

const EXAM_9 = exam([
  [
    react(9, 1, {
      says: 'U wilt een cursus doen bij ons. Op welke dagen kunt u het beste komen?',
      prompt: 'De medewerker van het opleidingscentrum vraagt iets. Geef antwoord.',
      answer: 'Ik kan op dinsdag en donderdag. Op die dagen werk ik niet.',
      query: 'education centre advisor talking desk',
      voice: 'man_young',
    }),
    react(9, 2, {
      says: 'U komt voor de kinderopvang, hè? Hoe oud is uw kind?',
      prompt: 'U bezoekt een kinderdagverblijf. Geef antwoord op haar vraag.',
      answer: 'Mijn dochter is twee jaar oud. Ze wordt in maart drie.',
      query: 'childcare worker woman talking parent',
      voice: 'woman_young',
    }),
    react(9, 3, {
      says: 'Uw fiets stond op de stoep, meneer. Weet u waar u hier mag parkeren?',
      prompt: 'Een handhaver spreekt u aan. Geef antwoord.',
      answer: 'Sorry, dat wist ik niet. Ik zet mijn fiets meteen in het rek.',
      query: 'city enforcement officer talking street',
      voice: 'man_older',
    }),
    react(9, 4, {
      says: 'Wat een lekker eten heeft u meegenomen! Wat is dit precies?',
      prompt: 'Op een buurtfeest vraagt iemand naar uw eten. Geef antwoord.',
      answer: 'Dit is rijst met kip en groente. Het is een gerecht uit mijn land.',
      query: 'neighbours sharing food street party',
      voice: 'woman_older',
    }),
  ],
  [
    describe(9, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat deze man aan het doen is.',
      answer: 'Ik zie een man met verf en een kwast. Hij schildert de muur.',
      query: 'man painting wall roller home',
    }),
    describe(9, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook waarom mensen hier komen.',
      answer: 'Ik zie een groot zwembad met banen. Mensen komen hier om te zwemmen en te sporten.',
      query: 'indoor swimming pool lanes',
    }),
    describe(9, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat u zou doen.',
      answer: 'Een vrouw kijkt naar een lege portemonnee. Ik zou naar de bank bellen.',
      query: 'woman looking empty wallet worried',
    }),
    describe(9, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook waar dit voor is.',
      answer: 'Ik zie een bord met tijden bij een halte. Dat is voor de bussen die komen.',
      query: 'bus timetable sign stop city',
    }),
  ],
  [
    choose(9, 1, {
      prompt: 'Welke tafel zou u kopen? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies de grote tafel, want wij eten met vijf mensen.',
      a: { q: 'large wooden dining table', caption: 'grote tafel' },
      b: { q: 'small round kitchen table two chairs', caption: 'kleine tafel' },
    }),
    choose(9, 2, {
      prompt: 'Hoe wilt u liever iets leren? Kies één plaatje en leg uit waarom.',
      answer: 'Ik leer liever met een boek, want dan kan ik alles rustig teruglezen.',
      a: { q: 'studying textbook notes table', caption: 'uit een boek' },
      b: { q: 'watching video tutorial tablet', caption: 'met filmpjes' },
    }),
    choose(9, 3, {
      prompt: 'Waar gaat u liever heen met de kinderen? Kies één plaatje en vertel waarom.',
      answer: 'Ik ga liever naar de dierentuin, want de kinderen vinden dieren heel leuk.',
      a: { q: 'zoo visitors animals family', caption: 'dierentuin' },
      b: { q: 'museum family children exhibition', caption: 'museum' },
    }),
    choose(9, 4, {
      prompt: 'Welke schoenen koopt u voor uw werk? Kies één plaatje en leg uit waarom.',
      answer: 'Ik kies de stevige schoenen, want ik sta de hele dag.',
      a: { q: 'sturdy work shoes pair', caption: 'stevige schoenen' },
      b: { q: 'smart formal shoes pair', caption: 'nette schoenen' },
    }),
  ],
  [
    coverAll(9, 1, {
      prompt: 'Vertel wat deze persoon in de ochtend doet. Gebruik alle plaatjes.',
      answer: 'Ze wordt wakker. Daarna doucht ze. Dan brengt ze de kinderen naar school.',
      shots: [
        { q: 'woman waking up bed morning', caption: 'wakker worden' },
        { q: 'bathroom shower morning routine', caption: 'douchen' },
        { q: 'mother walking children to school', caption: 'naar school' },
      ],
    }),
    coverAll(9, 2, {
      prompt: 'Vertel het verhaal van deze afspraak. Gebruik alle drie de plaatjes.',
      answer: 'Hij schrijft de afspraak in zijn agenda. Op die dag reist hij met de bus. Daar wordt hij geholpen.',
      shots: [
        { q: 'writing appointment calendar agenda', caption: 'agenda' },
        { q: 'man travelling by bus window', caption: 'onderweg' },
        { q: 'municipal office helping citizen counter', caption: 'afspraak' },
      ],
    }),
    coverAll(9, 3, {
      prompt: 'Vertel wat er in deze tuin gebeurt. Gebruik alle plaatjes.',
      answer: 'Het gras is te lang. Hij maait het gras. Daarna zit de familie buiten.',
      shots: [
        { q: 'overgrown garden long grass', caption: 'lang gras' },
        { q: 'man mowing lawn garden', caption: 'maaien' },
        { q: 'family sitting garden table outdoors', caption: 'buiten zitten' },
      ],
    }),
    coverAll(9, 4, {
      prompt: 'Vertel wat deze persoon met de telefoon doet. Gebruik alle plaatjes.',
      answer: 'Haar telefoon valt op de grond. Het scherm is stuk. Ze laat hem in de winkel maken.',
      shots: [
        { q: 'dropped phone on floor', caption: 'gevallen' },
        { q: 'cracked phone screen close up', caption: 'stuk' },
        { q: 'phone repair shop technician', caption: 'gemaakt' },
      ],
    }),
  ],
]);

/* ──────────────────────────── oefenexamen 10 ───────────────────────────── */

const EXAM_10 = exam([
  [
    react(10, 1, {
      says: 'Goedemorgen. U wilt een paspoort aanvragen? Heeft u alle papieren bij u?',
      prompt: 'U staat bij de balie van de gemeente. Geef antwoord op haar vraag.',
      answer: 'Ja, ik heb mijn oude paspoort en een pasfoto bij me.',
      query: 'municipality clerk woman counter documents',
      voice: 'woman_older',
    }),
    react(10, 2, {
      says: 'Wij starten een wandelgroep in de buurt. Zou u mee willen doen?',
      prompt: 'Een buurman vertelt u iets. Geef antwoord.',
      answer: 'Dat lijkt me leuk. Ik wandel graag, vooral op zondagochtend.',
      query: 'man talking neighbour park walking group',
      voice: 'man_young',
    }),
    react(10, 3, {
      says: 'U werkt hier nu een half jaar. Wat vindt u tot nu toe van het werk?',
      prompt: 'Uw leidinggevende heeft een gesprek met u. Geef antwoord.',
      answer: 'Ik vind het werk leuk. De collega’s helpen mij en ik leer veel Nederlands.',
      query: 'manager man meeting employee office',
      voice: 'man_older',
    }),
    react(10, 4, {
      says: 'Wat kan ik voor u doen? Zoekt u iets bepaalds?',
      prompt: 'Een verkoopster spreekt u aan in een winkel. Geef antwoord.',
      answer: 'Ik zoek een warme trui, maat medium. Heeft u die in het blauw?',
      query: 'shop assistant woman helping customer clothes',
      voice: 'woman_young',
    }),
  ],
  [
    describe(10, 1, {
      prompt: 'Vertel wat u op dit plaatje ziet. Vertel ook wat er hier gebeurt.',
      answer: 'Ik zie een groep mensen aan een lange tafel. Ze eten samen in het buurthuis.',
      query: 'community dinner long table people eating',
    }),
    describe(10, 2, {
      prompt: 'Beschrijf dit plaatje. Vertel ook of u hier zou willen werken.',
      answer: 'Ik zie een keuken van een restaurant met koks. Ik zou daar wel willen werken.',
      query: 'restaurant kitchen chefs cooking',
    }),
    describe(10, 3, {
      prompt: 'Vertel wat er op dit plaatje gebeurt. Vertel ook wat er lastig is.',
      answer: 'Een man duwt een kinderwagen door de sneeuw. Dat is lastig, want de wielen glijden.',
      query: 'man pushing stroller snow street',
    }),
    describe(10, 4, {
      prompt: 'Vertel wat u ziet. Vertel ook wanneer u dit gebruikt.',
      answer: 'Ik zie een automaat voor kaartjes op het station. Die gebruik ik als ik ga reizen.',
      query: 'ticket machine train station',
    }),
  ],
  [
    choose(10, 1, {
      prompt: 'Welke vakantie kiest u met het gezin? Kies één plaatje en vertel waarom.',
      answer: 'Ik kies het huisje, want daar kunnen we zelf koken en dat is goedkoper.',
      a: { q: 'holiday cottage family nature', caption: 'een huisje' },
      b: { q: 'hotel room family holiday', caption: 'een hotel' },
    }),
    choose(10, 2, {
      prompt: 'Wat doet u liever op zondag? Kies één plaatje en leg uit waarom.',
      answer: 'Ik ga liever fietsen, want dan kom ik buiten en ik beweeg.',
      a: { q: 'cycling countryside sunday leisure', caption: 'fietsen' },
      b: { q: 'family board game table home', caption: 'thuis spelletjes doen' },
    }),
    choose(10, 3, {
      prompt: 'Welke woning zou u huren? Kies één plaatje en vertel waarom.',
      answer: 'Ik huur de woning bij het station, want dan ben ik snel op mijn werk.',
      a: { q: 'apartment near train station city', caption: 'bij het station' },
      b: { q: 'quiet residential street houses', caption: 'in een rustige straat' },
    }),
    choose(10, 4, {
      prompt: 'Hoe wilt u liever contact houden met familie? Kies één plaatje en leg uit waarom.',
      answer: 'Ik bel liever met beeld, want dan kan ik mijn familie ook zien.',
      a: { q: 'video call family laptop screen', caption: 'videobellen' },
      b: { q: 'writing message phone texting', caption: 'berichtjes sturen' },
    }),
  ],
  [
    coverAll(10, 1, {
      prompt: 'Vertel wat deze persoon met de boodschappen doet. Gebruik alle plaatjes.',
      answer: 'Hij fietst naar de winkel. Daar koopt hij brood en groente. Thuis maakt hij eten klaar.',
      shots: [
        { q: 'man cycling with shopping bag', caption: 'naar de winkel' },
        { q: 'buying bread vegetables shop', caption: 'kopen' },
        { q: 'preparing meal kitchen counter', caption: 'koken' },
      ],
    }),
    coverAll(10, 2, {
      prompt: 'Vertel het verhaal van deze eerste werkdag. Gebruik alle drie de plaatjes.',
      answer: 'Ze trekt nette kleren aan. Dan reist ze naar het werk. Daar stelt ze zich voor aan de collega’s.',
      shots: [
        { q: 'woman getting dressed smart clothes', caption: 'klaarmaken' },
        { q: 'commuter walking to work morning', caption: 'onderweg' },
        { q: 'new colleague introduction handshake office', caption: 'kennismaken' },
      ],
    }),
    coverAll(10, 3, {
      prompt: 'Vertel wat deze mensen aan het huis doen. Gebruik alle plaatjes.',
      answer: 'De muur is oud en vies. Ze schilderen de muur wit. Daarna is de kamer mooi.',
      shots: [
        { q: 'old dirty wall room before renovation', caption: 'oude muur' },
        { q: 'couple painting room white', caption: 'schilderen' },
        { q: 'bright clean living room after renovation', caption: 'klaar' },
      ],
    }),
    coverAll(10, 4, {
      prompt: 'Vertel wat er op deze regenachtige dag gebeurt. Gebruik alle plaatjes.',
      answer: 'Het regent hard buiten. De kinderen spelen binnen. Later schijnt de zon weer.',
      shots: [
        { q: 'heavy rain window street', caption: 'regen' },
        { q: 'children playing indoors living room', caption: 'binnen spelen' },
        { q: 'sunshine after rain street rainbow', caption: 'zon' },
      ],
    }),
  ],
]);

export const SPREKEN_EXAMS = [
  EXAM_1, EXAM_2, EXAM_3, EXAM_4, EXAM_5,
  EXAM_6, EXAM_7, EXAM_8, EXAM_9, EXAM_10,
];
