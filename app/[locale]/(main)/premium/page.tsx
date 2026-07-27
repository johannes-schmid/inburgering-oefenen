import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { TeacherCard } from '@/components/site';
import PricingViewTracker from '@/components/PricingViewTracker';

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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a7a3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const XGray = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4c6d2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const StarFilled = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fe762c" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const Stars = () => <div className="flex items-center gap-0.5 mb-3">{[1,2,3,4,5].map(i => <StarFilled key={i}/>)}</div>;

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
        <div style={{ width:'160px',minWidth:'160px',background:'#fff',borderRight:'1px solid #e6e8ea',display:'flex',flexDirection:'column' }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid #eceef0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <span style={{ width:'4px',height:'16px',background:'#fe762c',borderRadius:'2px',display:'block' }}/>
              <span style={{ fontFamily:'var(--font-headline)',fontWeight:800,color:'#002b6d',fontSize:'12px' }}>Inburgering Oefenen</span>
            </div>
            <p style={{ fontSize:'9px',color:'#747782',marginTop:'2px',paddingLeft:'10px' }}>Studieportaal</p>
          </div>
          <nav style={{ padding:'8px',display:'flex',flexDirection:'column',gap:'2px' }}>
            {[
              { label:'Proefexamens', active:true, icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
              { label:'Leren', active:false, icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
              { label:'Woordkaarten', active:false, icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
              { label:'Mijn Profiel', active:false, icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            ].map(item => (
              <div key={item.label} style={{ display:'flex',alignItems:'center',gap:'7px',padding:'7px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:item.active?700:500,color:item.active?'#002b6d':'#434651',background:item.active?'#EEF2FF':undefined }}>
                {item.icon}{item.label}
              </div>
            ))}
          </nav>
          <div style={{ marginTop:'auto',padding:'8px' }}>
            <div style={{ background:'linear-gradient(135deg,#fe762c,#d94f00)',color:'#fff',fontSize:'10px',fontWeight:700,borderRadius:'8px',padding:'8px 10px',textAlign:'center' }}>Start Oefenen</div>
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
              <p style={{ fontFamily:'var(--font-headline)',fontWeight:700,color:'#002b6d',fontSize:'12px',lineHeight:1.3 }}>Welkom bij je Studieportaal</p>
              <p style={{ fontSize:'10px',color:'#747782',marginTop:'3px' }}>6 van 10 examens voltooid. Goed bezig!</p>
              <div style={{ display:'flex',gap:'6px',marginTop:'6px',flexWrap:'wrap' }}>
                <span style={{ fontSize:'9px',fontWeight:600,background:'#f2f4f6',color:'#434651',padding:'2px 6px',borderRadius:'99px' }}>6 examens voltooid</span>
                <span style={{ fontSize:'9px',fontWeight:700,background:'#f0fdf4',color:'#15803d',padding:'2px 6px',borderRadius:'99px',border:'1px solid rgba(22,163,74,0.2)' }}>Gem. 79%</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize:'10px',fontWeight:700,color:'#191c1e',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#002b6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Proefexamens
            <span style={{ color:'#747782',fontWeight:400,marginLeft:'auto' }}>10 EXAMENS</span>
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px' }}>
            {[
              { n:1, s:'84%', pass:true },
              { n:2, s:'76%', pass:true },
              { n:4, locked:true },
            ].map(ex => (
              <div key={ex.n} style={{ background:ex.locked?'#f8f9fb':'#fff',border:'1px solid #eceef0',borderRadius:'8px',padding:'10px',opacity:ex.locked?0.55:1 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px' }}>
                  <span style={{ fontSize:'9px',fontWeight:700,color:ex.locked?'#747782':'#191c1e' }}>Examen {ex.n}</span>
                  {ex.pass && <span style={{ fontSize:'8px',fontWeight:700,color:'#15803d',background:'#f0fdf4',padding:'2px 5px',borderRadius:'99px' }}>✓ Gesl.</span>}
                  {ex.locked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#747782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                </div>
                {ex.s && <div style={{ fontFamily:'var(--font-headline)',fontWeight:800,fontSize:'18px',color:'#002b6d',lineHeight:1 }}>{ex.s}</div>}
                {ex.locked && <div style={{ fontSize:'9px',color:'#747782',marginTop:'4px' }}>🔒 Upgrade vereist</div>}
                {ex.s && <div style={{ height:'4px',background:'#f2f4f6',borderRadius:'99px',marginTop:'6px',overflow:'hidden' }}><div style={{ height:'100%',background:'#22c55e',borderRadius:'99px',width:ex.s }}/></div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop:'12px',background:'#fff',border:'1px solid #eceef0',borderRadius:'8px',padding:'12px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px' }}>
              <span style={{ fontSize:'10px',fontWeight:700,color:'#191c1e' }}>Woordkaarten</span>
              <span style={{ fontSize:'8px',fontWeight:700,color:'#002b6d',background:'#eff6ff',padding:'2px 6px',borderRadius:'99px' }}>7 thema&apos;s</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
              <div style={{ flex:1,height:'6px',background:'#f2f4f6',borderRadius:'99px',overflow:'hidden' }}>
                <div style={{ height:'100%',width:'58%',borderRadius:'99px',background:'linear-gradient(90deg,#002b6d,#fe762c)' }}/>
              </div>
              <span style={{ fontSize:'10px',fontWeight:800,color:'#002b6d',fontFamily:'var(--font-headline)' }}>212/366</span>
            </div>
            <p style={{ fontSize:'9px',color:'#747782',marginTop:'6px' }}>Vertalingen in Engels, Arabisch en Turks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature mockups ───────────────────────────────────────────────────── */
function ExamensMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div className="space-y-2">
        {[
          { n:1, s:'84%', pass:true },
          { n:2, s:'91%', pass:true },
          { n:3, locked:true },
        ].map(ex => (
          <div key={ex.n} style={{ background:'#fff',border:'1px solid #eceef0',borderRadius:'12px',padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',opacity:ex.locked?0.5:1 }}>
            <div>
              <p style={{ fontSize:'12px',fontWeight:700,color:'#191c1e' }}>Proefexamen {ex.n}</p>
              <p style={{ fontSize:'10px',color:'#747782' }}>45 vragen</p>
            </div>
            <div style={{ textAlign:'right' }}>
              {ex.s && <>
                <p style={{ fontFamily:'var(--font-headline)',fontWeight:800,fontSize:'18px',color:'#002b6d',lineHeight:1 }}>{ex.s}</p>
                <span style={{ fontSize:'9px',fontWeight:700,color:'#15803d',background:'#f0fdf4',padding:'2px 6px',borderRadius:'99px' }}>✓ Geslaagd</span>
              </>}
              {ex.locked && <div style={{ display:'flex',alignItems:'center',gap:'4px',fontSize:'10px',color:'#747782' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Upgrade</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',padding:'12px',marginBottom:'10px' }}>
        <p style={{ fontSize:'10px',fontWeight:600,color:'#191c1e',marginBottom:'10px',lineHeight:1.4 }}>Wat is de naam van het Nederlandse parlement?</p>
        <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',background:'#f8f9fb',opacity:0.5 }}>
            <span style={{ width:'20px',height:'20px',background:'#eceef0',color:'#747782',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0 }}>A</span>
            <span style={{ fontSize:'10px',color:'#747782' }}>De Tweede Kamer</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',border:'2px solid #4ade80',background:'#f0fdf4' }}>
            <span style={{ width:'20px',height:'20px',background:'#dcfce7',color:'#15803d',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0 }}>B</span>
            <span style={{ fontSize:'10px',color:'#15803d',fontWeight:600 }}>De Staten-Generaal ✓</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',border:'1px solid #fca5a5',background:'#fef2f2',opacity:0.6 }}>
            <span style={{ width:'20px',height:'20px',background:'#fee2e2',color:'#dc2626',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0 }}>C</span>
            <span style={{ fontSize:'10px',color:'#dc2626',textDecoration:'line-through' }}>De Eerste Kamer</span>
          </div>
        </div>
      </div>
      <div style={{ background:'#eff6ff',borderRadius:'12px',border:'1px solid rgba(59,130,246,0.2)',padding:'12px' }}>
        <p style={{ fontSize:'9px',fontWeight:700,color:'#002b6d',marginBottom:'4px',display:'flex',alignItems:'center',gap:'4px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Uitleg van de docent
        </p>
        <p style={{ fontSize:'9px',color:'rgba(0,43,109,0.75)',lineHeight:1.5 }}>De Staten-Generaal is het officiële parlement, bestaande uit de Eerste én Tweede Kamer samen.</p>
      </div>
    </div>
  );
}

function AudioMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      {/* thema header */}
      <div style={{ background:'linear-gradient(135deg,#002b6d,#0044ad)',borderRadius:'12px',padding:'12px 14px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'10px' }}>
        <span style={{ fontSize:'18px' }}>🏛️</span>
        <div>
          <p style={{ fontSize:'8px',fontWeight:700,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:'0.06em' }}>Thema 2</p>
          <p style={{ fontSize:'11px',fontWeight:800,color:'#fff',lineHeight:1.2 }}>Overheid &amp; Democratie</p>
        </div>
      </div>
      {/* audio player */}
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',overflow:'hidden' }}>
        <div style={{ padding:'10px 14px 8px',borderBottom:'1px solid #eceef0' }}>
          <p style={{ fontSize:'8px',fontWeight:700,color:'#fe762c',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'1px' }}>Audio les</p>
          <p style={{ fontSize:'11px',fontWeight:700,color:'#191c1e' }}>Luister naar de uitleg</p>
        </div>
        <div style={{ padding:'10px 14px 12px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px' }}>
            <div style={{ width:'32px',height:'32px',borderRadius:'50%',background:'#fe762c',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'10px',fontWeight:600,color:'#191c1e',marginBottom:'2px' }}>Speelt...</p>
              <p style={{ fontSize:'9px',color:'#747782' }}>Druk op pauze om te stoppen</p>
            </div>
            <span style={{ fontSize:'10px',color:'#747782',fontVariantNumeric:'tabular-nums' }}>2:34</span>
          </div>
          {/* progress bar */}
          <div style={{ height:'6px',background:'#f2f4f6',borderRadius:'99px',overflow:'hidden',marginBottom:'8px' }}>
            <div style={{ height:'100%',width:'42%',background:'#fe762c',borderRadius:'99px' }}/>
          </div>
          {/* subtitle strip */}
          <div style={{ background:'#f8f9fb',borderRadius:'8px',padding:'8px 10px' }}>
            <p style={{ fontSize:'9px',color:'#434651',lineHeight:1.5 }}>
              &ldquo;Nederland heeft een tweekamerstelsel. Het parlement heet de <strong>Staten-Generaal</strong> en bestaat uit de Eerste en Tweede Kamer.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



function DashboardMockup() {
  return (
    <div style={{ padding:'20px', background:'#f8f9fb', borderBottom:'1px solid #eceef0' }}>
      <div style={{ background:'#fff',borderRadius:'12px',border:'1px solid #eceef0',padding:'12px',marginBottom:'10px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px' }}>
          <div style={{ width:'32px',height:'32px',borderRadius:'50%',background:'#002b6d',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <span style={{ color:'#fff',fontWeight:700,fontSize:'12px' }}>A</span>
          </div>
          <div>
            <p style={{ fontSize:'10px',fontWeight:700,color:'#191c1e' }}>ahmed@example.com</p>
            <p style={{ fontSize:'9px',color:'#747782' }}>Compleet Pakket</p>
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',paddingTop:'10px',borderTop:'1px solid #eceef0' }}>
          {[{ v:'7',l:'Examens' },{ v:'81%',l:'Gemiddeld' },{ v:'91%',l:'Beste',green:true }].map(s => (
            <div key={s.l} style={{ textAlign:'center' }}>
              <p style={{ fontFamily:'var(--font-headline)',fontWeight:800,fontSize:'18px',color:s.green?'#15803d':'#002b6d',lineHeight:1 }}>{s.v}</p>
              <p style={{ fontSize:'8px',color:'#747782',marginTop:'2px' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      {[{ n:7,s:'91%' },{ n:6,s:'78%' }].map(ex => (
        <div key={ex.n} style={{ background:'#fff',borderRadius:'8px',border:'1px solid #eceef0',padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px' }}>
          <span style={{ fontSize:'10px',fontWeight:600,color:'#191c1e' }}>Proefexamen {ex.n}</span>
          <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
            <div style={{ width:'80px',height:'4px',background:'#f2f4f6',borderRadius:'99px',overflow:'hidden' }}>
              <div style={{ height:'100%',background:'#22c55e',borderRadius:'99px',width:ex.s }}/>
            </div>
            <span style={{ fontSize:'10px',fontWeight:800,color:'#15803d',fontFamily:'var(--font-headline)',width:'24px' }}>{ex.s}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default async function PremiumPage({ params }: Props) {
  const { locale } = await params;
  const tP = await getTranslations({ locale, namespace: 'premium_page' });

  const allFeatures: { label: string; free: boolean; premium: boolean; compleet: boolean }[] = [
    { label: tP('feat_1'),         free: true,  premium: true,  compleet: true  },
    { label: tP('feat_2'),         free: false, premium: true,  compleet: true  },
    { label: tP('feat_3'),         free: true,  premium: true,  compleet: true  },
    { label: tP('feat_4'),         free: false, premium: true,  compleet: true  },
    { label: tP('feat_5'),         free: false, premium: true,  compleet: true  },
    { label: tP('feat_6'),         free: false, premium: true,  compleet: true  },
    { label: tP('feat_7'),         free: false, premium: true,  compleet: true  },
    { label: tP('feat_8'),         free: false, premium: true,  compleet: true  },
    { label: tP('feat_9'),         free: false, premium: false, compleet: true  },
    { label: tP('feat_leren_1'),   free: true,  premium: true,  compleet: true  },
    { label: tP('feat_leren_all'), free: false, premium: false, compleet: true  },
  ];

  const trustLine = (dark = false) => (
    <p className="text-center text-xs mt-3 flex items-center justify-center gap-1.5" style={{ color: dark ? 'rgba(255,255,255,0.4)' : '#9ba1b0' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Eénmalig betalen · geen abonnement · directe toegang
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

            <h1 className="font-headline font-extrabold text-white leading-tight mb-5" style={{ fontSize:'clamp(2rem,4.5vw,3.2rem)',letterSpacing:'-0.03em' }}>
              {tP('hero_heading')}
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              {tP('hero_sub')}
            </p>

            <div className="flex flex-col gap-2.5 mb-10">
              {([tP('hero_bullet1'), tP('hero_bullet2'), tP('hero_bullet3'), tP('hero_bullet4'), tP('hero_bullet5')] as string[]).map(b => (
                <div key={b} className="flex items-center gap-3 text-white/85 text-sm font-medium">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Link href="/register" className={cn(buttonVariants({ variant: 'orange', size: 'cta' }))}>
                <span>{tP('hero_cta')}</span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
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

      {/* ── 2. PRICING (moved up — immediately after hero) ───────────────── */}
      <section className="py-14 px-6 overflow-visible" style={{ background:'linear-gradient(180deg,#eef2ff 0%,#f8f9fb 100%)' }}>
        <div className="max-w-5xl mx-auto overflow-visible">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">{tP('pricing_eyebrow')}</p>
            <h2 className="font-headline font-extrabold text-on-surface mb-3" style={{ fontSize:'clamp(1.7rem,3.5vw,2.4rem)',letterSpacing:'-0.025em' }}>{tP('pricing_heading')}</h2>
            <p className="text-on-surface-variant text-base max-w-md mx-auto">{tP('pricing_sub')}</p>
          </div>

          {/* 3-plan card grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-6 items-end pt-5">

            {/* FREE */}
            <div className="flex flex-col rounded-2xl bg-white border border-outline-variant/60 overflow-hidden" style={{ boxShadow:'0 1px 4px rgba(0,43,109,0.05),0 4px 16px rgba(0,43,109,0.04)' }}>
              <div className="px-6 pt-7 pb-5 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">{tP('free_label')}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-headline font-extrabold text-5xl text-on-surface leading-none">€0</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6">— geen betaling vereist</p>
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
                <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghostLight', size: 'cta' }), 'w-full justify-center')}>
                  {tP('compare_free_cta')}
                </Link>
              </div>
            </div>

            {/* PREMIUM — popular */}
            <div className="flex flex-col rounded-2xl relative overflow-visible" style={{ background:'#fff', border:'2px solid #002b6d', boxShadow:'0 8px 30px rgba(0,43,109,0.16),0 2px 8px rgba(0,43,109,0.08)' }}>
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-secondary-container text-white px-3.5 py-1.5 rounded-full whitespace-nowrap uppercase tracking-widest z-10">
                {tP('pro2_badge')}
              </span>
              <div className="px-6 pt-8 pb-5 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:'#002b6d' }}>{tP('pro2_label')}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-headline font-extrabold text-5xl text-on-surface leading-none">{tP('pro2_price')}</span>
                  <span className="text-sm text-on-surface-variant mb-1">{tP('pro2_note')}</span>
                </div>
                <p className="text-xs font-semibold text-green-700 mb-6">✓ {tP('pro2_lifetime')}</p>
                <div className="space-y-2.5">
                  {[tP('pro2_f1'), tP('pro2_f2'), tP('pro2_f3'), tP('pro2_f4'), tP('pro2_f5')].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm text-on-surface font-medium">
                      <CheckGreen /><span>{f}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2.5 text-sm pt-2 border-t border-outline-variant/30 mt-1" style={{ color:'#b0b3c1' }}>
                    <XGray /><span>{tP('feat_leren_all')}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 border-t border-outline-variant/30">
                <Link href={{ pathname: "/register", query: { plan: "premium" } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}>
                  <span>{tP('pro2_cta')}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                {trustLine()}
              </div>
            </div>

            {/* COMPLEET — hero card */}
            <div className="flex flex-col rounded-2xl relative overflow-visible" style={{ background:'linear-gradient(160deg,#001535 0%,#002b6d 55%,#083a8a 100%)', boxShadow:'0 12px 40px rgba(0,43,109,0.30),0 4px 12px rgba(0,43,109,0.18)' }}>
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div style={{ position:'absolute', top:'-60px',right:'-60px',width:'240px',height:'240px',background:'radial-gradient(circle,rgba(254,118,44,0.22) 0%,transparent 65%)' }}/>
                <div style={{ position:'absolute', bottom:'-40px',left:'-40px',width:'180px',height:'180px',background:'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 65%)' }}/>
              </div>
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap uppercase tracking-widest z-10" style={{ background:'linear-gradient(135deg,#fe762c,#d94f00)', color:'#fff', boxShadow:'0 2px 8px rgba(254,118,44,0.5)' }}>
                {tP('compleet_badge')}
              </span>
              <div className="px-6 pt-8 pb-5 flex-1 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:'rgba(254,118,44,0.85)' }}>{tP('compleet_label')}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-headline font-extrabold text-5xl text-white leading-none">{tP('compleet_price')}</span>
                  <span className="text-sm mb-1" style={{ color:'rgba(255,255,255,0.5)' }}>{tP('compleet_note')}</span>
                </div>
                <p className="text-xs font-semibold mb-6" style={{ color:'#4ade80' }}>✓ {tP('compleet_lifetime')}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4" style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.15)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {tP('compleet_f1')}
                </div>
                <div className="space-y-2.5">
                  {[tP('compleet_f2'), tP('compleet_f3')].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm font-medium" style={{ color:'rgba(255,255,255,0.9)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 px-6 pb-6 pt-4 flex flex-col gap-2" style={{ borderTop:'1px solid rgba(255,255,255,0.12)' }}>
                <Link href={{ pathname: "/register", query: { plan: "compleet" } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}>
                  <span>{tP('compleet_cta')}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                {trustLine(true)}
              </div>
            </div>
          </div>

          {/* payment badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
            <span className="text-xs text-on-surface-variant font-medium">{tP('payment_label')}</span>
            <svg width="34" height="20" viewBox="0 0 68 42" fill="none"><rect width="68" height="42" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/><text x="34" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill="#c2185b" fontFamily="Arial,sans-serif">iDEAL</text></svg>
            <svg width="34" height="20" viewBox="0 0 52 32" fill="none"><rect width="52" height="32" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/><circle cx="20" cy="16" r="9" fill="#EB001B" opacity="0.9"/><circle cx="32" cy="16" r="9" fill="#F79E1B" opacity="0.9"/><path d="M26 9.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13z" fill="#FF5F00"/></svg>
            <svg width="34" height="20" viewBox="0 0 52 32" fill="none"><rect width="52" height="32" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/><text x="26" y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1A1F71" fontFamily="Arial,sans-serif">VISA</text></svg>
            <span className="text-xs text-on-surface-variant">{tP('trust_note')}</span>
          </div>

        </div>
      </section>

      {/* ── 3. FEATURE CARDS ─────────────────────────────────────────────── */}
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
              { mockup: <ExamensMockup />, title: tP('feature1_title'), desc: tP('feature1_desc') },
              { mockup: <AudioMockup />, title: tP('feature_audio_title'), desc: tP('feature_audio_desc') },
              { mockup: <FeedbackMockup />, title: tP('feature2_title'), desc: tP('feature2_desc') },
              { mockup: <DashboardMockup />, title: tP('feature3_title'), desc: tP('feature3_desc') },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden flex flex-col" style={{ boxShadow:'0 2px 8px rgba(0,43,109,0.04),0 10px 32px rgba(0,43,109,0.07)' }}>
                {f.mockup}
                <div className="p-5 flex-1">
                  <h3 className="font-headline font-extrabold text-on-surface text-base mb-2 leading-snug">{f.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <TeacherCard
            variant="compact"
            quote="Alle opgaven zijn door mij persoonlijk geschreven of gecontroleerd. Geen AI-gegenereerde content. De beoordelingsrubric voor Schrijven en Spreken komt ook van mij — ik controleer de beoordelingen en stuur bij waar nodig."
            stats={[{ value: '10+', label: 'jaar ervaring' }, { value: '40', label: 'oefenexamens' }]}
          />
        </div>
      </section>

      {/* ── 5. COMPARISON TABLE + FAQ ─────────────────────────────────────── */}
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant text-center mb-6">{tP('plans_compare')}</p>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden" style={{ boxShadow:'0 2px 8px rgba(0,43,109,0.04)' }}>
                <div className="grid grid-cols-[1fr_110px_130px_150px] border-b border-outline-variant/50 text-center text-xs font-bold uppercase tracking-wider">
                  <div className="px-5 py-3.5 text-left text-on-surface-variant" />
                  <div className="px-3 py-3.5 border-l border-outline-variant/30 text-on-surface-variant">{tP('free_label')}</div>
                  <div className="px-3 py-3.5 border-l border-outline-variant/30" style={{ color:'#002b6d', background:'rgba(240,244,255,0.7)' }}>{tP('pro2_label')}</div>
                  <div className="px-3 py-3.5 border-l border-outline-variant/30 text-white" style={{ background:'#002b6d' }}>{tP('compleet_label')}</div>
                </div>
                {allFeatures.map((f, i) => (
                  <div key={f.label} className={cn('grid grid-cols-[1fr_110px_130px_150px]', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70')}>
                    <div className="px-5 py-3 text-sm text-on-surface">{f.label}</div>
                    <div className="px-3 py-3 flex items-center justify-center border-l border-outline-variant/20">
                      {f.free ? <CheckGreen /> : <XGray />}
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center border-l border-outline-variant/20" style={{ background: i % 2 === 0 ? 'rgba(240,244,255,0.6)' : 'rgba(240,244,255,0.35)' }}>
                      {f.premium ? <CheckGreen /> : <XGray />}
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center border-l border-outline-variant/20" style={{ background: i % 2 === 0 ? 'rgba(0,43,109,0.06)' : 'rgba(0,43,109,0.03)' }}>
                      {f.compleet ? <CheckGreen /> : <XGray />}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_110px_130px_150px] border-t border-outline-variant/50 bg-white">
                  <div className="px-5 py-4" />
                  <div className="px-3 py-4 flex items-center justify-center border-l border-outline-variant/20">
                    <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghostLight', size: 'sm' }), 'text-xs whitespace-nowrap')}>
                      {tP('compare_free_cta')}
                    </Link>
                  </div>
                  <div className="px-3 py-4 flex items-center justify-center border-l border-outline-variant/20" style={{ background:'rgba(240,244,255,0.5)' }}>
                    <Link href={{ pathname: "/register", query: { plan: "premium" } }} className={cn(buttonVariants({ variant: 'orange', size: 'sm' }), 'text-xs whitespace-nowrap')}>
                      {tP('pro2_cta')}
                    </Link>
                  </div>
                  <div className="px-3 py-4 flex items-center justify-center border-l border-outline-variant/20" style={{ background:'rgba(0,43,109,0.05)' }}>
                    <Link href={{ pathname: "/register", query: { plan: "compleet" } }} className={cn(buttonVariants({ variant: 'orange', size: 'sm' }), 'text-xs whitespace-nowrap')}>
                      {tP('compleet_cta')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE ACCORDIONS */}
            <div className="md:hidden space-y-3">
              {([
                {
                  label: tP('free_label'), price: '€0', note: '',
                  color: '#747782', bg: '#fff', borderStyle: '1px solid #e0e3e8',
                  dark: false,
                  features: allFeatures.map(f => ({ label: f.label, has: f.free })),
                  cta: <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghostLight', size: 'cta' }), 'w-full justify-center')}>{tP('compare_free_cta')}</Link>,
                },
                {
                  label: tP('pro2_label'), price: tP('pro2_price'), note: tP('pro2_note'),
                  color: '#002b6d', bg: '#fff', borderStyle: '2px solid #002b6d',
                  dark: false,
                  features: allFeatures.map(f => ({ label: f.label, has: f.premium })),
                  cta: <Link href={{ pathname: "/register", query: { plan: "premium" } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}><span>{tP('pro2_cta')}</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></Link>,
                },
                {
                  label: tP('compleet_label'), price: tP('compleet_price'), note: tP('compleet_note'),
                  color: '#fe762c', bg: 'linear-gradient(155deg,#001535 0%,#002b6d 60%,#083a8a 100%)', borderStyle: 'none',
                  dark: true,
                  features: allFeatures.map(f => ({ label: f.label, has: f.compleet })),
                  cta: <Link href={{ pathname: "/register", query: { plan: "compleet" } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}><span>{tP('compleet_cta')}</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></Link>,
                },
              ] as const).map(plan => (
                <details key={plan.label} className="rounded-2xl overflow-hidden" style={{ background: plan.bg, border: plan.borderStyle, boxShadow:'0 2px 12px rgba(0,43,109,0.08)' }}>
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: plan.color }}>{plan.label}</p>
                        <div className="flex items-end gap-1 mt-0.5">
                          <span className="font-headline font-extrabold text-2xl leading-none" style={{ color: plan.dark ? '#fff' : '#191c1e' }}>{plan.price}</span>
                          {plan.note && <span className="text-xs mb-0.5" style={{ color: plan.dark ? 'rgba(255,255,255,0.5)' : '#747782' }}>{plan.note}</span>}
                        </div>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? 'rgba(255,255,255,0.5)' : '#747782'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </summary>
                  <div className="px-5 pb-5 pt-1" style={{ borderTop: plan.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #eceef0' }}>
                    <div className="space-y-2.5 mb-5 pt-4">
                      {plan.features.map(f => (
                        <div key={f.label} className="flex items-start gap-2.5 text-sm" style={{ color: f.has ? (plan.dark ? 'rgba(255,255,255,0.9)' : '#191c1e') : (plan.dark ? 'rgba(255,255,255,0.3)' : '#b0b3c1') }}>
                          {f.has
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? '#4ade80' : '#1a7a3c'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.dark ? 'rgba(255,255,255,0.25)' : '#c4c6d2'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                          <span>{f.label}</span>
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
                { q: tP('faq_q1'), a: tP('faq_a1') },
                { q: tP('faq_q2'), a: tP('faq_a2') },
                { q: tP('faq_q3'), a: tP('faq_a3') },
                { q: tP('faq_q4'), a: tP('faq_a4') },
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
                <Link href={{ pathname: "/register", query: { plan: "compleet" } }} className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full justify-center')}>
                  <span>{tP('compleet_cta')}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <Link href={{ pathname: "/register", query: { plan: "premium" } }} className={cn(buttonVariants({ variant: 'ghostDark', size: 'cta' }), 'w-full justify-center text-sm')}>
                  {tP('pro2_cta')} — {tP('pro2_price')}
                </Link>
              </div>
              <p className="text-white/40 text-xs mt-3 flex items-center justify-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Eénmalig betalen · geen abonnement
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
