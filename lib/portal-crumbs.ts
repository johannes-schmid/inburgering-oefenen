/**
 * Het kruimelpad van het studieportaal — de vorm, en de twee vaste kruimels.
 *
 * Sinds de leerlaag drie niveaus diep gaat (onderdeel → spoor → module → les) is "terug" niet
 * één plek meer. Eén terugknop kon alleen de vorige zeggen; het pad zegt ze allemaal, en het
 * laatste kruimeltje is een keuzemenu naar zijn zusjes — dus vanuit *De hoofdzin* spring je naar
 * elke andere les van die module zonder eerst omhoog te klikken.
 *
 * Client-veilig en puur: geen queries, geen vertalingen. De labels komen van de aanroeper, die
 * `getTranslations` al heeft — dezelfde afspraak als `coursePanel` in `components/nav.ts`.
 */

import { levelLabel, skillsAtLevel, type Level, type SkillSlug } from '@/data/skills';

/** Een zusje van het laatste kruimeltje: waar je zijwaarts naartoe kunt. */
export type CrumbSibling = {
  label: string;
  href: string;
  /** Waar je nu staat. Krijgt een vinkje en geen link. */
  current?: boolean;
  /** Bestaat, maar niet voor jou (geen module) of nog leeg. Grijs, wél klikbaar. */
  muted?: boolean;
};

export type Crumb = {
  label: string;
  /** Zonder `href` is het kruimeltje de huidige pagina. */
  href?: string;
  /**
   * De zusjes van dit kruimeltje. Maakt er een keuzemenu van.
   *
   * Op **elk** kruimeltje dat ze heeft en niet alleen het laatste. Dat was eerst wel zo (naar de
   * referentie, waar alleen het laatste een chevron draagt) en het haalde juist de sprong weg
   * waar dit pad voor gebouwd is: vanuit een les naar Luisteren. Dat zusje hangt aan de
   * *onderdeel*-kruimel, drie plekken terug.
   */
  siblings?: CrumbSibling[];
};

/**
 * De vaste kop van elk kruimelpad binnen een onderdeel: Overzicht › Niveau A2 › Lezen.
 *
 * Hier en niet in elke pagina, want zes pagina's beginnen hiermee en zes kopieën lopen uit
 * elkaar — precies waarom `coursePanel` ook op één plek staat. De onderdeelkruimel draagt de
 * andere taalonderdelen van hetzelfde niveau als zusjes: van A2-Lezen naar A2-Luisteren is de
 * sprong die een kandidaat het vaakst maakt.
 */
export function skillTrail(input: {
  locale: string;
  level: Level;
  /** `/dashboard` — het portaaloverzicht. */
  overviewLabel: string;
  skill: SkillSlug;
  /** Per onderdeelslug zijn naam in de taal van de kandidaat. */
  skillName: (slug: SkillSlug) => string;
  /** Is dit het laatste kruimeltje? Dan geen link en wél het zustermenu. */
  last?: boolean;
}): Crumb[] {
  const { locale, level, overviewLabel, skill, skillName, last } = input;
  const p = (path: string) => `/${locale}${path}`;

  return [
    { label: overviewLabel, href: p('/dashboard') },
    { label: levelLabel(level), href: p(`/dashboard/${level}`) },
    {
      label: skillName(skill),
      href: last ? undefined : p(`/dashboard/${level}/${skill}`),
      siblings: skillsAtLevel(level).map(s => ({
        label: skillName(s.slug),
        href: p(`/dashboard/${level}/${s.slug}`),
        current: s.slug === skill,
        // Een onderdeel zonder geverifieerde itemtelling heeft nog geen inhoud — dezelfde
        // NULL-betekent-onbekend-regel als in `data/skills.ts`. B1 Luisteren valt hieronder.
        muted: s.itemCount === null,
      })),
    },
  ];
}

/**
 * Sluit een pad af met het kruimeltje van de huidige pagina.
 *
 * Alleen dat laatste mist een `href` — dat is wat "je bent hier" betekent. De zustermenu's van
 * de kruimels ervóór blijven staan; zie `Crumb.siblings`.
 */
export function closeTrail(trail: Crumb[], last: Crumb): Crumb[] {
  return [...trail, last];
}
