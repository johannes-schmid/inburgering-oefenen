import { cn } from '@/lib/utils';
import Card from './Card';

export default function ReviewCard({
  rating = 5,
  quote,
  name,
  location,
  initials,
  avatarClass = 'bg-primary text-white',
  compact = false,
}: {
  rating?: number;
  quote: string;
  name: string;
  location?: string;
  initials: string;
  avatarClass?: string;
  compact?: boolean;
}) {
  return (
    <Card shadow="sm" padding={compact ? 'p-5' : 'p-7'}>
      <div className={cn('flex gap-0.5', compact ? 'mb-3' : 'mb-4')}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} style={{ color: s <= rating ? '#fe762c' : '#c4c6d2' }}>★</span>
        ))}
      </div>
      <p className={cn('text-on-surface-variant leading-relaxed italic', compact ? 'text-sm mb-3' : 'text-sm mb-6')}>
        {quote}
      </p>
      <div className="flex items-center gap-3">
        <div className={cn('rounded-full flex items-center justify-center font-bold font-headline flex-shrink-0', compact ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-xs', avatarClass)}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">{name}</p>
          {location && <p className="text-xs text-on-surface-variant">{location}</p>}
        </div>
      </div>
    </Card>
  );
}
