/* Shared, deterministic audit rules. No network or browser dependencies. */
(function (root) {
    "use strict";
    const DAY = 86400000;
    const clean = value => String(value ?? "").trim();
    const upper = value => clean(value).toUpperCase();
    const time = value => value ? Date.parse(value) : NaN;
    const cid = value => /^[1-9]\d{5,8}$/.test(clean(value)) ? clean(value) : "";
    const callsign = value => /^(BMA|BMR)[A-Z0-9]{1,7}$/.test(upper(value));
    function assess(rows, pilots, now) {
        const seenIds = new Set(), sessions = new Set(), flights = new Set();
        return [...rows].sort((a,b) => (time(a.created_at) || 0) - (time(b.created_at) || 0) || clean(a.id).localeCompare(clean(b.id))).map(row => {
            const reasons = [];
            const pilot = pilots.get(row.pilot_id);
            const completed = time(row.stand);
            const takeoff = time(row.takeoff), landing = time(row.landing), start = time(row.off_blocks);
            const actual = upper(row.vatsim_network_callsign);
            const planned = upper(row.atc_callsign || row.flight_number);
            if (!pilot) reasons.push("Pilot record unavailable");
            if (!cid(row.vatsim_id)) reasons.push("Missing or malformed CID");
            if (upper(row.atc_provider) !== "VATSIM") reasons.push("Not recorded as VATSIM");
            if (row.vatsim_verified !== true || !row.vatsim_session_id || !(Number(row.vatsim_participation_seconds) > 0)) reasons.push("No server-verified online duration");
            if (!callsign(actual)) reasons.push("Network callsign is not BMA/BMR");
            if (actual !== planned) reasons.push("Network/planned callsign mismatch");
            if (!/^[A-Z]{4}$/.test(upper(row.departure)) || !/^[A-Z]{4}$/.test(upper(row.arrival))) reasons.push("Missing ICAO route");
            if (!["SUBMITTED","COMPLETED","APPROVED","ACCEPTED"].includes(upper(row.status))) reasons.push("Flight status not eligible");
            if (row.requires_review) reasons.push("Management review outstanding");
            if (![start,takeoff,landing,completed].every(Number.isFinite) || !(start <= takeoff && takeoff < landing && landing <= completed && completed <= now)) reasons.push("Invalid or incomplete flight timestamps");
            const flightKey = `${row.pilot_id}|${start}|${planned}`;
            if (seenIds.has(row.id)) reasons.push("Duplicate PIREP");
            seenIds.add(row.id);
            if (!reasons.length) {
                if (sessions.has(row.vatsim_session_id) || flights.has(flightKey)) reasons.push("Duplicate flight/session");
                else { sessions.add(row.vatsim_session_id); flights.add(flightKey); }
            }
            return {...row, pilot_code: pilot?.pilot_id || "Unavailable", nickname: pilot?.nickname || "—",
                cid: cid(row.vatsim_id), actual_callsign: actual, completed, reasons, qualifies: !reasons.length};
        });
    }
    function period(rows, end, index = 0) {
        const until = end - index * 60 * DAY, from = until - 60 * DAY;
        // Half-open windows: no midnight or boundary double counting.
        const included = rows.filter(r => r.completed >= from && r.completed < until);
        const qualifying = included.filter(r => r.qualifies);
        return {from, until, included, qualifying, flights: qualifying.length,
            pilots: new Set(qualifying.map(r => r.cid)).size,
            bma: qualifying.filter(r=>r.actual_callsign.startsWith("BMA")).length,
            bmr: qualifying.filter(r=>r.actual_callsign.startsWith("BMR")).length};
    }
    function contributions(rows) {
        const grouped = new Map();
        for (const row of rows) {
            if (!grouped.has(row.cid)) grouped.set(row.cid,{cid:row.cid,names:new Set(),flights:0,bma:0,bmr:0,seconds:0,last:0});
            const entry=grouped.get(row.cid);
            entry.names.add(`${row.pilot_code} · ${row.nickname}`);entry.flights++;
            entry[row.actual_callsign.startsWith("BMA")?"bma":"bmr"]++;
            entry.seconds+=Number(row.vatsim_participation_seconds)||0;entry.last=Math.max(entry.last,row.completed);
        }
        return [...grouped.values()].sort((a,b)=>b.flights-a.flights||a.cid.localeCompare(b.cid));
    }
    function cell(value) {
        let text=String(value??"");
        if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text="'"+text;
        return '"'+text.replaceAll('"','""')+'"';
    }
    function csv(window, exportedAt) {
        const headers=["pirep_id","session_id","pilot_id","nickname","vatsim_cid","network_callsign","planned_callsign","departure_icao","arrival_icao","off_blocks_utc","takeoff_utc","landing_utc","completed_utc","pirep_status","last_verification_status","verified_seconds","evidence_basis","window_start_inclusive_utc","window_end_exclusive_utc","exported_utc","rules_version"];
        const rows=window.qualifying.map(r=>[r.id,r.vatsim_session_id,r.pilot_code,r.nickname,r.cid,r.actual_callsign,r.atc_callsign||r.flight_number,r.departure,r.arrival,r.off_blocks,r.takeoff,r.landing,r.stand,r.status,r.vatsim_verification_status,r.vatsim_participation_seconds,"BMAcars server observations; not full-flight coverage",new Date(window.from).toISOString(),new Date(window.until).toISOString(),new Date(exportedAt).toISOString(),"1"]);
        return "\ufeff"+[headers,...rows].map(r=>r.map(cell).join(",")).join("\r\n")+"\r\n";
    }
    const api={DAY,assess,period,contributions,csv};
    if (typeof module!=="undefined"&&module.exports) module.exports=api;
    else root.VAA=api;
})(typeof globalThis!=="undefined"?globalThis:this);
