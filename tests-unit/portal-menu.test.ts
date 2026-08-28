import { describe, expect, it } from 'vitest';
import { buildPortalMenu } from '@/lib/portal-menu';
import { emptyLevelledProgress } from '@/lib/portal-progress';

const progress = emptyLevelledProgress();

function ids(groups: { id: string }[]) {
  return groups.map(g => g.id);
}

describe('the portal sidebar menu', () => {
  it('offers everything and claims nothing for an account that has bought nothing', () => {
    const menu = buildPortalMenu(null, progress);
    expect(menu.owned).toEqual([]);
    expect(ids(menu.available)).toEqual(['a2', 'b1', 'knm']);
    expect(menu.isEmpty).toBe(true);
  });

  it('puts a level in your cursus as soon as one of its onderdelen is bought', () => {
    const menu = buildPortalMenu({ modules: ['a2:lezen'] }, progress);
    expect(ids(menu.owned)).toEqual(['a2']);
    expect(ids(menu.available)).toEqual(['b1', 'knm']);
  });

  /**
   * The distinction the group's own `owned` flag cannot make. Without it a customer who bought
   * A2 Lezen would see Spreken drawn exactly like the module they paid for, with a progress
   * rail it can never fill — the sidebar telling them they own something the player bounces
   * them out of.
   */
  it('marks the unbought onderdelen inside a bought level', () => {
    const menu = buildPortalMenu({ modules: ['a2:lezen'] }, progress);
    const a2 = menu.owned[0];
    expect(a2.items.filter(i => i.owned).map(i => i.slug)).toEqual(['lezen']);
    expect(a2.items.filter(i => !i.owned).map(i => i.slug)).toEqual(['luisteren', 'schrijven', 'spreken']);
  });

  /** A bare slug in existing metadata means A2 — `normaliseModule()` reads it that way. */
  it('reads a pre-B1 bare slug as an A2 module', () => {
    const menu = buildPortalMenu({ modules: ['lezen'] }, progress);
    expect(ids(menu.owned)).toEqual(['a2']);
  });

  /** KNM carries no level, so it can never fall inside a level group. */
  it('keeps KNM as its own group', () => {
    const menu = buildPortalMenu({ modules: ['knm'] }, progress);
    expect(ids(menu.owned)).toEqual(['knm']);
    expect(menu.owned[0].items.map(i => i.slug)).toEqual(['knm']);
    expect(menu.owned[0].items[0].level).toBeNull();
    expect(ids(menu.available)).toEqual(['a2', 'b1']);
  });

  /** The legacy all-access plan bought "alle oefenexamens" as the offer was then worded. */
  it('gives a legacy plan every group', () => {
    const menu = buildPortalMenu({ plan: 'premium_plus' }, progress);
    expect(ids(menu.owned)).toEqual(['a2', 'b1', 'knm']);
    expect(menu.available).toEqual([]);
  });

  /** Access that has lapsed is not access. */
  it('drops an expired module out of your cursus', () => {
    const menu = buildPortalMenu({ modules: ['a2:lezen'], modules_until: '2020-01-01' }, progress);
    expect(menu.owned).toEqual([]);
  });

  /**
   * B1 Luisteren has no verified format and an examCount of 0. The rail divides by it, so a
   * count of zero must reach the component as zero rather than as a full bar.
   */
  it('never reports more exams than a level actually has', () => {
    const menu = buildPortalMenu({ plan: 'premium' }, progress);
    for (const group of menu.owned) {
      for (const item of group.items) {
        expect(item.examsDone).toBeLessThanOrEqual(item.examCount);
      }
    }
  });
});
