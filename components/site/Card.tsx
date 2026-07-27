import { cn } from '@/lib/utils';

type Shadow = 'sm' | 'md' | 'lg';

const SHADOW: Record<Shadow, string> = {
  sm: 'var(--shadow-card)',
  md: 'var(--shadow-card-md)',
  lg: 'var(--shadow-card-lg)',
};

export default function Card({
  children,
  className,
  shadow = 'sm',
  padding = 'p-6',
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: Shadow;
  padding?: string;
}) {
  return (
    <div
      className={cn('bg-surface-container-lowest rounded-2xl', padding, className)}
      style={{ boxShadow: SHADOW[shadow] }}
    >
      {children}
    </div>
  );
}
