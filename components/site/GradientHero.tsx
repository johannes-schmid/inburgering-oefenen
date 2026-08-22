import { cn } from '@/lib/utils';
import { HorizonBanner, HERO_GRADIENT } from '@/components/horizon';

/**
 * The shared page-header band for `(main)` pages.
 *
 * It used to be a flat 135° gradient and nothing else. It is now a **Dutch Horizon banner**
 * (`docs/design/DESIGN_SYSTEM.md` §7.2): the gradient supplies the ground and `HorizonBanner`
 * supplies the dot field, the skyline, the sun disc and the horizon band on the bottom edge. Six
 * page headers share it, so the graphic language arrives on all of them at once.
 *
 * The skyline is deliberately short here (80px against a hero's 124px) and carries no windows:
 * these bands are ~200px tall, and a hero-scale skyline would run behind the copy — which §7.3
 * forbids. Scale a skyline by dropping houses and detail, never by shrinking every part.
 *
 * `children` keeps the original API, so no caller changed. Use `HorizonHero` from
 * `@/components/horizon` when a page wants the structured eyebrow / display title / lede stack.
 */
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
    <div
      style={{ background: HERO_GRADIENT }}
      className={cn('relative overflow-hidden py-12', className)}
    >
      <HorizonBanner desktopHouses={16} desktopHeight={80} mobileHouses={6} mobileHeight={56} />

      <div className={cn('relative max-w-7xl mx-auto px-6', containerClass)}>
        {children}
      </div>
    </div>
  );
}
