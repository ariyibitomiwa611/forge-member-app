-- FORGE member app: initial schema.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

-- ---------------------------------------------------------------
-- Profiles: one row per member, created automatically on sign-up.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  journey_id    text check (journey_id in ('first-light','threshold','long-view','full-field','beyond-map')),
  plan_start    date,                       -- Monday the journey began; null until onboarding
  training_days jsonb not null default '{"2":"form","4":"rehearse","6":"endure"}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Day logs: one row per member per calendar day.
-- ---------------------------------------------------------------
create table if not exists public.day_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  ran        text,
  minutes    integer not null default 0 check (minutes >= 0 and minutes <= 1440),
  feel       smallint check (feel between 1 and 5),
  sleep      numeric(3,1) check (sleep >= 0 and sleep <= 24),
  readiness  smallint check (readiness between 1 and 5),
  med        boolean not null default false,
  breath     boolean not null default false,
  extras     jsonb not null default '[]'::jsonb,   -- [{name, minutes, feel}]
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ---------------------------------------------------------------
-- Row-level security: members can only ever see and change their own rows.
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.day_logs enable row level security;

drop policy if exists "own profile: read"   on public.profiles;
drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile: update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own logs: read"   on public.day_logs;
drop policy if exists "own logs: insert" on public.day_logs;
drop policy if exists "own logs: update" on public.day_logs;
drop policy if exists "own logs: delete" on public.day_logs;
create policy "own logs: read"   on public.day_logs for select using (auth.uid() = user_id);
create policy "own logs: insert" on public.day_logs for insert with check (auth.uid() = user_id);
create policy "own logs: update" on public.day_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs: delete" on public.day_logs for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Keep updated_at fresh.
-- ---------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists day_logs_touch on public.day_logs;
create trigger day_logs_touch before update on public.day_logs
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- Create a profile whenever someone signs up (email or Google).
-- ---------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
