/**
 * Inburgering spoke — "Taaleis naturalisatie: A2 of B1?"
 *
 * Waarom deze pagina bestaat: op Reddit (r/learndutch, r/Netherlands) komt telkens dezelfde
 * verwarring terug, met tegenstrijdige antwoorden en "bel DUO" als einde van de draad:
 *  - "Mijn partner wordt Nederlander. Moet ik dan ineens B1 halen?"
 *  - "Ik zit in de B1-route. Mag ik met A2 naturaliseren?" ("de escape route", "een loophole")
 *  - "Is A2 genoeg voor een vaste verblijfsvergunning?"
 * Het antwoord zit in het feit dat er **twee regels uit twee wetten** zijn: de inburgeringsplicht
 * (DUO en gemeente) en het inburgeringsvereiste voor naturalisatie (IND). Wie die twee uit elkaar
 * houdt, begrijpt de rest.
 *
 * Wat bewust voorzichtig staat (onderzoek 03-11-2026, zie
 * `seo-agent/briefs/2026-11-03-drie-nieuwe-gidsen.md`):
 *  - **Het scenario "partner van een kennismigrant → partner van een Nederlander"** wordt nergens
 *    letterlijk beschreven. Wat vaststaat is de wet (art. 3 Wi2021: plicht ontstaat bij verblijf
 *    voor een niet-tijdelijk doel, niet met terugwerkende kracht) en Divosa's algemene uitspraak
 *    over gewijzigde verblijfsstatus. De tekst zegt daarom "kan", niet "wordt".
 *  - **Welk niveau de IND vraagt voor een vaste verblijfsvergunning** in de B1-route: de IND noemt
 *    alleen "inburgeringsdiploma", zonder niveau. Dat staat er zo.
 *  - **De verhoging naar B1 en de 10 jaar** zijn plannen zonder datum. Geen datum noemen.
 *  - Geen juridisch advies: de pagina verwijst voor een eigen situatie naar de IND en Het
 *    Juridisch Loket.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_USERS, I_LANDMARK, I_HOME, I_ROUTE, note, inlineCta, factTwo } from './kit';

const SRC_NATURALISEREN = 'https://www.inburgeren.nl/u-gaat-inburgeren/naturaliseren.jsp';
const SRC_WI2021 = 'https://wetten.overheid.nl/BWBR0044770/';
const SRC_BESLUIT = 'https://wetten.overheid.nl/BWBR0045555';
const SRC_DIVOSA_NAT = 'https://www.divosa.nl/publicaties/wet-inburgering-vraag-en-antwoord/algemeen/naturalisatie';
const SRC_DIVOSA_EXAM = 'https://www.divosa.nl/publicaties/wet-inburgering-vraag-en-antwoord/leerroutes-en-onderwijs/examinering';
const SRC_DUO_LEERROUTES = 'https://duo.nl/zakelijk/inburgering-ketenpartners/wet-inburgering-2021/leerbaarheidstoets-en-leerroutes/leerroutes.jsp';
const SRC_IND_VERBLIJF = 'https://ind.nl/nl/met-een-verblijfsvergunning-wonen-in-nederland/inburgering-bij-sterkere-verblijfsvergunning';
const SRC_DIPLOMA = 'https://www.inburgeren.nl/examen-doen/diploma.jsp';
const SRC_IND_TOETS = 'https://ind.nl/nl/documenten/03-2026/uitvoeringstoets-wetsvoorstel-rijkswet-op-het-nederlanderschap-rwn-februari-2026.pdf';
const SRC_RIJKSOVERHEID_10 = 'https://www.rijksoverheid.nl/actueel/nieuws/2025/09/26/kabinet-wil-naturalisatietermijn-verlengen-van-5-naar-10-jaar';
const SRC_KAMERVRAGEN = 'https://zoek.officielebekendmakingen.nl/ah-tk-20252026-1163.html';
const CHECKED = '03-11-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const row = (k: string, v: string) =>
  `<div class="compare-row"><p class="compare-key">${k}</p><p class="compare-val">${v}</p></div>`;

const guide: Guide = {
  slug: 'taaleis-naturalisatie',
  section: 'inburgering',

  status: 'draft',
  pillar: false,
  coverGlyph: 'passport',

  title: 'Taaleis naturalisatie: A2 of B1? Zo zit het in 2026',
  description:
    'Voor naturalisatie is A2 nu genoeg, ook als je in de B1-route zit. Wat er verandert als je partner Nederlander wordt, en wat geldt voor een vaste vergunning.',

  datePublished: '2026-11-03',
  dateModified: '2026-11-03',
  dateLabel: '3 november 2026',
  breadcrumb: 'Taaleis naturalisatie',
  eyebrow: 'Naturalisatie',

  heroTitle: 'Naturaliseren: heb je A2 of B1 nodig?',
  heroSubtitle:
    'Je partner wordt Nederlander. Of je zit in de B1-route en wilt een Nederlands paspoort. Wat moet je dan halen? Het antwoord: er zijn twee regels, uit twee wetten. Wie die uit elkaar houdt, snapt de rest.',
  readingMinutes: 9,

  articleHtml: `
<p><strong>Voor naturalisatie is de taaleis op dit moment A2.</strong> Je hebt een
inburgeringsdiploma op minimaal A2 nodig, of het staatsexamen NT2 op B1 of B2. Dat staat los van
je inburgeringsplicht. Moet je onder de Wet inburgering 2021 de B1-route doen? Dan is B1 het doel
van je inburgering, maar de IND vraagt voor naturalisatie nog steeds A2. Die twee regels door
elkaar halen is de bron van bijna alle verwarring.</p>

${fact('"Wilt u naturaliseren? Dan moet u eerst het inburgeringsexamen op taalniveau A2 halen. Of het staatsexamen Nederlands als 2e taal (Nt2) op niveau B1 of B2." De IND controleert of u een inburgeringsdiploma hebt op minimaal taalniveau A2.', 'inburgeren.nl — Naturaliseren', SRC_NATURALISEREN, CHECKED)}

${note('Dit is algemene uitleg, geen juridisch advies. Elke situatie is anders. Twijfel je over jouw situatie? Vraag het de IND, of ga gratis naar Het Juridisch Loket.')}

<h2 id="twee-regels">Twee regels, twee wetten</h2>

<div class="compare-2">
  <div class="compare-card">
    <div class="compare-head">
      <h3>De inburgeringsplicht</h3>
      <p class="compare-when">Wet inburgering · DUO en gemeente</p>
    </div>
    <div class="compare-rows">
      ${row('Vraag', 'Moet jij inburgeren, en tot welk niveau?')}
      ${row('B1-route (Wet 2021)', 'Het doel is B1')}
      ${row('Wet 2013', 'Het doel is A2')}
      ${row('Eindigt', 'Als je klaar bent, of als je Nederlander wordt')}
    </div>
  </div>
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>De taaleis voor naturalisatie</h3>
      <p class="compare-when">Rijkswet op het Nederlanderschap · IND</p>
    </div>
    <div class="compare-rows">
      ${row('Vraag', 'Mag jij Nederlander worden?')}
      ${row('Taaleis nu', 'Minimaal A2')}
      ${row('Bewijs', 'Inburgeringsdiploma, of staatsexamen NT2')}
      ${row('Verandert?', 'Er zijn plannen, nog zonder datum (zie verderop)')}
    </div>
  </div>
</div>

${fact('"De inburgeringsplicht eindigt wanneer iemand voldaan heeft aan de vereisten van de Wi2021 of wanneer iemand Nederlander is geworden." "De inburgeringsplicht blijft gelden totdat iemand Nederlander is geworden."', 'Divosa — Wet inburgering vraag en antwoord: naturalisatie', SRC_DIVOSA_NAT, CHECKED)}

<p>Kies hieronder de situatie die bij jou past.</p>

<div class="guide-cards">
  ${card(I_USERS, 'Je bent partner van een kennismigrant', 'Dan ben je meestal niet inburgeringsplichtig. Zie situatie 1.')}
  ${card(I_LANDMARK, 'Je partner wordt Nederlander', 'Dan kan er een inburgeringsplicht ontstaan. Zie situatie 2.')}
  ${card(I_ROUTE, 'Je zit in de B1-route en wilt naturaliseren', 'Dan geldt voor naturalisatie A2. Zie situatie 3.')}
  ${card(I_HOME, 'Je wilt een vaste verblijfsvergunning', 'Dan vraagt de IND een inburgeringsdiploma. Zie situatie 4.')}
</div>

<h2 id="kennismigrant">Situatie 1: je bent partner van een kennismigrant</h2>

<p>Woon je in Nederland als partner van een kennismigrant? Dan ben je <strong>niet
inburgeringsplichtig</strong>. De wet ziet jouw verblijf als tijdelijk, omdat je verblijft bij
iemand die hier voor een tijdelijk doel is. Dat geldt ook voor partners van iemand met een
Europese blauwe kaart.</p>

${factTwo('Inburgeringsplichtig is de vreemdeling die "anders dan voor een tijdelijk doel in Nederland verblijft" (Wet inburgering 2021, art. 3). Als tijdelijk doel geldt onder meer "verblijf als familie- of gezinslid bij een persoon die voor een tijdelijk doel in Nederland verblijft", "arbeid als kennismigrant" en verblijf als houder van de Europese blauwe kaart (Besluit inburgering 2021, art. 2.2).', [['Wet inburgering 2021, artikel 3', SRC_WI2021], ['Besluit inburgering 2021, artikel 2.2', SRC_BESLUIT]], CHECKED)}

<p>Je mag wel examens doen bij DUO. Veel partners van kennismigranten doen dat, omdat ze later
willen naturaliseren. Let dan goed op situatie 2.</p>

<h2 id="partner-wordt-nederlander">Situatie 2: je partner wordt Nederlander</h2>

<p>Dit is de situatie waar op fora de meeste vragen over gaan. Je partner naturaliseert. Daarmee
kan het doel van jouw verblijf veranderen: je woont dan niet meer bij een kennismigrant, maar bij
een Nederlander. Dat is geen tijdelijk doel meer.</p>

<p>Wat de wet zegt: de inburgeringsplicht ontstaat als je verblijf krijgt voor een niet-tijdelijk
doel. Gebeurt dat na 1 januari 2022, dan valt die plicht onder de <strong>Wet inburgering 2021</strong>,
met de B1-route als standaard. De plicht werkt niet terug in de tijd.</p>

${fact('De inburgeringsplicht ontstaat bij het verkrijgen van rechtmatig verblijf voor een niet-tijdelijk doel. "De inburgeringsplicht ontstaat niet met terugwerkende kracht."', 'Wet inburgering 2021, artikel 3', SRC_WI2021, CHECKED)}

<p>Dat dit ook echt gebeurt, bevestigt Divosa, de vereniging van gemeentelijke sociale diensten,
in een vraag-en-antwoord die is opgesteld met de IND en het ministerie. Er is ook goed nieuws in
datzelfde antwoord: <strong>wie al aan alle voorwaarden van de oude wet (A2) voldoet, kan nog
steeds naturaliseren</strong>.</p>

${fact('"DUO heeft de inburgeringsplicht onder de Wi2021 opgelegd aan iemand die al aan het inburgeren was onder de voorwaarden van de Wi2013." "Als zij aan alle voorwaarden van de Wi2013 voldoen, dan kunnen zij nog steeds een naturalisatieverzoek indienen." "Op dit moment (augustus 2026) voldoet iemand aan het inburgeringsvereiste voor naturalisatie wanneer hij voldoet aan de voorwaarden voor de Wi2013, ook als iemand inburgeringsplichtig is gemaakt onder de Wi2021."', 'Divosa — Wet inburgering vraag en antwoord: naturalisatie', SRC_DIVOSA_NAT, CHECKED)}

<p>Wat betekent dat in de praktijk?</p>

<ul>
  <li><span><strong>Heb je je A2-diploma al?</strong> Dan voldoe je voor naturalisatie aan de taaleis, ook als je daarna een inburgeringsplicht onder de Wet 2021 krijgt.</span></li>
  <li><span><strong>Ben je nog bezig met A2?</strong> Dan is de volgorde belangrijk. Ga niet af op wat een kennis heeft meegemaakt. Vraag de IND of Het Juridisch Loket naar jouw situatie, <em>voordat</em> je partner zijn aanvraag doet.</span></li>
  <li><span><strong>Krijg je een brief van DUO over de Wet 2021?</strong> Lees hem goed. Daarin staat wat er voor jou geldt.</span></li>
</ul>

<h2 id="b1-route">Situatie 3: je zit in de B1-route en wilt naturaliseren</h2>

<p>De taaleis voor naturalisatie is A2. Dat geldt ook voor jou, zolang die regel niet verandert.
Word je Nederlander, dan eindigt je inburgeringsplicht. Dit is wat op internet de "escape route"
of een "loophole" heet. Het is geen truc: het zijn gewoon twee aparte regels.</p>

<p>Maar let op. <strong>Een A2-diploma krijg je in de B1-route niet zomaar.</strong> In de B1-route
doe je de examens op B1. De examens op A2 komen pas beschikbaar als de gemeente je niveau verlaagt
naar A2. Dat heet <strong>afschalen</strong>, en daar zijn voorwaarden aan verbonden.</p>

${factTwo('"Alleen binnen de B1-route is het mogelijk om af te schalen. Het taalniveau wordt dan verlaagd naar A2. De inburgeraar moet eerst minimaal 600 uur cursus hebben gevolgd." Divosa: "Na wijziging van het taalniveau in de DUO portal komen ook de examens op A2-niveau beschikbaar."', [['DUO — Leerroutes', SRC_DUO_LEERROUTES], ['Divosa — Examinering', SRC_DIVOSA_EXAM]], CHECKED)}

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Voor naturalisatie telt</p>
    <ul>
      <li>${I_CHECK}<span>Een inburgeringsdiploma op minimaal A2</span></li>
      <li>${I_CHECK}<span>Een A2-diploma dat je al had, of na afschalen hebt gehaald</span></li>
      <li>${I_CHECK}<span>Het staatsexamen NT2 op B1 of B2</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Waar mensen zich in vergissen</p>
    <ul>
      <li>${I_X}<span>"In de B1-route kun je zelf kiezen voor A2-examens." Dat beslist de gemeente, na minstens 600 uur les.</span></li>
      <li>${I_X}<span>"De taaleis voor naturalisatie is al B1." Dat is een plan, nog zonder datum.</span></li>
      <li>${I_X}<span>"Naturaliseren kan alleen met de taaleis." De IND heeft meer voorwaarden, zoals hoe lang je hier woont.</span></li>
    </ul>
  </div>
</div>

<h2 id="verblijfsvergunning">Situatie 4: je wilt een vaste verblijfsvergunning</h2>

<p>Wil je een verblijfsvergunning voor onbepaalde tijd, en geen Nederlands paspoort? Dan moet je
meestal voldoen aan het inburgeringsvereiste. De IND vraagt daarvoor een
<strong>inburgeringsdiploma</strong>. Op die pagina noemt de IND geen niveau.</p>

${factTwo('De IND: "Dan moet u meestal voldoen aan het inburgeringsvereiste." "Dat betekent dat u eerst moet slagen voor het inburgeringsexamen. U krijgt dan een inburgeringsdiploma." DUO over het diploma onder de Wet 2021: "Op het diploma staat of u het examen op A2, B1 of B2 niveau hebt gedaan."', [['IND — Inburgering bij sterkere verblijfsvergunning', SRC_IND_VERBLIJF], ['inburgeren.nl — Diploma', SRC_DIPLOMA]], CHECKED)}

<p>Divosa schrijft dat het inburgeringsvereiste een diploma met minimaal A2 betekent. Maar ook hier
geldt: zit je in de B1-route en is je niveau niet afgeschaald, dan heb je geen A2-diploma. Je
inburgeringsplicht blijft dan gewoon bestaan, ook met een vaste verblijfsvergunning. Alleen
Nederlander worden maakt er een einde aan. Wil je zeker weten wat voor jou geldt? Vraag het de IND.</p>

${fact('"Het inburgeringsvereiste houdt in dat iemand een inburgeringsdiploma moet hebben met minimaal taalniveau A2."', 'Divosa — Examinering', SRC_DIVOSA_EXAM, CHECKED)}

<h2 id="wat-verandert">Wat gaat er veranderen?</h2>

<p>Twee plannen van het kabinet. Allebei zijn ze <strong>nog niet ingegaan</strong>, en er is geen
datum:</p>

<ul>
  <li><span><strong>De taaleis voor naturalisatie naar B1.</strong> Dit staat in een concept. Nu is het nog A2.</span></li>
  <li><span><strong>Langer in Nederland wonen voordat je mag naturaliseren.</strong> Het kabinet wil de minimale verblijfsduur verlengen naar 10 jaar.</span></li>
</ul>

${factTwo('Het voorstel "betreft een verhoging van het voor naturalisatie vereiste taalniveau van ten minste A2 naar ten minste B1" en staat in een concept Besluit naturalisatietoets; "op het moment van schrijven" is het vereiste taalniveau A2. Het kabinet "is van plan om de minimale verblijfsduur voor het verkrijgen van het Nederlanderschap via naturalisatie te verlengen naar 10 jaar". Volgens de IND gelden de wijzigingen niet voor verzoeken die vóór de inwerkingtreding zijn gedaan.', [['IND — Uitvoeringstoets Rijkswet op het Nederlanderschap', SRC_IND_TOETS], ['Rijksoverheid — Nieuwsbericht 26-09-2025', SRC_RIJKSOVERHEID_10]], CHECKED)}

<p>Het wetsvoorstel over de verblijfsduur was tot december 2025 in consultatie. Het kabinet wilde
het in de tweede helft van 2026 naar de Tweede Kamer sturen. Pas als een wet is aangenomen en een
datum heeft, verandert er iets voor jou.</p>

${fact('"Het wetsvoorstel is tot 2 december 2025 in (internet)consultatie gegeven." "Op dit moment wordt gestreefd naar indiening in de Tweede Kamer in het derde kwartaal van 2026."', 'Antwoord op Kamervragen, 20-02-2026', SRC_KAMERVRAGEN, CHECKED)}

<p>Wat je daaruit kunt halen: <strong>voldoe je nu aan alle voorwaarden, dan is wachten een
risico.</strong> Volgens de IND blijft een aanvraag die vóór een wijziging is gedaan onder de oude
regels vallen.</p>

<h2 id="wat-nu">Wat doe je nu?</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Zoek uit onder welke wet je valt</h3>
    <p>Dat staat in je brief van DUO en in Mijn Inburgering. Ben je partner van een kennismigrant, dan ben je misschien helemaal niet inburgeringsplichtig.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Haal A2 als je dat kunt</h3>
    <p>Een inburgeringsdiploma op A2 is nu genoeg voor naturalisatie. Hoe eerder je het hebt, hoe minder een wijziging van je verblijf of van de regels je raakt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Plan de volgorde met je partner</h3>
    <p>Naturaliseert je partner, en ben je zelf nog bezig? Vraag eerst de IND of Het Juridisch Loket wat dat voor jou betekent.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Zit je in de B1-route? Praat met je gemeente</h3>
    <p>Lukt B1 niet, ook na veel lessen? Vraag je klantmanager of afschalen naar A2 mogelijk is.</p>
  </div></div>
</div>

${inlineCta('Begin met A2', 'Oefen alle vier de taalonderdelen op A2 en KNM, met tien gratis vragen per onderdeel. Zonder account.', '/oefenen', 'Begin met gratis oefenen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Naturalisatie: nu minimaal A2.</li>
  <li>Inburgeringsplicht en naturalisatie zijn twee aparte regels.</li>
  <li>Partner van een kennismigrant: meestal niet inburgeringsplichtig.</li>
  <li>Partner wordt Nederlander: er kan een plicht onder de Wet 2021 ontstaan.</li>
  <li>B1-route: A2-examens pas na afschalen door de gemeente.</li>
  <li>B1 voor naturalisatie is een plan, nog zonder datum.</li>
</ul>`,

  faq: [
    {
      q: 'Welk taalniveau heb ik nodig voor naturalisatie?',
      a: 'Op dit moment minimaal A2. Je hebt een inburgeringsdiploma op minimaal A2 nodig, of het staatsexamen NT2 op B1 of B2. Het kabinet wil de taaleis verhogen naar B1, maar dat is nog een plan zonder datum.',
    },
    {
      q: 'Ik zit in de B1-route. Mag ik met A2 naturaliseren?',
      a: 'Voor naturalisatie is A2 genoeg, ook als je in de B1-route zit. Volgens Divosa (augustus 2026) voldoe je aan het inburgeringsvereiste voor naturalisatie als je aan de voorwaarden van de Wet 2013 voldoet. Maar in de B1-route kun je pas A2-examens doen als de gemeente je niveau afschaalt, na minstens 600 uur les.',
    },
    {
      q: 'Moet ik B1 halen als mijn partner Nederlander wordt?',
      a: 'Dat kan. Als partner van een kennismigrant ben je meestal niet inburgeringsplichtig. Wordt je partner Nederlander en verandert het doel van je verblijf, dan kan er een inburgeringsplicht onder de Wet 2021 ontstaan, met de B1-route als standaard. Heb je al een A2-diploma, dan kun je volgens Divosa nog steeds naturaliseren. Vraag de IND naar jouw situatie.',
    },
    {
      q: 'Stopt mijn inburgeringsplicht als ik Nederlander word?',
      a: 'Ja. De inburgeringsplicht eindigt als je klaar bent met inburgeren, of als je Nederlander bent geworden. Een vaste verblijfsvergunning maakt er geen einde aan.',
    },
    {
      q: 'Is A2 genoeg voor een verblijfsvergunning voor onbepaalde tijd?',
      a: 'De IND vraagt een inburgeringsdiploma en noemt op die pagina geen niveau. Divosa schrijft dat het om een diploma met minimaal A2 gaat. Zit je in de B1-route zonder afschaling, dan heb je geen A2-diploma. Vraag de IND wat voor jouw situatie geldt.',
    },
    {
      q: 'Wordt de taaleis voor naturalisatie B1?',
      a: 'Dat is het plan van het kabinet, maar het is nog niet ingegaan en er is geen datum. Nu is het A2. Volgens de IND gelden nieuwe regels niet voor aanvragen die vóór de wijziging zijn gedaan.',
    },
  ],

  related: ['welke-wet-en-welke-route', 'moet-ik-inburgeren', 'boete-en-termijn', 'vrijstelling-en-ontheffing'],
  relatedPosts: ['taalniveaus-a1-a2-b1-nederlands'],

  ctaTitle: 'Haal je A2',
  ctaDesc: 'Oefenexamens voor alle vier de taalonderdelen op A2 en KNM, gemaakt en nagekeken door een NT2-docent.',
  ctaHref: '/oefenen',
  ctaLabel: 'Begin met gratis oefenen',
};

export default guide;
