'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Crumb } from '@/lib/portal-crumbs';

/**
 * Het kruimelpad van het studieportaal.
 *
 * Vervangt de losse terugknoppen (`.wt-back`) op elk leerscherm. Waarom een pad en niet één
 * knop: de leerlaag is vier niveaus diep — onderdeel → spoor → module → les — en één knop kan
 * daarvan alleen de vorige noemen. Wie in *De hoofdzin* zit en naar Luisteren wil, klikte drie
 * keer op "terug" en las drie keer een andere titel.
 *
 * **Het laatste kruimeltje is een keuzemenu naar zijn zusjes.** Dat is het hele punt van deze
 * vorm: zijwaarts springen — naar een andere les van dezelfde module, een andere module, een
 * ander onderdeel — zonder eerst omhoog. Welke zusjes dat zijn weet alleen de pagina, dus die
 * levert ze aan (`lib/portal-crumbs.ts`).
 *
 * Eén clientcomponent, en alleen voor het menu: de kruimels zelf zijn `<a>`'s die zonder JS
 * werken. De items in het menu zijn óók echte links, zodat middelklik en "open in nieuw
 * tabblad" doen wat ze horen te doen — `router.push` in een `onClick` breekt dat stil.
 */
export default function PortalCrumbs({ trail }: { trail: Crumb[] }) {
  const router = useRouter();
  if (trail.length === 0) return null;

  return (
    <nav className="crumbs" aria-label="Kruimelpad">
      <ol>
        {trail.map((crumb, i) => {
          const siblings = crumb.siblings ?? [];
          return (
            <li key={`${crumb.label}-${i}`}>
              {i > 0 && (
                <ChevronRight
                  size={13}
                  strokeWidth={2.4}
                  className="crumb-sep rtl-flip"
                  aria-hidden
                />
              )}

              {crumb.href ? (
                <a href={crumb.href} className="crumb">{crumb.label}</a>
              ) : (
                <span className="crumb is-here" aria-current="page">{crumb.label}</span>
              )}

              {siblings.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="crumb-pick"
                    aria-label={`${crumb.label} — kies een ander`}
                  >
                    <ChevronDown size={13} strokeWidth={2.6} aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="crumb-menu">
                    {siblings.map(s => (
                      <DropdownMenuItem
                        key={s.href}
                        /* `render` en niet `onClick`: zie de doc-comment. `router.push` blijft
                           als vangnet voor het toetsenbordpad van base-ui. */
                        render={<a href={s.href} />}
                        onClick={() => router.push(s.href)}
                        className={`crumb-opt${s.current ? ' is-current' : ''}${s.muted ? ' is-muted' : ''}`}
                      >
                        <span className="crumb-opt-tick" aria-hidden>
                          {s.current && <Check size={13} strokeWidth={3} />}
                        </span>
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
