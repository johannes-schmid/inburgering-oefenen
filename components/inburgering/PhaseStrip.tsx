/**
 * The three fasen in one line, at the top of a guide — "you are in fase 2 of 3".
 *
 * The hub's cards are the map; this is the same map compressed to a strip, so a reader who landed
 * on a guide straight from a search sees where the page sits in the route rather than reading it as
 * a standalone article. That is the whole job: **orientation, not navigation of the article** — the
 * article's own sections are the sidebar's (`GuideSectionNav`).
 *
 * Server component, deliberately. It shows no progress, so it needs no localStorage and no
 * hydration: three links and a label. Adding per-fase counters here would have made the first thing
 * below the hero a client component that renders zeros for a frame on every guide page.
 *
 * The strip is `nav`, and the current fase is a `span` rather than a link to the page you are
 * already oriented in — a self-link in a three-item trail is a dead control.
 */
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PHASES, type PhaseId } from '@/data/guides/phases';
import PhaseIcon from './PhaseIcon';

export default async function PhaseStrip({
  current,
  locale,
}: {
  current: PhaseId;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'inburgering_route' });

  return (
    <div className="bg-surface-container-lowest" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
      <nav
        className="max-w-[1160px] mx-auto px-6 py-3 flex flex-wrap items-center gap-x-2 gap-y-2"
        aria-label={t('strip_label')}
      >
        <span className="text-xs font-bold uppercase tracking-widest me-1" style={{ color: '#a24000' }}>
          {t('strip_eyebrow')}
        </span>
        {PHASES.map(p => {
          const active = p.id === current;
          const inner = (
            <>
              <span
                className="flex items-center justify-center rounded-full font-headline font-bold text-[11px] flex-shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  background: active ? 'var(--color-secondary-container)' : 'rgba(0,43,109,0.07)',
                  color: active ? '#fff' : '#002b6d',
                }}
                aria-hidden="true"
              >
                {p.number}
              </span>
              <PhaseIcon phase={p.id} className="w-4 h-4 hidden sm:block" />
              <span
                className="text-sm leading-none"
                style={{ fontWeight: active ? 700 : 500 }}
              >
                {t(`phase.${p.id}.label`)}
              </span>
            </>
          );

          return active ? (
            <span
              key={p.id}
              aria-current="step"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(254,118,44,0.10)', color: '#002b6d' }}
            >
              {inner}
            </span>
          ) : (
            <Link
              key={p.id}
              href={{ pathname: '/inburgering', query: { fase: p.id } }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 no-underline hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
              style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
            >
              {inner}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
