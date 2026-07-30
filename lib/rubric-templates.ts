/**
 * Draft criterion sets, used **only** as a prefill in the /admin/rubrics form.
 *
 * ## Read this before using them anywhere else
 * These are a blank-page cure, not a standard. They are never seeded into the database, never
 * inserted automatically, and a rubric created from one arrives `active = false` like any other.
 * The docent rewrites the wording and the anchors before activating it.
 *
 * That is not process theatre — it is the product. The USP is "echt door een docent gevalideerd,
 * geen AI", and a drafted rubric that quietly became the live grading standard would make the
 * claim false in exactly the way that matters: the criteria are the judgement. The model only
 * applies them.
 *
 * The anchors below are written against CEFR A2 productive-skill descriptors (short simple
 * connected text, familiar topics, errors tolerated where meaning survives). They deliberately do
 * **not** reproduce DUO's own assessment scales — that material is copyright and not public, and
 * we do not have it. See `resources/exam-references/A2/` and the content rules in CLAUDE.md.
 */
import type { RubricCategory, RubricCriterion } from './rubrics';

/** A criterion shared by every writing category; the docent edits per category from here. */
const WRITING_BASE: RubricCriterion[] = [
  {
    key: 'inhoud',
    criterion: 'Inhoud en volledigheid',
    description:
      'Zijn alle gevraagde punten uit de opdracht behandeld? Reken alleen de punten die in de '
      + 'opdracht staan, niet wat je zelf zou verwachten.',
    anchors: {
      '0': 'Reageert niet op de opdracht, of behandelt geen van de gevraagde punten.',
      '1': 'Behandelt een deel van de gevraagde punten; belangrijke informatie ontbreekt.',
      '2': 'Behandelt bijna alle gevraagde punten; één punt is kort of onduidelijk.',
      '3': 'Behandelt alle gevraagde punten duidelijk en met genoeg informatie.',
    },
  },
  {
    key: 'woordgebruik',
    criterion: 'Woordgebruik',
    description: 'Genoeg woorden voor het onderwerp, en passend gekozen.',
    anchors: {
      '0': 'Te weinig woorden om de boodschap over te brengen.',
      '1': 'Zeer beperkte woordenschat; verkeerde woordkeuze hindert het begrip.',
      '2': 'Voldoende woorden voor het onderwerp; soms een onhandige keuze.',
      '3': 'Passende woorden voor een alledaags onderwerp op A2-niveau.',
    },
  },
  {
    key: 'grammatica',
    criterion: 'Grammatica en spelling',
    description:
      'Eenvoudige zinnen mogen fouten bevatten zolang de boodschap duidelijk blijft; beoordeel '
      + 'of de fouten het begrip in de weg staan.',
    anchors: {
      '0': 'Zoveel fouten dat de tekst niet te volgen is.',
      '1': 'Veel fouten; de lezer moet vaak raden wat er bedoeld wordt.',
      '2': 'Fouten in eenvoudige zinnen, maar de boodschap blijft duidelijk.',
      '3': 'Eenvoudige zinnen zijn overwegend correct; fouten storen niet.',
    },
  },
  {
    key: 'samenhang',
    criterion: 'Samenhang',
    description: 'Zijn de zinnen verbonden met eenvoudige woorden als "en", "maar", "omdat"?',
    anchors: {
      '0': 'Losse woorden of zinsdelen zonder verband.',
      '1': 'Losse zinnen achter elkaar, zonder verbindingswoorden.',
      '2': 'Eenvoudige verbindingswoorden worden gebruikt, soms verkeerd.',
      '3': 'Zinnen zijn logisch verbonden met eenvoudige verbindingswoorden.',
    },
  },
];

const REGISTER: RubricCriterion = {
  key: 'register',
  criterion: 'Toon en aanhef',
  description: 'Past de toon bij de ontvanger? Zijn aanhef en afsluiting aanwezig en passend?',
  anchors: {
    '0': 'Geen aanhef of afsluiting, en de toon past niet bij de ontvanger.',
    '1': 'Aanhef of afsluiting ontbreekt, of de toon is duidelijk te informeel of te formeel.',
    '2': 'Aanhef en afsluiting zijn aanwezig; de toon wisselt.',
    '3': 'Aanhef, afsluiting en toon passen bij de ontvanger.',
  },
};

const SPEAKING_BASE: RubricCriterion[] = [
  {
    key: 'inhoud',
    criterion: 'Inhoud',
    description: 'Geeft het antwoord op wat er gevraagd wordt, met genoeg informatie?',
    anchors: {
      '0': 'Geen antwoord, of een antwoord dat niet over de vraag gaat.',
      '1': 'Antwoordt met één of twee woorden; te weinig informatie.',
      '2': 'Antwoordt op de vraag; iets meer uitleg zou helpen.',
      '3': 'Antwoordt volledig op de vraag met genoeg informatie.',
    },
  },
  {
    key: 'woordgebruik',
    criterion: 'Woordgebruik',
    description: 'Genoeg woorden voor het onderwerp, en passend gekozen.',
    anchors: {
      '0': 'Te weinig woorden om de boodschap over te brengen.',
      '1': 'Zeer beperkte woordenschat; verkeerde woordkeuze hindert het begrip.',
      '2': 'Voldoende woorden voor het onderwerp; soms een onhandige keuze.',
      '3': 'Passende woorden voor een alledaags onderwerp op A2-niveau.',
    },
  },
  {
    key: 'grammatica',
    criterion: 'Grammatica',
    description: 'Eenvoudige zinnen; fouten mogen, zolang de boodschap duidelijk blijft.',
    anchors: {
      '0': 'Losse woorden, geen zinnen.',
      '1': 'Veel fouten in eenvoudige zinnen; de luisteraar moet raden.',
      '2': 'Fouten in eenvoudige zinnen, maar de boodschap blijft duidelijk.',
      '3': 'Eenvoudige zinnen zijn overwegend correct.',
    },
  },
  {
    key: 'verstaanbaarheid',
    criterion: 'Verstaanbaarheid en uitspraak',
    description:
      'Is de spreker te begrijpen voor een Nederlandse luisteraar die gewend is aan een accent? '
      + 'Een accent is geen fout — beoordeel of woorden herkenbaar blijven. Gebruik hierbij ook '
      + 'de gemeten signalen (woordzekerheid, spreektempo) die bij de opname staan.',
    anchors: {
      '0': 'Grotendeels onverstaanbaar.',
      '1': 'Losse woorden zijn te herkennen; de luisteraar moet veel moeite doen.',
      '2': 'Goed te volgen met een duidelijk accent; enkele woorden zijn onduidelijk.',
      '3': 'Duidelijk te begrijpen; een accent hindert het begrip niet.',
    },
  },
  {
    key: 'vloeiendheid',
    criterion: 'Vloeiendheid',
    description: 'Praat de spreker door, of zijn er lange stiltes en herstarts?',
    anchors: {
      '0': 'Bijna geen aaneengesloten spraak.',
      '1': 'Zeer aarzelend; lange stiltes en veel herstarts.',
      '2': 'Aarzelt bij het formuleren, maar komt er zelf uit.',
      '3': 'Spreekt vlot genoeg om gevolgd te kunnen worden.',
    },
  },
];

const SPEAKING_IMAGE_RULE: Record<string, RubricCriterion> = {
  speaking_describe: {
    key: 'plaatjegebruik',
    criterion: 'Gebruik van het plaatje',
    description: 'De opdracht vraagt om steeds het plaatje te gebruiken.',
    anchors: {
      '0': 'Het plaatje komt niet aan de orde.',
      '1': 'Verwijst vaag naar het plaatje zonder iets te benoemen.',
      '2': 'Benoemt iets uit het plaatje, maar gebruikt het niet in het antwoord.',
      '3': 'Gebruikt het plaatje duidelijk in het antwoord.',
    },
  },
  speaking_choose: {
    key: 'plaatjekeuze',
    criterion: 'Keuze en onderbouwing',
    description: 'De opdracht vraagt om één plaatje te kiezen en de keuze toe te lichten.',
    anchors: {
      '0': 'Maakt geen keuze.',
      '1': 'Maakt een keuze zonder enige toelichting.',
      '2': 'Maakt een keuze met een korte toelichting.',
      '3': 'Maakt een duidelijke keuze en legt uit waarom.',
    },
  },
  speaking_cover_all: {
    key: 'plaatjedekking',
    criterion: 'Alle plaatjes behandeld',
    description: 'De opdracht vraagt om alle plaatjes te gebruiken.',
    anchors: {
      '0': 'Behandelt geen van de plaatjes.',
      '1': 'Behandelt één plaatje.',
      '2': 'Behandelt de meeste plaatjes; één blijft onbenoemd.',
      '3': 'Behandelt alle plaatjes.',
    },
  },
};

/**
 * The draft criterion set for a category, or an empty array when there is nothing sensible to
 * suggest. Returned by value — the admin form mutates its copy freely.
 */
export function draftCriteria(category: RubricCategory): RubricCriterion[] {
  const clone = (cs: RubricCriterion[]) => cs.map(c => ({ ...c, anchors: { ...c.anchors } }));

  switch (category) {
    case 'email':
      return clone([...WRITING_BASE, REGISTER]);
    case 'short_text':
    case 'picture_note':
      return clone(WRITING_BASE);
    case 'form':
      // A formulier is filled in, not composed: samenhang and toon do not apply, and accuracy of
      // the individual fields is the whole task.
      return clone([WRITING_BASE[0], WRITING_BASE[1], WRITING_BASE[2]]);
    default: {
      const extra = SPEAKING_IMAGE_RULE[category];
      return clone(extra ? [...SPEAKING_BASE, extra] : SPEAKING_BASE);
    }
  }
}

/** Draft system prompt. Same status as the criteria: a starting point for the docent. */
export function draftSystemPrompt(category: RubricCategory): string {
  const spoken = category.startsWith('speaking_');
  return [
    `Je past de beoordelingscriteria van een NT2-docent toe op ${
      spoken ? 'een spreekantwoord' : 'een schrijfantwoord'
    } van een kandidaat die het inburgeringsexamen op A2-niveau oefent.`,
    '',
    'Je bepaalt niet zelf wat goed Nederlands is: je gebruikt uitsluitend de criteria en de',
    'ankerbeschrijvingen hieronder. Kies per criterium het anker dat het antwoord het beste',
    'beschrijft en geef dat cijfer.',
    '',
    'A2 is een beginnersniveau. Eenvoudige zinnen met fouten zijn op dit niveau normaal en mogen',
    'geen laag cijfer krijgen zolang de boodschap duidelijk is. Beoordeel niet strenger dan de',
    'ankers voorschrijven.',
    '',
    'Schrijf de feedback in het Nederlands, op A2-niveau: korte zinnen, "je" in plaats van "u",',
    'gewone woorden. Noem per criterium één concreet ding dat goed ging en één ding dat de',
    'kandidaat de volgende keer anders kan doen. Geef geen herschreven modelantwoord.',
  ].join('\n');
}
