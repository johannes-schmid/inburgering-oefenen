'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';

/**
 * The one image picker for every admin editing surface: search Pexels, click a photo, done.
 *
 * ## Pexels is the only way in (owner's instruction, 2026-08-27)
 *
 * There used to be three ways to give an item a picture and they had drifted apart: this
 * component offered a file upload, a pasted URL *and* a Pexels search; `StimulusEditor` offered a
 * bare `https://…` text field and nothing else; the woordkaarten drawer had its own Pexels search
 * that stored `images.pexels.com` URLs. So the same job had three UIs, two of which could put a
 * URL we do not control into a row that a candidate later renders.
 *
 * One path means one place where provenance and encoding are decided. What it costs is worth
 * writing down: the docent can no longer bring her own photograph or a scan of her own material
 * through admin. If that comes back, it comes back **here**, as a second source that still ends
 * up in the same bucket through the same route — not as a text field on one screen.
 *
 * ## A pick is stored immediately, never on save
 *
 * Clicking a photo POSTs it to `/api/admin/upload-image`, which re-encodes it to WebP and writes
 * it to our own bucket; the URL handed to `onChange` is **ours**. Two failure modes this closes:
 *
 *  - The woordkaarten drawer used to keep the Pexels CDN URL in form state and rehost it during
 *    save, `catch`ing a failure by *keeping the Pexels URL* — so the quiet path ended with a
 *    third-party URL in the database, which is exactly what rehosting exists to prevent.
 *  - What the docent previewed is what gets stored. A pick that cannot be processed fails here,
 *    in front of her, instead of at save time on a different screen.
 *
 * ## Why the search box is always open and prefilled
 *
 * It used to be behind a "Zoek in Pexels" link, below the two upload affordances. It is now the
 * only control, so it leads — prefilled from the item (`query`) as a starting point and freely
 * editable, because Pexels indexes English and the item is Dutch: the prefill is a shortcut, not
 * the search.
 */

type PexelsPhoto = {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
  alt: string;
};

/**
 * Which bucket and size the pick is stored at. `content` is every exam image; `wordcard` is the
 * woordkaarten bucket, which is a separate public bucket the candidate-facing card reads.
 */
export type ImageTarget = 'content' | 'wordcard';

export default function ImagePicker({
  urls,
  max,
  query,
  target = 'content',
  onChange,
}: {
  urls: string[];
  max: number;
  /** The item's own words, used to prefill the search box. Not sent anywhere. */
  query: string;
  target?: ImageTarget;
  onChange: (urls: string[]) => void;
}) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [storing, setStoring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The prefill follows the item until the docent types: re-seeding after that would throw away
  // what she is in the middle of searching for.
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) setTerm(query.slice(0, 60));
  }, [query]);

  const full = urls.length >= max;

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pexels-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Zoeken in Pexels is niet gelukt.');
      setPhotos(data.photos ?? []);
      if ((data.photos ?? []).length === 0) setError('Geen foto’s gevonden. Probeer een andere zoekterm.');
    } catch (err) {
      setPhotos([]);
      setError(err instanceof Error ? err.message : 'Zoeken in Pexels is niet gelukt.');
    } finally {
      setLoading(false);
    }
  }

  /** Copy the picked photo into our bucket and add the URL it comes back with. */
  async function store(photo: PexelsPhoto) {
    if (full) return;
    setStoring(photo.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photo.src.large, target }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Opslaan van de afbeelding is niet gelukt.');
      if (!urls.includes(json.url)) onChange([...urls, json.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan van de afbeelding is niet gelukt.');
    } finally {
      setStoring(null);
    }
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
        {full ? '' : ' · kies een foto uit Pexels'}
      </p>

      {error && <p className="text-xs text-error">{error}</p>}

      {!full && (
        <>
          <div className="flex gap-2">
            <input
              value={term}
              onChange={e => { touched.current = true; setTerm(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search(term); } }}
              placeholder="Zoekterm — bijv. “dutch supermarket checkout”"
              aria-label="Zoekterm voor Pexels"
              className="w-full min-w-0 flex-1 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => void search(term)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
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
                  disabled={storing !== null}
                  onClick={() => void store(p)}
                  title={`© ${p.photographer} via Pexels`}
                  className="relative rounded-lg overflow-hidden border-2 border-transparent transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                  style={{ aspectRatio: '4 / 3' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src.medium} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                  {storing === p.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                      <Loader2 size={18} className="animate-spin" aria-hidden />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <p className="text-[11px] text-on-surface-variant">
              Foto’s via Pexels. De gekozen foto wordt gecomprimeerd (WebP) en in onze eigen opslag
              bewaard.
            </p>
          )}
        </>
      )}

      {full && (
        <p className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Check size={12} aria-hidden /> Klaar — verwijder een afbeelding om te wisselen.
        </p>
      )}
    </div>
  );
}
