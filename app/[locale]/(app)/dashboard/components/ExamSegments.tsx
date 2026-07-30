import type { SkillProgress } from '@/lib/portal-progress';

export type SegmentState = 'passed' | 'sat' | 'available' | 'locked' | 'unpublished';

const FILL: Record<SegmentState, string> = {
  passed: 'linear-gradient(180deg,#1d428a,#002b6d)',
  sat: 'linear-gradient(180deg,#fe762c,#d94f00)',
  available: 'rgba(0,43,109,0.14)',
  locked: 'rgba(0,43,109,0.08)',
  unpublished: 'repeating-linear-gradient(135deg,rgba(0,43,109,0.10) 0 3px,transparent 3px 6px)',
};

export function segmentState(
  n: number,
  progress: SkillProgress,
  published: Set<number>,
  hasPaidPlan: boolean,
): SegmentState {
  const done = progress.exams[n];
  if (done) return done.passed ? 'passed' : 'sat';
  if (!published.has(n)) return 'unpublished';
  if (n !== 1 && !hasPaidPlan) return 'locked';
  return 'available';
}

/**
 * One bar per exam slot, so "3 of 10, and which 3" reads at a glance without counting rows.
 * State is carried by fill *and* by the title text — colour alone would leave the difference
 * between passed and sat unavailable to anyone who cannot distinguish navy from orange.
 */
export default function ExamSegments({
  count,
  states,
  labels,
}: {
  count: number;
  states: SegmentState[];
  labels: Record<SegmentState, string>;
}) {
  return (
    <div className="flex items-end gap-[3px]" aria-hidden="false" role="list">
      {Array.from({ length: count }, (_, i) => {
        const state = states[i] ?? 'unpublished';
        return (
          <span
            key={i}
            role="listitem"
            title={`${i + 1}. ${labels[state]}`}
            style={{
              flex: 1,
              height: state === 'passed' || state === 'sat' ? 20 : 12,
              borderRadius: 3,
              background: FILL[state],
            }}
          />
        );
      })}
    </div>
  );
}
