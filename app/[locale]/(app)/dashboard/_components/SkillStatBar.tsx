import { getTranslations } from 'next-intl/server';
import { CategoryMark, type Category } from '@/components/horizon';
import type { SlaagkansBand } from '@/lib/exam-readiness';
import SlaagkansGauge from '../components/SlaagkansGauge';
import SkillWeakness from '@/components/exam/SkillWeakness';
import type { SkillWeakness as WeaknessData } from '@/lib/vaardigheden-server';

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
 * **De opbouw is vlak 3B van het ontwerp** (Claude Design, "Lezen Overzicht", 14-09): de ring en
 * de uitsplitsing naast elkaar op één wit vlak, en dááronder de regel van de docent met de
 * uitgang ernaast. De regel stond eerst bóven de rijen, naast de meter — daar las hij als het
 * bijschrift van die ene kolom, terwijl hij over de hele diagnose gaat.
 *
 * **De lagen worden gescheiden door een kleurwissel, niet door een lijn** (§2): de voet staat op
 * `surface-container-low`. Ook tussen de drie kolommen erboven staat geen streep — daar doet de
 * ruimte het werk.
 *
 * **De regel van de docent is eruit** (eigenaar, 14-09). Hij was regelgebaseerd en zei in woorden
 * wat de rij eronder in cijfers zegt; twee stemmen over dezelfde vaardigheid maken de kaart langer
 * zonder hem iets te laten zeggen. De foto en de aanhaling zijn daarmee ook weg.
 *
 * **Rechts staan de vaardigheden, niet meer drie losse concepten** (eigenaar, 14-09). Die
 * stonden hier eerst als top-3 uit `user_concept_mastery`, terwijl "Je vaardigheden" als eigen
 * kaart lager op dezelfde pagina dezelfde vraag beantwoordde uit ander bewijs. Twee diagnoses op
 * één scherm met verschillende getallen is precies waar dit portaal al eerder op stukliep, dus is
 * de kaart hierin opgegaan en is dit de enige plek waar staat waar je zakt.
 *
 * **De voetregel is eruit tot er een foutenscherm is** (eigenaar, 14-09). Daar stonden "Naar de
 * les" en "Alle regels van dit onderdeel"; de eerste wees naar de les achter je zwakste
 * vaardigheid, en dat is precies de vraag die het inzichtscherm met de foutenwachtrij gaat
 * beantwoorden. Eén uitgang die half doet wat dat scherm straks heel doet, is een tweede antwoord
 * op dezelfde vraag — dus wacht hij daarop. De leerroute eronder op dezelfde pagina blijft de weg
 * naar de lessen.
 *
 * De lijst zelf is `components/exam/SkillWeakness.tsx`, ongewijzigd van vorm — hij rendert alleen
 * de rijen, want de kaart eromheen is deze.
 */
export default async function SkillStatBar({
  category,
  title,
  tagline,
  weakness,
  slaagkans,
  band,
  examsCount,
  avgScore,
  facts = null,
}: {
  /** Het onderdeel, als categoriemerk naast de naam. */
  category: Category;
  title: string;
  tagline: string;
  /** De vaardigheden van dit onderdeel, zwakste eerst. `null` als er nog niets te zeggen valt. */
  weakness: WeaknessData | null;
  slaagkans: number;
  band: SlaagkansBand;
  /** 0 betekent: nog niets gemeten. De meter zet dan een streepje in plaats van 0%. */
  examsCount: number;
  avgScore: number;
  /**
   * De feiten van de module: wat een examen inhoudt en hoeveel je er gemaakt hebt.
   *
   * Alleen te zien zolang er géén uitsplitsing is, en dan in de rechterkolom: zonder iets daar
   * stond de meter in een kolom van 262px met een leeg vlak ernaast. Zodra de uitsplitsing er is
   * verdwijnen ze (eigenaar, 15-09) — ze stonden toen onder de meter, waar ze de diagnose naar
   * beneden duwden en vier getallen herhaalden die de kaart en de strook eronder al noemen.
   */
  facts?: React.ReactNode;
}) {
  const t = await getTranslations('portal');

  return (
    <section className="statbar">
      {/* De kop blijft een eigen regel boven de kaart-inhoud: het is de titel van de pagina, en
          in een kolom naast de meter leest hij als het label van die meter. */}
      <div className="sb-id">
        {/* Het officiële merk van het onderdeel (§7): `CategoryMark` op de lichte tegel, want dit
            benoemt wat er ín een traject zit. Geen lucide-glyph en geen eigen tekening — dezelfde
            Lezen die in de zijbalk en op de homepage staat. */}
        <CategoryMark category={category} size={38} />
        <h1>{title}</h1>
        <p>{tagline}</p>
      </div>

      <div className="sb-body">
        {/* Links de meter met waar hij op gebaseerd is, rechts waar je zakt — het vlak van 3B:
            twee kolommen op één wit vlak, en de scheiding is de tint van de rijen, geen lijn. */}
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

        {/* Geen kop zonder lijst. In productie is `question_concepts` nog leeg — de tagger heeft
            er nooit gedraaid — dus `weakness` is daar `null`, en een kopregel "waar je nu zakt"
            boven niets is een belofte die het scherm niet waarmaakt. */}
        {weakness ? (
          <div className="sb-panel">
            {/* Zolang er nergens genoeg antwoorden zijn staat er geen enkel cijfer in de
                lijst, en dan is "waar je nu zakt · zwakste eerst" een belofte die de rijen niet
                waarmaken — er is niets gesorteerd en niets gemeten. De kop zegt dan wat de lijst
                wél is: waarop dit onderdeel je beoordeelt. */}
            <span className="sb-kick">
              {weakness.rows.some(r => r.pct !== null) ? t('weak_head') : t('weak_head_empty')}
            </span>
            <SkillWeakness data={weakness} />
          </div>
        ) : facts}
      </div>

    </section>
  );
}
