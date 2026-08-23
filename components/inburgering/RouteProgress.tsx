'use client';

/**
 * "Deel 3 van 20 · fase 1 van 3" — the reader's place in the route, in the `/inburgering` hero.
 *
 * A client island inside an otherwise static hero, because the numbers are the reader's own
 * localStorage progress and none of it can be rendered on the server. It **renders nothing until it
 * has real numbers**: "deel 1 van 20" flashed under the title of someone who is on deel 7 is worse
 * than a line that appears a beat later.
 *
 * It shares `countRead` with `RouteReader` rather than counting again — two places counting delen is
 * two places to disagree about what a deel is.
 */
import { useTranslations } from 'next-intl';
import { useReadProgress } from '@/lib/guides/progress';
import { countRead, type RoutePhaseView } from './RouteReader';

export default function RouteProgress({ phases }: { phases: RoutePhaseView[] }) {
  const t = useTranslations('inburgering_route');
  const { progress, hydrated } = useReadProgress();
  if (!hydrated || phases.length === 0) return null;

  const all = phases.flatMap(p => p.delen);
  const read = countRead(progress, all);
  /* The fase you are *in* is the first unfinished one — the last one once everything is read, never
     a fourth that does not exist. */
  const idx = phases.findIndex(p => countRead(progress, p.delen) < p.delen.length);
  const phaseNumber = idx < 0 ? phases.length : idx + 1;

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <span
        className="rounded-full overflow-hidden"
        style={{ width: 200, maxWidth: '45vw', height: 6, background: 'rgba(255,255,255,0.22)' }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: all.length ? `${(read / all.length) * 100}%` : '0%',
            background: 'var(--color-secondary-container)',
            transition: 'width 520ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </span>
      <p className="text-sm font-bold m-0" style={{ color: 'var(--color-secondary-container)' }}>
        {t('hero_progress', {
          read: Math.min(read + 1, all.length),
          total: all.length,
          phase: phaseNumber,
          phases: phases.length,
        })}
      </p>
    </div>
  );
}
