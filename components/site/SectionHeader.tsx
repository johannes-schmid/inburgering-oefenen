import { cn } from '@/lib/utils';
import { HorizonBand } from '@/components/horizon';
import EyebrowBadge from './EyebrowBadge';
import type { ComponentProps } from 'react';

type Tone = ComponentProps<typeof EyebrowBadge>['tone'];

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'orange',
  className,
  mb = 'mb-9',
  rule = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  tone?: Tone;
  className?: string;
  mb?: string;
  /** The short horizon rule under the title. Off only where two headers sit side by side. */
  rule?: boolean;
}) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : '', mb, className)}>
      {eyebrow && (
        <EyebrowBadge tone={tone} className="mb-3">
          {eyebrow}
        </EyebrowBadge>
      )}
      <h2
        className="font-headline font-extrabold text-[1.75rem] md:text-[2.25rem] text-primary mb-3"
        style={{ letterSpacing: '-0.02em', lineHeight: 1.08, textWrap: 'balance' }}
      >
        {title}
      </h2>
      {/* The horizon rule: a 48px slice of the same band that closes every hero, so a section
          heading reads as part of the same system rather than as a bare line of type. It replaces
          the 1px divider the no-line rule (§2) forbids. */}
      {rule && (
        <HorizonBand
          height={3}
          rounded
          className={cn('w-12 mb-3', align === 'center' ? 'mx-auto' : '')}
        />
      )}
      {subtitle && (
        <p className={cn('text-on-surface-variant text-base leading-relaxed', align === 'center' ? 'max-w-lg mx-auto' : '')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
