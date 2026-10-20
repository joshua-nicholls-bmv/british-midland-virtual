import {work,workWebsite,ensureCommands,discord} from '../_shared/discord.js';
import {syncVerifiedRole} from '../_shared/verified-role.js';
import {setting} from '../_shared/settings.js';
import {json} from '../_shared/security.js';
import {pool,tx,audit} from '../_shared/db.js';
import {hashToken} from '../_shared/core.js';
Deno.serve(async req=>{
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'') || '';
 if(req.method!=='POST' || !/^[a-f0-9]{64}$/.test(token))return json({error:'Unauthorized'},401);
 try{
  const {rows:[valid]}=await pool.query('select commands_registered from bmv_registration.worker_auth where digest=$1',[hashToken(token)]);
  if(!valid)return json({error:'Unauthorized'},401);
  if(!Deno.env.get('BMV_REG_DISCORD_TOKEN') && !Deno.env.get('DISCORD_BOT_TOKEN'))return json({ok:false,setup_required:'DISCORD_BOT_TOKEN'},503);
  if(Deno.env.get('BMV_WEBSITE_ONLY')==='true'){await workWebsite();return json({ok:true,mode:'website-welcome-only'});}
  if(!valid.commands_registered){await ensureCommands();await pool.query('update bmv_registration.worker_auth set commands_registered=true where digest=$1',[hashToken(token)]);}
  let verifiedRole;
  try{verifiedRole=await syncVerifiedRole({discord,pool,tx,audit,guild:setting('DISCORD_GUILD_ID'),roleId:setting('DISCORD_VERIFIED_ROLE_ID')});}
  catch(e){const allowed=['Verified role must exist and have no permissions','Bot needs Manage Roles and a role above ACARS verified'];verifiedRole={error:e instanceof Error && allowed.includes(e.message)?e.message:'Verified-role sync unavailable'};}
  await work();return json({ok:true,verified_role:verifiedRole});
 }catch(e){
  const safe=['Token belongs to a different Discord application','Invalid roles','Private guild text channel required','Channel must deny everyone','Unexpected channel visibility','Management and bot must have explicit channel access','Unsafe role hierarchy','Discord request failed'];
  const message=e instanceof Error && safe.includes(e.message)?e.message:'Retry required';
  console.error('Worker failed',message);
  const detail=message==='Discord request failed'?{status:(e as {status?:number}).status,operation:(e as {operation?:string}).operation}:{};
  return json({error:message,...detail},503);
 }
});
