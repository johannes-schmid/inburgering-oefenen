import { cn } from '@/lib/utils';

type Variant = 'full' | 'compact' | 'chip';

export default function TeacherCard({
  variant = 'full',
  name = 'Marieke Schipper',
  title = 'NT2-docent & KNM-specialist',
  experience,
  quote,
  credentials,
  stats,
  link,
  className,
}: {
  variant?: Variant;
  name?: string;
  title?: string;
  experience?: string;
  quote?: string;
  credentials?: string[];
  stats?: { label: string; value: string }[];
  link?: { href: string; label: string };
  className?: string;
}) {
  if (variant === 'chip') {
    return (
      <div className={cn('flex items-center gap-4 p-4 rounded-xl', className)} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(254,118,44,0.6)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marieke-schipper.jpg" alt={name} className="w-full h-full object-cover object-top" />
        </div>
        <div>
          <p className="font-headline font-bold text-white text-base leading-tight">{name}</p>
          {experience && <p className="text-sm leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{experience}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn('flex flex-col sm:flex-row items-center gap-5 bg-white rounded-2xl border border-outline-variant/50 p-6', className)}
        style={{ boxShadow: 'var(--shadow-card-md)' }}
      >
        <div className="relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marieke-schipper.jpg" alt={name} className="w-16 h-16 rounded-full object-cover" style={{ border: '3px solid #fff', boxShadow: '0 2px 12px rgba(0,43,109,0.15)' }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="font-headline font-extrabold text-on-surface text-sm">Gemaakt door {name} — gecertificeerde KNM-docent</p>
          {quote && <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">&quot;{quote}&quot;</p>}
        </div>
        {stats && (
          <div className="flex-shrink-0 sm:ml-auto flex flex-col gap-1.5 text-center sm:text-right">
            {stats.map((s) => (
              <span key={s.label} className="text-xs font-bold text-on-surface whitespace-nowrap">{s.value} {s.label}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // full variant (homepage social proof card)
  return (
    <div className={cn('bg-surface-container-lowest rounded-2xl p-8', className)} style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex gap-5 items-center mb-6">
        <div className="w-20 h-20 min-w-20 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(196,198,210,0.30)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marieke-schipper.jpg" alt={`${name} — gecertificeerde KNM-docent en NT2-specialist`} width={80} height={80} className="w-full h-full object-cover object-center" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-1">{name}</h3>
          <p className="font-semibold text-sm" style={{ color: '#a24000' }}>{title}</p>
          {experience && <p className="text-on-surface-variant text-xs mt-0.5">{experience}</p>}
        </div>
      </div>
      {quote && (
        <blockquote className="border-l-2 pl-4 text-on-surface-variant text-sm leading-relaxed italic mb-6" style={{ borderColor: 'rgba(162,64,0,0.30)' }}>
          {quote}
        </blockquote>
      )}
      {credentials && credentials.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {credentials.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 text-primary text-xs font-semibold rounded-full" style={{ background: 'rgba(0,43,109,0.05)' }}>
              {c}
            </span>
          ))}
        </div>
      )}
      {link && (
        <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline hover:opacity-75 transition-opacity" style={{ color: '#a24000' }}>
          {link.label}
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 11L11 2M11 2H5M11 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      )}
    </div>
  );
}
