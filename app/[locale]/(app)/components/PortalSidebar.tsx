'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronRight, LayoutDashboard, Lock, LogIn, LogOut, Mail, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LogoMark from '@/components/site/LogoMark';
import ExamMark, { type Track } from '@/components/horizon/ExamMark';
import { KNM_SLUG, LEVELS } from '@/data/skills';
import type { PortalMenu, PortalMenuGroup } from '@/lib/portal-menu';
import type { PortalNav } from './nav';
import { localeHref } from '@/i18n/paths';

/**
 * De portaalzijbalk: **één glazen kolom (Glas, glas.html §09b), met de modules uitklapbaar.**
 * Onderdeelrijen zijn sinds Glas tekst — met een slotje als ze niet in je pakket zitten — en
 * de modulerijen dragen het trackmerk op 32px.
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

  /* Elke cursus staat open in het menu; de winkel is één stille regel in de voet, alleen zolang
     er nog iets te kopen is (eigenaar, 15-10). De echte verkoop zit waar je op een slot stuit. */
  const showPlan = !isGuest && ((menu?.available.length ?? 1) > 0
    || groups.some(g => g.items.some(i => !i.owned)));
  const ownsAny = groups.some(g => g.items.some(i => i.owned));
  const onaOn = activeGroup === 'ona';

  return (
    <aside id="dash-side" aria-label={t('nav_aria')}>
      <a href={`/${locale}/dashboard`} className="g-side-logo" aria-label="Inburgering Oefenen">
        <LogoMark size={34} />
        <span>Inburgering<br />Oefenen</span>
      </a>

      <div className="g-side-scroll">
        <a
          href={`/${locale}/dashboard`}
          aria-current={active === 'overview' ? 'page' : undefined}
          className={`g-navi${active === 'overview' ? ' g-on' : ''}`}
        >
          <span className="g-navi-ic" aria-hidden><LayoutDashboard strokeWidth={2.1} /></span>
          <span className="g-navi-lb">{t('nav_overview')}</span>
        </a>

        <p className="g-side-grp">{t('nav_modules')}</p>

        {groups.map(group => {
          const inGroup = activeGroup === group.id;
          /* KNM is één rij zonder uitklap (eigenaar, 15-10): de examens staan op het
             moduleoverzicht, de lesmodules en woordkaarten in de cursusroute ernaast. De rij
             is dus "hier ben je" op elke KNM-pagina. */
          const isKnm = group.id === KNM_SLUG;
          const items = isKnm ? [] : group.items;
          const onModule = inGroup && (isKnm || active === 'overview-module');
          const expanded = !isKnm && open.includes(group.id);

          return (
            <div key={group.id} className={`g-sgroup${expanded ? ' g-open' : ''}`}>
              {/* De rij is een link en de chevron een aparte trigger — shadcns
                  `SidebarMenuAction`-vorm. De hele rij tot toggle maken neemt je de
                  modulepagina af, en dát is de pagina waar de rij voor bestaat. */}
              <div className={`g-smod${inGroup ? ' g-within' : ''}${onModule ? ' g-on' : ''}`}>
                <a
                  href={`/${locale}${group.href}`}
                  aria-current={inGroup && active === 'overview-module' ? 'page' : undefined}
                  className="g-navi"
                >
                  {/* Het trackmerk (§7, G4): deze rij benoemt een module — iets dat je koopt.
                      Op de navy "hier ben je"-rij de `onDark`-vorm, anders verdwijnt de tegel. */}
                  <span className="g-navi-ic g-navi-ic-bare" aria-hidden>
                    <ExamMark track={(group.level ?? KNM_SLUG) as Track} size={32} onDark={onModule} />
                  </span>
                  <span className="g-navi-lb">
                    {group.level ? t('level_section', { level: group.badge ?? '' }) : group.label}
                  </span>
                </a>
                {!isKnm && (
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    aria-expanded={expanded}
                    aria-label={group.label}
                    className="g-schev"
                  >
                    <ChevronRight strokeWidth={2.4} aria-hidden />
                  </button>
                )}
              </div>

              {expanded && items.length > 0 && (
                <div className="g-ssub">
                  {items.map(item => {
                    const on = inGroup && active === item.slug;
                    return (
                      <a
                        key={`${group.id}-${item.slug}`}
                        href={`/${locale}${item.href}`}
                        aria-current={on ? 'page' : undefined}
                        className={[on && 'g-on', !item.owned && 'g-dim'].filter(Boolean).join(' ') || undefined}
                      >
                        <span className="g-navi-lb">{tSkills(`${item.messageKey}.name`)}</span>
                        {/* Nul examens betekent: dit onderdeel is nog niet gebouwd (B1
                            Luisteren). Niet in je pakket draagt een slotje, nooit alleen grijs. */}
                        {item.examCount === 0
                          ? <span className="g-ssub-tag">{t('tag_soon')}</span>
                          : !item.owned && (
                            <span className="g-ssub-end" title={t('mod_not_in_package')}>
                              <Lock strokeWidth={2.4} aria-hidden />
                              <span className="sr-only">{t('mod_not_in_package')}</span>
                            </span>
                          )}
                      </a>
                    );
                  })}

                </div>
              )}
            </div>
          );
        })}

        {menu?.ona.available ? (
          /* ONA is één rij, net als KNM (eigenaar, 15-10): portfolio, eindgesprek en inleveren
             staan in de cursusroute naast de kaart-, gesprek- en inleverpagina. */
          <div className="g-sgroup">
            <div className={`g-smod${onaOn ? ' g-on' : ''}`}>
              <a
                href={`/${locale}/dashboard/ona`}
                aria-current={activeGroup === 'ona' && active === 'overview-module' ? 'page' : undefined}
                className="g-navi"
              >
                <span className="g-navi-ic g-navi-ic-bare" aria-hidden>
                  <ExamMark track="ona" size={32} onDark={onaOn} />
                </span>
                {/* Niet vertaald: ONA is een eigennaam, DUO's eigen afkorting. */}
                <span className="g-navi-lb">ONA</span>
              </a>
            </div>
          </div>
        ) : (
          /* ONA wacht op de docent (`isOnaAvailable`). Tot dan: geen link en zichtbaar doffer,
             zodat het geen pagina belooft die er nog niet mag zijn. */
          <span className="g-navi" aria-disabled="true">
            <span className="g-navi-ic g-navi-ic-bare" aria-hidden>
              <ExamMark track="ona" size={32} muted />
            </span>
            <span className="g-navi-lb">ONA</span>
            <span className="g-ssub-tag">{t('tag_roadmap')}</span>
          </span>
        )}
      </div>

      <div className="g-side-foot">
        {showPlan && (
          <a href={`/${locale}/dashboard/pakketten?vanaf=sidebar`} className="g-side-plan">
            <span className="g-side-plan-st">{ownsAny ? t('side_plan_partial') : t('side_plan_free')}</span>
            <span className="g-side-plan-cta">
              {t('side_plan_cta')}
              <ArrowRight strokeWidth={2.4} aria-hidden className="rtl-flip" />
            </span>
          </a>
        )}
        {isGuest ? (
          <>
            <a href={`/${locale}/register`} className="g-navi">
              <span className="g-navi-ic g-navi-ic-navy" aria-hidden><UserPlus strokeWidth={2.1} /></span>
              <span className="g-navi-lb">{t('guest_create_account')}</span>
            </a>
            <a href={`/${locale}/login`} className="g-navi">
              <span className="g-navi-ic" aria-hidden><LogIn strokeWidth={2} className="rtl-flip" /></span>
              <span className="g-navi-lb">{t('guest_login')}</span>
            </a>
          </>
        ) : (
          <>
            <a
              href={`/${locale}/dashboard/profiel`}
              aria-current={active === 'profile' ? 'page' : undefined}
              className={`g-navi${active === 'profile' ? ' g-on' : ''}`}
              title={email}
            >
              <span className="g-navi-ic g-navi-ic-bare">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />
                  <AvatarFallback
                    className="text-[11px] font-bold"
                    style={active === 'profile'
                      ? { background: 'rgba(255,255,255,0.18)', color: '#fff' }
                      : { background: 'var(--mist)', color: 'var(--navy)' }}
                  >
                    {email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </span>
              <span className="g-navi-lb">{t('nav_profile')}</span>
            </a>
            <a href={localeHref(locale, `contact?from=dashboard`)} className="g-navi">
              <span className="g-navi-ic" aria-hidden><Mail strokeWidth={2} /></span>
              <span className="g-navi-lb">{t('nav_contact')}</span>
            </a>
            <button onClick={handleLogout} type="button" className="g-navi">
              <span className="g-navi-ic" aria-hidden><LogOut strokeWidth={2} className="rtl-flip" /></span>
              <span className="g-navi-lb">{t('btn_logout')}</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
