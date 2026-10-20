import pg from 'pg';
import process from 'node:process';
import {authEmail,hashToken,newToken,standardPassword} from './core.js';
const driver = new pg.Pool({connectionString:process.env.REGISTRATION_DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:2000,idleTimeoutMillis:1000});
// Hosted Supabase supplies its connection. Every operation assumes only our restricted role.
export const pool = {
  connect:()=>driver.connect(),
  query:(...args)=>tx(c=>c.query(...args)),
  end:()=>driver.end()
};
export async function tx(fn) {
  const c=await pool.connect();
  try {await c.query('begin'); await c.query('set local role bmv_registration_service'); await c.query("set local lock_timeout='10s'");
    const result=await fn(c); await c.query('commit'); return result;
  } catch(e) {await c.query('rollback');throw e;} finally {c.release();}
}
export async function audit(c,id,actor,event,detail={}) {
  await c.query('insert into bmv_registration.audit(application_id,actor,event,detail) values($1,$2,$3,$4)',[id,actor,event,detail]);
}
export async function apply(discord,nickname,kind,pilot,client=null) {
  return (client?fn=>fn(client):tx)(async c=>{
    await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[discord]);
    const {rows}=await c.query("select * from bmv_registration.applications a where discord_id=$1 and (state<>'rejected' or (created_at>now()-interval '24 hours' and not exists(select 1 from bmv_registration.audit e where e.application_id=a.id and e.event='test_application_cleared'))) order by created_at desc limit 1",[discord]);
    if(rows.length) return rows[0];
    const {rows:[a]}=await c.query('insert into bmv_registration.applications(discord_id,nickname,kind,pilot_id) values($1,$2,$3,$4) returning *',[discord,nickname,kind,pilot]);
    await audit(c,a.id,discord,'submitted',{kind}); return a;
  });
}
export async function decide(id,actor,approve,reason,client=null) {
  return (client?fn=>fn(client):tx)(async c=>{
    const {rows:[a]}=await c.query('select * from bmv_registration.applications where id=$1 for update',[id]);
    if(!a || a.discord_id===actor) throw new Error('Review is not permitted.');
    if(a.application_source==='website' && !actor.startsWith('management:'))throw new Error('Website management review required.');
    if(a.state!=='pending') return a;
    let pilot=a.pilot_id;
    if(approve && a.kind==='new') {
      const {rows:[allocated]}=await c.query('select bmv_registration.allocate_pilot_id() as pilot_id');
      pilot=allocated.pilot_id;
    }
    const {rows:[result]}=await c.query('update bmv_registration.applications set state=$2,pilot_id=$3,reviewed_by=$4,reason=$5,reviewed_at=now() where id=$1 returning *',[id,approve?'approved':'rejected',pilot,actor,reason]);
    await audit(c,id,actor,approve?'approved':'rejected',{reason,pilot_id:pilot}); return result;
  });
}
export async function status(discord) {
  return tx(async c=>{
    const {rows:[a]}=await c.query("select * from bmv_registration.applications a where discord_id=$1 and not (state='rejected' and exists(select 1 from bmv_registration.audit e where e.application_id=a.id and e.event='test_application_cleared')) order by created_at desc limit 1 for update",[discord]);
    if(!a || a.state!=='approved' || a.kind==='new') return {application:a};
    const {rows:[old]}=await c.query('select * from bmv_registration.tokens where application_id=$1',[a.id]);
    if(old && old.attempts>=5 && new Date(old.expires_at)>new Date()) return {application:a,locked:true};
    const token=newToken();
    await c.query(`insert into bmv_registration.tokens(digest,application_id,expires_at) values($1,$2,now()+interval '15 minutes')
      on conflict(application_id) do update set digest=excluded.digest,expires_at=excluded.expires_at,consumed_at=null,
      attempts=case when bmv_registration.tokens.expires_at>now() then bmv_registration.tokens.attempts else 0 end`,[hashToken(token),a.id]);
    await audit(c,a.id,discord,'setup_link_issued');return {application:a,token};
  });
}
async function auth(path,body,admin=false) {
  const key=admin?process.env.SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_ANON_KEY;
  const headers={apikey:key,'Content-Type':'application/json'};
  if(admin) headers.Authorization=`Bearer ${key}`;
  const r=await fetch(`${process.env.SUPABASE_URL}/auth/v1/${path}`,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!r.ok) return null;
  return r.json();
}
export const provision = applicationId => complete(null,null,applicationId);
export const finish = (token,secret) => complete(token,secret,null);
async function complete(token,secret,applicationId) {
  return tx(async c=>{
    // Lock application before token everywhere to avoid refresh/setup lock inversion.
    const lookup=applicationId?{application_id:applicationId}:(await c.query('select application_id from bmv_registration.tokens where digest=$1',[hashToken(token)])).rows[0];
    if(!lookup) return false;
    const {rows:[a]}=await c.query('select * from bmv_registration.applications where id=$1 for update',[lookup.application_id]);
    if(!a || a.state!=='approved')return false;
    let t;
    if(applicationId){
      if(a.kind!=='new')return false;
      secret=standardPassword(a.pilot_id);
    }else{
      if(a.kind!=='link')return false;
      t=(await c.query("select * from bmv_registration.tokens where digest=$1 and consumed_at is null and expires_at>now() and attempts<5 for update",[hashToken(token)])).rows[0];
      if(!t)return false;
      await c.query('update bmv_registration.tokens set attempts=attempts+1 where digest=$1',[t.digest]);
    }
    let uid;
    if(a.kind==='link') {
      const data=await auth('token?grant_type=password',{email:authEmail(a.pilot_id),password:secret});
      if(!data?.user?.id) {await audit(c,a.id,a.discord_id,'link_proof_failed');return false;}
      uid=data.user.id;
      // No sessions are returned to the browser or persisted by this service.
      const {rows:[p]}=await c.query("select id from public.pilots where id=$1 and pilot_id=$2 and login_enabled and upper(status)='ACTIVE'",[uid,a.pilot_id]);
      if(!p) return false;
    } else {
      // Recovery after an ambiguous Auth response or DB rollback: only adopt our own marker.
      const {rows:[existing]}=await c.query('select id,raw_app_meta_data from bmv_registration.lookup_reserved_auth($1)',[a.id]);
      if(existing) {
        if(existing.raw_app_meta_data?.bmv_registration_id!==a.id) throw new Error('Reserved auth address conflict.');
        const proof=await auth('token?grant_type=password',{email:authEmail(a.pilot_id),password:secret});
        if(proof?.user?.id!==existing.id) {await audit(c,a.id,a.discord_id,'setup_proof_failed'); return false;}
        uid=existing.id;
      } else {
        const user=await auth('admin/users',{email:authEmail(a.pilot_id),password:secret,email_confirm:true,
          app_metadata:{bmv_registration_id:a.id},user_metadata:{pilot_id:a.pilot_id,nickname:a.nickname}},true);
        if(!user?.id) {await audit(c,a.id,a.discord_id,'auth_creation_retry_required');return false;}
        uid=user.id;
      }
      await c.query("select set_config('bmv.registration_id',$1,true)",[a.id]);
      const {rows:[profile]}=await c.query('select * from public.pilots where id=$1',[uid]);
      if(profile) {
        // An existing Auth trigger may create the profile; never silently overwrite a different ID.
        if(profile.pilot_id!==a.pilot_id) throw new Error('Auth trigger profile conflict; operator review required.');
        if(!profile.login_enabled || String(profile.status).toUpperCase()!=='ACTIVE') throw new Error('Auth trigger created an inactive profile; operator review required.');
      } else {
        await c.query(`insert into public.pilots(id,pilot_id,nickname,role,status,login_enabled)
          values($1,$2,$3,$4,'Active',true)`,[uid,a.pilot_id,a.nickname,'Cadet']);
      }
    }
    await c.query('select bmv_registration.bind_verified_discord($1,$2)',[uid,a.discord_id]);
    await c.query('insert into bmv_registration.links(discord_id,user_id,application_id) values($1,$2,$3)',[a.discord_id,uid,a.id]);
    await c.query("update bmv_registration.applications set state='complete',user_id=$2 where id=$1",[a.id,uid]);
    if(t)await c.query('update bmv_registration.tokens set consumed_at=now() where digest=$1',[t.digest]);
    await audit(c,a.id,applicationId?'bot':a.discord_id,a.kind==='new'?'account_created':'account_linked',{pilot_id:a.pilot_id});
    return a.pilot_id;
  });
}
