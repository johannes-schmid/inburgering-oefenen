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

/** Per-locale content. Anything omitted falls back to the Dutch fields on BlogPost. */
type PostLocale = {
  heroTitle: string;
  description: string;
  category: string;
  slug?: string;
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

<p>Want to start now? <a href="/en/oefenen">Take a free practice exam</a> and see where you stand.</p>
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

<p>هل تريد البدء الآن؟ <a href="/ar/oefenen">أدِّ امتحانًا تدريبيًا مجانيًا</a> واعرف مستواك.</p>
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

<p>Read on: <a href="/en/blog/inburgeringsexamen-a2-uitleg">all four parts explained</a>, or <a href="/en/oefenen">take a free practice exam</a>.</p>
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

<p>As with every part, DUO does not publish how much you need correct: the pass mark is a cesuur set by the Minister. If you fail Listening, you retake <strong>only</strong> that part — see <a href="/en/blog/inburgeringsexamen-zakken-herkansen">failing and retaking</a>.</p>

<p>DUO has <strong>3 free Listening practice exams</strong>. Do them, then get more volume: we have 10, with real audio and an explanation per question, recorded and checked by a certified NT2 teacher.</p>

<p>Read on: <a href="/en/blog/inburgeringsexamen-a2-uitleg">all four parts explained</a>, or <a href="/en/oefenen">start a free practice exam</a>.</p>
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

<p>And how much you needed correct? DUO does not publish it — the boundary is a cesuur set by the Minister. The figures you find online do not come from DUO and contradict each other. More on that in <a href="/en/blog/inburgeringsexamen-a2-uitleg">the explanation of the four parts</a>.</p>

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

<p>Ready for the next attempt? <a href="/en/oefenen">Take a free practice exam</a> and see where you stand.</p>
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

<p>That is why the integration exam tests each part separately, and why a fail means retaking only that one part — see <a href="/en/blog/inburgeringsexamen-zakken-herkansen">failing and retaking</a>.</p>

<h2 id="a2-exam">What A2 means in the exam</h2>

${factEn('Reading 65 minutes, Listening 45 minutes, Writing 40 minutes (pen and paper, 4 assignments), Speaking 35 minutes.', 'inburgeren.nl — content of the language exams', SRC_INHOUD)}

<p>The texts and conversations are about ordinary things: a letter from school, a conversation at the doctor, an announcement at the station. No politics, no literature, no jargon.</p>

<p>Which is the main thing to remember: <strong>A2 is not a high level, but it is a real one</strong>. You have to be able to manage in everyday life. And that is precisely what you can practise.</p>

<p>Want to know where you stand? <a href="/en/oefenen">Take a free practice exam at A2 level</a>, or read <a href="/en/blog/inburgeringsexamen-a2-uitleg">the explanation of the four parts</a>.</p>
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
  return post.translations?.[locale as 'en' | 'ar']?.slug ?? post.slug;
}

/** All (locale, slug) pairs — used in generateStaticParams */
export function getAllPostParams(): { locale: string; slug: string }[] {
  const params: { locale: string; slug: string }[] = [];
  for (const post of POSTS) {
    params.push({ locale: 'nl', slug: post.slug });
    for (const loc of ['en', 'ar'] as const) {
      params.push({ locale: loc, slug: post.translations?.[loc]?.slug ?? post.slug });
    }
  }
  return params;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find(p =>
    p.slug === slug ||
    p.translations?.en?.slug === slug ||
    p.translations?.ar?.slug === slug
  );
}

/** Newest first — the order the index grid renders in. */
export function getSortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export default POSTS;
