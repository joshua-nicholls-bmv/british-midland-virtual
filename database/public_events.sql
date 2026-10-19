-- Existing and newly created events stay private until a manager opts in.
alter table public.acars_events add column show_on_website boolean not null default false;
-- Existing manager-only UPDATE RLS still controls who can change this column.
grant update (show_on_website) on public.acars_events to authenticated;
comment on column public.acars_events.show_on_website is 'Manager opt-in: publish event summary on the public website. Joining remains in ACARS.';
create schema bmv_events;
revoke all on schema bmv_events from public;
create role bmv_events_reader nologin noinherit nobypassrls;
grant bmv_events_reader to postgres;
grant usage on schema public, bmv_events to bmv_events_reader;
grant select (id,title,description,starts_at,departure,arrival,aircraft,organiser,cancelled,show_on_website)
  on public.acars_events to bmv_events_reader;
create policy website_event_projection on public.acars_events for select to bmv_events_reader
  using (show_on_website = true);
-- Narrow owner-rights projection in an unexposed schema; never grants access to
-- attendance, created_by, briefing URLs or briefing text. Owner cannot bypass RLS.
create view bmv_events.safe_projection with (security_barrier=true) as
select id,title,description,starts_at,departure,arrival,aircraft,organiser,cancelled
from public.acars_events where show_on_website = true;
grant create on schema bmv_events to bmv_events_reader;
alter view bmv_events.safe_projection owner to bmv_events_reader;
revoke create on schema bmv_events from bmv_events_reader;
revoke all on bmv_events.safe_projection from public,anon,authenticated;
grant usage on schema bmv_events to anon,authenticated;
grant select on bmv_events.safe_projection to anon,authenticated;
create view public.public_website_events with (security_invoker=true,security_barrier=true) as
select id,title,description,starts_at,departure,arrival,aircraft,organiser,cancelled
from bmv_events.safe_projection;
revoke all on public.public_website_events from public,anon,authenticated;
grant select on public.public_website_events to anon,authenticated;
comment on view public.public_website_events is 'Public event summaries explicitly published by management; read only; no attendees or private briefings.';
notify pgrst,'reload schema';
