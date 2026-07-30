'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Session } from '@supabase/supabase-js';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '../../components/AppShell';
import BackLink from '../../components/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import InlineQuiz from '../components/InlineQuiz';
import LearningQueue, { type QueueItem } from '../components/LearningQueue';
import type { KnmQuestion } from '@/data/questions';
import { buildLearningQueues } from '@/lib/learning-queues';
import { track } from '@/lib/analytics';
import { LEREN_CATEGORY_META, lerenLinkForSectionSlug } from '@/lib/leren-links';

type SectionRow = { id: number; slug: string; name_nl: string; sort_order: number; topic: string };
type Plan = 'free' | 'premium' | 'premium_plus';

const PRACTICE_CAP = 20;

export default function FoutenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('dashboard');
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<Plan>('free');
  const [session, setSession] = useState<Session | null>(null);
  const [questionsById, setQuestionsById] = useState<Record<number, KnmQuestion>>({});
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [mistakeIds, setMistakeIds] = useState<number[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [practice, setPractice] = useState<KnmQuestion[] | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    let userId = '';
    let sess: Session | null = null;
    try {
      const raw = sessionStorage.getItem('__pw_session__');
      if (raw) { sess = JSON.parse(raw) as Session; userId = sess?.user?.id ?? ''; }
    } catch {}
    if (!userId) {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) { window.location.href = `/${locale}/login`; return; }
      sess = s; userId = s.user.id;
    }
    setSession(sess);
    setEmail(sess?.user?.email ?? '');

    const meta = (sess?.user?.user_metadata ?? {}) as { tier?: string; plan?: string; premium?: boolean };
    const tier = meta.tier || meta.plan;
    setPlan(tier === 'premium_plus' ? 'premium_plus' : (tier === 'premium' || meta.premium) ? 'premium' : 'free');

    const [qRes, secRes, resRes] = await Promise.all([
      supabase.from('questions_flat').select('id, category, question, option_a, option_b, option_c, correct, explanation, image_url, audio_question, audio_a, audio_b, audio_c, exam, section_id').order('id'),
      supabase.from('sections').select('id, slug, name_nl, sort_order, topic').order('sort_order'),
      supabase.from('user_question_results').select('question_id, was_correct, answered_at').eq('user_id', userId).order('answered_at', { ascending: true }),
    ]);

    const rawQuestions = (qRes.data ?? []) as Record<string, unknown>[];
    const questions: KnmQuestion[] = rawQuestions.map(r => ({
      id: r.id as number, category: r.category as string, question: r.question as string,
      optionA: r.option_a as string, optionB: r.option_b as string, optionC: r.option_c as string,
      correct: r.correct as 'A' | 'B' | 'C', explanation: r.explanation as string,
      imageUrl: (r.image_url as string) ?? undefined,
      audioQuestion: (r.audio_question as string) ?? undefined,
      audioA: (r.audio_a as string) ?? undefined,
      audioB: (r.audio_b as string) ?? undefined,
      audioC: (r.audio_c as string) ?? undefined,
      exam: (r.exam as number) ?? null,
      section_id: (r.section_id as number) ?? null,
    }));
    const secRows = (secRes.data ?? []) as SectionRow[];
    const answers = (resRes.data ?? []) as { question_id: number; was_correct: boolean; answered_at: string }[];

    const byId: Record<number, KnmQuestion> = {};
    questions.forEach(q => { byId[q.id] = q; });
    setQuestionsById(byId);
    setSections(secRows);

    const queues = buildLearningQueues(
      questions.map(q => ({ id: q.id, category: q.category, section_id: q.section_id ?? null, exam: q.exam })),
      secRows,
      answers
    );
    const requestedTopic = new URLSearchParams(window.location.search).get('topic');
    setTopicFilter(requestedTopic);
    const scopedQueue = requestedTopic
      ? queues.mistakeQueue.filter(id => byId[id]?.category === requestedTopic)
      : queues.mistakeQueue;
    setMistakeIds(scopedQueue);

    // Priority-ordered study items — one per weak section (has mistakes), scoped by topic.
    const items: QueueItem[] = queues.sectionQueues
      .filter(s => s.mistakes > 0 && (!requestedTopic || s.topic === requestedTopic))
      .map(s => {
        const example = byId[s.wrongQuestionIds[0]]?.question ?? '';
        return {
          sectionId: s.sectionId,
          sectionName: s.name,
          topic: s.topic,
          icon: LEREN_CATEGORY_META[s.topic]?.icon ?? '📘',
          mistakes: s.mistakes,
          exampleQuestion: example.length > 120 ? example.slice(0, 120) + '…' : example,
          lerenLink: lerenLinkForSectionSlug(s.slug),
          wrongQuestionIds: s.wrongQuestionIds,
        };
      });
    setQueueItems(items);

    track('mistake_queue_opened', { total_mistakes: scopedQueue.length, topic: requestedTopic ?? null });
    setLoading(false);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner label={t('loading')} />;

  const startPractice = (ids: number[], scope: 'all' | 'section' = 'all') => {
    const subset = ids.map(id => questionsById[id]).filter(Boolean) as KnmQuestion[];
    if (subset.length) {
      track('mistake_queue_practice_started', { count: subset.length, scope, topic: topicFilter });
      setPractice(subset);
    }
  };

  const sectionsForQuiz = sections.map(s => ({ id: s.id, slug: s.slug, name_nl: s.name_nl, topic: s.topic }));

  if (practice) {
    return (
      <AppShell locale={locale} email={email} active="overview">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 80px' }}>
          <InlineQuiz
            questions={practice}
            examNum={null}
            topicLabel={t('review_mistakes_label')}
            timerSeconds={0}
            session={session}
            supabase={supabase}
            plan={plan}
            sections={sectionsForQuiz}
            onReturn={() => { setPractice(null); load(); }}
            onComplete={() => { setPractice(null); load(); }}
          />
        </div>
      </AppShell>
    );
  }

  const total = mistakeIds.length;

  return (
    <AppShell locale={locale} email={email} active="overview">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 80px' }}>
        <BackLink fallbackHref={`/${locale}/dashboard`} />
        <h1 className="font-headline" style={{ fontSize: 24, fontWeight: 800, color: '#002b6d', letterSpacing: '-0.02em' }}>{t('leerwachtrij_title')}</h1>
        {topicFilter && <p style={{ fontSize: 13, color: '#d94f00', fontWeight: 700, marginTop: 4 }}>{t('fouten_topic_note', { topic: topicFilter })}</p>}

        {total === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e6e9f0', borderRadius: 20, padding: '36px 24px', textAlign: 'center', marginTop: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5ee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <CheckCircle2 size={28} strokeWidth={2.2} color="#1a7a3c" />
            </div>
            <h2 className="font-headline" style={{ fontSize: 18, fontWeight: 800, color: '#191c1e', margin: '0 0 6px' }}>{t('fouten_empty_title')}</h2>
            <p style={{ fontSize: 14, color: '#5a6078', lineHeight: 1.55, maxWidth: 380, margin: '0 auto 18px' }}>{t('fouten_empty_desc')}</p>
            <a href={`/${locale}/dashboard`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#fe762c,#d94f00)', color: '#fff', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 16px rgba(217,79,0,0.3)' }}>
              {t('fouten_to_exams')}
            </a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#5a6078', marginTop: 2 }}>{t('leerwachtrij_subtitle', { count: total })}</p>

            <button
              onClick={() => startPractice(mistakeIds.slice(0, PRACTICE_CAP), 'all')}
              style={{ width: '100%', marginTop: 16, marginBottom: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, padding: '14px 18px', fontSize: 15, fontWeight: 700, border: 0, color: '#fff', background: 'linear-gradient(135deg,#fe762c,#d94f00)', boxShadow: '0 6px 16px rgba(217,79,0,0.3)', cursor: 'pointer' }}
            >
              <RotateCcw size={18} strokeWidth={2.2} />
              {t('fouten_practice_all', { count: Math.min(total, PRACTICE_CAP) })}
            </button>

            {queueItems.length > 0 && (
              <LearningQueue items={queueItems} plan={plan} locale={locale} onPractice={(ids) => startPractice(ids, 'section')} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
