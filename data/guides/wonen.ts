/**
 * KNM thema 3 — Wonen.
 *
 * Three eindtermen (Stcrt. 2024, 15802): 3.1 passende huisvesting regelen · 3.2 regelen van
 * nutsvoorzieningen en communicatiemiddelen · 3.3 bijdragen aan een schone leefomgeving.
 *
 * **No amounts, no waiting times.** Huurtoeslag limits, the liberalisatiegrens and social-housing
 * waiting lists all change yearly and differ per gemeente; a number here would be false somewhere
 * on the day it is written. The mechanisms are described and the figures are left to the linked
 * government pages. Same discipline as `werk-en-inkomen.ts`.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_HOME, I_EURO, I_USERS, I_CLIPBOARD, docent, note, inlineCta, factTwo } from './kit';

export const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
export const SRC_HUURWONING = 'https://www.rijksoverheid.nl/onderwerpen/huurwoning';
export const SRC_HUURCOMMISSIE = 'https://www.huurcommissie.nl/';
export const SRC_HUURTOESLAG = 'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/huurtoeslag';
export const SRC_BRP = 'https://www.rijksoverheid.nl/onderwerpen/privacy-en-persoonsgegevens/basisregistratie-personen-brp';
export const SRC_AFVAL = 'https://www.rijksoverheid.nl/onderwerpen/afval';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'wonen',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'house',

  title: 'KNM thema Wonen: huren, kopen en je woning regelen',
  description:
    'Een woning zoeken, huren of kopen, gas water en licht aansluiten, en afval scheiden. Alles over het KNM-thema Wonen, in eenvoudig Nederlands uitgelegd.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Wonen',
  eyebrow: 'KNM-thema 3',

  heroTitle: 'Wonen',
  heroSubtitle:
    'Een woning vinden is in Nederland moeilijk, en er komt veel bij kijken: inschrijven, huurcontract, energie, verzekering, afval. Dit thema zet het op een rij.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<p>Drie eindtermen, en ze volgen precies de weg die je zelf aflegt: eerst een woning, dan de
voorzieningen erin, dan het leven eromheen.</p>

<div class="compare-rows">
  ${row('3.1', 'Passende huisvesting regelen')}
  ${row('3.2', 'Regelen van nutsvoorzieningen en communicatiemiddelen')}
  ${row('3.3', 'Bijdragen aan een schone leefomgeving')}
</div>

${fact('De eindtermen KNM bij thema Wonen zijn: passende huisvesting regelen; regelen van nutsvoorzieningen en communicatiemiddelen; bijdragen aan een schone leefomgeving.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="huren-of-kopen">Huren of kopen</h2>

<p>De meeste mensen die net in Nederland zijn, huren. Er zijn twee soorten huurwoningen, en het
verschil is belangrijk.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Sociale huurwoning</h3>
      <p class="compare-when">Van een woningcorporatie</p>
    </div>
    <div class="compare-rows">
      ${row('Huur', 'Lager, met een wettelijk maximum')}
      ${row('Voor wie', 'Mensen met een inkomen onder een grens')}
      ${row('Hoe', 'Je schrijft je in en wacht. In veel steden jaren.')}
      ${row('Toeslag', 'Vaak recht op huurtoeslag')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Vrije sector</h3>
      <p class="compare-when">Van een particulier of belegger</p>
    </div>
    <div class="compare-rows">
      ${row('Huur', 'Hoger, en de verhuurder bepaalt meer')}
      ${row('Voor wie', 'Meestal een inkomenseis van 3 tot 4 keer de huur')}
      ${row('Hoe', 'Via makelaars en verhuursites, sneller beschikbaar')}
      ${row('Toeslag', 'Geen huurtoeslag')}
    </div>
  </div>
</div>

<p>Ben je statushouder? Dan wijst je <strong>gemeente</strong> je meestal een woning toe. Dat heet
huisvesting van vergunninghouders. Je hoeft dan niet zelf jaren in te schrijven, maar je kunt ook
niet zelf kiezen waar je woont.</p>

${note('Pas op met onderhuur en met "sleutelgeld". Een verhuurder mag geen geld vragen alleen voor het krijgen van de sleutel, en onderhuren zonder toestemming kan betekenen dat je zomaar op straat staat. Vraag altijd een schriftelijk huurcontract op jouw naam.')}

<h2 id="inschrijven">Inschrijven bij de gemeente</h2>

<p>Zodra je een woonadres hebt, schrijf je je in bij de gemeente. Je komt dan in de
<strong>Basisregistratie Personen</strong> (BRP). Dit is geen formaliteit: zonder inschrijving heb
je geen BSN-koppeling aan een adres, en dan lukt bijna niets — geen zorgverzekering, geen toeslag,
geen bankrekening, geen school.</p>

<p>Verhuis je later? Dan geef je dat door aan de gemeente, uiterlijk vijf dagen na je verhuizing.
Van daaruit gaat je nieuwe adres automatisch naar veel andere instanties, maar niet naar allemaal:
je energieleverancier, je verzekeraar en je werkgever moet je zelf informeren.</p>

${fact('De Basisregistratie Personen (BRP) bevat de persoonsgegevens van iedereen die in Nederland woont. Overheidsorganisaties gebruiken die gegevens; wie verhuist, geeft dat door aan de gemeente.', 'Rijksoverheid — Basisregistratie Personen', SRC_BRP, CHECKED)}

<h2 id="huurcontract">Je huurcontract en je rechten</h2>

<p>Je huurcontract is een overeenkomst. Lees het voordat je tekent, en let op deze punten.</p>

<ul>
  <li><strong>Kale huur en servicekosten.</strong> De kale huur is voor de woning; servicekosten zijn voor bijvoorbeeld schoonmaak of de lift. Samen zijn dat je maandlasten.</li>
  <li><strong>Waarborgsom.</strong> Meestal &eacute;&eacute;n of twee maanden huur. Je krijgt hem terug als je de woning netjes achterlaat.</li>
  <li><strong>Opzegtermijn.</strong> Meestal &eacute;&eacute;n maand voor jou. Voor de verhuurder gelden strengere regels.</li>
  <li><strong>Onderhoud.</strong> Groot onderhoud is voor de verhuurder. Kleine dingen — een lampje, een kraanleertje — zijn voor jou.</li>
</ul>

<p>Als huurder ben je in Nederland goed beschermd. Een verhuurder kan je niet zomaar uit huis
zetten; daar is een uitspraak van de rechter voor nodig. Heb je ruzie over de huurprijs, de
servicekosten of achterstallig onderhoud van een sociale huurwoning, dan kun je naar de
<strong>Huurcommissie</strong>.</p>

${factTwo('Huurders in Nederland hebben huurbescherming: een verhuurder kan de huur niet zomaar opzeggen. Bij geschillen over huurprijs, servicekosten of onderhoud kan een huurder een zaak voorleggen aan de Huurcommissie.', [['Rijksoverheid — Huurwoning', SRC_HUURWONING], ['Huurcommissie', SRC_HUURCOMMISSIE]], CHECKED)}

<p>Heb je een laag inkomen en een niet te dure huurwoning? Dan kun je <strong>huurtoeslag</strong>
aanvragen bij de Belastingdienst. Of het kan, en hoeveel, hangt af van je huur, je inkomen, je
leeftijd en je vermogen. Reken het na met de proefberekening op de site van de Belastingdienst —
bedragen en grenzen veranderen elk jaar.</p>

${fact('Huurtoeslag is een bijdrage van de Belastingdienst in de huurkosten. Of u er recht op hebt hangt onder meer af van uw huur, uw inkomen, uw leeftijd en uw vermogen; de bedragen en grenzen wijzigen jaarlijks.', 'Belastingdienst — Huurtoeslag', SRC_HUURTOESLAG, CHECKED)}

${docent('Bij dit thema struikelen mensen vaak over &eacute;&eacute;n woord: "toeslag". Toeslagen vraag je zelf aan, ze komen niet vanzelf. En je moet ze zelf stopzetten als je situatie verandert. Anders moet je later terugbetalen, en dat is precies waar veel mensen in de problemen komen.')}

<h2 id="nutsvoorzieningen">Gas, water, licht en internet</h2>

<p>Dit is de tweede eindterm, en het is echt werk dat je zelf moet doen. Als je in een lege woning
komt, staat er soms niets aan.</p>

<div class="guide-cards">
  ${card(I_HOME, 'Energie: gas en stroom', 'Je kiest zelf een leverancier en sluit een contract af. Je betaalt maandelijks een voorschot en krijgt &eacute;&eacute;n keer per jaar een jaarafrekening: geld terug of bijbetalen.')}
  ${card(I_HOME, 'Water', 'Water gaat via het waterbedrijf van jouw regio. Kiezen kan niet — er is er per gebied maar &eacute;&eacute;n.')}
  ${card(I_HOME, 'Internet en telefoon', 'Vrije keuze uit providers. Let op de looptijd van het contract: vaak een of twee jaar.')}
  ${card(I_EURO, 'Gemeentelijke belastingen', 'Afvalstoffenheffing en rioolheffing komen van de gemeente; waterschapsbelasting van het waterschap. Heb je een laag inkomen, vraag dan naar kwijtschelding.')}
</div>

<p>Neem bij het betrekken van een woning altijd de <strong>meterstanden</strong> op — gas, stroom,
water — en maak er een foto van. Doe dat ook als je vertrekt. Dat is de goedkoopste vijf minuten
van je verhuizing.</p>

<h3>Verzekeringen rond je woning</h3>
<ul>
  <li><strong>Inboedelverzekering</strong> — voor je spullen bij brand, waterschade of inbraak. Niet verplicht, wel verstandig.</li>
  <li><strong>Aansprakelijkheidsverzekering (AVP)</strong> — voor schade die jij of je kind bij een ander veroorzaakt. Ook niet verplicht, en heel goedkoop.</li>
  <li><strong>Opstalverzekering</strong> — alleen als je een woning koopt; die verzekert het gebouw zelf.</li>
</ul>

<h2 id="schone-leefomgeving">Een schone leefomgeving</h2>

<p>De derde eindterm gaat over afval en over de buurt. In Nederland scheid je je afval, en de
regels verschillen per gemeente. Kijk op de site van je eigen gemeente of in de afvalapp welke
bak wanneer buiten moet.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Zo hoort het meestal</p>
    <ul>
      <li>${I_CHECK}<span>Papier, glas, gft (groente-, fruit- en tuinafval), plastic en restafval apart</span></li>
      <li>${I_CHECK}<span>De container buiten op de vaste dag, en dezelfde dag weer terug</span></li>
      <li>${I_CHECK}<span>Grofvuil (een oude bank, een matras) meld je aan bij de gemeente of breng je naar de milieustraat</span></li>
      <li>${I_CHECK}<span>Statiegeldflessen en -blikjes inleveren bij de supermarkt</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Dit levert een boete op</p>
    <ul>
      <li>${I_X}<span>Vuilniszakken naast de container zetten</span></li>
      <li>${I_X}<span>Grofvuil op straat zetten zonder afspraak</span></li>
      <li>${I_X}<span>Afval verkeerd scheiden bij een ondergrondse container met pas</span></li>
    </ul>
  </div>
</div>

${fact('In Nederland wordt huishoudelijk afval gescheiden ingezameld. Gemeenten zijn verantwoordelijk voor de inzameling en bepalen zelf hoe en wanneer dat gebeurt.', 'Rijksoverheid — Afval', SRC_AFVAL, CHECKED)}

<h3>Buren</h3>

<p>Woon je met veel mensen dicht op elkaar, dan is overlast onvermijdelijk. De volgorde in
Nederland is bijna altijd dezelfde, en het examen vraagt er graag naar:</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Praat met je buren</h3>
    <p>Zelf, rustig, en zo snel mogelijk. Dit lost verreweg de meeste problemen op.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Schakel buurtbemiddeling in</h3>
    <p>Veel gemeenten hebben gratis buurtbemiddeling: vrijwilligers die het gesprek begeleiden.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Meld het bij de verhuurder of de gemeente</h3>
    <p>Bij een sociale huurwoning kan de woningcorporatie ingrijpen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Bel de politie</h3>
    <p>Alleen bij ernstige of aanhoudende overlast, of bij gevaar. Voor niet-spoed is dat 0900-8844.</p>
  </div></div>
</div>

${docent('"Eerst zelf praten" is bij dit thema bijna altijd het goede antwoord. Ik zie cursisten die meteen de politie kiezen, omdat dat in hun land logisch is. Hier wordt van je verwacht dat je het eerst samen probeert.')}

${inlineCta('Oefen dit thema met examenvragen', 'Situaties over huren, energie en afval, met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Sociale huur is goedkoper maar kent lange wachttijden; de vrije sector is sneller en duurder.</li>
  <li>Schrijf je in bij de gemeente (BRP) zodra je een adres hebt.</li>
  <li>Huurders zijn goed beschermd; bij ruzie is er de Huurcommissie.</li>
  <li>Huurtoeslag vraag je zelf aan bij de Belastingdienst.</li>
  <li>Afval scheiden verschilt per gemeente; bij overlast praat je eerst zelf met je buren.</li>
</ul>`,

  faq: [
    {
      q: 'Wat is het verschil tussen sociale huur en vrije sector?',
      a: 'Een sociale huurwoning is van een woningcorporatie, heeft een lagere huur met een wettelijk maximum en is bedoeld voor mensen met een inkomen onder een bepaalde grens. Je schrijft je ervoor in en wacht, soms jaren. Een vrijesectorwoning is duurder, komt van een particulier of belegger, en vraagt meestal een inkomen van drie tot vier keer de huur.',
    },
    {
      q: 'Kan ik huurtoeslag krijgen?',
      a: 'Misschien. Het hangt af van je huur, je inkomen, je leeftijd en je vermogen, en van de vraag of je bij de gemeente staat ingeschreven op dat adres. Doe de proefberekening op de site van de Belastingdienst; de grenzen veranderen elk jaar. Je moet de toeslag zelf aanvragen — hij komt niet automatisch.',
    },
    {
      q: 'Wat doe ik als mijn verhuurder het onderhoud niet regelt?',
      a: 'Meld het eerst schriftelijk bij je verhuurder, bijvoorbeeld per e-mail, zodat je het kunt bewijzen. Gebeurt er niets, dan kun je bij een sociale huurwoning naar de Huurcommissie stappen. Die kan bepalen dat je tijdelijk minder huur hoeft te betalen tot het gebrek verholpen is.',
    },
    {
      q: 'Wat moet ik regelen als ik in een nieuwe woning kom?',
      a: 'Inschrijven bij de gemeente, een energieleverancier kiezen, je aanmelden bij het waterbedrijf van je regio en internet regelen. Neem meteen de meterstanden op en maak er een foto van. Denk daarna aan een inboedel- en aansprakelijkheidsverzekering, en geef je nieuwe adres door aan je werkgever, je bank en je zorgverzekeraar.',
    },
    {
      q: 'Wat doe ik bij overlast van de buren?',
      a: 'Praat er eerst zelf rustig over met je buren; dat lost de meeste problemen op. Lukt dat niet, dan is er in veel gemeenten gratis buurtbemiddeling. Daarna kun je het melden bij je verhuurder of de gemeente. De politie bel je pas bij ernstige of aanhoudende overlast — voor niet-spoedgevallen via 0900-8844.',
    },
  ],

  related: ['instanties', 'omgangsvormen-waarden-en-normen', 'gezondheid-en-gezondheidszorg'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Wonen',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
