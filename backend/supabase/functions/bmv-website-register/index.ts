import {cors,readBody,validateApplication,verifyTurnstile,response,failure,HttpError} from '../_shared/website-security.js';
import {rateLimit,submitApplication} from '../_shared/website-db.js';
Deno.serve(async req=>{
 let headers={};
 try{
  headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  const secret=Deno.env.get('BMV_TURNSTILE_SECRET'),sitekey=Deno.env.get('BMV_TURNSTILE_SITE_KEY');
  const enabled=Deno.env.get('BMV_WEBSITE_REGISTRATION_ENABLED')==='true'&&!!secret&&!!sitekey;
  if(req.method==='GET')return response({enabled,sitekey:enabled?sitekey:null},200,headers);
  if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
  if(!enabled)throw new HttpError(503,'Website applications are not open yet. Please check back shortly.');
  const a=validateApplication(await readBody(req));
  // A global ceiling cannot be bypassed with forged proxy headers; per-identity ceilings add protection.
  await rateLimit('global',secret!,100);
  await rateLimit('email:'+a.email,secret!,5);
  await rateLimit('discord:'+a.discord_id,secret!,5);
  await verifyTurnstile(a.turnstile_token,secret!);
  await submitApplication(a);
  // Identical response for duplicates: never disclose accounts, status, or credentials to the public.
  return response({message:'Thank you. Your application has been received for review. If you have already applied, your existing application remains in place. Approved pilots receive a welcome DM in Discord.'},202,headers);
 }catch(e){return failure(e,headers);}
});
