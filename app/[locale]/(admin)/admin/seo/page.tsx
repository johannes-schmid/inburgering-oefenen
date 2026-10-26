import type { ReactNode } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, Circle, CircleCheck, CircleDashed, CircleSlash, ExternalLink, GitPullRequest,
  Radio, TriangleAlert, X,
} from 'lucide-react';
import {
  fetchSeoPulls, loadSeoCockpit, REPO_URL,
  type Competitors, type Evidence, type PageMap, type SeoCockpit, type SeoPull, type SourceRow, type Window28,
} from '@/lib/admin/seo';
import {
  byPriority, isLive, ledgerStatus, planAmberWeek,
  type Diagnosis, type LedgerEntry, type Owner, type Recommendation,
} from '@/lib/admin/seo-model';
import { SeoPageMap } from './_components/SeoPageMap';
import { SeoTabs, type SeoTabKey } from './_components/SeoTabs';
import { SeoTrendChart } from './_components/SeoTrendChart';

export const dynamic = 'force-dynamic';

const TAB_KEYS: SeoTabKey[] = ['overview', 'pages', 'competitors', 'numbers'];
const isTab = (v: unknown): v is SeoTabKey => TAB_KEYS.includes(v as SeoTabKey);

/**
 * SEO: de plek waar de eigenaar de SEO-lus volgt, in plaats van in PR's die niemand opent.
 *
 * **Deze pagina is Engels** (besluit eigenaar, 26-10): het is zijn eigen werkplek, geen scherm
 * voor de docent of een kandidaat. Volgorde = de vragen die hij stelt: hoe staan we ervoor, waarom,
 * wat doe ik nu, en pas dan de cijfers. Google komt live uit Search Console (`lib/admin/seo-live.ts`),
 * de rest uit `seo-agent/` in de repo (`lib/admin/seo.ts`). Alleen lezen; afvinken is stap 2.
 */
export default async function SeoPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const [data, pulls] = await Promise.all([loadSeoCockpit(), fetchSeoPulls()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl">
      <Header data={data} />
      <Verdict data={data} />
      <SeoTabs
        initial={isTab(tab) ? tab : 'overview'}
        panels={{
          overview: (
            <>
              {data.diagnosis && <DiagnosisCard diagnosis={data.diagnosis} evidence={data.evidence} recovery={data.recovery.bingRatio} />}
              <Todo data={data} />
            </>
          ),
          pages: data.pageMap ? <PagesPanel map={data.pageMap} /> : <Empty>No page triage yet. Run node scripts/seo-agent/pages.mjs.</Empty>,
          competitors: data.competitors ? <CompetitorsPanel c={data.competitors} /> : <Empty>No competitor analysis yet.</Empty>,
          numbers: (
            <>
              <Kpis data={data} />
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <CardShell title="Impressions per day" note="inburgeringoefenen.nl · Google and Bing side by side">
                  {data.daily.length > 0 ? (
                    <SeoTrendChart
                      points={data.daily}
                      changes={data.ledger
                        .filter(e => e.site !== 'knm')
                        .map(e => ({ date: e.date, change: e.change ?? e.id ?? '' }))}
                    />
                  ) : (
                    <Empty>No daily numbers yet. Friday&apos;s data pull fills this chart.</Empty>
                  )}
                </CardShell>
                <Sources data={data} />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Experiments entries={data.ledger} today={today} />
                <NearQueries data={data} />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Pulls pulls={pulls} />
                <Reports reports={data.reports} />
              </div>
            </>
          ),
        }}
      />
    </div>
  );
}

/* ── Opmaak ─────────────────────────────────────────────────────────────── */

const nf = new Intl.NumberFormat('en-GB');
const nf1 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
const pct = (x: number) => `${Math.round(x * 100)}%`;
const dayLabel = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateLabel = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const shortPath = (url: string) => decodeURI(url.replace(/^https?:\/\/[^/]+/, '') || '/');
const sourceHref = (file: string) => `${REPO_URL}/blob/main/${file}`;

function CardShell({ title, note, action, className = '', children }: {
  title: string; note?: string; action?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-headline font-bold tracking-tight text-on-surface">{title}</h2>
          {note && <p className="mt-0.5 text-xs text-on-surface-variant">{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">{children}</p>;
}

function ExtLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] ${className}`}
    >
      {children}
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  );
}

function Chip({ children, className = 'bg-surface-container text-on-surface-variant' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}

/* ── Kop ────────────────────────────────────────────────────────────────── */

function Header({ data }: { data: SeoCockpit }) {
  const stale = data.latestWeek !== null && data.latestWeek < data.expectedWeek;
  const live = data.live;
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-headline font-bold tracking-tight text-on-surface">SEO</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface-variant">
          {live.state === 'live' ? (
            <>
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--goed)]">
                <Radio className="size-3.5" aria-hidden /> Live from Search Console
              </span>
              <span>updated {timeLabel(live.fetchedAt!)} · the last 3 days are preliminary</span>
            </>
          ) : (
            <span>
              {live.state === 'error' ? `Search Console live failed (${live.detail}). ` : ''}
              {data.generatedAt ? <>Showing Friday&apos;s data pull of {dayLabel(data.generatedAt)}.</> : 'No data yet.'}
            </span>
          )}
          <span>Next data pull {dayLabel(data.nextCollect)}.</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {stale && (
          <Chip className="bg-[#fcecdd] px-3 py-1 text-xs text-[#a24000]">
            <TriangleAlert className="size-3.5" aria-hidden />
            Data pull {data.expectedWeek} is missing
          </Chip>
        )}
        <a
          href="https://search.google.com/search-console?resource_id=sc-domain%3Ainburgeringoefenen.nl"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 text-sm font-medium text-on-surface shadow-[var(--shadow-ambient)] transition-transform duration-150 ease-out hover:bg-surface-container-low focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.97] motion-reduce:transition-none"
        >
          Search Console
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </header>
  );
}

/* ── Hoe staan we ervoor ─────────────────────────────────────────────────── */

function Verdict({ data }: { data: SeoCockpit }) {
  const r = data.recovery;
  if (r.tone === 'onbekend' || r.googleRatio === null) {
    return (
      <section className="mb-5 rounded-2xl bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
        Not enough daily numbers yet to judge a trend. After four weeks of data there&apos;s a verdict here.
      </section>
    );
  }
  const peakMonth = r.googlePeakDate
    ? new Date(`${r.googlePeakDate}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })
    : '';
  const alarm = r.tone === 'alarm';
  const trend = r.googleTrend;

  return (
    <section
      className={`mb-5 rounded-2xl px-5 py-5 sm:px-6 ${alarm ? 'bg-[#fcecdd]' : r.tone === 'let-op' ? 'bg-[#fff6ee]' : 'bg-surface-container-low'}`}
      aria-label="Where we stand"
    >
      <p className={`max-w-4xl text-lg font-headline font-bold leading-snug tracking-tight text-balance sm:text-xl ${alarm ? 'text-[#a24000]' : 'text-on-surface'}`}>
        {r.tone === 'rustig'
          ? <>Google shows the site at {pct(r.googleRatio)} of its best weeks. No drop to worry about.</>
          : <>Google shows the site at {pct(r.googleRatio)} of its best weeks ({peakMonth}).{r.bingRatio !== null && <> Bing is at {pct(r.bingRatio)}.</>}</>}
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
        {r.cause === 'google' && <>Bing didn&apos;t drop, so the problem is how Google judges the site, not the site itself. </>}
        {r.cause === 'beide' && <>Bing dropped too, so look at the site first: a deploy, the sitemap or indexing. </>}
        {trend !== null && (
          <>Last full week: {nf.format(Math.round(r.googleNow ?? 0))} Google impressions a day, {trend >= 0 ? 'up' : 'down'} {pct(Math.abs(trend))} on the week before. At the peak it was {nf.format(Math.round(r.googlePeak ?? 0))} a day.</>
        )}
      </p>
    </section>
  );
}

/* ── Waarom: de diagnose, met live bewijs ─────────────────────────────────── */

const CHECK_STYLE: Record<Diagnosis['checks'][number]['status'], { label: string; cls: string; icon: ReactNode }> = {
  'ruled-out': { label: 'Ruled out', cls: 'bg-surface-container text-on-surface-variant', icon: <X className="size-3" aria-hidden /> },
  confirmed: { label: 'Confirmed', cls: 'bg-[rgba(0,43,109,0.08)] text-primary', icon: <Check className="size-3" aria-hidden /> },
  open: { label: 'Still to check', cls: 'bg-[#fcecdd] text-[#a24000]', icon: <CircleDashed className="size-3" aria-hidden /> },
};

function Stat({ label, before, after, note }: { label: string; before: string; after: string; note: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-container-lowest px-4 py-3.5">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="mt-1 flex items-baseline gap-2 font-headline font-bold tracking-tight tabular-nums">
        <span className="text-lg text-on-surface-variant">{before}</span>
        <ArrowRight className="size-4 self-center text-on-surface-variant" aria-hidden />
        <span className="text-2xl text-on-surface">{after}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-on-surface-variant">{note}</p>
    </div>
  );
}

function DiagnosisCard({ diagnosis, evidence, recovery }: { diagnosis: Diagnosis; evidence: Evidence | null; recovery: number | null }) {
  const d = diagnosis;
  return (
    <section className="mb-5 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6" aria-labelledby="why">
      <h2 id="why" className="text-xl font-headline font-bold tracking-tight text-on-surface">{d.question}</h2>
      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-on-surface">{d.answer}</p>

      {evidence && (
        <div className="mt-5 grid grid-cols-1 gap-2 rounded-2xl bg-surface-container-low p-2 sm:grid-cols-3 sm:gap-3 sm:p-3">
          <Stat
            label="Pages Google shows"
            before={nf.format(evidence.baseline.pages)}
            after={nf.format(evidence.recent.pages)}
            note={`${dateLabel(evidence.baseline.start)} to ${dateLabel(evidence.baseline.end)} vs ${dateLabel(evidence.recent.start)} to ${dateLabel(evidence.recent.end)}`}
          />
          <Stat
            label="Average position of shown pages"
            before={evidence.baseline.position === null ? 'n/a' : nf1.format(evidence.baseline.position)}
            after={evidence.recent.position === null ? 'n/a' : nf1.format(evidence.recent.position)}
            note="Lower is better. Page 1 is position 1 to 10."
          />
          <div className="min-w-0 rounded-xl bg-surface-container-lowest px-4 py-3.5">
            <p className="text-xs font-medium text-on-surface-variant">Bing, same weeks</p>
            <p className="mt-1 text-2xl font-headline font-bold tracking-tight text-on-surface tabular-nums">{recovery === null ? 'n/a' : pct(recovery)}</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant">of its best two weeks. The site itself is fine.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="text-sm font-headline font-bold text-on-surface">What we checked</h3>
          <ul className="mt-3 space-y-3">
            {d.checks.map(c => {
              const st = CHECK_STYLE[c.status];
              return (
                <li key={c.title} className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip className={st.cls}>{st.icon}{st.label}</Chip>
                    <span className="text-sm font-semibold text-on-surface">{c.title}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">{c.detail}</p>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-headline font-bold text-on-surface">What we&apos;re probably missing, most likely first</h3>
          <ol className="mt-3 space-y-3">
            {d.hypotheses.map((h, i) => (
              <li key={h.title} className="grid grid-cols-[22px_1fr] gap-x-2">
                <span className="mt-px flex size-[22px] items-center justify-center rounded-full bg-[rgba(0,43,109,0.08)] text-[11px] font-bold text-primary tabular-nums">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{h.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">{h.why}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-on-surface"><span className="font-semibold">How we test it:</span> {h.test}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="mt-6 rounded-xl bg-surface-container-low px-4 py-3 text-[13px] leading-relaxed text-on-surface">
        <span className="font-semibold">What recovery looks like.</span> {d.recovery}
      </p>

      {evidence && evidence.lost.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]">
            The {evidence.lost.length} biggest pages Google stopped showing
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-on-surface-variant">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Page</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Before: impressions</th>
                  <th className="py-1.5 pr-3 text-right font-medium">position</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Now: impressions</th>
                  <th className="py-1.5 text-right font-medium">position</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {evidence.lost.map((p, i) => (
                  <tr key={p.page} className={i % 2 === 0 ? 'bg-surface-container-low/60' : ''}>
                    <td className="max-w-[280px] truncate py-1.5 pr-3 pl-2 font-mono text-on-surface">{shortPath(p.page)}</td>
                    <td className="py-1.5 pr-3 text-right">{nf.format(p.before)}</td>
                    <td className="py-1.5 pr-3 text-right">{nf1.format(p.beforePos)}</td>
                    <td className="py-1.5 pr-3 text-right font-semibold text-on-surface">{nf.format(p.after)}</td>
                    <td className="py-1.5 pr-2 text-right font-semibold text-on-surface">{p.afterPos === null ? 'not shown' : nf1.format(p.afterPos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="mt-4 text-[11px] text-on-surface-variant">
        Diagnosis updated {dateLabel(d.updated)} · <ExtLink href={sourceHref('seo-agent/diagnosis.json')}>diagnosis.json</ExtLink>
      </p>
    </section>
  );
}

/* ── Wat nu: één to-dolijst, op volgorde van doen ─────────────────────────── */

const OWNER: Record<Owner, { label: string; cls: string }> = {
  eigenaar: { label: 'You', cls: 'bg-primary text-white' },
  amber: { label: 'Amber', cls: 'bg-[#fcecdd] text-[#a24000]' },
  agent: { label: 'Agent', cls: 'bg-surface-container text-on-surface' },
};

const PRIORITY: { key: Recommendation['priority']; title: string; note: string }[] = [
  { key: 'now', title: 'Now', note: 'This week. Most take a few minutes.' },
  { key: 'next', title: 'Next', note: 'Once the above is done, or as Amber’s hours allow.' },
  { key: 'later', title: 'Later', note: 'Useful, but not a recovery lever.' },
];

function Todo({ data }: { data: SeoCockpit }) {
  const live = data.recommendations.filter(isLive).sort(byPriority);
  const done = data.recommendations.filter(r => !isLive(r));
  const amber = planAmberWeek(data.recommendations, data.amberBudget);
  const yourMinutes = live.filter(r => r.owner === 'eigenaar' && r.priority === 'now').reduce((s, r) => s + (r.minutes ?? 0), 0);

  return (
    <section className="mt-8" aria-labelledby="todo">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="todo" className="text-xl font-headline font-bold tracking-tight text-on-surface">To-do</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {live.length} open · your part this week takes about {yourMinutes} minutes · Amber {amber.minutes} of her {amber.budget} minutes
          </p>
        </div>
        <ExtLink href={sourceHref('seo-agent/recommendations.json')} className="text-xs">recommendations.json</ExtLink>
      </div>

      <div className="space-y-6">
        {PRIORITY.map(p => {
          const items = live.filter(r => r.priority === p.key);
          if (items.length === 0) return null;
          return (
            <div key={p.key}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-sm font-headline font-bold text-on-surface">{p.title}</h3>
                <span className="text-xs text-on-surface-variant">{p.note}</span>
              </div>
              <ol className="space-y-2">
                {items.map(r => <li key={r.id}><TodoItem r={r} waiting={amber.later.some(x => x.id === r.id)} /></li>)}
              </ol>
            </div>
          );
        })}
        {done.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer rounded-sm text-on-surface-variant underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]">
              {done.length} done or dismissed
            </summary>
            <ul className="mt-2 space-y-1">
              {done.map(r => (
                <li key={r.id} className="flex items-center gap-2 text-on-surface-variant">
                  <CircleCheck className="size-4 text-[var(--goed)]" aria-hidden /> <span className="line-through">{r.task}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">
        Ticking items off from this page comes in the next step. Until then, tell me in chat or decide in the PR.
      </p>
    </section>
  );
}

function TodoItem({ r, waiting }: { r: Recommendation; waiting: boolean }) {
  const owner = OWNER[r.owner];
  return (
    <article className="grid grid-cols-[20px_1fr] gap-x-3 rounded-2xl bg-surface-container-lowest p-4 shadow-[var(--shadow-ambient)] sm:p-5">
      <Circle className="mt-0.5 size-5 text-on-surface-variant/60" aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h4 className="min-w-0 text-[15px] leading-snug font-semibold text-balance text-on-surface">{r.task}</h4>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip className={owner.cls}>{owner.label}</Chip>
            {r.minutes !== undefined && <Chip>{r.minutes} min</Chip>}
            {r.site === 'knm' && <Chip>knmoefenen.nl</Chip>}
            {r.status === 'planned' && <Chip className="bg-[rgba(0,43,109,0.08)] text-primary">Planned</Chip>}
            {waiting && <Chip>Waits for Amber&apos;s hours</Chip>}
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 text-[13px] leading-relaxed sm:grid-cols-[88px_1fr]">
          <dt className="font-semibold text-on-surface-variant">Why</dt>
          <dd className="text-on-surface">{r.why}</dd>
          <dt className="font-semibold text-on-surface-variant">Next step</dt>
          <dd className="text-on-surface">
            {r.steps.length === 1 ? r.steps[0] : (
              <ol className="list-decimal space-y-1 pl-4 marker:text-on-surface-variant">
                {r.steps.map(s => <li key={s}>{s}</li>)}
              </ol>
            )}
          </dd>
          <dt className="font-semibold text-on-surface-variant">We expect</dt>
          <dd className="text-on-surface">{r.expect}</dd>
        </dl>

        {((r.pages?.length ?? 0) > 0 || r.source) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
            {(r.pages?.length ?? 0) > 1 && (
              <details className="w-full">
                <summary className="cursor-pointer rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]">
                  Show the {r.pages!.length} pages
                </summary>
                <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto font-mono text-[11px]" dir="auto">
                  {r.pages!.map(p => <li key={p} className="truncate">{decodeURI(p)}</li>)}
                </ul>
              </details>
            )}
            {r.pages?.length === 1 && <span className="font-mono">{r.pages[0]}</span>}
            {r.source && <span>Source: <ExtLink href={sourceHref(r.source)}>{r.source.split('/').slice(-2).join('/')}</ExtLink></span>}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── Kerncijfers ─────────────────────────────────────────────────────────── */

function Delta({ now, before, inverse = false }: { now: number; before: number; inverse?: boolean }) {
  if (before === 0) return <span className="text-xs text-on-surface-variant">no earlier data</span>;
  const change = now / before - 1;
  const good = inverse ? change < 0 : change > 0;
  const flat = Math.abs(change) < 0.02;
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${flat ? 'text-on-surface-variant' : good ? 'text-[var(--goed)]' : 'text-[#a24000]'}`}>
      {!flat && <Icon className="size-3.5" aria-hidden />}
      {change >= 0 ? '+' : ''}{pct(change)}
    </span>
  );
}

function Kpi({ label, value, before, inverse, unknown, format = nf.format, className = '' }: {
  label: string; value: number | null; before: number | null; inverse?: boolean; unknown?: string; format?: (n: number) => string; className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-xl bg-surface-container-low px-4 py-3.5 ${className}`}>
      <p className="truncate text-xs font-medium text-on-surface-variant">{label}</p>
      {value === null ? (
        <p className="mt-1 text-sm text-on-surface-variant">{unknown ?? 'unknown'}</p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-headline font-bold tracking-tight text-on-surface tabular-nums">{format(value)}</p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-xs text-on-surface-variant tabular-nums">
            {before !== null && <><Delta now={value} before={before} inverse={inverse} /> <span>was {format(before)}</span></>}
          </p>
        </>
      )}
    </div>
  );
}

function Kpis({ data }: { data: SeoCockpit }) {
  const t = data.inburgering.totals;
  const nb = data.inburgering.nonBrand;
  const w = data.inburgering.windows;
  const gscUnknown = data.inburgering.gscError ? `unknown: ${data.inburgering.gscError}` : undefined;
  const note = w
    ? `Last 28 days (${dateLabel(w.current.start)} to ${dateLabel(w.current.end)}) vs the 28 days before${data.live.state === 'live' ? ', live' : ', Friday’s data pull'}`
    : 'Last 28 days';
  return (
    <CardShell title="inburgeringoefenen.nl" note={note}>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        <Kpi label="Clicks from Google" value={t?.current.clicks ?? null} before={t?.previous.clicks ?? null} unknown={gscUnknown} />
        <Kpi label="Impressions in Google" value={t?.current.impressions ?? null} before={t?.previous.impressions ?? null} unknown={gscUnknown} />
        <Kpi label="Clicks without our brand name" value={nb?.current.clicks ?? null} before={nb?.previous.clicks ?? null} unknown={gscUnknown} />
        <Kpi label="Average position" value={t?.current.position ?? null} before={t?.previous.position ?? null} inverse unknown={gscUnknown} format={n => nf1.format(n)} />
        <Kpi label="Clicks from Bing" value={data.inburgering.bing?.clicks ?? null} before={data.inburgering.bing?.prevClicks ?? null} className="col-span-2 lg:col-span-1" />
      </div>
      <KnmLine gscError={data.knm.gscError} bing={data.knm.bing} />
    </CardShell>
  );
}

function KnmLine({ gscError, bing }: { gscError: string | null; bing: Window28 | null }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-surface-container-low/60 px-4 py-3 text-sm">
      <span className="font-semibold text-on-surface">knmoefenen.nl</span>
      <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
        {gscError
          ? <><TriangleAlert className="size-3.5 text-[#a24000]" aria-hidden /> Search Console: no access (see To-do)</>
          : <><Check className="size-3.5 text-[var(--goed)]" aria-hidden /> Search Console connected</>}
      </span>
      {bing && (
        <span className="text-on-surface-variant tabular-nums">
          Bing: <span className="font-semibold text-on-surface">{nf.format(bing.clicks)}</span> clicks in 28 days{' '}
          <Delta now={bing.clicks} before={bing.prevClicks} />
        </span>
      )}
    </div>
  );
}

/* ── Bronnen en gezondheid ───────────────────────────────────────────────── */

function SourceIcon({ s }: { s: SourceRow }) {
  if (s.state === 'ok') return <Check className="size-4 text-[var(--goed)]" aria-label="worked" />;
  if (s.state === 'skipped') return <CircleSlash className="size-4 text-on-surface-variant" aria-label="skipped" />;
  return <TriangleAlert className="size-4 text-[#a24000]" aria-label="failed" />;
}

const SOURCE_EN: Record<string, string> = {
  gsc: 'Search Console', bing: 'Bing Webmaster', posthog: 'PostHog', health: 'Health check', competitors: 'Competitors', geo: 'AI search engines',
};

function Sources({ data }: { data: SeoCockpit }) {
  const h = data.health;
  return (
    <CardShell title="Friday's data pull" note={data.latestWeek ? `Snapshot ${data.latestWeek}${data.live.bingLive ? ' · Bing live' : ''}` : 'No snapshot yet'}>
      <ul className="space-y-2.5">
        {data.sources.map(s => (
          <li key={s.key} className="grid grid-cols-[16px_1fr] items-start gap-x-2.5 text-sm">
            <span className="mt-0.5"><SourceIcon s={s} /></span>
            <span className="min-w-0">
              <span className="font-medium text-on-surface">{SOURCE_EN[s.key] ?? s.label}</span>
              {s.state !== 'ok' && (
                <span className="block text-xs text-on-surface-variant">
                  {s.state === 'missing' ? 'not measured: unknown, not zero' : s.key === 'geo' && s.state === 'skipped' ? 'runs in even weeks only' : s.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {h && (
        <div className="mt-5 rounded-xl bg-surface-container-low px-4 py-3.5 text-sm">
          <p className="font-semibold text-on-surface">Technical</p>
          <ul className="mt-2 space-y-1.5 text-on-surface-variant">
            <li className="flex items-start gap-2">
              {h.errors.length === 0
                ? <Check className="mt-0.5 size-4 shrink-0 text-[var(--goed)]" aria-hidden />
                : <X className="mt-0.5 size-4 shrink-0 text-[var(--fout)]" aria-hidden />}
              <span>
                {h.urlCount !== null && <>{nf.format(h.urlCount)} URLs in the sitemap, </>}
                {h.errors.length === 0 ? 'no errors' : `${h.errors.length} with an error`}
              </span>
            </li>
            {h.lengthIssues > 0 && (
              <li className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#a24000]" aria-hidden />
                <span>{h.lengthIssues} titles or descriptions out of spec</span>
              </li>
            )}
          </ul>
          {h.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {h.errors.slice(0, 5).map(e => (
                <li key={e.url} className="truncate"><span className="font-mono text-on-surface">{shortPath(e.url)}</span> {e.issues.join(', ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </CardShell>
  );
}

/* ── Experimenten ────────────────────────────────────────────────────────── */

const STATUS: Record<ReturnType<typeof ledgerStatus>['kind'], { label: string; cls: string; icon?: ReactNode }> = {
  loopt: { label: 'Running', cls: 'bg-surface-container text-on-surface-variant' },
  'oordeel-nodig': { label: 'Verdict on Saturday', cls: 'bg-[#fcecdd] text-[#a24000]' },
  worked: { label: 'Worked', cls: 'bg-[var(--goed-tint)] text-[var(--goed-ink)]', icon: <Check className="size-3" aria-hidden /> },
  didnt: { label: 'Didn’t work', cls: 'bg-[var(--fout-tint)] text-[var(--fout)]', icon: <X className="size-3" aria-hidden /> },
  inconclusive: { label: 'Inconclusive', cls: 'bg-surface-container text-on-surface-variant' },
};

function Experiments({ entries, today }: { entries: LedgerEntry[]; today: string }) {
  const rows = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <CardShell title="Experiments" note="Every change gets 35 days, then the Saturday run judges it (entries are in Dutch)">
      {rows.length === 0 ? (
        <Empty>No changes logged yet.</Empty>
      ) : (
        <ol className="space-y-2">
          {rows.map(e => {
            const s = ledgerStatus(e, today);
            const st = STATUS[s.kind];
            return (
              <li key={e.id ?? `${e.date}-${e.page}`} className="rounded-xl bg-surface-container-low/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm leading-snug font-semibold text-on-surface">{e.change}</p>
                  <Chip className={`shrink-0 ${st.cls}`}>{st.icon}{st.label}</Chip>
                </div>
                <p className="mt-1 truncate text-xs text-on-surface-variant">
                  {dateLabel(e.date)} · <span className="font-mono">{e.page}</span>
                </p>
                {s.kind === 'loopt' && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full origin-left rounded-full bg-[var(--hemel)]" style={{ transform: `scaleX(${s.progress})` }} />
                    </div>
                    <span className="shrink-0 text-[11px] text-on-surface-variant tabular-nums">{s.daysLeft} {s.daysLeft === 1 ? 'day' : 'days'} left</span>
                  </div>
                )}
                {e.verdict_note && <p className="mt-1.5 text-xs text-on-surface-variant">{e.verdict_note}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </CardShell>
  );
}

/* ── Zoekwoorden net onder of op de eerste pagina ─────────────────────────── */

function NearQueries({ data }: { data: SeoCockpit }) {
  const rows = data.inburgering.near;
  return (
    <CardShell title="Close to the top" note={`Position 4 to 20 in Google, most impressions first (snapshot ${data.latestWeek ?? ''})`}>
      {rows.length === 0 ? (
        <Empty>No queries between position 4 and 20 with enough impressions. They come back as impressions recover.</Empty>
      ) : (
        <ol className="space-y-2">
          {rows.map(q => (
            <li key={`${q.query}-${q.page}`} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 rounded-xl bg-surface-container-low/60 px-4 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-on-surface">{q.query}</span>
                <span className="block truncate font-mono text-[11px] text-on-surface-variant">{shortPath(q.page)}</span>
              </span>
              <span className="text-right text-xs text-on-surface-variant tabular-nums">
                <span className="block text-sm font-semibold text-on-surface">#{nf1.format(q.position)}</span>
                {nf.format(q.impressions)} impr. · {q.clicks} clicks
              </span>
            </li>
          ))}
        </ol>
      )}
    </CardShell>
  );
}

/* ── PR's en rapporten ──────────────────────────────────────────────────── */

function Pulls({ pulls }: { pulls: SeoPull[] | null }) {
  return (
    <CardShell
      title="Open pull requests"
      note="From the SEO loop, waiting for your call"
      action={<ExtLink href={`${REPO_URL}/pulls`} className="text-xs">All PRs</ExtLink>}
    >
      {pulls === null ? (
        <Empty>GitHub didn&apos;t answer. Unknown, not zero: check GitHub.</Empty>
      ) : pulls.length === 0 ? (
        <Empty>No open PRs from the loop.</Empty>
      ) : (
        <ul className="space-y-2">
          {pulls.map(p => (
            <li key={p.number}>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[16px_1fr_auto] items-start gap-x-2.5 rounded-xl bg-surface-container-low/60 px-4 py-2.5 transition-transform duration-150 ease-out hover:bg-surface-container-low focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.99] motion-reduce:transition-none"
              >
                <GitPullRequest className="mt-0.5 size-4 text-[var(--goed)]" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-on-surface">{p.title}</span>
                  <span className="block truncate text-[11px] text-on-surface-variant">#{p.number} · opened {dateLabel(p.createdAt)}</span>
                </span>
                <ExternalLink className="mt-1 size-3.5 text-on-surface-variant" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

function Reports({ reports }: { reports: SeoCockpit['reports'] }) {
  return (
    <CardShell title="Reports" note="The Saturday report and one-off audits">
      {reports.length === 0 ? (
        <Empty>No reports on main yet.</Empty>
      ) : (
        <ul className="space-y-1.5">
          {reports.slice(0, 8).map(r => (
            <li key={r.name}>
              <ExtLink href={r.href} className="text-sm">{r.name}</ExtLink>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

/* ── Pagina's: de treemap en de weekplanning ─────────────────────────────── */

const PLAN_KIND: Record<string, { label: string; color: string }> = {
  remove: { label: 'Remove', color: '#c2416b' },
  consolidate: { label: 'Consolidate', color: '#b07d12' },
  improve: { label: 'Improve', color: '#2f5fb3' },
  watch: { label: 'Watch', color: '#8a94ad' },
  healthy: { label: 'Tidy', color: '#2b8a63' },
};

function PagesPanel({ map }: { map: PageMap }) {
  type Item = { label: string; kind: string; owner: string; planned?: boolean };
  const byWeek = new Map<string, { starts: string; items: Item[] }>();
  const add = (week: string | undefined, starts: string | undefined, item: Item) => {
    if (!week) return;
    const w = byWeek.get(week) ?? { starts: starts ?? '', items: [] };
    w.items.push(item);
    byWeek.set(week, w);
  };
  for (const p of map.pages) if (p.plan?.week) add(p.plan.week, p.plan.starts, { label: p.path.split('/').filter(Boolean).slice(-1)[0] ?? p.path, kind: p.verdict, owner: p.plan.owner });
  for (const p of map.planned) add(p.week, p.starts, { label: p.title, kind: 'planned', owner: p.owner, planned: true });
  const weeks = [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <CardShell title="Every page on the site" note={`Triage from ${dateLabel(map.updated)}, search numbers live. Click a tile for its search data, plan and date.`}>
        <SeoPageMap map={map} />
      </CardShell>

      <CardShell className="mt-5" title="When it happens" note="Cleanup first and fast, then Amber at two pages a week, then new pages one at a time">
        <ol className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {weeks.map(([week, w], i) => {
            const groups = new Map<string, Item[]>();
            for (const it of w.items) groups.set(it.kind, [...(groups.get(it.kind) ?? []), it]);
            return (
              <li key={week} className={`w-56 shrink-0 snap-start rounded-xl p-3.5 ${i === 0 ? 'bg-[rgba(0,43,109,0.06)] shadow-[var(--ring-selected)]' : 'bg-surface-container-low'}`}>
                <p className="text-sm font-headline font-bold text-on-surface">Week {Number(week.split('-W')[1])}{i === 0 && <span className="ml-1.5 text-xs font-semibold text-primary">this week</span>}</p>
                <p className="text-[11px] text-on-surface-variant">from {dateLabel(w.starts)}</p>
                <ul className="mt-3 space-y-2.5">
                  {[...groups.entries()].map(([kind, items]) => (
                    <li key={kind}>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                        {kind === 'planned'
                          ? <span className="inline-block h-2.5 w-3.5 rounded-[3px] border border-dashed border-primary" aria-hidden />
                          : <span className="size-2.5 rounded-full" style={{ background: PLAN_KIND[kind]?.color }} aria-hidden />}
                        {kind === 'planned' ? 'New page' : PLAN_KIND[kind]?.label ?? kind}
                        <span className="font-normal text-on-surface-variant tabular-nums">{items.length}</span>
                      </p>
                      <ul className="mt-1 space-y-0.5 pl-4 text-[11px] text-on-surface-variant">
                        {items.slice(0, 3).map(it => <li key={it.label} className="truncate" dir="auto">{it.label}</li>)}
                        {items.length > 3 && <li>and {items.length - 3} more</li>}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[11px] text-on-surface-variant">
          Expect the first movement 4 to 8 weeks after the cleanup is recrawled, often only at Google&apos;s next spam or core update. Documented recoveries took 3 to 6 months.
        </p>
      </CardShell>
    </>
  );
}

/* ── Concurrenten: wat zij anders doen ───────────────────────────────────── */

const EVIDENCE_STYLE: Record<Competitors['differences'][number]['evidence'], string> = {
  strong: 'bg-[rgba(0,43,109,0.08)] text-primary',
  medium: 'bg-surface-container text-on-surface',
  weak: 'bg-surface-container text-on-surface-variant',
};

function CompetitorsPanel({ c }: { c: Competitors }) {
  const domains = c.domains.filter(d => d.domain !== 'inburgeringoefenen.nl').slice(0, 8);
  const max = Math.max(...domains.map(d => d.top10), 1);
  const stillWorks = c.pages.filter(p => p.ours && /ranks #?\d/i.test(p.verdict));
  return (
    <>
      <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6">
        <h2 className="text-xl font-headline font-bold tracking-tight text-on-surface">Why their content still works and ours doesn&apos;t</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-on-surface">{c.summary}</p>
        <p className="mt-3 text-[11px] text-on-surface-variant">{c.method} · {dateLabel(c.updated)} · <ExtLink href={sourceHref('seo-agent/competitors-analysis.json')}>competitors-analysis.json</ExtLink></p>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CardShell title="Who Google shows instead" note={`Appearances in the top 10 across ${c.queries.length} of our queries`}>
          <ul className="space-y-2.5">
            {domains.map(d => (
              <li key={d.domain}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-semibold text-on-surface">{d.domain}{d.official && <span className="ml-1.5 text-[11px] font-normal text-on-surface-variant">official</span>}</span>
                  <span className="shrink-0 text-xs text-on-surface-variant tabular-nums"><span className="font-semibold text-on-surface">{d.top10}</span> top 10 · {d.top5} top 5</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full origin-left rounded-full" style={{ transform: `scaleX(${d.top10 / max})`, background: d.official ? 'var(--ink-3)' : '#2f5fb3' }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-on-surface-variant">Grey: government sites. Nobody outranks those on rules questions, so we shouldn&apos;t try.</p>
        </CardShell>

        <CardShell title="What still works for us" note="Pages of ours that still rank in this check">
          {stillWorks.length === 0 ? (
            <Empty>None of our pages showed up in the top 10 for these queries.</Empty>
          ) : (
            <ul className="space-y-3">
              {stillWorks.map(p => (
                <li key={p.url} className="rounded-xl bg-[var(--goed-tint)] px-4 py-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--goed-ink)]"><Check className="size-4" aria-hidden />{shortPath(p.url)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-on-surface">{p.verdict}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[11px] text-on-surface-variant">Firecrawl&apos;s Google results can differ from what Search Console records, so treat a single rank as a hint.</p>
        </CardShell>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-headline font-bold tracking-tight text-on-surface">Them vs us</h2>
      <ul className="space-y-3">
        {c.differences.map(d => (
          <li key={d.title} className="rounded-2xl bg-surface-container-lowest p-4 shadow-[var(--shadow-ambient)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-on-surface">{d.title}</h3>
              <Chip className={EVIDENCE_STYLE[d.evidence]}>{d.evidence} evidence</Chip>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <p className="text-xs font-semibold text-on-surface-variant">Them</p>
                <p className="mt-1 text-[13px] leading-relaxed text-on-surface">{d.them}</p>
              </div>
              <div className="rounded-xl bg-[rgba(0,43,109,0.05)] px-4 py-3">
                <p className="text-xs font-semibold text-primary">Us</p>
                <p className="mt-1 text-[13px] leading-relaxed text-on-surface">{d.us}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <CardShell className="mt-5" title="What we take from this" note="Each of these feeds the to-do list and the page plans">
        <ol className="space-y-2.5">
          {c.lessons.map((l, i) => (
            <li key={l} className="grid grid-cols-[22px_1fr] gap-x-2 text-sm leading-relaxed text-on-surface">
              <span className="mt-0.5 flex size-[22px] items-center justify-center rounded-full bg-[rgba(0,43,109,0.08)] text-[11px] font-bold text-primary tabular-nums">{i + 1}</span>
              <span>{l}</span>
            </li>
          ))}
        </ol>
      </CardShell>

      <details className="mt-5 rounded-2xl bg-surface-container-lowest p-5 text-sm shadow-[var(--shadow-ambient)]">
        <summary className="cursor-pointer rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]">
          The {c.pages.length} pages compared, side by side
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-on-surface-variant">
              <tr>
                {['Page', 'Author', 'First-hand value', 'Practice on page', 'Words'].map(h => <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="align-top">
              {c.pages.map((p, i) => (
                <tr key={p.url} className={p.ours ? 'bg-[rgba(0,43,109,0.05)]' : i % 2 === 0 ? 'bg-surface-container-low/60' : ''}>
                  <td className="max-w-[200px] py-2 pr-3 pl-2"><a href={p.url} target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">{p.ours ? 'Ours: ' : ''}{p.domain}</a><span className="block text-on-surface-variant">{p.intent}</span></td>
                  <td className="max-w-[160px] py-2 pr-3">{p.author}</td>
                  <td className="max-w-[220px] py-2 pr-3">{p.first_hand}</td>
                  <td className="max-w-[200px] py-2 pr-3">{p.practice}</td>
                  <td className="py-2 pr-2 tabular-nums">{p.words ? nf.format(p.words) : 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
