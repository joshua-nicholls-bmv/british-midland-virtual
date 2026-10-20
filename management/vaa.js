"use strict";
const client=window.supabase.createClient("https://eqbaezhcwnjlcnvtfxho.supabase.co","sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW");
const el=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=value=>new Date(value).toISOString().replace("T"," ").slice(0,19)+" UTC";
let assessed=[],snapshot=0,selected=0,busy=false,ready=false,timer;
const fields="id,pilot_id,flight_number,atc_callsign,departure,arrival,off_blocks,takeoff,landing,stand,status,requires_review,created_at,atc_provider,vatsim_id,vatsim_session_id,vatsim_verified,vatsim_network_callsign,vatsim_participation_seconds,vatsim_verification_status";
async function pages(table,columns) {
    const output=[];
    for(let offset=0;;offset+=500) {
        const {data,error}=await client.from(table).select(columns).order("id").range(offset,offset+499);
        if(error) throw error;
        output.push(...data);
        if(data.length<500) return output;
    }
}
async function manager() {
    const {data,error}=await client.auth.getSession();
    if(error) throw error;
    if(!data.session) {location.replace("/management/");return null;}
    const result=await client.from("management_users").select("display_name,role").eq("user_id",data.session.user.id).eq("active",true).maybeSingle();
    if(result.error) throw result.error;
    if(!result.data){location.replace("/management/");return null;}
    return result.data;
}
function table(id,headers,rows) {
    el(id).innerHTML=`<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${headers.length}">No matching records in this window.</td></tr>`}</tbody></table>`;
}
function render() {
    const w=VAA.period(assessed,snapshot,selected);
    el("windowLabel").textContent=`${date(w.from)} inclusive → ${date(w.until)} exclusive`;
    el("flightCount").textContent=w.flights;
    el("pilotCount").textContent=w.pilots;
    el("flightProgress").value=Math.min(w.flights,50);
    el("pilotProgress").value=Math.min(w.pilots,10);
    el("bmaCount").textContent=w.bma;el("bmrCount").textContent=w.bmr;
    el("targetStatus").textContent=w.flights>=50&&w.pilots>=10?"Activity targets met — subject to VATSIM audit":"Activity targets not yet met";
    el("coverage").textContent=`${assessed.length} retained PIREPs checked. Historical periods reflect available records, not proof of complete coverage. ${assessed.filter(r=>!Number.isFinite(r.completed)).length} reports have no usable completion date.`;
    el("export").disabled=!ready||busy||!w.flights;
    table("contributions",["Pilot / nickname","CID","Flights","BMA","BMR","Observed online","Last completion"],
        VAA.contributions(w.qualifying).map(p=>[esc([...p.names].join("; ")),esc(p.cid),p.flights,p.bma,p.bmr,`${Math.floor(p.seconds/60)} min`,date(p.last)]));
    table("trends",["60-day window (UTC)","Flights / 50","Pilots / 10","BMA","BMR","Flight progress"],
        Array.from({length:6},(_,i)=>VAA.period(assessed,snapshot,i)).map(p=>[`${date(p.from).slice(0,10)} → ${date(p.until).slice(0,10)}`,p.flights,p.pilots,p.bma,p.bmr,`<progress max="50" value="${Math.min(p.flights,50)}" aria-label="${p.flights} of 50 flights"></progress>`]));
    renderEvidence();
}
function renderEvidence() {
    const w=VAA.period(assessed,snapshot,selected),filter=el("evidenceFilter").value;
    const search=el("search").value.trim().toLowerCase();
    const missing=assessed.filter(r=>!Number.isFinite(r.completed));
    let rows=(filter==="missing"?missing:w.included).filter(r=>filter!=="qualifying"||r.qualifies).filter(r=>filter!=="excluded"||!r.qualifies);
    rows=rows.filter(r=>[r.pilot_code,r.nickname,r.vatsim_id,r.flight_number,r.actual_callsign].join(" ").toLowerCase().includes(search)).sort((a,b)=>(b.completed||0)-(a.completed||0));
    el("evidenceCount").textContent=`${rows.length} records · CSV exports qualifying flights for the selected window only`;
    table("evidence",["PIREP","Pilot / CID","Network callsign","Route","Completed UTC","Evidence / decision"],
        rows.map(r=>[`<a href="report.html?id=${encodeURIComponent(r.id)}">${esc(r.flight_number||r.id)}</a>`,`${esc(r.pilot_code)} · ${esc(r.nickname)}<br>${esc(r.cid||"No valid CID")}`,esc(r.actual_callsign||"Not recorded"),`${esc(r.departure)} → ${esc(r.arrival)}`,Number.isFinite(r.completed)?date(r.completed):"Missing",`<span class="${r.qualifies?"vaa-good":"vaa-review"}">${r.qualifies?"Qualifying under dashboard rules":esc(r.reasons.join("; "))}</span><br>${Number(r.vatsim_participation_seconds)||0}s observed · Last check: ${esc(r.vatsim_verification_status||"Not recorded")}`]));
}
async function refresh() {
    if(busy)return;busy=true;ready=false;el("export").disabled=true;el("refresh").disabled=true;
    el("loadStatus").textContent="Refreshing flight evidence…";
    try {
        const user=await manager();if(!user)return;
        el("managementName").textContent=user.display_name;el("managementRole").textContent=user.role;
        const [reports,pilots]=await Promise.all([pages("pireps",fields),pages("pilots","id,pilot_id,nickname")]);
        snapshot=Date.now();assessed=VAA.assess(reports,new Map(pilots.map(p=>[p.id,p])),snapshot);
        ready=true;busy=false;render();el("loadStatus").textContent=`Updated ${date(snapshot)} · Auto-refresh every 60 seconds while visible`;
    } catch(error) {
        console.error("VAA load failed",error);
        el("loadStatus").textContent="Unable to refresh evidence. Any previous figures are stale; export is disabled. Retry or sign in again.";
    } finally {busy=false;el("refresh").disabled=false;}
}
el("refresh").addEventListener("click",refresh);
el("window").addEventListener("change",()=>{selected=Number(el("window").value);if(snapshot)render();});
el("search").addEventListener("input",()=>{if(snapshot)renderEvidence();});
el("evidenceFilter").addEventListener("change",()=>{if(snapshot)renderEvidence();});
el("export").addEventListener("click",()=>{
    if(!ready||busy)return;
    const w=VAA.period(assessed,snapshot,selected);
    const blob=new Blob([VAA.csv(w,Date.now())],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`BMG-VAA-${new Date(w.from).toISOString().slice(0,10)}-to-${new Date(w.until).toISOString().slice(0,10)}.csv`;
    a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
el("signOutButton").addEventListener("click",async()=>{await client.auth.signOut();location.replace("/management/");});
client.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"){clearInterval(timer);assessed=[];el("dashboardApp").classList.add("hidden");location.replace("/management/");}});
(async()=>{
    try {
        if(!await manager())return;
        el("authGate").classList.add("hidden");el("dashboardApp").classList.remove("hidden");
        await refresh();
        timer=setInterval(()=>{if(!document.hidden)refresh();},60000);
    } catch {el("authMessage").textContent="Cannot verify management access. Please return to sign in.";}
})();
