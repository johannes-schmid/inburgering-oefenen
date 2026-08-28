/**
 * De cursusopbouw per (niveau, onderdeel). Met de hand vastgelegd, in git.
 *
 * ── DE VIJF BLOKKEN ──────────────────────────────────────────────────────────
 * Elke cursus heeft dezelfde vijf blokken, en dat is de structuur uit de mockup én uit de
 * concurrent die de eigenaar aanleverde (A Vocabulaire · B Grammatica · C Lesson videos ·
 * D Exam practice · E Test yourself):
 *
 *   A Woorden          de woordenschat, receptief en productief gescheiden
 *   B Grammatica       één les per concept uit `concepts-a2.mjs`, niveaubreed gedeeld
 *   C Examenuitleg     hoe dít onderdeel werkt — per tekstsoort of soort opgave
 *   D Examentraining   gemengd oefenen in examenvorm, korter dan een heel examen
 *   E Toets jezelf     de can-do-lijst en een diagnose die concepten benoemt
 *
 * ── WAT WAAR VANDAAN KOMT ────────────────────────────────────────────────────
 * Blok B is **niet per onderdeel verzonnen**: het leest `conceptsFor(onderdeel)` uit
 * `concepts-a2.mjs`, zodat het perfectum één keer in de database staat en in de cursus van elk
 * onderdeel dat hem nodig heeft opduikt. De opgaven zijn per onderdeel wél anders — dat is de
 * hele reden dat opgaven op de les hangen en niet op het concept.
 *
 * Blok C is de enige die zich per onderdeel echt anders vult, en hij kan dat **uit de database
 * halen**: A2 Lezen heeft zijn tekstsoorten in `sections`, Schrijven zijn categorieën in
 * `exam_task_rules`. Dat is geen syllabus die verzonnen hoeft te worden. `blokC` hieronder
 * noemt daarom alleen de sectie-slugs; de titels komen uit `sections.name_nl`.
 *
 * ── DE WOORDTHEMA'S ──────────────────────────────────────────────────────────
 * De zes thema's van blok A zijn de levensdomeinen die het A2-examen daadwerkelijk aansnijdt,
 * afgeleid uit de tekstsoorten en onderwerpen van onze eigen veertig oefenexamens — niet uit
 * de thema-indeling van een methode, want die is van hen. Ze zijn met opzet breder dan de
 * tekstsoorten: een advertentie kan over een fiets of over een huis gaan, en het woord hoort
 * bij het onderwerp, niet bij de vorm.
 */

import { conceptsFor } from './concepts-a2.mjs';

/** De thema's van blok A. `words` is het streefaantal per thema. */
export const WORD_THEMES = [
  { slug: 'wonen',       name: 'Wonen en de buurt',        words: 24 },
  { slug: 'gezondheid',  name: 'Gezondheid en de dokter',  words: 24 },
  { slug: 'werk',        name: 'Werk en solliciteren',     words: 24 },
  { slug: 'gemeente',    name: 'Gemeente, post en geld',   words: 24 },
  { slug: 'winkelen',    name: 'Winkelen en bestellen',    words: 20 },
  { slug: 'school',      name: 'School en kinderen',       words: 20 },
];

/**
 * De tekstsoorten van blok C per onderdeel, op `sections.slug`.
 *
 * Alleen de slugs: de titel komt uit de database, zodat een docent die "Kort artikel" in
 * "Artikel" verandert niet twee plekken hoeft bij te werken. Een slug die niet in `sections`
 * bestaat is een harde fout in de seeder — stil overslaan zou een blok C opleveren met een gat
 * dat niemand ziet.
 */
export const BLOCK_C_SECTIONS = {
  lezen: ['advertentie', 'brief', 'formulier-lezen', 'folder', 'regels', 'artikel'],
  luisteren: ['gesprek', 'mededeling', 'telefoongesprek', 'instructie'],
};

/**
 * De strategie-concepten: examenvakmanschap, per onderdeel exclusief.
 *
 * Dit is het antwoord op "hoe bereid je iemand voor die alleen Lezen doet". Ze staan hier en
 * niet in `concepts-a2.mjs` omdat ze per onderdeel bestaan en niet gedeeld worden — hun
 * `concept_onderdelen` heeft precies één rij, waar een grammaticaconcept er vier heeft.
 */
export const STRATEGY_CONCEPTS = {
  lezen: [
    {
      slug: 'lezen-zoekend-lezen', name_nl: 'Zoekend lezen',
      one_liner: 'Je hoeft niet elk woord te lezen. Zoek alleen wat de vraag vraagt.',
      example_html: 'Vraag: hoe lang is de lift kapot? → zoek de <mark>dagen</mark>, niet de rest.',
    },
    {
      slug: 'lezen-afzender-datum-actie', name_nl: 'Afzender, datum, actie',
      one_liner: 'Bij een brief vraagt het examen bijna altijd naar deze drie. Zoek ze in vaste volgorde.',
      example_html: 'Van: <mark>de gemeente</mark> · Datum: <mark>3 maart</mark> · U moet: <mark>bellen</mark>',
    },
    {
      slug: 'lezen-vraag-eerst', name_nl: 'Lees eerst de vraag',
      one_liner: 'Weet wat je zoekt voordat je begint. Dan lees je de tekst één keer.',
      example_html: 'Eerst de vraag, dan de tekst — <mark>niet</mark> andersom.',
    },
    {
      slug: 'lezen-signaalwoorden', name_nl: 'Signaalwoorden',
      one_liner: 'maar, behalve, alleen — kleine woorden die het antwoord omdraaien.',
      example_html: 'Open op zaterdag, <mark>behalve</mark> in de vakantie.',
    },
    {
      slug: 'lezen-woord-raden', name_nl: 'Een woord raden uit de zin',
      one_liner: 'Ken je het woord niet? De rest van de zin verklapt vaak wat het betekent.',
      example_html: 'Het is <mark>ondermaats</mark>: niet goed genoeg.',
    },
  ],
};

/**
 * De vijf blokken van één cursus, als data.
 *
 * `lessons` is een lijst beschrijvingen die de generator één voor één afwerkt. Elke les is
 * één modelcall — de unit is klein genoeg om te kunnen falen en opnieuw te doen, en groot
 * genoeg om samenhangend te zijn. Splitsen op iets groters convergeert niet: elke opgavesoort
 * heeft zijn eigen vormregel en een retry die de ene repareert breekt de andere.
 */
export function coursePlan(level, onderdeel) {
  if (level !== 'a2') {
    throw new Error(`Alleen A2 is uitgewerkt; ${level} vraagt zijn eigen conceptenbibliotheek — ` +
      'B1 is niet A2 met zwaardere voorbeelden.');
  }

  const grammar = conceptsFor(onderdeel);
  const sections = BLOCK_C_SECTIONS[onderdeel] ?? [];
  const strategy = STRATEGY_CONCEPTS[onderdeel] ?? [];

  return [
    {
      letter: 'A', name_nl: 'Woorden', sort_order: 10,
      intro: 'De woorden die je in dit onderdeel het vaakst tegenkomt. Eerst herkennen, dan zelf gebruiken.',
      lessons: WORD_THEMES.map((t, i) => ({
        kind: 'woorden',
        slug: `a${i + 1}-${t.slug}`,
        title: t.name,
        theme: t.slug,
        targetWords: t.words,
        minutes: 8,
        // Het eerste woordthema is gratis. Blok A is de goedkoopste content en de beste
        // etalage: iemand die één les heeft gedaan weet wat hij koopt.
        is_free: i === 0,
        sort_order: (i + 1) * 10,
      })),
    },
    {
      letter: 'B', name_nl: 'Grammatica', sort_order: 20,
      intro: 'De grammatica die je nodig hebt voor het examen. Elke les legt één ding uit en laat je het meteen oefenen.',
      lessons: grammar.map((c, i) => ({
        kind: 'grammatica',
        slug: `b${i + 1}-${c.slug}`,
        title: c.name_nl,
        concept: c.slug,
        minutes: 10,
        is_free: i === 0,
        sort_order: (i + 1) * 10,
      })),
    },
    {
      letter: 'C', name_nl: 'Examenuitleg', sort_order: 30,
      intro: 'Wat voor teksten je krijgt, wat er gevraagd wordt, en hoe je het aanpakt.',
      lessons: [
        ...strategy.map((s, i) => ({
          kind: 'strategie',
          slug: `c${i + 1}-${s.slug.replace(`${onderdeel}-`, '')}`,
          title: s.name_nl,
          strategyConcept: s.slug,
          minutes: 9,
          is_free: i === 0,
          sort_order: (i + 1) * 10,
        })),
        ...sections.map((s, i) => ({
          kind: 'tekstsoort',
          slug: `c${strategy.length + i + 1}-${s}`,
          // De titel komt uit `sections.name_nl`; de seeder vult hem in. Hier staat een
          // vangnet voor het geval de sectie ontbreekt — dan faalt de seeder luid.
          title: null,
          section: s,
          minutes: 9,
          is_free: false,
          sort_order: (strategy.length + i + 1) * 10,
        })),
      ],
    },
    {
      letter: 'D', name_nl: 'Examentraining', sort_order: 40,
      intro: 'Oefenen in examenvorm, maar korter. Alles door elkaar, zoals op de dag zelf.',
      lessons: sections.map((s, i) => ({
        kind: 'training',
        slug: `d${i + 1}-${s}`,
        title: null,
        section: s,
        minutes: 12,
        is_free: false,
        sort_order: (i + 1) * 10,
      })),
    },
    {
      letter: 'E', name_nl: 'Toets jezelf', sort_order: 50,
      intro: 'Waar sta je? Deze toets zegt niet welk cijfer je haalt, maar welke concepten je nog moet oefenen.',
      lessons: [
        {
          kind: 'toets', slug: 'e1-woorden-en-grammatica',
          title: 'Woorden en grammatica', minutes: 15, is_free: false, sort_order: 10,
        },
        {
          kind: 'toets', slug: 'e2-teksten-en-vragen',
          title: 'Teksten en vragen', minutes: 15, is_free: false, sort_order: 20,
        },
      ],
    },
  ];
}

/** Alles wat deze milestone kent. B1 en de andere onderdelen komen in M-L2 t/m M-L4. */
export const BUILT = ['a2:lezen'];

export function parseTarget(arg) {
  const [level, onderdeel] = String(arg).split(':');
  if (!level || !onderdeel) {
    throw new Error(`Doel moet "niveau:onderdeel" zijn, bijvoorbeeld a2:lezen — kreeg "${arg}"`);
  }
  return { level, onderdeel };
}
