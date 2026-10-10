/**
 * Van een gedeelde videolink naar iets wat de pagina kan tonen.
 *
 * De eigenaar levert de lesvideo's aan als de link die hij toevallig heeft: een YouTube-link
 * (`watch?v=`, `youtu.be`, `shorts/`), een Google Drive-bestand, of een kaal `.mp4`. Een
 * YouTube-pagina of een Drive-viewer kan niet in een `<video>`, en een `.mp4` hoort niet in een
 * iframe — dus beslist één functie welke van de twee het wordt, en niet elke component zelf.
 *
 * YouTube gaat via `youtube-nocookie.com`: dezelfde speler, maar zonder cookies tot er op play
 * wordt gedrukt. Drive krijgt `/preview`, de enige Drive-URL die in een iframe mag.
 *
 * Client-veilig en puur: geen netwerk, geen DOM. Getest in `tests-unit/video-embed.test.ts`.
 */

export type VideoEmbed =
  | { kind: 'iframe'; provider: 'youtube' | 'drive'; src: string; id: string }
  | { kind: 'video'; src: string };

const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,}$/;

function parse(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

function youtubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const [, kind, value] = u.pathname.split('/');
      if (kind === 'shorts' || kind === 'embed' || kind === 'live' || kind === 'v') id = value ?? null;
    }
  }
  return id && YT_ID.test(id) ? id : null;
}

function driveId(u: URL): string | null {
  if (u.hostname !== 'drive.google.com') return null;
  const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
  const id = m?.[1] ?? (u.pathname === '/open' ? u.searchParams.get('id') : null);
  return id && DRIVE_ID.test(id) ? id : null;
}

/**
 * `null` voor een lege of onleesbare link — de aanroeper toont dan de lege videoplek, net als
 * bij `url: null` in `VIDEOS`. Een link die geen YouTube en geen Drive is, wordt een `<video>`:
 * dat is wat de lesitems van soort `video` altijd al deden.
 */
export function toVideoEmbed(url: string | null | undefined): VideoEmbed | null {
  if (!url || !url.trim()) return null;
  const u = parse(url);
  if (!u || (u.protocol !== 'https:' && u.protocol !== 'http:')) return null;

  const yt = youtubeId(u);
  if (yt) {
    const start = u.searchParams.get('t') ?? u.searchParams.get('start');
    const seconds = start ? parseInt(start, 10) : NaN;
    const query = Number.isFinite(seconds) && seconds > 0 ? `?start=${seconds}` : '';
    return { kind: 'iframe', provider: 'youtube', id: yt, src: `https://www.youtube-nocookie.com/embed/${yt}${query}` };
  }

  const drive = driveId(u);
  if (drive) {
    return { kind: 'iframe', provider: 'drive', id: drive, src: `https://drive.google.com/file/d/${drive}/preview` };
  }

  return { kind: 'video', src: u.toString() };
}

/**
 * De iframe-URL zoals hij in de pagina staat. Bij YouTube `rel=0`: na afloop alleen video's
 * van hetzelfde kanaal, geen willekeurige aanbevelingen naast een les.
 */
export function playerSrc(embed: Extract<VideoEmbed, { kind: 'iframe' }>): string {
  if (embed.provider !== 'youtube') return embed.src;
  return `${embed.src}${embed.src.includes('?') ? '&' : '?'}rel=0`;
}
