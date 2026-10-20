export function validateVerifiedRole(roles,member,guild,roleId){
 const role=roles.find(r=>r.id===roleId);
 const own=roles.filter(r=>member.roles.includes(r.id)||r.id===guild);
 const permissions=own.reduce((p,r)=>p|BigInt(r.permissions),0n);
 if(!role || roleId===guild || role.managed || BigInt(role.permissions)!==0n)throw new Error('Verified role must exist and have no permissions');
 if(!(permissions&(268435456n|8n)) || Math.max(...own.map(r=>r.position))<=role.position)throw new Error('Bot needs Manage Roles and a role above ACARS verified');
}
export async function syncVerifiedRole({discord,pool,tx,audit,guild,roleId}){
 const {rows}=await pool.query(`select l.discord_id,l.application_id from bmv_registration.links l
 where not exists(select 1 from bmv_registration.applications a where a.id=l.application_id and a.application_source='website')
 and not exists(select 1 from bmv_registration.audit e where e.actor=l.discord_id and e.event='acars_verified_role_assigned' and e.detail->>'role_id'=$1)
 and not exists(select 1 from bmv_registration.audit e where e.actor=l.discord_id and e.event='acars_verified_role_failed' and e.detail->>'role_id'=$1 and e.created_at>now()-interval '15 minutes')
 order by l.created_at limit 5`,[roleId]);
 if(!rows.length)return {assigned:0,failed:0};
 const bot=await discord('users/@me');
 const roles=await discord(`guilds/${guild}/roles`);
 const member=await discord(`guilds/${guild}/members/${bot.id}`);
 validateVerifiedRole(roles,member,guild,roleId);
 const result={assigned:0,failed:0};const deadline=Date.now()+12000;
 for(const row of rows){
  if(Date.now()>deadline)break;
  // PUT is idempotent: a network/DB failure can safely retry without replacing other roles.
  try{
   await discord(`guilds/${guild}/members/${row.discord_id}/roles/${roleId}`,'PUT');
   await tx(db=>audit(db,row.application_id,row.discord_id,'acars_verified_role_assigned',{role_id:roleId}));
   result.assigned++;
  }catch(e){
   await tx(db=>audit(db,row.application_id,row.discord_id,'acars_verified_role_failed',{role_id:roleId,status:Number.isInteger(e.status)?e.status:null}));
   result.failed++;
  }
 }
 return result;
}
