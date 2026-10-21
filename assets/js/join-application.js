(() => {
 const endpoint='https://eqbaezhcwnjlcnvtfxho.supabase.co/functions/v1/bmv-website-register';
 const form=document.getElementById('pilotApplication'),status=document.getElementById('applicationStatus'),submit=document.getElementById('applicationSubmit');
 let token='',widget,busy=false;
 const message=text=>{status.textContent=text;};
 window.bmvTurnstileReady=()=>{
  widget=window.turnstile.render('#applicationChallenge',{sitekey:form.dataset.sitekey,action:'pilot_join',size:'flexible',callback:value=>{token=value;submit.disabled=busy;},'expired-callback':()=>{token='';submit.disabled=true;},'error-callback':()=>{token='';submit.disabled=true;message('The security check could not load. Please refresh and try again.');}});
 };
 async function initialise(){try{
  const r=await fetch(endpoint,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const config=await r.json();
  if(!config.enabled||!config.sitekey){message('Website applications are opening soon. Please check back shortly.');return;}
  form.dataset.sitekey=config.sitekey;
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=bmvTurnstileReady&render=explicit';script.async=true;script.onerror=()=>message('The security check could not load. Please refresh and try again.');document.head.append(script);
  message('Complete the form and security check to apply.');
 }catch{message('Applications are temporarily unavailable. Please refresh and try again.');}}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!token||!form.reportValidity())return;
  busy=true;submit.disabled=true;submit.textContent='Sending application…';message('Sending your application…');
  const data=new FormData(form);
  try{
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({nickname:data.get('nickname'),discord_id:data.get('discord_id'),vatsim_cid:data.get('vatsim_cid'),simbrief_id:data.get('simbrief_id'),privacy_acknowledged:data.get('privacy')==='on',age_confirmed:data.get('age')==='on',turnstile_token:token})});
   const body=await r.json();if(!r.ok)throw Error(body.error||'Unable to submit. Please try again.');
   form.hidden=true;message(body.message);status.tabIndex=-1;status.focus();
  }catch(e){message(e.name==='TimeoutError'?'The response took too long. You can safely submit again after a fresh security check.':e.message||'Connection lost. Please try again.');}
  finally{busy=false;token='';submit.textContent='Submit application';if(widget!==undefined)window.turnstile.reset(widget);}
 });
 initialise();
})();
