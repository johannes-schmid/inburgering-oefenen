'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { awardXp } from '@/lib/xp';
import { track } from '@/lib/analytics';
import { KNM_WOORDKAARTEN, type WoordkaartTheme, type Woordkaart } from '@/data/woordkaarten';

type Plan = 'free' | 'premium' | 'premium_plus';
type WkStatus = 'unseen' | 'seen' | 'known' | 'learning';
type WkProgress = Record<number, WkStatus>;
type WkSubView = 'overview' | 'list' | 'deck' | 'review';

type Props = {
  userId?: string;
  plan: Plan;
  supabase: ReturnType<typeof createClient>;
  onGoToProfile?: () => void;
};

export default function WoordkaartenView({ userId, plan, supabase, onGoToProfile }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [wkProgress, setWkProgress] = useState<WkProgress>({});
  const [currentTheme, setCurrentTheme] = useState<WoordkaartTheme | null>(null);
  const [currentWords, setCurrentWords] = useState<Woordkaart[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar' | 'tr'>('en');
  const [subView, setSubView] = useState<WkSubView>('overview');
  const [reviewMsg, setReviewMsg] = useState('');
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(260);

  useEffect(() => {
    const front = frontRef.current?.scrollHeight ?? 0;
    const back = backRef.current?.scrollHeight ?? 0;
    setCardHeight(Math.max(front, back, 260));
  }, [cardIdx, lang]);

  const isPremium = plan !== 'free';
  const isGuest = !userId;
  const cacheKey = userId ? `io_wk_progress_${userId}` : 'io_wk_progress_guest';

  useEffect(() => {
    if (!document.querySelector('link[href*="Material+Symbols"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('io_wk_lang');
    if (saved && ['en', 'ar', 'tr'].includes(saved)) setLang(saved as 'en' | 'ar' | 'tr');
    else {
      const bl = (navigator.language || 'en').split('-')[0].toLowerCase();
      setLang(['ar', 'tr'].includes(bl) ? (bl as 'ar' | 'tr') : 'en');
    }
    loadProgress();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProgress() {
    if (isGuest) {
      try {
        const saved = localStorage.getItem(cacheKey);
        if (saved) setWkProgress(JSON.parse(saved));
      } catch {}
      return;
    }
    try {
      const { data, error } = await supabase.from('user_word_card_progress').select('word_card_id,status').eq('user_id', userId!);
      if (!error && data) {
        const p: WkProgress = {};
        data.forEach(r => { p[r.word_card_id] = r.status as WkStatus; });
        setWkProgress(p);
        try { localStorage.setItem(cacheKey, JSON.stringify(p)); } catch {}
        return;
      }
    } catch {}
    try { setWkProgress(JSON.parse(localStorage.getItem(cacheKey) || '{}')); } catch { setWkProgress({}); }
  }

  function saveCardProgress(cardId: number, status: WkStatus) {
    setWkProgress(prev => {
      const next = { ...prev, [cardId]: status };
      try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
      if (!isGuest) {
        supabase.from('user_word_card_progress').upsert({
          user_id: userId, word_card_id: cardId, status,
          seen_count: 1, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,word_card_id' }).then(() => {});
        if (status === 'known') awardXp(supabase, userId, 'wordcard_known', cardId);
      }
      return next;
    });
  }

  function openTheme(theme: WoordkaartTheme) {
    setCurrentTheme(theme);
    setCurrentWords(theme.words);
    setCardIdx(0);
    setFlipped(false);
    setSubView('list');
  }

  function startPracticeFor(theme: WoordkaartTheme) {
    const wordsToReview = theme.words.filter(w => {
      const s = wkProgress[w.id] || 'unseen';
      return s === 'unseen' || s === 'learning';
    });
    const practiceWords = wordsToReview.length > 0 ? wordsToReview : theme.words;
    track('woordkaarten_practice_started', { theme: theme.name, theme_id: theme.id, card_count: practiceWords.length });
    setCurrentTheme(theme);
    setCurrentWords(practiceWords);
    setCardIdx(0);
    setFlipped(false);
    setSubView('deck');
  }

  function startPractice() {
    if (!currentTheme) return;
    startPracticeFor(currentTheme);
  }

  function closeList() { setCurrentTheme(null); setSubView('overview'); }
  function closeDeck() { setSubView('overview'); }
  function viewAllCards() {
    if (!currentTheme) return;
    setCurrentWords(currentTheme.words);
    setSubView('list');
  }
  function flip() { setFlipped(f => !f); }

  function mark(status: 'known' | 'learning') {
    if (!currentWords[cardIdx]) return;
    saveCardProgress(currentWords[cardIdx].id, status);
    setTimeout(() => goNext(), 350);
  }

  function goNext() {
    if (!currentWords.length) return;
    if (cardIdx < currentWords.length - 1) { setCardIdx(i => i + 1); setFlipped(false); }
    else {
      const learningWords = currentWords.filter(w => wkProgress[w.id] === 'learning');
      if (learningWords.length > 0) {
        const known = currentWords.filter(w => wkProgress[w.id] === 'known').length;
        setReviewMsg(t('wk_review_msg', { known, total: currentWords.length, remaining: learningWords.length, plural: learningWords.length === 1 ? '' : 'en' }));
        setSubView('review');
      } else {
        closeDeck();
      }
    }
  }

  function goPrev() { if (cardIdx > 0) { setCardIdx(i => i - 1); setFlipped(false); } }

  function repeatLearning() {
    const learningWords = currentWords.filter(w => wkProgress[w.id] === 'learning');
    if (!learningWords.length) { closeDeck(); return; }
    setCurrentWords(learningWords);
    setCardIdx(0);
    setFlipped(false);
    setSubView('deck');
  }

  const THEME_ICON: Record<number, string> = {
    1: 'map',
    2: 'home',
    3: 'health_and_safety',
    4: 'school',
    5: 'work',
    6: 'account_balance',
    7: 'gavel',
  };

  const THEME_DESC: Record<number, string> = {
    1: 'Provincies, steden, OV, geschiedenis en geografie van Nederland.',
    2: 'Huurmarkt, koopwoning, buren, huurtoeslag en wonen in de wijk.',
    3: 'Huisarts, zorgverzekering, ziekenhuis en geestelijke gezondheidszorg.',
    4: 'Schoolsysteem, leerplicht, kinderopvang, MBO/HBO en inburgering.',
    5: 'Arbeidsmarkt, arbeidscontract, belastingen en sociale zekerheid.',
    6: 'Overheidsinstanties, gemeentelijke diensten en hulporganisaties.',
    7: 'De Grondwet, democratie, politieke partijen en burgerrechten.',
  };

  const allWords = KNM_WOORDKAARTEN.themes.flatMap(t => t.words);
  const totalWords = allWords.length;
  const totalKnown = allWords.filter(w => wkProgress[w.id] === 'known').length;
  const overallPct = totalWords ? Math.round((totalKnown / totalWords) * 100) : 0;

  const currentCard = currentWords[cardIdx];
  const trans = currentCard ? (currentCard.translations[lang] || currentCard.translations.en) : null;
  const isRtl = lang === 'ar';
  const cardStatus = currentCard ? (wkProgress[currentCard.id] || 'unseen') : 'unseen';
  const statusLabels: Record<WkStatus, string> = { unseen: t('wk_status_unseen'), seen: t('wk_status_seen'), known: t('wk_status_known'), learning: t('wk_status_learning') };
  const statusColors: Record<WkStatus, string> = { unseen: '#9aa0ab', seen: '#434651', known: '#1a7a3c', learning: '#a24000' };
  const statusBgs: Record<WkStatus, string> = { unseen: '#e6e8ea', seen: '#f2f4f6', known: '#EEF7EE', learning: '#FFF4EE' };
  const deckPct = currentWords.length ? ((cardIdx + 1) / currentWords.length * 100) : 0;

  useEffect(() => {
    if (subView === 'deck' && currentCard && (wkProgress[currentCard.id] || 'unseen') === 'unseen') {
      saveCardProgress(currentCard.id, 'seen');
    }
  }, [cardIdx, subView]); // eslint-disable-line react-hooks/exhaustive-deps

  if (subView === 'review') {
    return (
      <div className="max-w-md mx-auto text-center py-8 px-4">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="font-headline text-xl font-extrabold text-on-surface mb-2">{t('wk_deck_complete')}</h2>
        <p className="text-sm text-on-surface-variant mb-6">{reviewMsg}</p>
        <div className="flex flex-col gap-3">
          <button id="wk-review-repeat-btn" onClick={repeatLearning} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#002b6d,#1d428a)', border: 'none', cursor: 'pointer' }}>{t('btn_repeat_unknown')}</button>
          <button onClick={() => currentTheme ? (setCurrentWords(currentTheme.words), setSubView('list')) : setSubView('overview')} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: '#fff', border: '1.5px solid #e6e8ea', color: '#434651', cursor: 'pointer' }}>{t('btn_done')}</button>
        </div>
      </div>
    );
  }

  if (subView === 'deck' && currentCard && trans) {
    const highlightedExample = currentCard.dutch_example
      ? currentCard.dutch_example.replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] || c))
          .replace(new RegExp('\\b' + currentCard.dutch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '<mark>$&</mark>')
      : null;

    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <button onClick={closeDeck} className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('btn_back_to_themes')}
          </button>
          <span className="text-sm font-semibold text-on-surface-variant">{t('wk_card_position', { current: cardIdx + 1, total: currentWords.length })}</span>
        </div>

        <div className="mb-5 rounded-full overflow-hidden" style={{ background: '#e6e8ea', height: '4px' }}>
          <div style={{ width: `${deckPct}%`, height: '100%', background: '#002b6d', borderRadius: '9999px', transition: 'width .3s ease' }} />
        </div>

        {/* Hidden sizer: renders back-face content in flow to size the card container */}
        <div ref={backRef} aria-hidden="true" style={{ visibility: 'hidden', pointerEvents: 'none', position: 'absolute', maxWidth: '480px', width: 'calc(100% - 48px)', padding: '28px 28px 36px' }}>
          <p style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: '#002b6d', marginBottom: '6px' }}>{trans?.word || '—'}</p>
          {trans?.description && <div style={{ fontSize: '14px', color: '#434651', lineHeight: 1.55, marginBottom: '10px' }}>{trans.description}</div>}
          {currentCard.dutch_description && (
            <div style={{ borderTop: '1px solid #e6e8ea', paddingTop: '10px', marginTop: '2px' }}>
              <p style={{ fontSize: '10px', marginBottom: '2px' }}>{t('wk_dutch_label')}</p>
              <p style={{ fontSize: '13px', lineHeight: 1.55 }}>{currentCard.dutch_description}</p>
            </div>
          )}
          {highlightedExample && <div style={{ fontSize: '13px', lineHeight: 1.6, paddingTop: '10px', marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: highlightedExample }} />}
          <p style={{ fontSize: '12px', marginTop: '10px' }}>{t('wk_flip_back_hint')}</p>
        </div>

        <div id="wk-card-container" className="mb-5 cursor-pointer" style={{ perspective: '1000px', maxWidth: '480px', margin: '0 auto 20px' }} onClick={flip}>
          <div id="wk-card-inner" className={`wk-card-inner${flipped ? ' flipped' : ''}`} style={{ position: 'relative', width: '100%', transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)', borderRadius: '18px', height: `${cardHeight}px` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: '18px', border: '1.5px solid #e6e8ea', background: '#fff', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,43,109,0.07)' }}>
              {currentCard.article && <span style={{ fontSize: '13px', fontWeight: 700, color: '#002b6d', background: '#EEF2FF', padding: '3px 10px', borderRadius: '9999px', display: 'inline-block', alignSelf: 'flex-start', marginBottom: '10px' }}>{currentCard.article}</span>}
              <p style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: '#191c1e', lineHeight: 1.2, fontFamily: 'Manrope,sans-serif' }}>{currentCard.dutch}</p>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e8edf7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px auto 0', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#002b6d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
              </div>
              <p style={{ fontSize: '12px', color: '#9aa0ab', marginTop: '8px', textAlign: 'center' }}>{t('wk_flip_hint')}</p>
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '18px', border: '1.5px solid #e6e8ea', background: '#fff', padding: '28px 28px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', boxShadow: '0 4px 24px rgba(0,43,109,0.07)', overflowY: 'auto' }}>
              <p style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: '#002b6d', marginBottom: '6px' }} dir={isRtl ? 'rtl' : 'ltr'}>{trans.word || '—'}</p>
              {trans.description && <div style={{ fontSize: '14px', color: '#434651', lineHeight: 1.55, marginBottom: '10px' }} dir={isRtl ? 'rtl' : 'ltr'}>{trans.description}</div>}
              {currentCard.dutch_description && (
                <div style={{ borderTop: '1px solid #e6e8ea', paddingTop: '10px', marginTop: '2px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#b0b8c4', marginBottom: '2px' }}>{t('wk_dutch_label')}</p>
                  <p style={{ fontSize: '13px', color: '#7a8290', lineHeight: 1.55 }}>{currentCard.dutch_description}</p>
                </div>
              )}
              {highlightedExample && <div style={{ fontSize: '13px', color: '#434651', lineHeight: 1.6, borderTop: '1px solid #e6e8ea', paddingTop: '10px', marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: highlightedExample }} />}
              <p style={{ fontSize: '12px', color: '#9aa0ab', position: 'absolute', bottom: '14px', right: '20px' }}>{t('wk_flip_back_hint')}</p>
            </div>
          </div>
        </div>

        <div id="wk-action-btns" className="flex gap-3 mt-8 mb-6 max-w-md mx-auto" style={{ display: 'flex' }}>
          <button onClick={() => mark('learning')} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: '#fff', border: '1.5px solid #e6e8ea', color: '#434651', cursor: 'pointer' }}>{t('btn_wk_learning')}</button>
          <button onClick={() => mark('known')} className="wk-btn-known flex-1 py-3 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#1a7a3c,#166534)', boxShadow: '0 4px 12px rgba(26,122,60,0.25)', border: 'none', cursor: 'pointer' }}>{t('btn_wk_known')}</button>
        </div>

        <div className="flex justify-center mt-2 mb-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: statusBgs[cardStatus], color: statusColors[cardStatus] }}>{statusLabels[cardStatus]}</span>
        </div>

        <div className="flex justify-center mt-4 mb-3">
          <button
            onClick={viewAllCards}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl"
            style={{ background: '#fff', border: '1.5px solid #e6e8ea', color: '#434651', cursor: 'pointer' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#c4d4f0'; e.currentTarget.style.color = '#002b6d'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#e6e8ea'; e.currentTarget.style.color = '#434651'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            {t('btn_view_all_cards')}
          </button>
        </div>

        {onGoToProfile && (
          <div className="flex justify-center mt-1">
            <button
              onClick={onGoToProfile}
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ background: 'none', border: 'none', color: '#9aa0ab', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.color = '#002b6d')}
              onMouseOut={e => (e.currentTarget.style.color = '#9aa0ab')}
            >
              {lang === 'en' ? '🇬🇧' : lang === 'ar' ? '🇸🇦' : '🇹🇷'} {t('btn_change_wk_language')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Theme word list
  if (subView === 'list' && currentTheme) {
    const themeKnown = currentTheme.words.filter(w => wkProgress[w.id] === 'known').length;
    const toReview = currentTheme.words.filter(w => {
      const s = wkProgress[w.id] || 'unseen';
      return s === 'unseen' || s === 'learning';
    }).length;

    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <button onClick={closeList} className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Alle thema&apos;s
          </button>
          <span className="text-sm text-on-surface-variant font-semibold">{themeKnown}/{currentTheme.words.length} gekend</span>
        </div>

        <div className="mb-6">
          <h2 className="font-headline text-xl font-extrabold text-primary mb-1">{currentTheme.name}</h2>
          <p className="text-sm text-on-surface-variant mb-4">{THEME_DESC[currentTheme.id] ?? ''}</p>

          <div style={{ height: 6, background: '#e6e8ea', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${currentTheme.words.length ? Math.round(themeKnown / currentTheme.words.length * 100) : 0}%`, background: themeKnown === currentTheme.words.length ? '#16a34a' : '#002b6d', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>

          <button
            id="wk-start-practice"
            onClick={startPractice}
            className="w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#002b6d,#1d428a)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,43,109,0.2)' }}
          >
            {toReview > 0 ? `Oefenen — ${toReview} kaart${toReview === 1 ? '' : 'en'} te leren` : 'Alles herhalen'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentTheme.words.map(word => {
            const status: WkStatus = wkProgress[word.id] || 'unseen';
            const isKnown = status === 'known';

            return (
              <div
                key={word.id}
                style={{
                  background: '#fff',
                  border: `1.5px solid ${isKnown ? '#bbf7d0' : '#e6e8ea'}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'border-color .15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    {word.article && <span style={{ fontSize: 11, fontWeight: 700, color: '#002b6d', background: '#EEF2FF', padding: '1px 7px', borderRadius: 9999 }}>{word.article}</span>}
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#191c1e', fontFamily: 'Manrope,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{word.dutch}</span>
                  </div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: statusColors[status],
                    background: statusBgs[status],
                    padding: '2px 8px',
                    borderRadius: 9999,
                  }}>{statusLabels[status]}</span>
                </div>

                <button
                  onClick={() => saveCardProgress(word.id, isKnown ? 'unseen' : 'known')}
                  title={isKnown ? 'Markeer als te leren' : 'Markeer als gekend'}
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: `1.5px solid ${isKnown ? '#16a34a' : '#e6e8ea'}`,
                    background: isKnown ? '#f0fdf4' : '#fff',
                    color: isKnown ? '#16a34a' : '#9aa0ab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Overview
  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-headline text-2xl font-extrabold text-primary mb-1">{t('wk_title')}</h1>
        <p className="text-on-surface-variant text-sm">{t('wk_desc')}</p>
      </section>

      {/* Overall progress */}
      <div style={{ background: '#fff', border: '1px solid #e6e8ea', borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 1px 4px rgba(0,43,109,0.05)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#002b6d' }}>style</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#191c1e', fontFamily: 'Manrope,sans-serif', marginBottom: 6 }}>{t('wk_progress')}</div>
          <div style={{ height: 6, background: '#e6e8ea', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#16a34a' : '#002b6d', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: '#6e7282', marginTop: 5 }}>{t('wk_progress_stats', { known: totalKnown, total: totalWords })}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: overallPct === 100 ? '#16a34a' : '#002b6d', fontFamily: 'Manrope,sans-serif', flexShrink: 0 }}>{overallPct}%</div>
      </div>

      <div id="wk-theme-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {KNM_WOORDKAARTEN.themes.map(theme => {
          const themeKnown = theme.words.filter(w => wkProgress[w.id] === 'known').length;
          const themePct = theme.words.length ? Math.round((themeKnown / theme.words.length) * 100) : 0;
          const isFree = theme.id === 1;
          const locked = !isFree && !isPremium;
          const isCompleted = themePct === 100;
          const inProgress = !isCompleted && themeKnown > 0;

          const headerStyle: React.CSSProperties = {
            height: 144,
            background: locked ? 'linear-gradient(135deg,#3b3f4d,#1f2330)' : 'linear-gradient(135deg,#002b6d,#1d428a,#0d4499)',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '1rem 1rem 0 0',
          };

          const cardStyle: React.CSSProperties = {
            background: '#fff',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)',
            border: '1px solid #e6e8ea',
            transform: 'translateZ(0)',
            display: 'block',
            textDecoration: 'none',
            transition: 'transform .18s,box-shadow .18s',
            color: 'inherit',
            cursor: locked ? 'pointer' : 'pointer',
            width: '100%',
            textAlign: 'left',
          };

          const inner = (
            <>
              <div style={headerStyle}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 80, color: 'rgba(255,255,255,0.15)', userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>{THEME_ICON[theme.id] ?? 'style'}</span>

                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span style={{ background: locked ? 'rgba(255,255,255,0.15)' : '#fe762c', color: locked ? '#fff' : '#5f2200', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontFamily: 'Manrope,sans-serif' }}>
                    Thema {theme.id}
                  </span>
                </div>

                {isCompleted && !locked && (
                  <div style={{ position: 'absolute', top: 16, right: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontFamily: 'Manrope,sans-serif' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Voltooid
                    </span>
                  </div>
                )}

                {locked && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope,sans-serif' }}>{t('wk_locked_badge')}</span>
                    </div>
                  </div>
                )}

                {!locked && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, width: 32, height: 32, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>

              <div style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: 15, color: '#191c1e', margin: '0 0 6px', lineHeight: 1.3 }}>{theme.name}</h3>
                <p style={{ fontSize: 12, color: '#434651', lineHeight: 1.55, margin: '0 0 14px' }}>{THEME_DESC[theme.id] ?? ''}</p>

                {!locked && (isCompleted || inProgress) && (
                  <div style={{ height: 3, background: '#e6e8ea', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ height: '100%', width: `${themePct}%`, background: isCompleted ? '#16a34a' : '#fe762c', borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, borderTop: '1px solid #e6e8ea', paddingTop: 12, color: locked ? '#fe762c' : isCompleted ? '#16a34a' : '#434651', fontWeight: locked ? 700 : 400 }}>
                  {locked ? (
                    <>
                      <span>{t('wk_unlock_link')}</span>
                      <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </>
                  ) : (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6e7282' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>style</span>
                        {theme.words.length} woorden
                      </span>
                      <span style={{ marginLeft: 'auto', color: isCompleted ? '#16a34a' : '#002b6d', fontWeight: 700, fontFamily: 'Manrope,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
                        {isCompleted ? 'Herhalen' : themeKnown > 0 ? 'Verder' : 'Start'}
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          );

          if (locked) {
            const wkLockHref = isGuest ? `/${locale}/register` : '/activate';
            return (
              <a key={theme.id} href={wkLockHref} className="wk-theme-card locked" style={cardStyle}
                onMouseOver={e => { (e.currentTarget).style.transform = 'translateY(-3px)'; (e.currentTarget).style.boxShadow = '0 4px 20px rgba(254,118,44,0.18),0 10px 32px rgba(0,43,109,0.08)'; }}
                onMouseOut={e => { (e.currentTarget).style.transform = ''; (e.currentTarget).style.boxShadow = '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)'; }}
              >{inner}</a>
            );
          }

          return (
            <button key={theme.id} onClick={() => startPracticeFor(theme)} className="wk-theme-card" style={cardStyle}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,43,109,0.12),0 10px 32px rgba(0,43,109,0.08)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)'; }}
            >{inner}</button>
          );
        })}
      </div>
    </div>
  );
}
