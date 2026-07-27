create table public.exam_results (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  exam_number integer not null,
  score integer not null,
  total integer not null,
  pct integer not null,
  passed boolean not null,
  cat_scores jsonb null,
  completed_at timestamp with time zone null default now(),
  constraint exam_results_pkey primary key (id),
  constraint exam_results_user_id_exam_number_key unique (user_id, exam_number),
  constraint exam_results_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;