'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, TriangleAlert } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import './glas-player.css';
import { WavRecorder, canRecordWav } from '@/lib/wav-recorder';

/** Zo lang mag de proefopname duren: genoeg voor een naam. */
const PROEF_SECONDEN = 6;

/**
 * De microfoontest van het startscherm, naar DUO's "Controle van de microfoon": neem uw naam op,
 * luister terug, en zeg of het goed is.
 *
 * Twee redenen. De kandidaat hoort vóór de klok loopt of de microfoon werkt. En de browser vraagt
 * hier om toestemming in plaats van bij opdracht 1 — bij B1 start de opname daar vanzelf na de
 * pieptoon, en een toestemmingsvraag op dat moment kost de opdracht.
 *
 * De opname blijft in de browser: er wordt niets geüpload of opgeslagen.
 */
export default function MicCheck() {
  const [state, setState] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const [left, setLeft] = useState(PROEF_SECONDEN);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [verdict, setVerdict] = useState<'goed' | 'niet-goed' | null>(null);
  const recRef = useRef<WavRecorder | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    recRef.current?.cancel();
  }, []);

  async function stop() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    const rec = recRef.current;
    recRef.current = null;
    if (!rec?.active) return;
    try {
      const { blob: b } = await rec.stop();
      setBlob(b);
      setState('done');
    } catch {
      setState('error');
    }
  }

  async function start() {
    document.querySelectorAll<HTMLAudioElement>('.g-xsoundcheck audio').forEach(a => a.pause());
    setVerdict(null);
    if (!canRecordWav()) { setState('error'); return; }
    const rec = new WavRecorder();
    try {
      await rec.start({ onPcm: () => {} });
    } catch {
      rec.cancel();
      setState('error');
      return;
    }
    recRef.current = rec;
    setState('recording');
    let n = PROEF_SECONDEN;
    setLeft(n);
    tickRef.current = setInterval(() => {
      n -= 1;
      setLeft(n);
      if (n <= 0) void stop();
    }, 1000);
  }

  return (
    <section className="g-xsoundcheck" aria-labelledby="exam-miccheck">
      <h3 id="exam-miccheck">Microfoon testen</h3>
      <p>Klik op opnemen en zeg duidelijk uw naam. Luister daarna of u uzelf goed hoort.</p>

      <div className="g-xmic">
        {state === 'recording' ? (
          <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => void stop()}>
            <Square aria-hidden />
            Stop
            <span className="g-xmic-live" aria-hidden />
            <span className="g-tnum">{left} sec.</span>
          </button>
        ) : (
          <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => void start()}>
            <Mic aria-hidden />
            {blob ? 'Opnieuw opnemen' : 'Opnemen'}
          </button>
        )}
        {url && state === 'done' && <AudioPlayer src={url} label="Uw opname" compact />}
      </div>

      {state === 'error' && (
        <p className="g-xrec-err">
          <TriangleAlert aria-hidden />
          Geen toegang tot de microfoon. Sta microfoongebruik toe in uw browser en probeer het opnieuw.
        </p>
      )}

      {state === 'done' && (
        <fieldset className="g-xmic-verdict">
          <legend className="sr-only">Is de opname goed?</legend>
          {([['goed', 'Opname is goed'], ['niet-goed', 'Opname is niet goed']] as const).map(([v, label]) => (
            <label key={v}>
              <input type="radio" name="mic-verdict" checked={verdict === v} onChange={() => setVerdict(v)} />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      {verdict === 'niet-goed' && (
        <ul className="g-xmic-tips">
          <li>Kijk of de microfoon of headset aan staat en goed is aangesloten.</li>
          <li>Kijk of de browser de microfoon mag gebruiken (het slotje of de camera naast het adres).</li>
          <li>Praat iets harder, of houd de microfoon dichter bij uw mond.</li>
        </ul>
      )}
    </section>
  );
}
