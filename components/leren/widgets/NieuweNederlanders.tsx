'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';

type GroupId = 'gastarbeiders' | 'gezinshereniging' | 'kolonieen' | 'vluchtelingen';
type OrgId = 'vn' | 'navo' | 'eu';
type Tab = 'groepen' | 'organisaties';

interface GroupInfo {
  label: string;
  icon: string;
  color: string;
  period?: string;
  body: string;
  tip?: string;
}

interface OrgInfo {
  label: string;
  abbr: string;
  emoji: string;
  color: string;
  body: string;
  tip?: string;
}

const GROUPS: Record<GroupId, GroupInfo> = {
  gastarbeiders: {
    label: 'Gastarbeiders',
    icon: 'construction',
    color: '#1d428a',
    period: 'jaren \'60 en \'70',
    body: 'In de jaren \'60 en \'70 kwamen veel mensen uit Turkije en Marokko naar Nederland om te werken. Ze werden gastarbeiders (arbeidsmigranten) genoemd. De bedoeling was dat ze tijdelijk bleven, maar veel gastarbeiders vestigden zich permanent in Nederland samen met hun gezinnen.',
    tip: 'Examentip: Gastarbeiders kwamen uit Turkije en Marokko in de jaren \'60 en \'70 om te werken.',
  },
  gezinshereniging: {
    label: 'Gezinshereniging',
    icon: 'family_restroom',
    color: '#2e7d32',
    body: 'De families van arbeiders kwamen later ook naar Nederland. Dit noemen we gezinshereniging — het herenigen van gezinnen die gescheiden waren door migratie.',
    tip: 'Examentip: Gezinshereniging betekent dat familieleden van migranten later naar Nederland mochten komen.',
  },
  kolonieen: {
    label: 'Mensen uit de koloniën',
    icon: 'public',
    color: '#6a1e55',
    body: 'Na de oorlog kwamen ook mensen uit de koloniën naar Nederland, bijvoorbeeld om te werken of te studeren. Nederland had vroeger koloniën, waaronder Suriname en Indonesië.',
    tip: 'Examentip: Suriname en Indonesië waren vroeger Nederlandse koloniën. Na de onafhankelijkheid kwamen veel mensen naar Nederland.',
  },
  vluchtelingen: {
    label: 'Vluchtelingen',
    icon: 'person_raised_hand',
    color: '#b5420a',
    body: 'Mensen die komen omdat het in hun eigen land niet veilig is, bijvoorbeeld door oorlog of vervolging, worden vluchtelingen of asielzoekers genoemd. Nederland heeft de plicht om mensen in gevaar te beschermen.',
    tip: 'Examentip: Een vluchteling verlaat het eigen land vanwege onveiligheid, oorlog of vervolging.',
  },
};

const ORGS: Record<OrgId, OrgInfo> = {
  vn: {
    label: 'Verenigde Naties',
    abbr: 'VN',
    emoji: '🌍',
    color: '#1a5276',
    body: 'De VN (Verenigde Naties) werkt aan vrede in de wereld. Bijna alle landen ter wereld zijn lid. De VN praat over conflicten en stuurt vredestroepen naar gebieden in oorlog. Nederland werkt actief mee aan VN-missies.',
    tip: 'Examentip: De VN werkt aan wereldvrede. Nagenoeg alle landen ter wereld zijn lid.',
  },
  navo: {
    label: 'NAVO',
    abbr: 'NAVO',
    emoji: '🛡️',
    color: '#003478',
    body: 'De NAVO (Noord-Atlantische Verdragsorganisatie) is een militair bondgenootschap. Landen beschermen elkaar: als één land wordt aangevallen, helpen de andere landen mee. Het hoofdkantoor staat in Brussel.',
    tip: 'Examentip: De NAVO is een militair bondgenootschap — landen beschermen elkaar. Hoofdkantoor in Brussel.',
  },
  eu: {
    label: 'Europese Unie',
    abbr: 'EU',
    emoji: '🇪🇺',
    color: '#003399',
    body: 'De EU (Europese Unie) maakt wetten over geld, veiligheid en gezondheid. EU-burgers mogen vrij reizen en werken in alle EU-landen. Veel EU-landen gebruiken de euro. Nederland is een van de oprichters van de EU.',
    tip: 'Examentip: In de EU mag je vrij reizen en werken. Veel EU-landen gebruiken de euro. Nederland is oprichter.',
  },
};

const GROUP_ORDER: GroupId[] = ['gastarbeiders', 'gezinshereniging', 'kolonieen', 'vluchtelingen'];
const ORG_ORDER: OrgId[] = ['vn', 'navo', 'eu'];

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function NieuweNederlanders({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const cuesRef = useRef<AudioCue[]>([]);

  const [tab, setTab] = useState<Tab>('groepen');
  const [activeGroup, setActiveGroup] = useState<GroupId | null>(null);
  const [activeOrg, setActiveOrg] = useState<OrgId | null>(null);

  // Audio state
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitle, setSubtitle] = useState('');

  // Manual-click hint state (before audio or first click)
  const [manualMode, setManualMode] = useState(true);
  const [hintIdx, setHintIdx] = useState(0);

  useEffect(() => {
    if (audioCues && audioCues.length > 0) {
      cuesRef.current = audioCues;
      setReady(true);
    }
  }, [audioCues]);

  useEffect(() => {
    if (!manualMode) return;
    const t = setInterval(() => setHintIdx((i) => (i + 1) % GROUP_ORDER.length), 1800);
    return () => clearInterval(t);
  }, [manualMode]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;

    let sub: string | undefined;
    let grp: GroupId | null | undefined;
    let org: OrgId | null | undefined;

    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      const c = cues[i];
      if (sub === undefined && c.subtitle !== undefined) sub = c.subtitle;
      if (grp === undefined && c.group !== undefined) grp = c.group as GroupId | null;
      if (org === undefined && c.org !== undefined) org = c.org as OrgId | null;
      if (sub !== undefined && grp !== undefined && org !== undefined) break;
    }

    if (sub !== undefined) setSubtitle(sub);
    setProgress(audio.duration ? t / audio.duration : 0);

    if (grp !== undefined) {
      setActiveGroup(grp);
      if (grp !== null) { setTab('groepen'); setManualMode(false); }
    }
    if (org !== undefined) {
      setActiveOrg(org);
      if (org !== null) { setTab('organisaties'); setManualMode(false); }
    }
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); setManualMode(false); }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - bar.getBoundingClientRect().left) / bar.getBoundingClientRect().width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }

  function handleGroupClick(id: GroupId) {
    setManualMode(false);
    setActiveGroup(activeGroup === id ? null : id);
    setTab('groepen');
  }

  function handleOrgClick(id: OrgId) {
    setManualMode(false);
    setActiveOrg(activeOrg === id ? null : id);
    setTab('organisaties');
  }

  function switchTab(t: Tab) {
    setTab(t);
    if (!playing) { setManualMode(true); setHintIdx(0); }
  }

  const groupInfo = activeGroup ? GROUPS[activeGroup] : null;
  const orgInfo = activeOrg ? ORGS[activeOrg] : null;
  const hintGroup = manualMode && tab === 'groepen' ? GROUP_ORDER[hintIdx] : null;
  const activeInfo = tab === 'groepen' ? groupInfo : orgInfo;
  const activeColor = tab === 'groepen' ? (groupInfo?.color ?? null) : (orgInfo?.color ?? null);

  return (
    <>
      <style>{`
        @keyframes nn-pulse  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes nn-nudge  { 0%,100%{transform:translateX(0)} 40%{transform:translateX(4px)} 70%{transform:translateX(-2px)} }
        @keyframes nn-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .nn-hint  { animation: nn-pulse 1.6s ease-in-out infinite; }
        .nn-nudge { display:inline-block; animation: nn-nudge 1s ease-in-out infinite; }
        .nn-fadein{ animation: nn-fadein 0.22s ease forwards; }
      `}</style>

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">

        {/* ── Header + audio player + tabs ── */}
        <div className="px-5 pt-5 pb-0 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve les
          </p>
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-on-surface)' }}>
            Na de oorlog — klik of luister
          </p>

          {/* ── Inline audio player ── */}
          {audioUrl && (
            <>
              <audio ref={audioRef} src={audioUrl} preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setReady(true); }}
                onEnded={() => { setPlaying(false); setSubtitle(''); setProgress(0); setManualMode(true); setActiveGroup(null); setActiveOrg(null); }}
              />
              <div className="flex items-center gap-3 mb-2">
                <button onClick={togglePlay} disabled={!ready}
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: playing ? '#fe762c' : 'transparent',
                    border: playing ? 'none' : '2px solid #fe762c',
                    color: playing ? '#fff' : '#fe762c',
                    opacity: ready ? 1 : 0.4,
                  }}
                  aria-label={playing ? 'Pauzeer' : 'Start audio les'}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                    {playing ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: 'var(--color-on-surface)' }}>
                    {playing ? 'Audio les speelt...' : 'Luister naar de uitleg'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                    De kaarten worden automatisch gemarkeerd
                  </p>
                </div>
                <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {formatTime(duration)}
                </span>
              </div>
              <div ref={progressBarRef} onClick={seekTo}
                   className="w-full h-1.5 rounded-full cursor-pointer mb-2"
                   style={{ background: 'var(--color-outline-variant)' }}>
                <div className="h-full rounded-full transition-[width] duration-100"
                     style={{ width: `${progress * 100}%`, background: '#fe762c' }} />
              </div>
              <div className="min-h-[28px] flex items-center mb-3">
                {subtitle
                  ? <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{subtitle}</p>
                  : <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)', opacity: 0.6 }}>Druk op afspelen om de les te beluisteren</p>
                }
              </div>
            </>
          )}

          <div className="flex gap-1">
            {(['groepen', 'organisaties'] as Tab[]).map((t) => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className="px-3 py-1.5 text-xs font-semibold rounded-t-xl transition-all"
                style={{
                  background: tab === t ? 'var(--color-primary)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--color-on-surface-variant)',
                  borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}>
                {t === 'groepen' ? 'Nieuwe Nederlanders' : 'Internationale samenwerking'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col sm:flex-row">

          {/* ── Left: cards ── */}
          <div className="sm:w-[55%] p-4">

            {tab === 'groepen' && (
              <>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Na de oorlog kwamen verschillende groepen naar Nederland. Klik of luister.
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <div className="h-px flex-1" style={{ background: 'var(--color-outline-variant)' }} />
                  {['1945', '1960s', '1970s', '1980s–nu'].map((yr) => (
                    <span key={yr} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
                      {yr}
                    </span>
                  ))}
                  <div className="h-px flex-1" style={{ background: 'var(--color-outline-variant)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {GROUP_ORDER.map((id) => {
                    const g = GROUPS[id];
                    const isActive = activeGroup === id;
                    const isHint = hintGroup === id;
                    return (
                      <button key={id} type="button" onClick={() => handleGroupClick(id)}
                        className={`rounded-2xl p-3 text-left transition-all active:scale-95 flex flex-col gap-1.5${isHint ? ' nn-hint' : ''}`}
                        style={{
                          background: isActive ? g.color : 'var(--color-surface-container-low)',
                          border: `2px solid ${isActive ? g.color : isHint ? g.color + '80' : 'transparent'}`,
                          boxShadow: isActive ? `0 4px 16px ${g.color}33` : 'none',
                          transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                        }}>
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: isActive ? 'rgba(255,255,255,0.2)' : g.color + '18' }}>
                            <span className="material-symbols-outlined"
                                  style={{ fontSize: 17, color: isActive ? '#fff' : g.color, fontVariationSettings: "'FILL' 1" }}>
                              {g.icon}
                            </span>
                          </span>
                          <span className="text-[11px] font-bold leading-tight"
                                style={{ color: isActive ? '#fff' : 'var(--color-on-surface)' }}>
                            {g.label}
                          </span>
                        </div>
                        {g.period && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full self-start"
                                style={{
                                  background: isActive ? 'rgba(255,255,255,0.2)' : g.color + '18',
                                  color: isActive ? 'rgba(255,255,255,0.85)' : g.color,
                                }}>
                            {g.period}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {tab === 'organisaties' && (
              <>
                <p className="text-[11px] leading-relaxed mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Nederland werkt samen via internationale organisaties. Klik of luister.
                </p>
                <div className="flex flex-col gap-2.5">
                  {ORG_ORDER.map((id) => {
                    const o = ORGS[id];
                    const isActive = activeOrg === id;
                    return (
                      <button key={id} type="button" onClick={() => handleOrgClick(id)}
                        className="rounded-2xl p-3 text-left transition-all active:scale-95 flex items-center gap-3"
                        style={{
                          background: isActive ? o.color : 'var(--color-surface-container-low)',
                          border: `2px solid ${isActive ? o.color : 'transparent'}`,
                          boxShadow: isActive ? `0 4px 16px ${o.color}33` : 'none',
                          transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                             style={{ background: isActive ? 'rgba(255,255,255,0.15)' : o.color + '18' }}>
                          {o.emoji}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight"
                             style={{ color: isActive ? '#fff' : 'var(--color-on-surface)' }}>
                            {o.abbr}
                          </p>
                          <p className="text-[10px] leading-tight"
                             style={{ color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--color-on-surface-variant)' }}>
                            {o.label}
                          </p>
                        </div>
                        <span className="material-symbols-outlined ml-auto"
                              style={{
                                fontSize: 16,
                                color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--color-on-surface-variant)',
                                transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }}>
                          chevron_right
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Right: info panel ── */}
          <div className="sm:w-[45%] p-4 flex flex-col gap-3 justify-center">

            {/* Info card */}
            <div className="rounded-2xl p-4 flex flex-col justify-center"
                 style={{
                   background: activeColor ?? 'var(--color-surface-container-low)',
                   transition: 'background 0.3s ease',
                   minHeight: 100,
                 }}>
              {activeInfo ? (
                <div key={tab === 'groepen' ? activeGroup : activeOrg} className="nn-fadein">
                  <div className="flex items-center gap-2 mb-2">
                    {'icon' in activeInfo ? (
                      <span className="material-symbols-outlined"
                            style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', fontVariationSettings: "'FILL' 1" }}>
                        {(activeInfo as GroupInfo).icon}
                      </span>
                    ) : (
                      <span className="text-base leading-none">{(activeInfo as OrgInfo).emoji}</span>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {'label' in activeInfo ? activeInfo.label : ''}
                    </p>
                  </div>
                  <p className="text-xs text-white leading-relaxed" style={{ opacity: 0.92 }}>
                    {activeInfo.body}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="nn-nudge text-lg">👆</span>
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Klik op een {tab === 'groepen' ? 'groep' : 'organisatie'}
                  </p>
                </div>
              )}
            </div>

            {/* Exam tip */}
            {activeInfo?.tip && (
              <div key={`tip-${tab === 'groepen' ? activeGroup : activeOrg}`}
                   className="rounded-xl p-3 flex gap-2 nn-fadein"
                   style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>
                  lightbulb
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>
                  {activeInfo.tip}
                </p>
              </div>
            )}

            {/* Multiculturele samenleving note */}
            <div className="rounded-xl p-3 flex gap-2"
                 style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
              <span className="material-symbols-outlined shrink-0 mt-0.5"
                    style={{ color: 'var(--color-primary)', fontSize: 15, fontVariationSettings: "'FILL' 1" }}>
                diversity_3
              </span>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
                Vandaag heeft Nederland een <strong style={{ color: 'var(--color-on-surface)' }}>diverse, multiculturele samenleving</strong> — mede dankzij al deze groepen.
              </p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
