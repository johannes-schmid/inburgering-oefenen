/* eslint-disable @next/next/no-img-element -- het widget draait buiten Next, in een iframe van ChatGPT */
import { useEffect, useState } from 'react';
import { useApp, useHostStyles, type App as McpApp } from '@modelcontextprotocol/ext-apps/react-with-deps';
import { ArrowRight, Check, X, Lock } from 'lucide-react';
import type { Exercise, Gate, Label, McqExercise, Payload, Verdict, WritingExercise, WritingVerdict } from './types';

/**
 * Het oefenwidget van de ChatGPT-app.
 *
 * Eén component met vijf standen, bepaald door wat de server als `structuredContent` stuurt:
 * een meerkeuzevraag, een schrijfopdracht, een oordeel (na het antwoord), een poort (account of
 * module nodig) of niets. Het widget beslist zelf niets inhoudelijks — het stuurt de keuze naar
 * `submit_answer` en toont wat terugkomt. Het kent het juiste antwoord niet tot dat moment.
 */
type View =
  | { kind: 'empty' }
  | { kind: 'mcq'; exercise: McqExercise; verdict: Verdict | null }
  | { kind: 'writing'; exercise: WritingExercise; verdict: WritingVerdict | null }
  | { kind: 'gate'; gate: Gate };

function fromPayload(p: Payload | null | undefined, prev: View): View {
  if (!p || typeof p !== 'object') return prev;
  if ('gate' in p && p.gate) return { kind: 'gate', gate: p.gate as Gate };
  if ('exercise' in p && p.exercise) {
    const ex = p.exercise as Exercise;
    return ex.kind === 'mcq' ? { kind: 'mcq', exercise: ex, verdict: null } : { kind: 'writing', exercise: ex, verdict: null };
  }
  if ('verdict' in p && p.verdict && prev.kind === 'mcq') return { ...prev, verdict: p.verdict as Verdict };
  if ('writing' in p && p.writing && prev.kind === 'writing') return { ...prev, verdict: p.writing as WritingVerdict };
  return prev;
}

export default function App() {
  const { app, isConnected } = useApp({
    appInfo: { name: 'inburgering-oefenen-widget', version: '1.0.0' },
    capabilities: {},
    onAppCreated: a => {
      a.ontoolresult = res => setView(v => fromPayload(res.structuredContent as Payload, v));
      a.onhostcontextchanged = ctx => applyTheme(ctx.theme);
    },
  });
  useHostStyles(app);
  const [view, setView] = useState<View>({ kind: 'empty' });

  useEffect(() => {
    if (app && isConnected) applyTheme(app.getHostContext()?.theme);
  }, [app, isConnected]);

  // De taal van de kaartteksten volgt de host; de examenteksten zelf blijven Nederlands.
  const hostLocale = isConnected ? (app?.getHostContext() as { locale?: string } | undefined)?.locale : undefined;
  const locale: 'nl' | 'en' = hostLocale && hostLocale.slice(0, 2).toLowerCase() !== 'nl' ? 'en' : 'nl';

  if (view.kind === 'empty') return <div className="w"><div className="card"><p className="meta">Oefenvraag laden…</p></div></div>;
  if (view.kind === 'gate') return <div className="w"><div className="card"><GateCard gate={view.gate} app={app} locale={locale} /></div></div>;
  // `key` op het vraag-id: een nieuwe vraag is een nieuwe component, dus de keuze en de foutmelding
  // beginnen vanzelf leeg — zonder effect dat state zet.
  if (view.kind === 'writing') return <div className="w"><div className="card"><Writing key={view.exercise.taskId} view={view} app={app} setView={setView} /></div></div>;
  return <div className="w"><div className="card"><Mcq key={view.exercise.questionId} view={view} app={app} setView={setView} /></div></div>;
}

function applyTheme(theme: string | undefined) {
  const dark = theme === 'dark' || (theme === undefined && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

async function callTool(app: McpApp | null, name: string, args: Record<string, unknown>): Promise<Payload | null> {
  if (!app) return null;
  const res = await app.callServerTool({ name, arguments: args });
  return (res.structuredContent ?? null) as Payload | null;
}

function Header({ ex }: { ex: Exercise }) {
  return (
    <div className="top">
      <div className="brand"><span className="mark" aria-hidden />Inburgering Oefenen</div>
      <span className="chip">{ex.onderdeelLabel} · examen {ex.examNumber}{ex.kind === 'mcq' && ex.section ? ` · ${ex.section}` : ''}</span>
    </div>
  );
}

function Mcq({ view, app, setView }: { view: Extract<View, { kind: 'mcq' }>; app: McpApp | null; setView: (f: (v: View) => View) => void }) {
  const { exercise: ex, verdict } = view;
  const [selected, setSelected] = useState<Label | null>(null);
  const [busy, setBusy] = useState<'check' | 'next' | null>(null);
  const [error, setError] = useState('');

  async function check() {
    if (!selected) return;
    setBusy('check'); setError('');
    try {
      const p = await callTool(app, 'submit_answer', { questionId: ex.questionId, label: selected });
      if (p && 'verdict' in p) {
        setView(v => fromPayload(p, v));
        const vd = p.verdict as Verdict;
        void app?.updateModelContext({ content: [{ type: 'text', text: `De gebruiker koos ${vd.chosenLabel}: ${vd.correct ? 'goed' : `fout, het juiste antwoord was ${vd.correctLabel}`}.` }] });
      } else if (p && 'gate' in p) setView(v => fromPayload(p, v));
      else setError('Nakijken lukte niet. Probeer het nog eens.');
    } catch { setError('Nakijken lukte niet. Probeer het nog eens.'); }
    setBusy(null);
  }

  async function next() {
    setBusy('next'); setError('');
    try {
      const args: Record<string, unknown> = { onderdeel: ex.onderdeel };
      if (ex.level) args.level = ex.level;
      const p = await callTool(app, 'get_practice_exercise', args);
      if (p) { setSelected(null); setView(v => fromPayload(p, v)); }
      else setError('Geen nieuwe vraag gekregen.');
    } catch { setError('Geen nieuwe vraag gekregen.'); }
    setBusy(null);
  }

  return (
    <>
      <Header ex={ex} />
      {ex.instruction && <p className="instr">{ex.instruction}</p>}
      {ex.stimulus?.kind === 'text' && (
        <div className="stim">{ex.stimulus.title && <h4>{ex.stimulus.title}</h4>}<div dangerouslySetInnerHTML={{ __html: ex.stimulus.html }} /></div>
      )}
      {ex.stimulus?.kind === 'audio' && <audio controls preload="none" src={ex.stimulus.url} />}
      {ex.stimulus?.kind === 'image' && <img className="img" src={ex.stimulus.url} alt={ex.stimulus.alt ?? ''} />}
      <p className="q">{ex.question}</p>
      {ex.questionImageUrl && <img className="img" src={ex.questionImageUrl} alt="" />}
      {ex.questionAudioUrl && !ex.stimulus && <audio controls preload="none" src={ex.questionAudioUrl} />}

      <div className="opts" role={verdict ? undefined : 'radiogroup'}>
        {ex.options.map(o => {
          const state = verdict ? (o.label === verdict.correctLabel ? 'ok' : o.label === verdict.chosenLabel ? 'bad' : '') : selected === o.label ? 'sel' : '';
          return (
            <button
              key={o.label}
              type="button"
              className={`opt ${state}`}
              role={verdict ? undefined : 'radio'}
              aria-checked={verdict ? undefined : selected === o.label}
              disabled={!!verdict || busy !== null}
              onClick={() => setSelected(o.label)}
            >
              <span className="lbl" aria-hidden>{state === 'ok' ? <Check size={14} /> : state === 'bad' ? <X size={14} /> : o.label}</span>
              <span>
                {o.body}
                {o.imageUrls.map(u => <img key={u} src={u} alt="" />)}
              </span>
            </button>
          );
        })}
      </div>

      {verdict && (
        <div className={`res ${verdict.correct ? 'ok' : 'bad'}`}>
          <h3>{verdict.correct ? <Check size={18} /> : <X size={18} />}{verdict.correct ? 'Goed!' : 'Niet goed'}</h3>
          {!verdict.correct && <p>Jij koos <b>{verdict.chosenLabel}</b>. Het juiste antwoord is <b>{verdict.correctLabel}</b>{verdict.correctBody ? `: ${verdict.correctBody}` : ''}.</p>}
          <p><b>Waarom?</b> {verdict.explanation}</p>
          {verdict.taalregel && (
            <p className="rule">Taalregel: <b>{verdict.taalregel.name}</b> — {verdict.taalregel.oneLiner}{' '}
              <a href={verdict.taalregel.url} onClick={e => { e.preventDefault(); void app?.openLink({ url: verdict.taalregel!.url }); }}>Bekijk de les</a>
            </p>
          )}
        </div>
      )}

      {error && <p className="meta" role="alert" style={{ color: 'var(--error)' }}>{error}</p>}

      <div className="row">
        {!verdict ? (
          <button type="button" className="btn" disabled={!selected || busy !== null} onClick={check}>
            {busy === 'check' ? <span className="spin" aria-hidden /> : <Check size={16} />} Controleer
          </button>
        ) : (
          <button type="button" className="btn" disabled={busy !== null} onClick={next}>
            {busy === 'next' ? <span className="spin" aria-hidden /> : <ArrowRight size={16} />} Volgende vraag
          </button>
        )}
        {typeof ex.tasterRemaining === 'number' && <span className="meta" style={{ margin: 0 }}>Nog {ex.tasterRemaining} gratis proefvragen</span>}
        {verdict?.saved && <span className="meta" style={{ margin: 0 }}>Opgeslagen in je voortgang</span>}
      </div>
    </>
  );
}

function Writing({ view, app, setView }: { view: Extract<View, { kind: 'writing' }>; app: McpApp | null; setView: (f: (v: View) => View) => void }) {
  const { exercise: ex, verdict } = view;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function grade() {
    if (!text.trim()) return;
    setBusy(true); setError('');
    try {
      const p = await callTool(app, 'submit_writing_answer', { taskId: ex.taskId, text });
      if (p && ('writing' in p || 'gate' in p)) setView(v => fromPayload(p, v));
      else setError('Nakijken lukte niet. Probeer het nog eens.');
    } catch { setError('Nakijken lukte niet. Probeer het nog eens.'); }
    setBusy(false);
  }

  return (
    <>
      <Header ex={ex} />
      {ex.title && <p className="q">{ex.title}</p>}
      {ex.promptHtml && <div className="stim" dangerouslySetInnerHTML={{ __html: ex.promptHtml }} />}
      {ex.email && (
        <p className="instr">{ex.email.to && <>Aan: {ex.email.to}<br /></>}{ex.email.subject && <>Onderwerp: {ex.email.subject}</>}</p>
      )}
      {ex.bulletPoints.length > 0 && <ul className="bul">{ex.bulletPoints.map((b, i) => <li key={i}>{b}</li>)}</ul>}
      {ex.images.map(i => <img key={i.url} className="img" src={i.url} alt={i.alt ?? i.caption ?? ''} />)}
      {ex.minSentences && <p className="instr">Schrijf minstens {ex.minSentences} zinnen.</p>}

      {!verdict ? (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={ex.greeting ?? 'Schrijf hier je tekst…'} maxLength={4000} aria-label="Jouw tekst" />
          {error && <p className="meta" role="alert" style={{ color: 'var(--error)' }}>{error}</p>}
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn" disabled={!text.trim() || busy} onClick={grade}>
              {busy ? <span className="spin" aria-hidden /> : <Check size={16} />} Laat nakijken
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="res ok"><h3><Check size={18} />Nagekeken</h3>{verdict.overall && <p>{verdict.overall}</p>}</div>
          <div className="crit">
            {verdict.criteria.map(c => <div key={c.key}><b><span>{c.key}</span><span>{c.score}/{c.maxScore}</span></b>{c.feedback && <span>{c.feedback}</span>}</div>)}
          </div>
          {verdict.tips.length > 0 && <ul className="bul">{verdict.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
        </>
      )}
    </>
  );
}

function GateCard({ gate, app, locale }: { gate: Gate; app: McpApp | null; locale: 'nl' | 'en' }) {
  const message = locale === 'en' ? gate.message_en : gate.message_nl;
  const label = gate.action ? (locale === 'en' ? gate.action.label_en : gate.action.label_nl) : null;
  return (
    <div className="gate">
      <div className="brand" style={{ justifyContent: 'center', marginBottom: 12 }}><span className="mark" aria-hidden />Inburgering Oefenen</div>
      <h3><Lock size={18} style={{ verticalAlign: '-3px', marginRight: 6 }} aria-hidden />{gate.title_nl}</h3>
      <p>{message}</p>
      {gate.action && (
        <button type="button" className="btn" onClick={() => void app?.openLink({ url: gate.action!.url })}>
          {label} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
