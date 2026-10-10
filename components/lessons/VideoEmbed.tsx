'use client';

import { playerSrc, toVideoEmbed } from '@/lib/lessons/video-embed';

export type VideoLabels = {
  /** De toegankelijke naam van de afspeelknop. */
  play: string;
  /** Wat de lege videoplek zegt: "Video volgt". */
  soon: string;
  /** Eén zin eronder, of `null`. */
  soonSub: string | null;
};

/**
 * De videoplek van een les: de YouTube-speler (of een `<video>`) direct in de pagina, op de
 * plek en in de maat van de gestreepte tegel.
 *
 * ── WAAROM GEEN KLIKTEGEL MEER ───────────────────────────────────────────────
 * Eerst stond hier een tegel met een oranje afspeelschijf en kwam de iframe pas na de klik.
 * De eigenaar wil de echte speler zien waar de video hoort (08-10): de miniatuur en titel van
 * YouTube zeggen meteen wélke video het is, en dat zei de tegel niet. De kosten blijven klein
 * met `loading="lazy"` — de speler laadt pas als hij in beeld komt — en `youtube-nocookie.com`
 * in `toVideoEmbed` zet geen cookies tot er op play wordt gedrukt.
 *
 * ── EEN LEGE PLEK IS GEEN KAPOTTE SPELER ─────────────────────────────────────
 * Een video zonder URL (`VIDEOS[…].url === null`) krijgt de gestreepte tegel met "Video volgt".
 * De plek staat er, zodat de pagina niet verspringt als de video er komt.
 */
export default function VideoEmbed({
  url, title, meta = null, poster = null, labels,
}: {
  url: string | null;
  title: string;
  /** De duur of een andere korte regel naast de titel, bv. "6:23". */
  meta?: string | null;
  poster?: string | null;
  labels: VideoLabels;
}) {
  const embed = toVideoEmbed(url);

  if (embed) {
    return (
      <div className="vid-tile is-playing">
        {embed.kind === 'iframe'
          ? (
            <iframe
              src={playerSrc(embed)}
              title={title || labels.play}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )
          : <video src={embed.src} controls playsInline preload="metadata" poster={poster ?? undefined} />}
      </div>
    );
  }

  return (
    <div className="vid-tile is-empty">
      <div className="vid-soon">
        <b>{labels.soon}</b>
        {labels.soonSub && <span>{labels.soonSub}</span>}
      </div>
      {(title || meta) && (
        <p className="vid-cap">
          {title && <span>{title}</span>}
          {meta && <span className="vid-meta">{meta}</span>}
        </p>
      )}
    </div>
  );
}
