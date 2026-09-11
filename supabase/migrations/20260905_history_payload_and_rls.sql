-- Apply after review. Tightens stored-history payload size and makes
-- update/delete denied by explicit RLS policies rather than only by omission.

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
