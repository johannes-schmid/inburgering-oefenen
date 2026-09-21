import { cn } from '@/lib/utils';

/**
 * Het bewegende licht over een hele heldersectie: drie grote, zachte lichtvelden die traag over
 * het navy schuiven.
 *
 * **Waarom dit een primitief is en geen tekening.** §8 verbiedt illustraties; wat overblijft is
 * licht. Een verloop dat langzaam van plek verandert is precies dat — de lucht boven de horizon
 * die over de dag verschuift — en het is opgebouwd uit dezelfde radiale verlopen als de rest van
 * `components/horizon/`. Er zit geen vorm in die je kunt aanwijzen: zodra je een rand ziet, is de
 * dekking te hoog gezet.
 *
 * **Drie regels die niet mogen schuiven:**
 * - **Alleen `transform` en `opacity` bewegen** (§8), nooit een achtergrondpositie of een kleur:
 *   die laatste twee hertekenen elk frame de hele sectie. Vandaar ook `will-change` per laag.
 * - **De drie duren zijn onderling ondeelbaar** (26s, 31s, 43s). Delen ze een deler, dan komen de
 *   lagen periodiek terug op dezelfde stand en ziet het oog een maat in wat willekeurig moet
 *   lijken.
 * - **Het warme veld is geen zonneschijf.** Het is te groot en te zwak om een schijf te zijn, dus
 *   het telt niet als de ene schijf per compositie — maar zet je de dekking omhoog, dan wordt het
 *   er wel één en is de regel gebroken. Boven ~0,12 wordt oranje op navy bovendien bruin; dat is
 *   waarom de `SunDisc` hier ooit is weggehaald.
 *
 * De keyframes staan in `app/globals.css` (`hero-aurora-*`), met de ontsnapping voor
 * `prefers-reduced-motion` die alle drie de lagen op hun middenstand stilzet.
 */
export default function HeroAurora({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Koel licht linksboven — het helderste veld, en daarmee de leesrichting van de sectie. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(46% 54% at 22% 18%, rgba(120,170,255,0.34) 0%, rgba(120,170,255,0) 70%)',
          animation: 'hero-aurora-a 26s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate',
          willChange: 'transform, opacity',
        }}
      />
      {/* Diep navy rechtsonder. Dit veld maakt donkerder in plaats van lichter, zodat de sectie
          niet in zijn geheel oplicht maar van zwaartepunt wisselt. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(54% 58% at 82% 72%, rgba(0,20,58,0.58) 0%, rgba(0,20,58,0) 72%)',
          animation: 'hero-aurora-b 31s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate',
          willChange: 'transform, opacity',
        }}
      />
      {/* Warm licht rechtsboven: de dageraad, niet de zon. Zie de derde regel in de kop. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(42% 50% at 76% 6%, rgba(254,118,44,0.12) 0%, rgba(254,118,44,0) 66%)',
          animation: 'hero-aurora-c 43s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate',
          willChange: 'transform, opacity',
        }}
      />
    </div>
  );
}
