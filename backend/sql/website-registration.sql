-- Additive upgrade; apply before deploying functions. Existing logins and allocator are unchanged.
begin;
alter table bmv_registration.applications add column if not exists email text,
 add column if not exists vatsim_cid text, add column if not exists simbrief_id text,
 add column if not exists application_source text not null default 'discord',
 add column if not exists privacy_notice_version text, add column if not exists privacy_acknowledged_at timestamptz;
create unique index if not exists one_open_website_email on bmv_registration.applications(lower(btrim(email))) where application_source='website' and state<>'rejected' and email is not null;
create table if not exists bmv_registration.website_limits(key text primary key,window_start timestamptz not null,hits integer not null check(hits>0));
alter table bmv_registration.website_limits enable row level security;
revoke all on bmv_registration.website_limits from public,anon,authenticated;
grant select,insert,update on bmv_registration.website_limits to bmv_registration_service;
drop policy if exists registration_limits_service on bmv_registration.website_limits;
create policy registration_limits_service on bmv_registration.website_limits to bmv_registration_service using(true) with check(true);
create index if not exists website_application_queue on bmv_registration.applications(created_at desc,id desc) where application_source='website';
commit;
