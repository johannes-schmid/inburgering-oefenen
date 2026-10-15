import { getTranslations } from 'next-intl/server';
import { DEFAULT_LEVEL, SKILLS, getFormat } from '@/data/skills';
import { KNM_WOORDKAARTEN } from '@/data/woordkaarten';
import { ONA_CARD_COUNT } from '@/data/ona/cards';
import { isOnaAvailable } from '@/lib/ona/access';
import { localeHref } from '@/i18n/paths';
import SectionHeading from '@/components/glas/SectionHeading';
import TrackCard from './TrackCard';

/** De trackband van de homepage, gedeeld door `/` en `/home-b` zodat de twee varianten hetzelfde blok tonen. */
/** `centered`: kop en inleiding gecentreerd boven de kaarten, zoals de secties van variant B. */
export default async function HomeTracks({ locale, centered = false }: { locale: string; centered?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const A2_CHIPS = SKILLS.map(s => ({ slug: s.slug, name: tSkills(`${s.key}.name`) }));

  /* Geteld uit de kaarten zelf, niet getypt: een kaart erbij of eraf verandert het getal mee. */
  const KNM_WORDS = KNM_WOORDKAARTEN.themes.reduce((n, theme) => n + theme.words.length, 0);

  /* B1's chips are the onderdelen that actually have something behind them, derived from the same
     fact the overview page's `robots` reads: `itemCount === null` means DUO's format at this level
     is unverified, which is B1 Luisteren and only B1 Luisteren. So this list is Lezen, Schrijven
     and Spreken, and it will pick up Luisteren automatically on the commit that counts its format
     off real material — rather than needing someone to remember this line. Linking Luisteren today
     would put a `noindex` page behind a chip on the most-linked page on the site. */
  const B1_CHIPS = SKILLS
    .filter(s => getFormat('b1', s.slug).itemCount !== null)
    .map(s => ({ slug: s.slug, name: tSkills(`${s.key}.name`) }));

  /* ── DE TRACKBAND — het hele traject, in DUO's eigen volgorde ──
        **A2 → B1 → KNM → ONA, en die volgorde is gebrond, niet gekozen** (`SEO/facts.md` §7): de
        taalonderdelen eerst, dan KNM, dan ONA. A2 en B1 zijn twee niveaus van dezelfde vier
        onderdelen, dus ze staan naast elkaar.

        **De onderdelen in de kop zijn links, en dat is een productregel**: de homepage moet alle
        vier de taalonderdelen linken (CLAUDE.md §3, `tests/public.spec.js`). Ze staan als de
        mono-regel uit glas.html §08 in de kaartkop, niet meer als rij chips: die maakten van elke
        kaart een formulier (feedback eigenaar 15-10). A2 leest ze uit `SKILLS`, B1 uit dezelfde
        taxonomie gefilterd op een geverifieerd formaat (dus geen Luisteren B1 tot dat geteld is).
        Beschikbaarheid staat in de tekst — de B1-noot, de badge — nooit in de kleur.
        Kaartkoppen: Gracht, Dageraad voor KNM, Nevel voor ONA (glas.html §08 "Track-kaart"). */
  return (
    <section id="onderdelen" aria-labelledby="blocks-heading" className="g-sec g-glow g-glow-start g-glow-soft">
      <div className="g-wrap">
        {centered ? (
          <div className="g-hb-center g-hb-tracks-head">
            <h2 id="blocks-heading" className="g-hb-h2 g-hb-h2-lg">{t('blocks_heading')}</h2>
            <p className="g-hb-lead">{t('blocks_intro')}</p>
          </div>
        ) : (
          <SectionHeading id="blocks-heading" title={t('blocks_heading')} aside={t('blocks_intro')} className="mb-12" />
        )}
        <div className="g-tracks">
          <TrackCard
            track="a2"
            title={t('blocks_a2_title')}
            desc={t('blocks_a2_desc')}
            chips={A2_CHIPS.map(chip => ({ key: chip.slug, name: chip.name, href: localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${chip.slug}`) }))}
            badge={t('track_live')}
            ctaLabel={t('blocks_a2_cta')}
            href={localeHref(locale, `oefenen`)}
          />
          <TrackCard
            track="b1"
            title={t('blocks_b1_title')}
            desc={t('blocks_b1_desc')}
            chips={B1_CHIPS.map(chip => ({ key: chip.slug, name: chip.name, href: localeHref(locale, `oefenexamen/b1/${chip.slug}`) }))}
            badge={t('track_live')}
            note={t('blocks_b1_note')}
            ctaLabel={t('blocks_b1_cta')}
            href={localeHref(locale, `oefenen/b1/lezen`)}
          />
          {/* KNM krijgt de gloed (Dageraad): op deze rij staat geen oranje knop (glas.html §08). */}
          <TrackCard
            track="knm"
            variant="dageraad"
            title={t('blocks_knm_title')}
            desc={t('blocks_knm_desc')}
            meta={t('blocks_knm_meta', { words: KNM_WORDS })}
            badge={t('track_live')}
            ctaLabel={t('blocks_knm_cta')}
            href={localeHref(locale, `oefenexamen/knm`)}
          />
          {/* ONA volgt `isOnaAvailable()` — dezelfde vlag als het portaal, het menu en de checkout.
              Live wijst de knop naar het portaal; anders is het de aankondiging met `/contact`. */}
          {isOnaAvailable() ? (
            <TrackCard
              track="ona"
              variant="nevel"
              title={t('blocks_ona_title')}
              desc={t('blocks_ona_desc')}
              meta={t('blocks_ona_meta', { cards: ONA_CARD_COUNT })}
              badge={t('track_new')}
              ctaLabel={t('blocks_ona_cta')}
              href={localeHref(locale, `dashboard/ona`)}
            />
          ) : (
            <TrackCard
              track="ona"
              variant="nevel"
              muted
              badge={t('pkg_soon')}
              title={t('blocks_ona_title')}
              desc={t('blocks_ona_desc')}
              meta={t('blocks_ona_meta', { cards: ONA_CARD_COUNT })}
              ctaLabel={t('blocks_notify')}
              href={localeHref(locale, `contact`)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
