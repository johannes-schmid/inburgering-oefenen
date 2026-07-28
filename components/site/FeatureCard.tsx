import type { LucideIcon } from 'lucide-react';
import Card from './Card';

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  iconBg = 'rgba(0,43,109,0.08)',
  iconColor = 'var(--color-primary)',
}: {
  /** A lucide icon component, e.g. `Target`. Not an emoji — see components/site/SkillIcon. */
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <Card shadow="md" padding="p-7">
      <div
        className="flex items-center justify-center mb-4 flex-shrink-0"
        style={{ width: 44, height: 44, background: iconBg, borderRadius: 12, color: iconColor }}
      >
        <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      </div>
      <h3 className="font-headline font-bold text-on-surface text-base mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
    </Card>
  );
}
