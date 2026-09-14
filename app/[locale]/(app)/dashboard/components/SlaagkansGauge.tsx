'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SlaagkansBand } from '@/lib/exam-readiness';
import { slaagkansKleur, slaagkansTint } from '@/lib/slaagkans-kleur';

type Props = {
  value: number;
  examsCount: number;
  avgScore: number;
  band: SlaagkansBand;
  variant?: 'light' | 'dark';
  bare?: boolean;
};

/*
 * De maatvoering komt uit het ontwerp van de eigenaar (Claude Design, "Lezen Overzicht", vlak 3B):
 * een ring van 270° op straal 88 in een vierkant van 220, streek 16, ronde uiteinden. De viewBox
 * is ruimer dan dat vierkant omdat de bandnamen buiten de ring staan.
 *
 * De viewBox loopt onderaan tot net onder KLEIN en GROOT en niet tot het hele vierkant: de ring is
 * open aan de onderkant, en die opening is vijftig pixels leegte die het bijschrift eronder van de
 * meter losweekt. Afgesneden staat "op basis van…" direct onder de cirkel, waar het bij hoort.
 *
 * Waarom 270° en niet de 282° van hiervoor: bij 270 vallen begin en eind precies op de diagonalen,
 * en dan staan de vier bandnamen op hele kwartslagen in plaats van net ernaast.
 */
const CX = 110;
const CY = 110;
const R = 88;
/* Dunner dan de 16 van 3B: de ring van vlak 4K is een lijn om een vlak, geen band (eigenaar, 14-09). */
const STROKE = 11;
const START_ANGLE = 135;
const SWEEP = 270;
/**
 * De kern is een cirkel die aan zijn rand uitdooft (vlak 4K). In 3B had hij een harde rand; naast
 * een dunne ring leest die rand als een tweede ring, en dan staan er twee cirkels om één getal.
 */
const ORB_R = 68;
/** De streepjes binnen de ring: elke 10%, zoals de schaalverdeling van 4K. */
const TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const BAND_KEYS: { key: 'low' | 'moderate' | 'fair' | 'good' | 'high'; center: number }[] = [
  { key: 'low', center: 10 },
  { key: 'moderate', center: 30 },
  { key: 'fair', center: 50 },
  { key: 'good', center: 70 },
  { key: 'high', center: 90 },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = toRad(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, sweepAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * De boog loopt bij het openen van de pagina in één veeg naar zijn stand, en het getal telt mee.
 *
 * Het is één rAF-lus over de waarde zelf en geen `stroke-dasharray`-truc, omdat het percentage en
 * de streepjes op diezelfde waarde staan — met een dash-animatie zouden die stilstaan terwijl de
 * boog beweegt. De versnelling is de spring-easing van het ontwerp (§8, easeOutQuint als curve),
 * en `prefers-reduced-motion` slaat de hele lus over in plaats van hem te verkorten.
 */
function useSweep(target: number, enabled: boolean) {
  const [v, setV] = useState(enabled ? 0 : target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setV(target);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(target);
      return;
    }
    const DUR = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 5);
      setV(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, enabled]);

  return v;
}

/**
 * `prefers-reduced-motion`, maar als waarde in plaats van als media-query.
 *
 * De glans over de boog is een SMIL-`animateTransform` op het verloop zelf — CSS kan de coördinaten
 * van een SVG-gradient niet animeren. SMIL laat zich niet uitzetten met een media-query, dus wordt
 * het element domweg niet gerenderd als de bezoeker minder beweging vraagt.
 */
function useMotionAllowed() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAllowed(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return allowed;
}

export default function SlaagkansGauge({ value, examsCount, avgScore, band, variant = 'light', bare = false }: Props) {
  const t = useTranslations('dashboard');
  const dark = variant === 'dark';

  /* Twee meters op één scherm mogen elkaars verloop niet erven: de id's zijn per instantie. */
  const uid = useId().replace(/:/g, '');
  const SHEEN = `sheen-${uid}`;
  const ORB = `orb-${uid}`;
  const WARM = `warm-${uid}`;
  const COOL = `cool-${uid}`;
  const CLIP = `orbclip-${uid}`;
  const DRIFT = `drift-${uid}`;
  const LABEL_ARC = `labelarc-${uid}`;

  const shown = useSweep(value, examsCount > 0);
  const motion = useMotionAllowed();

  /*
   * De kern heeft altijd de temperatuur van het laatst gevulde punt (ontwerp 3A): de ring loopt van
   * klei-oranje naar navy, en de cirkel erbinnen kleurt mee. Boven de 65% neemt navy de boventoon
   * over — dat is hetzelfde kantelpunt als in `lib/slaagkans-kleur.ts`, en de enige plek waar deze
   * meter er zelf iets over zegt.
   */
  const ringColor = slaagkansKleur(examsCount > 0 ? shown : 0);
  const cool = examsCount > 0 && shown >= 65;

  const c = {
    track: dark ? 'rgba(255,255,255,0.11)' : '#eceef3',
    tickPassed: dark ? 'rgba(255,255,255,0.5)' : '#cfd3dc',
    tickIdle: dark ? 'rgba(255,255,255,0.22)' : '#e2e5ea',
    bandActive: dark ? '#ff9d5e' : ringColor,
    bandIdle: dark ? 'rgba(255,255,255,0.45)' : '#434651',
    value: dark ? '#fff' : cool ? '#002b6d' : '#5f2200',
    label: dark ? 'rgba(255,255,255,0.6)' : cool ? '#1b4e93' : '#a24000',
    footer: dark ? 'rgba(255,255,255,0.45)' : '#8a8fa0',
  };

  const trackPath = describeArc(CX, CY, R, START_ANGLE, SWEEP);
  const progressSweep = (shown / 100) * SWEEP;
  const progressPath = describeArc(CX, CY, R, START_ANGLE, progressSweep);
  const labelArcPath = describeArc(CX, CY, R + 24, START_ANGLE, SWEEP);

  /*
   * De boog wordt in stukjes van ongeveer 3° getekend, elk in de kleur van de schaal op díe stand.
   * Eén `linearGradient` zou hier niet kloppen: die loopt langs een rechte as, dus over 270° zou
   * het omslagpunt van oranje naar navy niet op 65% uitkomen maar ergens links onderin.
   */
  const SEG = 3;
  const segCount = Math.max(1, Math.ceil(progressSweep / SEG));
  const segments = Array.from({ length: segCount }, (_, i) => {
    const from = START_ANGLE + (progressSweep * i) / segCount;
    const sweep = progressSweep / segCount;
    const last = i === segCount - 1;
    return {
      from,
      // Een halve graad overlap dekt de naad; het laatste segment niet, anders steekt het uit.
      sweep: last ? sweep : sweep + 0.5,
      at: (shown * (i + 0.5)) / segCount,
      cap: (i === 0 || last ? 'round' : 'butt') as 'round' | 'butt',
    };
  });
  /* Het kopje aan het eind van de boog (4K): een wit schijfje met de kleur van de stand eromheen.
     Het zegt "tot hier", en het is wat de ring een wijzer maakt in plaats van een vulling. */
  const knob = polarToCartesian(CX, CY, R, START_ANGLE + progressSweep);

  const gauge = (
      <svg viewBox="-14 -14 248 212" style={{ display: 'block', width: '100%', height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/*
            * De kleur van de boog zit niet in dit verloop maar in de segmenten hieronder: een
            * SVG-verloop loopt langs een rechte as en de boog is 270°, dus zou "oranje bij 20%" op
            * een andere plek uitkomen dan het streepje van 20%.
            *
            * Wat hier staat is alleen de glans: een doorzichtige witte band die langzaam heen en
            * weer over de boog schuift — de beweging die de eigenaar vroeg, nu zonder de kleur van
            * de schaal aan te tasten. `gradientTransform` op de gradient zelf, want CSS raakt de
            * coördinaten van een SVG-verloop niet aan.
            */}
          <linearGradient id={SHEEN} x1="0.08" y1="0.92" x2="0.78" y2="0.06">
            <stop offset="0" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0.34)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
            {motion && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-0.35 0; 0.35 0; -0.35 0"
                dur="7s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              />
            )}
          </linearGradient>

          {/* De kern uit 3B: licht van linksboven, warme kern, een dékkende rand — de cirkel houdt
              op waar hij ophoudt. Dat is wat hem een vlak maakt in plaats van een gloed. */}
          <radialGradient id={ORB} cx="0.5" cy="0.46" r="0.5">
            {dark ? (
              <>
                <stop offset="0" stopColor="rgba(140,178,255,0.14)" />
                <stop offset="0.55" stopColor="rgba(140,178,255,0.1)" />
                <stop offset="1" stopColor="rgba(140,178,255,0)" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor={slaagkansTint(shown, 0.13)} />
                <stop offset="0.55" stopColor={slaagkansTint(shown, 0.16)} />
                <stop offset="0.82" stopColor={slaagkansTint(shown, 0.07)} />
                <stop offset="1" stopColor={slaagkansTint(shown, 0)} />
              </>
            )}
          </radialGradient>

          {/* De twee drijvers die de kern laten leven: warm en koel, dezelfde twee kleuren als de
              ring eromheen. Ze blijven binnen de cirkel — zie de clip hieronder. */}
          <radialGradient id={WARM} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={dark ? 'rgba(255,157,94,0.30)' : 'rgba(255,255,255,0.85)'} />
            <stop offset="0.6" stopColor={dark ? 'rgba(255,157,94,0.09)' : 'rgba(255,255,255,0.22)'} />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={COOL} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={dark ? 'rgba(140,178,255,0.22)' : slaagkansTint(shown, 0.5)} />
            <stop offset="0.6" stopColor={dark ? 'rgba(140,178,255,0.07)' : slaagkansTint(shown, 0.16)} />
            <stop offset="1" stopColor={slaagkansTint(shown, 0)} />
          </radialGradient>

          <clipPath id={CLIP}>
            <circle cx={CX} cy={CY} r={ORB_R} />
          </clipPath>
          <path id={LABEL_ARC} d={labelArcPath} fill="none" />
        </defs>

        {/*
          * Het verloop in de kern beweegt, en dat is de hele animatie na de inloop. Twee drijvers
          * op verschillende perioden (19s en 26s), dus herhaalt het patroon zich pas na minuten.
          * Alleen `transform` en `opacity` (§8); `prefers-reduced-motion` zet ze stil en laat een
          * stilstaand verloop over, wat de kern ook gewoon is.
          */}
        <style>{`
          .${DRIFT}-a { animation: ${DRIFT}-a 19s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
          .${DRIFT}-b { animation: ${DRIFT}-b 26s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
          @keyframes ${DRIFT}-a {
            0%   { transform: translate(-9px, -7px) scale(1);    opacity: 0.95; }
            50%  { transform: translate(11px, 9px)  scale(1.2);  opacity: 0.65; }
            100% { transform: translate(-9px, -7px) scale(1);    opacity: 0.95; }
          }
          @keyframes ${DRIFT}-b {
            0%   { transform: translate(12px, 10px)  scale(1.12); opacity: 0.55; }
            50%  { transform: translate(-11px, -6px) scale(0.88); opacity: 0.9; }
            100% { transform: translate(12px, 10px)  scale(1.12); opacity: 0.55; }
          }
          @media (prefers-reduced-motion: reduce) {
            .${DRIFT}-a, .${DRIFT}-b { animation: none; }
          }
        `}</style>

        <circle cx={CX} cy={CY} r={ORB_R} fill={`url(#${ORB})`} />
        {/* De drijvers staan op (0,0) binnen een verschoven groep, zodat `scale()` om hun eigen
            midden draait zonder `transform-box`/`transform-origin` — die twee zijn niet in elke
            browser hetzelfde en de screenshotbrowser is er één van. */}
        <g clipPath={`url(#${CLIP})`}>
          <g transform={`translate(${CX - 12} ${CY - 8})`}>
            <circle className={`${DRIFT}-a`} r={ORB_R - 8} fill={`url(#${WARM})`} />
          </g>
          <g transform={`translate(${CX + 14} ${CY + 12})`}>
            <circle className={`${DRIFT}-b`} r={ORB_R - 14} fill={`url(#${COOL})`} />
          </g>
        </g>

        <path d={trackPath} fill="none" stroke={c.track} strokeWidth={STROKE} strokeLinecap="round" />
        {/* De gevulde boog in stukjes, elk met zijn eigen kleur uit de schaal. Ze overlappen een
            halve graad, anders tekent de browser een haarlijntje naad tussen twee segmenten; de
            uiteinden zijn rond, de rest stomp. */}
        {examsCount > 0 &&
          segments.map(seg => (
            <path
              key={seg.at}
              d={describeArc(CX, CY, R, seg.from, seg.sweep)}
              fill="none"
              stroke={slaagkansKleur(seg.at)}
              strokeWidth={STROKE}
              strokeLinecap={seg.cap}
            />
          ))}
        {examsCount > 0 && (
          <path d={progressPath} fill="none" stroke={`url(#${SHEEN})`} strokeWidth={STROKE} strokeLinecap="round" />
        )}
        {examsCount > 0 && (
          <>
            <circle cx={knob.x} cy={knob.y} r={STROKE / 2 + 2.5} fill={dark ? '#1b2440' : '#ffffff'} />
            <circle
              cx={knob.x}
              cy={knob.y}
              r={STROKE / 2 - 0.6}
              fill="none"
              stroke={slaagkansKleur(shown)}
              strokeWidth={3}
            />
          </>
        )}

        {/* De schaalverdeling staat bínnen de ring (4K) en niet er dwars doorheen: als lijntjes
            de streek kruisen, hakken ze de kleur van de schaal in stukken. Hier meten ze de boog
            op zonder hem aan te raken. */}
        {TICKS.map(pct => {
          const angle = START_ANGLE + (pct / 100) * SWEEP;
          const inner = R - STROKE / 2 - 9;
          const p1 = polarToCartesian(CX, CY, inner, angle);
          const p2 = polarToCartesian(CX, CY, inner + 5, angle);
          const passed = examsCount > 0 && shown >= pct;
          return (
            <line
              key={pct}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={passed ? c.tickPassed : c.tickIdle}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          );
        })}

        {BAND_KEYS.map(b => {
          const isActive = band === b.key;
          return (
            <text
              key={b.key}
              fontFamily="var(--font-body, system-ui, sans-serif)"
              fontSize={isActive ? 10.5 : 10}
              fontWeight={isActive ? 800 : 700}
              letterSpacing="1"
              fill={isActive ? c.bandActive : c.bandIdle}
              style={{ textTransform: 'uppercase' }}
            >
              <textPath href={`#${LABEL_ARC}`} startOffset={`${b.center}%`} textAnchor="middle">
                {t(`slaagkans_band_${b.key}`)}
              </textPath>
            </text>
          );
        })}

        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          fontFamily="var(--font-headline, system-ui, sans-serif)"
          fontSize={42}
          fontWeight={700}
          letterSpacing="-1.4"
          fill={c.value}
        >
          {examsCount > 0 ? `${Math.round(shown)}%` : '—'}
        </text>
        <text
          x={CX}
          y={CY + 24}
          textAnchor="middle"
          fontFamily="var(--font-body, system-ui, sans-serif)"
          fontSize={9}
          fontWeight={700}
          letterSpacing="1.5"
          fill={c.label}
          style={{ textTransform: 'uppercase' }}
        >
          {t('slaagkans_label')}
        </text>
      </svg>
  );

  if (bare) return gauge;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #eceef4',
        borderRadius: 24,
        padding: '18px 14px 20px',
        boxShadow: 'var(--shadow-card-md, 0 2px 16px rgba(0,43,109,0.06))',
      }}
    >
      {gauge}
      <div style={{ textAlign: 'center', fontSize: 12, color: c.footer, marginTop: 2 }}>
        {examsCount > 0
          ? t('slaagkans_footer', { count: examsCount, avg: avgScore })
          : t('slaagkans_footer_empty')}
      </div>
    </div>
  );
}
