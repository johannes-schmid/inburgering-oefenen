  create table public.admin_users (
    email text primary key
  );
  
  alter table public.admin_users enable row level security;
  
  create policy "Admins read admin_users"
    on public.admin_users for select
    using (auth.jwt()->>'email' = email);
    
  insert into public.admin_users (email) values
    ('schmid.johannes90@gmail.com'),
    ('ambervdz11@gmail.com');