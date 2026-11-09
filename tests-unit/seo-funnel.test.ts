import { describe, expect, it } from 'vitest';
import {
  aiEngine, buildFunnel, emptyCounts, indexState, isSearchSession, kindOfSection, normalisePath, rollupByKind, weakestStep,
} from '@/lib/admin/seo-funnel-model';

describe('aiEngine', () => {
  it('herkent de AI-assistenten aan hun bron', () => {
    expect(aiEngine('chatgpt.com')).toBe('ChatGPT');
    expect(aiEngine('chat.openai.com')).toBe('ChatGPT');
    expect(aiEngine('perplexity')).toBe('Perplexity');
    expect(aiEngine('www.perplexity.ai')).toBe('Perplexity');
    expect(aiEngine('gemini.google.com')).toBe('Gemini');
    expect(aiEngine('copilot.microsoft.com')).toBe('Copilot');
    expect(aiEngine('claude.ai')).toBe('Claude');
  });
  it('rekent gewone bronnen niet mee', () => {
    expect(aiEngine('google')).toBeNull();
    expect(aiEngine('oefenexamen')).toBeNull();
    expect(aiEngine('(not set)')).toBeNull();
  });
});

describe('isSearchSession', () => {
  it('telt organisch zoeken en AI-assistenten, ook als GA4 de AI-bron niet indeelt', () => {
    expect(isSearchSession('Organic Search', 'google')).toBe(true);
    expect(isSearchSession('AI Assistant', 'chatgpt.com')).toBe(true);
    expect(isSearchSession('Unassigned', 'perplexity')).toBe(true);
  });
  it('telt direct, mail en betaald niet', () => {
    expect(isSearchSession('Direct', '(direct)')).toBe(false);
    expect(isSearchSession('Email', 'resend')).toBe(false);
    expect(isSearchSession('Paid Search', 'google')).toBe(false);
  });
});

describe('normalisePath', () => {
  it('haalt een slash aan het eind weg en decodeert', () => {
    expect(normalisePath('/nl/oefenen/')).toBe('/nl/oefenen');
    expect(normalisePath('/ar/%D8%A7')).toBe('/ar/ا');
    expect(normalisePath('/')).toBe('/');
  });
  it('geeft null voor een landingspagina die GA4 niet kent', () => {
    expect(normalisePath('(not set)')).toBeNull();
    expect(normalisePath('')).toBeNull();
  });
});

describe('kindOfSection', () => {
  it('zet de secties van de triage om in de drie soorten van het dashboard', () => {
    expect(kindOfSection('guides')).toBe('gids');
    expect(kindOfSection('knm')).toBe('gids');
    expect(kindOfSection('blog')).toBe('blog');
    expect(kindOfSection('practice')).toBe('practice');
    expect(kindOfSection('core')).toBe('other');
    expect(kindOfSection('translations')).toBe('other');
  });
});

describe('buildFunnel', () => {
  const sessions = [
    { page: '/nl/oefenexamen/a2', channel: 'Organic Search', source: 'google', sessions: 100 },
    { page: '/nl/oefenexamen/a2', channel: 'Direct', source: '(direct)', sessions: 50 },
    { page: '/nl/gidsen/x', channel: 'AI Assistant', source: 'chatgpt.com', sessions: 20 },
    { page: '(not set)', channel: 'Organic Search', source: 'google', sessions: 9 },
  ];
  const events = [
    { page: '/nl/oefenexamen/a2', channel: 'Organic Search', source: 'google', event: 'exam_started', users: 30, value: 0 },
    { page: '/nl/oefenexamen/a2', channel: 'Organic Search', source: 'google', event: 'free_practice_started', users: 5, value: 0 },
    { page: '/nl/oefenexamen/a2', channel: 'Direct', source: '(direct)', event: 'exam_started', users: 40, value: 0 },
    { page: '/nl/oefenexamen/a2', channel: 'Organic Search', source: 'google', event: 'login_initiated', users: 8, value: 0 },
    { page: '/nl/oefenexamen/a2', channel: 'Organic Search', source: 'google', event: 'checkout_initiated', users: 3, value: 0 },
    { page: '/nl/oefenexamen/a2', channel: 'Organic Search', source: 'google', event: 'payment_success_viewed', users: 2, value: 19.9 },
    { page: '/nl/gidsen/x', channel: 'AI Assistant', source: 'chatgpt.com', event: 'free_practice_started', users: 4, value: 0 },
    { page: '/nl/gidsen/x', channel: 'AI Assistant', source: 'chatgpt.com', event: 'page_view', users: 20, value: 0 },
  ];
  const f = buildFunnel(sessions, events);

  it('telt alleen bezoeken uit zoeken en AI, per landingspagina', () => {
    expect(f.byPage['/nl/oefenexamen/a2']).toEqual({ visits: 100, practice: 35, account: 8, checkout: 3, paid: 2, revenue: 19.9 });
    expect(f.byPage['/nl/gidsen/x']).toEqual({ ...emptyCounts(), visits: 20, practice: 4 });
  });
  it('laat landingspagina "(not set)" weg uit de pagina\'s, maar niet uit het totaal', () => {
    expect(f.byPage['(not set)']).toBeUndefined();
    expect(f.total.visits).toBe(129);
  });
  it('splitst AI-bezoeken per assistent', () => {
    expect(f.ai).toEqual([{ engine: 'ChatGPT', sessions: 20 }]);
    expect(f.aiByPage['/nl/gidsen/x']).toBe(20);
  });
});

describe('rollupByKind', () => {
  it('telt per soort pagina op en zet onbekende pagina\'s onder "other"', () => {
    const byPage = {
      '/nl/a': { visits: 10, practice: 2, account: 1, checkout: 0, paid: 0, revenue: 0 },
      '/nl/b': { visits: 5, practice: 1, account: 0, checkout: 0, paid: 0, revenue: 0 },
      '/nl/c': { visits: 3, practice: 0, account: 0, checkout: 0, paid: 0, revenue: 0 },
    };
    const kinds = rollupByKind(byPage, p => (p === '/nl/a' || p === '/nl/b' ? 'gids' : null));
    expect(kinds.gids.visits).toBe(15);
    expect(kinds.gids.practice).toBe(3);
    expect(kinds.other.visits).toBe(3);
    expect(kinds.blog.visits).toBe(0);
  });
});

describe('weakestStep', () => {
  it('wijst de overgang met de laagste conversie aan', () => {
    expect(weakestStep({ visits: 1000, practice: 30, account: 20, checkout: 10, paid: 5, revenue: 0 })).toBe('practice');
    expect(weakestStep({ visits: 100, practice: 50, account: 40, checkout: 2, paid: 1, revenue: 0 })).toBe('checkout');
  });
  it('zegt niets bij te weinig verkeer', () => {
    expect(weakestStep({ visits: 4, practice: 0, account: 0, checkout: 0, paid: 0, revenue: 0 })).toBeNull();
  });
});

describe('indexState', () => {
  it('leest de dekking van URL Inspection', () => {
    expect(indexState({ verdict: 'PASS', coverage: 'Submitted and indexed' })).toBe('indexed');
    expect(indexState({ verdict: 'NEUTRAL', coverage: 'Crawled - currently not indexed' })).toBe('not-indexed');
    expect(indexState({ verdict: 'NEUTRAL', coverage: 'Discovered - currently not indexed' })).toBe('discovered');
    expect(indexState({ verdict: 'FAIL', coverage: 'Server error (5xx)' })).toBe('not-indexed');
    expect(indexState({ verdict: 'NEUTRAL', coverage: 'URL is unknown to Google' })).toBe('not-indexed');
    expect(indexState({ verdict: 'NEUTRAL', coverage: 'Alternate page with proper canonical tag' })).toBe('canonical');
  });
  it('is onbekend zonder controle, nooit "niet geïndexeerd"', () => {
    expect(indexState(undefined)).toBe('unknown');
  });
});
