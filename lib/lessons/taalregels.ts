/**
 * Taalregels — de grammatica als eigen spoor, naast de vier onderdelen.
 *
 * ── WAAROM DIT BESTAAT ───────────────────────────────────────────────────────
 * De 31 A2-grammaticaregels stonden tot 09-09 in blok B van **Lezen**, en dat is precies waar
 * ze niet horen. Op het onderdeelscherm van Lezen las dat als "stap 2 van Lezen · Grammatica ·
 * 2 / 28": een leescursus die halverwege 28 lessen woordorde en werkwoordtijden doet. Woordorde
 * is geen leesvaardigheid. Het was ook de enige scheefheid in de leerlaag — Lezen had 53
 * lessen tegenover 26 / 24 / 26 bij de andere drie, en dat hele verschil zat in dit blok.
 *
 * Twee dingen die dat besluit onderbouwen, uit `docs/decisions/grammar-architecture.html`:
 * **TaalCompleet A2** besteedt 43% van het boek aan grammatica en zet het onder géén enkele
 * vaardigheid — het is een eigen soort paragraaf met een eigen icoontje, verspreid over acht
 * thema's. En **nt2taalmenu.nl**, de meest gebruikte gratis NT2-site, zet *Grammatica* in het
 * hoofdmenu als gelijke van Luisteren, Lezen, Schrijven en Spreken. 28 lessen is dus niet te
 * veel; het label was fout.
 *
 * ── DE LESSEN VERHUIZEN NIET ─────────────────────────────────────────────────
 * Ze blijven staan in `lesson_blocks` van (a2, lezen, B) — zie `RULES_HOME`. Dat is met opzet:
 * `lesson_blocks.onderdeel` is een foreign key naar `skills.slug`, en er een vijfde slug bij
 * verzinnen zou `SKILLS` verbreden. Dan wordt de bundelprijs onbereikbaar, want
 * `priceForSelection` leest `SKILLS.length` om te bepalen of een mandje een heel niveau is.
 * Een vijfde *verkoopbaar* onderdeel is dit ook niet: Taalregels is geen examen en wordt
 * ontsloten door élke A2-module.
 *
 * Wat er dus verandert is waar de lessen vandáán worden geadresseerd, niet waar ze staan.
 *
 * ── HET GEWICHT IS DE TWEEDE HELFT ───────────────────────────────────────────
 * `concept_onderdelen.weight` zegt per onderdeel of je de regel zélf goed moet doen (`kern`)
 * of alleen moet begrijpen (`herkennen`). Zo opent dezelfde bibliotheek voor een schrijver op
 * 19 regels en voor een lezer op 7 — één bibliotheek, vier deuren. Zie de kop van
 * `supabase/migrations/20260909100000_concept_weights.sql`.
 */

import type { Level, OnderdeelSlug } from '@/data/skills';

/**
 * Waar het grammaticablok fysiek staat.
 *
 * Eén plek in de code die dit weet, en elke query gaat erlangs. Zonder deze constante zou
 * `'lezen'` als magische string in vier bestanden staan en zou een verhuizing een zoekactie
 * worden in plaats van een regel.
 */
export const RULES_HOME = {
  onderdeel: 'lezen' as OnderdeelSlug,
  letter: 'B',
} as const;

/** Hoort dit (onderdeel, blokletter) bij de gedeelde regelbibliotheek en niet bij de cursus? */
export function isRulesBlock(onderdeel: OnderdeelSlug, letter: string): boolean {
  return onderdeel === RULES_HOME.onderdeel && letter === RULES_HOME.letter;
}

/** Hoeveel regels in dit onderdeel kern zijn en hoeveel je alleen hoeft te herkennen. */
export type RulesWeights = { kern: number; herkennen: number };
