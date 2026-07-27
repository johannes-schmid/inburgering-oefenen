import { cn } from '@/lib/utils';

type Tone = 'orange' | 'dark' | 'primary' | 'orange-solid';

const TONE_CLASSES: Record<Tone, string> = {
  orange: 'text-secondary',
  dark: 'text-white/80',
  primary: 'text-primary',
  'orange-solid': 'bg-secondary-container text-on-secondary-container',
};

const TONE_STYLES: Partial<Record<Tone, React.CSSProperties>> = {
  orange: { background: 'rgba(162,64,0,0.10)' },
  dark: { background: 'rgba(255,255,255,0.12)' },
  primary: { background: 'rgba(0,43,109,0.06)' },
};

export default function EyebrowBadge({
  children,
  tone = 'orange',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-widest',
        TONE_CLASSES[tone],
        className,
      )}
      style={TONE_STYLES[tone]}
    >
      {children}
    </span>
  );
}
