'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, Eye, TriangleAlert } from 'lucide-react';

/**
 * De twee besluiten over één les, naast elkaar: is hij nagekeken, en staat hij live.
 *
 * ── HET ZIJN TWEE BESLUITEN EN DAAROM TWEE KNOPPEN ───────────────────────────
 * Tot 03-09 deed "Vrijgeven" beide: het zette `review_status` op `validated` én schreef
 * `reviewed_by`. Dat maakte de bewering die de hele USP draagt — "echt door een docent
 * gevalideerd" — een bijproduct van een publicatiebesluit. Een nagekeken les die nog even moet
 * wachten op de rest van zijn blok bestond niet, en een vrijgegeven les kon nooit zeggen "hier
 * heeft nog niemand naar gekeken".
 *
 * Vrijgeven zonder nakijken blijft mogelijk — de eigenaar beslist, niet dit scherm — maar het
 * staat er dan als waarschuwing bij. Dat is dezelfde keuze als bij de structuurregels van een
 * examen: elke regel een waarschuwing, nooit een blokkade, behalve waar de database het weigert.
 *
 * ── DE NAAM KOMT UIT DE SESSIE ───────────────────────────────────────────────
 * Beide routes lezen `requireAdmin()` en schrijven het e-mailadres daaruit. Nooit uit de body:
 * de publieke kant zegt dat er een docent naar heeft gekeken, en die naam mag niets zijn wat een
 * client kan opgeven.
 *
 * ── HET AANTAL GERAAKTE RIJEN WORDT GELEZEN ──────────────────────────────────
 * Een door RLS geweigerde UPDATE geeft via PostgREST 200 met nul rijen en ziet er identiek uit
 * aan een geslaagde save. Beide routes geven `changed` terug en dit component toont een fout als
 * dat nul is.
 */
export default function LessonStatus({
  lessonId,
  released,
  checkedBy,
  checkedOn,
  viewHref,
}: {
  lessonId: number;
  released: boolean;
  checkedBy: string | null;
  checkedOn: string | null;
  viewHref: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<'check' | 'release' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checked = Boolean(checkedBy);

  async function post(path: string, body: unknown, which: 'check' | 'release') {
    setBusy(which);
    setError(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? `${res.status}`);
      if (!json?.changed) throw new Error('er is niets gewijzigd (0 rijen)');
      start(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'onbekende fout');
    } finally {
      setBusy(null);
    }
  }

  const working = busy !== null || pending;

  return (
    <div className="lei-status">
      <div className="lei-status-row">
        <span className={`lei-chip${checked ? ' is-on' : ''}`}>
          {checked
            ? <Check size={14} strokeWidth={3} aria-hidden />
            : <Clock size={13} strokeWidth={2.6} aria-hidden />}
          {checked
            ? `Nagekeken door ${checkedBy}${checkedOn ? ` op ${checkedOn}` : ''}`
            : 'Nog niet nagekeken'}
        </span>
        <button
          type="button"
          className="lei-btn"
          disabled={working}
          onClick={() => post('/api/admin/check-lesson', { lessonId, checked: !checked }, 'check')}
        >
          {busy === 'check' ? '…' : checked ? 'Nakijkstempel weghalen' : 'Nagekeken'}
        </button>
      </div>

      <div className="lei-status-row">
        <span className={`lei-chip${released ? ' is-on' : ''}`}>
          {released
            ? <Check size={14} strokeWidth={3} aria-hidden />
            : <Clock size={13} strokeWidth={2.6} aria-hidden />}
          {released ? 'Vrijgegeven — staat in het portaal' : 'Niet vrijgegeven'}
        </span>
        <button
          type="button"
          className="lei-btn"
          disabled={working}
          onClick={() => post('/api/admin/release-lesson', { lessonId, release: !released }, 'release')}
        >
          {busy === 'release' ? '…' : released ? 'Terugtrekken' : 'Vrijgeven'}
        </button>
        <a className="lei-btn is-plain" href={viewHref}>
          <Eye size={14} strokeWidth={2.4} aria-hidden /> Bekijken
        </a>
      </div>

      {released && !checked && (
        <p className="lei-warn">
          <TriangleAlert size={13} strokeWidth={2.6} aria-hidden />
          Deze les staat live maar is niet nagekeken. De site belooft dat een docent naar de inhoud
          heeft gekeken.
        </p>
      )}
      {error && <p className="lei-error">{error}</p>}
    </div>
  );
}
