'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, LayoutDashboard, LogOut, Mail, Plus, Shapes, BookText, Layers, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LogoMark from '@/components/site/LogoMark';
import CategoryMark from '@/components/horizon/CategoryMark';
import { KNM_SLUG, LEVELS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import type { PortalMenu, PortalMenuGroup } from '@/lib/portal-menu';
import type { PortalNav } from './nav';

/**
 * De portaalzijbalk: **één navy kolom, met de modules uitklapbaar.**
 *
 * Dit vervangt het rail+paneel van 27-08 (beslissing eigenaar, 29-08, naar de mockup
 * "Studieportaal Navigatie Opties"). Die twee vaste kolommen droegen twee assen — welke module
 * en waar daarbinnen — op élke pagina, terwijl er op de meeste maar één te zeggen valt: het
 * tweede paneel stond vol met een module waar je niet in zat, en op de portaaloverzichtspagina
 * met een module die je niet had gekozen. Een tweede kolom is nu de uitzondering en verschijnt
 * alleen in een cursus of in de conceptenbibliotheek — zie `LearnPanel`.
 *
 * Daarmee komt de uitklapstaat terug, en die is `localStorage` en geen `useState` alleen: elke
 * portaalpagina is een servercomponent, dus de zijbalk hermount bij iedere navigatie en gewone
 * state zou het menu dichtklappen op het moment dat je op een van zijn eigen kinderen klikt.
 * Hij initialiseert uit `activeGroup` en niet uit storage — storage lezen tijdens render kost
 * een hydratiefout op elke pagina — en de effect verzoent daarna. **Op de module staan wint
 * altijd van een opgeslagen "dicht"**: het menu dichtklappen dat de huidige pagina bevat
 * verbergt precies waar je bent.
 */

const STORAGE_KEY = 'portal-open-modules';

/** KNM heeft geen niveau en hoort achteraan, achter de niveaus in hun eigen volgorde. */
function order(group: PortalMenuGroup): number {
  return group.level === null ? 99 : LEVELS.indexOf(group.level);
}

interface Props {
  locale: string;
  email: string;
  avatarUrl?: string;
  active: PortalNav;
  activeGroup: string | null;
  menu: PortalMenu | null;
  isGuest?: boolean;
}

export default function PortalSidebar({
  locale, email, avatarUrl = '', active, activeGroup, menu, isGuest = false,
}: Props) {
  const t = useTranslations('portal');
  const tSkills = useTranslations('skills');
  const tNav = useTranslations('nav');
  const supabase = createClient();

  /**
   * De catalogusvolgorde — A2, B1, KNM — en níet bezit-eerst.
   *
   * `PortalMenu` splitst op bezit omdat het oude paneel dat nodig had; in één zijbalk zou het
   * betekenen dat KNM tussen A2 en B1 in springt zodra je KNM koopt. Een menu waarvan de
   * volgorde meebeweegt met je bestellingen is geen menu meer. Bezit blijft zichtbaar in de
   * rijen zelf: wat niet van jou is staat doffer.
   */
  const groups: PortalMenuGroup[] = [...(menu?.owned ?? []), ...(menu?.available ?? [])]
    .sort((a, b) => order(a) - order(b));

  /**
   * Eén module staat open bij binnenkomst: die van de huidige pagina, en anders de eerste die
   * je hebt. Alles dicht op het portaaloverzicht maakt van de zijbalk een lijst van drie
   * woorden waar niets in te doen is.
   */
  const [open, setOpen] = useState<string[]>(
    [activeGroup ?? (menu?.owned ?? [])[0]?.id ?? groups[0]?.id].filter(Boolean) as string[],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(stored)) return;
      setOpen(activeGroup ? [...new Set([...stored, activeGroup])] : stored);
    } catch {
      /* Een menu mag de pagina die het versiert nooit kunnen breken. */
    }
  }, [activeGroup]);

  function toggle(id: string) {
    setOpen(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* zie boven */ }
      return next;
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const showExtend = (menu?.available.length ?? 1) > 0
    || groups.some(g => g.items.some(i => !i.owned));

  return (
    <aside id="dash-side" aria-label={t('nav_aria')}>
      <a href={`/${locale}/dashboard`} className="side-logo" aria-label="Inburgering Oefenen">
        <LogoMark size={34} surface="dark" />
        <span>Inburgering<br />Oefenen</span>
      </a>

      <div className="side-scroll">
        <a
          href={`/${locale}/dashboard`}
          aria-current={active === 'overview' ? 'page' : undefined}
          className={`side-row${active === 'overview' ? ' on' : ''}`}
        >
          <span className="side-ic"><LayoutDashboard size={16} strokeWidth={2.1} /></span>
          <span className="side-lb">{t('nav_overview')}</span>
        </a>

        <p className="side-label">{t('nav_modules')}</p>

        {groups.map(group => {
          const expanded = open.includes(group.id);
          const inGroup = activeGroup === group.id;
          const isKnm = group.id === KNM_SLUG;
          // KNM's enige onderdeel *is* de module, dus zijn rij en de moduleoverzichtsrij zijn
          // dezelfde URL. Twee rijen naar dezelfde pagina leest als een renderfout.
          const items = group.items.filter(i => i.href !== group.href);
          const onModule = inGroup && active === 'overview-module';

          return (
            <div key={group.id} className={`side-group${expanded ? ' open' : ''}`}>
              {/* De rij is een link en de chevron een aparte trigger — shadcns
                  `SidebarMenuAction`-vorm. De hele rij tot toggle maken is nettere markup en
                  neemt je de modulepagina af, en dát is de pagina waar de rij voor bestaat. */}
              <div className={`side-mod${inGroup ? ' within' : ''}${onModule ? ' on' : ''}`}>
                <a
                  href={`/${locale}${group.href}`}
                  aria-current={onModule ? 'page' : undefined}
                  className="side-mod-link"
                >
                  {group.badge
                    ? <span className="side-badge">{group.badge}</span>
                    : <span className="side-badge mark"><CategoryMark category="knm" size={19} tone="dark" /></span>}
                  <span className="side-lb">
                    {group.level ? t('level_section', { level: group.badge ?? '' }) : group.label}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  aria-expanded={expanded}
                  aria-label={group.label}
                  className="side-chev"
                >
                  <ChevronRight size={15} strokeWidth={2.4} />
                </button>
              </div>

              {expanded && (
                <div className="side-sub">
                  {items.map(item => {
                    const on = inGroup && active === item.slug;
                    const pct = item.examCount > 0
                      ? Math.round((item.examsDone / item.examCount) * 100)
                      : 0;
                    return (
                      <a
                        key={`${group.id}-${item.slug}`}
                        href={`/${locale}${item.href}`}
                        aria-current={on ? 'page' : undefined}
                        className={`side-row sub${on ? ' on' : ''}${item.owned ? '' : ' dim'}`}
                      >
                        <span className="side-ic bare">
                          <CategoryMark category={item.slug} size={19} tone="dark" />
                        </span>
                        <span className="side-lb">{tSkills(`${item.messageKey}.name`)}</span>
                        {/* Nul examens betekent hier: dit onderdeel is nog niet gebouwd
                            (B1 Luisteren). Een lege balk zou dat als "nog niets gedaan"
                            tonen, wat iets heel anders is. */}
                        {item.examCount === 0
                          ? <span className="side-tag">{t('tag_soon')}</span>
                          : (
                            <span className="side-rail" aria-hidden>
                              <span style={{ width: `${pct}%` }} />
                            </span>
                          )}
                      </a>
                    );
                  })}

                  {group.hasConcepts && group.level && (
                    <a
                      href={`/${locale}/dashboard/${group.level}/concepten`}
                      aria-current={inGroup && active === 'concepten' ? 'page' : undefined}
                      className={`side-row sub${inGroup && active === 'concepten' ? ' on' : ''}`}
                    >
                      <span className="side-ic"><Shapes size={14} strokeWidth={2.1} /></span>
                      <span className="side-lb">{tNav('concepten')}</span>
                    </a>
                  )}

                  {isKnm && FEATURES.leren && (
                    <a
                      href={`/${locale}/leren`}
                      aria-current={active === 'leren' ? 'page' : undefined}
                      className={`side-row sub${active === 'leren' ? ' on' : ''}`}
                    >
                      <span className="side-ic"><BookText size={14} strokeWidth={2.1} /></span>
                      <span className="side-lb">{tNav('knm_leren')}</span>
                    </a>
                  )}
                  {isKnm && FEATURES.woordkaarten && (
                    <a
                      href={`/${locale}/dashboard/woordkaarten`}
                      aria-current={active === 'woordkaarten' ? 'page' : undefined}
                      className={`side-row sub${active === 'woordkaarten' ? ' on' : ''}`}
                    >
                      <span className="side-ic"><Layers size={14} strokeWidth={2.1} /></span>
                      <span className="side-lb">{tNav('knm_woordkaarten')}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ONA is aangekondigd en er is niets gebouwd. Het staat er zodat de zijbalk het hele
            traject noemt dat het merk claimt — en het is nadrukkelijk geen link en zichtbaar
            doffer, zodat het geen pagina belooft die niet bestaat. Zodra het er is wordt het
            een groep in `lib/portal-menu.ts` en verdwijnt dit blok. */}
        <span className="side-mod soon" aria-disabled="true">
          <span className="side-mod-link">
            <span className="side-badge mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
            {/* Niet vertaald: ONA is een eigennaam, DUO's eigen afkorting. */}
            <span className="side-lb">ONA</span>
          </span>
          <span className="side-tag">{t('tag_roadmap')}</span>
        </span>

        {showExtend && (
          <a href={`/${locale}/dashboard/pakketten?vanaf=sidebar`} className="side-cta">
            <span className="side-plus" aria-hidden><Plus size={13} strokeWidth={3.2} /></span>
            <span>{t('nav_extend_course')}</span>
          </a>
        )}
      </div>

      <div className="side-foot">
        {isGuest ? (
          <>
            <a href={`/${locale}/register`} className="side-row accent">
              <span className="side-ic"><UserPlus size={15} strokeWidth={2.1} /></span>
              <span className="side-lb">{t('guest_create_account')}</span>
            </a>
            <a href={`/${locale}/login`} className="side-row">
              <span className="side-ic"><LogOut size={15} strokeWidth={2} style={{ transform: 'scaleX(-1)' }} /></span>
              <span className="side-lb">{t('guest_login')}</span>
            </a>
          </>
        ) : (
          <>
            <a
              href={`/${locale}/dashboard/profiel`}
              aria-current={active === 'profile' ? 'page' : undefined}
              className={`side-row${active === 'profile' ? ' on' : ''}`}
              title={email}
            >
              <span className="side-ic bare">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />
                  <AvatarFallback
                    className="text-[9px] font-bold"
                    style={{ background: 'rgba(255,255,255,0.20)', color: '#fff' }}
                  >
                    {email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </span>
              <span className="side-lb">{t('nav_profile')}</span>
            </a>
            <a href={`/${locale}/contact?from=dashboard`} className="side-row">
              <span className="side-ic"><Mail size={15} strokeWidth={2} /></span>
              <span className="side-lb">{t('nav_contact')}</span>
            </a>
            <button onClick={handleLogout} type="button" className="side-row">
              <span className="side-ic"><LogOut size={15} strokeWidth={2} /></span>
              <span className="side-lb">{t('btn_logout')}</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
