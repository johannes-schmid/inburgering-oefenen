import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });

  if (!res.ok) return NextResponse.json({ error: 'Pexels API error' }, { status: res.status });

  const data = await res.json();
  return NextResponse.json({
    photos: data.photos.map((p: {
      id: number;
      src: { medium: string; large: string; large2x: string };
      photographer: string;
      alt: string;
    }) => ({
      id: p.id,
      src: { medium: p.src.medium, large: p.src.large2x || p.src.large },
      photographer: p.photographer,
      alt: p.alt,
    })),
  });
}
