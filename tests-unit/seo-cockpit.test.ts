import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  expectedSnapshotWeek, ledgerStatus, markPreliminary, mergeDaily, parseBingDate, parseSourceStatus, planAmberWeek, squarify,
  recoveryRead, type DayPoint, type Recommendation,
} from '@/lib/admin/seo-model';

const day = (date: string, google: number | null, bing: number | null): DayPoint =>
  ({ date, google, googleClicks: google === null ? null : 0, bing, bingClicks: bing === null ? null : 0 });

/** `n` dagen vanaf `start` met een vaste waarde per zoekmachine. */
function run(start: string, n: number, google: number | null, bing: number | null): DayPoint[] {
  const d = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i);
    return day(x.toISOString().slice(0, 10), google, bing);
  });
}

describe('bronstatus uit index.json', () => {
  it('leest ok, skipped en error, en ontbrekend is onbekend', () => {
    expect(parseSourceStatus('ok (2s)').state).toBe('ok');
    expect(parseSourceStatus('skipped: oneven week (2026-W43)')).toEqual({ state: 'skipped', detail: 'oneven week (2026-W43)' });
    expect(parseSourceStatus('error: 403 Forbidden').state).toBe('error');
    expect(parseSourceStatus(undefined).state).toBe('missing');
  });
});

describe('Bing-datums', () => {
  it('zet /Date(ms)/ om naar een UTC-dag', () => {
    expect(parseBingDate('/Date(1792281600000)/')).toBe('2026-10-18');
    expect(parseBingDate('/Date(1792281600000-0700)/')).toBe('2026-10-18');
    expect(parseBingDate('kapot')).toBeNull();
  });
});

describe('dagreeks van Google en Bing', () => {
  it('de nieuwste snapshot wint per dag, en een dag zonder bron blijft null', () => {
    const merged = mergeDaily(
      [
        [{ date: '2026-10-01', clicks: 0, impressions: 5 }],
        [{ date: '2026-10-01', clicks: 1, impressions: 7 }, { date: '2026-10-02', clicks: 0, impressions: 9 }],
      ],
      [{ Date: '/Date(1790899200000)/', Clicks: 3, Impressions: 40 }],
    );
    expect(merged).toEqual([
      { date: '2026-10-01', google: 7, googleClicks: 1, bing: null, bingClicks: null },
      { date: '2026-10-02', google: 9, googleClicks: 0, bing: 40, bingClicks: 3 },
    ]);
  });
});

describe('herstel-oordeel', () => {
  it('ziet een val bij Google die Bing niet heeft als een Google-probleem', () => {
    const points = [...run('2026-08-01', 40, 200, 300), ...run('2026-09-10', 30, 20, 320)];
    const r = recoveryRead(points);
    expect(r.tone).toBe('alarm');
    expect(r.googleRatio).toBeCloseTo(0.1, 2);
    expect(r.bingRatio).toBeGreaterThan(0.9);
    expect(r.cause).toBe('google');
  });
  it('blijft rustig zonder val', () => {
    const r = recoveryRead(run('2026-08-01', 60, 100, 100));
    expect(r.tone).toBe('rustig');
    expect(r.cause).toBeNull();
  });
  it('zegt niets zonder genoeg dagen', () => {
    expect(recoveryRead(run('2026-08-01', 10, 100, 100)).tone).toBe('onbekend');
  });
});

describe('ledger-status', () => {
  const entry = { date: '2026-10-01', window_end: '2026-11-05', verdict: null };
  it('loopt tot het venster dicht is', () => {
    const s = ledgerStatus(entry, '2026-10-19');
    expect(s.kind).toBe('loopt');
    expect(s.daysLeft).toBe(17);
    expect(s.progress).toBeCloseTo(18 / 35, 2);
  });
  it('vraagt om een oordeel zodra het venster dicht is', () => {
    expect(ledgerStatus(entry, '2026-11-05').kind).toBe('oordeel-nodig');
  });
  it('neemt een ingevuld oordeel over', () => {
    expect(ledgerStatus({ ...entry, verdict: 'worked' }, '2026-12-01').kind).toBe('worked');
  });
});

describe('voorlopige dagen', () => {
  it('markeert vandaag en de twee dagen ervoor', () => {
    const marked = markPreliminary(run('2026-10-20', 7, 1, null), '2026-10-26');
    expect(marked.filter(p => p.preliminary).map(p => p.date)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26']);
  });
});

describe('versheid van de snapshot', () => {
  it('verwacht na vrijdagavond de week van die vrijdag', () => {
    expect(expectedSnapshotWeek(new Date('2026-10-26T08:00:00Z'))).toBe('2026-W43');
    expect(expectedSnapshotWeek(new Date('2026-10-24T08:00:00Z'))).toBe('2026-W43');
    expect(expectedSnapshotWeek(new Date('2026-10-23T12:00:00Z'))).toBe('2026-W42');
  });
});

describe('Ambers week', () => {
  const rec = (id: string, minutes: number, priority: Recommendation['priority'], status: Recommendation['status'] = 'open'): Recommendation => ({
    id, created: '2026-10-26', site: 'inburgering', owner: 'amber', kind: 'content', priority, task: id, why: '', steps: [], expect: '',
    minutes, source: '', status,
  });
  it('vult het budget op volgorde van prioriteit en schuift de rest door', () => {
    const plan = planAmberWeek([rec('c', 60, 'later'), rec('a', 60, 'now'), rec('b', 60, 'next')], 150);
    expect(plan.thisWeek.map(r => r.id)).toEqual(['a', 'b']);
    expect(plan.later.map(r => r.id)).toEqual(['c']);
    expect(plan.minutes).toBe(120);
  });
  it('telt gedane en afgewezen items niet mee', () => {
    const plan = planAmberWeek([rec('a', 60, 'now', 'done'), rec('b', 60, 'now', 'dismissed')], 150);
    expect(plan.thisWeek).toEqual([]);
  });
});

describe('seo-agent/recommendations.json', () => {
  const file = JSON.parse(readFileSync('seo-agent/recommendations.json', 'utf8'));
  it('heeft unieke ids en alleen bekende eigenaars, soorten, prioriteiten en statussen', () => {
    const ids = file.items.map((r: Recommendation) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of file.items as Recommendation[]) {
      expect(['eigenaar', 'amber', 'agent']).toContain(r.owner);
      expect(['measurement', 'cleanup', 'content', 'title', 'technical', 'decision']).toContain(r.kind);
      expect(['now', 'next', 'later']).toContain(r.priority);
      expect(['open', 'planned', 'in-progress', 'done', 'dismissed']).toContain(r.status);
      if (r.owner === 'amber') expect(r.minutes).toBeGreaterThan(0);
    }
  });
  it('zegt bij elke taak waarom, wat de volgende stap is en wat we verwachten', () => {
    for (const r of file.items as Recommendation[]) {
      expect(r.why.length, r.id).toBeGreaterThan(20);
      expect(r.steps.length, r.id).toBeGreaterThan(0);
      expect(r.expect.length, r.id).toBeGreaterThan(20);
    }
  });
});

describe('treemap', () => {
  const rect = { x: 0, y: 0, w: 600, h: 400 };
  const items = [60, 30, 20, 20, 10, 6, 4, 1, 0].map((value, i) => ({ value, item: `p${i}` }));
  const tiles = squarify(items, rect);
  it('geeft elke positieve waarde een tegel met een evenredig oppervlak', () => {
    expect(tiles).toHaveLength(8);
    const total = 151;
    for (const t of tiles) {
      const v = items.find(i => i.item === t.item)!.value;
      expect(t.w * t.h).toBeCloseTo((v / total) * 600 * 400, 3);
    }
  });
  it('blijft binnen het vlak en overlapt niet', () => {
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(-1e-6);
      expect(t.y).toBeGreaterThanOrEqual(-1e-6);
      expect(t.x + t.w).toBeLessThanOrEqual(600 + 1e-6);
      expect(t.y + t.h).toBeLessThanOrEqual(400 + 1e-6);
    }
    for (let a = 0; a < tiles.length; a++) for (let b = a + 1; b < tiles.length; b++) {
      const A = tiles[a], B = tiles[b];
      const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
      const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      expect(ox > 1e-6 && oy > 1e-6).toBe(false);
    }
  });
  it('maakt de grootste tegels niet extreem langwerpig', () => {
    const big = tiles.find(t => t.item === 'p0')!;
    expect(Math.max(big.w / big.h, big.h / big.w)).toBeLessThan(3);
  });
  it('zonder waarde geen tegels', () => {
    expect(squarify([{ value: 0, item: 'x' }], rect)).toEqual([]);
  });
});

describe('seo-agent/pages.json', () => {
  const file = JSON.parse(readFileSync('seo-agent/pages.json', 'utf8'));
  it('zet elke sitemap-URL in precies één bak, en de tellingen kloppen', () => {
    const verdicts = ['healthy', 'improve', 'consolidate', 'remove', 'watch'];
    for (const p of file.pages) expect(verdicts).toContain(p.verdict);
    for (const v of verdicts) expect(file.counts[v]).toBe(file.pages.filter((p: { verdict: string }) => p.verdict === v).length);
  });
  it('plant Amber nooit meer dan haar weekcapaciteit in', () => {
    const perWeek: Record<string, number> = {};
    for (const p of file.pages) if (p.plan?.owner === 'amber') perWeek[p.plan.week] = (perWeek[p.plan.week] ?? 0) + 1;
    for (const p of file.planned) perWeek[p.week] = (perWeek[p.week] ?? 0) + 1;
    for (const n of Object.values(perWeek)) expect(n).toBeLessThanOrEqual(file.amber_per_week);
  });
});
