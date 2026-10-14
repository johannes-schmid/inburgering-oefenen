'use client';

import { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, RotateCcw, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '../../components/AppShell';
import BackLink from '../../components/BackLink';
import { LogoLoader, PassChanceLabel } from '@/components/glas';
import { passChanceLevel } from '../_components/pass-chance';
import {
  calculateSlaagkans,
  buildSectionProgress,
  type TopicStat,
} from '@/lib/exam-readiness';
import { buildProgressionSeries, type ProgressionPoint } from '@/lib/progression';
import { track } from '@/lib/analytics';
import { THEMAS } from '@/data/leren';
import { lerenLinkForSectionSlug, buildLerenHref } from '@/lib/leren-links';
import ProgressionChart from './components/ProgressionChart';

type TopicProgress = Record<string, TopicStat>;

function slugForTopic(title: string): string | undefined {
  return THEMAS.find(t => t.title === title)?.slug;
}

export default function AnalysePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('dashboard');
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [topicProgress, setTopicProgress] = useState<TopicProgress>({});
  const [sectionProgress, setSectionProgress] = useState<Record<string, ReturnType<typeof buildSectionProgress>[string]>>({});
  const [sectionSlugById, setSectionSlugById] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<number[]>([]);
  const [progression, setProgression] = useState<ProgressionPoint[]>([]);
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      let userId = '';
      try {
        const raw = sessionStorage.getItem('__pw_session__');
        if (raw) {
          const s = JSON.parse(raw);
          userId = s?.user?.id ?? '';
          setEmail(s?.user?.email ?? '');
        }
      } catch {}

      if (!userId) {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s) { window.location.href = `/${locale}/login`; return; }
        userId = s.user.id;
        setEmail(s.user.email ?? '');
      }

      const [qRes, secRes, resultsRes, examRes] = await Promise.all([
        supabase.from('questions_flat').select('id, category, section_id, exam'),
        supabase.from('sections').select('id, slug, name_nl, sort_order, topic').order('sort_order'),
        supabase.from('user_question_results').select('question_id, was_correct, answered_at').eq('user_id', userId).order('answered_at', { ascending: true }),
        supabase.from('exam_results').select('exam_number, pct, passed').eq('user_id', userId),
      ]);

      const questions = (qRes.data ?? []) as { id: number; category: string; section_id: number | null; exam: number | null }[];
      const sections = (secRes.data ?? []) as { id: number; slug: string; name_nl: string; sort_order: number; topic: string }[];
      const answers = (resultsRes.data ?? []) as { question_id: number; was_correct: boolean; answered_at: string }[];
      const exams = (examRes.data ?? []) as { exam_number: number; pct: number; passed: boolean }[];

      const results: Record<number, boolean> = {};
      answers.forEach(r => { results[r.question_id] = r.was_correct; });

      const totals: Record<string, number> = {};
      questions.forEach(q => { totals[q.category] = (totals[q.category] || 0) + 1; });
      const tp: TopicProgress = {};
      Object.keys(totals).forEach(cat => { tp[cat] = { total: totals[cat], mastered: 0, reviewing: 0, unseen: totals[cat] }; });
      questions.forEach(q => {
        const r = results[q.id];
        if (r === undefined) return;
        const stat = tp[q.category];
        if (!stat) return;
        if (r) stat.mastered++; else stat.reviewing++;
        stat.unseen--;
      });

      setTopicProgress(tp);
      setSectionProgress(buildSectionProgress(questions, sections, results));
      const slugById: Record<number, string> = {};
      sections.forEach(s => { slugById[s.id] = s.slug; });
      setSectionSlugById(slugById);
      setScores(exams.map(e => e.pct));
      setProgression(buildProgressionSeries(answers, questions.length));

      const requestedTopic = new URLSearchParams(window.location.search).get('topic');
      if (requestedTopic && tp[requestedTopic]) {
        setOpenTopic(requestedTopic);
      } else {
        const weakestEntry = Object.entries(tp)
          .filter(([, s]) => s.mastered + s.reviewing > 0)
          .sort((a, b) => (a[1].mastered / a[1].total) - (b[1].mastered / b[1].total))[0];
        if (weakestEntry) setOpenTopic(weakestEntry[0]);
      }

      track('analyse_opened');
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LogoLoader fullPage label={t('loading')} />;

  const { slaagkans, band } = calculateSlaagkans(scores);
  const bandLabel = t(`slaagkans_band_${band}`);

  const topics = Object.entries(topicProgress)
    .map(([title, s]) => ({
      title,
      total: s.total,
      attempted: s.mastered + s.reviewing,
      mistakes: s.reviewing,
      pct: s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0,
    }))
    .sort((a, b) => (a.attempted === 0 ? 1 : 0) - (b.attempted === 0 ? 1 : 0) || a.pct - b.pct);

  const totalMistakes = topics.reduce((a, tp) => a + tp.mistakes, 0);

  return (
    <AppShell locale={locale} email={email} active="overview">
      <div className="g-page g-page-narrow">
        <BackLink fallbackHref={`/${locale}/dashboard`} />
        <header className="g-ph">
          <h1>{t('analyse_title')}</h1>
          <p>{t('analyse_subtitle')}</p>
        </header>

        {/* Slaagkans + verloop. De wijzer staat op dezelfde vijf standen als overal (§G5). */}
        <section className="g-card">
          <div className="flex flex-wrap items-center gap-4">
            <PassChanceLabel
              level={passChanceLevel(scores.length, band)}
              word={scores.length > 0 ? `${slaagkans}%` : '—'}
              sub={scores.length > 0 ? `${t('slaagkans_label')} · ${bandLabel}` : t('slaagkans_label')}
            />
          </div>
          <div className="g-card-h">
            <h2>{t('progress_title')}</h2>
            <small>{t('progress_sub')}</small>
          </div>
          <ProgressionChart points={progression} locale={locale} />
        </section>

        {/* De algemene foutenwachtrij: de ene oranje knop van dit scherm. */}
        {totalMistakes > 0 && (
          <a href={`/${locale}/dashboard/fouten`} className="g-btn g-btn-oranje mt-4 w-full">
            <RotateCcw aria-hidden />
            {t('analyse_fix_all', { count: totalMistakes })}
          </a>
        )}

        <div className="g-card-h mt-7 mb-3">
          <h2>{t('topics_title')}</h2>
          <small>{t('topics_weakest_first')}</small>
        </div>

        <div className="flex flex-col gap-2.5">
          {topics.map(topic => {
            const isOpen = openTopic === topic.title;
            const notStarted = topic.attempted === 0;
            const secs = sectionProgress[topic.title] ?? [];
            const wrongSecs = secs.filter(s => s.reviewing > 0);
            const slug = slugForTopic(topic.title);
            const worstSec = [...wrongSecs].sort((a, b) => b.reviewing - a.reviewing)[0];
            const secLink = worstSec ? lerenLinkForSectionSlug(sectionSlugById[worstSec.id]) : null;
            const learnHref = secLink
              ? buildLerenHref(locale, secLink)
              : slug ? `/${locale}/leren/${slug}` : `/${locale}/dashboard?view=leren`;

            const steps: { icon: React.ReactNode; label: string; href: string }[] = [
              { icon: <BookOpen aria-hidden />, label: t('analyse_step_learn'), href: learnHref },
            ];
            if (topic.mistakes > 0) {
              steps.push({ icon: <RotateCcw aria-hidden />, label: t('analyse_step_repeat', { count: topic.mistakes }), href: `/${locale}/dashboard/fouten?topic=${encodeURIComponent(topic.title)}` });
            } else if (notStarted) {
              steps.push({ icon: <Target aria-hidden />, label: t('btn_practice_topic'), href: `/${locale}/dashboard?view=exams&openTopic=${encodeURIComponent(topic.title)}` });
            }
            /* In orde = groen (§G3), aandacht = oranje/klei, nog niet begonnen = grijs. */
            const tone = notStarted ? '' : topic.pct >= 70 ? ' g-good' : ' g-weak';

            return (
              <div key={topic.title} className={`g-topic${isOpen ? ' g-open' : ''}`}>
                <button
                  type="button"
                  className="g-topic-h"
                  aria-expanded={isOpen}
                  onClick={() => setOpenTopic(isOpen ? null : topic.title)}
                >
                  <span className="g-topic-row">
                    <b>{topic.title}</b>
                    <span className={`g-topic-pct${tone}`}>
                      {notStarted ? t('topics_not_started') : `${topic.pct}%`}
                      {isOpen ? <ChevronDown aria-hidden /> : <ChevronRight className="rtl-flip" aria-hidden />}
                    </span>
                  </span>
                  <span className="g-prog" aria-hidden>
                    <i className={tone.trim() || 'g-none'} style={{ width: `${notStarted ? 4 : topic.pct}%` }} />
                  </span>
                </button>

                {isOpen && (
                  <div className="g-topic-body">
                    {topic.mistakes > 0 ? (
                      <>
                        <span className="g-mono">{t('analyse_whatswrong')}</span>
                        {wrongSecs.map(s => (
                          <div key={s.id} className="g-mistake">
                            <span>{s.name}</span>
                            <b>{t('section_mistakes', { count: s.reviewing })}</b>
                          </div>
                        ))}
                      </>
                    ) : !notStarted ? (
                      <p className="g-topic-pct g-good m-0">
                        <CheckCircle2 aria-hidden />
                        {t('analyse_topic_mastered')}
                      </p>
                    ) : null}

                    <span className="g-mono">{t('analyse_steps_title')}</span>
                    {steps.map((step, i) => (
                      <a key={i} href={step.href} className="g-steprow">
                        <span className="g-steprow-n">{i + 1}</span>
                        {step.icon}
                        <span className="g-steprow-lb">{step.label}</span>
                        <ChevronRight className="rtl-flip" aria-hidden />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
