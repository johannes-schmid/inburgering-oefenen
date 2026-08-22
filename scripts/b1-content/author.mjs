/**
 * The B1 authoring engine: one Claude call per unit of content, validated before it is kept.
 *
 * ## Why the content is generated at all
 * Thirty oefenexamens at B1 is 350 leesvragen over 60 teksten of 400–600 woorden, 120
 * schrijfopdrachten and 160 spreekopgaven. The owner's decision of 2026-08-08 — machine-author
 * the dataset, publish it, and have the docent validate and correct it in `/admin` — is what
 * made the A2 dataset possible and is applied here unchanged. The USP is untouched: the claim
 * is that a docent validates the content, and `/admin` is where she does it.
 *
 * The one field that lies is `review_status = 'validated'`, written by the seeder because
 * `exam_publish_issues()` has no "published but unreviewed" state. Provenance lives in the
 * seeder's header and in the draft rubrics' `system_prompt`.
 *
 * ## What is generated and what is not
 * **The plan is not generated.** `plan.mjs` fixes the tekstsoort, the subject and the
 * communicative purpose of every single item, in git. This engine writes the Dutch for a slot
 * it is handed. That is the difference between sixty texts and sixty variations on one text —
 * see the header of `plan.mjs`.
 *
 * ## No DUO material reaches the model
 * The booklets in the owner's B1 folder are copyright and secret. Nothing from them is quoted
 * in any prompt here: what was taken from them is the *format* — six teksten, 35 vragen, the
 * genre mix, the length band, the question types, the 20 s / 30 s spreektijd — and the format
 * is recorded in `index.mjs` and `plan.mjs`, not in a passage of theirs.
 *
 * ## Validation, and why a retry is cheaper than an edit
 * Every unit is checked against the same rules `index.mjs` enforces on the whole dataset,
 * immediately, in memory. A unit that fails is asked for again with the problems listed —
 * three attempts, then the run stops rather than writing a broken exam. A failed unit costs
 * one call; a broken unit discovered after seeding costs a re-seed, and after publishing costs
 * the docent's trust in everything else on the screen.
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { ROOT } from '../a2-content/lib.mjs';
import { FORMAT, SPREKEN_IMAGES } from './rules.mjs';

/**
 * The model, and how it is reached.
 *
 * Two routes, because the project has two sets of credentials and they fail differently. The
 * direct Anthropic API is the default. The **Vercel AI Gateway** is used when
 * `AI_GATEWAY_API_KEY` is set — it is already this project's AI provider (`lib/ai/gateway.ts`
 * grades Schrijven and Spreken through it), it speaks Anthropic's native `/v1/messages`
 * including `output_config.format`, and it bills the Vercel account rather than the Anthropic
 * one. That mattered on 2026-08-21: the Anthropic key ran out of credit 1 exam into a 30-exam
 * run, and switching route kept the *same model*, so the content's character did not change
 * halfway through the dataset.
 *
 * Gateway model ids are provider-prefixed; the Anthropic API rejects the prefix. That is the
 * only difference in the request.
 */
const MODEL = 'claude-opus-5';
const GATEWAY_URL = 'https://ai-gateway.vercel.sh';

/**
 * Units are cached on disk by a key derived from the slot, so an interrupted run resumes
 * instead of re-paying for everything it already had. Gitignored: the *committed* artifact is
 * `generated/`, which is assembled from complete exams only — a half-finished exam must not be
 * reviewable as if it were finished.
 */
const CACHE_DIR = path.join(ROOT, 'scripts', 'b1-content', '.unit-cache');

/** The tags `.exam-stimulus-body` and `.wr-prompt` actually style. Anything else renders unstyled. */
const ALLOWED_HTML = '<p>, <br>, <strong>, <em>, <ul>, <ol>, <li>, <table>, <tr>, <th>, <td>';

/**
 * What B1 *is*, in the terms the register has to hit. Shared by every prompt so the three
 * onderdelen cannot drift into three different levels.
 *
 * `lib/ai/level-register.ts` is the app's single description of a level's register and is read
 * by the grader. This is the authoring twin of it and says the same things; if one changes,
 * read the other. They are separate files because that one is TypeScript the grader imports
 * and this is a `.mjs` script, and a build step to share four paragraphs is not worth it.
 */
const B1_REGISTER = `
Je schrijft materiaal voor het Nederlandse Staatsexamen NT2 op niveau B1 (Programma I).
De kandidaten zijn volwassen anderstaligen die in Nederland werken of een beroepsopleiding volgen.

Wat B1 betekent voor jouw tekst:
- Onderwerpen uit werk, opleiding, zorg, wonen, geld en meedoen in de samenleving. Geen
  abstracte beschouwingen, geen literatuur, geen vakjargon zonder uitleg.
- Zinnen van gemiddeld 12 tot 18 woorden, met onderschikkende verbanden: omdat, hoewel,
  zodat, terwijl, doordat, waardoor. Niet de korte hoofdzinnen van A2.
- Alledaagse woorden, plus de woorden die bij het onderwerp horen (cao, eigen risico,
  proeftijd, medezeggenschap). Een moeilijk woord wordt in de tekst zelf duidelijk.
- Naamwoordelijke stijl mag, passieve vormen mogen, maar houd het leesbaar.
- Formele teksten gebruiken 'u'. Een bericht aan collega's of medestudenten gebruikt 'je'.
- Nederlandse namen, plaatsen, bedragen in euro's, data in de Nederlandse notatie.

Wat je NOOIT doet:
- Geen enkel woord overnemen uit een bestaand examen. Alles is nieuw geschreven.
- Geen echte bedrijven, echte scholen of echte personen noemen. Verzin namen.
- Geen emoji, geen Engelse woorden waar een Nederlands woord bestaat.
- Geen verwijzing naar 'deze oefening' of 'dit voorbeeld' binnen de tekst zelf.
`.trim();


/**
 * Undo double-escaped non-ASCII in a parsed response.
 *
 * The model sometimes emits `"\\u00f6"` where it means `"ö"` — two characters of escape rather
 * than one escape — so `JSON.parse` correctly produces the six literal characters `\u00f6` and the
 * candidate is shown "teamco\u00f6rdinator" mid-exam. It hits exactly the characters Dutch exam
 * content is full of: € (\u20ac), é, ó, ö, ë, ï, ê and the en dash. 76 occurrences across six
 * exams before this existed.
 *
 * Nothing else in the stack notices: the JSON is valid, the schema matches, every count is right,
 * and the text reads correctly in a diff unless you look at that one word. So it is repaired here
 * *and* asserted in `looksEscaped()` below, which every unit's validation calls.
 *
 * Deliberately only `\uXXXX`: rewriting `\n` would destroy the authored line breaks in `greeting`
 * and `closing`, which are real newlines and are supposed to survive.
 */
function unescapeLiterals(value) {
  if (typeof value === 'string') {
    return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  if (Array.isArray(value)) return value.map(unescapeLiterals);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unescapeLiterals(v)]));
  }
  return value;
}

/** Any `\uXXXX` left in a unit after the repair above — a defect, not a style choice. */
export function looksEscaped(value) {
  return JSON.stringify(value).includes('\\\\u');
}

/* ── the client ──────────────────────────────────────────────────────────── */

export function createAuthor({ apiKey, gatewayKey, effort = 'high', verbose = true }) {
  const viaGateway = Boolean(gatewayKey);
  const client = viaGateway
    ? new Anthropic({ apiKey: gatewayKey, baseURL: GATEWAY_URL })
    : new Anthropic({ apiKey });
  const model = viaGateway ? `anthropic/${MODEL}` : MODEL;
  if (verbose) {
    console.log(`Authoring with ${model}${viaGateway ? ' via the Vercel AI Gateway' : ''}.`);
  }
  let calls = 0;
  let inTokens = 0;
  let outTokens = 0;

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  /**
   * One structured call. Streamed, because a six-hundred-word tekst with 35 vragen behind it
   * runs long enough to hit the SDK's non-streaming HTTP timeout.
   */
  async function ask({ system, prompt, schema, maxTokens = 16000 }) {
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      output_config: { effort, format: { type: 'json_schema', schema } },
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    const message = await stream.finalMessage();
    calls++;
    inTokens += message.usage?.input_tokens ?? 0;
    outTokens += message.usage?.output_tokens ?? 0;

    if (message.stop_reason === 'refusal') {
      throw new Error(`model declined: ${message.stop_details?.explanation ?? 'no explanation'}`);
    }
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (!text.trim()) throw new Error('empty response');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`response was not JSON: ${text.slice(0, 200)}`);
    }
    return unescapeLiterals(parsed);
  }

  /**
   * Ask, validate, and ask again with the problems listed. Three attempts.
   *
   * The retry hands back the *rule that was broken*, not "try again": "vraag 3 heeft 5 opties,
   * de regel is 3 of 4" is a fixable instruction, and an unqualified retry mostly reproduces
   * the same mistake at the same cost.
   */
  async function askValidated({ key, system, prompt, schema, validate, maxTokens }) {
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    if (fs.existsSync(cachePath)) {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (validate(cached).length === 0) return cached;
      // A cached unit that no longer passes means a rule changed. Re-author it rather than
      // keep it: the alternative is a dataset that validates as a whole only by accident.
      if (verbose) console.log(`      cache for ${key} no longer passes — re-authoring`);
    }

    let attempt = 0;
    let lastProblems = [];
    let extra = '';
    while (attempt < 3) {
      attempt++;
      const result = await ask({ system, prompt: prompt + extra, schema, maxTokens });
      lastProblems = validate(result);
      if (lastProblems.length === 0) {
        fs.writeFileSync(cachePath, `${JSON.stringify(result, null, 2)}\n`);
        return result;
      }
      if (verbose) {
        console.log(`      attempt ${attempt} rejected: ${lastProblems.slice(0, 3).join(' · ')}`);
      }
      extra =
        `\n\n---\nJe vorige poging is afgekeurd omdat deze regels werden overtreden. ` +
        `Los precies deze punten op en houd de rest gelijk:\n` +
        lastProblems.map(p => `- ${p}`).join('\n');
    }
    throw new Error(`${key}: still invalid after 3 attempts — ${lastProblems.join(' · ')}`);
  }

  function stats() {
    // Opus 5 list price, 2026-06-24: $5 / $25 per MTok. An estimate for the log, not a bill.
    const usd = (inTokens / 1e6) * 5 + (outTokens / 1e6) * 25;
    return { calls, inTokens, outTokens, usd };
  }

  return { askValidated, stats };
}

/* ── Lezen ───────────────────────────────────────────────────────────────── */

const LEZEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'intro', 'body_html', 'questions'],
  properties: {
    title: { type: 'string', description: 'De kop van de tekst zelf. Geen aanhalingstekens.' },
    intro: {
      type: 'string',
      description:
        'Één of twee zinnen die zeggen waar de tekst vandaan komt en waar hij over gaat, ' +
        'zoals DUO boven elke tekst zet. Begint met "Deze tekst".',
    },
    body_html: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['prompt', 'options', 'correct', 'explanation'],
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correct: { type: 'integer', description: 'De index in options: 0 = A, 1 = B, 2 = C, 3 = D.' },
          explanation: { type: 'string' },
        },
      },
    },
  },
};

function countWords(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').trim().split(/\s+/).filter(Boolean).length;
}

/**
 * One tekst with its vragen.
 *
 * The alinea markers matter more than they look: a third of DUO's B1 vragen name an alinea
 * ("Wat staat er in alinea III over…", "Waar kan hij het antwoord vinden?"), and a tekst with
 * no visible markers makes those questions unanswerable rather than merely harder.
 */
export function lezenUnit({ examNumber, slot, genre, section, topic, questionCount }) {
  const [lo, hi] = FORMAT.lezen.words;
  const key = `lezen-${String(examNumber).padStart(2, '0')}-t${slot + 1}`;

  const prompt = `
Schrijf één leestekst met ${questionCount} meerkeuzevragen voor oefenexamen ${examNumber} van
het onderdeel Lezen, niveau B1.

TEKSTSOORT: ${genre}
ONDERWERP: ${topic}

De tekst
- ${lo + 70} tot ${hi - 120} woorden. Dit is een B1-tekst: substantieel, niet een A2-mededeling.
- Verdeeld over vier tot zes alinea's. Elke alinea begint met een Romeins nummer, vet, zo:
  <p><strong>I</strong> Eerste alinea…</p><p><strong>II</strong> Tweede alinea…</p>
  Gebruik I, II, III, IV, V, VI. Dit is verplicht: de vragen verwijzen naar de alinea's.
- Een tussenkopje mag, als <p><strong>Kopje</strong></p> op een eigen regel.
- Een opsomming mag, met <ul><li>…</li></ul>.
- Alleen deze tags: ${ALLOWED_HTML}. Geen class, geen style, geen id, geen h1-h6.
- Staat er een blok van losse regels onder elkaar — een adres, een afzender, een datumregel,
  een ondertekening — dan zet je <br> tussen die regels. Zonder <br> plakt de browser ze aan
  elkaar tot één onleesbare regel ("Postbus 2140Afdeling Werk en Inkomen"). Een nieuwe regel
  in je JSON doet niets; alleen <br> telt.
- De tekst moet echt informatie bevatten: getallen, voorwaarden, uitzonderingen, stappen,
  een tegenwerping. Uit een tekst zonder inhoud zijn geen ${questionCount} vragen te maken.

De vragen
- Precies ${questionCount} vragen, in de volgorde waarin de kandidaat ze het beste maakt.
- Drie opties (A, B, C). Maak er bij één of twee vragen vier, zoals DUO ook doet.
- Varieer de vraagtypen. Gebruik meerdere van deze:
  · wat de schrijver met een voorbeeld duidelijk wil maken
  · wat er in een genoemde alinea over iets staat
  · een detail dat je moet opzoeken (een bedrag, een termijn, een voorwaarde)
  · in welke alinea('s) iemand met een concrete vraag het antwoord vindt
  · wat een woord of uitdrukking in de tekst betekent
  · welk argument iemand in een beschreven situatie kan gebruiken
  · wat het belangrijkste doel van de tekst is (hoogstens één keer, als laatste vraag)
- Elke vraag is te beantwoorden uit de tekst alleen. Geen wereldkennis, geen mening.
- De foute opties zijn plausibel: ze staan wél in de tekst maar antwoorden niet op de vraag,
  of ze zeggen iets net te sterk of net te algemeen. Nooit een optie die duidelijk onzin is.
- Alle opties van één vraag zijn ongeveer even lang. Het goede antwoord is niet de langste.
- Spreid het goede antwoord over A, B, C en D. Niet steeds dezelfde positie.
- 'correct' is de index in 'options', dus 0 = A.
- De uitleg is één of twee zinnen, in het Nederlands, en noemt de alinea waar het antwoord
  staat. Hij legt ook uit waarom de aantrekkelijkste foute optie fout is.
- Geen enkele optie is letterlijk een zin uit de tekst.
`.trim();

  function validate(u) {
    const p = [];
    if (!u.title?.trim()) p.push('title ontbreekt');
    if (!u.intro?.trim()) p.push('intro ontbreekt');
    if (!/^Deze tekst/i.test(u.intro ?? '')) p.push('intro moet met "Deze tekst" beginnen');
    const n = countWords(u.body_html ?? '');
    if (n < lo || n > hi) p.push(`de tekst heeft ${n} woorden, het moet ${lo}–${hi} zijn`);
    if (/<(h[1-6]|div|span|script|img)\b/i.test(u.body_html ?? '')) {
      p.push(`body_html mag alleen ${ALLOWED_HTML} gebruiken`);
    }
    if (/\sclass=|\sstyle=|\sid=/i.test(u.body_html ?? '')) p.push('body_html mag geen class/style/id hebben');
    /*
     * Run-together lines: an address or signature block written as separate lines inside one
     * <p> with no <br>. The browser joins them ("Postbus 2140Afdeling Werk en Inkomen"), which
     * no other check notices — the HTML is valid, the words are right, and the page renders.
     * A lowercase letter directly followed by a capital and more lowercase is the signature of
     * exactly that mistake; normal Dutch prose does not produce it.
     *
     * Tags are replaced by a **space**, not by nothing. Replacing them with nothing makes a
     * correct `x<br>Y` look identical to a glued `xY`, so the check fires on the very fix it is
     * asking for and no number of retries can pass it. That cost three attempts to notice.
     */
    const glued = (u.body_html ?? '').replace(/<[^>]*>/g, ' ').match(/[a-zà-ÿ]{2}[A-Z][a-zà-ÿ]{2}/g) ?? [];
    if (glued.length > 0) {
      p.push(
        `regels zijn aan elkaar geplakt (${glued.slice(0, 4).join(', ')}) — zet <br> tussen ` +
          'losse regels van een adres, afzender of ondertekening'
      );
    }
    // A newline inside a <p> is not a line break in HTML; it collapses to a space. So a block
    // written with real newlines renders as one long line — less broken than glued text, but
    // still not the address block it was meant to be.
    for (const block of (u.body_html ?? '').match(/<p>[\s\S]*?<\/p>/g) ?? []) {
      if (/\n/.test(block.replace(/^<p>|<\/p>$/g, '').trim()) && !/<br\s*\/?>/.test(block)) {
        p.push('een <p> met meerdere regels moet <br> gebruiken; een echte nieuwe regel doet niets in HTML');
        break;
      }
    }
    // At least three roman markers, or the alinea-verwijzende vragen have nothing to point at.
    const markers = (u.body_html ?? '').match(/<strong>\s*(I|II|III|IV|V|VI)\s*<\/strong>/g) ?? [];
    if (markers.length < 4) p.push(`er zijn ${markers.length} alineanummers, er moeten minstens 4 zijn`);

    const qs = u.questions ?? [];
    if (qs.length !== questionCount) p.push(`er zijn ${qs.length} vragen, het moeten ${questionCount} zijn`);
    qs.forEach((q, i) => {
      const at = `vraag ${i + 1}`;
      if (!q.prompt?.trim()) p.push(`${at}: geen vraag`);
      if (!q.explanation?.trim()) p.push(`${at}: geen uitleg`);
      const o = q.options ?? [];
      if (o.length < 3 || o.length > 4) p.push(`${at}: ${o.length} opties, de regel is 3 of 4`);
      if (new Set(o).size !== o.length) p.push(`${at}: twee opties zijn hetzelfde`);
      if (o.some(x => !x?.trim())) p.push(`${at}: een lege optie`);
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= o.length) {
        p.push(`${at}: correct=${q.correct} valt buiten de opties`);
      }
    });
    const counts = {};
    for (const q of qs) counts[q.correct] = (counts[q.correct] ?? 0) + 1;
    const worst = Math.max(0, ...Object.values(counts));
    if (qs.length >= 4 && worst > Math.ceil(qs.length * 0.6)) {
      p.push(`${worst} van de ${qs.length} goede antwoorden staan op dezelfde plek — spreid ze`);
    }
    return p;
  }

  return {
    key,
    system: B1_REGISTER,
    prompt,
    schema: LEZEN_SCHEMA,
    validate,
    maxTokens: 20000,
    /** Fold the plan's fixed facts back in — the model is never asked to pick the tekstsoort. */
    finish: u => ({ section, ...u }),
  };
}

/* ── Schrijven: de acht zin-afmaakopdrachten ─────────────────────────────── */

const COMPLETION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'prompt_html', 'greeting', 'closing', 'model_answer'],
        properties: {
          title: { type: 'string' },
          prompt_html: { type: 'string', description: 'De situatie, twee tot drie zinnen, in <p>.' },
          email_to: { type: 'string' },
          email_subject: { type: 'string' },
          greeting: {
            type: 'string',
            description: 'De gegeven tekst vóór het gat, eindigend op een onafgemaakte zin met …',
          },
          closing: { type: 'string', description: 'De gegeven tekst ná het gat, met de afsluiting.' },
          model_answer: { type: 'string' },
        },
      },
    },
  },
};

export function schrijvenCompletionUnit({ examNumber, plan }) {
  const key = `schrijven-${String(examNumber).padStart(2, '0')}-completions`;
  const lines = plan
    .map(([medium, subject], i) => `${i + 1}. [${medium}] ${subject}`)
    .join('\n');

  const prompt = `
Schrijf de acht korte opdrachten ("maak de zin af") van oefenexamen ${examNumber}, onderdeel
Schrijven, niveau B1. Bij elke opdracht krijgt de kandidaat een al half geschreven bericht en
maakt hij de onafgemaakte zin af, in twee of drie regels.

DE ACHT OPDRACHTEN, in deze volgorde:
${lines}

Per opdracht lever je:
- title: een korte kop van twee tot vier woorden, zoals het onderwerp van het bericht.
- prompt_html: de situatie in twee of drie zinnen, in <p>-tags, in de u-vorm gericht tot de
  kandidaat ("U werkt bij…", "U volgt de opleiding…"). Zeg wie de kandidaat is, aan wie hij
  schrijft en waarom. Zeg NIET wat hij moet opschrijven — dat is precies de opgave.
- Bij [mail]: email_to en email_subject. Het adres is verzonnen en past bij de situatie
  (bijvoorbeeld info@meubelhuis-koster.nl). Laat email_to en email_subject weg bij [bericht];
  dat is een bericht op een website of een intranet en heeft geen adresregels.
- greeting: de gegeven tekst vóór het gat. Dus de aanhef, en daarna één of twee volledige
  zinnen die de situatie opzetten, en dan het begin van de zin die de kandidaat afmaakt.
  Die laatste zin breekt af op een natuurlijk punt en eindigt op een liggend puntje: …
  Voorbeeld van de vorm: "Beste mevrouw De Wit,\\n\\nVorige week heb ik uw folder ontvangen.
  Ik wil graag meer weten over de cursus, want …"
  Het afgebroken punt moet de kandidaat dwingen tot inhoud, niet tot één woord.
- closing: de gegeven tekst ná het gat: één afsluitende zin of vraag, en dan de afsluiting.
  Bijvoorbeeld: "Ik hoor graag van u.\\n\\nMet vriendelijke groet,"
- model_answer: wat een kandidaat die het goed doet zou schrijven — twee of drie zinnen die
  precies in het gat passen. De aanhef en de afsluiting staan er NIET in; alleen het gat.

Let op:
- De aanhef past bij de relatie: 'Geachte heer, mevrouw,' of 'Beste meneer Van Dijk,' bij
  formeel, 'Hoi Samira,' of 'Beste collega's,' bij informeel. De u/je-vorm in de rest van het
  bericht past daarbij.
- Alle acht opdrachten samen moeten verschillende situaties zijn: verschillende afzenders,
  verschillende doelen (vragen, uitleggen, aankondigen, overtuigen, weigeren, bedanken).
- Gebruik in prompt_html alleen ${ALLOWED_HTML}.
- greeting en closing zijn platte tekst met \\n voor een regeleinde, geen HTML.
`.trim();

  function validate(u) {
    const p = [];
    const tasks = u.tasks ?? [];
    if (tasks.length !== 8) p.push(`er zijn ${tasks.length} opdrachten, het moeten 8 zijn`);
    tasks.forEach((t, i) => {
      const at = `opdracht ${i + 1}`;
      const medium = plan[i]?.[0];
      if (!t.title?.trim()) p.push(`${at}: geen title`);
      if (!t.prompt_html?.trim()) p.push(`${at}: geen prompt_html`);
      if (!t.model_answer?.trim()) p.push(`${at}: geen model_answer`);
      if (!t.greeting?.trim()) p.push(`${at}: geen greeting`);
      if (!t.closing?.trim()) p.push(`${at}: geen closing`);
      if (t.greeting && !/…\s*$|\.\.\.\s*$/.test(t.greeting)) {
        p.push(`${at}: greeting moet eindigen op een liggend puntje (…), want daar begint het gat`);
      }
      if (medium === 'mail' && !t.email_to?.trim()) p.push(`${at}: een [mail] heeft email_to nodig`);
      if (medium === 'bericht' && (t.email_to || t.email_subject)) {
        p.push(`${at}: een [bericht] heeft geen adresregels — laat email_to en email_subject weg`);
      }
      if (/<(h[1-6]|div|span|script|img)\b/i.test(t.prompt_html ?? '')) {
        p.push(`${at}: prompt_html mag alleen ${ALLOWED_HTML} gebruiken`);
      }
    });
    const titles = tasks.map(t => t.title);
    if (new Set(titles).size !== titles.length) p.push('twee opdrachten hebben dezelfde title');
    return p;
  }

  return {
    key,
    system: B1_REGISTER,
    prompt,
    schema: COMPLETION_SCHEMA,
    validate,
    maxTokens: 16000,
    finish: u => u.tasks.map(t => ({ task_type: 'sentence_completion', ...t })),
  };
}

/* ── Schrijven: de vier lange opdrachten ─────────────────────────────────── */

const LONG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'prompt_html', 'model_answer'],
  properties: {
    title: { type: 'string' },
    prompt_html: { type: 'string' },
    bullet_points: { type: 'array', items: { type: 'string' } },
    email_to: { type: 'string' },
    email_subject: { type: 'string' },
    greeting: { type: 'string' },
    closing: { type: 'string' },
    model_answer: { type: 'string' },
    image_queries: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['query', 'caption'],
        properties: { query: { type: 'string' }, caption: { type: 'string' } },
      },
    },
    form_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['sections'],
      properties: {
        sections: {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['heading', 'rows'],
      properties: {
        heading: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['kind', 'label'],
            properties: {
              kind: { type: 'string', enum: ['text', 'choice', 'static'] },
              label: { type: 'string' },
              placeholder: { type: 'string' },
              prefill: { type: 'string' },
              value: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              multiple: { type: 'boolean' },
            },
          },
        },
      },
    },
        },
      },
    },
  },
};

const LONG_GUIDANCE = {
  email: `Een volledige e-mail. Geef email_to, email_subject, greeting (alleen de aanhef) en
closing (alleen 'Met vriendelijke groet,'). De kandidaat schrijft de hele body.`,
  letter: `Een brief of een briefje. Geen e-mailadressen. Zet in prompt_html het adresblok of de
context (bij een sollicitatie: aan wie, op welk adres; bij een buurtbriefje: waar het wordt
bezorgd). greeting is de aanhef, closing is de afsluiting.`,
  form: `Een formulier of vragenlijst met vijf of zes OPEN vragen, elk met een vraag én een
"leg ook uit waarom"-deel, plus twee of drie ingevulde of aan te vinken regels bovenaan
(naam, e-mailadres, of een keuze). Vul form_schema: elke open vraag is een rij met
kind 'text', een keuze is kind 'choice' met options, en een al gegeven gegeven is kind
'static' met value. Geef GEEN bullet_points — de vragen in het formulier zijn de opdracht.
model_answer bevat per vraag een goed antwoord, met het nummer van de vraag ervoor.`,
  picture_report: `Een verslag dat op drie plaatjes gebaseerd is. Vul image_queries met precies
drie zoekopdrachten in het ENGELS voor een fotobank (bijvoorbeeld "bicycle repair workshop
mechanic"), elk met een Nederlandse caption van twee tot vier woorden. De drie plaatjes
samen vertellen de dag of het proces in de juiste volgorde. Zet in prompt_html dat de
kandidaat alle plaatjes moet gebruiken, en dat de plaatjes niet bij het verslag komen, dus
dat de tekst zonder de plaatjes te begrijpen moet zijn.`,
  data_text: `Een tekst die op cijfers gebaseerd is. Zet in prompt_html een echte <table> met
een kop en vier tot zes rijen met plausibele getallen of percentages — dat is de tabel waar
de kandidaat mee moet werken. Zeg in prompt_html dat de tabel bij de tekst komt en dat de
tekst er goed bij moet passen.`,
};

/**
 * One long opdracht — opdracht 9, 10, 11 or 12.
 *
 * **One call per opdracht, not one per exam.** The four were originally asked for together and
 * it did not work: each category has its own shape rule (a formulier needs 5–6 open vragen, a
 * data_text needs a <table>, a picture_report needs exactly three plaatjes, the rest need 4–6
 * inhoudspunten), and a retry that fixed one reliably broke another. Three attempts never
 * converged. Split up, each call has exactly one shape to satisfy and a retry is targeted at it.
 */
export function schrijvenLongUnit({ examNumber, index, category, subject }) {
  const opdracht = index + 9;
  const key = `schrijven-${String(examNumber).padStart(2, '0')}-o${opdracht}`;

  const prompt = `
Schrijf opdracht ${opdracht} van oefenexamen ${examNumber}, onderdeel Schrijven, niveau B1.
Dit is een lange opdracht: de kandidaat schrijft een hele tekst, niet één zin.

SOORT OPDRACHT: ${category}
ONDERWERP: ${subject}

Wat deze soort opdracht betekent:
${LONG_GUIDANCE[category]}

Lever:
- title: een korte kop van twee tot vier woorden.
- prompt_html: de situatie in <p>-tags, in de u-vorm. Zeg wie de kandidaat is, wat er gebeurd
  is en aan wie hij schrijft. Daarna <p><strong>Opdracht</strong></p> en dan wat er geschreven
  moet worden. Sluit af met een <p> die het DOEL noemt, zo: "Het doel van de tekst is …".
  Dat doel is wat de rubriek beoordeelt, dus het moet er letterlijk staan.
- bullet_points: de inhoudspunten die de kandidaat moet behandelen, elk als één hele zin in de
  u-vorm ("U legt uit waarom u solliciteert. U noemt minimaal twee redenen.").
  ${
    category === 'form'
      ? 'Bij deze soort opdracht geef je GEEN bullet_points.'
      : category === 'data_text'
        ? 'Precies 3, 4 of 5 inhoudspunten. Niet meer.'
        : 'Precies 4, 5 of 6 inhoudspunten. Niet meer dan 6.'
  }
- model_answer: een volledige, goede tekst van een kandidaat op B1-niveau. Dit is de
  exemplarische uitwerking waar de docent en de beoordeling zich op baseren, dus hij behandelt
  alle inhoudspunten, is goed opgebouwd in alinea's, en zit qua taal echt op B1 — niet hoger.
- De kandidaat mag informatie verzinnen; zeg dat in prompt_html waar dat past
  ("U mag de informatie zelf verzinnen.").

Let op:
- Gebruik in prompt_html alleen ${ALLOWED_HTML}. Geen class, style of id.
- Meerdere regels in één <p> — een adres, een ondertekening — scheid je met <br>.
- greeting en closing zijn platte tekst met \\n voor een regeleinde, geen HTML.
`.trim();

  function validate(t) {
    const p = [];
    if (!t.title?.trim()) p.push('geen title');
    if (!t.prompt_html?.trim()) p.push('geen prompt_html');
    if (!t.model_answer?.trim()) p.push('geen model_answer');
    if (/<(h[1-6]|div|span|script|img)\b/i.test(t.prompt_html ?? '')) {
      p.push(`prompt_html mag alleen ${ALLOWED_HTML} gebruiken`);
    }
    if (!/Het doel van de tekst is/i.test(t.prompt_html ?? '')) {
      p.push('prompt_html moet het doel noemen, letterlijk beginnend met "Het doel van de tekst is"');
    }

    const bullets = t.bullet_points ?? [];
    if (category === 'form') {
      if (bullets.length) p.push('een formulier heeft geen bullet_points');
      if (!t.form_schema) p.push('geen form_schema');
      const rows = (t.form_schema?.sections ?? []).flatMap(sec => sec.rows ?? []);
      const open = rows.filter(r => r.kind === 'text');
      if (open.length < 5 || open.length > 6) {
        p.push(`het formulier heeft ${open.length} open vragen (kind 'text'), het moeten precies 5 of 6 zijn`);
      }
    } else if (category === 'data_text') {
      if (bullets.length < 3 || bullets.length > 5) {
        p.push(`${bullets.length} inhoudspunten, het moeten 3, 4 of 5 zijn`);
      }
      if (!/<table/i.test(t.prompt_html ?? '')) p.push('prompt_html moet een <table> met de cijfers bevatten');
    } else {
      if (bullets.length < 4 || bullets.length > 6) {
        p.push(`${bullets.length} inhoudspunten, het moeten 4, 5 of 6 zijn`);
      }
    }

    if (category === 'picture_report') {
      const q = t.image_queries ?? [];
      if (q.length !== 3) p.push(`${q.length} image_queries, het moeten precies 3 zijn`);
      q.forEach((im, k) => {
        if (!im.query?.trim()) p.push(`plaatje ${k + 1} heeft geen query`);
        if (!im.caption?.trim()) p.push(`plaatje ${k + 1} heeft geen caption`);
      });
    } else if (t.image_queries?.length) {
      p.push('alleen een picture_report heeft image_queries');
    }
    if (category === 'email' && !t.email_to?.trim()) p.push('een e-mail heeft email_to nodig');
    if (category === 'letter' && t.email_to) p.push('een brief heeft geen e-mailadres');
    return p;
  }

  return {
    key,
    system: B1_REGISTER,
    prompt,
    schema: LONG_SCHEMA,
    validate,
    maxTokens: 16000,
    finish: t => {
      const { image_queries, ...rest } = t;
      const task = { task_type: category, ...rest };
      if (category === 'picture_report') {
        task.images = (image_queries ?? []).map((im, k) => ({
          slot: `schrijven-${examNumber}-o${opdracht}-p${k + 1}`,
          query: im.query,
          caption: im.caption,
          variant: k,
        }));
      }
      return task;
    },
  };
}

/* ── Spreken ─────────────────────────────────────────────────────────────── */

const SPREKEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'instruction_html', 'tasks'],
  properties: {
    title: { type: 'string' },
    instruction_html: { type: 'string' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'prompt', 'model_answer'],
        properties: {
          title: { type: 'string' },
          prompt: { type: 'string' },
          prompt_spoken: { type: 'string' },
          voice: { type: 'string', enum: ['woman_young', 'woman_older', 'man_young', 'man_older'] },
          model_answer: { type: 'string' },
          image_queries: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['query', 'caption'],
              properties: { query: { type: 'string' }, caption: { type: 'string' } },
            },
          },
        },
      },
    },
  },
};

const USAGE_GUIDANCE = {
  none: `geen plaatje. De kandidaat reageert op de beschreven situatie of geeft zijn mening.
Geef geen image_queries. Spreekt er iemand tegen de kandidaat, geef dan prompt_spoken en voice.`,
  react: `één plaatje, en iemand spreekt de kandidaat aan. Geef precies één image_query, én
prompt_spoken: de letterlijke zin of twee zinnen die die persoon zegt, in het Nederlands, in de
spreektaal die bij die persoon past. Kies ook een voice die bij die persoon hoort: een vrouw
krijgt woman_young of woman_older, een man man_young of man_older. Sluit de prompt af met
"Luister naar … en reageer."`,
  describe: `één plaatje dat de kandidaat moet gebruiken. Geef precies één image_query. Zet in de
prompt "Kijk naar het plaatje." en daarna wat hij moet zeggen.`,
  choose: `twee plaatjes waaruit de kandidaat kiest. Geef precies twee image_queries die echt
vergelijkbaar zijn en een echte keuze opleveren. Zet in de prompt "Kijk naar de twee plaatjes."
en vraag om een keuze mét minimaal twee redenen. Vraagt iemand het advies hardop, geef dan ook
prompt_spoken en voice.`,
  cover_all: `drie plaatjes die samen een programma, een route of een reeks stappen vormen. Geef
precies drie image_queries, in de juiste volgorde. Zet in de prompt "Kijk naar de plaatjes." en
"U moet daarbij alle plaatjes gebruiken." Stelt iemand de vraag hardop — wat bij deze soort
opgave gebruikelijk is — geef dan ook prompt_spoken en voice, en sluit de prompt af met
"U hoort eerst …".`,
};

export function sprekenUnit({ examNumber, deel, plan }) {
  const key = `spreken-${String(examNumber).padStart(2, '0')}-d${deel}`;
  const seconds = deel === 1 ? 20 : 30;
  const lines = plan
    .map(([usage, subject], i) => `${i + 1}. [${usage}] ${subject}\n   ${USAGE_GUIDANCE[usage]}`)
    .join('\n\n');

  const prompt = `
Schrijf deel ${deel} van oefenexamen ${examNumber}, onderdeel Spreken, niveau B1: acht opgaven.

Deel ${deel} betekent: ${
    deel === 1
      ? 'korte antwoorden. Een paar woorden tot twee zinnen is genoeg. De kandidaat heeft twintig seconden spreektijd.'
      : 'langere antwoorden. De kandidaat bouwt een samenhangend antwoord op en heeft dertig seconden spreektijd, met vijftien seconden voorbereiding.'
  }

Lever eerst:
- title: de naam van het deel, dus "Deel ${deel}".
- instruction_html: de instructie die de kandidaat vóór dit deel leest, in <p>- en <ul>-tags,
  in de u-vorm. Zeg hoe lang de antwoorden moeten zijn, dat er ${seconds} seconden spreektijd is,
  ${deel === 2 ? 'dat er vijftien seconden voorbereidingstijd is, ' : ''}en dat er soms plaatjes
  bij een opgave staan die gebruikt moeten worden.
  Schrijf in de instructie NIETS over hoe de oefenomgeving werkt. Dus niet dat een opgave één
  keer te horen is, niet dat het examen automatisch verder gaat, en niet dat de kandidaat niet
  terug kan naar een vorige opgave. In deze oefenomgeving mag hij een fragment zo vaak beluisteren
  als hij wil en wél terug — een instructie die het tegendeel belooft, is onwaar op ons scherm.

DE ACHT OPGAVEN, in deze volgorde:

${lines}

Per opgave lever je:
- title: een korte kop van één tot drie woorden, zoals DUO boven een opgave zet.
- prompt: de hele opgave als platte tekst, met \\n tussen de regels — precies zoals de kandidaat
  hem leest. Eerst twee tot vier korte regels die de situatie neerzetten in de u-vorm ("U werkt
  bij een bakkerij." / "Een collega vraagt om hulp."), dan een lege regel, dan de opdracht in
  één of twee regels ("Vertel uw collega wat hij moet doen." / "Vertel ook waarom u dat vindt.").
- model_answer: wat een kandidaat op B1-niveau in ${seconds} seconden zou kunnen zeggen. Dus
  ${deel === 1 ? 'één tot drie zinnen' : 'vier tot zeven zinnen'}, in spreektaal, niet in
  schrijftaal. Dit is de exemplarische uitwerking voor de beoordeling.
- prompt_spoken: de letterlijke woorden die de andere persoon zegt, als die er is — één of twee
  zinnen spreektaal. Geef dan ook voice: een vrouw krijgt woman_young of woman_older, een man
  man_young of man_older. Laat beide weg als er niemand tegen de kandidaat spreekt.
- image_queries: alleen waar de opgave daarom vraagt, zie hierboven.
  Een image_query is een zoekopdracht in het ENGELS voor een fotobank, met een Nederlandse
  caption van twee tot vier woorden erbij.

Let op:
- Acht verschillende situaties. Niet acht keer op het werk, en niet acht keer een collega.
- De opdracht moet echt spreken uitlokken. "Vertel wat u ervan vindt en waarom" is goed;
  "Zeg ja of nee" is niets.
- Een plaatje moet informatie toevoegen die niet al in de prompt staat. Als de prompt alles
  al zegt, is het plaatje decoratie en dan is de opgave stuk.

CONTROLEER VOORDAT JE ANTWOORDT — dit is de fout die het vaakst gemaakt wordt. Het aantal
image_queries per opgave moet exact dit zijn:
${plan.map(([usage], i) => `  opgave ${i + 1}: ${SPREKEN_IMAGES[usage]} image_quer${SPREKEN_IMAGES[usage] === 1 ? 'y' : 'ies'} (${usage})`).join('\n')}
Een opgave met te weinig image_queries wordt afgekeurd, ook als de tekst goed is.
`.trim();

  function validate(u) {
    const p = [];
    if (!u.title?.trim()) p.push('geen title');
    if (!u.instruction_html?.trim()) p.push('geen instruction_html');
    /*
     * The instruction must not describe a player we do not have. DUO's booklets say a fragment
     * plays once and that you cannot go back; our oefenomgeving allows unlimited replay and
     * back-navigation with editable answers (CLAUDE.md, "Luisteren replays the fragment for every
     * question"). A generated instruction repeating DUO's rule is a false statement about the
     * screen it is printed on — and the kind nobody re-reads once the exam is published.
     */
    const claims = [
      [/\béén keer\b|\b1 keer\b|niet opnieuw|maar eenmaal/i, 'dat een opgave maar één keer te horen is'],
      [/automatisch verder|gaat automatisch/i, 'dat het examen automatisch verder gaat'],
      [/niet terug|kunt u niet terug|geen terug/i, 'dat de kandidaat niet terug kan'],
    ];
    for (const [re, what] of claims) {
      if (re.test(u.instruction_html ?? '')) {
        p.push(`de instructie belooft ${what}; dat is in deze oefenomgeving niet waar — laat het weg`);
      }
    }
    const tasks = u.tasks ?? [];
    if (tasks.length !== 8) p.push(`er zijn ${tasks.length} opgaven, het moeten 8 zijn`);
    tasks.forEach((t, i) => {
      const usage = plan[i]?.[0];
      const at = `opgave ${i + 1} (${usage})`;
      if (!t.title?.trim()) p.push(`${at}: geen title`);
      if (!t.prompt?.trim()) p.push(`${at}: geen prompt`);
      if (!t.model_answer?.trim()) p.push(`${at}: geen model_answer`);
      const need = SPREKEN_IMAGES[usage];
      const q = t.image_queries ?? [];
      if (q.length !== need) p.push(`${at}: ${q.length} image_queries, het moeten precies ${need} zijn`);
      q.forEach((im, k) => {
        if (!im.query?.trim()) p.push(`${at}: plaatje ${k + 1} heeft geen query`);
        if (!im.caption?.trim()) p.push(`${at}: plaatje ${k + 1} heeft geen caption`);
      });
      // `react` is defined by somebody addressing the candidate, so it must have a spoken line.
      // The other shapes *may* have one: DUO's B1 opgaven regularly end "U hoort eerst uw
      // buurvrouw" on a cover_all or choose opgave, where the question is asked aloud and the
      // plaatjes carry the answer. Forbidding it here was wrong about the format, and the model
      // was right — the rule was corrected rather than the content.
      if (usage === 'react' && !t.prompt_spoken?.trim()) {
        p.push(`${at}: geen prompt_spoken — bij een react-opgave spreekt iemand de kandidaat aan`);
      }
      if (t.prompt_spoken?.trim() && !t.voice) p.push(`${at}: geen voice bij prompt_spoken`);
    });
    const titles = tasks.map(t => t.title);
    if (new Set(titles).size !== titles.length) p.push('twee opgaven hebben dezelfde title');
    return p;
  }

  return {
    key,
    system: B1_REGISTER,
    prompt,
    schema: SPREKEN_SCHEMA,
    validate,
    maxTokens: 20000,
    finish: u => ({
      title: u.title,
      instruction_html: u.instruction_html,
      tasks: u.tasks.map((t, i) => {
        const usage = plan[i][0];
        const { image_queries, ...rest } = t;
        return {
          image_usage: usage,
          ...rest,
          images: (image_queries ?? []).map((im, k) => ({
            slot: `spreken-${examNumber}-d${deel}-o${i + 1}-${'abc'[k]}`,
            query: im.query,
            caption: im.caption,
            variant: k,
          })),
        };
      }),
    }),
  };
}
