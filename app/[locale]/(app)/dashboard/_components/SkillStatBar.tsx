import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { spoorPath } from '@/lib/lessons/sporen';
import type { Level, SkillSlug } from '@/data/skills';
import type { SlaagkansBand } from '@/lib/exam-readiness';
import SlaagkansGauge from '../components/SlaagkansGauge';
import type { SwRow } from './StrengthWeakness';

/**
 * De kop van een onderdeelpagina: wie je bent, hoe je ervoor staat, en wat de docent zegt.
 *
 * Eén kaart in twee lagen (mockup van de eigenaar, 08-09). Boven, van links naar rechts: de naam
 * met zijn ondertitel, de slaagkansmeter, en de concepten waar je nu het meeste laat liggen.
 * Onder, op het tonale vlak: de regel van de docent met de twee uitgangen. Dat verving de losse
 * kop, de zijkolom én het aparte docentpaneel — drie blokken die samen dit zeiden.
 *
 * **De meter is die van KNM en geen nieuwe tekening.** `SlaagkansGauge` staat op productie in het
 * KNM-portaal en draagt de banden klein · matig · redelijk · goed · groot om de boog; dat label
 * bij het getal is wat een kandidaat komt halen ("is 54% veel?"). Een tweede ring ernaast
 * ontwerpen zou dezelfde vraag met minder woorden beantwoorden.
 *
 * **De lagen worden gescheiden door een kleurwissel, niet door een lijn** (§2): de voet staat op
 * `surface-container-low`. Ook tussen de drie kolommen erboven staat geen streep — daar doet de
 * ruimte het werk.
 *
 * **De regel van de docent is regelgebaseerd, geen model** — vier gevallen, eerste match wint.
 * Dat hoort ook zo: de USP is dat er een docent achter staat, en een gegenereerde aanmoediging is
 * precies wat we niet verkopen. De logica komt uit `DocentPanel`, dat hierin is opgegaan.
 *
 * **Maximaal drie rijen, oplopend op zwakte, en alleen met bewijs** (`seen > 0`): een concept
 * waar nog geen opgave over gemaakt is, is geen zwakte maar de hele cursus.
 */
export default async function SkillStatBar({
  locale,
  level,
  skill,
  title,
  tagline,
  rows,
  slaagkans,
  band,
  examsCount,
  avgScore,
}: {
  locale: string;
  level: Level;
  skill: SkillSlug;
  title: string;
  tagline: string;
  /** Alle concepten van dit onderdeel, al gesorteerd op zwakte. */
  rows: SwRow[];
  slaagkans: number;
  band: SlaagkansBand;
  /** 0 betekent: nog niets gemeten. De meter zet dan een streepje in plaats van 0%. */
  examsCount: number;
  avgScore: number;
}) {
  const t = await getTranslations('portal');

  const seen = rows
    .filter(r => r.mastery && r.mastery.seen > 0)
    .sort((a, b) => a.mastery!.mastery_pct - b.mastery!.mastery_pct);
  const shown = seen.slice(0, 3);
  const weakest = shown[0];
  const weak = weakest && weakest.mastery!.mastery_pct < 60 ? weakest : null;
  const allStrong = seen.length >= 3 && seen.every(r => r.mastery!.mastery_pct >= 70);

  const line = weak
    ? t('docent_line_weak', { concept: weak.concept.name_nl })
    : allStrong
      ? t('docent_line_strong')
      : seen.length > 0
        ? t('docent_line_going')
        : t('docent_line_start');

  return (
    <section className="statbar">
      {/* De kop blijft een eigen regel boven de kaart-inhoud: het is de titel van de pagina, en
          in een kolom naast de meter leest hij als het label van die meter. */}
      <div className="sb-id">
        <h1>{title}</h1>
        <p>{tagline}</p>
      </div>

      <div className="sb-body">
        {/* Links de meter met waar hij op gebaseerd is, rechts wat je ermee moet doen — dezelfde
            tweedeling als het KNM-portaal op productie. */}
        <div className="sb-gaugecol">
          <div className="sb-gauge">
            <SlaagkansGauge
              value={slaagkans}
              examsCount={examsCount}
              avgScore={avgScore}
              band={band}
              bare
            />
          </div>
          <p className="sb-note">
            {examsCount > 0
              ? t('slaagkans_note', { count: examsCount, avg: avgScore })
              : t('slaagkans_note_empty')}
          </p>
        </div>

        {/* Het paneel staat op het tonale vlak: dat is de scheiding tussen de twee helften, geen
            lijn (§2). De volgorde is die van het gesprek — eerst wat de docent ziet, dan waar je
            zakt, dan de uitgang. */}
        <div className="sb-panel">
          <div className="sb-quote">
            <span className="sb-photo">
              <Image
                src="/images/marieke-schipper.jpg"
                alt={t('docent_name')}
                fill
                sizes="34px"
                style={{ objectFit: 'cover', objectPosition: '65% 30%' }}
              />
            </span>
            <p className="sb-line">
              <b>{t('docent_name')}:</b> &ldquo;{line}&rdquo;
            </p>
          </div>

          {shown.length > 0 && (
            <div className="sb-diag">
              <span className="sb-kick">{t('weak_head')}</span>
              <ul className="sb-rows">
                {shown.map(({ concept, mastery }) => (
                  <li key={concept.id}>
                    <span className="sb-row">
                      <span className="sb-nm">{concept.name_nl}</span>
                      <span className="sb-pct">{mastery!.mastery_pct}%</span>
                    </span>
                    <span className="sb-bar" aria-hidden>
                      <i style={{ width: `${Math.max(mastery!.mastery_pct, 2)}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sb-acts">
            {weak?.lessonHref && (
              <a href={`/${locale}${weak.lessonHref}`} className="sb-cta">
                {t('sw_to_lesson_short')}
                <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" />
              </a>
            )}
            {/* Naar stap 2 van déze cursus, en niet naar een niveaubrede bibliotheek: die is
                op 10-09 vervallen. Alle regels die dit examen vraagt staan daar, en dit is de
                plek waar je iets met een zwakte kunt doen. */}
            <a href={`/${locale}${spoorPath(level, skill, 'taalregels')}`} className="sb-link">
              {t('sw_all_rules')}
              <ArrowRight size={13} strokeWidth={2.4} className="rtl-flip" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
