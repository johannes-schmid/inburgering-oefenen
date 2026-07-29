'use client';

import { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, RotateCcw, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '../../components/AppShell';
import BackLink from '../../components/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
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

  if (loading) return <LoadingSpinner label={t('loading')} />;

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
    <AppShell locale={locale} email={email} activeView="exams">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>
        <BackLink fallbackHref={`/${locale}/dashboard`} />
        <div style={{ marginBottom: 18 }}>
          <h1 className="font-headline" style={{ fontSize: 24, fontWeight: 800, color: '#002b6d', letterSpacing: '-0.02em' }}>{t('analyse_title')}</h1>
          <p style={{ fontSize: 14, color: '#5a6078', marginTop: 2 }}>{t('analyse_subtitle')}</p>
        </div>

        {/* Score + progress */}
        <div style={{ background: '#fff', border: '1px solid #e6e9f0', borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: '#191c1e', lineHeight: 1 }}>{scores.length > 0 ? `${slaagkans}%` : '—'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5a6078' }}>
              {t('slaagkans_label')}{scores.length > 0 && <span style={{ color: '#d94f00' }}> · {bandLabel}</span>}
            </span>
          </div>
          <div style={{ position: 'relative', height: 10, borderRadius: 6, background: scores.length > 0 ? 'linear-gradient(90deg,#d94f00 0%,#fe762c 45%,#1d428a 100%)' : '#edeef3', marginTop: 12 }}>
            {scores.length > 0 && (
              <div style={{ position: 'absolute', top: '50%', left: `${slaagkans}%`, transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '3px solid #002b6d', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
            )}
          </div>

          <hr style={{ border: 0, borderTop: '1px solid #edeef3', margin: '18px 0 14px' }} />

          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#002b6d', fontFamily: 'var(--font-manrope), Manrope, sans-serif' }}>{t('progress_title')}</span>
            <span style={{ fontSize: 12, color: '#8a8fa0', marginLeft: 8 }}>· {t('progress_sub')}</span>
          </div>
          <ProgressionChart points={progression} locale={locale} />
        </div>

        {/* General mistakes queue */}
        {totalMistakes > 0 && (
          <a
            href={`/${locale}/dashboard/fouten`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 16, borderRadius: 14, padding: '14px 18px', fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg,#fe762c,#d94f00)', boxShadow: '0 6px 16px rgba(217,79,0,0.3)' }}
          >
            <RotateCcw size={18} strokeWidth={2.2} />
            {t('analyse_fix_all', { count: totalMistakes })}
          </a>
        )}

        {/* Topics with per-topic step queue */}
        <div style={{ fontWeight: 800, fontSize: 14, color: '#002b6d', margin: '24px 0 10px' }}>
          {t('topics_title')} <span style={{ fontWeight: 500, color: '#8a8fa0', fontSize: 12 }}>· {t('topics_weakest_first')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topics.map(topic => {
            const isOpen = openTopic === topic.title;
            const notStarted = topic.attempted === 0;
            const secs = sectionProgress[topic.title] ?? [];
            const wrongSecs = secs.filter(s => s.reviewing > 0);
            const slug = slugForTopic(topic.title);
            // Deep-link to the specific lesson section with the most mistakes; fall back to the thema.
            const worstSec = [...wrongSecs].sort((a, b) => b.reviewing - a.reviewing)[0];
            const secLink = worstSec ? lerenLinkForSectionSlug(sectionSlugById[worstSec.id]) : null;
            const learnHref = secLink
              ? buildLerenHref(locale, secLink)
              : slug ? `/${locale}/leren/${slug}` : `/${locale}/dashboard?view=leren`;

            const steps: { icon: React.ReactNode; label: string; href: string }[] = [
              { icon: <BookOpen size={15} strokeWidth={2.2} />, label: t('analyse_step_learn'), href: learnHref },
            ];
            if (topic.mistakes > 0) {
              steps.push({ icon: <RotateCcw size={15} strokeWidth={2.2} />, label: t('analyse_step_repeat', { count: topic.mistakes }), href: `/${locale}/dashboard/fouten?topic=${encodeURIComponent(topic.title)}` });
            } else if (notStarted) {
              steps.push({ icon: <Target size={15} strokeWidth={2.2} />, label: t('btn_practice_topic'), href: `/${locale}/dashboard?view=exams&openTopic=${encodeURIComponent(topic.title)}` });
            }

            return (
              <div
                key={topic.title}
                style={{ background: '#fff', border: isOpen ? '1px solid #f0c9ab' : '1px solid #e6e9f0', borderRadius: 16, padding: 15, boxShadow: isOpen ? '0 2px 10px rgba(254,118,44,0.08)' : undefined }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpenTopic(isOpen ? null : topic.title)}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#191c1e' }}>{topic.title}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: notStarted ? '#8a8fa0' : topic.pct >= 70 ? '#1a7a3c' : '#d94f00', fontWeight: 800, fontSize: 13 }}>
                    {notStarted ? t('topics_not_started') : `${topic.pct}%`}
                    {isOpen ? <ChevronDown size={16} strokeWidth={2.4} /> : <ChevronRight size={16} strokeWidth={2.4} />}
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: '#edeef3', marginTop: 9 }}>
                  <div style={{ width: `${notStarted ? 4 : topic.pct}%`, height: '100%', borderRadius: 4, background: notStarted ? '#c4c6d2' : topic.pct >= 70 ? '#1d428a' : '#fe762c' }} />
                </div>

                {isOpen && (
                  <div style={{ marginTop: 16 }}>
                    {/* What went wrong */}
                    {topic.mistakes > 0 ? (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8fa0', marginBottom: 8 }}>{t('analyse_whatswrong')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#434651' }}>
                          {wrongSecs.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                              <span>{s.name}</span>
                              <span style={{ color: '#d94f00', fontWeight: 700, flexShrink: 0 }}>{t('section_mistakes', { count: s.reviewing })}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : !notStarted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1a7a3c', fontWeight: 600 }}>
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                        {t('analyse_topic_mastered')}
                      </div>
                    ) : null}

                    {/* Step queue */}
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8fa0', margin: '16px 0 8px' }}>{t('analyse_steps_title')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {steps.map((step, i) => (
                        <a
                          key={i}
                          href={step.href}
                          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 12, border: '1px solid #e6e9f0', background: '#f8f9fb', textDecoration: 'none' }}
                        >
                          <span style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: '#002b6d', color: '#fff', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                          <span style={{ flex: 'none', color: '#d94f00', display: 'inline-flex' }}>{step.icon}</span>
                          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: '#26324a' }}>{step.label}</span>
                          <ChevronRight size={16} strokeWidth={2.2} color="#8a8fa0" />
                        </a>
                      ))}
                    </div>
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
