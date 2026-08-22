import { Check, Play } from 'lucide-react';
import { CategoryMark, HorizonBand, LensRing } from '@/components/horizon';

/**
 * The homepage hero's product collage — a phone with a Luisteren item running on it, and five
 * satellite cards showing the surfaces around it.
 *
 * **The whole thing is `aria-hidden`.** It is a picture of the product, not the product: to a
 * screen reader the phone is an unanswerable multiple-choice question, the play button plays
 * nothing, and the five cards are fragments of state belonging to nobody. The copy above it says
 * what the platform does, and the CTA is one tab stop away. Anything here that a user needs to
 * *know* belongs in that copy instead.
 *
 * **Every number in it is illustrative UI state, and none of it is a claim.** That is a real
 * distinction and the reason a few figures from the mockup are not here: a "58" badge and
 * "240 vragen" on the KNM card read as a catalogue size, and KNM is not built. A progress ring
 * belonging to a fictional candidate reads as that candidate's, which is what a product shot is.
 * If a figure would still be true printed as prose on this page, it can stay; otherwise it goes.
 *
 * **Below `lg` only the phone is rendered.** Six overlapping cards need roughly 1000px to overlap
 * *legibly*; at 390px they become a stack of clipped rectangles, and scaling the whole collage
 * down makes the type illegible. One phone is the honest small-screen version of the same idea.
 */
export default function HeroShowcase() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-5xl">
      {/* The collage box. Its height is fixed per breakpoint because the cards are positioned
          against it; the copy above never depends on it, so a card that reflows cannot push the
          headline around. */}
      <div className="relative h-[318px] lg:h-[424px]">

        {/* ── the phone, centre ── */}
        <div
          /* Centred with `inset-x-0 mx-auto`, not `left-1/2 -translate-x-1/2`: the satellites set
             `transform: rotate()` inline, and mixing an inline transform with a Tailwind translate
             on siblings made the phone render at left:50% with the translate dropped — off-centre
             and overflowing the viewport at 390px. Auto margins need no transform at all.

             **Rounded at the top only, and it runs off the bottom of the section.** A fully rounded
             panel floating clear of the edge reads as a pill, not as a device; cropped, with the
             corners only at the top, it reads as a screen continuing past the fold. `pb-12` is what
             makes the crop land in empty navy instead of through the last answer option — that
             earlier version looked like a rendering fault rather than a composition.

             **Wider at `lg` (300px), and that is a positioning decision**: most candidates sit this
             exam on a desktop, so the shot should not insist the product is a phone app. It keeps
             the phone proportions on a phone, where 300px would not fit.

             `z-20` puts it *over* the satellites. That inverts the DOM order and is the whole
             reason overlap is safe: whatever a card covers, it can never be the phone's own
             content. */
          className="absolute inset-x-0 mx-auto bottom-[-40px] lg:bottom-[-52px] w-[228px] lg:w-[300px] rounded-t-[34px] p-4 lg:p-5 pb-14 lg:pb-16 flex flex-col gap-3 z-20"
          style={{ background: 'var(--color-primary)', boxShadow: '0 -8px 64px rgba(0,20,52,0.28)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.625rem] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Luisteren · set 4
            </span>
            <span className="text-[0.625rem] font-bold rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
              3 / 12
            </span>
          </div>

          <p className="font-headline font-extrabold text-white text-base lg:text-lg leading-tight m-0">
            Hoe laat begint de afspraak?
          </p>

          {/* The waveform: the played part in the accent, the rest at 26% white. Fixed heights,
              because a random bar pattern would differ between the server and the browser. */}
          <span className="flex items-end gap-[3px] h-7 lg:h-9">
            {[11, 17, 24, 14, 20, 27, 9, 16, 22, 12, 19, 8, 14, 20, 11].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: h, background: i < 6 ? 'var(--color-secondary-container)' : 'rgba(255,255,255,0.26)' }}
              />
            ))}
          </span>

          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center" style={{ background: 'var(--color-secondary-container)' }}>
              <Play size={13} strokeWidth={2.6} fill="#5f2200" style={{ color: '#5f2200' }} className="rtl-flip" />
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>Nog een keer (2 over)</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {['Om half tien', 'Om tien uur', 'Om elf uur'].map((o, i) => (
              <span
                key={o}
                className="rounded-xl px-3.5 py-2.5 text-[0.8125rem] lg:text-sm text-white"
                style={i === 1
                  ? { background: 'rgba(255,255,255,0.10)', boxShadow: 'inset 0 0 0 2px var(--color-secondary-container)' }
                  : { background: 'rgba(255,255,255,0.08)' }}
              >
                {o}
              </span>
            ))}
          </div>
        </div>

        {/* ── satellites, lg and up ── */}
        <div className="hidden lg:block relative z-10">

          {/* KNM — the thema marks. No count: KNM is not built, and a number here reads as a
              catalogue size. */}
          <FloatCard x={-308} y={30} width={196} under="right" rotate={-2}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-headline font-extrabold text-primary text-base">KNM</span>
              <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-on-surface-variant">8 thema&rsquo;s</span>
            </div>
            <div className="flex gap-1.5">
              <CategoryMark category="wonen" size={34} />
              <CategoryMark category="gezondheid" size={34} />
              <CategoryMark category="werk" size={34} />
            </div>
          </FloatCard>

          {/* Lezen */}
          <FloatCard x={-338} y={112} width={226} under="right" rotate={-3}>
            <div className="flex items-center gap-3 mb-3">
              <CategoryMark category="lezen" size={30} />
              <span className="flex flex-col">
                <span className="font-headline font-bold text-primary text-sm leading-tight">Lezen</span>
                <span className="text-[0.5625rem] font-semibold uppercase tracking-widest text-on-surface-variant">Brief van de gemeente</span>
              </span>
            </div>
            <p className="text-sm text-on-surface leading-snug m-0 mb-3.5">
              U moet <mark className="rounded px-1 font-semibold" style={{ background: 'rgba(254,118,44,0.20)', color: '#a24000' }}>vóór 1 juni</mark> reageren op deze brief.
            </p>
            <HorizonBand height={5} rounded />
          </FloatCard>

          {/* The docent's own correction — the one satellite that is the product's actual claim. */}
          <FloatCard x={-328} y={252} width={216} under="right" rotate={2}>
            <div className="flex items-center gap-2.5 mb-3">
              <span
                className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center font-headline font-extrabold text-[0.625rem]"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                MS
              </span>
              <span className="text-[0.5625rem] font-semibold uppercase tracking-widest text-on-surface-variant leading-tight">
                Feedback van de docent
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--color-surface-container-low)' }}>
              <span className="block font-headline font-bold text-primary text-xs mb-1">Woordkeuze</span>
              <span className="block text-xs text-on-surface-variant leading-snug">
                Schrijf &ldquo;ik zou graag&rdquo; in plaats van &ldquo;ik wil&rdquo;.
              </span>
            </div>
          </FloatCard>

          {/* The outcome. It is an app state, not a promise — which is why it names the onderdelen
              being complete rather than saying anything about odds. */}
          <FloatCard x={112} y={80} width={228} under="left" rotate={2}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.5625rem] font-semibold uppercase tracking-widest text-on-surface-variant">Diploma inburgering</span>
              <span className="text-[0.5625rem] font-bold rounded-full px-1.5 py-0.5" style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-primary)' }}>A2</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex flex-col flex-1 min-w-0">
                <span className="font-headline font-extrabold text-primary text-lg leading-tight">Geslaagd</span>
                <span className="text-xs text-on-surface-variant leading-snug mt-1">Alle onderdelen behaald.</span>
              </span>
              <LensRing size={38} ring={5} tone="var(--color-secondary-container)" halo="var(--color-surface-container-high)">
                <Check size={14} strokeWidth={3} style={{ color: 'var(--color-primary)' }} />
              </LensRing>
            </div>
          </FloatCard>

          {/* Readiness. `lib/exam-readiness.ts` is the real feature behind it. */}
          <FloatCard x={112} y={246} width={212} under="left" rotate={-2}>
            <div className="flex items-center gap-3">
              <LensRing size={34} ring={4} tone="var(--color-secondary)" halo="var(--color-surface-container-high)">
                <span className="font-headline font-extrabold text-[0.5625rem] text-primary">68%</span>
              </LensRing>
              <span className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-primary text-sm leading-tight">Examenklaar</span>
                <span className="text-[0.6875rem] text-on-surface-variant leading-snug">op koers voor 14 mei</span>
              </span>
            </div>
          </FloatCard>
        </div>
      </div>
    </div>
  );
}

/**
 * A satellite.
 *
 * **`x` is the card's left edge measured from the centre of the collage, not from the container.**
 * Positioning these against `left`/`right` percentages pinned them to the box's edges, so on a wide
 * viewport the box grew and the cards drifted away from the phone — six things scattered across
 * 1024px rather than one cluster. Anchoring to `left: 50%` with a pixel offset keeps every card the
 * same distance from the phone at every width, which is what makes it read as one object.
 *
 * **`under` says which edge of the card the phone covers, and it pads the content away from it.**
 * The overlap is what gives the stack depth, but a card whose *text* runs under the phone gets its
 * sentences cut mid-word — which reads as a bug, not as depth. So the card's shape overlaps by
 * `OVERLAP` and its content stops short of it. The phone sits at `z-20` and the satellites at
 * `z-10`, so the thing being covered is always the card and never the product shot.
 *
 * The rotation stays within ±3°: past that the type starts to look like a mistake rather than a
 * stack.
 */

/** How far a card's shape runs under the phone, in px. Also the padding its content gets back. */
const OVERLAP = 38;

function FloatCard({
  x, y, width, rotate, under, children,
}: {
  x: number;
  y: number;
  width: number;
  rotate: number;
  /** The side the phone covers: `right` for cards left of it, `left` for cards right of it. */
  under: 'left' | 'right';
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute rounded-2xl p-3.5"
      style={{
        left: '50%',
        marginLeft: x,
        top: y,
        width,
        [under === 'right' ? 'paddingRight' : 'paddingLeft']: OVERLAP + 14,
        background: 'var(--color-surface-container-lowest)',
        boxShadow: '0 20px 48px rgba(0,20,52,0.14)',
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </div>
  );
}
