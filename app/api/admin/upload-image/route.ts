import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/admin/guard';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * One endpoint for every admin image: the remote URL of a picked Pexels photo, or a file upload.
 *
 * ## Why rehosting a picked stock photo matters
 * The image pickers used to store the Pexels CDN URL directly. An exam item whose picture is a
 * third-party URL is an exam item that can break without anybody touching it — the CDN rotates a
 * path, the photo is taken down, and a Spreken task about "kies één plaatje" renders two boxes and
 * a hole. Every image the docent chooses is copied into our own bucket, so what she previewed is
 * what the candidate sees.
 *
 * ## Format
 * Re-encoded to WebP at ≤1600px. Exam images are decorative-at-worst and read-once-at-best; a 6 MB
 * phone photo pasted into a Spreken task is a 6 MB download for a candidate on mobile data during
 * a timed exam. Original aspect ratio is kept — `image_usage: 'choose'` items depend on the
 * pictures being comparable, and a forced crop can remove the very detail being tested.
 *
 * Admin-only: it writes to a public bucket, so an open version is a free image host.
 *
 * ## `target` — which bucket, at which width
 * `content` (the default) is every exam image, in `question-images` at ≤1600px. `wordcard` is the
 * woordkaarten bucket, at ≤800px because that card renders small. The woordkaarten drawer used to
 * have its own route for this (`/api/upload-wordcard-image`, which rehosted at save time and fell
 * back to keeping the Pexels URL when it failed); it now comes through here, so there is one place
 * where an admin image's encoding and provenance are decided. That route is deleted, along with
 * `/api/upload-pexels-image` — which stored the fetched bytes **uncompressed** under an
 * id-shaped path, so a second pick silently overwrote the first item's picture.
 */

type Target = 'content' | 'wordcard';

const TARGETS: Record<Target, { bucket: string; prefix: string; width: number; quality: number }> = {
  content: { bucket: 'question-images', prefix: 'content', width: 1600, quality: 82 },
  wordcard: { bucket: 'wordcard-images', prefix: 'wordcards', width: 800, quality: 80 },
};

function targetFrom(value: unknown): Target {
  return value === 'wordcard' ? 'wordcard' : 'content';
}

/** Comfortably above a phone photo, well below what would make a function time out. */
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const contentType = request.headers.get('content-type') ?? '';

  try {
    const source = contentType.includes('multipart/form-data')
      ? await fromUpload(request)
      : await fromUrl(request);
    if ('error' in source) {
      return NextResponse.json({ error: source.error }, { status: source.status });
    }

    const spec = TARGETS[source.target];

    /* Imported here, not at module scope. A native module that fails to initialise takes the whole
     * route file with it, and a route that cannot load answers 500 to everything — including the
     * admin guard, so the log says nothing about auth and the failure looks like a bug in the
     * upload. Inside the handler the same failure is one catchable error with a message. */
    const { default: sharp } = await import('sharp');

    const webp = await sharp(source.bytes)
      .rotate() // honour EXIF orientation — a portrait phone photo otherwise lands on its side
      .resize({ width: spec.width, withoutEnlargement: true })
      .webp({ quality: spec.quality })
      .toBuffer();

    // Content path is random rather than derived from the item: an image is reused across options
    // and re-uploaded on a change, and an `id`-shaped path (the old `questions/<id>.jpg`) means a
    // second upload silently overwrites the first item's picture wherever else it is referenced.
    const path = `${spec.prefix}/${randomUUID()}.webp`;

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(spec.bucket)
      .upload(path, webp, { contentType: 'image/webp', upsert: false });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(spec.bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, bytes: webp.byteLength });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[upload-image]', message);
    // sharp throws on anything it cannot decode, which is the common case here (a PDF, a .heic
    // from an older iPhone) and is the docent's problem to fix, not a server fault.
    return NextResponse.json(
      { error: `Deze afbeelding kon niet verwerkt worden: ${message}` },
      { status: 400 }
    );
  }
}

type Source = { bytes: Buffer; target: Target } | { error: string; status: number };

async function fromUpload(request: Request): Promise<Source> {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return { error: 'Geen bestand ontvangen.', status: 400 };
  if (file.size > MAX_BYTES) {
    return { error: 'Deze afbeelding is groter dan 12 MB.', status: 413 };
  }
  if (file.type && !file.type.startsWith('image/')) {
    return { error: 'Dit is geen afbeelding.', status: 415 };
  }
  return { bytes: Buffer.from(await file.arrayBuffer()), target: targetFrom(form.get('target')) };
}

async function fromUrl(request: Request): Promise<Source> {
  const body = (await request.json()) as { url?: unknown; target?: unknown };
  const imageTarget = targetFrom(body.target);
  const raw = typeof body.url === 'string' ? body.url.trim() : '';
  if (!raw) return { error: 'Geen URL ontvangen.', status: 400 };

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return { error: 'Dit is geen geldige URL.', status: 400 };
  }
  // https only, and no loopback or link-local host. The caller is an authenticated admin, so this
  // is not the main line of defence — but a fetch this route makes originates from our
  // infrastructure, and pointing it at an internal address is a class of request no image upload
  // should be able to express.
  if (target.protocol !== 'https:') return { error: 'Alleen https-URLs.', status: 400 };
  if (isLocalHost(target.hostname)) return { error: 'Deze host is niet toegestaan.', status: 400 };

  const res = await fetch(target, { redirect: 'follow' });
  if (!res.ok) return { error: `De afbeelding kon niet opgehaald worden (${res.status}).`, status: 502 };

  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) return { error: 'Deze URL geeft geen afbeelding terug.', status: 415 };

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return { error: 'Deze afbeelding is groter dan 12 MB.', status: 413 };
  return { bytes, target: imageTarget };
}

function isLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true;
  return (
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h === '[::1]'
  );
}
