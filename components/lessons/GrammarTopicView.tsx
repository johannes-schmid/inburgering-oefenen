'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowRight, ChevronDown, PenLine, X } from 'lucide-react';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import LessonStream, { type StreamLabels } from './LessonStream';
import { LessonProgressScope } from './LessonProgressScope';
import VideoEmbed from './VideoEmbed';
import { isExerciseKind, type LessonItem } from './item-helpers';
import type { LessonVisual as VisualSpec } from '@/data/lesson-visuals';

/** Eén les achter het onderwerp, zoals de pagina hem heeft opgehaald — of niet. */
export type TopicPart = {
  ref: string;
  /** `null`: de les bestaat nog niet. */
  lessonId: number | null;
  title: string | null;
  pending: boolean;
  items: LessonItem[];
  visual: VisualSpec | null;
  exercises: number;
};

export type TopicViewLabels = {
  partsAria: string;
  notWritten: string;
  notWrittenSub: string;
  pending: string;
  videoPlay: string;
  videoSoon: string;
  videoSoonSub: string;
  uitlegHead: string;
  uitlegSub: string;
  close: string;
  nextKick: string;
  /** De oefenkaart onder de uitleg en het venster erboven (Glas §G5). */
  practiceHead: string;
  practiceCtaHead: string;
  /** "{n} opgaven" — de client vult `{n}` in. */
  practiceCtaSub: string;
  practiceStart: string;
};

/**
 * Een voorbeeldregel uit de syllabus als losse sleutelwoorden of zinnen.
 *
 * Twee vormen staan er in de opzet: een woordrij ("goedkoper dan, beter, het best") en zinnen
 * ("Ik blijf thuis omdat ik ziek ben."). Een woordrij wordt een rij chips; zinnen blijven één
 * regel tekst, want een zin in een chip leest als een knop.
 */
function exampleParts(line: string): { sentences: boolean; parts: string[] } {
  const trimmed = line.trim();
  const sentences = /[.?!…]/.test(trimmed.replace(/€\s?\d+[,.]\d+/g, ''));
  if (sentences) {
    return { sentences, parts: trimmed.split(/(?<=[.?!…])\s+(?=\S)/).filter(Boolean) };
  }
  /* Een komma zonder spatie erachter is een decimaalteken (€ 4,50), geen scheiding. */
  return { sentences, parts: trimmed.split(/\s*;\s*|,\s+/).filter(Boolean) };
}

/**
 * De les en het grammaticaonderwerp in Glas (§G5): **eerst leren, dan oefenen in een venster.**
 *
 * ── DE OPBOUW ────────────────────────────────────────────────────────────────
 * Eén witte lespagina: bovenin een mistbalk met het kruimelpad, dan het merk, de titel, het
 * leerdoel en de sleutelwoorden. Daaronder de ingesproken uitleg (als die er is) en de uitleg
 * zelf — lezen en luisteren, niets invullen. Onderaan één donkere kaart "Oefen wat je net
 * leerde" met één knop. De opgaven openen in een eigen venster bóven de les, één tegelijk.
 * Sluit je het venster, dan sta je weer precies in de uitleg.
 *
 * ── WAAROM HET OMGEDRAAID IS ─────────────────────────────────────────────────
 * Tot 14-10 opende de pagina op de opgave en zat de uitleg achter een pop-up (eigenaar, 10-10).
 * Glas v1.0 (goedgekeurd 14-10, later) draait dat om naar het Coursera-patroon: de uitleg is
 * rustig en blijft staan, de oefening krijgt een eigen ruimte. "Leren is rustiger dan toetsen."
 *
 * ── HET VENSTER BLIJFT GEMONTEERD ────────────────────────────────────────────
 * `keepMounted`: een half ingevulde opgave is er nog als je het venster sluit om de regel terug
 * te lezen, en de antwoorden van deze sessie ook. Base UI houdt de focus in het venster, Escape
 * en de achtergrond sluiten het, en de focus gaat terug naar de knop die het opende. Geopend of
 * gesloten met het toetsenbord beweegt het niet (G6).
 *
 * ── ALLE ZESTIEN SOORTEN ─────────────────────────────────────────────────────
 * Het venster toont `LessonStream part="oefenen"`, dus elke opgavesoort draait daar met zijn
 * eigen renderer, ook `naspreken` en `opnemen` (de microfoon werkt in een dialoog net zo). Het
 * materiaal waar een opgave over gaat — een fragment, een leestekst — staat in het venster bóven
 * die opgave (`sourcesOf` in de stroom), zodat een luistervraag niet zonder zijn fragment staat.
 * Het materiaal zelf staat ook in de uitleg op de pagina.
 *
 * ── DE VOORTGANG BLIJFT PER LES ──────────────────────────────────────────────
 * Elke les is een eigen `LessonStream` met een eigen `lessonId` en een eigen
 * `LessonProgressScope`. Alle lessen blijven gemonteerd en alleen de gekozen staat in beeld.
 */
export default function GrammarTopicView({
  crumbs, kicker = null, category = 'taalregels', title, learn, examples = '', links = [], video,
  before = null, parts, next, streamLabels, labels,
}: {
  crumbs: React.ReactNode;
  /** De plaats van de les, zoals "C1 · Examenuitleg". Staat in de balk, niet boven de titel. */
  kicker?: string | null;
  /** Het merk naast de titel. */
  category?: Category;
  title: string;
  learn: string;
  examples?: string;
  /** Sleutelwoorden die ergens heen wijzen — de taalregels van een les. */
  links?: { label: string; href: string }[];
  /** `null`: dit onderwerp heeft geen video. Een video zonder URL is `{ url: null }`. */
  video: { url: string | null; title: string; duration: string } | null;
  /** De ingesproken uitleg van een les, met het lesblok erin. Is hij er, dan klapt de geschreven uitleg in. */
  before?: React.ReactNode;
  parts: TopicPart[];
  next: { href: string; title: string };
  streamLabels: StreamLabels;
  labels: TopicViewLabels;
}) {
  const [at, setAt] = useState(0);
  const many = parts.length > 1;
  const pending = parts.some(p => p.lessonId !== null && p.pending);
  const ex = exampleParts(examples);

  return (
    <div className="gl-view">
      <article className="gl-page">
        <div className="gl-bar">
          <div className="gl-crumbs">{crumbs}</div>
          {kicker && <span className="g-mono gl-bar-tag">{kicker}</span>}
        </div>

        <div className="gl-in">
          <header className="gl-head">
            <CategoryMark category={category} size={44} />
            <h1 className="g-head gl-title">{title}</h1>
            {learn && <p className="gl-learn">{learn}</p>}
            {ex.parts.length > 0 && (ex.sentences
              ? <p className="gl-sents">{ex.parts.join(' ')}</p>
              : (
                <ul className="gl-keys">
                  {ex.parts.map((w, i) => <li key={i}><span>{w}</span></li>)}
                </ul>
              ))}
            {links.length > 0 && (
              <ul className="gl-keys">
                {links.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
              </ul>
            )}
            {pending && <p className="gl-pending">{labels.pending}</p>}
          </header>

          {video && (
            <figure className="gl-video">
              <VideoEmbed
                url={video.url}
                title={video.title}
                meta={null}
                labels={{ play: labels.videoPlay, soon: labels.videoSoon, soonSub: labels.videoSoonSub }}
              />
              <figcaption>
                <b>{video.title}</b>
                {video.duration && <span className="g-mono">{video.duration}</span>}
              </figcaption>
            </figure>
          )}

          {many && (
            <div className="gl-parts" role="tablist" aria-label={labels.partsAria}>
              {parts.map((p, i) => (
                <button
                  key={p.ref}
                  type="button"
                  role="tab"
                  id={`gl-tab-${i}`}
                  aria-selected={i === at}
                  aria-controls={`gl-panel-${i}`}
                  tabIndex={i === at ? 0 : -1}
                  onClick={() => setAt(i)}
                  onKeyDown={e => {
                    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                    if (!dir) return;
                    e.preventDefault();
                    const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
                    const n = (i + dir * rtl + parts.length) % parts.length;
                    setAt(n);
                    document.getElementById(`gl-tab-${n}`)?.focus();
                  }}
                >
                  <span className="gl-parts-n" aria-hidden>{i + 1}</span>
                  <span>{p.title ?? labels.notWritten}</span>
                </button>
              ))}
            </div>
          )}

          {before}

          {parts.map((p, i) => (
            <div
              key={p.ref}
              id={many ? `gl-panel-${i}` : undefined}
              role={many ? 'tabpanel' : undefined}
              aria-labelledby={many ? `gl-tab-${i}` : undefined}
              hidden={i !== at}
            >
              <PartBody
                part={p}
                category={category}
                folded={before !== null && before !== false && before !== undefined}
                streamLabels={streamLabels}
                labels={labels}
              />
            </div>
          ))}
        </div>
      </article>

      <a href={next.href} className="gl-next">
        <span className="gl-next-copy">
          <span className="g-mono">{labels.nextKick}</span>
          <b>{next.title}</b>
        </span>
        <span className="gl-next-go" aria-hidden>
          <ArrowRight size={18} strokeWidth={2.4} className="rtl-flip" />
        </span>
      </a>
    </div>
  );
}

const SOURCE_KINDS: ReadonlySet<string> = new Set(['audio', 'leestekst', 'woordenlijst', 'zinnenbank']);

/** De uitleg van één les op de pagina, en de oefenkaart die het venster opent. */
function PartBody({
  part, category, folded, streamLabels, labels,
}: {
  part: TopicPart;
  category: Category;
  /** Er staat een ingesproken uitleg boven: de geschreven uitleg klapt dan in. */
  folded: boolean;
  streamLabels: StreamLabels;
  labels: TopicViewLabels;
}) {
  const hasLearn = useMemo(() => part.items.some(i => !isExerciseKind(i.kind)), [part.items]);

  if (part.lessonId === null) {
    return (
      <div className="gl-unwritten">
        <span className="gl-unwritten-ic" aria-hidden><PenLine size={16} strokeWidth={2.4} /></span>
        <span>
          <b>{labels.notWritten}</b>
          <span>{labels.notWrittenSub}</span>
        </span>
      </div>
    );
  }

  const stream = (
    <LessonProgressScope>
      <LessonStream
        lessonId={part.lessonId}
        items={part.items}
        /* Het lesblok van de ingesproken uitleg toont het plaatje al. */
        visual={folded ? null : part.visual}
        part="uitleg"
        layout="page"
        labels={streamLabels}
      />
    </LessonProgressScope>
  );

  return (
    <>
      {hasLearn && (folded
        ? (
          <details className="gl-fold">
            <summary>
              <span>
                <b>{labels.uitlegHead}</b>
                <small>{labels.uitlegSub}</small>
              </span>
              <ChevronDown size={18} strokeWidth={2.4} className="gl-fold-chev" aria-hidden />
            </summary>
            <div className="gl-fold-body">{stream}</div>
          </details>
        )
        : <section className="gl-learnbody" aria-label={labels.uitlegHead}>{stream}</section>)}

      {part.exercises > 0 && (
        <PracticeDialog part={part} category={category} streamLabels={streamLabels} labels={labels} />
      )}
    </>
  );
}

/**
 * "Oefen wat je net leerde" en het venster met de opgaven.
 *
 * Opent ook vanzelf als de pagina met `#oefenen` binnenkomt — het oude anker van de
 * opgavensectie, zodat een bewaarde link nog naar de opgaven gaat.
 */
function PracticeDialog({
  part, category, streamLabels, labels,
}: {
  part: TopicPart;
  category: Category;
  streamLabels: StreamLabels;
  labels: TopicViewLabels;
}) {
  const [open, setOpen] = useState(false);
  /* Toetsenbord opent en sluit zonder beweging (G6). */
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (window.location.hash !== '#oefenen') return;
    const id = window.setTimeout(() => { setInstant(true); setOpen(true); }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const sub = labels.practiceCtaSub.replace('{n}', String(part.exercises));
  /* Opgaven met een leestekst of fragment krijgen een breed venster: de bron links, de vraag
     rechts — zoals de examenspeler, zodat de vraag niet onder een lange tekst verdwijnt. */
  const wide = part.items.some(i => SOURCE_KINDS.has(i.kind));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next, details) => {
        const ev = details.event as Event | undefined;
        const keyboard = details.reason === 'escape-key'
          || (typeof KeyboardEvent !== 'undefined' && ev instanceof KeyboardEvent)
          || (typeof MouseEvent !== 'undefined' && ev instanceof MouseEvent && ev.detail === 0);
        setInstant(keyboard);
        setOpen(next);
      }}
    >
      <div className="gl-go g-field g-f-nacht-stil">
        <div className="gl-go-copy">
          <b>{labels.practiceCtaHead}</b>
          <small>{sub}</small>
        </div>
        <Dialog.Trigger className="g-btn g-btn-wit">
          {labels.practiceStart}
          <ArrowRight size={16} strokeWidth={2.4} className="rtl-flip" aria-hidden />
        </Dialog.Trigger>
      </div>

      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className={`gl-dlg-bd${instant ? ' is-instant' : ''}`} />
        <Dialog.Popup className={`gl-dlg g-leer${wide ? ' is-wide' : ''}${instant ? ' is-instant' : ''}`}>
          <div className="gl-dlg-h">
            <CategoryMark category={category} size={36} />
            <div className="gl-dlg-t">
              <Dialog.Title className="gl-dlg-title">
                {labels.practiceHead}{part.title ? ` · ${part.title}` : ''}
              </Dialog.Title>
              <Dialog.Description className="gl-dlg-sub">{sub}</Dialog.Description>
            </div>
            <Dialog.Close className="g-btn g-btn-ghost g-btn-sm g-btn-icon gl-dlg-x" aria-label={labels.close}>
              <X size={18} strokeWidth={2.4} aria-hidden />
            </Dialog.Close>
          </div>
          <div className="gl-dlg-b">
            <LessonProgressScope>
              <LessonStream
                lessonId={part.lessonId!}
                items={part.items}
                part="oefenen"
                layout="topic"
                labels={streamLabels}
              />
            </LessonProgressScope>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
