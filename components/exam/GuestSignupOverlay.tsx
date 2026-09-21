'use client';

import { Check } from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';

/**
 * De aanmeldkaart die over het examen komt zodra een gast zijn gratis vragen op heeft.
 *
 * **Een overlay en geen omleiding.** Tot 21-09 stuurde de speler een gast meteen naar
 * `/register?next=…`: een leeg formulier op een lege pagina, op het moment dat hij nog niets
 * van het product had gezien. Nu mag hij de eerste vragen van oefenexamen 1 echt maken en
 * komt de vraag pas als hij zelf wil doorgaan — het examen blijft zichtbaar achter de kaart,
 * dus wat je krijgt als je tekent staat er letterlijk achter.
 *
 * **Google en alleen Google.** `AuthPanel` is de enige plek die met Supabase Auth praat, en
 * de Microsoft-knop die dit project uit de KNM-fork erfde is er bewust uit gesloopt — hij
 * rendert prima en faalt bij de klik, want die provider staat niet aangezet. Een tweede knop
 * hier bijtekenen zou dezelfde fout opnieuw maken.
 *
 * De kaart heeft géén sluitknop: er is geen examen meer om naar terug te keren. Weg komen kan
 * via de zijbalk of via terug — de overlay vangt geen navigatie af.
 */
export default function GuestSignupOverlay({
  answered,
  nextNumber,
  locale,
  returnTo,
}: {
  /** Hoeveel vragen de gast net heeft gemaakt — het bewijs boven de kop. */
  answered: number;
  /** Het nummer van de vraag die klaarstaat, zodat de belofte concreet is. */
  nextNumber: number;
  locale: string;
  /** Het pad waar Google hem weer afzet: dit examen, niet het dashboard. */
  returnTo: string;
}) {
  return (
    <div
      className="guest-wall"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-wall-title"
    >
      <div className="guest-wall-card bg-surface-container-lowest">
        {/* "voortgang bewaard" alleen als er iets te bewaren is: wie doorklikte zonder te
            antwoorden krijgt anders een belofte over een leeg blad. */}
        <p className="flex items-center justify-center gap-1.5 text-sm font-bold m-0 mb-3 text-secondary">
          <Check size={16} strokeWidth={2.8} aria-hidden />
          {answered > 0
            ? `${answered} ${answered === 1 ? 'vraag' : 'vragen'} gedaan · voortgang bewaard`
            : 'Je gratis vragen zitten erop'}
        </p>

        <h2
          id="guest-wall-title"
          className="font-headline font-extrabold text-on-surface text-center m-0 mb-3"
          style={{ fontSize: 'clamp(1.5rem,4.5vw,1.9rem)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
        >
          Ga verder met een gratis account
        </h2>

        <p className="text-sm text-on-surface-variant text-center leading-relaxed m-0 mb-6">
          Vraag {nextNumber} staat klaar. Maak in één tik een gratis account en je gaat verder
          waar je gebleven bent.
        </p>

        <AuthPanel mode="register" locale={locale} next={returnTo} />

        <p className="text-xs text-on-surface-variant text-center m-0 mt-4">
          Gratis · geen creditcard nodig
          <br />
          Al een account?{' '}
          <a
            href={`/${locale}/login?next=${encodeURIComponent(returnTo)}`}
            className="font-semibold text-primary no-underline hover:underline"
          >
            Inloggen
          </a>
        </p>
      </div>

      <style>{`
        /* Het examen blijft staan en wordt onleesbaar gemaakt, niet weggehaald: de kaart moet
           op iets liggen dat je herkent als het examen dat je net maakte. */
        .guest-wall {
          position: fixed; inset: 0; z-index: 60;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(0, 43, 109, 0.28);
          backdrop-filter: blur(7px);
          animation: guest-wall-in .28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .guest-wall-card {
          width: 100%; max-width: 27rem;
          padding: 2rem 1.75rem;
          border-radius: 24px;
          box-shadow: var(--shadow-ambient), 0 24px 60px rgba(0, 43, 109, 0.22);
          animation: guest-card-in .32s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes guest-wall-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes guest-card-in {
          from { opacity: 0; transform: translateY(14px) scale(.985) }
          to { opacity: 1; transform: none }
        }
        @media (prefers-reduced-motion: reduce) {
          .guest-wall, .guest-wall-card { animation: none; }
        }
      `}</style>
    </div>
  );
}
