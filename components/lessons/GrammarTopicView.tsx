'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, ChevronRight, ListChecks, PenLine, SquarePlay } from 'lucide-react';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import LessonStream, { type StreamLabels } from './LessonStream';
import { LessonProgressScope } from './LessonProgressScope';
import VideoEmbed from './VideoEmbed';
import { isExerciseKind, type LessonItem } from './item-helpers';
import type { LessonVisual as VisualSpec } from '@/data/lesson-visuals';
import type { LessonStep } from './GrammarCourseSide';

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
  nextKick: string;
  kindVideo: string;
  kindUitleg: string;
  kindOpdracht: string;
  /** "8 opgaven", al ingevuld met het totaal van alle delen. */
  exercises: string;
  stepsAria: string;
  backVideo: string;
  backUitleg: string;
  handoffKick: string;
  handoffStart: string;
  explainKick: string;
  explainTitle: string;
  barNext: string;
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
 * De les en het grammaticaonderwerp in Glas, in twee stappen (eigenaar, 15-10, naar Coursera):
 * **eerst de video of de uitleg, dan de opdracht** — elk op een eigen adres en als eigen rij in
 * de cursusroute.
 *
 * ── DE TWEE STAPPEN ──────────────────────────────────────────────────────────
 * De uitlegstap is de witte lespagina: kop, video, ingesproken uitleg, de uitleg zelf, en
 * onderaan één donkere kaart naar de opdracht. De opdrachtstap (`?stap=opdracht`) zet de opgaven
 * op de pagina, één tegelijk, met het materiaal van een opgave ernaast — wat tot 15-10 in een
 * venster bóven de uitleg stond. "Dan staat er zoveel op één pagina" was de reden: een video die
 * je helemaal kunt bekijken, en een opdracht die een eigen plek heeft.
 *
 * Een les zonder opgaven heeft maar één stap; `?stap=opdracht` valt daar terug op de uitleg.
 * Een oude link met `#oefenen` gaat naar de opdrachtstap.
 *
 * ── DE VOORTGANG BLIJFT PER LES ──────────────────────────────────────────────
 * Elke les is een eigen `LessonStream` met een eigen `lessonId` en een eigen
 * `LessonProgressScope`. Alle delen blijven gemonteerd en alleen het gekozen deel staat in beeld.
 */
export default function GrammarTopicView({
  crumbs, kicker = null, category = 'taalregels', title, learn, examples = '', links = [], video,
  before = null, parts, next, streamLabels, labels, step, href,
}: {
  crumbs: React.ReactNode;
  /** De plaats van de les, zoals "C1 · Examenuitleg". Staat in de balk als er geen opdracht is. */
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
  step: LessonStep;
  /** Het adres van deze pagina, met locale, zonder `?stap`. */
  href: string;
}) {
  const [at, setAt] = useState(0);
  const many = parts.length > 1;
  const pending = parts.some(p => p.lessonId !== null && p.pending);
  const ex = exampleParts(examples);
  const total = parts.reduce((n, p) => n + (p.lessonId === null ? 0 : p.exercises), 0);
  const split = total > 0;
  const onTask = split && step === 'opdracht';
  /* Onder een video staat onze eigen uitleg als apart deel, met ruimte erboven (eigenaar, 15-10). */
  const explainHead = !onTask && !!video;
  const taskHref = `${href}?stap=opdracht`;
  const hasVideo = !!video?.url;
  const FirstIcon = hasVideo ? SquarePlay : BookOpen;
  const firstLabel = hasVideo ? labels.kindVideo : labels.kindUitleg;

  useEffect(() => {
    if (split && !onTask && window.location.hash === '#oefenen') window.location.replace(taskHref);
  }, [split, onTask, taskHref]);

  const barNext = split && !onTask ? taskHref : next.href;
  const tag = split
    ? onTask
      ? `${labels.kindOpdracht} · ${labels.exercises}`
      : hasVideo && video?.duration ? `${labels.kindVideo} · ${video.duration}` : firstLabel
    : kicker;

  return (
    <div className="gl-view">
      <article className="gl-page">
        <div className="gl-bar">
          <div className="gl-crumbs">{crumbs}</div>
          {tag && <span className="g-mono gl-bar-tag">{tag}</span>}
          <a href={barNext} className="gl-bar-next">
            {labels.barNext}
            <ChevronRight size={16} strokeWidth={2.4} className="rtl-flip" aria-hidden />
          </a>
        </div>

        <div className="gl-in">
          {/* Onder de breedte van de cursusroute: de twee stappen als schakelaar in de pagina. */}
          {split && (
            <nav className="gl-steps" aria-label={labels.stepsAria}>
              <a href={href} className={onTask ? undefined : 'is-on'} aria-current={onTask ? undefined : 'page'}>
                <FirstIcon size={15} strokeWidth={2.2} aria-hidden />{firstLabel}
              </a>
              <a href={taskHref} className={onTask ? 'is-on' : undefined} aria-current={onTask ? 'page' : undefined}>
                <ListChecks size={15} strokeWidth={2.2} aria-hidden />{labels.kindOpdracht}
              </a>
            </nav>
          )}

          {onTask
            ? (
              <header className="gl-head gl-taskhead">
                <h1 className="g-head gl-title">{title}</h1>
                <a href={href} className="gl-stepback">
                  <FirstIcon size={15} strokeWidth={2.2} aria-hidden />
                  {hasVideo ? labels.backVideo : labels.backUitleg}
                </a>
                {pending && <p className="gl-pending">{labels.pending}</p>}
              </header>
            )
            : (
              /* Alleen het merk en de titel (een woordenles): dan staan ze naast elkaar (eigenaar,
                 15-10) — een losse tegel boven één regel titel leest als een gat. */
              <header className={`gl-head${!learn && ex.parts.length === 0 && links.length === 0 && !pending ? ' is-row' : ''}`}>
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
            )}

          {!onTask && video && (
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

          {explainHead && (
            <header className="gl-explain-head">
              <span className="gl-explain-ic" aria-hidden><BookOpen size={17} strokeWidth={2.2} /></span>
              <span>
                <small className="g-mono">{labels.explainKick}</small>
                <h2 className="g-head">{labels.explainTitle}</h2>
              </span>
            </header>
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

          {!onTask && before}

          {parts.map((p, i) => (
            <div
              key={p.ref}
              id={many ? `gl-panel-${i}` : undefined}
              role={many ? 'tabpanel' : undefined}
              aria-labelledby={many ? `gl-tab-${i}` : undefined}
              hidden={i !== at}
            >
              {onTask
                ? <PartTask part={p} streamLabels={streamLabels} labels={labels} />
                : (
                  <PartBody
                    part={p}
                    folded={before !== null && before !== false && before !== undefined}
                    streamLabels={streamLabels}
                    labels={labels}
                  />
                )}
            </div>
          ))}

          {split && !onTask && (
            <a href={taskHref} className="gl-go g-field g-f-nacht-stil gl-handoff">
              <span className="gl-go-copy">
                <small className="g-mono gl-handoff-k">{labels.handoffKick}</small>
                <b>{labels.kindOpdracht}: {title}</b>
                <small>{labels.exercises}</small>
              </span>
              <span className="g-btn g-btn-wit">
                {labels.handoffStart}
                <ArrowRight size={16} strokeWidth={2.4} className="rtl-flip" aria-hidden />
              </span>
            </a>
          )}
        </div>
      </article>

      {(onTask || !split) && (
        <a href={next.href} className="gl-next">
          <span className="gl-next-copy">
            <span className="g-mono">{labels.nextKick}</span>
            <b>{next.title}</b>
          </span>
          <span className="gl-next-go" aria-hidden>
            <ArrowRight size={18} strokeWidth={2.4} className="rtl-flip" />
          </span>
        </a>
      )}
    </div>
  );
}

/* Zelfde lijst als in `LessonStream`: de woordenlijst is geen bron bij de opgaven. */
const SOURCE_KINDS: ReadonlySet<string> = new Set(['audio', 'leestekst', 'zinnenbank']);

function Unwritten({ labels }: { labels: TopicViewLabels }) {
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

/** De uitleg van één les op de pagina. */
function PartBody({
  part, folded, streamLabels, labels,
}: {
  part: TopicPart;
  /** Er staat een ingesproken uitleg boven: de geschreven uitleg klapt dan in. */
  folded: boolean;
  streamLabels: StreamLabels;
  labels: TopicViewLabels;
}) {
  const hasLearn = useMemo(() => part.items.some(i => !isExerciseKind(i.kind)), [part.items]);

  if (part.lessonId === null) return <Unwritten labels={labels} />;
  if (!hasLearn) return null;

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

  return folded
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
    : <section className="gl-learnbody" aria-label={labels.uitlegHead}>{stream}</section>;
}

/**
 * De opgaven van één les op de pagina, één tegelijk (`layout="topic"`). Het materiaal waar een
 * opgave over gaat staat erbij (`sourcesOf` in de stroom); is er zulk materiaal, dan staat het
 * vanaf 960px links en de vraag rechts, zoals in de examenspeler.
 */
function PartTask({ part, streamLabels, labels }: { part: TopicPart; streamLabels: StreamLabels; labels: TopicViewLabels }) {
  if (part.lessonId === null) return <Unwritten labels={labels} />;
  if (part.exercises === 0) return null;
  const wide = part.items.some(i => SOURCE_KINDS.has(i.kind));
  return (
    <section className={`gl-task${wide ? ' is-wide' : ''}`} aria-label={labels.kindOpdracht}>
      <LessonProgressScope>
        <LessonStream
          lessonId={part.lessonId}
          items={part.items}
          part="oefenen"
          layout="topic"
          labels={streamLabels}
        />
      </LessonProgressScope>
    </section>
  );
}
