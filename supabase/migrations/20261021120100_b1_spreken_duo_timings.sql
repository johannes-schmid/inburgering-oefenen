-- B1 Spreken met de tijden van DUO (besluit eigenaar, 20-10-2026).
--
-- Staatsexamen NT2 programma I, Spreken: 16 opdrachten in twee delen.
--   Deel 1 — 8 korte opdrachten: 20 seconden spreektijd; vijf seconden om te kijken, alleen als er
--            een plaatje bij staat.
--   Deel 2 — 8 opdrachten: 15 seconden voorbereiden, daarna 30 seconden spreektijd.
-- Bron: staatsexamensnt2.nl "Hoe ziet het examen eruit" (instructievideo Spreken, 2025) en
-- "Extra tijd bij aangepast examen". Zie SEO/facts.md.
--
-- Dit vervangt de 60 seconden die er sinds de seed op stonden. Die waren bewust ruim ("de
-- spreektijd is een richtlengte"); de eigenaar koos nu voor het echte verloop, en de pieptoon
-- maakt de grens voor de kandidaat hoorbaar. De tijden staan per opdracht en niet per soort,
-- omdat ze per déél verschillen — daarom gaat `exam_task_rules.record_seconds` voor B1 op NULL.
update open_tasks t
set max_record_seconds = case p.sort_order when 1 then 20 else 30 end,
    prep_seconds = case
      when p.sort_order = 1 then
        case when exists (select 1 from open_task_images i where i.task_id = t.id) then 5 else null end
      else 15
    end
from exam_parts p, exams e
where p.id = t.part_id
  and e.id = t.exam_id
  and e.level = 'b1'
  and e.skill = 'spreken';

update exam_task_rules
set record_seconds = null,
    verified_note = 'Spreektijd per deel, niet per soort: deel 1 20 s (5 s kijken bij een plaatje), deel 2 15 s voorbereiden + 30 s. Staat op open_tasks.'
where level = 'b1' and skill = 'spreken';
