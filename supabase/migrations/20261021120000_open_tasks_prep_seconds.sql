-- B1 Spreken zoals bij DUO: kijk- of voorbereidingstijd vóór de pieptoon.
--
-- DUO geeft in deel 1 vijf seconden om een plaatje te bekijken (alleen als er een plaatje is)
-- en in deel 2 vijftien seconden om het antwoord voor te bereiden. Daarna klinkt een pieptoon
-- en loopt de opname vanzelf (20 of 30 seconden, `max_record_seconds`). NULL betekent: geen
-- voorbereidingstijd, de opname start niet vanzelf — zo blijft A2 werken zoals het werkte.
-- Bron: staatsexamensnt2.nl, "Hoe ziet het examen eruit" en de instructievideo Spreken (2025).
alter table open_tasks add column if not exists prep_seconds int
  check (prep_seconds is null or prep_seconds between 0 and 300);
