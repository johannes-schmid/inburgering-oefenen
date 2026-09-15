import { ImageResponse } from 'next/og';
import { routing } from '@/i18n/routing';

/**
 * Het Open Graph-plaatje voor elke publieke pagina, als bestandsconventie.
 *
 * **Waarom een bestand en niet nóg een `images:` in elke `generateMetadata`.** Next voegt het
 * `openGraph`-object van een pagina niet samen met dat van de layout — het vervángt het. De
 * layout zette hier een plaatje neer, en elke pagina die daarna zelf een `openGraph` opgaf zonder
 * `images` gooide dat weg. Dat waren er 19 van de 22 op 15-09: de homepage, alle gidsen, alle
 * oefenexamen-overzichten. Alleen `/docent` en het blogartikel hielden er een over, en allebei
 * alleen omdat ze toevallig hun eigen `images` zetten.
 *
 * Metadata-bestanden lopen buiten die samenvoeging om. Eén bestand hier dekt daarom `/[locale]`
 * en alles eronder, ook een pagina die er nog niet is. Dat is precies de fout die op deze manier
 * niet nóg een keer gemaakt kan worden — een nieuwe pagina hoeft niets te onthouden.
 *
 * **De tekst staat in het Nederlands en is niet vertaald, met opzet.** `ImageResponse` rendert
 * met één meegegeven font en anders met een Latijnse standaard; de Arabische `meta_title` komt
 * daar als een rij lege blokjes uit. Dat is zichtbaar kapot in elke WhatsApp-preview, en dat is
 * nu juist het kanaal waar deze doelgroep links deelt. Vertalen kan pas als het Arabische font
 * hier als buffer binnenkomt — dat is een eigen taak, en tot die tijd is één leesbaar plaatje
 * beter dan drie waarvan er één onleesbaar is. De merknaam en het adres zijn taalonafhankelijk,
 * en die dragen de preview.
 *
 * **Geen foto van de docent.** Die stond er tot 15-09 wel: een uitsnede van 1376×768 in een vak
 * van 1200×630, waar het gezicht half buiten viel. Wat een deelbaar plaatje moet dragen is de
 * naam, waar het over gaat en waarom het te vertrouwen is — niet een pasfoto op briefkaartformaat.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Inburgering Oefenen — oefenexamens voor het inburgeringsexamen van een NT2-docent';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 76px',
          background: 'linear-gradient(135deg, #002b6d 0%, #1d428a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#fe762c', display: 'flex' }} />
          <div style={{ fontSize: 29, fontWeight: 700, letterSpacing: -0.4, display: 'flex' }}>
            Inburgering Oefenen
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.8, display: 'flex' }}>
            Inburgeringsexamen oefenen
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 32, fontWeight: 600 }}>
            <div style={{ display: 'flex', color: '#fe762c' }}>A2 · B1 · KNM · ONA</div>
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.4, opacity: 0.82, maxWidth: 880, display: 'flex' }}>
            Oefenexamens en kennisgidsen van een gecertificeerde NT2-docent.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 23, opacity: 0.75 }}>
          <div style={{ width: 40, height: 3, background: '#fe762c', display: 'flex' }} />
          <div style={{ display: 'flex' }}>inburgeringoefenen.nl</div>
        </div>
      </div>
    ),
    size,
  );
}
