'use client';

import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowRight, Lightbulb, PenLine, X } from 'lucide-react';
import LessonStream, { type StreamLabels } from './LessonStream';
import { LessonProgressScope } from './LessonProgressScope';
import VideoEmbed from './VideoEmbed';
import type { LessonItem } from './item-helpers';
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
  noExercises: string;
  videoPlay: string;
  videoSoon: string;
  videoSoonSub: string;
  uitlegHead: string;
  uitlegSub: string;
  openUitleg: string;
  close: string;
  nextKick: string;
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
 * Het grammaticaonderwerp, naar de schets van de eigenaar (10-10).
 *
 * ── DE OPBOUW ────────────────────────────────────────────────────────────────
 * Een navy kop met het kruimelpad, de titel, het leerdoel, de sleutelwoorden en de video. Heeft
 * het onderwerp meer dan één les, dan kies je eronder de les ("1 · hij, daar, deze…"). Daaronder
 * de opgaven van die les in één witte kaart, met rechts twee kaarten: de uitleg, die als pop-up
 * opent, en de volgende les. Op een telefoon staat de uitlegkaart boven de opgaven.
 *
 * ── WAAROM DE UITLEG EEN POP-UP IS ───────────────────────────────────────────
 * Besluit eigenaar. De pagina opent op wat je doet — de opgave — en de regel is één tik weg. De
 * pop-up is een `Dialog` van Base UI: focus zit erin vast, Escape en de achtergrond sluiten hem.
 *
 * ── DE VOORTGANG BLIJFT PER LES ──────────────────────────────────────────────
 * Elke les is een eigen `LessonStream` met een eigen `lessonId` en een eigen
 * `LessonProgressScope`. Alle lessen blijven gemonteerd en alleen de gekozen staat in beeld: een
 * half ingevulde opgave verdwijnt niet als je even naar de andere les kijkt.
 */
export default function GrammarTopicView({
  crumbs, title, learn, examples, video, parts, next, streamLabels, labels,
}: {
  crumbs: React.ReactNode;
  title: string;
  learn: string;
  examples: string;
  /** `null`: dit onderwerp heeft geen video. Een video zonder URL is `{ url: null }`. */
  video: { url: string | null; title: string; duration: string } | null;
  parts: TopicPart[];
  next: { href: string; title: string };
  streamLabels: StreamLabels;
  labels: TopicViewLabels;
}) {
  const [at, setAt] = useState(0);
  const many = parts.length > 1;
  const pending = parts.some(p => p.lessonId !== null && p.pending);
  const current = parts[at] ?? parts[0];
  const ex = exampleParts(examples);

  return (
    <div className="gt-view">
      <section className={`gh${video ? '' : ' is-solo'}`}>
        <div className="gh-copy">
          <div className="gh-crumbs">{crumbs}</div>
          <h1 className="gh-title">{title}</h1>
          <p className="gh-learn">{learn}</p>
          {ex.sentences
            ? <p className="gh-sents">{ex.parts.join(' ')}</p>
            : (
              <ul className="gh-chips">
                {ex.parts.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          {pending && (
            <p className="gh-pending"><i aria-hidden />{labels.pending}</p>
          )}
        </div>
        {video && (
          <figure className="gh-video">
            <VideoEmbed
              url={video.url}
              title={video.title}
              meta={null}
              labels={{ play: labels.videoPlay, soon: labels.videoSoon, soonSub: labels.videoSoonSub }}
            />
            <figcaption>
              <b>{video.title}</b>
              {video.duration && <span>{video.duration}</span>}
            </figcaption>
          </figure>
        )}
      </section>

      {many && (
        <div className="gp-tabs" role="tablist" aria-label={labels.partsAria}>
          {parts.map((p, i) => (
            <button
              key={p.ref}
              type="button"
              role="tab"
              aria-selected={i === at}
              className={i === at ? 'is-on' : undefined}
              onClick={() => setAt(i)}
            >
              <span className="gp-n" aria-hidden>{i + 1}</span>
              <span>{p.title ?? labels.notWritten}</span>
            </button>
          ))}
        </div>
      )}

      <div className="gx-grid">
        {current.lessonId !== null && (
          <UitlegCard part={current} streamLabels={streamLabels} labels={labels} />
        )}

        <div className="gx-main">
          {parts.map((p, i) => (
            <div key={p.ref} hidden={i !== at} role={many ? 'tabpanel' : undefined}>
              {p.lessonId === null
                ? (
                  <div className="gt-unwritten">
                    <span className="gt-unwritten-ic" aria-hidden><PenLine size={16} strokeWidth={2.4} /></span>
                    <span>
                      <b>{labels.notWritten}</b>
                      <span>{labels.notWrittenSub}</span>
                    </span>
                  </div>
                )
                : p.exercises === 0
                  ? <p className="gt-empty">{labels.noExercises}</p>
                  : (
                    <div className="gx-card">
                      <LessonProgressScope>
                        <LessonStream
                          lessonId={p.lessonId}
                          items={p.items}
                          part="oefenen"
                          layout="topic"
                          labels={streamLabels}
                        />
                      </LessonProgressScope>
                    </div>
                  )}
            </div>
          ))}
        </div>

        <a href={next.href} className="gx-next">
          <span className="gx-next-kick">{labels.nextKick}</span>
          <span className="gx-next-title">{next.title}</span>
          <ArrowRight size={18} strokeWidth={2.5} className="gx-next-arrow rtl-flip" aria-hidden />
        </a>
      </div>
    </div>
  );
}

/** De uitlegkaart rechts, en de pop-up met de uitleg van de gekozen les. */
function UitlegCard({
  part, streamLabels, labels,
}: {
  part: TopicPart;
  streamLabels: StreamLabels;
  labels: TopicViewLabels;
}) {
  return (
    <Dialog.Root>
      <div className="gx-uitleg">
        <span className="gx-uitleg-ic" aria-hidden><Lightbulb size={18} strokeWidth={2.3} /></span>
        <h2>{labels.uitlegHead}</h2>
        <p>{labels.uitlegSub}</p>
        <Dialog.Trigger className="gx-uitleg-open">
          {labels.openUitleg}
          <ArrowRight size={15} strokeWidth={2.6} className="rtl-flip" aria-hidden />
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        <Dialog.Backdrop className="ud-backdrop" />
        <Dialog.Popup className="ud-popup">
          <div className="ud-head">
            <span className="gx-uitleg-ic" aria-hidden><Lightbulb size={18} strokeWidth={2.3} /></span>
            <div className="min-w-0">
              <Dialog.Title className="ud-title">{labels.uitlegHead}</Dialog.Title>
              {part.title && <Dialog.Description className="ud-sub">{part.title}</Dialog.Description>}
            </div>
            <Dialog.Close className="ud-close" aria-label={labels.close}>
              <X size={18} strokeWidth={2.4} />
            </Dialog.Close>
          </div>
          <div className="ud-body">
            {part.lessonId !== null && (
              <LessonStream
                lessonId={part.lessonId}
                items={part.items}
                visual={part.visual}
                part="uitleg"
                layout="topic"
                labels={streamLabels}
              />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
