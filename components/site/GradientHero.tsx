import { cn } from '@/lib/utils';

export default function GradientHero({
  children,
  className,
  containerClass,
}: {
  children: React.ReactNode;
  className?: string;
  containerClass?: string;
}) {
  return (
    <div style={{ background: 'var(--gradient-brand)' }} className={cn('py-12', className)}>
      <div className={cn('max-w-7xl mx-auto px-6', containerClass)}>
        {children}
      </div>
    </div>
  );
}
