import { describe, expect, it } from 'vitest';
import { canOpenExam, gateFor, onderdeelLabel, premiumUrl, tierFor, TASTER_LIMIT } from '@/lib/mcp/entitlement';

/**
 * De drie lagen van de ChatGPT-app en wat elk mag — besluit eigenaar 04-10. De poortteksten
 * worden niet op bewoording getest, wel op de belofte: welke reden, en of de link een
 * informatiepagina is en geen afrekenlink (OpenAI-beleid: geen checkout in de app).
 */
const FUTURE = new Date(Date.now() + 30 * 86400_000).toISOString();

describe('tierFor', () => {
  it('is anonymous without metadata', () => {
    expect(tierFor(null, 'a2', 'lezen')).toBe('anonymous');
  });

  it('is connected for a free account', () => {
    expect(tierFor({}, 'a2', 'lezen')).toBe('connected');
    expect(tierFor({ modules: [] }, 'a2', 'lezen')).toBe('connected');
  });

  it('is module only for the module that was bought, at that level', () => {
    const meta = { modules: ['a2:lezen'], modules_until: FUTURE };
    expect(tierFor(meta, 'a2', 'lezen')).toBe('module');
    expect(tierFor(meta, 'b1', 'lezen')).toBe('connected');
    expect(tierFor(meta, 'a2', 'luisteren')).toBe('connected');
  });

  it('KNM sits outside the level bundles', () => {
    expect(tierFor({ modules: ['a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken'] }, null, 'knm')).toBe('connected');
    expect(tierFor({ modules: ['knm'] }, null, 'knm')).toBe('module');
  });

  it('an expired module is a free account again', () => {
    expect(tierFor({ modules: ['a2:lezen'], modules_until: '2020-01-01' }, 'a2', 'lezen')).toBe('connected');
  });
});

describe('canOpenExam', () => {
  it('anonymous opens no exam at all — only the taster', () => {
    expect(canOpenExam('anonymous', true)).toBe(false);
  });

  it('connected opens exam 1 (is_free) and nothing else', () => {
    expect(canOpenExam('connected', true)).toBe(true);
    expect(canOpenExam('connected', false)).toBe(false);
  });

  it('module opens everything', () => {
    expect(canOpenExam('module', false)).toBe(true);
  });
});

describe('gates', () => {
  it('ten taster questions, exactly', () => {
    expect(TASTER_LIMIT).toBe(10);
  });

  it('a module gate links to the information page for that module, never to a checkout', () => {
    const gate = gateFor('module_required', 'a2', 'lezen');
    expect(gate.action?.url).toBe(premiumUrl('a2', 'lezen'));
    expect(gate.action?.url).toContain('/premium?vanaf=a2%3Alezen');
    expect(gate.action?.url).toContain('utm_source=chatgpt');
    expect(gate.action?.url).not.toMatch(/checkout|mollie|betaal/i);
  });

  it('login and taster gates point at the free registration', () => {
    expect(gateFor('login_required', 'a2', 'schrijven').action?.url).toContain('/register');
    expect(gateFor('taster_exhausted', null, 'knm').action?.url).toContain('/register');
  });

  it('every gate speaks Dutch and English', () => {
    for (const reason of ['login_required', 'taster_exhausted', 'module_required', 'grading_limit', 'unavailable'] as const) {
      const g = gateFor(reason, 'a2', 'lezen');
      expect(g.message_nl.length).toBeGreaterThan(20);
      expect(g.message_en.length).toBeGreaterThan(20);
    }
  });

  it('labels name the level and the onderdeel, and KNM has no level', () => {
    expect(onderdeelLabel('a2', 'lezen')).toBe('A2 Lezen');
    expect(onderdeelLabel('b1', 'schrijven')).toBe('B1 Schrijven');
    expect(onderdeelLabel(null, 'knm')).toBe('KNM');
  });
});
