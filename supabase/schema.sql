-- After creating the table, also run:
--   alter table research_history add column if not exists source_mode text;
-- For login (Google + guest) also apply migrations/20260909_profiles_and_auth.sql
-- and enable the Google + Anonymous providers (see AUTH_SETUP.md).
-- Set TAVILY_API_KEY as a secret for Edge Functions (never in the Vite app):
--   supabase secrets set TAVILY_API_KEY=your_tavily_key
-- Deploy:
--   supabase functions deploy search-building-code

create table if not exists research_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  municipality_id text not null,
  municipality_name text not null,
  state text not null,
  category_id text not null,
  category_label text not null,
  query_text text not null,
  answer_text text not null,
  is_fallback boolean not null default false,
  citations jsonb not null default '[]'::jsonb,
  includes_prototype_sources boolean not null default false,
  source_mode text
);

alter table research_history add column if not exists source_mode text;

alter table research_history drop constraint if exists research_history_query_length;
alter table research_history add constraint research_history_query_length
  check (char_length(trim(query_text)) between 3 and 1000);

alter table research_history drop constraint if exists research_history_query_no_controls;
alter table research_history add constraint research_history_query_no_controls
  check (query_text !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]');

alter table research_history drop constraint if exists research_history_query_no_markup;
alter table research_history add constraint research_history_query_no_markup
  check (query_text !~ '<[A-Za-z]' and query_text !~* 'javascript[[:space:]]*:' and query_text !~* 'data[[:space:]]*:[[:space:]]*text[[:space:]]*/[[:space:]]*html');

alter table research_history drop constraint if exists research_history_source_mode_valid;
alter table research_history add constraint research_history_source_mode_valid
  check (source_mode is null or source_mode in ('official', 'prototype', 'insufficient_official'));

create index if not exists research_history_user_created_idx
  on research_history (user_id, created_at desc);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  history_id uuid not null references research_history (id) on delete cascade,
  rating text not null check (rating in ('helpful', 'not_helpful', 'report_incorrect')),
  note text
);

create index if not exists feedback_history_created_idx
  on feedback (history_id, created_at desc);

alter table feedback drop constraint if exists feedback_note_length;
alter table feedback add constraint feedback_note_length
  check (note is null or char_length(note) <= 500);

alter table feedback drop constraint if exists feedback_note_no_controls;
alter table feedback add constraint feedback_note_no_controls
  check (note is null or note !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]');

alter table feedback drop constraint if exists feedback_note_no_markup;
alter table feedback add constraint feedback_note_no_markup
  check (
    note is null
    or (
      note !~ '<[A-Za-z]'
      and note !~* 'javascript[[:space:]]*:'
      and note !~* 'data[[:space:]]*:[[:space:]]*text[[:space:]]*/[[:space:]]*html'
    )
  );

alter table research_history enable row level security;
alter table feedback enable row level security;

drop policy if exists research_history_select_own on research_history;
create policy research_history_select_own
  on research_history for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists research_history_insert_own on research_history;
create policy research_history_insert_own
  on research_history for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists feedback_select_own on feedback;
create policy feedback_select_own
  on feedback for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists feedback_insert_own on feedback;
create policy feedback_insert_own
  on feedback for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from research_history h
      where h.id = history_id
        and h.user_id = auth.uid()
    )
  );

drop policy if exists research_history_update_none on research_history;
create policy research_history_update_none
  on research_history for update to authenticated
  using (false)
  with check (false);

drop policy if exists research_history_delete_none on research_history;
create policy research_history_delete_none
  on research_history for delete to authenticated
  using (false);

drop policy if exists feedback_update_none on feedback;
create policy feedback_update_none
  on feedback for update to authenticated
  using (false)
  with check (false);

drop policy if exists feedback_delete_none on feedback;
create policy feedback_delete_none
  on feedback for delete to authenticated
  using (false);

alter table research_history drop constraint if exists research_history_answer_length;
alter table research_history add constraint research_history_answer_length
  check (char_length(answer_text) <= 4000);

alter table research_history drop constraint if exists research_history_citations_array;
alter table research_history add constraint research_history_citations_array
  check (jsonb_typeof(citations) = 'array');
