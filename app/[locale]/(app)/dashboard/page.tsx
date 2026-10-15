import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChartLine, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm, ownsModule, ownsOna } from '@/lib/entitlements';
import { isOnaAvailable } from '@/lib/ona/access';
import { fetchOnaState } from '@/lib/ona/server';
import { cardProgress } from '@/lib/ona/rules';
import { ONA_CARDS, ONA_CARD_COUNT } from '@/data/ona/cards';
import { emptyLevelledProgress, fetchPortalProgress, fetchScoreTrend } from '@/lib/portal-progress';
import { KNM, LEVELS, SKILLS, isFreeExamOf, isSkillSlug, levelLabel, skillsAtLevel } from '@/data/skills';
import { euro, MODULE_PRICE_CENTS, totalExamsForLevel } from '@/lib/pricing';
import { fetchNextLessons, fetchResume, fetchWeek } from '@/lib/lessons/lessons-server';
import { ExamMark, StatTile } from '@/components/glas';
import AppShell from '../components/AppShell';
import GlasModuleCard from './_components/GlasModuleCard';
import { fetchPortalMenu } from '@/lib/portal-menu';

export const metadata: Metadata = {
  title: 'Mijn oefenportaal | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Het portaaloverzicht, in Glas (DESIGN_SYSTEM §G5, glas.html §09 "Dashboard"): **de begroeting,
 * de vier modules als kaarten en twee widgets — je gemiddelde score en deze week. Niets anders.**
 *
 * Elke kaart draagt één regel over waar je bent en één knop. Alleen de module waar je het laatst
 * was krijgt de oranje knop. De cijfers en de leerroute staan een klik dieper, op de
 * onderdeelpagina.
 *
 * **"Wat nu?" blijft regelgebaseerd** (CLAUDE.md §2): de oranje kaart is de module van de laatste
 * les die je opende, anders de eerste die van jou is. Geen score stuurt hier iets.
 *
 * **Elk getal hier is een telling, geen voorspelling**: oefenexamens gedaan, lessen deze week af,
 * en het gemiddelde van je examenscores (`fetchScoreTrend`) — wat je haalde, geen slaagkans.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('portal');
  const tOna = await getTranslations('ona');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  /**
   * An anonymous visitor browses the portal rather than being bounced to /login. The wall is one
   * step further in — at the oefenexamen itself, which redirects to /register.
   */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  const onaLive = isOnaAvailable();
  const [progress, menu, resume, nextLessons, week, scores, onaState] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPortalMenu(),
    user ? fetchResume(user.id) : Promise.resolve(null),
    fetchNextLessons(user?.id ?? null),
    fetchWeek(user?.id ?? null),
    user ? fetchScoreTrend(user.id) : Promise.resolve(null),
    onaLive ? fetchOnaState(user?.id ?? null) : Promise.resolve(null),
  ]);

  const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

  const totalExams = LEVELS.reduce((n, l) => n + totalExamsForLevel(l), 0) + KNM.examCount;
  const totalDone =
    LEVELS.reduce((n, l) => n + SKILLS.reduce((m, s) => m + progress[l][s.slug].examsDone, 0), 0)
    + progress.knm.examsDone;
  const totalPct = pct(totalDone, totalExams);

  /* Hoeveel van de catalogus is van jou? ONA telt mee in de noemer. */
  const ownedTracks =
    LEVELS.filter(l => SKILLS.some(s => ownsModule(meta, l, s.slug))).length + (ownsKnm(meta) ? 1 : 0)
    + (ownsOna(meta) ? 1 : 0);
  const catalogueSize = LEVELS.length + 2;

  const firstName = String(meta.full_name ?? meta.name ?? '').trim().split(' ')[0];

  /* Alleen een les van een taalonderdeel: de KNM-lessen wonen op een eigen pad. */
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
    if (!next) return null;
    const min = next.minutes != null ? ` · ${t('ov_minutes', { n: next.minutes })}` : '';
    return `${t('ov_next', { lesson: next.title })}${min}`;
  };

  const tracks = [
    ...LEVELS.map(level => {
      const total = totalExamsForLevel(level);
      return {
        key: level as string,
        track: level,
        title: t('level_section', { level: levelLabel(level) }),
        sub: level === 'a2' ? t('mod_a2_sub') : t('mod_b1_sub'),
        done: SKILLS.reduce((n, s) => n + progress[level][s.slug].examsDone, 0),
        total,
        owned: SKILLS.some(s => ownsModule(meta, level, s.slug)),
        base: `/${locale}/dashboard/${level}`,
        facts: `${t('card_parts', { n: skillsAtLevel(level).length })} · ${t('card_exams', { n: total })}`,
        /* Alleen waar het waar is: `isFreeExamOf` zegt per niveau of oefenexamen 1 gratis is. */
        freeLine: isFreeExamOf(level, 1) ? t('glas.mod_free_first') : null,
        price: t('glas.price_per_part', { price: euro(MODULE_PRICE_CENTS) }),
      };
    }),
    {
      key: 'knm',
      track: 'knm' as const,
      title: t('knm_section'),
      sub: t('mod_knm_sub'),
      done: progress.knm.examsDone,
      total: KNM.examCount,
      owned: ownsKnm(meta),
      base: `/${locale}/dashboard/knm`,
      facts: `${t('card_exams', { n: KNM.examCount })} · ${t('ov_minutes', { n: KNM.durationMinutes ?? 45 })}`,
      freeLine: isFreeExamOf(null, 1) ? t('glas.mod_free_first_knm') : null,
      price: t('glas.price_month', { price: euro(MODULE_PRICE_CENTS) }),
    },
  ];

  /**
   * Drie gezichten per kaart, uit de feiten die we al hebben: `active` (van jou en bezig — een
   * les staat open of er is een examen gedaan), `open` (van jou, nog niet begonnen), `locked`
   * (niet in je pakket: de prijs en wat gratis is, geen balk).
   */
  const cards = tracks.map(track => {
    const note = nextNote(track.key);
    const active = track.owned && (track.done > 0 || track.key === currentKey || Boolean(note));
    const state = !track.owned ? 'locked' : active ? 'active' : 'open';
    return {
      ...track,
      state,
      line: state === 'active'
        ? note ?? t('mod_exams', { done: track.done, total: track.total })
        : state === 'locked'
          ? track.freeLine ?? track.sub
          : track.sub,
      foot: state === 'active'
        ? t('mod_exams', { done: track.done, total: track.total })
        : state === 'locked' ? track.price : track.facts,
      pct: state === 'active' ? pct(track.done, track.total) : null,
      /* Elke kaart opent de cursus, ook zonder module: daar staan het gratis examen en de
         gratis lessen, en het slot met de prijs (eigenaar, 15-10). */
      href: track.base,
      cta: !track.owned
        ? (track.freeLine ? t('mod_try') : t('card_start'))
        : state === 'active' ? t('mod_continue') : t('card_start'),
    };
  });

  /* ONA telt kaarten, geen examens. Kaart 1 is gratis, dus zonder module is hij `open`. */
  const ona = (() => {
    if (!onaLive) return null;
    const entries = onaState?.entries ?? [];
    const byNo = new Map(entries.map(e => [e.cardNo, e]));
    const klaar = ONA_CARDS.filter(c => cardProgress(c, byNo.get(c.number)).status === 'klaar').length;
    return { started: Boolean(onaState?.portfolio), klaar };
  })();

  /* De week: zeven dagen, vandaag rechts. Een telling van afgeronde lessen, geen doel. */
  /* Twee letters ("ma", "di") in het Latijnse schrift; in het Arabisch zou dat bij elke dag
     het lidwoord "ال" zijn, dus daar de smalle vorm. */
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: locale === 'ar' ? 'narrow' : 'short' });
  const today = new Date();
  const days = week.days.map((n, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const label = dayFmt.format(d).replace('.', '');
    return { n, label: locale === 'ar' ? label : label.slice(0, 2) };
  });
  const maxDay = Math.max(1, ...week.days);
  const dateLine = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(today);

  const inPackage = (
    <span className="g-bdg g-bdg-zacht">{t('mod_in_package')}</span>
  );

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      isGuest={isGuest}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview"
      menu={menu}
    >
      <div className="g-page">
        <header className="g-dh">
          <span className="g-mono">{dateLine}</span>
          <h1>{firstName ? t('greeting_named_short', { name: firstName }) : t('greeting_short')}</h1>
          <p>{t('ov_sub', { pct: totalPct, owned: ownedTracks, total: catalogueSize })}</p>
        </header>

        {/* Een gast koopt eerst het account, niet de modules: zonder account opent ook het
            gratis examen niet. Dit is de enige regel die het dashboard daarvoor gebruikt. */}
        {isGuest && (
          <div className="g-notice g-guest">
            <UserPlus aria-hidden />
            <div>
              <b>{t('guest_upsell_title')}</b>
              {t('guest_upsell_body')}
            </div>
            <a href={`/${locale}/register?next=/dashboard`} className="g-btn g-btn-navy g-btn-sm">
              {t('guest_create_account')}
            </a>
          </div>
        )}

        <div className="g-dgrid">
          <div className="g-mods">
            {cards.map(card => (
              <GlasModuleCard
                key={card.key}
                mark={<ExamMark track={card.track} size={52} />}
                badge={card.owned ? inPackage : undefined}
                title={card.title}
                line={card.line}
                pct={card.pct}
                foot={card.foot}
                cta={card.cta}
                href={card.href}
                accent={card.key === currentKey}
                off={card.state === 'locked'}
              />
            ))}

            {ona ? (
              <GlasModuleCard
                mark={<ExamMark track="ona" size={52} />}
                badge={ownsOna(meta) ? inPackage : undefined}
                title={t('mod_ona_title')}
                line={ona.started ? tOna('progress', { done: ona.klaar, total: ONA_CARD_COUNT }) : t('mod_ona_sub')}
                pct={ona.started ? pct(ona.klaar, ONA_CARD_COUNT) : null}
                foot={ona.started
                  ? t('mod_ona_sub')
                  : `${tOna('mod_cards', { n: ONA_CARD_COUNT })} · ${tOna('mod_practice')}`}
                cta={ona.started ? t('mod_continue') : t('card_start')}
                href={`/${locale}/dashboard/ona`}
              />
            ) : (
              /* ONA staat tot de review van de docent op "binnenkort": geen link, geen prijs. */
              <GlasModuleCard
                mark={<ExamMark track="ona" size={52} muted />}
                title={t('mod_ona_title')}
                line={t('mod_soon_body')}
                pct={null}
                foot={t('tag_soon')}
                cta={null}
                href={null}
                off
              />
            )}
          </div>

          <aside>
            <StatTile
              className="g-wid-stat"
              icon={<ChartLine />}
              label={t('ov_avg_head')}
              value={scores?.averagePct ?? '—'}
              unit={scores?.averagePct != null ? '%' : undefined}
              delta={scores?.delta ? `+${scores.delta}` : undefined}
              viz={scores && scores.points.length > 1
                ? <ScoreSpark points={scores.points} />
                : !scores?.count ? <p className="g-wid-note">{t('ov_avg_none')}</p> : undefined}
            />
            {scores?.averagePct != null && (
              <p className="sr-only">{t('ov_avg_sr', { pct: scores.averagePct, n: scores.count })}</p>
            )}

            <section className="g-wid" aria-labelledby="wid-week">
              <span className="g-mono" id="wid-week">{t('ov_week_head')}</span>
              <div className="g-wid-big">{week.total}<span>{t('glas.week_lessons')}</span></div>
              <div className="g-week" aria-hidden>
                {days.map((d, i) => (
                  <span key={i}>
                    <i
                      className={d.n > 0 ? 'g-on' : undefined}
                      style={{ height: `${d.n > 0 ? 8 + Math.round((d.n / maxDay) * 26) : 4}px` }}
                    />
                    {d.label}
                  </span>
                ))}
              </div>
              <p className="sr-only">
                {week.total > 0 ? t('ov_week_count', { n: week.total }) : t('ov_week_none')}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/** De lijn onder de gemiddelde score: de laatste scores, geschaald op hun eigen bereik. */
function ScoreSpark({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const span = Math.max(1, Math.max(...points) - min);
  const step = 200 / (points.length - 1);
  const line = points
    .map((p, i) => `${i ? 'L' : 'M'}${Math.round(i * step)} ${Math.round(34 - ((p - min) / span) * 26)}`)
    .join(' ');
  return (
    <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="g-spark-avg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#002b6d" stopOpacity=".16" />
          <stop offset="1" stopColor="#002b6d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L200 40 L0 40Z`} fill="url(#g-spark-avg)" />
      <path
        d={line}
        fill="none"
        stroke="#002b6d"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
