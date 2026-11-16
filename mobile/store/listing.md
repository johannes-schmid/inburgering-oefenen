# App Store listing: Inburgering Oefenen

Paste these into App Store Connect. Dutch is the primary language; the English block is for an
optional English localisation. Character limits are Apple's and are checked by
`node mobile/store/check-listing.mjs`.

Before you publish, check the counts in the description against **production**. They come from
`CLAUDE.md` (40 A2 exams, 10 KNM exams, 7 KNM lesson modules, 366 word cards), and the
screenshots were taken on the local stack, which holds more lessons than production does.

---

## Dutch (primary)

### Name (max 30)

```
Inburgering Oefenen
```

### Subtitle (max 30)

```
Oefenexamens A2, B1 en KNM
```

### Promotional text (max 170)

```
Oefen voor je inburgeringsexamen op je telefoon. Oefenexamens voor lezen, luisteren, schrijven, spreken en KNM. Gemaakt en nagekeken door een NT2-docent.
```

### Keywords (max 100, comma-separated, no spaces)

```
inburgeringsexamen,nederlands,leren,lezen,luisteren,schrijven,spreken,ONA,NT2,examen,taal,woorden
```

### Description (max 4000)

```
Oefen voor je inburgeringsexamen. Waar je bent en wanneer je tijd hebt.

Inburgering Oefenen heeft oefenexamens voor alle onderdelen van het examen: Lezen, Luisteren, Schrijven, Spreken en KNM. Je oefent in dezelfde vorm als het echte examen, met dezelfde tijd.

WAT JE KRIJGT

• Taal A2: 40 oefenexamens. Tien voor Lezen, tien voor Luisteren, tien voor Schrijven en tien voor Spreken.
• Taal B1: oefenexamens voor Lezen, Schrijven en Spreken.
• KNM: 10 oefenexamens, 7 lesmodules en 366 woordkaarten.
• ONA: maak je portfolio en oefen het eindgesprek.
• Lessen en woorden: korte lessen van 8 tot 12 minuten. Eerst uitleg, daarna oefen je meteen.

ZO WERKT HET

• Je ziet na elk examen wat goed ging en wat nog niet.
• Bij Spreken neem je je antwoord op met de microfoon.
• Bij Schrijven en Spreken krijg je feedback op je antwoord.
• De app onthoudt waar je was. Je gaat verder op je telefoon of op de website.

GEMAAKT EN NAGEKEKEN DOOR EEN DOCENT

De oefenexamens en lessen zijn gemaakt en nagekeken door een NT2-gecertificeerde docent. AI helpt bij het maken. De docent beslist wat online komt.

De feedback bij Schrijven en Spreken komt van een computermodel. Dat model gebruikt de regels van de docent. Je score is feedback om te oefenen. Het is geen officiële uitslag.

GRATIS BEGINNEN

Met een account maak je gratis het eerste oefenexamen van elk onderdeel. Je logt in met Apple of Google.

Heb je al een pakket? Log in met hetzelfde account. Dan staat alles voor je klaar.

GOED OM TE WETEN

Inburgering Oefenen is van Samen Sterk in Taal. De app is niet van DUO en niet van de overheid. Het officiële examen doe je bij DUO.
```

### What's New (version 1.0.0)

```
De eerste versie van Inburgering Oefenen voor iPhone.
```

---

## English (optional localisation)

### Name (max 30)

```
Inburgering Oefenen
```

### Subtitle (max 30)

```
Dutch civic exam practice
```

### Promotional text (max 170)

```
Practise for the Dutch civic integration exam on your phone. Practice exams for reading, listening, writing, speaking and KNM, checked by a certified NT2 teacher.
```

### Keywords (max 100)

```
inburgering,dutch,exam,civic,integration,A2,B1,KNM,ONA,NT2,learn,reading,listening,speaking
```

### Description (max 4000)

```
Practise for your Dutch civic integration exam (inburgeringsexamen), wherever you are.

Inburgering Oefenen has practice exams for every part of the exam: Reading, Listening, Writing, Speaking and KNM. You practise in the same format as the real exam, with the same time limit. The exam questions are in Dutch, as they are in the real exam. The app itself is available in Dutch, English and Arabic.

WHAT YOU GET

• Language A2: 40 practice exams. Ten each for Reading, Listening, Writing and Speaking.
• Language B1: practice exams for Reading, Writing and Speaking.
• KNM (Knowledge of Dutch Society): 10 practice exams, 7 lesson modules and 366 word cards.
• ONA: build your portfolio and practise the final interview.
• Lessons and words: short lessons of 8 to 12 minutes. First an explanation, then you practise straight away.

HOW IT WORKS

• After each exam you see what went well and what did not.
• For Speaking you record your answer with the microphone.
• For Writing and Speaking you get feedback on your answer.
• The app remembers where you were. Continue on your phone or on the website.

MADE AND CHECKED BY A TEACHER

The practice exams and lessons are made and checked by a certified NT2 teacher (Dutch as a second language). AI helps to draft them. The teacher decides what goes online.

Feedback on Writing and Speaking comes from a computer model that applies the teacher's rules. Your score is practice feedback. It is not an official result.

START FOR FREE

With an account you can take the first practice exam of every part for free. Sign in with Apple or Google.

Already have a package? Sign in with the same account and everything is ready for you.

GOOD TO KNOW

Inburgering Oefenen is run by Samen Sterk in Taal. The app is not from DUO and not from the Dutch government. You take the official exam at DUO.
```

### What's New (version 1.0.0)

```
The first version of Inburgering Oefenen for iPhone.
```

---

## App information

| Field | Value |
|---|---|
| Primary category | Education |
| Secondary category | Reference |
| Age rating | 4+ (answer "None" to every content question) |
| Copyright | `2026 Samen Sterk in Taal` |
| Support URL | `https://inburgeringoefenen.nl/nl/contact` |
| Marketing URL | `https://inburgeringoefenen.nl` |
| Privacy Policy URL | `https://inburgeringoefenen.nl/nl/privacybeleid` |
| Price | Free |
| Availability | Netherlands at minimum; all countries is fine |

## Screenshots

Upload the seven files in `mobile/store/screenshots-1206x2622/` to the slot **iPhone mit Dynamic
Island (mittleres Display)**, in file order. That slot only takes 1206 × 2622 (or 1179 × 2556);
the 1320 × 2868 originals in `screenshots/` are refused there with "Dateiabmessungen sind
ungültig". Regenerate the originals with `node mobile/store/build-screenshots.mjs`.

| File | Caption on the image |
|---|---|
| `01-overzicht.png` | Oefen voor je inburgering. A2, B1 en KNM op één plek. |
| `02-speler.png` | Oefenexamens zoals het examen. Dezelfde opbouw, met een klok. |
| `03-woorden.png` | Leer de woorden die je nodig hebt. Met beeld en geluid. |
| `04-leren.png` | Lessen van 8 tot 12 minuten. Eerst uitleg, dan meteen oefenen. |
| `05-spreken.png` | Oefen spreken met je microfoon. Je krijgt feedback op je antwoord. |
| `06-knm.png` | Ook voor KNM. Oefenexamens, lessen en woordkaarten. |
| `07-intro.png` | Nagekeken door een NT2-docent. AI helpt, zij beslist. |

## Header and search results (iOS 27 product page)

In App Store Connect this is the block with the tabs **Kopfzeile** and **Suchergebnisse**, above
the promotional text. Both files are in `mobile/store/header/`; regenerate with
`node mobile/store/build-header.mjs`.

| Tab | File | Size |
|---|---|---|
| Kopfzeile (header) | `kopfzeile-3840x1646.png` | 3840 × 1646, 21:9 |
| Suchergebnisse (search results) | `suchergebnisse-3840x2560.png` | 3840 × 2560, 3:2 |

Apple's safe-area template was not used, so check both with the **Vorschau** button after
uploading. The search-results image is optional: without it Apple shows the screenshots.

## App Review information

Sign-in required: **yes**. There is no username and password, so leave those fields empty and
put this in **Notes**:

```
Sign-in: the app has no username/password login. Please use "Continue with Apple" on the first screen with any Apple ID. A new account is created automatically and gives free access to the first practice exam of every exam part (for example: Overzicht > Lezen A2 > Oefenexamen 1).

Purchases: the app does not sell anything and contains no links to purchase. Customers who bought a package on our website sign in with the same account to use it. Free accounts can use the first practice exam of each part.

Microphone: used only in Speaking exercises, to record the candidate's spoken answer.

The app is not affiliated with DUO or the Dutch government. It offers practice material for the Dutch civic integration exam, written and reviewed by a certified teacher of Dutch as a second language.
```

Contact: your own name, phone number and e-mail address.

## App Privacy (draft: check against what the site really collects)

Data linked to the user, not used for tracking:

| Data type | Why |
|---|---|
| Contact info: e-mail address, name | account (from Apple or Google sign-in) |
| User content: audio data | recorded Speaking answers, sent for feedback |
| User content: other user content | written answers and exam answers |
| Identifiers: user ID | account |
| Usage data: product interaction | analytics (GA4, PostHog) |

Tracking (Apple's meaning: sharing data with other companies for advertising): **No**.

## Still needed before "Submit for Review"

- In-app account deletion (guideline 5.1.1(v)). The profile page has no delete button yet.
- The dashboard shows a price for modules that are not in the candidate's package. Apple can
  object to prices for things that cannot be bought in the app.
