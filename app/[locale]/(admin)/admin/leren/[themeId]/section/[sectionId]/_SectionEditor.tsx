'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import SectionContent from '@/components/leren/SectionContent';
import { WidgetNode } from './_WidgetNode';
import { HtmlBlockNode, splitContentToTiptap, tiptapToContentHtml } from './_HtmlBlockNode';
import type { LerenSection } from '@/data/leren/types';
import type { AudioCue } from '@/lib/leren-audio-cues';

type Section = {
  id: number;
  theme_id: number;
  anchor: string;
  icon: string;
  heading: string;
  subtitle: string;
  body_html: string;
  sort_order: number;
  audio_script?: string | null;
  audio_url?: string | null;
  audio_cues?: unknown[] | null;
};

type Tab = 'inhoud' | 'audio' | 'voorbeeld';

export default function SectionEditor({
  initial,
  locale,
  themeId,
}: {
  initial: Section;
  locale: string;
  themeId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('inhoud');
  const [showRawHtml, setShowRawHtml] = useState(false);

  // Audio lesson state
  const [audioScript, setAudioScript] = useState(initial.audio_script ?? '');
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [audioResult, setAudioResult] = useState<{ success: boolean; message: string; cueCount?: number } | null>(null);
  const [editableCues, setEditableCues] = useState<Record<string, unknown>[]>((initial.audio_cues as Record<string, unknown>[]) ?? []);
  const [cuesDirty, setCuesDirty] = useState(false);
  const [cuesSaving, setCuesSaving] = useState(false);
  const [cuesSaved, setCuesSaved] = useState(false);

  const hasWidget = form.body_html.includes('<!-- WIDGET:');

  // TipTap editor — WidgetNode converts <!-- WIDGET:id --> ↔ <widget-block>
  const editor = useEditor({
    extensions: [StarterKit, WidgetNode, HtmlBlockNode],
    content: splitContentToTiptap(initial.body_html, initial.audio_url, initial.audio_cues),
    onUpdate: ({ editor }) => {
      const raw = tiptapToContentHtml(editor.getHTML());
      setForm(f => ({ ...f, body_html: raw }));
      setSaved(false);
    },
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[320px] px-4 py-3' },
    },
  });

  const syncRawToEditor = useCallback((html: string) => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(splitContentToTiptap(html, form.audio_url, form.audio_cues));
    }
  }, [editor, form.audio_url, form.audio_cues]);

  function set<K extends keyof Section>(key: K, value: Section[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase
      .from('leren_content')
      .update({
        anchor: form.anchor, icon: form.icon, heading: form.heading,
        subtitle: form.subtitle, body_html: form.body_html, sort_order: form.sort_order,
        audio_script: audioScript,
      })
      .eq('id', form.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    await fetch('/api/admin-revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: form.theme_id }),
    });
    router.refresh();
  }

  async function handleGenerateAudio() {
    if (!audioScript.trim()) return;
    setAudioGenerating(true);
    setAudioResult(null);
    try {
      const res = await fetch('/api/admin/generate-lesson-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: form.theme_id, anchor: form.anchor, script: audioScript }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAudioResult({ success: false, message: data.error ?? 'Onbekende fout' });
      } else {
        setEditableCues(data.cues ?? []);
        setCuesDirty(false);
        setAudioResult({ success: true, message: 'Audio bijgewerkt', cueCount: data.cues?.length });
        // Update form + refresh widget in editor
        const newForm = { ...form, audio_url: data.audioUrl, audio_cues: data.cues, audio_script: audioScript };
        setForm(newForm);
        // Re-inject updated audioUrl/audioCues into the TipTap widget node
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(splitContentToTiptap(form.body_html, data.audioUrl, data.cues));
        }
      }
    } catch (err) {
      setAudioResult({ success: false, message: (err as Error).message });
    } finally {
      setAudioGenerating(false);
    }
  }

  async function handleSaveCues() {
    setCuesSaving(true);
    const supabase = createClient();
    const sorted = [...editableCues].sort((a, b) => (Number(a.time) || 0) - (Number(b.time) || 0));
    const { error: err } = await supabase
      .from('leren_content')
      .update({ audio_cues: sorted })
      .eq('id', form.id);
    setCuesSaving(false);
    if (!err) {
      setEditableCues(sorted);
      setForm(f => ({ ...f, audio_cues: sorted }));
      if (editor && !editor.isDestroyed) {
        editor.commands.setContent(splitContentToTiptap(form.body_html, form.audio_url, sorted));
      }
      setCuesDirty(false);
      setCuesSaved(true);
      setTimeout(() => setCuesSaved(false), 2000);
    }
  }

  // Build a LerenSection from current form state for SectionContent preview
  const previewSection: LerenSection = {
    id: form.anchor,
    icon: form.icon,
    title: form.heading,
    subtitle: form.subtitle,
    contentHtml: form.body_html,
    audioUrl: form.audio_url ?? undefined,
    audioCues: (form.audio_cues as AudioCue[]) ?? undefined,
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Anchor (slug)">
          <input value={form.anchor} onChange={e => set('anchor', e.target.value)} required className="field" />
        </Field>
        <Field label="Icoon (Material Symbols)">
          <input value={form.icon} onChange={e => set('icon', e.target.value)} required className="field" />
        </Field>
        <Field label="Volgorde">
          <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} className="field" />
        </Field>
      </div>
      <Field label="Koptekst">
        <input value={form.heading} onChange={e => set('heading', e.target.value)} required className="field" />
      </Field>
      <Field label="Ondertitel">
        <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className="field" />
      </Field>

      {/* Tab bar */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1 bg-surface-container rounded-lg p-1">
            <TabBtn active={tab === 'inhoud'} onClick={() => setTab('inhoud')}>Inhoud</TabBtn>
            {hasWidget && <TabBtn active={tab === 'audio'} onClick={() => setTab('audio')}>Audio les</TabBtn>}
            <TabBtn active={tab === 'voorbeeld'} onClick={() => setTab('voorbeeld')}>Voorbeeld</TabBtn>
          </div>
        </div>

        {/* ── Inhoud tab ── */}
        {tab === 'inhoud' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 flex-wrap p-2 border border-outline-variant rounded-t-xl bg-surface-container-low">
              <TipTapButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Vet"><strong>B</strong></TipTapButton>
              <TipTapButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Cursief"><em>I</em></TipTapButton>
              <div className="w-px h-5 bg-outline-variant mx-1" />
              <TipTapButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Kop 2">H2</TipTapButton>
              <TipTapButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Kop 3">H3</TipTapButton>
              <div className="w-px h-5 bg-outline-variant mx-1" />
              <TipTapButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Opsomming">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>format_list_bulleted</span>
              </TipTapButton>
              <TipTapButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Genummerd">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>format_list_numbered</span>
              </TipTapButton>
              <div className="w-px h-5 bg-outline-variant mx-1" />
              <TipTapButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="Code">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>code</span>
              </TipTapButton>
              <TipTapButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Lijn">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>horizontal_rule</span>
              </TipTapButton>
              <button
                type="button"
                onClick={() => setShowRawHtml(v => !v)}
                className="ml-auto flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                style={{ background: showRawHtml ? 'var(--color-primary)' : 'transparent', color: showRawHtml ? '#fff' : 'var(--color-on-surface-variant)' }}
                title="Raw HTML bewerken"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>code</span>
                HTML
              </button>
            </div>

            <EditorContent
              editor={editor}
              className="border border-outline-variant rounded-b-xl bg-white overflow-auto"
              style={{ borderTop: 'none' }}
            />

            {showRawHtml && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Raw HTML</label>
                <textarea
                  value={form.body_html}
                  onChange={e => { set('body_html', e.target.value); syncRawToEditor(e.target.value); }}
                  rows={14}
                  className="field font-mono text-xs w-full resize-y"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Audio les tab ── */}
        {tab === 'audio' && (
          <div className="space-y-5">
            {/* Live widget preview with audio player */}
            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                Interactief element + audio preview
              </p>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-outline-variant)', background: '#f8f9fb' }}
              >
                <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-outline-variant)', background: '#fff' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--color-primary)' }}>preview</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Studentweergave</span>
                  {form.audio_url && (
                    <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                      ✓ Audio beschikbaar
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <SectionContent section={previewSection} />
                </div>
              </div>
            </div>

            {/* Script editor */}
            <div className="rounded-xl p-3 flex gap-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#3b82f6', fontSize: 15 }}>info</span>
              <p className="text-[11px] leading-relaxed" style={{ color: '#1e40af' }}>
                Schrijf de spreektekst. Na het genereren worden audio en synchronisatiepunten opgeslagen. Provincienamen en steden worden herkend voor kaarthighlights.
              </p>
            </div>

            <Field label="Spreektekst (Nederlands)">
              <textarea
                value={audioScript}
                onChange={e => setAudioScript(e.target.value)}
                rows={12}
                className="field font-mono text-sm w-full resize-y"
                placeholder="Schrijf hier de Nederlandse tekst die de voice-over uitspreekt..."
                spellCheck={false}
              />
            </Field>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateAudio}
                disabled={audioGenerating || !audioScript.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: '#fe762c' }}
              >
                {audioGenerating ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>Genereren…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">graphic_eq</span>Genereer &amp; synchroniseer audio</>
                )}
              </button>
            </div>

            {audioResult && (
              <div
                className="rounded-xl p-3 flex items-center gap-2 text-sm font-medium"
                style={{
                  background: audioResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${audioResult.success ? '#bbf7d0' : '#fecaca'}`,
                  color: audioResult.success ? '#166534' : '#991b1b',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {audioResult.success ? 'check_circle' : 'error'}
                </span>
                {audioResult.success
                  ? `✓ Audio bijgewerkt — ${audioResult.cueCount} synchronisatiepunten`
                  : `Fout: ${audioResult.message}`}
              </div>
            )}

            {/* Editable cue table */}
            {editableCues.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Synchronisatiepunten</p>
                  {cuesDirty && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>Niet opgeslagen</span>}
                </div>
                <div className="rounded-xl overflow-hidden border border-outline-variant">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="text-left px-3 py-2 font-semibold text-on-surface-variant w-24">Tijd (s)</th>
                        <th className="text-left px-3 py-2 font-semibold text-on-surface-variant w-24">Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-on-surface-variant">Waarde</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {editableCues.map((cue, i) => {
                        const { type, value, isSubtitle } = getCueInfo(cue);
                        return (
                          <tr key={i} className="border-t border-outline-variant">
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={Number(cue.time).toFixed(2)}
                                onChange={e => {
                                  const updated = editableCues.map((c, j) => j === i ? { ...c, time: parseFloat(e.target.value) || 0 } : c);
                                  setEditableCues(updated);
                                  setCuesDirty(true);
                                }}
                                className="w-20 border border-outline-variant rounded px-1.5 py-0.5 tabular-nums text-xs"
                                style={{ outline: 'none' }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                                style={{
                                  background: isSubtitle ? '#eff6ff' : '#f0fdf4',
                                  color: isSubtitle ? '#1e40af' : '#166534',
                                }}>
                                {type}
                              </span>
                            </td>
                            <td className="px-2 py-1">
                              {isSubtitle ? (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={e => {
                                    const updated = editableCues.map((c, j) => j === i ? { ...c, subtitle: e.target.value } : c);
                                    setEditableCues(updated);
                                    setCuesDirty(true);
                                  }}
                                  className="w-full border border-outline-variant rounded px-1.5 py-0.5 text-xs"
                                  style={{ outline: 'none', minWidth: 120 }}
                                />
                              ) : (
                                <span className="text-on-surface">{value || <span className="text-on-surface-variant italic">(leeg)</span>}</span>
                              )}
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => { setEditableCues(editableCues.filter((_, j) => j !== i)); setCuesDirty(true); }}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                                title="Verwijder cue"
                              >×</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleSaveCues}
                    disabled={cuesSaving || !cuesDirty}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ background: cuesSaved ? '#166534' : '#374151' }}
                  >
                    {cuesSaving ? (
                      <><span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>Opslaan…</>
                    ) : cuesSaved ? (
                      <><span className="material-symbols-outlined text-[14px]">check_circle</span>Opgeslagen ✓</>
                    ) : (
                      <><span className="material-symbols-outlined text-[14px]">save</span>Tijdstippen opslaan</>
                    )}
                  </button>
                  <span className="text-[11px] text-on-surface-variant">{editableCues.length} punten</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Voorbeeld tab — full SectionContent with working audio ── */}
        {tab === 'voorbeeld' && (
          <div
            className="border border-outline-variant rounded-2xl overflow-hidden"
            style={{ background: '#f8f9fb' }}
          >
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-outline-variant)', background: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--color-primary)' }}>visibility</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Voorbeeld — zo ziet de student het</span>
            </div>
            <div className="p-5">
              <SectionContent section={previewSection} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {saving ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>Opslaan…</>
          ) : saved ? (
            <><span className="material-symbols-outlined text-[18px]">check_circle</span>Opgeslagen ✓</>
          ) : (
            <><span className="material-symbols-outlined text-[18px]">save</span>Opslaan</>
          )}
        </button>
        <a
          href={`/${locale}/leren/thema-${form.theme_id}-${['', 'geschiedenis-en-geografie', 'staatsinrichting-en-rechtsstaat', 'maatschappij-en-samenleven', 'werk-en-inkomen', 'gezondheid-en-zorg', 'onderwijs', 'wonen'][form.theme_id]}`}
          target="_blank"
          className="flex items-center gap-2 border border-outline-variant px-4 py-2.5 rounded-xl text-sm text-on-surface hover:bg-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          Bekijk op site
        </a>
      </div>

      <style>{`
        .field { width: 100%; border: 1px solid var(--color-outline-variant); border-radius: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .field:focus { border-color: var(--color-primary); }
        .ProseMirror > h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror > h3 { font-size: 1.1rem; font-weight: 600; margin: 0.875rem 0 0.4rem; }
        .ProseMirror > p { margin: 0.4rem 0; line-height: 1.65; }
        .ProseMirror > ul, .ProseMirror > ol { padding-left: 1.5rem; margin: 0.4rem 0; }
        .ProseMirror > li { margin: 0.2rem 0; }
        .ProseMirror > pre { background: #f1f3f5; padding: 0.75rem 1rem; border-radius: 8px; overflow-x: auto; }
        .ProseMirror > hr { border: none; border-top: 2px solid var(--color-outline-variant); margin: 1rem 0; }
      `}</style>
    </form>
  );
}

function getCueInfo(cue: Record<string, unknown>): { type: string; value: string; isSubtitle: boolean } {
  const widgetFields = ['province', 'city', 'colony', 'leg', 'mode', 'route', 'good', 'home', 'element', 'ww2event', 'group', 'org', 'step', 'vehicle', 'payment'];
  for (const f of widgetFields) {
    if (f in cue && cue[f] != null) return { type: f, value: String(cue[f]), isSubtitle: false };
  }
  return { type: 'ondertitel', value: String(cue.subtitle ?? ''), isSubtitle: true };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${active ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
      {children}
    </button>
  );
}

function TipTapButton({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors"
      style={{ background: active ? 'var(--color-primary)' : 'transparent', color: active ? '#fff' : 'var(--color-on-surface)' }}>
      {children}
    </button>
  );
}
