begin;
alter table bmv_registration.applications add column if not exists airline text not null default 'BMA';
alter table bmv_registration.applications add constraint applications_airline_check check (airline in ('BMA','ECV'));
alter table bmv_registration.applications drop constraint applications_pilot_id_check;
alter table bmv_registration.applications add constraint applications_pilot_id_check check (
 pilot_id ~ '^BMA[0-9]{4}$' or (pilot_id ~ '^ECV[0-9]{4}$' and (kind='link' or airline='ECV')));

-- A separate namespace and transaction lock leave BMA allocation unchanged.
-- This private helper reads Auth solely to avoid reserving an existing address.
create or replace function bmv_registration.allocate_ecv_pilot_id() returns text
language plpgsql security definer set search_path='' as $$
declare allocated integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('bmv-registration-ecv-id',0));
 select greatest(
  coalesce((select max(substring(pilot_id from 4)::int) from public.pilots where pilot_id ~ '^ECV[0-9]{4}$'),0),
  coalesce((select max(substring(pilot_id from 4)::int) from bmv_registration.applications where pilot_id ~ '^ECV[0-9]{4}$'),0),
  coalesce((select max(substring(email from 4 for 4)::int) from auth.users where email ~ '^ecv[0-9]{4}@auth[.]britishmidlandvirtual[.]internal$'),0)
 ) + 1 into allocated;
 if allocated>9999 then raise exception 'ECV number range exhausted'; end if;
 return 'ECV'||lpad(allocated::text,4,'0');
end; $$;
revoke all on function bmv_registration.allocate_ecv_pilot_id() from public,anon,authenticated;
grant execute on function bmv_registration.allocate_ecv_pilot_id() to bmv_registration_service;

create or replace function bmv_registration.guard_pilot_id() returns trigger
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if TG_OP='UPDATE' and new.pilot_id is not distinct from old.pilot_id then return new; end if;
 if new.pilot_id ~ '^ECV[0-9]{4}$' then
  perform pg_advisory_xact_lock(hashtextextended('bmv-registration-ecv-id',0));
 elsif new.pilot_id ~ '^BMA[0-9]{4}$' then
  perform 1 from bmv_registration.counter where singleton for update;
 else return new;
 end if;
 if exists(select 1 from bmv_registration.applications a where a.pilot_id=new.pilot_id and a.kind='new'
  and a.state in ('approved','complete') and a.id::text is distinct from current_setting('bmv.registration_id',true)
  and not exists(select 1 from auth.users u where u.id=new.id and u.raw_app_meta_data->>'bmv_registration_id'=a.id::text)) then
  raise exception 'Pilot ID reserved by registration';
 end if;
 if new.pilot_id ~ '^BMA[0-9]{4}$' then
  n:=substring(new.pilot_id from 4)::integer;
  update bmv_registration.counter set last_number=greatest(last_number,n) where singleton;
 end if;
 return new;
end; $$;
commit;
