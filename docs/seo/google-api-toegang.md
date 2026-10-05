# Google API-toegang — Search Console en GA4 via MCP

Eenmalige setup. Daarna kan Claude de echte GSC- en GA4-cijfers lezen.
Alles hieronder gebeurt in de browser, in het Google-account dat eigenaar is van
de Search Console-property en de GA4-property (`schmid.johannes90@gmail.com`).

## 1. Project en API's aanzetten

1. Ga naar https://console.cloud.google.com/projectcreate
   Naam: `inburgering-seo`. Maak aan en selecteer het project.
2. Zet twee API's aan (klik per link op **Enable**, met het nieuwe project actief):
   - Search Console API — https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   - Google Analytics Data API — https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com

## 2. Serviceaccount en sleutel

3. Ga naar https://console.cloud.google.com/iam-admin/serviceaccounts
   **Create service account** → naam `claude-seo-reader` → **Create and continue** →
   rol overslaan (**Continue**) → **Done**.
4. Klik op het nieuwe account → tabblad **Keys** → **Add key** → **Create new key** →
   **JSON** → **Create**. Het bestand downloadt.
5. Noteer het e-mailadres van het serviceaccount. Vorm:
   `claude-seo-reader@inburgering-seo.iam.gserviceaccount.com`

   claude-seo-reader@inburgering-seo.iam.gserviceaccount.com

6. Leg het JSON-bestand ergens buiten de repo, bijvoorbeeld:
   `~/.config/google/inburgering-seo.json`
   **Niet in de repo** — het is een sleutel.



## 3. Toegang geven

7. **Search Console** — https://search.google.com/search-console
   Kies de property `inburgeringoefenen.nl` → **Settings** → **Users and permissions**
   → **Add user** → plak het serviceaccount-adres → permission **Full**
   (Full is nodig voor URL-inspectie; Restricted volstaat voor alleen cijfers).
   **Herhaal dit voor de property `knmoefenen.nl`** — de SEO-lus (`seo-agent/README.md`) leest beide.
8. **GA4** — https://analytics.google.com → **Admin** → kolom Property →
   **Property access management** → **+** → **Add users** → plak hetzelfde adres →
   rol **Viewer** → **Add**.
9. Noteer het **GA4 Property ID** (Admin → Property → Property details, een getal van 9 cijfers).

Account: Inburgering Oefenen, ID 402658083, role: Viewer

Property: https://inburgeringoefenen.nl/, ID 547503294, role: Viewer

The tooltip over the property shows https://inburgeringoefenen.nl/.


## 4. Voor de SEO-lus (GitHub Action)

De vrijdagrun leest het serviceaccount uit het GitHub-secret `GSC_SA_JSON`:
repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**,
naam `GSC_SA_JSON`, waarde = de **volledige inhoud** van het JSON-bestand (geen pad).
De overige sleutels staan in de tabel onderaan `seo-agent/README.md`.

## 5. Voor lokaal gebruik via MCP (optioneel)

Geef door:
- het pad naar het JSON-bestand
- het GA4 Property ID

Claude installeert dan `uv` (Homebrew), kloont `AminForou/mcp-gsc` voor Search Console en
`googleanalytics/google-analytics-mcp` voor GA4, en schrijft `.mcp.json`. Dat bestand bevat
alleen het *pad* naar de sleutel, nooit de sleutel zelf — maar zet `.mcp.json` toch in
`.gitignore` als er een pad in staat dat privé is.

Let op: `mcp-gsc` vereist Python 3.10+. De `python3` op het PATH is nu 3.8; `uv` regelt
een eigen interpreter, dus de systeem-Python hoeft niet te veranderen.
