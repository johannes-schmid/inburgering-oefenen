/**
 * Taalexamens spoke — Luisteren.
 *
 * Scoped against the blog post `luisteren-examen-inburgering-a2` the same way `lezen-examen.ts`
 * is scoped against its post: the post owns the A2 query, this guide is the two-level reference
 * the cluster links to. See that file's header.
 *
 * The one detail worth getting right here and nowhere else: **a fragment is replayed per question
 * in our own player**, matching how DUO presents it (see CLAUDE.md, "Luisteren replays the
 * fragment for every question"). The guide says the replay is unlimited because that is true of
 * our practice material; it does not claim it of DUO's real exam, which DUO does not document.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_HEADPHONES, I_CLOCK, docent, note, inlineCta, factTwo } from './kit';

const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const SRC_NT2 = 'https://www.staatsexamensnt2.nl/';
const SRC_AANGEPAST = 'https://www.inburgeren.nl/examen-doen/aangepast-examen.jsp';
const CHECKED = '23-08-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'luisteren-examen',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'headphones',

  title: 'Het examen Luisteren (A2 en B1): opzet, tijd en aanpak',
  description:
    'Filmpjes en gesprekken beluisteren en vragen beantwoorden. Hoe het examen Luisteren werkt op A2 en B1, waar de tijd in gaat zitten en hoe je ervoor oefent.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Luisteren',
  eyebrow: 'Taalexamen',

  heroTitle: 'Het examen Luisteren',
  heroSubtitle:
    'Je hoort gesprekken en mededelingen en beantwoordt daar vragen over. Het gaat snel, en je kunt niet terug in de tijd — daarom is dit het onderdeel waar voorbereiding het meest oplevert.',
  readingMinutes: 7,

  articleHtml: `
<h2 id="hoe-ziet-het-eruit">Hoe ziet het examen eruit?</h2>

<p>Je zit achter een computer met een koptelefoon op. Je krijgt filmpjes te zien en teksten te
horen, en daarna vragen met antwoorden om uit te kiezen.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th></th><th>A2</th><th>B1</th></tr></thead>
  <tbody>
    <tr><td><strong>Duur</strong></td><td>45 minuten</td><td>90 minuten</td></tr>
    <tr><td><strong>Waar</strong></td><td>Op de computer, op een DUO-examenlocatie</td><td>Staatsexamen NT2, eigen locaties</td></tr>
    <tr><td><strong>In DUO's oefenexamens</strong></td><td>25 vragen</td><td>zie staatsexamensnt2.nl</td></tr>
    <tr><td><strong>Wat je hoort</strong></td><td>Korte gesprekken, telefoongesprekken, mededelingen, omroepberichten</td><td>Langere gesprekken en langere informatieve teksten</td></tr>
  </tbody>
</table>
</div>

${factTwo('DUO: "Het examen Luisteren op niveau A2 doet u op de computer. U krijgt vragen over filmpjes en u luistert naar teksten. Het examen duurt 45 minuten." Het examen Luisteren op niveau B1 (staatsexamen Nt2) duurt 90 minuten; informatie over de inhoud staat op staatsexamensnt2.nl.', [['inburgeren.nl — Taalexamens', SRC_TAALEXAMENS], ['Staatsexamens NT2', SRC_NT2]], CHECKED)}

${fact('Op het startscherm van DUO’s openbare oefenexamens Luisteren A2 staat: "U moet in dit examen 25 vragen beantwoorden", met een teller van 25 vragen en 45 minuten.', 'inburgeren.nl — Oefenen', SRC_OEFENEN, CHECKED)}

<p>Merk het verschil met Lezen: je hebt <strong>minder tijd voor evenveel vragen</strong>. Dat komt
doordat het geluid zelf tijd kost. Je kunt dus niet lang nadenken.</p>

<h2 id="wat-hoor-je">Wat hoor je precies?</h2>

<p>Op A2 zijn het korte fragmenten uit het dagelijks leven. Bij &eacute;&eacute;n fragment horen
meestal twee of drie vragen.</p>

<div class="guide-cards">
  ${card(I_HEADPHONES, 'Een gesprek tussen twee mensen', 'Aan de balie, bij de dokter, tussen buren, op het werk. Let op wie wat zegt.')}
  ${card(I_HEADPHONES, 'Een telefoongesprek', 'Vaak met een afspraak, een tijd of een adres erin. Cijfers zijn hier het struikelblok.')}
  ${card(I_HEADPHONES, 'Een mededeling', 'Een omroepbericht op het station, een voicemail, een aankondiging in de winkel.')}
  ${card(I_HEADPHONES, 'Een korte uitleg', 'Iemand legt uit hoe iets werkt of wat er gaat gebeuren.')}
</div>

${docent('De meeste fouten bij Luisteren gaan niet over woorden maar over <strong>getallen</strong>: tijden, huisnummers, bedragen, dagen. "Half vier" is niet vier uur, en "over een kwartier" is geen tijdstip maar een verschil. Oefen daar apart op — het is een klein stuk van de taal met een groot aandeel in de vragen.')}

<h2 id="strategie">De strategie: lees vooruit</h2>

<p>Bij Luisteren kun je &eacute;&eacute;n ding doen dat bijna alles bepaalt: <strong>de vraag lezen
voordat het geluid begint</strong>. Dan weet je waar je op moet letten, in plaats van alles te
proberen te onthouden.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Lees de vraag en de antwoorden</h3>
    <p>Wat wordt er gevraagd: een tijd, een reden, een gevoel, een plaats? Dat bepaalt wat je uit het geluid moet vissen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Luister naar de hoofdlijn, niet naar elk woord</h3>
    <p>Je hoeft niet alles te verstaan. Je moet &eacute;&eacute;n ding vinden. Laat de rest langsgaan.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Kies, en ga door</h3>
    <p>Blijf niet piekeren over de vorige vraag terwijl het volgende fragment al loopt. Dat kost je twee vragen in plaats van &eacute;&eacute;n.</p>
  </div></div>
</div>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Doen</p>
    <ul>
      <li>${I_CHECK}<span>Let op signaalwoorden: <em>maar</em>, <em>toch</em>, <em>helaas</em>, <em>eerst</em>, <em>daarna</em>. Daar zit vaak het antwoord.</span></li>
      <li>${I_CHECK}<span>Let op de toon. "Nou…" met aarzeling betekent meestal nee.</span></li>
      <li>${I_CHECK}<span>Controleer je koptelefoon en het volume voordat het examen begint.</span></li>
      <li>${I_CHECK}<span>Vul altijd iets in, ook als je het fragment miste.</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Niet doen</p>
    <ul>
      <li>${I_X}<span>Proberen het hele fragment te vertalen in je hoofd</span></li>
      <li>${I_X}<span>Kiezen voor het antwoord waarin je een woord herkende dat je hoorde — dat is vaak juist de valstrik</span></li>
      <li>${I_X}<span>In paniek raken bij een snelle spreker; de vraag gaat meestal over &eacute;&eacute;n zin</span></li>
    </ul>
  </div>
</div>

<h2 id="valkuil">De grootste valkuil: het herkende woord</h2>

<p>Bij Luisteren worden foute antwoorden vaak gemaakt met woorden die je in het fragment
<em>ook</em> hoorde. Iemand zegt: "ik wilde eerst met de trein, maar nu ga ik met de fiets." De
vraag is hoe hij gaat. Wie "trein" herkent, kiest fout.</p>

<p>Luister daarom altijd de zin af. Het belangrijkste woord in dat voorbeeld is
<strong>maar</strong>.</p>

${note('Heb je een gehoorbeperking? DUO kan het examen aanpassen, bijvoorbeeld met extra tijd of aangepaste apparatuur. Dat vraag je vooraf aan, met een verklaring. Regel dat ruim voordat je je aanmeldt.')}

${fact('Kunt u door een ziekte of een beperking het examen niet op de gewone manier doen, dan kan DUO een aangepast examen toestaan. U vraagt dat vooraf aan bij DUO.', 'inburgeren.nl — Aangepast examen bij ziekte of beperking', SRC_AANGEPAST, CHECKED)}

<h2 id="oefenen">Hoe je oefent</h2>

<p>Luisteren is het onderdeel dat het snelst beter wordt van dagelijkse gewoontes, en het traagst
van boeken.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Zet Nederlands aan, elke dag</h3>
    <p>Radio in de keuken, een podcast in eenvoudig Nederlands, het jeugdjournaal. Ook als je niet alles verstaat: je oor went aan het tempo.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Kijk met Nederlandse ondertiteling</h3>
    <p>Niet met ondertiteling in je eigen taal. Nederlands geluid met Nederlandse tekst koppelt klank aan woord, en dat is precies wat het examen vraagt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Oefen getallen apart</h3>
    <p>Tijden, prijzen, huisnummers, data. Laat iemand ze opnoemen, of gebruik een oefenapp. Tien minuten per dag, twee weken lang.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Doe oefenexamens met koptelefoon</h3>
    <p>Niet via de speaker van je telefoon. Je wilt wennen aan hoe het in de examenzaal klinkt.</p>
  </div></div>
</div>

${docent('Ik hoor vaak: "ik versta Nederlanders in het echt wel, maar op het examen niet." Dat komt door de spanning en door het gebrek aan context — je ziet geen gezicht, je kent de situatie niet. Daar helpt maar &eacute;&eacute;n ding tegen: vaak genoeg oefenen met opnames, tot het niet meer nieuw voelt.')}

${inlineCta('Oefen Luisteren met echte fragmenten', 'Tien vragen met audio, met uitleg na elk antwoord. Zonder account.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>A2: 45 minuten op de computer; B1: 90 minuten (staatsexamen NT2).</li>
  <li>DUO's A2-oefenexamens hebben 25 vragen.</li>
  <li>Lees de vraag v&oacute;&oacute;rdat het geluid begint.</li>
  <li>Pas op voor antwoorden met een woord dat je h&oacute;&oacute;rde maar dat niet klopt.</li>
  <li>Oefen getallen, tijden en data apart.</li>
</ul>`,

  faq: [
    {
      q: 'Hoe lang duurt het examen Luisteren?',
      a: 'Op niveau A2 duurt het 45 minuten, op de computer. Op niveau B1 is het onderdeel van het staatsexamen NT2 en duurt het 90 minuten. Informatie over de inhoud van het B1-examen staat op staatsexamensnt2.nl.',
    },
    {
      q: 'Kan ik een fragment opnieuw beluisteren?',
      a: 'In onze oefenexamens wel: je kunt een fragment zo vaak afspelen als je wilt, zodat je kunt leren waar het misging. Hoe vaak dat in het echte examen kan, publiceert DUO niet. Ga er daarom bij het oefenen op een gegeven moment van uit dat je maar één kans hebt.',
    },
    {
      q: 'Wat is de beste manier om Luisteren te oefenen?',
      a: 'Elke dag Nederlands horen, en dan gericht. Zet de radio of een podcast in eenvoudig Nederlands aan, kijk met Nederlandse ondertiteling in plaats van in je eigen taal, en oefen getallen, tijden en data apart. Doe daarnaast complete oefenexamens met een koptelefoon op.',
    },
    {
      q: 'Ik versta mensen in het echt wel, maar op het examen niet. Hoe kan dat?',
      a: 'Omdat je in het echt het gezicht ziet, de situatie kent en kunt vragen om herhaling. Op het examen valt dat allemaal weg en komt er tijdsdruk bij. Dat is te trainen: oefen met opnames tot de situatie niet nieuw meer voelt.',
    },
    {
      q: 'Ik heb een gehoorbeperking. Kan ik een aangepast examen krijgen?',
      a: 'Ja, dat kan. Kun je door ziekte of een beperking het examen niet op de gewone manier doen, dan kan DUO een aangepast examen toestaan, bijvoorbeeld met extra tijd of andere apparatuur. Je vraagt dat vooraf aan bij DUO, ruim voordat je je voor een datum aanmeldt.',
    },
  ],

  related: ['taalexamens-a2-b1', 'lezen-examen', 'spreken-examen'],
  relatedPosts: ['luisteren-examen-inburgering-a2', 'inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'Oefen het onderdeel Luisteren',
  ctaDesc: 'Gratis proefexamen van tien vragen met audio, met uitleg na elk antwoord.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
