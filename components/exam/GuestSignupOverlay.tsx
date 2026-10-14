'use client';

import { Check } from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';
import './glas-player.css';
import '@/app/auth-glas.css';

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
  /* Glas: de sluier van glas.html §10 (Nacht op 45% met een lichte blur) en een witte dialoog.
     Het examen blijft eronder staan en wordt onleesbaar gemaakt, niet weggehaald: de kaart moet op
     iets liggen dat je herkent als het examen dat je net maakte. */
  return (
    <div className="g-xdialog-stage" role="dialog" aria-modal="true" aria-labelledby="guest-wall-title">
      <div className="g-xdialog g-xdialog-lg">
        {/* "voortgang bewaard" alleen als er iets te bewaren is: wie doorklikte zonder te
            antwoorden krijgt anders een belofte over een leeg blad. */}
        <span className="g-xbdg g-xbdg-goed" style={{ alignSelf: 'center' }}>
          <Check strokeWidth={3} aria-hidden />
          {answered > 0
            ? `${answered} ${answered === 1 ? 'vraag' : 'vragen'} gedaan · voortgang bewaard`
            : 'Je gratis vragen zitten erop'}
        </span>

        <h2 id="guest-wall-title" style={{ textAlign: 'center', fontSize: 'clamp(24px, 4.5vw, 28px)' }}>
          Ga verder met een gratis account
        </h2>

        <p style={{ textAlign: 'center', marginBottom: 8 }}>
          Vraag {nextNumber} staat klaar. Maak in één tik een gratis account en je gaat verder
          waar je gebleven bent.
        </p>

        <AuthPanel mode="register" locale={locale} next={returnTo} glas />

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 6 }}>
          Gratis · geen creditcard nodig
          <br />
          Al een account?{' '}
          <a href={`/${locale}/login?next=${encodeURIComponent(returnTo)}`} className="g-tlink" style={{ fontSize: 13 }}>
            Inloggen
          </a>
        </p>
      </div>
    </div>
  );
}
