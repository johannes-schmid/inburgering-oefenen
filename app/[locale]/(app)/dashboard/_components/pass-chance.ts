import type { PassChanceLevel } from '@/components/glas';
import type { SlaagkansBand } from '@/lib/exam-readiness';

/**
 * Van `calculateSlaagkans` naar de vijf standen van de wijzer (§G5). Nul examens is "nog
 * onbekend", nooit "nog niet": dat zou een oordeel zijn over iets dat niet gemeten is. De banden
 * komen uit de bestaande regels, niet uit een AI-oordeel.
 */
export function passChanceLevel(examsCount: number, band: SlaagkansBand): PassChanceLevel {
  if (examsCount === 0) return 0;
  if (band === 'high') return 4;
  if (band === 'good') return 3;
  if (band === 'fair') return 2;
  return 1;
}
