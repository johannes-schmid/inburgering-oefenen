import type { Metadata } from 'next';
import { SKILLS, isSkillSlug, levelLabel, type SkillSlug } from '@/data/skills';
import { getTranslations } from 'next-intl/server';
import { levelFromSearch } from '@/lib/admin/nav';
import { fetchAdminWords } from '@/lib/admin/words';
import WoordenTable from './_components/WoordenTable';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ niveau?: string; onderdeel?: string }>;
};

export const metadata: Metadata = {
  title: 'Woorden | Admin',
  robots: { index: false, follow: false },
};

export const revalidate = 0;

/**
 * De woordenlijst van de leerlaag: `lesson_words`, per (niveau, onderdeel).
 *
 * ── DIT IS NIET /admin/woordkaarten ──────────────────────────────────────────
 * Dat scherm beheert de 366 **KNM**-woordkaarten in `word_cards`, met KNM's zeven thema's, een
 * foto per kaart en vier vertaaltalen. Deze woorden zijn de leerwoorden van een cursus: ze zijn
 * gekeyd op (niveau, onderdeel, dutch), hun thema is een vrij tekstveld dat uit de cursus komt, en
 * de `woordenlijst`-items in blok A verwijzen ernaar met `word_ids`. Eén scherm voor beide zou
 * twee verschillende sleutels moeten laten doen alsof ze dezelfde zijn — en dat is precies hoe een
 * A2-Lezen-woord onder een KNM-thema belandt.
 *
 * Tot nu toe waren deze woorden alleen te wijzigen door opnieuw te seeden, terwijl ze wél op de
 * woordenlijstpagina van blok A en in de woordkaartendeck van het portaal staan.
 *
 * ── HET NIVEAU ZIT IN DE NAVIGATIE, HET ONDERDEEL OP DE PAGINA ───────────────
 * Zoals overal in `/admin`, en om dezelfde reden als bij Lessen: "welke catalogus" is de eerste
 * beslissing, het onderdeel schakel je daarbinnen vaak.
 */
export default async function AdminWordsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const level = levelFromSearch(sp.niveau);
  const onderdeel: SkillSlug = isSkillSlug(sp.onderdeel ?? '') ? (sp.onderdeel as SkillSlug) : 'lezen';

  const tSkills = await getTranslations('skills');

  // KNM heeft hier geen tab (`lesson_words.level` is NOT NULL), dus `level` is nooit null.
  const words = level ? await fetchAdminWords(level, onderdeel) : [];

  return (
    <div className="flex h-full flex-col overflow-hidden p-5 sm:p-8">
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          Woorden · {level ? levelLabel(level) : '—'}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          De leerwoorden van deze cursus. De <strong>woordenlijst</strong>-items in blok A verwijzen
          hiernaar met hun id — een woord hier corrigeren landt dus in elke les die het gebruikt.
        </p>
      </header>

      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Onderdeel">
        {SKILLS.map(s => {
          const on = s.slug === onderdeel;
          return (
            <a
              key={s.slug}
              href={`/${locale}/admin/woorden?niveau=${level}&onderdeel=${s.slug}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold no-underline ${
                on ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {tSkills(`${s.key}.name`)}
            </a>
          );
        })}
      </nav>

      {level
        ? <WoordenTable words={words} level={level} onderdeel={onderdeel} />
        : (
          // `?niveau=knm` is met de hand te typen. De navigatie linkt het niet, want
          // `lesson_words.level` is NOT NULL en KNM's woorden staan in `word_cards`.
          <p className="rounded-2xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
            KNM heeft geen leerwoordenlijst — die 366 kaarten staan onder{' '}
            <a href={`/${locale}/admin/woordkaarten`} className="font-bold text-primary">Woordkaarten</a>.
          </p>
        )}
    </div>
  );
}
