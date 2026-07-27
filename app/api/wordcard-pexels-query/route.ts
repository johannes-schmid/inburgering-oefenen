import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const dutch = req.nextUrl.searchParams.get('dutch');
  const translationEn = req.nextUrl.searchParams.get('translation_en') ?? '';
  const example = req.nextUrl.searchParams.get('example') ?? '';

  if (!dutch) return NextResponse.json({ error: 'Missing dutch' }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [{
        role: 'user',
        content: `Give me a 4-6 word English Pexels photo search query that visually illustrates this Dutch vocabulary word, used in a Dutch civic integration (inburgering) course. Always include "Netherlands" in the query. Return ONLY the search query, nothing else.\n\nDutch word: ${dutch}\nEnglish translation: ${translationEn}\nExample sentence: ${example}`,
      }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Anthropic API error' }, { status: res.status });

  const data = await res.json();
  const query = data.content?.[0]?.text?.trim() ?? '';

  return NextResponse.json({ query });
}
