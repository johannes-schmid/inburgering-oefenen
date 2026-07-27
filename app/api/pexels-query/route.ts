import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const question = req.nextUrl.searchParams.get('question');
  const category = req.nextUrl.searchParams.get('category') ?? '';

  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 });

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
        content: `Give me a 4-6 word English Pexels photo search query that visually illustrates this Dutch civic exam question. Always include "Netherlands" in the query. Return ONLY the search query, nothing else.\n\nCategory: ${category}\nQuestion: ${question}`,
      }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Anthropic API error' }, { status: res.status });

  const data = await res.json();
  const query = data.content?.[0]?.text?.trim() ?? '';

  return NextResponse.json({ query });
}
