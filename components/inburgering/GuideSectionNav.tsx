'use client';

/**
 * A guide's own sections, in its sidebar, with the reader's place marked — and the thing that
 * records the reading progress the `/inburgering` fasen display.
 *
 * The guides are long (10–25 minutes) and were previously a single scroll with no map. That is
 * survivable for a blog post someone chose to read and expensive for a reference page someone
 * arrived at from a search: the reader needs to see the whole shape, jump into the part that
 * applies to them, and come back later without rereading. So the sidebar lists the `<h2>`s, tracks
 * which one is on screen, and links back to the fase the guide belongs to.
 *
 * **The article body is not touched.** The owner's instruction was to keep every article complete
 * and surface its sections on the side (2026-08-22), so this component only *reads* the DOM the
 * article already renders. Nothing here splits a guide into pages, and nothing rewrites its HTML —
 * the anchors it scrolls to are the `id`s the docent's own headings carry.
 *
 * **Marking a section read is deliberately conservative: it fires when the reader scrolls *past*
 * the section, never when it merely appears.** A section that scrolls into view during a fast flick
 * to the bottom has not been read, and a progress bar that fills up because someone scrolled fast
 * is worse than no progress bar — it makes the number on the hub meaningless. So section *i* is
 * marked when section *i+1* becomes the one on screen (you left it behind), and the final section
 * is marked only when the end of the article is actually reached.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { GuideSectionEntry } from '@/lib/guides/sections';
import type { PhaseId } from '@/data/guides/phases';
import { markSectionRead, useReadProgress } from '@/lib/guides/progress';

export default function GuideSectionNav({
  slug,
  guideTitle,
  sections,
  phase,
}: {
  slug: string;
  guideTitle: string;
  sections: GuideSectionEntry[];
  /** The fase this guide sits in, for the "back to the route" link. Absent outside `/inburgering`. */
  phase?: PhaseId;
}) {
  const t = useTranslations('inburgering_route');
  const { progress } = useReadProgress();
  /* Seeded with the first section rather than `null`: at the top of the article the observer's
     trigger line (45% down the viewport) has not been crossed yet, so a null start renders the
     whole list unhighlighted — which reads as "the nav does not know where you are" on the one view
     every reader sees first. The first section is where they are. */
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);
  /** Highest section index reached this visit, so scrolling back up cannot un-mark anything. */
  const reached = useRef(0);

  const ids = useMemo(() => sections.map(s => s.id), [sections]);

  useEffect(() => {
    if (!ids.length) return;

    const nodes = ids
      .map(id => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    /* `-45% 0px -50%` puts the trigger line just above the middle of the viewport: a heading
       becomes "current" as it settles into the reading position, not as it clips the bottom edge. */
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const id = visible.target.id;
        setActiveId(id);

        const index = ids.indexOf(id);
        if (index > reached.current) {
          /* Everything strictly before the section now on screen has been scrolled past. */
          for (let i = reached.current; i < index; i++) markSectionRead(slug, ids[i]);
          reached.current = index;
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    nodes.forEach(n => observer.observe(n));

    /* Reaching the end of the article marks **every** section, not just the last one.
       Two reasons, and the second was found by probing a real scroll rather than by reading this:
       the final section can never be "left behind" so nothing else would ever mark it; and on a
       short tail the last two headings share the closing viewport, so the observer picks one and
       the other is never the one on screen — scrolling the whole guide left two of four sections
       unmarked. "The reader got to the bottom" means they passed all of it, so that is what is
       recorded. `markSectionRead` is idempotent, so re-marking costs nothing.

       The 240px of slack is the CTA block, the reviewed-by line and the FAQ, which sit below the
       prose: requiring the reader to scroll past those to be credited with the last section would
       withhold it from anyone who stops when the article does. */
    const onScroll = () => {
      const bottom = document.documentElement.scrollHeight - window.innerHeight - 240;
      if (window.scrollY >= bottom) {
        ids.forEach(id => markSectionRead(slug, id));
        reached.current = ids.length - 1;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [ids, slug]);

  if (sections.length < 2) return null;

  const done = new Set(progress[slug] ?? []);

  return (
    <nav
      className="bg-surface-container-lowest rounded-2xl p-5"
      style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}
      aria-label={t('nav_label')}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-headline font-bold text-on-surface leading-snug text-[0.95rem]">
          {guideTitle}
        </p>
        {/* Back to the fase this guide belongs to — the mockup's "Alles". A guide reached from a
            search has no back stack into the route, so the link is the only way there. */}
        <Link
          href={phase ? { pathname: '/inburgering', query: { fase: phase } } : '/inburgering'}
          className="inline-flex items-center gap-0.5 text-xs font-bold no-underline flex-shrink-0 pt-0.5 hover:opacity-75 transition-opacity"
          style={{ color: '#002b6d', textDecoration: 'none' }}
        >
          <ChevronLeft className="w-3.5 h-3.5 rtl-flip" aria-hidden="true" />
          {t('nav_all')}
        </Link>
      </div>

      <ol className="list-none p-0 m-0 flex flex-col gap-0.5">
        {sections.map((s, i) => {
          const read = done.has(s.id);
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active ? 'true' : undefined}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                style={{
                  background: active ? 'var(--color-surface-container)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <span
                  className="flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-headline font-bold"
                  style={{
                    width: 22,
                    height: 22,
                    background: active
                      ? 'var(--color-secondary-container)'
                      : read
                        ? '#002b6d'
                        : 'transparent',
                    color: active || read ? '#fff' : 'var(--color-on-surface-variant)',
                    border: active || read ? 'none' : '1.5px solid var(--color-outline-variant)',
                  }}
                  aria-hidden="true"
                >
                  {active ? (
                    <span
                      style={{ width: 6, height: 6, borderRadius: 99, background: '#fff', display: 'block' }}
                    />
                  ) : read ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className="text-sm leading-snug"
                  style={{
                    color: active ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {s.title}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
