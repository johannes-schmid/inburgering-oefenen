import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { SkillWeakness as Data } from '@/lib/vaardigheden-server';
import { MAX_CRITERION_SCORE } from '@/lib/rubrics';
import { SLAAGKANS_START, slaagkansKleur } from '@/lib/slaagkans-kleur';

/**
 * "Je vaardigheden" — de balken, voor alle vier de taalonderdelen.
 *
 * ── WAAROM DIT `CriterionProgress` OPVOLGT ───────────────────────────────────
 * Die kaart deed dit al, maar alleen voor Schrijven en Spreken, omdat alleen die twee een cijfer
 * hadden dat ergens in uiteenviel. Lezen en Luisteren hadden één percentage en een uitsplitsing
 * per tekstsoort, en "Brief 2/4" is geen leerdoel — je bent niet slecht in brieven. Sinds
 * `data/vaardigheden.ts` hebben ook zij vier tot vijf koppen, en dan hoort er één kaartvorm te
 * zijn in plaats van twee die op elkaar lijken.
 *
 * ── DE TWEE SCHALEN BLIJVEN GESCHEIDEN ───────────────────────────────────────
 * De balk is breedte en verder niets; het bijschrift zegt in woorden waar het getal vandaan komt.
 * Zo staat er "11 van 18 goed · over 4 examens" óf "2.1 / 3 · over 3 beoordeelde sessies", en
 * nooit een percentage dat een rubriekscore nadoet — de ankerteksten van een rubriek zíjn geen
 * percentages.
 *
 * ── ÉÉN REGEL PER VAARDIGHEID, EN DE BALKEN LIGGEN GELIJK ───────────────────
 * Naam, balk en score staan náást elkaar, niet onder elkaar. Deze lijst beantwoordt één vraag —
 * waar zak ik — en dat is een tabel van vijf regels, geen vijf kaartjes.
 *
 * De rij is daarom een grid en geen flexbox: de balk heeft een eigen kolom met een vaste maat, dus
 * hij begint en eindigt op elke rij op dezelfde x. Met `flex: 1` hing de lengte van de balk aan de
 * lengte van de naam ernaast, en dan lezen vijf balken van verschillende lengte als vijf
 * verschillende schalen.
 *
 * ── DE BALK DRAAGT DEZELFDE SCHAAL ALS DE RING ──────────────────────────────
 * Klei-oranje bij laag, navy bij hoog, met het kantelpunt op 65% — `lib/slaagkans-kleur.ts`. Die
 * schaal is gedeeld met de slaagkansmeter ernaast, want beide staan op hetzelfde scherm en zeggen
 * hetzelfde soort ding: zouden ze elk hun eigen verloop hebben, dan zou 58% hier een andere
 * temperatuur krijgen dan 58% daar en is de kleur decoratie in plaats van informatie.
 *
 * ── DE FOUTEN ZELF STAAN HIER NIET (eigenaar, 14-09) ────────────────────────
 * Onder de zwakste rij stonden de concepten waarop je de fout in ging, met een link naar de les.
 * Die gaan naar een eigen scherm met alle fouten en een foutenwachtrij; zolang dat er niet is, is
 * de uitgang de knop onder de kaart. Een halve foutenlijst midden in een diagnose is de derde
 * plek waar dezelfde cijfers iets anders zeggen, en dat is precies wat dit portaal al eerder
 * heeft gekost.
 *
 * ── HET IS GEEN EIGEN KAART MEER ────────────────────────────────────────────
 * Dit stond eerst als losse kaart onder de leerroute, met een eigen kop en ondertitel. Dat waren
 * twee diagnoses op één scherm: hier de vaardigheden, en boven in de kopkaart drie concepten uit
 * dezelfde cijfers. De eigenaar heeft ze samengevoegd (14-09) — deze lijst staat nu rechts in de
 * kopkaart, naast de slaagkansmeter en onder de regel van de docent. Daarom rendert dit alleen de
 * lijst: de kaart eromheen is `SkillStatBar`.
 *
 * ── TWEE REGELS PER RIJ, NIET VIER ──────────────────────────────────────────
 * Elke rij had een kop, een balk, een bijschrift én een uitleg onder elkaar. Vijf vaardigheden
 * maakten dat een kolom van bijna achthonderd pixels naast een meter van tweehonderdvijftig, en
 * een diagnose die je moet scrollen is geen overzicht meer. Nu staat alles wat een getal is op
 * één regel — naam, bewijs ("3 van 9 goed · over 3 examens"), verloop, score — met de balk
 * eronder.
 *
 * **De uitleg staat alleen nog onder de zwakste rij**, op dezelfde grond als de lessen eronder:
 * die ene rij is waar je begint, en daar hoort te staan wát de vaardigheid is. Vijf uitleggen
 * onder elkaar zijn een woordenlijst, geen advies. Het verloop is daarbij teruggebracht tot het
 * getal met zijn pijl — "sinds je eerste sessie" stond vijf keer onder elkaar op dezelfde kaart.
 *
 * Server component: alles hier is al uitgerekend, er is niets interactiefs.
 */
export default function SkillWeakness({ data }: { data: Data }) {
  const { rows } = data;
  if (rows.length === 0) return null;

  return (
    <ul className="sw-list">
        {rows.map(r => {
          // Eén sessie is een meting en geen verloop: "gelijk gebleven" zou suggereren dat we
          // iets hadden om mee te vergelijken.
          const trend = r.delta === null ? null : r.delta > 0.15 ? 'up' : r.delta < -0.15 ? 'down' : 'flat';
          /*
           * Getint is "hier moet je kijken": alles onder de 40%. Dat is de enige markering die
           * deze lijst nog draagt — waar je begint staat in de uitgang onder de kaart.
           */
          const focus = r.pct !== null && r.pct < 40;

          return (
            <li key={r.key} className={`sw-row${focus ? ' sw-row-weak' : ''}`}>
              {/* Naam en verloop staan in één cel: alles wat mag meegroeien staat links, zodat de
                  balk en de score op elke rij op dezelfde x beginnen en eindigen. */}
              <span className="sw-name">
                <span className="sw-label">{r.label}</span>
                {trend === 'up' && (
                  <span className="sw-up">
                    <TrendingUp size={12} aria-hidden /> +{r.delta!.toFixed(1)}
                  </span>
                )}
                {trend === 'down' && (
                  <span className="sw-down">
                    <TrendingDown size={12} aria-hidden /> {r.delta!.toFixed(1)}
                  </span>
                )}
                {trend === 'flat' && (
                  <span className="sw-flat">
                    <Minus size={12} aria-hidden />
                  </span>
                )}
              </span>

              {/* Het bewijs ("3 van 9 goed · over 3 examens") staat alleen nog in het
                  toegankelijkheidslabel: op het scherm was het vier keer bijna dezelfde zin naast
                  een getal dat het al zei. */}
              {r.pct !== null ? (
                <span className="sw-bar" role="img" aria-label={`${r.label}: ${r.detail}`}>
                  <span
                    className="sw-bar-fill"
                    style={
                      {
                        width: `${r.pct}%`,
                        '--sw-a': SLAAGKANS_START,
                        '--sw-b': slaagkansKleur(r.pct),
                      } as React.CSSProperties
                    }
                  />
                </span>
              ) : (
                <span className="sw-bar sw-bar-empty" role="img" aria-label={`${r.label}: ${r.detail}`} />
              )}

              {/* Het getal draagt de kleur van de schaal, maar alleen in zijn twee leesbare
                  uiteinden: #a24000 zolang oranje de boventoon heeft, de navy van de schaal zodra
                  hij boven de 65% komt. De tinten dáártussen zijn balkkleuren, geen tekstkleuren. */}
              <span
                className="sw-score"
                style={r.pct === null ? undefined : { color: r.pct >= 65 ? slaagkansKleur(r.pct) : '#a24000' }}
              >
                {r.score !== null ? (
                  <>
                    {r.score.toFixed(1)}
                    <small> / {MAX_CRITERION_SCORE}</small>
                  </>
                ) : r.pct !== null ? (
                  <>
                    {r.pct}
                    <small>%</small>
                  </>
                ) : (
                  <small>—</small>
                )}
              </span>
            </li>
          );
      })}
    </ul>
  );
}
