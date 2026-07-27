'use client';

import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

function HtmlBlockNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const content = decodeURIComponent((node.attrs.content as string) || '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  function save() {
    updateAttributes({ content: encodeURIComponent(draft) });
    setEditing(false);
  }

  return (
    <NodeViewWrapper contentEditable={false} style={{ userSelect: 'none' }}>
      <div
        className="relative group rounded-2xl transition-all"
        style={{
          outline: selected ? '2px solid var(--color-primary)' : editing ? '2px solid #f97316' : '1.5px dashed var(--color-outline-variant)',
          outlineOffset: '2px',
          background: editing ? '#fffbf7' : 'transparent',
        }}
      >
        {/* Hover controls */}
        {!editing && (
          <div
            className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              type="button"
              onClick={() => { setDraft(content); setEditing(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>edit</span>
              HTML
            </button>
          </div>
        )}

        {/* WYSIWYG render */}
        {!editing && (
          <div
            dangerouslySetInnerHTML={{ __html: content }}
            className="pointer-events-none"
          />
        )}

        {/* Inline HTML editor */}
        {editing && (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>HTML bewerken</span>
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-outline-variant px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:border-orange-400"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: '#f97316' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant text-on-surface-variant"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const HtmlBlockNode = Node.create({
  name: 'htmlBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      content: {
        default: '',
        parseHTML: el => el.getAttribute('data-content') || '',
        renderHTML: attrs => ({ 'data-content': attrs.content || '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'html-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['html-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlBlockNodeView);
  },
});

/** Split HTML containing <section> and <!-- WIDGET: --> markers into TipTap-friendly tokens */
export function splitContentToTiptap(
  html: string,
  audioUrl?: string | null,
  audioCues?: unknown[] | null
): string {
  const parts: string[] = [];
  let remaining = html.trim();

  while (remaining.length > 0) {
    // Widget comment
    const widgetMatch = remaining.match(/^<!--\s*WIDGET:([\w-]+)\s*-->/);
    if (widgetMatch) {
      const id = widgetMatch[1];
      const urlAttr = audioUrl ? ` audiourl="${audioUrl}"` : '';
      const cuesAttr = audioCues ? ` audiocues='${JSON.stringify(audioCues)}'` : '';
      parts.push(`<widget-block id="${id}"${urlAttr}${cuesAttr}></widget-block>`);
      remaining = remaining.slice(widgetMatch[0].length).trim();
      continue;
    }

    // <section> block — find matching close tag
    const sectionMatch = remaining.match(/^<section(\s[^>]*)?>[\s\S]*?<\/section>/i);
    if (sectionMatch) {
      const encoded = encodeURIComponent(sectionMatch[0]);
      parts.push(`<html-block data-content="${encoded}"></html-block>`);
      remaining = remaining.slice(sectionMatch[0].length).trim();
      continue;
    }

    // Fallback: top-level <div> or other block
    const divMatch = remaining.match(/^<div[\s\S]*?<\/div>/i);
    if (divMatch) {
      const encoded = encodeURIComponent(divMatch[0]);
      parts.push(`<html-block data-content="${encoded}"></html-block>`);
      remaining = remaining.slice(divMatch[0].length).trim();
      continue;
    }

    // Anything left: wrap as html-block
    parts.push(`<html-block data-content="${encodeURIComponent(remaining)}"></html-block>`);
    break;
  }

  return parts.join('\n') || '<p></p>';
}

/** Reconstruct original HTML from TipTap output */
export function tiptapToContentHtml(html: string): string {
  // html-block → decode content
  let result = html.replace(
    /<html-block[^>]*\bdata-content="([^"]*)"[^>]*><\/html-block>/gi,
    (_, encoded) => decodeURIComponent(encoded)
  );
  // widget-block → comment marker
  result = result.replace(
    /<widget-block[^>]*\bid="([\w-]+)"[^>]*><\/widget-block>/gi,
    '<!-- WIDGET:$1 -->'
  );
  return result;
}
