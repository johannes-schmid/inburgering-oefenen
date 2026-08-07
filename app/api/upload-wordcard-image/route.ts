import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  // Was reachable by anyone who knew the path: it fetches an arbitrary URL from our
  // infrastructure and writes the result into a public bucket, so an unauthenticated version
  // is a free image host with our egress. See /api/admin/upload-image, which supersedes this.
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { url, wordcardId } = await req.json();
  if (!url || !wordcardId) return NextResponse.json({ error: 'Missing url or wordcardId' }, { status: 400 });

  const imageRes = await fetch(url);
  if (!imageRes.ok) return NextResponse.json({ error: 'Failed to fetch image from Pexels' }, { status: 502 });

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const webp = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const supabase = createAdminClient();
  const path = `wordcards/${wordcardId}.webp`;

  const { error } = await supabase.storage
    .from('wordcard-images')
    .upload(path, webp, { contentType: 'image/webp', upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('wordcard-images').getPublicUrl(path);
  return NextResponse.json({ publicUrl: `${data.publicUrl}?t=${Date.now()}` });
}
