'use client';

import { useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  alt: string;
};

/**
 * Picks the 1..3 images that make up one answer option.
 *
 * DUO's image items are not always a single picture — Lezen item 11 has four options, each
 * of which is a set of *three* thumbnails. So this holds an ordered list, capped by the
 * question's `option_layout` (`image` → 1, `image_grid` → 3), and writes it straight into
 * `question_options.image_urls`.
 *
 * A pasted URL is accepted as well as a Pexels pick: the docent's own photographs and scans
 * are the normal case, and forcing everything through stock search would be perverse for a
 * product whose whole claim is that the content is hers.
 */
export default function OptionImagePicker({
  urls,
  max,
  query,
  onChange,
}: {
  urls: string[];
  max: number;
  query: string;
  onChange: (urls: string[]) => void;
}) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pasted, setPasted] = useState('');
  const [open, setOpen] = useState(false);

  const full = urls.length >= max;

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pexels-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPhotos(data.photos ?? []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  function add(url: string) {
    if (full || urls.includes(url)) return;
    onChange([...urls, url]);
  }

  return (
    <div className="space-y-2">
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative rounded-lg overflow-hidden border border-outline-variant"
              style={{ width: 88, aspectRatio: '4 / 3' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
                aria-label="Afbeelding verwijderen"
                className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/60 text-white"
                style={{ width: 18, height: 18 }}
              >
                <X size={11} strokeWidth={3} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-on-surface-variant">
        {urls.length} / {max} afbeelding{max === 1 ? '' : 'en'}
      </p>

      {!full && (
        <>
          <div className="flex gap-2">
            <input
              value={pasted}
              onChange={e => setPasted(e.target.value)}
              placeholder="Plak een afbeeldings-URL…"
              className="field flex-1"
            />
            <button
              type="button"
              onClick={() => { if (pasted.trim()) { add(pasted.trim()); setPasted(''); } }}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap"
            >
              Toevoegen
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setOpen(o => !o); if (!open && !photos.length) { setTerm(query.slice(0, 60)); } }}
            className="text-xs font-medium text-primary hover:underline"
          >
            {open ? 'Zoeken sluiten' : 'Zoek in Pexels'}
          </button>

          {open && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search(term); } }}
                  placeholder="Zoekterm…"
                  className="field flex-1"
                />
                <button
                  type="button"
                  onClick={() => void search(term)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                  {loading
                    ? <Loader2 size={14} className="animate-spin" aria-hidden />
                    : <Search size={14} aria-hidden />}
                  Zoeken
                </button>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => add(p.src.large)}
                      title={`© ${p.photographer} via Pexels`}
                      className="rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{ aspectRatio: '4 / 3' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src.medium} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
