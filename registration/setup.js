const token=location.hash.slice(1);
history.replaceState(null,'',location.pathname);
const form=document.getElementById('setup'),message=document.getElementById('message'),button=document.getElementById('submit');
if(!/^[A-Za-z0-9_-]{43}$/.test(token)){button.disabled=true;message.textContent='Open your private setup link from /registration-status in Discord.';}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!form.reportValidity()) return;
  button.disabled=true;message.textContent='Completing registration…';
  try {
    const response=await fetch('https://eqbaezhcwnjlcnvtfxho.supabase.co/functions/v1/bmv-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password:document.getElementById('password').value})});
    const result=await response.json();message.textContent=result.message;
    if(result.ok){form.reset();form.hidden=true;}
  }catch{message.textContent='Connection interrupted. Retry with the same password.';}
  finally{button.disabled=false;}
});


