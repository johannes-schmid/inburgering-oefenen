'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import NetherlandsMap from '@/components/leren/widgets/NetherlandsMap';
import OVReisSimulator from '@/components/leren/widgets/OVReisSimulator';
import ColoniesMap from '@/components/leren/widgets/ColoniesMap';
import TradeRoutesMap from '@/components/leren/widgets/TradeRoutesMap';
import NieuweNederlanders from '@/components/leren/widgets/NieuweNederlanders';
import type { AudioCue } from '@/lib/leren-audio-cues';

// Registry of renderable widgets
const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ audioUrl?: string; audioCues?: AudioCue[] }>> = {
  'netherlands-map': NetherlandsMap,
  'ov-reis': OVReisSimulator,
  'colonies-map': ColoniesMap,
  'trade-routes-map': TradeRoutesMap,
  'nieuwe-nederlanders': NieuweNederlanders,
};

function WidgetNodeView({ node }: NodeViewProps) {
  const widgetId = node.attrs.id as string;
  const Widget = WIDGET_COMPONENTS[widgetId];
  const audioCues = node.attrs.audioCues ? (JSON.parse(node.attrs.audioCues as string) as AudioCue[]) : undefined;

  return (
    <NodeViewWrapper contentEditable={false} style={{ userSelect: 'none' }}>
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ border: '2px dashed var(--color-primary)', background: '#f8f9ff' }}
      >
        {/* Label badge */}
        <div
          className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest pointer-events-none"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>widgets</span>
          Widget: {widgetId}
        </div>

        {Widget ? (
          <div className="pt-8">
            <Widget audioUrl={node.attrs.audioUrl} audioCues={audioCues} />
          </div>
        ) : (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            Onbekende widget: <strong>{widgetId}</strong>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const WidgetNode = Node.create({
  name: 'widgetBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id:        { default: null },
      audioUrl:  { default: null },
      audioCues: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'widget-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['widget-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WidgetNodeView);
  },
});

