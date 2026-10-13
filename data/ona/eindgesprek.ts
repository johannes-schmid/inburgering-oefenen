/**
 * De vragenbank voor het oefenen van het eindgesprek — inhoud van de docent, `concept` tot review.
 *
 * Bij DUO praat de kandidaat ongeveer 30 minuten met twee medewerkers over **zijn eigen**
 * kaarten, en moet hij vertellen waarom hij die antwoorden gaf. Zijn Nederlands wordt niet
 * beoordeeld (ona-toelichting.pdf, p. 2). Examinatoren vragen door in STARR-vorm (BVNT2,
 * "10 vragen over ONA").
 *
 * Het model kiest per beurt één vraag uit deze bank en vult hem met wat de kandidaat zelf
 * schreef (`lib/ona/gesprek.ts`). Het verzint geen eigen onderwerpen: een vraag die niet uit
 * deze bank komt, is een vraag die de docent niet heeft gezien.
 */
export const ONA_GESPREK_BANK: Record<number, string[]> = {
  1: [
    'Waarom heb je juist dit beroep gekozen, en niet een van de andere twee?',
    'Wat heb je gedaan om te weten te komen of je diploma hier telt?',
    'Wat ga je doen als je zonder diploma in dit beroep wilt werken?',
  ],
  2: [
    'Hoe weet je dat dit de taken zijn? Wie of wat heb je daarvoor gebruikt?',
    'Je schrijft dat iets niet bij je past. Wat ga je daaraan doen?',
    'Wat is er anders aan dit werk in Nederland dan in je eigen land?',
  ],
  3: [
    'Kun je een moment noemen waarop je deze eigenschap liet zien? Wat deed je toen?',
    'Welke eigenschap heb je nog niet? Hoe ga je die leren?',
    'Waarom is deze eigenschap belangrijk in dit beroep?',
  ],
  4: [
    'Waar vond je deze vacatures, en hoe heb je gezocht?',
    'Waarom past deze vacature wel of niet bij jou?',
    'Je zegt dat de kans op werk zo is. Hoe weet je dat?',
  ],
  5: [
    'Waarom kies je deze opleiding? Wat heb je over de school uitgezocht?',
    'Hoe ga je de opleiding betalen, en hoe leef je in die tijd?',
    'Wat moet je in het Nederlands kunnen in dit werk? Hoe oefen je dat?',
  ],
  6: [
    'Wat heb je van deze persoon geleerd over het werk?',
    'Hoe heb je deze mensen leren kennen?',
    'Wat ga je precies doen om meer mensen te leren kennen, en wanneer?',
  ],
  7: [
    'Hoe heb je je sollicitatiebrief geschreven? Wie heeft je geholpen?',
    'Wat doe je om een goede indruk te maken in een sollicitatiegesprek?',
    'Wat wil je nog beter doen in een gesprek, en hoe oefen je dat?',
  ],
  8: [
    'Kun je een voorbeeld geven van dit verschil? Wat zag je zelf?',
    'Hoe ga je ermee om als dit op je werk gebeurt?',
    'Welk verschil vind je het moeilijkst? Waarom?',
  ],
};

/** Een oefengesprek is kort: genoeg om te voelen hoe doorvragen gaat, niet een half uur. */
export const ONA_GESPREK_MAX_QUESTIONS = 6;

export const ONA_GESPREK_STATUS: 'concept' | 'reviewed' = 'concept';
