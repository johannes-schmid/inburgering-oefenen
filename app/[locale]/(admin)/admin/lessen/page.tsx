import type { Metadata } from 'next';
import { Check, Clock, Eye, Lock } from 'lucide-react';
import { SKILLS, isSkillSlug, levelLabel, type SkillSlug } from '@/data/skills';
import { getTranslations } from 'next-intl/server';
import { levelFromSearch } from '@/lib/admin/nav';
import { fetchAdminLessons } from '@/lib/lessons/lessons-server';
import { lessonPath } from '@/lib/lessons/lessons';
import ReleaseButton from './ReleaseButton';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ niveau?: string; onderdeel?: string }>;
};

export const metadata: Metadata = {
  title: 'Lessen | Admin',
  robots: { index: false, follow: false },
};

/**
 * De lessen van één (niveau, onderdeel), en de plek waar de docent ze vrijgeeft.
 *
 * ── DIT SCHERM IS DE REVIEWGATE ──────────────────────────────────────────────
 * De seeder schrijft elke les `pending`, en `fetchCourse` laat alleen `validated` lessen in een
 * blok zien. Een geseede cursus is dus onzichtbaar in het portaal tot hier iemand op
 * "Vrijgeven" heeft geklikt. Dat is het verschil met de A2-examendataset, die `validated`
 * schreef vóór de docent ernaar had gekeken — het enige veld in dit systeem dat liegt.
 *
 * Daarom staat het aantal opgaven per les in de lijst: een les met twee opgaven is niet af, en
 * dat moet te zien zijn zónder hem te openen.
 *
 * ── HET NIVEAU ZIT IN DE NAVIGATIE, HET ONDERDEEL OP DE PAGINA ───────────────
 * Zoals overal in `/admin`: `?niveau=` komt uit de zijbalk (`lib/admin/nav.ts`), want "welke
 * catalogus" is de eerste beslissing. Het onderdeel is een tabstrip hier, want binnen één
 * niveau schakel je daar vaak tussen.
 */
export default async function AdminLessonsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const level = levelFromSearch(sp.niveau);
  const onderdeel: SkillSlug = isSkillSlug(sp.onderdeel ?? '') ? (sp.onderdeel as SkillSlug) : 'lezen';

  // `/admin` heeft geen eigen vertalingen (het staat niet in `i18n/routing.ts`), maar de
  // onderdeelnamen staan al in de `skills`-namespace en die hergebruiken is beter dan een
  // tweede lijst met dezelfde vier woorden.
  const tSkills = await getTranslations('skills');

  // KNM heeft hier geen tab (zie `lib/admin/nav.ts`), dus `level` is nooit null op dit scherm.
  const blocks = level ? await fetchAdminLessons(level, onderdeel) : [];

  const all = blocks.flatMap(b => b.lessons);
  const released = all.filter(l => l.review_status === 'validated').length;

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-6">
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          Lessen · {level ? levelLabel(level) : '—'}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {all.length === 0
            ? 'Er is nog geen cursus geseed voor dit onderdeel.'
            : `${released} van ${all.length} lessen vrijgegeven. Een les die niet is vrijgegeven ` +
              'staat in geen blok, geen menu en geen voortgang — maar is wél te bekijken.'}
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="Onderdeel">
        {SKILLS.map(s => {
          const on = s.slug === onderdeel;
          return (
            <a
              key={s.slug}
              href={`/${locale}/admin/lessen?niveau=${level}&onderdeel=${s.slug}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold no-underline ${
                on ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {tSkills(`${s.key}.name`)}
            </a>
          );
        })}
      </nav>

      {blocks.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
          Nog geen blokken. Run <code>node scripts/lesson-content/seed.mjs {level}:{onderdeel}</code>.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {blocks.map(block => (
            <section key={block.id} className="course-block">
              <div className="cb-head">
                <span className="cb-letter">{block.letter}</span>
                <h2 className="cb-title">{block.name_nl}</h2>
                <span className="cb-count">
                  {block.lessons.filter(l => l.review_status === 'validated').length}/{block.lessons.length} vrijgegeven
                </span>
              </div>

              {block.lessons.length === 0 ? (
                <p className="cb-intro m-0">Geen lessen in dit blok.</p>
              ) : (
                <ul className="cb-lessons">
                  {block.lessons.map(les => {
                    const live = les.review_status === 'validated';
                    // Een les met minder dan vier opgaven is bijna altijd onvolledig. Het is een
                    // waarschuwing en geen blokkade: de docent beslist, niet dit scherm.
                    const thin = les.exerciseCount < 4;
                    return (
                      <li key={les.id} className="admin-les-row">
                        <span className="admin-les-state" aria-hidden>
                          {live
                            ? <Check size={15} strokeWidth={3} className="text-secondary" />
                            : <Clock size={14} strokeWidth={2.5} className="text-outline" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-on-surface">{les.title}</span>
                          <span className="block text-xs text-on-surface-variant">
                            {les.itemCount} items · {les.exerciseCount} opgaven
                            {thin && <strong className="text-secondary"> · weinig opgaven</strong>}
                            {les.is_free && ' · gratis'}
                            {les.conceptNames.length > 0 && ` · ${les.conceptNames.join(', ')}`}
                          </span>
                          {live && les.reviewed_by && (
                            <span className="block text-[0.7rem] text-outline">
                              nagekeken door {les.reviewed_by}
                              {les.reviewed_on ? ` op ${les.reviewed_on}` : ''}
                            </span>
                          )}
                        </span>

                        <a
                          href={`/${locale}${lessonPath(level!, onderdeel, les.slug)}`}
                          className="admin-les-link"
                          title="Bekijk de les zoals de cursist hem ziet"
                        >
                          <Eye size={14} strokeWidth={2.4} /> Bekijken
                        </a>
                        <ReleaseButton lessonId={les.id} released={live} />
                        {!live && <Lock size={12} strokeWidth={2.5} className="text-outline" aria-hidden />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
