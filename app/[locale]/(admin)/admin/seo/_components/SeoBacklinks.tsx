import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { BacklinkView } from '@/lib/admin/seo-backlinks';
import { pathOf, type ProspectStatus } from '@/lib/admin/seo-backlinks-model';

/**
 * Tab Backlinks van `/admin/seo`: wie linkt er nu naar ons (Bing Webmaster, wekelijkse snapshot) en
 * waar zou een link kunnen staan (`seo-agent/backlink-prospects.json`, met de hand nagelopen).
 */

const nf = new Intl.NumberFormat('en-GB');
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const STATE: Record<ProspectStatus, { label: string; cls: string }> = {
  listed: { label: 'Links to us', cls: 'bg-[rgba(43,122,92,0.12)] text-[var(--goed)]' },
  asked: { label: 'Asked', cls: 'bg-[#fcecdd] text-[#a24000]' },
  todo: { label: 'To do', cls: 'bg-surface-container text-on-surface-variant' },
  declined: { label: 'Declined', cls: 'bg-surface-container text-on-surface-variant line-through' },
};

const EFFORT: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const STATE_ORDER: ProspectStatus[] = ['todo', 'asked', 'listed', 'declined'];

export function SeoBacklinks({ data }: { data: BacklinkView }) {
  const domains = data.domains;
  const linkCount = domains?.reduce((n, d) => n + d.links.length, 0) ?? null;
  const pages = domains ? new Set(domains.flatMap(d => d.targets)).size : null;
  const todo = data.prospects.filter(p => p.state === 'todo').length;
  const prospects = [...data.prospects].sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));

  return (
    <div className="space-y-6">
      <section aria-label="Backlink overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile label="Referring domains" value={domains ? nf.format(domains.length) : null} />
        <Tile label="Backlinks" value={linkCount !== null ? nf.format(linkCount) : null} />
        <Tile label="Our pages linked to" value={pages !== null ? nf.format(pages) : null} />
        <Tile label="Suggestions to do" value={nf.format(todo)} note={`of ${data.prospects.length}`} />
      </section>

      <Card
        id="current"
        title="Current backlinks"
        note={data.checkedAt
          ? `Every external page Bing sees linking to us · checked ${dayLabel(data.checkedAt)}. Bing doesn't see every link, so a missing one isn't proof it's gone.`
          : 'From Bing Webmaster, collected with the Friday data pull.'}
      >
        {!domains ? (
          <Empty>
            Not collected yet{data.error ? ` (${data.error})` : ''}. The Friday data pull fills this list; you can also run the
            &ldquo;SEO collect&rdquo; workflow by hand on GitHub.
          </Empty>
        ) : domains.length === 0 ? (
          <Empty>Bing knows no external links to inburgeringoefenen.nl yet. That is the gap the suggestions below are for.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr>
                  <th className={`${TH} w-[220px]`}>Linking site</th>
                  <th className={TH}>Linking page</th>
                  <th className={`${TH} w-[200px]`}>Anchor text</th>
                  <th className={`${TH} w-[220px]`}>Links to</th>
                </tr>
              </thead>
              <tbody>
                {domains.map(d =>
                  d.links.map((l, i) => (
                    <tr key={`${l.source}→${l.target}`} className="align-top">
                      {i === 0 && (
                        <th scope="rowgroup" rowSpan={d.links.length} className={`${TD} text-left font-semibold text-on-surface`}>
                          {d.domain}
                          <span className="mt-0.5 block text-[11px] font-normal text-on-surface-variant">
                            {d.links.length} {d.links.length === 1 ? 'link' : 'links'}
                          </span>
                        </th>
                      )}
                      <td className={TD}>
                        <a href={l.source} target="_blank" rel="noreferrer" className={LINK} title={l.source}>
                          <span className="truncate">{l.source.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                        </a>
                      </td>
                      <td className={`${TD} truncate text-on-surface-variant`} title={l.anchor}>{l.anchor || <em>no anchor text</em>}</td>
                      <td className={`${TD} truncate font-mono text-[12px] text-on-surface`} title={l.target}>{pathOf(l.target)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        id="suggestions"
        title="Suggestions"
        note="Sites where a link to us fits, each page checked by hand. Set a status in seo-agent/backlink-prospects.json; a site turns green by itself once Bing sees its link."
      >
        {prospects.length === 0 ? (
          <Empty>No suggestions yet. Add them to seo-agent/backlink-prospects.json.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr>
                  <th className={`${TH} w-[200px]`}>Site</th>
                  <th className={TH}>Why it fits</th>
                  <th className={TH}>What to do</th>
                  <th className={`${TH} w-20`}>Effort</th>
                  <th className={`${TH} w-[110px]`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map(p => (
                  <tr key={p.url} className="align-top">
                    <td className={TD}>
                      <a href={p.url} target="_blank" rel="noreferrer" className={`${LINK} font-semibold`}>
                        <span className="truncate">{p.domain}</span>
                        <ExternalLink className="size-3 shrink-0" aria-hidden />
                      </a>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant">{p.kind.replace(/-/g, ' ')}</span>
                    </td>
                    <td className={`${TD} text-on-surface-variant`}>{p.why}</td>
                    <td className={`${TD} text-on-surface`}>{p.how}</td>
                    <td className={`${TD} text-on-surface-variant`}>{EFFORT[p.effort] ?? p.effort}</td>
                    <td className={TD}>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE[p.state].cls}`}>{STATE[p.state].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const TH = 'bg-surface-container-low px-3 py-2.5 text-left text-[11px] font-semibold whitespace-nowrap text-on-surface-variant first:rounded-l-xl last:rounded-r-xl';
const TD = 'px-3 py-3 leading-relaxed';
const LINK = 'inline-flex max-w-full items-center gap-1 rounded text-primary hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]';

function Tile({ label, value, note }: { label: string; value: string | null; note?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)]">
      <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-3xl font-bold tracking-tight text-on-surface tabular-nums">
        {value ?? <span className="text-on-surface-variant" title="Not collected yet">?</span>}
        {note && <span className="ml-1.5 text-sm font-medium text-on-surface-variant">{note}</span>}
      </p>
    </div>
  );
}

function Card({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl bg-surface-container-lowest p-2 shadow-[var(--shadow-ambient)]">
      <div className="px-3 pt-3 pb-3">
        <h2 id={id} className="font-headline text-lg font-bold tracking-tight text-on-surface">{title}</h2>
        <p className="mt-0.5 max-w-3xl text-xs text-on-surface-variant">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-3 pt-4 pb-8 text-sm text-on-surface-variant">{children}</p>;
}
