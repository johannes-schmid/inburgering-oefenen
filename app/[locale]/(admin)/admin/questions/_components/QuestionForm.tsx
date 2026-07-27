'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { buildPexelsQuery } from '@/lib/pexels-query';
import { Button } from '@/components/ui/button';

type Question = {
  id?: number;
  category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct: 'A' | 'B' | 'C';
  explanation: string;
  image_url: string;
  exam: number | null;
  audio_question?: string | null;
  audio_a?: string | null;
  audio_b?: string | null;
  audio_c?: string | null;
};

const CATEGORIES = [
  'Geschiedenis en Geografie',
  'Staatsinrichting en Rechtsstaat',
  'Maatschappij en Samenleven',
  'Werk en Inkomen',
  'Gezondheid en Zorg',
  'Onderwijs',
  'Wonen',
];

export default function QuestionForm({
  initial,
  locale,
}: {
  initial?: Partial<Question>;
  locale: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Question>({
    category: '',
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    correct: 'A',
    explanation: '',
    image_url: '',
    exam: null,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = !initial?.id;

  function set(key: keyof Question, value: string | number | null) {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const supabase = createClient();

    const payload = {
      category: form.category,
      question: form.question,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      correct: form.correct,
      explanation: form.explanation,
      image_url: form.image_url || null,
      exam: form.exam || null,
    };

    const { error: err } = isNew
      ? await supabase.from('questions').insert(payload)
      : await supabase.from('questions').update(payload).eq('id', form.id!);

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      if (isNew) router.push(`/${locale}/admin/questions`);
      else router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const supabase = createClient();
    await supabase.from('questions').delete().eq('id', form.id!);
    router.push(`/${locale}/admin/questions`);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Categorie">
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            required
            className="field"
          >
            <option value="">Kies categorie…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Examen nr (optioneel)">
          <input
            type="number"
            value={form.exam ?? ''}
            onChange={e => set('exam', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="1–10"
            className="field"
          />
        </Field>
      </div>

      <Field label="Vraag">
        <textarea
          value={form.question}
          onChange={e => set('question', e.target.value)}
          required
          rows={3}
          className="field resize-none"
        />
        {form.audio_question && <AudioPlayer src={form.audio_question} label="Vraag" />}
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-on-surface">Antwoordopties</p>
          {(form.audio_question || form.audio_a || form.audio_b || form.audio_c) && (
            <PlayAllButton
              tracks={[form.audio_question, form.audio_a, form.audio_b, form.audio_c].filter(Boolean) as string[]}
            />
          )}
        </div>
        {(['A', 'B', 'C'] as const).map(opt => (
          <div key={opt} className="space-y-1.5">
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="correct"
                  value={opt}
                  checked={form.correct === opt}
                  onChange={() => set('correct', opt)}
                  className="accent-primary w-4 h-4"
                />
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {opt}
                </span>
              </label>
              <input
                value={form[`option_${opt.toLowerCase()}` as keyof Question] as string}
                onChange={e => set(`option_${opt.toLowerCase()}` as keyof Question, e.target.value)}
                required
                placeholder={`Optie ${opt}`}
                className="field flex-1"
              />
            </div>
            {form[`audio_${opt.toLowerCase()}` as keyof Question] && (
              <div className="pl-[52px]">
                <AudioPlayer src={form[`audio_${opt.toLowerCase()}` as keyof Question] as string} label={`Optie ${opt}`} />
              </div>
            )}
          </div>
        ))}
        <p className="text-xs text-on-surface-variant">Klik op het bolletje naast de optie om het juiste antwoord te markeren.</p>
      </div>

      <Field label="Uitleg (feedback na het antwoorden)">
        <textarea
          value={form.explanation}
          onChange={e => set('explanation', e.target.value)}
          required
          rows={3}
          className="field resize-none"
        />
      </Field>

      <PexelsImagePicker
        question={form.question}
        category={form.category}
        value={form.image_url}
        onChange={url => set('image_url', url)}
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
              Opslaan…
            </>
          ) : saved ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Opgeslagen ✓
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Opslaan
            </>
          )}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-error text-white'
                : 'border border-error/30 text-error hover:bg-error/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {confirmDelete ? 'Zeker verwijderen?' : 'Verwijderen'}
          </button>
        )}

        {confirmDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-sm text-on-surface-variant hover:text-on-surface"
          >
            Annuleren
          </button>
        )}
      </div>

      <style>{`.field { width: 100%; border: 1px solid var(--color-outline-variant); border-radius: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; } .field:focus { border-color: var(--color-primary); }`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}

function AudioPlayer({ src, label }: { src: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
  }

  return (
    <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-primary/5 border border-primary/15 rounded-lg">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10"
      >
        <span className="material-symbols-outlined text-[18px]">
          {playing ? 'pause' : 'play_arrow'}
        </span>
      </Button>
      <div className="flex-1 h-1 bg-primary/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-on-surface-variant shrink-0">{label}</span>
    </div>
  );
}

function PlayAllButton({ tracks }: { tracks: string[] }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);

  function playNext(idx: number) {
    if (idx >= tracks.length) { setPlaying(false); return; }
    const audio = new Audio(tracks[idx]);
    audioRef.current = audio;
    audio.onended = () => { indexRef.current = idx + 1; playNext(idx + 1); };
    audio.play();
  }

  function handlePlay() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    indexRef.current = 0;
    playNext(0);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePlay}
      className="h-7 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
    >
      <span className="material-symbols-outlined text-[15px]">
        {playing ? 'stop' : 'play_circle'}
      </span>
      {playing ? 'Stop' : 'Alles afspelen'}
    </Button>
  );
}

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  alt: string;
};

function PexelsImagePicker({
  question,
  category,
  value,
  onChange,
}: {
  question: string;
  category: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [autoQueried, setAutoQueried] = useState(false);

  useEffect(() => {
    setAutoQueried(false);
    setPhotos([]);
    setSearchInput('');
  }, [question]);

  const fetchPhotos = useCallback(async (q: string, autoSelect = false) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pexels-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const fetched: PexelsPhoto[] = data.photos ?? [];
      setPhotos(fetched);
      if (autoSelect && fetched.length > 0) {
        onChange(fetched[0].src.large);
      }
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    if (autoQueried || !question.trim() || !category) return;
    setAutoQueried(true);
    const fetchQuery = async () => {
      try {
        const res = await fetch(`/api/pexels-query?question=${encodeURIComponent(question)}&category=${encodeURIComponent(category)}`);
        const data = await res.json();
        const q = data.query || buildPexelsQuery(question, category);
        setSearchInput(q);
        fetchPhotos(q, true);
      } catch {
        const q = buildPexelsQuery(question, category);
        setSearchInput(q);
        fetchPhotos(q, true);
      }
    };
    fetchQuery();
  }, [question, category, autoQueried, fetchPhotos]);

  const selectedPhoto = photos.find(p => p.src.large === value);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-on-surface">Afbeelding (Pexels)</p>

      {/* Current / selected image preview */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-outline-variant group w-full" style={{ aspectRatio: '16/6' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Geselecteerde afbeelding" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 bg-white/90 text-error text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Verwijderen
            </button>
          </div>
          {selectedPhoto && (
            <span className="absolute bottom-2 right-2 text-white/70 text-[10px] bg-black/50 px-2 py-0.5 rounded-full">
              © {selectedPhoto.photographer} via Pexels
            </span>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchPhotos(searchInput))}
          placeholder="Zoek afbeelding…"
          className="field flex-1"
        />
        <button
          type="button"
          onClick={() => fetchPhotos(searchInput)}
          disabled={loading}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">search</span>
          )}
          Zoeken
        </button>
      </div>

      {/* Results grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => {
            const selected = photo.src.large === value;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onChange(selected ? '' : photo.src.large)}
                title={photo.photographer}
                className={`relative rounded-xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/40'
                }`}
                style={{ aspectRatio: '4/3' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                {selected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[28px] drop-shadow">check_circle</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
