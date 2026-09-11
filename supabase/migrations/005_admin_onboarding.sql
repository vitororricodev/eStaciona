-- eStaciona 1.0.5
-- Primeiro acesso obrigatório para proprietários criados pela administração SaaS.
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

create index if not exists profiles_must_change_password_idx
  on public.profiles(id, must_change_password);
