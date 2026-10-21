export const ORIGINS = ['https://britishmidlandvirtual.co.uk','https://www.britishmidlandvirtual.co.uk'];
export const PRIVACY_VERSION = '2026-10-21';
export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export function cors(req){
 const origin=req.headers.get('origin');
 if(!ORIGINS.includes(origin))throw new HttpError(403,'Origin not allowed.');
 return {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'};
}
export async function readBody(req){
 if(!req.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'JSON required.');
 const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Application required.');
 let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw new HttpError(413,'Application too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'Invalid JSON.');}
}
export function validateApplication(b){
 if(!b || Array.isArray(b) || typeof b!=='object')throw new HttpError(400,'Invalid application.');
 const text=(key,max,required=true)=>{const v=b[key];if(v==null&&!required)return null;if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f]/.test(v))throw new HttpError(400,`Check ${key}.`);const s=v.trim();if(required&&!s)throw new HttpError(400,`Enter ${key}.`);return s||null;};
 const nickname=text('nickname',80),discord_id=text('discord_id',20);
 if(!/^[1-9]\d{16,19}$/.test(discord_id))throw new HttpError(400,'Enter your numeric Discord user ID.');
 const vatsim_cid=text('vatsim_cid',10,false),simbrief_id=text('simbrief_id',12,false);
 if(vatsim_cid&&!/^[1-9]\d{5,9}$/.test(vatsim_cid))throw new HttpError(400,'Check your VATSIM CID.');
 if(simbrief_id&&!/^[1-9]\d{0,11}$/.test(simbrief_id))throw new HttpError(400,'Use your numeric SimBrief pilot ID.');
 if(b.privacy_acknowledged!==true||b.age_confirmed!==true)throw new HttpError(400,'Confirm the privacy notice and age requirement.');
 const turnstile_token=text('turnstile_token',2048);
 return {nickname,discord_id,vatsim_cid,simbrief_id,turnstile_token};
}
export async function verifyTurnstile(token,secret,fetcher=fetch){
 const r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret,response:token}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new HttpError(503,'Verification unavailable. Please try again.');
 const v=await r.json();
 if(v.success!==true||v.action!=='pilot_join'||!ORIGINS.some(o=>new URL(o).hostname===v.hostname))throw new HttpError(400,'Please complete a fresh security check.');
}
export function response(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});}
export function failure(e,headers){return response({error:e instanceof HttpError?e.message:'Service unavailable. Please try again.'},e instanceof HttpError?e.status:503,headers);}
