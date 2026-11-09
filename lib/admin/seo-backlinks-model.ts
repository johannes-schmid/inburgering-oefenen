/**
 * De backlinks van `/admin/seo`, puur: welke sites naar ons linken (uit Bing Webmaster, de enige
 * gratis bron die bronpagina's noemt; Search Console heeft geen API voor links) en hoe die zich
 * verhouden tot de lijst kandidaten in `seo-agent/backlink-prospects.json`.
 *
 * Een kandidaat staat op "listed" zodra Bing een link van dat domein ziet. Zet de eigenaar hem zelf
 * op "listed", dan blijft dat staan: Bing ziet lang niet elke link.
 */

export type Backlink = { source: string; anchor: string; target: string };

export type ProspectStatus = 'todo' | 'asked' | 'listed' | 'declined';
export type Prospect = {
  domain: string;
  url: string;
  kind: string;
  why: string;
  how: string;
  effort: 'low' | 'medium' | 'high';
  verified: string;
  status?: ProspectStatus;
};

export type ReferringDomain = { domain: string; links: Backlink[]; targets: string[] };

export const OWN_HOSTS = ['inburgeringoefenen.nl'];

/** `https://www.Example.nl/x` → `example.nl`; null als het geen URL is. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Een subdomein telt als het domein: `nl.wikipedia.org` hoort bij een kandidaat `wikipedia.org`. */
export function sameSite(host: string, domain: string): boolean {
  const d = domain.toLowerCase().replace(/^www\./, '');
  return host === d || host.endsWith(`.${d}`);
}

export function pathOf(url: string): string {
  try {
    const p = decodeURI(new URL(url).pathname);
    return p.length > 1 ? p.replace(/\/+$/, '') : p;
  } catch {
    return url;
  }
}

/** Groepeert per verwijzend domein, zonder interne links, ontdubbeld; grootste domein eerst. */
export function groupByDomain(links: Backlink[], own: string[] = OWN_HOSTS): ReferringDomain[] {
  const seen = new Set<string>();
  const by = new Map<string, Backlink[]>();
  for (const l of links) {
    const host = hostOf(l.source);
    if (!host || own.some(o => sameSite(host, o))) continue;
    const key = `${host}${pathOf(l.source)}→${pathOf(l.target)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    by.set(host, [...(by.get(host) ?? []), l]);
  }
  return [...by]
    .map(([domain, ls]) => ({ domain, links: ls, targets: [...new Set(ls.map(l => pathOf(l.target)))] }))
    .sort((a, b) => b.links.length - a.links.length || a.domain.localeCompare(b.domain));
}

export function prospectStatus(p: Prospect, domains: ReferringDomain[] | null): ProspectStatus {
  if (domains?.some(d => sameSite(d.domain, p.domain))) return 'listed';
  return p.status ?? 'todo';
}
