/**
 * De nagebouwde schermpjes van `/platform` — de product-als-beeld-regel van Glas (G1.1): geen
 * schermafdruk die veroudert, maar dezelfde elementen als in het portaal, klein en stil.
 *
 * **Alles hier is `aria-hidden` en Nederlands, `dir="ltr"`.** Het zijn plaatjes van een Nederlandse
 * opgave of een portaalscherm; de beschrijving staat in de kaarttekst ernaast. Daarom staan de
 * teksten niet in `messages/` (zelfde afspraak als `PanelMock` op `/home-b`).
 *
 * Geen verzonnen rubriekcriteria (die schrijft de docent) en geen verzonnen aantallen: wat een
 * getal is, komt uit `data/skills.ts` of uit CLAUDE.md §3.
 */
import { Check, X, Play, Mic, Lock, Volume2, CalendarDays, ArrowRight } from 'lucide-react';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import ScoreRing from '@/components/glas/ScoreRing';
import { PassChanceLabel } from '@/components/glas/PassChanceDial';

function Mock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`g-pf2-m ${className}`} aria-hidden="true" dir="ltr" lang="nl">
      {children}
    </div>
  );
}

/* ── De kop: een portaalvenster met een telefoon ervoor ── */
export function HeroMock() {
  const modules = [
    { c: 'lezen', n: 'Lezen', at: 'Examen 4 van 10', p: 40 },
    { c: 'luisteren', n: 'Luisteren', at: 'Les 6 · Getallen', p: 25 },
    { c: 'schrijven', n: 'Schrijven', at: 'Examen 2 van 10', p: 20 },
    { c: 'spreken', n: 'Spreken', at: 'Les 3 · Uitspraak', p: 12 },
  ] as const;
  return (
    <div className="g-pf2-hv" aria-hidden="true" dir="ltr" lang="nl">
      <div className="g-pf2-win">
        <div className="g-pf2-win-side">
          <span className="g-pf2-win-logo" />
          {['a2', 'b1', 'knm'].map(t => (
            <span key={t} className="g-pf2-win-nav" data-on={t === 'a2' || undefined}>
              <ExamMark track={t as 'a2' | 'b1' | 'knm'} size={28} />
            </span>
          ))}
        </div>
        <div className="g-pf2-win-main">
          <div className="g-pf2-win-head">
            <div>
              <small>Taal A2</small>
              <b>Hoi Amina</b>
            </div>
            <span className="g-pf2-win-date"><CalendarDays />Examen over 23 dagen</span>
          </div>
          <ul className="g-pf2-win-mods">
            {modules.map((m, i) => (
              <li key={m.c}>
                <CategoryMark category={m.c} size={32} />
                <span className="g-pf2-win-mod-t">
                  <b>{m.n}</b>
                  <small>{m.at}</small>
                </span>
                <i style={{ ['--p' as string]: `${m.p}%` }} />
                {i === 0 && <span className="g-pf2-win-go">Verder <ArrowRight /></span>}
              </li>
            ))}
          </ul>
          <div className="g-pf2-win-week">
            <small>Deze week</small>
            <ul className="g-hb-days">
              {([['ma', 'done'], ['di', 'done'], ['wo', 'rest'], ['do', 'done'], ['vr', 'today']] as const).map(([d, st]) => (
                <li key={d} data-s={st}>
                  <span>{st === 'done' && <Check />}</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="g-pf2-phone">
        <div className="g-pf2-phone-bar">
          <span className="g-pf2-seg">{Array.from({ length: 10 }, (_, i) => <i key={i} data-on={i < 6 || undefined} />)}</span>
          <span className="g-pf2-time">41:07</span>
        </div>
        <p className="g-pf2-phone-q">Waarom belt Sara de huisarts?</p>
        <div className="g-pf2-rows">
          <span className="g-pf2-row" data-s="dim"><i>A</i>Ze wil een recept ophalen.</span>
          <span className="g-pf2-row" data-s="ok"><i><Check /></i>Ze wil een afspraak maken.<em>Juist</em></span>
          <span className="g-pf2-row" data-s="dim"><i>C</i>Ze heeft een vraag over de rekening.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Oefenexamens ── de glazen balk van de speler (G5) boven een vraag op wit. */
export function ExamMock() {
  return (
    <Mock className="g-pf2-m-wide">
      <div className="g-pf2-bar">
        <span className="g-pf2-x"><X /></span>
        <span className="g-pf2-seg g-pf2-seg-lg">{Array.from({ length: 25 }, (_, i) => <i key={i} data-on={i < 13 || undefined} data-now={i === 13 || undefined} />)}</span>
        <span className="g-pf2-time">38:12</span>
      </div>
      <div className="g-pf2-split">
        <div className="g-pf2-stim">
          <small>Tekst 5 · Bericht van de gemeente</small>
          <p>Vanaf 1 maart haalt de gemeente het oud papier <u>op dinsdag</u> op. Zet de container vóór 7.30 uur aan de straat.</p>
        </div>
        <div>
          <p className="g-pf2-q">Wanneer moet de container aan de straat staan?</p>
          <div className="g-pf2-rows">
            <span className="g-pf2-row"><i>A</i>Maandagavond</span>
            <span className="g-pf2-row" data-s="sel"><i>B</i>Dinsdag vóór 7.30 uur</span>
            <span className="g-pf2-row"><i>C</i>Dinsdagmiddag</span>
          </div>
        </div>
      </div>
    </Mock>
  );
}

/* ── Luisteren ── de glazen capsule van de speler. */
export function ListenMock() {
  const wave = [8, 16, 12, 24, 14, 30, 18, 26, 12, 32, 20, 14, 26, 18, 10, 22, 28, 14, 20, 12, 24, 16, 10, 18];
  return (
    <Mock>
      <div className="g-pf2-cap">
        <span className="g-pf2-play"><Play /></span>
        <span className="g-pf2-wave">{wave.map((h, i) => <i key={i} style={{ height: h }} data-on={i < 10 || undefined} />)}</span>
        <span className="g-pf2-time">0:14</span>
      </div>
      <p className="g-pf2-mfoot"><Lock />Fragment 2 van 4</p>
    </Mock>
  );
}

/* ── Uitleg bij elk antwoord ── goed is groen met een vinkje, fout rood met een kruis (G3). */
export function ExplainMock() {
  return (
    <Mock>
      <div className="g-pf2-rows">
        <span className="g-pf2-row" data-s="bad"><i><X /></i>Maandagavond<em>Jouw antwoord</em></span>
        <span className="g-pf2-row" data-s="ok"><i><Check /></i>Dinsdag vóór 7.30 uur<em>Juist</em></span>
      </div>
      <p className="g-pf2-note">
        <b>Waarom?</b> De gemeente haalt het papier <u>op dinsdag</u>. De container moet er vóór 7.30 uur staan.
      </p>
    </Mock>
  );
}

/* ── Uitslag ── de echte `ScoreRing` en het echte slaagkanslabel uit de kit. */
export function ResultMock() {
  const results = Array.from({ length: 25 }, (_, i) => ![3, 9, 15, 21].includes(i));
  return (
    <Mock className="g-pf2-m-wide g-pf2-m-result">
      <ScoreRing results={results} label="21 van 25 goed" size={150} caption="84% goed">
        <b className="g-tnum">21</b>
      </ScoreRing>
      <div className="g-pf2-res-side">
        <PassChanceLabel level={3} word="Goed" sub="3 examens · gem. 78%" />
        <ul className="g-pf2-tally">
          <li><Check />21 goed</li>
          <li data-s="bad"><X />4 fout · met uitleg</li>
        </ul>
      </div>
    </Mock>
  );
}

/* ── Schrijven ── je eigen tekst, met één verbetering erin en de score per criterium. Geen namen
   van criteria: die schrijft de docent per opdracht. */
export function WriteMock() {
  return (
    <Mock className="g-pf2-m-wide">
      <div className="g-pf2-mhead">
        <b><CategoryMark category="schrijven" size={28} bare />E-mail aan je buurvrouw</b>
        <span className="g-pf2-chip">Opdracht 2</span>
      </div>
      <p className="g-pf2-letter">
        Beste Ineke, zaterdag geef ik een feest. <s>Het muziek</s> <ins>De muziek</ins> is misschien hard.
        Het is klaar om 23.00 uur. Groeten, Amina
      </p>
      <ul className="g-pf2-crit">
        {[3, 2, 3].map((s, i) => (
          <li key={i}>
            <span>Criterium {i + 1}</span>
            <span className="g-pf2-dots">{[0, 1, 2].map(d => <i key={d} data-on={d < s || undefined} />)}</span>
            <b className="g-tnum">{s}/3</b>
          </li>
        ))}
      </ul>
    </Mock>
  );
}

/* ── Spreken ── de rustige recorder: één grote navy knop die blijft staan (G5). */
export function SpeakMock() {
  const meter = [6, 10, 18, 26, 14, 30, 22, 12, 24, 16, 8, 20, 28, 12, 18, 10];
  return (
    <Mock>
      <div className="g-pf2-mhead">
        <b><CategoryMark category="spreken" size={28} bare />Vraag 7 · 30 seconden</b>
        <span className="g-pf2-rec">opname</span>
      </div>
      <span className="g-pf2-wave g-pf2-meter">{meter.map((h, i) => <i key={i} style={{ height: h }} />)}</span>
      <span className="g-pf2-recbtn"><Mic />Stop opname</span>
    </Mock>
  );
}

/* ── De leerroute ── drie kaarten en niets ernaast (CLAUDE.md §3). */
export function RouteMock() {
  const steps = [
    { c: 'woorden', t: 'Woorden', s: '48 van 60 gekend', st: 'done' },
    { c: 'taalregels', t: 'Taalregels', s: 'Les 9 van 20', st: 'now' },
    { c: 'examen', t: 'Oefenexamen', s: 'Examen 5', st: 'next' },
  ] as const;
  return (
    <Mock className="g-pf2-m-wide">
      <ol className="g-pf2-route">
        {steps.map((s, i) => (
          <li key={s.c} data-s={s.st}>
            <span className="g-pf2-route-n">{s.st === 'done' ? <Check /> : i + 1}</span>
            <CategoryMark category={s.c} size={36} />
            <b>{s.t}</b>
            <small>{s.s}</small>
          </li>
        ))}
      </ol>
    </Mock>
  );
}

/* ── Woordkaart ── */
export function WordMock() {
  return (
    <Mock>
      <div className="g-pf2-word">
        <small>Gezondheid · zelfstandig naamwoord</small>
        <b>de huisarts</b>
        <p>Ik bel de huisarts voor een afspraak.</p>
        <span className="g-pf2-play g-pf2-play-sm"><Volume2 /></span>
      </div>
      <div className="g-pf2-know">
        <span>Opnieuw</span>
        <span data-on>Ik ken het</span>
      </div>
    </Mock>
  );
}

/* ── Taalregel ── een echte fout uit de lesstof (`omdat` + werkwoord achteraan). */
export function RuleMock() {
  return (
    <Mock>
      <div className="g-pf2-mhead">
        <b><CategoryMark category="taalregels" size={28} bare />omdat, als en toen</b>
      </div>
      <div className="g-pf2-rows">
        <span className="g-pf2-row" data-s="bad"><i><X /></i>…omdat ik ben ziek.</span>
        <span className="g-pf2-row" data-s="ok"><i><Check /></i>…omdat ik ziek ben.</span>
      </div>
      <p className="g-pf2-note">Na <b>omdat</b> gaat het werkwoord naar het eind.</p>
    </Mock>
  );
}

/* ── Ingesproken uitleg ── het woord dat je hoort licht op (`lesson_narration.word_times`). */
export function NarrationMock() {
  const words = ['Na', 'omdat', 'staat', 'het', 'werkwoord', 'aan', 'het', 'eind', 'van', 'de', 'zin.'];
  return (
    <Mock>
      <p className="g-pf2-read">
        {words.map((w, i) => <span key={i} data-s={i < 4 ? 'read' : i === 4 ? 'now' : undefined}>{w} </span>)}
      </p>
      <div className="g-pf2-cap g-pf2-cap-sm">
        <span className="g-pf2-play g-pf2-play-sm"><Play /></span>
        <span className="g-pf2-prog"><i style={{ width: '38%' }} /></span>
        <span className="g-pf2-time">0:41</span>
      </div>
    </Mock>
  );
}

/* ── Naspreken ── hoor het, zeg het na; de opname verlaat de browser niet. */
export function RepeatMock() {
  return (
    <Mock>
      <div className="g-pf2-say">
        <span className="g-pf2-play g-pf2-play-sm"><Volume2 /></span>
        <b>Mag ik een afspraak maken?</b>
      </div>
      <div className="g-pf2-say g-pf2-say-me">
        <span className="g-pf2-play g-pf2-play-sm g-pf2-play-mic"><Mic /></span>
        <span className="g-pf2-wave g-pf2-wave-sm">{[8, 14, 20, 12, 22, 16, 10, 18, 12, 6].map((h, i) => <i key={i} style={{ height: h }} />)}</span>
        <small>Jouw opname</small>
      </div>
    </Mock>
  );
}

/* ── Dashboard ── één regel waar je bent, één knop (G5). */
export function DashMock() {
  return (
    <Mock className="g-pf2-m-wide g-pf2-m-dash">
      <div className="g-pf2-dcard">
        <CategoryMark category="lezen" size={40} />
        <span className="g-pf2-dcard-t">
          <b>Lezen A2</b>
          <small>Je bent bij examen 4. Morgen: taalregel 9.</small>
        </span>
        <span className="g-pf2-go">Verder <ArrowRight /></span>
      </div>
      <div className="g-pf2-ticket">
        <small>Jouw examen</small>
        <b className="g-tnum">23</b>
        <span>dagen</span>
      </div>
    </Mock>
  );
}

/* ── Tijdlijn ── drie data, de deadline in Nacht (G1.4). */
export function TimelineMock() {
  const rows = [
    { d: 'nu', t: 'Je begint met oefenen' },
    { d: 'mrt', t: 'Aanmelden bij DUO' },
    { d: 'mei', t: 'Je examendag', strong: true },
  ];
  return (
    <Mock>
      <ol className="g-pf2-tl">
        {rows.map(r => (
          <li key={r.t} data-strong={r.strong || undefined}>
            <span>{r.d}</span>
            <b>{r.t}</b>
          </li>
        ))}
      </ol>
    </Mock>
  );
}

/* ── Gratis proberen ── tien vragen, een stip per vraag. */
export function FreeMock() {
  return (
    <Mock>
      <div className="g-pf2-mhead">
        <b>Gratis proef</b>
        <span className="g-pf2-chip">geen account</span>
      </div>
      <span className="g-pf2-ten">{Array.from({ length: 10 }, (_, i) => <i key={i} data-s={i < 4 ? 'ok' : i === 4 ? 'bad' : i === 5 ? 'now' : undefined}>{i < 4 ? <Check /> : i === 4 ? <X /> : null}</i>)}</span>
      <p className="g-pf2-mfoot">Vraag 6 van 10</p>
    </Mock>
  );
}
