'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Code2, Heading3, Italic, List, ListOrdered, Pilcrow, Redo2, Undo2,
} from 'lucide-react';

/**
 * The HTML body of a fragment, edited as text rather than as markup.
 *
 * The stored value is HTML — `stimuli.body_html` is rendered straight into the player's left pane —
 * and a lot of it already carries structure the docent has to preserve (paragraphs, lists, the odd
 * bold word). A `<textarea>` full of tags makes reading the text impossible and makes breaking the
 * markup easy, which is the wrong trade for the surface where the text itself is the product.
 *
 * **The source view stays.** TipTap silently normalises anything it does not have an extension for,
 * so pasted markup can come back subtly different from what went in. "Broncode" is the escape
 * hatch — and the only place to verify what will actually be saved. Its edits apply on blur, not
 * per keystroke, or a half-typed tag would round-trip through the parser and be eaten.
 */
export default function RichTextEditor({
  value,
  onChange,
  minHeight = 180,
}: {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const [source, setSource] = useState(false);
  const [sourceDraft, setSourceDraft] = useState(value);

  const editor = useEditor({
    // Next renders this on the server first; without it TipTap warns and can mismatch hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Nothing in an A2 exam text is a code block or a quote, and offering them invites markup
        // the player has no styles for.
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        heading: { levels: [3] },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'admin-rte-content',
        'aria-label': 'Tekst van het fragment',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Only ever pushes an *external* change in — typing goes the other way through onUpdate, and
  // re-setting the content on every keystroke would reset the cursor to the start of the document.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  function applySource() {
    setSource(false);
    if (sourceDraft !== value) onChange(sourceDraft);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-outline-variant bg-surface-container-low px-1.5 py-1">
        <ToolButton
          label="Vet" active={editor?.isActive('bold')} disabled={source}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={14} aria-hidden />
        </ToolButton>
        <ToolButton
          label="Cursief" active={editor?.isActive('italic')} disabled={source}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} aria-hidden />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Alinea" active={editor?.isActive('paragraph')} disabled={source}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          <Pilcrow size={14} aria-hidden />
        </ToolButton>
        <ToolButton
          label="Kopje" active={editor?.isActive('heading', { level: 3 })} disabled={source}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={14} aria-hidden />
        </ToolButton>
        <ToolButton
          label="Opsomming" active={editor?.isActive('bulletList')} disabled={source}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={14} aria-hidden />
        </ToolButton>
        <ToolButton
          label="Genummerde lijst" active={editor?.isActive('orderedList')} disabled={source}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={14} aria-hidden />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Ongedaan maken" disabled={source || !editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 size={14} aria-hidden />
        </ToolButton>
        <ToolButton
          label="Opnieuw" disabled={source || !editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 size={14} aria-hidden />
        </ToolButton>

        <div className="ml-auto">
          <ToolButton
            label="Broncode"
            active={source}
            onClick={() => {
              if (source) applySource();
              else { setSourceDraft(value); setSource(true); }
            }}
          >
            <Code2 size={14} aria-hidden />
          </ToolButton>
        </div>
      </div>

      {source ? (
        <textarea
          value={sourceDraft}
          onChange={e => setSourceDraft(e.target.value)}
          onBlur={applySource}
          spellCheck={false}
          className="block w-full resize-y border-0 bg-transparent p-3 font-mono text-xs leading-relaxed text-on-surface outline-none"
          style={{ minHeight }}
        />
      ) : (
        <EditorContent editor={editor} style={{ minHeight }} />
      )}

      <style>{`
        .admin-rte-content {
          padding: 12px 14px;
          font-size: 0.9375rem;
          line-height: 1.7;
          color: var(--color-on-surface);
          outline: none;
        }
        .admin-rte-content > * + * { margin-top: 0.7em; }
        .admin-rte-content p { margin: 0; }
        .admin-rte-content h3 {
          font-family: var(--font-headline), sans-serif;
          font-size: 1rem; font-weight: 700; margin: 0; letter-spacing: -0.01em;
        }
        /* Tailwind's preflight strips list markers from every ul/ol. Inside the editor they are
           the only thing that distinguishes a list from a stack of paragraphs, so they come back. */
        .admin-rte-content ul { margin: 0; padding-left: 1.35rem; list-style: disc; }
        .admin-rte-content ol { margin: 0; padding-left: 1.35rem; list-style: decimal; }
        .admin-rte-content li { margin: 0.15em 0; }
        .admin-rte-content strong { font-weight: 700; }
      `}</style>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-outline-variant" aria-hidden />;
}

function ToolButton({
  children, label, active, disabled, onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? false}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-35 ${
        active
          ? 'bg-primary text-white'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

/** Strip the markup for a plain-text preview — a list of fragments should not show tags. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export type { Editor };
