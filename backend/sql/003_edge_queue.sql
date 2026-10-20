begin;
create table bmv_registration.interactions (
 id text primary key,
 payload jsonb not null,
 state text not null default 'pending' check(state in ('pending','done')),
 created_at timestamptz not null default now(),
 retry_at timestamptz not null default now(),
 attempts integer not null default 0
);
alter table bmv_registration.interactions enable row level security;
revoke all on bmv_registration.interactions from public,anon,authenticated;
grant select,insert,update on bmv_registration.interactions to bmv_registration_service;
create policy registration_service_interactions on bmv_registration.interactions to bmv_registration_service using(true) with check(true);
commit;
