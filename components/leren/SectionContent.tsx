'use client';

import StepTimeline from './StepTimeline';
import NetherlandsMap from './widgets/NetherlandsMap';
import LessonAudio from './widgets/LessonAudio';
import TradeRoutesMap from './widgets/TradeRoutesMap';
import ColoniesMap from './widgets/ColoniesMap';
import WaterDefense from './widgets/WaterDefense';
import OVReisSimulator from './widgets/OVReisSimulator';
import WW2Timeline from './widgets/WW2Timeline';
import NieuweNederlanders from './widgets/NieuweNederlanders';
import WoonChoice from './widgets/WoonChoice';
import HuisVinden from './widgets/HuisVinden';
import Huurcontract from './widgets/Huurcontract';
import OpstalInboedel from './widgets/OpstalInboedel';
import Meterkast from './widgets/Meterkast';
import Sorteerspel from './widgets/Sorteerspel';
import type { LerenSection } from '@/data/leren/types';
import type { AudioCue } from '@/lib/leren-audio-cues';
import type React from 'react';

const MARKER_RE = /<!--\s*(STEP_TIMELINE|WIDGET):([\w-]+)\s*-->/g;

type WidgetProps = { audioUrl?: string; audioCues?: AudioCue[] };
const WIDGETS: Record<string, React.ComponentType<WidgetProps>> = {
  'netherlands-map': NetherlandsMap,
  'lesson-audio': LessonAudio,
  'trade-routes-map': TradeRoutesMap,
  'colonies-map': ColoniesMap,
  'water-defense': WaterDefense,
  'ov-reis': OVReisSimulator,
  'ww2-timeline': WW2Timeline,
  'nieuwe-nederlanders': NieuweNederlanders,
  'woon-choice': WoonChoice,
  'huis-vinden': HuisVinden,
  'huurcontract': Huurcontract,
  'opstal-inboedel': OpstalInboedel,
  'meterkast': Meterkast,
  'sorteerspel': Sorteerspel,
};

export default function SectionContent({ section }: { section: LerenSection }) {
  const hasMarkers = MARKER_RE.test(section.contentHtml);
  MARKER_RE.lastIndex = 0;

  if (!hasMarkers && !section.stepTimelines) {
    return (
      <div
        className="leren-section-content"
        style={{ paddingBottom: 0 }}
        dangerouslySetInnerHTML={{ __html: section.contentHtml }}
      />
    );
  }

  type Part =
    | { type: 'html'; html: string }
    | { type: 'timeline'; id: string }
    | { type: 'widget'; id: string };

  const parts: Part[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MARKER_RE.lastIndex = 0;
  while ((match = MARKER_RE.exec(section.contentHtml)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'html', html: section.contentHtml.slice(lastIndex, match.index) });
    }
    const markerType = match[1];
    const id = match[2];
    if (markerType === 'STEP_TIMELINE') {
      parts.push({ type: 'timeline', id });
    } else {
      parts.push({ type: 'widget', id });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < section.contentHtml.length) {
    parts.push({ type: 'html', html: section.contentHtml.slice(lastIndex) });
  }

  return (
    <div className="leren-section-content" style={{ paddingBottom: 0 }}>
      {parts.map((part, i) => {
        if (part.type === 'html') {
          return <div key={i} dangerouslySetInnerHTML={{ __html: part.html }} />;
        }
        if (part.type === 'timeline') {
          const data = section.stepTimelines?.[part.id];
          return data ? <StepTimeline key={i} {...data} /> : null;
        }
        const Widget = WIDGETS[part.id];
        return Widget ? <Widget key={i} audioUrl={section.audioUrl} audioCues={section.audioCues} /> : null;
      })}
    </div>
  );
}
