import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm, ownsModule, ownsOna, planFromMetadata } from '@/lib/entitlements';
import { isOnaAvailable } from '@/lib/ona/access';
import { ONA_CARD_COUNT } from '@/data/ona/cards';
import { FREE_GRADED_PER_SKILL } from '@/lib/grading-limits';
import { MODULES, parseSelection } from '@/lib/pricing';
import { DEFAULT_LEVEL, getOnderdeel, isOna, moduleGroupLabel, type SkillSlug } from '@/data/skills';
import { fetchPublishedExamNumbers } from '@/lib/portal-progress';
import AppShell from '../../components/AppShell';
import ModulePicker from './ModulePicker';
import { fetchPortalMenu } from '@/lib/portal-menu';

export const metadata: Metadata = {
  title: 'Pakketten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Pricing **inside** the study portal.
 *
 * The upsell used to link to `/premium`, the public marketing page. That works, but it drops a
 * signed-in candidate out of the platform mid-task: the sidebar disappears, the public nav and
 * footer appear, and the page re-sells the product to somebody who already bought into it. Getting
 * back to the exam they were doing means the browser back button.
 *
 * So this is the same offer rendered in the portal shell — no hero, no testimonials, no re-pitch.
 * It answers one question ("what do I get if I pay, and what does it cost") and returns you to
 * where you were. `/premium` stays exactly as it is for anonymous visitors, which is who it is
 * written for.
 *
 * Prices come from `lib/pricing.ts`, so they cannot drift from the marketing page.
 */
export default async function PakkettenPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ vanaf?: string; onderdeel?: string; kies?: string }>;
}) {
  const { locale } = await params;
  const { onderdeel, kies } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(`/dashboard/pakketten${kies ? `?kies=${kies}` : ''}`)}`);

  const plan = planFromMetadata(user.user_metadata);
  const meta = user.user_metadata ?? {};

  /**
   * A level is only sellable once it has published exams.
   *
   * Otherwise the picker would offer a €9,95/month B1 module whose ten oefenexamens are all
   * "Binnenkort" — a subscription to an empty shelf. A2 stays listed unconditionally so the
   * page is never empty; every other level earns its place by having content.
   */
  const published = await fetchPublishedExamNumbers();
  const sellable = MODULES.filter(m =>
    // ONA heeft geen examens; hij staat te koop zodra de docent de inhoud heeft nagekeken.
    isOna(m.skill)
      ? isOnaAvailable()
    // KNM earns its place the same way B1 does — by having published exams. It has no level
    // to index, so it is matched before the per-level lookup rather than inside it.
    : m.level === null
      ? published.knm.size > 0
      : m.level === DEFAULT_LEVEL || published[m.level][m.skill as SkillSlug].size > 0,
  );

  // Highlighted when the candidate arrived from a specific locked onderdeel, so the module they
  // actually need is the one they see first. The param carries a full `level:skill` id.
  const focus = sellable.find(m => m.slug === onderdeel)?.slug ?? null;

  // De keuze uit de configurator op /premium, via `/register?next=…`. Alleen wat hier ook te koop
  // staat en nog niet van jou is; de prijs rekent de checkout toch opnieuw uit.
  const owned = (m: (typeof sellable)[number]) =>
    isOna(m.skill) ? ownsOna(meta)
    : m.level === null ? ownsKnm(meta)
    : ownsModule(meta, m.level, m.skill as SkillSlug);
  const picked = parseSelection(kies?.split(',') ?? []).filter(slug => {
    const m = sellable.find(x => x.slug === slug);
    return m !== undefined && !owned(m);
  });

  const menu = await fetchPortalMenu();

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview"
      menu={menu}
    >
      <div className="g-page">
        <header className="g-ph">
          <span className="g-mono">Pakketten</span>
          <h1>Kies wat je wilt oefenen</h1>
          <p>
            Elk onderdeel is een eigen abonnement. Je betaalt per maand en je kunt maandelijks
            opzeggen. Zonder abonnement kun je per onderdeel {FREE_GRADED_PER_SKILL} opdrachten
            laten nakijken.
          </p>
        </header>

        {plan !== 'free' && (
          <p className="g-notice g-notice-gap">
            <Check aria-hidden />
            <span>
              Je hebt al toegang. Je kunt je abonnement beheren via{' '}
              <a href={`/${locale}/dashboard/profiel`}>Mijn account</a>.
            </span>
          </p>
        )}

        <ModulePicker
          locale={locale}
          initialSelection={picked.length ? picked : focus ? [focus] : []}
          modules={sellable.map(mod => {
            if (isOna(mod.skill)) {
              return {
                slug: mod.slug,
                level: null,
                levelLabel: 'ONA',
                skill: mod.skill,
                label: 'ONA',
                examCount: 0,
                itemCount: null,
                itemNoun: '',
                hasRubricFeedback: false,
                metaLine: `${ONA_CARD_COUNT} resultaatkaarten · eindgesprek oefenen`,
                owned: ownsOna(meta),
              };
            }
            const skill = getOnderdeel(mod.skill)!;
            return {
              slug: mod.slug,
              level: mod.level,
              levelLabel: moduleGroupLabel(mod.level),
              skill: mod.skill,
              label: skill.slug,
              examCount: mod.examCount,
              itemCount: mod.itemCount,
              itemNoun: skill.scoring === 'open' ? 'opdrachten' : 'vragen',
              hasRubricFeedback: mod.hasRubricFeedback,
              owned: mod.level === null
                ? ownsKnm(meta)
                : ownsModule(meta, mod.level, mod.skill as SkillSlug),
            };
          })}
        />
      </div>
    </AppShell>
  );
}
