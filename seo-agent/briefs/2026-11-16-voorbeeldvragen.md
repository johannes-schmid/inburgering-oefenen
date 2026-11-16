# Nieuwe landingspagina "Voorbeeldvragen" — ter review, 16-11-2026

**Link (lokaal / na deploy):** `/nl/voorbeeldvragen`
**Bestand:** `app/[locale]/(main)/voorbeeldvragen/page.tsx`, tekst in `messages/nl.json` → `voorbeeldvragen`

De pagina staat op **noindex** en niet in de sitemap. Ze gaat pas naar Google als jij akkoord bent,
en op z'n vroegst in week 48 (23 november): we zetten hooguit één nieuwe pagina per week live.
**Tijd:** ongeveer 15 minuten.

Voor wie: iemand die zoekt hoe de vragen van het inburgeringsexamen eruitzien ("inburgeringsvragen",
"voorbeeldvragen inburgeringsexamen"). De pagina laat de vragen zien en laat ze maken, zonder account.

Alle opgaven bestaan al en heb je al gezien:

- **Lezen A2** — proefvraag lz-4 (Fatima en de cursussen in de bibliotheek)
- **Luisteren A2** — proefvraag lu-4 (Hassan en de juf van Amira), met het echte fragment
- **Schrijven A2** — opdracht 1 van oefenexamen 1 (e-mail aan taalschool Centrum). Alleen de opdracht, **geen modelantwoord**.
- **Spreken A2** — opdracht 1 van oefenexamen 1 (de nieuwe buurvrouw). Alleen de opdracht.

Wat we vragen:

- **De drie vragen onderaan.** Vooral: "Je hoeft niet alle vragen goed te hebben om te slagen" en
  "De minister stelt de grens vast" (uit het examenreglement, `SEO/facts.md` §2). Klopt dat zo?
- **"DUO geeft je 3 of 4 oefenexamens per onderdeel. Wij geven je 10."** (`SEO/facts.md` §8)
- **De zinnen onder Schrijven en Spreken:** "Je krijgt feedback op je tekst" en "Je hebt 60 seconden".
- **De zin over jou:** dezelfde als op /herexamen.
- Missen er voorbeeldvragen die cursisten altijd willen zien?

Akkoord? Dan zet de eigenaar `REVIEWED` op `true` in de pagina, komt ze in de sitemap en gaat de
status in `seo-agent/landing-pages.json` op `live`.
