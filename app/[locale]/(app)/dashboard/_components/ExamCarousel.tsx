'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, useCarousel } from '@/components/ui/carousel';

/**
 * De strook oefenexamens als carrousel — embla via `components/ui/carousel`.
 *
 * De strook was een `overflow-x`-scroller. Dat werkt met een trackpad en met niets anders: op een
 * muis is er geen greep, en tien kaartjes passen op geen enkele contentbreedte die dit portaal
 * heeft. **De pijlen verschijnen alleen als er iets buiten beeld staat** — `canScrollPrev` en
 * `canScrollNext` zijn beide `false` zolang alles past, en dan is een uitgegrijsde pijl (wat de
 * shadcn-knoppen doen) een affordance die naar niets wijst.
 *
 * De pijlen staan in de kop en niet zwevend over de kaartjes: dit blok zit onderaan een lange
 * pagina, en een knop die half over een kaartje hangt kost de bovenste kaartrand.
 *
 * **`direction` gaat mee met de taal.** In het Arabisch begint de strook rechts; embla rekent zijn
 * eigen assen om, dus dat moet hier gezegd worden en niet in de CSS.
 */
export default function ExamCarousel({
  head, rtl, prevLabel, nextLabel, children,
}: {
  /** De kop van het paneel, server-gerenderd — de pijlen komen erachter. */
  head: React.ReactNode;
  rtl: boolean;
  prevLabel: string;
  nextLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Carousel
      className="es-carousel"
      opts={{ align: 'start', direction: rtl ? 'rtl' : 'ltr', slidesToScroll: 'auto' }}
    >
      <div className="es-head">
        {head}
        <Nav prevLabel={prevLabel} nextLabel={nextLabel} />
      </div>
      <CarouselContent className="es-track">{children}</CarouselContent>
    </Carousel>
  );
}

function Nav({ prevLabel, nextLabel }: { prevLabel: string; nextLabel: string }) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
  if (!canScrollPrev && !canScrollNext) return null;

  return (
    <div className="es-nav">
      <button type="button" onClick={scrollPrev} disabled={!canScrollPrev} aria-label={prevLabel}>
        <ChevronLeft size={16} strokeWidth={2.6} className="rtl-flip" aria-hidden />
      </button>
      <button type="button" onClick={scrollNext} disabled={!canScrollNext} aria-label={nextLabel}>
        <ChevronRight size={16} strokeWidth={2.6} className="rtl-flip" aria-hidden />
      </button>
    </div>
  );
}
