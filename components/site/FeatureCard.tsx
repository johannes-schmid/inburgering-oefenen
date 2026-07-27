import Card from './Card';

export default function FeatureCard({
  icon,
  title,
  description,
  iconBg = 'rgba(0,43,109,0.08)',
}: {
  icon: string;
  title: string;
  description: string;
  iconBg?: string;
}) {
  return (
    <Card shadow="md" padding="p-7">
      <div
        className="flex items-center justify-center text-xl mb-4 flex-shrink-0"
        style={{ width: 44, height: 44, background: iconBg, borderRadius: 12 }}
      >
        {icon}
      </div>
      <h3 className="font-headline font-bold text-on-surface text-base mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
    </Card>
  );
}
