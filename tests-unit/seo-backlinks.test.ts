import { describe, expect, it } from 'vitest';
import { groupByDomain, hostOf, pathOf, prospectStatus, sameSite, type Prospect } from '@/lib/admin/seo-backlinks-model';

describe('hostOf / sameSite / pathOf', () => {
  it('normaliseert host en pad', () => {
    expect(hostOf('https://www.Example.nl/x')).toBe('example.nl');
    expect(hostOf('geen url')).toBeNull();
    expect(pathOf('https://inburgeringoefenen.nl/nl/oefenen/')).toBe('/nl/oefenen');
  });
  it('telt een subdomein als hetzelfde domein, maar geen lookalike', () => {
    expect(sameSite('nl.wikipedia.org', 'wikipedia.org')).toBe(true);
    expect(sameSite('notwikipedia.org', 'wikipedia.org')).toBe(false);
  });
});

describe('groupByDomain', () => {
  const T = 'https://inburgeringoefenen.nl/nl/oefenen';
  const links = [
    { source: 'https://www.knmoefenen.nl/blog/a', anchor: 'oefenen', target: T },
    { source: 'https://knmoefenen.nl/blog/b', anchor: 'A2', target: 'https://inburgeringoefenen.nl/nl/oefenexamen/a2' },
    { source: 'https://knmoefenen.nl/blog/a', anchor: 'oefenen', target: T },
    { source: 'https://inburgeringoefenen.nl/nl/gidsen', anchor: 'intern', target: T },
    { source: 'https://forum.example.nl/t/1', anchor: '', target: T },
  ];
  const g = groupByDomain(links);

  it('laat interne links weg en ontdubbelt', () => {
    expect(g.map(d => d.domain)).toEqual(['knmoefenen.nl', 'forum.example.nl']);
    expect(g[0].links).toHaveLength(2);
  });
  it('noemt de doelpagina\'s per domein', () => {
    expect(g[0].targets).toEqual(['/nl/oefenen', '/nl/oefenexamen/a2']);
  });
});

describe('prospectStatus', () => {
  const p: Prospect = { domain: 'example.nl', url: 'https://example.nl/links', kind: 'resource-list', why: '', how: '', effort: 'low', verified: '2026-11-09' };
  const domains = [{ domain: 'www2.example.nl', links: [], targets: [] }];

  it('wordt groen zodra Bing een link van dat domein ziet', () => {
    expect(prospectStatus({ ...p, status: 'asked' }, domains)).toBe('listed');
  });
  it('volgt anders de status uit het bestand, standaard to do', () => {
    expect(prospectStatus(p, [])).toBe('todo');
    expect(prospectStatus({ ...p, status: 'asked' }, null)).toBe('asked');
    expect(prospectStatus({ ...p, status: 'listed' }, [])).toBe('listed');
  });
});
