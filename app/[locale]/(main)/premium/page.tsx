import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { TeacherCard, SkillIcon } from '@/components/site';
import PricingViewTracker from '@/components/PricingViewTracker';
import { DEFAULT_LEVEL, SKILLS, formatCount, getSkill, getSkillAtLevel } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import {
  MODULE_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_SAVING_CENTS,
  euro,
  modulesForLevel,
  totalExamsForLevel,
} from '@/lib/pricing';
import { Lock, Check, Headphones, RefreshCw } from 'lucide-react';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'premium' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: 'https://inburgeringoefenen.nl/nl/premium',
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/premium',
        en: 'https://inburgeringoefenen.nl/en/premium',
        ar: 'https://inburgeringoefenen.nl/ar/%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9',
        'x-default': 'https://inburgeringoefenen.nl/nl/premium',
      },
    },
  };
}

/* ─── icons ──────────────────────────────────────────────────────────────── */
const CheckGreen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a7a3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
);
const XGray = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4c6d2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

/* ─── Browser / Dashboard mockup (hero right column) ───────────────────── */
function BrowserMockup() {
  return (
    <div style={{ background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 0 rgba(0,0,0,0.08),0 20px 56px rgba(0,43,109,0.22),0 6px 18px rgba(0,43,109,0.10)', border:'1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ background:'#f2f2f2', borderBottom:'1px solid #e0e0e0', padding:'9px 12px', display:'flex', alignItems:'center', gap:'7px' }}>
        <span style={{ width:9,height:9,borderRadius:'50%',background:'#ff5f57',flexShrink:0,display:'block' }}/>
        <span style={{ width:9,height:9,borderRadius:'50%',background:'#febc2e',flexShrink:0,display:'block' }}/>
        <span style={{ width:9,height:9,borderRadius:'50%',background:'#28c840',flexShrink:0,display:'block' }}/>
        <span style={{ flex:1,background:'#fff',borderRadius:'5px',padding:'3px 10px',fontSize:'11px',color:'#747782',fontFamily:'monospace',border:'1px solid #e0e0e0' }}>inburgeringoefenen.nl/dashboard</span>
      </div>
      <div style={{ display:'flex', height:'370px', overflow:'hidden' }}>
        <div style={{ width:'168px',minWidth:'168px',background:'#fff',borderRight:'1px solid #e6e8ea',display:'flex',flexDirection:'column' }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid #eceef0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <span style={{ width:'4px',height:'16px',background:'#fe762c',borderRadius:'2px',display:'block' }}/>
              <span style={{ fontFamily:'var(--font-headline)',fontWeight:800,color:'#002b6d',fontSize:'12px' }}>Inburgering Oefenen</span>
            </div>
            <p style={{ fontSize:'9px',color:'#747782',marginTop:'2px',paddingLeft:'10px' }}>Mijn modules</p>
          </div>
          <nav style={{ padding:'8px',display:'flex',flexDirection:'column',gap:'2px' }}>
            {([
              { slug:'lezen',     label:'Lezen',     active:true,  on:true },
              { slug:'luisteren', label:'Luisteren', active:false, on:true },
              { slug:'schrijven', label:'Schrijven', active:false, on:true },
              { slug:'spreken',   label:'Spreken',   active:false, on:false },
            ] as const).map(item => (
              <div key={item.slug} style={{ display:'flex',alignItems:'center',gap:'7px',padding:'7px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:item.active?700:500,color:item.active?'#002b6d':(item.on?'#434651':'#a0a3ad'),background:item.active?'#EEF2FF':undefined }}>
                <SkillIcon skill={item.slug} size="sm" variant="bare" />
                {item.label}
                {!item.on && <Lock size={9} strokeWidth={2.2} style={{ marginLeft:'auto' }} aria-hidden="true" />}
              </div>
            ))}
          </nav>
          <div style={{ marginTop:'auto',padding:'8px' }}>
            <div style={{ background:'linear-gradient(135deg,#fe762c,#d94f00)',color:'#fff',fontSize:'10px',fontWeight:700,borderRadius:'8px',padding:'8px 10px',textAlign:'center' }}>Spreken toevoegen</div>
          </div>
        </div>
        <div style={{ flex:1,background:'#f8f9fb',padding:'16px',overflow:'hidden' }}>
          <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',padding:'14px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 2px 8px rgba(0,43,109,0.06)' }}>
            <svg width="58" height="58" viewBox="0 0 110 110" style={{ flexShrink:0 }}>
              <circle cx="55" cy="55" r="46" fill="none" stroke="#e0e3e5" strokeWidth="10"/>
              <circle cx="55" cy="55" r="46" fill="none" stroke="#fe762c" strokeWidth="10" strokeLinecap="round" strokeDasharray="289.03" strokeDashoffset="100" transform="rotate(-90 55 55)"/>
              <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill="#002b6d" fontFamily="Manrope,sans-serif">65%</text>
              <text x="55" y="66" textAnchor="middle" fontSize="10" fill="#747782" fontFamily="Arial,sans-serif">gereed</text>
            </svg>
            <div>
              <p style={{ fontFamily:'var(--font-headline)',fontWeight:700,color:'#002b6d',fontSize:'12px',lineHeight:1.3 }}>Module Lezen</p>
              <p style={{ fontSize:'10px',color:'#747782',marginTop:'3px' }}>6 van 10 oefenexamens gedaan. Goed bezig!</p>
              <div style={{ display:'flex',gap:'6px',marginTop:'6px',flexWrap:'wrap' }}>
                <span style={{ fontSize:'9px',fontWeight:600,background:'#f2f4f6',color:'#434651',padding:'2px 6px',borderRadius:'99px' }}>25 vragen per examen</span>
                <span style={{ fontSize:'9px',fontWeight:700,background:'#f0fdf4',color:'#15803d',padding:'2px 6px',borderRadius:'99px',border:'1px solid rgba(22,163,74,0.2)' }}>Gem. 79%</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize:'10px',fontWeight:700,color:'#191c1e',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#002b6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Oefenexamens Lezen
            <span style={{ color:'#747782',fontWeight:400,marginLeft:'auto' }}>10 EXAMENS</span>
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px' }}>
            {[
              { n:1, s:'84%', pass:true },
              { n:2, s:'76%', pass:true },
              { n:3, s:'91%', pass:true },
            ].map(ex => (
              <div key={ex.n} style={{ background:'#fff',border:'1px solid #eceef0',borderRadius:'8px',padding:'10px' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px' }}>
                  <span style={{ fontSize:'9px',fontWeight:700,color:'#191c1e' }}>Examen {ex.n}</span>
                  <span style={{ fontSize:'8px',fontWeight:700,color:'#15803d',background:'#f0fdf4',padding:'2px 5px',borderRadius:'99px',display:'inline-flex',alignItems:'center',gap:'2px' }}><Check size={8} strokeWidth={3} aria-hidden="true" />Gesl.</span>
                </div>
                <div style={{ fontFamily:'var(--font-headline)',fontWeight:800,fontSize:'18px',color:'#002b6d',lineHeight:1 }}>{ex.s}</div>
                <div style={{ height:'4px',background:'#f2f4f6',borderRadius:'99px',marginTop:'6px',overflow:'hidden' }}><div style={{ height:'100%',background:'#22c55e',borderRadius:'99px',width:ex.s }}/></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'12px',background:'#fff',border:'1px solid #eceef0',borderRadius:'8px',padding:'12px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px' }}>
              <span style={{ fontSize:'10px',fontWeight:700,color:'#191c1e' }}>Woordenlijst Lezen</span>
              <span style={{ fontSize:'8px',fontWeight:700,color:'#002b6d',background:'#eff6ff',padding:'2px 6px',borderRadius:'99px' }}>hoort bij je module</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
              <div style={{ flex:1,height:'6px',background:'#f2f4f6',borderRadius:'99px',overflow:'hidden' }}>
                <div style={{ height:'100%',width:'58%',borderRadius:'99px',background:'linear-gradient(90deg,#002b6d,#fe762c)' }}/>
              </div>
              <span style={{ fontSize:'10px',fontWeight:800,color:'#002b6d',fontFamily:'var(--font-headline)' }}>58%</span>
            </div>
            <p style={{ fontSize:'9px',color:'#747782',marginTop:'6px' }}>Woorden uit advertenties, brieven en formulieren</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature mockups ───────────────────────────────────────────────────── */
function ExamensMockup() {
  const lezen = getSkillAtLevel(DEFAULT_LEVEL, 'lezen')!;
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div className="space-y-2">
        {[
          { n:1, s:'84%' },
          { n:2, s:'91%' },
          { n:3, s:null },
        ].map(ex => (
          <div key={ex.n} style={{ background:'#fff',border:'1px solid #eceef0',borderRadius:'12px',padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:'12px',fontWeight:700,color:'#191c1e' }}>Lezen · oefenexamen {ex.n}</p>
              <p style={{ fontSize:'10px',color:'#747782' }}>{formatCount(lezen.itemCount)} vragen · {formatCount(lezen.durationMinutes)} min</p>
            </div>
            <div style={{ textAlign:'right' }}>
              {ex.s ? <>
                <p style={{ fontFamily:'var(--font-headline)',fontWeight:800,fontSize:'18px',color:'#002b6d',lineHeight:1 }}>{ex.s}</p>
                <span style={{ fontSize:'9px',fontWeight:700,color:'#15803d',background:'#f0fdf4',padding:'2px 6px',borderRadius:'99px',display:'inline-flex',alignItems:'center',gap:'3px' }}><Check size={9} strokeWidth={3} aria-hidden="true" />Geslaagd</span>
              </> : (
                <span style={{ fontSize:'10px',fontWeight:600,color:'#a24000',background:'rgba(254,118,44,0.10)',padding:'4px 8px',borderRadius:'99px' }}>Nu doen →</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div style={{ background:'linear-gradient(135deg,#002b6d,#0044ad)',borderRadius:'12px',padding:'12px 14px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'10px' }}>
        <Headphones size={18} strokeWidth={1.9} style={{ color:'#fff',flexShrink:0 }} aria-hidden="true" />
        <div>
          <p style={{ fontSize:'8px',fontWeight:700,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:'0.06em' }}>Les · module Luisteren</p>
          <p style={{ fontSize:'11px',fontWeight:800,color:'#fff',lineHeight:1.2 }}>Een gesprek bij de balie</p>
        </div>
      </div>
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',overflow:'hidden' }}>
        <div style={{ padding:'10px 14px 8px',borderBottom:'1px solid #eceef0' }}>
          <p style={{ fontSize:'8px',fontWeight:700,color:'#fe762c',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'1px' }}>Uitleg van de docent</p>
          <p style={{ fontSize:'11px',fontWeight:700,color:'#191c1e' }}>Waar moet je op letten?</p>
        </div>
        <div style={{ padding:'10px 14px 12px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px' }}>
            <div style={{ width:'32px',height:'32px',borderRadius:'50%',background:'#fe762c',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'10px',fontWeight:600,color:'#191c1e',marginBottom:'2px' }}>Speelt…</p>
              <p style={{ fontSize:'9px',color:'#747782' }}>Twee stemmen, net als in het examen</p>
            </div>
            <span style={{ fontSize:'10px',color:'#747782',fontVariantNumeric:'tabular-nums' }}>2:34</span>
          </div>
          <div style={{ height:'6px',background:'#f2f4f6',borderRadius:'99px',overflow:'hidden',marginBottom:'8px' }}>
            <div style={{ height:'100%',width:'42%',background:'#fe762c',borderRadius:'99px' }}/>
          </div>
          <div style={{ background:'#f8f9fb',borderRadius:'8px',padding:'8px 10px' }}>
            <p style={{ fontSize:'9px',color:'#434651',lineHeight:1.5 }}>
              &ldquo;In dit soort gesprekken hoor je bijna altijd eerst een <strong>tijd</strong> of een <strong>dag</strong>. Schrijf die meteen op — daar gaat de vraag vaak over.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WoordenlijstMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',padding:'16px',marginBottom:'10px',textAlign:'center' }}>
        <p style={{ fontSize:'8px',fontWeight:700,color:'#747782',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px' }}>Woordenlijst · module Lezen</p>
        <p style={{ fontFamily:'var(--font-headline)',fontWeight:800,fontSize:'20px',color:'#002b6d',lineHeight:1.2 }}>de aanvraag</p>
        <p style={{ fontSize:'10px',color:'#747782',marginTop:'6px' }}>the application · الطلب</p>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',marginTop:'10px' }}>
          <span style={{ display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'9px',fontWeight:700,color:'#002b6d',background:'#eff6ff',padding:'3px 8px',borderRadius:'99px' }}>
            <Headphones size={9} strokeWidth={2.4} aria-hidden="true" />Beluister
          </span>
          <span style={{ fontSize:'9px',color:'#747782' }}>Kaart 7 van 24</span>
        </div>
      </div>
      <div style={{ display:'flex',gap:'6px' }}>
        <div style={{ flex:1,background:'#fff',border:'1px solid #eceef0',borderRadius:'8px',padding:'8px',textAlign:'center',fontSize:'9px',fontWeight:700,color:'#747782' }}>Nog even oefenen</div>
        <div style={{ flex:1,background:'#f0fdf4',border:'1px solid rgba(22,163,74,0.2)',borderRadius:'8px',padding:'8px',textAlign:'center',fontSize:'9px',fontWeight:700,color:'#15803d' }}>Ik ken dit woord</div>
      </div>
    </div>
  );
}

function FeedbackMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',padding:'12px',marginBottom:'10px' }}>
        <p style={{ fontSize:'8px',fontWeight:700,color:'#747782',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'6px' }}>Lezen · vraag 8</p>
        <p style={{ fontSize:'10px',fontWeight:600,color:'#191c1e',marginBottom:'10px',lineHeight:1.4 }}>Wanneer moet je het formulier terugsturen?</p>
        <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',background:'#f8f9fb',opacity:0.5 }}>
            <span style={{ width:'20px',height:'20px',background:'#eceef0',color:'#747782',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0 }}>A</span>
            <span style={{ fontSize:'10px',color:'#747782' }}>Binnen een week</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',border:'2px solid #4ade80',background:'#f0fdf4' }}>
            <span style={{ width:'20px',height:'20px',background:'#dcfce7',color:'#15803d',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0 }}>B</span>
            <span style={{ fontSize:'10px',color:'#15803d',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'4px' }}>Voor 1 maart<Check size={10} strokeWidth={3} aria-hidden="true" /></span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',border:'1px solid #fca5a5',background:'#fef2f2',opacity:0.6 }}>
            <span style={{ width:'20px',height:'20px',background:'#fee2e2',color:'#dc2626',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0 }}>C</span>
            <span style={{ fontSize:'10px',color:'#dc2626',textDecoration:'line-through' }}>Na de vakantie</span>
          </div>
        </div>
      </div>
      <div style={{ background:'#eff6ff',borderRadius:'12px',border:'1px solid rgba(59,130,246,0.2)',padding:'12px' }}>
        <p style={{ fontSize:'9px',fontWeight:700,color:'#002b6d',marginBottom:'4px',display:'flex',alignItems:'center',gap:'4px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Uitleg van de docent
        </p>
        <p style={{ fontSize:'9px',color:'rgba(0,43,109,0.75)',lineHeight:1.5 }}>De datum staat in de laatste regel van de brief: &ldquo;Stuur het formulier terug vóór 1 maart.&rdquo; De week uit antwoord A gaat over iets anders.</p>
      </div>
    </div>
  );
}

function RubricMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',padding:'12px',marginBottom:'10px' }}>
        <p style={{ fontSize:'8px',fontWeight:700,color:'#747782',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px' }}>Schrijven · opdracht 2</p>
        {[
          { c:'Inhoud', s:3 },
          { c:'Woordgebruik', s:2 },
          { c:'Grammatica', s:2 },
        ].map(r => (
          <div key={r.c} style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'7px' }}>
            <span style={{ fontSize:'10px',color:'#434651',width:'74px',flexShrink:0 }}>{r.c}</span>
            <div style={{ display:'flex',gap:'3px' }}>
              {[1,2,3].map(i => (
                <span key={i} style={{ width:'16px',height:'6px',borderRadius:'99px',background:i <= r.s ? '#fe762c' : '#f2f4f6',display:'block' }}/>
              ))}
            </div>
            <span style={{ fontSize:'10px',fontWeight:800,color:'#002b6d',fontFamily:'var(--font-headline)',marginLeft:'auto' }}>{r.s}/3</span>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff7ed',borderRadius:'12px',border:'1px solid rgba(254,118,44,0.25)',padding:'12px' }}>
        <p style={{ fontSize:'9px',fontWeight:700,color:'#a24000',marginBottom:'4px' }}>Volgens de rubric van de docent</p>
        <p style={{ fontSize:'9px',color:'rgba(0,43,109,0.75)',lineHeight:1.5 }}>Je e-mail heeft een goede aanhef en afsluiting. Let op het werkwoord: &ldquo;ik <strong>heb</strong> gebeld&rdquo;, niet &ldquo;ik ben gebeld&rdquo;.</p>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default async function PremiumPage({ params }: Props) {
  const { locale } = await params;
  const tP = await getTranslations({ locale, namespace: 'premium_page' });
  const tS = await getTranslations({ locale, namespace: 'skills' });

  const price = euro(MODULE_PRICE_CENTS);
  const bundle = euro(BUNDLE_PRICE_CENTS);
  const list = euro(BUNDLE_LIST_PRICE_CENTS);
  const saving = euro(BUNDLE_SAVING_CENTS);
  // This page sells A2: its prices, its bundle copy and its free offer are all A2's, and B1
  // has no published content to advertise. Explicitly A2 rather than "all modules".
  const a2Modules = modulesForLevel(DEFAULT_LEVEL);
  const examsPerModule = a2Modules[0].examCount;
  const totalExams = totalExamsForLevel(DEFAULT_LEVEL);

  /* Lessons and the word list are part of every module, but their A2 content is not
     authored yet — `lib/features.ts` still has them off. Mark those rows honestly rather
     than advertising something that does not exist; the tags disappear when the flags flip. */
  const soon = (enabled: boolean) =>
    enabled ? null : (
      <span className="ml-1.5 align-middle text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background:'rgba(0,43,109,0.07)', color:'#5a6070' }}>
        {tP('module_soon')}
      </span>
    );

  /* `'partial'` in the single-module column: true only for the module you actually buy —
     explanations apply to Lezen/Luisteren, rubric feedback to Schrijven/Spreken. A plain
     checkmark there would promise both for one €12,95 module. */
  type Cell = boolean | 'partial';
  const allFeatures: { label: string; soon?: boolean; free: Cell; module: Cell; bundle: Cell }[] = [
    { label: tP('feat_1'),                          free: true,  module: true,  bundle: true  },
    { label: tP('feat_2'),                          free: false, module: true,  bundle: true  },
    { label: tP('feat_3'),                          free: false, module: false, bundle: true  },
    { label: tP('feat_4'),                          free: true,  module: true,  bundle: true  },
    { label: tP('feat_5'),                          free: false, module: 'partial', bundle: true },
    { label: tP('feat_6'),                          free: false, module: 'partial', bundle: true },
    { label: tP('feat_7'),  soon: !FEATURES.leren,        free: false, module: true,  bundle: true  },
    { label: tP('feat_8'),  soon: !FEATURES.woordkaarten, free: false, module: true,  bundle: true  },
    { label: tP('feat_9'),                          free: false, module: true,  bundle: true  },
    { label: tP('feat_10'),                         free: false, module: true,  bundle: true  },
    { label: tP('feat_11'),                         free: true,  module: true,  bundle: true  },
    { label: tP('feat_12'),                         free: false, module: false, bundle: true  },
  ];

  const cell = (state: Cell, dark = false) => {
    if (state === 'partial') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-1 rounded text-center leading-tight" style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,43,109,0.07)', color: dark ? 'rgba(255,255,255,0.8)' : '#5a6070' }}>
          {tP('cell_partial')}
        </span>
      );
    }
    return state ? <CheckGreen /> : <XGray />;
  };

  const trustLine = (dark = false) => (
    <p className="text-center text-xs mt-3 flex items-center justify-center gap-1.5" style={{ color: dark ? 'rgba(255,255,255,0.4)' : '#9ba1b0' }}>
      <RefreshCw size={11} strokeWidth={2.4} aria-hidden="true" />
      {tP('trust_line')}
    </p>
  );

  return (
    <>
      <PricingViewTracker />
      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-20 md:py-28"
        style={{ background: 'linear-gradient(155deg,#001840 0%,#002b6d 50%,#001840 100%)' }}
      >
        <div className="absolute pointer-events-none" style={{ top:'-100px',right:'-60px',width:'560px',height:'560px',background:'radial-gradient(circle,rgba(254,118,44,0.16) 0%,transparent 68%)' }}/>
        <div className="absolute pointer-events-none" style={{ bottom:'-80px',left:'5%',width:'380px',height:'380px',background:'radial-gradient(circle,rgba(254,118,44,0.08) 0%,transparent 70%)' }}/>

        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-14 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6" style={{ background:'rgba(254,118,44,0.15)',border:'1px solid rgba(254,118,44,0.35)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-xs font-bold text-secondary-container uppercase tracking-widest">{tP('hero_badge')}</span>
            </div>

            <h1 className="font-headline font-extrabold text-white leading-tight mb-5" style={{ fontSize:'clamp(1.95rem,4.5vw,3.2rem)',letterSpacing:'-0.03em' }}>
              {tP('hero_heading')}
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              {tP('hero_sub', { price })}
            </p>

            <div className="flex flex-col gap-2.5 mb-10">
              {([
                tP('hero_bullet1', { price }),
                tP('hero_bullet2', { exams: examsPerModule }),
                tP('hero_bullet3'),
                tP('hero_bullet4', { bundle, list }),
                tP('hero_bullet5'),
              ] as string[]).map(b => (
                <div key={b} className="flex items-start gap-3 text-white/85 text-sm font-medium">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <a href="#modules" className={cn(buttonVariants({ variant: 'orange', size: 'cta' }))}>
                <span>{tP('hero_cta')}</span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghostDark', size: 'cta' }))}>
                {tP('hero_ghost')}
              </Link>
            </div>
            <p className="text-white/45 text-sm mt-3">{tP('hero_price_note')}</p>
          </div>

          <div className="hidden lg:block">
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* ── 2. MODULES ──────────────────────────────────────────────────── */}
      <section id="modules" className="py-14 px-6 scroll-mt-8" style={{ background:'linear-gradient(180deg,#eef2ff 0%,#f8f9fb 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">{tP('pricing_eyebrow')}</p>
            <h2 className="font-headline font-extrabold text-on-surface mb-3" style={{ fontSize:'clamp(1.7rem,3.5vw,2.4rem)',letterSpacing:'-0.025em' }}>{tP('pricing_heading')}</h2>
            <p className="text-on-surface-variant text-base max-w-lg mx-auto">{tP('pricing_sub', { price })}</p>
          </div>

          {/* four module cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {a2Modules.map(mod => {
              const skill = getSkill(mod.skill)!;
              return (
                <div
                  key={mod.slug}
                  className="flex flex-col rounded-2xl bg-white border border-outline-variant/60 overflow-hidden"
                  style={{ boxShadow:'0 1px 4px rgba(0,43,109,0.05),0 6px 20px rgba(0,43,109,0.05)' }}
                >
                  <div className="px-5 pt-6 pb-5 flex-1">
                    <SkillIcon skill={mod.skill} size="md" />
                    <h3 className="font-headline font-extrabold text-on-surface text-lg mt-3.5 mb-1">{tS(`${skill.key}.name`)}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4 min-h-[2.6rem]">{tS(`${skill.key}.tagline`)}</p>

                    <div className="flex items-end gap-1.5 mb-5">
                      <span className="font-headline font-extrabold text-4xl text-on-surface leading-none">{euro(mod.priceCents)}</span>
                      <span className="text-xs text-on-surface-variant mb-1">{tP('module_price_note')}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-on-surface font-medium">
                        <CheckGreen /><span>{tP('module_exams', { count: mod.examCount })}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <CheckGreen />
                        <span>{mod.hasRubricFeedback
                          ? tP('module_items_open', { count: formatCount(mod.itemCount) })
                          : tP('module_items', { count: formatCount(mod.itemCount) })}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <CheckGreen /><span>{tP('feat_7')}{soon(FEATURES.leren)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <CheckGreen /><span>{tP('feat_8')}{soon(FEATURES.woordkaarten)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <CheckGreen /><span>{mod.hasRubricFeedback ? tP('module_feedback') : tP('module_explanation')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-4 border-t border-outline-variant/40">
                    <Link
                      href={{ pathname: '/register', query: { module: mod.slug } }}
                      className={cn(buttonVariants({ variant: 'ghostLight', size: 'cta' }), 'w-full justify-center text-sm')}
                    >
                      {tP('module_cta')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* bundle + free, side by side */}
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-stretch pt-4">
            {/* BUNDLE — hero card */}
            <div className="flex flex-col rounded-2xl relative overflow-visible" style={{ background:'linear-gradient(160deg,#001535 0%,#002b6d 55%,#083a8a 100%)', boxShadow:'0 12px 40px rgba(0,43,109,0.30),0 4px 12px rgba(0,43,109,0.18)' }}>
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div style={{ position:'absolute', top:'-60px',right:'-60px',width:'260px',height:'260px',background:'radial-gradient(circle,rgba(254,118,44,0.22) 0%,transparent 65%)' }}/>
                <div style={{ position:'absolute', bottom:'-40px',left:'-40px',width:'180px',height:'180px',background:'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 65%)' }}/>
              </div>
              <span className="absolute -top-3.5 left-8 text-[10px] font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap uppercase tracking-widest z-10" style={{ background:'linear-gradient(135deg,#fe762c,#d94f00)', color:'#fff', boxShadow:'0 2px 8px rgba(254,118,44,0.5)' }}>
                {tP('bundle_badge')}
              </span>

              <div className="px-7 pt-8 pb-6 flex-1 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color:'rgba(254,118,44,0.85)' }}>{tP('bundle_label')}</p>

                <div className="flex items-center gap-2 mb-5">
                  {SKILLS.map(s => <SkillIcon key={s.slug} skill={s.slug} size="sm" onDark />)}
                  <span className="text-xs ml-1" style={{ color:'rgba(255,255,255,0.55)' }}>{tP('bundle_scope')}</span>
                </div>

                <div className="flex items-end gap-2 mb-1 flex-wrap">
                  <span className="font-headline font-extrabold text-5xl text-white leading-none">{bundle}</span>
                  <span className="text-sm mb-1" style={{ color:'rgba(255,255,255,0.5)' }}>{tP('bundle_price_note')}</span>
                  <span className="text-sm mb-1 line-through" style={{ color:'rgba(255,255,255,0.35)' }}>{tP('bundle_was', { list })}</span>
                </div>
                <p className="text-xs font-semibold mb-6" style={{ color:'#4ade80' }}>{tP('bundle_saving', { saving })}</p>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {[
                    tP('bundle_f1', { exams: totalExams }),
                    tP('bundle_f2'),
                    tP('bundle_f3'),
                    tP('bundle_f4'),
                    tP('bundle_f5'),
                  ].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm font-medium" style={{ color:'rgba(255,255,255,0.9)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 px-7 pb-6 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.12)' }}>
                <Link href={{ pathname: '/register', query: { module: 'all' } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}>
                  <span>{tP('bundle_cta')}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                {trustLine(true)}
              </div>
            </div>

            {/* FREE */}
            <div className="flex flex-col rounded-2xl bg-white border border-outline-variant/60 overflow-hidden" style={{ boxShadow:'0 1px 4px rgba(0,43,109,0.05),0 4px 16px rgba(0,43,109,0.04)' }}>
              <div className="px-6 pt-7 pb-5 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">{tP('free_label')}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-headline font-extrabold text-5xl text-on-surface leading-none">€0</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6">{tP('free_price_note')}</p>
                <div className="space-y-2.5">
                  {[tP('free_f1'), tP('free_f2')].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <CheckGreen /><span>{f}</span>
                    </div>
                  ))}
                  {[tP('free_f3'), tP('free_f4')].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color:'#b0b3c1' }}>
                      <XGray /><span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 border-t border-outline-variant/40">
                <Link href="/oefenen" className={cn(buttonVariants({ variant: 'ghostLight', size: 'cta' }), 'w-full justify-center')}>
                  {tP('compare_free_cta')}
                </Link>
              </div>
            </div>
          </div>

          {/* payment badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap mt-10">
            <span className="text-xs text-on-surface-variant font-medium">{tP('payment_label')}</span>
            <svg width="34" height="20" viewBox="0 0 68 42" fill="none"><rect width="68" height="42" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/><text x="34" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill="#c2185b" fontFamily="Arial,sans-serif">iDEAL</text></svg>
            <svg width="34" height="20" viewBox="0 0 52 32" fill="none"><rect width="52" height="32" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/><circle cx="20" cy="16" r="9" fill="#EB001B" opacity="0.9"/><circle cx="32" cy="16" r="9" fill="#F79E1B" opacity="0.9"/><path d="M26 9.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13z" fill="#FF5F00"/></svg>
            <svg width="34" height="20" viewBox="0 0 52 32" fill="none"><rect width="52" height="32" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/><text x="26" y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1A1F71" fontFamily="Arial,sans-serif">VISA</text></svg>
            <span className="text-xs text-on-surface-variant">{tP('trust_note')}</span>
          </div>
        </div>
      </section>

      {/* ── 3. WHAT IS IN A MODULE ──────────────────────────────────────── */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">{tP('features_eyebrow')}</p>
            <h2 className="font-headline font-extrabold text-on-surface mb-4" style={{ fontSize:'clamp(1.7rem,3.5vw,2.6rem)',letterSpacing:'-0.025em' }}>
              {tP('features_heading')}
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto leading-relaxed">
              {tP('features_sub')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { mockup: <ExamensMockup />,      title: tP('feature1_title'),      desc: tP('feature1_desc'),      soon: false },
              { mockup: <LessonMockup />,       title: tP('feature_audio_title'), desc: tP('feature_audio_desc'), soon: !FEATURES.leren },
              { mockup: <WoordenlijstMockup />, title: tP('feature2_title'),      desc: tP('feature2_desc'),      soon: !FEATURES.woordkaarten },
              { mockup: <FeedbackMockup />,     title: tP('feature3_title'),      desc: tP('feature3_desc'),      soon: false },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden flex flex-col" style={{ boxShadow:'0 2px 8px rgba(0,43,109,0.04),0 10px 32px rgba(0,43,109,0.07)' }}>
                {f.mockup}
                <div className="p-5 flex-1">
                  <h3 className="font-headline font-extrabold text-on-surface text-base mb-2 leading-snug">
                    {f.title}{f.soon ? soon(false) : null}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            <TeacherCard
              variant="compact"
              quote="Alle opgaven zijn door mij persoonlijk geschreven of gecontroleerd. Geen AI-gegenereerde content. De beoordelingsrubric voor Schrijven en Spreken komt ook van mij — ik controleer de beoordelingen en stuur bij waar nodig."
              stats={[{ value: '10+', label: 'jaar ervaring' }, { value: String(totalExams), label: 'oefenexamens' }]}
            />
            <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden" style={{ boxShadow:'0 2px 8px rgba(0,43,109,0.04),0 10px 32px rgba(0,43,109,0.07)' }}>
              <RubricMockup />
              <div className="p-5">
                <h3 className="font-headline font-extrabold text-on-surface text-base mb-2 leading-snug">{tP('feature4_title')}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{tP('feature4_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. COMPARISON + FAQ ─────────────────────────────────────────── */}
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant text-center mb-6">{tP('plans_compare')}</p>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden" style={{ boxShadow:'0 2px 8px rgba(0,43,109,0.04)' }}>
                <div className="grid grid-cols-[1fr_110px_140px_160px] border-b border-outline-variant/50 text-center text-xs font-bold uppercase tracking-wider">
                  <div className="px-5 py-3.5 text-left text-on-surface-variant" />
                  <div className="px-3 py-3.5 border-l border-outline-variant/30 text-on-surface-variant">{tP('col_free')}</div>
                  <div className="px-3 py-3.5 border-l border-outline-variant/30" style={{ color:'#002b6d', background:'rgba(240,244,255,0.7)' }}>
                    {tP('col_module')}<span className="block font-normal normal-case tracking-normal mt-0.5 text-[11px]">{price}</span>
                  </div>
                  <div className="px-3 py-3.5 border-l border-outline-variant/30 text-white" style={{ background:'#002b6d' }}>
                    {tP('col_bundle')}<span className="block font-normal normal-case tracking-normal mt-0.5 text-[11px] text-white/70">{bundle}</span>
                  </div>
                </div>
                {allFeatures.map((f, i) => (
                  <div key={f.label} className={cn('grid grid-cols-[1fr_110px_140px_160px]', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70')}>
                    <div className="px-5 py-3 text-sm text-on-surface">{f.label}{f.soon ? soon(false) : null}</div>
                    <div className="px-3 py-3 flex items-center justify-center border-l border-outline-variant/20">
                      {cell(f.free)}
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center border-l border-outline-variant/20" style={{ background: i % 2 === 0 ? 'rgba(240,244,255,0.6)' : 'rgba(240,244,255,0.35)' }}>
                      {cell(f.module)}
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center border-l border-outline-variant/20" style={{ background: i % 2 === 0 ? 'rgba(0,43,109,0.06)' : 'rgba(0,43,109,0.03)' }}>
                      {cell(f.bundle)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_110px_140px_160px] border-t border-outline-variant/50 bg-white">
                  <div className="px-5 py-4" />
                  <div className="px-3 py-4 flex items-center justify-center border-l border-outline-variant/20">
                    <Link href="/oefenen" className={cn(buttonVariants({ variant: 'ghostLight', size: 'sm' }), 'text-xs whitespace-nowrap')}>
                      {tP('compare_free_cta')}
                    </Link>
                  </div>
                  <div className="px-3 py-4 flex items-center justify-center border-l border-outline-variant/20" style={{ background:'rgba(240,244,255,0.5)' }}>
                    <a href="#modules" className={cn(buttonVariants({ variant: 'ghostLight', size: 'sm' }), 'text-xs whitespace-nowrap')}>
                      {tP('module_cta')}
                    </a>
                  </div>
                  <div className="px-3 py-4 flex items-center justify-center border-l border-outline-variant/20" style={{ background:'rgba(0,43,109,0.05)' }}>
                    <Link href={{ pathname: '/register', query: { module: 'all' } }} className={cn(buttonVariants({ variant: 'orange', size: 'sm' }), 'text-xs whitespace-nowrap')}>
                      {tP('bundle_cta')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE ACCORDIONS */}
            <div className="md:hidden space-y-3">
              {([
                {
                  label: tP('col_free'), priceLabel: '€0', note: '',
                  color: '#747782', bg: '#fff', borderStyle: '1px solid #e0e3e8',
                  dark: false,
                  features: allFeatures.map(f => ({ label: f.label, soon: f.soon, has: f.free })),
                  cta: <Link href="/oefenen" className={cn(buttonVariants({ variant: 'ghostLight', size: 'cta' }), 'w-full justify-center')}>{tP('compare_free_cta')}</Link>,
                },
                {
                  label: tP('col_module'), priceLabel: price, note: tP('module_price_note'),
                  color: '#002b6d', bg: '#fff', borderStyle: '2px solid #002b6d',
                  dark: false,
                  features: allFeatures.map(f => ({ label: f.label, soon: f.soon, has: f.module })),
                  cta: <a href="#modules" className={cn(buttonVariants({ variant: 'ghostLight', size: 'cta' }), 'w-full justify-center')}>{tP('module_cta')}</a>,
                },
                {
                  label: tP('col_bundle'), priceLabel: bundle, note: tP('bundle_price_note'),
                  color: '#fe762c', bg: 'linear-gradient(155deg,#001535 0%,#002b6d 60%,#083a8a 100%)', borderStyle: 'none',
                  dark: true,
                  features: allFeatures.map(f => ({ label: f.label, soon: f.soon, has: f.bundle })),
                  cta: <Link href={{ pathname: '/register', query: { module: 'all' } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}><span>{tP('bundle_cta')}</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></Link>,
                },
              ] as const).map(plan => (
                <details key={plan.label} className="rounded-2xl overflow-hidden" style={{ background: plan.bg, border: plan.borderStyle, boxShadow:'0 2px 12px rgba(0,43,109,0.08)' }}>
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: plan.color }}>{plan.label}</p>
                      <div className="flex items-end gap-1 mt-0.5">
                        <span className="font-headline font-extrabold text-2xl leading-none" style={{ color: plan.dark ? '#fff' : '#191c1e' }}>{plan.priceLabel}</span>
                        {plan.note && <span className="text-xs mb-0.5" style={{ color: plan.dark ? 'rgba(255,255,255,0.5)' : '#747782' }}>{plan.note}</span>}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? 'rgba(255,255,255,0.5)' : '#747782'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </summary>
                  <div className="px-5 pb-5 pt-1" style={{ borderTop: plan.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #eceef0' }}>
                    <div className="space-y-2.5 mb-5 pt-4">
                      {plan.features.map(f => (
                        <div key={f.label} className="flex items-start gap-2.5 text-sm" style={{ color: f.has ? (plan.dark ? 'rgba(255,255,255,0.9)' : '#191c1e') : (plan.dark ? 'rgba(255,255,255,0.3)' : '#b0b3c1') }}>
                          {f.has === 'partial'
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? '#4ade80' : '#1a7a3c'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                            : f.has
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? '#4ade80' : '#1a7a3c'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? 'rgba(255,255,255,0.25)' : '#c4c6d2'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                          <span>
                            {f.label}
                            {f.has === 'partial' && (
                              <span className="ml-1.5 align-middle text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: plan.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,43,109,0.07)', color: plan.dark ? 'rgba(255,255,255,0.8)' : '#5a6070' }}>
                                {tP('cell_partial')}
                              </span>
                            )}
                            {f.soon && f.has ? soon(false) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                    {plan.cta}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* FAQ + final CTA */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="space-y-3">
              {[
                { q: tP('faq_q1'), a: tP('faq_a1', { price }) },
                { q: tP('faq_q2'), a: tP('faq_a2', { bundle, list, saving }) },
                { q: tP('faq_q3'), a: tP('faq_a3') },
                { q: tP('faq_q4'), a: tP('faq_a4') },
                { q: tP('faq_q5'), a: tP('faq_a5') },
                { q: tP('faq_q6'), a: tP('faq_a6') },
              ].map(faq => (
                <div key={faq.q} className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden" style={{ boxShadow:'0 2px 8px rgba(0,43,109,0.04)' }}>
                  <details>
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-semibold text-on-surface text-sm list-none">
                      <span>{faq.q}</span>
                      <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#747782" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/30 pt-3">
                      {faq.a}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 text-center" style={{ background:'linear-gradient(135deg,#002b6d,#0044ad)',boxShadow:'0 4px 16px rgba(0,43,109,0.25)' }}>
              <p className="font-headline font-extrabold text-white text-lg mb-1">{tP('final_cta_heading')}</p>
              <p className="text-white/65 text-sm mb-5">{tP('final_cta_sub')}</p>
              <div className="flex flex-col gap-2">
                <Link href={{ pathname: '/register', query: { module: 'all' } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}>
                  <span>{tP('bundle_cta')} — {bundle}</span>
                </Link>
                <a href="#modules" className={cn(buttonVariants({ variant: 'ghostDark', size: 'cta' }), 'w-full justify-center text-sm')}>
                  {tP('module_cta')} — {price}
                </a>
              </div>
              <p className="text-white/40 text-xs mt-3 flex items-center justify-center gap-1.5">
                <RefreshCw size={10} strokeWidth={2.4} aria-hidden="true" />
                {tP('trust_note').replace(/^·\s*/, '')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
