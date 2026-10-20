-- Scoped recovery lookup: no general access to Auth or password hashes.
create or replace function bmv_registration.lookup_reserved_auth(application_id uuid)
returns table(id uuid,raw_app_meta_data jsonb) language sql stable security definer set search_path='' as $$
 select u.id,jsonb_build_object('bmv_registration_id',u.raw_app_meta_data->>'bmv_registration_id')
 from bmv_registration.applications a join auth.users u
 on lower(u.email)=lower(a.pilot_id)||'@auth.britishmidlandvirtual.internal'
 where a.id=application_id and a.kind='new' and a.state='approved'
$$;
revoke all on function bmv_registration.lookup_reserved_auth(uuid) from public,anon,authenticated;
grant execute on function bmv_registration.lookup_reserved_auth(uuid) to bmv_registration_service;
