-- B1 Luisteren krijgt een vorm: 39 vragen over zes gesprekken.
--
-- Tot nu toe was `exam_formats(b1, luisteren)` helemaal NULL, en dat was geen gat maar een
-- uitspraak: NULL betekent "niet geverifieerd", de validator slaat de regel dan over, en
-- `robots` en de sitemap hangen aan diezelfde NULL. Er was geen referentiemateriaal, dus elk
-- getal zou een gok zijn geweest.
--
-- Dat materiaal is er nu wel. Geteld op de openbare examens Luisteren I van 2023, 2024 en 2025:
-- 38, 38 en 39 vragen, verdeeld over vijf tot zeven teksten, 90 minuten, steeds drie opties.
-- Eén of twee van die teksten zijn bij DUO **video**; `stimuli.kind` kent geen 'video' en dat
-- blijft zo, dus onze zesde tekst is audio. 39 over zes gesprekken is het besluit van de
-- eigenaar.
--
-- `stimulus_count` is 39 en niet 6. Eén fragment draagt precies één vraag, en dat fragment is
-- de stimulus; een "gesprek" is een groep van vijf tot negen van die fragmenten en bestaat
-- alleen in de authoring. Daarom staat questions_per_stimulus op 1–1.
--
-- Let op: dit opent de publieke pagina NIET. Die hangt aan `itemCount` in `data/skills.ts`,
-- en dat blijft NULL tot de docent examen 1 heeft nagekeken.
update exam_formats set
  item_count                 = 39,
  duration_seconds           = 5400,
  stimulus_count             = 39,
  questions_per_stimulus_min = 1,
  questions_per_stimulus_max = 1,
  options_min                = 3,
  options_max                = 3,
  audio_seconds_min          = 35,
  audio_seconds_max          = 95
where level = 'b1' and skill = 'luisteren';

-- De tekstsoort-as van B1 Luisteren is een andere dan die van A2.
--
-- Bij A2 is de tekstsoort de *vorm* van wat je hoort: een gesprek, een omroepbericht, een
-- telefoongesprek. Bij B1 is elke tekst een gesprek van twee mensen, dus die as zou zes keer
-- hetzelfde zeggen. Wat er bij B1 verschilt is de *bedoeling* van de spreker, en dat is ook
-- wat de vragen toetsen.
--
-- De vier A2-slugs staan ook op (b1, luisteren) — meegekomen uit de fork. Ze worden niet
-- verwijderd: er hangt niets aan, en een DELETE op een rij waar ooit een stimulus naar kan
-- wijzen is een risico zonder opbrengst.
insert into sections (topic, slug, name_nl, rationale, sort_order, level) values
  ('luisteren', 'informatief', 'Informatief',
   'Iemand vertelt hoe iets werkt of hoe zijn werk eruitziet. De vragen gaan over wat er gezegd is.',
   100, 'b1'),
  ('luisteren', 'beschouwend', 'Beschouwend',
   'Iemand kijkt terug en weegt af. De vragen gaan over wat iemand ergens van vindt en waarom.',
   110, 'b1'),
  ('luisteren', 'persuasief', 'Persuasief',
   'Iemand probeert de ander te overtuigen. De vragen gaan over het argument en het doel.',
   120, 'b1'),
  ('luisteren', 'instructief', 'Instructief',
   'Iemand legt stap voor stap uit hoe je iets aanpakt. De vragen gaan over volgorde en voorwaarden.',
   130, 'b1')
on conflict (level, slug) do nothing;
