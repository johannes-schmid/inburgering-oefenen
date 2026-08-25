import { describe, expect, it } from 'vitest';
import {
  KNM, KNM_RULES, KNM_SLUG, KNM_THEMES, LEVELS, SKILLS,
  catalogueOnderdelen, formatOf, isFreeExamOf, isFreeKnmExam, isKnm,
  isOnderdeelSlug, isSkillSlug, moduleGroupLabel, rulesOf,
} from '@/data/skills';
import { KNM_MODULE_ID, normaliseModule, ownsKnm, ownsModule } from '@/lib/entitlements';
import {
  BUNDLE_PRICE_CENTS, MODULE_PRICE_CENTS, MODULES, getModule,
  modulesForLevel, parseSelection, priceForSelection,
} from '@/lib/pricing';

/**
 * KNM is the fifth onderdeel and the only one that is not levelled. Almost every bug this file
 * exists to prevent has the same shape: a level-shaped assumption quietly treating KNM as A2.
 */
describe('KNM is not one of the four taalonderdelen', () => {
  it('is absent from SKILLS, which the per-level arithmetic counts', () => {
    // `priceForSelection` reads `SKILLS.length` to decide a basket holds a *complete level*.
    // Adding KNM here would make the A2 bundle unreachable — four of five is not complete.
    expect(SKILLS.map(s => s.slug)).not.toContain(KNM_SLUG);
    expect(SKILLS).toHaveLength(4);
  });

  it('is not a SkillSlug but is an OnderdeelSlug', () => {
    expect(isSkillSlug(KNM_SLUG)).toBe(false);
    expect(isOnderdeelSlug(KNM_SLUG)).toBe(true);
    expect(isKnm(KNM_SLUG)).toBe(true);
  });

  it('declares itself non-levelled and stimulus-less', () => {
    // Both mirror its `skills` row and are what let `exams.level` and `questions.stimulus_id`
    // be NULL for this onderdeel only.
    expect(KNM.isLevelled).toBe(false);
    expect(KNM.requiresStimulus).toBe(false);
  });
});

describe('the catalogue axis', () => {
  it('gives KNM alone for the null catalogue and the four for a level', () => {
    expect(catalogueOnderdelen(null).map(s => s.slug)).toEqual([KNM_SLUG]);
    for (const level of LEVELS) expect(catalogueOnderdelen(level)).toHaveLength(4);
  });

  it('refuses a mismatched (catalogue, onderdeel) pair rather than falling back', () => {
    // The failure to prevent is a KNM lookup silently returning A2 Lezen's format.
    expect(formatOf(null, 'knm')).toBe(KNM);
    expect(formatOf('a2', 'knm')).toBeUndefined();
    expect(formatOf(null, 'lezen')).toBeUndefined();
  });

  it('carries KNM rules only on the null catalogue', () => {
    expect(rulesOf(null, 'knm')).toBe(KNM_RULES);
    expect(rulesOf('a2', 'knm').options).toBeNull();
  });

  it('names the KNM group for the onderdeel, never "Niveau KNM"', () => {
    expect(moduleGroupLabel(null)).toBe('KNM');
    expect(moduleGroupLabel('a2')).toBe('A2');
  });
});

describe('KNM format', () => {
  it('is three options exactly — the whole bank is A/B/C', () => {
    expect(KNM_RULES.options).toEqual([3, 3]);
  });

  it('has a verified item count and duration, so its page is indexable', () => {
    // `robots`, the sitemap and lib/llms.ts all gate on `itemCount !== null`.
    expect(KNM.itemCount).toBe(40);
    expect(KNM.durationMinutes).toBe(45);
    expect(KNM.examCount).toBe(10);
  });

  it('has seven thema\'s, each with a distinct guide and lesson slug', () => {
    expect(KNM_THEMES).toHaveLength(7);
    expect(new Set(KNM_THEMES.map(t => t.id)).size).toBe(7);
    expect(new Set(KNM_THEMES.map(t => t.guideSlug)).size).toBe(7);
    expect(new Set(KNM_THEMES.map(t => t.lessonSlug)).size).toBe(7);
  });
});

describe('free exams', () => {
  it('gives away exam 1 and nothing else', () => {
    expect(isFreeKnmExam(1)).toBe(true);
    expect(isFreeKnmExam(2)).toBe(false);
    expect(isFreeExamOf(null, 1)).toBe(true);
    // B1 gives nothing away; the null catalogue must not inherit that answer.
    expect(isFreeExamOf('b1', 1)).toBe(false);
  });
});

describe('entitlement', () => {
  // `plan: 'free'` is not decoration: the exported `Meta` type is structural over
  // plan/tier/premium, and it is also the case that matters — a legacy all-access plan opens
  // everything, so a module-only account is the one that can actually be wrong.
  const knmOnly = { plan: 'free', modules: ['knm'] };
  const a2Only = { plan: 'free', modules: ['a2:lezen'] };

  it('reads a bare `knm` as the KNM module, not as an A2 skill', () => {
    // `knm` is not a SkillSlug, so the bare-slug branch would reject it and void a purchase.
    expect(normaliseModule('knm')).toBe(KNM_MODULE_ID);
    expect(normaliseModule('lezen')).toBe('a2:lezen');
  });

  it('keeps KNM and the levelled modules apart in both directions', () => {
    expect(ownsKnm(knmOnly)).toBe(true);
    expect(ownsModule(knmOnly, 'a2', 'lezen')).toBe(false);
    expect(ownsKnm(a2Only)).toBe(false);
    expect(ownsModule(a2Only, 'a2', 'lezen')).toBe(true);
  });

  it('still opens KNM for a legacy all-access plan', () => {
    expect(ownsKnm({ plan: 'premium_plus' })).toBe(true);
  });
});

describe('pricing', () => {
  it('sells KNM as its own module at the plain price', () => {
    const knm = getModule(KNM_MODULE_ID);
    expect(knm?.level).toBeNull();
    expect(knm?.priceCents).toBe(MODULE_PRICE_CENTS);
    expect(priceForSelection([KNM_MODULE_ID])).toBe(MODULE_PRICE_CENTS);
  });

  it('leaves KNM out of both level bundles', () => {
    // The bundle is "de vier taalonderdelen van één niveau". Three of them plus KNM is four
    // modules and must NOT price as a bundle.
    const a2 = modulesForLevel('a2').map(m => m.slug);
    expect(a2).not.toContain(KNM_MODULE_ID);
    expect(priceForSelection(a2)).toBe(BUNDLE_PRICE_CENTS);
    expect(priceForSelection([...a2.slice(0, 3), KNM_MODULE_ID])).toBe(4 * MODULE_PRICE_CENTS);
    // A full bundle plus KNM is the bundle plus one module, never a bigger discount.
    expect(priceForSelection([...a2, KNM_MODULE_ID])).toBe(BUNDLE_PRICE_CENTS + MODULE_PRICE_CENTS);
  });

  it('never drops KNM silently from a posted basket', () => {
    // The loop over LEVELS cannot see a level-less module; if it were not added explicitly the
    // customer would get it for nothing.
    expect(parseSelection(['knm'])).toEqual([KNM_MODULE_ID]);
    expect(priceForSelection(parseSelection(['knm']))).toBeGreaterThan(0);
  });

  it('has exactly one level-less module', () => {
    expect(MODULES.filter(m => m.level === null)).toHaveLength(1);
  });
});
