INSERT INTO public.exam_submissions (email, user_id, exam_number, score, total, pct, passed, cat_scores, completed_at)
SELECT
  u.email,
  er.user_id,
  er.exam_number,
  er.score,
  er.total,
  er.pct,
  er.passed,
  er.cat_scores,
  er.completed_at
FROM public.exam_results er
JOIN auth.users u ON u.id = er.user_id
ON CONFLICT (email, exam_number) DO NOTHING;

-- 3. Drop the old table
DROP TABLE public.exam_results;