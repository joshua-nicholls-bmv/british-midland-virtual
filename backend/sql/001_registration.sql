-- Apply only after reviewing 000_preflight.sql against a staging database.
begin;
create schema bmv_registration;
revoke all on schema bmv_registration from public, anon, authenticated;
create table bmv_registration.applications (
 id uuid primary key default gen_random_uuid(),
 discord_id text not null check(discord_id ~ '^[0-9]{17,20}$'),
 nickname text not null check(length(nickname) between 1 and 80),
 kind text not null check(kind in ('new','link')),
 state text not null default 'pending' check(state in ('pending','approved','rejected','complete')),
 pilot_id text check(pilot_id ~ '^BMA[0-9]{4}$'),
 user_id uuid unique references auth.users(id),
 reviewed_by text, reason text, reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 message_id text, message_state text, retry_at timestamptz not null default now(), role_assigned_at timestamptz,
 check ((kind='new') or pilot_id is not null)
);
create unique index one_open_application on bmv_registration.applications(discord_id) where state <> 'rejected';
create unique index one_reserved_pilot on bmv_registration.applications(pilot_id) where state in ('approved','complete');
create table bmv_registration.links (
 discord_id text primary key,
 user_id uuid not null unique references public.pilots(id),
 application_id uuid not null unique references bmv_registration.applications(id),
 created_at timestamptz not null default now()
);
create table bmv_registration.tokens (
 digest text primary key,
 application_id uuid not null unique references bmv_registration.applications(id),
 expires_at timestamptz not null,
 consumed_at timestamptz,
 attempts integer not null default 0
);
create table bmv_registration.audit (
 id bigint generated always as identity primary key,
 application_id uuid references bmv_registration.applications(id),
 actor text not null, event text not null, detail jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create function bmv_registration.immutable_audit() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Registration audit is append-only'; end; $$;
create trigger immutable_audit before update or delete on bmv_registration.audit for each row execute function bmv_registration.immutable_audit();
create table bmv_registration.counter (singleton boolean primary key default true check(singleton), last_number integer not null check(last_number between 0 and 9999));
insert into bmv_registration.counter values(true,0);
-- Shared allocator: legacy/manual inserts also advance the counter and cannot take a reserved ID.
create function bmv_registration.guard_pilot_id() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if TG_OP='UPDATE' and new.pilot_id is not distinct from old.pilot_id then return new; end if;
 if new.pilot_id ~ '^BMA[0-9]{4}$' then
  n := substring(new.pilot_id from 4)::integer;
  perform 1 from bmv_registration.counter where singleton for update;
  if exists(select 1 from bmv_registration.applications a where a.pilot_id=new.pilot_id and a.kind='new'
    and a.state in ('approved','complete') and a.id::text is distinct from current_setting('bmv.registration_id',true)
    and not exists(select 1 from auth.users u where u.id=new.id and u.raw_app_meta_data->>'bmv_registration_id'=a.id::text)) then
    raise exception 'BMA ID reserved by registration';
  end if;
  update bmv_registration.counter set last_number=greatest(last_number,n) where singleton;
 end if;
 return new;
end; $$;
create trigger bmv_registration_id_guard before insert or update of pilot_id on public.pilots
 for each row execute function bmv_registration.guard_pilot_id();
-- Fails safely if existing pilot IDs are duplicated. Resolve duplicates before deployment.
create unique index if not exists bmv_registration_unique_pilot_id on public.pilots(pilot_id);
alter table bmv_registration.applications enable row level security;
alter table bmv_registration.links enable row level security;
alter table bmv_registration.tokens enable row level security;
alter table bmv_registration.audit enable row level security;
alter table bmv_registration.counter enable row level security;
revoke all on all tables in schema bmv_registration from public,anon,authenticated;
revoke all on all functions in schema bmv_registration from public,anon,authenticated;
commit;
