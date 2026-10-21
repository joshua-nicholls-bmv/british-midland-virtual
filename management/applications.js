(() => {
 const base='https://eqbaezhcwnjlcnvtfxho.supabase.co',key='sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW';
 const client=window.supabase.createClient(base,key),endpoint=base+'/functions/v1/bmv-website-management';
 const list=document.getElementById('applications'),status=document.getElementById('applicationLoadStatus');let next=null,loading=false;
 const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 async function api(body,before){
  const {data}=await client.auth.getSession();if(!data.session)throw Error('Please sign in through the Management Portal.');
  const r=await fetch(endpoint+(before?'?before='+encodeURIComponent(before):''),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+data.session.access_token,apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const result=await r.json();if(!r.ok)throw Error(result.error||'Request failed.');return result;
 }
 function card(a){
  const article=node('article','');article.className='application-review';
  article.append(node('h2',a.nickname),node('p',`${a.state.toUpperCase()}${a.pilot_id?' · '+a.pilot_id:''} · ${new Date(a.created_at).toLocaleString('en-GB')}`));
  const fields=node('dl','');for(const [label,value] of Object.entries({'Discord user ID':a.discord_id,'VATSIM CID (self-reported)':a.vatsim_cid||'Not supplied','SimBrief pilot ID':a.simbrief_id||'Not supplied','Privacy notice':a.privacy_notice_version,'Welcome DM':a.welcome_status||'Not sent'})){fields.append(node('dt',label),node('dd',value));}article.append(fields);
  if(a.reason)article.append(node('p','Decision: '+a.reason));
  if(a.welcome_status==='welcome_dm_unconfirmed'||a.welcome_status==='welcome_dm_attempted')article.append(node('p','Delivery needs checking. Confirm whether the applicant received the message before taking any further action. Do not create another account.'));
  if(a.state==='pending'){
   const form=node('form',''),label=node('label','Decision reason'),reason=node('textarea','');reason.required=true;reason.maxLength=300;reason.rows=3;label.append(reason);
   const confirm=node('label','');confirm.className='identity-check';const checkbox=document.createElement('input');checkbox.type='checkbox';confirm.append(checkbox,document.createTextNode('I have checked the applicant and confirmed that this Discord user ID belongs to the intended recipient.'));
   const approve=node('button','Approve & create account'),reject=node('button','Reject application');approve.type='submit';approve.value='approve';reject.type='submit';reject.value='reject';reject.className='reject';
   const feedback=node('p','');feedback.setAttribute('role','status');
   form.append(label,confirm,approve,reject,feedback);form.addEventListener('submit',async e=>{
    e.preventDefault();const action=e.submitter.value;if(action==='approve'&&!checkbox.checked){feedback.textContent='Confirm the applicant and Discord recipient first.';return;}
    approve.disabled=reject.disabled=true;feedback.textContent='Recording decision…';try{await api({id:a.id,action,reason:reason.value,identity_confirmed:checkbox.checked});await load(false);}catch(error){feedback.textContent=error.message;approve.disabled=reject.disabled=false;}
   });article.append(form);
  }return article;
 }
 async function load(more){if(loading)return;loading=true;status.textContent='Loading applications…';try{
  const result=await api(null,more?next:null);if(!more)list.replaceChildren();result.applications.forEach(a=>list.append(card(a)));next=result.next;document.getElementById('moreApplications').hidden=!next;
  status.textContent=list.children.length?`${list.children.length} applications shown. Refresh to check provisioning and welcome delivery.`:'No website applications yet.';
 }catch(e){status.textContent=e.message;}finally{loading=false;}}
 document.getElementById('refreshApplications').onclick=()=>load(false);document.getElementById('moreApplications').onclick=()=>load(true);
 document.getElementById('signOutButton').onclick=async()=>{await client.auth.signOut();location.href='/management/';};
 load(false);
})();
