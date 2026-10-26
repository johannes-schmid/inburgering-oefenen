/**
 * De gezondheidsscore van `/admin/seo`: elke pagina op 10, de site op 100.
 *
 * Plain JavaScript met een `.d.mts` ernaast, omdat twee lezers precies dezelfde som moeten maken:
 * de pagina (live cijfers) en `scripts/seo-agent/score.mjs` (de vrijdagsnapshot, die de wekelijkse
 * rij in `seo-agent/data/history/health.json` schrijft). Twee kopieën van een formule lopen uiteen
 * zonder dat iemand het ziet, en dan is de lijn over de tijd een lijn tussen twee definities.
 *
 * De score begint op 10 en elke aftrek is een `factor` met een Engelse uitleg, zodat de pagina kan
 * zeggen wáárom een pagina een 6 heeft. Onbekend is geen nul: zonder live cijfers telt zichtbaarheid
 * niet mee, en een pagina zonder zoekvraag wordt niet gestraft omdat Google hem niet toont.
 */

/** `demand` is de som van augustus en september (61 dagen) uit de audit; het venster nu is 28 dagen. */
const WINDOW_RATIO = 28 / 61;
const LENGTH_ISSUE = /^(title|description) (\d+) tekens$/;

const VERDICT = {
  healthy: { delta: 0, label: null },
  watch: { delta: -2, label: 'Thin page we are watching' },
  improve: { delta: -3, label: 'Needs the teacher’s rewrite' },
  consolidate: { delta: -5, label: 'Duplicates a stronger page' },
  remove: { delta: -6, label: 'Should leave Google’s index' },
};

/** Wat Google in 28 dagen zou tonen als de pagina op het niveau van aug–sep stond. */
export function expectedImpressions(demand) {
  return demand * WINDOW_RATIO;
}

export function pageScore(p) {
  const factors = [];
  const v = VERDICT[p.verdict];
  if (v.delta) factors.push({ key: 'verdict', delta: v.delta, label: v.label });

  const expected = expectedImpressions(p.demand);
  if (p.now && expected >= 5) {
    let search = 0;
    const ratio = p.now.impressions / expected;
    const pctLabel = `${Math.round(ratio * 100)}%`;
    const vis = ratio < 0.25 ? -3 : ratio < 0.6 ? -2 : ratio < 0.9 ? -1 : 0;
    if (vis) {
      factors.push({ key: 'visibility', delta: vis, label: `Google shows it at ${pctLabel} of Aug–Sep` });
      search += vis;
    }
    const pos = p.now.position;
    if (p.now.impressions > 0 && pos !== null) {
      const d = pos > 20 ? -2 : pos > 10 ? -1 : 0;
      const room = Math.max(-4 - search, d);
      if (room) factors.push({ key: 'position', delta: room, label: `Average position ${Math.round(pos)}${pos > 20 ? ', beyond page 2' : ', on page 2'}` });
    } else if (p.now.impressions === 0 && search > -4) {
      factors.push({ key: 'position', delta: Math.max(-4 - search, -1), label: 'Not shown for any query' });
    }
  }

  const lengths = p.issues.filter(i => LENGTH_ISSUE.test(i));
  const errors = p.issues.filter(i => !LENGTH_ISSUE.test(i));
  if (errors.length) factors.push({ key: 'technical', delta: -3, label: `Technical error: ${errors.join(', ')}` });
  if (lengths.length) {
    const [, what, n] = LENGTH_ISSUE.exec(lengths[0]);
    factors.push({
      key: 'snippet',
      delta: -1,
      label: `${what === 'title' ? 'Title' : 'Meta description'} is ${n} characters (${what === 'title' ? 'max 60' : '140–160'})`,
    });
  }

  const score = Math.max(1, Math.min(10, 10 + factors.reduce((s, f) => s + f.delta, 0)));
  return { score, factors };
}

/** Een pagina telt naar haar zoekvraag, met een kleine bodem zodat een pagina zonder vraag niet verdwijnt. */
export function pageWeight(p) {
  return Math.max(expectedImpressions(p.demand), p.now?.impressions ?? 0) + 3;
}

export function rollup(pages) {
  let sum = 0;
  let weight = 0;
  const bySection = {};
  for (const p of pages) {
    const w = pageWeight(p);
    const s = pageScore(p).score;
    sum += s * w;
    weight += w;
    const b = (bySection[p.section] ??= { sum: 0, weight: 0 });
    b.sum += s * w;
    b.weight += w;
  }
  const sections = {};
  for (const [k, b] of Object.entries(bySection)) sections[k] = Math.round((b.sum / b.weight) * 10) / 10;
  return { site: weight ? Math.round((sum / weight) * 10) : null, sections };
}

/** Eén rij per ISO-week; een tweede run in dezelfde week vervangt de eerste. */
export function upsertHistory(rows, row) {
  return [...rows.filter(r => r.week !== row.week), row].sort((a, b) => a.week.localeCompare(b.week));
}
