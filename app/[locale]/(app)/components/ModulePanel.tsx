'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, Plus, BookText, Layers, Shapes } from 'lucide-react';
import CategoryMark from '@/components/horizon/CategoryMark';
import { KNM_SLUG } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import type { PortalMenu, PortalMenuGroup } from '@/lib/portal-menu';
import type { PortalNav } from './nav';

/**
 * The second column: **where in this module.**
 *
 * One module at a time, always led by that module's overview. The rail decides which module;
 * this decides which page inside it. Because it only ever renders one module, there are no
 * collapsible groups and no disclosure state to remember — the whole `localStorage` dance the
 * single sidebar needed is gone with it.
 *
 * It is **light on a navy rail** (owner's choice of variant A, 2026-08-27). That inverts the
 * portal's old all-navy chrome deliberately: with the rail carrying the brand, a second navy
 * column made the two axes read as one undifferentiated block, and a light panel gives the list
 * the quiet of a document sidebar. The rail stays the only dark surface.
 */

interface Props {
  locale: string;
  active: PortalNav;
  activeGroup: string | null;
  menu: PortalMenu | null;
}

export default function ModulePanel({ locale, active, activeGroup, menu }: Props) {
  const t = useTranslations('portal');
  const tSkills = useTranslations('skills');
  const tNav = useTranslations('nav');

  const groups = [...(menu?.owned ?? []), ...(menu?.available ?? [])];

  /**
   * Which module the panel describes.
   *
   * On the portal overview and on the profile page you are inside no module, so it falls back
   * to the first one you own (or the first on offer). Showing an empty column there would waste
   * a third of the chrome on every visit to the two pages people land on most; showing a module
   * with nothing marked current is honest, because nothing in it *is* current.
   */
  const group: PortalMenuGroup | undefined =
    groups.find(g => g.id === activeGroup) ?? groups[0];

  if (!group) return <aside id="dash-panel" />;

  const inThisModule = activeGroup === group.id;
  const isKnm = group.id === KNM_SLUG;
  const knmChildren = isKnm && (FEATURES.leren || FEATURES.woordkaarten);

  /**
   * De conceptenbibliotheek van dit niveau.
   *
   * Eén rij per module en niet één per onderdeel: een concept is niveaubreed en staat één keer
   * in de database. Per onderdeel een rij zou de lijst verdubbelen en vier keer naar dezelfde
   * bibliotheek wijzen.
   *
   * De lescúrsus staat hier bewust níet: die is per onderdeel en wordt bereikt vanaf de pagina
   * van dat onderdeel. Acht rijen in een paneel van 196px is geen navigatie meer, en het paneel
   * draagt één as — de examens — per de beslissing van de eigenaar van 27-08.
   */
  const conceptsHref = group.level ? `/dashboard/${group.level}/concepten` : null;
  const showConcepts = group.hasConcepts && conceptsHref !== null;

  /**
   * KNM's single onderdeel *is* the module, so its row and the module's overview are the same
   * URL. Two rows one above the other going to the same page reads as a rendering fault, and
   * the overview row is the one to keep — it is the row every rail tile lands on.
   */
  const items = group.items.filter(i => i.href !== group.href);

  const ownedCount = group.items.filter(i => i.owned).length;
  const done = group.items.reduce((n, i) => n + i.examsDone, 0);
  const total = group.items.reduce((n, i) => n + i.examCount, 0);

  return (
    <aside id="dash-panel" aria-label={group.label}>
      <div className="panel-head">
        <p className="panel-title">
          {group.level ? t('level_section', { level: group.badge ?? '' }) : group.label}
        </p>
        <p className="panel-sub">{t('panel_sub', { done, total })}</p>
      </div>

      <nav className="panel-nav">
        {/* The module's own overview, and the page every rail tile lands on. It is the first
            row rather than a header link so that "where am I" and "go there" are the same
            affordance — the module title above is a label, not a target. */}
        <a
          href={`/${locale}${group.href}`}
          aria-current={inThisModule && active === 'overview-module' ? 'page' : undefined}
          className={`panel-row${inThisModule && active === 'overview-module' ? ' on' : ''}`}
        >
          <span className="panel-mk"><LayoutDashboard size={13} strokeWidth={2.2} /></span>
          <span className="panel-lb">{t('nav_overview_short')}</span>
        </a>

        {(items.length > 0 || knmChildren || showConcepts) && (
          <p className="panel-head-label">{t(isKnm ? 'panel_group_knm' : 'panel_group_skills')}</p>
        )}

        {items.map(item => {
          const on = inThisModule && active === item.slug;
          return (
            <a
              key={`${group.id}-${item.slug}`}
              href={`/${locale}${item.href}`}
              aria-current={on ? 'page' : undefined}
              className={`panel-row${on ? ' on' : ''}${item.owned ? '' : ' dim'}`}
            >
              {/* Always the light tone: every row on this panel sits on a light ground now that
                  the current one is a tint rather than a navy slab. A dark-tone mark is white
                  ink on a translucent white tile, which here would be invisible. */}
              <span className="panel-mk bare">
                <CategoryMark category={item.slug} size={20} tone="light" />
              </span>
              <span className="panel-lb">{tSkills(`${item.messageKey}.name`)}</span>
              {item.owned && item.examCount > 0 && (
                <span className="panel-n">{item.examsDone}/{item.examCount}</span>
              )}
            </a>
          );
        })}

        {showConcepts && (
          <a
            href={`/${locale}${conceptsHref}`}
            aria-current={inThisModule && active === 'concepten' ? 'page' : undefined}
            className={`panel-row${inThisModule && active === 'concepten' ? ' on' : ''}`}
          >
            <span className="panel-mk"><Shapes size={13} strokeWidth={2.1} /></span>
            <span className="panel-lb">{tNav('concepten')}</span>
          </a>
        )}

        {knmChildren && FEATURES.leren && (
          <a
            href={`/${locale}/leren`}
            aria-current={active === 'leren' ? 'page' : undefined}
            className={`panel-row${active === 'leren' ? ' on' : ''}`}
          >
            <span className="panel-mk"><BookText size={13} strokeWidth={2.1} /></span>
            <span className="panel-lb">{tNav('knm_leren')}</span>
          </a>
        )}
        {knmChildren && FEATURES.woordkaarten && (
          <a
            href={`/${locale}/dashboard/woordkaarten`}
            aria-current={active === 'woordkaarten' ? 'page' : undefined}
            className={`panel-row${active === 'woordkaarten' ? ' on' : ''}`}
          >
            <span className="panel-mk"><Layers size={13} strokeWidth={2.1} /></span>
            <span className="panel-lb">{tNav('knm_woordkaarten')}</span>
          </a>
        )}
      </nav>

      {/* The offer, and only while there is something left to sell. */}
      {(menu?.available.length ?? 0) > 0 || ownedCount < group.items.length ? (
        <a href={`/${locale}/dashboard/pakketten?vanaf=panel`} className="panel-cta">
          <span className="panel-plus" aria-hidden><Plus size={13} strokeWidth={3.2} /></span>
          <span>{t('nav_extend_course')}</span>
        </a>
      ) : null}
    </aside>
  );
}
