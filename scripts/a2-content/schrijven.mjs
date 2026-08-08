/**
 * Schrijven A2 — ten oefenexamens of four opgaven.
 *
 * ## Shape, from DUO's three official oefenexamen booklets
 * Each booklet holds exactly one of each of four soorten opgave and orders them differently, which
 * is why `exam_task_rules` states a **quota** (`email` 1–2, `short_text` 1, `form` 1,
 * `picture_note` 0–1) and not a blueprint. The wording below follows the booklets' fixed phrases —
 * "Schrijf de e-mail.", "Schrijf in hele zinnen.", "Sommige gegevens moet u zelf bedenken.",
 * "Kijk naar de plaatjes." — because those phrases are the instruction the candidate is trained on.
 * The situations themselves are written from scratch; DUO's are copyright and secret.
 *
 * ## form_schema
 * `{sections: [{title, fields: [{key, label, type, options?, placeholder?}]}]}` — the shape
 * `flattenFields()` in `components/exam/WritingTask.tsx` actually reads. The shape described in the
 * baseline migration's comment is stale; the renderer wins. DUO's formulieren are a
 * persoonsgegevens block of 5–7 rows, one to three keuzeblokken of three options, and one or two
 * open rows the candidate has to answer in their own words.
 *
 * ## model_answer never reaches the browser
 * `TASK_COLS` in `lib/exam-content.ts` decides what goes into the page payload; the exemplar answer
 * is part of the scoring key and is read only by the grader and the docent.
 */

/** The persoonsgegevens block, which every DUO formulier opens with. */
const personalia = (extra = []) => ({
  title: 'Persoonsgegevens',
  fields: [
    { key: 'achternaam', label: 'Achternaam', type: 'text' },
    { key: 'voornaam', label: 'Voornaam', type: 'text' },
    { key: 'geboortedatum', label: 'Geboortedatum', type: 'text', placeholder: 'dd-mm-jjjj' },
    { key: 'adres', label: 'Straat en huisnummer', type: 'text' },
    { key: 'postcode', label: 'Postcode en woonplaats', type: 'text' },
    { key: 'telefoon', label: 'Telefoonnummer', type: 'text' },
    ...extra,
  ],
});

const EMAIL_CLOSE = '<p>Schrijf de e-mail. Schrijf in hele zinnen.</p>';
const WIJKKRANT_INTRO =
  '<p>U krijgt elke week een wijkkrant. Iedereen uit de buurt mag iets voor deze krant ' +
  'schrijven.</p>';

/* ───────────────────────────── oefenexamen 1 ───────────────────────────── */

const EXAM_1 = [
  {
    task_type: 'email',
    title: 'Cursus Nederlands',
    prompt_html:
      '<p>U wilt beginnen met een cursus Nederlands. U heeft een folder van taalschool Centrum ' +
      'gekregen. U stuurt een e-mail naar de school.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u de cursus wilt doen',
      'Schrijf op welke dagen u kunt komen',
      'Bedenk zelf nog een vraag over de cursus',
    ],
    email_to: 'info@taalschoolcentrum.nl',
    email_subject: 'Vraag over de cursus Nederlands',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Ik wil graag beginnen met een cursus Nederlands. Ik werk in een ' +
      'restaurant en ik wil beter met de gasten kunnen praten. Ik kan op maandagavond en op ' +
      'woensdagavond komen. In het weekend werk ik altijd. Kunt u mij vertellen wat de cursus ' +
      'kost? Met vriendelijke groet, Amina Haddad',
  },
  {
    task_type: 'short_text',
    title: 'Mijn buurt',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over uw buurt. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Wat vindt u mooi in uw buurt?',
      'Wat kan er beter?',
      'Wie kent u in de buurt?',
    ],
    min_sentences: 3,
    model_answer:
      'Ik woon graag in deze buurt. Er is een klein park en de winkels zijn dichtbij. Er ligt ' +
      'wel veel afval op straat en dat vind ik jammer. Ik ken mijn buurvrouw goed; wij drinken ' +
      'soms samen koffie.',
  },
  {
    task_type: 'form',
    title: 'Inschrijven sportclub',
    prompt_html:
      '<p>U wilt lid worden van sportclub SPRINT. U vult het inschrijfformulier in. Sommige ' +
      'gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'email', label: 'E-mailadres', type: 'text' }]),
        {
          title: 'Uw sport',
          fields: [
            {
              key: 'sport',
              label: 'Welke sport wilt u doen?',
              type: 'radio',
              options: ['Zwemmen', 'Voetbal', 'Hardlopen'],
            },
            {
              key: 'hoevaak',
              label: 'Hoe vaak wilt u sporten?',
              type: 'radio',
              options: ['1x per week', '2x per week', 'Meer dan 2x per week'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'waarom', label: 'Waarom kiest u voor deze sport?', type: 'text' },
            { key: 'gezondheid', label: 'Hoe is uw gezondheid?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'Alle persoonsgegevens zijn ingevuld en kloppen met elkaar. Bij beide keuzevragen is één ' +
      'optie aangekruist. De twee open vragen zijn in hele zinnen beantwoord, bijvoorbeeld: ' +
      '"Ik kies zwemmen omdat het goed is voor mijn rug." en "Mijn gezondheid is goed."',
  },
  {
    task_type: 'picture_note',
    title: 'Bericht over de fiets',
    prompt_html:
      '<p>Uw fiets was heel. Nu is hij stuk. Kijk naar de plaatjes. Schrijf een bericht aan de ' +
      'fietsenmaker. Schrijf drie dingen op. Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat er gebeurd is',
      'Vraag of hij de fiets kan maken',
      'Vraag wat het ongeveer kost',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-1-4-1', query: 'bicycle parked street good condition', caption: 'heel', group_label: 'voor' },
      { slot: 'schr-1-4-2', query: 'broken bicycle bent wheel', caption: 'stuk', group_label: 'na' },
    ],
    model_answer:
      'Goedemiddag, Gisteren is mijn fiets omgevallen op straat. Het voorwiel is nu krom en de ' +
      'rem doet het niet meer. Kunt u mijn fiets deze week maken? En hoeveel gaat dat ongeveer ' +
      'kosten? Met vriendelijke groet, Nadia El Fassi',
  },
];

/* ───────────────────────────── oefenexamen 2 ───────────────────────────── */

const EXAM_2 = [
  {
    task_type: 'form',
    title: 'Melding aan de gemeente',
    prompt_html:
      '<p>In uw straat is een lantaarnpaal stuk. U meldt dit bij de gemeente. Vul het ' +
      'meldingsformulier in. Sommige gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia(),
        {
          title: 'Uw melding',
          fields: [
            {
              key: 'soort',
              label: 'Waar gaat de melding over?',
              type: 'radio',
              options: ['Verlichting', 'Afval', 'Het wegdek'],
            },
            {
              key: 'hoelang',
              label: 'Hoe lang is dit al zo?',
              type: 'radio',
              options: ['Minder dan een week', 'Ongeveer een maand', 'Langer dan een maand'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'probleem', label: 'Wat is precies het probleem?', type: 'text' },
            { key: 'plek', label: 'Waar in de straat is dit?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens zijn volledig ingevuld. Bij beide keuzevragen staat één antwoord ' +
      'aangekruist. De open vragen zijn in hele zinnen beantwoord, bijvoorbeeld: "De lamp bij ' +
      'nummer 12 doet het niet." en "Het is bij de ingang van de straat."',
  },
  {
    task_type: 'email',
    title: 'Dienst ruilen',
    prompt_html:
      '<p>U werkt in een supermarkt. Volgende week zaterdag moet u werken, maar u kunt niet. ' +
      'U schrijft een e-mail aan uw leidinggevende.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u mailt',
      'Bedenk zelf waarom u zaterdag niet kunt werken',
      'Schrijf op welke dag u wél kunt werken',
    ],
    email_to: 'planning@supermarktdehoek.nl',
    email_subject: 'Zaterdag ruilen',
    greeting: 'Beste Karin,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Beste Karin, Ik mail je over mijn dienst van zaterdag 14 juni. Die dag kan ik helaas niet ' +
      'werken, want mijn zus trouwt en ik moet naar het feest. Kan ik in plaats daarvan op zondag ' +
      'werken? Op zondag ben ik de hele dag vrij. Met vriendelijke groet, Ibrahim Yildiz',
  },
  {
    task_type: 'short_text',
    title: 'Mijn favoriete eten',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over uw favoriete eten. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Wat eet u het liefst?',
      'Waarom vindt u dit lekker?',
      'Wanneer eet u dit?',
    ],
    min_sentences: 3,
    model_answer:
      'Mijn favoriete eten is rijst met kip en groente. Ik vind dit lekker omdat mijn moeder het ' +
      'vroeger altijd maakte. Ik eet het meestal op zondag, want dan heb ik tijd om te koken. ' +
      'Soms eten mijn buren mee.',
  },
  {
    task_type: 'picture_note',
    title: 'Briefje voor uw collega',
    prompt_html:
      '<p>U werkt in een kledingzaak. Straks komt uw collega Fariha. Zij moet een paar dingen ' +
      'doen. Kijk naar de plaatjes. Schrijf een briefje voor Fariha. Schrijf drie dingen op. ' +
      'Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat zij met de dozen moet doen',
      'Schrijf wat zij met de etalage moet doen',
      'Schrijf wat zij aan het eind van de dag moet doen',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-2-4-1', query: 'cardboard boxes stockroom shop', caption: 'de dozen' },
      { slot: 'schr-2-4-2', query: 'shop window display mannequin', caption: 'de etalage' },
      { slot: 'schr-2-4-3', query: 'closing shop lights evening', caption: 'afsluiten' },
    ],
    model_answer:
      'Hallo Fariha, Wil je de dozen in het magazijn uitpakken en de kleding ophangen? Daarna ' +
      'mag je de etalage veranderen; de nieuwe jassen liggen klaar. Doe aan het eind van de dag ' +
      'alsjeblieft de lampen uit en sluit de deur goed af. Alvast bedankt! Groeten, Sanne',
  },
];

/* ───────────────────────────── oefenexamen 3 ───────────────────────────── */

const EXAM_3 = [
  {
    task_type: 'email',
    title: 'Afspraak verzetten',
    prompt_html:
      '<p>U heeft dinsdag een afspraak bij de tandarts. U kunt niet komen. U schrijft een ' +
      'e-mail naar de praktijk.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u mailt',
      'Bedenk zelf waarom u dinsdag niet kunt komen',
      'Vraag om een nieuwe afspraak',
    ],
    email_to: 'balie@tandartspraktijkwest.nl',
    email_subject: 'Afspraak dinsdag verzetten',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Ik heb dinsdag 3 juni om 10.00 uur een afspraak bij de tandarts. ' +
      'Helaas kan ik niet komen, want ik moet die dag onverwacht werken. Kan ik een nieuwe ' +
      'afspraak maken? Donderdag of vrijdag komt mij het beste uit. Met vriendelijke groet, ' +
      'Peter de Wit',
  },
  {
    task_type: 'email',
    title: 'Vraag over de huur',
    prompt_html:
      '<p>De verwarming in uw woning werkt niet goed. U schrijft een e-mail aan de ' +
      'woningcorporatie.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf wat het probleem is',
      'Schrijf hoe lang dit al zo is',
      'Bedenk zelf wanneer iemand kan langskomen',
    ],
    email_to: 'onderhoud@wonenbeter.nl',
    email_subject: 'Verwarming doet het niet',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, De verwarming in mijn woonkamer wordt niet warm. Dit probleem is er ' +
      'al bijna twee weken en het is nu erg koud in huis. Kan er iemand langskomen om het te ' +
      'maken? Op woensdagochtend en donderdagochtend ben ik thuis. Met vriendelijke groet, ' +
      'Ana Popescu',
  },
  {
    task_type: 'short_text',
    title: 'Een goede buur',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over een buur die u geholpen heeft. Schrijf minimaal drie zinnen op. ' +
      'Denk aan:</p><p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Wie heeft u geholpen?',
      'Wat heeft die persoon gedaan?',
      'Waarom was dat fijn?',
    ],
    min_sentences: 3,
    model_answer:
      'Mijn buurman Kees heeft mij vorige maand erg geholpen. Ik was mijn sleutels kwijt en ik ' +
      'kon niet naar binnen. Hij liet mij bij hem wachten en gaf mij koffie. Dat was heel fijn, ' +
      'want het regende hard.',
  },
  {
    task_type: 'form',
    title: 'Aanmelden bibliotheek',
    prompt_html:
      '<p>U wilt lid worden van de bibliotheek. Vul het aanmeldformulier in. Sommige gegevens ' +
      'moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'email', label: 'E-mailadres', type: 'text' }]),
        {
          title: 'Uw lidmaatschap',
          fields: [
            {
              key: 'soort',
              label: 'Welk lidmaatschap wilt u?',
              type: 'radio',
              options: ['Alleen boeken', 'Boeken en films', 'Jeugd (tot 18 jaar)'],
            },
            {
              key: 'betalen',
              label: 'Hoe wilt u betalen?',
              type: 'radio',
              options: ['Per maand', 'Per jaar', 'Contant aan de balie'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'lezen', label: 'Wat leest u graag?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens zijn compleet en kloppen. Bij beide keuzevragen is één optie ' +
      'aangekruist. De open vraag is in een hele zin beantwoord, bijvoorbeeld: "Ik lees graag ' +
      'boeken over koken en over andere landen."',
  },
];

/* ───────────────────────────── oefenexamen 4 ───────────────────────────── */

const EXAM_4 = [
  {
    task_type: 'short_text',
    title: 'Sporten in de buurt',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over sporten in de buurt. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Welke sport doet u?',
      'Waar sport u?',
      'Waarom is sporten belangrijk voor u?',
    ],
    min_sentences: 3,
    model_answer:
      'Ik zwem twee keer per week. Ik ga naar het zwembad aan de Parkstraat, want dat is dichtbij ' +
      'mijn huis. Sporten is belangrijk voor mij omdat ik veel zit op mijn werk. Na het zwemmen ' +
      'slaap ik ook beter.',
  },
  {
    task_type: 'email',
    title: 'Aanmelden voor de open dag',
    prompt_html:
      '<p>Uw kind gaat volgend jaar naar de middelbare school. Er is een open dag. U schrijft ' +
      'een e-mail naar de school.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u mailt',
      'Schrijf met hoeveel mensen u komt',
      'Bedenk zelf een vraag over de school',
    ],
    email_to: 'info@hetnieuwelyceum.nl',
    email_subject: 'Aanmelding open dag',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Ik wil graag naar de open dag van zaterdag 8 november komen. Mijn ' +
      'dochter zit nu in groep 8 en zij is heel benieuwd. Wij komen met zijn drieën: mijn man, ' +
      'mijn dochter en ik. Kunt u mij vertellen hoe laat de rondleiding begint? Met vriendelijke ' +
      'groet, Fatima Ouali',
  },
  {
    task_type: 'form',
    title: 'Schadeformulier',
    prompt_html:
      '<p>Er is bij u thuis waterschade geweest. U vult een schadeformulier in voor de ' +
      'verzekering. Sommige gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'polis', label: 'Polisnummer', type: 'text' }]),
        {
          title: 'De schade',
          fields: [
            {
              key: 'waar',
              label: 'Waar is de schade?',
              type: 'radio',
              options: ['In de keuken', 'In de badkamer', 'In de woonkamer'],
            },
            {
              key: 'wanneer',
              label: 'Wanneer is het gebeurd?',
              type: 'radio',
              options: ['Vandaag', 'Deze week', 'Langer geleden'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'wat', label: 'Wat is er precies gebeurd?', type: 'text' },
            { key: 'kapot', label: 'Wat is er kapot?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens en het polisnummer zijn ingevuld. Bij beide keuzevragen staat één ' +
      'antwoord. De open vragen zijn in hele zinnen beantwoord, bijvoorbeeld: "De wasmachine ' +
      'lekte de hele nacht." en "De vloer en de kast onder de gootsteen zijn kapot."',
  },
  {
    task_type: 'picture_note',
    title: 'Bericht aan de huismeester',
    prompt_html:
      '<p>In uw flat zijn een paar dingen kapot. Kijk naar de plaatjes. Schrijf een bericht aan ' +
      'de huismeester. Schrijf drie dingen op. Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat er kapot is',
      'Schrijf waar het precies is',
      'Vraag wanneer het gemaakt wordt',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-4-4-1', query: 'broken light bulb hallway dark', caption: 'de lamp' },
      { slot: 'schr-4-4-2', query: 'broken door lock entrance', caption: 'de deur' },
      { slot: 'schr-4-4-3', query: 'overflowing rubbish bins container', caption: 'de containers' },
    ],
    model_answer:
      'Goedemiddag, In het trappenhuis op de tweede verdieping doet de lamp het niet meer. Ook ' +
      'sluit de deur beneden niet goed; iedereen kan zo naar binnen. Verder staan de containers ' +
      'al een week vol. Kunt u mij laten weten wanneer dit gemaakt wordt? Met vriendelijke groet, ' +
      'Bewoner nummer 43',
  },
];

/* ───────────────────────────── oefenexamen 5 ───────────────────────────── */

const EXAM_5 = [
  {
    task_type: 'email',
    title: 'Bedanken voor de hulp',
    prompt_html:
      '<p>Uw buurvrouw heeft op uw kinderen gepast toen u naar het ziekenhuis moest. U schrijft ' +
      'haar een e-mail.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Bedank haar voor de hulp',
      'Schrijf hoe het nu met u gaat',
      'Bedenk zelf iets aardigs dat u voor haar wilt doen',
    ],
    email_to: 'ineke.vandenberg@kpnmail.nl',
    email_subject: 'Bedankt voor je hulp',
    greeting: 'Beste Ineke,',
    closing: 'Hartelijke groet,',
    model_answer:
      'Beste Ineke, Heel erg bedankt dat je vorige week op de kinderen hebt gepast. Ik moest ' +
      'onverwacht naar het ziekenhuis en jij stond meteen klaar. Met mij gaat het nu gelukkig ' +
      'weer goed; ik mag alleen nog niet tillen. Kom je zondag bij ons eten? Dan kook ik voor je. ' +
      'Hartelijke groet, Yasmin',
  },
  {
    task_type: 'short_text',
    title: 'Mijn werk',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over uw werk. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Wat voor werk doet u?',
      'Wat vindt u leuk aan uw werk?',
      'Wat is soms moeilijk?',
    ],
    min_sentences: 3,
    model_answer:
      'Ik werk in de thuiszorg. Ik help oudere mensen met douchen en aankleden. Het leukste vind ' +
      'ik de gesprekken; veel mensen zijn alleen. Soms is het moeilijk, want ik heb weinig tijd ' +
      'per adres.',
  },
  {
    task_type: 'form',
    title: 'Aanvraag parkeervergunning',
    prompt_html:
      '<p>U wilt een parkeervergunning aanvragen bij de gemeente. Vul het formulier in. Sommige ' +
      'gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'kenteken', label: 'Kenteken van de auto', type: 'text' }]),
        {
          title: 'Uw aanvraag',
          fields: [
            {
              key: 'soort',
              label: 'Voor wie is de vergunning?',
              type: 'radio',
              options: ['Voor mijzelf', 'Voor bezoek', 'Voor mijn bedrijf'],
            },
            {
              key: 'periode',
              label: 'Voor hoe lang wilt u de vergunning?',
              type: 'radio',
              options: ['Drie maanden', 'Zes maanden', 'Een jaar'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'waarom', label: 'Waarom heeft u de auto nodig?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'Alle persoonsgegevens en het kenteken zijn ingevuld. Bij beide keuzevragen is één optie ' +
      'aangekruist. De open vraag is in hele zinnen beantwoord, bijvoorbeeld: "Ik heb de auto ' +
      'nodig voor mijn werk. Ik begin ’s ochtends om vijf uur en er rijdt dan geen bus."',
  },
  {
    task_type: 'picture_note',
    title: 'Briefje voor de oppas',
    prompt_html:
      '<p>Vanavond komt de oppas bij uw kinderen. Kijk naar de plaatjes. Schrijf een briefje voor ' +
      'de oppas. Schrijf drie dingen op. Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat de kinderen moeten eten',
      'Schrijf hoe laat zij naar bed gaan',
      'Schrijf wat de oppas moet doen als er iets is',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-5-4-1', query: 'children dinner plate pasta', caption: 'eten' },
      { slot: 'schr-5-4-2', query: 'child sleeping bed bedtime', caption: 'naar bed' },
      { slot: 'schr-5-4-3', query: 'mobile phone contact call', caption: 'bellen' },
    ],
    model_answer:
      'Hoi Lisa, De pasta staat in de koelkast; die kun je opwarmen in de magnetron. Sofie gaat ' +
      'om half acht naar bed en Daan om acht uur. Als er iets is, kun je mij altijd bellen op ' +
      '06-12345678. Alvast bedankt! Groetjes, Meryem',
  },
];

/* ───────────────────────────── oefenexamen 6 ───────────────────────────── */

const EXAM_6 = [
  {
    task_type: 'form',
    title: 'Inschrijven cursus',
    prompt_html:
      '<p>U wilt een computercursus volgen in het buurthuis. Vul het inschrijfformulier in. ' +
      'Sommige gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'email', label: 'E-mailadres', type: 'text' }]),
        {
          title: 'De cursus',
          fields: [
            {
              key: 'niveau',
              label: 'Welk niveau wilt u?',
              type: 'radio',
              options: ['Beginner', 'Een beetje ervaring', 'Gevorderd'],
            },
            {
              key: 'dagdeel',
              label: 'Wanneer kunt u komen?',
              type: 'radio',
              options: ['Overdag', '’s Avonds', 'In het weekend'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'leren', label: 'Wat wilt u leren op de computer?', type: 'text' },
            { key: 'ervaring', label: 'Heeft u al een computer thuis?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens zijn volledig. Bij beide keuzevragen is één optie aangekruist. De ' +
      'open vragen zijn in hele zinnen beantwoord, bijvoorbeeld: "Ik wil leren e-mailen en ' +
      'formulieren invullen." en "Ja, ik heb een oude laptop van mijn zoon."',
  },
  {
    task_type: 'email',
    title: 'Vraag over de rekening',
    prompt_html:
      '<p>U heeft een rekening van het energiebedrijf gekregen. Het bedrag klopt niet. U schrijft ' +
      'een e-mail.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u mailt',
      'Schrijf wat er volgens u niet klopt',
      'Bedenk zelf wat u van het bedrijf wilt',
    ],
    email_to: 'klantenservice@energiedirect.nl',
    email_subject: 'Vraag over mijn rekening',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Ik heb op 3 juni een rekening van 240 euro gekregen. Dat bedrag ' +
      'klopt volgens mij niet, want ik betaal normaal ongeveer 90 euro per maand. Ik woon alleen ' +
      'en ik ben in mei twee weken op vakantie geweest. Kunt u de rekening nog een keer bekijken ' +
      'en mij bellen? Met vriendelijke groet, Joseph Mensah',
  },
  {
    task_type: 'short_text',
    title: 'Een feest in de buurt',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over een feest in de buurt. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Wat voor feest was het?',
      'Wie waren er?',
      'Wat vond u er het leukste aan?',
    ],
    min_sentences: 3,
    model_answer:
      'Vorige maand was er een straatfeest in onze straat. Bijna alle buren waren er en iedereen ' +
      'had eten meegenomen. Het leukste vond ik dat de kinderen samen speelden op het plein. ' +
      'Volgend jaar doe ik graag weer mee.',
  },
  {
    task_type: 'email',
    title: 'Kamer huren',
    prompt_html:
      '<p>U ziet een advertentie voor een kamer. U wilt de kamer graag bekijken. U schrijft een ' +
      'e-mail naar de verhuurder.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u mailt',
      'Schrijf iets over uzelf',
      'Bedenk zelf wanneer u de kamer wilt bekijken',
    ],
    email_to: 'kamerverhuur.zuid@gmail.com',
    email_subject: 'Reactie op de advertentie',
    greeting: 'Geachte heer,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer, Ik las uw advertentie voor de kamer in de Bloemstraat en ik ben erg ' +
      'geïnteresseerd. Ik ben 27 jaar, ik werk in een ziekenhuis en ik ben rustig. Ik rook niet ' +
      'en ik heb geen huisdieren. Zou ik de kamer volgende week woensdag kunnen bekijken? ' +
      'Met vriendelijke groet, Daniel Novak',
  },
];

/* ───────────────────────────── oefenexamen 7 ───────────────────────────── */

const EXAM_7 = [
  {
    task_type: 'email',
    title: 'Ziek melden',
    prompt_html:
      '<p>U bent ziek en u kunt vandaag niet naar uw werk. U schrijft een e-mail aan uw ' +
      'leidinggevende.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf dat u ziek bent',
      'Bedenk zelf wat u heeft',
      'Schrijf wanneer u denkt weer te kunnen werken',
    ],
    email_to: 'j.bakker@schoonmaakbedrijfglans.nl',
    email_subject: 'Ziekmelding',
    greeting: 'Beste Jan,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Beste Jan, Ik moet mij helaas ziek melden voor vandaag. Ik heb sinds gisteravond koorts ' +
      'en veel keelpijn. Vanmiddag ga ik naar de huisarts. Ik denk dat ik donderdag weer kan ' +
      'werken; ik bel je woensdag om het te laten weten. Met vriendelijke groet, Grace Adeyemi',
  },
  {
    task_type: 'short_text',
    title: 'Vervoer in de buurt',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over vervoer in de buurt. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Hoe reist u meestal?',
      'Gaat dat goed of niet?',
      'Wat zou u anders willen?',
    ],
    min_sentences: 3,
    model_answer:
      'Ik ga altijd met de fiets naar mijn werk. Dat gaat meestal goed, maar in de winter is het ' +
      'donker en glad. De bus rijdt hier maar twee keer per uur. Ik zou graag willen dat de bus ' +
      'vaker rijdt.',
  },
  {
    task_type: 'form',
    title: 'Aanmelden voedselbank',
    prompt_html:
      '<p>U wilt informatie over de voedselbank in uw gemeente. Vul het aanmeldformulier in. ' +
      'Sommige gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia(),
        {
          title: 'Uw situatie',
          fields: [
            {
              key: 'huishouden',
              label: 'Uit hoeveel personen bestaat uw huishouden?',
              type: 'radio',
              options: ['1 persoon', '2 tot 4 personen', 'Meer dan 4 personen'],
            },
            {
              key: 'inkomen',
              label: 'Wat is uw situatie?',
              type: 'radio',
              options: ['Ik werk', 'Ik heb een uitkering', 'Ik studeer'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'toelichting', label: 'Wilt u uw situatie kort uitleggen?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens zijn ingevuld. Bij beide keuzevragen staat één antwoord. De open ' +
      'vraag is in hele zinnen beantwoord, bijvoorbeeld: "Ik werk twintig uur per week. Na de ' +
      'huur houd ik weinig geld over voor boodschappen."',
  },
  {
    task_type: 'picture_note',
    title: 'Bericht over de wasmachine',
    prompt_html:
      '<p>Uw wasmachine was heel. Nu is hij stuk. Kijk naar de plaatjes. Schrijf een bericht aan ' +
      'de reparateur. Schrijf drie dingen op. Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat er aan de hand is',
      'Vraag of hij langs kan komen',
      'Bedenk zelf wanneer u thuis bent',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-7-4-1', query: 'washing machine laundry room clean', caption: 'eerst' },
      { slot: 'schr-7-4-2', query: 'water leaking floor washing machine', caption: 'nu' },
    ],
    model_answer:
      'Goedemiddag, Mijn wasmachine lekt sinds vanochtend; er ligt water op de vloer van de ' +
      'badkamer. De machine draait ook niet meer verder. Kunt u deze week langskomen om te ' +
      'kijken? Op dinsdag en donderdag ben ik de hele dag thuis. Met vriendelijke groet, ' +
      'Elena Petrova',
  },
];

/* ───────────────────────────── oefenexamen 8 ───────────────────────────── */

const EXAM_8 = [
  {
    task_type: 'short_text',
    title: 'Groen in de wijk',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over groen en planten in de wijk. Schrijf minimaal drie zinnen op. ' +
      'Denk aan:</p><p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Waar is het groen in uw wijk?',
      'Wat doet u daar?',
      'Wat zou u graag anders zien?',
    ],
    min_sentences: 3,
    model_answer:
      'Achter mijn flat ligt een klein park met bomen. Ik wandel daar bijna elke dag na het eten. ' +
      'Er staan alleen te weinig bankjes om even te zitten. Ik zou graag meer bloemen en een paar ' +
      'bankjes willen.',
  },
  {
    task_type: 'email',
    title: 'Vrijwilliger worden',
    prompt_html:
      '<p>U wilt vrijwilligerswerk doen in het buurthuis. U schrijft een e-mail naar de ' +
      'coördinator.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u vrijwilliger wilt worden',
      'Schrijf wat u goed kunt',
      'Bedenk zelf hoeveel uur per week u kunt helpen',
    ],
    email_to: 'vrijwilligers@buurthuisdebrug.nl',
    email_subject: 'Aanmelding vrijwilligerswerk',
    greeting: 'Geachte mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte mevrouw, Ik wil graag vrijwilligerswerk doen in het buurthuis. Ik ben net met ' +
      'pensioen en ik wil graag mensen ontmoeten en iets nuttigs doen. Ik kan goed koken en ik ' +
      'help ook graag met de administratie. Ik kan ongeveer zes uur per week komen, het liefst ' +
      'op dinsdag en donderdag. Met vriendelijke groet, Henk Vermeulen',
  },
  {
    task_type: 'form',
    title: 'Aanvraag kinderopvang',
    prompt_html:
      '<p>U wilt uw kind naar de kinderopvang brengen. Vul het aanvraagformulier in. Sommige ' +
      'gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([
          { key: 'kind_naam', label: 'Naam van het kind', type: 'text' },
          { key: 'kind_geboren', label: 'Geboortedatum van het kind', type: 'text', placeholder: 'dd-mm-jjjj' },
        ]),
        {
          title: 'De opvang',
          fields: [
            {
              key: 'dagen',
              label: 'Hoeveel dagen per week?',
              type: 'radio',
              options: ['1 dag', '2 of 3 dagen', '4 of 5 dagen'],
            },
            {
              key: 'tijd',
              label: 'Welke tijden wilt u?',
              type: 'radio',
              options: ['Alleen ochtend', 'Alleen middag', 'Hele dag'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'bijzonder', label: 'Zijn er bijzonderheden over uw kind?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De gegevens van de ouder en het kind zijn ingevuld. Bij beide keuzevragen is één optie ' +
      'aangekruist. De open vraag is in hele zinnen beantwoord, bijvoorbeeld: "Mijn zoon is ' +
      'allergisch voor noten. Hij slaapt ’s middags meestal een uur."',
  },
  {
    task_type: 'picture_note',
    title: 'Briefje voor de buurvrouw',
    prompt_html:
      '<p>U gaat een week op vakantie. Uw buurvrouw let op uw huis. Kijk naar de plaatjes. ' +
      'Schrijf een briefje voor haar. Schrijf drie dingen op. Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat zij met de planten moet doen',
      'Schrijf wat zij met de post moet doen',
      'Bedank haar voor de hulp',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-8-4-1', query: 'watering houseplants indoor', caption: 'de planten' },
      { slot: 'schr-8-4-2', query: 'letters mail on doormat', caption: 'de post' },
      { slot: 'schr-8-4-3', query: 'cat eating bowl home', caption: 'de kat' },
    ],
    model_answer:
      'Lieve Anja, Wij zijn van zaterdag tot volgende zondag op vakantie. Wil je twee keer per ' +
      'week de planten water geven? De post mag je op de keukentafel leggen. Voer je de kat ook ' +
      '’s ochtends? Heel erg bedankt voor je hulp! Groetjes, Karim',
  },
];

/* ───────────────────────────── oefenexamen 9 ───────────────────────────── */

const EXAM_9 = [
  {
    task_type: 'email',
    title: 'Klacht over een bestelling',
    prompt_html:
      '<p>U heeft een jas online besteld. De jas is te klein en er zit een gat in. U schrijft een ' +
      'e-mail naar de webshop.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf wat u besteld heeft',
      'Schrijf wat er mis is',
      'Bedenk zelf wat u van de webshop wilt',
    ],
    email_to: 'service@kledingonline.nl',
    email_subject: 'Klacht over bestelling 44921',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Op 12 mei heb ik een blauwe winterjas besteld, maat L, ' +
      'bestelnummer 44921. De jas is helaas te klein en er zit een gat in de linkermouw. Ik wil ' +
      'de jas graag ruilen voor maat XL. Kunt u mij laten weten hoe ik de jas terug kan sturen? ' +
      'Met vriendelijke groet, Amir Rahimi',
  },
  {
    task_type: 'short_text',
    title: 'Nederlands leren',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over hoe u Nederlands leert. Schrijf minimaal drie zinnen op. Denk aan:</p>' +
      '<p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Hoe leert u Nederlands?',
      'Wat vindt u moeilijk?',
      'Wie helpt u daarbij?',
    ],
    min_sentences: 3,
    model_answer:
      'Ik volg twee avonden per week een cursus Nederlands. Daarnaast kijk ik het jeugdjournaal, ' +
      'want dat praat langzaam. Schrijven vind ik het moeilijkst, vooral de werkwoorden. Mijn ' +
      'buurvrouw helpt mij met brieven van de gemeente.',
  },
  {
    task_type: 'form',
    title: 'Inschrijven wooncorporatie',
    prompt_html:
      '<p>U wilt zich inschrijven voor een huurwoning. Vul het inschrijfformulier in. Sommige ' +
      'gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'email', label: 'E-mailadres', type: 'text' }]),
        {
          title: 'Uw woonwens',
          fields: [
            {
              key: 'grootte',
              label: 'Hoeveel slaapkamers wilt u?',
              type: 'radio',
              options: ['1 slaapkamer', '2 slaapkamers', '3 of meer slaapkamers'],
            },
            {
              key: 'wijk',
              label: 'In welke wijk wilt u het liefst wonen?',
              type: 'radio',
              options: ['Centrum', 'Noord', 'Maakt niet uit'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'situatie', label: 'Hoe woont u nu?', type: 'text' },
            { key: 'wanneer', label: 'Wanneer wilt u verhuizen?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens zijn compleet. Bij beide keuzevragen is één optie aangekruist. De ' +
      'open vragen zijn in hele zinnen beantwoord, bijvoorbeeld: "Ik woon nu op een kamer bij ' +
      'mijn broer." en "Ik wil het liefst binnen een half jaar verhuizen."',
  },
  {
    task_type: 'email',
    title: 'Uitnodiging voor een feest',
    prompt_html:
      '<p>U bent tien jaar in Nederland en u geeft een klein feest. U schrijft een e-mail aan uw ' +
      'vrienden.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u een feest geeft',
      'Schrijf wanneer en waar het feest is',
      'Bedenk zelf wat de gasten mee kunnen nemen',
    ],
    email_to: 'vrienden@groep.nl',
    email_subject: 'Uitnodiging: tien jaar in Nederland!',
    greeting: 'Lieve vrienden,',
    closing: 'Tot dan!',
    model_answer:
      'Lieve vrienden, Volgende maand ben ik precies tien jaar in Nederland. Dat wil ik graag ' +
      'met jullie vieren. Het feest is op zaterdag 14 juni vanaf vier uur bij mij thuis, in de ' +
      'Kerkstraat 8. Willen jullie iets lekkers uit jullie eigen land meenemen? Tot dan! Rania',
  },
];

/* ──────────────────────────── oefenexamen 10 ───────────────────────────── */

const EXAM_10 = [
  {
    task_type: 'form',
    title: 'Aanmelden taalmaatje',
    prompt_html:
      '<p>U wilt een taalmaatje: iemand die met u Nederlands oefent. Vul het formulier in. ' +
      'Sommige gegevens moet u zelf bedenken.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        personalia([{ key: 'email', label: 'E-mailadres', type: 'text' }]),
        {
          title: 'Uw wensen',
          fields: [
            {
              key: 'oefenen',
              label: 'Wat wilt u het meest oefenen?',
              type: 'radio',
              options: ['Praten', 'Lezen en schrijven', 'Allebei evenveel'],
            },
            {
              key: 'plek',
              label: 'Waar wilt u afspreken?',
              type: 'radio',
              options: ['In de bibliotheek', 'In het buurthuis', 'Bij mij thuis'],
            },
          ],
        },
        {
          title: 'Tot slot',
          fields: [
            { key: 'niveau', label: 'Hoe lang leert u al Nederlands?', type: 'text' },
            { key: 'tijd', label: 'Wanneer heeft u tijd?', type: 'text' },
          ],
        },
      ],
    },
    model_answer:
      'De persoonsgegevens zijn ingevuld. Bij beide keuzevragen staat één antwoord. De open ' +
      'vragen zijn in hele zinnen beantwoord, bijvoorbeeld: "Ik leer nu ongeveer twee jaar ' +
      'Nederlands." en "Ik heb tijd op woensdagmiddag en zaterdagochtend."',
  },
  {
    task_type: 'email',
    title: 'Vragen over de opleiding',
    prompt_html:
      '<p>U wilt een opleiding tot verzorgende gaan doen. U schrijft een e-mail naar de ' +
      'school.</p>' + EMAIL_CLOSE,
    bullet_points: [
      'Schrijf waarom u deze opleiding wilt doen',
      'Schrijf wat u nu doet',
      'Bedenk zelf een vraag over de opleiding',
    ],
    email_to: 'aanmelden@roczorgcollege.nl',
    email_subject: 'Vraag over de opleiding verzorgende',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Ik wil graag de opleiding tot verzorgende volgen. Ik werk nu in de ' +
      'schoonmaak, maar ik help het liefst mensen en dat wil ik van mijn beroep maken. Ik heb ' +
      'mijn inburgeringsdiploma op A2-niveau. Kunt u mij vertellen welk taalniveau ik nodig heb ' +
      'voor deze opleiding? Met vriendelijke groet, Sara Yilmaz',
  },
  {
    task_type: 'short_text',
    title: 'Mijn mooiste dag in Nederland',
    prompt_html:
      WIJKKRANT_INTRO +
      '<p>U schrijft over uw mooiste dag in Nederland. Schrijf minimaal drie zinnen op. ' +
      'Denk aan:</p><p>Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Wat gebeurde er die dag?',
      'Wie waren erbij?',
      'Waarom was die dag zo mooi?',
    ],
    min_sentences: 3,
    model_answer:
      'Mijn mooiste dag was de dag dat ik mijn diploma haalde. Mijn man en mijn twee kinderen ' +
      'waren erbij en zij hadden bloemen gekocht. Daarna gingen we samen pannenkoeken eten. Die ' +
      'dag was mooi omdat ik heel hard had gewerkt.',
  },
  {
    task_type: 'picture_note',
    title: 'Bericht aan de garage',
    prompt_html:
      '<p>Uw auto doet het niet goed meer. Kijk naar de plaatjes. Schrijf een bericht aan de ' +
      'garage. Schrijf drie dingen op. Schrijf in hele zinnen.</p>',
    bullet_points: [
      'Schrijf wat er met de auto is',
      'Vraag wanneer u langs kunt komen',
      'Bedenk zelf een vraag over de kosten',
    ],
    min_sentences: 3,
    images: [
      { slot: 'schr-10-4-1', query: 'car dashboard warning light', caption: 'het lampje' },
      { slot: 'schr-10-4-2', query: 'flat car tyre roadside', caption: 'de band' },
      { slot: 'schr-10-4-3', query: 'car garage mechanic repair', caption: 'de garage' },
    ],
    model_answer:
      'Goedemiddag, Sinds vorige week brandt er een rood lampje op het dashboard van mijn auto. ' +
      'Vanochtend was de rechtervoorband ook helemaal leeg. Kan ik deze week bij u langskomen om ' +
      'het te laten nakijken? En kunt u ongeveer zeggen wat dat gaat kosten? Met vriendelijke ' +
      'groet, Tomasz Kowalski',
  },
];

export const SCHRIJVEN_EXAMS = [
  EXAM_1, EXAM_2, EXAM_3, EXAM_4, EXAM_5,
  EXAM_6, EXAM_7, EXAM_8, EXAM_9, EXAM_10,
];
