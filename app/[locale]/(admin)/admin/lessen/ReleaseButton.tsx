'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Vrijgeven of terugtrekken van één les.
 *
 * ── DE NAAM VAN WIE HET DEED WORDT VASTGELEGD ────────────────────────────────
 * `reviewed_by` en `reviewed_on` worden serverzijdig gezet uit de sessie, niet uit een veld dat
 * de client meestuurt. Dat is niet paranoia over de docent maar over de belofte: de publieke
 * kant zegt dat er iemand naar heeft gekeken, en dan moet die naam uit de sessie komen en niet
 * uit een POST-body.
 *
 * ── HET RESULTAAT WORDT GELEZEN, NIET AANGENOMEN ─────────────────────────────
 * Een RLS-geweigerde UPDATE geeft via PostgREST **200 met nul rijen** en ziet er identiek uit
 * aan een geslaagde save. De route geeft daarom terug hoeveel rijen zijn geraakt, en dit
 * component toont een fout als dat nul is. Zonder die controle zou een ontbrekende policy zich
 * voordoen als een werkende knop — de val die dit project al twee keer heeft gehad.
 */
export default function ReleaseButton({ lessonId, released }: { lessonId: number; released: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/release-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, release: !released }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `${res.status}`);
      if (!body?.changed) throw new Error('er is niets gewijzigd (0 rijen)');
      start(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'onbekende fout');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="admin-les-release">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || pending}
        className={released ? 'is-live' : ''}
      >
        {busy || pending ? '…' : released ? 'Terugtrekken' : 'Vrijgeven'}
      </button>
      {error && <span className="admin-les-error">{error}</span>}
    </span>
  );
}
