import { describe, expect, it } from 'vitest';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';

const name = (slug: string) => ({ lezen: 'Lezen', luisteren: 'Luisteren', schrijven: 'Schrijven', spreken: 'Spreken' }[slug] ?? slug);

describe('skillTrail', () => {
  it('is Overzicht › A2 › Lezen, met de locale in elk pad', () => {
    const t = skillTrail({ locale: 'en', level: 'a2', skill: 'lezen', overviewLabel: 'Overview', skillName: name });
    expect(t.map(c => c.label)).toEqual(['Overview', 'A2', 'Lezen']);
    expect(t.map(c => c.href)).toEqual([
      '/en/dashboard', '/en/dashboard/a2', '/en/dashboard/a2/lezen',
    ]);
  });

  it('laat het onderdeel zonder link als het het laatste kruimeltje is', () => {
    const t = skillTrail({ locale: 'nl', level: 'a2', skill: 'lezen', overviewLabel: 'Overzicht', skillName: name, last: true });
    expect(t[2].href).toBeUndefined();
  });

  /* Dit is waar het pad voor gebouwd is: vanuit een les naar Luisteren, zonder eerst omhoog. */
  it('hangt de vier taalonderdelen als zusjes aan de onderdeelkruimel', () => {
    const t = skillTrail({ locale: 'nl', level: 'a2', skill: 'lezen', overviewLabel: 'Overzicht', skillName: name });
    expect(t[2].siblings?.map(s => s.label)).toEqual(['Lezen', 'Luisteren', 'Schrijven', 'Spreken']);
    expect(t[2].siblings?.find(s => s.label === 'Lezen')?.current).toBe(true);
    expect(t[2].siblings?.every(s => s.muted !== true)).toBe(true);
  });

  /* Een NULL itemtelling betekent onverifieerd, niet nul — B1 Luisteren heeft geen inhoud. */
  it('dimt een onderdeel zonder geverifieerde itemtelling', () => {
    const t = skillTrail({ locale: 'nl', level: 'b1', skill: 'lezen', overviewLabel: 'Overzicht', skillName: name });
    expect(t[2].siblings?.find(s => s.label === 'Luisteren')?.muted).toBe(true);
    expect(t[2].siblings?.find(s => s.label === 'Lezen')?.muted).toBe(false);
  });
});

describe('closeTrail', () => {
  it('zet het huidige kruimeltje erachter en laat het zonder href', () => {
    const t = closeTrail([{ label: 'Grammatica', href: '/x' }], { label: 'Zinnen bouwen' });
    expect(t.map(c => c.label)).toEqual(['Grammatica', 'Zinnen bouwen']);
    expect(t[1].href).toBeUndefined();
  });

  /* Was eerst niet zo, en dat haalde het onderdeelmenu weg op precies de diepe schermen
     waar het nodig is. Zie de doc-comment bij `Crumb.siblings`. */
  it('bewaart de zustermenu’s van de kruimels ervóór', () => {
    const t = closeTrail(
      [{ label: 'Lezen', href: '/x', siblings: [{ label: 'Luisteren', href: '/y' }] }],
      { label: 'Woordkaarten' },
    );
    expect(t[0].siblings).toHaveLength(1);
  });
});
