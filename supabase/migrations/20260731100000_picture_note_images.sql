-- ============================================================================
-- Fix: a Schrijven picture_note could not carry its pictures.
--
-- Found by seeding exam 1 of each skill. Two rules disagreed with the content model:
--
--   · `open_tasks_image_usage_is_speaking` CHECK forces `image_usage = 'none'` for every Schrijven
--     task, which is right — "gebruik steeds het plaatje" is a *speaking* instruction about how the
--     candidate must use the pictures, and it has no Schrijven equivalent.
--   · but `exam_publish_issues()` then read `image_usage = 'none'` as "this task has no pictures"
--     and blocked publication of any Schrijven task that had some.
--
-- A `picture_note` is precisely a writing task driven by pictures — DUO's is a four-picture
-- before/after sequence, and `open_task_images.group_label` is documented as "picture_note:
-- voor / na". So the model always intended these images; the gate just could not express it.
--
-- The image-count rule now applies to Spreken only, where `image_usage` is meaningful and where the
-- rubric grades against it. Schrijven tasks may carry any number of images, including none.
--
-- Everything else in the function is copied verbatim from the baseline: `CREATE OR REPLACE` on a
-- `LANGUAGE sql` function needs the whole body, so the diff is one clause inside a lot of context.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.exam_publish_issues(p_exam_id bigint)
RETURNS TABLE (severity text, entity text, entity_id bigint, issue text)
LANGUAGE sql STABLE AS $$
  -- Questions with no correct option marked. (Two correct is impossible: see
  -- question_options_one_correct_idx.)
  SELECT 'error', 'question', q.id, 'Geen juist antwoord aangevinkt'
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
    AND NOT EXISTS (SELECT 1 FROM public.question_options o
                    WHERE o.question_id = q.id AND o.is_correct)

  UNION ALL
  -- DUO uses 3 or 4 options. Anything else is a mis-authored item.
  SELECT 'error', 'question', q.id,
         format('%s antwoordopties; DUO gebruikt 3 of 4', count(o.id))
  FROM public.questions q
  LEFT JOIN public.question_options o ON o.question_id = q.id
  WHERE q.exam_id = p_exam_id
  GROUP BY q.id
  HAVING count(o.id) NOT IN (3, 4)

  UNION ALL
  -- Text options must have text; image options must have images.
  SELECT 'error', 'option', o.id,
         CASE WHEN q.option_layout = 'text'
              THEN 'Tekstoptie zonder tekst'
              ELSE 'Afbeeldingsoptie zonder afbeelding' END
  FROM public.question_options o
  JOIN public.questions q ON q.id = o.question_id
  WHERE q.exam_id = p_exam_id
    AND ((q.option_layout = 'text'  AND o.body IS NULL)
      OR (q.option_layout <> 'text' AND cardinality(o.image_urls) = 0))

  UNION ALL
  SELECT 'error', 'question', q.id, 'Geen uitleg'
  FROM public.questions q
  WHERE q.exam_id = p_exam_id AND coalesce(btrim(q.explanation), '') = ''

  UNION ALL
  -- A stimulus nobody asks a question about is dead weight in the player.
  SELECT 'error', 'stimulus', s.id, 'Stimulus zonder vragen'
  FROM public.stimuli s
  WHERE s.exam_id = p_exam_id
    AND NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.stimulus_id = s.id)

  UNION ALL
  -- A multi-speaker dialogue with no casting will be recast at random on regeneration.
  SELECT 'warning', 'stimulus', s.id,
         'Dialoog met meerdere sprekers zonder voice_cast'
  FROM public.stimuli s
  WHERE s.exam_id = p_exam_id
    AND s.script IS NOT NULL
    AND s.script LIKE '%B:%'
    AND (s.voice_cast IS NULL OR s.voice_cast = '{}'::jsonb)

  UNION ALL
  SELECT 'error', 'stimulus', s.id, 'Nog niet gevalideerd door de docent'
  FROM public.stimuli s
  WHERE s.exam_id = p_exam_id AND s.review_status <> 'validated'

  UNION ALL
  -- The image-usage rule and the actual image count must agree, since the rubric grades
  -- against the rule ("Vertel iets bij elk plaatje").
  SELECT 'error', 'open_task', t.id,
         format('image_usage=%s verwacht %s afbeelding(en), gevonden %s',
                t.image_usage,
                CASE t.image_usage WHEN 'describe' THEN 1 WHEN 'choose' THEN 2
                                   WHEN 'cover_all' THEN 3 ELSE 0 END,
                count(i.id))
  FROM public.open_tasks t
  LEFT JOIN public.open_task_images i ON i.task_id = t.id
  -- Spreken only: `image_usage` is a speaking instruction, and a Schrijven picture_note carries
  -- pictures while necessarily having image_usage='none'.
  WHERE t.exam_id = p_exam_id AND t.skill = 'spreken'
  GROUP BY t.id, t.image_usage
  HAVING count(i.id) <> CASE t.image_usage
           WHEN 'describe' THEN 1 WHEN 'choose' THEN 2 WHEN 'cover_all' THEN 3 ELSE 0 END

  UNION ALL
  SELECT 'error', 'open_task', t.id, 'Geen rubric gekoppeld'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND t.rubric_id IS NULL

  UNION ALL
  SELECT 'warning', 'open_task', t.id, 'Geen voorbeeldantwoord'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND coalesce(btrim(t.model_answer), '') = ''

  UNION ALL
  -- Item count must match the DUO format in data/skills.ts: 25/25/4/16.
  SELECT 'error', 'exam', e.id,
         format('%s opgaven; %s heeft er %s bij DUO', cnt.n, e.skill, expected.n)
  FROM public.exams e
  CROSS JOIN LATERAL (
    SELECT CASE e.skill WHEN 'lezen' THEN 25 WHEN 'luisteren' THEN 25
                        WHEN 'schrijven' THEN 4 ELSE 16 END AS n
  ) expected
  CROSS JOIN LATERAL (
    SELECT CASE WHEN e.skill IN ('lezen','luisteren')
                THEN (SELECT count(*) FROM public.questions q WHERE q.exam_id = e.id)
                ELSE (SELECT count(*) FROM public.open_tasks t WHERE t.exam_id = e.id)
           END AS n
  ) cnt
  WHERE e.id = p_exam_id AND cnt.n <> expected.n

  UNION ALL
  -- Spreken runs as 4 onderdelen of 4 tasks.
  SELECT 'error', 'exam', e.id,
         format('Spreken heeft 4 onderdelen nodig, gevonden %s',
                (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id))
  FROM public.exams e
  WHERE e.id = p_exam_id AND e.skill = 'spreken'
    AND (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id) <> 4;
$$;

NOTIFY pgrst, 'reload schema';
