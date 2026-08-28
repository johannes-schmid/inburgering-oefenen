import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isLevel, levelLabel, SKILLS } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchConcepts, fetchMastery } from '@/lib/lessons/concepts-server';
import { conceptPath, masteryState, weakestFirst } from '@/lib/lessons/lessons';
import { LensRing } from '@/components/horizon';
import AppShell from '../../../components/AppShell';

type Props = { params: Promise<{ locale: string; level: string }> };

export const metadata: Metadata = {
  title: 'Concepten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * De conceptenbibliotheek van één niveau.
 *
 * ── WAAROM DIT NIVEAUBREED IS EN NIET PER ONDERDEEL ──────────────────────────
 * Een concept staat één keer per niveau en wordt gedeeld door de onderdelen die het nodig
 * hebben — het perfectum is hetzelfde perfectum in Lezen en in Schrijven, en vier kopieën
 * ervan zouden uit elkaar gaan lopen. De chips op elke kaart ("KOMT IN LEZEN · SCHRIJVEN")
 * zeggen waar het terugkomt, en de detailpagina zegt per onderdeel of je daar toegang hebt.
 *
 * Wat wél per onderdeel is: de *oefening*. Die hangt aan de les, niet aan het concept.
 */
export default async function ConceptsPage({ params }: Props) {
  const { locale, level: rawLevel } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;

  const t = await getTranslations('lessons');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/concepten`);

  const concepts = await fetchConcepts(level);
  // Geen vrijgegeven concept = geen bibliotheek. Zelfde reviewgate als de cursus.
  if (!concepts.length) notFound();

  const [mastery, menu] = await Promise.all([
    fetchMastery(user.id, concepts.map(c => c.id)),
    fetchPortalMenu(),
  ]);

  const meta = user.user_metadata ?? {};
  const weakest = weakestFirst(concepts, mastery, 3);

  // Gegroepeerd zoals `concept_groups` het voorschrijft, met de strategieconcepten (die geen
  // groep hebben) in één bak onderaan: examenvakmanschap is geen grammatica-onderwerp.
  const groups = new Map<string, { name: string; sort: number; items: typeof concepts }>();
  for (const c of concepts) {
    const key = c.group?.slug ?? '_strategie';
    const entry = groups.get(key) ?? {
      name: c.group?.name_nl ?? t('group_strategy'),
      sort: c.group?.sort_order ?? 999,
      items: [],
    };
    entry.items.push(c);
    groups.set(key, entry);
  }
  const ordered = [...groups.values()].sort((a, b) => a.sort - b.sort);

  const skillName = (slug: string) => {
    const s = SKILLS.find(x => x.slug === slug);
    return s ? tSkills(`${s.key}.name`) : slug;
  };

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="concepten"
      activeGroup={level}
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-4xl mx-auto">

          <header className="mb-7">
            <a
              href={`/${locale}/dashboard/${level}`}
              className="text-xs font-bold text-on-surface-variant no-underline hover:underline"
            >
              ← {levelLabel(level)}
            </a>
            <h1
              className="mt-3 font-headline font-extrabold text-on-surface"
              style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em' }}
            >
              {t('concepts_title', { level: levelLabel(level) })}
            </h1>
            <p className="mt-1.5 text-sm text-on-surface-variant" style={{ lineHeight: 1.65 }}>
              {t('concepts_lede', { n: concepts.length })}
            </p>
          </header>

          {weakest.length > 0 && (
            <section className="mb-8">
              <span className="mini-label">{t('weakest_head')}</span>
              <div className="concept-grid mt-2">
                {weakest.map(({ concept, mastery: m }) => (
                  <a key={concept.id} href={`/${locale}${conceptPath(level, concept.slug)}`} className="concept-card">
                    <div className="flex items-center gap-3">
                      <LensRing size={44} ring={6}>
                        <span className="text-[0.7rem] font-extrabold">{m.mastery_pct}%</span>
                      </LensRing>
                      <div className="min-w-0">
                        <h3 className="cc-name truncate">{concept.name_nl}</h3>
                        <span className="cc-state">{t(`mastery.${masteryState(m)}`)}</span>
                      </div>
                    </div>
                    <p className="cc-one">{concept.one_liner}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {ordered.map(group => (
            <section key={group.name} className="mb-8">
              <h2
                className="font-headline font-extrabold text-primary mb-0.5"
                style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}
              >
                {group.name}
              </h2>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t('group_count', { n: group.items.length })}
              </p>
              <div className="concept-grid">
                {group.items.map(c => {
                  const m = mastery.get(c.id);
                  const state = masteryState(m);
                  return (
                    <a key={c.id} href={`/${locale}${conceptPath(level, c.slug)}`} className="concept-card">
                      <span className="cc-chips">
                        {t('appears_in')} {c.onderdelen.map(skillName).join(' · ')}
                      </span>
                      <h3 className="cc-name">{c.name_nl}</h3>
                      <p className="cc-one">{c.one_liner}</p>
                      {c.example_html && (
                        <p className="cc-example" dangerouslySetInnerHTML={{ __html: c.example_html }} />
                      )}
                      <span className="cc-foot">
                        <span className={`cc-state ${state}`}>{t(`mastery.${state}`)}</span>
                        {m && m.seen > 0 && <span className="cc-state">{m.correct}/{m.seen}</span>}
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
