/**
 * De lesschrijver: één modelcall per les, gevalideerd voordat hij wordt bewaard.
 *
 * ── WAT HIER WEL EN NIET WORDT GESCHREVEN ────────────────────────────────────
 * De syllabus is **niet** gegenereerd. `concepts-a2.mjs` en `plan.mjs` liggen met de hand vast
 * in git: welke concepten er zijn, in welke groep, in welke onderdelen, in welke volgorde, en
 * uit welke blokken en lessen een cursus bestaat. Dit bestand schrijft het Nederlands voor een
 * slot dat het aangereikt krijgt. Dat is het verschil tussen 53 lessen en 53 varianten op één
 * les.
 *
 * ── DE UNIT IS ÉÉN LES ───────────────────────────────────────────────────────
 * Eén call per les, en dat is de bovengrens die werkt. Groter groeperen convergeert niet: elke
 * opgavesoort heeft zijn eigen vormregel, en een retry die de ene repareert breekt de andere.
 * Dat is precies wat `scripts/b1-content` heeft geleerd met Schrijven, waar vier opgaven in één
 * call nooit samen goed kwamen.
 *
 * ── DE RETRY KRIJGT DE REGEL, NIET "PROBEER OPNIEUW" ─────────────────────────
 * Validatie loopt via `lib/lessons/items.ts` — dezelfde schema's die `/admin` gebruikt bij het
 * opslaan door de docent. Er is dus geen tweede definitie van wat een geldige opgave is, en
 * een les die hier doorkomt kan in de editor niet ongeldig blijken.
 *
 * ── GEEN DUO-MATERIAAL EN GEEN METHODE IN DE PROMPT ──────────────────────────
 * De DUO-oefenexamens en TaalCompleet zijn auteursrechtelijk beschermd. Wat eruit is
 * overgenomen is de *vorm*: de onderwerpenlijst, de ordening, de opgavesoorten en de
 * moeilijkheidstrap. Geen zin van hen staat in een prompt hier, en niets uit hun boeken wordt
 * geciteerd. Elke voorbeeldzin en elke opgave hieronder wordt van nul geschreven.
 *
 * ── ALLES WORDT `pending` GESCHREVEN ─────────────────────────────────────────
 * Anders dan de A2-examendataset, die `validated` schreef vóór de docent ernaar had gekeken.
 * Dat veld is het enige in dit systeem dat liegt, en lescontent is de plek waar die kortere
 * weg het duurst is: de belofte van deze laag is dat er iemand voor staat. De seeder schrijft
 * `pending`; `/admin/lessen` is waar het `validated` wordt.
 */

import { createAuthor, looksEscaped } from '../b1-content/author.mjs';
import { ROOT, VOICES } from '../a2-content/lib.mjs';
import path from 'node:path';

export const CACHE_DIR = path.join(ROOT, 'scripts', 'lesson-content', '.unit-cache');

/**
 * Wat A2 *is*, in de termen die het register moet halen.
 *
 * Gedeeld door elke prompt, zodat de vijf blokken niet in vijf verschillende niveaus
 * uiteenlopen. Dit is de schrijftweeling van `lib/ai/level-register.ts`, dat de beoordelaar
 * leest; ze zeggen hetzelfde en staan apart omdat dat TypeScript is die de app importeert en
 * dit een script. Verandert er één, lees de ander — cross-niveau-besmetting is de stilste fout
 * in dit systeem.
 */
const A2_REGISTER = `
Je schrijft lesmateriaal voor het Nederlandse inburgeringsexamen op niveau A2.
De cursisten zijn volwassen anderstaligen die in Nederland wonen. Veel van hen hebben een
beperkte schoolopleiding en lezen Nederlands langzaam.

Wat A2 betekent voor jouw tekst:
- Zinnen van gemiddeld 8 tot 12 woorden. Eén gedachte per zin.
- Alledaagse woorden uit wonen, gezondheid, werk, geld, gemeente, winkelen en school.
- Je spreekt de cursist aan met 'je', niet met 'u'. (In een voorbeeldbrief van een instantie
  staat wél 'u' — dat is de tekst, niet jouw uitleg.)
- Een moeilijk woord leg je uit op het moment dat je het gebruikt.
- Grammaticale termen mag je noemen, maar altijd met een gewoon woord erbij:
  "het voltooid deelwoord (het woord met ge-)".
- Nederlandse namen, plaatsen, bedragen in euro's, data in Nederlandse notatie.

Wat je NOOIT doet:
- Geen enkel woord overnemen uit een bestaand examen of een bestaande lesmethode.
  Alles is nieuw geschreven.
- Geen echte bedrijven, echte scholen of echte personen. Verzin namen.
- Geen emoji. Geen Engelse woorden waar een Nederlands woord bestaat.
- Niet verwijzen naar 'deze oefening', 'de vorige les' of 'het vorige voorbeeld'.
- Geen enkele bewering over het examen die je niet zeker weet. Zeg nooit hoeveel vragen je
  goed moet hebben om te slagen, en noem nooit een puntengrens: die zijn niet openbaar.
`.trim();

/** De tags die de lescomponenten daadwerkelijk stylen. Al het andere rendert kaal. */
const ALLOWED_HTML = '<p>, <br>, <strong>, <em>, <mark>, <ul>, <ol>, <li>';

/* ── het schema dat elke les teruggeeft ──────────────────────────────────── */

/**
 * Het JSON-schema voor één les.
 *
 * Structured outputs weigeren `minItems > 1`, `maximum` en `minimum`, dus aantallen en grenzen
 * staan hier NIET — die worden in `validate()` afgedwongen, tegen `lib/lessons/items.ts`. Het
 * schema regelt alleen de *vorm*.
 *
 * `payload` is met opzet een vrij object per soort in plaats van één union: een
 * discriminated union met zestien takken maakt het schema onleesbaar voor het model en de
 * validatie doet het werk toch al.
 */
/**
 * De payloadvelden per item-soort. Spiegelt `PAYLOAD_SCHEMAS` in `lib/lessons/items.ts`.
 *
 * Apart van de schemabouwer omdat het schema per lessoort wordt samengesteld — zie
 * `lessonSchema()` hieronder.
 */
const PAYLOAD_FIELDS = {
  uitleg: ['body_html', 'cards'],
  voorbeeld: ['sentence_html'],
  leestekst: ['title', 'body_html', 'words', 'marks'],
  woordenlijst: ['theme'],
  zinnenbank: ['columns'],
  mcq: ['prompt'],
  gap_choice: ['sentence', 'choices', 'answer'],
  gap_type: ['sentence', 'answer'],
  woordorde: ['instruction', 'tokens', 'answer_order'],
  matchen: ['instruction', 'pairs'],
  open_zin: ['prompt', 'model_answer', 'checklist'],
  markeren: ['instruction', 'body_html', 'targets'],
  // `audio_url` staat er NIET bij: de generator kent geen Storage. Hij schrijft het script en
  // de casting, en `generate-lesson-audio.mjs` vult de URL later in. Zie `audioPayload` in
  // lib/lessons/items.ts — een verzonnen pad zou een 404 zijn die eruitziet als kapotte audio.
  audio: ['label', 'script', 'speakers'],
  naspreken: ['prompt', 'target', 'focus'],
  opnemen: ['prompt', 'model_answer', 'checklist'],
};

/**
 * De JSON-schemavorm van elk veld, één keer gedefinieerd.
 *
 * Twee dingen zijn hier bewust weggelaten en het kostte drie API-weigeringen om te vinden:
 *
 *   1. **Geen `['string','null']`-unies en geen enums.** Elk veld is een gewone string of een
 *      lijst strings. De API weigerde het schema eerst met "too many optional parameters" en
 *      daarna met "Schema is too complex", en elke unie telt mee.
 *   2. **Geen optionele extra's** — `note`, `hint`, `accept`, `starter`, `intro`, `layout`,
 *      `source`. Ze staan in `lib/lessons/items.ts` met een default en de les mist er niets
 *      door; ze in het schema houden koste het schema zijn geldigheid. Wil je ze later toch,
 *      dan is de plek `/admin/lessen`, waar de docent ze intypt — niet dit schema.
 */
const FIELD_SCHEMAS = {
  body_html: { type: 'string' },
  // Alle samengestelde velden zijn STRINGLIJSTEN met `||` als scheidingsteken, niet lijsten
  // van objecten: met geneste objecten binnen de item-array weigert de API het schema.
  // `normalisePayloads()` zet ze terug op de vorm die `lib/lessons/items.ts` verwacht.
  cards: {
    type: 'array',
    description: 'Elk element: "LABEL || voorbeeldzin". Bijvoorbeeld "MET HEBBEN || Ik <mark>heb</mark> gewerkt."',
    items: { type: 'string' },
  },
  sentence_html: { type: 'string' },
  title: { type: 'string' },
  words: {
    type: 'array',
    description: 'De woordhulp. Elk element: "het woord || de betekenis in eenvoudig Nederlands".',
    items: { type: 'string' },
  },
  marks: {
    type: 'array',
    description: 'Fragmenten die LETTERLIJK in body_html staan en het concept tonen.',
    items: { type: 'string' },
  },
  theme: { type: 'string' },
  columns: {
    type: 'array',
    description: 'Elk element: "KOP || zin 1 || zin 2 || zin 3".',
    items: { type: 'string' },
  },
  prompt: { type: 'string' },
  sentence: {
    type: 'string',
    description: 'De zin met precies één gat, geschreven als drie underscores: ___',
  },
  choices: { type: 'array', items: { type: 'string' } },
  answer: {
    type: 'string',
    description: 'Het juiste antwoord: precies het woord of de woorden die in het gat horen.',
  },
  /**
   * De juiste volgorde bij `woordorde`, als één string.
   *
   * Een eigen veldnaam en niet `answer`, want in `lib/lessons/items.ts` is `answer` bij
   * woordorde een *lijst* en bij de gap-soorten een *string*. Twee types op één veldnaam kan
   * het JSON-schema niet, en het overladen ervan kostte een extra call per les: het model liet
   * het veld dan simpelweg weg. `normalisePayloads()` splitst dit op spaties naar de lijst die
   * de validatie verwacht.
   */
  answer_order: {
    type: 'string',
    description:
      'De woorden in de juiste volgorde, gescheiden door één spatie. Exact dezelfde woorden ' +
      'als in tokens — geen woord erbij, geen woord eraf.',
  },
  instruction: { type: 'string' },
  tokens: { type: 'array', items: { type: 'string' } },
  pairs: {
    type: 'array',
    description: 'Elk element: "links || rechts". Bijvoorbeeld "de brief || de".',
    items: { type: 'string' },
  },
  model_answer: { type: 'string' },
  checklist: { type: 'array', items: { type: 'string' } },
  targets: {
    type: 'array',
    description: 'Elk element: "label || het te markeren fragment, letterlijk uit body_html".',
    items: { type: 'string' },
  },
  label: {
    type: 'string',
    description:
      'Waar luister je naar, in een paar woorden. "Omroepbericht op het station", ' +
      '"Telefoongesprek met de huisarts". Staat boven de speler, dus hij moet zonder de audio ' +
      'te horen al duidelijk zijn.',
  },
  script: {
    type: 'string',
    description:
      'Het luisterfragment als gesproken tekst, met een spreker per regel: "A: Goedemorgen." ' +
      'op de ene regel, "B: Dag mevrouw." op de volgende. Bij één spreker (een omroepbericht) ' +
      'gebruik je alleen A. Dit is wat er ingesproken wordt — schrijf het zoals mensen praten.',
  },
  speakers: {
    type: 'array',
    description:
      'Wie de sprekers zijn. Elk element: "A || female || Sara" — de tag uit het script, het ' +
      'geslacht (female of male), en de naam of rol. Het geslacht moet kloppen met wat het ' +
      'script zelf zegt: een spreker die "mevrouw De Wit" wordt genoemd is female.',
    items: { type: 'string' },
  },
  target: {
    type: 'string',
    description: 'De zin of het rijtje woorden dat de cursist nazegt. Platte tekst, geen HTML.',
  },
  focus: {
    type: 'string',
    description:
      'Waar de cursist op moet letten bij het naspreken, in één korte zin. Bijvoorbeeld: ' +
      '"Je ziet -lijk, maar je zegt -luk."',
  },
};

/**
 * Welke item-soorten in welke lessoort mogen voorkomen.
 *
 * Dit begon als een omweg om een API-limiet en is het beste deel van dit schema geworden.
 * **De API staat maximaal 24 optionele velden toe**, en de vereniging van alle zestien
 * payloadvormen zijn er 27 — dus het schema moet per lessoort worden samengesteld.
 *
 * Het gevolg is dat het schema nu ook een inhoudelijke regel afdwingt die eerst alleen in de
 * prompt stond: een grammaticales kán geen `leestekst` bevatten en een examentraining geen
 * `voorbeeld`. Dat scheelt niet alleen retries — het is wat de blokken van elkaar
 * onderscheidt. Blok D is examentraining precies omdat er geen uitleg tussen de opgaven staat.
 */
const KINDS_PER_LESSON = {
  // ── A2 Lezen ────────────────────────────────────────────────────────────
  woorden:    ['uitleg', 'woordenlijst', 'matchen', 'gap_choice', 'gap_type', 'mcq'],
  grammatica: ['uitleg', 'voorbeeld', 'mcq', 'gap_choice', 'gap_type', 'woordorde', 'matchen', 'open_zin'],
  strategie:  ['uitleg', 'leestekst', 'markeren', 'mcq', 'open_zin'],
  tekstsoort: ['uitleg', 'leestekst', 'markeren', 'mcq', 'open_zin'],
  /* `gap_choice`, `matchen` en `open_zin` staan hier sinds 08-09 bij, en dat is een correctie
     van deze lijst en niet van de content. De nieuwe kind-check (zie `kindProblems`) keurde
     vier al nagekeken en live trainingslessen van A2 Lezen af — d2, d3, d4 en d6 hebben elk
     een invulopgave of een koppelopgave naast de meerkeuzevragen. Die zijn niet fout: wat blok
     D onderscheidt is dat er géén uitlegblok tussen de opgaven staat, niet dat elke opgave
     meerkeuze moet zijn. De docent heeft ze gezien en vrijgegeven; dan is de regel te smal en
     niet de les. */
  training:   ['uitleg', 'leestekst', 'mcq', 'gap_choice', 'matchen', 'open_zin'],
  toets:      ['mcq', 'gap_choice', 'gap_type', 'woordorde', 'matchen', 'open_zin'],

  // ── de drie nieuwe cursussen ────────────────────────────────────────────
  //
  // Elke rij is een inhoudelijke uitspraak en geen configuratie. Twee die het meest dragen:
  //
  //   * `luistertraining` heeft géén `leestekst`. Bij Lezen ís de tekst de opgave; bij
  //     Luisteren zou een meegeleverde tekst precies de vaardigheid weghalen die getoetst
  //     wordt. Het transcript bestaat wel — het staat op het audio-item en de speler zet het
  //     achter een `<details>`, ná het antwoorden.
  //   * `spreektraining` heeft geen `gap_type` en geen `woordorde`. Typen is niet spreken, en
  //     een spreekles die uit invulopgaven bestaat is de fout die deze hele milestone moest
  //     repareren.
  zinnen:           ['uitleg', 'woordenlijst', 'zinnenbank', 'matchen', 'gap_choice', 'gap_type', 'open_zin'],
  klank:            ['uitleg', 'audio', 'mcq', 'gap_choice', 'gap_type', 'matchen'],
  bouwsteen:        ['uitleg', 'voorbeeld', 'mcq', 'gap_choice', 'gap_type', 'woordorde', 'open_zin'],
  uitspraak:        ['uitleg', 'naspreken', 'mcq', 'gap_type', 'matchen'],
  luisterstrategie: ['uitleg', 'audio', 'mcq', 'gap_type', 'open_zin'],
  schrijfstrategie: ['uitleg', 'voorbeeld', 'markeren', 'mcq', 'open_zin'],
  spreekstrategie:  ['uitleg', 'voorbeeld', 'mcq', 'matchen', 'opnemen'],
  luistertraining:  ['uitleg', 'audio', 'mcq'],
  schrijftraining:  ['uitleg', 'mcq', 'woordorde', 'open_zin'],
  spreektraining:   ['uitleg', 'mcq', 'opnemen'],

  /* Blok E van Luisteren en Spreken kán geen `toets` zijn, en dat was een echte fout in de
     eerste opzet: `toets` staat geen `audio` en geen `naspreken` toe, dus de toets van een
     luistercursus zou de woorden overhoren als geschreven tekst — precies de vaardigheid
     omzeilen die de cursus traint. Het model schreef er audio bij en had daarin gelijk; de
     lijst was mis. Bij Schrijven en Lezen blijft `toets` wél kloppen: daar is de toetsvorm
     tekst. */
  /* `open_zin` mag: "wat zei de vrouw over de afspraak?" in eigen woorden is een luistervraag.
     `woordorde` en `opnemen` niet — de eerste toetst schrijven, de tweede spreken, en geen van
     beide zegt iets over wat de cursist heeft gehoord. */
  luistertoets:     ['audio', 'mcq', 'gap_choice', 'gap_type', 'matchen', 'open_zin'],
  spreektoets:      ['naspreken', 'opnemen', 'mcq', 'gap_type', 'matchen'],
};

/**
 * Bouw het schema voor één lessoort.
 *
 * Structured outputs weigeren `minItems > 1`, `maximum` en `minimum`, dus aantallen en grenzen
 * staan hier NIET — die worden in `validateLesson()` afgedwongen, tegen `lib/lessons/items.ts`.
 * Het schema regelt alleen de vorm.
 */
function lessonSchema(lessonKind) {
  const kinds = KINDS_PER_LESSON[lessonKind];
  if (!kinds) throw new Error(`geen item-soorten gedefinieerd voor lessoort "${lessonKind}"`);

  const fields = [...new Set(kinds.flatMap(k => PAYLOAD_FIELDS[k]))];
  /**
   * Een veld zonder schema is geen onvolledig schema maar een onzichtbaar veld.
   *
   * `Object.fromEntries` zette hier `undefined` neer voor een veld dat in `PAYLOAD_FIELDS`
   * staat maar niet in `FIELD_SCHEMAS`, en de API accepteert dat schema gewoon — het veld
   * bestaat dan simpelweg niet voor het model. Bij `audio.label` kostte dat drie retries per
   * les waarin de validatie om een label vroeg dat het model niet kón leveren: de instructie
   * was juist, het veld was er niet. Liever luid falen bij het bouwen van het schema.
   */
  const orphans = fields.filter(f => !FIELD_SCHEMAS[f]);
  if (orphans.length) {
    throw new Error(
      `lessoort "${lessonKind}": geen FIELD_SCHEMAS-vorm voor ${orphans.join(', ')}. ` +
      'Een veld zonder schema bestaat niet voor het model.');
  }
  const payloadProps = Object.fromEntries(fields.map(f => [f, FIELD_SCHEMAS[f]]));

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['what_you_learn', 'items'],
    properties: {
      what_you_learn: {
        type: 'string',
        description:
          'Eén alinea van 2 tot 3 korte zinnen: wat de cursist na deze les kan. In de je-vorm. ' +
          'Geen opsomming, geen HTML.',
      },
      items: {
        type: 'array',
        description:
          'De inhoud van de les op volgorde: uitleg en opgaven door elkaar. Begin met uitleg, ' +
          'laat daarna oefenen, en bouw op van herkennen naar zelf maken.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['kind', 'tier', 'explanation', 'payload'],
          properties: {
            kind: {
              type: 'string',
              enum: kinds,
              description: 'De soort. Uitleg en materiaal vragen niets; de rest is een opgave.',
            },
            tier: {
              type: ['integer', 'null'],
              description:
                'De moeilijkheidstrap van een OPGAVE: 0 = herkennen (meerkeuze, markeren), ' +
                '1 = invullen met keuzes erbij, 2 = zelf maken (typen, woordorde, open zin). ' +
                'ALTIJD null bij uitleg, voorbeeld, leestekst, woordenlijst en zinnenbank.',
            },
            explanation: {
              type: ['string', 'null'],
              description:
                'Bij een OPGAVE verplicht: waarom is het juiste antwoord juist? Eén of twee ' +
                'korte zinnen, in de je-vorm, die de regel benoemen. ALTIJD null bij uitleg ' +
                'en materiaal.',
            },
            payload: {
              type: 'object',
              additionalProperties: false,
              properties: payloadProps,
            },
          },
        },
      },
    },
  };

  if (kinds.includes('mcq')) {
    schema.properties.items.items.properties.options = {
      type: 'array',
      description:
        'ALLEEN bij kind = "mcq": 3 of 4 opties, precies één met is_correct = true. ' +
        'Labels A, B, C(, D) op volgorde. Bij elke andere kind: laat weg of leeg.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['label', 'body', 'is_correct'],
        properties: {
          label: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
          body: { type: 'string' },
          is_correct: { type: 'boolean' },
        },
      },
    };
  }

  // De limiet die dit ontwerp heeft afgedwongen. Luid falen als een toekomstige lessoort er
  // weer overheen gaat, in plaats van een 400 uit de API twintig regels verderop.
  const optional = fields.length + (kinds.includes('mcq') ? 1 : 0);
  if (optional > 24) {
    throw new Error(
      `lessoort "${lessonKind}" heeft ${optional} optionele velden; de API staat 24 toe. ` +
      'Beperk KINDS_PER_LESSON voor deze lessoort.');
  }

  return schema;
}

/**
 * De payloadvormen, als instructie voor het model.
 *
 * Deze tekst is de menselijke tweeling van `PAYLOAD_SCHEMAS` in `lib/lessons/items.ts`. Ze
 * moeten gelijk blijven; de validatie daar is de scheidsrechter, dit is de uitleg.
 */
const PAYLOAD_GUIDE = `
De payload per kind. Houd je hier PRECIES aan — dit is de vorm die het schema toestaat.

Let op twee schrijfwijzen die overal gelden:
  * Samengestelde velden zijn LIJSTEN VAN STRINGS met " || " als scheidingsteken, nooit
    objecten. Dus ["MET HEBBEN || Ik <mark>heb</mark> gewerkt."], niet [{label:…}].
  * Het veld "answer" is ALTIJD één string, ook bij woordorde — daar zijn het de woorden in de
    juiste volgorde, gescheiden door één spatie.

uitleg        body_html + cards
              body_html: de regel in 2 tot 4 korte zinnen.
              cards (0, 2 of 3): ["LABEL || voorbeeldzin", "LABEL || voorbeeldzin"]
voorbeeld     sentence_html
              Eén zin. <mark> staat om PRECIES het fragment dat het concept toont, nooit om de
              hele zin.
leestekst     title + body_html + words + marks
              body_html is 60 tot 140 woorden.
              words: ["de huurcommissie || hulp bij problemen met de huur"] — 3 tot 6 moeilijke
              woorden die LETTERLIJK in de tekst staan.
              marks: ["omdat het te duur is"] — fragmenten die LETTERLIJK in de tekst staan.
woordenlijst  theme
              Alleen de themanaam die je krijgt. De woorden komen uit de database.
zinnenbank    columns
              columns: ["Iets vragen || Kunt u mij helpen? || Mag ik iets vragen?"]
              1 tot 3 kolommen, 3 tot 5 zinnen per kolom.
mcq           prompt
              De opties staan in het aparte veld "options", NIET in de payload.
gap_choice    sentence + choices + answer
              sentence: "Ik ga naar de bibliotheek ___ een boek te lenen." — precies één gat,
              geschreven als drie underscores.
              choices: 2 tot 4 keuzes. answer MOET letterlijk één van de choices zijn.
gap_type      sentence + answer
              Precies één gat. answer is het woord dat erin hoort.
woordorde     instruction + tokens + answer_order
              tokens: ["ben","omdat","ik","ziek"] — 3 tot 8 losse woorden, geschud.
              answer_order: "omdat ik ziek ben" — EXACT dezelfde woorden, gescheiden door
              spaties, in de juiste volgorde. Geen woord erbij, geen woord eraf.
              LET OP: het veld heet answer_order, niet answer.
matchen       instruction + pairs
              pairs: ["de brief || de", "het formulier || het"] — 2 tot 6 paren.
open_zin      prompt + model_answer + checklist
              De cursist vergelijkt zelf met model_answer. checklist: 1 tot 3 punten.
markeren      instruction + body_html + targets
              targets: ["afzender || de gemeente Utrecht"] — 1 tot 3 stuks, en het fragment
              achter " || " staat LETTERLIJK in body_html.
audio         label + script + speakers
              Het luisterfragment. Er is GEEN audio_url: die komt later uit de TTS-run.
              label: waar je naar luistert, kort. "Omroepbericht op het station"
              script: 40 tot 110 woorden gesproken tekst, met een spreker per regel:
                A: Goedemorgen, kan ik u helpen?
                B: Ja, ik zoek de afdeling burgerzaken.
              Bij een omroepbericht of het nieuws is er één spreker: alleen A.
              speakers: ["A || female || de medewerker", "B || male || Youssef"] — het
              geslacht moet kloppen met wat het script zelf zegt (mevrouw → female).
              Schrijf zoals mensen práten: korte zinnen, "even", "hoor", een aarzeling.
              Geen aanwijzingen tussen haakjes en geen geluidsomschrijvingen.
naspreken     prompt + target + focus
              target: de zin of het rijtje dat de cursist nazegt. Platte tekst, 2 tot 12
              woorden. Bij een klankles mag het een rijtje zijn: "moeilijk, makkelijk,
              natuurlijk".
              focus: waar hij op moet letten, in één zin.
opnemen       prompt + model_answer + checklist
              Een gesproken antwoord. De cursist hoort zichzelf terug en vergelijkt met
              model_answer; er is GEEN beoordeling. model_answer is 2 of 3 zinnen gesproken
              Nederlands — niet een geschreven tekst. checklist: 2 of 3 punten waar de
              cursist zelf op nakijkt.
`.trim();

/* ── de lessoorten ───────────────────────────────────────────────────────── */

/**
 * De opdracht per blok, en de opgavemix die erbij hoort.
 *
 * De mix is per blok anders omdat de blokken iets anders doen. Blok B legt een regel uit en
 * moet daarom van herkennen naar zelf maken lopen; blok D is examentraining en oefent vooral
 * herkennen, want dat is wat het examen bij Lezen vraagt. Zonder deze sturing schrijft het
 * model overal dezelfde meerkeuzevragen — en een les met alleen meerkeuze bewijst niets.
 */
const BRIEFS = {
  woorden: ({ lesson, words }) => ({
    goal:
      `Een woordenles over het thema "${lesson.title}". De cursist leert woorden herkennen en ` +
      `gebruiken die hij in het examen tegenkomt.`,
    shape:
      `Begin met één kort uitlegblok (2 zinnen) dat het thema introduceert. Daarna één ` +
      `"woordenlijst"-item met theme = "${lesson.theme}". Daarna 6 tot 8 opgaven over ` +
      `precies deze woorden:\n` +
      words.map(w => `  - ${w.article ? `${w.article} ` : ''}${w.dutch} — ${w.meaning_nl}`).join('\n') +
      `\n\nGebruik "matchen" (woord bij betekenis), "gap_choice" (het juiste woord in een zin) ` +
      `en "gap_type" (zelf het woord typen). Minstens twee opgaven op tier 2. Gebruik alleen ` +
      `woorden uit de lijst hierboven als antwoord.`,
  }),

  grammatica: ({ concept }) => ({
    goal:
      `Een grammaticales over het concept "${concept.name_nl}". In één regel: ${concept.one_liner}`,
    shape:
      `Begin met één "uitleg" met twee cards die twee gevallen naast elkaar zetten. Daarna één ` +
      `of twee "voorbeeld"-items. Daarna 6 tot 8 opgaven die opbouwen:\n` +
      `  - eerst 2 op tier 0 ("mcq" of "markeren"): herken de vorm\n` +
      `  - dan 3 of 4 op tier 1 ("gap_choice", "matchen"): kies de juiste vorm\n` +
      `  - dan 2 op tier 2 ("gap_type", "woordorde" of "open_zin"): maak het zelf\n\n` +
      `Alle voorbeelden en opgaven gaan over dit ene concept. Verzin geen tweede regel erbij.`,
  }),

  strategie: ({ concept }) => ({
    goal:
      `Een les over de examenaanpak "${concept.name_nl}". In één regel: ${concept.one_liner}`,
    shape:
      `Dit is geen grammatica maar een manier van werken. Begin met één "uitleg" die de aanpak ` +
      `in stappen zet. Daarna één "leestekst" waarop de cursist de aanpak toepast, en 5 tot 7 ` +
      `opgaven bij die tekst: gebruik "markeren" (wijs aan waar het staat) en "mcq" (wat is het ` +
      `antwoord). Minstens één "open_zin" waarin de cursist in eigen woorden zegt wat hij deed. ` +
      `De leestekst is er één die in dit onderdeel echt voorkomt.`,
  }),

  tekstsoort: ({ lesson, sectionName }) => ({
    goal:
      `Een les over de tekstsoort "${sectionName}" in het examen. De cursist leert hoe zo'n ` +
      `tekst in elkaar zit en welke vragen erbij horen.`,
    shape:
      `Begin met één "uitleg" over wat deze tekstsoort is, waar je hem tegenkomt en waar de ` +
      `informatie meestal staat. Daarna één "leestekst" die een echt voorbeeld van deze ` +
      `tekstsoort is, met woordhulp. Daarna 5 tot 7 opgaven bij die tekst, vooral "mcq" op ` +
      `tier 0 en 1, plus één "markeren" en één "open_zin".` +
      (lesson.section === 'formulier-lezen'
        ? ` Let op: een formulier heeft velden en kopjes, geen doorlopend verhaal.` : ''),
  }),

  training: ({ sectionName }) => ({
    goal:
      `Examentraining bij de tekstsoort "${sectionName}". Geen uitleg meer — dit is oefenen ` +
      `zoals in het examen.`,
    shape:
      `Begin met één heel kort "uitleg"-blok (1 zin) dat zegt wat er komt. Daarna één ` +
      `"leestekst" ZONDER woordhulp (words: []) — in het examen krijg je die ook niet — en ` +
      `daarna 5 of 6 "mcq"-opgaven erbij, op tier 0 en 1, met drie opties elk. De vragen ` +
      `vragen naar verschillende dingen: een detail, de hoofdgedachte, en wat je moet doen.`,
  }),

  /* ── A2 Schrijven en Spreken, blok A: woorden én vaste zinnen ──────────── */
  zinnen: ({ lesson, words, onderdeel }) => ({
    goal:
      `Een les over "${lesson.title}". De cursist leert de woorden én de vaste zinnen die hij ` +
      (onderdeel === 'spreken'
        ? 'nodig heeft om dit in een gesprek te zeggen.'
        : 'nodig heeft om dit op te schrijven in een e-mail of een briefje.'),
    shape:
      `Begin met één kort uitlegblok (2 zinnen) dat zegt wanneer je deze zinnen gebruikt. ` +
      `Daarna één "woordenlijst"-item met theme = "${lesson.theme}". Daarna één "zinnenbank" ` +
      `met 2 of 3 kolommen: per kolom een communicatief doel met 3 tot 5 kant-en-klare zinnen ` +
      `die de cursist letterlijk kan gebruiken. Daarna 6 tot 8 opgaven over precies deze ` +
      `woorden en zinnen:\n` +
      words.map(w => `  - ${w.article ? `${w.article} ` : ''}${w.dutch} — ${w.meaning_nl}`).join('\n') +
      `\n\nGebruik "matchen" (zin bij situatie), "gap_choice" en "gap_type", en sluit af met ` +
      `één of twee "open_zin" waarin de cursist het zelf formuleert. Minstens twee opgaven op ` +
      `tier 2. Gebruik alleen woorden en zinnen uit de lijst hierboven als antwoord.`,
  }),

  /* ── A2 Luisteren, blok B: klank en tempo ───────────────────────────────── */
  klank: ({ concept }) => ({
    goal:
      `Een luisterles over "${concept.name_nl}". In één regel: ${concept.one_liner}\n` +
      `Dit gaat over wat je HOORT, niet over wat goed of fout is op papier.`,
    shape:
      `Begin met één "uitleg" met twee cards die twee gevallen naast elkaar zetten (bijvoorbeeld ` +
      `wat je ziet staan tegenover wat je hoort). Daarna één "audio"-item: een kort fragment ` +
      `van 40 tot 80 woorden waarin dit verschijnsel echt voorkomt, in een situatie uit het ` +
      `dagelijks leven in Nederland. Daarna 6 tot 8 opgaven bij dat fragment:\n` +
      `  - 2 op tier 0 ("mcq"): wat hoorde je? Laat de foute opties op de juiste lijken.\n` +
      `  - 3 of 4 op tier 1 ("gap_choice", "matchen"): kies wat er gezegd werd\n` +
      `  - 2 op tier 2 ("gap_type"): schrijf op wat je hoort — een dictee van één woord of ` +
      `getal uit het fragment\n\n` +
      `De opgaven gaan over het fragment, dus elk antwoord moet er letterlijk uit te halen zijn.`,
  }),

  /* ── A2 Schrijven, blok B: de bouwstenen ────────────────────────────────── */
  bouwsteen: ({ concept }) => ({
    goal:
      `Een les over "${concept.name_nl}" bij het SCHRIJVEN. In één regel: ${concept.one_liner}\n` +
      `Dit is geen grammaticales om de regel te leren, maar om hem te halen als je zelf schrijft.`,
    shape:
      `Begin met één "uitleg" met twee cards die goed en minder goed naast elkaar zetten. ` +
      `Daarna één of twee "voorbeeld"-items. Daarna 6 tot 8 opgaven die opbouwen naar zelf ` +
      `schrijven:\n` +
      `  - 2 op tier 0 ("mcq"): welke van deze zinnen is goed geschreven?\n` +
      `  - 2 of 3 op tier 1 ("gap_choice"): kies de juiste vorm\n` +
      `  - 3 op tier 2 ("gap_type", "woordorde", "open_zin"): schrijf het zelf\n\n` +
      `Alle voorbeelden komen uit een e-mail, een briefje of een formulier — de teksten die ` +
      `dit examen vraagt. Verzin geen tweede regel erbij.`,
  }),

  /* ── A2 Spreken, blok B: uitspraak ──────────────────────────────────────── */
  uitspraak: ({ concept }) => ({
    goal:
      `Een uitspraakles over "${concept.name_nl}". In één regel: ${concept.one_liner}`,
    shape:
      `Deze les loopt in vier stappen, en die volgorde is de les:\n` +
      `  1. één "uitleg" met twee cards: wat je ziet staan tegenover wat je zegt\n` +
      `  2. drie of vier "naspreken"-opgaven op tier 1: de cursist hoort het en zegt het na. ` +
      `Begin met losse woorden en eindig met een hele zin. Zet in "focus" waar hij op moet ` +
      `letten.\n` +
      `  3. één of twee "mcq" op tier 0: welk woord hoort bij deze uitspraak? Schrijf de ` +
      `uitspraak in de vraag ("moei-luk") en laat de cursist de spelling kiezen uit woorden ` +
      `die alleen op deze klank verschillen. Zeg NIET "je hoort" — bij deze opgave staat geen ` +
      `audio, alleen de uitspraak in letters.\n` +
      `  4. twee "gap_type" op tier 2: van klank terug naar spelling. Zet de uitspraak in de ` +
      `hint of in de zin zelf ("Ik zet de vuilnisbak bui-ten op straat") en laat de cursist ` +
      `het woord correct spellen.\n\n` +
      `Gebruik alleen woorden die een A2-cursist echt tegenkomt. Geen fonetische tekens: ` +
      `schrijf de uitspraak in gewone Nederlandse letters ("je zegt moei-luk").`,
  }),

  /* ── A2 Luisteren, blok C ───────────────────────────────────────────────── */
  luisterstrategie: ({ concept }) => ({
    goal:
      `Een les over de examenaanpak "${concept.name_nl}" bij LUISTEREN. In één regel: ` +
      `${concept.one_liner}`,
    shape:
      `Dit is geen grammatica maar een manier van werken. Begin met één "uitleg" die de aanpak ` +
      `in stappen zet. Daarna één "audio"-item van 60 tot 110 woorden waarop de cursist die ` +
      `aanpak toepast: een gesprek, een omroepbericht of een telefoongesprek zoals het examen ` +
      `ze geeft. Daarna 5 tot 7 opgaven:\n` +
      `  - 3 of 4 "mcq" op tier 0 en 1, precies de vraagsoort die het examen stelt\n` +
      `  - één of twee "gap_type" op tier 2: schrijf het detail op dat je hoorde\n` +
      `  - één "open_zin" waarin de cursist in eigen woorden zegt hoe hij het antwoord vond\n\n` +
      `Bij minstens één mcq maak je de aanpak zichtbaar in de opties: laat één foute optie ` +
      `precies de val zijn waar deze les over gaat, en leg dat uit in de explanation.`,
  }),

  /* ── A2 Schrijven, blok C ───────────────────────────────────────────────── */
  schrijfstrategie: ({ concept }) => ({
    goal:
      `Een les over "${concept.name_nl}" bij het SCHRIJVEN. In één regel: ${concept.one_liner}`,
    shape:
      `Leer dit aan met een voorbeeld dat NIET goed is, want daar zie je de regel aan. Begin ` +
      `met één "uitleg" die de aanpak in stappen zet. Daarna één of twee "voorbeeld"-items. ` +
      `Daarna 5 tot 7 opgaven:\n` +
      `  - één "markeren": zet in een voorbeeldtekst (een e-mail of een briefje in body_html) ` +
      `aan welk stuk de aanhef, het verzoek of het slot is — of waar de fout zit\n` +
      `  - 3 of 4 "mcq" op tier 0 en 1: welke tekst doet het goed, en waarom\n` +
      `  - één of twee "open_zin" op tier 2: de cursist schrijft het stuk zelf\n\n` +
      `De teksten in deze les zijn e-mails, briefjes en formulieren — niets anders. Bij ` +
      `"markeren" staat het te vinden fragment LETTERLIJK in body_html.`,
  }),

  /* ── A2 Spreken, blok C ─────────────────────────────────────────────────── */
  spreekstrategie: ({ concept }) => ({
    goal:
      `Een les over "${concept.name_nl}" bij het SPREKEN. In één regel: ${concept.one_liner}`,
    shape:
      `Begin met één "uitleg" die de aanpak in stappen zet, met twee cards die een zwak en een ` +
      `goed antwoord naast elkaar zetten. Daarna één of twee "voorbeeld"-items met een zin die ` +
      `de cursist echt kan zeggen. Daarna 5 tot 7 opgaven:\n` +
      `  - 2 of 3 "mcq" op tier 0: welk antwoord past hier, en welk antwoord is te kort\n` +
      `  - één "matchen" op tier 1: situatie bij wat je zegt\n` +
      `  - twee "opnemen" op tier 2: de cursist spreekt zelf een antwoord in. Beschrijf de ` +
      `situatie in de prompt zoals het examen dat doet, geef in model_answer een gesproken ` +
      `voorbeeldantwoord van 2 of 3 zinnen, en 2 of 3 checklistpunten.\n\n` +
      `Let op: bij "opnemen" wordt niets beoordeeld. Schrijf de opdrachtregel dus nooit als ` +
      `"dan kijken wij je antwoord na", maar als "vergelijk je antwoord met het voorbeeld".`,
  }),

  /* ── blok D: de drie examentrainingen ───────────────────────────────────── */
  luistertraining: ({ lesson }) => ({
    goal:
      `Examentraining Luisteren: "${lesson.title}". Geen uitleg meer — dit is oefenen zoals in ` +
      `het examen.`,
    shape:
      `Begin met één heel kort "uitleg"-blok (1 zin) dat zegt wat er komt. Daarna TWEE ` +
      `"audio"-items, elk een fragment van 60 tot 110 woorden, en na elk fragment 2 of 3 ` +
      `"mcq"-opgaven met drie opties op tier 0 en 1. Zet de vragen direct achter het fragment ` +
      `waar ze bij horen.\n\n` +
      `De vragen vragen naar verschillende dingen: een detail (een tijd, een prijs, een naam), ` +
      `de hoofdgedachte, en wat iemand moet doen. In het examen hoor je een fragment één keer ` +
      `en je mag niets opschrijven, dus vraag nooit naar meer dan twee dingen tegelijk.`,
  }),

  schrijftraining: ({ lesson, categoryLabel }) => ({
    goal:
      `Examentraining Schrijven: "${lesson.title}"` +
      (categoryLabel ? ` — de soort opdracht "${categoryLabel}".` : '.') +
      ` Geen uitleg meer, dit is oefenen zoals in het examen.`,
    shape:
      `Begin met één heel kort "uitleg"-blok (1 zin) dat de opdracht aankondigt en zegt hoeveel ` +
      `tijd je er in het examen voor hebt. Daarna 4 tot 6 opgaven:\n` +
      `  - twee of drie "open_zin" op tier 2: de echte opdracht. Schrijf de opdrachtregel ` +
      `precies zoals het examen dat doet, met de inhoudspunten als losse eisen erin. Geef in ` +
      `model_answer een compleet voorbeeldantwoord en in checklist de punten die erin moesten ` +
      `staan.\n` +
      `  - één "woordorde" op tier 2 met een zin uit zo'n tekst\n` +
      `  - één of twee "mcq" op tier 0 over de opdracht zelf: wat moet er in, en wat hoort er ` +
      `juist niet in\n\n` +
      `Geen leesteksten en geen woordhulp: in het examen krijg je die ook niet.`,
  }),

  spreektraining: ({ lesson, categoryLabel }) => ({
    goal:
      `Examentraining Spreken: "${lesson.title}"` +
      (categoryLabel ? ` — de soort opdracht "${categoryLabel}".` : '.') +
      ` Geen uitleg meer, dit is oefenen zoals in het examen.`,
    shape:
      `Begin met één heel kort "uitleg"-blok (1 zin) dat de opdracht aankondigt en zegt hoeveel ` +
      `spreektijd je in het examen krijgt. Daarna 4 tot 6 opgaven:\n` +
      `  - drie of vier "opnemen" op tier 2: de echte opdracht. Beschrijf de situatie in de ` +
      `prompt zoals het examen dat doet — kort, concreet, met een echte reden om iets te ` +
      `zeggen. Geef in model_answer een gesproken voorbeeldantwoord van 2 of 3 zinnen en 2 of ` +
      `3 checklistpunten.\n` +
      `  - één of twee "mcq" op tier 0: welk antwoord past in deze situatie\n\n` +
      `Er wordt niets beoordeeld: de cursist hoort zichzelf terug en vergelijkt met het ` +
      `voorbeeld. Schrijf de opdrachtregels dus nooit als "wij beoordelen je antwoord".`,
  }),

  luistertoets: ({ lesson, concepts }) => ({
    goal:
      `Een diagnostische toets Luisteren: "${lesson.title}". De uitslag zegt welke concepten de ` +
      `cursist nog moet oefenen — niet welk cijfer hij haalt.`,
    shape:
      `Geen uitleg: begin direct. Maak TWEE "audio"-items van 50 tot 90 woorden, met na elk ` +
      `fragment 4 tot 6 opgaven erover, over deze onderwerpen:\n` +
      concepts.map(c => `  - ${c.name_nl}: ${c.one_liner}`).join('\n') +
      `\n\nGebruik "mcq" (tier 0), "matchen" en "gap_choice" (tier 1) en "gap_type" (tier 2 — ` +
      `schrijf op wat je hoort). Elke opgave gaat over precies één onderwerp hierboven, en het ` +
      `antwoord is uit het fragment te halen.`,
  }),

  spreektoets: ({ lesson, concepts }) => ({
    goal:
      `Een diagnostische toets Spreken: "${lesson.title}". De uitslag zegt welke concepten de ` +
      `cursist nog moet oefenen — niet welk cijfer hij haalt.`,
    shape:
      `Geen uitleg: begin direct met de opgaven. Maak 8 tot 10 opgaven over deze onderwerpen:\n` +
      concepts.map(c => `  - ${c.name_nl}: ${c.one_liner}`).join('\n') +
      `\n\nVerdeel ze zo: 2 of 3 "mcq" op tier 0 (welk antwoord past hier), één "matchen" op ` +
      `tier 1, twee "gap_type" op tier 2 (spelling na een uitspraak), twee "naspreken" op tier ` +
      `1 en twee "opnemen" op tier 2. Elke opgave gaat over precies één onderwerp hierboven.\n\n` +
      `Bij "opnemen" en "naspreken" wordt niets beoordeeld: de cursist hoort zichzelf terug en ` +
      `vergelijkt zelf. Schrijf de opdrachtregels dus nooit als "wij beoordelen je antwoord".`,
  }),

  toets: ({ lesson, concepts }) => ({
    goal:
      `Een diagnostische toets: "${lesson.title}". De uitslag zegt welke concepten de cursist ` +
      `nog moet oefenen — niet welk cijfer hij haalt.`,
    shape:
      `Geen uitleg en geen voorbeelden: begin direct met de opgaven. Maak 10 tot 12 opgaven, ` +
      `door elkaar heen, over deze concepten:\n` +
      concepts.map(c => `  - ${c.name_nl}: ${c.one_liner}`).join('\n') +
      `\n\nVerdeel ze over tier 0, 1 en 2, en gebruik minstens vier verschillende soorten. ` +
      `Elke opgave gaat over precies één van de concepten hierboven.`,
  }),
};

/* ── de schrijver ────────────────────────────────────────────────────────── */

export function createLessonAuthor({ apiKey, gatewayKey, effort = 'high', verbose = true }) {
  const author = createAuthor({ apiKey, gatewayKey, effort, verbose, cacheDir: CACHE_DIR });

  /**
   * Schrijf één les.
   *
   * `validateItems` uit `lib/lessons/items.ts` is de scheidsrechter — dezelfde functie die
   * `/admin` gebruikt. Er is dus geen tweede definitie van een geldige opgave, en een les die
   * hier doorkomt kan in de editor niet ongeldig blijken.
   */
  async function writeLesson({ level, onderdeel, block, lesson, context, validateItems }) {
    const brief = BRIEFS[lesson.kind];
    if (!brief) throw new Error(`onbekende lessoort "${lesson.kind}" in ${lesson.slug}`);
    const { goal, shape } = brief({ lesson, ...context });

    const system = [
      A2_REGISTER,
      '',
      `Je schrijft één les voor de cursus ${onderdeel.toUpperCase()} op niveau ${level.toUpperCase()}, ` +
      `in blok ${block.letter} (${block.name_nl}).`,
      '',
      `Toegestane HTML: ${ALLOWED_HTML}. Geen andere tags, geen class-attributen, geen stijlen.`,
      '',
      PAYLOAD_GUIDE,
    ].join('\n');

    const prompt = [
      `LES: ${lesson.title}`,
      '',
      `DOEL: ${goal}`,
      '',
      `OPBOUW: ${shape}`,
      '',
      'Denk aan de drie regels die het vaakst worden overtreden:',
      '1. Een opgave heeft ALTIJD een tier én een explanation. Uitleg en materiaal hebben ALTIJD null voor beide.',
      '2. Bij gap_choice moet answer letterlijk tussen de choices staan, en de zin heeft precies één ___.',
      '3. Bij woordorde heet het antwoordveld answer_order en is het één string met exact dezelfde woorden als tokens.',
    ].join('\n');

    const result = await author.askValidated({
      key: `${level}-${onderdeel}-${lesson.slug}`,
      system,
      prompt,
      schema: lessonSchema(lesson.kind),
      maxTokens: 16000,
      validate: u => validateLesson(u, { validateItems, lessonKind: lesson.kind }),
    });

    return normalisePayloads(result);
  }

  return { writeLesson, stats: author.stats };
}

/**
 * Breng een net ontvangen les op de vorm die `lib/lessons/items.ts` verwacht.
 *
 * Eén conversie, en die is er omdat het JSON-schema twee types op één veldnaam niet toestaat:
 * `answer` is bij `gap_choice`/`gap_type` één string en bij `woordorde` een lijst woorden. Het
 * model levert altijd een string; hier wordt hij voor woordorde gesplitst.
 *
 * **Idempotent**, en dat is geen detail: de functie loopt over een verse respons én over wat
 * uit `generated/` van schijf komt bij `--check`. Zou hij een al gesplitste lijst opnieuw
 * splitsen, dan keurde de tweede run af wat de eerste goedkeurde.
 */
export const SEP = '||';

/** Splits "a || b || c" en houdt alleen niet-lege delen over. */
function parts(value) {
  return String(value).split(SEP).map(s => s.trim()).filter(Boolean);
}

/**
 * De stempoules per geslacht, uit `data/tts-voices.json`.
 *
 * Afgeleid en niet opgesomd: een vijfde stem toevoegen mag alleen met goedkeuring van de
 * eigenaar, maar als het gebeurt hoort hij hier meteen mee te doen in plaats van in een lijst
 * te ontbreken die niemand meer nakijkt. Nooit een ElevenLabs-id hier — alleen sleutels.
 */
const VOICE_POOL = {
  female: Object.keys(VOICES).filter(k => VOICES[k].gender === 'female'),
  male: Object.keys(VOICES).filter(k => VOICES[k].gender === 'male'),
};

/**
 * Van `speakers: ["A || female || Sara"]` naar `voice_cast: { A: 'woman_young' }`.
 *
 * **Het geslacht is geauthored, de stem is toegewezen.** Dat is precies de grens die
 * `lib/tts-dialogue.ts` trekt: welk geslacht een spreker heeft is een inhoudelijk feit dat het
 * script zelf vastlegt ("mevrouw De Wit"), en dat mag niemand raden — een verkeerd gecaste
 * stem is een hoorbare contentfout die je niet uit de mp3 kunt repareren. Wélke van de twee
 * vrouwenstemmen het wordt is dat niet: dat is een keuze zonder betekenis, zolang twee
 * sprekers nooit dezelfde stem krijgen. Dat laatste wordt hier afgedwongen door per poule
 * door te tellen.
 */
function castFromSpeakers(speakers) {
  const used = { female: 0, male: 0 };
  const cast = {};
  for (const line of speakers) {
    const [tag, gender] = parts(line);
    if (!tag) continue;
    const g = String(gender ?? '').toLowerCase().startsWith('m') ? 'male' : 'female';
    const pool = VOICE_POOL[g];
    cast[tag] = pool[used[g] % pool.length];
    used[g] += 1;
  }
  return cast;
}

/** De gesproken tekst zonder de sprekerlabels — wat de cursist ná het antwoorden mag lezen. */
function scriptToTranscript(script) {
  return String(script)
    .split('\n')
    .map(line => line.replace(/^\s*[A-Za-z][A-Za-z0-9_ -]{0,15}:\s*/, '').trim())
    .filter(Boolean)
    .join(' ');
}

export function normalisePayloads(unit) {
  for (const item of unit?.items ?? []) {
    const p = item.payload;
    if (!p) continue;

    /* Een audio-item: het script blijft staan, de casting wordt eruit afgeleid en het
       transcript erbij gezet. `audio_url` blijft expliciet null — die vult
       `generate-lesson-audio.mjs` later in, en tot die tijd zegt de speler dat het fragment
       nog niet is ingesproken. */
    if (item.kind === 'audio' || item.kind === 'naspreken') {
      if (p.audio_url === undefined) p.audio_url = null;
    }
    if (item.kind === 'audio') {
      if (Array.isArray(p.speakers)) {
        if (!p.voice_cast) p.voice_cast = castFromSpeakers(p.speakers);
        delete p.speakers;
      }
      if (!p.transcript && p.script) p.transcript = scriptToTranscript(p.script);
    }
    /* Bij `naspreken` ís de doelzin de inspreektekst. Hem apart laten schrijven zou twee
       teksten opleveren die uit elkaar kunnen lopen, en dan zegt het voorbeeld iets anders
       dan er staat. */
    if (item.kind === 'naspreken' && !p.script && p.target) {
      p.script = String(p.target);
    }
    /* `opnemen`: de lijstvelden krijgen hun default hier, zodat het JSON-schema ze niet als
       optioneel veld hoeft te dragen — de API telt er maar 24. */
    if (item.kind === 'opnemen') {
      if (!Array.isArray(p.image_urls)) p.image_urls = [];
      if (typeof p.record_seconds !== 'number') p.record_seconds = 60;
    }

    // `answer_order` (één string) wordt `answer` (lijst woorden), de vorm die
    // `lib/lessons/items.ts` bij woordorde verwacht.
    if (item.kind === 'woordorde') {
      if (typeof p.answer_order === 'string') {
        p.answer = p.answer_order.trim().split(/\s+/).filter(Boolean);
        delete p.answer_order;
      } else if (typeof p.answer === 'string') {
        // Een oudere gecachte les die `answer` als string draagt.
        p.answer = p.answer.trim().split(/\s+/).filter(Boolean);
      }
    }

    // De samengestelde velden: stringlijst -> lijst van objecten.
    if (Array.isArray(p.cards) && p.cards.some(c => typeof c === 'string')) {
      p.cards = p.cards.map(c => {
        if (typeof c !== 'string') return c;
        const [label, ...rest] = parts(c);
        return { label: label ?? '', example_html: rest.join(` ${SEP} `) };
      });
    }
    if (Array.isArray(p.words) && p.words.some(w => typeof w === 'string')) {
      p.words = p.words.map(w => {
        if (typeof w !== 'string') return w;
        const [word, ...rest] = parts(w);
        return { word: word ?? '', meaning: rest.join(` ${SEP} `) };
      });
    }
    if (Array.isArray(p.pairs) && p.pairs.some(x => typeof x === 'string')) {
      p.pairs = p.pairs.map(x => {
        if (typeof x !== 'string') return x;
        const [left, ...rest] = parts(x);
        return { left: left ?? '', right: rest.join(` ${SEP} `) };
      });
    }
    if (Array.isArray(p.targets) && p.targets.some(t => typeof t === 'string')) {
      p.targets = p.targets.map(t => {
        if (typeof t !== 'string') return t;
        const [label, ...rest] = parts(t);
        // Het fragment mag zelf geen `||` bevatten; de rest weer aan elkaar plakken zou een
        // fragment opleveren dat niet letterlijk in de tekst staat — en dat is precies wat de
        // validatie daarna afkeurt, met een begrijpelijke melding.
        return { label: label ?? '', text: rest.join(` ${SEP} `) };
      });
    }
    if (Array.isArray(p.columns) && p.columns.some(c => typeof c === 'string')) {
      p.columns = p.columns.map(c => {
        if (typeof c !== 'string') return c;
        const [heading, ...phrases] = parts(c);
        return { heading: heading ?? '', phrases };
      });
    }
  }
  return unit;
}

/**
 * Mag elke soort in déze lessoort voorkomen?
 *
 * Geëxporteerd omdat drie plekken hem nodig hebben — de schrijver, `--check` op schijf en de
 * seeder — en één kopie per plek is precies hoe de generator iets zou goedkeuren wat de seeder
 * afkeurt. Zie de aanroep in `validateLesson`.
 */
export function audioProblems(items) {
  const out = [];
  for (const [i, it] of items.entries()) {
    if (it.kind !== 'audio') continue;
    if (!String(it.payload?.label ?? '').trim()) {
      out.push(`item ${i + 1} (audio): geen label`);
    }
    if (!String(it.payload?.script ?? '').trim()) {
      out.push(`item ${i + 1} (audio): geen script`);
    }
  }
  return out;
}

export function kindProblems(items, lessonKind) {
  const allowed = new Set(KINDS_PER_LESSON[lessonKind] ?? []);
  if (allowed.size === 0) return [`onbekende lessoort "${lessonKind}"`];
  return items.flatMap((it, i) => allowed.has(it.kind)
    ? []
    : [`item ${i + 1}: "${it.kind}" mag niet in een les van soort "${lessonKind}"; ` +
       `toegestaan: ${[...allowed].join(', ')}`]);
}

/**
 * Valideer één les zoals het model hem teruggaf.
 *
 * Geeft een lijst *regels die gebroken zijn*, in het Nederlands, want die lijst gaat
 * rechtstreeks terug naar het model als retry-instructie. "vraag 3 heeft 5 opties, de regel is
 * 3 of 4" is een oplosbare opdracht; "ongeldig" is dat niet.
 */
export function validateLesson(unit, { validateItems, lessonKind }) {
  const problems = [];

  if (!unit || typeof unit !== 'object') return ['de respons is geen object'];
  normalisePayloads(unit);
  if (!unit.what_you_learn?.trim()) problems.push('what_you_learn is leeg');
  if (!Array.isArray(unit.items) || unit.items.length === 0) {
    return [...problems, 'items is leeg'];
  }

  // Dit is de val die `scripts/b1-content` heeft gevonden en die niets anders opmerkt: het
  // model levert soms `"\\u00f6"` waar het `"ö"` bedoelt, en dan staat er letterlijk
  // "coördinator" in de les. De JSON is geldig, elk schema klopt, en in een diff leest
  // het goed tenzij je naar dat ene woord kijkt.
  if (looksEscaped(unit)) problems.push('er staan dubbel-escaped tekens in de tekst (\\u00xx)');

  // `sort_order` komt van ons, niet van het model: de lijstvolgorde IS de volgorde. Hem laten
  // verzinnen levert gaten en duplicaten op die pas in de database opvallen.
  const items = unit.items.map((it, i) => ({
    kind: it.kind,
    sort_order: i,
    tier: it.tier ?? null,
    payload: it.payload ?? {},
    explanation: it.explanation ?? null,
    section_slug: null,
    options: (it.options ?? []).map((o, j) => ({
      label: o.label,
      body: o.body,
      image_urls: [],
      is_correct: !!o.is_correct,
      sort_order: j,
    })),
  }));

  for (const issue of validateItems(items)) {
    const where = issue.index >= 0 ? `item ${issue.index + 1} (${issue.kind})` : 'de les';
    problems.push(`${where}: ${issue.message}`);
  }

  /**
   * Elke soort moet in DEZE lessoort mogen voorkomen.
   *
   * Het JSON-schema zet `kind` al op een enum per lessoort, en toch is dit nodig: in de
   * Luisteren-run leverde het model een `opnemen`-item in `e1-woorden-en-klanken`, een
   * lessoort die dat niet toestaat — en het kwam er langs, want de validatie keek alleen naar
   * `validateItems`, en dat vindt élke bestaande soort geldig. Resultaat: een spreekopdracht
   * in de toets van een luistercursus. Het examen vraagt daar niet om spreken, en de opgave
   * had geen microfoon-context om in te staan.
   *
   * Structured outputs zijn dus niet de muur waarvoor ze doorgingen. Deze check is dat wel, en
   * hij levert een bruikbare retry-instructie op in plaats van een stille fout.
   */
  problems.push(...kindProblems(items, lessonKind));

  // Twee regels over de les als geheel die geen item-schema kan zien.
  const exercises = items.filter(i => TIERED.has(i.kind));
  if (exercises.length < 4) {
    problems.push(`de les heeft ${exercises.length} opgaven, dat moeten er minstens 4 zijn`);
  }
  // Variatie eisen mag alleen als de lessoort meer dan één opgavesoort tóestaat.
  //
  // Dit was een regel die niet te halen was: blok D (examentraining) mag per ontwerp alleen
  // `mcq` bevatten — dat is wat het examen bij Lezen ook is — en de eis "gebruik minstens twee
  // verschillende soorten" verwierp dus elke correcte trainingsles, drie keer op rij, tot de
  // run opgaf. Precies de vorm die `scripts/b1-content` al eens heeft opgeleverd met de
  // run-together-lines-detector: een check die op zijn eigen oplossing afvuurt, waardoor geen
  // enkele retry kan slagen.
  const allowedExercises = (KINDS_PER_LESSON[lessonKind] ?? []).filter(k => TIERED.has(k));
  const kinds = new Set(exercises.map(i => i.kind));
  if (allowedExercises.length > 1 && exercises.length >= 5 && kinds.size < 2) {
    problems.push('alle opgaven zijn van dezelfde soort; gebruik er minstens twee verschillende');
  }

  /**
   * Een luisterfragment heeft een label én een script.
   *
   * Het label is niet decoratief: een luistertraining zet twee spelers onder elkaar, en zonder
   * label staat er twee keer een naamloze speler waarvan je pas na het afspelen weet waar hij
   * over ging. In de eerste run kwam veertien van de negenentwintig fragmenten zonder label
   * terug — het veld is optioneel in het JSON-schema (de API telt maar 24 optionele velden en
   * `required` kan niet per item-soort), dus dit is de plek waar het alsnog moet.
   *
   * Zonder script is er niets om in te spreken en blijft de speler voor altijd leeg.
   */
  for (const [i, it] of items.entries()) {
    if (it.kind !== 'audio') continue;
    if (!String(it.payload?.label ?? '').trim()) {
      problems.push(`item ${i + 1} (audio): geef een kort label — waar luister je naar?`);
    }
    if (!String(it.payload?.script ?? '').trim()) {
      problems.push(`item ${i + 1} (audio): het script is leeg; zonder script is er niets om in te spreken`);
    }
    if (!String(it.payload?.voice_cast ? Object.keys(it.payload.voice_cast).join('') : '').trim()) {
      problems.push(`item ${i + 1} (audio): geef per spreker het geslacht mee in "speakers"`);
    }
  }

  // Verwijzingen naar tekst die er niet staat. Dit is de fout die er volstrekt normaal uitziet:
  // de opgave rendert, en het te markeren fragment is nergens te vinden.
  for (const [i, it] of items.entries()) {
    if (it.kind === 'markeren') {
      const body = String(it.payload?.body_html ?? '');
      for (const t of it.payload?.targets ?? []) {
        if (t?.text && !body.includes(t.text)) {
          problems.push(`item ${i + 1} (markeren): "${t.text}" staat niet letterlijk in body_html`);
        }
      }
    }
    if (it.kind === 'leestekst') {
      const body = String(it.payload?.body_html ?? '');
      for (const m of it.payload?.marks ?? []) {
        if (m && !body.includes(m)) {
          problems.push(`item ${i + 1} (leestekst): mark "${m}" staat niet letterlijk in body_html`);
        }
      }
      for (const w of it.payload?.words ?? []) {
        // Op de kale vorm vergeleken: de woordhulp noemt "de huurcommissie" waar de tekst
        // "huurcommissie" heeft, en dat is geen fout in de content.
        const bare = String(w?.word ?? '').replace(/^(de|het|een)\s+/i, '');
        if (bare && !body.toLowerCase().includes(bare.toLowerCase())) {
          problems.push(`item ${i + 1} (leestekst): woordhulp "${w.word}" staat niet in de tekst`);
        }
      }
    }
  }

  return problems;
}

/* Moet gelijk blijven aan EXERCISE_KINDS in lib/lessons/items.ts. */
const TIERED = new Set([
  'mcq', 'gap_choice', 'gap_type', 'woordorde', 'matchen', 'open_zin', 'markeren',
  'naspreken', 'opnemen',
]);
