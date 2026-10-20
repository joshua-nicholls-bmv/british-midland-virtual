import {cors,readBody,response,failure,HttpError} from '../_shared/website-security.js';
import {listApplications,reviewApplication} from '../_shared/website-db.js';
async function manager(req:Request){
 const bearer=req.headers.get('authorization');if(!bearer?.startsWith('Bearer '))throw new HttpError(401,'Please sign in.');
 const base=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY')!;
 const headers={Authorization:bearer,apikey:key};
 const auth=await fetch(`${base}/auth/v1/user`,{headers,signal:AbortSignal.timeout(10000)});
 if(!auth.ok)throw new HttpError(401,'Please sign in again.');
 const u=await auth.json();if(!u.id)throw new HttpError(401,'Please sign in again.');
 // Re-check the existing management table on every request using the user's JWT and its RLS.
 const check=await fetch(`${base}/rest/v1/management_users?select=user_id&user_id=eq.${encodeURIComponent(u.id)}&active=eq.true`,{headers,signal:AbortSignal.timeout(10000)});
 if(!check.ok||(await check.json()).length!==1)throw new HttpError(403,'Active management access required.');
 return u.id;
}
Deno.serve(async req=>{
 let headers={};try{
  headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!['GET','POST'].includes(req.method))throw new HttpError(405,'Method not allowed.');
  const user=await manager(req);
  if(req.method==='GET'){
   const raw=new URL(req.url).searchParams.get('before');let before=null;
   if(raw){try{before=JSON.parse(raw);}catch{throw new HttpError(400,'Invalid page.');}
    if(!before||typeof before.at!=='string'||!Number.isFinite(Date.parse(before.at))||!/^[-a-f0-9]{36}$/i.test(before.id))throw new HttpError(400,'Invalid page.');}
   const rows=await listApplications(before);return response({applications:rows.slice(0,50),next:rows.length>50?JSON.stringify({at:rows[49].created_at,id:rows[49].id}):null},200,headers);
  }
  const b=await readBody(req);
  if(!b||typeof b.id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(b.id)||!['approve','reject'].includes(b.action)||typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>300)throw new HttpError(400,'Application, decision and reason are required.');
  return response(await reviewApplication(b.id,user,b.action==='approve',b.reason.trim(),b.identity_confirmed),200,headers);
 }catch(e){return failure(e,headers);}
});
