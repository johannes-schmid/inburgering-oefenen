/**
 * De visuele voorstelling van de regel van een les — het plaatje dat vóór de uitleg staat.
 *
 * ── WAAROM DIT EEN DATABESTAND IS EN GEEN LESITEM ────────────────────────────
 * Een visual is geen content maar een *voorstelling van* content die er al is: de regel staat
 * in `lesson_items.uitleg.body_html`, de voorbeelden staan in de `voorbeeld`-items. Het als
 * item-soort in de database zetten zou betekenen dat dezelfde regel op twee plekken staat en
 * dus uit elkaar kan lopen — en het zou een migratie, een editor-tab en een valideerregel
 * kosten voor iets wat per les één keer wordt gezet en daarna nooit meer verandert.
 *
 * Hier staat het dus als getypte data, per lesslug. Dat geeft drie dingen die de database niet
 * geeft: een discriminated union die een verkeerd veld een **compilefout** maakt, een diff die
 * de docent kan nakijken, en de vrijheid om een nieuw soort plaatje toe te voegen zonder
 * `lesson_items.kind` op te rekken.
 *
 * ── DE SOORTEN ZIJN NAAR GRAMMATICA GESNEDEN, NIET NAAR VORM ─────────────────
 * Er is geen generieke "diagram"-soort met vrije vakjes, want dan zet elke les zijn eigen
 * plaatje in elkaar en is de tiende les niets meer als de eerste. Elke soort hieronder
 * beantwoordt één grammaticale vraag, en lessen die diezelfde vraag stellen delen hem:
 *
 *   zinslots    — waar staat het werkwoord in een hoofdzin?           (plaats 1, 2, 3…)
 *   bijzin      — wat doet het werkwoord in een bijzin?               (het schuift naar achter)
 *   vervoeging  — welke uitgang hoort bij welke persoon?              (stam + uitgang)
 *   bouwer      — hoe zet je een vorm in elkaar?                      (ge- + stam + -d/-t)
 *   tijdbalk    — wanneer gebeurt het?                                (toen · nu · straks)
 *   sorteer     — in welk bakje hoort dit woord?                      (de/het, hebben/zijn)
 *   trap        — hoeveel meer?                                       (groot · groter · grootst)
 *   paren       — welke twee woorden horen vast bij elkaar?           (wachten óp)
 *   ruimte      — waar ligt het?                                      (in, op, naast, onder)
 *   frequentie  — hoe vaak?                                           (nooit … altijd)
 *
 * ── STAPPEN, EN DE KOPPELING MET DE INGESPROKEN UITLEG ───────────────────────
 * Elke visual heeft genummerde **stappen**. Een cue `vis-1` in het narratiescript laat stap 1
 * oplichten terwijl de stem erover praat; `vis` zonder nummer licht het hele plaatje op. Zo
 * wijst de opname niet alleen naar de kaart maar naar het vákje waar het over gaat, en dat is
 * het verschil tussen "er licht iets op" en "kijk hier".
 *
 * Het aantal stappen is per soort af te leiden uit de data — daarom staat er geen `stepCount`
 * in de spec: een tweede plek die zegt hoeveel stappen er zijn, is een plek die niet klopt.
 */

/** De rol van een stuk zin. Bepaalt hoe het chipje eruitziet, niet wat het betekent. */
export type SlotRole =
  /** Het werkwoord — het enige dat navy is, want daar gaat elke les in blok B over. */
  | 'werkwoord'
  /** Het onderwerp. */
  | 'onderwerp'
  /** Tijd, plaats of ander begin dat plaats één kan innemen. */
  | 'bepaling'
  /** De rest van de zin. */
  | 'rest'
  /** Een voegwoord of vraagwoord dat buiten de plaatsen valt. */
  | 'schakel';

/** Eén vakje in een zinsbalk. */
export type Slot = {
  /** De woorden in dit vakje. Meerdere woorden in één vakje is precies het punt van plaats één. */
  text: string;
  role: SlotRole;
  /** Het plaatsnummer. `null` = valt buiten de nummering (een voegwoord vóór de zin). */
  place: number | null;
  /** Een korte naam onder het vakje, bijv. "tijd" of "plaats 2". */
  tag?: string;
};

/** Eén zin als rij vakjes, met wat eronder over die rij te zeggen valt. */
export type SlotRow = {
  slots: Slot[];
  /** Boven de rij: waar deze zin een voorbeeld van is. */
  label?: string;
  /** Onder de rij: wat er in deze rij te zien is. */
  note?: string;
  /** Een foute zin, met een streep erdoor. Fout mag getoond worden, maar nooit zonder markering. */
  wrong?: boolean;
  /** Twee vakjes die van plaats wisselen: een boog tussen deze twee plaatsen. */
  swap?: [number, number];
};

export type LessonVisual =
  /** Zinsbalken met genummerde plaatsen. Eén stap per rij. */
  | { kind: 'zinslots'; caption: string; rows: SlotRow[] }
  /**
   * Hoofdzin + bijzin, met het werkwoord dat naar het eind schuift.
   * Stap 1 = de hoofdzin, 2 = het voegwoord, 3 = de bijzin met het werkwoord achteraan.
   */
  | {
      kind: 'bijzin';
      caption: string;
      /** De hoofdzin, links. */
      main: string;
      /** Het voegwoord in het midden — omdat, als, dat, of, om … te. */
      hinge: string;
      /** De bijzin, opgesplitst in het stuk vóór het werkwoord en het werkwoord zelf. */
      sub: { front: string; verb: string };
      /** De zin zoals hij zónder voegwoord zou luiden, als bewijs dat het werkwoord verhuisd is. */
      plain?: string;
      note?: string;
    }
  /**
   * Een vervoegingstabel: stam plus uitgang per persoon.
   * Eén stap per rij, en de uitgang is wat oplicht.
   */
  | {
      kind: 'vervoeging';
      caption: string;
      /** De infinitief, boven de tabel. */
      infinitive: string;
      /** De stam, als die te tonen is. Onregelmatige werkwoorden hebben er geen. */
      stem?: string;
      rows: {
        person: string;
        /** Het deel dat gelijk blijft. */
        base: string;
        /** De uitgang. Leeg = geen uitgang, en dat is óók een feit (ik werk). */
        ending: string;
        note?: string;
      }[];
    }
  /**
   * Een vorm die uit blokken wordt opgebouwd: ge + werk + t.
   * Eén stap per blok, plus een laatste stap voor het resultaat.
   */
  | {
      kind: 'bouwer';
      caption: string;
      /** Waar je begint — de infinitief of de stam. */
      from: string;
      /** De blokken, op volgorde. Een blok zonder tekst is een leeg vak (geen ge-). */
      parts: { text: string; tag: string; muted?: boolean }[];
      /** Wat er uitkomt. */
      result: string;
      /** Nog twee of drie voorbeelden onder de bouw, om te laten zien dat het een regel is. */
      more?: { from: string; result: string }[];
      note?: string;
    }
  /**
   * De tijdbalk: toen · nu · straks, met per punt de vorm die daar hoort.
   * Eén stap per punt.
   */
  | {
      kind: 'tijdbalk';
      caption: string;
      points: {
        when: string;
        form: string;
        /** Het punt waar deze les over gaat, in klei. */
        here?: boolean;
        note?: string;
      }[];
    }
  /**
   * Bakjes met woorden erin: de/het, hebben/zijn, -en/-s/-'s.
   * Eén stap per bakje.
   */
  | {
      kind: 'sorteer';
      caption: string;
      buckets: {
        name: string;
        /** De vuistregel van dit bakje, in één regel. */
        rule?: string;
        words: string[];
      }[];
      /** De uitzonderingen, apart en met zoveel woorden — anders lijken ze de regel te breken. */
      exceptions?: { words: string[]; note: string };
    }
  /**
   * De trappen van vergelijking als oplopende balken.
   * Eén stap per trap.
   */
  | {
      kind: 'trap';
      caption: string;
      steps: { form: string; tag: string; example: string }[];
      /** De onregelmatige rijtjes, als vergelijking eronder. */
      irregular?: { base: string; comp: string; sup: string }[];
    }
  /**
   * Twee woorden die vast bij elkaar horen: wachten + op, zich + vergissen.
   * Eén stap per paar.
   */
  | {
      kind: 'paren';
      caption: string;
      /** Wat er links en rechts van het paar staat, als kopjes. */
      heads: [string, string];
      pairs: { left: string; right: string; example: string }[];
      note?: string;
    }
  /**
   * Voorzetsels van plaats, als een doosje met een stip erin, erop of ernaast.
   * Eén stap per voorzetsel.
   */
  | {
      kind: 'ruimte';
      caption: string;
      items: {
        word: string;
        /** Waar de stip ligt ten opzichte van de doos. Dit is de hele voorstelling. */
        spot: 'in' | 'op' | 'onder' | 'naast' | 'voor' | 'achter' | 'tussen' | 'boven';
        example: string;
      }[];
    }
  /**
   * Hoe vaak: een as van nooit naar altijd met de woorden erop.
   * Eén stap per woord.
   */
  | {
      kind: 'frequentie';
      caption: string;
      words: { word: string; pct: number; example: string }[];
      note?: string;
    };

/**
 * Per lesslug het plaatje van die les.
 *
 * Alleen blok B (grammatica) staat hier, en dat is een keuze: blok A is woordenschat per thema
 * en blok C/D zijn leesstrategieën. Die hebben geen vórm om te tekenen — een strategie
 * ("lees eerst de vraag") als diagram wordt een plaatje van een instructie, en dat is
 * versiering. Wat die lessen wél krijgen is de ingesproken uitleg met het meelezen; het
 * plaatje is voor de regels die een structuur hébben.
 */
export const LESSON_VISUALS: Record<string, LessonVisual> = {
  /* ── Module: de zin ──────────────────────────────────────────────────────── */

  'b1-hoofdzin-woordorde': {
    kind: 'zinslots',
    caption: 'In een hoofdzin staat het werkwoord altijd op plaats twee.',
    rows: [
      {
        label: 'De zin begint met het onderwerp',
        slots: [
          { text: 'Ik', role: 'onderwerp', place: 1 },
          { text: 'werk', role: 'werkwoord', place: 2 },
          { text: 'op maandag', role: 'rest', place: 3 },
        ],
        note: 'Alles staat in de volgorde die je verwacht.',
      },
      {
        label: 'De zin begint met een tijd',
        slots: [
          { text: 'Op maandag', role: 'bepaling', place: 1, tag: 'tijd' },
          { text: 'werk', role: 'werkwoord', place: 2 },
          { text: 'ik', role: 'onderwerp', place: 3 },
        ],
        note: 'Het werkwoord blijft op plaats twee. Het onderwerp schuift naar achter.',
        swap: [1, 3],
      },
      {
        label: 'Zo niet',
        wrong: true,
        slots: [
          { text: 'Op maandag', role: 'bepaling', place: 1, tag: 'tijd' },
          { text: 'ik', role: 'onderwerp', place: 2 },
          { text: 'werk', role: 'werkwoord', place: 3 },
        ],
        note: 'Hier staat het onderwerp op plaats twee. Dat mag niet.',
      },
      {
        label: 'Plaats één kan meerdere woorden zijn',
        slots: [
          { text: 'Mijn oude buurvrouw', role: 'onderwerp', place: 1, tag: '3 woorden, 1 plaats' },
          { text: 'koopt', role: 'werkwoord', place: 2 },
          { text: 'brood bij de bakker', role: 'rest', place: 3 },
        ],
        note: 'Plaats twee is niet het tweede wóórd, maar het tweede vakje.',
      },
    ],
  },

  'b2-inversie': {
    kind: 'zinslots',
    caption: 'Begint de zin niet met het onderwerp, dan wisselen onderwerp en werkwoord van plaats.',
    rows: [
      {
        label: 'Gewone volgorde',
        slots: [
          { text: 'Wij', role: 'onderwerp', place: 1 },
          { text: 'gaan', role: 'werkwoord', place: 2 },
          { text: 'morgen naar de dokter', role: 'rest', place: 3 },
        ],
      },
      {
        label: 'De zin begint met de tijd',
        slots: [
          { text: 'Morgen', role: 'bepaling', place: 1, tag: 'tijd' },
          { text: 'gaan', role: 'werkwoord', place: 2 },
          { text: 'wij', role: 'onderwerp', place: 3 },
          { text: 'naar de dokter', role: 'rest', place: 4 },
        ],
        note: 'Dit heet inversie: het onderwerp komt ná het werkwoord.',
        swap: [1, 3],
      },
      {
        label: 'Ook na een bijzin',
        slots: [
          { text: 'Omdat ik ziek ben', role: 'bepaling', place: 1, tag: 'hele bijzin = plaats 1' },
          { text: 'blijf', role: 'werkwoord', place: 2 },
          { text: 'ik', role: 'onderwerp', place: 3 },
          { text: 'thuis', role: 'rest', place: 4 },
        ],
        note: 'Een hele bijzin kan plaats één innemen. Daarna komt meteen het werkwoord.',
        swap: [1, 3],
      },
    ],
  },

  'b3-voegwoorden-hoofdzin': {
    kind: 'zinslots',
    caption: 'en, maar, want, dus, of verbinden twee hoofdzinnen. De volgorde verandert niet.',
    rows: [
      {
        label: 'Twee hoofdzinnen met want',
        slots: [
          { text: 'Ik blijf thuis', role: 'rest', place: 1, tag: 'hoofdzin' },
          { text: 'want', role: 'schakel', place: null, tag: 'voegwoord' },
          { text: 'ik', role: 'onderwerp', place: 1 },
          { text: 'ben', role: 'werkwoord', place: 2 },
          { text: 'ziek', role: 'rest', place: 3 },
        ],
        note: 'Na want begint de nummering opnieuw: onderwerp, werkwoord, rest.',
      },
      {
        label: 'Met dus',
        slots: [
          { text: 'Ik ben ziek', role: 'rest', place: 1, tag: 'hoofdzin' },
          { text: 'dus', role: 'schakel', place: null, tag: 'voegwoord' },
          { text: 'ik', role: 'onderwerp', place: 1 },
          { text: 'blijf', role: 'werkwoord', place: 2 },
          { text: 'thuis', role: 'rest', place: 3 },
        ],
        note: 'Het werkwoord staat weer op plaats twee. Niet achteraan.',
      },
      {
        label: 'Zo niet',
        wrong: true,
        slots: [
          { text: 'Ik ben ziek', role: 'rest', place: 1, tag: 'hoofdzin' },
          { text: 'want', role: 'schakel', place: null },
          { text: 'ik thuis blijf', role: 'rest', place: 1, tag: 'werkwoord achteraan' },
        ],
        note: 'Dit is de volgorde van een bijzin. Na want hoort een hoofdzin.',
      },
    ],
  },

  'b4-bijzin-omdat-als': {
    kind: 'bijzin',
    caption: 'Na omdat, als en toen gaat het werkwoord naar het eind van de zin.',
    main: 'Ik blijf thuis',
    hinge: 'omdat',
    sub: { front: 'ik ziek', verb: 'ben' },
    plain: 'Ik ben ziek.',
    note: 'Los is het "ik ben ziek". Na omdat wordt het "ik ziek ben" — het werkwoord schuift naar achter.',
  },

  'b5-bijzin-dat-of': {
    kind: 'bijzin',
    caption: 'Ook na dat en of staat het werkwoord achteraan.',
    main: 'Hij zegt',
    hinge: 'dat',
    sub: { front: 'de winkel om zes uur dicht', verb: 'gaat' },
    plain: 'De winkel gaat om zes uur dicht.',
    note: 'of gebruik je bij een vraag: "Zij vraagt of je morgen kunt komen."',
  },

  'b6-om-te': {
    kind: 'bijzin',
    caption: 'om … te zegt waarvoor je iets doet. Het werkwoord staat achter te.',
    main: 'Ik ga naar de gemeente',
    hinge: 'om',
    sub: { front: 'een paspoort te', verb: 'halen' },
    plain: 'Ik haal een paspoort.',
    note: 'Tussen om en te staat wat je doet. Het werkwoord blijft in de hele vorm: halen, niet haal.',
  },

  'b7-vragen-maken': {
    kind: 'zinslots',
    caption: 'Een vraag zonder vraagwoord begint met het werkwoord. Mét vraagwoord komt dat eerst.',
    rows: [
      {
        label: 'Gewone zin',
        slots: [
          { text: 'Je', role: 'onderwerp', place: 1 },
          { text: 'woont', role: 'werkwoord', place: 2 },
          { text: 'in Utrecht', role: 'rest', place: 3 },
        ],
      },
      {
        label: 'Ja/nee-vraag: het werkwoord vooraan',
        slots: [
          { text: 'Woon', role: 'werkwoord', place: 1 },
          { text: 'je', role: 'onderwerp', place: 2 },
          { text: 'in Utrecht?', role: 'rest', place: 3 },
        ],
        note: 'Bij jij en je valt de -t weg: woon je, niet woont je.',
        swap: [1, 2],
      },
      {
        label: 'Vraag met een vraagwoord',
        slots: [
          { text: 'Waar', role: 'schakel', place: 1, tag: 'vraagwoord' },
          { text: 'woon', role: 'werkwoord', place: 2 },
          { text: 'je', role: 'onderwerp', place: 3 },
          { text: '?', role: 'rest', place: 4 },
        ],
        note: 'Het vraagwoord neemt plaats één. Het werkwoord staat weer op plaats twee.',
      },
    ],
  },

  'b14-toekomende-tijd': {
    kind: 'tijdbalk',
    caption: 'Over later praat je met gaan, met zullen, of gewoon met de tegenwoordige tijd.',
    points: [
      { when: 'gisteren', form: 'Ik werkte', note: 'verleden tijd — les 13' },
      { when: 'nu', form: 'Ik werk', note: 'tegenwoordige tijd — les 8' },
      {
        when: 'morgen',
        form: 'Ik ga werken',
        here: true,
        note: 'gaan + hele werkwoord: het gewoonste antwoord op "wat doe je morgen?"',
      },
      {
        when: 'later',
        form: 'Ik zal werken',
        here: true,
        note: 'zullen klinkt formeler, en wordt gebruikt voor een belofte',
      },
      {
        when: 'morgen',
        form: 'Ik werk morgen',
        here: true,
        note: 'staat er een tijd in de zin, dan mag de tegenwoordige tijd ook',
      },
    ],
  },

  'b15-gebiedende-wijs': {
    kind: 'zinslots',
    caption: 'Zeg je wat iemand moet doen, dan begint de zin met de stam. Geen onderwerp.',
    rows: [
      {
        label: 'Gewone zin',
        slots: [
          { text: 'Je', role: 'onderwerp', place: 1 },
          { text: 'doet', role: 'werkwoord', place: 2 },
          { text: 'de deur dicht', role: 'rest', place: 3 },
        ],
      },
      {
        label: 'Opdracht: de stam vooraan',
        slots: [
          { text: 'Doe', role: 'werkwoord', place: 1, tag: 'stam' },
          { text: 'de deur dicht', role: 'rest', place: 2 },
        ],
        note: 'Het onderwerp is weg. De zin begint met het werkwoord zonder uitgang.',
      },
      {
        label: 'Vriendelijker met u',
        slots: [
          { text: 'Doet', role: 'werkwoord', place: 1 },
          { text: 'u', role: 'onderwerp', place: 2 },
          { text: 'de deur dicht', role: 'rest', place: 3 },
        ],
        note: 'Met u komt het onderwerp erbij, en het werkwoord krijgt -t.',
      },
    ],
  },

  /* ── Module: de werkwoorden ──────────────────────────────────────────────── */

  'b8-tegenwoordige-tijd': {
    kind: 'vervoeging',
    caption: 'De stam is de infinitief zonder -en. Daarna komen er nul of één letters bij.',
    infinitive: 'werken',
    stem: 'werk',
    rows: [
      { person: 'ik', base: 'werk', ending: '', note: 'de stam, zonder iets erbij' },
      { person: 'jij / je / u', base: 'werk', ending: 't' },
      { person: 'hij / zij / het', base: 'werk', ending: 't' },
      { person: 'wij / jullie / zij', base: 'werk', ending: 'en', note: 'de infinitief' },
    ],
  },

  'b9-onregelmatige-tegenwoordige-tijd': {
    kind: 'vervoeging',
    caption: 'Vier werkwoorden volgen de regel niet. Je leert ze uit je hoofd.',
    infinitive: 'zijn',
    rows: [
      { person: 'ik', base: 'ben', ending: '' },
      { person: 'jij / je', base: 'bent', ending: '' },
      { person: 'u', base: 'bent', ending: '', note: 'ook: u is' },
      { person: 'hij / zij / het', base: 'is', ending: '' },
      { person: 'wij / jullie / zij', base: 'zijn', ending: '' },
    ],
  },

  'b13-verleden-tijd': {
    kind: 'vervoeging',
    caption: 'Voor gisteren: de stam plus -te of -de. Bij meer dan één persoon komt er -n bij.',
    infinitive: 'werken',
    stem: 'werk',
    rows: [
      { person: 'ik / jij / hij', base: 'werk', ending: 'te', note: "'t kofschip: stam op k → -te" },
      { person: 'wij / jullie / zij', base: 'werk', ending: 'ten' },
      { person: 'ik / jij / hij', base: 'woon', ending: 'de', note: 'stam op n → -de' },
      { person: 'wij / jullie / zij', base: 'woon', ending: 'den' },
    ],
  },

  'b18-modale-werkwoorden': {
    kind: 'zinslots',
    caption: 'moeten, mogen, kunnen en willen zetten het tweede werkwoord achteraan, in de hele vorm.',
    rows: [
      {
        label: 'Eén werkwoord',
        slots: [
          { text: 'Ik', role: 'onderwerp', place: 1 },
          { text: 'ga', role: 'werkwoord', place: 2 },
          { text: 'naar de dokter', role: 'rest', place: 3 },
        ],
      },
      {
        label: 'Twee werkwoorden',
        slots: [
          { text: 'Ik', role: 'onderwerp', place: 1 },
          { text: 'moet', role: 'werkwoord', place: 2, tag: 'vervoegd' },
          { text: 'naar de dokter', role: 'rest', place: 3 },
          { text: 'gaan', role: 'werkwoord', place: 4, tag: 'hele vorm, achteraan' },
        ],
        note: 'Het eerste werkwoord staat op plaats twee. Het tweede staat helemaal achteraan.',
      },
      {
        label: 'Zo niet',
        wrong: true,
        slots: [
          { text: 'Ik', role: 'onderwerp', place: 1 },
          { text: 'moet', role: 'werkwoord', place: 2 },
          { text: 'gaan', role: 'werkwoord', place: 3 },
          { text: 'naar de dokter', role: 'rest', place: 4 },
        ],
        note: 'De twee werkwoorden staan hier naast elkaar. In het Nederlands staat het tweede achteraan.',
      },
    ],
  },

  'b10-perfectum-regelmatig': {
    kind: 'bouwer',
    caption: 'Het voltooid deelwoord: ge- ervoor, de stam in het midden, -d of -t erachter.',
    from: 'werken',
    parts: [
      { text: 'ge', tag: 'altijd vooraan' },
      { text: 'werk', tag: 'de stam' },
      { text: 't', tag: "'t kofschip → -t" },
    ],
    result: 'gewerkt',
    more: [
      { from: 'wonen', result: 'gewoond' },
      { from: 'praten', result: 'gepraat' },
      { from: 'bellen', result: 'gebeld' },
    ],
    note: "Eindigt de stam op een letter uit 't kofschip (t, k, f, s, ch, p), dan -t. In alle andere gevallen -d.",
  },

  'b11-perfectum-onregelmatig': {
    kind: 'bouwer',
    caption: 'Sterke werkwoorden veranderen van klank en eindigen op -en. Er is geen regel: je leert de rijtjes.',
    from: 'lezen',
    parts: [
      { text: 'ge', tag: 'wel ge-' },
      { text: 'lez', tag: 'de klank verandert: lees → lez' },
      { text: 'en', tag: '-en, geen -d/-t' },
    ],
    result: 'gelezen',
    more: [
      { from: 'schrijven', result: 'geschreven' },
      { from: 'nemen', result: 'genomen' },
      { from: 'drinken', result: 'gedronken' },
    ],
    note: 'Hoor je -en aan het eind, dan is het een sterk werkwoord. Deze staan in de woordenlijst van deze les.',
  },

  'b16-scheidbare-werkwoorden': {
    kind: 'bouwer',
    caption: 'Een scheidbaar werkwoord valt in de zin in twee stukken: het werkwoord op plaats twee, het voorzetsel achteraan.',
    from: 'opbellen',
    parts: [
      { text: 'op', tag: 'gaat naar het eind' },
      { text: 'bel', tag: 'blijft op plaats 2' },
    ],
    result: 'Ik bel je morgen op.',
    more: [
      { from: 'meenemen', result: 'Ik neem mijn zoon mee.' },
      { from: 'schoonmaken', result: 'Zij maakt de keuken schoon.' },
      { from: 'aankomen', result: 'De trein komt om acht uur aan.' },
    ],
    note: 'In het voltooid deelwoord komt ge- ertussen: opgebeld, meegenomen, schoongemaakt.',
  },

  'b17-werkwoorden-zonder-ge': {
    kind: 'bouwer',
    caption: 'Begint een werkwoord met be-, ge-, her-, ver- of ont-, dan komt er géén ge- voor.',
    from: 'betalen',
    parts: [
      { text: '', tag: 'geen ge-', muted: true },
      { text: 'betaal', tag: 'de stam, met be-' },
      { text: 'd', tag: 'wel -d/-t' },
    ],
    result: 'betaald',
    more: [
      { from: 'vertellen', result: 'verteld' },
      { from: 'ontmoeten', result: 'ontmoet' },
      { from: 'herhalen', result: 'herhaald' },
    ],
    note: 'Fout is "gebetaald". Het werkwoord heeft zijn eigen begin al.',
  },

  'b12-hebben-of-zijn': {
    kind: 'sorteer',
    caption: 'Het voltooid deelwoord krijgt hebben of zijn ervoor. Dat hangt van het werkwoord af.',
    buckets: [
      {
        name: 'hebben',
        rule: 'de meeste werkwoorden',
        words: ['gewerkt', 'gepraat', 'gelezen', 'betaald', 'gegeten', 'gezien'],
      },
      {
        name: 'zijn',
        rule: 'verandering van plaats of toestand',
        words: ['gegaan', 'gekomen', 'geweest', 'gebleven', 'gevallen', 'geworden'],
      },
    ],
    exceptions: {
      words: ['gereisd', 'gefietst', 'gelopen'],
      note: 'Beide kan: "ik heb gefietst" (de bezigheid) of "ik ben naar huis gefietst" (van A naar B).',
    },
  },

  'b19-wederkerende-werkwoorden': {
    kind: 'paren',
    caption: 'Sommige werkwoorden hebben altijd een woordje bij zich dat naar het onderwerp terugwijst.',
    heads: ['persoon', 'woordje erbij'],
    pairs: [
      { left: 'ik', right: 'me', example: 'Ik voel me niet goed.' },
      { left: 'jij / je', right: 'je', example: 'Voel je je beter?' },
      { left: 'hij / zij', right: 'zich', example: 'Hij vergist zich.' },
      { left: 'wij', right: 'ons', example: 'Wij vervelen ons nooit.' },
      { left: 'jullie', right: 'jullie / je', example: 'Vervelen jullie je?' },
      { left: 'u / zij', right: 'zich', example: 'Zij haasten zich.' },
    ],
    note: 'Het woordje staat vlak na het werkwoord. Vergeet je het, dan is de zin niet af: "ik voel niet goed" zegt niets over jou.',
  },

  'b20-vaste-voorzetsels': {
    kind: 'paren',
    caption: 'Bij sommige werkwoorden hoort één vast voorzetsel. Je leert ze als één woord.',
    heads: ['werkwoord', 'vast voorzetsel'],
    pairs: [
      { left: 'wachten', right: 'op', example: 'Ik wacht op de bus.' },
      { left: 'zorgen', right: 'voor', example: 'Zij zorgt voor haar moeder.' },
      { left: 'denken', right: 'aan', example: 'Denk aan je paspoort.' },
      { left: 'zoeken', right: 'naar', example: 'Hij zoekt naar werk.' },
      { left: 'praten', right: 'over', example: 'Wij praten over de huur.' },
      { left: 'helpen', right: 'met', example: 'Kun je me helpen met dit formulier?' },
    ],
    note: 'Er is geen regel achter de keuze. Leer het werkwoord en het voorzetsel samen: niet "wachten", maar "wachten op".',
  },

  /* ── Module: de woorden ──────────────────────────────────────────────────── */

  'b21-lidwoorden': {
    kind: 'sorteer',
    caption: 'Twee op de drie woorden zijn de-woorden. Bij twijfel is de de veiligste gok.',
    buckets: [
      {
        name: 'de',
        rule: 'alle meervouden, en de meeste woorden',
        words: ['de man', 'de vrouw', 'de brief', 'de kinderen', 'de gemeente', 'de school'],
      },
      {
        name: 'het',
        rule: 'verkleinwoorden (-je), talen, en een vaste groep',
        words: ['het kind', 'het huis', 'het jaar', 'het broodje', 'het Nederlands', 'het formulier'],
      },
    ],
    exceptions: {
      words: ['het meisje', 'de meisjes'],
      note: 'In het meervoud is het altijd de — ook bij woorden die in het enkelvoud het krijgen.',
    },
  },

  'b22-meervoud': {
    kind: 'sorteer',
    caption: 'Drie uitgangen. Welke je krijgt, hoor je aan het eind van het woord.',
    buckets: [
      {
        name: '-en',
        rule: 'de meeste woorden',
        words: ['brief → brieven', 'huis → huizen', 'boek → boeken', 'man → mannen'],
      },
      {
        name: '-s',
        rule: 'na -el, -em, -en, -er, -je',
        words: ['tafel → tafels', 'broodje → broodjes', 'meisje → meisjes', 'winkel → winkels'],
      },
      {
        name: "-'s",
        rule: 'na een losse a, i, o, u, y',
        words: ["oma → oma's", "foto → foto's", "taxi → taxi's", "menu → menu's"],
      },
    ],
    exceptions: {
      words: ['kind → kinderen', 'ei → eieren', 'stad → steden'],
      note: 'Een kleine groep krijgt -eren of verandert van klank. Die leer je los.',
    },
  },

  'b23-vergrotende-trap': {
    kind: 'trap',
    caption: 'Vergelijk je twee dingen, dan komt er -er achter het woord, en dan komt dan.',
    steps: [
      { form: 'groot', tag: 'gewoon', example: 'Mijn huis is groot.' },
      { form: 'groter', tag: '+ er', example: 'Jouw huis is groter dan mijn huis.' },
    ],
    irregular: [
      { base: 'goed', comp: 'beter', sup: 'het best' },
      { base: 'veel', comp: 'meer', sup: 'het meest' },
      { base: 'weinig', comp: 'minder', sup: 'het minst' },
      { base: 'duur', comp: 'duurder', sup: 'het duurst' },
    ],
  },

  'b24-overtreffende-trap': {
    kind: 'trap',
    caption: 'Is er niets groter, dan gebruik je -st met het ervoor.',
    steps: [
      { form: 'groot', tag: 'gewoon', example: 'Dit huis is groot.' },
      { form: 'groter', tag: '+ er', example: 'Dat huis is groter.' },
      { form: 'het grootst', tag: 'het + st', example: 'Dit is het grootste huis van de straat.' },
    ],
    irregular: [
      { base: 'goed', comp: 'beter', sup: 'het best' },
      { base: 'veel', comp: 'meer', sup: 'het meest' },
      { base: 'graag', comp: 'liever', sup: 'het liefst' },
    ],
  },

  'b25-persoonlijk-vnw-onderwerp': {
    kind: 'paren',
    caption: 'Wie doet het? Dan gebruik je deze vormen — en het werkwoord verandert mee.',
    heads: ['persoon', 'werkwoord erbij'],
    pairs: [
      { left: 'ik', right: 'werk', example: 'Ik werk bij een school.' },
      { left: 'jij / je', right: 'werkt', example: 'Werk je op maandag?' },
      { left: 'u', right: 'werkt', example: 'Werkt u hier al lang?' },
      { left: 'hij / zij / het', right: 'werkt', example: 'Zij werkt in de zorg.' },
      { left: 'wij / we', right: 'werken', example: 'We werken samen.' },
      { left: 'jullie / zij / ze', right: 'werken', example: 'Ze werken in de fabriek.' },
    ],
    note: 'In een vraag met jij valt de -t weg: "werk je", niet "werkt je".',
  },

  'b26-persoonlijk-vnw-lijdend': {
    kind: 'paren',
    caption: 'Overkomt het iemand, dan gebruik je de andere vorm: niet ik maar mij.',
    heads: ['als onderwerp', 'als voorwerp'],
    pairs: [
      { left: 'ik', right: 'mij / me', example: 'Zij belt mij morgen.' },
      { left: 'jij / je', right: 'jou / je', example: 'Ik zie jou bij de les.' },
      { left: 'u', right: 'u', example: 'Mag ik u iets vragen?' },
      { left: 'hij', right: 'hem', example: 'Ik ken hem van het werk.' },
      { left: 'zij', right: 'haar', example: 'Wij helpen haar met de brief.' },
      { left: 'wij / we', right: 'ons', example: 'Hij begrijpt ons niet.' },
    ],
    note: 'Na een voorzetsel komt altijd de tweede vorm: met mij, voor hem, over ons.',
  },

  'b27-voorzetsels-plaats': {
    kind: 'ruimte',
    caption: 'Een voorzetsel van plaats zegt waar iets ligt: kijk naar de stip en de doos. Langs staat er niet bij — dat is geen plek maar een route.',
    items: [
      { word: 'in', spot: 'in', example: 'De brief zit in de envelop.' },
      { word: 'op', spot: 'op', example: 'De post ligt op de tafel.' },
      { word: 'onder', spot: 'onder', example: 'De schoenen staan onder het bed.' },
      { word: 'naast', spot: 'naast', example: 'De apotheek zit naast de huisarts.' },
      { word: 'voor', spot: 'voor', example: 'De auto staat voor het huis.' },
      { word: 'achter', spot: 'achter', example: 'De tuin ligt achter de school.' },
      { word: 'tussen', spot: 'tussen', example: 'De bank zit tussen twee winkels.' },
      { word: 'boven', spot: 'boven', example: 'Wij wonen boven de bakker.' },
    ],
  },

  'b28-frequentie': {
    kind: 'frequentie',
    caption: 'Hoe vaak gebeurt het? Deze woorden staan op een lijn van nooit naar altijd.',
    words: [
      { word: 'nooit', pct: 0, example: 'Ik ga nooit naar de sportschool.' },
      { word: 'bijna nooit', pct: 10, example: 'Hij is bijna nooit ziek.' },
      { word: 'soms', pct: 30, example: 'Soms werk ik op zaterdag.' },
      { word: 'vaak', pct: 65, example: 'Wij gaan vaak naar de markt.' },
      { word: 'bijna altijd', pct: 88, example: 'De bus is bijna altijd op tijd.' },
      { word: 'altijd', pct: 100, example: 'Ik neem altijd mijn paspoort mee.' },
    ],
    note: 'Deze woorden staan vaak op plaats één of vlak na het werkwoord: "Soms werk ik…" of "Ik werk soms…".',
  },
};

/** Hoeveel stappen dit plaatje heeft. Afgeleid uit de data — nooit apart opgeschreven. */
export function stepCount(spec: LessonVisual): number {
  switch (spec.kind) {
    case 'zinslots':   return spec.rows.length;
    case 'bijzin':     return 3;
    case 'vervoeging': return spec.rows.length;
    case 'bouwer':     return spec.parts.length + 1;
    case 'tijdbalk':   return spec.points.length;
    case 'sorteer':    return spec.buckets.length + (spec.exceptions ? 1 : 0);
    case 'trap':       return spec.steps.length;
    case 'paren':      return spec.pairs.length;
    case 'ruimte':     return spec.items.length;
    case 'frequentie': return spec.words.length;
    default: {
      const never: never = spec;
      throw new Error(`geen stappen bekend voor ${JSON.stringify(never)}`);
    }
  }
}

/** Het plaatje van deze les, of `null` — de meeste lessen hebben er geen en dat is normaal. */
export function visualFor(slug: string): LessonVisual | null {
  return LESSON_VISUALS[slug] ?? null;
}
