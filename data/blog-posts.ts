/**
 * Blog posts.
 *
 * Content is data, not routes: `app/[locale]/(main)/blog/[slug]/page.tsx` generates all
 * metadata, canonical, hreflang and JSON-LD from these objects. Adding a post means adding
 * an entry here — never a new route file.
 *
 * Read `SEO/README.md` before writing one. The hard rule: every number in `articleHtml`
 * must come from `SEO/facts.md` and be wrapped in a fact-box (see the `fact-box` markup
 * convention below), carrying its source URL and consulted-on date.
 *
 * A locale whose `articleHtml` is missing is `noindex`ed by the route rather than shipping a
 * thin duplicate of the Dutch body — see `hasTranslation()`.
 */

import { contentSlugParam, parseContentSlug } from '@/i18n/content-slugs';

/**
 * Per-locale content. Anything omitted falls back to the Dutch fields on BlogPost.
 *
 * **Geen `slug`.** Die stond hier tot 15-09 wel, maar werd door geen enkele post gevuld; de
 * vertaalde slug staat nu in `i18n/content-slugs.ts`, samen met die van de gidsen en buiten
 * het bereik van de browserbundel. Zie de kop van dat bestand.
 *
 * `breadcrumb`, `dateLabel`, `imageAlt` en `relatedPosts` zijn op 15-09 toegevoegd. Ze stonden
 * alleen op `BlogPost` en werden dus onvertaald gerenderd: een Engelse pagina toonde een
 * Nederlandse kruimel, "12 augustus 2026" onder de kop, Nederlandse alt-tekst en drie
 * Nederlandse kaarten onderaan. `GuideLocale` had deze drie al — dit is diezelfde vorm.
 */
type PostLocale = {
  heroTitle: string;
  description: string;
  category: string;
  breadcrumb?: string;
  dateLabel?: string;
  imageAlt?: string;
  relatedPosts?: { slug: string; title: string; desc: string }[];
  heroSubtitle?: string;
  articleHtml?: string;
  sidebarHtml?: string;
  ctaTitle?: string;
  ctaDesc?: string;
  ctaLabel?: string;
  faq?: FaqItem[];
};

export type FaqItem = { q: string; a: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  /** Stable key for card styling — `category` is translated, so it cannot be the style key. */
  categoryKey: 'gids' | 'tips' | 'uitleg';
  categoryColor: 'blue' | 'orange';
  datePublished: string;
  /** Real last-review date. Shown as "laatst gecontroleerd" and used for schema + sitemap. */
  dateModified: string;
  dateLabel: string;
  breadcrumb: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Hero image, served from public/. Also the OG and BlogPosting image. */
  image: string;
  imageAlt: string;
  readingMinutes: number;
  articleHtml: string;
  sidebarHtml: string;
  /** Feeds both the on-page FAQ block and FAQPage JSON-LD. */
  faq: FaqItem[];
  /** `slug` is another post's Dutch slug — the route resolves it per locale. */
  relatedPosts: { slug: string; title: string; desc: string }[];
  ctaTitle: string;
  ctaDesc: string;
  /**
   * Must be a pathname declared in `i18n/routing.ts`. `/oefenvragen` is feature-flagged off —
   * do not point a CTA at it, and never at a bare `#anchor` (the old `/#oefenvragen` target
   * did not exist on the homepage at all).
   */
  ctaHref: '/oefenen' | '/premium' | '/docent';
  ctaLabel: string;
  translations?: Partial<Record<'en' | 'ar', PostLocale>>;
};

/** Resolved content for one locale, with Dutch as the fallback for every optional field. */
export type ResolvedPost = {
  heroTitle: string;
  description: string;
  category: string;
  heroSubtitle: string;
  articleHtml: string;
  sidebarHtml: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaLabel: string;
  faq: FaqItem[];
  breadcrumb: string;
  dateLabel: string;
  imageAlt: string;
  relatedPosts: { slug: string; title: string; desc: string }[];
};

/**
 * The posts. Newest content lives at the bottom; the index sorts by date.
 * `articleHtml` is styled by the `.article-body` rules in `app/globals.css`.
 */
const SRC_INHOUD = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag.jsp';
const SRC_BETALEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';

/**
 * Renders the fact-box markup documented in app/globals.css. Keeps sources uniform.
 * One per locale so the "Source / consulted on" line is in the reader's language while the
 * cited page itself stays Dutch (DUO publishes no English or Arabic version of these).
 */
function fact(claim: string, sourceLabel: string, url: string, checked = '28-07-2026'): string {
  return `<div class="fact-box"><p class="fact-box-claim">${claim}</p>` +
    `<p class="fact-box-source">Bron: <a href="${url}" target="_blank" rel="noopener">${sourceLabel}</a> — geraadpleegd ${checked}</p></div>`;
}

function factEn(claim: string, sourceLabel: string, url: string, checked = '28-07-2026'): string {
  return `<div class="fact-box"><p class="fact-box-claim">${claim}</p>` +
    `<p class="fact-box-source">Source: <a href="${url}" target="_blank" rel="noopener">${sourceLabel}</a> — consulted ${checked} (Dutch)</p></div>`;
}

function factAr(claim: string, sourceLabel: string, url: string, checked = '28-07-2026'): string {
  return `<div class="fact-box"><p class="fact-box-claim">${claim}</p>` +
    `<p class="fact-box-source">المصدر: <a href="${url}" target="_blank" rel="noopener">${sourceLabel}</a> — تم الرجوع إليه في ${checked} (بالهولندية)</p></div>`;
}

/**
 * De observatie van de docent, in haar eigen woorden. Dit blok is de reden dat deze artikelen
 * niet na te maken zijn: het is eerstehands materiaal uit haar nakijkwerk, geen modeltekst.
 * Markup en avatar zijn dezelfde als in `data/guides/kit.ts`.
 */
function docentNote(text: string, role = 'NT2-docent'): string {
  return `<div class="docent-note"><img src="/images/amber-van-der-zalm-264.webp" alt="" width="44" height="44" class="docent-note-avatar" loading="lazy" />` +
    `<div><p class="docent-note-name">Amber van der Zalm \u00b7 ${role}</p><p>${text}</p></div></div>`;
}

const ICON_X = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

/**
 * Fout naast goed, in twee kolommen. Op een telefoon vallen ze onder elkaar — fout eerst,
 * want dat is de zin die de lezer herkent. De kruisjes en vinkjes zijn lucide-paden: het
 * projectverbod op emoji geldt ook binnen een artikel.
 */
function foutGoed(fout: string[], goed: string[], labels: [string, string] = ['Fout', 'Goed']): string {
  const li = (rows: string[], icon: string) => rows.map(r => `<li>${icon}<span>${r}</span></li>`).join('');
  return `<div class="yesno-grid">` +
    `<div class="yesno-col no"><p class="yesno-title">${labels[0]}</p><ul>${li(fout, ICON_X)}</ul></div>` +
    `<div class="yesno-col yes"><p class="yesno-title">${labels[1]}</p><ul>${li(goed, ICON_CHECK)}</ul></div>` +
    `</div>`;
}

/**
 * De voorbeeldzinnen blijven in elke taal Nederlands — je vertaalt "Ik voel me goed" niet, dat
 * is de zin die geleerd wordt. In het Arabische artikel staat die zin dus LTR in een RTL-regel,
 * en zonder `dir` zet de bidi-algoritme de punt aan de verkeerde kant. Vandaar deze wrapper.
 */
function nlEx(s: string): string {
  return `<span dir="ltr" lang="nl">${s}</span>`;
}

const POSTS: BlogPost[] = [
  // ───────────────────────────────────────────────────────────── 4. ZAKKEN / HERKANSEN
  {
    slug: 'inburgeringsexamen-zakken-herkansen',
    title: 'Gezakt voor het inburgeringsexamen? Dit gebeurt er nu',
    description: 'Gezakt voor een onderdeel van het inburgeringsexamen? Je doet alleen dat onderdeel opnieuw. Zo werkt herkansen, wat het kost en wanneer je uitslag komt.',
    category: 'Gids & Informatie',
    categoryKey: 'gids',
    categoryColor: 'blue',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
    dateLabel: '25 juli 2026',
    breadcrumb: 'Gezakt en herkansen',
    heroTitle: 'Gezakt voor het inburgeringsexamen? Dit gebeurt er nu',
    heroSubtitle: 'Eén onderdeel niet gehaald is geen ramp. Je doet alleen dat onderdeel opnieuw — de rest blijft staan.',
    image: '/images/blog/inburgeringsexamen-zakken-herkansen.jpg',
    imageAlt: 'Persoon leest een brief met de uitslag van het inburgeringsexamen aan een keukentafel',
    readingMinutes: 6,
    faq: [
      {
        q: 'Moet ik alle onderdelen opnieuw doen als ik voor één zak?',
        a: 'Nee. Je doet alleen het onderdeel opnieuw dat je niet hebt gehaald. Elk onderdeel is een apart examen met een eigen uitslag, dus wat je hebt gehaald blijft staan.',
      },
      {
        q: 'Hoe vaak mag je het inburgeringsexamen herkansen?',
        a: 'DUO noemt geen maximum aantal pogingen — niet op inburgeren.nl en niet in het examenreglement. In de praktijk is je inburgeringstermijn de grens. Schrijf dus niet op dat het onbeperkt is, maar ga er ook niet van uit dat je na twee keer stopt.',
      },
      {
        q: 'Wat kost een herkansing?',
        a: 'Een examenonderdeel kost €50 op het moment van schrijven. Ben je asielstatushouder? Dan zijn de eerste 2 pogingen van elk examen gratis. Heb je meer pogingen nodig, dan betaal je die zelf en je kunt daarvoor niet lenen bij DUO. Check altijd de actuele prijs bij DUO.',
      },
      {
        q: 'Wanneer krijg ik de uitslag van mijn examen?',
        a: 'Binnen 8 weken na het examen, per brief. Je uitslag staat ook in Mijn Inburgering. Bij taalexamens op A2 en bij de kennisexamens geldt die termijn van 8 weken.',
      },
      {
        q: 'Kan ik mijn examen bekijken om te zien wat ik fout deed?',
        a: 'Nee. In het examenreglement staat letterlijk dat een afgelegd en beoordeeld examen niet door de kandidaat kan worden ingezien. Je krijgt wel een cijfer per onderdeel.',
      },
      {
        q: 'Hoeveel vragen had ik goed moeten hebben?',
        a: 'Dat maakt DUO niet bekend. De zak-slaaggrens is een cesuur die de minister vaststelt en die niet wordt gepubliceerd. Getallen als "18 van de 25" komen niet van DUO en spreken elkaar tegen.',
      },
      {
        q: 'Wat als ik niet op mijn examen kan komen?',
        a: 'Je kunt je examendatum tot 7 dagen vooraf veranderen. Kom je zonder afmelden niet opdagen, dan moet je opnieuw betalen. Bij een heel bijzondere situatie kun je DUO binnen 10 dagen na de examendatum schriftelijk om een gratis examen vragen.',
      },
    ],
    articleHtml: `
<p>Ben je <strong>gezakt voor het inburgeringsexamen</strong>? Dan hoef je niet alles opnieuw te doen. Je doet <strong>alleen het onderdeel opnieuw dat je niet hebt gehaald</strong>. Elk onderdeel is een apart examen met een eigen uitslag. Heb je Lezen, Schrijven en Spreken gehaald en alleen Luisteren niet, dan herkans je alleen Luisteren.</p>

<p>Dat is het belangrijkste om te weten, en het is de vraag die mij het vaakst wordt gesteld. Hieronder lees je hoe herkansen werkt, wat het kost, en wat je uitslagbrief eigenlijk betekent.</p>

<div class="article-toc">
  <p class="article-toc-title">In dit artikel</p>
  <ol>
    <li><a href="#een-onderdeel">Alleen het onderdeel dat je niet haalde</a></li>
    <li><a href="#hoe-vaak">Hoe vaak mag je herkansen?</a></li>
    <li><a href="#kosten">Wat kost een herkansing?</a></li>
    <li><a href="#uitslag">Je uitslag: wat staat er precies?</a></li>
    <li><a href="#waarom">Waarom mensen zakken</a></li>
    <li><a href="#volgende-keer">Wat je nu anders doet</a></li>
    <li><a href="#termijn">Je termijn en wat als die bijna om is</a></li>
    <li><a href="#niet-komen">Als je niet kunt komen</a></li>
  </ol>
</div>

<h2 id="een-onderdeel">Alleen het onderdeel dat je niet haalde</h2>

<p>Het inburgeringsexamen is geen één groot examen. Het zijn losse examens: Lezen, Luisteren, Schrijven, Spreken en KNM. Je meldt je per onderdeel aan, je betaalt per onderdeel, en je krijgt per onderdeel een uitslag.</p>

<p>Gevolg: <strong>wat je hebt gehaald, blijft gehaald</strong>. Je hoeft een geslaagd onderdeel nooit opnieuw te doen omdat je een ander onderdeel niet haalde.</p>

<div class="info-box info-box-green">
  <p>Praktisch betekent dit: je kunt de onderdelen spreiden. Veel mensen doen eerst Lezen en Luisteren, en later Schrijven en Spreken. Zo heb je minder om je in één keer op voor te bereiden.</p>
</div>

<h2 id="hoe-vaak">Hoe vaak mag je herkansen?</h2>

<p>Hier moet ik eerlijk zijn: <strong>DUO noemt geen maximum</strong>. Ik heb het gezocht op inburgeren.nl en in het volledige examenreglement. Er staat nergens een maximumaantal pogingen.</p>

<p>Je vindt op internet allebei de uitersten: "je mag onbeperkt herkansen" en "je mag maar twee keer". Voor geen van beide is een officiële bron te vinden. Wat er wél geldt, is je <strong>inburgeringstermijn</strong> — onder de Wet inburgering 2021 is dat in de B1-route maximaal 3 jaar. Dat is in de praktijk je grens.</p>

<p>Wat DUO wél duidelijk zegt, gaat over geld, niet over aantallen:</p>

${fact('"De eerste 2 pogingen van elk examen zijn gratis." Dat geldt voor asielstatushouders. "Hebt u meer dan 2 pogingen nodig? Dan moet u de extra pogingen betalen. U kunt geen geld lenen bij DUO."', 'inburgeren.nl — hoeveel kost inburgeren', SRC_BETALEN)}

<p>Dus: de twee gratis pogingen zijn niet een limiet op het aantal keren dat je mag herkansen. Het is een limiet op wat DUO betaalt.</p>

<h2 id="kosten">Wat kost een herkansing?</h2>

<p>Een examenonderdeel kost <strong>€50</strong> op het moment van schrijven. Deze bedragen kunnen veranderen, dus controleer altijd de actuele prijs bij DUO zelf.</p>

${fact('Per examenonderdeel €50 (Lezen, Luisteren, Schrijven, Spreken en KNM), totaal €250 onder de Wet 2021. Onder de Wet 2013 komt ONA erbij voor €40, totaal €290. Prijzen kunnen wijzigen.', 'inburgeren.nl — hoeveel kost inburgeren', SRC_BETALEN)}

<p>Ben je <strong>asielstatushouder</strong>? Dan zijn je eerste 2 pogingen per examen gratis. Let op één uitzondering die DUO noemt: dat geldt niet als je examen doet op een lager niveau dan in je PIP staat.</p>

<p>Voor extra pogingen kun je <strong>niet lenen bij DUO</strong>. Dat is een reden om een herkansing goed voor te bereiden in plaats van er snel weer in te stappen.</p>


<!--uitleg:herkansen-pogingen-->

<h2 id="uitslag">Je uitslag: wat staat er precies?</h2>

<p>Je uitslag komt <strong>binnen 8 weken</strong> na het examen, per brief. Hij staat ook in Mijn Inburgering.</p>

${fact('"De uitslag wordt schriftelijk, binnen 8 weken na het examen, aan de kandidaat kenbaar gemaakt. De uitslag wordt ook weergegeven in Mijn Inburgering."', 'DUO Examenreglement, artikel 16 lid 3', SRC_REGLEMENT)}

<p>In de brief staat "geslaagd" of "niet geslaagd", plus een <strong>cijfer per onderdeel</strong>. Wat er niet in staat, is welke vragen je fout had. En je kunt je examen ook niet opvragen:</p>

${fact('"Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat."', 'DUO Examenreglement, artikel 14 lid 3', SRC_REGLEMENT)}

<p>Dat voelt onrechtvaardig, en ik begrijp dat. Maar het heeft een praktisch gevolg voor jou: <strong>je moet zelf uitzoeken waar het misging</strong>. Het cijfer vertelt je hoe dicht je erbij zat, niet waarom.</p>

<p>En hoeveel je goed had moeten hebben? Dat maakt DUO niet bekend. De grens is een cesuur die de minister vaststelt en die niet wordt gepubliceerd. De getallen die je online vindt — "18 van de 25", "500 punten" — komen niet van DUO en spreken elkaar tegen. Meer daarover in <a href="/nl/taalexamens/taalexamens-a2-b1">de gids over de vier taalexamens</a>.</p>

<h2 id="waarom">Waarom mensen zakken</h2>

<p>Na tien jaar lesgeven zie ik bijna altijd dezelfde oorzaken. Bijna nooit is het "mijn Nederlands is te slecht".</p>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>De tijd.</strong> Bij Lezen heb je 65 minuten voor 25 vragen. Wie elke tekst helemaal leest, komt niet aan het eind.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>Het format was nieuw.</strong> Wie nooit een compleet oefenexamen met een klok heeft gedaan, verliest tijd aan verbazing.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>De pen bij Schrijven.</strong> Schrijven is met pen en papier, geen toetsenbord. Dat weten veel mensen pas op de examendag.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>Terugspoelen bij Luisteren.</strong> Thuis spoel je terug, op het examen niet. Dan lijkt het examen ineens veel sneller te gaan.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>Te weinig oefenexamens.</strong> DUO geeft er 3 of 4 per onderdeel. Dat is genoeg om het format te zien, niet om het te beheersen.</p></div></div>

<h2 id="volgende-keer">Wat je nu anders doet</h2>

<p>Je hebt een groot voordeel bij een herkansing: je weet nu hoe het examen voelt. Gebruik dat.</p>

<ol>
  <li><strong>Bepaal welk onderdeel het was</strong> en oefen alleen dat. Je hoeft je energie niet te verdelen.</li>
  <li><strong>Doe altijd complete oefenexamens</strong>, met de klok erbij. Losse vragen oefenen is niet hetzelfde.</li>
  <li><strong>Oefen op een computer</strong>, niet op je telefoon. DUO adviseert dat zelf.</li>
  <li><strong>Kijk na welke vragen je fout had</strong> en waarom. Dat is precies wat DUO je niet geeft, en waar je het meest van leert.</li>
  <li><strong>Wacht met aanmelden</strong> tot je oefenexamens goed gaan. Een herkansing kost geld en tijd.</li>
</ol>

<h2 id="termijn">Je termijn en wat als die bijna om is</h2>

<p>Omdat DUO geen maximumaantal pogingen noemt, is je <strong>inburgeringstermijn</strong> in de praktijk de echte grens. Onder de Wet inburgering 2021 is die in de B1-route maximaal 3 jaar.</p>

<!--uitleg:herkansen-termijn-->

<p>Loopt je termijn af en heb je nog niet alles gehaald? Ga dan niet afwachten. Twee dingen zijn dan belangrijk:</p>

<ol>
  <li><strong>Neem contact op met je gemeente.</strong> De gemeente begeleidt je inburgering en stelt samen met jou je PIP op. Zij weten wat er in jouw situatie mogelijk is.</li>
  <li><strong>Kijk of een vrijstelling of ontheffing voor jou geldt.</strong> DUO heeft daar een aparte pagina over, met verschillende situaties: ziekte of een handicap, een diploma dat je al hebt, een Nederlandse opleiding die je volgt, of lang in Nederland gewoond en gewerkt hebben.</li>
</ol>

<div class="info-box">
  <p>De precieze voorwaarden per vrijstelling verschillen sterk, en ze staan elk op een eigen DUO-pagina. Ik noem hier bewust geen getallen of termijnen: die wil je van de officiële pagina lezen die op jouw situatie past, niet van een blog. Begin bij <a href="https://www.inburgeren.nl/minder-of-geen-examens/" target="_blank" rel="noopener">Minder of geen examens</a> op inburgeren.nl.</p>
</div>

<p>Reken dus niet op eindeloos herkansen tot het lukt. Plan liever terug vanaf je einddatum: hoeveel pogingen passen er nog, met 8 weken wachttijd per uitslag?</p>

<h2 id="niet-komen">Als je niet kunt komen</h2>

<p>Kun je op de examendag niet? Regel het op tijd, want dat scheelt geld.</p>

<ul>
  <li>Je kunt je examendatum, tijd of locatie tot <strong>7 dagen</strong> vooraf veranderen — online in Mijn Inburgering of per brief of e-mail.</li>
  <li>Annuleer je uiterlijk 7 dagen vooraf, dan heb je recht op restitutie van het examengeld. Had je recht op een kosteloze poging, dan houd je die.</li>
  <li>Kom je zonder afmelden niet opdagen? Dan moet je opnieuw betalen.</li>
  <li>Was er een <strong>heel bijzondere situatie</strong>? Dan kun je DUO binnen 10 dagen na de examendatum schriftelijk om een gratis examen vragen, met bewijsstukken. DUO beoordeelt dat.</li>
</ul>

<p>Klaar voor de volgende poging? <a href="/nl/oefenen">Doe eerst een gratis oefenexamen</a> en kijk waar je nu staat. Lees ook de gids over <a href="/nl/taalexamens/lezen-examen">het examen Lezen</a> of <a href="/nl/taalexamens/luisteren-examen">het examen Luisteren</a>, afhankelijk van welk onderdeel je opnieuw doet.</p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Kort samengevat</h3>
  <table class="facts-table">
    <tr><td>Opnieuw doen</td><td>alleen dat onderdeel</td></tr>
    <tr><td>Maximum pogingen</td><td>niet bekend</td></tr>
    <tr><td>Kosten per onderdeel</td><td>€50</td></tr>
    <tr><td>Gratis pogingen</td><td>2 (statushouders)</td></tr>
    <tr><td>Uitslag</td><td>binnen 8 weken</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'taalniveaus-a1-a2-b1-nederlands', title: 'Taalniveaus A1, A2 en B1', desc: 'Wat het verschil is, en welk niveau jij moet halen' },
      { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'De 8 fouten bij Schrijven A2', desc: 'Hoofdletters, komma’s, tijden en ‘u’ of ‘je’' },
      { slug: 'want-of-omdat', title: 'Want of omdat?', desc: 'Waarom ‘want’ op het examen bijna altijd de slimmere keuze is' },
    ],
    ctaTitle: 'Bereid je herkansing goed voor',
    ctaDesc: 'Oefen met 10 examens per onderdeel, met uitleg per vraag — zodat je weet waarom een antwoord fout was.',
    ctaHref: '/oefenen',
    ctaLabel: 'Start gratis oefenexamen',
    translations: {
      en: {
        heroTitle: 'Failed the integration exam? Here is what happens now',
        description: 'Failed one part of the Dutch integration exam? You only retake that part. How retakes work, what they cost and when your result arrives.',
        category: 'Guide & Information',
        breadcrumb: 'Failing and retaking',
        dateLabel: '25 July 2026',
        imageAlt: 'Person reading a letter with the result of the integration exam at a kitchen table',
        relatedPosts: [
          { slug: 'taalniveaus-a1-a2-b1-nederlands', title: 'Language levels A1, A2 and B1', desc: 'What the difference is, and which level you need' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'The 8 mistakes on Writing A2', desc: 'Capitals, commas, times and ‘u’ versus ‘je’' },
          { slug: 'want-of-omdat', title: 'Want or omdat?', desc: 'Why ‘want’ is almost always the smarter choice on the exam' },
        ],
        heroSubtitle: 'Failing one part is not a disaster. You retake only that part — everything you passed still counts.',
        ctaTitle: 'Prepare your retake properly',
        ctaDesc: 'Practise with 10 exams per part, each with an explanation — so you know why an answer was wrong.',
        ctaLabel: 'Start a free practice exam',
        faq: [
          { q: 'Do I have to retake everything if I fail one part?', a: 'No. You only retake the part you did not pass. Each part is a separate exam with its own result, so anything you passed stays passed.' },
          { q: 'How many times can you retake the integration exam?', a: 'DUO states no maximum — not on inburgeren.nl and not in the exam regulations. In practice your integration deadline is the limit. So do not assume it is unlimited, but do not assume you stop after two either.' },
          { q: 'What does a retake cost?', a: 'An exam part costs €50 at the time of writing. If you are an asylum status holder, the first 2 attempts at each exam are free. Beyond that you pay yourself and cannot borrow from DUO for it. Always check the current price with DUO.' },
          { q: 'When do I get my result?', a: 'Within 8 weeks of the exam, by letter. It also appears in Mijn Inburgering. That 8-week period applies to A2 language exams and the knowledge exams.' },
          { q: 'Can I review my exam to see what I got wrong?', a: 'No. The exam regulations state explicitly that a completed and marked exam cannot be reviewed by the candidate. You do get a grade per part.' },
          { q: 'How many answers should I have had right?', a: 'DUO does not publish it. The pass mark is a cesuur set by the Minister and is not made public. Figures like "18 out of 25" do not come from DUO and contradict each other.' },
          { q: 'What if I cannot attend my exam?', a: 'You can change your exam date up to 7 days beforehand. If you simply do not show up, you pay again. In exceptional circumstances you can write to DUO within 10 days of the exam date to request a free exam.' },
        ],
        articleHtml: `
<p>Have you <strong>failed the integration exam</strong>? You do not have to redo everything. You <strong>only retake the part you did not pass</strong>. Each part is a separate exam with its own result. If you passed Reading, Writing and Speaking and only failed Listening, you retake Listening alone.</p>

<p>That is the single most important thing to know, and the question I am asked most often. Below: how retakes work, what they cost, and what your result letter actually means.</p>

<div class="article-toc">
  <p class="article-toc-title">In this article</p>
  <ol>
    <li><a href="#one-part">Only the part you failed</a></li>
    <li><a href="#how-often">How many retakes are allowed?</a></li>
    <li><a href="#cost">What does a retake cost?</a></li>
    <li><a href="#result">Your result: what does it say?</a></li>
    <li><a href="#why">Why people fail</a></li>
    <li><a href="#next-time">What to do differently</a></li>
    <li><a href="#deadline">Your deadline</a></li>
  </ol>
</div>

<h2 id="one-part">Only the part you failed</h2>

<p>The integration exam is not one big exam. It is a set of separate exams: Reading, Listening, Writing, Speaking and KNM. You register per part, you pay per part, and you get a result per part.</p>

<p>The consequence: <strong>whatever you passed stays passed</strong>. You never have to redo a passed part because you failed another one.</p>

<div class="info-box info-box-green">
  <p>Practically, this means you can spread the parts out. Many people do Reading and Listening first, then Writing and Speaking later, so there is less to prepare at once.</p>
</div>

<h2 id="how-often">How many retakes are allowed?</h2>

<p>Here I have to be straight with you: <strong>DUO states no maximum</strong>. I looked on inburgeren.nl and in the full exam regulations. There is no maximum number of attempts anywhere.</p>

<p>Online you will find both extremes — "unlimited retakes" and "only two attempts". Neither has an official source. What does apply is your <strong>integration deadline</strong>: under the Wet inburgering 2021 the B1 route allows a maximum of 3 years. In practice, that is your limit.</p>

<p>What DUO does state clearly concerns money, not counts:</p>

${factEn('"De eerste 2 pogingen van elk examen zijn gratis" — the first 2 attempts at each exam are free (for asylum status holders). "Hebt u meer dan 2 pogingen nodig? Dan moet u de extra pogingen betalen. U kunt geen geld lenen bij DUO."', 'inburgeren.nl — cost of integrating', SRC_BETALEN)}

<p>So the two free attempts are not a cap on how often you may retake. They are a cap on what DUO pays for.</p>

<h2 id="cost">What does a retake cost?</h2>

<p>An exam part costs <strong>€50</strong> at the time of writing. These amounts can change, so always check the current price with DUO.</p>

${factEn('€50 per exam part (Reading, Listening, Writing, Speaking and KNM), €250 in total under the Wet 2021. Under the Wet 2013 ONA is added at €40, €290 in total. Prices may change.', 'inburgeren.nl — cost of integrating', SRC_BETALEN)}

<p>If you are an <strong>asylum status holder</strong>, your first 2 attempts per exam are free. One exception DUO names: this does not apply if you sit an exam at a lower level than your PIP specifies.</p>

<p>For extra attempts you <strong>cannot borrow from DUO</strong>. That is a good reason to prepare a retake properly rather than rushing back in.</p>


<!--uitleg:herkansen-pogingen-->

<h2 id="result">Your result: what does it say?</h2>

${factEn('"De uitslag wordt schriftelijk, binnen 8 weken na het examen, aan de kandidaat kenbaar gemaakt." — the result is sent in writing within 8 weeks, and also appears in Mijn Inburgering.', 'DUO exam regulations, article 16(3)', SRC_REGLEMENT)}

<p>The letter says "pass" or "fail" plus a <strong>grade per part</strong>. What it does not say is which questions you got wrong. And you cannot request your exam either:</p>

${factEn('"Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat." — a completed, marked exam cannot be reviewed by the candidate.', 'DUO exam regulations, article 14(3)', SRC_REGLEMENT)}

<p>That feels unfair, and I understand why. But it has a practical consequence: <strong>you have to work out for yourself where it went wrong</strong>. The grade tells you how close you were, not why.</p>

<p>And how much you needed correct? DUO does not publish it — the boundary is a cesuur set by the Minister. The figures you find online do not come from DUO and contradict each other. More on that in <a href="/en/language-exams/language-exams-a2-b1">the guide to the four language exams</a>.</p>

<h2 id="why">Why people fail</h2>

<p>After ten years of teaching I nearly always see the same causes. Almost never "my Dutch is too weak".</p>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>Time.</strong> Reading gives you 65 minutes for 25 questions. Read every text in full and you will not finish.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>The format was new.</strong> If you have never done a full practice exam against a clock, you lose time to surprise.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>The pen in Writing.</strong> Writing is pen and paper, not a keyboard. Many people discover that on exam day.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>Rewinding in Listening.</strong> At home you rewind; in the exam you cannot. Suddenly it all seems much faster.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>Too few practice exams.</strong> DUO gives 3 or 4 per part. Enough to see the format, not to master it.</p></div></div>

<h2 id="next-time">What to do differently</h2>

<p>You have one big advantage for a retake: you now know how the exam feels. Use it.</p>

<ol>
  <li><strong>Identify the part</strong> and practise only that one.</li>
  <li><strong>Always do complete practice exams</strong>, timed. Loose questions are not the same thing.</li>
  <li><strong>Practise on a computer</strong>, not a phone — DUO advises this itself.</li>
  <li><strong>Review which questions you got wrong, and why.</strong> That is exactly what DUO does not give you, and where the learning is.</li>
  <li><strong>Wait to register</strong> until your practice exams go well. A retake costs money and time.</li>
</ol>

<h2 id="deadline">Your deadline</h2>

<p>Because DUO names no maximum number of attempts, your <strong>integration deadline</strong> is the real limit — a maximum of 3 years in the B1 route.</p>

<!--uitleg:herkansen-termijn-->

<p>If your deadline is approaching and you have not passed everything, do not wait. Contact your municipality: they guide your integration and draw up your PIP with you. Also check whether an exemption applies to you — DUO has a dedicated page covering illness or disability, a diploma you already hold, Dutch education you are following, or having lived and worked here for a long time.</p>

<div class="info-box">
  <p>The conditions differ substantially per exemption and each has its own DUO page. I deliberately quote no figures or periods here: you want those from the official page that fits your situation, not from a blog. Start at <a href="https://www.inburgeren.nl/minder-of-geen-examens/" target="_blank" rel="noopener">Minder of geen examens</a> on inburgeren.nl.</p>
</div>

<p>Plan backwards from your end date: how many attempts still fit, allowing 8 weeks for each result?</p>

<p>Ready for the next attempt? <a href="/en/practice">Take a free practice exam</a> and see where you stand.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">In short</h3>
  <table class="facts-table">
    <tr><td>Retake</td><td>only that part</td></tr>
    <tr><td>Max attempts</td><td>not published</td></tr>
    <tr><td>Cost per part</td><td>€50</td></tr>
    <tr><td>Free attempts</td><td>2 (status holders)</td></tr>
    <tr><td>Result</td><td>within 8 weeks</td></tr>
  </table>
</div>`,
      },
      ar: {
        heroTitle: 'رسبت في امتحان الاندماج؟ إليك ما يحدث الآن',
        description: 'رسبت في جزء واحد من امتحان الاندماج الهولندي؟ تعيد ذلك الجزء وحده. كيف تسير الإعادة، وكم تكلّف، ومتى تصل نتيجتك.',
        category: 'دليل ومعلومات',
        breadcrumb: 'الرسوب وإعادة الامتحان',
        dateLabel: '25 يوليو 2026',
        imageAlt: 'شخص يقرأ رسالة تحمل نتيجة امتحان الاندماج على طاولة المطبخ',
        relatedPosts: [
          { slug: 'taalniveaus-a1-a2-b1-nederlands', title: 'مستويات اللغة A1 وA2 وB1', desc: 'ما الفرق بينها، وأي مستوى عليك بلوغه' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'الأخطاء الثمانية في الكتابة A2', desc: 'الحروف الكبيرة والفواصل والوقت و«u» أو «je»' },
          { slug: 'want-of-omdat', title: 'want أم omdat؟', desc: 'لماذا يكون «want» الخيار الأذكى في الامتحان غالبًا' },
        ],
        heroSubtitle: 'الرسوب في جزء واحد ليس كارثة. فأنت تعيد ذلك الجزء وحده — وكل ما نجحت فيه يبقى محسوبًا.',
        ctaTitle: 'حضّر لإعادتك كما ينبغي',
        ctaDesc: 'تدرّب مع 10 امتحانات لكل جزء، مع شرح لكل منها — لتعرف لماذا كانت الإجابة خاطئة.',
        ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
        faq: [
          { q: 'هل يجب أن أعيد كل شيء إن رسبت في جزء واحد؟', a: 'لا. تعيد فقط الجزء الذي لم تنجح فيه. فكل جزء امتحان مستقل بنتيجة خاصة به، وبالتالي يبقى كل ما نجحت فيه ناجحًا.' },
          { q: 'كم مرة يمكن إعادة امتحان الاندماج؟', a: 'لا تذكر DUO حدًا أقصى — لا على inburgeren.nl ولا في لائحة الامتحانات. وعمليًا فإن مهلة اندماجك هي الحد. لذا لا تفترض أن العدد غير محدود، ولا تفترض أيضًا أنك تتوقف بعد محاولتين.' },
          { q: 'كم تكلّف الإعادة؟', a: 'يكلّف جزء الامتحان 50 يورو وقت كتابة هذا المقال. وإن كنت حاصلاً على وضع لجوء، فأول محاولتين في كل امتحان مجانيتان. وما بعدهما تدفعه بنفسك ولا يمكنك الاقتراض من DUO لأجله. تحقّق دائمًا من السعر الحالي لدى DUO.' },
          { q: 'متى أحصل على نتيجتي؟', a: 'خلال 8 أسابيع من الامتحان، برسالة. وتظهر أيضًا في Mijn Inburgering. وتنطبق مدة الأسابيع الثمانية هذه على امتحانات اللغة A2 وامتحانات المعرفة.' },
          { q: 'هل يمكنني الاطلاع على امتحاني لأرى أخطائي؟', a: 'لا. تنص لائحة الامتحانات صراحةً على أن الامتحان بعد أدائه وتصحيحه لا يمكن أن يطّلع عليه الممتحَن. لكنك تحصل على درجة لكل جزء.' },
          { q: 'كم إجابة صحيحة كان ينبغي أن أحقق؟', a: 'لا تنشر DUO ذلك. فحدّ النجاح عتبة يحددها الوزير ولا يُعلن عنها. أما أرقام مثل «18 من 25» فليست من DUO وهي متناقضة فيما بينها.' },
          { q: 'ماذا لو لم أتمكن من حضور امتحاني؟', a: 'يمكنك تغيير موعد امتحانك حتى 7 أيام قبله. وإن لم تحضر ببساطة، فستدفع من جديد. وفي ظروف استثنائية يمكنك مراسلة DUO خلال 10 أيام من تاريخ الامتحان لطلب امتحان مجاني.' },
        ],
        articleHtml: `
<p>هل <strong>رسبت في امتحان الاندماج</strong>؟ لست مضطرًا إلى إعادة كل شيء. فأنت <strong>تعيد فقط الجزء الذي لم تنجح فيه</strong>. فكل جزء امتحان مستقل بنتيجة خاصة به. فإن نجحت في القراءة والكتابة والتحدث ورسبت في الاستماع وحده، فإنك تعيد الاستماع فقط.</p>

<p>وهذا أهم ما ينبغي أن تعرفه، وهو السؤال الذي يُطرح عليّ أكثر من غيره. وفيما يلي: كيف تسير الإعادة، وكم تكلّف، وماذا تعني رسالة نتيجتك فعليًا.</p>

<div class="article-toc">
  <p class="article-toc-title">في هذا المقال</p>
  <ol>
    <li><a href="#one-part">الجزء الذي رسبت فيه وحده</a></li>
    <li><a href="#how-often">كم إعادة مسموح بها؟</a></li>
    <li><a href="#cost">كم تكلّف الإعادة؟</a></li>
    <li><a href="#result">نتيجتك: ماذا تقول؟</a></li>
    <li><a href="#why">لماذا يرسب الناس</a></li>
    <li><a href="#next-time">ما الذي تفعله بشكل مختلف</a></li>
    <li><a href="#deadline">مهلتك</a></li>
  </ol>
</div>

<h2 id="one-part">الجزء الذي رسبت فيه وحده</h2>

<p>امتحان الاندماج ليس امتحانًا واحدًا كبيرًا. بل هو مجموعة امتحانات منفصلة: القراءة والاستماع والكتابة والتحدث وKNM. تسجّل لكل جزء، وتدفع لكل جزء، وتحصل على نتيجة لكل جزء.</p>

<p>والنتيجة: <strong>كل ما نجحت فيه يبقى ناجحًا</strong>. ولن تضطر أبدًا إلى إعادة جزء نجحت فيه لأنك رسبت في جزء آخر.</p>

<div class="info-box info-box-green">
  <p>وعمليًا يعني ذلك أنك تستطيع توزيع الأجزاء على فترات. كثيرون يؤدون القراءة والاستماع أولاً، ثم الكتابة والتحدث لاحقًا، فيقلّ ما عليهم التحضير له دفعة واحدة.</p>
</div>

<h2 id="how-often">كم إعادة مسموح بها؟</h2>

<p>هنا عليّ أن أكون صريحًا معك: <strong>DUO لا تذكر حدًا أقصى</strong>. بحثت في inburgeren.nl وفي لائحة الامتحانات كاملةً. ولا يوجد في أي موضع عدد أقصى للمحاولات.</p>

<p>وعلى الإنترنت ستجد الطرفين — «إعادات غير محدودة» و«محاولتان فقط». وليس لأيٍّ منهما مصدر رسمي. أما ما ينطبق فعلاً فهو <strong>مهلة اندماجك</strong>: فبموجب قانون الاندماج لعام 2021 يسمح مسار B1 بمدة أقصاها 3 سنوات. وعمليًا، هذا هو حدّك.</p>

<p>أما ما تذكره DUO بوضوح فيتعلق بالمال، لا بعدد المحاولات:</p>

${factAr('«De eerste 2 pogingen van elk examen zijn gratis» — أول محاولتين في كل امتحان مجانيتان (لحاملي وضع اللجوء). «Hebt u meer dan 2 pogingen nodig? Dan moet u de extra pogingen betalen. U kunt geen geld lenen bij DUO.»', 'inburgeren.nl — تكلفة الاندماج', SRC_BETALEN)}

<p>إذن فالمحاولتان المجانيتان ليستا حدًا لعدد مرات الإعادة المسموح بها. بل هما حدٌّ لما تدفعه DUO.</p>

<h2 id="cost">كم تكلّف الإعادة؟</h2>

<p>يكلّف جزء الامتحان <strong>50 يورو</strong> وقت كتابة هذا المقال. وهذه المبالغ قابلة للتغيير، لذا تحقّق دائمًا من السعر الحالي لدى DUO.</p>

${factAr('50 يورو لكل جزء من الامتحان (القراءة والاستماع والكتابة والتحدث وKNM)، أي 250 يورو إجمالاً بموجب قانون 2021. وبموجب قانون 2013 يُضاف ONA بمبلغ 40 يورو، أي 290 يورو إجمالاً. والأسعار قابلة للتغيير.', 'inburgeren.nl — تكلفة الاندماج', SRC_BETALEN)}

<p>وإن كنت <strong>حاصلاً على وضع لجوء</strong>، فأول محاولتين لك في كل امتحان مجانيتان. وتذكر DUO استثناءً واحدًا: لا ينطبق ذلك إن أدّيت امتحانًا بمستوى أدنى مما تحدده خطة PIP الخاصة بك.</p>

<p>أما المحاولات الإضافية <strong>فلا يمكنك الاقتراض من DUO</strong> لأجلها. وهذا سبب وجيه للتحضير للإعادة كما ينبغي بدل التسرّع إليها.</p>


<!--uitleg:herkansen-pogingen-->

<h2 id="result">نتيجتك: ماذا تقول؟</h2>

${factAr('«De uitslag wordt schriftelijk, binnen 8 weken na het examen, aan de kandidaat kenbaar gemaakt.» — تُبلَّغ النتيجة كتابةً خلال 8 أسابيع، وتظهر أيضًا في Mijn Inburgering.', 'لائحة امتحانات DUO، المادة 16 الفقرة 3', SRC_REGLEMENT)}

<p>تذكر الرسالة «ناجح» أو «راسب» إضافة إلى <strong>درجة لكل جزء</strong>. أما ما لا تذكره فهو الأسئلة التي أخطأت فيها. ولا يمكنك طلب امتحانك أيضًا:</p>

${factAr('«Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat.» — الامتحان بعد أدائه وتصحيحه لا يمكن أن يطّلع عليه الممتحَن.', 'لائحة امتحانات DUO، المادة 14 الفقرة 3', SRC_REGLEMENT)}

<p>يبدو ذلك غير منصف، وأنا أفهم السبب. لكن له نتيجة عملية: <strong>عليك أن تكتشف بنفسك أين كان الخلل</strong>. فالدرجة تخبرك كم كنت قريبًا، لا لماذا.</p>

<p>وكم كنت تحتاج من الإجابات الصحيحة؟ لا تنشر DUO ذلك — فالحدّ عتبة يحددها الوزير. والأرقام التي تجدها على الإنترنت ليست من DUO وهي متناقضة فيما بينها. المزيد عن ذلك في <a href="/ar/امتحانات-اللغة/امتحانات-اللغة-a2-b1">شرح الأجزاء الأربعة</a>.</p>

<h2 id="why">لماذا يرسب الناس</h2>

<p>بعد عشر سنوات من التدريس أرى الأسباب نفسها دائمًا تقريبًا. ونادرًا جدًا ما يكون السبب «هولنديّتي ضعيفة».</p>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>الوقت.</strong> تمنحك القراءة 65 دقيقة لـ25 سؤالاً. فإن قرأت كل نص كاملاً لن تُنهي الامتحان.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>شكل الامتحان كان جديدًا.</strong> إن لم تؤدِّ قط امتحانًا تجريبيًا كاملاً بساعة، فستخسر وقتًا بسبب المفاجأة.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>القلم في الكتابة.</strong> الكتابة بالورقة والقلم لا بلوحة مفاتيح. وكثيرون يكتشفون ذلك يوم الامتحان.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>إعادة التشغيل في الاستماع.</strong> في البيت تعيد التشغيل؛ وفي الامتحان لا تستطيع. وفجأة يبدو كل شيء أسرع بكثير.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>امتحانات تجريبية قليلة جدًا.</strong> تمنحك DUO 3 أو 4 لكل جزء. وهي تكفي لرؤية الشكل، لا لإتقانه.</p></div></div>

<h2 id="next-time">ما الذي تفعله بشكل مختلف</h2>

<p>لديك ميزة كبيرة في الإعادة: فأنت تعرف الآن كيف يبدو الامتحان. استفد منها.</p>

<ol>
  <li><strong>حدّد الجزء</strong> وتدرّب عليه وحده.</li>
  <li><strong>أدِّ دائمًا امتحانات تجريبية كاملة</strong>، بوقت محسوب. فالأسئلة المتفرقة ليست الشيء نفسه.</li>
  <li><strong>تدرّب على حاسوب</strong>، لا على هاتف — وDUO تنصح بذلك بنفسها.</li>
  <li><strong>راجع الأسئلة التي أخطأت فيها، ولماذا.</strong> وهذا بالضبط ما لا تمنحك DUO إياه، وفيه يكمن التعلّم.</li>
  <li><strong>انتظر قبل التسجيل</strong> حتى تسير امتحاناتك التجريبية على ما يرام. فالإعادة تكلّف مالاً ووقتًا.</li>
</ol>

<h2 id="deadline">مهلتك</h2>

<p>ولأن DUO لا تذكر عددًا أقصى للمحاولات، فإن <strong>مهلة اندماجك</strong> هي الحد الحقيقي — بحد أقصى 3 سنوات في مسار B1.</p>

<!--uitleg:herkansen-termijn-->

<p>وإن كانت مهلتك تقترب ولم تنجح في كل شيء، فلا تنتظر. اتصل ببلديتك: فهي التي ترافق اندماجك وتضع معك خطة PIP. وتحقّق أيضًا مما إذا كان أحد الإعفاءات ينطبق عليك — فلدى DUO صفحة مخصّصة تغطي المرض أو الإعاقة، أو شهادة تحملها بالفعل، أو تعليمًا هولنديًا تتابعه، أو الإقامة والعمل هنا مدة طويلة.</p>

<div class="info-box">
  <p>تختلف الشروط اختلافًا كبيرًا من إعفاء إلى آخر ولكل منها صفحته الخاصة لدى DUO. وأنا أتعمّد ألا أذكر هنا أرقامًا أو مددًا: فأنت تريدها من الصفحة الرسمية التي تناسب وضعك، لا من مدوّنة. ابدأ من <a href="https://www.inburgeren.nl/minder-of-geen-examens/" target="_blank" rel="noopener">Minder of geen examens</a> على inburgeren.nl.</p>
</div>

<p>خطّط بالعدّ التنازلي من تاريخ انتهاء مهلتك: كم محاولة ما زالت تتّسع، مع احتساب 8 أسابيع لكل نتيجة؟</p>

<p>جاهز للمحاولة التالية؟ <a href="/ar/تدرب">قدّم امتحانًا تجريبيًا مجانيًا</a> وانظر أين أنت.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">باختصار</h3>
  <table class="facts-table">
    <tr><td>الإعادة</td><td>ذلك الجزء وحده</td></tr>
    <tr><td>أقصى عدد محاولات</td><td>غير منشور</td></tr>
    <tr><td>التكلفة لكل جزء</td><td>50 يورو</td></tr>
    <tr><td>محاولات مجانية</td><td>2 (لحاملي وضع اللجوء)</td></tr>
    <tr><td>النتيجة</td><td>خلال 8 أسابيع</td></tr>
  </table>
</div>`,
      },
    },
  },

  // ───────────────────────────────────────────────────────────── 5. TAALNIVEAUS
  {
    slug: 'taalniveaus-a1-a2-b1-nederlands',
    title: 'Verschil tussen A1 en A2 Nederlands (en B1) uitgelegd',
    description: 'Wat is het verschil tussen A1 en A2 Nederlands? En tussen A2 en B1? Per vaardigheid uitgelegd, met het niveau dat je nodig hebt voor inburgering.',
    category: 'Thema-uitleg',
    categoryKey: 'uitleg',
    categoryColor: 'blue',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
    dateLabel: '28 juli 2026',
    breadcrumb: 'Taalniveaus A1, A2 en B1',
    heroTitle: 'Verschil tussen A1 en A2 Nederlands (en B1) uitgelegd',
    heroSubtitle: 'A1 is losse zinnen. A2 is het dagelijks leven. B1 is een gesprek volgen zonder dat iemand langzamer praat.',
    image: '/images/blog/taalniveaus-a1-a2-b1-nederlands.jpg',
    imageAlt: 'Docent legt de taalniveaus A1, A2 en B1 Nederlands uit aan een cursist',
    readingMinutes: 8,
    faq: [
      {
        q: 'Wat is het verschil tussen A1 en A2 Nederlands?',
        a: 'Op A1 begrijp je losse woorden en korte, langzame zinnen over heel bekende dingen. Op A2 kun je een eenvoudig gesprek voeren over het dagelijks leven: je werk, je familie, boodschappen, een afspraak bij de dokter. A2 is de eerste stap waarmee je je in Nederland zelf kunt redden in gewone situaties.',
      },
      {
        q: 'Wat is het verschil tussen A2 en B1?',
        a: 'Op A2 heb je hulp nodig: mensen praten langzamer en herhalen. Op B1 kun je een normaal gesprek volgen op gewone snelheid, je mening geven en uitleggen waarom je iets vindt. B1 is een flinke stap hoger dan A2, geen kleine.',
      },
      {
        q: 'Welk niveau heb ik nodig voor mijn inburgering?',
        a: 'Dat hangt af van je leerroute, en die staat in je persoonlijk plan inburgering en participatie (PIP). De B1-route gaat naar B1, de onderwijsroute naar B1 of hoger, en de zelfredzaamheidsroute naar A1. De gemeente bepaalt dat samen met jou. Kijk in Mijn Inburgering als je het niet weet.',
      },
      {
        q: 'Is A2 genoeg voor inburgering?',
        a: 'Onder de oude Wet inburgering 2013 moesten de taalexamens op A2 of hoger. Onder de Wet inburgering 2021 hangt het van je leerroute af; de standaardroute mikt op B1. Welke wet voor jou geldt, kun je zien in Mijn Inburgering.',
      },
      {
        q: 'Welk niveau Nederlands heb ik nodig om Nederlander te worden?',
        a: 'Naturalisatie vraagt om een geslaagd inburgeringsexamen of een gelijkwaardig diploma. Welke eisen precies voor jou gelden, hangt af van je situatie — kijk daarvoor bij de IND, want dat is de organisatie die over naturalisatie beslist.',
      },
      {
        q: 'Wat betekenen die letters A1, A2, B1 en B2 eigenlijk?',
        a: 'Het zijn niveaus van het Europees Referentiekader (ERK), een Europese standaard voor taalvaardigheid. A is basisgebruiker, B is onafhankelijk gebruiker en C is vaardig gebruiker. Elk niveau wordt beschreven per vaardigheid: lezen, luisteren, schrijven en spreken.',
      },
      {
        q: 'Kan ik verschillende niveaus hebben voor lezen en spreken?',
        a: 'Ja, en dat is heel normaal. Veel mensen lezen beter dan ze spreken, of begrijpen meer dan ze kunnen schrijven. Daarom test het inburgeringsexamen elk onderdeel apart, met een eigen uitslag.',
      },
    ],
    articleHtml: `
<p>Het <strong>verschil tussen A1 en A2 Nederlands</strong> is dit: op <strong>A1</strong> begrijp je losse woorden en korte zinnen als iemand langzaam praat. Op <strong>A2</strong> kun je een eenvoudig gesprek voeren over je dagelijks leven — je werk, je familie, boodschappen doen, een afspraak maken bij de dokter. Op <strong>B1</strong> kun je een normaal gesprek volgen op gewone snelheid en uitleggen waarom je iets vindt.</p>

<p>A1, A2, B1 en B2 zijn niveaus van het <strong>Europees Referentiekader (ERK)</strong>. Hieronder zie je per vaardigheid wat elk niveau betekent, en welk niveau je voor je inburgering nodig hebt.</p>

<div class="article-toc">
  <p class="article-toc-title">In dit artikel</p>
  <ol>
    <li><a href="#erk">Wat is het ERK?</a></li>
    <li><a href="#a1-a2">A1 versus A2: het echte verschil</a></li>
    <li><a href="#tabel">Alle niveaus per vaardigheid</a></li>
    <li><a href="#a2-b1">A2 versus B1: een grotere stap dan je denkt</a></li>
    <li><a href="#b2-c">En B2, C1 en C2?</a></li>
    <li><a href="#welk-niveau">Welk niveau heb jij nodig?</a></li>
    <li><a href="#weten">Hoe weet je op welk niveau je zit?</a></li>
    <li><a href="#hoelang">Hoe lang duurt het van A2 naar B1?</a></li>
    <li><a href="#ongelijk">Waarom je niveau per vaardigheid verschilt</a></li>
    <li><a href="#a2-examen">Wat A2 betekent op het examen</a></li>
  </ol>
</div>

<h2 id="erk">Wat is het ERK?</h2>

<p>Het Europees Referentiekader is een Europese standaard om taalvaardigheid te beschrijven. Er zijn zes niveaus, in drie groepen:</p>

<ul>
  <li><strong>A — basisgebruiker:</strong> A1 en A2</li>
  <li><strong>B — onafhankelijk gebruiker:</strong> B1 en B2</li>
  <li><strong>C — vaardig gebruiker:</strong> C1 en C2</li>
</ul>

<p>Het belangrijkste idee: een niveau beschrijft <strong>wat je kunt doen</strong>, niet hoeveel woorden je kent. "Ik kan een afspraak maken bij de tandarts" is een niveaubeschrijving. "Ik ken 1.200 woorden" is dat niet.</p>

<p>En elk niveau wordt <strong>per vaardigheid</strong> beschreven: lezen, luisteren, schrijven en spreken. Dat is precies waarom het inburgeringsexamen vier losse onderdelen heeft.</p>

<h2 id="a1-a2">A1 versus A2: het echte verschil</h2>

<p>Op papier lijken A1 en A2 dicht bij elkaar. In de praktijk is er één groot verschil: <strong>op A2 kun je je redden</strong>.</p>

<p>Op A1 kun je losse dingen. Je naam zeggen, tot tien tellen, "waar is het station" vragen. Maar een gesprek voeren gaat nog niet, en je hebt iemand nodig die heel langzaam praat.</p>

<p>Op A2 kun je een eenvoudig gesprek voeren over dingen die dichtbij staan. Een afspraak maken. Zeggen wat er mis is bij de dokter. Uitleggen wat voor werk je doet. Een korte e-mail schrijven aan een collega. Je hebt nog steeds hulp nodig bij moeilijke onderwerpen, maar het dagelijks leven lukt.</p>

<div class="info-box info-box-green">
  <p><strong>Kort:</strong> A1 is losse zinnen. A2 is het dagelijks leven. Dat is de sprong.</p>
</div>

<h2 id="tabel">Alle niveaus per vaardigheid</h2>

<p>Deze tabel geeft je een beeld per vaardigheid. Het zijn beschrijvingen in gewone taal, geen officiële ERK-formuleringen.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>A1</th><th>A2</th><th>B1</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Lezen</strong></td>
      <td>losse woorden, namen, heel korte briefjes</td>
      <td>korte teksten uit het dagelijks leven: advertenties, brieven, formulieren</td>
      <td>langere teksten over bekende onderwerpen; je begrijpt de hoofdlijn</td>
    </tr>
    <tr>
      <td><strong>Luisteren</strong></td>
      <td>losse woorden als iemand heel langzaam praat</td>
      <td>eenvoudige gesprekken over bekende dingen, in normaal tempo maar duidelijk</td>
      <td>gesprekken op normale snelheid; je volgt het nieuws of een uitleg</td>
    </tr>
    <tr>
      <td><strong>Schrijven</strong></td>
      <td>een formulier met je naam en adres</td>
      <td>een korte brief of e-mail, een formulier invullen</td>
      <td>een samenhangende tekst over iets wat je meemaakte of vindt</td>
    </tr>
    <tr>
      <td><strong>Spreken</strong></td>
      <td>losse zinnen over jezelf, met veel pauzes</td>
      <td>een eenvoudig gesprek over werk, familie, boodschappen, gezondheid</td>
      <td>je mening geven en uitleggen waarom; een gesprek zelf op gang houden</td>
    </tr>
  </tbody>
</table>
</div>

<h2 id="a2-b1">A2 versus B1: een grotere stap dan je denkt</h2>

<p>Veel mensen denken dat B1 "een beetje beter dan A2" is. Dat is niet zo. De stap van A2 naar B1 is groter dan die van A1 naar A2.</p>

<p>Het verschil zit vooral in <strong>hulp</strong>. Op A2 mag de ander langzamer praten, herhalen en makkelijkere woorden kiezen. Op B1 verwacht men dat je een normaal gesprek kunt volgen — zonder dat iemand zich aanpast.</p>

<p>Daar komt bij dat je op B1 niet alleen informatie moet geven, maar ook <strong>een mening met een reden</strong>. "Ik vind dit een goed idee, omdat…" Dat is een ander soort taal dan "ik werk in de zorg".</p>

<h2 id="b2-c">En B2, C1 en C2?</h2>

<p>Voor je inburgering heb je die niveaus niet nodig, maar het is handig te weten waar ze staan.</p>

<ul>
  <li><strong>B2:</strong> je kunt ook over abstracte onderwerpen praten en een discussie volgen. Dit niveau wordt vaak gevraagd voor een hbo- of universitaire opleiding.</li>
  <li><strong>C1:</strong> je gebruikt Nederlands vloeiend en flexibel, ook in je werk.</li>
  <li><strong>C2:</strong> bijna als een moedertaalspreker.</li>
</ul>

<p>De taalexamens op B1 en B2 heten het <strong>staatsexamen Nederlands als tweede taal (NT2)</strong>. Dat is een ander examen dan het inburgeringsexamen, met eigen regels en eigen examendata.</p>

<h2 id="welk-niveau">Welk niveau heb jij nodig?</h2>

<p>Onder de <strong>Wet inburgering 2021</strong> hangt je niveau af van je <strong>leerroute</strong>. Die staat in je persoonlijk plan inburgering en participatie (PIP), en de gemeente bepaalt hem samen met jou.</p>

<!--uitleg:niveaus-routes-->

<p>Alle routes bevatten daarnaast <strong>KNM</strong> (Kennis van de Nederlandse Maatschappij).</p>

<p>Viel je onder de oude <strong>Wet inburgering 2013</strong>? Dan moesten alle taalexamens op "taalniveau A2 of hoger". Let op een detail dat veel websites verkeerd hebben: de Wet inburgering 2021 is <strong>ingegaan op 1 januari 2022</strong>. De wet heet 2021, maar geldt vanaf 2022.</p>

${fact('"De nieuwe Wet Inburgering is in werking getreden op 1 januari 2022." Onder de Wet 2013 moesten de taalexamens op taalniveau A2 of hoger.', 'rijksoverheid.nl — nieuwe Wet inburgering', 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering')}

<p>Weet je niet welke wet of route voor jou geldt? Dat staat in Mijn Inburgering. Gok er niet naar — het bepaalt welke examens je moet doen.</p>

<h2 id="weten">Hoe weet je op welk niveau je zit?</h2>

<p>Je niveau is geen gevoel. Het is wat je kunt doen. Loop deze vragen eens langs, per vaardigheid:</p>

<ul>
  <li><strong>Kun je een brief van de gemeente lezen</strong> en eruit halen wat je moet doen? Dan zit je voor lezen rond A2.</li>
  <li><strong>Kun je bij de dokter uitleggen wat er mis is</strong> zonder dat iemand meegaat? Dan zit je voor spreken rond A2.</li>
  <li><strong>Kun je een gesprek tussen twee Nederlanders volgen</strong> die niet langzamer voor je praten? Dan zit je voor luisteren richting B1.</li>
  <li><strong>Kun je opschrijven waarom je iets vindt</strong>, in een paar samenhangende zinnen? Dan zit je voor schrijven richting B1.</li>
</ul>

<p>Wil je het preciezer weten? Doe een compleet oefenexamen op A2-niveau, met de klok erbij. Dat zegt meer dan een online niveautest van tien vragen, omdat het het echte format en het echte tempo gebruikt.</p>

<h2 id="hoelang">Hoe lang duurt het van A2 naar B1?</h2>

<p>Hier ga ik je geen getal geven, en dat is bewust. Je leest online vaak "zoveel uur voor een niveau". Zulke schattingen zeggen weinig, omdat het per persoon enorm verschilt.</p>

<p>Wat het echt bepaalt:</p>

<ul>
  <li><strong>Hoeveel Nederlands je per dag hoort en spreekt.</strong> Iemand die op werk Nederlands spreekt, gaat veel sneller dan iemand die alleen in de les Nederlands hoort.</li>
  <li><strong>Of je taal al kent die op Nederlands lijkt.</strong> Duits en Engels helpen; een taal met een ander schrift betekent meer werk.</li>
  <li><strong>Of je eerder naar school bent geweest.</strong> Leren leren is zelf een vaardigheid.</li>
  <li><strong>Hoeveel tijd je hebt.</strong> Met werk en kinderen is twee uur per week iets heel anders dan twintig.</li>
</ul>

<p>De gemeente kijkt hier ook naar. Met een <strong>leerbaarheidstoets</strong> wordt bepaald welke leerroute realistisch voor je is. Dat is geen examen dat je kunt zakken; het is een hulpmiddel om je route te kiezen.</p>

<h2 id="ongelijk">Waarom je niveau per vaardigheid verschilt</h2>

<p>Bijna niemand zit op precies hetzelfde niveau voor alle vier de vaardigheden. Dat is normaal, en het is goed om te weten.</p>

<p>Wat ik in mijn lessen het vaakst zie:</p>

<ul>
  <li><strong>Lezen loopt voor.</strong> Je kunt een tekst rustig bekijken, dus lezen gaat vaak het snelst vooruit.</li>
  <li><strong>Luisteren loopt achter.</strong> Je bepaalt het tempo niet, en je kunt niet terug.</li>
  <li><strong>Spreken voelt het moeilijkst.</strong> Niet omdat je het niet kunt, maar omdat je moet durven.</li>
  <li><strong>Schrijven is het meest te trainen.</strong> Het is de vaardigheid waar gerichte oefening het snelst helpt.</li>
</ul>

<p>Daarom test het inburgeringsexamen elk onderdeel apart, met een eigen uitslag. En daarom hoef je bij een onvoldoende alleen dat ene onderdeel opnieuw te doen — zie <a href="/nl/blog/inburgeringsexamen-zakken-herkansen">het artikel over zakken en herkansen</a>.</p>

<h2 id="a2-examen">Wat A2 betekent op het examen</h2>

<p>Concreet ziet A2 er op het inburgeringsexamen zo uit:</p>

${fact('Lezen 65 minuten, Luisteren 45 minuten, Schrijven 40 minuten (met pen en papier, 4 opdrachten), Spreken 35 minuten.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

<p>De teksten en gesprekken gaan over gewone dingen: een brief van school, een gesprek bij de huisarts, een mededeling op het station. Geen politiek, geen literatuur, geen vaktaal.</p>

<p>Dat is het belangrijkste om te onthouden: <strong>A2 is geen hoog niveau, maar wel een echt niveau</strong>. Je moet je in het dagelijks leven kunnen redden. En dat is precies wat je kunt oefenen.</p>

<p>Wil je weten waar je nu staat? <a href="/nl/oefenen">Doe een gratis oefenexamen op A2-niveau</a>. Lees ook <a href="/nl/taalexamens/taalexamens-a2-b1">de gids over de vier taalexamens</a> als je wilt weten wat je per examen krijgt.</p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">De niveaus kort</h3>
  <table class="facts-table">
    <tr><td>A1</td><td>losse zinnen</td></tr>
    <tr><td>A2</td><td>dagelijks leven</td></tr>
    <tr><td>B1</td><td>normaal gesprek</td></tr>
    <tr><td>B2</td><td>ook abstracte taal</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
      { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'De 8 fouten bij Schrijven A2', desc: 'Hoofdletters, komma’s, tijden en ‘u’ of ‘je’' },
      { slug: 'want-of-omdat', title: 'Want of omdat?', desc: 'Waarom ‘want’ op het examen bijna altijd de slimmere keuze is' },
    ],
    ctaTitle: 'Ontdek waar je nu staat',
    ctaDesc: 'Doe een gratis oefenexamen op A2-niveau. Geen account nodig, direct uitleg per vraag.',
    ctaHref: '/oefenen',
    ctaLabel: 'Start gratis oefenexamen',
    translations: {
      en: {
        heroTitle: 'The difference between A1 and A2 Dutch (and B1) explained',
        description: 'What is the difference between A1 and A2 Dutch? And between A2 and B1? Explained per skill, with the level you need for integration.',
        category: 'Topic explained',
        breadcrumb: 'Language levels A1, A2 and B1',
        dateLabel: '28 July 2026',
        imageAlt: 'Teacher explaining the Dutch language levels A1, A2 and B1 to a student',
        relatedPosts: [
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'The 8 mistakes on Writing A2', desc: 'Capitals, commas, times and ‘u’ versus ‘je’' },
          { slug: 'want-of-omdat', title: 'Want or omdat?', desc: 'Why ‘want’ is almost always the smarter choice on the exam' },
        ],
        heroSubtitle: 'A1 is isolated sentences. A2 is everyday life. B1 is following a conversation without anyone slowing down for you.',
        ctaTitle: 'Find out where you stand',
        ctaDesc: 'Take a free practice exam at A2 level. No account needed, with an explanation for every question.',
        ctaLabel: 'Start a free practice exam',
        faq: [
          { q: 'What is the difference between A1 and A2 Dutch?', a: 'At A1 you understand isolated words and short, slow sentences about very familiar things. At A2 you can hold a simple conversation about everyday life: your work, your family, shopping, an appointment at the doctor. A2 is the first level at which you can manage ordinary situations in the Netherlands yourself.' },
          { q: 'What is the difference between A2 and B1?', a: 'At A2 you need help: people speak more slowly and repeat themselves. At B1 you can follow a normal conversation at normal speed, give an opinion and explain why you hold it. B1 is a substantial step up from A2, not a small one.' },
          { q: 'Which level do I need for my integration?', a: 'It depends on your learning route, which is set out in your personal integration and participation plan (PIP). The B1 route targets B1, the education route B1 or higher, and the self-reliance route A1. The municipality decides this with you. Check Mijn Inburgering if you are unsure.' },
          { q: 'Is A2 enough for integration?', a: 'Under the older Wet inburgering 2013 the language exams had to be at A2 or higher. Under the Wet inburgering 2021 it depends on your learning route; the standard route targets B1. You can see which law applies to you in Mijn Inburgering.' },
          { q: 'Which level do I need to become Dutch?', a: 'Naturalisation requires a passed integration exam or an equivalent diploma. Exactly which requirements apply depends on your situation — check with the IND, as they decide on naturalisation.' },
          { q: 'What do A1, A2, B1 and B2 actually mean?', a: 'They are levels of the Common European Framework of Reference (CEFR), a European standard for language ability. A is a basic user, B an independent user and C a proficient user. Each level is described per skill: reading, listening, writing and speaking.' },
          { q: 'Can I be at different levels for reading and speaking?', a: 'Yes, and it is completely normal. Many people read better than they speak, or understand more than they can write. That is why the integration exam tests each part separately, with its own result.' },
        ],
        articleHtml: `
<p>The <strong>difference between A1 and A2 Dutch</strong> is this: at <strong>A1</strong> you understand isolated words and short sentences when someone speaks slowly. At <strong>A2</strong> you can hold a simple conversation about your everyday life — work, family, shopping, making a doctor’s appointment. At <strong>B1</strong> you can follow a normal conversation at normal speed and explain why you think something.</p>

<p>A1, A2, B1 and B2 are levels of the <strong>Common European Framework of Reference (CEFR)</strong>. Below you will find what each level means per skill, and which level you need for your integration.</p>

<div class="article-toc">
  <p class="article-toc-title">In this article</p>
  <ol>
    <li><a href="#cefr">What is the CEFR?</a></li>
    <li><a href="#a1-a2">A1 versus A2: the real difference</a></li>
    <li><a href="#table">All levels, per skill</a></li>
    <li><a href="#a2-b1">A2 versus B1: a bigger step than you think</a></li>
    <li><a href="#b2-c">And B2, C1 and C2?</a></li>
    <li><a href="#which-level">Which level do you need?</a></li>
    <li><a href="#uneven">Why your level differs per skill</a></li>
    <li><a href="#a2-exam">What A2 means in the exam</a></li>
  </ol>
</div>

<h2 id="cefr">What is the CEFR?</h2>

<p>The Common European Framework of Reference is a European standard for describing language ability. There are six levels in three groups:</p>

<ul>
  <li><strong>A — basic user:</strong> A1 and A2</li>
  <li><strong>B — independent user:</strong> B1 and B2</li>
  <li><strong>C — proficient user:</strong> C1 and C2</li>
</ul>

<p>The key idea: a level describes <strong>what you can do</strong>, not how many words you know. "I can make an appointment at the dentist" is a level description. "I know 1,200 words" is not.</p>

<p>And each level is described <strong>per skill</strong>: reading, listening, writing and speaking. Which is exactly why the integration exam has four separate parts.</p>

<h2 id="a1-a2">A1 versus A2: the real difference</h2>

<p>On paper A1 and A2 look close together. In practice there is one big difference: <strong>at A2 you can manage</strong>.</p>

<p>At A1 you can do isolated things. Say your name, count to ten, ask where the station is. But holding a conversation does not work yet, and you need someone who speaks very slowly.</p>

<p>At A2 you can hold a simple conversation about things close to you. Make an appointment. Say what hurts at the doctor. Explain what work you do. Write a short email to a colleague. You still need help with difficult subjects, but everyday life works.</p>

<div class="info-box info-box-green">
  <p><strong>In short:</strong> A1 is isolated sentences. A2 is everyday life. That is the jump.</p>
</div>

<h2 id="table">All levels, per skill</h2>

<p>This table gives you a feel per skill. These are plain-language descriptions, not official CEFR wording.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>A1</th><th>A2</th><th>B1</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Reading</strong></td><td>isolated words, names, very short notes</td><td>short everyday texts: adverts, letters, forms</td><td>longer texts on familiar subjects; you get the gist</td></tr>
    <tr><td><strong>Listening</strong></td><td>isolated words when spoken very slowly</td><td>simple conversations about familiar things, clearly spoken</td><td>conversations at normal speed; you follow news or an explanation</td></tr>
    <tr><td><strong>Writing</strong></td><td>a form with your name and address</td><td>a short letter or email; filling in a form</td><td>a coherent text about something you experienced or think</td></tr>
    <tr><td><strong>Speaking</strong></td><td>isolated sentences about yourself, with many pauses</td><td>a simple conversation about work, family, shopping, health</td><td>giving an opinion and explaining it; keeping a conversation going</td></tr>
  </tbody>
</table>
</div>

<h2 id="a2-b1">A2 versus B1: a bigger step than you think</h2>

<p>Many people assume B1 is "a bit better than A2". It is not. The step from A2 to B1 is larger than the step from A1 to A2.</p>

<p>The difference is mostly about <strong>help</strong>. At A2 the other person may speak slowly, repeat themselves and choose easier words. At B1 you are expected to follow a normal conversation — without anyone adjusting for you.</p>

<p>On top of that, B1 asks you not just to give information but to give <strong>an opinion with a reason</strong>. "I think this is a good idea, because…" That is a different kind of language from "I work in healthcare".</p>

<h2 id="b2-c">And B2, C1 and C2?</h2>

<p>You do not need these for your integration, but it helps to know where they sit.</p>

<ul>
  <li><strong>B2:</strong> you can also discuss abstract subjects and follow a debate. Often required for higher education.</li>
  <li><strong>C1:</strong> you use Dutch fluently and flexibly, including at work.</li>
  <li><strong>C2:</strong> close to a native speaker.</li>
</ul>

<p>The language exams at B1 and B2 are called the <strong>staatsexamen Nederlands als tweede taal (NT2)</strong>. That is a different exam from the integration exam, with its own rules and dates.</p>

<h2 id="which-level">Which level do you need?</h2>

<p>Under the <strong>Wet inburgering 2021</strong> your level depends on your <strong>learning route</strong>, set out in your PIP. The municipality decides it with you.</p>

<!--uitleg:niveaus-routes-->

<p>All routes also include <strong>KNM</strong> (Knowledge of Dutch Society).</p>

<p>Did you fall under the older <strong>Wet inburgering 2013</strong>? Then all language exams had to be at "A2 or higher". Note a detail many websites get wrong: the Wet inburgering 2021 <strong>took effect on 1 January 2022</strong>. The law is named 2021 but applies from 2022.</p>

${factEn('"De nieuwe Wet Inburgering is in werking getreden op 1 januari 2022." Under the Wet 2013 the language exams had to be at level A2 or higher.', 'rijksoverheid.nl — the new integration act', 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering')}

<p>If you do not know which law or route applies to you, it is in Mijn Inburgering. Do not guess — it determines which exams you must sit.</p>

<h2 id="uneven">Why your level differs per skill</h2>

<p>Almost nobody sits at exactly the same level across all four skills. That is normal, and worth knowing.</p>

<ul>
  <li><strong>Reading runs ahead.</strong> You can take your time with a text, so it improves fastest.</li>
  <li><strong>Listening lags behind.</strong> You do not control the pace and you cannot go back.</li>
  <li><strong>Speaking feels hardest.</strong> Not because you cannot, but because it takes nerve.</li>
  <li><strong>Writing responds best to training.</strong> Targeted practice helps quickest here.</li>
</ul>

<p>That is why the integration exam tests each part separately, and why a fail means retaking only that one part — see <a href="/en/blog/failing-and-retaking-the-integration-exam">failing and retaking</a>.</p>

<h2 id="a2-exam">What A2 means in the exam</h2>

${factEn('Reading 65 minutes, Listening 45 minutes, Writing 40 minutes (pen and paper, 4 assignments), Speaking 35 minutes.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<p>The texts and conversations are about ordinary things: a letter from school, a conversation at the doctor, an announcement at the station. No politics, no literature, no jargon.</p>

<p>Which is the main thing to remember: <strong>A2 is not a high level, but it is a real one</strong>. You have to be able to manage in everyday life. And that is precisely what you can practise.</p>

<p>Want to know where you stand? <a href="/en/practice">Take a free practice exam at A2 level</a>, or read <a href="/en/language-exams/language-exams-a2-b1">the guide to the four language exams</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">The levels in brief</h3>
  <table class="facts-table">
    <tr><td>A1</td><td>isolated sentences</td></tr>
    <tr><td>A2</td><td>everyday life</td></tr>
    <tr><td>B1</td><td>normal conversation</td></tr>
    <tr><td>B2</td><td>abstract language too</td></tr>
  </table>
</div>`,
      },
      ar: {
        heroTitle: 'الفرق بين المستوى A1 وA2 في الهولندية (وB1) بشرح مبسّط',
        description: 'ما الفرق بين A1 وA2 في اللغة الهولندية؟ وبين A2 وB1؟ شرح لكل مهارة على حدة، مع المستوى الذي تحتاجه للاندماج.',
        category: 'شرح موضوع',
        breadcrumb: 'مستويات اللغة A1 وA2 وB1',
        dateLabel: '28 يوليو 2026',
        imageAlt: 'مدرّس يشرح مستويات اللغة الهولندية A1 وA2 وB1 لأحد الدارسين',
        relatedPosts: [
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'الأخطاء الثمانية في الكتابة A2', desc: 'الحروف الكبيرة والفواصل والوقت و«u» أو «je»' },
          { slug: 'want-of-omdat', title: 'want أم omdat؟', desc: 'لماذا يكون «want» الخيار الأذكى في الامتحان غالبًا' },
        ],
        heroSubtitle: 'المستوى A1 جملٌ منفصلة. والمستوى A2 هو الحياة اليومية. أما B1 فهو أن تتابع حديثًا دون أن يبطئ أحد من أجلك.',
        ctaTitle: 'اكتشف أين أنت الآن',
        ctaDesc: 'قدّم امتحانًا تجريبيًا مجانيًا بمستوى A2. بدون حساب، مع شرح مباشر بعد كل سؤال.',
        ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
        faq: [
          { q: 'ما الفرق بين A1 وA2 في اللغة الهولندية؟', a: 'في المستوى A1 تفهم كلمات منفصلة وجملًا قصيرة بطيئة عن أمور مألوفة جدًا. وفي المستوى A2 تستطيع إجراء محادثة بسيطة عن الحياة اليومية: عملك، وعائلتك، والتسوّق، وموعد عند الطبيب. المستوى A2 هو أول مستوى تستطيع فيه تدبّر المواقف العادية في هولندا بنفسك.' },
          { q: 'ما الفرق بين A2 وB1؟', a: 'في المستوى A2 تحتاج إلى مساعدة: يتحدث الناس ببطء أكبر ويكررون كلامهم. وفي المستوى B1 تستطيع متابعة محادثة عادية بسرعة عادية، وإبداء رأي وشرح سببه. الانتقال من A2 إلى B1 خطوة كبيرة وليست صغيرة.' },
          { q: 'ما المستوى الذي أحتاجه لاندماجي؟', a: 'يعتمد ذلك على مسار التعلّم الخاص بك، وهو محدَّد في خطة الاندماج والمشاركة الشخصية (PIP). مسار B1 يستهدف المستوى B1، ومسار التعليم B1 أو أعلى، ومسار الاعتماد على الذات A1. تقرر البلدية ذلك معك. راجع Mijn Inburgering إن لم تكن متأكدًا.' },
          { q: 'هل يكفي المستوى A2 للاندماج؟', a: 'بموجب قانون الاندماج القديم لعام 2013 كان يجب أن تكون امتحانات اللغة بمستوى A2 أو أعلى. أما بموجب قانون الاندماج لعام 2021 فيعتمد الأمر على مسار التعلّم الخاص بك؛ والمسار القياسي يستهدف B1. تستطيع أن ترى أي قانون ينطبق عليك في Mijn Inburgering.' },
          { q: 'ما المستوى الذي أحتاجه للحصول على الجنسية الهولندية؟', a: 'يتطلب التجنّس اجتياز امتحان الاندماج أو شهادة معادِلة له. أما الشروط التي تنطبق بالضبط فتعتمد على وضعك — راجع IND، فهي الجهة التي تبتّ في التجنّس.' },
          { q: 'ماذا تعني المستويات A1 وA2 وB1 وB2 فعليًا؟', a: 'هي مستويات الإطار الأوروبي المرجعي المشترك للغات (CEFR)، وهو معيار أوروبي للقدرة اللغوية. المستوى A مستخدم مبتدئ، وB مستخدم مستقل، وC مستخدم متمكّن. ويُوصف كل مستوى لكل مهارة على حدة: القراءة والاستماع والكتابة والتحدث.' },
          { q: 'هل يمكن أن يكون مستواي في القراءة مختلفًا عن مستواي في التحدث؟', a: 'نعم، وهذا أمر طبيعي تمامًا. كثيرون يقرؤون أفضل مما يتحدثون، أو يفهمون أكثر مما يستطيعون كتابته. ولهذا السبب يختبر امتحان الاندماج كل جزء على حدة، بنتيجة خاصة به.' },
        ],
        articleHtml: `
<p><strong>الفرق بين المستوى A1 وA2 في الهولندية</strong> هو التالي: في المستوى <strong>A1</strong> تفهم كلمات منفصلة وجملًا قصيرة حين يتحدث أحدهم ببطء. وفي المستوى <strong>A2</strong> تستطيع إجراء محادثة بسيطة عن حياتك اليومية — العمل، والعائلة، والتسوّق، وحجز موعد عند الطبيب. أما في المستوى <strong>B1</strong> فتستطيع متابعة محادثة عادية بسرعة عادية وشرح سبب رأيك في أمر ما.</p>

<p>المستويات A1 وA2 وB1 وB2 هي مستويات <strong>الإطار الأوروبي المرجعي المشترك للغات (CEFR)</strong>. ستجد أدناه ماذا يعني كل مستوى لكل مهارة، وأي مستوى تحتاجه لاندماجك.</p>

<div class="article-toc">
  <p class="article-toc-title">في هذا المقال</p>
  <ol>
    <li><a href="#cefr">ما هو الإطار الأوروبي المرجعي CEFR؟</a></li>
    <li><a href="#a1-a2">A1 مقابل A2: الفرق الحقيقي</a></li>
    <li><a href="#table">كل المستويات، لكل مهارة</a></li>
    <li><a href="#a2-b1">A2 مقابل B1: خطوة أكبر مما تظن</a></li>
    <li><a href="#b2-c">وماذا عن B2 وC1 وC2؟</a></li>
    <li><a href="#which-level">أي مستوى تحتاج؟</a></li>
    <li><a href="#uneven">لماذا يختلف مستواك من مهارة إلى أخرى</a></li>
    <li><a href="#a2-exam">ماذا يعني المستوى A2 في الامتحان</a></li>
  </ol>
</div>

<h2 id="cefr">ما هو الإطار الأوروبي المرجعي CEFR؟</h2>

<p>الإطار الأوروبي المرجعي المشترك هو معيار أوروبي لوصف القدرة اللغوية. وفيه ستة مستويات موزّعة على ثلاث مجموعات:</p>

<ul>
  <li><strong>A — مستخدم مبتدئ:</strong> A1 وA2</li>
  <li><strong>B — مستخدم مستقل:</strong> B1 وB2</li>
  <li><strong>C — مستخدم متمكّن:</strong> C1 وC2</li>
</ul>

<p>الفكرة الأساسية: المستوى يصف <strong>ما تستطيع فعله</strong>، لا عدد الكلمات التي تعرفها. «أستطيع حجز موعد عند طبيب الأسنان» وصفُ مستوى. أما «أعرف 1200 كلمة» فليس كذلك.</p>

<p>ويُوصف كل مستوى <strong>لكل مهارة على حدة</strong>: القراءة والاستماع والكتابة والتحدث. وهذا بالضبط سبب احتواء امتحان الاندماج على أربعة أجزاء منفصلة.</p>

<h2 id="a1-a2">A1 مقابل A2: الفرق الحقيقي</h2>

<p>على الورق يبدو A1 وA2 متقاربين. أما عمليًا فبينهما فرق كبير واحد: <strong>في المستوى A2 تستطيع تدبّر أمورك</strong>.</p>

<p>في المستوى A1 تستطيع القيام بأمور منفصلة. أن تقول اسمك، وتعدّ إلى عشرة، وتسأل أين المحطة. لكن إجراء محادثة لا ينجح بعد، وتحتاج إلى شخص يتحدث ببطء شديد.</p>

<p>في المستوى A2 تستطيع إجراء محادثة بسيطة عن أمور قريبة منك. أن تحجز موعدًا. وأن تقول ما الذي يؤلمك عند الطبيب. وأن تشرح ما هو عملك. وأن تكتب رسالة بريد إلكتروني قصيرة إلى زميل. ما زلت تحتاج إلى مساعدة في المواضيع الصعبة، لكن الحياة اليومية تسير.</p>

<div class="info-box info-box-green">
  <p><strong>باختصار:</strong> المستوى A1 جملٌ منفصلة. والمستوى A2 هو الحياة اليومية. تلك هي القفزة.</p>
</div>

<h2 id="table">كل المستويات، لكل مهارة</h2>

<p>يمنحك هذا الجدول إحساسًا بكل مهارة. وهي أوصاف بلغة مبسّطة، وليست الصياغة الرسمية للإطار الأوروبي.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>A1</th><th>A2</th><th>B1</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>القراءة</strong></td><td>كلمات منفصلة وأسماء وملاحظات قصيرة جدًا</td><td>نصوص يومية قصيرة: إعلانات ورسائل ونماذج</td><td>نصوص أطول عن مواضيع مألوفة؛ تفهم الفكرة العامة</td></tr>
    <tr><td><strong>الاستماع</strong></td><td>كلمات منفصلة حين يُنطق بها ببطء شديد</td><td>محادثات بسيطة عن أمور مألوفة، بنطق واضح</td><td>محادثات بسرعة عادية؛ تتابع نشرة أخبار أو شرحًا</td></tr>
    <tr><td><strong>الكتابة</strong></td><td>نموذج فيه اسمك وعنوانك</td><td>رسالة أو بريد إلكتروني قصير؛ وتعبئة نموذج</td><td>نص مترابط عن شيء عشته أو ترى فيه رأيًا</td></tr>
    <tr><td><strong>التحدث</strong></td><td>جمل منفصلة عن نفسك، مع توقفات كثيرة</td><td>محادثة بسيطة عن العمل والعائلة والتسوّق والصحة</td><td>إبداء رأي وشرحه؛ والحفاظ على استمرار المحادثة</td></tr>
  </tbody>
</table>
</div>

<h2 id="a2-b1">A2 مقابل B1: خطوة أكبر مما تظن</h2>

<p>يفترض كثيرون أن B1 «أفضل قليلًا من A2». وليس الأمر كذلك. فالخطوة من A2 إلى B1 أكبر من الخطوة من A1 إلى A2.</p>

<p>الفرق يتعلق أساسًا <strong>بالمساعدة</strong>. في المستوى A2 يجوز للطرف الآخر أن يتحدث ببطء، وأن يكرر كلامه، وأن يختار كلمات أسهل. أما في المستوى B1 فيُتوقع منك متابعة محادثة عادية — دون أن يعدّل أحد كلامه من أجلك.</p>

<p>وفوق ذلك، يطلب منك المستوى B1 ألا تكتفي بإعطاء معلومات بل أن تعطي <strong>رأيًا مع سببه</strong>. «أعتقد أن هذه فكرة جيدة، لأن…» وهذا نوع من اللغة مختلف عن «أنا أعمل في مجال الرعاية الصحية».</p>

<h2 id="b2-c">وماذا عن B2 وC1 وC2؟</h2>

<p>لا تحتاج إلى هذه المستويات لاندماجك، لكن من المفيد أن تعرف موقعها.</p>

<ul>
  <li><strong>B2:</strong> تستطيع أيضًا مناقشة مواضيع مجرّدة ومتابعة نقاش. وكثيرًا ما يُشترط للتعليم العالي.</li>
  <li><strong>C1:</strong> تستخدم الهولندية بطلاقة ومرونة، بما في ذلك في العمل.</li>
  <li><strong>C2:</strong> قريب من مستوى الناطق الأصلي.</li>
</ul>

<p>تُسمّى امتحانات اللغة في المستويين B1 وB2 <strong>امتحان الدولة للهولندية كلغة ثانية (NT2)</strong>. وهو امتحان مختلف عن امتحان الاندماج، وله قواعده ومواعيده الخاصة.</p>

<h2 id="which-level">أي مستوى تحتاج؟</h2>

<p>بموجب <strong>قانون الاندماج لعام 2021</strong> يعتمد مستواك على <strong>مسار التعلّم</strong> الخاص بك، المحدَّد في خطة PIP. وتقرره البلدية معك.</p>

<!--uitleg:niveaus-routes-->

<p>تشمل كل المسارات أيضًا <strong>KNM</strong> (معرفة المجتمع الهولندي).</p>

<p>هل كنت تخضع لقانون الاندماج الأقدم <strong>لعام 2013</strong>؟ عندها كان يجب أن تكون كل امتحانات اللغة بمستوى «A2 أو أعلى». وانتبه إلى تفصيل تخطئ فيه مواقع كثيرة: قانون الاندماج لعام 2021 <strong>دخل حيّز التنفيذ في 1 يناير 2022</strong>. فاسم القانون 2021 لكنه يُطبَّق اعتبارًا من 2022.</p>

${factAr('«دخل قانون الاندماج الجديد حيّز التنفيذ في 1 يناير 2022.» وبموجب قانون 2013 كان يجب أن تكون امتحانات اللغة بمستوى A2 أو أعلى.', 'rijksoverheid.nl — قانون الاندماج الجديد', 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering')}

<p>إن كنت لا تعرف أي قانون أو مسار ينطبق عليك، فستجده في Mijn Inburgering. لا تخمّن — فهو يحدد أي امتحانات يجب أن تؤديها.</p>

<h2 id="uneven">لماذا يختلف مستواك من مهارة إلى أخرى</h2>

<p>لا يكاد أحد يكون في المستوى نفسه تمامًا في المهارات الأربع. وهذا أمر طبيعي، ويستحق أن تعرفه.</p>

<ul>
  <li><strong>القراءة تسبق غيرها.</strong> تستطيع أن تأخذ وقتك مع النص، فتتحسن أسرع من غيرها.</li>
  <li><strong>الاستماع يتأخر.</strong> أنت لا تتحكم في السرعة ولا تستطيع العودة إلى الوراء.</li>
  <li><strong>التحدث يبدو الأصعب.</strong> لا لأنك لا تستطيع، بل لأنه يحتاج إلى جرأة.</li>
  <li><strong>الكتابة تستجيب للتدريب أكثر من غيرها.</strong> التدريب المركّز يساعد هنا بأسرع ما يكون.</li>
</ul>

<p>ولهذا السبب يختبر امتحان الاندماج كل جزء على حدة، ولهذا يعني الرسوب إعادة ذلك الجزء وحده — انظر <a href="/ar/المدونة/الرسوب-وإعادة-امتحان-الاندماج">الرسوب وإعادة الامتحان</a>.</p>

<h2 id="a2-exam">ماذا يعني المستوى A2 في الامتحان</h2>

${factAr('القراءة 65 دقيقة، والاستماع 45 دقيقة، والكتابة 40 دقيقة (بالورقة والقلم، 4 مهام)، والتحدث 35 دقيقة.', 'inburgeren.nl — محتوى امتحانات اللغة', SRC_INHOUD)}

<p>تدور النصوص والمحادثات حول أمور عادية: رسالة من المدرسة، أو حديث عند الطبيب، أو إعلان في المحطة. لا سياسة، ولا أدب، ولا مصطلحات متخصصة.</p>

<p>وهذا هو الأهم الذي ينبغي تذكّره: <strong>المستوى A2 ليس مستوى عاليًا، لكنه مستوى حقيقي</strong>. عليك أن تكون قادرًا على تدبّر أمورك في الحياة اليومية. وهذا بالضبط ما يمكنك التدرّب عليه.</p>

<p>هل تريد أن تعرف أين أنت؟ <a href="/ar/تدرب">قدّم امتحانًا تجريبيًا مجانيًا بمستوى A2</a>، أو اقرأ <a href="/ar/امتحانات-اللغة/امتحانات-اللغة-a2-b1">شرح الأجزاء الأربعة</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">المستويات باختصار</h3>
  <table class="facts-table">
    <tr><td>A1</td><td>جمل منفصلة</td></tr>
    <tr><td>A2</td><td>الحياة اليومية</td></tr>
    <tr><td>B1</td><td>محادثة عادية</td></tr>
    <tr><td>B2</td><td>واللغة المجرّدة أيضًا</td></tr>
  </table>
</div>`,
      },
    },
  },
  // ───────────────────────────────────────────────────── 6. SCHRIJVEN — veelgemaakte fouten
  {
    slug: 'veelgemaakte-fouten-schrijven-examen-a2',
    title: 'De 8 fouten die je maakt bij het examen Schrijven A2',
    description: 'Hoofdletters, komma’s, tijden en ‘u’ of ‘je’: dit zijn de acht fouten die een NT2-docent elke week terugziet bij het examen Schrijven A2.',
    category: 'Tips & Voorbereiding',
    categoryKey: 'tips',
    categoryColor: 'orange',
    datePublished: '2026-09-16',
    dateModified: '2026-10-11',
    dateLabel: '16 september 2026',
    breadcrumb: 'Fouten bij Schrijven A2',
    heroTitle: 'De 8 fouten die je maakt bij het examen Schrijven A2',
    heroSubtitle: 'Je verliest bij Schrijven bijna nooit punten op moeilijke woorden. Je verliest ze op een vergeten hoofdletter en een vergeten punt.',
    image: '/images/blog/veelgemaakte-fouten-schrijven-examen-a2.jpg',
    imageAlt: 'Hand schrijft met pen op papier tijdens het oefenen voor het examen Schrijven A2',
    readingMinutes: 8,
    faq: [
      { q: 'Hoeveel schrijfopdrachten krijg ik op het examen Schrijven A2?', a: 'Vier opdrachten, in maximaal 40 minuten. Je maakt dit examen met pen en papier, niet op de computer. Dat staat zo op de pagina van DUO over de inhoud van de taalexamens.' },
      { q: 'Tellen spelfouten mee bij het examen Schrijven?', a: 'Je tekst wordt door gecertificeerde beoordelaars nagekeken, niet door een computer. Zij kijken naar meerdere dingen tegelijk, waaronder of je boodschap duidelijk is. Eén spelfout is geen ramp. Dezelfde fout in elke zin valt wel op.' },
      { q: 'Moet ik ‘u’ of ‘je’ schrijven?', a: 'Dat bepaalt de opdracht. Staat er ‘u’ in de vraag, dan schrijf jij ook ‘u’. Staat er ‘je’, dan schrijf jij ‘je’. Wissel niet halverwege je tekst.' },
      { q: 'Welke fout wordt het vaakst gemaakt?', a: 'De vergeten hoofdletter aan het begin van de zin en de vergeten punt aan het einde. Allebei kosten ze punten en allebei vind je ze terug als je je tekst één keer teruglest.' },
      { q: 'Mag ik een woordenboek gebruiken op het examen Schrijven?', a: 'Nee. Je mag geen hulpmiddelen gebruiken. Je tas, telefoon en horloge gaan in een kluisje.' },
      { q: 'Hoeveel tijd heb ik per opdracht?', a: 'Vier opdrachten in 40 minuten is gemiddeld 10 minuten per opdracht. Houd daarvan ongeveer 1 minuut over om terug te lezen.' },
      { q: 'Hoe oefen ik het beste voor Schrijven?', a: 'Schrijf een hele opdracht met de hand, en loop daarna de controlelijst uit dit artikel af. Dat werkt beter dan losse oefeningen over komma’s, omdat je op het examen ook alles tegelijk moet doen.' },
    ],
    articleHtml: `
<p>Bij het <strong>examen Schrijven A2</strong> verlies je de meeste punten niet aan moeilijke woorden. Je verliest ze aan kleine dingen: een vergeten hoofdletter, een vergeten punt, een komma die er niet staat. Hieronder staan de acht fouten die onze docent elke week terugziet als zij schrijfopdrachten nakijkt. Je hoeft er geen nieuw Nederlands voor te leren. Je moet ze alleen leren zien.</p>

${fact('Het examen Schrijven op niveau A2 maak je met pen en papier. Je krijgt 4 schrijfopdrachten en het examen duurt 40 minuten.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

${docentNote('Ik zie bijna nooit iemand zakken omdat hij een woord niet kende. Ik zie mensen punten verliezen op de punt aan het einde van de zin.')}

<div class="article-toc">
  <p class="article-toc-title">De acht fouten</p>
  <ol>
    <li><a href="#hoofdletter">De hoofdletter vergeten</a></li>
    <li><a href="#punt">De punt vergeten</a></li>
    <li><a href="#komma-want">Geen komma voor ‘want’ en ‘omdat’</a></li>
    <li><a href="#komma-brief">Geen komma bij de aanhef en de groet</a></li>
    <li><a href="#maanden">Maanden en dagen met een hoofdletter</a></li>
    <li><a href="#tijd">De tijd verkeerd opschrijven</a></li>
    <li><a href="#u-je">‘u’ en ‘je’ door elkaar</a></li>
    <li><a href="#teruglezen">Je tekst niet teruglezen</a></li>
  </ol>
</div>

<h2 id="hoofdletter">1. De hoofdletter vergeten</h2>

<p>Dit is de fout die het vaakst voorkomt. Een hoofdletter hoort op vier plekken, en die vier zijn genoeg voor A2.</p>

<div class="tip-card"><span class="tip-number">A</span><div><p>Aan het <strong>begin van elke zin</strong>. Ook als de zin maar drie woorden lang is.</p></div></div>
<div class="tip-card"><span class="tip-number">B</span><div><p>Bij <strong>namen van mensen en dieren</strong>: Fatima, Ahmed, mijn hond Max.</p></div></div>
<div class="tip-card"><span class="tip-number">C</span><div><p>Bij <strong>plaatsnamen en landen</strong>: Amsterdam, Rotterdam, Nederland, Syrië.</p></div></div>
<div class="tip-card"><span class="tip-number">D</span><div><p>Bij <strong>rivieren en gebergten</strong>: de Maas, de Rijn, de Alpen.</p></div></div>

${foutGoed(['ik woon in amsterdam met mijn zoon ali.'], ['Ik woon in Amsterdam met mijn zoon Ali.'])}

<h2 id="punt">2. De punt vergeten</h2>

<p>Elke zin eindigt met een punt. Ook de laatste zin van je brief. Ook een korte zin. Dit voelt als een detail, maar een beoordelaar ziet het meteen.</p>

${foutGoed(['Ik kom morgen langs Tot ziens'], ['Ik kom morgen langs. Tot ziens.'])}

<h2 id="komma-want">3. Geen komma voor ‘want’ en ‘omdat’</h2>

<p>Voor de woorden <strong>want</strong> en <strong>omdat</strong> staat een komma. Altijd.</p>

${foutGoed(['Ik kan niet komen want ik moet werken.'], ['Ik kan niet komen, want ik moet werken.', 'Ik kan niet komen, omdat ik moet werken.'])}

<p>Twijfel je tussen <em>want</em> en <em>omdat</em>? Kies dan <em>want</em>. Dat scheelt je een woordvolgordefout, en waarom dat zo is lees je in <a href="/nl/blog/want-of-omdat">Want of omdat: kies bijna altijd ‘want’</a>.</p>

<h2 id="komma-brief">4. Geen komma bij de aanhef en de groet</h2>

<p>Een brief of e-mail begint en eindigt bijna altijd hetzelfde. Op allebei die plekken staat een komma. Je weet van tevoren dat je ze nodig hebt, dus dit zijn de makkelijkste punten van het hele examen.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Waar</th><th>Zo schrijf je het</th><th>Let op</th></tr></thead>
  <tbody>
    <tr><td>Aanhef</td><td><strong>Beste meneer Jansen,</strong></td><td>komma erachter</td></tr>
    <tr><td>Aanhef, informeel</td><td><strong>Hoi Sanne,</strong></td><td>komma erachter</td></tr>
    <tr><td>Groet</td><td><strong>Met vriendelijke groet,</strong></td><td>komma erachter, je naam eronder</td></tr>
  </tbody>
</table>
</div>

<h2 id="maanden">5. Maanden en dagen met een hoofdletter</h2>

<p>In het Nederlands schrijf je de maanden en de dagen <strong>klein</strong>. In het Engels is dat anders, en daarom gaat het zo vaak mis bij mensen die ook Engels spreken.</p>

${foutGoed(['Ik kom op Maandag 3 Maart.'], ['Ik kom op maandag 3 maart.'])}

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><p>Landen en talen krijgen wél een hoofdletter: Nederland, Nederlands, Marokko, Arabisch. Maanden en dagen niet.</p></div>

<h2 id="tijd">6. De tijd verkeerd opschrijven</h2>

<p>Er zijn twee manieren om een tijd op te schrijven. Kies er één en meng ze niet. Een half-analoge, half-digitale tijd is een fout die een beoordelaar altijd ziet.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>Analoge tijd</h3><p class="compare-when">Je schrijft het woord ‘uur’</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Voorbeeld</p><p class="compare-val">1 uur · 9 uur · half tien</p></div>
      <div class="compare-row"><p class="compare-key">In een zin</p><p class="compare-val">Ik kom om 5 uur langs.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>Digitale tijd</h3><p class="compare-when">Je schrijft cijfers met een dubbele punt</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Voorbeeld</p><p class="compare-val">13:00 · 21:00 · 09:30</p></div>
      <div class="compare-row"><p class="compare-key">In een zin</p><p class="compare-val">Ik kom om 17:00 langs.</p></div>
    </div>
  </div>
</div>

${foutGoed(['Ik kom om 17: uur.', 'De afspraak is om 9:00 uur ’s ochtends om 9.'], ['Ik kom om 17:00.', 'Ik kom om 5 uur.'])}

<h2 id="u-je">7. ‘u’ en ‘je’ door elkaar</h2>

<p>Kijk naar de opdracht. Staat er <strong>u</strong> in de vraag? Dan schrijf jij ook <strong>u</strong>. Staat er <strong>je</strong>? Dan schrijf jij <strong>je</strong>. Kies er één en houd het je hele tekst vol.</p>

${foutGoed(['Beste meneer Jansen, kunt u mij helpen? Ik hoor graag van je.'], ['Beste meneer Jansen, kunt u mij helpen? Ik hoor graag van u.'])}

<p>Dit is geen beleefdheidsregel, het is een consistentieregel. Allebei is goed, door elkaar is fout.</p>

<h2 id="teruglezen">8. Je tekst niet teruglezen</h2>

<p>De zeven fouten hierboven vind je allemaal terug in twee minuten. Plan die twee minuten in. Je hebt 40 minuten voor vier opdrachten, dus ongeveer 10 minuten per opdracht — houd er per opdracht één minuut van over om te controleren.</p>

<div class="info-box info-box-green">
  <p><strong>Je controlelijst voor de laatste minuut.</strong> Hoofdletter aan het begin van elke zin · punt aan het einde van elke zin · komma voor <em>want</em> en <em>omdat</em> · komma na de aanhef en na de groet · maanden en dagen klein · één soort tijdnotatie · overal <em>u</em> of overal <em>je</em>.</p>
</div>


<!--uitleg:schrijven-klopt-->

<h2 id="oefenen">Waar je dit oefent</h2>

<p>Deze punten leer je niet uit een grammaticaboek. Je leert ze door een hele opdracht te schrijven en daarna gericht terug te kijken — precies zoals op het examen, waar je alles tegelijk moet doen.</p>

<p>Op ons platform schrijf je echte examenopdrachten en krijg je feedback per beoordelingspunt, met modelantwoorden en een beoordelingslijst die door een gecertificeerde NT2-docent zijn opgesteld en nagekeken. <a href="/nl/oefenexamen/a2/schrijven">Bekijk de oefenexamens Schrijven A2</a>.</p>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><p>Schrijf je normaal alles op je telefoon? Oefen dan minstens een paar keer <strong>met een pen op papier</strong>. Veertig minuten met de hand schrijven is zwaarder dan je denkt, en het examen Schrijven is het enige onderdeel dat niet op de computer gaat.</p></div>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Schrijven A2 in het kort</h3>
  <table class="facts-table">
    <tr><td>Opdrachten</td><td>4</td></tr>
    <tr><td>Tijd</td><td>40 min</td></tr>
    <tr><td>Waarop</td><td>pen en papier</td></tr>
    <tr><td>Nagekeken door</td><td>mensen</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'want-of-omdat', title: 'Want of omdat?', desc: 'Waarom ‘want’ op het examen bijna altijd de slimmere keuze is' },
      { slug: 'wederkerende-werkwoorden-nederlands', title: 'Wederkerende werkwoorden', desc: 'Me, je, zich — met 20 voorbeelden' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
    ],
    ctaTitle: 'Oefen Schrijven met echte examenopdrachten',
    ctaDesc: 'Tien oefenexamens Schrijven A2, met modelantwoorden en feedback per beoordelingspunt — geschreven door een gecertificeerde NT2-docent.',
    ctaHref: '/oefenen',
    ctaLabel: 'Gratis oefenen',
    translations: {
      en: {
        heroTitle: 'The 8 mistakes people make on the A2 Writing exam',
        description: 'Capitals, commas, times and ‘u’ versus ‘je’: the eight mistakes an NT2 teacher sees every week when she marks A2 writing tasks.',
        category: 'Tips & Preparation',
        breadcrumb: 'Mistakes on Writing A2',
        dateLabel: '16 September 2026',
        imageAlt: 'Hand writing with a pen on paper while practising for the A2 Writing exam',
        heroSubtitle: 'On Writing you almost never lose points on difficult words. You lose them on a missing capital and a missing full stop.',
        articleHtml: `
<p>On the <strong>A2 Writing exam</strong> you rarely lose points because a word was too hard. You lose them on small things: a missing capital, a missing full stop, a comma that is not there. Below are the eight mistakes our teacher sees every week when she marks writing tasks. You do not need to learn any new Dutch for them. You only need to learn to spot them.</p>

${factEn('The Writing exam at level A2 is taken with pen and paper. You get 4 writing tasks and the exam lasts 40 minutes.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

${docentNote('I almost never see someone fail because they did not know a word. I see people lose points on the full stop at the end of the sentence.', 'NT2 teacher')}

<div class="article-toc">
  <p class="article-toc-title">The eight mistakes</p>
  <ol>
    <li><a href="#hoofdletter">Forgetting the capital letter</a></li>
    <li><a href="#punt">Forgetting the full stop</a></li>
    <li><a href="#komma-want">No comma before ‘want’ and ‘omdat’</a></li>
    <li><a href="#komma-brief">No comma after the greeting and the sign-off</a></li>
    <li><a href="#maanden">Months and days with a capital</a></li>
    <li><a href="#tijd">Writing the time the wrong way</a></li>
    <li><a href="#u-je">Mixing ‘u’ and ‘je’</a></li>
    <li><a href="#teruglezen">Not reading your text back</a></li>
  </ol>
</div>

<h2 id="hoofdletter">1. Forgetting the capital letter</h2>

<p>This is the most common mistake of all. A capital belongs in four places, and those four are enough for A2.</p>

<div class="tip-card"><span class="tip-number">A</span><div><p>At the <strong>start of every sentence</strong>. Also when the sentence is only three words long.</p></div></div>
<div class="tip-card"><span class="tip-number">B</span><div><p>For <strong>names of people and animals</strong>: Fatima, Ahmed, my dog Max.</p></div></div>
<div class="tip-card"><span class="tip-number">C</span><div><p>For <strong>place names and countries</strong>: Amsterdam, Rotterdam, Nederland, Syrië.</p></div></div>
<div class="tip-card"><span class="tip-number">D</span><div><p>For <strong>rivers and mountain ranges</strong>: de Maas, de Rijn, de Alpen.</p></div></div>

${foutGoed(['ik woon in amsterdam met mijn zoon ali.'], ['Ik woon in Amsterdam met mijn zoon Ali.'], ['Wrong', 'Right'])}

<h2 id="punt">2. Forgetting the full stop</h2>

<p>Every sentence ends with a full stop. Including the last sentence of your letter. Including a short sentence. It feels like a detail, but an assessor notices it immediately.</p>

${foutGoed(['Ik kom morgen langs Tot ziens'], ['Ik kom morgen langs. Tot ziens.'], ['Wrong', 'Right'])}

<h2 id="komma-want">3. No comma before ‘want’ and ‘omdat’</h2>

<p>The words <strong>want</strong> and <strong>omdat</strong> (both meaning ‘because’) always take a comma in front of them.</p>

${foutGoed(['Ik kan niet komen want ik moet werken.'], ['Ik kan niet komen, want ik moet werken.', 'Ik kan niet komen, omdat ik moet werken.'], ['Wrong', 'Right'])}

<p>Not sure whether to use <em>want</em> or <em>omdat</em>? Choose <em>want</em>. It saves you a word-order mistake, and why that is so is explained in <a href="/en/blog/want-or-omdat-dutch">Want or omdat: almost always choose ‘want’</a>.</p>

<h2 id="komma-brief">4. No comma after the greeting and the sign-off</h2>

<p>A letter or e-mail almost always starts and ends the same way, and both of those lines take a comma. You know in advance that you will need them, which makes these the easiest points on the whole exam.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Where</th><th>How you write it</th><th>Watch out</th></tr></thead>
  <tbody>
    <tr><td>Greeting</td><td><strong>Beste meneer Jansen,</strong></td><td>comma after it</td></tr>
    <tr><td>Greeting, informal</td><td><strong>Hoi Sanne,</strong></td><td>comma after it</td></tr>
    <tr><td>Sign-off</td><td><strong>Met vriendelijke groet,</strong></td><td>comma after it, your name below</td></tr>
  </tbody>
</table>
</div>

<h2 id="maanden">5. Months and days with a capital</h2>

<p>In Dutch you write months and days <strong>in lower case</strong>. English does it differently, which is exactly why this goes wrong so often for people who also speak English.</p>

${foutGoed(['Ik kom op Maandag 3 Maart.'], ['Ik kom op maandag 3 maart.'], ['Wrong', 'Right'])}

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><p>Countries and languages <strong>do</strong> take a capital: Nederland, Nederlands, Marokko, Arabisch. Months and days do not.</p></div>

<h2 id="tijd">6. Writing the time the wrong way</h2>

<p>There are two ways to write a time. Pick one and do not mix them. A half-analogue, half-digital time is a mistake an assessor always spots.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>Analogue time</h3><p class="compare-when">You write the word ‘uur’</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Example</p><p class="compare-val">1 uur · 9 uur · half tien</p></div>
      <div class="compare-row"><p class="compare-key">In a sentence</p><p class="compare-val">Ik kom om 5 uur langs.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>Digital time</h3><p class="compare-when">You write digits with a colon</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Example</p><p class="compare-val">13:00 · 21:00 · 09:30</p></div>
      <div class="compare-row"><p class="compare-key">In a sentence</p><p class="compare-val">Ik kom om 17:00 langs.</p></div>
    </div>
  </div>
</div>

${foutGoed(['Ik kom om 17: uur.'], ['Ik kom om 17:00.', 'Ik kom om 5 uur.'], ['Wrong', 'Right'])}

<h2 id="u-je">7. Mixing ‘u’ and ‘je’</h2>

<p>Look at the task. Does the question use <strong>u</strong>? Then you write <strong>u</strong> too. Does it use <strong>je</strong>? Then you write <strong>je</strong>. Pick one and keep it up through your whole text.</p>

${foutGoed(['Beste meneer Jansen, kunt u mij helpen? Ik hoor graag van je.'], ['Beste meneer Jansen, kunt u mij helpen? Ik hoor graag van u.'], ['Wrong', 'Right'])}

<p>This is not a politeness rule, it is a consistency rule. Either form is fine; mixing them is not.</p>

<h2 id="teruglezen">8. Not reading your text back</h2>

<p>All seven mistakes above can be found again in two minutes. Plan those two minutes. You have 40 minutes for four tasks, so roughly 10 minutes each — keep one of those minutes per task for checking.</p>

<div class="info-box info-box-green">
  <p><strong>Your checklist for the last minute.</strong> Capital at the start of every sentence · full stop at the end of every sentence · comma before <em>want</em> and <em>omdat</em> · comma after the greeting and the sign-off · months and days in lower case · one kind of time notation · <em>u</em> everywhere or <em>je</em> everywhere.</p>
</div>


<!--uitleg:schrijven-klopt-->

<h2 id="oefenen">Where to practise this</h2>

<p>You do not learn these points from a grammar book. You learn them by writing a whole task and then looking back at it on purpose — exactly as on the exam, where you have to do everything at once.</p>

<p>On our platform you write real exam tasks and get feedback per assessment point, with model answers and a marking rubric written and checked by a certified NT2 teacher. <a href="/en/practice-exam/a2/writing">See the A2 Writing practice exams</a>.</p>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><p>Do you normally write everything on your phone? Then practise at least a few times <strong>with a pen on paper</strong>. Forty minutes of handwriting is heavier than you expect, and Writing is the only part that is not done on a computer.</p></div>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Writing A2 in short</h3>
  <table class="facts-table">
    <tr><td>Tasks</td><td>4</td></tr>
    <tr><td>Time</td><td>40 min</td></tr>
    <tr><td>On</td><td>pen and paper</td></tr>
    <tr><td>Marked by</td><td>people</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'How many writing tasks do I get on the A2 Writing exam?', a: 'Four tasks, in a maximum of 40 minutes. You take this exam with pen and paper, not on a computer. That is what DUO states on its page about the content of the language exams.' },
          { q: 'Do spelling mistakes count on the Writing exam?', a: 'Your text is marked by certified assessors, not by a computer. They look at several things at once, including whether your message is clear. One spelling mistake is not a disaster. The same mistake in every sentence does stand out.' },
          { q: 'Should I write ‘u’ or ‘je’?', a: 'The task decides. If the question uses ‘u’, you write ‘u’. If it uses ‘je’, you write ‘je’. Do not switch halfway through your text.' },
          { q: 'Which mistake is made most often?', a: 'The forgotten capital at the start of the sentence and the forgotten full stop at the end. Both cost points, and both are found again if you read your text back once.' },
          { q: 'May I use a dictionary on the Writing exam?', a: 'No. You may not use any aids. Your bag, phone and watch go into a locker.' },
          { q: 'How much time do I have per task?', a: 'Four tasks in 40 minutes is an average of 10 minutes per task. Keep about one of those minutes to read the task back.' },
          { q: 'What is the best way to practise Writing?', a: 'Write a whole task by hand, then work through the checklist in this article. That works better than separate comma exercises, because on the exam you also have to do everything at once.' },
        ],
        relatedPosts: [
          { slug: 'want-of-omdat', title: 'Want or omdat?', desc: 'Why ‘want’ is almost always the smarter choice on the exam' },
          { slug: 'wederkerende-werkwoorden-nederlands', title: 'Dutch reflexive verbs', desc: 'Me, je, zich — with 20 examples' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
        ],
        ctaTitle: 'Practise Writing with real exam tasks',
        ctaDesc: 'Ten A2 Writing practice exams, with model answers and feedback per assessment point — written by a certified NT2 teacher.',
        ctaLabel: 'Practise for free',
      },
      ar: {
        heroTitle: 'الأخطاء الثمانية الأكثر شيوعًا في امتحان الكتابة A2',
        description: 'الحروف الكبيرة والفواصل وكتابة الوقت واختيار «u» أو «je»: ثمانية أخطاء تراها مدرّسة NT2 كل أسبوع أثناء تصحيح واجبات الكتابة A2.',
        category: 'نصائح وتحضير',
        breadcrumb: 'أخطاء امتحان الكتابة A2',
        dateLabel: '١٦ سبتمبر ٢٠٢٦',
        imageAlt: 'يد تكتب بقلم على ورقة أثناء التدريب على امتحان الكتابة A2',
        heroSubtitle: 'في امتحان الكتابة نادرًا ما تخسر نقاطًا بسبب كلمات صعبة. تخسرها بسبب حرف كبير ناقص ونقطة ناقصة.',
        articleHtml: `
<p>في <strong>امتحان الكتابة A2</strong> نادرًا ما تخسر النقاط لأن الكلمة كانت صعبة. تخسرها بسبب أمور صغيرة: حرف كبير ناقص، نقطة ناقصة، فاصلة غير موجودة. في ما يلي الأخطاء الثمانية التي تراها مدرّستنا كل أسبوع أثناء تصحيح واجبات الكتابة. لا تحتاج إلى تعلّم هولندية جديدة من أجلها، بل تحتاج فقط إلى أن تتعلّم كيف تراها.</p>

${factAr('يُؤدى امتحان الكتابة في المستوى A2 بالقلم والورق. تحصل على 4 واجبات كتابة ويستغرق الامتحان 40 دقيقة.', 'inburgeren.nl — محتوى امتحانات اللغة', SRC_INHOUD)}

${docentNote('لا أكاد أرى أحدًا يرسب لأنه لم يعرف كلمة. أرى أشخاصًا يخسرون نقاطًا بسبب النقطة في نهاية الجملة.', 'مدرّسة NT2')}

<div class="article-toc">
  <p class="article-toc-title">الأخطاء الثمانية</p>
  <ol>
    <li><a href="#hoofdletter">نسيان الحرف الكبير</a></li>
    <li><a href="#punt">نسيان النقطة</a></li>
    <li><a href="#komma-want">لا فاصلة قبل «want» و«omdat»</a></li>
    <li><a href="#komma-brief">لا فاصلة بعد التحية وبعد الخِتام</a></li>
    <li><a href="#maanden">كتابة الشهور والأيام بحرف كبير</a></li>
    <li><a href="#tijd">كتابة الوقت بطريقة خاطئة</a></li>
    <li><a href="#u-je">الخلط بين «u» و«je»</a></li>
    <li><a href="#teruglezen">عدم إعادة قراءة نصّك</a></li>
  </ol>
</div>

<h2 id="hoofdletter">١. نسيان الحرف الكبير</h2>

<p>هذا هو الخطأ الأكثر شيوعًا. الحرف الكبير يلزم في أربعة مواضع، وهذه الأربعة تكفي في المستوى A2.</p>

<div class="tip-card"><span class="tip-number">A</span><div><p>في <strong>بداية كل جملة</strong>، حتى لو كانت الجملة من ثلاث كلمات.</p></div></div>
<div class="tip-card"><span class="tip-number">B</span><div><p>في <strong>أسماء الأشخاص والحيوانات</strong>: ${nlEx('Fatima, Ahmed, mijn hond Max')}.</p></div></div>
<div class="tip-card"><span class="tip-number">C</span><div><p>في <strong>أسماء المدن والبلدان</strong>: ${nlEx('Amsterdam, Rotterdam, Nederland, Syrië')}.</p></div></div>
<div class="tip-card"><span class="tip-number">D</span><div><p>في <strong>الأنهار والجبال</strong>: ${nlEx('de Maas, de Rijn, de Alpen')}.</p></div></div>

${foutGoed([nlEx('ik woon in amsterdam met mijn zoon ali.')], [nlEx('Ik woon in Amsterdam met mijn zoon Ali.')], ['خطأ', 'صواب'])}

<h2 id="punt">٢. نسيان النقطة</h2>

<p>كل جملة تنتهي بنقطة. وكذلك الجملة الأخيرة في رسالتك، وكذلك الجملة القصيرة. يبدو الأمر تفصيلًا صغيرًا، لكن المصحّح يلاحظه فورًا.</p>

${foutGoed([nlEx('Ik kom morgen langs Tot ziens')], [nlEx('Ik kom morgen langs. Tot ziens.')], ['خطأ', 'صواب'])}

<h2 id="komma-want">٣. لا فاصلة قبل «want» و«omdat»</h2>

<p>قبل كلمتَي <strong>want</strong> و<strong>omdat</strong> (وكلتاهما تعني «لأن») توضع فاصلة دائمًا.</p>

${foutGoed([nlEx('Ik kan niet komen want ik moet werken.')], [nlEx('Ik kan niet komen, want ik moet werken.'), nlEx('Ik kan niet komen, omdat ik moet werken.')], ['خطأ', 'صواب'])}

<p>هل تتردد بين <em>want</em> و<em>omdat</em>؟ اختر <em>want</em>؛ فهذا يوفّر عليك خطأً في ترتيب الكلمات، والسبب مشروح في <a href="/ar/المدونة/want-أم-omdat">want أم omdat</a>.</p>

<h2 id="komma-brief">٤. لا فاصلة بعد التحية وبعد الخِتام</h2>

<p>تبدأ الرسالة أو البريد الإلكتروني وتنتهي دائمًا تقريبًا بالطريقة نفسها، وفي كلا الموضعين توضع فاصلة. أنت تعرف مسبقًا أنك ستحتاج إليهما، ولذلك فهذه أسهل نقاط في الامتحان كله.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>الموضع</th><th>هكذا تكتبه</th><th>انتبه</th></tr></thead>
  <tbody>
    <tr><td>التحية</td><td><strong>${nlEx('Beste meneer Jansen,')}</strong></td><td>فاصلة بعدها</td></tr>
    <tr><td>التحية غير الرسمية</td><td><strong>${nlEx('Hoi Sanne,')}</strong></td><td>فاصلة بعدها</td></tr>
    <tr><td>الخِتام</td><td><strong>${nlEx('Met vriendelijke groet,')}</strong></td><td>فاصلة بعدها واسمك تحتها</td></tr>
  </tbody>
</table>
</div>

<h2 id="maanden">٥. كتابة الشهور والأيام بحرف كبير</h2>

<p>في الهولندية تُكتب الشهور والأيام <strong>بحرف صغير</strong>. الإنجليزية تفعل العكس، ولهذا يخطئ كثيرون ممن يتحدثون الإنجليزية أيضًا.</p>

${foutGoed([nlEx('Ik kom op Maandag 3 Maart.')], [nlEx('Ik kom op maandag 3 maart.')], ['خطأ', 'صواب'])}

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><p>أما البلدان واللغات <strong>فتأخذ</strong> حرفًا كبيرًا: ${nlEx('Nederland, Nederlands, Marokko, Arabisch')}. الشهور والأيام لا تأخذه.</p></div>

<h2 id="tijd">٦. كتابة الوقت بطريقة خاطئة</h2>

<p>هناك طريقتان لكتابة الوقت. اختر واحدة ولا تخلط بينهما؛ فالوقت المكتوب نصفه بالأرقام ونصفه بالكلمات خطأ يلاحظه المصحّح دائمًا.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>الوقت بالكلمات</h3><p class="compare-when">تكتب كلمة «uur»</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">مثال</p><p class="compare-val">${nlEx('1 uur · 9 uur · half tien')}</p></div>
      <div class="compare-row"><p class="compare-key">في جملة</p><p class="compare-val">${nlEx('Ik kom om 5 uur langs.')}</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>الوقت بالأرقام</h3><p class="compare-when">تكتب أرقامًا مع نقطتين</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">مثال</p><p class="compare-val">${nlEx('13:00 · 21:00 · 09:30')}</p></div>
      <div class="compare-row"><p class="compare-key">في جملة</p><p class="compare-val">${nlEx('Ik kom om 17:00 langs.')}</p></div>
    </div>
  </div>
</div>

${foutGoed([nlEx('Ik kom om 17: uur.')], [nlEx('Ik kom om 17:00.'), nlEx('Ik kom om 5 uur.')], ['خطأ', 'صواب'])}

<h2 id="u-je">٧. الخلط بين «u» و«je»</h2>

<p>انظر إلى السؤال. هل يستخدم <strong>u</strong>؟ إذن اكتب أنت <strong>u</strong> أيضًا. هل يستخدم <strong>je</strong>؟ إذن اكتب <strong>je</strong>. اختر واحدة والتزم بها في النص كله.</p>

${foutGoed([nlEx('Beste meneer Jansen, kunt u mij helpen? Ik hoor graag van je.')], [nlEx('Beste meneer Jansen, kunt u mij helpen? Ik hoor graag van u.')], ['خطأ', 'صواب'])}

<p>هذه ليست قاعدة تهذيب بل قاعدة اتّساق: كلتا الصيغتين صحيحة، أما الخلط بينهما فخطأ.</p>

<h2 id="teruglezen">٨. عدم إعادة قراءة نصّك</h2>

<p>الأخطاء السبعة أعلاه يمكنك أن تجدها كلها في دقيقتين. خصّص هاتين الدقيقتين. لديك 40 دقيقة لأربعة واجبات، أي نحو 10 دقائق لكل واجب — احتفظ بدقيقة منها للمراجعة.</p>

<div class="info-box info-box-green">
  <p><strong>قائمة المراجعة في الدقيقة الأخيرة:</strong> حرف كبير في بداية كل جملة · نقطة في نهاية كل جملة · فاصلة قبل <em>want</em> و<em>omdat</em> · فاصلة بعد التحية وبعد الخِتام · الشهور والأيام بحرف صغير · طريقة واحدة لكتابة الوقت · <em>u</em> في كل مكان أو <em>je</em> في كل مكان.</p>
</div>


<!--uitleg:schrijven-klopt-->

<h2 id="oefenen">أين تتدرّب على هذا</h2>

<p>هذه النقاط لا تتعلّمها من كتاب قواعد، بل بكتابة واجب كامل ثم مراجعته عن قصد — تمامًا كما في الامتحان، حيث عليك أن تفعل كل شيء في الوقت نفسه.</p>

<p>على منصّتنا تكتب واجبات امتحانية حقيقية وتحصل على ملاحظات لكل معيار تقييم، مع إجابات نموذجية وقائمة تقييم كتبتها مدرّسة NT2 معتمدة. لا ذكاء اصطناعي. <a href="/ar/امتحان-تجريبي/a2/الكتابة">اطّلع على امتحانات الكتابة التجريبية A2</a>.</p>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><p>هل تكتب عادةً كل شيء على هاتفك؟ إذن تدرّب بضع مرات على الأقل <strong>بالقلم على الورق</strong>. أربعون دقيقة من الكتابة باليد أثقل مما تتوقع، والكتابة هي الجزء الوحيد الذي لا يُؤدى على الحاسوب.</p></div>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">الكتابة A2 باختصار</h3>
  <table class="facts-table">
    <tr><td>الواجبات</td><td>4</td></tr>
    <tr><td>المدة</td><td>40 دقيقة</td></tr>
    <tr><td>الوسيلة</td><td>قلم وورق</td></tr>
    <tr><td>التصحيح</td><td>بشر</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'كم واجب كتابة أحصل عليه في امتحان الكتابة A2؟', a: 'أربعة واجبات في 40 دقيقة كحد أقصى. وتؤدي هذا الامتحان بالقلم والورق لا على الحاسوب، وهذا ما تذكره DUO في صفحتها عن محتوى امتحانات اللغة.' },
          { q: 'هل تُحتسب الأخطاء الإملائية في امتحان الكتابة؟', a: 'يصحّح نصّك مصحّحون معتمدون لا حاسوب. وهم ينظرون إلى عدة أمور في آن واحد، منها وضوح رسالتك. خطأ إملائي واحد ليس كارثة، أما تكرار الخطأ نفسه في كل جملة فيلفت الانتباه.' },
          { q: 'هل أكتب «u» أم «je»؟', a: 'السؤال هو الذي يحدد ذلك. إن استخدم السؤال «u» فاكتب «u»، وإن استخدم «je» فاكتب «je». ولا تبدّل في منتصف النص.' },
          { q: 'ما الخطأ الأكثر شيوعًا؟', a: 'الحرف الكبير المنسي في بداية الجملة والنقطة المنسية في نهايتها. كلاهما يكلّف نقاطًا، وكلاهما تجده إن أعدت قراءة نصّك مرة واحدة.' },
          { q: 'هل يُسمح باستخدام قاموس في امتحان الكتابة؟', a: 'لا. لا يُسمح بأي وسائل مساعدة. حقيبتك وهاتفك وساعتك توضع في خزانة.' },
          { q: 'كم من الوقت لديّ لكل واجب؟', a: 'أربعة واجبات في 40 دقيقة تعني نحو 10 دقائق لكل واجب. احتفظ بدقيقة منها لإعادة القراءة.' },
          { q: 'ما أفضل طريقة للتدرّب على الكتابة؟', a: 'اكتب واجبًا كاملًا بخط اليد، ثم راجع قائمة هذا المقال. هذا أنفع من تمارين منفصلة على الفواصل، لأنك في الامتحان أيضًا مضطر إلى فعل كل شيء في وقت واحد.' },
        ],
        relatedPosts: [
          { slug: 'want-of-omdat', title: 'want أم omdat؟', desc: 'لماذا يكون «want» الخيار الأذكى في الامتحان غالبًا' },
          { slug: 'wederkerende-werkwoorden-nederlands', title: 'الأفعال الانعكاسية', desc: 'me وje وzich — مع 20 مثالًا' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
        ],
        ctaTitle: 'تدرّب على الكتابة بواجبات امتحانية حقيقية',
        ctaDesc: 'عشرة امتحانات كتابة تجريبية A2 مع إجابات نموذجية وملاحظات لكل معيار تقييم — من إعداد مدرّسة NT2 معتمدة.',
        ctaLabel: 'تدرّب مجانًا',
      },
    },
  },
  // ───────────────────────────────────────────────────── 7. WANT OF OMDAT
  {
    slug: 'want-of-omdat',
    title: 'Want of omdat? Kies bijna altijd ‘want’',
    description: 'Want en omdat betekenen hetzelfde, maar de woordvolgorde erna is anders. Waarom ‘want’ op het inburgeringsexamen bijna altijd de slimmere keuze is.',
    category: 'Uitleg & Taal',
    categoryKey: 'uitleg',
    categoryColor: 'blue',
    datePublished: '2026-09-16',
    dateModified: '2026-09-16',
    dateLabel: '16 september 2026',
    breadcrumb: 'Want of omdat',
    heroTitle: 'Want of omdat? Kies bijna altijd ‘want’',
    heroSubtitle: 'Ze betekenen hetzelfde. Het verschil zit in wat er daarna met het werkwoord gebeurt — en daar gaat het mis.',
    image: '/images/blog/want-of-omdat.jpg',
    imageAlt: 'Cursist oefent Nederlandse zinnen met want en omdat aan een tafel met een schrift',
    readingMinutes: 6,
    faq: [
      { q: 'Betekenen want en omdat hetzelfde?', a: 'Ja. Allebei geven ze een reden. Het verschil is grammaticaal: na ‘want’ blijft de woordvolgorde gewoon, na ‘omdat’ gaat het werkwoord naar het einde van de zin.' },
      { q: 'Staat er een komma voor want?', a: 'Ja. Voor ‘want’ staat een komma, en voor ‘omdat’ ook. Die komma vergeten is een van de meest gemaakte fouten bij het examen Schrijven.' },
      { q: 'Mag ik een zin met ‘want’ beginnen?', a: 'Beter niet. Wil je met de reden beginnen, gebruik dan ‘Omdat ...’ en let op de woordvolgorde, of draai de zin om.' },
      { q: 'Wat is een bijzin?', a: 'Een zin die niet alleen kan staan en waarin het werkwoord naar achteren gaat. ‘Omdat ik ziek ben’ is een bijzin. ‘Ik ben ziek’ is een hoofdzin.' },
      { q: 'Is ‘want’ minder goed Nederlands dan ‘omdat’?', a: 'Nee. ‘Want’ is gewoon Nederlands en op A2 en B1 volledig correct. Je wordt niet beoordeeld op moeilijke zinnen, maar op correcte en begrijpelijke zinnen.' },
      { q: 'Wanneer moet ik toch ‘omdat’ gebruiken?', a: 'Als antwoord op een directe waarom-vraag. Op ‘Waarom kom je niet?’ antwoord je ‘Omdat ik ziek ben’, niet ‘Want ik ben ziek’. Die vraag krijg je op het examen Spreken regelmatig.' },
    ],
    articleHtml: `
<p><strong>Want</strong> en <strong>omdat</strong> betekenen hetzelfde: ze geven allebei een reden. Het verschil zit in de <strong>woordvolgorde</strong>. Na <em>want</em> verandert er niets. Na <em>omdat</em> gaat het werkwoord naar het einde van de zin. Daarom is het advies op het examen simpel: twijfel je, kies dan <em>want</em>. Je zegt precies hetzelfde en je kunt geen woordvolgordefout maken.</p>

${docentNote('Als je twee zinnen wilt verbinden, kies dan ‘want’ in plaats van ‘omdat’. Met ‘want’ maak je twee hoofdzinnen en hoef je niets te veranderen. Bij ‘omdat’ moet je de woordvolgorde aanpassen, en daar gaat het mis.')}

<h2 id="voorbeeld">Het verschil in één voorbeeld</h2>

<p>Dezelfde gedachte, drie keer opgeschreven. Kijk alleen naar het werkwoord <em>ben</em> en <em>bent</em>.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Manier</th><th>De zin</th><th>Waar staat het werkwoord?</th></tr></thead>
  <tbody>
    <tr><td><strong>met want</strong></td><td>Ik zou met de auto gaan, <strong>want</strong> dan <strong>ben</strong> je sneller.</td><td>op plek twee, gewoon</td></tr>
    <tr><td><strong>twee losse zinnen</strong></td><td>Ik zou met de auto gaan. Je <strong>bent</strong> sneller.</td><td>op plek twee, gewoon</td></tr>
    <tr><td><strong>met omdat</strong></td><td>Ik zou met de auto gaan, <strong>omdat</strong> je dan sneller <strong>bent</strong>.</td><td>helemaal achteraan</td></tr>
  </tbody>
</table>
</div>

<p>Dat is het hele verschil. Er is geen betekenisverschil dat je op A2 moet kennen. Er is alleen een plek waar het werkwoord heen moet.</p>

<h2 id="hoofdzin">Waarom ‘want’ makkelijker is</h2>

<p>Na <strong>want</strong> komt een <strong>hoofdzin</strong>. Een hoofdzin is een gewone zin: onderwerp, werkwoord, rest. Je hoeft niets te verplaatsen.</p>

<div class="tip-card"><span class="tip-number">1</span><div><p>Ik kom niet, <strong>want</strong> ik <strong>ben</strong> ziek.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p>Ik neem de trein, <strong>want</strong> de auto <strong>is</strong> kapot.</p></div></div>

<p>Na <strong>omdat</strong> komt een <strong>bijzin</strong>. In een bijzin gaat het werkwoord naar het einde.</p>

<div class="tip-card"><span class="tip-number">1</span><div><p>Ik kom niet, <strong>omdat</strong> ik ziek <strong>ben</strong>.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p>Ik neem de trein, <strong>omdat</strong> de auto kapot <strong>is</strong>.</p></div></div>

<p>Heb je twee werkwoorden, dan gaan ze allebei naar achteren: <em>Ik kom niet, omdat ik moet werken.</em></p>

${foutGoed(['Ik kom niet, omdat ik ben ziek.', 'Ik neem de trein, omdat de auto is kapot.'], ['Ik kom niet, omdat ik ziek ben.', 'Ik kom niet, want ik ben ziek.'])}

<h2 id="drie-zinnen">De derde optie: maak er twee zinnen van</h2>

<p>Je hoeft zinnen helemaal niet te verbinden. Twee korte, correcte zinnen zijn beter dan één lange zin met een fout erin. Op A2 word je beoordeeld op of je begrijpelijk en correct schrijft en spreekt, niet op of je ingewikkelde zinnen maakt.</p>

<div class="info-box info-box-green">
  <p><strong>Ik zou met de auto naar mijn werk gaan. Je bent sneller.</strong> Twee zinnen, allebei goed, geen enkel risico.</p>
</div>

<h2 id="uitzondering">Wanneer je ‘omdat’ wél gebruikt</h2>

<p>Op één plek kun je <em>want</em> niet gebruiken: als antwoord op de vraag <strong>waarom?</strong></p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>Goed</h3><p class="compare-when">Antwoord op een waarom-vraag</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Vraag</p><p class="compare-val">Waarom kom je niet?</p></div>
      <div class="compare-row"><p class="compare-key">Antwoord</p><p class="compare-val">Omdat ik ziek <strong>ben</strong>.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>Klinkt vreemd</h3><p class="compare-when">Zelfde vraag, met want</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Vraag</p><p class="compare-val">Waarom kom je niet?</p></div>
      <div class="compare-row"><p class="compare-key">Antwoord</p><p class="compare-val">Want ik ben ziek.</p></div>
    </div>
  </div>
</div>

<p>Die waarom-vraag krijg je op het examen Spreken regelmatig. Oefen <em>omdat</em> dus wel — maar oefen het apart, en bouw er geen lange zin mee terwijl de klok loopt.</p>

<!--uitleg:want-of-omdat-->

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Welke zin is goed?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Ik ga naar de dokter, omdat ik heb pijn.</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>Ik ga naar de dokter, want ik heb pijn.</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>Ik ga naar de dokter want, ik pijn heb.</span></button>
  </div>
  <div class="blog-quiz-ans">Het juiste antwoord is <strong>B</strong>. Na <em>want</em> blijft de zin gewoon: <em>ik heb pijn</em>. Met <em>omdat</em> was het geworden: <em>omdat ik pijn heb</em>. En de komma staat altijd vóór <em>want</em>, nooit erna.</div>
</div>

<h2 id="komma">Vergeet de komma niet</h2>

<p>Voor <em>want</em> en voor <em>omdat</em> staat een komma. Dat vergeten kandidaten vaak, en bij Schrijven kost het punten. Meer van die kleine dingen staan in <a href="/nl/blog/veelgemaakte-fouten-schrijven-examen-a2">de acht fouten bij het examen Schrijven A2</a>.</p>

<h2 id="oefenen">Oefen het hardop</h2>

<p>Woordvolgorde leer je niet uit een tabel. Je leert het door zinnen te maken en terug te horen wat er misgaat. Bij Spreken merk je het verschil het snelst: daar heb je geen tijd om een zin te herstellen.</p>

<p><a href="/nl/oefenexamen/a2/schrijven">Oefenexamens Schrijven A2</a> · <a href="/nl/oefenexamen/a2/spreken">Oefenexamens Spreken A2</a></p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">In het kort</h3>
  <table class="facts-table">
    <tr><td>want</td><td>werkwoord blijft staan</td></tr>
    <tr><td>omdat</td><td>werkwoord naar achteren</td></tr>
    <tr><td>dus</td><td>werkwoord blijft staan</td></tr>
    <tr><td>komma</td><td>altijd ervoor</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'De 8 fouten bij Schrijven A2', desc: 'Hoofdletters, komma’s, tijden en ‘u’ of ‘je’' },
      { slug: 'wederkerende-werkwoorden-nederlands', title: 'Wederkerende werkwoorden', desc: 'Me, je, zich — met 20 voorbeelden' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
    ],
    ctaTitle: 'Oefen je zinnen op het echte examen',
    ctaDesc: 'Schrijf- en spreekopdrachten in het format van DUO, met feedback per beoordelingspunt van een gecertificeerde NT2-docent.',
    ctaHref: '/oefenen',
    ctaLabel: 'Gratis oefenen',
    translations: {
      en: {
        heroTitle: 'Want or omdat? Almost always choose ‘want’',
        description: 'Want and omdat mean the same thing, but the word order after them is different. Why ‘want’ is almost always the smarter choice on the integration exam.',
        category: 'Explained & Language',
        breadcrumb: 'Want or omdat',
        dateLabel: '16 September 2026',
        imageAlt: 'Learner practising Dutch sentences with want and omdat in a notebook',
        heroSubtitle: 'They mean the same thing. The difference is what happens to the verb afterwards — and that is where it goes wrong.',
        articleHtml: `
<p><strong>Want</strong> and <strong>omdat</strong> mean the same thing: both give a reason, like ‘because’. The difference is the <strong>word order</strong>. After <em>want</em> nothing changes. After <em>omdat</em> the verb moves to the end of the sentence. So the advice for the exam is simple: if you are not sure, choose <em>want</em>. You say exactly the same thing and you cannot make a word-order mistake.</p>

${docentNote('If you want to connect two sentences, choose ‘want’ instead of ‘omdat’. With ‘want’ you make two main clauses and you do not have to change anything. With ‘omdat’ you have to adjust the word order, and that is where it goes wrong.', 'NT2 teacher')}

<h2 id="voorbeeld">The difference in one example</h2>

<p>The same thought, written three ways. Look only at the verb <em>ben</em> and <em>bent</em>.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Way</th><th>The sentence</th><th>Where is the verb?</th></tr></thead>
  <tbody>
    <tr><td><strong>with want</strong></td><td>Ik zou met de auto gaan, <strong>want</strong> dan <strong>ben</strong> je sneller.</td><td>in second place, as normal</td></tr>
    <tr><td><strong>two separate sentences</strong></td><td>Ik zou met de auto gaan. Je <strong>bent</strong> sneller.</td><td>in second place, as normal</td></tr>
    <tr><td><strong>with omdat</strong></td><td>Ik zou met de auto gaan, <strong>omdat</strong> je dan sneller <strong>bent</strong>.</td><td>right at the end</td></tr>
  </tbody>
</table>
</div>

<p>That is the whole difference. There is no difference in meaning you need to know at A2. There is only a place the verb has to go.</p>

<h2 id="hoofdzin">Why ‘want’ is easier</h2>

<p>After <strong>want</strong> comes a <strong>main clause</strong>: subject, verb, rest. You move nothing.</p>

<div class="tip-card"><span class="tip-number">1</span><div><p>Ik kom niet, <strong>want</strong> ik <strong>ben</strong> ziek.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p>Ik neem de trein, <strong>want</strong> de auto <strong>is</strong> kapot.</p></div></div>

<p>After <strong>omdat</strong> comes a <strong>subordinate clause</strong>, and there the verb goes to the end.</p>

<div class="tip-card"><span class="tip-number">1</span><div><p>Ik kom niet, <strong>omdat</strong> ik ziek <strong>ben</strong>.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p>Ik neem de trein, <strong>omdat</strong> de auto kapot <strong>is</strong>.</p></div></div>

<p>With two verbs, both of them move back: <em>Ik kom niet, omdat ik moet werken.</em></p>

${foutGoed(['Ik kom niet, omdat ik ben ziek.', 'Ik neem de trein, omdat de auto is kapot.'], ['Ik kom niet, omdat ik ziek ben.', 'Ik kom niet, want ik ben ziek.'], ['Wrong', 'Right'])}

<h2 id="drie-zinnen">The third option: make it two sentences</h2>

<p>You do not have to connect sentences at all. Two short, correct sentences are better than one long sentence with a mistake in it. At A2 you are assessed on whether you write and speak clearly and correctly, not on whether you build complex sentences.</p>

<div class="info-box info-box-green">
  <p><strong>Ik zou met de auto naar mijn werk gaan. Je bent sneller.</strong> Two sentences, both correct, no risk at all.</p>
</div>

<h2 id="uitzondering">When you do use ‘omdat’</h2>

<p>There is one place where <em>want</em> does not work: as the answer to the question <strong>waarom?</strong> (why?).</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>Right</h3><p class="compare-when">Answer to a why-question</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Question</p><p class="compare-val">Waarom kom je niet?</p></div>
      <div class="compare-row"><p class="compare-key">Answer</p><p class="compare-val">Omdat ik ziek <strong>ben</strong>.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>Sounds odd</h3><p class="compare-when">Same question, with want</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Question</p><p class="compare-val">Waarom kom je niet?</p></div>
      <div class="compare-row"><p class="compare-key">Answer</p><p class="compare-val">Want ik ben ziek.</p></div>
    </div>
  </div>
</div>

<p>You get that why-question regularly on the Speaking exam. So do practise <em>omdat</em> — but practise it separately, and do not build long sentences with it while the clock is running.</p>

<!--uitleg:want-of-omdat-->

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Which sentence is correct?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Ik ga naar de dokter, omdat ik heb pijn.</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>Ik ga naar de dokter, want ik heb pijn.</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>Ik ga naar de dokter want, ik pijn heb.</span></button>
  </div>
  <div class="blog-quiz-ans">The correct answer is <strong>B</strong>. After <em>want</em> the sentence stays normal: <em>ik heb pijn</em>. With <em>omdat</em> it would have been <em>omdat ik pijn heb</em>. And the comma always goes <em>before</em> <em>want</em>, never after it.</div>
</div>

<h2 id="komma">Do not forget the comma</h2>

<p>A comma goes before <em>want</em> and before <em>omdat</em>. Candidates forget it often, and on the Writing exam it costs points. More of those small things are in <a href="/en/blog/common-mistakes-writing-exam-a2">the eight mistakes on the A2 Writing exam</a>.</p>

<h2 id="oefenen">Practise it out loud</h2>

<p>You do not learn word order from a table. You learn it by making sentences and hearing what goes wrong. On Speaking you notice the difference fastest: there you have no time to repair a sentence.</p>

<p><a href="/en/practice-exam/a2/writing">A2 Writing practice exams</a> · <a href="/en/practice-exam/a2/speaking">A2 Speaking practice exams</a></p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">In short</h3>
  <table class="facts-table">
    <tr><td>want</td><td>verb stays put</td></tr>
    <tr><td>omdat</td><td>verb moves back</td></tr>
    <tr><td>dus</td><td>verb stays put</td></tr>
    <tr><td>comma</td><td>always before it</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'Do want and omdat mean the same thing?', a: 'Yes. Both give a reason. The difference is grammatical: after ‘want’ the word order stays normal, after ‘omdat’ the verb moves to the end of the clause.' },
          { q: 'Is there a comma before want?', a: 'Yes. A comma goes before ‘want’, and before ‘omdat’ too. Forgetting it is one of the most common mistakes on the Writing exam.' },
          { q: 'Can I start a sentence with ‘want’?', a: 'Better not. If you want to start with the reason, use ‘Omdat ...’ and mind the word order, or turn the sentence around.' },
          { q: 'What is a subordinate clause?', a: 'A clause that cannot stand on its own and in which the verb moves to the end. ‘Omdat ik ziek ben’ is a subordinate clause. ‘Ik ben ziek’ is a main clause.' },
          { q: 'Is ‘want’ worse Dutch than ‘omdat’?', a: 'No. ‘Want’ is ordinary Dutch and completely correct at A2 and B1. You are not assessed on difficult sentences, but on correct and understandable ones.' },
          { q: 'When do I have to use ‘omdat’ anyway?', a: 'As the answer to a direct why-question. To ‘Waarom kom je niet?’ you answer ‘Omdat ik ziek ben’, not ‘Want ik ben ziek’. You get that question regularly on the Speaking exam.' },
        ],
        relatedPosts: [
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'The 8 mistakes on Writing A2', desc: 'Capitals, commas, times and ‘u’ versus ‘je’' },
          { slug: 'wederkerende-werkwoorden-nederlands', title: 'Dutch reflexive verbs', desc: 'Me, je, zich — with 20 examples' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
        ],
        ctaTitle: 'Practise your sentences on the real exam',
        ctaDesc: 'Writing and speaking tasks in DUO’s format, with feedback per assessment point from a certified NT2 teacher.',
        ctaLabel: 'Practise for free',
      },
      ar: {
        heroTitle: 'want أم omdat؟ اختر «want» في أغلب الأحيان',
        description: 'تعني want وomdat الشيء نفسه، لكن ترتيب الكلمات بعدهما مختلف. لماذا يكون «want» الخيار الأذكى في امتحان الاندماج غالبًا.',
        category: 'شرح ولغة',
        breadcrumb: 'want أم omdat',
        dateLabel: '١٦ سبتمبر ٢٠٢٦',
        imageAlt: 'متعلّم يتدرب على جمل هولندية باستخدام want وomdat في دفتر',
        heroSubtitle: 'المعنى واحد. الفرق في ما يحدث للفعل بعدهما — وهناك تقع الأخطاء.',
        articleHtml: `
<p><strong>want</strong> و<strong>omdat</strong> تعنيان الشيء نفسه: كلتاهما تعطي سببًا، أي «لأن». الفرق في <strong>ترتيب الكلمات</strong>. فبعد <em>want</em> لا يتغير شيء، وبعد <em>omdat</em> ينتقل الفعل إلى آخر الجملة. لذلك فالنصيحة في الامتحان بسيطة: إن ترددت فاختر <em>want</em>. تقول المعنى نفسه تمامًا، ولا يمكن أن تخطئ في ترتيب الكلمات.</p>

${docentNote('إن أردت وصل جملتين فاختر «want» بدل «omdat». مع «want» تصنع جملتين رئيسيتين ولا تحتاج إلى تغيير شيء. أما مع «omdat» فعليك تعديل ترتيب الكلمات، وهناك يقع الخطأ.', 'مدرّسة NT2')}

<h2 id="voorbeeld">الفرق في مثال واحد</h2>

<p>الفكرة نفسها مكتوبة بثلاث طرق. انظر فقط إلى الفعل <em>ben</em> و<em>bent</em>.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>الطريقة</th><th>الجملة</th><th>أين الفعل؟</th></tr></thead>
  <tbody>
    <tr><td><strong>مع want</strong></td><td>${nlEx('Ik zou met de auto gaan, <strong>want</strong> dan <strong>ben</strong> je sneller.')}</td><td>في الموضع الثاني، كالمعتاد</td></tr>
    <tr><td><strong>جملتان منفصلتان</strong></td><td>${nlEx('Ik zou met de auto gaan. Je <strong>bent</strong> sneller.')}</td><td>في الموضع الثاني، كالمعتاد</td></tr>
    <tr><td><strong>مع omdat</strong></td><td>${nlEx('Ik zou met de auto gaan, <strong>omdat</strong> je dan sneller <strong>bent</strong>.')}</td><td>في آخر الجملة</td></tr>
  </tbody>
</table>
</div>

<p>هذا هو الفرق كله. ليس هناك فرق في المعنى تحتاج إلى معرفته في المستوى A2، بل موضع واحد يجب أن يذهب إليه الفعل.</p>

<h2 id="hoofdzin">لماذا «want» أسهل</h2>

<p>بعد <strong>want</strong> تأتي <strong>جملة رئيسية</strong>: فاعل ثم فعل ثم بقية الجملة. لا تنقل شيئًا.</p>

<div class="tip-card"><span class="tip-number">1</span><div><p>${nlEx('Ik kom niet, <strong>want</strong> ik <strong>ben</strong> ziek.')}</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p>${nlEx('Ik neem de trein, <strong>want</strong> de auto <strong>is</strong> kapot.')}</p></div></div>

<p>وبعد <strong>omdat</strong> تأتي <strong>جملة تابعة</strong>، وفيها ينتقل الفعل إلى النهاية.</p>

<div class="tip-card"><span class="tip-number">1</span><div><p>${nlEx('Ik kom niet, <strong>omdat</strong> ik ziek <strong>ben</strong>.')}</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p>${nlEx('Ik neem de trein, <strong>omdat</strong> de auto kapot <strong>is</strong>.')}</p></div></div>

<p>وإن كان في الجملة فعلان انتقلا معًا إلى الآخر: ${nlEx('Ik kom niet, omdat ik moet werken.')}</p>

${foutGoed([nlEx('Ik kom niet, omdat ik ben ziek.'), nlEx('Ik neem de trein, omdat de auto is kapot.')], [nlEx('Ik kom niet, omdat ik ziek ben.'), nlEx('Ik kom niet, want ik ben ziek.')], ['خطأ', 'صواب'])}

<h2 id="drie-zinnen">الخيار الثالث: اجعلها جملتين</h2>

<p>لست مضطرًا إلى وصل الجمل أصلًا. جملتان قصيرتان صحيحتان خير من جملة طويلة فيها خطأ. في المستوى A2 يُقيَّم مدى وضوحك وصحتك في الكتابة والكلام، لا قدرتك على بناء جمل معقّدة.</p>

<div class="info-box info-box-green">
  <p><strong>${nlEx('Ik zou met de auto naar mijn werk gaan. Je bent sneller.')}</strong> جملتان، كلتاهما صحيحة، وبلا أي مخاطرة.</p>
</div>

<h2 id="uitzondering">متى تستخدم «omdat» فعلًا</h2>

<p>هناك موضع واحد لا تصلح فيه <em>want</em>: حين تجيب عن سؤال <strong>waarom؟</strong> أي «لماذا؟».</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>صواب</h3><p class="compare-when">إجابة عن سؤال «لماذا»</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">السؤال</p><p class="compare-val">${nlEx('Waarom kom je niet?')}</p></div>
      <div class="compare-row"><p class="compare-key">الجواب</p><p class="compare-val">${nlEx('Omdat ik ziek <strong>ben</strong>.')}</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>يبدو غريبًا</h3><p class="compare-when">السؤال نفسه مع want</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">السؤال</p><p class="compare-val">${nlEx('Waarom kom je niet?')}</p></div>
      <div class="compare-row"><p class="compare-key">الجواب</p><p class="compare-val">${nlEx('Want ik ben ziek.')}</p></div>
    </div>
  </div>
</div>

<p>هذا السؤال يتكرر في امتحان التحدث. فتدرّب على <em>omdat</em> — لكن تدرّب عليها على حدة، ولا تبنِ بها جملًا طويلة والوقت يجري.</p>

<!--uitleg:want-of-omdat-->

<div class="blog-quiz-card">
  <p class="blog-quiz-q">أي جملة صحيحة؟</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span dir="ltr" lang="nl">Ik ga naar de dokter, omdat ik heb pijn.</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span dir="ltr" lang="nl">Ik ga naar de dokter, want ik heb pijn.</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span dir="ltr" lang="nl">Ik ga naar de dokter want, ik pijn heb.</span></button>
  </div>
  <div class="blog-quiz-ans">الجواب الصحيح هو <strong>B</strong>. بعد <em>want</em> تبقى الجملة كما هي: ${nlEx('ik heb pijn')}. ومع <em>omdat</em> كانت ستصير ${nlEx('omdat ik pijn heb')}. والفاصلة توضع دائمًا <em>قبل</em> want لا بعدها.</div>
</div>

<h2 id="komma">لا تنسَ الفاصلة</h2>

<p>توضع فاصلة قبل <em>want</em> وقبل <em>omdat</em>. كثيرون ينسونها، وفي امتحان الكتابة يكلّف ذلك نقاطًا. ومزيد من هذه التفاصيل الصغيرة في <a href="/ar/المدونة/أخطاء-شائعة-امتحان-الكتابة-a2">الأخطاء الثمانية في امتحان الكتابة A2</a>.</p>

<h2 id="oefenen">تدرّب بصوت مرتفع</h2>

<p>ترتيب الكلمات لا يُتعلَّم من جدول، بل بصنع الجمل وسماع ما يقع فيه الخطأ. وفي التحدث تلاحظ الفرق أسرع، لأن لا وقت لديك لإصلاح الجملة.</p>

<p><a href="/ar/امتحان-تجريبي/a2/الكتابة">امتحانات الكتابة التجريبية A2</a> · <a href="/ar/امتحان-تجريبي/a2/التحدث">امتحانات التحدث التجريبية A2</a></p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">باختصار</h3>
  <table class="facts-table">
    <tr><td>want</td><td>الفعل يبقى مكانه</td></tr>
    <tr><td>omdat</td><td>الفعل ينتقل للآخر</td></tr>
    <tr><td>dus</td><td>الفعل يبقى مكانه</td></tr>
    <tr><td>الفاصلة</td><td>دائمًا قبلها</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'هل تعني want وomdat الشيء نفسه؟', a: 'نعم، كلتاهما تعطي سببًا. والفرق نحوي: بعد «want» يبقى ترتيب الكلمات عاديًا، وبعد «omdat» ينتقل الفعل إلى آخر الجملة.' },
          { q: 'هل توضع فاصلة قبل want؟', a: 'نعم. توضع فاصلة قبل «want» وقبل «omdat» أيضًا. ونسيانها من أكثر الأخطاء شيوعًا في امتحان الكتابة.' },
          { q: 'هل يمكنني أن أبدأ الجملة بـ«want»؟', a: 'يُفضَّل ألا تفعل. إن أردت البدء بالسبب فاستخدم «Omdat ...» وانتبه لترتيب الكلمات، أو اقلب الجملة.' },
          { q: 'ما الجملة التابعة؟', a: 'جملة لا تقوم بنفسها وينتقل فيها الفعل إلى النهاية. «Omdat ik ziek ben» جملة تابعة، و«Ik ben ziek» جملة رئيسية.' },
          { q: 'هل «want» هولندية أضعف من «omdat»؟', a: 'لا. «want» هولندية عادية وصحيحة تمامًا في A2 وB1. أنت لا تُقيَّم على الجمل الصعبة بل على الجمل الصحيحة المفهومة.' },
          { q: 'متى يجب أن أستخدم «omdat» رغم ذلك؟', a: 'حين تجيب عن سؤال «لماذا» مباشرة. فعلى «Waarom kom je niet?» تجيب «Omdat ik ziek ben» لا «Want ik ben ziek». وهذا السؤال يتكرر في امتحان التحدث.' },
        ],
        relatedPosts: [
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'الأخطاء الثمانية في الكتابة A2', desc: 'الحروف الكبيرة والفواصل والوقت و«u» أو «je»' },
          { slug: 'wederkerende-werkwoorden-nederlands', title: 'الأفعال الانعكاسية', desc: 'me وje وzich — مع 20 مثالًا' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
        ],
        ctaTitle: 'تدرّب على جملك في الامتحان الحقيقي',
        ctaDesc: 'واجبات كتابة وتحدث بصيغة DUO، مع ملاحظات لكل معيار تقييم من مدرّسة NT2 معتمدة.',
        ctaLabel: 'تدرّب مجانًا',
      },
    },
  },
  // ───────────────────────────────────────────────────── 8. WEDERKERENDE WERKWOORDEN
  {
    slug: 'wederkerende-werkwoorden-nederlands',
    title: 'Wederkerende werkwoorden: me, je, zich (20 voorbeelden)',
    description: '‘Ik kan beter concentreren’ is fout — het is ‘ik kan me beter concentreren’. Zo werken wederkerende werkwoorden, met een tabel en 20 voorbeelden.',
    category: 'Uitleg & Taal',
    categoryKey: 'uitleg',
    categoryColor: 'blue',
    datePublished: '2026-09-16',
    dateModified: '2026-09-16',
    dateLabel: '16 september 2026',
    breadcrumb: 'Wederkerende werkwoorden',
    heroTitle: 'Wederkerende werkwoorden: me, je, zich',
    heroSubtitle: 'Sommige werkwoorden hebben altijd een extra woordje nodig. Laat je het weg, dan is de zin fout — ook als iedereen je begrijpt.',
    image: '/images/blog/wederkerende-werkwoorden-nederlands.jpg',
    imageAlt: 'Cursist bereidt zich voor op het inburgeringsexamen met een schrift vol Nederlandse werkwoorden',
    readingMinutes: 7,
    faq: [
      { q: 'Wat is een wederkerend werkwoord?', a: 'Een werkwoord dat altijd ‘me’, ‘je’, ‘zich’ of ‘ons’ bij zich heeft. In het woordenboek staat het met ‘zich’: zich voelen, zich concentreren, zich voorbereiden.' },
      { q: 'Wanneer gebruik ik ‘me’ en wanneer ‘zich’?', a: '‘Me’ bij ik, ‘je’ bij jij en jullie, ‘zich’ bij u, hij, zij en zij-meervoud, ‘ons’ bij wij. Let op: bij ‘u’ hoort ‘zich’, niet ‘je’.' },
      { q: 'Mag ik ‘mij’ zeggen in plaats van ‘me’?', a: 'Ja, allebei is goed. ‘Me’ klinkt gewoner in spreektaal, ‘mij’ is iets nadrukkelijker.' },
      { q: 'Waarom staat er twee keer ‘je’ in ‘voel je je goed?’', a: 'De eerste ‘je’ hoort bij jij, de tweede hoort bij het werkwoord zich voelen. Het klinkt raar, maar het is correct Nederlands.' },
      { q: 'Komen deze werkwoorden op het inburgeringsexamen?', a: 'Ja, vooral bij Spreken en Schrijven, waar je zelf zinnen maakt. Bij Lezen en Luisteren hoef je ze alleen te herkennen.' },
      { q: 'Hoeveel wederkerende werkwoorden moet ik kennen?', a: 'De twintig in dit artikel zijn ruim voldoende voor niveau A2. Leer eerst de werkwoorden die je bij een instantie nodig hebt: zich inschrijven, zich melden, zich aanmelden.' },
    ],
    articleHtml: `
<p>Sommige Nederlandse werkwoorden hebben altijd een extra woordje nodig: <strong>me, je, zich, ons</strong>. Dat heet een <strong>wederkerend werkwoord</strong>. Laat je dat woordje weg, dan is de zin fout — ook als iedereen begrijpt wat je bedoelt. Dit is een van de fouten die het langst blijft hangen, ook bij mensen die verder goed Nederlands spreken.</p>

${docentNote('“Ik kan beter concentreren” — dat hoor ik heel vaak. Het moet zijn: “ik kan me beter concentreren”. Het werkwoord is zich concentreren, en dat woordje verdwijnt niet.')}

<h2 id="tabel">De regel in één tabel</h2>

<p>Het woordje verandert mee met de persoon. Meer hoef je niet te onthouden.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Persoon</th><th>Woordje</th><th>Voorbeeld</th></tr></thead>
  <tbody>
    <tr><td>ik</td><td><strong>me</strong></td><td>Ik voel <strong>me</strong> goed.</td></tr>
    <tr><td>jij</td><td><strong>je</strong></td><td>Voel je <strong>je</strong> goed?</td></tr>
    <tr><td>u</td><td><strong>zich</strong></td><td>Voelt u <strong>zich</strong> goed?</td></tr>
    <tr><td>hij / zij</td><td><strong>zich</strong></td><td>Hij voelt <strong>zich</strong> goed.</td></tr>
    <tr><td>wij</td><td><strong>ons</strong></td><td>Wij voelen <strong>ons</strong> goed.</td></tr>
    <tr><td>jullie</td><td><strong>je</strong></td><td>Voelen jullie <strong>je</strong> goed?</td></tr>
    <tr><td>zij (meervoud)</td><td><strong>zich</strong></td><td>Zij voelen <strong>zich</strong> goed.</td></tr>
  </tbody>
</table>
</div>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg><p>In het woordenboek staat het werkwoord altijd met <strong>zich</strong>: <em>zich voelen</em>, <em>zich concentreren</em>. Dat is je signaal dat dit werkwoord het woordje nodig heeft.</p></div>

<h2 id="plek">Waar staat het woordje in de zin?</h2>

<div class="tip-card"><span class="tip-number">1</span><div><p><strong>In een gewone zin:</strong> direct na het werkwoord. — Ik bereid <strong>me</strong> voor op het examen.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p><strong>Met twee werkwoorden:</strong> na het eerste werkwoord. — Ik kan <strong>me</strong> beter concentreren als het rustig is.</p></div></div>
<div class="tip-card"><span class="tip-number">3</span><div><p><strong>In een vraag:</strong> na het onderwerp. — Voel je <strong>je</strong> beter?</p></div></div>

${foutGoed(['Ik me bereid voor op het examen.', 'Ik kan beter me concentreren.'], ['Ik bereid me voor op het examen.', 'Ik kan me beter concentreren.'])}

<h2 id="twintig">20 werkwoorden die je op A2 nodig hebt</h2>

<p>Dit zijn de werkwoorden die in examenopdrachten en in gesprekken met instanties het vaakst voorkomen.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Werkwoord</th><th>Voorbeeldzin</th></tr></thead>
  <tbody>
    <tr><td>zich voelen</td><td>Ik voel <strong>me</strong> vandaag beter.</td></tr>
    <tr><td>zich concentreren</td><td>Ik kan <strong>me</strong> beter concentreren als het rustig is.</td></tr>
    <tr><td>zich voorbereiden</td><td>Ik bereid <strong>me</strong> goed voor op het examen.</td></tr>
    <tr><td>zich herinneren</td><td>Ik herinner <strong>me</strong> dat ik vroeger veel buiten speelde.</td></tr>
    <tr><td>zich ergeren aan</td><td>Ik erger <strong>me</strong> aan mensen die te laat komen.</td></tr>
    <tr><td>zich vergissen</td><td>Sorry, ik vergis <strong>me</strong>.</td></tr>
    <tr><td>zich haasten</td><td>Ik moet <strong>me</strong> haasten, anders mis ik de bus.</td></tr>
    <tr><td>zich wassen</td><td>Ik was <strong>me</strong> elke ochtend.</td></tr>
    <tr><td>zich aankleden</td><td>De kinderen kleden <strong>zich</strong> zelf aan.</td></tr>
    <tr><td>zich schamen</td><td>Ik schaam <strong>me</strong> een beetje.</td></tr>
    <tr><td>zich vervelen</td><td>Mijn zoon verveelt <strong>zich</strong> in de vakantie.</td></tr>
    <tr><td>zich voorstellen</td><td>Mag ik <strong>me</strong> even voorstellen?</td></tr>
    <tr><td>zich afvragen</td><td>Ik vraag <strong>me</strong> af of de bus nog komt.</td></tr>
    <tr><td>zich zorgen maken</td><td>Maak <strong>je</strong> geen zorgen.</td></tr>
    <tr><td>zich interesseren voor</td><td>Hij interesseert <strong>zich</strong> voor politiek.</td></tr>
    <tr><td>zich verheugen op</td><td>Wij verheugen <strong>ons</strong> op de zomer.</td></tr>
    <tr><td>zich verbazen over</td><td>Ik verbaas <strong>me</strong> over de prijzen.</td></tr>
    <tr><td>zich inschrijven</td><td>Ik schrijf <strong>me</strong> in bij de gemeente.</td></tr>
    <tr><td>zich melden</td><td>U moet <strong>zich</strong> melden bij de balie.</td></tr>
    <tr><td>zich aanmelden</td><td>Ik meld <strong>me</strong> aan voor het examen.</td></tr>
  </tbody>
</table>
</div>

<div class="info-box info-box-green">
  <p><strong>Begin met de laatste vier.</strong> <em>Zich inschrijven, zich melden, zich aanmelden</em> en <em>zich voorbereiden</em> heb je nodig bij de gemeente, bij DUO en in brieven aan een instantie. Die komen bij KNM èn bij Schrijven terug.</p>
</div>

<h2 id="fouten">Drie fouten die het vaakst voorkomen</h2>

<!--uitleg:wederkerend-klopt-->

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Welke zin is goed?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Voelt u je vandaag beter?</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">B</span><span>Voelt u beter vandaag?</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">C</span><span>Voelt u zich vandaag beter?</span></button>
  </div>
  <div class="blog-quiz-ans">Het juiste antwoord is <strong>C</strong>. Bij <em>u</em> hoort <em>zich</em>, niet <em>je</em>. En weglaten mag niet: <em>zich voelen</em> heeft het woordje altijd nodig.</div>
</div>

<h2 id="oefenen">Waar je dit oefent</h2>

<p>Dit leer je pas af door het te zeggen en jezelf terug te horen. Bij Spreken hoor je je eigen weglatingen sneller dan je denkt, en bij Schrijven zie je ze als je je tekst één keer teruglest.</p>

<p><a href="/nl/oefenexamen/a2/spreken">Oefenexamens Spreken A2</a> · <a href="/nl/oefenexamen/a2/schrijven">Oefenexamens Schrijven A2</a> · <a href="/nl/blog/veelgemaakte-fouten-schrijven-examen-a2">De acht fouten bij Schrijven</a></p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Welk woordje?</h3>
  <table class="facts-table">
    <tr><td>ik</td><td>me</td></tr>
    <tr><td>jij / jullie</td><td>je</td></tr>
    <tr><td>u / hij / zij</td><td>zich</td></tr>
    <tr><td>wij</td><td>ons</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'want-of-omdat', title: 'Want of omdat?', desc: 'Waarom ‘want’ bijna altijd de slimmere keuze is' },
      { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'De 8 fouten bij Schrijven A2', desc: 'Hoofdletters, komma’s, tijden en ‘u’ of ‘je’' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
    ],
    ctaTitle: 'Hoor je eigen fouten terug',
    ctaDesc: 'Neem je antwoord op bij de oefenexamens Spreken en schrijf echte examenopdrachten — met feedback van een gecertificeerde NT2-docent.',
    ctaHref: '/oefenen',
    ctaLabel: 'Gratis oefenen',
    translations: {
      en: {
        heroTitle: 'Dutch reflexive verbs: me, je, zich',
        description: '‘Ik kan beter concentreren’ is wrong — it is ‘ik kan me beter concentreren’. How Dutch reflexive verbs work, with a table and 20 examples.',
        category: 'Explained & Language',
        breadcrumb: 'Reflexive verbs',
        dateLabel: '16 September 2026',
        imageAlt: 'Learner preparing for the integration exam with a notebook full of Dutch verbs',
        heroSubtitle: 'Some verbs always need a small extra word. Leave it out and the sentence is wrong — even when everyone understands you.',
        articleHtml: `
<p>Some Dutch verbs always need an extra little word: <strong>me, je, zich, ons</strong>. That is called a <strong>reflexive verb</strong>. Leave that word out and the sentence is wrong — even when everyone understands what you mean. This is one of the mistakes that sticks around longest, also with people whose Dutch is otherwise good.</p>

${docentNote('“Ik kan beter concentreren” — I hear that a lot. It has to be “ik kan me beter concentreren”. The verb is zich concentreren, and that little word does not disappear.', 'NT2 teacher')}

<h2 id="tabel">The rule in one table</h2>

<p>The word changes with the person. That is all you have to remember.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Person</th><th>Word</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>ik (I)</td><td><strong>me</strong></td><td>Ik voel <strong>me</strong> goed.</td></tr>
    <tr><td>jij (you)</td><td><strong>je</strong></td><td>Voel je <strong>je</strong> goed?</td></tr>
    <tr><td>u (you, formal)</td><td><strong>zich</strong></td><td>Voelt u <strong>zich</strong> goed?</td></tr>
    <tr><td>hij / zij (he / she)</td><td><strong>zich</strong></td><td>Hij voelt <strong>zich</strong> goed.</td></tr>
    <tr><td>wij (we)</td><td><strong>ons</strong></td><td>Wij voelen <strong>ons</strong> goed.</td></tr>
    <tr><td>jullie (you, plural)</td><td><strong>je</strong></td><td>Voelen jullie <strong>je</strong> goed?</td></tr>
    <tr><td>zij (they)</td><td><strong>zich</strong></td><td>Zij voelen <strong>zich</strong> goed.</td></tr>
  </tbody>
</table>
</div>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg><p>In the dictionary the verb is always listed with <strong>zich</strong>: <em>zich voelen</em>, <em>zich concentreren</em>. That is your signal that this verb needs the extra word.</p></div>

<h2 id="plek">Where does the word go?</h2>

<div class="tip-card"><span class="tip-number">1</span><div><p><strong>In a normal sentence:</strong> straight after the verb. — Ik bereid <strong>me</strong> voor op het examen.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p><strong>With two verbs:</strong> after the first verb. — Ik kan <strong>me</strong> beter concentreren als het rustig is.</p></div></div>
<div class="tip-card"><span class="tip-number">3</span><div><p><strong>In a question:</strong> after the subject. — Voel je <strong>je</strong> beter?</p></div></div>

${foutGoed(['Ik me bereid voor op het examen.', 'Ik kan beter me concentreren.'], ['Ik bereid me voor op het examen.', 'Ik kan me beter concentreren.'], ['Wrong', 'Right'])}

<h2 id="twintig">20 verbs you need at A2</h2>

<p>These are the ones that come up most often in exam tasks and in conversations with Dutch institutions.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Verb</th><th>Example sentence</th></tr></thead>
  <tbody>
    <tr><td>zich voelen — to feel</td><td>Ik voel <strong>me</strong> vandaag beter.</td></tr>
    <tr><td>zich concentreren — to concentrate</td><td>Ik kan <strong>me</strong> beter concentreren als het rustig is.</td></tr>
    <tr><td>zich voorbereiden — to prepare</td><td>Ik bereid <strong>me</strong> goed voor op het examen.</td></tr>
    <tr><td>zich herinneren — to remember</td><td>Ik herinner <strong>me</strong> dat ik vroeger veel buiten speelde.</td></tr>
    <tr><td>zich ergeren aan — to be annoyed by</td><td>Ik erger <strong>me</strong> aan mensen die te laat komen.</td></tr>
    <tr><td>zich vergissen — to be mistaken</td><td>Sorry, ik vergis <strong>me</strong>.</td></tr>
    <tr><td>zich haasten — to hurry</td><td>Ik moet <strong>me</strong> haasten, anders mis ik de bus.</td></tr>
    <tr><td>zich wassen — to wash</td><td>Ik was <strong>me</strong> elke ochtend.</td></tr>
    <tr><td>zich aankleden — to get dressed</td><td>De kinderen kleden <strong>zich</strong> zelf aan.</td></tr>
    <tr><td>zich schamen — to be ashamed</td><td>Ik schaam <strong>me</strong> een beetje.</td></tr>
    <tr><td>zich vervelen — to be bored</td><td>Mijn zoon verveelt <strong>zich</strong> in de vakantie.</td></tr>
    <tr><td>zich voorstellen — to introduce oneself</td><td>Mag ik <strong>me</strong> even voorstellen?</td></tr>
    <tr><td>zich afvragen — to wonder</td><td>Ik vraag <strong>me</strong> af of de bus nog komt.</td></tr>
    <tr><td>zich zorgen maken — to worry</td><td>Maak <strong>je</strong> geen zorgen.</td></tr>
    <tr><td>zich interesseren voor — to be interested in</td><td>Hij interesseert <strong>zich</strong> voor politiek.</td></tr>
    <tr><td>zich verheugen op — to look forward to</td><td>Wij verheugen <strong>ons</strong> op de zomer.</td></tr>
    <tr><td>zich verbazen over — to be surprised at</td><td>Ik verbaas <strong>me</strong> over de prijzen.</td></tr>
    <tr><td>zich inschrijven — to register</td><td>Ik schrijf <strong>me</strong> in bij de gemeente.</td></tr>
    <tr><td>zich melden — to report, check in</td><td>U moet <strong>zich</strong> melden bij de balie.</td></tr>
    <tr><td>zich aanmelden — to sign up</td><td>Ik meld <strong>me</strong> aan voor het examen.</td></tr>
  </tbody>
</table>
</div>

<div class="info-box info-box-green">
  <p><strong>Start with the last four.</strong> <em>Zich inschrijven, zich melden, zich aanmelden</em> and <em>zich voorbereiden</em> are what you need at the municipality, at DUO and in letters to an institution. They come back in KNM as well as in Writing.</p>
</div>

<h2 id="fouten">The three most common mistakes</h2>

<!--uitleg:wederkerend-klopt-->

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Which sentence is correct?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Voelt u je vandaag beter?</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">B</span><span>Voelt u beter vandaag?</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">C</span><span>Voelt u zich vandaag beter?</span></button>
  </div>
  <div class="blog-quiz-ans">The correct answer is <strong>C</strong>. With <em>u</em> you use <em>zich</em>, not <em>je</em>. And you cannot leave it out: <em>zich voelen</em> always needs the word.</div>
</div>

<h2 id="oefenen">Where to practise this</h2>

<p>You only unlearn this by saying it and hearing yourself back. On Speaking you hear your own omissions faster than you expect, and on Writing you see them if you read your text back once.</p>

<p><a href="/en/practice-exam/a2/speaking">A2 Speaking practice exams</a> · <a href="/en/practice-exam/a2/writing">A2 Writing practice exams</a> · <a href="/en/blog/common-mistakes-writing-exam-a2">The eight mistakes on Writing</a></p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Which word?</h3>
  <table class="facts-table">
    <tr><td>ik</td><td>me</td></tr>
    <tr><td>jij / jullie</td><td>je</td></tr>
    <tr><td>u / hij / zij</td><td>zich</td></tr>
    <tr><td>wij</td><td>ons</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'What is a reflexive verb?', a: 'A verb that always carries ‘me’, ‘je’, ‘zich’ or ‘ons’. In the dictionary it is listed with ‘zich’: zich voelen, zich concentreren, zich voorbereiden.' },
          { q: 'When do I use ‘me’ and when ‘zich’?', a: '‘Me’ with ik, ‘je’ with jij and jullie, ‘zich’ with u, hij, zij and they, ‘ons’ with wij. Note that ‘u’ takes ‘zich’, not ‘je’.' },
          { q: 'Can I say ‘mij’ instead of ‘me’?', a: 'Yes, both are correct. ‘Me’ sounds more ordinary in speech, ‘mij’ is slightly more emphatic.' },
          { q: 'Why is there a double ‘je’ in ‘voel je je goed?’', a: 'The first ‘je’ belongs to the subject jij, the second belongs to the verb zich voelen. It sounds odd, but it is correct Dutch.' },
          { q: 'Do these verbs come up on the integration exam?', a: 'Yes, mainly on Speaking and Writing, where you build sentences yourself. On Reading and Listening you only have to recognise them.' },
          { q: 'How many reflexive verbs do I need to know?', a: 'The twenty in this article are more than enough for A2. Learn the ones you need at an institution first: zich inschrijven, zich melden, zich aanmelden.' },
        ],
        relatedPosts: [
          { slug: 'want-of-omdat', title: 'Want or omdat?', desc: 'Why ‘want’ is almost always the smarter choice' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'The 8 mistakes on Writing A2', desc: 'Capitals, commas, times and ‘u’ versus ‘je’' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
        ],
        ctaTitle: 'Hear your own mistakes back',
        ctaDesc: 'Record your answer on the Speaking practice exams and write real exam tasks — with feedback from a certified NT2 teacher.',
        ctaLabel: 'Practise for free',
      },
      ar: {
        heroTitle: 'الأفعال الانعكاسية الهولندية: me وje وzich',
        description: '«Ik kan beter concentreren» خطأ، والصواب «ik kan me beter concentreren». هكذا تعمل الأفعال الانعكاسية، مع جدول وعشرين مثالًا.',
        category: 'شرح ولغة',
        breadcrumb: 'الأفعال الانعكاسية',
        dateLabel: '١٦ سبتمبر ٢٠٢٦',
        imageAlt: 'متعلّمة تستعد لامتحان الاندماج بدفتر مليء بالأفعال الهولندية',
        heroSubtitle: 'بعض الأفعال تحتاج دائمًا إلى كلمة صغيرة إضافية. إن حذفتها صارت الجملة خاطئة — حتى لو فهمك الجميع.',
        articleHtml: `
<p>بعض الأفعال الهولندية تحتاج دائمًا إلى كلمة صغيرة إضافية: <strong>me</strong> أو <strong>je</strong> أو <strong>zich</strong> أو <strong>ons</strong>. ويسمى هذا <strong>الفعل الانعكاسي</strong>. وإن حذفت تلك الكلمة صارت الجملة خاطئة، حتى لو فهم الجميع ما تقصد. وهذا من الأخطاء التي تدوم أطول، حتى عند من لغتهم الهولندية جيدة في ما عدا ذلك.</p>

${docentNote('«Ik kan beter concentreren» — أسمعها كثيرًا. والصواب «ik kan me beter concentreren». الفعل هو zich concentreren، وتلك الكلمة لا تختفي.', 'مدرّسة NT2')}

<h2 id="tabel">القاعدة في جدول واحد</h2>

<p>تتغير الكلمة بحسب الشخص. وهذا كل ما عليك حفظه.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>الضمير</th><th>الكلمة</th><th>مثال</th></tr></thead>
  <tbody>
    <tr><td>ik (أنا)</td><td><strong>me</strong></td><td>${nlEx('Ik voel <strong>me</strong> goed.')}</td></tr>
    <tr><td>jij (أنت)</td><td><strong>je</strong></td><td>${nlEx('Voel je <strong>je</strong> goed?')}</td></tr>
    <tr><td>u (حضرتك)</td><td><strong>zich</strong></td><td>${nlEx('Voelt u <strong>zich</strong> goed?')}</td></tr>
    <tr><td>hij / zij (هو / هي)</td><td><strong>zich</strong></td><td>${nlEx('Hij voelt <strong>zich</strong> goed.')}</td></tr>
    <tr><td>wij (نحن)</td><td><strong>ons</strong></td><td>${nlEx('Wij voelen <strong>ons</strong> goed.')}</td></tr>
    <tr><td>jullie (أنتم)</td><td><strong>je</strong></td><td>${nlEx('Voelen jullie <strong>je</strong> goed?')}</td></tr>
    <tr><td>zij (هم)</td><td><strong>zich</strong></td><td>${nlEx('Zij voelen <strong>zich</strong> goed.')}</td></tr>
  </tbody>
</table>
</div>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg><p>في القاموس يُذكر الفعل دائمًا مع <strong>zich</strong>: ${nlEx('zich voelen')}، ${nlEx('zich concentreren')}. وهذه إشارتك إلى أن الفعل يحتاج إلى الكلمة الإضافية.</p></div>

<h2 id="plek">أين تقع الكلمة في الجملة؟</h2>

<div class="tip-card"><span class="tip-number">1</span><div><p><strong>في جملة عادية:</strong> مباشرة بعد الفعل. ${nlEx('Ik bereid <strong>me</strong> voor op het examen.')}</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p><strong>مع فعلين:</strong> بعد الفعل الأول. ${nlEx('Ik kan <strong>me</strong> beter concentreren als het rustig is.')}</p></div></div>
<div class="tip-card"><span class="tip-number">3</span><div><p><strong>في السؤال:</strong> بعد الفاعل. ${nlEx('Voel je <strong>je</strong> beter?')}</p></div></div>

${foutGoed([nlEx('Ik me bereid voor op het examen.'), nlEx('Ik kan beter me concentreren.')], [nlEx('Ik bereid me voor op het examen.'), nlEx('Ik kan me beter concentreren.')], ['خطأ', 'صواب'])}

<h2 id="twintig">20 فعلًا تحتاجها في المستوى A2</h2>

<p>هذه هي الأفعال الأكثر ورودًا في واجبات الامتحان وفي التعامل مع المؤسسات الهولندية.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>الفعل</th><th>جملة مثال</th></tr></thead>
  <tbody>
    <tr><td>zich voelen — يشعر</td><td>${nlEx('Ik voel <strong>me</strong> vandaag beter.')}</td></tr>
    <tr><td>zich concentreren — يركّز</td><td>${nlEx('Ik kan <strong>me</strong> beter concentreren als het rustig is.')}</td></tr>
    <tr><td>zich voorbereiden — يستعد</td><td>${nlEx('Ik bereid <strong>me</strong> goed voor op het examen.')}</td></tr>
    <tr><td>zich herinneren — يتذكّر</td><td>${nlEx('Ik herinner <strong>me</strong> dat ik vroeger veel buiten speelde.')}</td></tr>
    <tr><td>zich ergeren aan — ينزعج من</td><td>${nlEx('Ik erger <strong>me</strong> aan mensen die te laat komen.')}</td></tr>
    <tr><td>zich vergissen — يخطئ</td><td>${nlEx('Sorry, ik vergis <strong>me</strong>.')}</td></tr>
    <tr><td>zich haasten — يستعجل</td><td>${nlEx('Ik moet <strong>me</strong> haasten, anders mis ik de bus.')}</td></tr>
    <tr><td>zich wassen — يغتسل</td><td>${nlEx('Ik was <strong>me</strong> elke ochtend.')}</td></tr>
    <tr><td>zich aankleden — يرتدي ملابسه</td><td>${nlEx('De kinderen kleden <strong>zich</strong> zelf aan.')}</td></tr>
    <tr><td>zich schamen — يخجل</td><td>${nlEx('Ik schaam <strong>me</strong> een beetje.')}</td></tr>
    <tr><td>zich vervelen — يشعر بالملل</td><td>${nlEx('Mijn zoon verveelt <strong>zich</strong> in de vakantie.')}</td></tr>
    <tr><td>zich voorstellen — يعرّف بنفسه</td><td>${nlEx('Mag ik <strong>me</strong> even voorstellen?')}</td></tr>
    <tr><td>zich afvragen — يتساءل</td><td>${nlEx('Ik vraag <strong>me</strong> af of de bus nog komt.')}</td></tr>
    <tr><td>zich zorgen maken — يقلق</td><td>${nlEx('Maak <strong>je</strong> geen zorgen.')}</td></tr>
    <tr><td>zich interesseren voor — يهتم بـ</td><td>${nlEx('Hij interesseert <strong>zich</strong> voor politiek.')}</td></tr>
    <tr><td>zich verheugen op — يتطلّع إلى</td><td>${nlEx('Wij verheugen <strong>ons</strong> op de zomer.')}</td></tr>
    <tr><td>zich verbazen over — يستغرب من</td><td>${nlEx('Ik verbaas <strong>me</strong> over de prijzen.')}</td></tr>
    <tr><td>zich inschrijven — يسجّل نفسه</td><td>${nlEx('Ik schrijf <strong>me</strong> in bij de gemeente.')}</td></tr>
    <tr><td>zich melden — يراجع، يبلّغ عن حضوره</td><td>${nlEx('U moet <strong>zich</strong> melden bij de balie.')}</td></tr>
    <tr><td>zich aanmelden — يتقدّم بطلب</td><td>${nlEx('Ik meld <strong>me</strong> aan voor het examen.')}</td></tr>
  </tbody>
</table>
</div>

<div class="info-box info-box-green">
  <p><strong>ابدأ بالأربعة الأخيرة.</strong> ${nlEx('zich inschrijven, zich melden, zich aanmelden')} و${nlEx('zich voorbereiden')} هي ما تحتاجه في البلدية وفي DUO وفي الرسائل إلى المؤسسات، وهي تعود في KNM وفي الكتابة معًا.</p>
</div>

<h2 id="fouten">الأخطاء الثلاثة الأكثر شيوعًا</h2>

<!--uitleg:wederkerend-klopt-->

<div class="blog-quiz-card">
  <p class="blog-quiz-q">أي جملة صحيحة؟</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span dir="ltr" lang="nl">Voelt u je vandaag beter?</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">B</span><span dir="ltr" lang="nl">Voelt u beter vandaag?</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">C</span><span dir="ltr" lang="nl">Voelt u zich vandaag beter?</span></button>
  </div>
  <div class="blog-quiz-ans">الجواب الصحيح هو <strong>C</strong>. مع <em>u</em> تُستخدم <em>zich</em> لا <em>je</em>. ولا يجوز حذفها: ${nlEx('zich voelen')} يحتاج الكلمة دائمًا.</div>
</div>

<h2 id="oefenen">أين تتدرّب على هذا</h2>

<p>لن تتخلّص من هذا الخطأ إلا بأن تنطقه وتسمع نفسك. في التحدث تسمع حذفك للكلمة أسرع مما تتوقع، وفي الكتابة تراه إن أعدت قراءة نصّك مرة واحدة.</p>

<p><a href="/ar/امتحان-تجريبي/a2/التحدث">امتحانات التحدث التجريبية A2</a> · <a href="/ar/امتحان-تجريبي/a2/الكتابة">امتحانات الكتابة التجريبية A2</a> · <a href="/ar/المدونة/أخطاء-شائعة-امتحان-الكتابة-a2">الأخطاء الثمانية في الكتابة</a></p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">أي كلمة؟</h3>
  <table class="facts-table">
    <tr><td>ik</td><td>me</td></tr>
    <tr><td>jij / jullie</td><td>je</td></tr>
    <tr><td>u / hij / zij</td><td>zich</td></tr>
    <tr><td>wij</td><td>ons</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'ما الفعل الانعكاسي؟', a: 'فعل يحمل دائمًا «me» أو «je» أو «zich» أو «ons». وفي القاموس يُذكر مع «zich»: zich voelen وzich concentreren وzich voorbereiden.' },
          { q: 'متى أستخدم «me» ومتى «zich»؟', a: '«me» مع ik، و«je» مع jij وjullie، و«zich» مع u وhij وzij وهم، و«ons» مع wij. وانتبه: مع «u» تُستخدم «zich» لا «je».' },
          { q: 'هل يمكنني قول «mij» بدل «me»؟', a: 'نعم، كلتاهما صحيحة. «me» أقرب إلى لغة الكلام، و«mij» أكثر تأكيدًا قليلًا.' },
          { q: 'لماذا تتكرر «je» مرتين في «voel je je goed?»', a: 'الأولى تعود إلى الفاعل jij، والثانية تعود إلى الفعل zich voelen. يبدو الأمر غريبًا لكنه هولندية صحيحة.' },
          { q: 'هل ترد هذه الأفعال في امتحان الاندماج؟', a: 'نعم، خصوصًا في التحدث والكتابة حيث تبني الجمل بنفسك. أما في القراءة والاستماع فيكفي أن تتعرّف عليها.' },
          { q: 'كم فعلًا انعكاسيًا يلزمني؟', a: 'العشرون الواردة في هذا المقال تكفي وتزيد للمستوى A2. وابدأ بما تحتاجه عند المؤسسات: zich inschrijven وzich melden وzich aanmelden.' },
        ],
        relatedPosts: [
          { slug: 'want-of-omdat', title: 'want أم omdat؟', desc: 'لماذا يكون «want» الخيار الأذكى غالبًا' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'الأخطاء الثمانية في الكتابة A2', desc: 'الحروف الكبيرة والفواصل والوقت و«u» أو «je»' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
        ],
        ctaTitle: 'اسمع أخطاءك بنفسك',
        ctaDesc: 'سجّل إجابتك في امتحانات التحدث التجريبية واكتب واجبات امتحانية حقيقية — مع ملاحظات من مدرّسة NT2 معتمدة.',
        ctaLabel: 'تدرّب مجانًا',
      },
    },
  },
];

export function getPostLocale(post: BlogPost, locale: string): ResolvedPost {
  const t = post.translations?.[locale as 'en' | 'ar'];
  return {
    heroTitle: t?.heroTitle ?? post.heroTitle,
    description: t?.description ?? post.description,
    category: t?.category ?? post.category,
    heroSubtitle: t?.heroSubtitle ?? post.heroSubtitle,
    articleHtml: t?.articleHtml ?? post.articleHtml,
    sidebarHtml: t?.sidebarHtml ?? post.sidebarHtml,
    ctaTitle: t?.ctaTitle ?? post.ctaTitle,
    ctaDesc: t?.ctaDesc ?? post.ctaDesc,
    ctaLabel: t?.ctaLabel ?? post.ctaLabel,
    faq: t?.faq ?? post.faq,
    breadcrumb: t?.breadcrumb ?? post.breadcrumb,
    dateLabel: t?.dateLabel ?? post.dateLabel,
    imageAlt: t?.imageAlt ?? post.imageAlt,
    /* De kaarten onderaan. `slug` blijft in elke taal de Nederlandse — dat is de interne naam
     * waarmee `relatedSlug()` de post opzoekt; alleen `title` en `desc` zijn vertaald. */
    relatedPosts: t?.relatedPosts ?? post.relatedPosts,
  };
}

/**
 * Whether this locale has its own translated body. `nl` is always true (it is the source).
 * A locale without one gets `robots: noindex` so we never publish a thin duplicate.
 */
export function hasTranslation(post: BlogPost, locale: string): boolean {
  if (locale === 'nl') return true;
  return Boolean(post.translations?.[locale as 'en' | 'ar']?.articleHtml);
}

/** Returns the URL slug for a post in a given locale */
export function getPostSlug(post: BlogPost, locale: string): string {
  return contentSlugParam(post.slug, locale);
}

/** All (locale, slug) pairs — used in generateStaticParams */
export function getAllPostParams(): { locale: string; slug: string }[] {
  const params: { locale: string; slug: string }[] = [];
  for (const post of POSTS) {
    for (const locale of ['nl', 'en', 'ar'] as const) {
      params.push({ locale, slug: contentSlugParam(post.slug, locale) });
    }
  }
  return params;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  /* Zelfde afspraak als bij de gidsen: de route krijgt de slug binnen in de taal van de URL,
   * `parseContentSlug` rekent elke taal terug naar de Nederlandse — inclusief de Nederlandse
   * slug onder `/en` en `/ar`, de URL's van vóór 15-09. */
  const nlSlug = parseContentSlug(slug) ?? slug;
  return POSTS.find(p => p.slug === nlSlug);
}

/** Newest first — the order the index grid renders in. */
export function getSortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export default POSTS;
