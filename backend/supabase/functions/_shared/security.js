export async function verifyDiscord(body,signature,timestamp,publicKey,now=Date.now()) {
  if(!/^[a-f0-9]{128}$/i.test(signature||'') || !/^[a-f0-9]{64}$/i.test(publicKey||'') || !/^\d+$/.test(timestamp||'')) return false;
  if(Math.abs(now/1000-Number(timestamp))>300)return false;
  const bytes=hex=>Uint8Array.from(hex.match(/../g),v=>parseInt(v,16));
  try {
    const key=await crypto.subtle.importKey('raw',bytes(publicKey),{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',key,bytes(signature),new TextEncoder().encode(timestamp+body));
  }catch{return false;}
}
export const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
export const ephemeral=content=>({type:4,data:{content,flags:64,allowed_mentions:{parse:[]}}});
