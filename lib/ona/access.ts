import { ONA_CARDS, ONA_FREE_CARD } from '@/data/ona/cards';
import { ONA_GESPREK_STATUS } from '@/data/ona/eindgesprek';
import { ownsOna } from '@/lib/entitlements';

/**
 * Staat ONA open — in het portaal, in het menu en te koop?
 *
 * **Pas als de docent alle inhoud heeft nagekeken**: de acht kaarten (`data/ona/cards.ts`) én de
 * vragenbank van het eindgesprek. Tot dan is ONA overal "binnenkort", zoals het was. Dat is de
 * regel uit CLAUDE.md §2: niets publiceert zonder haar review.
 *
 * Lokaal (`next dev`) staat het wél open, zodat de module te bekijken en na te kijken is. Op
 * Vercel draait alles als `production`, previews ook, dus daar beslist alleen de review.
 */
export function isOnaReviewed(): boolean {
  return ONA_CARDS.every(c => c.status === 'reviewed') && ONA_GESPREK_STATUS === 'reviewed';
}

/**
 * **Vrijgegeven door de eigenaar op 14-10-2026, vóór de review van de docent.** De kaarten en de
 * vragenbank blijven op `concept` staan, want die status is het verslag van háár nakijken en mag
 * niets beweren wat niet gebeurd is. Zolang `isOnaReviewed()` false is, toont het portaal daarom
 * `ona.draft_notice` en géén `ValidationChip`. Zet de kaarten op `reviewed` zodra Amber ze heeft
 * nagekeken; deze vlag kan dan weg.
 */
const ONA_RELEASED_BY_OWNER = true;

export function isOnaAvailable(): boolean {
  return ONA_RELEASED_BY_OWNER || isOnaReviewed() || process.env.NODE_ENV === 'development';
}

type Meta = Parameters<typeof ownsOna>[0];

/** Kaart 1 staat open met een gratis account; de rest hoort bij de module. */
export function canOpenOnaCard(meta: Meta, cardNo: number): boolean {
  return cardNo === ONA_FREE_CARD || ownsOna(meta);
}

/** Zonder module één oefengesprek, net als "examen 1 gratis". */
export const ONA_FREE_PRACTICE_SESSIONS = 1;

export function canStartOnaPractice(meta: Meta, sessionsSoFar: number): boolean {
  return ownsOna(meta) || sessionsSoFar < ONA_FREE_PRACTICE_SESSIONS;
}
