import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule, planFromMetadata } from '@/lib/entitlements';
import { FREE_GRADED_PER_SKILL } from '@/lib/grading-limits';
import { MODULES } from '@/lib/pricing';
import { DEFAULT_LEVEL, getSkill, levelLabel } from '@/data/skills';
import { fetchPublishedExamNumbers } from '@/lib/portal-progress';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../components/AppShell';
import ModulePicker from './ModulePicker';

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
  searchParams: Promise<{ vanaf?: string; onderdeel?: string }>;
}) {
  const { locale } = await params;
  const { onderdeel } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/pakketten`);

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
  const sellable = MODULES.filter(
    m => m.level === DEFAULT_LEVEL || published[m.level][m.skill].size > 0,
  );

  // Highlighted when the candidate arrived from a specific locked onderdeel, so the module they
  // actually need is the one they see first. The param carries a full `level:skill` id.
  const focus = sellable.find(m => m.slug === onderdeel)?.slug ?? null;

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview"
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-7">
            <p className="pk-eyebrow">Pakketten</p>
            <h1 className="pk-title">Kies wat je wilt oefenen</h1>
            <p className="pk-lead">
              Elk onderdeel is een eigen abonnement. Je betaalt per maand en je kunt maandelijks
              opzeggen. Zonder abonnement kun je per onderdeel {FREE_GRADED_PER_SKILL} opdrachten
              laten nakijken.
            </p>
          </header>

          {plan !== 'free' && (
            <p className="pk-active">
              <Check size={15} strokeWidth={3} aria-hidden />
              Je hebt al toegang. Je kunt je abonnement beheren via{' '}
              <a href={`/${locale}/dashboard/profiel`}>Mijn account</a>.
            </p>
          )}

          <ModulePicker
            locale={locale}
            initialSelection={focus ? [focus] : []}
            modules={sellable.map(mod => {
              const skill = getSkill(mod.skill)!;
              return {
                slug: mod.slug,
                level: mod.level,
                levelLabel: levelLabel(mod.level),
                skill: mod.skill,
                label: skill.slug,
                examCount: mod.examCount,
                itemCount: mod.itemCount,
                itemNoun: skill.scoring === 'open' ? 'opdrachten' : 'vragen',
                hasRubricFeedback: mod.hasRubricFeedback,
                owned: ownsModule(meta, mod.level, mod.skill),
              };
            })}
          />

        </div>
      </div>

      <style>{`
        .pk-eyebrow { font-size:0.65rem; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:var(--color-secondary); margin:0 0 8px; }
        .pk-title { font-family:var(--font-headline); font-size:clamp(1.5rem,3.2vw,2rem); font-weight:800; letter-spacing:-0.03em; color:var(--color-on-surface); margin:0 0 8px; text-wrap:balance; }
        .pk-lead { font-size:0.95rem; line-height:1.7; color:var(--color-on-surface-variant); margin:0; max-width:60ch; }

        .pk-active { display:flex; align-items:center; gap:8px; margin:0 0 20px; padding:11px 14px; border-radius:12px; background:rgba(0,43,109,0.06); font-size:0.85rem; color:var(--color-primary); }
        .pk-active a { color:inherit; font-weight:800; }

        .pk-grid { display:grid; grid-template-columns:1fr; gap:14px; }
        @media (min-width:640px)  { .pk-grid { grid-template-columns:repeat(2,1fr); } }
        @media (min-width:1024px) { .pk-grid { grid-template-columns:repeat(4,1fr); } }

        .pk-card { display:flex; flex-direction:column; gap:12px; padding:18px; border-radius:18px; background:var(--color-surface-container-lowest); border:1.5px solid var(--color-surface-container-high); box-shadow:var(--shadow-card); }
        .pk-card-focus { border-color:var(--color-secondary-container); box-shadow:0 10px 30px rgba(254,118,44,0.16); }
        .pk-card-head { display:flex; align-items:flex-start; gap:10px; }
        .pk-card-title { font-family:var(--font-headline); font-size:1rem; font-weight:800; color:var(--color-on-surface); margin:0; text-transform:capitalize; }
        .pk-card-meta { font-size:0.72rem; color:var(--color-outline); margin:2px 0 0; }

        .pk-price { display:flex; align-items:baseline; gap:6px; margin:0; }
        .pk-price span { font-family:var(--font-headline); font-size:1.6rem; font-weight:800; letter-spacing:-0.03em; color:var(--color-primary); }
        .pk-price small { font-size:0.72rem; color:var(--color-outline); }

        .pk-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; flex:1; }
        .pk-list li { display:flex; align-items:flex-start; gap:7px; font-size:0.78rem; line-height:1.5; color:var(--color-on-surface-variant); }
        .pk-list svg { flex-shrink:0; margin-top:3px; color:var(--color-primary); }

        .pk-cta { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:0.7rem 1rem; border-radius:12px; font-size:0.82rem; font-weight:800; color:#5f2200; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange); transition:transform .2s cubic-bezier(0.22,1,0.36,1); }
        .pk-cta:hover { transform:translateY(-2px); }
        .pk-cta:focus-visible { outline:3px solid var(--color-secondary); outline-offset:2px; }

        .pk-bundle { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-top:18px; padding:20px 22px; border-radius:18px; background:linear-gradient(135deg,#001d4e 0%,#002b6d 55%,#003580 100%); box-shadow:0 10px 30px rgba(0,27,78,0.22); }
        .pk-bundle-eyebrow { font-size:0.65rem; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.62); margin:0 0 4px; }
        .pk-bundle-title { font-family:var(--font-headline); font-size:1.7rem; font-weight:800; letter-spacing:-0.03em; color:#fff; margin:0; }
        .pk-bundle-title small { font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.66); }
        .pk-bundle-note { font-size:0.82rem; line-height:1.6; color:rgba(255,255,255,0.75); margin:6px 0 0; max-width:52ch; }
        .pk-bundle-cta { display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:12px; font-size:0.88rem; font-weight:800; color:#5f2200; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange); transition:transform .2s cubic-bezier(0.22,1,0.36,1); }
        .pk-bundle-cta:hover { transform:translateY(-2px); }
        .pk-bundle-cta:focus-visible { outline:3px solid #fff; outline-offset:2px; }

        .pk-cap { text-transform:capitalize; }
        .pk-foot { display:flex; align-items:center; gap:7px; margin:16px 0 0; font-size:0.75rem; color:var(--color-outline); }

        @media (prefers-reduced-motion: reduce) {
          .pk-cta, .pk-bundle-cta { transition:none; }
          .pk-cta:hover, .pk-bundle-cta:hover { transform:none; }
        }
      `}</style>
    </AppShell>
  );
}
