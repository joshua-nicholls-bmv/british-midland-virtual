import {tx,audit,decide} from './db.js';
import {HttpError,PRIVACY_VERSION} from './website-security.js';
import {createHmac} from 'node:crypto';
export async function rateLimit(identity,secret,limit){
 const key=createHmac('sha256',secret).update(identity).digest('hex');
 const allowed=await tx(async c=>{
  const {rows:[r]}=await c.query(`insert into bmv_registration.website_limits(key,window_start,hits) values($1,date_trunc('hour',now()),1)
   on conflict(key) do update set window_start=date_trunc('hour',now()),hits=case when website_limits.window_start=date_trunc('hour',now()) then least(website_limits.hits+1,100000) else 1 end returning hits`,[key]);
  return r.hits<=limit;
 });
 if(!allowed)throw new HttpError(429,'Too many attempts. Please try again in an hour.');
}
export async function submitApplication(a){
 try{return await tx(async c=>{
  // Same Discord lock as the legacy path; unique indexes also protect concurrent writers.
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[a.discord_id]);
  const {rows}=await c.query(`select id from bmv_registration.applications where (discord_id=$1 or lower(btrim(email))=$2) and (state<>'rejected' or created_at>now()-interval '24 hours') limit 1`,[a.discord_id,a.email]);
  if(rows.length)return;
  if((await c.query('select id from public.pilots where discord_user_id=$1 limit 1',[a.discord_id])).rows.length)return;
  const {rows:[r]}=await c.query(`insert into bmv_registration.applications(discord_id,nickname,kind,email,vatsim_cid,simbrief_id,application_source,privacy_notice_version,privacy_acknowledged_at)
   values($1,$2,'new',$3,$4,$5,'website',$6,now()) returning id`,[a.discord_id,a.nickname,a.email,a.vatsim_cid,a.simbrief_id,PRIVACY_VERSION]);
  await audit(c,r.id,'website','website_submitted',{privacy_notice_version:PRIVACY_VERSION,age_confirmed:true});
 });}catch(e){if(e.code!=='23505')throw e;}
}
export async function listApplications(before){
 return tx(async c=>(await c.query(`select a.id,a.nickname,a.email,a.discord_id,a.vatsim_cid,a.simbrief_id,a.state,a.pilot_id,a.reason,a.created_at,a.reviewed_at,a.privacy_notice_version,
 (select e.event from bmv_registration.audit e where e.application_id=a.id and e.event in ('welcome_dm_sent','welcome_dm_unconfirmed','welcome_dm_attempted') order by e.created_at desc limit 1) as welcome_status
 from bmv_registration.applications a where a.application_source='website' and ($1::timestamptz is null or (a.created_at,a.id)<($1::timestamptz,$2::uuid)) order by a.created_at desc,a.id desc limit 51`,[before?.at||null,before?.id||null])).rows);
}
export async function reviewApplication(id,user,approve,reason,identityConfirmed){
 return tx(async c=>{
  const {rows:[a]}=await c.query("select * from bmv_registration.applications where id=$1 and application_source='website' for update",[id]);
  if(!a)throw new HttpError(404,'Application not found.');
  const {rows}=await c.query('select id from public.pilots where id=$1 and discord_user_id=$2',[user,a.discord_id]);
  if(rows.length||a.user_id===user)throw new HttpError(403,'You cannot review your own application.');
  if(a.state!=='pending')throw new HttpError(409,'This application has already been reviewed. Refresh the list.');
  if(approve&&identityConfirmed!==true)throw new HttpError(400,'Confirm the applicant and Discord recipient before approval.');
  await audit(c,a.id,`management:${user}`,'website_review',{identity_confirmed:approve&&identityConfirmed});
  const r=await decide(a.id,`management:${user}`,approve,reason,c);
  return {id:r.id,state:r.state,pilot_id:r.pilot_id};
 });
}
