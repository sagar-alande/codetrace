-- Apply manually after review.
--
-- Supabase Auth already stores every sign-in in auth.users (Google users get an
-- email + name + avatar; "Continue as guest" creates an anonymous user with
-- is_anonymous = true). This migration adds a public, RLS-guarded `profiles`
-- table that mirrors those rows so the app (and dashboards) can read account
-- details without touching the auth schema.
--
-- Prerequisites in the Supabase dashboard:
--   Authentication > Providers > Google   -> enabled, with client id/secret
--   Authentication > Providers > Anonymous -> enabled (used by "Continue as guest")
--   Authentication > URL Configuration     -> add the app origin to redirect URLs

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text,
  full_name text,
  avatar_url text,
  is_guest boolean not null default false
);

alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own
  on profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts/refreshes are done by the trigger below (security definer), not clients.
drop policy if exists profiles_insert_none on profiles;
create policy profiles_insert_none
  on profiles for insert to authenticated
  with check (false);

drop policy if exists profiles_delete_none on profiles;
create policy profiles_delete_none
  on profiles for delete to authenticated
  using (false);

create or replace function public.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, is_guest, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    coalesce(new.is_anonymous, false),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    is_guest = excluded.is_guest,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_change();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data, is_anonymous on auth.users
  for each row execute function public.handle_auth_user_change();

-- Backfill profiles for users that already exist.
insert into public.profiles (id, email, full_name, avatar_url, is_guest, updated_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  coalesce(u.is_anonymous, false),
  now()
from auth.users u
on conflict (id) do nothing;
