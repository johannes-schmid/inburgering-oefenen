---
name: seo-monthly
description: De maandrun van de SEO-lus (eerste zaterdag) — content decay, kannibalisatie, interne links en het concurrentenverschil uit de snapshots van de afgelopen vier weken; levert briefs voor de docent en hooguit twee PR's met interne links.
---

# SEO maandrun

Zelfde grondregels als `/seo-weekly` (lees die eerst, en `seo-agent/README.md`). Deze run kijkt
over vier weken en doet de dingen die te traag zijn voor een weekoordeel. Output: briefs in
`seo-agent/briefs/`, een sectie "Maand" onderaan het weekrapport van deze week, en hooguit
`rules.monthly_pr_cap` PR's — alleen interne links en structured data, nooit kopij.

1. **Content decay.** Per pagina van inburgering: clicks in het huidige venster van 28 dagen
   tegen het gemiddelde van de drie vorige snapshots. Daling ≥ `rules.decay_threshold_pct`
   bij ≥ 100 vertoningen → brief `seo-agent/briefs/refresh-<slug>.md`: welke query's weglopen, wat
   concurrenten op die query doen (`competitors.json`), en drie concrete voorstellen voor
   Marieke. Geen tekst schrijven; een brief zegt wát en waaróm.

2. **Kannibalisatie.** In `gsc.json → current.query_page`: query's waar twee eigen URL's
   vertoningen hebben en de posities elkaar afwisselen (beide tussen 5 en 30). Kies de winnaar
   volgens de kaart in `SEO/keywords.md` ("één query, één pagina"). Voorstel: de verliezer
   verwijst intern naar de winnaar en laat de query uit zijn titel; dat is een PR als het
   alleen een link of een title raakt, anders een brief. Let speciaal op het paar uit
   `gsc-indexering-16-09-2026.txt`: `/nl/blog/spreken-examen-inburgering-tips` vs
   `/nl/taalexamens/spreken-examen`.

3. **Interne links.** `health.json → orphans` plus pagina's met `internal_link_count` onder
   de mediaan: stel per wees drie bronpagina's voor uit de top-20 op clicks, en zet de links
   in de bestaande tekst van die bronpagina's (alleen `<a href>`, geen nieuwe zinnen) — dat
   mag één PR zijn. De pillar-spoke-matrix van M5 (docs/MILESTONES.html) is de maatstaf.

4. **Concurrenten.** `competitors.json → new_since_last` van de laatste vier weken: welke
   nieuwe URL's gaan over een onderwerp waar wij geen pagina voor hebben? Lijstje van hooguit
   vijf content-gaps met de bijbehorende zoekterm uit `SEO/semrush/` als die er is; het staat
   in het rapport, niet in een PR. Scrape niets — als een URL belangrijk lijkt, noem hem en
   laat de eigenaar beslissen.

5. **Kwartaalnotitie** (januari, april, juli, oktober): één alinea over markt en scope
   (Vlaanderen, NT2, A1-vraag zonder product) op basis van de query's die wel vertoningen maar
   geen pagina hebben. Geen PR.

Alles komt in één PR-set op `claude/seo-<week>-monthly`, met de briefs en de rapportsectie, en
de ledger krijgt een rij per samengevoegde linkwijziging.
