import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { url, questionId } = await req.json();
  if (!url || !questionId) return NextResponse.json({ error: 'Missing url or questionId' }, { status: 400 });

  const imageRes = await fetch(url);
  if (!imageRes.ok) return NextResponse.json({ error: 'Failed to fetch image from Pexels' }, { status: 502 });

  const buffer = await imageRes.arrayBuffer();
  const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';

  const supabase = createAdminClient();
  const path = `questions/${questionId}.jpg`;

  const { error } = await supabase.storage
    .from('question-images')
    .upload(path, buffer, { contentType, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('question-images').getPublicUrl(path);
  return NextResponse.json({ publicUrl: data.publicUrl });
}
