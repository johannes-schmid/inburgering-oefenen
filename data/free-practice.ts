import type { SkillSlug } from './skills';

/**
 * The free 10-question taster, one set per exam component.
 *
 * Deliberately static: this is the top of the funnel and must render for anonymous
 * visitors with no DB round-trip. The paid exams live in Supabase (`exams` / `questions`).
 *
 * All items are ORIGINAL, written in the DUO A2 format. The official DUO practice exams
 * in resources/exam-references/ are © Ministerie van SZW and may not be reproduced —
 * they are used only as a format reference for length, register and question style.
 */

export type FreePracticeItem = {
  id: string;
  /** Which DUO text/audio genre this item practises — shown in the results breakdown */
  subSkill: string;
  /** The instruction line above the stimulus, e.g. "Lees eerst de vraag." */
  stimulusIntro: string;
  /** Reading passage (Lezen). Simple inline HTML: <h4>, <p>, <ul>, <li>, <strong>. */
  stimulusHtml?: string;
  /** Two-speaker script the listening audio is generated from (Luisteren). */
  stimulusScript?: string;
  /** Public path to the generated mp3, produced by scripts/generate-free-practice-audio.mjs */
  audioSrc?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correct: 'A' | 'B' | 'C';
  explanation: string;
};

export type FreePracticeSet = {
  skill: SkillSlug;
  items: FreePracticeItem[];
};

const LEES_EERST = 'Lees eerst de vraag.\nLees daarna de tekst.';
const LUISTER_EERST = 'Lees eerst de vraag.\nLuister daarna naar het gesprek.';

const LEZEN: FreePracticeItem[] = [
  {
    id: 'lz-1',
    subSkill: 'Advertentie',
    stimulusIntro: 'In de supermarkt hangt een briefje.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Fietsen te koop</h4>
      <p>Ik verkoop twee fietsen. Beide fietsen zijn gebruikt, maar in goede staat.</p>
      <p><strong>Damesfiets</strong><br>Kleur: blauw. Met drie versnellingen en een mandje voorop.<br>Prijs: € 85,-</p>
      <p><strong>Herenfiets</strong><br>Kleur: zwart. Zonder versnellingen. De banden zijn nieuw.<br>Prijs: € 60,-</p>
      <p>U kunt de fietsen bekijken op zaterdag tussen 10.00 en 16.00 uur.<br>Bel eerst even: 06 - 12 34 56 78.</p>
    `,
    question: 'Ali wil een fiets kopen. Hij wil niet meer dan € 70,- betalen.\nWelke fiets kan hij kopen?',
    optionA: 'De damesfiets.',
    optionB: 'De herenfiets.',
    optionC: 'Allebei de fietsen.',
    correct: 'B',
    explanation: 'De herenfiets kost € 60,-. Dat is minder dan € 70,-. De damesfiets kost € 85,- en is dus te duur.',
  },
  {
    id: 'lz-2',
    subSkill: 'Mededeling',
    stimulusIntro: 'Op de deur van de huisartsenpraktijk hangt een mededeling.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Huisartsenpraktijk De Linde</h4>
      <p>Van maandag 5 augustus tot en met vrijdag 16 augustus is de praktijk gesloten wegens vakantie.</p>
      <p>Hebt u in die periode een dokter nodig? Belt u dan huisartsenpraktijk Het Anker: 010 - 456 78 90.</p>
      <p>Is het een noodgeval? Bel dan altijd 112.</p>
      <p>Vanaf maandag 19 augustus zijn wij weer open.</p>
    `,
    question: 'Nadia is ziek op 8 augustus. Het is geen noodgeval.\nWat moet zij doen?',
    optionA: 'Wachten tot 19 augustus.',
    optionB: 'Huisartsenpraktijk Het Anker bellen.',
    optionC: '112 bellen.',
    correct: 'B',
    explanation: 'De praktijk is dan gesloten. In de tekst staat dat u huisartsenpraktijk Het Anker kunt bellen. 112 is alleen voor een noodgeval.',
  },
  {
    id: 'lz-3',
    subSkill: 'Brief',
    stimulusIntro: 'U krijgt een brief van de woningcorporatie.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Onderhoud aan uw woning</h4>
      <p>Beste bewoner,</p>
      <p>In september schilderen wij de buitenkant van uw woning. Het schilderwerk duurt ongeveer twee weken.</p>
      <p>Wij vragen u om in die periode uw ramen gesloten te houden. De planten op uw balkon kunt u het beste naar binnen halen.</p>
      <p>U hoeft niet thuis te blijven. De schilders werken alleen buiten en komen niet in uw woning.</p>
      <p>Met vriendelijke groet,<br>Woningcorporatie De Brug</p>
    `,
    question: 'Wat moet u doen tijdens het schilderwerk?',
    optionA: 'Thuisblijven.',
    optionB: 'De ramen dichtdoen.',
    optionC: 'De schilders binnenlaten.',
    correct: 'B',
    explanation: 'In de brief staat: houd uw ramen gesloten. U hoeft niet thuis te blijven en de schilders komen niet binnen.',
  },
  {
    id: 'lz-4',
    subSkill: 'Folder',
    stimulusIntro: 'In de bibliotheek ligt een folder over cursussen.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Cursussen in de bibliotheek</h4>
      <p><strong>Cursus Computer voor beginners</strong><br>U leert e-mailen en zoeken op internet. Vijf lessen op dinsdagochtend.<br>Kosten: € 25,-</p>
      <p><strong>Cursus Nederlands spreken</strong><br>U oefent samen met andere cursisten het spreken. Tien lessen op woensdagavond.<br>Kosten: € 40,-</p>
      <p><strong>Cursus Voorlezen aan kinderen</strong><br>Voor ouders en grootouders. Drie lessen op zaterdagochtend.<br>Kosten: gratis</p>
    `,
    question: 'Fatima werkt overdag. Zij wil beter Nederlands leren praten.\nWelke cursus past bij haar?',
    optionA: 'Computer voor beginners.',
    optionB: 'Nederlands spreken.',
    optionC: 'Voorlezen aan kinderen.',
    correct: 'B',
    explanation: 'Zij wil beter leren praten, dus de cursus Nederlands spreken. Die is op woensdagavond, dus zij kan overdag werken.',
  },
  {
    id: 'lz-5',
    subSkill: 'Informatietekst',
    stimulusIntro: 'Op de website van de gemeente staat informatie over afval.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Grofvuil wegbrengen</h4>
      <p>Hebt u groot afval, bijvoorbeeld een oude bank of een kapotte kast? Dat noemen we grofvuil.</p>
      <p>U mag grofvuil niet op straat zetten. U kunt het zelf wegbrengen naar de milieustraat. Dat is gratis.</p>
      <p>Kunt u het niet zelf wegbrengen? Dan kunt u een afspraak maken. Wij halen het grofvuil dan bij u op. Dit kost € 30,-.</p>
      <p>Maak een afspraak via www.gemeente.nl of bel 14 010.</p>
    `,
    question: 'Karim heeft een oude bank. Hij heeft geen auto.\nWat kan hij het beste doen?',
    optionA: 'De bank op straat zetten.',
    optionB: 'De bank naar de milieustraat brengen.',
    optionC: 'Een afspraak maken om de bank op te laten halen.',
    correct: 'C',
    explanation: 'Zonder auto kan hij de bank niet zelf wegbrengen. Dan kan hij een afspraak maken. Op straat zetten mag niet.',
  },
  {
    id: 'lz-6',
    subSkill: 'Formulier',
    stimulusIntro: 'U wilt uw kind aanmelden voor de zwemles. U leest de informatie.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Aanmelden zwemles</h4>
      <p>Uw kind kan zwemles krijgen vanaf 5 jaar.</p>
      <p>Vul het aanmeldformulier volledig in. Vergeet niet het geboortebewijs van uw kind mee te sturen.</p>
      <p>Na uw aanmelding krijgt u binnen drie weken een brief. In die brief staat wanneer de eerste les begint.</p>
      <p>Let op: er is een wachtlijst. Soms duurt het een paar maanden voordat uw kind kan beginnen.</p>
    `,
    question: 'Wat moet u meesturen met het formulier?',
    optionA: 'Een geboortebewijs.',
    optionB: 'Een pasfoto.',
    optionC: 'Een brief van de school.',
    correct: 'A',
    explanation: 'In de tekst staat: vergeet niet het geboortebewijs van uw kind mee te sturen.',
  },
  {
    id: 'lz-7',
    subSkill: 'Advertentie',
    stimulusIntro: 'In de krant staat een advertentie.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Medewerker keuken gezocht</h4>
      <p>Restaurant De Haven zoekt een medewerker voor de keuken.</p>
      <p>Wat gaat u doen? U helpt met het snijden van groenten en u wast af.</p>
      <p>Werktijden: donderdag, vrijdag en zaterdag van 17.00 tot 23.00 uur.</p>
      <p>Ervaring is niet nodig. U moet wel goed kunnen samenwerken en Nederlands kunnen verstaan.</p>
      <p>Interesse? Stuur een e-mail naar werk@dehaven.nl</p>
    `,
    question: 'Wat is belangrijk voor deze baan?',
    optionA: 'U hebt al in een keuken gewerkt.',
    optionB: 'U kunt goed met anderen samenwerken.',
    optionC: 'U kunt overdag werken.',
    correct: 'B',
    explanation: 'In de tekst staat dat u goed moet kunnen samenwerken. Ervaring is niet nodig, en het werk is ’s avonds.',
  },
  {
    id: 'lz-8',
    subSkill: 'Mededeling',
    stimulusIntro: 'Op school krijgt uw kind een briefje mee.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Schoolreisje groep 5</h4>
      <p>Op donderdag 12 juni gaat groep 5 op schoolreisje naar de dierentuin.</p>
      <p>De kinderen moeten om 8.15 uur op school zijn. De bus vertrekt om 8.30 uur. We zijn om 16.00 uur weer terug.</p>
      <p>Geef uw kind mee: brood, drinken en een regenjas. Snoep is niet toegestaan.</p>
      <p>De kosten zijn € 12,50. U kunt dit bedrag overmaken vóór 1 juni.</p>
    `,
    question: 'Hoe laat moeten de kinderen op school zijn?',
    optionA: 'Om 8.15 uur.',
    optionB: 'Om 8.30 uur.',
    optionC: 'Om 16.00 uur.',
    correct: 'A',
    explanation: 'De kinderen moeten om 8.15 uur op school zijn. Om 8.30 uur vertrekt de bus.',
  },
  {
    id: 'lz-9',
    subSkill: 'Informatietekst',
    stimulusIntro: 'U leest informatie van uw zorgverzekering.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>De tandarts en uw verzekering</h4>
      <p>Bent u 18 jaar of ouder? Dan betaalt de basisverzekering de tandarts niet. U betaalt de rekening zelf.</p>
      <p>Wilt u toch verzekerd zijn voor de tandarts? Dan kunt u een aanvullende verzekering afsluiten. U betaalt dan elke maand extra.</p>
      <p>Voor kinderen tot 18 jaar is de tandarts wel verzekerd in de basisverzekering. U betaalt daarvoor niets extra.</p>
    `,
    question: 'Sofia is 30 jaar. Zij heeft alleen een basisverzekering en gaat naar de tandarts.\nWie betaalt de rekening?',
    optionA: 'De basisverzekering betaalt alles.',
    optionB: 'Sofia betaalt de rekening zelf.',
    optionC: 'Sofia betaalt de helft.',
    correct: 'B',
    explanation: 'Vanaf 18 jaar betaalt de basisverzekering de tandarts niet. Sofia betaalt de rekening dus zelf.',
  },
  {
    id: 'lz-10',
    subSkill: 'Folder',
    stimulusIntro: 'U vindt een folder van het buurthuis in uw brievenbus.\n' + LEES_EERST,
    stimulusHtml: `
      <h4>Buurthuis De Ontmoeting</h4>
      <p><strong>Maandag</strong> — Koffieochtend, 10.00 tot 12.00 uur. Kom langs voor een praatje. Gratis.</p>
      <p><strong>Woensdag</strong> — Huiswerkhulp voor kinderen, 15.00 tot 17.00 uur. Aanmelden is nodig.</p>
      <p><strong>Donderdag</strong> — Samen koken en eten, 17.30 uur. Kosten: € 5,- per persoon. Aanmelden vóór dinsdag.</p>
      <p><strong>Zaterdag</strong> — Kinderclub, 13.00 tot 15.00 uur. Voor kinderen van 6 tot 12 jaar. Gratis.</p>
    `,
    question: 'Youssef wil op donderdag mee-eten in het buurthuis.\nWat moet hij doen?',
    optionA: 'Zich vóór dinsdag aanmelden.',
    optionB: 'Op maandag langskomen.',
    optionC: 'Niets, hij kan zo binnenlopen.',
    correct: 'A',
    explanation: 'Bij donderdag staat: aanmelden vóór dinsdag. Alleen bij de koffieochtend kunt u zomaar langskomen.',
  },
];

const LUISTEREN: FreePracticeItem[] = [
  {
    id: 'lu-1',
    subSkill: 'Gesprek',
    stimulusIntro: 'Sara belt naar de tandarts.\n' + LUISTER_EERST,
    stimulusScript: `A: Tandartspraktijk Molenweg, goedemorgen.
B: Goedemorgen, u spreekt met Sara Yilmaz. Ik zou graag een afspraak maken.
A: Dat kan. Heeft u pijn?
B: Nee, geen pijn. Het is voor de controle.
A: Prima. Dan kan ik u volgende week woensdag om half elf inplannen.
B: Woensdag is lastig, dan werk ik. Kan het ook op vrijdag?
A: Vrijdag om negen uur is nog vrij.
B: Dat is goed, dan kom ik vrijdag om negen uur.`,
    audioSrc: '/audio/free-practice/lu-1.mp3',
    question: 'Wanneer komt Sara naar de tandarts?',
    optionA: 'Woensdag om half elf.',
    optionB: 'Vrijdag om negen uur.',
    optionC: 'Vrijdag om half elf.',
    correct: 'B',
    explanation: 'Woensdag werkt Sara. Zij maakt daarom een afspraak op vrijdag om negen uur.',
  },
  {
    id: 'lu-2',
    subSkill: 'Gesprek',
    stimulusIntro: 'Twee collega’s praten in de kantine.\n' + LUISTER_EERST,
    stimulusScript: `A: Hoi Peter, ga je mee lunchen?
B: Zo meteen. Ik moet eerst nog even iets afmaken.
A: Wat ben je aan het doen?
B: Ik maak het rooster voor volgende maand. Anouk is met vakantie, dus ik moet iemand vinden voor haar diensten.
A: Lukt dat een beetje?
B: De maandagen zijn geregeld, maar voor de zaterdagen heb ik nog niemand.
A: Ik kan wel een zaterdag werken, als je wilt.
B: Echt? Dat zou me heel erg helpen.`,
    audioSrc: '/audio/free-practice/lu-2.mp3',
    question: 'Welk probleem heeft Peter?',
    optionA: 'Hij kan niemand vinden voor de zaterdagen.',
    optionB: 'Hij kan niemand vinden voor de maandagen.',
    optionC: 'Hij wil zelf met vakantie.',
    correct: 'A',
    explanation: 'Peter zegt: de maandagen zijn geregeld, maar voor de zaterdagen heeft hij nog niemand.',
  },
  {
    id: 'lu-3',
    subSkill: 'Mededeling',
    stimulusIntro: 'U hoort een mededeling in de supermarkt.\n' + LUISTER_EERST,
    stimulusScript: `A: Beste klanten, mag ik even uw aandacht. Onze winkel sluit vandaag om zes uur, een uur eerder dan normaal. Dit is vanwege een personeelsbijeenkomst. Wilt u uw boodschappen op tijd afrekenen? Morgen zijn wij weer gewoon open vanaf acht uur. Onze excuses voor het ongemak.`,
    audioSrc: '/audio/free-practice/lu-3.mp3',
    question: 'Waarom sluit de winkel vandaag eerder?',
    optionA: 'Er is een feestdag.',
    optionB: 'Er is een bijeenkomst voor het personeel.',
    optionC: 'De winkel wordt verbouwd.',
    correct: 'B',
    explanation: 'In de mededeling staat: dit is vanwege een personeelsbijeenkomst.',
  },
  {
    id: 'lu-4',
    subSkill: 'Gesprek',
    stimulusIntro: 'Hassan praat met de juf van zijn dochter.\n' + LUISTER_EERST,
    stimulusScript: `A: Meneer El Amrani, fijn dat u er bent. Ik wilde het even over Amira hebben.
B: Is er iets aan de hand?
A: Nee hoor, het gaat juist heel goed. Ze leest de laatste maanden veel beter.
B: Wat fijn om te horen. Thuis lezen we elke avond samen.
A: Dat merken we. Alleen met rekenen heeft ze het nog wat moeilijk.
B: Kunnen we daar iets aan doen?
A: We gaan haar twee keer per week extra hulp geven op school.`,
    audioSrc: '/audio/free-practice/lu-4.mp3',
    question: 'Wat zegt de juf over Amira?',
    optionA: 'Ze leest beter, maar rekenen is nog moeilijk.',
    optionB: 'Ze rekent beter, maar lezen is nog moeilijk.',
    optionC: 'Ze moet vaker naar school komen.',
    correct: 'A',
    explanation: 'De juf zegt dat Amira veel beter leest, maar dat rekenen nog moeilijk is.',
  },
  {
    id: 'lu-5',
    subSkill: 'Gesprek',
    stimulusIntro: 'Een klant staat bij de balie van de bibliotheek.\n' + LUISTER_EERST,
    stimulusScript: `A: Goedemiddag, kan ik u helpen?
B: Ja, ik wil deze twee boeken langer houden. Kan dat?
A: Even kijken. Dit boek kunt u drie weken verlengen.
B: En het andere?
A: Dat is helaas al door iemand anders gereserveerd. Dat moet u vandaag inleveren.
B: Oh, dat is jammer. Dan lever ik dat nu in.
A: Prima. Het eerste boek mag u dus meenemen tot 20 mei.`,
    audioSrc: '/audio/free-practice/lu-5.mp3',
    question: 'Wat moet de klant vandaag doen?',
    optionA: 'Allebei de boeken inleveren.',
    optionB: 'Eén boek inleveren.',
    optionC: 'Een boek reserveren.',
    correct: 'B',
    explanation: 'Eén boek is gereserveerd door iemand anders en moet vandaag terug. Het andere boek mag hij houden tot 20 mei.',
  },
  {
    id: 'lu-6',
    subSkill: 'Mededeling',
    stimulusIntro: 'U hoort een omroepbericht op het station.\n' + LUISTER_EERST,
    stimulusScript: `A: Attentie, attentie. De trein naar Utrecht Centraal van tien over drie vertrekt vandaag niet van spoor vier, maar van spoor zeven. Reizigers naar Utrecht wordt verzocht naar spoor zeven te gaan. De trein heeft ongeveer tien minuten vertraging. Onze excuses.`,
    audioSrc: '/audio/free-practice/lu-6.mp3',
    question: 'Wat is er veranderd?',
    optionA: 'De trein vertrekt van een ander spoor.',
    optionB: 'De trein gaat naar een andere stad.',
    optionC: 'De trein rijdt vandaag niet.',
    correct: 'A',
    explanation: 'De trein vertrekt niet van spoor vier maar van spoor zeven. Hij rijdt wel, maar met tien minuten vertraging.',
  },
  {
    id: 'lu-7',
    subSkill: 'Gesprek',
    stimulusIntro: 'Twee buren praten op straat.\n' + LUISTER_EERST,
    stimulusScript: `A: Goedemorgen mevrouw De Wit. Heeft u het al gehoord van de container?
B: Nee, wat is er met de container?
A: Die staat vanaf volgende week niet meer op de hoek. Hij komt achter het flatgebouw te staan.
B: Waarom dan?
A: De vuilniswagen kan er op de hoek moeilijk bij, vooral als er auto’s geparkeerd staan.
B: Ah, dat begrijp ik wel. Het is wel iets verder lopen voor mij.
A: Dat klopt, maar het is een stuk veiliger.`,
    audioSrc: '/audio/free-practice/lu-7.mp3',
    question: 'Waarom wordt de container verplaatst?',
    optionA: 'Omdat de buren dat gevraagd hebben.',
    optionB: 'Omdat de vuilniswagen er moeilijk bij kan.',
    optionC: 'Omdat de container te klein is.',
    correct: 'B',
    explanation: 'De buurman zegt dat de vuilniswagen er op de hoek moeilijk bij kan, vooral bij geparkeerde auto’s.',
  },
  {
    id: 'lu-8',
    subSkill: 'Gesprek',
    stimulusIntro: 'Meneer Diallo belt met de gemeente.\n' + LUISTER_EERST,
    stimulusScript: `A: Gemeente Zuidhoven, goedemiddag.
B: Goedemiddag. Ik ben verhuisd en ik wil mijn nieuwe adres doorgeven.
A: Dat kunt u het beste online doen, via onze website. Dat gaat het snelst.
B: Ik heb thuis geen internet.
A: Geen probleem, dan maken we een afspraak aan de balie. Kunt u dinsdagochtend?
B: Ja, dinsdagochtend kan ik.
A: Neemt u dan uw identiteitsbewijs mee.`,
    audioSrc: '/audio/free-practice/lu-8.mp3',
    question: 'Wat moet meneer Diallo meenemen naar de afspraak?',
    optionA: 'Zijn identiteitsbewijs.',
    optionB: 'Zijn huurcontract.',
    optionC: 'Een brief van de gemeente.',
    correct: 'A',
    explanation: 'De medewerker zegt: neemt u dan uw identiteitsbewijs mee.',
  },
  {
    id: 'lu-9',
    subSkill: 'Gesprek',
    stimulusIntro: 'Een vrouw praat met de apotheker.\n' + LUISTER_EERST,
    stimulusScript: `A: Hier is uw medicijn, mevrouw. Heeft u dit eerder gebruikt?
B: Nee, dit is de eerste keer.
A: Dan leg ik het even uit. U neemt één tablet per dag, ’s ochtends bij het ontbijt.
B: Bij het eten dus?
A: Ja, dat is belangrijk. Neem het niet op een lege maag.
B: En hoe lang moet ik ze nemen?
A: Tien dagen. Maak de kuur helemaal af, ook als u zich eerder beter voelt.`,
    audioSrc: '/audio/free-practice/lu-9.mp3',
    question: 'Wanneer moet de vrouw het medicijn innemen?',
    optionA: '’s Avonds voor het slapen.',
    optionB: '’s Ochtends bij het ontbijt.',
    optionC: 'Twee keer per dag.',
    correct: 'B',
    explanation: 'De apotheker zegt: één tablet per dag, ’s ochtends bij het ontbijt. Niet op een lege maag.',
  },
  {
    id: 'lu-10',
    subSkill: 'Gesprek',
    stimulusIntro: 'Youssef praat met zijn leidinggevende.\n' + LUISTER_EERST,
    stimulusScript: `A: Youssef, heb je even? Ik wil het over je vakantie hebben.
B: Ja hoor. Ik had drie weken aangevraagd in juli.
A: Dat is het punt. In juli zijn er al twee collega’s weg. Drie weken lukt dan niet.
B: Hmm. Kan ik dan twee weken in juli en één week in augustus?
A: Twee weken juli is prima. En augustus is rustiger, dus die week is ook geen probleem.
B: Mooi, dan doen we het zo.`,
    audioSrc: '/audio/free-practice/lu-10.mp3',
    question: 'Wat spreken zij af?',
    optionA: 'Youssef gaat drie weken in juli op vakantie.',
    optionB: 'Youssef gaat twee weken in juli en één week in augustus.',
    optionC: 'Youssef gaat pas in augustus op vakantie.',
    correct: 'B',
    explanation: 'Drie weken in juli lukt niet. Zij spreken af: twee weken in juli en één week in augustus.',
  },
];

export const FREE_PRACTICE: Partial<Record<SkillSlug, FreePracticeSet>> = {
  lezen: { skill: 'lezen', items: LEZEN },
  luisteren: { skill: 'luisteren', items: LUISTEREN },
};

/** Skills that currently have a free taster set ready. */
export function hasFreePractice(skill: SkillSlug): boolean {
  return Boolean(FREE_PRACTICE[skill]?.items.length);
}

export function getFreePractice(skill: SkillSlug): FreePracticeSet | undefined {
  return FREE_PRACTICE[skill];
}
