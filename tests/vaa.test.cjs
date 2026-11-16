const {test}=require("node:test");
const assert=require("node:assert/strict");
const VAA=require("../management/vaa-core.js");
const now=Date.parse("2026-10-20T12:00:00Z");
const pilots=new Map([["pilot",{pilot_id:"BMA0001",nickname:"Example"}]]);
const sample={id:"one",pilot_id:"pilot",flight_number:"BMA123",atc_callsign:"BMA123",departure:"EGBB",arrival:"EGLL",
    off_blocks:"2026-10-19T09:00:00Z",takeoff:"2026-10-19T09:10:00Z",landing:"2026-10-19T10:00:00Z",stand:"2026-10-19T10:10:00Z",
    created_at:"2026-10-19T10:11:00Z",status:"Submitted",requires_review:false,atc_provider:"VATSIM",
    vatsim_id:"1234567",vatsim_session_id:"session",vatsim_verified:true,vatsim_network_callsign:"BMA123",
    vatsim_participation_seconds:1200,vatsim_verification_status:"OFFLINE"};
const assess=rows=>VAA.assess(rows,pilots,now);

for (const change of [{flight_purpose:"MAC"}, {flight_number:"MAC"}, ...["G-WARB","G-JIMH","G-SHED","G-BLZH","G-NWFG","G-RGAH"].map(registration=>({registration}))]) {
    test("MAC excluded despite valid airline callsign: "+JSON.stringify(change),()=>{
        const row=assess([{...sample,...change}])[0];
        assert.equal(row.qualifies,false);
        assert.ok(row.reasons.some(reason=>reason.includes("Midland Aero Club")));
    });
}
test("completed server-observed report qualifies even after disconnect",()=>assert.equal(assess([sample])[0].qualifies,true));
for(const [label,change] of [
    ["typed CID only",{vatsim_verified:null}],["no duration",{vatsim_participation_seconds:0}],
    ["CID malformed",{vatsim_id:"abc"}],["other carrier",{vatsim_network_callsign:"EUC123"}],
    ["callsign mismatch",{atc_callsign:"BMR123"}],["offline",{atc_provider:"Offline"}],
    ["cancelled",{status:"Cancelled"}],["review outstanding",{requires_review:true}],
    ["incomplete",{stand:null}],["future",{stand:"2027-01-01T00:00:00Z"}],
    ["invalid order",{landing:"2026-10-19T08:00:00Z"}],["missing ICAO",{departure:"BHX"}],
    ["unlinked member",{pilot_id:"missing"}]]) {
    test(`excludes ${label}`,()=>assert.equal(assess([{...sample,...change}])[0].qualifies,false));
}
test("duplicate sessions do not inflate totals",()=>assert.equal(assess([sample,{...sample,id:"two"}]).filter(r=>r.qualifies).length,1));
test("duplicate flight with different session does not inflate totals",()=>assert.equal(assess([sample,{...sample,id:"two",vatsim_session_id:"other"}]).filter(r=>r.qualifies).length,1));
test("CID counted once across BMA and BMR",()=>{
    const b={...sample,id:"two",vatsim_session_id:"other",flight_number:"BMR12",atc_callsign:"BMR12",vatsim_network_callsign:"BMR12"};
    const w=VAA.period(assess([sample,b]),now);
    assert.equal(w.flights,2);assert.equal(w.pilots,1);assert.equal(w.bmr,1);
});
test("60-day boundary belongs to only one window",()=>{
    const rows=[{completed:now-60*VAA.DAY,qualifies:true,cid:"1",actual_callsign:"BMA1"}];
    assert.equal(VAA.period(rows,now).flights,1);assert.equal(VAA.period(rows,now,1).flights,0);
    assert.equal(VAA.period([{...rows[0],completed:now}],now).flights,0);
});
test("CSV contains evidence and prevents formula injection with RFC4180 quoting",()=>{
    const rows=assess([sample]);rows[0].nickname='=HYPERLINK("x"),\nTest';
    const csv=VAA.csv(VAA.period(rows,now),now);
    assert.ok(csv.startsWith("\ufeff"));
    assert.ok(csv.includes('"\'=HYPERLINK(""x""),\nTest"'));
    assert.ok(csv.includes('"1200"'));
    assert.ok(csv.includes('"OFFLINE"'));
    assert.ok(csv.includes('"window_start_inclusive_utc"'));
});
test("empty dataset produces zero counts and header-only export",()=>{
    const w=VAA.period([],now);assert.equal(w.flights,0);assert.equal(w.pilots,0);assert.equal(VAA.csv(w,now).split("\r\n").length,2);
});
const override = (id=1, decision='verified', change={}) => ({id,pirep_id:sample.id,decision,notes:'Evidence reviewed; exception accepted',evidence:'https://statsim.net/flights/detail/31390957',reviewer_name:'Test manager',resolution_snapshot:{kind:'management_override_v1',completed_at:sample.stand},...change});
for(const change of [{takeoff:'2026-10-19T08:00:00Z'},{stand:null},{stand:'2027-01-01T00:00:00Z'},{requires_review:true},{status:'Cancelled'},{departure:null},{pilot_id:'missing'},{flight_purpose:'MAC'},{vatsim_id:null},{atc_provider:'Offline'},{vatsim_network_callsign:'TEST12'}]) {
 test('evidence-backed management approval overrides '+JSON.stringify(change),()=>{
  const row=VAA.assess([{...sample,...change}],pilots,now,[override()])[0];
  assert.equal(row.qualifies,true);assert.equal(row.management_approved,true);assert.ok(row.automatic_reasons.length);
  assert.equal(row.completed,Date.parse(sample.stand));assert.equal(VAA.period([row],now).flights,1);
 });
}
test('management can review duplicate reports individually',()=>{
 const rows=VAA.assess([sample,{...sample,id:'two'}],pilots,now,[override(1,'verified',{pirep_id:'two'})]);
 assert.equal(rows[1].qualifies,true);assert.ok(rows[1].automatic_reasons.includes('Duplicate flight/session'));
});
test('latest decision wins; notes and inactive markers do not erase it',()=>{
 const reviews=[override(4,'note'),override(2,'rejected'),override(1),override(3,'inactive')];
 assert.equal(VAA.assess([sample],pilots,now,reviews)[0].qualifies,false);
 assert.equal(VAA.assess([sample],pilots,now,[...reviews,override(5)])[0].qualifies,true);
});
test('legacy verified flag or report JSON cannot grant a discrepancy override',()=>{
 const bad={...sample,stand:null,vatsim_verified:true,vatsim_verification_status:'manually_verified',legacy_review:{kind:'management_override_v1'},debrief_data:{management_approved:true}};
 assert.equal(VAA.assess([bad],pilots,now,[])[0].qualifies,false);
 assert.equal(VAA.assess([bad],pilots,now,[override(1,'verified',{resolution_snapshot:null})])[0].qualifies,false);
});
test('approval exports reviewer evidence original discrepancy and effective completion separately',()=>{
 const rows=VAA.assess([{...sample,stand:null}],pilots,now,[override()]);const csv=VAA.csv(VAA.period(rows,now),now);
 assert.ok(csv.includes('Test manager'));assert.ok(csv.includes('Invalid or incomplete flight timestamps'));assert.ok(csv.includes('31390957'));assert.ok(csv.includes('management_completed_utc'));
});
