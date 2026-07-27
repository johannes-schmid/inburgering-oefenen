'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@/lib/analytics';
import { getThema } from '@/data/leren';
import type { LerenThema, LerenSection } from '@/data/leren';
import type { KnmQuestion } from '@/data/questions';
import type { Session } from '@supabase/supabase-js';
import type { createClient } from '@/lib/supabase/client';
import { awardXp } from '@/lib/xp';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import TopicOverview from './TopicOverview';
import type { SectionMeta } from './TopicOverview';
import InlineQuiz from './InlineQuiz';
import SectionContent from '@/components/leren/SectionContent';

type InnerView = 'overview' | 'section' | 'practice';


interface Props {
  slug: string;
  locale: string;
  onBack: () => void;
  session?: Session | null;
  supabase?: ReturnType<typeof createClient>;
}

export default function LerenThemaView({ slug, locale, onBack, session, supabase }: Props) {
  const cleanSlug = slug.replace('.html', '');
  const thema = getThema(cleanSlug);

  const [view, setView] = useState<InnerView>('overview');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set());
  const [practiceQuestions, setPracticeQuestions] = useState<KnmQuestion[] | null>(null);
  const [showTopicOverview, setShowTopicOverview] = useState(false);
  const [topicSections, setTopicSections] = useState<SectionMeta[]>([]);
  const [topicResults, setTopicResults] = useState<Record<number, boolean>>({});
  const [topicAllQuestions, setTopicAllQuestions] = useState<KnmQuestion[]>([]);
  const [sections, setSections] = useState<LerenSection[]>(thema?.sections ?? []);

  useEffect(() => {
    if (!supabase || !thema) return;
    supabase
      .from('leren_content')
      .select('anchor, audio_url, audio_cues')
      .eq('theme_id', thema.id)
      .not('audio_url', 'is', null)
      .then(({ data }) => {
        if (!data?.length) return;
        const audioMap = new Map(data.map(r => [r.anchor, { audioUrl: r.audio_url, audioCues: r.audio_cues }]));
        setSections(thema.sections.map(s => {
          const a = audioMap.get(s.id);
          return a ? { ...s, ...a } : s;
        }));
      });
  }, [thema, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setView('overview');
    setSectionIdx(0);
    setVisitedSections(new Set());
    setPracticeQuestions(null);
    setShowTopicOverview(false);
  }, [slug]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
    if (!document.querySelector('link[href*="Material+Symbols"]')) {
      document.head.appendChild(link);
    }
  }, []);

  if (!thema) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <p style={{ color: '#434651' }}>Thema niet gevonden.</p>
      </div>
    );
  }

  async function openPracticeOverview() {
    if (!supabase || !thema) return;

    const [qRes, secRes, resultsRes] = await Promise.all([
      supabase
        .from('questions')
        .select('id, category, question, option_a, option_b, option_c, correct, explanation, image_url, exam, section_id')
        .eq('category', thema.quizCategory),
      supabase
        .from('sections')
        .select('id, slug, name_nl, sort_order, topic')
        .eq('topic', thema.quizCategory)
        .order('sort_order'),
      session
        ? supabase
            .from('user_question_results')
            .select('question_id, was_correct, answered_at')
            .eq('user_id', session.user.id)
            .order('answered_at', { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);

    const questions: KnmQuestion[] = (qRes.data ?? []).map(r => ({
      id: r.id, category: r.category, question: r.question,
      optionA: r.option_a, optionB: r.option_b, optionC: r.option_c,
      correct: r.correct as 'A' | 'B' | 'C', explanation: r.explanation,
      imageUrl: r.image_url ?? undefined, exam: r.exam ?? null,
      section_id: r.section_id ?? null,
    }));

    const correct: Record<number, boolean> = {};
    ((resultsRes as { data: Array<{ question_id: number; was_correct: boolean }> | null }).data ?? []).forEach(r => {
      correct[r.question_id] = r.was_correct;
    });

    setTopicAllQuestions(questions);
    setTopicSections((secRes.data ?? []) as SectionMeta[]);
    setTopicResults(correct);

    // Start immediately with backlog (Nieuw + Herhalen); fall back to all if everything mastered
    const backlog = questions.filter(q => !(q.id in correct) || correct[q.id] === false);
    const subset = (backlog.length > 0 ? backlog : questions).sort(() => Math.random() - 0.5);
    setPracticeQuestions(subset);
    setShowTopicOverview(false);

    // Mark thema completed when the user reaches the practice step
    if (session && supabase && thema) {
      setVisitedSections(new Set(thema.sections.map((_, i) => i)));
      supabase.from('user_leren_progress').upsert({
        user_id: session.user.id, thema_id: thema.id, max_section: thema.sections.length, completed: true, completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,thema_id' }).then(() => {});
      awardXp(supabase, session.user.id, 'leren_complete', thema.id);
    }

    setView('practice');
    window.scrollTo(0, 0);
    sendGAEvent('event', 'leren_quiz_started', { thema: thema.id });
  }

  async function refreshTopicResults() {
    if (!supabase || !session) return;
    const { data } = await supabase
      .from('user_question_results')
      .select('question_id, was_correct, answered_at')
      .eq('user_id', session.user.id)
      .order('answered_at', { ascending: true });
    const correct: Record<number, boolean> = {};
    (data ?? []).forEach(r => { correct[r.question_id] = r.was_correct; });
    setTopicResults(correct);
  }

  function goToSection(idx: number) {
    document.querySelectorAll<HTMLAudioElement>('audio').forEach(a => { a.pause(); });
    setSectionIdx(idx);
    setVisitedSections(prev => new Set(prev).add(idx));
    setView('section');
    window.scrollTo(0, 0);
    sendGAEvent('event', 'leren_section_opened', { thema: thema?.id, section_index: idx, section_title: sections[idx]?.title ?? '' });
    recordSectionProgress(idx);
  }

  function recordSectionProgress(idx: number) {
    if (session && supabase && thema) {
      const allRead = idx + 1 >= thema.sections.length;
      const payload: Record<string, unknown> = {
        user_id: session.user.id, thema_id: thema.id, max_section: idx + 1,
      };
      if (allRead) {
        payload.completed = true; payload.completed_at = new Date().toISOString();
        track('leren_thema_completed', { thema_id: thema.id });
      }
      supabase.from('user_leren_progress').upsert(payload, { onConflict: 'user_id,thema_id' }).then(() => {});
    }
  }

  const handleSectionRead = useCallback((idx: number) => {
    setVisitedSections(prev => new Set(prev).add(idx));
    recordSectionProgress(idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, supabase, thema]);

  function goToOverview() {
    setView('overview');
    window.scrollTo(0, 0);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; vertical-align: middle; font-family: 'Material Symbols Outlined'; }
        .leren-section-content img { max-width: 100%; border-radius: 12px; }
        #leren-section-nav { position: fixed; left: 240px; right: 0; bottom: 0; z-index: 40; background: #f8f9fb; border-top: 1px solid #e6e8ea; padding: 12px 24px; }
        #leren-section-nav .lsn-inner { max-width: 860px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        @media (max-width: 768px) {
          #leren-section-nav { left: 0; right: 0; bottom: 64px; padding: 8px 12px; }
          .lsn-btn { padding: 8px 12px !important; font-size: 12px !important; }
        }
      `}</style>

      {/* Back to thema list */}
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 24 }}
        onMouseOver={e => { e.currentTarget.style.background = '#eceef0'; e.currentTarget.style.color = '#002b6d'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#434651'; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Alle thema&apos;s
      </button>

      {view === 'overview' && <OverviewView thema={thema} sections={sections} onGoToSection={goToSection} onStartPractice={openPracticeOverview} visitedSections={visitedSections} />}
      {view === 'section' && (
        <SectionView
          thema={thema}
          sections={sections}
          sectionIdx={sectionIdx}
          onBack={goToOverview}
          onGoToSection={goToSection}
          onStartPractice={openPracticeOverview}
          onSectionRead={handleSectionRead}
        />
      )}
      {view === 'practice' && showTopicOverview && thema && (
        <TopicOverview
          category={thema.quizCategory}
          questions={topicAllQuestions}
          sections={topicSections}
          results={topicResults}
          onPractice={subset => { setPracticeQuestions(subset); setShowTopicOverview(false); }}
          onBack={() => setShowTopicOverview(false)}
        />
      )}
      {view === 'practice' && !showTopicOverview && practiceQuestions && session && supabase && thema && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => setShowTopicOverview(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#6e7282', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 7, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.color = '#002b6d')}
              onMouseOut={e => (e.currentTarget.style.color = '#6e7282')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Alle vragen bekijken
            </button>
          </div>
          <InlineQuiz
            questions={practiceQuestions}
            examNum={null}
            topicLabel={thema.quizCategory}
            timerSeconds={0}
            session={session}
            supabase={supabase}
            onReturn={async () => { await refreshTopicResults(); setShowTopicOverview(true); setPracticeQuestions(null); }}
            onComplete={() => { refreshTopicResults(); setShowTopicOverview(true); setPracticeQuestions(null); }}
          />
        </>
      )}
    </div>
  );
}

function OverviewView({ thema, sections, onGoToSection, onStartPractice, visitedSections }: {
  thema: LerenThema;
  sections: LerenSection[];
  onGoToSection: (idx: number) => void;
  onStartPractice: () => void;
  visitedSections: Set<number>;
}) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#002b6d,#1d428a)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.06em', marginBottom: 14 }}>
          THEMA {thema.id} VAN 7
        </span>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#002b6d', lineHeight: 1.2, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          {thema.title}
        </h1>
        <p style={{ fontSize: 15, color: '#434651', lineHeight: 1.7, maxWidth: 580, margin: '0 0 20px' }}>
          {thema.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6e7282', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#9fa3b0' }}>menu_book</span>
            {sections.length} onderwerpen
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d0d3de', display: 'inline-block' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6e7282', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#9fa3b0' }}>quiz</span>
            Vragen oefenen aan het einde
          </span>
        </div>
        <button
          onClick={() => onGoToSection(0)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#002b6d', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, padding: '13px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 3px 14px rgba(0,43,109,0.28)', transition: 'transform 0.15s,box-shadow 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,43,109,0.36)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,43,109,0.28)'; }}
        >
          Begin met lezen
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#9fa3b0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Of spring direct naar een onderwerp</p>
        {sections.map((section, idx) => (
          <SectionCard key={section.id} section={section} done={visitedSections.has(idx)} onClick={() => onGoToSection(idx)} />
        ))}
        <button
          onClick={onStartPractice}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', background: 'linear-gradient(135deg,#fff8f4,#fff)', border: '1.5px solid #f4d5c0', borderRadius: 14, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s,box-shadow 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#e8a882'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(162,64,0,0.08)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#f4d5c0'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ width: 36, height: 36, borderRadius: 10, background: '#fff0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#a24000' }}>quiz</span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#a24000', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>Vragen oefenen</div>
            <div style={{ fontSize: 13, color: '#6e7282' }}>Bekijk alle vragen van dit thema en oefen gericht</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fa3b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

function SectionCard({ section, done, onClick }: { section: LerenSection; done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: done ? '#f6faf6' : '#fff', border: `1px solid ${done ? '#b8ddb8' : '#e6e8ea'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s,box-shadow 0.15s' }}
      onMouseOver={e => { e.currentTarget.style.borderColor = done ? '#8cc88c' : '#c4d4f0'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,43,109,0.08)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = done ? '#b8ddb8' : '#e6e8ea'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ width: 36, height: 36, borderRadius: 10, background: done ? '#e6f4e6' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {done
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d8a2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          : <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#002b6d' }}>{section.icon}</span>
        }
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: done ? '#2d8a2d' : '#002b6d', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>{section.title}</div>
        <div style={{ fontSize: 13, color: '#6e7282' }}>{section.subtitle}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fa3b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
  );
}

function SectionView({ thema, sections, sectionIdx, onBack, onGoToSection, onStartPractice, onSectionRead }: {
  thema: LerenThema;
  sections: LerenSection[];
  sectionIdx: number;
  onBack: () => void;
  onGoToSection: (idx: number) => void;
  onStartPractice: () => void;
  onSectionRead: (idx: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(sectionIdx);
  const total = sections.length;

  useEffect(() => {
    if (api) api.scrollTo(sectionIdx);
  }, [api, sectionIdx]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      document.querySelectorAll<HTMLAudioElement>('audio').forEach(a => { a.pause(); });
      const idx = api.selectedScrollSnap();
      setCurrent(idx);
      onSectionRead(idx);
    };
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, onSectionRead]);

  // Dynamic carousel height: resize viewport to the active slide's natural height
  useEffect(() => {
    if (!api) return;
    const root = api.rootNode() as HTMLElement;
    root.style.transition = 'height 0.3s ease';

    const setHeight = () => {
      const slides = api.slideNodes();
      const el = slides[api.selectedScrollSnap()] as HTMLElement | undefined;
      if (el) root.style.height = el.offsetHeight + 'px';
    };

    setHeight();
    api.on('select', setHeight);
    api.on('reInit', setHeight);

    const ro = new ResizeObserver(setHeight);
    api.slideNodes().forEach((el) => ro.observe(el));

    return () => {
      api.off('select', setHeight);
      api.off('reInit', setHeight);
      ro.disconnect();
    };
  }, [api]);

  const section = sections[current];

  function prev() {
    if (current > 0) api?.scrollTo(current - 1);
    else onBack();
  }

  function next() {
    if (current < total - 1) api?.scrollTo(current + 1);
    else onStartPractice();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#fff', border: '1px solid #e6e8ea', borderRadius: 12 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}
          onMouseOver={e => { e.currentTarget.style.background = '#eceef0'; e.currentTarget.style.color = '#002b6d'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#434651'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Overzicht
        </button>
        <span style={{ color: '#d0d3de' }}>|</span>
        <span style={{ background: 'linear-gradient(135deg,#002b6d,#1d428a)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.04em', flexShrink: 0 }}>
          THEMA {thema.id}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#002b6d', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {section.title}
        </span>
      </div>

      <div style={{ paddingBottom: 96 }}>
        <Carousel setApi={setApi} opts={{ align: 'start', loop: false }} className="w-full">
          <CarouselContent className="items-start">
            {sections.map((sec) => (
              <CarouselItem key={sec.id}>
                <SectionContent section={sec} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div id="leren-section-nav">
        <div className="lsn-inner">
          <button
            className="lsn-btn"
            onClick={prev}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0 }}
            onMouseOver={e => (e.currentTarget.style.background = '#eceef0')}
            onMouseOut={e => (e.currentTarget.style.background = '#f2f4f6')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {current > 0 ? 'Vorige' : 'Overzicht'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  style={{ width: i === current ? 8 : 6, height: i === current ? 8 : 6, borderRadius: '50%', background: i <= current ? '#002b6d' : '#c4c6d2', transition: 'all 0.2s', flexShrink: 0, border: 'none', padding: 0, cursor: 'pointer' }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#434651', fontWeight: 500 }}>Sectie {current + 1} van {total}</span>
          </div>

          <button
            className="lsn-btn"
            onClick={next}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#fff', background: '#002b6d', border: 'none', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', transition: 'transform 0.15s,box-shadow 0.15s', boxShadow: '0 2px 8px rgba(0,43,109,0.25)', flexShrink: 0 }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,43,109,0.35)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,43,109,0.25)'; }}
          >
            {current < total - 1 ? 'Volgende' : 'Vragen oefenen'}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

