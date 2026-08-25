/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: 6,
  slug: "thema-6-instanties",
  title: "Instanties",
  description: "In dit thema leer je welke instanties en organisaties belangrijk zijn in Nederland: de gemeente, de hulpdiensten, de Belastingdienst, hulpverlening en de SVB.",
  quizCategory: "Instanties",
  sections: [
    {
      id: "gemeente",
      icon: "account_balance",
      title: "De gemeente",
      subtitle: "Inschrijven, DigiD, paspoort, rijbewijs en gemeentelijke diensten",
      contentHtml: `<section id="gemeente" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">account_balance</span>
                </span>
                De gemeente
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                De gemeente is de overheid die dicht bij jou staat. Ze regelen veel dingen voor de mensen die er wonen.
              </p>

              <!-- BRP -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">database</span>
                </span>
                Gegevens doorgeven (BRP)
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                Elke gemeente heeft een <strong>Basisregistratie Personen (BRP)</strong>. Daarin staan je persoonlijke gegevens. Je moet de gemeente informeren als er iets verandert in je situatie:
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">favorite</span>
                  <p class="text-xs font-semibold text-on-surface">Trouwen of samenwonen</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">heart_broken</span>
                  <p class="text-xs font-semibold text-on-surface">Scheiden (echtscheiding)</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">local_shipping</span>
                  <p class="text-xs font-semibold text-on-surface">Verhuizen</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">child_care</span>
                  <p class="text-xs font-semibold text-on-surface">Kind krijgen of erkennen</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">sentiment_very_dissatisfied</span>
                  <p class="text-xs font-semibold text-on-surface">Iemand overlijdt</p>
                </div>
              </div>

              <!-- Officiële documenten -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">badge</span>
                </span>
                Officiële documenten
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[28px] mb-2" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">travel_explore</span>
                  <p class="text-sm font-bold text-on-surface">Paspoort</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[28px] mb-2" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">credit_card</span>
                  <p class="text-sm font-bold text-on-surface">ID-kaart</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 text-center">
                  <span class="material-symbols-outlined text-primary text-[28px] mb-2" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">directions_car</span>
                  <p class="text-sm font-bold text-on-surface">Rijbewijs</p>
                </div>
              </div>
              <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                <p class="text-sm text-blue-900 leading-relaxed">Dit zijn alle drie een <strong>identiteitsbewijs</strong>. In Nederland moet iedereen van <strong>14 jaar en ouder</strong> zijn identiteitsbewijs kunnen laten zien als de politie dat vraagt. In het openbaar vervoer geldt dit al vanaf 12 jaar.</p>
              </div>

              <!-- BSN -->
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 mb-6">
                <div class="flex items-start gap-3">
                  <span class="material-symbols-outlined text-primary text-[22px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">tag</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface mb-1">Burgerservicenummer (BSN)</p>
                    <p class="text-sm text-on-surface-variant leading-relaxed">Op je paspoort, ID-kaart en rijbewijs staat je <strong>BSN</strong>. Dit persoonlijke nummer heb je nodig voor contact met de overheid, ziekenhuizen en zorgverzekeraars. Geef het alleen aan organisaties die het wettelijk mogen gebruiken.</p>
                  </div>
                </div>
              </div>

              <!-- Verblijfsvergunning & naturalisatie -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">assignment_ind</span>
                </span>
                Verblijfsvergunning en naturalisatie
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <p class="text-sm font-bold text-on-surface mb-2">Verblijfsvergunning</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Kom je van buiten de EU en wil je langer dan <strong>90 dagen</strong> in Nederland blijven? Dan heb je een verblijfsvergunning nodig. Je vraagt die aan bij de <strong>IND</strong> (Immigratie- en Naturalisatiedienst).</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <p class="text-sm font-bold text-on-surface mb-2">Naturalisatie</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Wil je Nederlander worden? Dat heet <strong>naturalisatie</strong>. Voorwaarden: minimaal 5 jaar wonen met verblijfsvergunning, goed Nederlands kunnen en de naturalisatieceremonie bijwonen.</p>
                </div>
              </div>

              <!-- stat callout -->
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-600 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">info</span>
                <p class="text-sm text-amber-900 leading-relaxed"><strong>In 2023 zijn 36.413 mensen genaturaliseerd tot Nederlander</strong> (Centraal Bureau voor de Statistiek). Je moet meestal afstand doen van je eerste nationaliteit. Mag dat wettelijk niet? Dan mag je twee nationaliteiten houden.</p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema6-gemeente -->`,
    },
    {
      id: "hulpdiensten",
      icon: "emergency",
      title: "De hulpdiensten",
      subtitle: "112, brandweer, politie en ambulance",
      contentHtml: `<section id="hulpdiensten" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">local_police</span>
                </span>
                De hulpdiensten
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                De politie moet Nederland veilig houden. Dat doet de politie op drie manieren:
              </p>

              <!-- 3 tasks -->
              <div class="space-y-3 mb-6">
                <div class="flex gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                  <span class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">shield</span>
                  </span>
                  <div>
                    <p class="text-sm font-bold text-on-surface mb-1">Beschermen</p>
                    <p class="text-sm text-on-surface-variant leading-relaxed">De politie helpt bij ongelukken, overlast en misdrijven zoals geweld, <strong>oplichting</strong> en <strong>diefstal</strong>. Ben je slachtoffer van discriminatie? Ook dan helpt de politie.</p>
                  </div>
                </div>
                <div class="flex gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                  <span class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">visibility</span>
                  </span>
                  <div>
                    <p class="text-sm font-bold text-on-surface mb-1">Toezicht houden</p>
                    <p class="text-sm text-on-surface-variant leading-relaxed"><strong>Agenten</strong> zorgen dat er geen misdrijven gebeuren. Op straat, bij evenementen en in de buurt. Veel buurten hebben een eigen <strong>wijkagent</strong> die de mensen kent.</p>
                  </div>
                </div>
                <div class="flex gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                  <span class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">gavel</span>
                  </span>
                  <div>
                    <p class="text-sm font-bold text-on-surface mb-1">Handhaven</p>
                    <p class="text-sm text-on-surface-variant leading-relaxed">De politie mag mensen controleren en <strong>boetes</strong> geven als ze de regels niet volgen. Zegt de politie dat je iets moet doen? Dan moet je dat altijd doen.</p>
                  </div>
                </div>
              </div>

              <!-- Contact numbers -->
              <h3 class="text-base font-bold text-on-surface mb-3">Nummers om te onthouden</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div class="rounded-2xl p-4 border-2 border-red-300 bg-red-50">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl font-black text-red-600" style="font-family:'Manrope',sans-serif;">112</span>
                    <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Spoedgeval</span>
                  </div>
                  <p class="text-sm text-red-800 leading-relaxed">Ongeluk, brand of ambulance nodig? Bel altijd <strong>112</strong>. Dag en nacht, ook voor de brandweer.</p>
                </div>
                <div class="rounded-2xl p-4 border border-outline-variant/40 bg-surface-container-low">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-base font-black text-on-surface" style="font-family:'Manrope',sans-serif;">0900-8844</span>
                    <span class="bg-surface-container text-on-surface-variant text-xs font-bold px-2 py-0.5 rounded-full">Geen spoed</span>
                  </div>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Heb je de politie nodig maar is het geen spoedgeval? Bel dan <strong>0900-8844</strong>.</p>
                </div>
              </div>

              <!-- Aangifte doen -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">report</span>
                Aangifte doen
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">Ben je slachtoffer van een misdrijf? Dan kun je <strong>aangifte doen</strong> bij de politie. Dit kan op drie manieren:</p>
              <div class="space-y-2 mb-5">
                <div class="flex gap-3 items-start">
                  <span class="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div class="bg-surface-container-low rounded-xl p-3 flex-1">
                    <p class="text-sm text-on-surface">Bel <strong>0900-8844</strong></p>
                  </div>
                </div>
                <div class="flex gap-3 items-start">
                  <span class="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div class="bg-surface-container-low rounded-xl p-3 flex-1">
                    <p class="text-sm text-on-surface">Ga naar het <strong>politiebureau</strong> — maak eerst een afspraak via 0900-8844</p>
                  </div>
                </div>
                <div class="flex gap-3 items-start">
                  <span class="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div class="bg-surface-container-low rounded-xl p-3 flex-1">
                    <p class="text-sm text-on-surface"><strong>Digitaal aangifte doen</strong> — alleen voor kleine misdrijven, via de website van de politie</p>
                  </div>
                </div>
              </div>
              <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-red-600 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">warning</span>
                <p class="text-sm text-red-900 leading-relaxed"><strong>Let op:</strong> Bij grote of ernstige misdrijven <em>moet</em> je aangifte doen. Dit geldt ook als je geen slachtoffer bent maar wel belangrijke informatie hebt.</p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema6-hulpdiensten -->`,
    },
    {
      id: "belastingdienst",
      icon: "receipt",
      title: "De Belastingdienst",
      subtitle: "Aangifte doen, toeslagen en DigiD",
      contentHtml: `<section id="belastingdienst" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
                </span>
                De Belastingdienst
              </h2>

              <!-- Belasting uitleg -->
              <h3 class="text-base font-bold text-on-surface mb-3">Wat is belasting?</h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                Iedereen in Nederland betaalt belasting aan de <strong>Belastingdienst</strong>. Hoeveel je betaalt, hangt af van je salaris — wie meer verdient, betaalt meer belasting.
              </p>
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 mb-6">
                <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">De overheid gebruikt het geld voor:</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div class="flex items-center gap-2 text-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">school</span> Scholen
                  </div>
                  <div class="flex items-center gap-2 text-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">route</span> Wegen
                  </div>
                  <div class="flex items-center gap-2 text-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">local_police</span> Politie
                  </div>
                  <div class="flex items-center gap-2 text-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">local_hospital</span> Zorg
                  </div>
                  <div class="flex items-center gap-2 text-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">payments</span> Uitkeringen
                  </div>
                  <div class="flex items-center gap-2 text-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">savings</span> Toeslagen
                  </div>
                </div>
              </div>

              <!-- Belastingaangifte -->
              <h3 class="text-base font-bold text-on-surface mb-3">Belastingaangifte</h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                Elk jaar doe je <strong>belastingaangifte</strong>: je vertelt de Belastingdienst hoeveel je hebt verdiend. Dit kan via de website of de app van de Belastingdienst. Je werkgever betaalt elke maand al belasting via je salaris.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 items-start">
                  <span class="material-symbols-outlined text-green-600 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">trending_up</span>
                  <div>
                    <p class="text-sm font-bold text-green-900 mb-1">Te veel betaald?</p>
                    <p class="text-xs text-green-800 leading-relaxed">Dan krijg je geld <strong>terug</strong> van de Belastingdienst. Dit kan als je dat jaar minder werkte dan het jaar ervoor, of als je een huis hebt gekocht.</p>
                  </div>
                </div>
                <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
                  <span class="material-symbols-outlined text-red-500 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">trending_down</span>
                  <div>
                    <p class="text-sm font-bold text-red-900 mb-1">Te weinig betaald?</p>
                    <p class="text-xs text-red-800 leading-relaxed">Dan moet je nog <strong>meer betalen</strong>. Dit kan als je dat jaar meer verdiende dan het jaar ervoor.</p>
                  </div>
                </div>
              </div>

              <!-- Dienst Toeslagen -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">savings</span>
                Dienst Toeslagen
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
                <strong class="text-on-surface">Dienst Toeslagen</strong> is een afdeling van de Belastingdienst. Je vraagt hier toeslagen aan via <strong class="text-on-surface">belastingdienst.nl/toeslagen</strong>.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3 text-center">
                  <p class="text-sm font-bold text-on-surface mb-1">Huurtoeslag</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Hulp bij hoge huurkosten — <strong>niet</strong> via de gemeente of woningcorporatie</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3 text-center">
                  <p class="text-sm font-bold text-on-surface mb-1">Zorgtoeslag</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Bijdrage aan de zorgverzekeringspremie</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3 text-center">
                  <p class="text-sm font-bold text-on-surface mb-1">Kinderopvangtoeslag</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Bijdrage aan kinderopvangkosten — inkomensgerelateerd, via belastingdienst.nl</p>
                </div>
              </div>

              <!-- DigiD -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">smartphone</span>
                Mijn DigiD
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                Contact met de overheid gaat digitaal. Je hebt een <strong>DigiD</strong> nodig om in te loggen bij de Belastingdienst, het UWV, DUO en andere organisaties. Met DigiD kun je ook toeslagen aanvragen, afspraken maken en dingen regelen bij de gemeente.
              </p>
              <div class="bg-primary/5 border border-primary/15 rounded-2xl p-4 mb-2">
                <p class="text-xs font-bold text-primary uppercase tracking-wide mb-3">Gebruik je DigiD veilig:</p>
                <div class="space-y-2">
                  <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">check_circle</span>
                    <p class="text-sm text-on-surface">Gebruik de <strong>DigiD-app</strong> of een sms-code</p>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">check_circle</span>
                    <p class="text-sm text-on-surface">Kies een goed <strong>wachtwoord</strong></p>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-red-500 text-[16px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">cancel</span>
                    <p class="text-sm text-on-surface">Geef <strong>nooit</strong> je inloggegevens aan iemand anders</p>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-red-500 text-[16px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">cancel</span>
                    <p class="text-sm text-on-surface">Controleer altijd of een website of e-mail <strong>echt</strong> is</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema6-belastingdienst -->`,
    },
    {
      id: "hulp-bij-problemen",
      icon: "support_agent",
      title: "Hulp bij problemen",
      subtitle: "Maatschappelijk werk, schuldhulp en buurtteam",
      contentHtml: `<section id="hulp-bij-problemen" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">support_agent</span>
                </span>
                Hulp bij problemen
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                In Nederland zijn er veel instanties die je kunnen helpen als je problemen hebt — met buren, geld of de overheid.
              </p>

              <!-- Maatschappelijk werk -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">groups</span>
                </span>
                Problemen in de buurt
              </h3>
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 mb-4">
                <p class="text-sm font-bold text-on-surface mb-2">Maatschappelijk werk</p>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-3">Het <strong>maatschappelijk werk</strong> helpt bij: eenzaamheid, problemen met buren, geweld thuis, problemen in het gezin. Je kunt hulp aanvragen bij de gemeente, via het <strong>wijkteam</strong> of buurtteam.</p>
              </div>

              <!-- Geldproblemen -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">euro</span>
                </span>
                Geldproblemen
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <p class="text-sm font-bold text-on-surface mb-2">Schulden? → Nibud + schuldhulpverlening</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Heb je <strong>schulden</strong>? Het wijkteam kan je helpen of je doorverwijzen naar <strong>schuldhulpverlening</strong>. Kijk ook op de website van het <strong>Nibud</strong> voor tips over geld lenen, sparen en betalen.</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <p class="text-sm font-bold text-on-surface mb-2">Geen geld voor boodschappen? → Voedselbank</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Heb je niet genoeg geld voor eten? Dan kun je naar de <strong>voedselbank</strong>. Je kunt elke week eten krijgen. De voedselbank kijkt samen met jou of je er recht op hebt.</p>
                </div>
              </div>

              <!-- Klacht over overheid -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">feedback</span>
                </span>
                Klacht over de overheid
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                De overheid moet alle inwoners goed behandelen en mag niet discrimineren. Heb je toch een probleem met de gemeente, politie, Belastingdienst of het UWV?
              </p>
              <div class="space-y-2 mb-6">
                <div class="flex gap-3 items-start">
                  <span class="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div class="bg-surface-container-low rounded-xl p-3 flex-1">
                    <p class="text-sm font-bold text-on-surface">Bezwaar maken</p>
                    <p class="text-xs text-on-surface-variant mt-0.5">Maak eerst <strong>bezwaar</strong> bij de instantie zelf (gemeente, politie, etc.)</p>
                  </div>
                </div>
                <div class="flex gap-3 items-start">
                  <span class="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div class="bg-surface-container-low rounded-xl p-3 flex-1">
                    <p class="text-sm font-bold text-on-surface">Nationale ombudsman</p>
                    <p class="text-xs text-on-surface-variant mt-0.5">Blijft het probleem? Dien een klacht in bij de <strong>Nationale ombudsman</strong>. Die onderzoekt het probleem en neemt contact op met de overheid.</p>
                  </div>
                </div>
              </div>

              <!-- Juridisch Loket -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">balance</span>
                </span>
                Juridische problemen
              </h3>
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 mb-4">
                <p class="text-sm font-bold text-on-surface mb-2">Het Juridisch Loket</p>
                <p class="text-sm text-on-surface-variant leading-relaxed">Heb je problemen op het werk? Wil je scheiden maar weet je niet hoe? Het <strong>Juridisch Loket</strong> geeft <strong>gratis juridisch advies</strong>. Heb je een advocaat nodig? Het Juridisch Loket kan dat regelen.</p>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-green-600 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">info</span>
                <p class="text-sm text-green-900 leading-relaxed"><strong>Laag inkomen?</strong> Dan hoef je soms alleen een kleine <strong>eigen bijdrage</strong> te betalen voor de advocaat. Die past bij jouw inkomen.</p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema6-hulp-bij-problemen -->`,
    },
    {
      id: "svb",
      icon: "savings",
      title: "De SVB",
      subtitle: "Sociale Verzekeringsbank — AOW, kinderbijslag en kinderbijslag",
      contentHtml: `<section id="svb" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">family_restroom</span>
                </span>
                De SVB — Sociale Verzekeringsbank
              </h2>
              <p class="text-on-surface-variant leading-relaxed mb-5">
                De <strong class="text-on-surface">SVB (Sociale Verzekeringsbank)</strong> voert een aantal sociale verzekeringen uit. De SVB is niet de gemeente en niet de Belastingdienst — het is een aparte organisatie.
              </p>
              <div class="space-y-3">
                <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">child_care</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Kinderbijslag</p>
                    <p class="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Heb je kinderen jonger dan 18? Dan heb je recht op <strong class="text-on-surface">kinderbijslag</strong>. Je vraagt dit aan bij de <strong class="text-on-surface">SVB</strong> — niet bij de gemeente of de Belastingdienst. Kinderbijslag wordt elke drie maanden uitbetaald.</p>
                  </div>
                </div>
                <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">elderly</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">AOW — pensioen van de overheid</p>
                    <p class="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Als je de AOW-leeftijd bereikt, krijg je een basispensioen van de SVB. De hoogte hangt af van het aantal jaren dat je in Nederland hebt gewoond.</p>
                  </div>
                </div>
              </div>
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mt-4">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <p class="text-sm text-amber-900 leading-relaxed"><strong>Onthoud:</strong> Kinderbijslag → <strong>SVB</strong>. Kinderopvangtoeslag → <strong>Belastingdienst</strong>. Dit is een veelgemaakte fout op het KNM-examen.</p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema6-svb -->`,
    },
  ],
};
