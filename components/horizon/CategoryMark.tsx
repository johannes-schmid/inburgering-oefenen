import type { ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';
import { BookOpenTextIcon } from '@phosphor-icons/react/dist/ssr/BookOpenText';
import { HeadphonesIcon } from '@phosphor-icons/react/dist/ssr/Headphones';
import { PencilSimpleLineIcon } from '@phosphor-icons/react/dist/ssr/PencilSimpleLine';
import { ChatCircleDotsIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleDots';
import { BankIcon } from '@phosphor-icons/react/dist/ssr/Bank';
import { SignpostIcon } from '@phosphor-icons/react/dist/ssr/Signpost';
import { CompassIcon } from '@phosphor-icons/react/dist/ssr/Compass';
import { CardsIcon } from '@phosphor-icons/react/dist/ssr/Cards';
import { PuzzlePieceIcon } from '@phosphor-icons/react/dist/ssr/PuzzlePiece';
import { ExamIcon } from '@phosphor-icons/react/dist/ssr/Exam';
import { HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { FirstAidIcon } from '@phosphor-icons/react/dist/ssr/FirstAid';
import { BriefcaseIcon } from '@phosphor-icons/react/dist/ssr/Briefcase';
import { cn } from '@/lib/utils';

/**
 * De **categoriemerken** in Glas v1.0: Phosphor Icons, gewicht **fill**, navy op de lichte tegel
 * `#e9eef6` (docs/design/DESIGN_SYSTEM.md §G4, `renderCm` stijl `fill` in docs/design/glas.html).
 *
 * Een categoriemerk benoemt wat er *in* een track zit — een onderdeel, een KNM-thema, een stap van
 * de leerroute, de gidsen. Het staat altijd op een lichte tegel; het track-merk (`ExamMark`) op de
 * omgekeerde navy tegel. Functionele iconen (pijlen, sluiten, slot) blijven lucide.
 *
 * **Dit is de enige plek waar Phosphor de app in komt.** Zet nooit een losse Phosphor-glyph in een
 * pagina: die mist de tegel, en zonder tegel is het geen merk maar een tweede iconenset. Geïmporteerd
 * per icoon uit `dist/ssr`, zodat dit een servercomponent blijft en de bundel alleen deze dertien
 * glyphs bevat.
 *
 * De mapping ligt vast in §G4. `taalregels` en `examen` zijn de Glas-namen; `grammatica` en
 * `examentraining` blijven als aliassen bestaan omdat ze op `ConceptKind` in
 * `lib/lessons/lessons.ts` aansluiten en bestaande pagina's ze doorgeven.
 */

export type Category =
  | 'lezen' | 'luisteren' | 'schrijven' | 'spreken'
  | 'knm' | 'gidsen' | 'ona'
  | 'wonen' | 'gezondheid' | 'werk'
  | 'woorden' | 'taalregels' | 'examen'
  /** Aliassen van `taalregels` en `examen`, voor de leerroute-as (`ConceptKind`). */
  | 'grammatica' | 'examentraining';

const ICONS: Record<Category, ComponentType<IconProps>> = {
  lezen: BookOpenTextIcon,
  luisteren: HeadphonesIcon,
  schrijven: PencilSimpleLineIcon,
  spreken: ChatCircleDotsIcon,
  knm: BankIcon,
  gidsen: SignpostIcon,
  ona: CompassIcon,
  woorden: CardsIcon,
  taalregels: PuzzlePieceIcon,
  grammatica: PuzzlePieceIcon,
  examen: ExamIcon,
  examentraining: ExamIcon,
  wonen: HouseLineIcon,
  gezondheid: FirstAidIcon,
  werk: BriefcaseIcon,
};

type Props = {
  category: Category;
  /** Weergavemaat van de vierkante tegel in px. De glyph is 58% daarvan. */
  size?: number;
  /** `light` op lichte vlakken (navy op `#e9eef6`), `dark` op navy (wit op 12% wit). */
  tone?: 'light' | 'dark';
  /**
   * Zonder tegel: de glyph staat los op wat erachter ligt — alleen voor een groot watermerk in een
   * kaartkop, waar een tegel een tweede rechthoek in de eerste zou tekenen.
   */
  bare?: boolean;
  className?: string;
};

export default function CategoryMark({ category, size = 44, tone = 'light', bare = false, className }: Props) {
  const onDark = tone === 'dark';
  const Icon = ICONS[category];
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center align-middle', className)}
      style={{
        width: size,
        height: size,
        borderRadius: bare ? 0 : Math.round(size * 0.25),
        background: bare ? 'transparent' : onDark ? 'rgba(255,255,255,0.12)' : '#e9eef6',
        boxShadow: bare || !onDark ? 'none' : 'inset 0 0 0 1.5px rgba(255,255,255,0.18)',
        color: onDark ? '#ffffff' : '#002b6d',
      }}
    >
      <Icon weight="fill" size={Math.round(size * 0.58)} aria-hidden="true" />
    </span>
  );
}
