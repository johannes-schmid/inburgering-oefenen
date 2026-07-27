import { cn } from '@/lib/utils';
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
  mb = 'mb-14',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  tone?: Tone;
  className?: string;
  mb?: string;
}) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : '', mb, className)}>
      {eyebrow && (
        <EyebrowBadge tone={tone} className="mb-4">
          {eyebrow}
        </EyebrowBadge>
      )}
      <h2 className="font-headline font-bold text-3xl md:text-4xl text-primary tracking-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className={cn('text-on-surface-variant text-base leading-relaxed', align === 'center' ? 'max-w-lg mx-auto' : '')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
