import { ArrowRight, Layers, ClipboardList, Clock, Lock } from 'lucide-react';
import { DotField } from '@/components/horizon';

export type TrackCardMeta = { icon: 'parts' | 'exams' | 'clock'; label: string };

/**
 * Eén track als kaart: A2, B1, KNM of ONA.
 *
 * De rij (`TrackRow`) zei alles op één regel en moest daarvoor de eerstvolgende les afkappen met
 * een ellips. De kaart heeft twee regels en een voet, dus de drie dingen die deze module
 * beschrijven passen naast elkaar in plaats van achter elkaar: het merkteken op zijn eigen tegel,
 * de naam met wat erin zit, en onderaan óf de voortgang óf waar de module uit bestaat.
 *
 * **Twee gezichten, en dat is de hele reden voor deze kaart** — de eigenaar vroeg om het
 * onderscheid dat een cursuscatalogus maakt:
 *
 * | `state` | Wat de voet zegt | Voorbeeld |
 * |---|---|---|
 * | `active` | waar je gebleven bent: de huidige les, de balk, het percentage | een module die je oefent |
 * | `open` | waar de module uit bestaat: onderdelen, oefenexamens, duur | van jou, nog niet begonnen |
 * | `locked` | hetzelfde, plus de prijs en een slotje op de tegel | niet in je pakket |
 * | `soon` | één regel tekst, geen link, geen prijs | ONA |
 *
 * Dat is dezelfde discipline als de drie niet-openbare examenslots: één "vergrendeld"-vorm voor
 * alle vier zou de kandidaat niets vertellen. **`locked` krijgt daarom geen balk** — een balk op
 * 0% naast een prijs leest als voortgang die je kwijt bent.
 *
 * **De tegel blijft navy.** Een track hoort op de geïnverteerde tegel (COMPONENTS.md §Icons); de
 * lichte tegel is voor de onderdelen erbinnen. Bij `soon` en `locked` is diezelfde tegel doffer,
 * niet lichter — de inversie is de laag, niet de status.
 *
 * **Precies één oranje CTA per scherm.** `accent` is de kaart waar je het laatst was; de andere
 * knoppen zijn tonaal. Twee oranje knoppen naast elkaar en het oranje wijst nergens meer heen.
 */
export default function TrackCard({
  mark, title, sub, state, meta, note, pct, progressLabel, cta, href, soonLabel,
  accent = false, layer = 'track',
}: {
  /** `ExamMark` op ware grootte — de icoonlaag van het systeem, nooit een lucide-glyph. */
  mark: React.ReactNode;
  title: string;
  sub: string;
  state: 'active' | 'open' | 'locked' | 'soon';
  /** De voet bij `open` en `locked`: waar de module uit bestaat. */
  meta: TrackCardMeta[];
  /** Bij `active` de huidige les, bij `soon` de aankondiging. */
  note: string | null;
  pct: number | null;
  /** "12 van 40 oefenexamens" — het getal achter de balk, want een percentage alleen zegt niet waarvan. */
  progressLabel: string | null;
  cta: string | null;
  href: string | null;
  soonLabel: string;
  accent?: boolean;
  /**
   * Welke altitude de kaart benoemt: `track` is een module (`ExamMark`, het merkverloop),
   * `onderdeel` is wat er binnen een module zit (`CategoryMark tone="dark"`, vlak navy).
   *
   * Beide panelen zijn navy — dat is de eigenaar zijn keuze (08-09) en het kost iets: de
   * tegelinversie uit COMPONENTS.md §Icons kan het verschil niet meer alleen dragen. Wat het
   * wél draagt is de tekening (de trap van een niveau tegen de colonnade van een onderdeel), de
   * kicker die de module noemt, en het verloop tegen het vlakke vlak. Geef daarom nooit een
   * `CategoryMark` met `tone="light"` mee aan deze kaart: op navy moet de cut-kleur de navy
   * zijn, anders staat er een lichte tegel in het paneel te knipperen.
   */
  layer?: 'track' | 'onderdeel';
}) {
  const shown = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  /* Een streepje waar niets gemeten is: 0% zegt "je staat op nul", en dat is een ander feit. */
  const pctLabel = pct == null ? '—' : `${shown}%`;

  const body = (
    <>
      <div className="tcard-art">
        <DotField on="dark" size={20} />
        <span className="tcard-mark" aria-hidden>{mark}</span>
        {state === 'soon' && <span className="tcard-flag">{soonLabel}</span>}
        {state === 'locked' && (
          <span className="tcard-lock" aria-hidden><Lock size={13} strokeWidth={2.6} /></span>
        )}
      </div>

      <div className="tcard-body">
        <span className="tcard-kick">{sub}</span>
        <h3 className="tcard-title">{title}</h3>

        {state === 'active' ? (
          <>
            {note && <p className="tcard-note">{note}</p>}
            <div className="tcard-prog">
              <span className="tcard-bar" aria-hidden><i style={{ width: `${shown}%` }} /></span>
              <span className="tcard-pct">{pctLabel}</span>
            </div>
          </>
        ) : state === 'soon' ? (
          <p className="tcard-note tcard-note-soon">{note}</p>
        ) : null}

        <span className="tcard-gap" aria-hidden />

        {/* De voet is één regel: links waar de module uit bestaat of hoe ver je bent, rechts de
            knop. Onder elkaar kostte dat twee regels hoogte per kaart, en met vier kaarten in
            een 2×2 is dat precies het verschil tussen wel en niet op één scherm. */}
        {(cta || state !== 'soon') && (
          <div className="tcard-foot">
            {/* Eén regel in de voet, en `progressLabel` gaat voor: een kaart die telt hoe ver je
                bent zegt dat liever dan waar hij uit bestaat. Zonder telling vallen de feiten
                terug op hun plek — dat is wat de leerroutekaarten gebruiken. */}
            {state === 'active' && progressLabel
              ? <span className="tcard-progl">{progressLabel}</span>
              : state !== 'soon' && (
                <ul className="tcard-meta">
                  {meta.map(m => (
                    <li key={m.label}>
                      <MetaIcon kind={m.icon} />
                      {m.label}
                    </li>
                  ))}
                </ul>
              )}

            {cta && (
              <span className={`tcard-cta${accent ? ' is-accent' : ''}`} aria-hidden>
                {cta}<ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" />
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cls = `tcard layer-${layer} is-${state}${accent ? ' is-now' : ''} no-underline`;
  return href ? <a href={href} className={cls}>{body}</a> : <div className={cls}>{body}</div>;
}

function MetaIcon({ kind }: { kind: TrackCardMeta['icon'] }) {
  const props = { size: 13, strokeWidth: 2.2, 'aria-hidden': true } as const;
  if (kind === 'parts') return <Layers {...props} />;
  if (kind === 'exams') return <ClipboardList {...props} />;
  return <Clock {...props} />;
}
