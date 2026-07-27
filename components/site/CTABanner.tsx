import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import EyebrowBadge from './EyebrowBadge';

export default function CTABanner({
  eyebrow,
  title,
  description,
  button,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  button: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-2xl p-8 md:p-10 flex items-center justify-between flex-wrap gap-6', className)}
      style={{ background: 'var(--gradient-brand)' }}
    >
      <div>
        {eyebrow && (
          <EyebrowBadge tone="dark" className="mb-3">
            {eyebrow}
          </EyebrowBadge>
        )}
        <h3 className="font-headline font-bold text-white text-xl mb-2">{title}</h3>
        {description && (
          <p className="text-sm max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {description}
          </p>
        )}
      </div>
      <Link
        href={button.href as Parameters<typeof Link>[0]['href']}
        className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'whitespace-nowrap')}
      >
        <span>{button.label}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
