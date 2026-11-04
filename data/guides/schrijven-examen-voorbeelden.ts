/**
 * Taalexamens spoke — "Schrijven A2: voorbeelden met uitleg".
 *
 * Waarom deze pagina bestaat: DUO's drie oefenexamens Schrijven A2 (pdf) bevatten de opdrachten
 * en verder niets — geen voorbeeldantwoord, geen puntentelling (gecontroleerd 03-11-2026, alle
 * drie de pdf's). Op Reddit is "er is geen voorbeeld en niemand zegt waarom je zakt" de klacht
 * die het vaakst terugkomt. Een docent die laat zien wat een zwak en een beter antwoord is, kan
 * geen concurrent nadoen.
 *
 * Drie regels:
 *  - **De vier opdrachten zijn van ons**, in de vier vormen die DUO's oefenexamens laten zien
 *    (`SEO/facts.md` §1: één formulier, één korte tekst, de andere twee e-mails of een e-mail en
 *    een briefje). Geen enkele opdracht lijkt op een DUO-opdracht; die zijn auteursrechtelijk
 *    beschermd en geheim.
 *  - **Geen cesuur, geen punten.** De zak-slaaggrens is een cesuur van de minister en DUO
 *    publiceert hem niet (§2). De uitleg zegt dus "zwak" en "beter", nooit "4 punten".
 *  - **Nagekeken door Amber (04-11-2026).** De antwoorden en de uitleg zijn door de redactie
 *    geschreven; zij heeft beoordeeld of "zwak" echt zwak is en "beter" echt A2 (en niet B1).
 *    Eigen notities van haar komen er alleen bij als zij ze schrijft.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, note, inlineCta } from './kit';

const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const CHECKED = '03-11-2026';

/** Eén opdracht zoals de kandidaat hem op papier krijgt: de situatie en de gevraagde punten. */
const opdracht = (titel: string, situatie: string, punten: string[]) =>
  `<div class="compare-card"><div class="compare-head"><h3>${titel}</h3><p class="compare-when">${situatie}</p></div>` +
  `<div class="compare-rows">${punten.map(p => `<div class="compare-row"><p class="compare-val">${p}</p></div>`).join('')}</div></div>`;

/** De twee antwoorden naast elkaar, letterlijk zoals een kandidaat ze zou schrijven. Het betere
 *  antwoord krijgt de inset-ring van `is-primary` — geen kleur, want groen hoort bij Glas. */
const antwoorden = (zwak: string, beter: string) =>
  `<div class="compare-2">` +
  `<div class="compare-card"><div class="compare-head"><h3>Zwak antwoord</h3></div><div class="compare-rows"><div class="compare-row"><p class="compare-val">${zwak}</p></div></div></div>` +
  `<div class="compare-card is-primary"><div class="compare-head"><h3>Beter antwoord</h3></div><div class="compare-rows"><div class="compare-row"><p class="compare-val">${beter}</p></div></div></div>` +
  `</div>`;

/** Wat er mis ging en wat er goed ging, naast elkaar. */
const uitleg = (fout: string[], goed: string[]) => {
  const li = (rows: string[], icon: string) => rows.map(r => `<li><span>${icon}<span>${r}</span></span></li>`).join('');
  return `<div class="yesno-grid">` +
    `<div class="yesno-col no"><p class="yesno-title">Waarom het zwakke antwoord punten kost</p><ul>${li(fout, I_X)}</ul></div>` +
    `<div class="yesno-col yes"><p class="yesno-title">Wat het betere antwoord goed doet</p><ul>${li(goed, I_CHECK)}</ul></div>` +
    `</div>`;
};

const guide: Guide = {
  slug: 'schrijven-examen-voorbeelden',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Amber van der Zalm',
  reviewedOn: '2026-11-04',
  pillar: false,
  coverGlyph: 'graded',

  title: 'Schrijven examen A2: 4 voorbeelden met uitleg',
  description:
    'Vier voorbeeldopdrachten voor het examen Schrijven A2, elk met een zwak en een beter antwoord. Zo zie je precies waarom een antwoord wel of geen punten krijgt.',

  datePublished: '2026-11-03',
  dateModified: '2026-11-03',
  dateLabel: '3 november 2026',
  breadcrumb: 'Schrijven: voorbeelden',
  eyebrow: 'Voorbeelden',

  heroTitle: 'Schrijven A2: vier voorbeelden, nagekeken',
  heroSubtitle:
    'DUO geeft je oefenopdrachten, maar geen voorbeeldantwoorden. Hier zie je bij vier opdrachten een zwak en een beter antwoord, en waarom het ene punten kost en het andere niet.',
  readingMinutes: 9,

  articleHtml: `
<p>Wil je weten hoe een goed antwoord op het <strong>examen Schrijven</strong> eruitziet? Hieronder
staan vier voorbeeldopdrachten, zoals je ze op het examen A2 krijgt. Bij elke opdracht zie je
twee antwoorden: een zwak antwoord en een beter antwoord. Daaronder staat waarom. Het verschil zit
bijna nooit in moeilijke woorden. Het zit in de punten die gevraagd worden.</p>

${fact('Het examen Schrijven op niveau A2 maak je met pen en papier. Je krijgt 4 schrijfopdrachten. Je schrijft bijvoorbeeld een korte brief, of je vult een formulier in. Het examen duurt 40 minuten.', 'inburgeren.nl — Inhoud taalexamens', SRC_TAALEXAMENS, CHECKED)}

<h2 id="waarom-voorbeelden">Waarom je hier voorbeelden vindt, en niet bij DUO</h2>

<p>DUO heeft drie oefenexamens Schrijven A2 op de website staan. Daarin staan de opdrachten. Er
staat geen voorbeeldantwoord bij, en ook niet hoe het wordt nagekeken. Je kunt dus oefenen, maar
je weet daarna niet of je antwoord goed was.</p>

${fact('DUO biedt drie oefenexamens Schrijven A2 aan als pdf, met elk 4 opdrachten. In de pdf staan de opdrachten; er staan geen voorbeeldantwoorden in en geen uitleg over de beoordeling.', 'inburgeren.nl — Oefenen', SRC_OEFENEN, CHECKED)}

${note('De opdrachten hieronder zijn <strong>door ons geschreven</strong>. Het zijn geen echte examenvragen: die zijn geheim. Ze hebben wel dezelfde vorm als de opdrachten in de oefenexamens van DUO.')}

<h2 id="hoe-nagekeken">Hoe wordt Schrijven nagekeken?</h2>

<p>Een computer kijkt je tekst niet na. Dat doen mensen: beoordelaars die daarvoor zijn opgeleid.
Je krijgt daarna een uitslag (geslaagd of niet geslaagd) en een cijfer.</p>

${fact('Schrijfvaardigheid wordt beoordeeld door gecertificeerde beoordelaars. De zak-slaaggrens is een cesuur die de minister vaststelt. De uitslag is "geslaagd" of "niet geslaagd", en de kandidaat krijgt een cijfer.', 'DUO — Examenreglement, artikel 10 en 16', SRC_REGLEMENT, CHECKED)}

<p>Hoeveel punten je precies nodig hebt, maakt DUO niet bekend. Getallen die je op andere sites
leest, hebben geen officiële bron. Wat wél vaststaat: niet alles hoeft goed te zijn om te slagen.</p>

<p>Als docent kijken wij bij elk antwoord naar vier dingen. Dat zijn ook de vier dingen in de
uitleg bij de voorbeelden:</p>

<ol>
  <li><span><strong>Heb je de opdracht gedaan?</strong> Staan alle gevraagde punten erin?</span></li>
  <li><span><strong>Is het duidelijk?</strong> Begrijpt de lezer wat je bedoelt, ook met een paar fouten?</span></li>
  <li><span><strong>Past de vorm?</strong> Een aanhef en een groet in een e-mail. <em>U</em> tegen de verhuurder, <em>je</em> tegen je buurvrouw.</span></li>
  <li><span><strong>Zinnen en woorden.</strong> Hele zinnen, met een hoofdletter en een punt.</span></li>
</ol>

<h2 id="formulier">Voorbeeld 1: een formulier invullen</h2>

${opdracht('Opdracht: aanmelden voor zwemles', 'Je dochter Noor (7 jaar) wil op zwemles. Je vult het formulier van het zwembad in. Vul alle vakjes in. Schrijf bij de laatste vraag 2 of 3 zinnen.', [
  'Naam ouder · Naam kind · Leeftijd kind · Telefoonnummer',
  'Op welke dag kan uw kind komen?',
  'Kan uw kind al een beetje zwemmen? Vertel het kort.',
])}

${antwoorden('Naam ouder: Samira El Idrissi<br>Naam kind: Noor<br>Leeftijd kind: 7<br>Telefoonnummer: —<br>Dag: woensdag<br>Kan uw kind al een beetje zwemmen? nee', 'Naam ouder: Samira El Idrissi<br>Naam kind: Noor El Idrissi<br>Leeftijd kind: 7 jaar<br>Telefoonnummer: 06 12 34 56 78<br>Dag: woensdagmiddag<br>Kan uw kind al een beetje zwemmen? Noor kan nog niet zwemmen. Ze is wel graag in het water. Ze is een beetje bang voor het diepe water.')}

${uitleg([
  'Een vakje is leeg. Een leeg vakje is een punt dat je weggeeft.',
  'De opdracht vraagt 2 of 3 zinnen. "nee" is één woord, geen zin.',
], [
  'Elk vakje is ingevuld, ook het telefoonnummer.',
  'Drie korte, hele zinnen bij de laatste vraag. Simpel, maar compleet.',
])}

<h2 id="email">Voorbeeld 2: een e-mail aan een instantie</h2>

${opdracht('Opdracht: de verwarming is kapot', 'De verwarming in je huis doet het niet. Je schrijft een e-mail aan de woningcorporatie. Schrijf in je e-mail:', [
  'wat er kapot is',
  'sinds wanneer',
  'wanneer je thuis bent voor de monteur',
])}

${antwoorden('Hoi, de verwarming is kapot en het is heel koud in huis en mijn kinderen hebben het ook koud dus kunt u snel komen want het is echt koud. Ahmed', 'Beste meneer, mevrouw,<br><br>De verwarming in mijn huis doet het niet. Hij is sinds zaterdag kapot. Het is erg koud in huis. Ik ben maandag en dinsdag de hele dag thuis. Kan de monteur dan komen?<br><br>Met vriendelijke groet,<br>Ahmed Yilmaz<br>Kerkstraat 12, Utrecht')}

${uitleg([
  'Sinds wanneer staat er niet in, en ook niet wanneer je thuis bent. Twee van de drie punten ontbreken.',
  '"Hoi" past niet bij een e-mail aan een instantie.',
  'Eén lange zin met "en", "dus" en "want". De lezer moet zoeken wat je vraagt.',
], [
  'Alle drie de punten staan erin, elk in een eigen zin.',
  'Een aanhef ("Beste meneer, mevrouw,") en een groet ("Met vriendelijke groet,").',
  'Een duidelijke vraag aan het einde. De woningcorporatie weet wat ze moet doen.',
])}

<h2 id="briefje">Voorbeeld 3: een briefje aan je buurvrouw</h2>

${opdracht('Opdracht: planten water geven', 'Je gaat twee weken op vakantie. Je vraagt je buurvrouw Ellen om je planten water te geven. Je schrijft een briefje. Schrijf in je briefje:', [
  'wanneer je weg bent',
  'wat ze moet doen',
  'waar de sleutel is',
])}

${antwoorden('Geachte mevrouw,<br>Ik ga op vakantie naar Turkije. Ik ga met mijn man en mijn kinderen. Wij gaan naar mijn moeder. Het is daar warm. Wilt u de planten water geven?<br>Hoogachtend, Elif', 'Hoi Ellen,<br>Wij gaan van 4 tot 18 juli op vakantie. Wil jij mijn planten water geven? Twee keer per week is genoeg. De sleutel ligt onder de bloempot naast de deur.<br>Heel erg bedankt!<br>Groetjes, Elif')}

${uitleg([
  'Er staat veel over de vakantie, maar niet wanneer je weg bent en niet waar de sleutel is. Mooie zinnen die niet gevraagd worden, leveren niets op.',
  '"Geachte mevrouw" en "Hoogachtend" zijn te formeel voor een briefje aan je buurvrouw.',
], [
  'De drie gevraagde punten, en niets wat niet gevraagd wordt.',
  'Je kent Ellen, dus je schrijft "je" en "Hoi Ellen". Dat past bij de situatie.',
])}

<h2 id="korte-tekst">Voorbeeld 4: een korte tekst voor de wijkkrant</h2>

${opdracht('Opdracht: mijn favoriete plek', 'De wijkkrant vraagt bewoners om te schrijven over hun favoriete plek in de wijk. Schrijf een korte tekst (ongeveer 5 zinnen). Schrijf:', [
  'welke plek het is',
  'wat je daar doet',
  'waarom je die plek fijn vindt',
])}

${antwoorden('mijn favoriete plek is het park ik ga daar elke dag het is mooi', 'Mijn favoriete plek in de wijk is het Julianapark. Ik ga daar bijna elke dag naartoe met mijn zoon. Hij speelt in de speeltuin en ik zit op een bankje. Ik vind het park fijn, omdat het rustig en groen is. Soms praat ik daar met andere moeders uit de buurt.')}

${uitleg([
  'Geen hoofdletter aan het begin en geen punten. Drie zinnen lopen in elkaar over.',
  'Wat je in het park doet, staat er niet in. "Het is mooi" is te kort als reden.',
  'Drie zinnen waar ongeveer vijf gevraagd worden.',
], [
  'Vijf korte zinnen, elk met een hoofdletter en een punt.',
  'Alle drie de punten, met een reden: "omdat het rustig en groen is".',
  'De plek heeft een naam. Dat maakt de tekst concreet, zonder moeilijke woorden.',
])}

<h2 id="wat-je-ziet">Wat je in alle vier de voorbeelden ziet</h2>

<p>Leg de zwakke antwoorden naast elkaar en je ziet steeds hetzelfde patroon:</p>

<ul>
  <li><span><strong>Een gevraagd punt ontbreekt.</strong> Dat kost het meest, en het is het makkelijkst te voorkomen.</span></li>
  <li><span><strong>De vorm past niet.</strong> Te formeel tegen de buurvrouw, te los tegen een instantie.</span></li>
  <li><span><strong>Lange zinnen zonder punt.</strong> Korte zinnen zijn op A2 geen zwakte. Ze zijn duidelijk.</span></li>
  <li><span><strong>Iets schrijven wat niet gevraagd is.</strong> Het voelt als extra werk, maar het levert geen punten op.</span></li>
</ul>

<p>Wat de betere antwoorden <em>niet</em> doen: moeilijke woorden gebruiken. Geen enkel beter
antwoord hierboven heeft een woord dat je niet op A2 kent.</p>

<h2 id="zo-oefen-je">Zo oefen je met deze voorbeelden</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Lees alleen de opdracht</h3>
    <p>Dek de antwoorden af. Schrijf zelf een antwoord, met pen en papier. Neem er ongeveer tien minuten voor.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Streep de punten af</h3>
    <p>Pak de lijst met gevraagde punten. Staat elk punt in je tekst? Zet er een streep door.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Vergelijk met de twee antwoorden</h3>
    <p>Lijkt jouw antwoord meer op het zwakke of op het betere? Kijk naar de vier dingen: opdracht, duidelijk, vorm, zinnen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Doe daarna een oefenexamen van DUO</h3>
    <p>Daar staan vier echte oefenopdrachten. Gebruik dezelfde controle. Zo weet je toch of je antwoord goed is.</p>
  </div></div>
</div>

${inlineCta('Wil je feedback op je eigen tekst?', 'In de module Schrijven A2 krijg je bij elke opdracht feedback per punt, volgens de beoordeling die onze docent heeft opgesteld. Het is oefenfeedback, geen officiële uitslag van DUO.', '/premium', 'Bekijk de module Schrijven')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Schrijven A2: 4 opdrachten, 40 minuten, pen en papier.</li>
  <li>DUO geeft oefenopdrachten, maar geen voorbeeldantwoorden.</li>
  <li>Een gevraagd punt dat ontbreekt, kost het meest.</li>
  <li>Kort en compleet is beter dan lang en mooi.</li>
  <li>De slaaggrens maakt DUO niet bekend.</li>
</ul>`,

  faq: [
    {
      q: 'Waar vind ik voorbeeldantwoorden voor het examen Schrijven A2?',
      a: 'Bij DUO niet: de drie oefenexamens Schrijven A2 op inburgeren.nl bevatten alleen de opdrachten. Op deze pagina staan vier voorbeeldopdrachten met elk een zwak en een beter antwoord, en de uitleg waarom. De opdrachten zijn door ons geschreven, in dezelfde vorm als de opdrachten van DUO.',
    },
    {
      q: 'Hoe lang moet mijn antwoord zijn?',
      a: 'Zo lang als de opdracht vraagt. Staat er "2 of 3 zinnen" of "ongeveer 5 zinnen", houd je daaraan. Belangrijker dan de lengte is dat elk gevraagd punt erin staat. Een lange tekst met een ontbrekend punt is zwakker dan een korte tekst die compleet is.',
    },
    {
      q: 'Hoeveel fouten mag ik maken bij Schrijven?',
      a: 'Dat maakt DUO niet bekend. De slaaggrens is een cesuur die de minister vaststelt, en die wordt niet gepubliceerd. Wel staat vast dat niet alles goed hoeft te zijn om te slagen. Een paar spelfouten zijn geen ramp, zolang je boodschap duidelijk is en alle punten erin staan.',
    },
    {
      q: 'Moet ik "u" of "je" schrijven?',
      a: 'Dat hangt af van de lezer. Aan een instantie, zoals de gemeente of de woningcorporatie, schrijf je "u", met "Beste meneer, mevrouw," en "Met vriendelijke groet,". Aan iemand die je kent, zoals je buurvrouw, schrijf je "je", met bijvoorbeeld "Hoi Ellen,". Wissel niet halverwege je tekst.',
    },
    {
      q: 'Wie kijkt mijn examen Schrijven na?',
      a: 'Mensen, geen computer. Je tekst wordt beoordeeld door gecertificeerde beoordelaars. Je krijgt een uitslag (geslaagd of niet geslaagd) en een cijfer. Omdat mensen nakijken, duurt de uitslag van Schrijven langer dan die van Lezen of Luisteren.',
    },
    {
      q: 'Zijn deze opdrachten echte examenvragen?',
      a: 'Nee. Echte examenvragen zijn geheim en mogen niet gedeeld worden. Deze vier opdrachten zijn door ons geschreven. Ze hebben wel dezelfde vorm als de opdrachten in de oefenexamens van DUO: een formulier, een e-mail, een briefje en een korte tekst.',
    },
  ],

  related: ['schrijven-examen', 'taalexamens-a2-b1', 'spreken-examen'],
  relatedPosts: ['veelgemaakte-fouten-schrijven-examen-a2', 'want-of-omdat'],

  ctaTitle: 'Oefen Schrijven met feedback',
  ctaDesc: 'Schrijfopdrachten met feedback per punt, volgens de beoordeling van een NT2-docent. Oefenfeedback, geen officiële uitslag.',
  ctaHref: '/premium',
  ctaLabel: 'Bekijk de modules',
};

export default guide;
