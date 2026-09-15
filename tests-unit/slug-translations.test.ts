import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { canonicalSkillPath, localeHref, localizedPath, translateDutchPath } from '@/i18n/paths';
import { isCanonicalSkillParam, parseSkillParam, skillParam } from '@/i18n/skill-slugs';
import { SKILLS } from '@/data/skills';
import { absUrl } from '@/lib/schema';

/**
 * De vertaalde slugs, en de drie manieren waarop ze stil fout kunnen gaan.
 *
 * Alle drie zijn hier al een keer gebeurd of stonden op het punt te gebeuren: een sitemap die
 * een slug noemt die de router niet kent (19-08), een canonical die de taalcode vóór het
 * Nederlandse pad plakt, en een parameterwaarde die maar in één taal wordt herkend.
 */
describe('vertaalde slugs', () => {
  const locales = routing.locales;

  it('geeft elke taal een pad voor elke route', () => {
    for (const [route, entry] of Object.entries(routing.pathnames)) {
      if (typeof entry === 'string') continue;
      for (const locale of locales) {
        expect(entry[locale], `${route} mist ${locale}`).toBeTruthy();
      }
    }
  });

  it('houdt dezelfde parameters in elke taal', () => {
    const paramsOf = (t: string) => (t.match(/\[[^\]]+\]/g) ?? []).sort();
    for (const [route, entry] of Object.entries(routing.pathnames)) {
      if (typeof entry === 'string') continue;
      for (const locale of locales) {
        expect(paramsOf(entry[locale]), `${route} / ${locale}`).toEqual(paramsOf(entry.nl));
      }
    }
  });

  /* Twee routes die in dezelfde taal hetzelfde pad krijgen, zijn één route: de tweede is
   * onbereikbaar en er faalt niets — precies het soort fout dat pas in Search Console opvalt. */
  it('geeft geen twee routes hetzelfde pad binnen één taal', () => {
    for (const locale of locales) {
      const seen = new Map<string, string>();
      for (const [route, entry] of Object.entries(routing.pathnames)) {
        const path = typeof entry === 'string' ? entry : entry[locale];
        expect(seen.get(path), `${route} botst met ${seen.get(path)} in ${locale}`).toBeUndefined();
        seen.set(path, route);
      }
    }
  });

  it('laat Nederlands ongemoeid — die URLs ranken', () => {
    for (const [route, entry] of Object.entries(routing.pathnames)) {
      const nl = typeof entry === 'string' ? entry : entry.nl;
      expect(nl, route).toBe(route);
    }
  });

  it('vertaalt een Nederlands pad naar de slug van die taal', () => {
    expect(translateDutchPath('gidsen', 'en')).toBe('guides');
    expect(translateDutchPath('oefenexamen/a2/lezen', 'en')).toBe('practice-exam/a2/reading');
    expect(translateDutchPath('oefenen/b1/spreken', 'en')).toBe('practice/b1/speaking');
    expect(translateDutchPath('taalexamens/woordenlijst', 'en')).toBe('language-exams/glossary');
    expect(translateDutchPath('oefenexamen/knm/3', 'en')).toBe('practice-exam/knm/3');
  });

  /* `/knm/woordenlijst` en `/knm/[thema]` passen allebei op twee segmenten; het statische pad
   * hoort te winnen, net als in de App Router zelf. */
  it('laat een statisch segment winnen van een parameter', () => {
    expect(translateDutchPath('knm/woordenlijst', 'en')).toBe('knm/glossary');
    /* `wonen` is een bestaande gids, dus hij wordt als parameterwaarde vertaald — het punt
     * hier is dat `woordenlijst` hierboven níét als gids-slug wordt gelezen. */
    expect(translateDutchPath('knm/wonen', 'en')).toBe('knm/housing');
  });

  /* Sinds 15-09 vertaald, zie `i18n/content-slugs.ts`. Een slug die niet in die tabel staat —
   * een gids die nog geschreven moet worden — blijft staan zoals hij is. */
  it('vertaalt een gids-slug en een blogslug die in de tabel staan', () => {
    expect(translateDutchPath('inburgering/wat-kost-inburgeren', 'en'))
      .toBe('civic-integration/what-does-integration-cost');
    expect(translateDutchPath('blog/taalniveaus-a1-a2-b1-nederlands', 'en'))
      .toBe('blog/dutch-language-levels-a1-a2-b1');
  });

  it('laat een slug die niet in de tabel staat met rust', () => {
    expect(translateDutchPath('inburgering/inburgeringsexamen-2026', 'en'))
      .toBe('civic-integration/inburgeringsexamen-2026');
  });

  it('laat een onbekend pad ongewijzigd', () => {
    expect(translateDutchPath('bestaat/niet', 'en')).toBe('bestaat/niet');
  });

  it('bouwt absolute URLs met de slug van de taal', () => {
    expect(absUrl('en', 'gidsen')).toBe('https://inburgeringoefenen.nl/en/guides');
    expect(absUrl('nl', 'gidsen')).toBe('https://inburgeringoefenen.nl/nl/gidsen');
    expect(absUrl('en')).toBe('https://inburgeringoefenen.nl/en');
  });

  it('houdt een query of anker heel', () => {
    expect(localeHref('en', 'contact?from=dashboard')).toBe('/en/contact?from=dashboard');
    expect(localeHref('en', 'oefenen/lezen#uitleg')).toBe('/en/practice/reading#uitleg');
    expect(localeHref('en', '')).toBe('/en');
  });

  it('vult localizedPath met de vertaalde onderdeelnaam', () => {
    expect(localizedPath('/oefenexamen/[level]/[skill]', 'en', { level: 'a2', skill: 'lezen' }))
      .toBe('/en/practice-exam/a2/reading');
    expect(localizedPath('/oefenexamen/[level]/[skill]', 'nl', { level: 'a2', skill: 'lezen' }))
      .toBe('/nl/oefenexamen/a2/lezen');
  });
});

describe('de onderdeelnaam als parameterwaarde', () => {
  it('heeft een eigen spelling per taal, en die is uniek', () => {
    for (const locale of routing.locales) {
      const spellings = SKILLS.map(s => skillParam(s.slug, locale));
      expect(new Set(spellings).size, locale).toBe(SKILLS.length);
    }
  });

  /* De Engelse en Arabische URL's van vóór 15-09 dragen de Nederlandse naam, en die staan in
   * verstuurde mails en in de index. Ze moeten blijven werken. */
  it('leest élke taal terug naar dezelfde SkillSlug', () => {
    for (const skill of SKILLS) {
      for (const locale of routing.locales) {
        expect(parseSkillParam(skillParam(skill.slug, locale))).toBe(skill.slug);
      }
      expect(parseSkillParam(encodeURIComponent(skillParam(skill.slug, 'ar')))).toBe(skill.slug);
    }
  });

  it('kent geen onzin als onderdeel', () => {
    expect(parseSkillParam('knm')).toBeUndefined();
    expect(parseSkillParam('')).toBeUndefined();
    expect(parseSkillParam('%E0%A4%A')).toBeUndefined();
  });

  /* Dit is wat de 308 op de pagina aanstuurt: de Nederlandse naam op een Engels pad is géén
   * canonieke URL, en moet doorverwijzen in plaats van een tweede vindplaats te worden. */
  it('herkent een niet-canonieke spelling voor dit pad', () => {
    expect(isCanonicalSkillParam('reading', 'lezen', 'en')).toBe(true);
    expect(isCanonicalSkillParam('lezen', 'lezen', 'en')).toBe(false);
    expect(isCanonicalSkillParam('lezen', 'lezen', 'nl')).toBe(true);
  });
});

/**
 * De 308 die `proxy.ts` zet. Hij staat daar en niet op de pagina omdat de overzichtspagina
 * statisch wordt gerenderd: een `permanentRedirect()` levert daar een 200 met de omleiding ín
 * de pagina, en de verkeerde URL blijft dus gewoon bestaan.
 */
describe('canonicalSkillPath', () => {
  it('rekent de onderdeelnaam van een andere taal om', () => {
    expect(canonicalSkillPath('/en/practice-exam/a2/lezen')).toBe('/en/practice-exam/a2/reading');
    expect(canonicalSkillPath('/en/practice/lezen')).toBe('/en/practice/reading');
    expect(canonicalSkillPath('/en/practice/b1/lezen')).toBe('/en/practice/b1/reading');
  });

  /* `nextUrl.pathname` is procent-gecodeerd; `routing.ts` bevat de letterlijke slug. */
  it('herkent een procent-gecodeerd Arabisch pad', () => {
    expect(canonicalSkillPath('/ar/%D8%AA%D8%AF%D8%B1%D8%A8/lezen'))
      .toBe('/ar/تدرب/القراءة');
  });

  it('laat een canonieke URL met rust', () => {
    expect(canonicalSkillPath('/en/practice-exam/a2/reading')).toBeUndefined();
    expect(canonicalSkillPath('/nl/oefenen/lezen')).toBeUndefined();
    expect(canonicalSkillPath('/ar/تدرب/القراءة')).toBeUndefined();
  });

  /* Het portaal draagt dezelfde vier waarden maar heeft géén vertaalde slug, dus
   * `/en/dashboard/a2/reading` bestaat niet. Dit meenemen haalt het portaal onderuit. */
  it('blijft van het portaal af', () => {
    expect(canonicalSkillPath('/en/dashboard/a2/lezen')).toBeUndefined();
    expect(canonicalSkillPath('/en/leren/lezen')).toBeUndefined();
  });

  it('laat KNM en het niveau ongemoeid', () => {
    expect(canonicalSkillPath('/en/practice-exam/knm/3')).toBeUndefined();
    expect(canonicalSkillPath('/en/practice/knm')).toBeUndefined();
  });

  it('negeert wat geen taalcode is', () => {
    expect(canonicalSkillPath('/api/grade-open')).toBeUndefined();
    expect(canonicalSkillPath('/')).toBeUndefined();
  });
});
