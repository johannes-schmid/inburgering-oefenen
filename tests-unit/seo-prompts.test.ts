import { describe, expect, it } from 'vitest';
import { aiPrompt, manualSteps, sourceHint, type PromptPage } from '@/lib/admin/seo-prompts';

const page = (over: Partial<PromptPage> = {}): PromptPage => ({
  path: '/nl/inburgering/inburgering-stappenplan',
  section: 'guides',
  sectionLabel: 'Guides (NL)',
  verdict: 'improve',
  reason: 'Our biggest page.',
  plan: { action: 'Amber reviews and enriches it.', owner: 'amber', week: '2026-W44' },
  demand: 885,
  now: { impressions: 474, clicks: 0, position: 66.6 },
  queries: [{ query: 'inburgering', impressions: 205, position: 58 }],
  score: 5,
  factors: [{ key: 'verdict', delta: -3, label: 'Needs the teacher’s rewrite' }],
  recs: [],
  competitor: null,
  insights: ['Put real practice on public guide pages.'],
  ...over,
});

describe('waar een pagina staat', () => {
  it('wijst gidsen, blogposts en vertalingen naar hun bron', () => {
    expect(sourceHint('/nl/inburgering/moet-ik-inburgeren')).toBe('data/guides/moet-ik-inburgeren.ts');
    expect(sourceHint('/nl/blog/want-of-omdat')).toContain('data/blog-posts.ts');
    expect(sourceHint('/en/blog/dutch-reflexive-verbs')).toContain('translations');
    expect(sourceHint('/nl/oefenexamen/a2/lezen')).toContain('oefenexamen');
  });
});

describe('de prompt voor Claude Code', () => {
  it('noemt de pagina, de cijfers, de concurrenten en de vangrails', () => {
    const p = aiPrompt(page());
    expect(p).toContain('https://inburgeringoefenen.nl/nl/inburgering/inburgering-stappenplan');
    expect(p).toContain('474 impressions');
    expect(p).toContain('Put real practice');
    expect(p).toContain('SEO/facts.md');
    expect(p).toMatch(/Never write "geen AI"/);
    expect(p).toMatch(/teacher’s review/);
  });

  it('een verwijderpagina krijgt noindex, nooit verwijderen', () => {
    const p = aiPrompt(page({ verdict: 'remove' }));
    expect(p).toContain('index: false');
    expect(p).toMatch(/without deleting it/);
  });

  it('zonder live cijfers zegt hij onbekend, geen nul', () => {
    expect(aiPrompt(page({ now: null }))).toContain('unknown');
  });
});

describe('de stappen om het zelf te doen', () => {
  it('neemt de stappen uit de to-dolijst als die er zijn', () => {
    const steps = manualSteps(page({ recs: [{ task: 'x', steps: ['Amber: reads it.', 'Owner: merges it.'] }] }));
    expect(steps.slice(0, 2)).toEqual(['Amber: reads it.', 'Owner: merges it.']);
  });

  it('valt anders terug op het oordeel', () => {
    expect(manualSteps(page({ verdict: 'consolidate', plan: { action: 'merge', owner: 'agent', into: '/nl/x' } })).join(' ')).toContain('/nl/x');
  });
});
