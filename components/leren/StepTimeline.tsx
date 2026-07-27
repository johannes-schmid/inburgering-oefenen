import type { StepTimelineData, StepTimelineItem } from '@/data/leren/types';

function circleClasses(variant: StepTimelineItem['variant'] = 'primary') {
  if (variant === 'muted') return 'bg-primary/15 text-primary';
  if (variant === 'secondary') return 'bg-secondary/20 text-secondary';
  return 'bg-primary text-white shadow-sm';
}

function mobileBgClasses(variant: StepTimelineItem['variant'] = 'primary') {
  if (variant === 'muted') return 'bg-surface-container-low';
  if (variant === 'secondary') return 'bg-surface-container-low';
  return 'bg-primary/5 border border-primary/15';
}

function connectorOffset(count: number) {
  const pct = Math.round(100 / count / 2);
  return `${pct}%`;
}

export default function StepTimeline({ heading, items }: StepTimelineData) {
  const offset = connectorOffset(items.length);
  return (
    <div className="mb-6">
      {heading && (
        <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-5">{heading}</p>
      )}

      {/* Desktop: horizontal step flow */}
      <div className="hidden sm:block relative">
        <div
          className="absolute top-5 h-px bg-primary/20"
          style={{ left: offset, right: offset }}
        />
        <div className={`grid`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative z-10 ring-2 ring-white ${circleClasses(item.variant)}`}>
                {item.icon
                  ? <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  : item.badge}
              </div>
              <p className="text-xs font-bold text-on-surface mt-2.5">{item.label}</p>
              {(item.subtitle || item.note) && (
                <p className="text-[10px] text-on-surface-variant mt-1 leading-snug">
                  {item.subtitle}
                  {item.note && (
                    <> — <span className="font-semibold text-primary">{item.note}</span></>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical list */}
      <div className="sm:hidden space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${mobileBgClasses(item.variant)}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${circleClasses(item.variant)}`}>
              {item.icon
                ? <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                : item.badge}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{item.label}</p>
              {(item.subtitle || item.note) && (
                <p className="text-xs text-on-surface-variant">
                  {item.subtitle}
                  {item.note && (
                    <> — <span className="font-semibold text-primary">{item.note}</span></>
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
