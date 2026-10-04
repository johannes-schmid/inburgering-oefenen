/**
 * Domeinverificatie voor de OpenAI Apps-directory.
 *
 * OpenAI haalt dit pad op en verwacht precies het token als platte tekst, zonder newline.
 * Het token staat in `OPENAI_APPS_CHALLENGE` (Vercel) en niet in de code: het hoort bij
 * één organisatie en wisselt als de plugin opnieuw wordt aangemaakt.
 */
export async function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim();
  if (!token) return new Response('Not found', { status: 404 });
  return new Response(token, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
