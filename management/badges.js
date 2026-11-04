(async()=>{
 const client=window.supabase.createClient('https://eqbaezhcwnjlcnvtfxho.supabase.co','sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW');
 const el=id=>document.getElementById(id),status=el('status');let badges=[],pilots=[];
 const checked=async query=>{const r=await query;if(r.error)throw r.error;return r.data||[];};
 const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
 const safeImage=url=>typeof url==='string'&&url.startsWith('https://britishmidlandvirtual.co.uk/assets/images/badges/');
 function preview(){const b=badges.find(b=>b.id===el('badge').value);el('preview').src=b&&safeImage(b.image_url)?b.image_url:'';el('description').textContent=b?.description||'';document.querySelectorAll('.badge-tile').forEach(tile=>tile.setAttribute('aria-pressed',String(tile.dataset.badge===b?.id))); }
 async function load(){
  badges=await checked(client.from('special_badges').select('*').order('name'));el('badge').replaceChildren(...badges.map(b=>option(b.id,b.name)));preview();
  el('badgeGallery').replaceChildren();for(const b of badges){const tile=document.createElement('button');tile.type='button';tile.className='badge-tile';tile.dataset.badge=b.id;tile.setAttribute('aria-pressed',String(b.id===el('badge').value));tile.setAttribute('aria-label',b.name);const img=document.createElement('img');if(safeImage(b.image_url))img.src=b.image_url;img.alt=b.name;img.loading='lazy';const label=document.createElement('strong');label.textContent=b.name;tile.append(img,label);tile.onclick=()=>{el('badge').value=b.id;preview();};el('badgeGallery').append(tile);}
  const awards=await checked(client.from('pilot_event_awards').select('id,pilot_id,event_name,awarded_at,badge_id').not('badge_id','is',null).order('awarded_at',{ascending:false}).limit(100));
  el('awards').replaceChildren();for(const a of awards){const p=document.createElement('div'),pilot=pilots.find(p=>p.id===a.pilot_id);p.className='award-history-row';const badge=badges.find(b=>b.id===a.badge_id);if(badge&&safeImage(badge.image_url)){const img=document.createElement('img');img.src=badge.image_url;img.alt='';p.append(img);}const caption=document.createElement('span');caption.textContent=`${pilot?.pilot_id||'Pilot'} · ${a.event_name} · ${new Date(a.awarded_at).toLocaleDateString('en-GB')}`;p.append(caption);el('awards').append(p);}
 }
 el('pilotSearch').oninput=()=>{const term=el('pilotSearch').value.trim().toLowerCase(),selected=el('pilot').value;const matches=pilots.filter(p=>(p.pilot_id+' '+(p.nickname||'')).toLowerCase().includes(term));el('pilot').replaceChildren(option('','Choose a pilot…'),...matches.map(p=>option(p.id,`${p.pilot_id} · ${p.nickname||''}`)));if(matches.some(p=>p.id===selected))el('pilot').value=selected;};
 el('signOutButton').onclick=async()=>{await client.auth.signOut();location.href='/management/';};el('badge').onchange=preview;
 try{
  const {data}=await client.auth.getUser();if(!data.user){location.replace('/management/');return;}
  const managers=await checked(client.from('management_users').select('user_id').eq('user_id',data.user.id).eq('active',true));if(managers.length!==1)throw Error('Active management access required.');
  pilots=await checked(client.from('pilots').select('id,pilot_id,nickname').order('pilot_id'));el('pilot').replaceChildren(option('','Choose a pilot…'),...pilots.map(p=>option(p.id,`${p.pilot_id} · ${p.nickname||''}`)));
  await load();el('badgeApp').hidden=false;
 }catch(e){status.textContent=e.message;return;}
 el('awardForm').onsubmit=async e=>{e.preventDefault();const b=badges.find(b=>b.id===el('badge').value);if(!b)return;el('awardButton').disabled=true;try{await checked(client.from('pilot_event_awards').insert({pilot_id:el('pilot').value,badge_id:b.id,event_name:b.name,description:b.description}));await load();status.textContent='Badge awarded successfully.';}catch(e){status.textContent=e.code==='23505'?'This pilot already has that badge.':e.message;}finally{el('awardButton').disabled=false;}};
 el('catalogForm').onsubmit=async e=>{e.preventDefault();const url=el('badgeImage').value.trim();if(!safeImage(url)){status.textContent='Use artwork hosted in the website badge folder.';return;}try{await checked(client.from('special_badges').insert({name:el('badgeName').value.trim(),description:el('badgeDescription').value.trim(),image_url:url}));await load();el('catalogForm').reset();status.textContent='Special badge added.';}catch(e){status.textContent=e.message;}};
})();
