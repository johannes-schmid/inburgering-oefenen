import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoMark from '@/components/site/LogoMark';
import AuthPanel from '@/components/auth/AuthPanel';
import { authErrorMessage, safeNext } from '@/lib/auth-redirect';
import { SKILLS, getFormat } from '@/data/skills';

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
 */
export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(safeNext(next ?? null, `/${locale}/dashboard`));

  // A2's numbers: this panel sells the free tier, and the free tier is A2 exam 1 of each
  // onderdeel (isFreeExam). Quoting the combined A2+B1 catalogue here would advertise exams
  // that signing up does not get you.
  const stats = [
    { val: String(SKILLS.length), label: 'onderdelen' },
    { val: String(getFormat('a2', 'lezen').examCount), label: 'oefenexamens elk' },
    { val: '4', label: 'gratis examens' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg,#002b6d 0%,#001844 55%,#001030 100%)' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(70% 55% at 88% 4%, rgba(254,118,44,0.20), transparent 55%)' }}
      />

      <header className="relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <LogoMark size={30} surface="dark" />
            <span className="text-lg font-extrabold tracking-tight text-white font-headline">
              Inburgering Oefenen
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-white/90 hover:text-white transition-colors no-underline"
          >
            Al een account? Inloggen →
          </Link>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-14 items-center">
          <div>
            <span
              className="inline-block text-xs font-extrabold uppercase mb-3"
              style={{ color: '#fe762c', letterSpacing: '0.14em' }}
            >
              Gratis beginnen
            </span>
            <h1
              className="font-headline font-extrabold text-white mb-3.5"
              style={{ fontSize: 'clamp(1.9rem,4.5vw,2.6rem)', lineHeight: 1.08, letterSpacing: '-0.02em', textWrap: 'balance' }}
            >
              Oefen het inburgeringsexamen A2 met opgaven van een NT2-docent.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed mb-7 max-w-[46ch]" style={{ color: 'rgba(255,255,255,0.68)' }}>
              Maak een account en begin meteen met oefenexamen 1 van lezen, luisteren, schrijven
              en spreken — gratis, en met je voortgang per onderdeel.
            </p>

            <div className="flex gap-5 sm:gap-7 mb-7">
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-stretch gap-5 sm:gap-7">
                  {i > 0 && <span className="w-px" style={{ background: 'rgba(255,255,255,0.15)' }} aria-hidden />}
                  <div>
                    <div
                      className="font-headline font-extrabold text-white"
                      style={{ fontSize: 'clamp(1.4rem,3vw,1.7rem)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {s.val}
                    </div>
                    <div className="uppercase" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <span
                className="w-9 h-9 rounded-[10px] overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'linear-gradient(135deg,#1d428a,#002b6d)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/marieke-schipper.jpg"
                  alt="Marieke Schipper"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover object-top"
                />
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                Opgaven gemaakt en nagekeken door{' '}
                <Link href="/docent" className="font-bold text-white no-underline hover:underline">
                  Marieke Schipper
                </Link>
              </span>
            </div>
          </div>

          <div
            className="bg-surface-container-lowest rounded-[22px] p-7 sm:p-8"
            style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.40),0 2px 8px rgba(0,0,0,0.12)' }}
          >
            <h2
              className="font-headline font-extrabold text-on-surface mb-1.5"
              style={{ fontSize: '1.25rem', letterSpacing: '-0.015em' }}
            >
              Maak je account
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Geen betaalgegevens nodig om te beginnen.
            </p>

            <AuthPanel mode="register" locale={locale} next={next ?? null} initialError={authErrorMessage(error)} />

            <p className="text-xs text-on-surface-variant text-center mt-5 leading-relaxed">
              Door een account te maken ga je akkoord met onze{' '}
              <Link href="/gebruiksvoorwaarden" className="text-primary hover:underline no-underline">
                gebruiksvoorwaarden
              </Link>{' '}
              en ons{' '}
              <Link href="/privacybeleid" className="text-primary hover:underline no-underline">
                privacybeleid
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <footer
        className="relative text-center py-6 text-xs"
        style={{ color: 'rgba(255,255,255,0.55)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        © 2026 Inburgering Oefenen ·{' '}
        <a
          href="mailto:contact@inburgeringoefenen.nl"
          className="hover:text-white no-underline transition-colors"
        >
          contact@inburgeringoefenen.nl
        </a>
      </footer>
    </div>
  );
}
