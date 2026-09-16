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
  return `<div class="docent-note"><img src="/images/marieke-schipper.webp" alt="" width="44" height="44" class="docent-note-avatar" loading="lazy" />` +
    `<div><p class="docent-note-name">Marieke Schipper \u00b7 ${role}</p><p>${text}</p></div></div>`;
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
  // ───────────────────────────────────────────────────────────── 1. PILLAR
  {
    slug: 'inburgeringsexamen-a2-uitleg',
    title: 'Inburgeringsexamen A2: de 4 taalonderdelen uitgelegd',
    description: 'Wat je moet weten over het inburgeringsexamen A2: welke vier onderdelen je doet, hoe lang ze duren en hoeveel vragen je krijgt.',
    category: 'Gids & Informatie',
    categoryKey: 'gids',
    categoryColor: 'blue',
    datePublished: '2026-07-08',
    dateModified: '2026-07-28',
    dateLabel: '8 juli 2026',
    breadcrumb: 'Inburgeringsexamen A2',
    heroTitle: 'Inburgeringsexamen A2: de 4 taalonderdelen uitgelegd',
    heroSubtitle: 'Vier onderdelen, vier verschillende examens. Hier lees je precies wat je op elk examen krijgt — met de bron van DUO bij elk getal.',
    image: '/images/blog/inburgeringsexamen-a2-uitleg.jpg',
    imageAlt: 'Vrouw studeert Nederlands voor het inburgeringsexamen A2 aan een tafel met boeken en laptop',
    readingMinutes: 9,
    faq: [
      {
        q: 'Hoeveel vragen krijg je op het inburgeringsexamen A2?',
        a: 'DUO publiceert dit niet. In de officiële oefenexamens van DUO krijg je 25 vragen bij Lezen, 25 vragen bij Luisteren, 16 vragen bij Spreken en 4 opdrachten bij Schrijven. Dat zijn de oefenexamens; DUO belooft niet dat het echte examen precies hetzelfde is.',
      },
      {
        q: 'Hoe lang duurt het inburgeringsexamen A2?',
        a: 'Per onderdeel: Lezen 65 minuten, Luisteren 45 minuten, Schrijven 40 minuten en Spreken 35 minuten. Je krijgt daarnaast 15 minuten uitleg voordat elk examen begint. Je doet de onderdelen niet op één dag.',
      },
      {
        q: 'Hoeveel vragen moet je goed hebben om te slagen?',
        a: 'Dat weet niemand precies, en DUO maakt het niet bekend. In het examenreglement staat dat de zak-slaaggrens een cesuur is die de minister vaststelt. Je krijgt een cijfer per onderdeel en de uitslag geslaagd of niet geslaagd. Niet alle antwoorden hoeven goed te zijn.',
      },
      {
        q: 'Welk onderdeel is het moeilijkst?',
        a: 'Dat verschilt per persoon. Luisteren wordt het vaakst onderschat: je krijgt 25 vragen in 45 minuten en je kunt een fragment niet terugspoelen. Bij Lezen heb je meer tijd per vraag, maar je moet wel snel de juiste informatie vinden.',
      },
      {
        q: 'Doe je het examen op de computer?',
        a: 'Lezen, Luisteren en Spreken doe je op de computer. Schrijven doe je met pen en papier. Veel mensen weten dat laatste niet en schrikken op de examendag.',
      },
      {
        q: 'Moet ik A2 of B1 doen?',
        a: 'Dat staat in je persoonlijk plan inburgering en participatie (PIP). De gemeente bepaalt samen met jou welke leerroute je volgt. De B1-route gaat naar niveau B1, de zelfredzaamheidsroute naar A1. Kijk in Mijn Inburgering als je het niet weet.',
      },
      {
        q: 'Wanneer krijg ik mijn uitslag?',
        a: 'Binnen 8 weken na het examen, per brief. Je uitslag staat ook in Mijn Inburgering. Een gemaakt examen mag je daarna niet meer inzien.',
      },
    ],
    articleHtml: `
<p>Het <strong>inburgeringsexamen A2</strong> bestaat uit vier taalonderdelen: <strong>Lezen, Luisteren, Schrijven en Spreken</strong>. Je doet ze apart, op verschillende dagen. Lezen duurt 65 minuten, Luisteren 45 minuten, Schrijven 40 minuten en Spreken 35 minuten. Je krijgt per onderdeel een cijfer en de uitslag "geslaagd" of "niet geslaagd". Zak je voor één onderdeel? Dan doe je alleen dat onderdeel opnieuw.</p>

<p>In dit artikel lees je per onderdeel wat je krijgt, hoe lang je hebt en hoe het wordt nagekeken. Bij elk getal staat de bron van DUO. Dat is niet standaard: veel websites noemen cijfers die DUO nergens publiceert. Waar dat gebeurt, zeg ik het.</p>

<div class="article-toc">
  <p class="article-toc-title">In dit artikel</p>
  <ol>
    <li><a href="#overzicht">De vier onderdelen in één tabel</a></li>
    <li><a href="#lezen">Lezen: 65 minuten</a></li>
    <li><a href="#luisteren">Luisteren: 45 minuten</a></li>
    <li><a href="#schrijven">Schrijven: met pen en papier</a></li>
    <li><a href="#spreken">Spreken: praten tegen een computer</a></li>
    <li><a href="#slagen">Hoeveel moet je goed hebben?</a></li>
    <li><a href="#moeilijk">Hoe moeilijk is het examen?</a></li>
    <li><a href="#a2-of-b1">Doe je A2 of B1?</a></li>
    <li><a href="#examendag">Op de examendag</a></li>
  </ol>
</div>

<h2 id="overzicht">De vier onderdelen in één tabel</h2>

<p>Elk onderdeel is een apart examen, met een eigen duur en een eigen manier van nakijken. Dit is het complete overzicht.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Onderdeel</th><th>Vragen</th><th>Tijd</th><th>Waarop</th><th>Nagekeken door</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Lezen</strong></td><td>25 vragen</td><td>65 min</td><td>computer</td><td>automatisch</td></tr>
    <tr><td><strong>Luisteren</strong></td><td>25 vragen</td><td>45 min</td><td>computer</td><td>automatisch</td></tr>
    <tr><td><strong>Schrijven</strong></td><td>4 opdrachten</td><td>40 min</td><td><strong>pen en papier</strong></td><td>mensen</td></tr>
    <tr><td><strong>Spreken</strong></td><td>16 vragen</td><td>35 min</td><td>computer</td><td>deels mensen</td></tr>
  </tbody>
</table>
</div>

${fact('De tijden komen van DUO: Lezen 65 minuten, Luisteren 45 minuten, Schrijven 40 minuten, Spreken 35 minuten.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

<p>Over het <strong>aantal vragen</strong> moet ik iets uitleggen. DUO publiceert dat nergens. De getallen hierboven komen van de startpagina's van de officiële oefenexamens van DUO zelf. Daar staat letterlijk: "U moet in dit examen 25 vragen beantwoorden." Ik heb alle tien online oefenexamens A2 nagekeken.</p>

${fact('In de officiële oefenexamens van DUO: Lezen 25 vragen (4 examens), Luisteren 25 vragen (3 examens), Spreken 16 vragen (3 examens). Schrijven: 4 opdrachten.', 'inburgeren.nl — oefenen', SRC_OEFENEN)}

<p>Dit zijn dus de oefenexamens. DUO belooft niet dat het echte examen precies hetzelfde is. Kom je op een andere website een getal tegen dat als officieel wordt gepresenteerd? Wees voorzichtig.</p>

<h2 id="lezen">Lezen: 65 minuten</h2>

<p>Bij Lezen krijg je teksten op een computerscherm. Daarna beantwoord je vragen over die teksten. DUO beschrijft het zo: "U moet teksten lezen. U moet ook vragen beantwoorden."</p>

<p>De teksten komen uit het dagelijks leven. Denk aan een brief van school, een advertentie, een bijsluiter van medicijnen of een e-mail van je werk. Het gaat niet om literatuur. Het gaat om informatie vinden.</p>

<p>Met 25 vragen in 65 minuten heb je ongeveer <strong>2,5 minuut per vraag</strong>. Dat lijkt veel. Maar je moet ook de tekst lezen. Studenten in mijn les lopen hier het vaakst op vast: ze lezen elke tekst helemaal en compleet, en dan is de tijd op.</p>

<div class="info-box info-box-green">
  <p><strong>Tip:</strong> lees eerst de vraag. Zoek dan in de tekst naar het antwoord. Je hoeft niet elk woord te begrijpen om een vraag goed te hebben.</p>
</div>

<p>Lezen wordt automatisch nagekeken door de computer. Er zit geen mens tussen. Meer over dit onderdeel lees je in <a href="/nl/blog/lezen-examen-inburgering-a2">het artikel over het examen Lezen</a>.</p>

<h2 id="luisteren">Luisteren: 45 minuten</h2>

<p>Bij Luisteren kijk je naar filmpjes en luister je naar teksten. Daarna beantwoord je vragen. DUO: "U krijgt vragen over filmpjes en u luistert naar teksten."</p>

<p>Dit onderdeel wordt het meest onderschat. Je krijgt evenveel vragen als bij Lezen — 25 — maar je hebt <strong>20 minuten minder tijd</strong>. En het belangrijkste verschil: een gesprek gaat voorbij. Bij een tekst kun je terugkijken. Bij audio niet.</p>

<p>De situaties zijn alledaags: een gesprek bij de huisarts, een mededeling op het station, een collega die iets vraagt. Precies het Nederlands dat je op straat hoort.</p>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Je hoort: "De trein naar Utrecht van 14.20 uur rijdt vandaag niet. Neem de trein van 14.50 uur." Hoeveel later vertrekt je trein?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>20 minuten</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>30 minuten</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>50 minuten</span></button>
  </div>
  <div class="blog-quiz-ans">Het juiste antwoord is <strong>B</strong>. Van 14.20 naar 14.50 is 30 minuten. Bij Luisteren moet je vaak met tijden rekenen. Let dus goed op getallen — die zijn bijna altijd belangrijk.</div>
</div>

<p>Ook Luisteren wordt automatisch nagekeken. Lees verder in <a href="/nl/blog/luisteren-examen-inburgering-a2">het artikel over het examen Luisteren</a>.</p>

<h2 id="schrijven">Schrijven: met pen en papier</h2>

<p>Dit verrast bijna iedereen: <strong>Schrijven doe je niet op de computer</strong>. Je krijgt een boekje en een blauwe pen. DUO zegt het zelf: "Het examen Schrijven op niveau A2 maakt u met pen en papier."</p>

${fact('Schrijven A2 duurt 40 minuten, je krijgt 4 schrijfopdrachten, en je maakt het met pen en papier.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

<p>Je krijgt <strong>4 opdrachten</strong> in 40 minuten. Dat is 10 minuten per opdracht. De opdrachten lijken op wat je in het echte leven schrijft: een korte e-mail, een stukje tekst over jezelf, of een formulier invullen.</p>

<p>Schrijven wordt <strong>door mensen nagekeken</strong>, niet door een computer. In het examenreglement staat dat gecertificeerde beoordelaars dit doen. Dat is belangrijk om te weten: een mens kijkt of je boodschap duidelijk is. Je hoeft niet foutloos te schrijven.</p>

<div class="info-box">
  <p><strong>Oefen met een pen.</strong> Schrijf je normaal alles op je telefoon? Dan is 40 minuten met de hand schrijven zwaarder dan je denkt. Oefen minstens een paar keer op papier.</p>
</div>

<h2 id="spreken">Spreken: praten tegen een computer</h2>

<p>Bij Spreken zit je achter een computer met een koptelefoon. Je bekijkt filmpjes en plaatjes, en je spreekt je antwoord in. Er zit geen examinator tegenover je.</p>

<p>De oefenexamens van DUO hebben <strong>16 vragen</strong> in vier soorten: vragen met een video, met 1 plaatje, met 2 plaatjes en met 3 plaatjes. Bij de plaatjes vertel je bijvoorbeeld wat er gebeurt, of je reageert op een situatie.</p>

<p>Spreken wordt <strong>deels automatisch en deels door mensen</strong> nagekeken. In het reglement staat: "Het examen Spreekvaardigheid wordt gedeeltelijk geautomatiseerd en gedeeltelijk door gecertificeerde beoordelaars nagekeken en beoordeeld."</p>

${fact('Lezen, Luisteren en KNM worden automatisch nagekeken. Schrijven wordt door gecertificeerde beoordelaars nagekeken. Spreken deels automatisch, deels door beoordelaars.', 'DUO Examenreglement, artikel 10', SRC_REGLEMENT)}

<h2 id="slagen">Hoeveel moet je goed hebben?</h2>

<p>Dit is de vraag die iedereen stelt. En het eerlijke antwoord is: <strong>dat maakt DUO niet bekend</strong>.</p>

<p>Je vindt online veel getallen. "18 van de 25 goed." "19 van de 25." "500 punten." Die getallen staan <strong>op geen enkele officiële pagina</strong>. En ze spreken elkaar tegen: de ene site zegt 18 voor Lezen, de andere 19.</p>

<p>Wat er officieel staat, is dit. In het examenreglement van DUO, artikel 10:</p>

${fact('"De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister." Een cesuur is de grens tussen geslaagd en niet geslaagd. DUO publiceert die grens niet.', 'DUO Examenreglement, artikel 10 lid 5', SRC_REGLEMENT)}

<p>En over je uitslag staat er: je krijgt "geslaagd" of "niet geslaagd", plus een cijfer per onderdeel. In de samenvatting van het reglement staat één zin die veel mensen rustiger maakt: <strong>"Niet alle antwoorden hoeven goed te zijn om te slagen."</strong></p>

<p>Dus: er is een grens, die is officieel vastgesteld, en jij kunt hem niet opzoeken. Reken niet op een getal dat je op een forum leest. Oefen tot je de meeste vragen goed hebt — dat is de enige strategie die werkt.</p>

<h2 id="moeilijk">Hoe moeilijk is het examen?</h2>

<p>Het inburgeringsexamen A2 is <strong>geen intelligentietest</strong>. Het is een format. En een format kun je leren.</p>

<p>A2 betekent: je kunt praten over dagelijkse dingen. Je werk, je familie, boodschappen doen, een afspraak maken bij de dokter. Je hoeft geen krantenartikel over politiek te begrijpen.</p>

<p>De meeste mensen die zakken, zakken niet omdat hun Nederlands te slecht is. Ze zakken omdat ze het examen niet kenden. Ze wisten niet dat Schrijven op papier is. Ze hadden nooit met een klok geoefend. Ze wisten niet dat je bij Luisteren niet kunt terugspoelen.</p>

<p>Daarom is oefenen met het echte format belangrijker dan nog honderd woorden leren.</p>

<h2 id="a2-of-b1">Doe je A2 of B1?</h2>

<p>Niet iedereen doet A2. Onder de Wet inburgering 2021 bepaalt de gemeente samen met jou welke leerroute je volgt. Dat staat in je <strong>persoonlijk plan inburgering en participatie (PIP)</strong>.</p>

<ul>
  <li><strong>B1-route:</strong> je gaat naar niveau B1. Dit is de standaardroute.</li>
  <li><strong>Onderwijsroute:</strong> B1 of hoger, gericht op een opleiding (mbo, hbo, universiteit).</li>
  <li><strong>Zelfredzaamheidsroute (Z-route):</strong> niveau A1, als B1 niet haalbaar is.</li>
</ul>

<p>Weet je niet welke route je hebt? Kijk in Mijn Inburgering. Meer over de niveaus lees je in <a href="/nl/blog/taalniveaus-a1-a2-b1-nederlands">het artikel over taalniveaus A1, A2 en B1</a>.</p>

<p>Let op: viel je onder de <strong>oude Wet inburgering 2013</strong>? Dan moesten alle taalexamens op "taalniveau A2 of hoger". De Wet inburgering 2021 is ingegaan op <strong>1 januari 2022</strong> — de wet heet 2021, maar werkt vanaf 2022. Veel websites hebben dat verkeerd.</p>

<h2 id="examendag">Op de examendag</h2>

<p>Een paar praktische dingen die bijna niemand opschrijft, maar die wel in het officiële reglement staan.</p>

${fact('Je krijgt 15 minuten uitleg voordat elk examen begint. Je moet 30 minuten voor het examen aanwezig zijn. Zonder geldig legitimatiebewijs mag je geen examen doen.', 'DUO Examenreglement', SRC_REGLEMENT)}

<ul>
  <li>De 15 minuten uitleg zijn <strong>extra</strong> — ze gaan niet van je examentijd af.</li>
  <li>Je telefoon, tas en horloge gaan in een kluisje.</li>
  <li>Naar de wc mag, maar alleen met begeleiding.</li>
  <li>Het examen is geheim. Geen foto's maken, geen vragen overschrijven. Dat is examenfraude.</li>
  <li>Je kunt je examendatum tot <strong>7 dagen</strong> vooraf veranderen.</li>
  <li>Kom je niet opdagen? Dan moet je opnieuw betalen.</li>
</ul>

<p>Je uitslag komt <strong>binnen 8 weken</strong> per brief, en staat ook in Mijn Inburgering.</p>

${fact('"Hebt u een kennisexamen gedaan? Of een taalexamen op niveau A2? Dan krijgt u de uitslag binnen 8 weken per brief."', 'inburgeren.nl — uitslag examen', SRC_UITSLAG)}

<h2 id="oefenen">Waar oefen je mee?</h2>

<p>DUO geeft zelf oefenexamens. Dat zijn er <strong>4 voor Lezen, 3 voor Luisteren, 3 voor Spreken en 3 voor Schrijven</strong>. Ze zijn gratis en ze zijn precies het echte format. Doe ze allemaal.</p>

<p>Maar drie of vier oefenexamens is niet veel als je een format wil leren. Daarom hebben wij er <strong>10 per onderdeel</strong>, 40 in totaal. Allemaal geschreven door een gecertificeerde NT2-docent — niet door een AI.</p>

<div class="info-box">
  <p>Twee praktische tips van DUO zelf: doe de oefenexamens op een <strong>computer</strong>, niet op je telefoon. En het oefenexamen Spreken van DUO <strong>werkt niet in Safari</strong>.</p>
</div>

<p>Wil je nu beginnen? Doe eerst <a href="/nl/oefenen">een gratis oefenexamen</a> en kijk waar je staat.</p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">De vier onderdelen</h3>
  <table class="facts-table">
    <tr><td>Lezen</td><td>65 min</td></tr>
    <tr><td>Luisteren</td><td>45 min</td></tr>
    <tr><td>Schrijven</td><td>40 min</td></tr>
    <tr><td>Spreken</td><td>35 min</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'lezen-examen-inburgering-a2', title: 'Het examen Lezen A2', desc: '25 vragen in 65 minuten — zo pak je het aan' },
      { slug: 'luisteren-examen-inburgering-a2', title: 'Het examen Luisteren A2', desc: 'Het onderdeel dat het meest wordt onderschat' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
    ],
    ctaTitle: 'Oefen met het echte examenformaat',
    ctaDesc: 'DUO geeft je 3 of 4 oefenexamens per onderdeel. Wij geven je 10 — gemaakt door een gecertificeerde NT2-docent.',
    ctaHref: '/oefenen',
    ctaLabel: 'Start gratis oefenexamen',
    translations: {
      en: {
        heroTitle: 'The A2 integration exam: all four language parts explained',
        description: 'What to know about the Dutch A2 integration exam: which four parts you sit, how long each takes and how many questions you get.',
        category: 'Guide & Information',
        breadcrumb: 'A2 integration exam',
        dateLabel: '8 July 2026',
        imageAlt: 'Woman studying Dutch for the A2 integration exam at a table with books and a laptop',
        relatedPosts: [
          { slug: 'lezen-examen-inburgering-a2', title: 'The Reading exam A2', desc: '25 questions in 65 minutes — how to approach it' },
          { slug: 'luisteren-examen-inburgering-a2', title: 'The Listening exam A2', desc: 'The part that is most often underestimated' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
        ],
        heroSubtitle: 'Four parts, four separate exams. Here is exactly what each one gives you — with the DUO source next to every figure.',
        ctaTitle: 'Practise with the real exam format',
        ctaDesc: 'DUO gives you 3 or 4 practice exams per part. We give you 10 — written by a certified NT2 teacher.',
        ctaLabel: 'Start a free practice exam',
        faq: [
          { q: 'How many questions are on the A2 integration exam?', a: 'DUO does not publish this. In DUO\'s official practice exams you get 25 questions for Reading, 25 for Listening, 16 for Speaking and 4 assignments for Writing. Those are the practice exams; DUO does not promise the real exam is identical.' },
          { q: 'How long does the A2 integration exam take?', a: 'Per part: Reading 65 minutes, Listening 45 minutes, Writing 40 minutes and Speaking 35 minutes. You also get 15 minutes of explanation before each exam starts. You do not sit all parts on one day.' },
          { q: 'How many answers do you need correct to pass?', a: 'Nobody outside DUO knows exactly, and DUO does not publish it. The exam regulations state that the pass mark is a "cesuur" set by the Minister. You get a grade per part plus a pass or fail. Not all answers need to be correct.' },
          { q: 'Which part is the hardest?', a: 'It differs per person. Listening is the most underestimated: 25 questions in 45 minutes and you cannot rewind. Reading gives you more time per question, but you still have to find the right information fast.' },
          { q: 'Do you take the exam on a computer?', a: 'Reading, Listening and Speaking are on a computer. Writing is with pen and paper. Many people do not know that and are surprised on exam day.' },
          { q: 'Should I take A2 or B1?', a: 'That is in your personal integration and participation plan (PIP). The municipality decides your learning route together with you. The B1 route targets level B1, the self-reliance route targets A1. Check Mijn Inburgering if you are unsure.' },
          { q: 'When do I get my result?', a: 'Within 8 weeks of the exam, by letter. Your result also appears in Mijn Inburgering. You cannot review a completed exam afterwards.' },
        ],
        articleHtml: `
<p>The <strong>A2 integration exam</strong> (inburgeringsexamen) has four language parts: <strong>Reading, Listening, Writing and Speaking</strong>. You sit them separately, on different days. Reading takes 65 minutes, Listening 45, Writing 40 and Speaking 35. You get a grade per part plus a "pass" or "fail". Failed one part? You only retake that part.</p>

<p>This article covers what each part gives you, how long you have, and how it is marked. Every figure carries its DUO source. That is not standard practice: many websites quote numbers DUO publishes nowhere. Where that happens, I say so.</p>

<div class="article-toc">
  <p class="article-toc-title">In this article</p>
  <ol>
    <li><a href="#overview">All four parts in one table</a></li>
    <li><a href="#reading">Reading: 65 minutes</a></li>
    <li><a href="#listening">Listening: 45 minutes</a></li>
    <li><a href="#writing">Writing: with pen and paper</a></li>
    <li><a href="#speaking">Speaking: talking to a computer</a></li>
    <li><a href="#passing">How much do you need correct?</a></li>
    <li><a href="#difficult">How hard is the exam?</a></li>
    <li><a href="#a2-or-b1">A2 or B1?</a></li>
    <li><a href="#exam-day">On exam day</a></li>
  </ol>
</div>

<h2 id="overview">All four parts in one table</h2>

<p>Each part is a separate exam, with its own duration and its own way of being marked.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Part</th><th>Questions</th><th>Time</th><th>Format</th><th>Marked by</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Reading</strong></td><td>25 questions</td><td>65 min</td><td>computer</td><td>automated</td></tr>
    <tr><td><strong>Listening</strong></td><td>25 questions</td><td>45 min</td><td>computer</td><td>automated</td></tr>
    <tr><td><strong>Writing</strong></td><td>4 assignments</td><td>40 min</td><td><strong>pen and paper</strong></td><td>humans</td></tr>
    <tr><td><strong>Speaking</strong></td><td>16 questions</td><td>35 min</td><td>computer</td><td>partly humans</td></tr>
  </tbody>
</table>
</div>

${factEn('The durations come from DUO: Reading 65 minutes, Listening 45, Writing 40, Speaking 35.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<p>The <strong>number of questions</strong> needs an explanation. DUO publishes it nowhere. The figures above come from the start screens of DUO\'s own official practice exams, which state literally: "U moet in dit examen 25 vragen beantwoorden" ("You must answer 25 questions in this exam"). I checked all ten online A2 practice exams.</p>

${factEn('In DUO’s official practice exams: Reading 25 questions (4 exams), Listening 25 questions (3 exams), Speaking 16 questions (3 exams). Writing: 4 assignments.', 'inburgeren.nl — practice exams', SRC_OEFENEN)}

<p>So these are the practice exams. DUO does not promise the real exam is identical. If another website presents a number as official, be careful.</p>

<h2 id="reading">Reading: 65 minutes</h2>

<p>For Reading you get texts on a screen and answer questions about them. Everyday texts: a letter from your child\'s school, an advert, a medicine leaflet, an email from work. Not literature — it is about finding information.</p>

<p>25 questions in 65 minutes is roughly <strong>2.5 minutes per question</strong>, and you have to read the text in that time too. This is where my students most often come unstuck: they read every text in full, look up every unknown word, and run out of time.</p>

<div class="info-box info-box-green">
  <p><strong>Tip:</strong> read the question first, then search the text for the answer. You do not need to understand every word to get a question right.</p>
</div>

<p>Reading is marked automatically — no human involved.</p>

<h2 id="listening">Listening: 45 minutes</h2>

<p>For Listening you watch short videos and listen to texts, then answer questions. This is the most underestimated part. You get the same 25 questions as Reading but <strong>20 minutes less time</strong> — and the crucial difference: audio passes. With a text you can look again. With audio you cannot.</p>

<p>The situations are ordinary: a conversation at the doctor, an announcement at the station, a colleague asking something. Exactly the Dutch you hear on the street.</p>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">You hear: "De trein naar Utrecht van 14.20 uur rijdt vandaag niet. Neem de trein van 14.50 uur." How much later does your train leave?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>20 minutes</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>30 minutes</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>50 minutes</span></button>
  </div>
  <div class="blog-quiz-ans">The correct answer is <strong>B</strong>. From 14.20 to 14.50 is 30 minutes. Listening questions often require arithmetic with times, so pay close attention to numbers — they are almost always the point.</div>
</div>

<h2 id="writing">Writing: with pen and paper</h2>

<p>This surprises almost everyone: <strong>Writing is not on a computer</strong>. You get a booklet and a blue pen. DUO states it plainly: "Het examen Schrijven op niveau A2 maakt u met pen en papier."</p>

${factEn('Writing A2 takes 40 minutes, you get 4 writing assignments, and you do it with pen and paper.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<p>Four assignments in 40 minutes — 10 minutes each. They mirror real life: a short email, a short text about yourself, or filling in a form.</p>

<p>Writing is <strong>marked by people</strong>, not a computer. The exam regulations say certified assessors do it. That matters: a human checks whether your message is clear. You do not need to write flawlessly.</p>

<div class="info-box">
  <p><strong>Practise with a pen.</strong> If you normally type everything on a phone, 40 minutes of handwriting is harder than you expect. Practise on paper at least a few times.</p>
</div>

<h2 id="speaking">Speaking: talking to a computer</h2>

<p>For Speaking you sit at a computer with a headset, watch videos and images, and record your answers. There is no examiner facing you.</p>

<p>DUO\'s practice exams have <strong>16 questions</strong> in four kinds: questions with a video, with 1 image, with 2 images and with 3 images.</p>

${factEn('Reading, Listening and KNM are marked automatically. Writing is marked by certified assessors. Speaking is partly automated and partly assessor-marked.', 'DUO exam regulations, article 10', SRC_REGLEMENT)}

<h2 id="passing">How much do you need correct?</h2>

<p>This is the question everyone asks, and the honest answer is: <strong>DUO does not publish it</strong>.</p>

<p>You will find plenty of numbers online. "18 out of 25." "19 out of 25." "500 points." None of those appear on any official page, and they contradict each other. What the regulations actually say is this:</p>

${factEn('"De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister." — the pass/fail boundary is a cut-off score set by the Minister. DUO does not publish it.', 'DUO exam regulations, article 10(5)', SRC_REGLEMENT)}

<p>On your result you get "pass" or "fail" plus a grade per part. And the plain-language summary of the regulations contains one reassuring line: <strong>not all answers need to be correct in order to pass</strong>.</p>

<p>So: a boundary exists, it is officially set, and you cannot look it up. Do not rely on a number from a forum. Practise until you get most questions right — that is the only strategy that works.</p>

<h2 id="difficult">How hard is the exam?</h2>

<p>The A2 integration exam is <strong>not an intelligence test</strong>. It is a format, and formats can be learned.</p>

<p>A2 means you can talk about everyday things: your work, your family, shopping, making a doctor\'s appointment. You do not need to follow a newspaper article about politics.</p>

<p>Most people who fail do not fail because their Dutch is too weak. They fail because they did not know the exam. They did not know Writing is on paper. They had never practised against a clock. They did not know you cannot rewind the Listening audio.</p>

<h2 id="a2-or-b1">A2 or B1?</h2>

<p>Not everyone sits A2. Under the Wet inburgering 2021 the municipality decides your learning route with you, and it is recorded in your <strong>PIP</strong> (personal integration and participation plan).</p>

<ul>
  <li><strong>B1 route:</strong> targets level B1. This is the standard route.</li>
  <li><strong>Education route:</strong> B1 or higher, aimed at further study.</li>
  <li><strong>Self-reliance route (Z-route):</strong> level A1, when B1 is not achievable.</li>
</ul>

<p>Note: under the older Wet inburgering 2013 all language exams had to be at "A2 or higher". The Wet inburgering 2021 took effect on <strong>1 January 2022</strong> — the law is named 2021 but applies from 2022. Many websites get this wrong.</p>

<h2 id="exam-day">On exam day</h2>

<p>A few practical things almost nobody writes down, but which are in the official regulations.</p>

${factEn('You get 15 minutes of explanation before each exam begins. You must be present 30 minutes beforehand. Without valid ID you may not sit the exam.', 'DUO exam regulations', SRC_REGLEMENT)}

<ul>
  <li>Those 15 minutes are <strong>extra</strong> — they do not come off your exam time.</li>
  <li>Phone, bag and watch go in a locker.</li>
  <li>You may use the toilet, but only with supervision.</li>
  <li>The exam is confidential. No photos, no copying questions — that is exam fraud.</li>
  <li>You can change your exam date up to <strong>7 days</strong> beforehand.</li>
  <li>Not showing up means paying again.</li>
</ul>

${factEn('"Hebt u een kennisexamen gedaan? Of een taalexamen op niveau A2? Dan krijgt u de uitslag binnen 8 weken per brief." — results within 8 weeks, by letter.', 'inburgeren.nl — exam results', SRC_UITSLAG)}

<h2 id="practise">What do you practise with?</h2>

<p>Start with DUO itself: <strong>4 practice exams for Reading, 3 for Listening, 3 for Speaking and 3 for Writing</strong>. They are free and they are the real format. Do all of them.</p>

<p>But three or four is not much for learning a format. That is why we have <strong>10 per part</strong>, 40 in total — all written by a certified NT2 teacher, not generated by an AI.</p>

<div class="info-box">
  <p>Two practical tips from DUO itself: take the practice exams on a <strong>computer</strong>, not a phone. And DUO\'s Speaking practice exam <strong>does not work in Safari</strong>.</p>
</div>

<p>Want to start now? <a href="/en/practice">Take a free practice exam</a> and see where you stand.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">The four parts</h3>
  <table class="facts-table">
    <tr><td>Reading</td><td>65 min</td></tr>
    <tr><td>Listening</td><td>45 min</td></tr>
    <tr><td>Writing</td><td>40 min</td></tr>
    <tr><td>Speaking</td><td>35 min</td></tr>
  </table>
</div>`,
      },
      ar: {
        heroTitle: 'امتحان الاندماج A2: شرح الأجزاء اللغوية الأربعة',
        description: 'ما تحتاج معرفته عن امتحان الاندماج الهولندي A2: الأجزاء الأربعة، ومدة كل جزء، وعدد الأسئلة التي ستحصل عليها.',
        category: 'دليل ومعلومات',
        breadcrumb: 'امتحان الاندماج A2',
        dateLabel: '8 يوليو 2026',
        imageAlt: 'امرأة تدرس الهولندية استعدادًا لامتحان الاندماج A2 على طاولة عليها كتب وحاسوب محمول',
        relatedPosts: [
          { slug: 'lezen-examen-inburgering-a2', title: 'امتحان القراءة A2', desc: '25 سؤالاً في 65 دقيقة — هكذا تتعامل معه' },
          { slug: 'luisteren-examen-inburgering-a2', title: 'امتحان الاستماع A2', desc: 'الجزء الذي يُستهان به أكثر من غيره' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
        ],
        heroSubtitle: 'أربعة أجزاء، وأربعة امتحانات منفصلة. هنا تجد بالتحديد ما يحتويه كل امتحان — مع مصدر من DUO لكل رقم.',
        ctaTitle: 'تدرّب على صيغة الامتحان الحقيقية',
        ctaDesc: 'تقدّم DUO 3 أو 4 امتحانات تدريبية لكل جزء. نحن نقدّم 10 — من إعداد معلمة NT2 معتمدة.',
        ctaLabel: 'ابدأ امتحانًا تدريبيًا مجانيًا',
        faq: [
          { q: 'كم عدد أسئلة امتحان الاندماج A2؟', a: 'لا تنشر DUO هذا الرقم. في الامتحانات التدريبية الرسمية من DUO تحصل على 25 سؤالًا للقراءة، و25 للاستماع، و16 للتحدث، و4 مهام للكتابة. هذه أرقام الامتحانات التدريبية؛ ولا تضمن DUO أن الامتحان الحقيقي مطابق لها.' },
          { q: 'كم تستغرق مدة امتحان الاندماج A2؟', a: 'لكل جزء: القراءة 65 دقيقة، الاستماع 45 دقيقة، الكتابة 40 دقيقة، والتحدث 35 دقيقة. كما تحصل على 15 دقيقة من الشرح قبل بدء كل امتحان. ولا تُقدّم الأجزاء كلها في يوم واحد.' },
          { q: 'كم إجابة صحيحة تحتاج للنجاح؟', a: 'لا أحد يعرف ذلك بدقة خارج DUO، وهي لا تنشره. ينص نظام الامتحانات على أن حد النجاح هو «cesuur» يحدده الوزير. تحصل على درجة لكل جزء ونتيجة ناجح أو غير ناجح. وليس مطلوبًا أن تكون كل الإجابات صحيحة.' },
          { q: 'ما هو أصعب جزء؟', a: 'يختلف من شخص لآخر. الاستماع هو الأكثر استهانةً: 25 سؤالًا في 45 دقيقة، ولا يمكنك إعادة التسجيل. أما القراءة فتمنحك وقتًا أطول لكل سؤال، لكن عليك إيجاد المعلومة بسرعة.' },
          { q: 'هل يُقدَّم الامتحان على الحاسوب؟', a: 'القراءة والاستماع والتحدث على الحاسوب. أما الكتابة فبالقلم والورق. كثيرون لا يعرفون ذلك ويتفاجؤون في يوم الامتحان.' },
          { q: 'هل أتقدّم لمستوى A2 أم B1؟', a: 'هذا مذكور في خطتك الشخصية للاندماج والمشاركة (PIP). تحدد البلدية معك مسار التعلّم. مسار B1 يستهدف مستوى B1، ومسار الاعتماد على الذات يستهدف A1. راجع Mijn Inburgering إذا لم تكن متأكدًا.' },
          { q: 'متى تصل النتيجة؟', a: 'خلال 8 أسابيع من الامتحان، برسالة بريدية. وتظهر النتيجة أيضًا في Mijn Inburgering. ولا يمكنك مراجعة امتحانك بعد تقديمه.' },
        ],
        articleHtml: `
<p>يتكوّن <strong>امتحان الاندماج A2</strong> من أربعة أجزاء لغوية: <strong>القراءة والاستماع والكتابة والتحدث</strong>. تُقدّمها منفصلة وفي أيام مختلفة. القراءة 65 دقيقة، الاستماع 45 دقيقة، الكتابة 40 دقيقة، والتحدث 35 دقيقة. تحصل على درجة لكل جزء ونتيجة «ناجح» أو «غير ناجح». وإذا لم تنجح في جزء واحد، فأنت تعيد ذلك الجزء فقط.</p>

<p>في هذه المقالة تقرأ ما يحتويه كل جزء، وكم من الوقت لديك، وكيف يُصحَّح. ومع كل رقم يوجد مصدره من DUO. هذا ليس أمرًا معتادًا: كثير من المواقع تذكر أرقامًا لا تنشرها DUO في أي مكان. وحيث يحدث ذلك، أقوله بصراحة.</p>

<div class="article-toc">
  <p class="article-toc-title">في هذه المقالة</p>
  <ol>
    <li><a href="#overview">الأجزاء الأربعة في جدول واحد</a></li>
    <li><a href="#reading">القراءة: 65 دقيقة</a></li>
    <li><a href="#listening">الاستماع: 45 دقيقة</a></li>
    <li><a href="#writing">الكتابة: بالقلم والورق</a></li>
    <li><a href="#speaking">التحدث: أمام الحاسوب</a></li>
    <li><a href="#passing">كم تحتاج من الإجابات الصحيحة؟</a></li>
    <li><a href="#difficult">ما مدى صعوبة الامتحان؟</a></li>
    <li><a href="#a2-or-b1">A2 أم B1؟</a></li>
    <li><a href="#exam-day">في يوم الامتحان</a></li>
  </ol>
</div>

<h2 id="overview">الأجزاء الأربعة في جدول واحد</h2>

<p>كل جزء امتحان منفصل، له مدته الخاصة وطريقة تصحيحه الخاصة.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>الجزء</th><th>الأسئلة</th><th>المدة</th><th>الوسيلة</th><th>التصحيح</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>القراءة</strong></td><td>25 سؤالًا</td><td>65 دقيقة</td><td>حاسوب</td><td>آلي</td></tr>
    <tr><td><strong>الاستماع</strong></td><td>25 سؤالًا</td><td>45 دقيقة</td><td>حاسوب</td><td>آلي</td></tr>
    <tr><td><strong>الكتابة</strong></td><td>4 مهام</td><td>40 دقيقة</td><td><strong>قلم وورق</strong></td><td>بشري</td></tr>
    <tr><td><strong>التحدث</strong></td><td>16 سؤالًا</td><td>35 دقيقة</td><td>حاسوب</td><td>بشري جزئيًا</td></tr>
  </tbody>
</table>
</div>

${factAr('المدد من DUO: القراءة 65 دقيقة، الاستماع 45 دقيقة، الكتابة 40 دقيقة، التحدث 35 دقيقة.', 'inburgeren.nl — مضمون امتحانات اللغة', SRC_INHOUD)}

<p>أما <strong>عدد الأسئلة</strong> فيحتاج توضيحًا. لا تنشره DUO في أي صفحة. الأرقام أعلاه مأخوذة من شاشات البداية للامتحانات التدريبية الرسمية من DUO نفسها، وفيها حرفيًا: «U moet in dit examen 25 vragen beantwoorden» أي «عليك الإجابة على 25 سؤالًا في هذا الامتحان». راجعتُ الامتحانات العشرة كلها.</p>

${factAr('في الامتحانات التدريبية الرسمية من DUO: القراءة 25 سؤالًا (4 امتحانات)، الاستماع 25 سؤالًا (3 امتحانات)، التحدث 16 سؤالًا (3 امتحانات). الكتابة: 4 مهام.', 'inburgeren.nl — الامتحانات التدريبية', SRC_OEFENEN)}

<p>إذن هذه أرقام الامتحانات التدريبية. ولا تضمن DUO أن الامتحان الحقيقي مطابق لها. فإذا رأيت رقمًا على موقع آخر معروضًا كرقم رسمي، فكن حذرًا.</p>

<h2 id="reading">القراءة: 65 دقيقة</h2>

<p>في القراءة تحصل على نصوص على شاشة الحاسوب وتجيب على أسئلة عنها. النصوص من الحياة اليومية: رسالة من مدرسة طفلك، إعلان، نشرة دواء، أو بريد إلكتروني من العمل. لا أدب ولا نصوص صعبة — المسألة هي إيجاد المعلومة.</p>

<p>25 سؤالًا في 65 دقيقة يعني نحو <strong>دقيقتين ونصف لكل سؤال</strong>، وعليك قراءة النص في هذا الوقت أيضًا. هنا يتعثّر طلابي أكثر ما يتعثرون: يقرؤون كل نص كاملًا، ويبحثون عن كل كلمة مجهولة، فينتهي الوقت.</p>

<div class="info-box info-box-green">
  <p><strong>نصيحة:</strong> اقرأ السؤال أولًا، ثم ابحث في النص عن الإجابة. لا تحتاج إلى فهم كل كلمة لتجيب إجابة صحيحة.</p>
</div>

<h2 id="listening">الاستماع: 45 دقيقة</h2>

<p>في الاستماع تشاهد مقاطع فيديو وتستمع إلى نصوص، ثم تجيب على أسئلة. هذا الجزء هو الأكثر استهانةً. عدد الأسئلة نفسه كالقراءة — 25 — لكن الوقت <strong>أقل بعشرين دقيقة</strong>. والفرق الأهم: الصوت يمضي. في النص يمكنك العودة، وفي الصوت لا.</p>

<p>المواقف يومية: حديث عند الطبيب، إعلان في المحطة، زميل يسأل شيئًا. إنها الهولندية التي تسمعها في الشارع.</p>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">تسمع: «De trein naar Utrecht van 14.20 uur rijdt vandaag niet. Neem de trein van 14.50 uur.» بكم يتأخر قطارك؟</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>20 دقيقة</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>30 دقيقة</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>50 دقيقة</span></button>
  </div>
  <div class="blog-quiz-ans">الإجابة الصحيحة هي <strong>B</strong>. من 14.20 إلى 14.50 ثلاثون دقيقة. كثيرًا ما تتطلب أسئلة الاستماع حسابًا للأوقات، فانتبه جيدًا للأرقام — فهي غالبًا جوهر السؤال.</div>
</div>

<h2 id="writing">الكتابة: بالقلم والورق</h2>

<p>هذا يفاجئ الجميع تقريبًا: <strong>الكتابة ليست على الحاسوب</strong>. تحصل على كتيّب وقلم أزرق. وتقول DUO ذلك بنفسها: «Het examen Schrijven op niveau A2 maakt u met pen en papier».</p>

${factAr('امتحان الكتابة A2 مدته 40 دقيقة، وتحصل على 4 مهام كتابية، وتؤديه بالقلم والورق.', 'inburgeren.nl — مضمون امتحانات اللغة', SRC_INHOUD)}

<p>أربع مهام في 40 دقيقة، أي 10 دقائق لكل مهمة. والمهام تشبه ما تكتبه في الحياة الواقعية: بريد إلكتروني قصير، نص قصير عن نفسك، أو تعبئة نموذج.</p>

<p>وتُصحَّح الكتابة <strong>بواسطة أشخاص</strong>، لا بحاسوب. ينص نظام الامتحانات على أن مصححين معتمدين يقومون بذلك. وهذا مهم: الشخص ينظر إن كانت رسالتك واضحة. لست مضطرًا للكتابة بلا أي خطأ.</p>

<h2 id="speaking">التحدث: أمام الحاسوب</h2>

<p>في التحدث تجلس أمام حاسوب مع سماعة، وتشاهد مقاطع وصورًا، وتسجّل إجاباتك. لا يجلس أمامك ممتحن.</p>

<p>الامتحانات التدريبية من DUO تحتوي على <strong>16 سؤالًا</strong> من أربعة أنواع: أسئلة مع فيديو، ومع صورة واحدة، ومع صورتين، ومع ثلاث صور.</p>

${factAr('القراءة والاستماع وKNM تُصحَّح آليًا. الكتابة يصححها مصححون معتمدون. والتحدث يُصحَّح جزئيًا آليًا وجزئيًا بواسطة مصححين معتمدين.', 'نظام امتحانات DUO، المادة 10', SRC_REGLEMENT)}

<h2 id="passing">كم تحتاج من الإجابات الصحيحة؟</h2>

<p>هذا هو السؤال الذي يطرحه الجميع، والجواب الصادق: <strong>DUO لا تنشر ذلك</strong>.</p>

<p>ستجد أرقامًا كثيرة على الإنترنت: «18 من 25»، «19 من 25»، «500 نقطة». لا يوجد أي من هذه الأرقام على صفحة رسمية، وهي تتناقض فيما بينها. أما ما ينص عليه النظام فعلًا فهو:</p>

${factAr('«De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister» — حد النجاح والرسوب يُعبَّر عنه بـ«cesuur» يحدده الوزير، ولا تنشره DUO.', 'نظام امتحانات DUO، المادة 10 البند 5', SRC_REGLEMENT)}

<p>وفي النتيجة تحصل على «ناجح» أو «غير ناجح» مع درجة لكل جزء. وفي الملخّص المبسّط للنظام سطر يريح كثيرين: <strong>ليس مطلوبًا أن تكون كل الإجابات صحيحة للنجاح</strong>.</p>

<p>إذن: هناك حد، وهو محدَّد رسميًا، ولا يمكنك الاطلاع عليه. لا تعتمد على رقم قرأته في منتدى. تدرّب حتى تصبح معظم إجاباتك صحيحة — فهذه هي الاستراتيجية الوحيدة التي تعمل.</p>

<h2 id="difficult">ما مدى صعوبة الامتحان؟</h2>

<p>امتحان الاندماج A2 <strong>ليس اختبار ذكاء</strong>. إنه صيغة، والصيغة يمكن تعلّمها.</p>

<p>مستوى A2 يعني أنك تستطيع التحدث عن أمور الحياة اليومية: عملك، أسرتك، التسوّق، حجز موعد عند الطبيب. ولست بحاجة إلى فهم مقال صحفي عن السياسة.</p>

<p>ومعظم من لا ينجحون لا يرسبون لأن هولنديتهم ضعيفة، بل لأنهم لم يعرفوا الامتحان. لم يعرفوا أن الكتابة على ورق. ولم يتدرّبوا يومًا مع ساعة. ولم يعرفوا أنه لا يمكن إعادة تسجيل الاستماع.</p>

<h2 id="a2-or-b1">A2 أم B1؟</h2>

<p>ليس الجميع يتقدّم لمستوى A2. في ظل قانون الاندماج 2021 تحدد البلدية معك مسار التعلّم، ويُدوَّن في <strong>خطتك الشخصية (PIP)</strong>.</p>

<ul>
  <li><strong>مسار B1:</strong> يستهدف مستوى B1، وهو المسار الأساسي.</li>
  <li><strong>مسار التعليم:</strong> B1 أو أعلى، وموجَّه إلى مواصلة الدراسة.</li>
  <li><strong>مسار الاعتماد على الذات:</strong> مستوى A1، عندما لا يكون B1 ممكنًا.</li>
</ul>

<p>ملاحظة: في ظل قانون الاندماج 2013 كان على كل امتحانات اللغة أن تكون على «مستوى A2 أو أعلى». وقانون الاندماج 2021 <strong>دخل حيّز التنفيذ في 1 يناير 2022</strong> — أي أن القانون يُسمّى 2021 لكنه يُطبَّق من 2022. وكثير من المواقع يخطئ في ذلك.</p>

<h2 id="exam-day">في يوم الامتحان</h2>

<p>بعض الأمور العملية التي يذكرها القليلون، لكنها موجودة في النظام الرسمي.</p>

${factAr('تحصل على 15 دقيقة من الشرح قبل بدء كل امتحان. وعليك الحضور 30 دقيقة قبل الموعد. وبدون هوية سارية لا يُسمح لك بأداء الامتحان.', 'نظام امتحانات DUO', SRC_REGLEMENT)}

<ul>
  <li>هذه الـ15 دقيقة <strong>إضافية</strong> ولا تُخصم من وقت امتحانك.</li>
  <li>الهاتف والحقيبة والساعة تُوضع في خزانة.</li>
  <li>يُسمح بالذهاب إلى الحمام، لكن بمرافقة فقط.</li>
  <li>الامتحان سرّي: لا صور ولا نسخ للأسئلة. وذلك يُعدّ غشًّا.</li>
  <li>يمكنك تغيير موعد امتحانك حتى <strong>7 أيام</strong> قبله.</li>
  <li>وإذا لم تحضر، فعليك الدفع من جديد.</li>
</ul>

${factAr('«Hebt u een kennisexamen gedaan? Of een taalexamen op niveau A2? Dan krijgt u de uitslag binnen 8 weken per brief» — النتيجة خلال 8 أسابيع برسالة بريدية.', 'inburgeren.nl — نتيجة الامتحان', SRC_UITSLAG)}

<h2 id="practise">بماذا تتدرّب؟</h2>

<p>ابدأ بـDUO نفسها: <strong>4 امتحانات تدريبية للقراءة، و3 للاستماع، و3 للتحدث، و3 للكتابة</strong>. وهي مجانية وبالصيغة الحقيقية. أدِّها كلها.</p>

<p>لكن ثلاثة أو أربعة امتحانات ليست كثيرة لتعلّم صيغة. لذلك لدينا <strong>10 لكل جزء</strong>، أي 40 في المجموع — كلها من إعداد معلمة NT2 معتمدة، وليست مُولَّدة بالذكاء الاصطناعي.</p>

<div class="info-box">
  <p>نصيحتان عمليتان من DUO نفسها: أدِّ الامتحانات التدريبية على <strong>حاسوب</strong> لا على الهاتف. وامتحان التحدث التدريبي من DUO <strong>لا يعمل في Safari</strong>.</p>
</div>

<p>هل تريد البدء الآن؟ <a href="/ar/تدرب">أدِّ امتحانًا تدريبيًا مجانيًا</a> واعرف مستواك.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">الأجزاء الأربعة</h3>
  <table class="facts-table">
    <tr><td>القراءة</td><td>65 دقيقة</td></tr>
    <tr><td>الاستماع</td><td>45 دقيقة</td></tr>
    <tr><td>الكتابة</td><td>40 دقيقة</td></tr>
    <tr><td>التحدث</td><td>35 دقيقة</td></tr>
  </table>
</div>`,
      },
    },
  },

  // ───────────────────────────────────────────────────────────── 2. LEZEN
  {
    slug: 'lezen-examen-inburgering-a2',
    title: 'Examen Lezen inburgering A2: format, tijd en tips',
    description: 'Het examen Lezen A2 duurt 65 minuten. Zo ziet het eruit, zoveel tijd heb je per vraag en dit zijn de fouten die je moet vermijden.',
    category: 'Tips & Voorbereiding',
    categoryKey: 'tips',
    categoryColor: 'orange',
    datePublished: '2026-07-14',
    dateModified: '2026-07-28',
    dateLabel: '14 juli 2026',
    breadcrumb: 'Examen Lezen A2',
    heroTitle: 'Examen Lezen inburgering A2: format, tijd en tips',
    heroSubtitle: '65 minuten, 25 vragen, teksten uit het dagelijks leven. Het lastige is niet de taal — het is de klok.',
    image: '/images/blog/lezen-examen-inburgering-a2.jpg',
    imageAlt: 'Cursist leest een Nederlandse tekst op een laptop tijdens het oefenen voor het examen Lezen A2',
    readingMinutes: 7,
    faq: [
      {
        q: 'Hoe lang duurt het examen Lezen A2?',
        a: '65 minuten. Dat is het langste van de vier taalonderdelen. Je krijgt daarnaast 15 minuten uitleg voordat het examen begint, en die tijd gaat niet van je examentijd af.',
      },
      {
        q: 'Hoeveel vragen krijg je bij Lezen?',
        a: 'In de vier officiële oefenexamens van DUO zijn het 25 vragen. DUO publiceert zelf geen aantal vragen voor het echte examen, dus reken op ongeveer dit aantal en niet op een exact getal.',
      },
      {
        q: 'Wat voor teksten krijg je bij het examen Lezen?',
        a: 'Teksten uit het dagelijks leven: een brief van school of de gemeente, een advertentie, een e-mail van werk, een bijsluiter, een mededeling in een winkel. Geen literatuur en geen moeilijke krantenartikelen.',
      },
      {
        q: 'Hoeveel tijd heb je per vraag bij Lezen?',
        a: 'Ongeveer 2,5 minuut. Maar in die tijd moet je ook de tekst lezen. Daarom is tempo bij dit onderdeel net zo belangrijk als je woordenschat.',
      },
      {
        q: 'Mag je een woordenboek gebruiken bij het examen Lezen?',
        a: 'Nee. Volgens het examenreglement gaan je telefoon, tas en andere spullen in een kluisje. Hulpmiddelen die niet uitdrukkelijk zijn toegestaan, zijn examenfraude.',
      },
      {
        q: 'Hoeveel vragen moet je goed hebben bij Lezen?',
        a: 'DUO maakt dat niet bekend. In het examenreglement staat dat de zak-slaaggrens een cesuur is die de minister vaststelt. Getallen als 18 of 19 van de 25 die je online tegenkomt, komen niet van DUO.',
      },
      {
        q: 'Wordt het examen Lezen door een mens nagekeken?',
        a: 'Nee. Lezen wordt automatisch nagekeken, net als Luisteren en KNM. Alleen Schrijven en Spreken worden (deels) door gecertificeerde beoordelaars bekeken.',
      },
    ],
    articleHtml: `
<p>Het <strong>examen Lezen</strong> van het inburgeringsexamen A2 duurt <strong>65 minuten</strong> en je doet het op de computer. Je leest teksten uit het dagelijks leven en beantwoordt daar vragen over. In de officiële oefenexamens van DUO zijn dat 25 vragen. Het examen wordt automatisch nagekeken.</p>

<p>Lezen is het onderdeel met de meeste tijd. Toch lopen veel mensen juist hier vast. Niet omdat de teksten te moeilijk zijn, maar omdat ze verkeerd lezen. In dit artikel lees je hoe het examen eruitziet en wat je anders moet doen.</p>

<div class="article-toc">
  <p class="article-toc-title">In dit artikel</p>
  <ol>
    <li><a href="#format">Het format: 65 minuten</a></li>
    <li><a href="#teksten">Welke teksten je krijgt</a></li>
    <li><a href="#vraagtypes">Welke soorten vragen je krijgt</a></li>
    <li><a href="#tempo">Het echte probleem: tempo</a></li>
    <li><a href="#strategie">De strategie: vraag eerst</a></li>
    <li><a href="#voorbeeld">Probeer een vraag</a></li>
    <li><a href="#fouten">Vijf fouten die je kunt vermijden</a></li>
    <li><a href="#examendag">Op de examendag</a></li>
    <li><a href="#slagen">Hoeveel moet je goed hebben?</a></li>
    <li><a href="#oefenen">Waar oefen je mee?</a></li>
  </ol>
</div>

<h2 id="format">Het format: 65 minuten</h2>

<p>DUO beschrijft het examen kort: "Het examen Lezen op niveau A2 doet u op de computer. U moet teksten lezen. U moet ook vragen beantwoorden."</p>

${fact('Het examen Lezen A2 duurt 65 minuten en je doet het op de computer.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

<p>Over het aantal vragen is DUO stil. Maar de officiële oefenexamens zijn er wel, en die zeggen het letterlijk. Op de startpagina van alle vier oefenexamens Lezen A2 staat: "U moet in dit examen 25 vragen beantwoorden."</p>

${fact('Alle vier de officiële oefenexamens Lezen A2 van DUO bestaan uit 25 vragen en duren 65 minuten.', 'inburgeren.nl — oefenen', SRC_OEFENEN)}

<p>De vragen zijn meerkeuzevragen. Je kiest uit een paar antwoorden; je hoeft zelf niets te schrijven. Dat maakt Lezen anders dan Schrijven en Spreken, waar je zelf taal moet produceren.</p>

<h2 id="teksten">Welke teksten je krijgt</h2>

<p>De teksten komen uit het gewone leven in Nederland. Denk aan:</p>

<ul>
  <li>een brief van de school van je kind;</li>
  <li>een e-mail van je werk over je rooster;</li>
  <li>een advertentie of aanbieding;</li>
  <li>een mededeling in een winkel of op het station;</li>
  <li>informatie over medicijnen;</li>
  <li>een brief van de gemeente of van DUO.</li>
</ul>

<p>Dat is goed nieuws. Het examen test niet of je mooie literatuur kunt lezen. Het test of je informatie kunt vinden die je in Nederland echt nodig hebt.</p>

<h3>Wat je niet hoeft te kunnen</h3>

<p>Het helpt om te weten wat er <em>niet</em> in zit. Je krijgt geen krantenartikelen over politiek. Geen literatuur. Geen vaktaal uit een beroep dat je niet hebt. Geen lange rapporten.</p>

<p>A2 betekent: teksten over het dagelijks leven. Als je een brief van de gemeente kunt begrijpen, zit je op het goede spoor.</p>

<h2 id="vraagtypes">Welke soorten vragen je krijgt</h2>

<p>De vragen zien er verschillend uit, maar in de praktijk komen ze op een paar types neer. Als je die herkent, weet je meteen waar je moet zoeken.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Soort vraag</th><th>Wat men vraagt</th><th>Waar je zoekt</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Detail</strong></td><td>een tijd, prijs, datum of adres</td><td>naar cijfers in de tekst</td></tr>
    <tr><td><strong>Hoofdgedachte</strong></td><td>waar gaat deze tekst over?</td><td>titel en eerste regels</td></tr>
    <tr><td><strong>Doel</strong></td><td>waarom is deze tekst geschreven?</td><td>wie stuurt het, en aan wie</td></tr>
    <tr><td><strong>Wat moet u doen</strong></td><td>welke actie wordt gevraagd</td><td>naar werkwoorden als "bel", "stuur", "kom"</td></tr>
    <tr><td><strong>Voorwaarde</strong></td><td>voor wie geldt iets wel of niet</td><td>naar woorden als "alleen", "als", "of hoger"</td></tr>
  </tbody>
</table>
</div>

<p>Dat laatste type kost de meeste punten. Een tekst zegt bijvoorbeeld dat iets alleen geldt "vanaf de 4e verdieping". Wie dat woordje mist, kiest het verkeerde antwoord — ook als hij de hele tekst goed begreep.</p>

<h2 id="tempo">Het echte probleem: tempo</h2>

<p>25 vragen in 65 minuten is ongeveer <strong>2,5 minuut per vraag</strong>. Dat klinkt ruim. Maar in die 2,5 minuut moet je ook de tekst lezen.</p>

<p>Dit is waar het bij mijn studenten misgaat. Ze lezen elke tekst helemaal, van het eerste woord tot het laatste. Ze zoeken elk woord op dat ze niet kennen. Bij vraag 15 is de tijd op.</p>

<p><strong>Je hoeft niet elk woord te begrijpen.</strong> Je hoeft alleen het antwoord op de vraag te vinden. Dat is een compleet andere manier van lezen dan wat je op school hebt geleerd.</p>

<h2 id="strategie">De strategie: vraag eerst</h2>

<p>Doe het in deze volgorde:</p>

<ol>
  <li><strong>Lees de vraag.</strong> Wat wil men precies weten? Een tijd? Een prijs? Een reden?</li>
  <li><strong>Zoek in de tekst.</strong> Ga met je ogen langs de tekst tot je dat stukje vindt.</li>
  <li><strong>Lees alleen dat stukje goed.</strong> Twee of drie zinnen zijn meestal genoeg.</li>
  <li><strong>Kies je antwoord</strong> en ga door.</li>
</ol>

<p>Weet je een antwoord niet? Kies iets en ga verder. Blijf niet hangen. Je hebt niets aan een perfect antwoord op vraag 8 als je vraag 20 tot 25 niet meer haalt.</p>

<div class="info-box info-box-green">
  <p><strong>Let op getallen.</strong> Tijden, prijzen, data en huisnummers zijn bijna altijd belangrijk. Als een vraag over een tijd gaat, zoek dan naar cijfers in de tekst — dat gaat sneller dan woorden lezen.</p>
</div>

<h2 id="voorbeeld">Probeer een vraag</h2>

<p>Zo werkt zo'n vraag in de praktijk. Lees eerst de vraag, dan het briefje.</p>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Op een briefje bij de lift staat: "De lift is kapot. Maandag komt de monteur. Woont u op de 4e verdieping of hoger en kunt u niet traplopen? Bel de beheerder: 020 555 1234." Wat moet u doen als u op de 2e verdieping woont?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>De beheerder bellen</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">B</span><span>Wachten op de monteur op maandag</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">C</span><span>Niets, u gebruikt de trap</span></button>
  </div>
  <div class="blog-quiz-ans">Het juiste antwoord is <strong>C</strong>. Het briefje zegt alleen dat je moet bellen als je op de <strong>4e verdieping of hoger</strong> woont én niet kunt traplopen. Woon je op de 2e? Dan geldt die regel niet voor jou. Zie je hoe belangrijk dat kleine woordje "of hoger" is? Dat is precies wat dit examen test.</div>
</div>

<h2 id="fouten">Vijf fouten die je kunt vermijden</h2>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>De hele tekst lezen.</strong> Zoek gericht. Lees alleen wat je nodig hebt.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>Zonder klok oefenen.</strong> Als je thuis nooit op tijd let, weet je niet hoe 65 minuten voelt. Zet altijd een timer.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>Op je telefoon oefenen.</strong> Het echte examen is op een computer, met een groot scherm. DUO adviseert zelf om op een computer te oefenen.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>Vragen openlaten.</strong> Je krijgt geen strafpunten voor een fout antwoord. Vul altijd iets in.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>Alleen woordjes leren.</strong> Woorden helpen, maar het examen test of je informatie kunt vinden. Dat is een vaardigheid, en die leer je door te oefenen.</p></div></div>

<h2 id="examendag">Op de examendag</h2>

<p>Een paar praktische dingen die in het officiële examenreglement staan, maar die je zelden ergens leest.</p>

${fact('Je moet 30 minuten voor het examen aanwezig zijn. Je krijgt 15 minuten uitleg voordat het examen begint. Zonder geldig legitimatiebewijs mag je geen examen doen.', 'DUO Examenreglement', SRC_REGLEMENT)}

<p>Die 15 minuten uitleg zijn <strong>extra</strong> — ze gaan niet van je 65 minuten af. Gebruik ze om rustig te worden en de knoppen te bekijken.</p>

<ul>
  <li>Neem een geldig legitimatiebewijs mee. Is het beschadigd of verlopen, dan mag je niet meedoen.</li>
  <li>Je telefoon, tas en horloge gaan in een kluisje.</li>
  <li>Naar de wc mag, maar alleen met begeleiding, en je moet het eerst vragen.</li>
  <li>Het examen is geheim: geen foto's, geen vragen overschrijven. Dat is examenfraude.</li>
  <li>Je kunt je examendatum, tijd of locatie tot <strong>7 dagen</strong> vooraf veranderen.</li>
</ul>

<h2 id="slagen">Hoeveel moet je goed hebben?</h2>

<p>Kort antwoord: <strong>dat weet niemand buiten DUO</strong>.</p>

<p>Je leest online vaak "18 van de 25 goed" of "19 van de 25". Die getallen staan op geen enkele officiële pagina, en ze spreken elkaar tegen. Wat er wél officieel staat, is dit:</p>

${fact('"De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister." DUO publiceert die grens niet.', 'DUO Examenreglement, artikel 10 lid 5', SRC_REGLEMENT)}

<p>Je krijgt een cijfer per onderdeel, plus "geslaagd" of "niet geslaagd". En in de samenvatting van het reglement staat: "Niet alle antwoorden hoeven goed te zijn om te slagen."</p>

<p>Praktisch betekent dat: mik niet op een minimum. Oefen tot je de grote meerderheid goed hebt. Dan zit je veilig, wat de cesuur ook is.</p>

<h2 id="oefenen">Waar oefen je mee?</h2>

<p>Begin bij DUO zelf. Er zijn <strong>4 gratis oefenexamens Lezen A2</strong>, en dat is precies het echte format en de echte klok.</p>

${fact('DUO biedt 4 online oefenexamens Lezen A2 aan. Voor Luisteren en Spreken zijn het 3, voor Schrijven 3 (als pdf).', 'inburgeren.nl — oefenen', SRC_OEFENEN)}

<p>Vier examens is een goed begin, maar het is te weinig om een format echt in je vingers te krijgen. Daarom hebben wij <strong>10 oefenexamens Lezen</strong>, allemaal geschreven door een gecertificeerde NT2-docent — niet gegenereerd door een AI. Bij een taalexamen is dat verschil belangrijk: een vraag die net verkeerd staat, leert je het verkeerde.</p>

<p>Lees ook <a href="/nl/blog/inburgeringsexamen-a2-uitleg">de uitleg over alle vier de onderdelen</a> en <a href="/nl/blog/luisteren-examen-inburgering-a2">het artikel over het examen Luisteren</a> — dat onderdeel lijkt op Lezen, maar is een stuk lastiger.</p>

<p>Klaar om te beginnen? <a href="/nl/oefenen">Doe een gratis oefenexamen Lezen</a>, met de klok erbij.</p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Lezen A2 in cijfers</h3>
  <table class="facts-table">
    <tr><td>Tijd</td><td>65 min</td></tr>
    <tr><td>Vragen (oefenexamen)</td><td>25</td></tr>
    <tr><td>Per vraag</td><td>±2,5 min</td></tr>
    <tr><td>Waarop</td><td>computer</td></tr>
    <tr><td>Nakijken</td><td>automatisch</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'inburgeringsexamen-a2-uitleg', title: 'Alle vier de onderdelen', desc: 'Lezen, Luisteren, Schrijven en Spreken uitgelegd' },
      { slug: 'luisteren-examen-inburgering-a2', title: 'Het examen Luisteren A2', desc: 'Zelfde aantal vragen, 20 minuten minder' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
    ],
    ctaTitle: 'Oefen Lezen met de klok erbij',
    ctaDesc: 'DUO geeft je 4 oefenexamens Lezen. Wij geven je 10 — met uitleg per vraag.',
    ctaHref: '/oefenen',
    ctaLabel: 'Start gratis oefenexamen',
    translations: {
      en: {
        heroTitle: 'Reading exam A2 (Lezen): format, timing and tips',
        description: 'The A2 Reading exam takes 65 minutes. Here is what it looks like, how much time you get per question, and the mistakes to avoid.',
        category: 'Tips & Preparation',
        breadcrumb: 'Reading exam A2',
        dateLabel: '14 July 2026',
        imageAlt: 'Student reading a Dutch text on a laptop while practising for the A2 Reading exam',
        relatedPosts: [
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'All four parts', desc: 'Reading, Listening, Writing and Speaking explained' },
          { slug: 'luisteren-examen-inburgering-a2', title: 'The Listening exam A2', desc: 'Same number of questions, 20 minutes less' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
        ],
        heroSubtitle: '65 minutes, 25 questions, texts from everyday life. The hard part is not the language — it is the clock.',
        ctaTitle: 'Practise Reading against the clock',
        ctaDesc: 'DUO gives you 4 Reading practice exams. We give you 10 — with an explanation for every question.',
        ctaLabel: 'Start a free practice exam',
        faq: [
          { q: 'How long does the A2 Reading exam take?', a: '65 minutes — the longest of the four language parts. You also get 15 minutes of explanation before the exam starts, and that does not come off your exam time.' },
          { q: 'How many questions are in the Reading exam?', a: 'In DUO’s four official practice exams there are 25 questions. DUO publishes no question count for the real exam, so treat 25 as indicative rather than exact.' },
          { q: 'What kind of texts do you get?', a: 'Everyday texts: a letter from school or the municipality, an advert, an email from work, a medicine leaflet, a notice in a shop. No literature and no difficult news articles.' },
          { q: 'How much time do you have per question?', a: 'About 2.5 minutes — but you have to read the text in that time too. That is why pace matters as much as vocabulary on this part.' },
          { q: 'Can you use a dictionary in the Reading exam?', a: 'No. Under the exam regulations your phone, bag and belongings go in a locker. Any aid that is not explicitly permitted counts as exam fraud.' },
          { q: 'How many questions do you need correct?', a: 'DUO does not publish it. The regulations state the pass mark is a cesuur set by the Minister. Figures like 18 or 19 out of 25 that circulate online do not come from DUO.' },
          { q: 'Is the Reading exam marked by a human?', a: 'No. Reading is marked automatically, like Listening and KNM. Only Writing and Speaking are (partly) reviewed by certified assessors.' },
        ],
        articleHtml: `
<p>The <strong>A2 Reading exam</strong> (Lezen) of the Dutch integration exam takes <strong>65 minutes</strong> and you sit it on a computer. You read everyday texts and answer questions about them. In DUO’s official practice exams that means 25 questions. It is marked automatically.</p>

<p>Reading gives you the most time of the four parts. Yet many people come unstuck here — not because the texts are too hard, but because they read them the wrong way.</p>

<div class="article-toc">
  <p class="article-toc-title">In this article</p>
  <ol>
    <li><a href="#format">The format: 65 minutes</a></li>
    <li><a href="#texts">Which texts you get</a></li>
    <li><a href="#question-types">The types of question</a></li>
    <li><a href="#pace">The real problem: pace</a></li>
    <li><a href="#strategy">The strategy: question first</a></li>
    <li><a href="#example">Try a question</a></li>
    <li><a href="#mistakes">Five avoidable mistakes</a></li>
    <li><a href="#passing">How much do you need correct?</a></li>
  </ol>
</div>

<h2 id="format">The format: 65 minutes</h2>

<p>DUO describes it briefly: you sit it on a computer, you read texts, and you answer questions.</p>

${factEn('The A2 Reading exam takes 65 minutes and is taken on a computer.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<p>On the number of questions DUO is silent. But its official practice exams are not: the start screen of all four A2 Reading practice exams states "U moet in dit examen 25 vragen beantwoorden".</p>

${factEn('All four official DUO A2 Reading practice exams contain 25 questions and last 65 minutes.', 'inburgeren.nl — practice exams', SRC_OEFENEN)}

<p>The questions are multiple choice. You never have to write anything yourself, which makes Reading fundamentally different from Writing and Speaking.</p>

<h2 id="texts">Which texts you get</h2>

<p>The texts come from ordinary life in the Netherlands:</p>

<ul>
  <li>a letter from your child’s school;</li>
  <li>an email from work about your shifts;</li>
  <li>an advert or a special offer;</li>
  <li>a notice in a shop or at the station;</li>
  <li>information about medicine;</li>
  <li>a letter from the municipality or from DUO.</li>
</ul>

<p>That is good news. The exam does not test whether you can read literature. It tests whether you can find information you actually need here.</p>

<h3>What you do not need</h3>

<p>No political news articles. No literature. No professional jargon. No long reports. If you can understand a letter from the municipality, you are on the right track.</p>

<h2 id="question-types">The types of question</h2>

<p>The questions look varied but come down to a handful of types. Recognise the type and you know where to look.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Type</th><th>What is asked</th><th>Where to look</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Detail</strong></td><td>a time, price, date or address</td><td>for digits in the text</td></tr>
    <tr><td><strong>Main idea</strong></td><td>what is this text about?</td><td>the title and first lines</td></tr>
    <tr><td><strong>Purpose</strong></td><td>why was it written?</td><td>who sent it, and to whom</td></tr>
    <tr><td><strong>Required action</strong></td><td>what should you do?</td><td>verbs like "bel", "stuur", "kom"</td></tr>
    <tr><td><strong>Condition</strong></td><td>who does this apply to?</td><td>words like "alleen", "als", "of hoger"</td></tr>
  </tbody>
</table>
</div>

<p>That last type costs the most marks. A text says something applies only "vanaf de 4e verdieping" (from the 4th floor up). Miss those words and you pick the wrong answer — even if you understood the whole text.</p>

<h2 id="pace">The real problem: pace</h2>

<p>25 questions in 65 minutes is about <strong>2.5 minutes per question</strong>, and the text has to be read in that time too.</p>

<p>This is where my students lose marks. They read every text from the first word to the last and look up every unfamiliar word. By question 15 the time is gone.</p>

<p><strong>You do not need to understand every word.</strong> You need to find the answer. That is a completely different kind of reading from what most people learned at school.</p>

<h2 id="strategy">The strategy: question first</h2>

<ol>
  <li><strong>Read the question.</strong> What exactly is wanted — a time? a price? a reason?</li>
  <li><strong>Scan the text</strong> until you find that part.</li>
  <li><strong>Read only that part properly.</strong> Two or three sentences is usually enough.</li>
  <li><strong>Choose and move on.</strong></li>
</ol>

<p>Do not know an answer? Pick something and continue. A perfect answer to question 8 is worthless if you never reach questions 20 to 25.</p>

<div class="info-box info-box-green">
  <p><strong>Watch the numbers.</strong> Times, prices, dates and house numbers are almost always the point. If a question is about a time, scan for digits — far faster than reading words.</p>
</div>

<h2 id="example">Try a question</h2>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">A notice by the lift reads: "De lift is kapot. Maandag komt de monteur. Woont u op de 4e verdieping of hoger en kunt u niet traplopen? Bel de beheerder: 020 555 1234." What should you do if you live on the 2nd floor?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Call the building manager</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">B</span><span>Wait for the engineer on Monday</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">C</span><span>Nothing — use the stairs</span></button>
  </div>
  <div class="blog-quiz-ans">The correct answer is <strong>C</strong>. The notice only asks you to call if you live on the <strong>4th floor or higher</strong> and cannot use stairs. On the 2nd floor that condition does not apply to you. Notice how much rests on "of hoger" — that is exactly what this exam tests.</div>
</div>

<h2 id="mistakes">Five avoidable mistakes</h2>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>Reading the whole text.</strong> Search instead. Read only what you need.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>Practising without a clock.</strong> If you never time yourself, you do not know what 65 minutes feels like.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>Practising on a phone.</strong> The real exam is on a computer with a large screen — DUO advises the same.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>Leaving questions blank.</strong> There is no penalty for a wrong answer. Always fill something in.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>Only learning vocabulary.</strong> Words help, but this exam tests a skill, and skills come from practice.</p></div></div>

<h2 id="passing">How much do you need correct?</h2>

<p>Short answer: <strong>nobody outside DUO knows</strong>. You will read "18 out of 25" or "19 out of 25" online. Those numbers appear on no official page and they contradict each other. What is official is this:</p>

${factEn('"De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister." — the pass mark is a cut-off set by the Minister, and DUO does not publish it.', 'DUO exam regulations, article 10(5)', SRC_REGLEMENT)}

<p>You get a grade per part plus pass or fail, and the plain-language summary of the regulations notes that not all answers need to be correct. Practically: do not aim at a minimum. Practise until you get the large majority right.</p>

<p>Start with DUO’s <strong>4 free Reading practice exams</strong> — real format, real clock. Four is a good start but too few to master a format, which is why we have 10, written by a certified NT2 teacher rather than generated by a model. With a language exam that difference matters: a question that is subtly wrong teaches you the wrong thing.</p>

<p>Read on: <a href="/en/blog/a2-integration-exam-explained">all four parts explained</a>, or <a href="/en/practice">take a free practice exam</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Reading A2 in numbers</h3>
  <table class="facts-table">
    <tr><td>Time</td><td>65 min</td></tr>
    <tr><td>Questions (practice)</td><td>25</td></tr>
    <tr><td>Per question</td><td>±2.5 min</td></tr>
    <tr><td>Format</td><td>computer</td></tr>
    <tr><td>Marking</td><td>automated</td></tr>
  </table>
</div>`,
      },
      ar: {
        heroTitle: 'امتحان القراءة A2 (Lezen): الشكل والتوقيت والنصائح',
        description: 'امتحان القراءة A2 مدته 65 دقيقة. إليك شكله، وكم من الوقت لديك لكل سؤال، والأخطاء التي عليك تجنّبها.',
        category: 'نصائح وتحضير',
        breadcrumb: 'امتحان القراءة A2',
        dateLabel: '14 يوليو 2026',
        imageAlt: 'دارس يقرأ نصًا هولنديًا على حاسوب محمول أثناء التدرّب على امتحان القراءة A2',
        relatedPosts: [
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'الأجزاء الأربعة كلها', desc: 'شرح القراءة والاستماع والكتابة والتحدث' },
          { slug: 'luisteren-examen-inburgering-a2', title: 'امتحان الاستماع A2', desc: 'نفس عدد الأسئلة، و20 دقيقة أقل' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
        ],
        heroSubtitle: '65 دقيقة، و25 سؤالاً، ونصوص من الحياة اليومية. الصعوبة ليست في اللغة — بل في الساعة.',
        ctaTitle: 'تدرّب على القراءة والساعة أمامك',
        ctaDesc: 'تمنحك DUO 4 امتحانات تجريبية للقراءة. ونحن نمنحك 10 — مع شرح بعد كل سؤال.',
        ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
        faq: [
          { q: 'كم يستغرق امتحان القراءة A2؟', a: '65 دقيقة — وهو الأطول بين أجزاء اللغة الأربعة. كما تحصل على 15 دقيقة من الشرح قبل بدء الامتحان، وهذه لا تُحتسب من وقت امتحانك.' },
          { q: 'كم عدد الأسئلة في امتحان القراءة؟', a: 'في الامتحانات التجريبية الرسمية الأربعة من DUO يوجد 25 سؤالاً. ولا تنشر DUO عدد أسئلة الامتحان الحقيقي، لذا اعتبر الرقم 25 مؤشرًا لا رقمًا دقيقًا.' },
          { q: 'ما نوع النصوص التي تحصل عليها؟', a: 'نصوص يومية: رسالة من المدرسة أو من البلدية، أو إعلان، أو بريد إلكتروني من العمل، أو نشرة دواء، أو لافتة في متجر. لا أدب ولا مقالات إخبارية صعبة.' },
          { q: 'كم من الوقت لديك لكل سؤال؟', a: 'حوالي 2.5 دقيقة — لكن عليك قراءة النص ضمن هذا الوقت أيضًا. ولهذا فإن الإيقاع في هذا الجزء لا يقل أهمية عن المفردات.' },
          { q: 'هل يمكن استخدام قاموس في امتحان القراءة؟', a: 'لا. بموجب لائحة الامتحانات تُوضع هاتفك وحقيبتك وأغراضك في خزانة. وأي وسيلة مساعدة غير مسموح بها صراحةً تُعدّ غشًا في الامتحان.' },
          { q: 'كم سؤالاً يجب أن تجيب عنه بشكل صحيح؟', a: 'لا تنشر DUO ذلك. وتنص اللائحة على أن حدّ النجاح هو «cesuur» يحدده الوزير. أما الأرقام المتداولة على الإنترنت مثل 18 أو 19 من 25 فهي ليست من DUO.' },
          { q: 'هل يصحّح إنسان امتحان القراءة؟', a: 'لا. تُصحَّح القراءة آليًا، مثل الاستماع وKNM. أما الكتابة والتحدث فيراجعهما (جزئيًا) مصحّحون معتمدون.' },
        ],
        articleHtml: `
<p><strong>امتحان القراءة A2</strong> (Lezen) ضمن امتحان الاندماج الهولندي مدته <strong>65 دقيقة</strong> وتؤديه على حاسوب. تقرأ نصوصًا يومية وتجيب عن أسئلة عنها. وفي الامتحانات التجريبية الرسمية من DUO يعني ذلك 25 سؤالاً. ويُصحَّح آليًا.</p>

<p>تمنحك القراءة أكبر قدر من الوقت بين الأجزاء الأربعة. ومع ذلك يتعثّر كثيرون هنا — لا لأن النصوص صعبة أكثر من اللازم، بل لأنهم يقرؤونها بالطريقة الخطأ.</p>

<div class="article-toc">
  <p class="article-toc-title">في هذا المقال</p>
  <ol>
    <li><a href="#format">الشكل: 65 دقيقة</a></li>
    <li><a href="#texts">أي نصوص تحصل عليها</a></li>
    <li><a href="#question-types">أنواع الأسئلة</a></li>
    <li><a href="#pace">المشكلة الحقيقية: الإيقاع</a></li>
    <li><a href="#strategy">الاستراتيجية: السؤال أولاً</a></li>
    <li><a href="#example">جرّب سؤالاً</a></li>
    <li><a href="#mistakes">خمسة أخطاء يمكن تجنّبها</a></li>
    <li><a href="#passing">كم تحتاج من الإجابات الصحيحة؟</a></li>
  </ol>
</div>

<h2 id="format">الشكل: 65 دقيقة</h2>

<p>تصف DUO الأمر باختصار: تؤديه على حاسوب، وتقرأ نصوصًا، وتجيب عن أسئلة.</p>

${factAr('امتحان القراءة A2 مدته 65 دقيقة ويُؤدى على حاسوب.', 'inburgeren.nl — محتوى امتحانات اللغة', SRC_INHOUD)}

<p>أما عن عدد الأسئلة فلا تقول DUO شيئًا. لكن امتحاناتها التجريبية الرسمية تقول: شاشة البدء في الامتحانات التجريبية الأربعة للقراءة A2 تنص على «U moet in dit examen 25 vragen beantwoorden».</p>

${factAr('تحتوي الامتحانات التجريبية الرسمية الأربعة للقراءة A2 من DUO على 25 سؤالاً ومدتها 65 دقيقة.', 'inburgeren.nl — الامتحانات التجريبية', SRC_OEFENEN)}

<p>الأسئلة من نوع الاختيار من متعدد. ولست مضطرًا أبدًا إلى كتابة شيء بنفسك، وهذا ما يجعل القراءة مختلفة جوهريًا عن الكتابة والتحدث.</p>

<h2 id="texts">أي نصوص تحصل عليها</h2>

<p>النصوص مأخوذة من الحياة العادية في هولندا:</p>

<ul>
  <li>رسالة من مدرسة طفلك؛</li>
  <li>بريد إلكتروني من العمل عن نوبات عملك؛</li>
  <li>إعلان أو عرض خاص؛</li>
  <li>لافتة في متجر أو في المحطة؛</li>
  <li>معلومات عن دواء؛</li>
  <li>رسالة من البلدية أو من DUO.</li>
</ul>

<p>وهذا خبر جيد. فالامتحان لا يختبر قدرتك على قراءة الأدب. بل يختبر قدرتك على العثور على معلومات تحتاجها فعلاً هنا.</p>

<h3>ما لا تحتاج إليه</h3>

<p>لا مقالات إخبارية سياسية. ولا أدب. ولا مصطلحات مهنية. ولا تقارير طويلة. إن كنت تستطيع فهم رسالة من البلدية، فأنت على الطريق الصحيح.</p>

<h2 id="question-types">أنواع الأسئلة</h2>

<p>تبدو الأسئلة متنوعة لكنها تعود إلى عدد قليل من الأنواع. تعرّف على النوع وستعرف أين تبحث.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>النوع</th><th>ما المطلوب</th><th>أين تبحث</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>تفصيل</strong></td><td>وقت أو سعر أو تاريخ أو عنوان</td><td>عن الأرقام في النص</td></tr>
    <tr><td><strong>الفكرة الرئيسية</strong></td><td>عمّ يتحدث هذا النص؟</td><td>العنوان والأسطر الأولى</td></tr>
    <tr><td><strong>الغرض</strong></td><td>لماذا كُتب؟</td><td>من أرسله، وإلى من</td></tr>
    <tr><td><strong>الإجراء المطلوب</strong></td><td>ماذا عليك أن تفعل؟</td><td>أفعال مثل «bel» و«stuur» و«kom»</td></tr>
    <tr><td><strong>الشرط</strong></td><td>على من ينطبق هذا؟</td><td>كلمات مثل «alleen» و«als» و«of hoger»</td></tr>
  </tbody>
</table>
</div>

<p>النوع الأخير هو أكثر ما يكلّف درجات. فنصٌّ يقول إن شيئًا ينطبق فقط «vanaf de 4e verdieping» (من الطابق الرابع فما فوق). إن فاتتك هذه الكلمات اخترت الإجابة الخطأ — حتى لو فهمت النص كله.</p>

<h2 id="pace">المشكلة الحقيقية: الإيقاع</h2>

<p>25 سؤالاً في 65 دقيقة تعني نحو <strong>2.5 دقيقة لكل سؤال</strong>، وعليك قراءة النص ضمن هذا الوقت أيضًا.</p>

<p>وهنا يخسر دارسيّ الدرجات. يقرؤون كل نص من أول كلمة إلى آخرها ويبحثون عن كل كلمة غير مألوفة. وعند السؤال الخامس عشر يكون الوقت قد نفد.</p>

<p><strong>لست بحاجة إلى فهم كل كلمة.</strong> أنت بحاجة إلى العثور على الإجابة. وهذا نوع من القراءة مختلف تمامًا عمّا تعلّمه معظم الناس في المدرسة.</p>

<h2 id="strategy">الاستراتيجية: السؤال أولاً</h2>

<ol>
  <li><strong>اقرأ السؤال.</strong> ما المطلوب بالضبط — وقت؟ سعر؟ سبب؟</li>
  <li><strong>امسح النص بسرعة</strong> حتى تجد ذلك الجزء.</li>
  <li><strong>اقرأ ذلك الجزء وحده بتمعّن.</strong> جملتان أو ثلاث تكفي عادةً.</li>
  <li><strong>اختر وانتقل إلى التالي.</strong></li>
</ol>

<p>لا تعرف إجابةً ما؟ اختر شيئًا وتابع. فإجابة مثالية عن السؤال الثامن لا قيمة لها إن لم تصل أبدًا إلى الأسئلة من 20 إلى 25.</p>

<div class="info-box info-box-green">
  <p><strong>انتبه للأرقام.</strong> الأوقات والأسعار والتواريخ وأرقام المنازل هي المقصودة دائمًا تقريبًا. فإن كان السؤال عن وقت، امسح النص بحثًا عن الأرقام — أسرع بكثير من قراءة الكلمات.</p>
</div>

<h2 id="example">جرّب سؤالاً</h2>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">لافتة بجانب المصعد تقول: «De lift is kapot. Maandag komt de monteur. Woont u op de 4e verdieping of hoger en kunt u niet traplopen? Bel de beheerder: 020 555 1234.» ماذا عليك أن تفعل إن كنت تسكن في الطابق الثاني؟</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>الاتصال بمدير المبنى</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">B</span><span>انتظار الفنّي يوم الاثنين</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">C</span><span>لا شيء — استخدم الدرج</span></button>
  </div>
  <div class="blog-quiz-ans">الإجابة الصحيحة هي <strong>C</strong>. فاللافتة تطلب منك الاتصال فقط إن كنت تسكن في <strong>الطابق الرابع أو أعلى</strong> ولا تستطيع استخدام الدرج. وفي الطابق الثاني لا ينطبق عليك هذا الشرط. لاحظ كم يتوقف الأمر على «of hoger» — وهذا بالضبط ما يختبره هذا الامتحان.</div>
</div>

<h2 id="mistakes">خمسة أخطاء يمكن تجنّبها</h2>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>قراءة النص كاملاً.</strong> ابحث بدل ذلك. اقرأ ما تحتاجه فقط.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>التدرّب بدون ساعة.</strong> إن لم تحسب وقتك أبدًا، فلن تعرف كيف تبدو الـ65 دقيقة.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>التدرّب على الهاتف.</strong> الامتحان الحقيقي على حاسوب بشاشة كبيرة — وDUO تنصح بالشيء نفسه.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>ترك أسئلة فارغة.</strong> لا عقوبة على الإجابة الخاطئة. املأ شيئًا دائمًا.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>تعلّم المفردات وحدها.</strong> الكلمات تساعد، لكن هذا الامتحان يختبر مهارة، والمهارات تأتي من التدريب.</p></div></div>

<h2 id="passing">كم تحتاج من الإجابات الصحيحة؟</h2>

<p>الجواب المختصر: <strong>لا أحد خارج DUO يعرف</strong>. ستقرأ على الإنترنت «18 من 25» أو «19 من 25». وهذه الأرقام لا ترد في أي صفحة رسمية وهي متناقضة فيما بينها. أما الرسمي فهو التالي:</p>

${factAr('«De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister.» — حدّ النجاح والرسوب هو عتبة يحددها الوزير، وDUO لا تنشرها.', 'لائحة امتحانات DUO، المادة 10 الفقرة 5', SRC_REGLEMENT)}

<p>تحصل على درجة لكل جزء إضافة إلى نجاح أو رسوب، ويشير الملخص المبسّط للائحة إلى أنه ليس من الضروري أن تكون كل الإجابات صحيحة. وعمليًا: لا تستهدف الحد الأدنى. تدرّب حتى تصيب الغالبية العظمى من الأسئلة.</p>

<p>ابدأ بامتحانات DUO التجريبية <strong>الأربعة المجانية للقراءة</strong> — شكل حقيقي وساعة حقيقية. أربعة بداية جيدة لكنها قليلة جدًا لإتقان شكل الامتحان، ولهذا لدينا 10، كتبها مدرّس NT2 معتمد بدل أن يولّدها نموذج. ومع امتحان لغة يُحدث هذا الفرق فارقًا: فالسؤال الخاطئ بشكل خفي يعلّمك الشيء الخطأ.</p>

<p>تابع القراءة: <a href="/ar/المدونة/شرح-امتحان-الاندماج-a2">شرح الأجزاء الأربعة</a>، أو <a href="/ar/تدرب">قدّم امتحانًا تجريبيًا مجانيًا</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">القراءة A2 بالأرقام</h3>
  <table class="facts-table">
    <tr><td>الوقت</td><td>65 دقيقة</td></tr>
    <tr><td>الأسئلة (تجريبي)</td><td>25</td></tr>
    <tr><td>لكل سؤال</td><td>±2.5 دقيقة</td></tr>
    <tr><td>الشكل</td><td>حاسوب</td></tr>
    <tr><td>التصحيح</td><td>آلي</td></tr>
  </table>
</div>`,
      },
    },
  },

  // ───────────────────────────────────────────────────────────── 3. LUISTEREN
  {
    slug: 'luisteren-examen-inburgering-a2',
    title: 'Examen Luisteren inburgering A2: format en tips',
    description: 'Het examen Luisteren A2 duurt 45 minuten en je kunt niets terugspoelen. Zo ziet het format eruit en zo voorkom je de bekende fouten.',
    category: 'Tips & Voorbereiding',
    categoryKey: 'tips',
    categoryColor: 'orange',
    datePublished: '2026-07-20',
    dateModified: '2026-07-28',
    dateLabel: '20 juli 2026',
    breadcrumb: 'Examen Luisteren A2',
    heroTitle: 'Examen Luisteren inburgering A2: format en tips',
    heroSubtitle: 'Evenveel vragen als bij Lezen, maar 20 minuten minder tijd — en je kunt een fragment niet terugspoelen.',
    image: '/images/blog/luisteren-examen-inburgering-a2.jpg',
    imageAlt: 'Cursist oefent met een koptelefoon voor het examen Luisteren van het inburgeringsexamen A2',
    readingMinutes: 7,
    faq: [
      {
        q: 'Hoe lang duurt het examen Luisteren A2?',
        a: '45 minuten, op de computer. Daarnaast krijg je 15 minuten uitleg voordat het examen begint.',
      },
      {
        q: 'Hoeveel vragen krijg je bij Luisteren?',
        a: 'In de drie officiële oefenexamens van DUO zijn het 25 vragen — evenveel als bij Lezen, maar in 20 minuten minder tijd. DUO publiceert geen officieel aantal vragen voor het echte examen.',
      },
      {
        q: 'Kun je een fragment bij Luisteren opnieuw beluisteren?',
        a: 'Ga daar niet van uit. Een gesprek gaat voorbij en anders dan bij een tekst kun je niet terugkijken. Oefen daarom altijd zo dat je elk fragment één keer hoort.',
      },
      {
        q: 'Wat voor situaties hoor je bij het examen Luisteren?',
        a: 'Alledaagse situaties: een gesprek bij de huisarts, een mededeling op het station, een collega die iets vraagt, een telefoontje van school. DUO zegt dat je vragen krijgt over filmpjes en dat je naar teksten luistert.',
      },
      {
        q: 'Waarom is Luisteren moeilijker dan Lezen?',
        a: 'Om drie redenen: je hebt minder tijd per vraag, je bepaalt zelf niet het tempo, en je kunt niet terug. Bij Lezen kun je een moeilijke zin drie keer bekijken. Bij Luisteren is hij weg.',
      },
      {
        q: 'Mag je aantekeningen maken tijdens het examen Luisteren?',
        a: 'Je eigen spullen mag je niet gebruiken; die gaan volgens het examenreglement in een kluisje. Vraag op de examenlocatie wat wel mag — de belangrijkste regels staan ook in je oproepbrief.',
      },
      {
        q: 'Hoe wordt het examen Luisteren nagekeken?',
        a: 'Automatisch. Volgens artikel 10 van het examenreglement worden Luisteren, Lezen en KNM geautomatiseerd nagekeken. Er kijkt geen mens naar je antwoorden.',
      },
    ],
    articleHtml: `
<p>Het <strong>examen Luisteren</strong> van het inburgeringsexamen A2 duurt <strong>45 minuten</strong> en je doet het op de computer. Je kijkt naar filmpjes en luistert naar teksten, en beantwoordt daar vragen over. In de officiële oefenexamens van DUO zijn dat 25 vragen. Het wordt automatisch nagekeken.</p>

<p>Op papier lijkt Luisteren op Lezen: zelfde aantal vragen, zelfde soort onderwerpen. In de praktijk is het het onderdeel dat het vaakst wordt onderschat. Hier lees je waarom, en wat je eraan kunt doen.</p>

<div class="article-toc">
  <p class="article-toc-title">In dit artikel</p>
  <ol>
    <li><a href="#format">Het format: 45 minuten</a></li>
    <li><a href="#waarom">Waarom Luisteren lastiger is dan Lezen</a></li>
    <li><a href="#situaties">Welke situaties je hoort</a></li>
    <li><a href="#vraagtypes">Welke soorten vragen je krijgt</a></li>
    <li><a href="#strategie">De strategie: lees vooruit</a></li>
    <li><a href="#voorbeeld">Probeer een vraag</a></li>
    <li><a href="#alles-begrijpen">De grootste fout: alles willen begrijpen</a></li>
    <li><a href="#oefenen-thuis">Hoe je thuis oefent</a></li>
    <li><a href="#examendag">Op de examendag</a></li>
    <li><a href="#slagen">Hoeveel moet je goed hebben?</a></li>
  </ol>
</div>

<h2 id="format">Het format: 45 minuten</h2>

<p>DUO beschrijft het zo: "Het examen Luisteren op niveau A2 doet u op de computer. U krijgt vragen over filmpjes en u luistert naar teksten."</p>

${fact('Het examen Luisteren A2 duurt 45 minuten en je doet het op de computer.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

<p>Het aantal vragen publiceert DUO niet. Maar op de startpagina van alle drie de officiële oefenexamens Luisteren A2 staat het letterlijk: "U moet in dit examen 25 vragen beantwoorden."</p>

${fact('De drie officiële oefenexamens Luisteren A2 van DUO bestaan uit 25 vragen en duren 45 minuten.', 'inburgeren.nl — oefenen', SRC_OEFENEN)}

<h2 id="waarom">Waarom Luisteren lastiger is dan Lezen</h2>

<p>Vergelijk de twee onderdelen even naast elkaar. Dan zie je het probleem meteen.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>Lezen</th><th>Luisteren</th></tr>
  </thead>
  <tbody>
    <tr><td>Vragen (oefenexamen)</td><td>25</td><td>25</td></tr>
    <tr><td>Tijd</td><td>65 min</td><td><strong>45 min</strong></td></tr>
    <tr><td>Tijd per vraag</td><td>±2,5 min</td><td><strong>±1,8 min</strong></td></tr>
    <tr><td>Kun je terug?</td><td>ja</td><td><strong>nee</strong></td></tr>
    <tr><td>Wie bepaalt het tempo?</td><td>jij</td><td><strong>het examen</strong></td></tr>
  </tbody>
</table>
</div>

<p>Drie dingen maken het verschil:</p>

<ol>
  <li><strong>Minder tijd.</strong> Bijna een minuut minder per vraag.</li>
  <li><strong>Je bepaalt het tempo niet.</strong> Bij Lezen kun je een moeilijke zin drie keer bekijken. Bij audio loopt het door.</li>
  <li><strong>Het is weg.</strong> Een gesprek gaat voorbij. Mis je een getal, dan kun je niet even terugbladeren.</li>
</ol>

<p>Daarom is één specifieke voorbereiding zo belangrijk: <strong>oefen alsof je elk fragment maar één keer hoort</strong>. Als je thuis steeds terugspoelt, oefen je iets anders dan het examen.</p>

<h2 id="situaties">Welke situaties je hoort</h2>

<p>Het gaat om gewoon Nederlands uit het dagelijks leven:</p>

<ul>
  <li>een gesprek bij de huisarts of in het ziekenhuis;</li>
  <li>een mededeling op het station of in een winkel;</li>
  <li>een collega of leidinggevende die iets vraagt;</li>
  <li>een telefoontje van de school van je kind;</li>
  <li>iemand die de weg uitlegt of een afspraak maakt.</li>
</ul>

<p>Dat is eigenlijk goed nieuws. Er komen geen nieuwsuitzendingen over politiek voorbij. Het is het Nederlands dat je elke dag om je heen hoort — en dat kun je overal oefenen.</p>

<h2 id="vraagtypes">Welke soorten vragen je krijgt</h2>

<p>De vragen bij Luisteren vallen grofweg in een paar types uiteen. Weet je welk type je krijgt, dan weet je waar je op moet letten voordat de audio begint.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Soort vraag</th><th>Wat men vraagt</th><th>Waar je op let</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Detail</strong></td><td>een tijd, prijs, dag of huisnummer</td><td>cijfers — bijna altijd de kern</td></tr>
    <tr><td><strong>Hoofdpunt</strong></td><td>waar gaat dit gesprek over?</td><td>de eerste zinnen</td></tr>
    <tr><td><strong>Reden</strong></td><td>waarom gebeurt er iets?</td><td>"omdat", "want", "daarom"</td></tr>
    <tr><td><strong>Wat moet u doen</strong></td><td>welke actie wordt gevraagd</td><td>"bel", "kom", "neem", "stuur"</td></tr>
    <tr><td><strong>Gevoel of mening</strong></td><td>hoe reageert iemand?</td><td>de toon en woorden als "helaas", "gelukkig"</td></tr>
  </tbody>
</table>
</div>

<p>Let op één valkuil bij het type "detail": in een gesprek worden vaak <strong>twee getallen</strong> genoemd. Een oude afspraak en een nieuwe. Een prijs met en zonder korting. De vraag gaat bijna altijd over het tweede.</p>

<h2 id="strategie">De strategie: lees vooruit</h2>

<p>Bij Luisteren gebeurt het belangrijkste werk <strong>voordat</strong> de audio begint.</p>

<ol>
  <li><strong>Lees de vraag terwijl je nog kunt.</strong> Weet vóór het fragment waar je op moet letten.</li>
  <li><strong>Bepaal wat voor informatie je zoekt.</strong> Een tijd? Een prijs? Een naam? Een reden?</li>
  <li><strong>Luister gericht.</strong> Je hoeft niet alles te begrijpen, alleen dat ene stukje.</li>
  <li><strong>Mis je het? Kies iets en ga door.</strong> Blijf niet piekeren, want dan mis je het volgende fragment ook.</li>
</ol>

<div class="info-box info-box-green">
  <p><strong>Getallen zijn bijna altijd de vraag.</strong> Tijden, prijzen, huisnummers, dagen. Train specifiek op cijfers in het Nederlands — "veertien uur twintig", "half drie", "twee euro vijftig". Veel mensen kennen de woorden wel, maar hebben ze nooit snel genoeg gehoord.</p>
</div>

<h2 id="voorbeeld">Probeer een vraag</h2>

<p>Stel je voor dat je dit hoort. Eén keer.</p>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">Je hoort bij de tandarts: "Uw afspraak van donderdag half elf kan helaas niet doorgaan. Kunt u vrijdag om kwart over negen? Anders is de eerstvolgende mogelijkheid maandag." Wanneer is de nieuwe afspraak die de tandarts voorstelt?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Donderdag om 10.30 uur</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>Vrijdag om 9.15 uur</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>Maandag om 9.15 uur</span></button>
  </div>
  <div class="blog-quiz-ans">Het juiste antwoord is <strong>B</strong>. "Kwart over negen" is 9.15 uur, en dat is op vrijdag. Donderdag half elf (10.30) was de <em>oude</em> afspraak, en maandag is alleen een alternatief als vrijdag niet kan. Zie je hoeveel informatie in twee zinnen zit? Daarom lees je de vraag vooraf.</div>
</div>

<h2 id="alles-begrijpen">De grootste fout: alles willen begrijpen</h2>

<p>Dit is de fout die ik het vaakst zie, en hij kost de meeste punten.</p>

<p>Er valt een woord dat je niet kent. Je gaat erover nadenken. Wat betekende dat? Terwijl je nadenkt, praat de audio door. Je mist de volgende twee zinnen — en dáár stond het antwoord.</p>

<p>Eén onbekend woord kost je zo drie zinnen. Het is bijna altijd beter om een woord te laten gaan en te blijven luisteren.</p>

<div class="info-box info-box-green">
  <p><strong>Oefen dit apart.</strong> Luister naar iets wat net te moeilijk voor je is en spreek met jezelf af: ik stop niet, ik spoel niet terug, ik zoek niets op. Alleen doorluisteren. Dat voelt onprettig, en het is precies de vaardigheid die het examen test.</p>
</div>

<p>Denk eraan: je hoeft niet alle antwoorden goed te hebben om te slagen. Dat staat letterlijk in de samenvatting van het examenreglement van DUO. Perfect begrijpen is niet het doel.</p>

<h2 id="oefenen-thuis">Hoe je thuis oefent</h2>

<p>Luisteren is het onderdeel dat je het makkelijkst in je dagelijks leven kunt trainen. Een paar dingen die werken:</p>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>Nederlandse tv met Nederlandse ondertiteling.</strong> Niet met ondertiteling in je eigen taal — dan lees je en luister je niet.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>Radio in de auto of tijdens het koken.</strong> Je hoeft het niet allemaal te begrijpen. Je oor raakt gewend aan het tempo.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>Oefen zonder terugspoelen.</strong> Eén keer horen, dan antwoorden. Zo werkt het examen ook.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>Train cijfers apart.</strong> Laat iemand tijden en prijzen opnoemen, of gebruik oefenmateriaal met veel getallen.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>Gebruik een koptelefoon.</strong> Op het examen doe je dat ook. Oefen in dezelfde omstandigheden.</p></div></div>

<h2 id="examendag">Op de examendag</h2>

<p>Bij Luisteren is één ding belangrijker dan bij de andere onderdelen: <strong>je geluid</strong>. In de oefenexamens van DUO kun je vooraf je audiovolume testen. Doe dat rustig, en zet het volume iets hoger dan je normaal zou doen.</p>

${fact('Je moet 30 minuten voor het examen aanwezig zijn. Je krijgt 15 minuten uitleg voordat het examen begint. Zonder geldig legitimatiebewijs mag je geen examen doen.', 'DUO Examenreglement', SRC_REGLEMENT)}

<p>Die 15 minuten uitleg zijn extra; ze gaan niet van je 45 minuten af. Verder geldt hetzelfde als bij de andere onderdelen: telefoon en tas in een kluisje, wc alleen met begeleiding, en het examen is geheim — geen foto's, geen vragen overschrijven.</p>

<p>DUO adviseert om oefenexamens op een computer te doen in plaats van op een telefoon. Voor Luisteren geldt dat extra: op een klein scherm zie je de vraag en de antwoorden niet in één oogopslag, en dan kun je niet vooruitlezen.</p>

<h2 id="slagen">Hoeveel moet je goed hebben?</h2>

<p>Zoals bij alle onderdelen: <strong>DUO maakt de grens niet bekend</strong>. Online lees je "18 van de 25", maar dat getal komt niet van DUO, en sites spreken elkaar tegen.</p>

${fact('"De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister." Je krijgt een cijfer per onderdeel en de uitslag geslaagd of niet geslaagd.', 'DUO Examenreglement, artikel 10 en 16', SRC_REGLEMENT)}

<p>Je uitslag komt binnen 8 weken per brief. Ben je gezakt voor Luisteren? Dan doe je <strong>alleen dat onderdeel</strong> opnieuw. Wat je hebt gehaald, blijft staan. Meer daarover in <a href="/nl/blog/inburgeringsexamen-zakken-herkansen">het artikel over zakken en herkansen</a>.</p>

<p>DUO heeft <strong>3 gratis oefenexamens Luisteren</strong>. Doe ze — het is het echte format. Daarna heb je meer nodig, en daarvoor hebben wij er 10, met echte audio en uitleg per vraag. Alles ingesproken en gecontroleerd door een gecertificeerde NT2-docent.</p>

<p>Lees ook <a href="/nl/blog/inburgeringsexamen-a2-uitleg">de uitleg over alle vier de onderdelen</a>, of <a href="/nl/oefenen">begin direct met een gratis oefenexamen</a>.</p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Luisteren A2 in cijfers</h3>
  <table class="facts-table">
    <tr><td>Tijd</td><td>45 min</td></tr>
    <tr><td>Vragen (oefenexamen)</td><td>25</td></tr>
    <tr><td>Per vraag</td><td>±1,8 min</td></tr>
    <tr><td>Terugspoelen</td><td>nee</td></tr>
    <tr><td>Nakijken</td><td>automatisch</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'inburgeringsexamen-a2-uitleg', title: 'Alle vier de onderdelen', desc: 'Lezen, Luisteren, Schrijven en Spreken uitgelegd' },
      { slug: 'lezen-examen-inburgering-a2', title: 'Het examen Lezen A2', desc: '25 vragen in 65 minuten' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
    ],
    ctaTitle: 'Oefen Luisteren met echte audio',
    ctaDesc: 'DUO geeft je 3 oefenexamens Luisteren. Wij geven je 10 — met uitleg per vraag.',
    ctaHref: '/oefenen',
    ctaLabel: 'Start gratis oefenexamen',
    translations: {
      en: {
        heroTitle: 'Listening exam A2 (Luisteren): format and tips',
        description: 'The A2 Listening exam takes 45 minutes and you cannot rewind. Here is the format and how to avoid the mistakes that cost most people marks.',
        category: 'Tips & Preparation',
        breadcrumb: 'Listening exam A2',
        dateLabel: '20 July 2026',
        imageAlt: 'Student practising with headphones for the Listening part of the A2 integration exam',
        relatedPosts: [
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'All four parts', desc: 'Reading, Listening, Writing and Speaking explained' },
          { slug: 'lezen-examen-inburgering-a2', title: 'The Reading exam A2', desc: '25 questions in 65 minutes' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
        ],
        heroSubtitle: 'The same number of questions as Reading, 20 minutes less time — and you cannot replay a fragment.',
        ctaTitle: 'Practise Listening with real audio',
        ctaDesc: 'DUO gives you 3 Listening practice exams. We give you 10 — with an explanation for every question.',
        ctaLabel: 'Start a free practice exam',
        faq: [
          { q: 'How long does the A2 Listening exam take?', a: '45 minutes, on a computer. You also get 15 minutes of explanation before the exam starts, on top of the exam time.' },
          { q: 'How many questions are in the Listening exam?', a: 'In DUO’s three official practice exams there are 25 questions — the same as Reading, but with 20 minutes less time. DUO publishes no official count for the real exam.' },
          { q: 'Can you replay a fragment?', a: 'Do not count on it. Audio passes and, unlike a text, you cannot look again. So always practise as though you hear each fragment once.' },
          { q: 'What situations do you hear?', a: 'Everyday ones: a conversation at the doctor, an announcement at the station, a colleague asking something, a phone call from school. DUO says you answer questions about short videos and listen to texts.' },
          { q: 'Why is Listening harder than Reading?', a: 'Three reasons: less time per question, you do not control the pace, and you cannot go back. With a text you can reread a difficult sentence three times. With audio it is gone.' },
          { q: 'Can you take notes during the Listening exam?', a: 'You cannot use your own belongings — under the exam regulations they go in a locker. Ask at the exam location what is allowed; the key rules are also in your call-up letter.' },
          { q: 'How is the Listening exam marked?', a: 'Automatically. Under article 10 of the exam regulations, Listening, Reading and KNM are machine-marked. No human reviews your answers.' },
        ],
        articleHtml: `
<p>The <strong>A2 Listening exam</strong> (Luisteren) takes <strong>45 minutes</strong> on a computer. You watch short videos, listen to texts and answer questions about them. In DUO’s official practice exams that means 25 questions, marked automatically.</p>

<p>On paper Listening looks like Reading: same number of questions, same everyday subjects. In practice it is the part people most often underestimate. Here is why, and what to do about it.</p>

<div class="article-toc">
  <p class="article-toc-title">In this article</p>
  <ol>
    <li><a href="#format">The format: 45 minutes</a></li>
    <li><a href="#why-harder">Why Listening is harder than Reading</a></li>
    <li><a href="#situations">Which situations you hear</a></li>
    <li><a href="#question-types">The types of question</a></li>
    <li><a href="#strategy">The strategy: read ahead</a></li>
    <li><a href="#example">Try a question</a></li>
    <li><a href="#understand-everything">The biggest mistake</a></li>
    <li><a href="#practise">How to practise at home</a></li>
  </ol>
</div>

<h2 id="format">The format: 45 minutes</h2>

${factEn('The A2 Listening exam takes 45 minutes and is taken on a computer.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<p>DUO does not publish the question count, but the start screen of all three official A2 Listening practice exams states "U moet in dit examen 25 vragen beantwoorden".</p>

${factEn('All three official DUO A2 Listening practice exams contain 25 questions and last 45 minutes.', 'inburgeren.nl — practice exams', SRC_OEFENEN)}

<h2 id="why-harder">Why Listening is harder than Reading</h2>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>Reading</th><th>Listening</th></tr>
  </thead>
  <tbody>
    <tr><td>Questions (practice)</td><td>25</td><td>25</td></tr>
    <tr><td>Time</td><td>65 min</td><td><strong>45 min</strong></td></tr>
    <tr><td>Per question</td><td>±2.5 min</td><td><strong>±1.8 min</strong></td></tr>
    <tr><td>Can you go back?</td><td>yes</td><td><strong>no</strong></td></tr>
    <tr><td>Who sets the pace?</td><td>you</td><td><strong>the exam</strong></td></tr>
  </tbody>
</table>
</div>

<p>Three things make the difference: nearly a minute less per question, no control over the pace, and no way back. Miss a number and you cannot flip back a page.</p>

<p>Which is why one specific habit matters most: <strong>practise as if you hear every fragment only once</strong>. If you rewind at home, you are training something the exam will not give you.</p>

<h2 id="situations">Which situations you hear</h2>

<ul>
  <li>a conversation at the doctor or hospital;</li>
  <li>an announcement at a station or in a shop;</li>
  <li>a colleague or manager asking something;</li>
  <li>a phone call from your child’s school;</li>
  <li>someone giving directions or making an appointment.</li>
</ul>

<p>That is genuinely good news. No political broadcasts. It is the Dutch you already hear around you every day — and you can practise it anywhere.</p>

<h2 id="question-types">The types of question</h2>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Type</th><th>What is asked</th><th>What to listen for</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Detail</strong></td><td>a time, price, day or number</td><td>digits — almost always the point</td></tr>
    <tr><td><strong>Main point</strong></td><td>what is this about?</td><td>the opening sentences</td></tr>
    <tr><td><strong>Reason</strong></td><td>why does something happen?</td><td>"omdat", "want", "daarom"</td></tr>
    <tr><td><strong>Required action</strong></td><td>what should you do?</td><td>"bel", "kom", "neem", "stuur"</td></tr>
    <tr><td><strong>Attitude</strong></td><td>how does someone react?</td><td>tone, and words like "helaas"</td></tr>
  </tbody>
</table>
</div>

<p>One trap with detail questions: conversations often mention <strong>two numbers</strong> — an old appointment and a new one, a price with and without discount. The question is almost always about the second.</p>

<h2 id="strategy">The strategy: read ahead</h2>

<p>With Listening, the important work happens <strong>before</strong> the audio starts.</p>

<ol>
  <li><strong>Read the question while you still can.</strong> Know what to listen for.</li>
  <li><strong>Decide what kind of information you need.</strong> A time? A price? A name?</li>
  <li><strong>Listen for that.</strong> You do not need the rest.</li>
  <li><strong>Missed it? Choose and move on.</strong> Dwelling costs you the next fragment too.</li>
</ol>

<div class="info-box info-box-green">
  <p><strong>Numbers are usually the question.</strong> Train Dutch numerals specifically — "veertien uur twintig", "half drie", "twee euro vijftig". Many people know the words but have never had to catch them at speed.</p>
</div>

<h2 id="example">Try a question</h2>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">At the dentist you hear: "Uw afspraak van donderdag half elf kan helaas niet doorgaan. Kunt u vrijdag om kwart over negen? Anders is de eerstvolgende mogelijkheid maandag." Which new appointment is the dentist proposing?</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>Thursday at 10.30</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>Friday at 9.15</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>Monday at 9.15</span></button>
  </div>
  <div class="blog-quiz-ans">The correct answer is <strong>B</strong>. "Kwart over negen" is 9.15, and that is on Friday. Thursday half elf (10.30) was the <em>old</em> appointment, and Monday is only a fallback. Note how much information sits in two sentences — which is exactly why you read the question first.</div>
</div>

<h2 id="understand-everything">The biggest mistake: trying to understand everything</h2>

<p>A word comes up that you do not know. You start thinking about it. While you think, the audio continues — and you miss the next two sentences, where the answer was.</p>

<p>One unknown word costs you three sentences. It is almost always better to let the word go and keep listening.</p>

<div class="info-box info-box-green">
  <p><strong>Train this deliberately.</strong> Listen to something slightly too hard and agree with yourself: no stopping, no rewinding, no looking anything up. Just keep listening. It feels uncomfortable, and it is precisely the skill being tested.</p>
</div>

<p>Remember: you do not need every answer right to pass. That is stated in DUO’s own plain-language summary of the exam regulations.</p>

<h2 id="practise">How to practise at home</h2>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>Dutch TV with Dutch subtitles.</strong> Not subtitles in your own language — then you are reading, not listening.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>Radio while cooking or driving.</strong> You need not understand it all; your ear adjusts to the speed.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>Practise without rewinding.</strong> Hear it once, then answer — as the exam works.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>Drill numbers separately.</strong> Have someone read out times and prices.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>Use a headset.</strong> You will on the exam. Practise in the same conditions.</p></div></div>

${factEn('You must be present 30 minutes before the exam. You get 15 minutes of explanation before it starts. Without valid ID you may not sit the exam.', 'DUO exam regulations', SRC_REGLEMENT)}

<p>As with every part, DUO does not publish how much you need correct: the pass mark is a cesuur set by the Minister. If you fail Listening, you retake <strong>only</strong> that part — see <a href="/en/blog/failing-and-retaking-the-integration-exam">failing and retaking</a>.</p>

<p>DUO has <strong>3 free Listening practice exams</strong>. Do them, then get more volume: we have 10, with real audio and an explanation per question, recorded and checked by a certified NT2 teacher.</p>

<p>Read on: <a href="/en/blog/a2-integration-exam-explained">all four parts explained</a>, or <a href="/en/practice">start a free practice exam</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Listening A2 in numbers</h3>
  <table class="facts-table">
    <tr><td>Time</td><td>45 min</td></tr>
    <tr><td>Questions (practice)</td><td>25</td></tr>
    <tr><td>Per question</td><td>±1.8 min</td></tr>
    <tr><td>Rewind</td><td>no</td></tr>
    <tr><td>Marking</td><td>automated</td></tr>
  </table>
</div>`,
      },
      ar: {
        heroTitle: 'امتحان الاستماع A2 (Luisteren): الشكل والنصائح',
        description: 'امتحان الاستماع A2 مدته 45 دقيقة ولا يمكنك إعادة التشغيل. إليك شكله وكيف تتجنّب الأخطاء التي تكلّف معظم الناس درجاتهم.',
        category: 'نصائح وتحضير',
        breadcrumb: 'امتحان الاستماع A2',
        dateLabel: '20 يوليو 2026',
        imageAlt: 'دارس يتدرّب بسماعات رأس على جزء الاستماع من امتحان الاندماج A2',
        relatedPosts: [
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'الأجزاء الأربعة كلها', desc: 'شرح القراءة والاستماع والكتابة والتحدث' },
          { slug: 'lezen-examen-inburgering-a2', title: 'امتحان القراءة A2', desc: '25 سؤالاً في 65 دقيقة' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
        ],
        heroSubtitle: 'نفس عدد أسئلة القراءة، ووقت أقل بـ20 دقيقة — ولا يمكنك إعادة تشغيل المقطع.',
        ctaTitle: 'تدرّب على الاستماع بمقاطع صوتية حقيقية',
        ctaDesc: 'تمنحك DUO 3 امتحانات تجريبية للاستماع. ونحن نمنحك 10 — مع شرح بعد كل سؤال.',
        ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
        faq: [
          { q: 'كم يستغرق امتحان الاستماع A2؟', a: '45 دقيقة، على حاسوب. كما تحصل على 15 دقيقة من الشرح قبل بدء الامتحان، فوق وقت الامتحان.' },
          { q: 'كم عدد الأسئلة في امتحان الاستماع؟', a: 'في الامتحانات التجريبية الرسمية الثلاثة من DUO يوجد 25 سؤالاً — مثل القراءة، لكن بوقت أقل بـ20 دقيقة. ولا تنشر DUO عددًا رسميًا للامتحان الحقيقي.' },
          { q: 'هل يمكن إعادة تشغيل المقطع؟', a: 'لا تعتمد على ذلك. فالصوت يمر، وخلافًا للنص لا يمكنك النظر مرة أخرى. لذا تدرّب دائمًا وكأنك تسمع كل مقطع مرة واحدة.' },
          { q: 'ما المواقف التي تسمعها؟', a: 'مواقف يومية: حديث عند الطبيب، أو إعلان في المحطة، أو زميل يسأل شيئًا، أو مكالمة هاتفية من المدرسة. وتقول DUO إنك تجيب عن أسئلة حول مقاطع فيديو قصيرة وتستمع إلى نصوص.' },
          { q: 'لماذا الاستماع أصعب من القراءة؟', a: 'لثلاثة أسباب: وقت أقل لكل سؤال، وأنت لا تتحكم في السرعة، ولا يمكنك العودة إلى الوراء. فمع النص يمكنك إعادة قراءة جملة صعبة ثلاث مرات. أما مع الصوت فقد ذهبت.' },
          { q: 'هل يمكن تدوين ملاحظات أثناء امتحان الاستماع؟', a: 'لا يمكنك استخدام أغراضك الخاصة — فبموجب لائحة الامتحانات تُوضع في خزانة. اسأل في مركز الامتحان عمّا هو مسموح؛ والقواعد الأساسية موجودة أيضًا في رسالة الاستدعاء.' },
          { q: 'كيف يُصحَّح امتحان الاستماع؟', a: 'آليًا. فبموجب المادة 10 من لائحة الامتحانات تُصحَّح أجزاء الاستماع والقراءة وKNM آليًا. ولا يراجع إجاباتك إنسان.' },
        ],
        articleHtml: `
<p><strong>امتحان الاستماع A2</strong> (Luisteren) مدته <strong>45 دقيقة</strong> على حاسوب. تشاهد مقاطع فيديو قصيرة، وتستمع إلى نصوص، وتجيب عن أسئلة عنها. وفي الامتحانات التجريبية الرسمية من DUO يعني ذلك 25 سؤالاً، تُصحَّح آليًا.</p>

<p>على الورق يبدو الاستماع مثل القراءة: العدد نفسه من الأسئلة، والمواضيع اليومية نفسها. أما عمليًا فهو الجزء الذي يُستهان به أكثر من غيره. إليك السبب، وما العمل حياله.</p>

<div class="article-toc">
  <p class="article-toc-title">في هذا المقال</p>
  <ol>
    <li><a href="#format">الشكل: 45 دقيقة</a></li>
    <li><a href="#why-harder">لماذا الاستماع أصعب من القراءة</a></li>
    <li><a href="#situations">أي مواقف تسمعها</a></li>
    <li><a href="#question-types">أنواع الأسئلة</a></li>
    <li><a href="#strategy">الاستراتيجية: اقرأ مسبقًا</a></li>
    <li><a href="#example">جرّب سؤالاً</a></li>
    <li><a href="#understand-everything">الخطأ الأكبر</a></li>
    <li><a href="#practise">كيف تتدرّب في البيت</a></li>
  </ol>
</div>

<h2 id="format">الشكل: 45 دقيقة</h2>

${factAr('امتحان الاستماع A2 مدته 45 دقيقة ويُؤدى على حاسوب.', 'inburgeren.nl — محتوى امتحانات اللغة', SRC_INHOUD)}

<p>لا تنشر DUO عدد الأسئلة، لكن شاشة البدء في الامتحانات التجريبية الرسمية الثلاثة للاستماع A2 تنص على «U moet in dit examen 25 vragen beantwoorden».</p>

${factAr('تحتوي الامتحانات التجريبية الرسمية الثلاثة للاستماع A2 من DUO على 25 سؤالاً ومدتها 45 دقيقة.', 'inburgeren.nl — الامتحانات التجريبية', SRC_OEFENEN)}

<h2 id="why-harder">لماذا الاستماع أصعب من القراءة</h2>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>القراءة</th><th>الاستماع</th></tr>
  </thead>
  <tbody>
    <tr><td>الأسئلة (تجريبي)</td><td>25</td><td>25</td></tr>
    <tr><td>الوقت</td><td>65 دقيقة</td><td><strong>45 دقيقة</strong></td></tr>
    <tr><td>لكل سؤال</td><td>±2.5 دقيقة</td><td><strong>±1.8 دقيقة</strong></td></tr>
    <tr><td>هل يمكن العودة؟</td><td>نعم</td><td><strong>لا</strong></td></tr>
    <tr><td>من يحدد السرعة؟</td><td>أنت</td><td><strong>الامتحان</strong></td></tr>
  </tbody>
</table>
</div>

<p>ثلاثة أمور تصنع الفرق: وقت أقل بنحو دقيقة لكل سؤال، ولا تحكّم في السرعة، ولا طريق للعودة. فإن فاتك رقم لا تستطيع أن تقلب صفحة إلى الوراء.</p>

<p>ولهذا فإن عادة واحدة بعينها هي الأهم: <strong>تدرّب وكأنك تسمع كل مقطع مرة واحدة فقط</strong>. فإن أعدت التشغيل في البيت، فأنت تدرّب نفسك على شيء لن يمنحك الامتحان إياه.</p>

<h2 id="situations">أي مواقف تسمعها</h2>

<ul>
  <li>حديث عند الطبيب أو في المستشفى؛</li>
  <li>إعلان في محطة أو في متجر؛</li>
  <li>زميل أو مدير يسأل شيئًا؛</li>
  <li>مكالمة هاتفية من مدرسة طفلك؛</li>
  <li>شخص يرشدك إلى الطريق أو يحجز موعدًا.</li>
</ul>

<p>وهذا خبر جيد فعلاً. لا نشرات سياسية. إنها الهولندية التي تسمعها من حولك كل يوم — ويمكنك التدرّب عليها في أي مكان.</p>

<h2 id="question-types">أنواع الأسئلة</h2>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>النوع</th><th>ما المطلوب</th><th>إلى ماذا تستمع</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>تفصيل</strong></td><td>وقت أو سعر أو يوم أو رقم</td><td>الأرقام — وهي المقصودة دائمًا تقريبًا</td></tr>
    <tr><td><strong>الفكرة الأساسية</strong></td><td>عمّ يدور هذا؟</td><td>الجمل الافتتاحية</td></tr>
    <tr><td><strong>السبب</strong></td><td>لماذا يحدث شيء ما؟</td><td>«omdat» و«want» و«daarom»</td></tr>
    <tr><td><strong>الإجراء المطلوب</strong></td><td>ماذا عليك أن تفعل؟</td><td>«bel» و«kom» و«neem» و«stuur»</td></tr>
    <tr><td><strong>الموقف</strong></td><td>كيف يتفاعل شخص ما؟</td><td>نبرة الصوت، وكلمات مثل «helaas»</td></tr>
  </tbody>
</table>
</div>

<p>وهناك فخّ في أسئلة التفصيل: كثيرًا ما تذكر المحادثات <strong>رقمين</strong> — موعدًا قديمًا وآخر جديدًا، أو سعرًا بخصم وبدونه. والسؤال يدور دائمًا تقريبًا حول الثاني.</p>

<h2 id="strategy">الاستراتيجية: اقرأ مسبقًا</h2>

<p>في الاستماع، يحدث العمل المهم <strong>قبل</strong> أن يبدأ الصوت.</p>

<ol>
  <li><strong>اقرأ السؤال ما دمت تستطيع.</strong> اعرف إلى ماذا ستستمع.</li>
  <li><strong>حدّد نوع المعلومة التي تحتاجها.</strong> وقت؟ سعر؟ اسم؟</li>
  <li><strong>استمع بحثًا عنها.</strong> لست بحاجة إلى الباقي.</li>
  <li><strong>فاتتك؟ اختر وانتقل.</strong> فالتوقف عندها يكلّفك المقطع التالي أيضًا.</li>
</ol>

<div class="info-box info-box-green">
  <p><strong>الأرقام هي السؤال عادةً.</strong> درّب نفسك على الأعداد الهولندية تحديدًا — «veertien uur twintig» و«half drie» و«twee euro vijftig». كثيرون يعرفون الكلمات لكنهم لم يضطروا قط إلى التقاطها بسرعة.</p>
</div>

<h2 id="example">جرّب سؤالاً</h2>

<div class="blog-quiz-card">
  <p class="blog-quiz-q">عند طبيب الأسنان تسمع: «Uw afspraak van donderdag half elf kan helaas niet doorgaan. Kunt u vrijdag om kwart over negen? Anders is de eerstvolgende mogelijkheid maandag.» أي موعد جديد يقترحه طبيب الأسنان؟</p>
  <div class="blog-quiz-opts">
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">A</span><span>الخميس الساعة 10:30</span></button>
    <button type="button" class="blog-quiz-opt" data-answer="correct"><span class="blog-quiz-letter">B</span><span>الجمعة الساعة 9:15</span></button>
    <button type="button" class="blog-quiz-opt"><span class="blog-quiz-letter">C</span><span>الاثنين الساعة 9:15</span></button>
  </div>
  <div class="blog-quiz-ans">الإجابة الصحيحة هي <strong>B</strong>. فـ«kwart over negen» تعني 9:15، وهي يوم الجمعة. أما الخميس «half elf» (10:30) فكان الموعد <em>القديم</em>، والاثنين مجرد بديل احتياطي. لاحظ كم من المعلومات تحملها جملتان — وهذا بالضبط سبب قراءتك للسؤال أولاً.</div>
</div>

<h2 id="understand-everything">الخطأ الأكبر: محاولة فهم كل شيء</h2>

<p>تظهر كلمة لا تعرفها. فتبدأ بالتفكير فيها. وبينما تفكر يستمر الصوت — فتفوتك الجملتان التاليتان، حيث كانت الإجابة.</p>

<p>كلمة واحدة مجهولة تكلّفك ثلاث جمل. ومن الأفضل دائمًا تقريبًا أن تترك الكلمة وتواصل الاستماع.</p>

<div class="info-box info-box-green">
  <p><strong>درّب نفسك على هذا عمدًا.</strong> استمع إلى شيء أصعب قليلًا مما تحتمل واتفق مع نفسك: لا توقّف، ولا إعادة تشغيل، ولا بحث عن أي شيء. واصل الاستماع فقط. سيبدو الأمر غير مريح، وهو بالضبط المهارة التي يجري اختبارها.</p>
</div>

<p>وتذكّر: لست بحاجة إلى أن تكون كل إجاباتك صحيحة لتنجح. وهذا مذكور في ملخص DUO المبسّط للائحة الامتحانات.</p>

<h2 id="practise">كيف تتدرّب في البيت</h2>

<div class="tip-card"><div class="tip-number">1</div><div><p><strong>تلفزيون هولندي بترجمة هولندية.</strong> لا بترجمة إلى لغتك — فعندها تكون تقرأ لا تستمع.</p></div></div>
<div class="tip-card"><div class="tip-number">2</div><div><p><strong>الراديو أثناء الطبخ أو القيادة.</strong> لا حاجة لأن تفهم كل شيء؛ فأذنك تتأقلم مع السرعة.</p></div></div>
<div class="tip-card"><div class="tip-number">3</div><div><p><strong>تدرّب بدون إعادة تشغيل.</strong> اسمعه مرة واحدة ثم أجب — كما يعمل الامتحان.</p></div></div>
<div class="tip-card"><div class="tip-number">4</div><div><p><strong>درّب الأرقام على حدة.</strong> اطلب من أحدهم أن يقرأ عليك أوقاتًا وأسعارًا.</p></div></div>
<div class="tip-card"><div class="tip-number">5</div><div><p><strong>استخدم سماعة رأس.</strong> ستستخدمها في الامتحان. فتدرّب في الظروف نفسها.</p></div></div>

${factAr('عليك الحضور قبل الامتحان بـ30 دقيقة. وتحصل على 15 دقيقة من الشرح قبل بدئه. وبدون هوية سارية لا يُسمح لك بأداء الامتحان.', 'لائحة امتحانات DUO', SRC_REGLEMENT)}

<p>كما في كل جزء، لا تنشر DUO كم تحتاج من الإجابات الصحيحة: فحدّ النجاح عتبة يحددها الوزير. وإن رسبت في الاستماع فإنك تعيد <strong>هذا الجزء وحده</strong> — انظر <a href="/ar/المدونة/الرسوب-وإعادة-امتحان-الاندماج">الرسوب وإعادة الامتحان</a>.</p>

<p>لدى DUO <strong>3 امتحانات تجريبية مجانية للاستماع</strong>. أدِّها، ثم احصل على كمّ أكبر: لدينا 10، بمقاطع صوتية حقيقية وشرح بعد كل سؤال، سجّلها وراجعها مدرّس NT2 معتمد.</p>

<p>تابع القراءة: <a href="/ar/المدونة/شرح-امتحان-الاندماج-a2">شرح الأجزاء الأربعة</a>، أو <a href="/ar/تدرب">ابدأ امتحانًا تجريبيًا مجانيًا</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">الاستماع A2 بالأرقام</h3>
  <table class="facts-table">
    <tr><td>الوقت</td><td>45 دقيقة</td></tr>
    <tr><td>الأسئلة (تجريبي)</td><td>25</td></tr>
    <tr><td>لكل سؤال</td><td>±1.8 دقيقة</td></tr>
    <tr><td>إعادة التشغيل</td><td>لا</td></tr>
    <tr><td>التصحيح</td><td>آلي</td></tr>
  </table>
</div>`,
      },
    },
  },

  // ───────────────────────────────────────────────────────────── 4. ZAKKEN / HERKANSEN
  {
    slug: 'inburgeringsexamen-zakken-herkansen',
    title: 'Gezakt voor het inburgeringsexamen? Dit gebeurt er nu',
    description: 'Gezakt voor een onderdeel van het inburgeringsexamen? Je doet alleen dat onderdeel opnieuw. Zo werkt herkansen, wat het kost en wanneer je uitslag komt.',
    category: 'Gids & Informatie',
    categoryKey: 'gids',
    categoryColor: 'blue',
    datePublished: '2026-07-25',
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

<h2 id="uitslag">Je uitslag: wat staat er precies?</h2>

<p>Je uitslag komt <strong>binnen 8 weken</strong> na het examen, per brief. Hij staat ook in Mijn Inburgering.</p>

${fact('"De uitslag wordt schriftelijk, binnen 8 weken na het examen, aan de kandidaat kenbaar gemaakt. De uitslag wordt ook weergegeven in Mijn Inburgering."', 'DUO Examenreglement, artikel 16 lid 3', SRC_REGLEMENT)}

<p>In de brief staat "geslaagd" of "niet geslaagd", plus een <strong>cijfer per onderdeel</strong>. Wat er niet in staat, is welke vragen je fout had. En je kunt je examen ook niet opvragen:</p>

${fact('"Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat."', 'DUO Examenreglement, artikel 14 lid 3', SRC_REGLEMENT)}

<p>Dat voelt onrechtvaardig, en ik begrijp dat. Maar het heeft een praktisch gevolg voor jou: <strong>je moet zelf uitzoeken waar het misging</strong>. Het cijfer vertelt je hoe dicht je erbij zat, niet waarom.</p>

<p>En hoeveel je goed had moeten hebben? Dat maakt DUO niet bekend. De grens is een cesuur die de minister vaststelt en die niet wordt gepubliceerd. De getallen die je online vindt — "18 van de 25", "500 punten" — komen niet van DUO en spreken elkaar tegen. Meer daarover in <a href="/nl/blog/inburgeringsexamen-a2-uitleg">de uitleg over de vier onderdelen</a>.</p>

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

<p>Klaar voor de volgende poging? <a href="/nl/oefenen">Doe eerst een gratis oefenexamen</a> en kijk waar je nu staat. Lees ook het artikel over <a href="/nl/blog/lezen-examen-inburgering-a2">het examen Lezen</a> of <a href="/nl/blog/luisteren-examen-inburgering-a2">het examen Luisteren</a>, afhankelijk van welk onderdeel je opnieuw doet.</p>
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
      { slug: 'inburgeringsexamen-a2-uitleg', title: 'Alle vier de onderdelen', desc: 'Lezen, Luisteren, Schrijven en Spreken uitgelegd' },
      { slug: 'lezen-examen-inburgering-a2', title: 'Het examen Lezen A2', desc: '25 vragen in 65 minuten' },
      { slug: 'luisteren-examen-inburgering-a2', title: 'Het examen Luisteren A2', desc: 'Het onderdeel dat het meest wordt onderschat' },
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
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'All four parts', desc: 'Reading, Listening, Writing and Speaking explained' },
          { slug: 'lezen-examen-inburgering-a2', title: 'The Reading exam A2', desc: '25 questions in 65 minutes' },
          { slug: 'luisteren-examen-inburgering-a2', title: 'The Listening exam A2', desc: 'The part that is most often underestimated' },
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

<h2 id="result">Your result: what does it say?</h2>

${factEn('"De uitslag wordt schriftelijk, binnen 8 weken na het examen, aan de kandidaat kenbaar gemaakt." — the result is sent in writing within 8 weeks, and also appears in Mijn Inburgering.', 'DUO exam regulations, article 16(3)', SRC_REGLEMENT)}

<p>The letter says "pass" or "fail" plus a <strong>grade per part</strong>. What it does not say is which questions you got wrong. And you cannot request your exam either:</p>

${factEn('"Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat." — a completed, marked exam cannot be reviewed by the candidate.', 'DUO exam regulations, article 14(3)', SRC_REGLEMENT)}

<p>That feels unfair, and I understand why. But it has a practical consequence: <strong>you have to work out for yourself where it went wrong</strong>. The grade tells you how close you were, not why.</p>

<p>And how much you needed correct? DUO does not publish it — the boundary is a cesuur set by the Minister. The figures you find online do not come from DUO and contradict each other. More on that in <a href="/en/blog/a2-integration-exam-explained">the explanation of the four parts</a>.</p>

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
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'الأجزاء الأربعة كلها', desc: 'شرح القراءة والاستماع والكتابة والتحدث' },
          { slug: 'lezen-examen-inburgering-a2', title: 'امتحان القراءة A2', desc: '25 سؤالاً في 65 دقيقة' },
          { slug: 'luisteren-examen-inburgering-a2', title: 'امتحان الاستماع A2', desc: 'الجزء الذي يُستهان به أكثر من غيره' },
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

<h2 id="result">نتيجتك: ماذا تقول؟</h2>

${factAr('«De uitslag wordt schriftelijk, binnen 8 weken na het examen, aan de kandidaat kenbaar gemaakt.» — تُبلَّغ النتيجة كتابةً خلال 8 أسابيع، وتظهر أيضًا في Mijn Inburgering.', 'لائحة امتحانات DUO، المادة 16 الفقرة 3', SRC_REGLEMENT)}

<p>تذكر الرسالة «ناجح» أو «راسب» إضافة إلى <strong>درجة لكل جزء</strong>. أما ما لا تذكره فهو الأسئلة التي أخطأت فيها. ولا يمكنك طلب امتحانك أيضًا:</p>

${factAr('«Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat.» — الامتحان بعد أدائه وتصحيحه لا يمكن أن يطّلع عليه الممتحَن.', 'لائحة امتحانات DUO، المادة 14 الفقرة 3', SRC_REGLEMENT)}

<p>يبدو ذلك غير منصف، وأنا أفهم السبب. لكن له نتيجة عملية: <strong>عليك أن تكتشف بنفسك أين كان الخلل</strong>. فالدرجة تخبرك كم كنت قريبًا، لا لماذا.</p>

<p>وكم كنت تحتاج من الإجابات الصحيحة؟ لا تنشر DUO ذلك — فالحدّ عتبة يحددها الوزير. والأرقام التي تجدها على الإنترنت ليست من DUO وهي متناقضة فيما بينها. المزيد عن ذلك في <a href="/ar/المدونة/شرح-امتحان-الاندماج-a2">شرح الأجزاء الأربعة</a>.</p>

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

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Leerroute</th><th>Niveau</th><th>Voor wie</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>B1-route</strong></td><td>B1</td><td>de standaardroute: taal en (vrijwilligers)werk, maximaal 3 jaar</td></tr>
    <tr><td><strong>Onderwijsroute</strong></td><td>B1 of hoger</td><td>vooral jongeren die naar mbo, hbo of universiteit willen</td></tr>
    <tr><td><strong>Zelfredzaamheidsroute</strong></td><td>A1</td><td>als B1 niet haalbaar is: taal en meedoen in de samenleving</td></tr>
  </tbody>
</table>
</div>

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

<p>Wil je weten waar je nu staat? <a href="/nl/oefenen">Doe een gratis oefenexamen op A2-niveau</a>. Lees ook <a href="/nl/blog/inburgeringsexamen-a2-uitleg">de uitleg over de vier onderdelen</a> als je wilt weten wat je per examen krijgt.</p>
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
      { slug: 'inburgeringsexamen-a2-uitleg', title: 'Alle vier de onderdelen', desc: 'Lezen, Luisteren, Schrijven en Spreken uitgelegd' },
      { slug: 'lezen-examen-inburgering-a2', title: 'Het examen Lezen A2', desc: '25 vragen in 65 minuten' },
      { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Gezakt? Dit gebeurt er nu', desc: 'Herkansen, kosten en je uitslag' },
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
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'All four parts', desc: 'Reading, Listening, Writing and Speaking explained' },
          { slug: 'lezen-examen-inburgering-a2', title: 'The Reading exam A2', desc: '25 questions in 65 minutes' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'Failed? Here is what happens now', desc: 'Retaking, costs and your result' },
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

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>Learning route</th><th>Level</th><th>For whom</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>B1 route</strong></td><td>B1</td><td>the standard route: language and (voluntary) work, maximum 3 years</td></tr>
    <tr><td><strong>Education route</strong></td><td>B1 or higher</td><td>mainly young people heading for further education</td></tr>
    <tr><td><strong>Self-reliance route</strong></td><td>A1</td><td>when B1 is not achievable: language and participation</td></tr>
  </tbody>
</table>
</div>

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

<p>Want to know where you stand? <a href="/en/practice">Take a free practice exam at A2 level</a>, or read <a href="/en/blog/a2-integration-exam-explained">the explanation of the four parts</a>.</p>
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
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'الأجزاء الأربعة كلها', desc: 'شرح القراءة والاستماع والكتابة والتحدث' },
          { slug: 'lezen-examen-inburgering-a2', title: 'امتحان القراءة A2', desc: '25 سؤالاً في 65 دقيقة' },
          { slug: 'inburgeringsexamen-zakken-herkansen', title: 'رسبت؟ إليك ما يحدث الآن', desc: 'إعادة الامتحان والتكاليف ونتيجتك' },
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

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th>مسار التعلّم</th><th>المستوى</th><th>لمن</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>مسار B1</strong></td><td>B1</td><td>المسار القياسي: اللغة والعمل (التطوعي)، بحد أقصى 3 سنوات</td></tr>
    <tr><td><strong>مسار التعليم</strong></td><td>B1 أو أعلى</td><td>بشكل أساسي للشباب المتجهين إلى مواصلة الدراسة</td></tr>
    <tr><td><strong>مسار الاعتماد على الذات</strong></td><td>A1</td><td>حين يكون B1 غير قابل للتحقيق: اللغة والمشاركة</td></tr>
  </tbody>
</table>
</div>

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

<p>هل تريد أن تعرف أين أنت؟ <a href="/ar/تدرب">قدّم امتحانًا تجريبيًا مجانيًا بمستوى A2</a>، أو اقرأ <a href="/ar/المدونة/شرح-امتحان-الاندماج-a2">شرح الأجزاء الأربعة</a>.</p>
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
    dateModified: '2026-09-16',
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

<h2 id="oefenen">Waar je dit oefent</h2>

<p>Deze punten leer je niet uit een grammaticaboek. Je leert ze door een hele opdracht te schrijven en daarna gericht terug te kijken — precies zoals op het examen, waar je alles tegelijk moet doen.</p>

<p>Op ons platform schrijf je echte examenopdrachten en krijg je feedback per beoordelingspunt, met modelantwoorden en een beoordelingslijst die door een gecertificeerde NT2-docent zijn geschreven. Niet door een AI. <a href="/nl/oefenexamen/a2/schrijven">Bekijk de oefenexamens Schrijven A2</a>.</p>

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
      { slug: 'inburgeringsexamen-a2-uitleg', title: 'Alle vier de onderdelen', desc: 'Lezen, Luisteren, Schrijven en Spreken uitgelegd' },
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

<h2 id="oefenen">Where to practise this</h2>

<p>You do not learn these points from a grammar book. You learn them by writing a whole task and then looking back at it on purpose — exactly as on the exam, where you have to do everything at once.</p>

<p>On our platform you write real exam tasks and get feedback per assessment point, with model answers and a marking rubric written by a certified NT2 teacher. Not by an AI. <a href="/en/practice-exam/a2/writing">See the A2 Writing practice exams</a>.</p>

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
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'All four parts', desc: 'Reading, Listening, Writing and Speaking explained' },
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
          { slug: 'inburgeringsexamen-a2-uitleg', title: 'الأجزاء الأربعة كلها', desc: 'شرح القراءة والاستماع والكتابة والتحدث' },
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
      { slug: 'spreken-examen-inburgering-tips', title: 'Examen Spreken A2: 7 tips', desc: 'Onderdeel 1 stelt twee vragen, niet één' },
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
          { slug: 'spreken-examen-inburgering-tips', title: 'A2 Speaking: 7 tips', desc: 'Part 1 asks two questions, not one' },
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
          { slug: 'spreken-examen-inburgering-tips', title: 'التحدث A2: سبع نصائح', desc: 'الجزء الأول يطرح سؤالين لا سؤالًا واحدًا' },
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

<div class="tip-card"><span class="tip-number">1</span><div><p><strong>Het woordje weglaten.</strong> Ik kan beter concentreren → Ik kan <strong>me</strong> beter concentreren.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p><strong>Het verkeerde woordje bij ‘u’.</strong> Voelt u je goed? → Voelt u <strong>zich</strong> goed?</p></div></div>
<div class="tip-card"><span class="tip-number">3</span><div><p><strong>Het woordje op de verkeerde plek.</strong> Ik me bereid voor → Ik bereid <strong>me</strong> voor.</p></div></div>

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
      { slug: 'spreken-examen-inburgering-tips', title: 'Examen Spreken A2: 7 tips', desc: 'Onderdeel 1 stelt twee vragen, niet één' },
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

<div class="tip-card"><span class="tip-number">1</span><div><p><strong>Leaving the word out.</strong> Ik kan beter concentreren → Ik kan <strong>me</strong> beter concentreren.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p><strong>The wrong word with ‘u’.</strong> Voelt u je goed? → Voelt u <strong>zich</strong> goed?</p></div></div>
<div class="tip-card"><span class="tip-number">3</span><div><p><strong>The word in the wrong place.</strong> Ik me bereid voor → Ik bereid <strong>me</strong> voor.</p></div></div>

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
          { slug: 'spreken-examen-inburgering-tips', title: 'A2 Speaking: 7 tips', desc: 'Part 1 asks two questions, not one' },
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

<div class="tip-card"><span class="tip-number">1</span><div><p><strong>حذف الكلمة.</strong> ${nlEx('Ik kan beter concentreren')} ← ${nlEx('Ik kan <strong>me</strong> beter concentreren')}.</p></div></div>
<div class="tip-card"><span class="tip-number">2</span><div><p><strong>الكلمة الخطأ مع «u».</strong> ${nlEx('Voelt u je goed?')} ← ${nlEx('Voelt u <strong>zich</strong> goed?')}</p></div></div>
<div class="tip-card"><span class="tip-number">3</span><div><p><strong>الكلمة في الموضع الخطأ.</strong> ${nlEx('Ik me bereid voor')} ← ${nlEx('Ik bereid <strong>me</strong> voor')}.</p></div></div>

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
          { slug: 'spreken-examen-inburgering-tips', title: 'التحدث A2: سبع نصائح', desc: 'الجزء الأول يطرح سؤالين لا سؤالًا واحدًا' },
        ],
        ctaTitle: 'اسمع أخطاءك بنفسك',
        ctaDesc: 'سجّل إجابتك في امتحانات التحدث التجريبية واكتب واجبات امتحانية حقيقية — مع ملاحظات من مدرّسة NT2 معتمدة.',
        ctaLabel: 'تدرّب مجانًا',
      },
    },
  },
  // ───────────────────────────────────────────────────── 9. SPREKEN — tips
  {
    slug: 'spreken-examen-inburgering-tips',
    title: 'Examen Spreken A2: 7 tips van een NT2-docent',
    description: 'Bij onderdeel 1 worden vaak twee vragen gesteld, niet één. Dat en zes andere tips voor het examen Spreken A2, van een gecertificeerde NT2-docent.',
    category: 'Tips & Voorbereiding',
    categoryKey: 'tips',
    categoryColor: 'orange',
    datePublished: '2026-09-16',
    dateModified: '2026-09-16',
    dateLabel: '16 september 2026',
    breadcrumb: 'Tips voor Spreken A2',
    heroTitle: 'Examen Spreken A2: 7 tips van een NT2-docent',
    heroSubtitle: 'De belangrijkste tip staat nergens op internet: bij onderdeel 1 zitten er vaak twee vragen in één vraag.',
    image: '/images/blog/spreken-examen-inburgering-tips.jpg',
    imageAlt: 'Cursist met koptelefoon spreekt een antwoord in achter een computer tijdens het oefenen van het examen Spreken',
    readingMinutes: 8,
    faq: [
      { q: 'Hoeveel vragen krijg ik bij het examen Spreken A2?', a: 'In de officiële oefenexamens van DUO krijg je 16 vragen. Het examen duurt maximaal 35 minuten en je doet het op de computer met een koptelefoon.' },
      { q: 'Worden er echt twee vragen tegelijk gesteld?', a: 'Bij onderdeel 1 komt dat regelmatig voor. Bijvoorbeeld: “Waar doe jij je boodschappen? En hoe vaak per week?” Dat zijn twee dingen die allebei in je antwoord moeten.' },
      { q: 'Wat doe ik als ik het antwoord niet weet?', a: 'Zeg iets. Een kort en eenvoudig antwoord levert punten op, stilte niet. Je mag ook zeggen dat je iets niet vaak doet of niet weet, als je dat in het Nederlands doet.' },
      { q: 'Mag ik mezelf verbeteren tijdens het spreken?', a: 'Ja. Jezelf verbeteren is normaal spreken en wordt niet afgestraft. Verbeter in één keer en praat door — helemaal opnieuw beginnen kost tijd die je niet hebt.' },
      { q: 'Hoe wordt het examen Spreken nagekeken?', a: 'Deels automatisch en deels door gecertificeerde beoordelaars. Dat staat in het examenreglement van DUO, artikel 10.' },
      { q: 'Moet ik snel praten?', a: 'Nee. Rustig en verstaanbaar levert meer op dan snel en onduidelijk. Je wordt beoordeeld op of je begrijpelijk bent, niet op tempo.' },
      { q: 'Wat is de beste manier om Spreken te oefenen?', a: 'Hardop, met een opname, en daarna terugluisteren. Antwoorden bedenken in je hoofd voelt goed en traint bijna niets, omdat je je eigen fouten dan niet hoort.' },
    ],
    articleHtml: `
<p>De belangrijkste tip voor het <strong>examen Spreken A2</strong> staat bijna nergens op internet, en hij kost kandidaten elk jaar punten: bij onderdeel 1 worden vaak <strong>twee vragen tegelijk gesteld, niet één</strong>. Wie alleen de eerste vraag beantwoordt, geeft een half antwoord — en dat telt ook als een half antwoord.</p>

${fact('Het examen Spreken op niveau A2 doe je op de computer en duurt 35 minuten. Het wordt deels automatisch en deels door gecertificeerde beoordelaars nagekeken.', 'inburgeren.nl — inhoud taalexamens', SRC_INHOUD)}

<div class="article-toc">
  <p class="article-toc-title">De zeven tips</p>
  <ol>
    <li><a href="#twee-vragen">Luister naar de héle vraag</a></li>
    <li><a href="#want">Kies ‘want’, niet ‘omdat’</a></li>
    <li><a href="#kort">Twee korte zinnen boven één lange</a></li>
    <li><a href="#me">Vergeet ‘me’ en ‘zich’ niet</a></li>
    <li><a href="#doorpraten">Blijf praten tot de tijd om is</a></li>
    <li><a href="#fout">Praat door na een fout</a></li>
    <li><a href="#hardop">Oefen hardop, niet in je hoofd</a></li>
  </ol>
</div>

<h2 id="twee-vragen">1. Luister naar de héle vraag — er zitten er vaak twee in</h2>

${docentNote('Onderdeel 1: luister heel goed naar de vraagstelling. Er worden twee vragen gesteld, niet één. Bijvoorbeeld: “Ik doe mijn boodschappen bij Albert Heijn. Waar doe jij je boodschappen? En hoe vaak per week?”')}

<p>In dat voorbeeld zijn er twee dingen die je moet zeggen: <strong>waar</strong> je boodschappen doet en <strong>hoe vaak</strong>. Antwoord je alleen “Bij de Lidl”, dan mis je de helft van de vraag.</p>

<p>Wat je traint: luister tot het einde vóórdat je bedenkt wat je gaat zeggen. Tel in je hoofd de vraagwoorden — <em>waar</em>, <em>hoe vaak</em>, <em>waarom</em>, <em>wanneer</em>. Elk vraagwoord is één ding dat in je antwoord moet.</p>

${foutGoed(['Bij de Lidl.'], ['Ik doe mijn boodschappen bij de Lidl. Ik ga twee keer per week.'])}

<p>Twee korte zinnen, allebei de vragen beantwoord. Klaar. Je hoeft niet meer te zeggen dan dat.</p>

<h2 id="want">2. Kies ‘want’, niet ‘omdat’</h2>

<p>Bij spreken heb je geen tijd om een zin te herstellen. <em>Want</em> laat de woordvolgorde met rust; <em>omdat</em> stuurt het werkwoord naar het einde van de zin, en onder tijdsdruk gaat dat mis.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>Met want</h3><p class="compare-when">Geen risico</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Zin</p><p class="compare-val">Ik ga met de fiets, <strong>want</strong> het <strong>is</strong> dichtbij.</p></div>
      <div class="compare-row"><p class="compare-key">Wat je moet doen</p><p class="compare-val">Niets. De zin blijft gewoon.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>Met omdat</h3><p class="compare-when">Moeilijker onder druk</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Zin</p><p class="compare-val">Ik ga met de fiets, <strong>omdat</strong> het dichtbij <strong>is</strong>.</p></div>
      <div class="compare-row"><p class="compare-key">Wat je moet doen</p><p class="compare-val">Het werkwoord naar achteren verplaatsen.</p></div>
    </div>
  </div>
</div>

<p>De uitzondering: op een directe <em>waarom</em>-vraag antwoord je wél met <em>omdat</em>. De hele uitleg staat in <a href="/nl/blog/want-of-omdat">Want of omdat</a>.</p>

<h2 id="kort">3. Twee korte zinnen zijn beter dan één lange</h2>

<p>Op A2 word je beoordeeld op of je begrijpelijk en correct spreekt, niet op of je ingewikkelde zinnen maakt. Een lange zin die halverwege instort levert minder op dan twee zinnen die kloppen.</p>

<h2 id="me">4. Vergeet ‘me’ en ‘zich’ niet</h2>

<p>Ik voel <strong>me</strong> goed. Ik bereid <strong>me</strong> voor. Ik kan <strong>me</strong> concentreren. Het weglaten van dat woordje is een van de meest hoorbare fouten, en bij spreken valt het meer op dan op papier. De twintig werkwoorden die je op A2 nodig hebt, staan in <a href="/nl/blog/wederkerende-werkwoorden-nederlands">wederkerende werkwoorden</a>.</p>

<h2 id="doorpraten">5. Blijf praten tot de tijd om is</h2>

<p>Stilte levert geen punten op. Heb je je antwoord gegeven en is er nog tijd? Voeg één zin toe: een voorbeeld, een reden of een detail.</p>

<div class="info-box info-box-green">
  <p><strong>Ik doe boodschappen bij de Lidl. Ik ga twee keer per week. Het is dichtbij mijn huis.</strong> Die derde zin kost je niets en laat meer Nederlands horen.</p>
</div>

<h2 id="fout">6. Praat gewoon door na een fout</h2>

<p>Je zegt iets fout en je hoort het zelf. Verbeter het in één keer en ga verder: “Ik ga... ik ben naar de dokter geweest.” Dat is normaal spreken en het wordt niet afgestraft. Helemaal opnieuw beginnen kost tijd die je niet hebt.</p>

<h2 id="hardop">7. Oefen hardop, niet in je hoofd</h2>

<p>Spreken is het enige onderdeel waarbij je je eigen stem moet hóren om beter te worden. Antwoorden bedenken in je hoofd voelt goed en traint bijna niets: je hoort je eigen weglatingen niet, en je merkt niet dat je halverwege een zin vastloopt.</p>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg><p>Neem jezelf op met je telefoon en luister terug. De eerste keer is ongemakkelijk. Daarna hoor je in één minuut wat je in een week oefenen niet had gemerkt.</p></div>

<h2 id="oefenen">Waar je dit oefent</h2>

<p>Op ons platform krijg je examenvragen met beeld en geluid in het format van DUO, neem je je antwoord op, en krijg je feedback op basis van een beoordelingslijst die door een gecertificeerde NT2-docent is geschreven. <a href="/nl/oefenexamen/a2/spreken">Bekijk de oefenexamens Spreken A2</a>.</p>
`,
    sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Spreken A2 in het kort</h3>
  <table class="facts-table">
    <tr><td>Vragen</td><td>16</td></tr>
    <tr><td>Tijd</td><td>35 min</td></tr>
    <tr><td>Waarop</td><td>computer</td></tr>
    <tr><td>Nagekeken door</td><td>deels mensen</td></tr>
  </table>
</div>`,
    relatedPosts: [
      { slug: 'want-of-omdat', title: 'Want of omdat?', desc: 'Waarom ‘want’ bij spreken de veiligere keuze is' },
      { slug: 'wederkerende-werkwoorden-nederlands', title: 'Wederkerende werkwoorden', desc: 'Me, je, zich — met 20 voorbeelden' },
      { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'De 8 fouten bij Schrijven A2', desc: 'Hoofdletters, komma’s, tijden en ‘u’ of ‘je’' },
    ],
    ctaTitle: 'Oefen Spreken met je eigen stem',
    ctaDesc: 'Tien oefenexamens Spreken A2 in het format van DUO — met opname, modelantwoorden en feedback van een gecertificeerde NT2-docent.',
    ctaHref: '/oefenen',
    ctaLabel: 'Gratis oefenen',
    translations: {
      en: {
        heroTitle: 'A2 Speaking exam: 7 tips from an NT2 teacher',
        description: 'Part 1 often asks two questions, not one. That and six other tips for the A2 Speaking exam, from a certified NT2 teacher.',
        category: 'Tips & Preparation',
        breadcrumb: 'Tips for Speaking A2',
        dateLabel: '16 September 2026',
        imageAlt: 'Learner with headphones recording an answer at a computer while practising the Speaking exam',
        heroSubtitle: 'The most important tip is almost nowhere online: in part 1 there are often two questions inside one question.',
        articleHtml: `
<p>The most important tip for the <strong>A2 Speaking exam</strong> is almost nowhere to be found online, and it costs candidates points every year: in part 1 you are often asked <strong>two questions at once, not one</strong>. Answer only the first and you give half an answer — and it counts as half an answer.</p>

${factEn('The Speaking exam at level A2 is taken on a computer and lasts 35 minutes. It is marked partly automatically and partly by certified assessors.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<div class="article-toc">
  <p class="article-toc-title">The seven tips</p>
  <ol>
    <li><a href="#twee-vragen">Listen to the whole question</a></li>
    <li><a href="#want">Choose ‘want’, not ‘omdat’</a></li>
    <li><a href="#kort">Two short sentences beat one long one</a></li>
    <li><a href="#me">Do not forget ‘me’ and ‘zich’</a></li>
    <li><a href="#doorpraten">Keep talking until time is up</a></li>
    <li><a href="#fout">Carry on after a mistake</a></li>
    <li><a href="#hardop">Practise out loud, not in your head</a></li>
  </ol>
</div>

<h2 id="twee-vragen">1. Listen to the whole question — there are often two in it</h2>

${docentNote('Part 1: listen very carefully to the question. Two questions are asked, not one. For example: “Ik doe mijn boodschappen bij Albert Heijn. Waar doe jij je boodschappen? En hoe vaak per week?”', 'NT2 teacher')}

<p>In that example there are two things you have to say: <strong>where</strong> you do your shopping and <strong>how often</strong>. If you answer only “Bij de Lidl”, you miss half the question.</p>

<p>What to train: listen to the end <em>before</em> you start thinking about your answer. Count the question words in your head — <em>waar</em>, <em>hoe vaak</em>, <em>waarom</em>, <em>wanneer</em>. Every question word is one thing that has to be in your answer.</p>

${foutGoed(['Bij de Lidl.'], ['Ik doe mijn boodschappen bij de Lidl. Ik ga twee keer per week.'], ['Half an answer', 'Complete answer'])}

<p>Two short sentences, both questions answered. Done. You do not need to say more than that.</p>

<h2 id="want">2. Choose ‘want’, not ‘omdat’</h2>

<p>When speaking you have no time to repair a sentence. <em>Want</em> leaves the word order alone; <em>omdat</em> sends the verb to the end of the clause, and under time pressure that goes wrong.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>With want</h3><p class="compare-when">No risk</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Sentence</p><p class="compare-val">Ik ga met de fiets, <strong>want</strong> het <strong>is</strong> dichtbij.</p></div>
      <div class="compare-row"><p class="compare-key">What you must do</p><p class="compare-val">Nothing. The sentence stays normal.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>With omdat</h3><p class="compare-when">Harder under pressure</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Sentence</p><p class="compare-val">Ik ga met de fiets, <strong>omdat</strong> het dichtbij <strong>is</strong>.</p></div>
      <div class="compare-row"><p class="compare-key">What you must do</p><p class="compare-val">Move the verb to the end.</p></div>
    </div>
  </div>
</div>

<p>The exception: to a direct <em>waarom</em> question you do answer with <em>omdat</em>. The full explanation is in <a href="/en/blog/want-or-omdat-dutch">Want or omdat</a>.</p>

<h2 id="kort">3. Two short sentences are better than one long one</h2>

<p>At A2 you are assessed on whether you speak clearly and correctly, not on whether you build complex sentences. A long sentence that collapses halfway scores less than two sentences that are right.</p>

<h2 id="me">4. Do not forget ‘me’ and ‘zich’</h2>

<p>Ik voel <strong>me</strong> goed. Ik bereid <strong>me</strong> voor. Ik kan <strong>me</strong> concentreren. Dropping that little word is one of the most audible mistakes, and in speech it stands out more than on paper. The twenty verbs you need at A2 are in <a href="/en/blog/dutch-reflexive-verbs">Dutch reflexive verbs</a>.</p>

<h2 id="doorpraten">5. Keep talking until time is up</h2>

<p>Silence scores nothing. Given your answer and still have time? Add one sentence: an example, a reason or a detail.</p>

<div class="info-box info-box-green">
  <p><strong>Ik doe boodschappen bij de Lidl. Ik ga twee keer per week. Het is dichtbij mijn huis.</strong> That third sentence costs you nothing and lets you show more Dutch.</p>
</div>

<h2 id="fout">6. Carry on after a mistake</h2>

<p>You say something wrong and you hear it yourself. Correct it once and move on: “Ik ga... ik ben naar de dokter geweest.” That is normal speech and it is not penalised. Starting over completely costs time you do not have.</p>

<h2 id="hardop">7. Practise out loud, not in your head</h2>

<p>Speaking is the only part where you have to <em>hear</em> your own voice to improve. Thinking up answers in your head feels productive and trains almost nothing: you do not hear your own omissions, and you do not notice that you stall halfway through a sentence.</p>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg><p>Record yourself on your phone and listen back. The first time is uncomfortable. After that you hear in one minute what a week of practice had not shown you.</p></div>

<h2 id="oefenen">Where to practise this</h2>

<p>On our platform you get exam questions with images and audio in DUO’s format, you record your answer, and you get feedback based on a marking rubric written by a certified NT2 teacher. <a href="/en/practice-exam/a2/speaking">See the A2 Speaking practice exams</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Speaking A2 in short</h3>
  <table class="facts-table">
    <tr><td>Questions</td><td>16</td></tr>
    <tr><td>Time</td><td>35 min</td></tr>
    <tr><td>On</td><td>computer</td></tr>
    <tr><td>Marked by</td><td>partly people</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'How many questions do I get on the A2 Speaking exam?', a: 'In DUO’s official practice exams you get 16 questions. The exam lasts a maximum of 35 minutes and you take it on a computer with a headset.' },
          { q: 'Are two questions really asked at once?', a: 'In part 1 that happens regularly. For example: “Waar doe jij je boodschappen? En hoe vaak per week?” Those are two things that both have to be in your answer.' },
          { q: 'What do I do if I do not know the answer?', a: 'Say something. A short, simple answer scores points; silence does not. You may also say that you do not do something often or do not know, as long as you say it in Dutch.' },
          { q: 'May I correct myself while speaking?', a: 'Yes. Correcting yourself is normal speech and is not penalised. Correct it once and carry on — starting over completely costs time you do not have.' },
          { q: 'How is the Speaking exam marked?', a: 'Partly automatically and partly by certified assessors. That is stated in DUO’s exam regulations, article 10.' },
          { q: 'Do I have to speak fast?', a: 'No. Calm and intelligible scores more than fast and unclear. You are assessed on whether you are understandable, not on speed.' },
          { q: 'What is the best way to practise Speaking?', a: 'Out loud, with a recording, and then listening back. Thinking up answers in your head feels good and trains almost nothing, because you do not hear your own mistakes.' },
        ],
        relatedPosts: [
          { slug: 'want-of-omdat', title: 'Want or omdat?', desc: 'Why ‘want’ is the safer choice when speaking' },
          { slug: 'wederkerende-werkwoorden-nederlands', title: 'Dutch reflexive verbs', desc: 'Me, je, zich — with 20 examples' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'The 8 mistakes on Writing A2', desc: 'Capitals, commas, times and ‘u’ versus ‘je’' },
        ],
        ctaTitle: 'Practise Speaking with your own voice',
        ctaDesc: 'Ten A2 Speaking practice exams in DUO’s format — with recording, model answers and feedback from a certified NT2 teacher.',
        ctaLabel: 'Practise for free',
      },
      ar: {
        heroTitle: 'امتحان التحدث A2: سبع نصائح من مدرّسة NT2',
        description: 'في الجزء الأول يُطرح سؤالان لا سؤال واحد. هذه النصيحة وست غيرها لامتحان التحدث A2، من مدرّسة NT2 معتمدة.',
        category: 'نصائح وتحضير',
        breadcrumb: 'نصائح للتحدث A2',
        dateLabel: '١٦ سبتمبر ٢٠٢٦',
        imageAlt: 'متعلّم يرتدي سماعات ويسجّل إجابته على الحاسوب أثناء التدرب على امتحان التحدث',
        heroSubtitle: 'أهم نصيحة لا تكاد تجدها على الإنترنت: في الجزء الأول يختبئ سؤالان داخل سؤال واحد.',
        articleHtml: `
<p>أهم نصيحة في <strong>امتحان التحدث A2</strong> لا تكاد تجدها على الإنترنت، وهي تكلّف المتقدمين نقاطًا كل عام: في الجزء الأول يُطرح غالبًا <strong>سؤالان معًا لا سؤال واحد</strong>. ومن يجيب عن الأول فقط يقدّم نصف إجابة — وتُحتسب نصف إجابة.</p>

${factAr('يُؤدى امتحان التحدث في المستوى A2 على الحاسوب ويستغرق 35 دقيقة. ويُصحَّح جزئيًا بشكل آلي وجزئيًا على يد مصحّحين معتمدين.', 'inburgeren.nl — محتوى امتحانات اللغة', SRC_INHOUD)}

<div class="article-toc">
  <p class="article-toc-title">النصائح السبع</p>
  <ol>
    <li><a href="#twee-vragen">استمع إلى السؤال كاملًا</a></li>
    <li><a href="#want">اختر «want» لا «omdat»</a></li>
    <li><a href="#kort">جملتان قصيرتان خير من جملة طويلة</a></li>
    <li><a href="#me">لا تنسَ «me» و«zich»</a></li>
    <li><a href="#doorpraten">استمر في الكلام حتى ينتهي الوقت</a></li>
    <li><a href="#fout">تابع بعد الخطأ</a></li>
    <li><a href="#hardop">تدرّب بصوت مرتفع لا في رأسك</a></li>
  </ol>
</div>

<h2 id="twee-vragen">١. استمع إلى السؤال كاملًا — ففيه سؤالان غالبًا</h2>

${docentNote('الجزء الأول: استمع جيدًا إلى صيغة السؤال. يُطرح سؤالان لا سؤال واحد. مثال: «Ik doe mijn boodschappen bij Albert Heijn. Waar doe jij je boodschappen? En hoe vaak per week?»', 'مدرّسة NT2')}

<p>في هذا المثال عليك أن تقول شيئين: <strong>أين</strong> تتسوّق و<strong>كم مرة</strong>. فإن أجبت ${nlEx('Bij de Lidl')} فقط، فاتك نصف السؤال.</p>

<p>ما تتدرّب عليه: استمع حتى النهاية <em>قبل</em> أن تفكر في إجابتك. وعُدّ في رأسك أدوات الاستفهام — ${nlEx('waar')}، ${nlEx('hoe vaak')}، ${nlEx('waarom')}، ${nlEx('wanneer')}. كل أداة استفهام تعني شيئًا يجب أن يرد في جوابك.</p>

${foutGoed([nlEx('Bij de Lidl.')], [nlEx('Ik doe mijn boodschappen bij de Lidl. Ik ga twee keer per week.')], ['نصف إجابة', 'إجابة كاملة'])}

<p>جملتان قصيرتان، وأُجيب عن السؤالين. انتهى الأمر، ولا يلزمك أكثر من ذلك.</p>

<h2 id="want">٢. اختر «want» لا «omdat»</h2>

<p>في الكلام لا وقت لديك لإصلاح الجملة. <em>want</em> تترك ترتيب الكلمات كما هو، أما <em>omdat</em> فترسل الفعل إلى آخر الجملة، وتحت ضغط الوقت يقع الخطأ.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>مع want</h3><p class="compare-when">بلا مخاطرة</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">الجملة</p><p class="compare-val">${nlEx('Ik ga met de fiets, <strong>want</strong> het <strong>is</strong> dichtbij.')}</p></div>
      <div class="compare-row"><p class="compare-key">ما عليك فعله</p><p class="compare-val">لا شيء. تبقى الجملة كما هي.</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>مع omdat</h3><p class="compare-when">أصعب تحت الضغط</p></div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">الجملة</p><p class="compare-val">${nlEx('Ik ga met de fiets, <strong>omdat</strong> het dichtbij <strong>is</strong>.')}</p></div>
      <div class="compare-row"><p class="compare-key">ما عليك فعله</p><p class="compare-val">نقل الفعل إلى آخر الجملة.</p></div>
    </div>
  </div>
</div>

<p>والاستثناء: عند سؤال <em>waarom</em> المباشر تجيب فعلًا بـ<em>omdat</em>. والشرح الكامل في <a href="/ar/المدونة/want-أم-omdat">want أم omdat</a>.</p>

<h2 id="kort">٣. جملتان قصيرتان خير من جملة طويلة</h2>

<p>في المستوى A2 يُقيَّم مدى وضوحك وصحتك في الكلام، لا قدرتك على بناء جمل معقّدة. والجملة الطويلة التي تنهار في منتصفها تعطي أقل من جملتين صحيحتين.</p>

<h2 id="me">٤. لا تنسَ «me» و«zich»</h2>

<p>${nlEx('Ik voel <strong>me</strong> goed. Ik bereid <strong>me</strong> voor. Ik kan <strong>me</strong> concentreren.')} حذف هذه الكلمة من أكثر الأخطاء وضوحًا للأذن، وفي الكلام يلفت الانتباه أكثر مما في الورق. والأفعال العشرون التي تحتاجها في A2 في <a href="/ar/المدونة/الأفعال-الانعكاسية-الهولندية">الأفعال الانعكاسية</a>.</p>

<h2 id="doorpraten">٥. استمر في الكلام حتى ينتهي الوقت</h2>

<p>الصمت لا يعطي نقاطًا. أعطيت جوابك وبقي وقت؟ أضف جملة واحدة: مثالًا أو سببًا أو تفصيلًا.</p>

<div class="info-box info-box-green">
  <p><strong>${nlEx('Ik doe boodschappen bij de Lidl. Ik ga twee keer per week. Het is dichtbij mijn huis.')}</strong> هذه الجملة الثالثة لا تكلّفك شيئًا وتُظهر هولندية أكثر.</p>
</div>

<h2 id="fout">٦. تابع الكلام بعد الخطأ</h2>

<p>تقول شيئًا خطأً وتسمعه بنفسك. صحّحه مرة واحدة وتابع: ${nlEx('“Ik ga... ik ben naar de dokter geweest.”')} هذا كلام طبيعي ولا يُعاقَب عليه. أما البدء من جديد تمامًا فيكلّفك وقتًا لا تملكه.</p>

<h2 id="hardop">٧. تدرّب بصوت مرتفع لا في رأسك</h2>

<p>التحدث هو الجزء الوحيد الذي يجب أن تسمع فيه صوتك لتتحسّن. وصياغة الإجابات في رأسك تبدو مفيدة لكنها لا تدرّب شيئًا تقريبًا: لا تسمع ما تحذفه، ولا تلاحظ أنك تتعثّر في منتصف الجملة.</p>

<div class="note-strip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg><p>سجّل نفسك بهاتفك واستمع إلى التسجيل. المرة الأولى غير مريحة، لكنك بعدها تسمع في دقيقة واحدة ما لم يُظهره لك أسبوع من التدريب.</p></div>

<h2 id="oefenen">أين تتدرّب على هذا</h2>

<p>على منصّتنا تحصل على أسئلة امتحانية بالصورة والصوت بصيغة DUO، وتسجّل إجابتك، وتتلقى ملاحظات مبنية على قائمة تقييم كتبتها مدرّسة NT2 معتمدة. <a href="/ar/امتحان-تجريبي/a2/التحدث">اطّلع على امتحانات التحدث التجريبية A2</a>.</p>
`,
        sidebarHtml: `<div class="bg-surface-container-lowest rounded-2xl p-6" style="box-shadow: 0 2px 16px rgba(0,43,109,0.06)">
  <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">التحدث A2 باختصار</h3>
  <table class="facts-table">
    <tr><td>الأسئلة</td><td>16</td></tr>
    <tr><td>المدة</td><td>35 دقيقة</td></tr>
    <tr><td>الوسيلة</td><td>حاسوب</td></tr>
    <tr><td>التصحيح</td><td>جزئيًا بشر</td></tr>
  </table>
</div>`,
        faq: [
          { q: 'كم سؤالًا أحصل عليه في امتحان التحدث A2؟', a: 'في الامتحانات التجريبية الرسمية من DUO تحصل على 16 سؤالًا. ويستغرق الامتحان 35 دقيقة كحد أقصى وتؤديه على الحاسوب بسماعة رأس.' },
          { q: 'هل يُطرح سؤالان معًا فعلًا؟', a: 'في الجزء الأول يحدث ذلك كثيرًا. مثال: «Waar doe jij je boodschappen? En hoe vaak per week?» وهما أمران يجب أن يردا في جوابك معًا.' },
          { q: 'ماذا أفعل إن لم أعرف الإجابة؟', a: 'قل شيئًا. الإجابة القصيرة البسيطة تعطي نقاطًا، والصمت لا يعطي شيئًا. ويمكنك أن تقول إنك لا تفعل ذلك كثيرًا أو لا تعرف، ما دمت تقولها بالهولندية.' },
          { q: 'هل يجوز أن أصحّح نفسي أثناء الكلام؟', a: 'نعم. تصحيح النفس كلام طبيعي ولا يُعاقَب عليه. صحّح مرة واحدة وتابع، فالبدء من جديد يكلّفك وقتًا لا تملكه.' },
          { q: 'كيف يُصحَّح امتحان التحدث؟', a: 'جزئيًا بشكل آلي وجزئيًا على يد مصحّحين معتمدين، وهذا منصوص عليه في لائحة امتحانات DUO، المادة 10.' },
          { q: 'هل يجب أن أتكلم بسرعة؟', a: 'لا. الكلام الهادئ المفهوم أفضل من السريع غير الواضح. أنت تُقيَّم على مدى وضوحك لا على سرعتك.' },
          { q: 'ما أفضل طريقة للتدرّب على التحدث؟', a: 'بصوت مرتفع، مع التسجيل، ثم الاستماع إلى ما سجّلته. فصياغة الإجابات في الرأس مريحة لكنها لا تدرّب شيئًا تقريبًا، لأنك لا تسمع أخطاءك.' },
        ],
        relatedPosts: [
          { slug: 'want-of-omdat', title: 'want أم omdat؟', desc: 'لماذا «want» أأمن في الكلام' },
          { slug: 'wederkerende-werkwoorden-nederlands', title: 'الأفعال الانعكاسية', desc: 'me وje وzich — مع 20 مثالًا' },
          { slug: 'veelgemaakte-fouten-schrijven-examen-a2', title: 'الأخطاء الثمانية في الكتابة A2', desc: 'الحروف الكبيرة والفواصل والوقت و«u» أو «je»' },
        ],
        ctaTitle: 'تدرّب على التحدث بصوتك أنت',
        ctaDesc: 'عشرة امتحانات تحدث تجريبية A2 بصيغة DUO — مع التسجيل وإجابات نموذجية وملاحظات من مدرّسة NT2 معتمدة.',
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
