import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { modulesFromMetadata, ownsKnm, ownsModule, planFromMetadata } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress } from '@/lib/portal-progress';
import { KNM, LEVELS, SKILLS, levelLabel, isSkillSlug, skillsAtLevel, type Level } from '@/data/skills';
import { totalExamsForLevel } from '@/lib/pricing';
import { fetchNextLessons, fetchResume, fetchWeek } from '@/lib/lessons/lessons-server';
import { ExamMark } from '@/components/horizon';
import AppShell from '../components/AppShell';
import TrackCard, { type TrackCardMeta } from './_components/TrackCard';
import { fetchPortalMenu } from '@/lib/portal-menu';

export const metadata: Metadata = {
  title: 'Mijn oefenportaal | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Het portaaloverzicht: de tracks als rijen links, drie kleine kaarten rechts.
 *
 * Herbouwd naar de mockup van de eigenaar (03-09), over de vier-ringen-versie van dezelfde dag.
 * Die was leesbaar maar leeg: vier percentages en verder niets, terwijl de vraag waarmee iemand
 * dit scherm opent "wat doe ik nu?" is. Elke rij draagt daarom de eerstvolgende les erbij, en
 * één rij is de huidige.
 *
 * **Geen kleur per module.** De mockup gaf elke track een eigen kleur; dat maakt van de
 * navigatie een legenda die je moet leren, en het botst met de regel dat een nieuwe kleur in dit
 * portaal een *status* betekent (goed/fout), nooit een categorie. De marks doen het onderscheid,
 * zoals overal.
 *
 * **De totale voortgang is geen tweede donut.** Naast vier ringen zou een vijfde ring alleen
 * maar een vijfde keer hetzelfde zeggen. Het is een rail per track op één navy kaart, waarin de
 * breedte van elke rail meetelt hoe zwaar die track weegt — 40 oefenexamens naast 10 is geen
 * gelijke stem, en vier gelijke balken zouden dat verzwijgen.
 *
 * **Elk getal hier is een telling, geen voorspelling**: hoeveel oefenexamens gedaan, hoeveel
 * lessen deze week afgerond, en de termijn zoals de kandidaat hem zelf heeft laten uitrekenen.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('portal');

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
     `plan: 'free'` en kreeg de verkooppitch onder zijn eigen modules. */
  const hasPaidPlan = planFromMetadata(meta) !== 'free' || modulesFromMetadata(meta).length > 0;

  const [progress, menu, resume, nextLessons, week] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPortalMenu(),
    user ? fetchResume(user.id) : Promise.resolve(null),
    fetchNextLessons(user?.id ?? null),
    fetchWeek(user?.id ?? null),
  ]);

  const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

  const totalExams = LEVELS.reduce((n, l) => n + totalExamsForLevel(l), 0) + KNM.examCount;
  const totalDone =
    LEVELS.reduce((n, l) => n + SKILLS.reduce((m, s) => m + progress[l][s.slug].examsDone, 0), 0)
    + progress.knm.examsDone;
  const totalPct = pct(totalDone, totalExams);

  /* Hoeveel van de catalogus is van jou? ONA telt mee in de noemer — het hoort bij het traject
     dat dit platform belooft, en het weglaten zou "3 van 3" opleveren voor iemand die nog niet
     alles heeft. */
  const ownedTracks =
    LEVELS.filter(l => SKILLS.some(s => ownsModule(meta, l, s.slug))).length + (ownsKnm(meta) ? 1 : 0);
  const catalogueSize = LEVELS.length + 2;

  const firstName = String(meta.full_name ?? meta.name ?? '').trim().split(' ')[0];

  /* Alleen een les van een taalonderdeel: de KNM-lessen wonen op een eigen pad en zitten in
     geen spoor, dus `lessonPath` zou daar naar een niet-bestaande URL wijzen. */
  const resumeHere = resume && resume.level && isSkillSlug(resume.onderdeel)
    ? { ...resume, level: resume.level, onderdeel: resume.onderdeel }
    : null;

  /** De kaart met de oranje knop: waar je het laatst was, anders de eerste die van jou is. */
  const currentKey =
    resumeHere?.level
    ?? LEVELS.find(l => SKILLS.some(s => ownsModule(meta, l, s.slug)))
    ?? (ownsKnm(meta) ? 'knm' : null);

  const nextNote = (key: string) => {
    const next = nextLessons.get(key);
    if (!next) return t('ov_next_empty');
    const min = next.minutes != null ? ` · ${t('ov_minutes', { n: next.minutes })}` : '';
    return `${t('ov_next', { lesson: next.title })}${min}`;
  };

  const trackHref = (key: string, owned: boolean, base: string) =>
    owned ? base : `/${locale}/dashboard/pakketten?vanaf=portaal&onderdeel=${key}`;

  const tracks = [
    ...LEVELS.map(level => {
      const done = SKILLS.reduce((n, s) => n + progress[level][s.slug].examsDone, 0);
      const total = totalExamsForLevel(level);
      const owned = SKILLS.some(s => ownsModule(meta, level, s.slug));
      return {
        key: level as string,
        mark: <ExamMark track={level} size={56} onDark />,
        title: t('level_section', { level: levelLabel(level) }),
        sub: level === 'a2' ? t('mod_a2_sub') : t('mod_b1_sub'),
        done,
        total,
        owned,
        pct: pct(done, total),
        weight: total,
        base: `/${locale}/dashboard/${level}`,
        meta: [
          { icon: 'parts' as const, label: t('card_parts', { n: skillsAtLevel(level).length }) },
          { icon: 'exams' as const, label: t('card_exams', { n: total }) },
        ],
      };
    }),
    {
      key: 'knm',
      mark: <ExamMark track="knm" size={56} onDark />,
      title: t('knm_section'),
      sub: t('mod_knm_sub'),
      done: progress.knm.examsDone,
      total: KNM.examCount,
      owned: ownsKnm(meta),
      pct: pct(progress.knm.examsDone, KNM.examCount),
      weight: KNM.examCount,
      base: `/${locale}/dashboard/knm`,
      meta: [
        { icon: 'exams' as const, label: t('card_exams', { n: KNM.examCount }) },
        { icon: 'clock' as const, label: t('ov_minutes', { n: KNM.durationMinutes ?? 45 }) },
      ],
    },
  ];

  /**
   * De vier gezichten van een kaart, uit de feiten die we al hebben.
   *
   * `active` is bewust breder dan "er staat een percentage": ook een module waarin je nog geen
   * examen deed maar wél een les openstaat is bezig — dat is precies de kandidaat die dit scherm
   * opent om verder te gaan. Zonder les en zonder examen is de kaart `open`: dan zegt de voet
   * waar de module uit bestaat, want er is nog geen voortgang om te melden.
   */
  const cards = tracks.map(track => {
    const next = nextLessons.get(track.key);
    const active = track.owned && (track.done > 0 || track.key === currentKey || Boolean(next));
    const state: 'active' | 'open' | 'locked' = !track.owned ? 'locked' : active ? 'active' : 'open';
    return {
      ...track,
      state,
      note: state === 'active' ? nextNote(track.key) : null,
      progressLabel: state === 'active' ? t('mod_exams', { done: track.done, total: track.total }) : null,
      href: trackHref(track.key, track.owned, track.base),
      cta: !track.owned ? t('mod_add') : state === 'active' ? t('mod_continue') : t('card_start'),
      meta: track.meta as TrackCardMeta[],
    };
  });

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
        <div className="max-w-6xl mx-auto">

          <header className="ov-head">
            <h1>{firstName ? t('greeting_named_short', { name: firstName }) : t('greeting_short')}</h1>
            <p>{t('ov_sub', { pct: totalPct, owned: ownedTracks, total: catalogueSize })}</p>
          </header>

          <div className="ov-grid">
            <div className="ov-rows">
              <div className="ov-cards">
                {cards.map(card => (
                  <TrackCard
                    key={card.key}
                    mark={card.mark}
                    title={card.title}
                    sub={card.sub}
                    state={card.state}
                    meta={card.meta}
                    note={card.note}
                    pct={card.pct}
                    progressLabel={card.progressLabel}
                    cta={card.cta}
                    href={card.href}
                    soonLabel={t('tag_soon')}
                    accent={card.key === currentKey}
                  />
                ))}

                {/* ONA is aangekondigd en niet gebouwd: geen link, geen prijs, geen slot. */}
                <TrackCard
                  mark={<ExamMark track="ona" size={56} onDark muted />}
                  title={t('mod_ona_title')}
                  sub={t('mod_ona_sub')}
                  state="soon"
                  meta={[]}
                  note={t('mod_soon_body')}
                  pct={null}
                  progressLabel={null}
                  cta={null}
                  href={null}
                  soonLabel={t('tag_soon')}
                />
              </div>

            </div>

            <aside className="ov-side">
              {/* ── Totale voortgang ──
                  Eén getal en de week eronder, en niets meer. De rails-per-track en de legenda
                  stonden hier eerst: dat was een derde keer hetzelfde zeggen, want elke kaart
                  links draagt zijn eigen balk al. Wat de kaarten *niet* kunnen zeggen is of je
                  deze week iets deed — dus dat is wat er overblijft. */}
              <section className="ov-card ov-total">
                <span className="ov-kick">{t('ov_total_head')}</span>
                <div className="ov-total-top">
                  <b>{totalPct}%</b>
                  <span>{t('ov_of_all')}</span>
                </div>
                <span className="ov-rail" aria-hidden><i style={{ width: `${totalPct}%` }} /></span>

                {/* Zeven vakjes, vandaag rechts. Alleen afgeronde lessen met een datum tellen
                    mee; het is een telling van wat je deed, geen doel dat je kunt missen. */}
                <div className="ov-week">
                  <span className="ov-week-lb">
                    {week.total > 0 ? t('ov_week_count', { n: week.total }) : t('ov_week_none')}
                  </span>
                  <div className="ov-days" aria-hidden>
                    {week.days.map((n, i) => (
                      <span key={i} className={n > 0 ? 'on' : ''} />
                    ))}
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {/* A guest is sold the account, not the modules: the paid pitch below is the wrong
              next step for someone who cannot yet open the free exam. */}
          {!hasPaidPlan && (
            <aside className="upsell mt-6">
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
