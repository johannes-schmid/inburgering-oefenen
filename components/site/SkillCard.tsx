import { DEFAULT_LEVEL, type Skill } from '@/data/skills';
import { ArrowRight } from 'lucide-react';
import { CategoryMark, HorizonBand, SkylineTopper } from '@/components/horizon';

type Props = {
  skill: Skill;
  name: string;
  tagline: string;
  /** e.g. "10 oefenexamens" */
  examsLabel: string;
  /** e.g. "25 vragen" */
  itemsLabel: string;
  /** e.g. "65 minuten" */
  durationLabel: string;
  freeNote: string;
  cta: string;
  /** Position in the grid. Rotates the skyline so no two cards are the same street (§7.5). */
  index?: number;
  /**
   * Where the card goes. **Pass the locale-prefixed path.**
   *
   * The default is locale-less and survives only because the i18n middleware redirects it — which
   * costs every card on the page a redirect hop, and `tests/public.spec.js` cannot see the link at
   * all when it asserts against the rendered href. New callers pass `/${locale}/oefenexamen/…`.
   */
  href?: string;
};

/**
 * One of the four A2 exam components on the homepage / overview grid — the design system's
 * **module card** (`docs/design/DESIGN_SYSTEM.md` §7.2): a skyline topper, a metadata label, the
 * title, and a Dutch Horizon bar at the foot.
 *
 * Each card gets its own tint and its own `seed`, so the four cards read as four different streets
 * in one city rather than as the same graphic repeated. **Category variety comes from palette tints
 * and geometry, never from a new hue** (§7.3) — which is also why the "gratis" chip is no longer
 * the off-palette green (`#f0fdf4` / `#15803d`) it arrived with.
 *
 * Links to the skill's exam overview at /oefenexamen/{level}/{slug}. A2 only — this card is a
 * marketing component and the homepage that renders it sells A2.
 */
export default function SkillCard({
  skill, name, tagline, examsLabel, itemsLabel, durationLabel, freeNote, cta, index = 0, href,
}: Props) {
  const tint = (['gradient', 'reverse', 'primary', 'container'] as const)[index % 4];

  return (
    <a
      href={href ?? `/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`}
      className="skill-card group flex flex-col rounded-2xl bg-surface-container-lowest overflow-hidden no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
      style={{ boxShadow: 'var(--shadow-ambient)' }}
    >
      <SkylineTopper height={64} houses={7} seed={index * 3} tint={tint} band={false}>
        <span
          className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase"
          style={{ letterSpacing: '0.1em', background: 'rgba(248,249,251,0.18)', backdropFilter: 'blur(20px)', color: '#fff' }}
        >
          {freeNote}
        </span>
      </SkylineTopper>

      {/* The icon tile straddles the street line, which is what stops the topper reading as a
          decorative strip bolted onto a card.

          The tile *is* the mark: `CategoryMark` draws its own `surface_container_high` square, so
          wrapping it in a second white one gave a tile inside a tile. The official category mark
          replaced the bare lucide glyph on 2026-08-22 — on a marketing surface the onderdeel is
          the offer, and brand imagery names it; lucide stays for affordances (the arrow below). */}
      <div className="px-6 -mt-6 relative">
        <CategoryMark category={skill.slug} size={44} className="shadow-[var(--shadow-ambient)]" />
      </div>

      <div className="flex flex-col gap-3 p-6 pt-3.5 flex-1">
        <div>
          <h3 className="font-headline text-headline-sm text-on-surface mb-1">{name}</h3>
          <p className="text-body-md text-on-surface-variant">{tagline}</p>
        </div>

        {/* Two deliberate rows rather than one wrapping line: at four-up the three facts do not
            fit on one line at any card width, and a wrapped inline list leaves a dangling "·" at
            the end of the first row. */}
        <dl className="mt-auto text-xs text-on-surface-variant">
          <dt className="sr-only">Oefenexamens</dt>
          <dd className="font-semibold text-on-surface">{examsLabel}</dd>
          <dt className="sr-only">Opbouw</dt>
          <dd className="flex items-center gap-2">
            <span>{itemsLabel}</span>
            <span aria-hidden="true" className="text-outline-variant">·</span>
            <span>{durationLabel}</span>
          </dd>
        </dl>

        <span className="skill-card-cta inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#a24000' }}>
          {cta}
          <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" className="rtl-flip" />
        </span>
      </div>

      <HorizonBand height={4} />
    </a>
  );
}
