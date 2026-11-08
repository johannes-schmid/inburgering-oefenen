# Abonnementen wijzigen: co-terming

Eén abonnement per klant, één verlengdatum, en modules die er halverwege bij komen of eraf gaan.

> Besluit eigenaar, 2026-11-08, na een klantvraag ("I need to switch to the normal A2 classes").
> Tot dan kon je alleen bijkopen en alles in één keer opzeggen; wisselen kon niet.

## De regel

| Wat de kandidaat doet | Wat er gebeurt |
|---|---|
| **Erbij** halverwege de periode | Gaat meteen open. Nu betaal je alleen het resterende deel van de periode; vanaf de verlengdatum zit hij in het maandbedrag. |
| **Eraf** | Geen terugbetaling. Blijft open tot de verlengdatum en valt dan van de incasso. |
| **Wisselen** | Erbij en eraf in één bevestiging. |
| **Terugzetten** wat al opgezegd was | Kost niets; de periode is ervoor betaald. Verlengt weer. |
| **Alles opgezegd, maar er staat nog iets open** (en het mandaat is geldig) | Een module weer aanzetten **hervat** het abonnement: nu niets voor de dagen die al betaald zijn, de eerste incasso valt op de laatste einddatum (`currentPeriod()` met `resuming`). |
| **Geen lopend abonnement en niets meer open** (of geen geldig mandaat) | Gewone checkout (`/api/checkout-modules`): volle maand, nieuwe verlengdatum. |

Resterend deel = (maandbedrag na − maandbedrag ervoor) × resterende dagen ÷ dagen in de periode,
met de korting van het abonnement erop. Gerekend met `priceForSelection`, dus de bundel klopt
vanzelf: de vierde A2-module erbij kost tien cent per maand meer, niet €9,95. Onder €1 wordt er
niets geïncasseerd (`MIN_CHARGE_CENTS`) en zijn de dagen gratis — elke incasso kost een
Mollie-transactie en een regel op het bankafschrift.

**Waarom co-terming en niet "elke aankoop zijn eigen maand".** Dat laatste is eenvoudiger uit te
leggen, maar geeft meerdere incasso's per maand en past niet op de bundel. Co-terming is wat de
meeste SaaS doet (Stripe-proration; Slack, Notion): upgrade direct met een deelbedrag, downgrade
aan het eind van de periode. De eigenaar koos co-terming.

## Waar het staat

| Stuk | Bestand |
|---|---|
| De offerte (puur, getest) | `lib/billing/coterm.ts` — `tests-unit/coterm.test.ts` |
| De vijf metadata-overgangen (puur, getest) | `lib/billing/metadata.ts` — `tests-unit/billing-metadata.test.ts` |
| Het maandbedrag | `lib/billing/amount.ts` |
| Offerte + uitvoering | `lib/billing/change.ts`, route `app/api/change-modules` |
| Abonnement bijwerken, betalingen afhandelen | `lib/mollie-modules.ts` (`syncSubscription`, `handleModuleChangePayment`) |
| De kiezer | `dashboard/pakketten/ModulePicker.tsx` (`ChangePicker`) |
| Bevestigingsmail | `lib/email/templates/module-change.ts` |
| Controle op afwijkende bedragen | `scripts/billing/subscription-audit.mjs` (alleen lezen) |

## Datamodel

`user_metadata.modules` is alles wat ooit gekocht is. `user_metadata.module_until` geeft per module
de datum waarop hij dichtgaat; een module zonder datum **verlengt**. De oude gezamenlijke
`modules_until` geldt nog voor modules zonder eigen datum (accounts die vóór 08-11 opzegden) en wordt
bij elke schrijfactie omgezet naar datums per module.

- `renewingModules(meta)` — wat het abonnement incasseert. Het maandbedrag volgt hieruit.
- `endingModules(meta)` — nog open, met een einddatum.
- `modulesFromMetadata(meta)` — wat open is. `ownsModule`/`ownsKnm` lezen dit, ongewijzigd.

Verlopen modules blijven in `modules` staan, met hun datum: de MRR-grafiek in `/admin` leest daaruit
wanneer een module van de incasso viel (contraction).

## Drie manieren om een wijziging te betalen

1. **Niets te betalen** → metadata en abonnement worden meteen aangepast.
2. **Geldig mandaat** → `sequenceType: recurring`, zonder checkout. Wat erbij komt gaat **meteen**
   open (besluit eigenaar). Een SEPA-incasso staat dagen op `pending`; mislukt hij, dan sluit
   `handleModuleChangePayment()` wat hij opende en verlaagt het abonnement weer, en krijgt de
   kandidaat een mail. Een chargeback verandert de status niet en wordt niet afgehandeld.
3. **Geen geldig mandaat, of Mollie weigert de incasso** → checkout (`sequenceType: first`). Er gaat
   pas iets open bij `paid`, en die betaling levert een nieuw mandaat voor het abonnement.

## Vier dingen die stil fout gingen

- **Het abonnement nam het bedrag van de laatste betaling over.** Wie één module had en er één
  bijkocht, bleef €9,95 betalen voor twee; wie er twee bijkocht, betaalde voor twee van de drie.
  Nu rekent `syncSubscription()` altijd vanaf `renewingModules`. Wie al te weinig betaalt, staat in
  `subscription-audit.mjs`; de eerstvolgende wijziging zet het bedrag vanzelf goed.
- **Opnieuw kopen na opzeggen opende de oude modules zonder incasso.** De aankoop wiste
  `modules_until` voor alles. Nu houdt elke module haar eigen datum (`grantPurchase`).
- **Een eerste betaling werd bij elke poll opnieuw toegekend.** `/betaling-gelukt` pollt zolang het
  tabblad openstaat; elke herhaling wiste einddatums die een latere wijziging had gezet. Nu staat de
  betaling in `fulfilled_payments` en wordt hij één keer toegekend.
- **Cancel-en-opnieuw-aanmaken liet de verlengdatum verspringen.** Het abonnement wordt nu
  ge-PATCHt (Mollie staat een nieuw bedrag voor toekomstige betalingen toe); de datum blijft staan.
  Weigert Mollie het nieuwe mandaat bij die PATCH, dan blijft het oude staan en gaat alleen het
  bedrag mee.

## Uit de bug bash (08-11), opgelost

- **De knop bleef grijs na de eerste wijziging.** `ChangePicker` blijft na `router.refresh()` staan;
  `busy` moet hij zelf terugzetten.
- **Opgezegde modules waren niet terug te zetten** zodra er niets meer verlengde: de kiezer viel terug
  op de checkout. Nu beslissen de route en de pagina via dezelfde `currentPeriod()`.
- **`?gewijzigd=…` meldde een wijziging die er niet was.** De melding is nu component-state.
- **Omschrijvingen bij Mollie** toonden `a2:luisteren` en een stuk user-id; nu `moduleLabel()`. En elke
  selectie van vier heette "alle vier de onderdelen", ook drie A2 + KNM.

Regressietests: `e2e/tests/coterm-fixes.e2e.ts`.

## Testen in Mollie-testmodus

- Het testprofiel van `.env.development.local` heeft **geen SEPA-incasso** — een
  mandaat-incasso valt daar terug op de checkout. Een kaartmandaat (via een eerste kaartbetaling)
  werkt wel.
- Klanten zijn gedeeld over de profielen van één account, abonnementen niet: een abonnement dat met
  de sleutel van een ander profiel is aangemaakt, geeft bij PATCH een 404 "No subscription exists".
  Een `MOLLIE_API_KEY` in de shell wint van `node --env-file`.
