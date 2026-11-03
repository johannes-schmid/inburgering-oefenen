# Herschrijving van het stappenplan — ter review, 03-11-2026

**Pagina:** https://inburgeringoefenen.nl/nl/inburgering/inburgering-stappenplan
**Bestand:** `data/guides/inburgering-stappenplan.ts` (PR "stappenplan: herschrijving voor 'wat is inburgeren'")
**Tijd:** ongeveer 40 minuten. Lezen, twee voorbeelden controleren, drie vragen beantwoorden.

## Waarom de pagina anders moet

De pagina stond de afgelopen vijf weken rond positie 57 in Google voor "inburgeren", "wat is
inburgeren" en "hoe lang mag je doen over inburgeren" (741 vertoningen, 2 klikken). Hij zei
hetzelfde als de pagina *Moet ik inburgeren?* en Google koos dan de ene of de andere. Daarom:

- **Deze pagina** gaat over *wat* inburgeren is en *hoe* het werkt (uitleg, voorbeeld, tijd, stappen).
- **Moet ik inburgeren?** houdt *wie* moet inburgeren (de ja/nee-tabel, vrijstelling, ontheffing).
  Die tabel staat hier dus niet meer, alleen een link.

De beste concurrerende pagina's laten iets *zien* in plaats van alles te beschrijven. Daarom
staan er twee nieuwe blokken in. **Die zijn door de redactie geschreven, niet door jou**, en dat
is precies wat je moet nakijken.

## Wat je nakijkt

### 1. De voorbeeldopdracht Schrijven A2 (kop "Zo ziet het examen eruit: één opdracht")

> Je dochter Sara is ziek. Ze kan morgen niet naar school. Schrijf een e-mail aan haar juf,
> mevrouw De Boer. Schrijf: 1. dat Sara ziek is, 2. wat ze heeft, 3. wanneer ze weer naar school komt.

Antwoord op de pagina:

> Beste mevrouw De Boer, **Sara is ziek.** **Ze heeft koorts en keelpijn.** Daarom kan ze morgen
> niet naar school. **Ik denk dat ze donderdag weer komt.** Met vriendelijke groet, Fatima Yilmaz

Vragen:
- Is dit een opdracht zoals DUO hem stelt (lengte, soort situatie, drie punten)?
- Is het antwoord een goed A2-antwoord, of te goed of te mager?
- De uitleg eronder zegt: alle punten noemen, korte zinnen, aanhef en groet. Klopt dat als
  samenvatting van waar een beoordelaar op let? Zo niet: wat moet er staan?
- **Liever een opdracht uit je eigen les?** Vervang hem dan. Eigen materiaal is sterker dan het
  onze. Geen echte DUO-vraag: die zijn geheim.

### 2. Eén bericht op A1, A2 en B1 (kop "Welk niveau moet je halen?")

Iemand zegt een afspraak bij de huisarts af:

| Niveau | Tekst op de pagina |
|---|---|
| A1 | Hallo. Ik ben ziek. Ik kom niet. Morgen nieuwe afspraak? |
| A2 | Goedemorgen. Ik heb vandaag om 10 uur een afspraak. Ik ben ziek en kan niet komen. Kan ik een nieuwe afspraak maken? |
| B1 | Goedemorgen. Ik heb vanochtend om 10.00 uur een afspraak bij dokter De Vries, maar ik heb sinds gisteren koorts. Daarom kan ik helaas niet komen. Kan ik de afspraak verzetten naar volgende week, het liefst in de ochtend? |

Vragen:
- Zijn dit geloofwaardige voorbeelden van de drie niveaus? Vooral: is A1 niet te kaal, en is B1
  echt B1 (niet B2)?
- De korte uitleg per kaart ("Losse, korte zinnen" / "Hele zinnen" / "Je legt uit waarom") mag je
  herschrijven in je eigen woorden.
- Ook hier: heb je een echt voorbeeld uit je lessen, dan graag dat.

### 3. De twee docentnotities

Beide stonden al op de pagina en staan ook in het feitenblad van 11-10 (deel C). Ze zijn
ongewijzigd overgenomen: de notitie over de leerbaarheidstoets (stap 2) en die over de volgorde
van de examens (stap 6). Nieuwe notities in de ik-vorm zijn er niet bij gekomen.

### 4. De rest van de tekst

Alles is korter geschreven, in `je`-vorm, en de feiten komen uit `SEO/facts.md` met bron en datum
erbij. Nieuw ten opzichte van augustus:
- een eigen kop "Hoe lang mag je doen over inburgeren?" (3 jaar vanaf de dag na je PIP, extra tijd
  zonder vaste duur, 1 keer per periode);
- een korte kop "Wat kost inburgeren?" (€50 per onderdeel, met link naar de kostenpagina);
- de FAQ begint met "Wat is inburgeren?" en "Hoe lang mag je doen over inburgeren?".

Lees de tekst één keer als cursist. Alles wat niet klopt of anders moet: schrijf het in de PR of
in een spraakmemo, dat is genoeg.

## Wat er daarna gebeurt

Pas na jouw akkoord gaat de tekst live. Dan wordt `reviewedOn` op de datum van je review gezet en
samengevoegd. De Engelse en Arabische vertaling zijn automatisch gemaakt van dit concept en
staan als zodanig gemarkeerd; ze worden opnieuw gemaakt als jij de Nederlandse tekst verandert.
Vijf weken na publicatie beoordeelt de wekelijkse SEO-run of de pagina is gestegen
(`seo-agent/ledger.json`, rij `2026-11-03-stappenplan-wat-is-inburgeren`).
