import type { MrrSummary } from '@/lib/admin/mrr';

function formatEur(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * MRR en opzeggingen.
 *
 * De MRR staat bewust naast de *gefactureerde* omzet van `RevenueDashboard` en niet erin: dat paneel
 * telt binnengekomen betalingen, dit paneel telt wat er volgende maand opnieuw binnenkomt. Het
 * verschil tussen die twee is precies de opzegging die nog in zijn betaalde periode zit.
 */
export function MrrCard({ data }: { data: MrrSummary }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-8 bg-white border border-black/6" style={{ boxShadow: '0 2px 24px rgba(0,43,109,0.06)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface-variant text-sm font-medium">MRR</span>
            <span className="text-xs text-on-surface-variant/60">per maand</span>
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface mb-1">{formatEur(data.mrrCents)}</p>
          <p className="text-on-surface-variant text-xs">
            {data.activeSubscribers} {data.activeSubscribers === 1 ? 'abonnee' : 'abonnees'} · {formatEur(data.arpuCents)} gemiddeld
          </p>
          <p className="text-on-surface-variant/60 text-xs mt-0.5">zonder eenmalige legacy-pakketten</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface-variant text-sm font-medium">Opgezegd, loopt nog</span>
            <span className="text-xs text-on-surface-variant/60">30 dagen: {data.churnedLast30}</span>
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface mb-1">−{formatEur(data.pendingChurnCents)}</p>
          <p className="text-on-surface-variant text-xs">
            {data.pendingChurnCount} {data.pendingChurnCount === 1 ? 'abonnement' : 'abonnementen'} tot einde periode
          </p>
          <p className="text-on-surface-variant/60 text-xs mt-0.5">gaat hierna van de MRR af</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface-variant text-sm font-medium">Churn</span>
            <span className="text-xs text-on-surface-variant/60">laatste 30 dagen</span>
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface mb-1">
            {data.churnRatePct.toFixed(1).replace('.', ',')}%
          </p>
          <p className="text-on-surface-variant text-xs">
            {data.churnedCount} {data.churnedCount === 1 ? 'klant' : 'klanten'} vertrokken · {formatEur(data.churnedMrrCents)} verloren
          </p>
          <p className="text-on-surface-variant/60 text-xs mt-0.5">opzeggingen ÷ abonnees aan het begin</p>
        </div>
      </div>

      {data.recentCancellations.length > 0 && (
        <>
          <div className="border-t border-black/6" />
          <div className="p-6">
            <p className="text-on-surface font-semibold text-sm mb-3">Laatste opzeggingen</p>
            <ul className="divide-y divide-black/6">
              {data.recentCancellations.map(c => (
                <li key={`${c.email}-${c.canceledAt}`} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <span className="text-on-surface truncate">{c.email}</span>
                  <span className="text-on-surface-variant text-xs shrink-0">
                    {c.modules.join(', ')} · {formatEur(c.cents)} · {formatDate(c.canceledAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
