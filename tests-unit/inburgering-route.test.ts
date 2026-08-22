/**
 * The Inburgering route: its phase mapping, its step extraction and its situation verdict.
 *
 * Three things are pinned here, and each of them is a thing that fails *silently* in the browser:
 *
 * 1. **The phase↔guide mapping covers every published guide exactly once.** A guide in no phase is
 *    unreachable from its own hub — the grid that used to list it is gone. A guide in two phases
 *    double-counts its sections, so the progress bars quietly lie. Neither is a type error and
 *    neither throws.
 * 2. **Every guide's sections carry ids, and the ids are identical across nl/en/ar.** That is what
 *    makes reading progress portable between locales and what makes a step link to a real anchor.
 *    A translation that renamed an `id` would split one section's progress into two and scroll to
 *    nothing, on the Arabic page only.
 * 3. **The verdict table.** These are claims about Dutch law restated from a docent-reviewed guide,
 *    and the exemption-before-obligation ordering is the part most likely to be "simplified" by a
 *    later edit into returning `likely` for an EU citizen with a family permit.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '@/data/guides/index';
import { publishedGuides, getGuideLocale } from '@/data/guides/helpers';
import { PHASES, PHASE_IDS, phaseOfGuide, phaseFromParam } from '@/data/guides/phases';
import { guideSections } from '@/lib/guides/sections';
import { evaluateSituation, isComplete, type SituationAnswers } from '@/lib/guides/situation';
import nl from '@/messages/nl.json';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

describe('phases ↔ guides', () => {
  it('references only published inburgering guides', () => {
    const published = new Set(publishedGuides('inburgering').map(g => g.slug));
    for (const phase of PHASES) {
      for (const slug of phase.guides) {
        expect(published, `${phase.id} → ${slug}`).toContain(slug);
      }
    }
  });

  it('places every published inburgering guide in exactly one phase', () => {
    for (const guide of publishedGuides('inburgering')) {
      const hits = PHASES.filter(p => p.guides.includes(guide.slug));
      expect(hits.length, `${guide.slug} is in ${hits.length} phases`).toBe(1);
    }
  });

  it('leaves guides from the other sections out of the route', () => {
    for (const guide of GUIDES.filter(g => g.section !== 'inburgering')) {
      expect(phaseOfGuide(guide.slug)).toBeUndefined();
    }
  });

  it('numbers the phases 1..n in order', () => {
    expect(PHASES.map(p => p.number)).toEqual(PHASES.map((_, i) => i + 1));
  });

  it('falls back to the first phase on an unknown ?fase=', () => {
    expect(phaseFromParam(undefined)).toBe('orienteren');
    expect(phaseFromParam('nonsense')).toBe('orienteren');
    expect(phaseFromParam('kiezen')).toBe('kiezen');
    /* Every id must be round-trippable, or a link the strip writes would land on fase 1. */
    for (const id of PHASE_IDS) expect(phaseFromParam(id)).toBe(id);
  });
});

describe('section extraction', () => {
  const routeGuides = GUIDES.filter(g => phaseOfGuide(g.slug));

  it('finds at least two sections in every guide on the route', () => {
    /* Below two the sidebar nav hides itself, which would leave that guide with no outline and its
       phase with a step list of one — the point at which the route stops being a route. */
    for (const guide of routeGuides) {
      expect(guideSections(guide.articleHtml).length, guide.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps section ids identical across locales, translating only the titles', () => {
    for (const guide of routeGuides) {
      const nl = guideSections(getGuideLocale(guide, 'nl').articleHtml);
      for (const locale of ['en', 'ar'] as const) {
        if (!guide.translations?.[locale]?.articleHtml) continue;
        const other = guideSections(getGuideLocale(guide, locale).articleHtml);
        expect(other.map(s => s.id), `${guide.slug} · ${locale}`).toEqual(nl.map(s => s.id));
        /* And the titles must actually differ, or the "translation" is the Dutch text copied. */
        expect(other.map(s => s.title)).not.toEqual(nl.map(s => s.title));
      }
    }
  });

  it('gives every section a title and a reading estimate of at least one minute', () => {
    for (const guide of routeGuides) {
      for (const s of guideSections(guide.articleHtml)) {
        expect(s.title.trim(), `${guide.slug} · ${s.id}`).not.toBe('');
        expect(s.minutes).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('skips an <h2> with no id rather than inventing one', () => {
    /* A generated slug would differ per locale and split one section's progress three ways. */
    const html = '<h2>Zonder id</h2><p>een</p><h2 id="met-id">Met id</h2><p>twee</p>';
    expect(guideSections(html).map(s => s.id)).toEqual(['met-id']);
  });

  it('strips inline markup to a space, never gluing words together', () => {
    /* `a<br>b` collapsing to `ab` is the exact bug the B1 authoring run hit. */
    const html = '<h2 id="x">Wet 2013 <strong>of</strong><br>Wet 2021</h2><p>tekst</p>';
    expect(guideSections(html)[0].title).toBe('Wet 2013 of Wet 2021');
  });
});

describe('situation check', () => {
  const A = (a: SituationAnswers) => evaluateSituation(a).verdict;

  it('exempts an EU citizen whatever their reason for being here', () => {
    /* The ordering test. Checking the reason first would return `likely` for this reader. */
    for (const reason of ['work_study', 'family', 'asylum', 'unknown'] as const) {
      for (const age of ['under_18', 'working_age', 'pension', 'unknown'] as const) {
        expect(A({ nationality: 'eu', reason, age }), `${reason}/${age}`).toBe('unlikely');
      }
    }
  });

  it('exempts on age before it considers the reason', () => {
    expect(A({ nationality: 'non_eu', reason: 'family', age: 'under_18' })).toBe('unlikely');
    expect(A({ nationality: 'non_eu', reason: 'asylum', age: 'pension' })).toBe('unlikely');
  });

  it('exempts a temporary stay for work or study', () => {
    const r = evaluateSituation({ nationality: 'non_eu', reason: 'work_study', age: 'working_age' });
    expect(r.verdict).toBe('unlikely');
    expect(r.reason).toBe('temporary_stay');
  });

  it('is the only combination that returns likely', () => {
    for (const reason of ['family', 'asylum'] as const) {
      const r = evaluateSituation({ nationality: 'non_eu', reason, age: 'working_age' });
      expect(r.verdict).toBe('likely');
      expect(r.reason).toBe('permit_holder');
      /* And it routes to the act, not to a deadline: which act applies depends on the date on the
         DUO letter, which this tool never asks for. */
      expect(r.next).toEqual({ slug: 'moet-ik-inburgeren', sectionId: 'welke-wet', phase: 'orienteren' });
    }
  });

  it('answers unclear — never likely — when the reader does not know', () => {
    /* The failure that would actually harm someone is telling them the plicht does not apply when
       it might. So an unknown must never resolve to `unlikely` either. */
    const unknowns: SituationAnswers[] = [
      {},
      { nationality: 'unknown', reason: 'unknown', age: 'unknown' },
      { nationality: 'non_eu', reason: 'unknown', age: 'working_age' },
      { nationality: 'unknown', reason: 'family', age: 'working_age' },
      { nationality: 'non_eu', reason: 'family', age: 'unknown' },
    ];
    for (const a of unknowns) {
      expect(A(a), JSON.stringify(a)).toBe('unclear');
    }
  });

  it('always names a real guide section to read next', () => {
    const bySlug = new Map(GUIDES.map(g => [g.slug, g]));
    const combos: SituationAnswers[] = [];
    for (const nationality of ['eu', 'non_eu', 'unknown'] as const)
      for (const reason of ['work_study', 'family', 'asylum', 'unknown'] as const)
        for (const age of ['under_18', 'working_age', 'pension', 'unknown'] as const)
          combos.push({ nationality, reason, age });

    for (const a of combos) {
      const { next } = evaluateSituation(a);
      const guide = bySlug.get(next.slug);
      expect(guide, next.slug).toBeDefined();
      const ids = guideSections(guide!.articleHtml).map(s => s.id);
      expect(ids, `${next.slug}#${next.sectionId}`).toContain(next.sectionId);
      expect(phaseOfGuide(next.slug)?.id).toBe(next.phase);
    }
  });

  it('treats "ik weet het niet" as answered', () => {
    expect(isComplete({ nationality: 'unknown', reason: 'unknown', age: 'unknown' })).toBe(true);
    expect(isComplete({ nationality: 'eu', reason: 'family' })).toBe(false);
  });
});

describe('copy', () => {
  /* Every string the route renders is translated, and a missing key **throws at render** in
     next-intl — so a forgotten Arabic key is a 500 on the Arabic page, not a Dutch fallback. The
     i18n rule in CLAUDE.md ("a new user-facing string goes into all three") is enforced here
     rather than trusted, because the failure is invisible in Dutch development. */
  const flatten = (obj: unknown, prefix = ''): string[] =>
    Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
    );

  const keys = {
    nl: flatten(nl.inburgering_route).sort(),
    en: flatten(en.inburgering_route).sort(),
    ar: flatten(ar.inburgering_route).sort(),
  };

  it('has the same keys in nl, en and ar', () => {
    expect(keys.en).toEqual(keys.nl);
    expect(keys.ar).toEqual(keys.nl);
  });

  it('has a label, title and body for every phase', () => {
    for (const phase of PHASES) {
      for (const field of ['label', 'title', 'body']) {
        expect(keys.nl).toContain(`phase.${phase.id}.${field}`);
      }
    }
  });

  it('has a title and body for every verdict the table can return', () => {
    /* Derived from the table itself, so a new rule cannot ship without its copy — the reason
       `SituationResult.reason` is a closed union rather than a free string. */
    const reasons = new Set<string>();
    for (const nationality of ['eu', 'non_eu', 'unknown'] as const)
      for (const reason of ['work_study', 'family', 'asylum', 'unknown'] as const)
        for (const age of ['under_18', 'working_age', 'pension', 'unknown'] as const)
          reasons.add(evaluateSituation({ nationality, reason, age }).reason);

    expect(reasons.size).toBeGreaterThanOrEqual(6);
    for (const r of reasons) {
      expect(keys.nl, r).toContain(`check.result.${r}.title`);
      expect(keys.nl, r).toContain(`check.result.${r}.body`);
    }
  });

  it('has every option of all three questions', () => {
    const q: Record<string, string[]> = {
      nationality: ['eu', 'non_eu', 'unknown'],
      reason: ['work_study', 'family', 'asylum', 'unknown'],
      age: ['under_18', 'working_age', 'pension', 'unknown'],
    };
    for (const [name, options] of Object.entries(q)) {
      expect(keys.nl).toContain(`check.q.${name}.label`);
      for (const o of options) expect(keys.nl, `${name}.${o}`).toContain(`check.q.${name}.${o}`);
    }
  });
});
