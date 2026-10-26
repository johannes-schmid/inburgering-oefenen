'use client';

import { useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'pages', label: 'Pages' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'numbers', label: 'Numbers' },
] as const;
export type SeoTabKey = (typeof TABS)[number]['key'];
type Key = SeoTabKey;


/**
 * Vier vragen, vier tabs: wat doen we (overview), hoe staan de pagina's ervoor, wat doen anderen
 * beter, en de cijfers. De tab staat in `?tab=`: de server leest hem voor de eerste render, en
 * `history.replaceState` werkt hem bij zonder de pagina (en de live Search Console-vragen) opnieuw op te halen.
 */
export function SeoTabs({ panels, initial }: { panels: Record<Key, ReactNode>; initial: Key }) {
  const [tab, setTab] = useState<Key>(initial);

  return (
    <Tabs
      value={tab}
      onValueChange={v => {
        setTab(v as Key);
        history.replaceState(null, '', `?tab=${v}`);
      }}
    >
      <TabsList className="mb-5 grid w-full grid-cols-4 bg-surface-container-low sm:inline-flex sm:w-fit">
        {TABS.map(t => <TabsTrigger key={t.key} value={t.key} className="px-2 sm:px-4">{t.label}</TabsTrigger>)}
      </TabsList>
      {TABS.map(t => <TabsContent key={t.key} value={t.key}>{panels[t.key]}</TabsContent>)}
    </Tabs>
  );
}
