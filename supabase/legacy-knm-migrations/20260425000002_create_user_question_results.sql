create table user_question_results (
  id          bigserial primary key,
  user_id     uuid references auth.users not null,
  question_id int references questions(id) not null,
  exam        int,
  was_correct boolean not null,
  answered_at timestamptz default now()
);

alter table user_question_results enable row level security;
create policy "Users see own results"
  on user_question_results for all
  using (auth.uid() = user_id);
