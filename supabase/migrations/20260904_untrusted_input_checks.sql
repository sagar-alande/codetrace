-- Apply manually after review. Rejects control characters and HTML-like tags in
-- stored questions and feedback notes. Does not ban a lone "<" used in comparisons
-- such as "under < 200 square feet".
--
-- Required because the anon key can insert into research_history and feedback
-- under RLS; application validation can be bypassed by calling PostgREST directly.

alter table research_history drop constraint if exists research_history_query_no_controls;
alter table research_history add constraint research_history_query_no_controls
  check (query_text !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]');

alter table research_history drop constraint if exists research_history_query_no_markup;
alter table research_history add constraint research_history_query_no_markup
  check (query_text !~ '<[A-Za-z]' and query_text !~* 'javascript[[:space:]]*:' and query_text !~* 'data[[:space:]]*:[[:space:]]*text[[:space:]]*/[[:space:]]*html');

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
