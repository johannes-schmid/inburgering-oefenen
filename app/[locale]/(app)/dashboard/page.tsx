import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, CalendarClock, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { modulesFromMetadata, ownsKnm, ownsModule, planFromMetadata } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { KNM, LEVELS, SKILLS, levelLabel, type Level } from '@/data/skills';
import { MODULE_PRICE_CENTS, euro, totalExamsForLevel } from '@/lib/pricing';
import { fetchLessonCounts, moduleKey } from '@/lib/lessons/lessons-server';
import { fetchNextLesson, nextExamFor } from '@/lib/portal-next';
import { CategoryMark, LevelMark } from '@/components/horizon';
import AppShell from '../components/AppShell';
import ModuleCard from './_components/ModuleCard';
import PortalHero from './_components/PortalHero';
import { fetchPortalMenu } from '@/lib/portal-menu';

export const metadata: Metadata = {
  title: 'Mijn oefenportaal | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Het portaaloverzicht: één kaart per module, en daaronder wat je nu moet doen.
 *
 * Herbouwd op 29-08. Het toonde per niveau de vier onderdelen — twaalf kaarten voor iemand met
 * twee niveaus en KNM, en geen van die kaarten wist iets van de leerlaag. Nu is het de
 * catalogus op één rij (A2, B1, KNM, ONA) met per module twee meters: leren en oefenen. De
 * onderdelen staan een klik verder, op `/dashboard/[level]`, dat daar al voor bestond.
 *
 * **De volgorde is de catalogus, niet bezit-eerst** — dezelfde regel als in `PortalMenu`: met
 * bezit-eerst zou KNM tussen A2 en B1 springen zodra je KNM koopt. Wat niet van jou is staat
 * doffer en draagt de prijs; wat niet bestaat draagt "binnenkort" en is geen link.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  /**
   * An anonymous visitor browses the portal rather than being bounced to /login.
   *
   * The wall is one step further in — at the oefenexamen itself, which redirects to
   * /register. Sending them away from the catalogue was asking for the account before they
   * had seen what the account is for; the free taster's CTA now lands here.
   */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};
  /* Bezit is per module, niet "heeft een betaald plan" — een klant die alleen Lezen kocht is
     `plan: 'free'` en kreeg de verkooppitch onder zijn eigen modules. Zelfde verwarring als
     `ownsModule` in de speler oploste. */
  const hasPaidPlan = planFromMetadata(meta) !== 'free' || modulesFromMetadata(meta).length > 0;

  const [progress, published, lessons, menu] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
    fetchLessonCounts(user?.id ?? null),
    fetchPortalMenu(),
  ]);

  const totalExams = LEVELS.reduce((n, l) => n + totalExamsForLevel(l), 0) + KNM.examCount;
  const totalDone =
    LEVELS.reduce((n, l) => n + SKILLS.reduce((m, s) => m + progress[l][s.slug].examsDone, 0), 0)
    + progress.knm.examsDone;

  /** De lestellingen van een heel niveau: de vier onderdelen bij elkaar opgeteld. */
  const levelLessons = (level: Level) =>
    SKILLS.reduce(
      (acc, s) => {
        const c = lessons.get(moduleKey(level, s.slug)) ?? { done: 0, total: 0 };
        return { done: acc.done + c.done, total: acc.total + c.total };
      },
      { done: 0, total: 0 },
    );

  const knmLessons = lessons.get(moduleKey(null, 'knm')) ?? { done: 0, total: 0 };

  /** Alle lessen van alle modules samen — de tegel "Leren" in de kop. */
  const lessonsAll = [...LEVELS.map(levelLessons), knmLessons].reduce(
    (a, b) => ({ done: a.done + b.done, total: a.total + b.total }),
    { done: 0, total: 0 },
  );
  const pctLabel = (c: { done: number; total: number }) =>
    c.total === 0 ? '—' : `${Math.round((c.done / c.total) * 100)}%`;

  const lessonsLabel = (c: { done: number; total: number }) =>
    c.total === 0 ? t('mod_no_lessons') : t('mod_lessons', { done: c.done, total: c.total });

  // ── De drie vervolgstappen ────────────────────────────────────────────────
  // De les eerst: leren gaat aan oefenen vooraf, en het is de stap die de leerlaag heeft
  // toegevoegd. Zonder cursus of zonder gepubliceerd examen valt de kaart terug op een
  // zin in plaats van te verdwijnen — een rij van drie die soms uit één kaart bestaat leest
  // als een renderfout.
  const nextExam = nextExamFor(meta, progress, published, LEVELS);
  const nextLes = user
    ? await fetchNextLesson(
        user.id,
        meta,
        LEVELS.flatMap(level => SKILLS.map(s => ({ level, skill: s.slug }))),
      )
    : null;

  const firstName = String(meta.full_name ?? meta.name ?? '').trim().split(' ')[0];

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      isGuest={isGuest}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview"
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          <PortalHero
            kicker={t('eyebrow')}
            title={firstName ? t('greeting_named', { name: firstName }) : t('greeting')}
            lede={t('overview_intro', { done: totalDone, total: totalExams })}
            tiles={[
              { label: t('mod_learn'), value: pctLabel(lessonsAll), sub: lessonsLabel(lessonsAll) },
              { label: t('mod_practice'), value: `${Math.round((totalDone / totalExams) * 100)}%`, sub: t('mod_exams', { done: totalDone, total: totalExams }) },
            ]}
          />

          <h2 className="mini-head">{t('modules_head')}</h2>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {LEVELS.map(level => {
              const owned = SKILLS.some(s => ownsModule(meta, level, s.slug));
              const done = SKILLS.reduce((n, s) => n + progress[level][s.slug].examsDone, 0);
              const les = levelLessons(level);
              return (
                <ModuleCard
                  key={level}
                  index={LEVELS.indexOf(level)}
                  mark={<LevelMark level={level} size={46} />}
                  title={t('level_section', { level: levelLabel(level) })}
                  sub={owned
                    ? `${t(`mod_${level}_sub`)} · ${t('mod_owned')}`
                    : `${t(`mod_${level}_sub`)} · ${t('mod_not_owned')}`}
                  href={`/${locale}/dashboard/${level}`}
                  badge={owned ? undefined : t('mod_price', { price: euro(MODULE_PRICE_CENTS) })}
                  learnLabel={t('mod_learn')}
                  practiceLabel={t('mod_practice')}
                  learn={{ ...les, label: lessonsLabel(les) }}
                  practice={{
                    done,
                    total: totalExamsForLevel(level),
                    label: t('mod_exams', { done, total: totalExamsForLevel(level) }),
                  }}
                  cta={owned ? t('mod_continue') : undefined}
                />
              );
            })}

            {/* KNM staat naast de niveaus en niet erin: het is één onderdeel zonder niveau,
                het zit in geen van beide bundels, en een tegel binnen A2 zou dat allebei
                ontkennen. */}
            <ModuleCard
              index={2}
              mark={<CategoryMark category="knm" size={46} />}
              title={t('knm_section')}
              sub={ownsKnm(meta)
                ? `${t('mod_knm_sub')} · ${t('mod_owned')}`
                : `${t('mod_knm_sub')} · ${t('mod_not_owned')}`}
              href={`/${locale}/dashboard/knm`}
              badge={ownsKnm(meta) ? undefined : t('mod_price', { price: euro(MODULE_PRICE_CENTS) })}
              learnLabel={t('mod_learn')}
              practiceLabel={t('mod_practice')}
              learn={{ ...knmLessons, label: lessonsLabel(knmLessons) }}
              practice={{
                done: progress.knm.examsDone,
                total: KNM.examCount,
                label: t('mod_exams', { done: progress.knm.examsDone, total: KNM.examCount }),
              }}
              cta={ownsKnm(meta) ? t('mod_continue') : undefined}
            />

            {/* ONA is aangekondigd en niet gebouwd. Geen link, geen prijs, geen slot: een slot
                belooft dat betalen het opent. Zelfde regel als de ONA-tegel op de homepage. */}
            <ModuleCard
              index={3}
              mark={<CategoryMark category="gidsen" size={46} tone="light" />}
              title={t('mod_ona_title')}
              sub={t('mod_ona_sub')}
              href={null}
              badge={t('tag_soon')}
              soon
              soonBody={t('mod_soon_body')}
              learnLabel={t('mod_learn')}
              practiceLabel={t('mod_practice')}
              learn={{ done: 0, total: 0, label: '—' }}
              practice={{ done: 0, total: 0, label: '—' }}
            />
          </div>

          <h2 className="mini-head mt-9">{t('next_head')}</h2>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            <NextCard
              icon={<BookOpen size={15} strokeWidth={2.4} />}
              label={t('next_learn')}
              title={nextLes ? nextLes.title : t('next_learn_empty_title')}
              body={nextLes
                ? [nextLes.blockName, nextLes.minutes != null ? t('minutes', { n: nextLes.minutes }) : null]
                    .filter(Boolean).join(' · ')
                : t('next_learn_empty')}
              cta={nextLes ? t('next_learn_cta') : null}
              href={nextLes ? `/${locale}${nextLes.href}` : null}
              primary
            />
            <NextCard
              icon={<FileText size={15} strokeWidth={2.4} />}
              label={t('next_exam')}
              title={nextExam
                ? `${levelLabel(nextExam.level)} ${tSkills(`${nextExam.skill.key}.name`)} · ${t('exam_row_title', { number: nextExam.number })}`
                : t('next_exam_empty_title')}
              body={nextExam
                ? t('card_meta', {
                    items: String(nextExam.skill.itemCount ?? '—'),
                    minutes: String(nextExam.skill.durationMinutes ?? '—'),
                  })
                : t('next_exam_empty')}
              cta={nextExam ? t('next_exam_cta') : null}
              href={nextExam
                ? `/${locale}/oefenexamen/${nextExam.level}/${nextExam.skill.slug}/${nextExam.number}`
                : null}
            />
            <NextCard
              icon={<CalendarClock size={15} strokeWidth={2.4} />}
              label={t('next_deadline')}
              title={t('next_deadline_title')}
              body={t('next_deadline_body')}
              cta={t('next_deadline_cta')}
              href={`/${locale}/inburgering/tools/tijdlijn`}
            />
          </div>

          {/* A guest is sold the account, not the modules: the paid pitch below is the wrong
              next step for someone who cannot yet open the free exam. */}
          {!hasPaidPlan && (
            <aside className="upsell mt-8">
              <div className="min-w-0">
                <h2 className="font-headline font-extrabold text-white" style={{ fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
                  {isGuest ? t('guest_upsell_title') : t('upsell_title')}
                </h2>
                <p className="text-[0.85rem] mt-1" style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
                  {isGuest ? t('guest_upsell_body') : t('upsell_body', { total: totalExams })}
                </p>
              </div>
              <a
                href={isGuest ? `/${locale}/register?next=/dashboard` : `/${locale}/dashboard/pakketten?vanaf=portaal`}
                className="upsell-cta no-underline"
              >
                {isGuest ? t('guest_create_account') : t('upsell_cta')}
                <ArrowRight size={16} strokeWidth={2.4} />
              </a>
            </aside>
          )}
        </div>
      </div>

      <style>{`
        /* No 1.5px border (§2, the no-line rule): the card is white on a tonal page background, which
           is what makes it read as elevated, plus the ambient shadow of §4. */
        .next-card { background:var(--color-surface-container-lowest); border-radius:18px; padding:18px; box-shadow:var(--shadow-ambient); display:flex; flex-direction:column; gap:6px; }
        .next-card .lab { display:inline-flex; align-items:center; gap:7px; font-size:0.64rem; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:var(--color-on-surface-variant); }
        .next-cta { margin-top:auto; padding-top:14px; display:inline-flex; align-items:center; gap:7px; font-size:0.82rem; font-weight:800; color:var(--color-primary); }
        .next-cta.solid { color:#fff; }
        .next-cta.solid span { display:inline-flex; align-items:center; gap:7px; padding:9px 14px; border-radius:10px; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange); }
        a.next-card:hover .next-cta { text-decoration:underline; }
        a.next-card:hover .next-cta.solid { text-decoration:none; }

        .upsell { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px; border-radius:18px; background:var(--gradient-brand); box-shadow:0 10px 30px rgba(0,27,78,0.22); }
        .upsell-cta { display:inline-flex; align-items:center; gap:8px; padding:11px 18px; border-radius:12px; font-size:0.85rem; font-weight:800; color:#fff; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease; }
        .upsell-cta:hover { transform:translateY(-2px); box-shadow:var(--shadow-btn-orange-hover); }
        .upsell-cta:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) {
          .upsell-cta { transition:none; }
          .upsell-cta:hover { transform:none; }
        }
      `}</style>
    </AppShell>
  );
}

/**
 * Eén vervolgstap.
 *
 * Zonder `href` is het een kaart en geen link: "er is nog geen les vrijgegeven" mag niet
 * klikbaar zijn, want elke bestemming die je dan kiest is de verkeerde.
 */
function NextCard({
  icon, label, title, body, cta, href, primary = false,
}: {
  icon: React.ReactNode; label: string; title: string; body: string;
  cta: string | null; href: string | null; primary?: boolean;
}) {
  const inner = (
    <>
      <span className="lab">{icon}{label}</span>
      <h3 className="font-headline font-extrabold text-on-surface" style={{ fontSize: '1rem', letterSpacing: '-0.015em' }}>
        {title}
      </h3>
      <p className="text-[0.8rem] text-on-surface-variant" style={{ lineHeight: 1.6 }}>{body}</p>
      {cta && (
        <span className={`next-cta${primary ? ' solid' : ''}`}>
          {primary ? <span>{cta}<ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" /></span>
                   : <>{cta}<ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" /></>}
        </span>
      )}
    </>
  );
  return href
    ? <a href={href} className="next-card no-underline">{inner}</a>
    : <div className="next-card">{inner}</div>;
}
