(() => {
 'use strict';
 const URL='https://eqbaezhcwnjlcnvtfxho.supabase.co';
 const KEY='sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW';
 const client=window.supabase.createClient(URL,KEY);
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let busy=false,jobs=[],fleet=[];
 function tell(text){$('message').textContent=text;}
 async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
 async function authorise(){const {data,error}=await client.auth.getUser();if(error||!data.user)throw new Error('Please sign in to Management.');$('managerName').textContent=await rpc('bmv_fleet_manager_identity',{});}
 async function edge(action,id){
  const {data,error}=await client.auth.getSession();if(error||!data.session)throw new Error('Please sign in again.');
  const response=await fetch(`${URL}/functions/v1/smooth-action/manage`,{method:'POST',headers:{Authorization:`Bearer ${data.session.access_token}`,apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action,job_id:id}),signal:AbortSignal.timeout(45000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Discord request failed');return result;
 }
 function render(){
  const reserved=new Set(jobs.filter(j=>['OPEN','CLAIMED'].includes(j.status)).map(j=>j.support_registration));
  $('grounded').innerHTML='<option value="">Select aircraft</option>'+fleet.filter(r=>['TECH_HOLD','AWAITING_RELEASE'].includes(r.operational_status)).map(r=>`<option value="${esc(r.registration)}">${esc(r.registration)} · ${esc(r.current_location||'Location missing')}</option>`).join('');
  $('support').innerHTML='<option value="">Select support aircraft</option>'+fleet.filter(r=>r.fleet_class==='TECH_OPS'&&r.operational_status==='AVAILABLE'&&!reserved.has(r.registration)).map(r=>`<option value="${esc(r.registration)}">${esc(r.registration)} · ${esc(r.aircraft_type)}</option>`).join('');
  $('jobs').innerHTML=jobs.length?jobs.map(j=>`<article class="job"><span class="badge">${esc(j.status)}</span><h4>${esc(j.departure)} → ${esc(j.destination)} · ${j.flight_number?`BMA${esc(j.flight_number)}T`:'Flight number assigned on claim'}</h4><p>Support: <strong>${esc(j.support_registration)}</strong> · Grounded: ${esc(j.grounded_registration)} · Pilot: ${esc(j.claimed_pilot_id||'Unassigned')}</p><p class="briefing">${esc(j.briefing)}</p>${j.completion_notes?`<p>Closing notes: ${esc(j.completion_notes)}</p>`:''}<p><small>Job ${esc(j.id)} · ${esc(new Date(j.created_at).toLocaleString('en-GB'))}</small></p><div class="job-actions">${j.discord_message_id?`<button data-action="sync" data-id="${esc(j.id)}">SYNC DISCORD</button>`:j.status==='OPEN'?`<button data-action="publish" data-id="${esc(j.id)}">${j.publish_started_at?'CHECK PUBLICATION':'PUBLISH TO DISCORD'}</button>`:''}${j.status==='CLAIMED'?`<button data-action="COMPLETED" data-id="${esc(j.id)}">COMPLETE JOB</button>`:''}${['OPEN','CLAIMED'].includes(j.status)?`<button data-action="CANCELLED" data-id="${esc(j.id)}">CANCEL JOB</button>`:''}</div></article>`).join(''):'<p class="muted">No jobs yet. If no support aircraft appear, activate an appropriate Tech Ops aircraft through your fleet administration first.</p>';
 }
 async function load(){
  await authorise();
  const results=await Promise.all([client.from('tech_ops_jobs').select('*').order('created_at',{ascending:false}).limit(500),client.from('fleet').select('registration,aircraft_type,fleet_class,operational_status,current_location').eq('lifecycle_status','CURRENT'),client.from('tech_ops_pilot_links').select('discord_user_id,pilot_id').order('pilot_id')]);
  for(const r of results)if(r.error)throw r.error;
  jobs=results[0].data||[];fleet=results[1].data||[];render();
  $('links').innerHTML=(results[2].data||[]).map(l=>`<p class="job">${esc(l.pilot_id)} · Discord ${esc(l.discord_user_id)} <button data-unlink="${esc(l.discord_user_id)}">UNLINK</button></p>`).join('');
 }
 async function run(action){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await action();}catch(e){tell(e.message||'Request failed. Refresh to check the latest job state.');}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
 $('support').addEventListener('change',()=>{const r=fleet.find(r=>r.registration===$('support').value);$('departure').value=r?.current_location||'';});
 $('createForm').addEventListener('submit',e=>{e.preventDefault();run(async()=>{await rpc('tech_ops_create_job',{p_grounded_registration:$('grounded').value,p_support_registration:$('support').value,p_departure:$('departure').value,p_briefing:$('briefing').value});$('createForm').reset();tell('Job saved. Select Publish to Discord to make it available for claiming.');await load();});});
 $('linkForm').addEventListener('submit',e=>{e.preventDefault();run(async()=>{await rpc('tech_ops_link_pilot',{p_discord_user_id:$('discordId').value.trim(),p_pilot_id:$('pilotId').value.trim()});$('linkForm').reset();tell('Verified pilot link saved.');await load();});});
 $('jobs').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;run(async()=>{
  if(['publish','sync'].includes(b.dataset.action)){await edge(b.dataset.action,b.dataset.id);tell('Discord message updated.');}
  else{const notes=window.prompt('Enter completion/cancellation notes. The grounded aircraft will remain on hold.');if(!notes?.trim())return;await rpc('tech_ops_close_job',{p_job_id:b.dataset.id,p_status:b.dataset.action,p_notes:notes});tell('Job closed. Aircraft release remains a separate action.');try{await edge('sync',b.dataset.id);}catch{tell('Job closed, but Discord could not be updated. Use Sync Discord after checking the connection.');}}
  await load();
 });});
 $('links').addEventListener('click',e=>{const b=e.target.closest('button[data-unlink]');if(b&&window.confirm('Remove this verified pilot link?'))run(async()=>{await rpc('tech_ops_unlink_pilot',{p_discord_user_id:b.dataset.unlink});await load();tell('Pilot link removed.');});});
 $('refresh').addEventListener('click',()=>run(load));
 $('signOutButton').addEventListener('click',()=>run(async()=>{const {error}=await client.auth.signOut();if(error)throw error;window.location.replace('/management/');}));
 client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')window.location.replace('/management/');});
 load().then(()=>{$('authGate').classList.add('hidden');$('dispatchApp').classList.remove('hidden');}).catch(e=>{$('authMessage').textContent=e.message;});
})();

