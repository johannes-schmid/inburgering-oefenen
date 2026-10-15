import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight } from 'lucide-react';
import LogoMark from '@/components/site/LogoMark';
import { Field, GlassCard, SectionHeading } from '@/components/glas';
import AuthPanel from '@/components/auth/AuthPanel';
import { authErrorMessage, safeNext } from '@/lib/auth-redirect';
import { KNM, SKILLS, getFormat } from '@/data/skills';

export const metadata: Metadata = {
  title: 'Account aanmaken | Inburgering Oefenen',
  robots: { index: false, follow: true },
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; module?: string; error?: string }>;
};

/**
 * The copy here was KNM's — it promised "Slaag voor je KNM-examen", 40 free questions and
 * woordkaarten, none of which is this product. Every number below comes from
 * `data/skills.ts`, so it cannot drift from what is actually shipped, and the free offer is
 * stated as it really is: exam 1 of each onderdeel, not "40 vragen gratis".
 *
 * It said "het inburgeringsexamen A2" and counted four onderdelen for as long as A2 was the
 * whole product. It is not: the taalonderdelen ship at A2 and B1, and KNM is the fifth
 * onderdeel. The panel now names the platform, and the numbers count what an account actually
 * opens — the four taalonderdelen plus KNM, and exam 1 of each of the five, free.
 */
export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(safeNext(next ?? null, `/${locale}/dashboard`));

  // This panel sells the free tier, and the free tier is exam 1 of each A2 onderdeel plus KNM
  // exam 1 (isFreeExam / the KNM module's own free slot). Quoting the whole A2+B1+KNM
  // catalogue here would advertise exams that signing up does not get you.
  const onderdelen = [...SKILLS, KNM].length;
  const stats = [
    { val: String(onderdelen), label: 'onderdelen' },
    { val: String(getFormat('a2', 'lezen').examCount), label: 'oefenexamens elk' },
    { val: String(onderdelen), label: 'gratis examens' },
  ];

  return (
    <Field variant="gracht" veil className="auth-g-page">
      <span className="auth-g-orbs" aria-hidden="true"><i /><i /><i /></span>
      <header className="g-wrap w-full flex items-center justify-between gap-4 py-5">
        <Link href="/" className="auth-g-brand">
          <LogoMark size={32} />
          <span className="auth-g-brand-name">Inburgering Oefenen</span>
        </Link>
        <Link href="/login" className="g-tlink text-sm whitespace-nowrap">
          Al een account? Inloggen
          <ArrowRight size={16} className="rtl-flip" aria-hidden />
        </Link>
      </header>

      <main className="flex-1 flex items-center px-4 py-10 sm:py-16">
        <div className="g-wrap w-full grid lg:grid-cols-[minmax(0,1fr)_420px] gap-10 lg:gap-16 items-center">
          <div>
            {/* "Gratis beginnen" was een kicker boven de kop; Glas kent geen kicker, dus het is de
                eerste helft van de kop geworden en de belofte de stille tweede regel. */}
            <SectionHeading
              as="h1"
              size="h1"
              onField
              title="Gratis beginnen."
              muted="Oefen je hele inburgering met opgaven van een NT2-docent."
            />
            <p className="g-lead mt-5 mb-8">
              Maak een account en begin meteen met oefenexamen 1 van lezen, luisteren, schrijven,
              spreken en KNM — gratis, en met je voortgang per onderdeel. Daarna oefen je verder
              op A2 en op B1.
            </p>

            <dl className="flex flex-wrap gap-x-10 gap-y-4 mb-8 m-0">
              {stats.map(s => (
                <div key={s.label} className="flex flex-col-reverse gap-1">
                  <dt className="g-mono">{s.label}</dt>
                  <dd className="m-0 font-headline font-bold text-navy text-[34px] leading-none tracking-[-0.04em] tabular-nums">
                    {s.val}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-g-sm overflow-hidden flex-shrink-0 bg-navy">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/amber-van-der-zalm-264.webp"
                  alt="Amber van der Zalm"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover object-top"
                />
              </span>
              <span className="text-sm text-ink-2">
                Opgaven gemaakt en nagekeken door{' '}
                <Link href="/docent" className="auth-g-link">
                  Amber van der Zalm
                </Link>
              </span>
            </div>
          </div>

          <GlassCard strong className="auth-g-card">
            <h2 className="auth-g-title">Maak je account</h2>
            <p className="auth-g-intro">Geen betaalgegevens nodig om te beginnen.</p>

            <AuthPanel mode="register" locale={locale} next={next ?? null} initialError={authErrorMessage(error)} glas />

            <p className="auth-g-note mt-5">
              Door een account te maken ga je akkoord met onze{' '}
              <Link href="/gebruiksvoorwaarden">gebruiksvoorwaarden</Link> en ons{' '}
              <Link href="/privacybeleid">privacybeleid</Link>.
            </p>
          </GlassCard>
        </div>
      </main>

      <footer className="auth-g-foot">
        © 2026 Inburgering Oefenen ·{' '}
        <a href="mailto:contact@inburgeringoefenen.nl" className="auth-g-link font-normal">
          contact@inburgeringoefenen.nl
        </a>
      </footer>
    </Field>
  );
}
